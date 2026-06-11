import { Module } from "@nestjs/common";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";
import { PrismaService } from "../../common/prisma.service";
import { StellarService } from "../../common/stellar.service";

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, PrismaService, StellarService],
  exports: [GroupsService],
})
export class GroupsModule {}
