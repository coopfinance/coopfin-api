import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";
import { GroupsModule } from "./modules/groups/groups.module";
import { MembersModule } from "./modules/members/members.module";
import { LoansModule } from "./modules/loans/loans.module";
import { GovernanceModule } from "./modules/governance/governance.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PrismaService } from "./common/prisma.service";
import { StellarService } from "./common/stellar.service";
import { StellarIndexerService } from "./common/stellar-indexer.service";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    GroupsModule,
    MembersModule,
    LoansModule,
    GovernanceModule,
    NotificationsModule,
  ],
  providers: [
    PrismaService,
    StellarService,
    StellarIndexerService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
