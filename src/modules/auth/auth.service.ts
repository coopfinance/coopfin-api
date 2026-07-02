import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Keypair } from "@stellar/stellar-sdk";
import { randomUUID } from "crypto";

interface StoredNonce {
  nonce: string;
  expiresAt: number;
}

export interface AuthToken {
  accessToken: string;
}

@Injectable()
export class AuthService {
  private readonly nonces = new Map<string, StoredNonce>();
  private readonly nonceTtlMs = 5 * 60 * 1000;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  issueNonce(address: string): { nonce: string; expiresAt: string } {
    const normalizedAddress = this.normalizeAddress(address);
    this.assertValidAddress(normalizedAddress);

    const nonce = `coopfinance:${normalizedAddress}:${Date.now()}:${randomUUID()}`;
    const expiresAt = Date.now() + this.nonceTtlMs;
    this.nonces.set(normalizedAddress, { nonce, expiresAt });
    this.cleanupExpiredNonces();

    return { nonce, expiresAt: new Date(expiresAt).toISOString() };
  }

  verifyNonce(address: string, signedNonce: string): AuthToken {
    const normalizedAddress = this.normalizeAddress(address);
    this.assertValidAddress(normalizedAddress);

    const stored = this.nonces.get(normalizedAddress);
    if (!stored) {
      throw new UnauthorizedException("Nonce not found or already used");
    }
    if (Date.now() > stored.expiresAt) {
      this.nonces.delete(normalizedAddress);
      throw new UnauthorizedException("Nonce expired");
    }

    const signature = this.decodeSignature(signedNonce);
    const isValid = Keypair.fromPublicKey(normalizedAddress).verify(
      Buffer.from(stored.nonce, "utf8"),
      signature,
    );
    if (!isValid) {
      throw new UnauthorizedException("Invalid Stellar signature");
    }

    this.nonces.delete(normalizedAddress);
    return {
      accessToken: this.jwtService.sign({
        sub: normalizedAddress,
        address: normalizedAddress,
      }),
    };
  }

  private normalizeAddress(address: string): string {
    return String(address ?? "").trim();
  }

  private assertValidAddress(address: string): void {
    try {
      Keypair.fromPublicKey(address);
    } catch {
      throw new BadRequestException("address must be a valid Stellar public key");
    }
  }

  private decodeSignature(signedNonce: string): Buffer {
    const value = String(signedNonce ?? "").trim();
    if (!value) {
      throw new BadRequestException("signedNonce is required");
    }

    const withoutHexPrefix = value.startsWith("0x") ? value.slice(2) : value;
    if (/^[0-9a-fA-F]+$/.test(withoutHexPrefix) && withoutHexPrefix.length % 2 === 0) {
      return Buffer.from(withoutHexPrefix, "hex");
    }
    return Buffer.from(value, "base64");
  }

  private cleanupExpiredNonces(): void {
    const now = Date.now();
    for (const [address, nonce] of this.nonces) {
      if (nonce.expiresAt <= now) {
        this.nonces.delete(address);
      }
    }
  }
}
