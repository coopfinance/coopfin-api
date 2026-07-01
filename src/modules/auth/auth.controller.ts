import { Controller, Get, Post, Body, Query, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

class VerifyDto {
  address: string;
  signedNonce: string;
}

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('nonce')
  @ApiOperation({ summary: 'Get a random nonce for signing' })
  getNonce(@Query('address') address: string) {
    if (!address) {
      throw new BadRequestException('Address is required');
    }
    const nonce = this.authService.generateNonce(address);
    return { nonce };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify signature and issue JWT' })
  verify(@Body() body: VerifyDto) {
    if (!body.address || !body.signedNonce) {
      throw new BadRequestException('Address and signedNonce are required');
    }
    return this.authService.verifySignature(body.address, body.signedNonce);
  }
}
