import { Module } from "@nestjs/common";
import { GovernanceController } from "./governance.controller";
import { GovernanceService } from "./governance.service";
import { PrismaService } from "../../common/prisma.service";

@Module({
  controllers: [GovernanceController],
  providers: [GovernanceService, PrismaService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
