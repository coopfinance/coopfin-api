import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Queue } from "bullmq";
import { PrismaService } from "../../common/prisma.service";
import {
  CONTRIBUTION_DUE_JOB,
  CONTRIBUTION_REMINDERS_QUEUE,
  ReminderJobData,
} from "./reminder.queue";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Scans active groups once a day and enqueues a reminder for every member
 * who has not yet contributed in the current period, once the due date is
 * within the configured lead window.
 *
 * The contribution period length is not stored per-group in the schema yet,
 * so it is configurable via `CONTRIBUTION_PERIOD_DAYS` (default 30) and the
 * current period is derived from each group's `createdAt`.
 */
@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);
  private readonly periodDays = Number(
    process.env.CONTRIBUTION_PERIOD_DAYS ?? 30,
  );
  private readonly reminderLeadDays = Number(
    process.env.CONTRIBUTION_REMINDER_LEAD_DAYS ?? 3,
  );

  constructor(
    @InjectQueue(CONTRIBUTION_REMINDERS_QUEUE)
    private readonly queue: Queue<ReminderJobData>,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async enqueueDueReminders(now: Date = new Date()): Promise<number> {
    const groups = await this.prisma.group.findMany({
      where: { isActive: true },
      include: { members: { where: { isActive: true } } },
    });

    let enqueued = 0;
    for (const group of groups) {
      const { period, dueDate } = this.currentPeriod(group.createdAt, now);
      const daysUntilDue = (dueDate.getTime() - now.getTime()) / DAY_MS;
      if (daysUntilDue < 0 || daysUntilDue > this.reminderLeadDays) continue;

      const contributions = await this.prisma.contribution.findMany({
        where: { groupId: group.id, period },
        select: { memberAddress: true },
      });
      const contributed = new Set(contributions.map((c) => c.memberAddress));

      for (const member of group.members) {
        if (contributed.has(member.address)) continue;
        await this.queue.add(
          CONTRIBUTION_DUE_JOB,
          {
            groupId: group.id,
            memberAddress: member.address,
            period,
            dueDate: dueDate.toISOString(),
          },
          {
            // Deterministic id → one reminder per member per period even if
            // the cron runs on several days inside the lead window.
            jobId: `${group.id}:${member.address}:${period}`,
            // Keep the completed job (and its id) around for the whole period
            // so the dedupe above holds, then let it expire.
            removeOnComplete: { age: Math.ceil(this.periodDays * 24 * 60 * 60) },
            removeOnFail: { age: 7 * 24 * 60 * 60 },
          },
        );
        enqueued++;
      }
    }

    const counts = await this.queue.getJobCounts();
    this.logger.log(
      `Enqueued ${enqueued} contribution reminder(s); queue counts: ${JSON.stringify(counts)}`,
    );
    return enqueued;
  }

  /**
   * Derive the current 0-based contribution period and its due date from the
   * group's creation date and the configured period length.
   */
  private currentPeriod(
    createdAt: Date,
    now: Date,
  ): { period: number; dueDate: Date } {
    const elapsedDays = Math.max(
      0,
      (now.getTime() - createdAt.getTime()) / DAY_MS,
    );
    const period = Math.floor(elapsedDays / this.periodDays);
    const dueDate = new Date(
      createdAt.getTime() + (period + 1) * this.periodDays * DAY_MS,
    );
    return { period, dueDate };
  }
}
