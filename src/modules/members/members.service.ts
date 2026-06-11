import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findByGroup(groupId: string) {
    return this.prisma.member.findMany({
      where: { groupId, isActive: true },
      orderBy: { joinedAt: "asc" },
    });
  }

  async add(groupId: string, address: string, displayName?: string) {
    return this.prisma.member.upsert({
      where: { address_groupId: { address, groupId } },
      create: { address, groupId, displayName, isActive: true },
      update: { isActive: true, displayName },
    });
  }
}
