import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Keypair } from "@stellar/stellar-sdk";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const keypair = Keypair.random();
  const address = keypair.publicKey();
  let authService: AuthService;
  let jwtService: JwtService;
  let mockSign: jest.Mock;

  beforeEach(() => {
    mockSign = jest.fn().mockReturnValue("test-jwt-token");
    jwtService = { sign: mockSign } as unknown as JwtService;
    authService = new AuthService(jwtService);
  });

  it("generates a nonce for a valid Stellar address", () => {
    const result = authService.getNonce(address);
    expect(result.nonce).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects invalid Stellar addresses", () => {
    expect(() => authService.getNonce("not-a-stellar-address")).toThrow(BadRequestException);
  });

  it("issues a JWT when the nonce signature is valid", () => {
    const { nonce } = authService.getNonce(address);
    const signature = keypair.sign(Buffer.from(nonce)).toString("base64");

    const result = authService.verify(address, signature);

    expect(result.accessToken).toBe("test-jwt-token");
    expect(mockSign).toHaveBeenCalledWith({ sub: address });
  });

  it("rejects an invalid signature", () => {
    const { nonce } = authService.getNonce(address);
    const other = Keypair.random();
    const badSignature = other.sign(Buffer.from(nonce)).toString("base64");

    expect(() => authService.verify(address, badSignature)).toThrow(UnauthorizedException);
  });

  it("rejects reuse of the same nonce", () => {
    const { nonce } = authService.getNonce(address);
    const signature = keypair.sign(Buffer.from(nonce)).toString("base64");

    authService.verify(address, signature);
    expect(() => authService.verify(address, signature)).toThrow(UnauthorizedException);
  });
});