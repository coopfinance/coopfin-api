import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

export interface JwtPayload {
  sub: string;
  address: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get("JWT_SECRET", "coopfin-super-secret-key-change-in-production"),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.address || !payload.sub) {
      throw new UnauthorizedException("Invalid token payload");
    }
    return { sub: payload.sub, address: payload.address };
  }
}
