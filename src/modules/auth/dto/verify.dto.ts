import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyDto {
  @ApiProperty({ example: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ description: "Base64-encoded Stellar signature of the nonce" })
  @IsString()
  @IsNotEmpty()
  signedNonce!: string;
}