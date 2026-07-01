import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("nonce")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get a nonce for Stellar signature" })
  @ApiQuery({ name: "address", type: String, required: true })
  async getNonce(@Query("address") address: string) {
    return this.authService.generateNonce(address);
  }

  @Post("verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify Stellar signature and receive JWT" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        address: { type: "string" },
        signedNonce: { type: "string" },
      },
    },
  })
  async verify(@Body() body: { address: string; signedNonce: string }) {
    return this.authService.verifySignature(body.address, body.signedNonce);
  }
}
