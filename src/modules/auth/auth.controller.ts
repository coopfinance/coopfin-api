import { Controller, Get, Post, Body, Query, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("nonce")
  @ApiOperation({ summary: "Get a nonce to sign with your Stellar keypair" })
  getNonce(@Query("address") address: string) {
    if (!address) {
      throw new BadRequestException("address query param is required");
    }
    return this.authService.generateNonce(address);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify a signed nonce and receive a JWT" })
  verify(@Body("address") address: string, @Body("signedNonce") signedNonce: string) {
    if (!address || !signedNonce) {
      throw new BadRequestException("address and signedNonce are required");
    }
    return this.authService.verifySignature(address, signedNonce);
  }
}
