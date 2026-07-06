import { JwtService } from "@nestjs/jwt";
import { Keypair } from "@stellar/stellar-sdk";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const jwtService = new JwtService({ secret: "test-secret" });

  it("issues a JWT after verifying a signed nonce", () => {
    const keypair = Keypair.random();
    const service = new AuthService(jwtService);
    const { nonce } = service.issueNonce(keypair.publicKey());
    const signedNonce = keypair.sign(Buffer.from(nonce)).toString("base64");

    const result = service.verify(keypair.publicKey(), signedNonce);

    expect(result.address).toBe(keypair.publicKey());
    expect(jwtService.verify(result.accessToken).address).toBe(keypair.publicKey());
  });

  it("rejects a signature from a different Stellar keypair", () => {
    const owner = Keypair.random();
    const attacker = Keypair.random();
    const service = new AuthService(jwtService);
    const { nonce } = service.issueNonce(owner.publicKey());
    const signedNonce = attacker.sign(Buffer.from(nonce)).toString("base64");

    expect(() => service.verify(owner.publicKey(), signedNonce)).toThrow("Invalid nonce signature");
  });
});
