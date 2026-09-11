import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

/** Query parameters for `GET /api/loans`: pagination + existing filters + sort. */
export class FindLoansQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(["amount", "requestedAt"])
  sortBy: "amount" | "requestedAt" = "requestedAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  order: "asc" | "desc" = "desc";
}
