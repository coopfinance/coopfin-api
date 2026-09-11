import { LoansService } from "./loans.service";
import { FindLoansQueryDto } from "./dto/find-loans-query.dto";

describe("LoansService.findAll (pagination)", () => {
  let service: LoansService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      loan: {
        findMany: jest.fn().mockReturnValue("FIND_MANY_QUERY"),
        count: jest.fn().mockReturnValue("COUNT_QUERY"),
      },
      // $transaction resolves the [findMany, count] batch → [rows, total]
      $transaction: jest.fn(),
    };
    service = new LoansService(prisma, {} as any);
  });

  const query = (overrides: Partial<FindLoansQueryDto> = {}): FindLoansQueryDto => ({
    page: 1,
    limit: 20,
    sortBy: "requestedAt",
    order: "desc",
    ...overrides,
  });

  it("applies defaults (page 1, limit 20) and wraps rows in the envelope", async () => {
    const rows = [{ id: "l1" }, { id: "l2" }];
    prisma.$transaction.mockResolvedValue([rows, 143]);

    const result = await service.findAll(query());

    expect(result.data).toBe(rows);
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 143, totalPages: 8 });
    expect(prisma.loan.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { requestedAt: "desc" },
      skip: 0,
      take: 20,
    });
    expect(prisma.loan.count).toHaveBeenCalledWith({ where: {} });
  });

  it("computes skip/take/where/orderBy from page, limit, filters and sort", async () => {
    prisma.$transaction.mockResolvedValue([[], 260]);

    const result = await service.findAll(
      query({ page: 3, limit: 50, groupId: "g1", status: "Pending", sortBy: "amount", order: "asc" }),
    );

    expect(prisma.loan.findMany).toHaveBeenCalledWith({
      where: { groupId: "g1", status: "Pending" },
      orderBy: { amount: "asc" },
      skip: 100,
      take: 50,
    });
    expect(result.meta).toEqual({ page: 3, limit: 50, total: 260, totalPages: 6 });
  });

  it("returns totalPages 0 when there are no matching loans", async () => {
    prisma.$transaction.mockResolvedValue([[], 0]);

    const result = await service.findAll(query());

    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });
});
