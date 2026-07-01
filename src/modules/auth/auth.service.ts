import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Keypair } from "@stellar/stellar-sdk";
import { randomBytes } from "crypto";

type NonceEntry = {
  nonce: string;
  expiresAt: number;
};

@Injectable()
export class AuthService {
  private readonly nonces = new Map<string, NonceEntry>();
  private readonly ttlMs = 5 * 60 * 1000;

  constructor(private readonly jwtService: JwtService) {}

  getNonce(address: string): { nonce: string } {
    this.assertValidAddress(address);
    const nonce = randomBytes(32).toString("hex");
    this.nonces.set(address, { nonce, expiresAt: Date.now() + this.ttlMs });
    return { nonce };
  }

  verify(address: string, signedNonce: string): { accessToken: string } {
    this.assertValidAddress(address);

    const entry = this.nonces.get(address);
    if (!entry || Date.now() > entry.expiresAt) {
      throw new UnauthorizedException("Nonce expired or not found");
    }

    let signature: Buffer;
    try {
      signature = Buffer.from(signedNonce, "base64");
    } catch {
      throw new BadRequestException("Invalid signedNonce encoding");
    }

    const keypair = Keypair.fromPublicKey(address);
    const message = Buffer.from(entry.nonce);
    if (!keypair.verify(message, signature)) {
      throw new UnauthorizedException("Invalid signature");
    }

    this.nonces.delete(address);
    return { accessToken: this.jwtService.sign({ sub: address }) };
  }

  private assertValidAddress(address: string): void {
    try {
      Keypair.fromPublicKey(address);
    } catch {
      throw new BadRequestException("Invalid Stellar address");
    }
  }
}