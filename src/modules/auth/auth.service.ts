import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Keypair } from "@stellar/stellar-sdk";

interface NonceEntry {
  nonce: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** In-memory nonce store — TTL 5 min, cleared on verify */
  private readonly nonces = new Map<string, NonceEntry>();
  private readonly NONCE_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Generate a random nonce for a Stellar address.
   * Stores it in memory with a 5-minute TTL.
   */
  generateNonce(address: string): { nonce: string; expiresAt: string } {
    const cleanAddress = address.trim();

    // Basic Stellar address validation
    if (!cleanAddress.startsWith("G") || cleanAddress.length !== 56) {
      throw new UnauthorizedException("Invalid Stellar address");
    }

    // Generate random nonce
    const nonce = `coopfin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${cleanAddress.slice(0, 8)}`;
    const expiresAt = new Date(Date.now() + this.NONCE_TTL_MS);
    this.nonces.set(cleanAddress, { nonce, expiresAt });

    this.logger.log(`Nonce generated for ${cleanAddress.slice(0, 8)}...`);
    return { nonce, expiresAt: expiresAt.toISOString() };
  }

  /**
   * Verify a Stellar-signed nonce.
   * Uses @stellar/stellar-sdk Keypair to verify the signature.
   */
  verifySignature(address: string, signedNonce: string): string {
    const cleanAddress = address.trim();
    const entry = this.nonces.get(cleanAddress);

    if (!entry) {
      throw new UnauthorizedException("No nonce found — request a new one");
    }

    if (Date.now() > entry.expiresAt.getTime()) {
      this.nonces.delete(cleanAddress);
      throw new UnauthorizedException("Nonce expired — request a new one");
    }

    try {
      // Verify the Stellar signature
      const keypair = Keypair.fromPublicKey(cleanAddress);
      const signature = Buffer.from(signedNonce, "base64");
      const isValid = keypair.verify(Buffer.from(entry.nonce), signature);

      if (!isValid) {
        this.nonces.delete(cleanAddress);
        throw new UnauthorizedException("Invalid signature");
      }

      // Nonce consumed — remove from store
      this.nonces.delete(cleanAddress);

      // Issue JWT
      const payload = { sub: cleanAddress, address: cleanAddress };
      const accessToken = this.jwtService.sign(payload);

      this.logger.log(`Authentication successful for ${cleanAddress.slice(0, 8)}...`);
      return accessToken;
    } catch (error) {
      this.nonces.delete(cleanAddress);
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Signature verification failed");
    }
  }

  /** Clean up expired nonces periodically */
  cleanupExpiredNonces(): void {
    const now = Date.now();
    for (const [address, entry] of this.nonces.entries()) {
      if (now > entry.expiresAt.getTime()) {
        this.nonces.delete(address);
      }
    }
  }
}
