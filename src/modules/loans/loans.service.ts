import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

export interface CreateLoanDto {
  groupId: string;
  borrower: string;
  amount: number;
  purpose: string;
  onChainId: number;
  dueAt?: string;
}

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(groupId?: string, status?: string) {
    return this.prisma.loan.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        ...(status  ? { status  } : {}),
      },
      orderBy: { requestedAt: "desc" },
    });
  }

  async findOne(id: string) {
    const loan = await this.prisma.loan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException("Loan not found");
    return loan;
  }

  async create(dto: CreateLoanDto) {
    const loan = await this.prisma.loan.create({
      data: {
        groupId: dto.groupId,
        borrower: dto.borrower,
        amount: dto.amount,
        interestBps: 500,
        purpose: dto.purpose,
        onChainId: dto.onChainId,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        status: "Pending",
      },
    });

    await this.notifications.create(
      dto.borrower,
      "contribution_received",
      "Loan Request Submitted",
      `Your loan request for $${dto.amount} USDC is pending group approval.`,
      { loanId: loan.id },
    );

    return loan;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.loan.update({ where: { id }, data: { status } });
  }
}
