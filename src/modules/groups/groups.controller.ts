import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { GroupsService, CreateGroupDto } from "./groups.service";

@ApiTags("groups")
@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: "List all groups" })
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single group" })
  findOne(@Param("id") id: string) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register a new group after contract deployment" })
  create(@Body() dto: CreateGroupDto, @Req() req: AuthenticatedRequest) {
    if (dto.adminAddress !== req.user.address) {
      throw new ForbiddenException("Authenticated Stellar address must match adminAddress");
    }
    return this.groupsService.create(dto);
  }
}
