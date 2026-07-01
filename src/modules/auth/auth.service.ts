import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { StrKey, Keypair } from "@stellar/stellar-sdk";
import * as crypto from "crypto";

interface NonceEntry {
  nonce: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  /** In-memory nonce store: stellarAddress → nonce entry */
  private readonly nonces = new Map<string, NonceEntry>();

  private readonly NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly jwtService: JwtService) {
    // Periodic cleanup of expired nonces every 60s
    setInterval(() => this.pruneExpiredNonces(), 60_000);
  }

  // ── Nonce generation ──────────────────────────────────────────

  /** Generate a fresh nonce for a Stellar address. */
  generateNonce(stellarAddress: string): string {
    this.validateStellarAddress(stellarAddress);
    const nonce = crypto.randomBytes(32).toString("hex");
    this.nonces.set(stellarAddress, {
      nonce,
      expiresAt: Date.now() + this.NONCE_TTL_MS,
    });
    return nonce;
  }

  // ── Signature verification ────────────────────────────────────

  /**
   * Verify that the given signature was produced by the Stellar account
   * `stellarAddress` over `nonce` using ed25519.
   *
   * Returns `true` if the signature is valid and the nonce is still
   * within its TTL.
   */
  verifySignature(stellarAddress: string, nonce: string, signature: string): void {
    this.validateStellarAddress(stellarAddress);

    const entry = this.nonces.get(stellarAddress);
    if (!entry) {
      throw new UnauthorizedException("No pending nonce for this address");
    }
    if (entry.nonce !== nonce) {
      throw new UnauthorizedException("Nonce mismatch");
    }
    if (Date.now() > entry.expiresAt) {
      this.nonces.delete(stellarAddress);
      throw new UnauthorizedException("Nonce expired – please request a new one");
    }

    // Remove nonce so it cannot be reused (one-time use)
    this.nonces.delete(stellarAddress);

    // Decode the Stellar public key to raw 32-byte ed25519 key
    const rawPubKey = StrKey.decodeEd25519PublicKey(stellarAddress);
    const signatureBytes = Buffer.from(signature, "base64");

    const valid = Keypair.fromPublicKey(stellarAddress).verify(
      Buffer.from(nonce, "utf8"),
      signatureBytes,
    );

    if (!valid) {
      throw new UnauthorizedException("Invalid Stellar signature");
    }
  }

  // ── JWT issuance ─────────────────────────────────────────────

  /** Issue a JWT containing the Stellar address as `sub`. */
  issueToken(stellarAddress: string): { access_token: string } {
    const payload = { sub: stellarAddress };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  // ── Helpers ──────────────────────────────────────────────────

  private validateStellarAddress(address: string): void {
    try {
      StrKey.decodeEd25519PublicKey(address);
    } catch {
      throw new UnauthorizedException("Invalid Stellar address");
    }
  }

  private pruneExpiredNonces(): void {
    const now = Date.now();
    for (const [addr, entry] of this.nonces) {
      if (now > entry.expiresAt) this.nonces.delete(addr);
    }
  }
}
