import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { StellarService } from "../../common/stellar.service";

export interface CreateGroupDto {
  name: string;
  description?: string;
  adminAddress: string;
  treasuryContractId?: string;
  loanContractId?: string;
  votingContractId?: string;
  governanceContractId?: string;
  dividendContractId?: string;
}

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private stellar: StellarService,
  ) {}

  async findAll() {
    const groups = await this.prisma.group.findMany({
      include: { members: true },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with on-chain balances
    return Promise.all(
      groups.map(async (g) => {
        const balance = g.treasuryContractId
          ? await this.stellar.getBalance(g.adminAddress, undefined)
          : "0";
        return { ...g, balance };
      })
    );
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { members: true, loans: true, proposals: true },
    });
    if (!group) throw new NotFoundException("Group not found");
    return group;
  }

  async create(dto: CreateGroupDto) {
    return this.prisma.group.create({ data: dto });
  }

  async getStats() {
    const [totalGroups, totalMembers, contributions, loans] = await Promise.all([
      this.prisma.group.count(),
      this.prisma.member.count(),
      this.prisma.contribution.aggregate({ _sum: { amount: true } }),
      this.prisma.loan.findMany({ where: { status: "Approved" } }),
    ]);

    return {
      totalGroups,
      totalMembers,
      totalContributions: contributions._sum.amount?.toString() ?? "0",
      totalLoansActive: loans.length,
      totalLoansValue: loans.reduce((sum, l) => sum + Number(l.amount), 0),
      totalDividendsDistributed: 0,
    };
  }
}
