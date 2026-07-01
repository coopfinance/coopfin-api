import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Keypair } from "@stellar/stellar-sdk";

const NONCE_STORE = new Map<string, { nonce: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private jwtService: JwtService) {}

  async generateNonce(address: string) {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000;
    NONCE_STORE.set(address.toLowerCase(), { nonce, expiresAt });
    return { nonce };
  }

  async verifySignature(address: string, signedNonce: string) {
    const stored = NONCE_STORE.get(address.toLowerCase());
    if (!stored) throw new Error("Nonce not found or expired");

    if (Date.now() > stored.expiresAt) {
      NONCE_STORE.delete(address.toLowerCase());
      throw new Error("Nonce expired");
    }

    let signatureBuffer: Buffer;
    try {
      signatureBuffer = Buffer.from(signedNonce, "base64");
    } catch {
      signatureBuffer = Buffer.from(signedNonce, "hex");
    }

    const keypair = Keypair.fromPublicKey(address);
    const valid = keypair.verify(Buffer.from(stored.nonce), signatureBuffer);
    if (!valid) throw new Error("Invalid signature");

    NONCE_STORE.delete(address.toLowerCase());

    const token = this.jwtService.sign({ address: address.toLowerCase() });
    return { access_token: token };
  }
}
