import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

export type NotificationType =
  | "contribution_due"
  | "contribution_received"
  | "loan_approved"
  | "loan_repayment_due"
  | "proposal_created"
  | "dividend_distributed";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    recipient: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, unknown>
  ) {
    return this.prisma.notification.create({
      data: { recipient, type, title, body, metadata: metadata as any },
    });
  }

  async getUnread(recipient: string) {
    return this.prisma.notification.findMany({
      where: { recipient, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
