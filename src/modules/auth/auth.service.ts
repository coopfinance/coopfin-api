import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Keypair } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private nonceMap = new Map<string, { nonce: string; expiresAt: number }>();

  constructor(private jwtService: JwtService) {}

  generateNonce(address: string): string {
    const nonce = crypto.randomBytes(32).toString('hex');
    // 5 minutes TTL
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.nonceMap.set(address, { nonce, expiresAt });
    return nonce;
  }

  verifySignature(address: string, signedNonce: string): { accessToken: string } {
    const stored = this.nonceMap.get(address);
    if (!stored) {
      throw new UnauthorizedException('Nonce not found or expired');
    }
    
    if (Date.now() > stored.expiresAt) {
      this.nonceMap.delete(address);
      throw new UnauthorizedException('Nonce expired');
    }

    try {
      const keypair = Keypair.fromPublicKey(address);
      const isValid = keypair.verify(Buffer.from(stored.nonce), Buffer.from(signedNonce, 'base64'));
      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (e) {
      throw new UnauthorizedException('Invalid signature or address');
    }

    this.nonceMap.delete(address);

    const payload = { sub: address, address };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
