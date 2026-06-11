import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { MembersService } from "./members.service";

@ApiTags("members")
@Controller("groups/:groupId/members")
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findByGroup(@Param("groupId") groupId: string) {
    return this.membersService.findByGroup(groupId);
  }

  @Post()
  add(
    @Param("groupId") groupId: string,
    @Body("address") address: string,
    @Body("displayName") displayName?: string,
  ) {
    return this.membersService.add(groupId, address, displayName);
  }
}
