import { getQueueToken } from "@nestjs/bullmq";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../common/prisma.service";
import { ReminderScheduler } from "./reminder.scheduler";
import {
  CONTRIBUTION_DUE_JOB,
  CONTRIBUTION_REMINDERS_QUEUE,
} from "./reminder.queue";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("ReminderScheduler", () => {
  const now = new Date("2026-07-01T09:00:00.000Z");

  let queue: { add: jest.Mock; getJobCounts: jest.Mock };
  let prisma: {
    group: { findMany: jest.Mock };
    contribution: { findMany: jest.Mock };
  };
  let scheduler: ReminderScheduler;

  const buildScheduler = async () => {
    queue = { add: jest.fn(), getJobCounts: jest.fn().mockResolvedValue({}) };
    prisma = {
      group: { findMany: jest.fn() },
      contribution: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReminderScheduler,
        { provide: getQueueToken(CONTRIBUTION_REMINDERS_QUEUE), useValue: queue },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    scheduler = moduleRef.get(ReminderScheduler);
  };

  beforeEach(buildScheduler);

  it("enqueues a reminder only for members who have not contributed this period", async () => {
    // Period length defaults to 30 days; created 28 days ago => due in 2 days
    // (inside the 3-day lead window), current period = 0.
    const createdAt = new Date(now.getTime() - 28 * DAY_MS);
    prisma.group.findMany.mockResolvedValue([
      {
        id: "grp1",
        createdAt,
        members: [{ address: "GAAA" }, { address: "GBBB" }],
      },
    ]);
    prisma.contribution.findMany.mockResolvedValue([{ memberAddress: "GAAA" }]);

    const enqueued = await scheduler.enqueueDueReminders(now);

    expect(enqueued).toBe(1);
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledWith(
      CONTRIBUTION_DUE_JOB,
      expect.objectContaining({
        groupId: "grp1",
        memberAddress: "GBBB",
        period: 0,
        dueDate: new Date(createdAt.getTime() + 30 * DAY_MS).toISOString(),
      }),
      expect.objectContaining({ jobId: "grp1:GBBB:0" }),
    );
  });

  it("does not enqueue when the due date is outside the lead window", async () => {
    // Created 10 days ago => due in 20 days, well outside the 3-day window.
    prisma.group.findMany.mockResolvedValue([
      {
        id: "grp1",
        createdAt: new Date(now.getTime() - 10 * DAY_MS),
        members: [{ address: "GAAA" }],
      },
    ]);

    const enqueued = await scheduler.enqueueDueReminders(now);

    expect(enqueued).toBe(0);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("does not enqueue when every member already contributed", async () => {
    const createdAt = new Date(now.getTime() - 28 * DAY_MS);
    prisma.group.findMany.mockResolvedValue([
      { id: "grp1", createdAt, members: [{ address: "GAAA" }] },
    ]);
    prisma.contribution.findMany.mockResolvedValue([{ memberAddress: "GAAA" }]);

    const enqueued = await scheduler.enqueueDueReminders(now);

    expect(enqueued).toBe(0);
    expect(queue.add).not.toHaveBeenCalled();
  });
});
