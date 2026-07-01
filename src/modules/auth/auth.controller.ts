import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { NonceDto, LoginDto } from "./dto/auth.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("nonce")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request a one-time nonce for a Stellar address" })
  @ApiResponse({ status: 200, description: "Nonce returned successfully" })
  @ApiResponse({ status: 401, description: "Invalid Stellar address" })
  nonce(@Body() dto: NonceDto) {
    const nonce = this.authService.generateNonce(dto.stellarAddress);
    return { nonce };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Authenticate with Stellar signature and receive a JWT",
    description:
      "Client must sign the nonce (obtained from POST /auth/nonce) with their " +
      "Stellar ed25519 private key and send the base64-encoded signature here.",
  })
  @ApiResponse({ status: 200, description: "JWT access token returned" })
  @ApiResponse({ status: 401, description: "Invalid signature or expired nonce" })
  login(@Body() dto: LoginDto) {
    this.authService.verifySignature(dto.stellarAddress, dto.nonce, dto.signature);
    return this.authService.issueToken(dto.stellarAddress);
  }
}
