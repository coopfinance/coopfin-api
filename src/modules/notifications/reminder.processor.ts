import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "./notifications.service";
import {
  CONTRIBUTION_REMINDERS_QUEUE,
  ReminderJobData,
} from "./reminder.queue";

/**
 * Worker that turns a queued reminder into a persisted notification
 * (and, when the member has an email on file, an email — stubbed for now).
 */
@Processor(CONTRIBUTION_REMINDERS_QUEUE)
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<ReminderJobData>): Promise<void> {
    const { groupId, memberAddress, period, dueDate } = job.data;
    const due = new Date(dueDate);

    await this.notifications.create(
      memberAddress,
      "contribution_due",
      "Contribution due soon",
      `Your contribution for period ${period} is due on ${due.toDateString()}.`,
      { groupId, period, dueDate },
    );

    const member = await this.prisma.member.findFirst({
      where: { address: memberAddress, groupId },
      select: { email: true },
    });

    if (member?.email) {
      // TODO: send the reminder over email via nodemailer once SMTP
      // credentials are configured (SMTP_* env vars).
      this.logger.log(
        `Would email contribution reminder to ${member.email} (period ${period}).`,
      );
    }
  }
}
