import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bullmq";
import { redisConnectionFromEnv } from "./modules/notifications/reminder.queue";
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
    BullModule.forRoot({ connection: redisConnectionFromEnv() }),
    GroupsModule,
    MembersModule,
    LoansModule,
    GovernanceModule,
    NotificationsModule,
  ],
  providers: [PrismaService, StellarService, StellarIndexerService],
})
export class AppModule {}
