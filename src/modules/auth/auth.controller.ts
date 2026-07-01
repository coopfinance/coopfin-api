import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { NonceDto, VerifyDto, NonceResponseDto, TokenResponseDto } from "./dto/auth.dto";
import { Public } from "../../common/guards/public.decorator";

@ApiTags("auth")
@Public()
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("nonce")
  @ApiOperation({ summary: "Get a nonce to sign with your Stellar keypair" })
  @ApiQuery({
    name: "address",
    type: String,
    example: "G...",
    description: "Stellar public address",
  })
  getNonce(@Query() query: NonceDto): NonceResponseDto {
    return this.authService.generateNonce(query.address);
  }

  @Post("verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify signed nonce and receive JWT" })
  verify(@Body() dto: VerifyDto): TokenResponseDto {
    const accessToken = this.authService.verifySignature(dto.address, dto.signedNonce);
    return { accessToken, address: dto.address };
  }
}
