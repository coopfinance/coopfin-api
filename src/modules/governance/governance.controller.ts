import { Controller, Get, Post, Param, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { GovernanceService, CreateProposalDto } from "./governance.service";

@ApiTags("governance")
@Controller("governance")
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get("proposals")
  @ApiOperation({ summary: "List all proposals" })
  findAll(@Query("groupId") groupId?: string) {
    return this.governanceService.findAll(groupId);
  }

  @Get("proposals/:id")
  findOne(@Param("id") id: string) {
    return this.governanceService.findOne(id);
  }

  @Post("proposals")
  @ApiOperation({ summary: "Register proposal after on-chain creation" })
  create(@Body() dto: CreateProposalDto) {
    return this.governanceService.create(dto);
  }
}
