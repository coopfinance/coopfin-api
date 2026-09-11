import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { PaginationQueryDto, paginate } from "./pagination-query.dto";

// Mirrors the global ValidationPipe({ transform: true }) behaviour.
const parse = (raw: Record<string, unknown>) =>
  plainToInstance(PaginationQueryDto, raw, { enableImplicitConversion: false });

describe("PaginationQueryDto", () => {
  it("coerces numeric query strings", () => {
    const dto = parse({ page: "2", limit: "50" });
    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it("rejects a limit above 100 (→ 400 via ValidationPipe)", () => {
    const dto = parse({ limit: "101" });
    const errors = validateSync(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe("limit");
    expect(errors[0].constraints).toHaveProperty("max");
  });

  it("rejects page/limit below 1", () => {
    expect(validateSync(parse({ page: "0" }))).toHaveLength(1);
    expect(validateSync(parse({ limit: "0" }))).toHaveLength(1);
  });

  it("rejects non-integer values", () => {
    expect(validateSync(parse({ limit: "abc" }))).toHaveLength(1);
  });
});

describe("paginate", () => {
  it("builds the standard meta envelope", () => {
    expect(paginate([{ id: 1 }], 143, 1, 20)).toEqual({
      data: [{ id: 1 }],
      meta: { page: 1, limit: 20, total: 143, totalPages: 8 },
    });
  });

  it("reports 0 total pages for an empty result set", () => {
    expect(paginate([], 0, 1, 20).meta.totalPages).toBe(0);
  });
});
