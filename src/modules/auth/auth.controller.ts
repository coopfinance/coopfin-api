import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { VerifyDto } from "./dto/verify.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("nonce")
  @ApiOperation({ summary: "Get a nonce to sign with a Stellar private key" })
  @ApiQuery({ name: "address", required: true, description: "Stellar public key (G...)" })
  getNonce(@Query("address") address: string) {
    return this.authService.getNonce(address);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify signed nonce and receive a JWT" })
  verify(@Body() dto: VerifyDto) {
    return this.authService.verify(dto.address, dto.signedNonce);
  }
}