import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GroupsService } from "./groups.service";

@ApiTags("stats")
@Controller("stats")
export class StatsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  getStats() {
    return this.groupsService.getStats();
  }
}
