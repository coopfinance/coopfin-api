import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

export interface CreateProposalDto {
  groupId: string;
  proposer: string;
  type: string;
  title: string;
  description: string;
  quorum: number;
  deadline: string;
  onChainId: number;
  payload?: string;
}

@Injectable()
export class GovernanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(groupId?: string) {
    return this.prisma.proposal.findMany({
      where: groupId ? { groupId } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.proposal.findUnique({ where: { id } });
    if (!p) throw new NotFoundException("Proposal not found");
    return p;
  }

  async create(dto: CreateProposalDto) {
    return this.prisma.proposal.create({
      data: {
        groupId: dto.groupId,
        proposer: dto.proposer,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        quorum: dto.quorum,
        deadline: new Date(dto.deadline),
        onChainId: dto.onChainId,
        payload: dto.payload,
        status: "Active",
      },
    });
  }

  async syncVotes(id: string, votesFor: number, votesAgainst: number, status: string) {
    return this.prisma.proposal.update({
      where: { id },
      data: { votesFor, votesAgainst, status },
    });
  }
}
