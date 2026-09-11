import { GroupsService } from "./groups.service";

describe("GroupsService.findAll (pagination)", () => {
  let service: GroupsService;
  let prisma: any;
  let stellar: any;

  beforeEach(() => {
    prisma = {
      group: {
        findMany: jest.fn().mockReturnValue("FIND_MANY_QUERY"),
        count: jest.fn().mockReturnValue("COUNT_QUERY"),
      },
      $transaction: jest.fn(),
    };
    stellar = { getBalance: jest.fn().mockResolvedValue("42") };
    service = new GroupsService(prisma, stellar);
  });

  it("paginates and enriches only the current page with balances", async () => {
    const groups = [
      { id: "g1", adminAddress: "A1", treasuryContractId: "T1" },
      { id: "g2", adminAddress: "A2", treasuryContractId: null },
    ];
    prisma.$transaction.mockResolvedValue([groups, 5]);

    const result = await service.findAll({ page: 2, limit: 2 });

    expect(prisma.group.findMany).toHaveBeenCalledWith({
      include: { members: true },
      orderBy: { createdAt: "desc" },
      skip: 2,
      take: 2,
    });
    expect(result.meta).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
    // group with a treasury contract is enriched via stellar, the other defaults to "0"
    expect(result.data[0].balance).toBe("42");
    expect(result.data[1].balance).toBe("0");
    expect(stellar.getBalance).toHaveBeenCalledTimes(1);
  });
});
