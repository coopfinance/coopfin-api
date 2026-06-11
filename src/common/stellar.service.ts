import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  SorobanRpc,
  Networks,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
  Address,
  xdr,
} from "@stellar/stellar-sdk";

@Injectable()
export class StellarService {
  private readonly logger = new Logger(StellarService.name);
  private readonly server: SorobanRpc.Server;
  private readonly networkPassphrase: string;

  constructor(private config: ConfigService) {
    const rpcUrl = config.get("SOROBAN_RPC_URL", "https://soroban-testnet.stellar.org");
    const network = config.get("STELLAR_NETWORK", "testnet");
    this.server = new SorobanRpc.Server(rpcUrl);
    this.networkPassphrase = network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
  }

  /** Read contract data via simulation (no signing needed). */
  async readContract(
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    sourceAccount: string
  ): Promise<unknown> {
    try {
      const account = await this.server.getAccount(sourceAccount);
      const contract = new Contract(contractId);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      const result = await this.server.simulateTransaction(tx);
      if (SorobanRpc.Api.isSimulationError(result)) {
        throw new Error(`Simulation error: ${result.error}`);
      }
      if (!result.result) return null;
      return scValToNative(result.result.retval);
    } catch (err) {
      this.logger.error(`readContract failed: ${contractId}.${method}`, err);
      throw err;
    }
  }

  /** Fetch native token balance for an account. */
  async getBalance(address: string, assetContractId?: string): Promise<string> {
    try {
      if (!assetContractId) {
        const account = await this.server.getAccount(address);
        return account.balances
          .find((b) => b.asset_type === "native")
          ?.balance ?? "0";
      }
      // USDC or other token contract balance
      const result = await this.readContract(
        assetContractId,
        "balance",
        [new Address(address).toScVal()],
        address
      );
      return String(result ?? 0);
    } catch {
      return "0";
    }
  }

  /** Subscribe to contract events via Horizon streaming. */
  subscribeToContractEvents(
    contractId: string,
    onEvent: (event: unknown) => void
  ): () => void {
    this.logger.log(`Subscribing to events for contract ${contractId}`);
    // Use Horizon event streaming in a real implementation
    // For now returns a no-op unsubscribe
    return () => {};
  }
}
