import { ConnectionOptions } from "bullmq";

/** Name of the BullMQ queue that holds contribution-reminder jobs. */
export const CONTRIBUTION_REMINDERS_QUEUE = "contribution-reminders";

/** Job name used for every reminder enqueued onto the queue. */
export const CONTRIBUTION_DUE_JOB = "contribution-due";

/** Payload enqueued for a single member who needs a reminder. */
export interface ReminderJobData {
  groupId: string;
  memberAddress: string;
  /** 0-based contribution period the reminder is for. */
  period: number;
  /** ISO string of when the contribution is due. */
  dueDate: string;
}

/**
 * Build a BullMQ/ioredis connection from a REDIS_URL
 * (e.g. `redis://:password@host:6379/0`). Falls back to localhost.
 */
export function redisConnectionFromEnv(
  url = process.env.REDIS_URL ?? "redis://localhost:6379",
): ConnectionOptions {
  const parsed = new URL(url);
  const db =
    parsed.pathname && parsed.pathname.length > 1
      ? Number(parsed.pathname.slice(1))
      : undefined;

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: Number.isNaN(db as number) ? undefined : db,
  };
}
