import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { GroupsService, CreateGroupDto } from "./groups.service";
import { Public } from "../../common/guards/public.decorator";

@ApiTags("groups")
@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List all groups" })
  findAll() {
    return this.groupsService.findAll();
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a single group" })
  findOne(@Param("id") id: string) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register a new group after contract deployment" })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }
}
