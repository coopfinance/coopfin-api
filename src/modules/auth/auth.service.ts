import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Keypair } from "@stellar/stellar-sdk";
import * as crypto from "crypto";

interface NonceEntry {
  nonce: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly nonces = new Map<string, NonceEntry>();
  private readonly NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private jwtService: JwtService) {}

  /** Generate and store a random nonce for the given Stellar address. */
  generateNonce(address: string): { nonce: string } {
    const nonce = `CoopFinance authentication request\nAddress: ${address}\nNonce: ${crypto.randomBytes(16).toString("hex")}`;
    this.nonces.set(address, { nonce, expiresAt: Date.now() + this.NONCE_TTL_MS });
    return { nonce };
  }

  /** Verify a signed nonce against the stored nonce for the address, then issue a JWT. */
  verifySignature(address: string, signedNonce: string): { accessToken: string } {
    const entry = this.nonces.get(address);
    if (!entry) {
      throw new UnauthorizedException("No nonce found for this address. Request a new one.");
    }

    if (Date.now() > entry.expiresAt) {
      this.nonces.delete(address);
      throw new UnauthorizedException("Nonce expired. Request a new one.");
    }

    let isValid = false;
    try {
      const keypair = Keypair.fromPublicKey(address);
      const signatureBuffer = Buffer.from(signedNonce, "base64");
      isValid = keypair.verify(Buffer.from(entry.nonce), signatureBuffer);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedException("Invalid signature");
    }

    // Nonce is single-use
    this.nonces.delete(address);

    const accessToken = this.jwtService.sign({ sub: address, address });
    return { accessToken };
  }
}
