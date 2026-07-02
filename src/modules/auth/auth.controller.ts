import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

export interface VerifyNonceDto {
  address: string;
  signedNonce: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("nonce")
  @ApiOperation({ summary: "Issue a short-lived nonce for Stellar signature auth" })
  nonce(@Query("address") address: string) {
    return this.authService.issueNonce(address);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify a signed Stellar nonce and issue a JWT" })
  verify(@Body() dto: VerifyNonceDto) {
    return this.authService.verifyNonce(dto.address, dto.signedNonce);
  }
}
