import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma.service";

/**
 * Polls Stellar Horizon for contract events and syncs them to the database.
 * This bridges on-chain state with the off-chain PostgreSQL store.
 */
@Injectable()
export class StellarIndexerService {
  private readonly logger = new Logger(StellarIndexerService.name);
  private readonly horizonUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.horizonUrl = config.get("HORIZON_URL", "https://horizon-testnet.stellar.org");
  }

  /** Poll for contribution events every 30 seconds */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async syncContributions() {
    this.logger.debug("Syncing contributions from Stellar...");
    try {
      const groups = await this.prisma.group.findMany({
        where: { treasuryContractId: { not: null } },
        select: { id: true, treasuryContractId: true },
      });

      for (const group of groups) {
        if (!group.treasuryContractId) continue;
        await this.fetchAndStoreEvents(group.id, group.treasuryContractId, "contribution");
      }
    } catch (err) {
      this.logger.error("Contribution sync failed", err);
    }
  }

  /** Poll for loan events every minute */
  @Cron(CronExpression.EVERY_MINUTE)
  async syncLoanEvents() {
    this.logger.debug("Syncing loan events from Stellar...");
    try {
      const groups = await this.prisma.group.findMany({
        where: { loanContractId: { not: null } },
        select: { id: true, loanContractId: true },
      });

      for (const group of groups) {
        if (!group.loanContractId) continue;
        await this.fetchAndStoreEvents(group.id, group.loanContractId, "loan");
      }
    } catch (err) {
      this.logger.error("Loan sync failed", err);
    }
  }

  private async fetchAndStoreEvents(
    groupId: string,
    contractId: string,
    eventType: string,
  ) {
    const url = `${this.horizonUrl}/contracts/${contractId}/events?limit=50&order=desc`;
    const res = await fetch(url);
    if (!res.ok) return;

    const { _embedded: { records } } = await res.json() as {
      _embedded: { records: Array<{ id: string; type: string; in_successful_contract_call: boolean }> }
    };

    this.logger.debug(`Found ${records.length} ${eventType} events for contract ${contractId}`);
    // TODO: Parse and upsert into contributions / loans tables
    // This is where you'd decode the XDR event payloads from Soroban
  }
}
