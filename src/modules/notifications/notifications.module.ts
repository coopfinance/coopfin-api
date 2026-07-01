import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { ReminderProcessor } from "./reminder.processor";
import { ReminderScheduler } from "./reminder.scheduler";
import { CONTRIBUTION_REMINDERS_QUEUE } from "./reminder.queue";
import { PrismaService } from "../../common/prisma.service";

@Module({
  imports: [
    BullModule.registerQueue({ name: CONTRIBUTION_REMINDERS_QUEUE }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PrismaService,
    ReminderProcessor,
    ReminderScheduler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
