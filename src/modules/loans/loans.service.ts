import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
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

  async create(dto: CreateLoanDto, actorAddress: string) {
    if (dto.borrower !== actorAddress) {
      throw new ForbiddenException("Authenticated Stellar address must match borrower");
    }

    const membership = await this.prisma.member.findUnique({
      where: { address_groupId: { address: actorAddress, groupId: dto.groupId } },
    });
    if (!membership?.isActive) {
      throw new ForbiddenException("Only active group members can request loans");
    }

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

  async updateStatus(id: string, status: string, actorAddress: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: { group: true },
    });
    if (!loan) throw new NotFoundException("Loan not found");
    if (loan.group.adminAddress !== actorAddress) {
      throw new ForbiddenException("Only the group admin can update loan status");
    }

    return this.prisma.loan.update({ where: { id }, data: { status } });
  }
}
