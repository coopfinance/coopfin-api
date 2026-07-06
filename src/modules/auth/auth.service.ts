import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes } from "crypto";
import { Keypair } from "@stellar/stellar-sdk";

interface StoredNonce {
  nonce: string;
  expiresAt: number;
}

export interface JwtPayload {
  sub: string;
  address: string;
}

@Injectable()
export class AuthService {
  private readonly nonces = new Map<string, StoredNonce>();
  private readonly ttlMs = 5 * 60 * 1000;

  constructor(private readonly jwtService: JwtService) {}

  issueNonce(address: string) {
    this.assertAddress(address);

    const nonce = randomBytes(24).toString("hex");
    this.nonces.set(address, {
      nonce,
      expiresAt: Date.now() + this.ttlMs,
    });

    return { address, nonce, expiresInSeconds: this.ttlMs / 1000 };
  }

  verify(address: string, signedNonce: string) {
    this.assertAddress(address);

    const stored = this.nonces.get(address);
    if (!stored || stored.expiresAt < Date.now()) {
      this.nonces.delete(address);
      throw new UnauthorizedException("Nonce is missing or expired");
    }

    const signature = this.decodeSignature(signedNonce);
    const keypair = Keypair.fromPublicKey(address);
    const valid = keypair.verify(Buffer.from(stored.nonce), signature);

    if (!valid) {
      throw new UnauthorizedException("Invalid nonce signature");
    }

    this.nonces.delete(address);

    const payload: JwtPayload = { sub: address, address };
    return { accessToken: this.jwtService.sign(payload), address };
  }

  private assertAddress(address?: string) {
    if (!address) {
      throw new BadRequestException("address is required");
    }

    try {
      Keypair.fromPublicKey(address);
    } catch {
      throw new BadRequestException("address must be a valid Stellar public key");
    }
  }

  private decodeSignature(signedNonce: string) {
    if (!signedNonce) {
      throw new BadRequestException("signedNonce is required");
    }

    try {
      return Buffer.from(signedNonce, "base64");
    } catch {
      throw new BadRequestException("signedNonce must be a base64 signature");
    }
  }
}
