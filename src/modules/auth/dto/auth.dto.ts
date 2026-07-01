import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class NonceDto {
  @ApiProperty({
    example: "G...",
    description: "Stellar public address starting with G",
  })
  @IsString()
  @IsNotEmpty()
  address!: string;
}

export class VerifyDto {
  @ApiProperty({
    example: "G...",
    description: "Stellar public address starting with G",
  })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({
    example: "...",
    description: "The signed nonce (base64-encoded signature bytes)",
  })
  @IsString()
  @IsNotEmpty()
  signedNonce!: string;
}

export class NonceResponseDto {
  @ApiProperty()
  nonce!: string;

  @ApiProperty()
  expiresAt!: string;
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  address!: string;
}
