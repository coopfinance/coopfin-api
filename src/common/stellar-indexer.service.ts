import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { xdr, scValToNative, Address } from '@stellar/stellar-sdk';
import axios from 'axios';

@Injectable()
export class StellarIndexerService {
  private readonly logger = new Logger(StellarIndexerService.name);
  private lastSyncedLedger: Map<string, number> = new Map();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async fetchAndStoreEvents(contractId: string, eventType: string) {
    try {
      const horizonUrl = this.configService.get('HORIZON_URL');
      const lastLedger = this.lastSyncedLedger.get(contractId) || 0;

      // 1. Obtener eventos de Horizon
      const response = await axios.get(
        `${horizonUrl}/contracts/${contractId}/events`,
        {
          params: {
            'filter[type]': eventType,
            'order': 'asc',
            'cursor': `now-${lastLedger}`,
          },
        },
      );

      const records = response.data._embedded.records;
      if (!records || records.length === 0) {
        this.logger.debug(`No new ${eventType} events for contract ${contractId}`);
        return;
      }

      this.logger.debug(`Found ${records.length} ${eventType} events for contract ${contractId}`);

      // 2. Procesar eventos
      for (const record of records) {
        try {
          await this.processEvent(contractId, record);
        } catch (error) {
          this.logger.error(`Failed to process event: ${error.message}`, error.stack);
        }
      }

      // 3. Actualizar último ledger sincronizado
      const lastLedgerInBatch = records[records.length - 1].ledger;
      this.lastSyncedLedger.set(contractId, lastLedgerInBatch);

    } catch (error) {
      this.logger.error(`Error fetching events: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async processEvent(contractId: string, record: any) {
    // Decodificar payload XDR
    let decodedPayload: any;
    try {
      const xdrData = record.value.xdr;
      const scVal = xdr.ScVal.fromXDR(xdrData, 'base64');
      decodedPayload = scValToNative(scVal);
    } catch (error) {
      this.logger.error(`Failed to decode XDR: ${error.message}`);
      return;
    }

    this.logger.debug(`Decoded payload: ${JSON.stringify(decodedPayload)}`);

    // Determinar tipo de evento por topics
    const eventType = record.topic || 'unknown';

    switch (eventType) {
      case 'contribution':
        await this.handleContributionEvent(contractId, record, decodedPayload);
        break;
      case 'loan_requested':
        await this.handleLoanRequestedEvent(contractId, record, decodedPayload);
        break;
      case 'loan_approved':
        await this.handleLoanApprovedEvent(contractId, record, decodedPayload);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventType}`);
    }
  }

  private async handleContributionEvent(
    contractId: string,
    record: any,
    payload: any,
  ) {
    try {
      // Asumiendo payload: [memberAddress, amount, period]
      const [memberAddress, amount, period] = payload;

      await this.prisma.contribution.upsert({
        where: {
          txHash: record.transaction_hash,
        },
        create: {
          groupId: contractId,
          memberAddress: memberAddress.toString(),
          amount: amount.toString(),
          period: period,
          txHash: record.transaction_hash,
          ledger: record.ledger,
        },
        update: {},
      });

      this.logger.debug(`Contribution event processed for ${memberAddress}`);
    } catch (error) {
      this.logger.error(`Error handling contribution: ${error.message}`);
    }
  }

  private async handleLoanRequestedEvent(
    contractId: string,
    record: any,
    payload: any,
  ) {
    try {
      // Asumiendo payload: [loanId, borrowerAddress, amount]
      const [loanId, borrowerAddress, amount] = payload;

      await this.prisma.loan.upsert({
        where: {
          id: loanId,
        },
        create: {
          id: loanId,
          groupId: contractId,
          borrowerAddress: borrowerAddress.toString(),
          amount: amount.toString(),
          status: 'Pending',
          requestedAt: new Date(record.ledger_close_time),
        },
        update: {},
      });

      this.logger.debug(`Loan requested event processed for ${loanId}`);
    } catch (error) {
      this.logger.error(`Error handling loan_requested: ${error.message}`);
    }
  }

  private async handleLoanApprovedEvent(
    contractId: string,
    record: any,
    payload: any,
  ) {
    try {
      // Asumiendo payload: [loanId, borrowerAddress, amount]
      const [loanId, borrowerAddress, amount] = payload;

      await this.prisma.loan.update({
        where: {
          id: loanId,
        },
        data: {
          status: 'Approved',
          approvedAt: new Date(record.ledger_close_time),
          amount: amount.toString(),
        },
      });

      this.logger.debug(`Loan approved event processed for ${loanId}`);
    } catch (error) {
      this.logger.error(`Error handling loan_approved: ${error.message}`);
    }
  }
}
