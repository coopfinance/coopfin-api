import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./modules/auth/auth.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { MembersModule } from "./modules/members/members.module";
import { LoansModule } from "./modules/loans/loans.module";
import { GovernanceModule } from "./modules/governance/governance.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PrismaService } from "./common/prisma.service";
import { StellarService } from "./common/stellar.service";
import { StellarIndexerService } from "./common/stellar-indexer.service";

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
  providers: [PrismaService, StellarService, StellarIndexerService],
})
export class AppModule {}
