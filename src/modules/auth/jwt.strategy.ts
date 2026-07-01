import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export interface JwtPayload {
  sub: string; // Stellar address
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET", "coopfin-default-secret"),
    });
  }

  /**
   * Called after the JWT is verified. The returned object is attached to
   * `request.user` for the duration of the request.
   */
  validate(payload: JwtPayload) {
    return { stellarAddress: payload.sub };
  }
}
