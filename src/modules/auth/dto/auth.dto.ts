import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class NonceDto {
  @ApiProperty({
    example: "GCEXAMPLE5Q2OZ44E3M63R6RJX...",
    description: "Stellar ed25519 public key (starts with G)",
  })
  @IsString()
  @Matches(/^G[A-Z0-9]{55}$/, { message: "Must be a valid Stellar ed25519 public key" })
  stellarAddress!: string;
}

export class LoginDto {
  @ApiProperty({
    example: "GCEXAMPLE5Q2OZ44E3M63R6RJX...",
    description: "Stellar ed25519 public key (starts with G)",
  })
  @IsString()
  @Matches(/^G[A-Z0-9]{55}$/, { message: "Must be a valid Stellar ed25519 public key" })
  stellarAddress!: string;

  @ApiProperty({
    description: "The nonce that was returned by /auth/nonce",
  })
  @IsString()
  nonce!: string;

  @ApiProperty({
    description: "Base64-encoded ed25519 signature of the nonce",
  })
  @IsString()
  signature!: string;
}
