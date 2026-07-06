import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("nonce")
  @ApiOperation({ summary: "Create a nonce for Stellar wallet authentication" })
  @ApiQuery({ name: "address", required: true })
  nonce(@Query("address") address: string) {
    return this.authService.issueNonce(address);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify a signed nonce and issue a JWT" })
  @ApiBody({
    schema: {
      properties: {
        address: { type: "string" },
        signedNonce: { type: "string", description: "Base64-encoded Stellar signature" },
      },
      required: ["address", "signedNonce"],
    },
  })
  verify(@Body("address") address: string, @Body("signedNonce") signedNonce: string) {
    return this.authService.verify(address, signedNonce);
  }
}
