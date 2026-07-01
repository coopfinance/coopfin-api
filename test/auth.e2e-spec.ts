import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Keypair } from "@stellar/stellar-sdk";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma.service";
import { NotificationsService } from "../src/modules/notifications/notifications.service";

describe("Auth flow (e2e)", () => {
  let app: INestApplication;
  const keypair = Keypair.random();
  const address = keypair.publicKey();

  const mockPrisma = {
    group: {
      create: jest.fn().mockResolvedValue({
        id: "group-1",
        name: "Test Group",
        adminAddress: address,
      }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    member: { count: jest.fn().mockResolvedValue(0) },
    contribution: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }) },
    loan: { findMany: jest.fn().mockResolvedValue([]) },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(NotificationsService)
      .useValue({ create: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects protected write endpoints without a JWT", async () => {
    await request(app.getHttpServer())
      .post("/api/groups")
      .send({ name: "Test", adminAddress: address })
      .expect(401);
  });

  it("completes nonce → verify → protected endpoint", async () => {
    const nonceRes = await request(app.getHttpServer())
      .get("/api/auth/nonce")
      .query({ address })
      .expect(200);

    const signature = keypair.sign(Buffer.from(nonceRes.body.nonce)).toString("base64");

    const verifyRes = await request(app.getHttpServer())
      .post("/api/auth/verify")
      .send({ address, signedNonce: signature })
      .expect(201);

    expect(verifyRes.body.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post("/api/groups")
      .set("Authorization", `Bearer ${verifyRes.body.accessToken}`)
      .send({ name: "Test Group", adminAddress: address })
      .expect(201);

    expect(mockPrisma.group.create).toHaveBeenCalled();
  });

  it("keeps read endpoints public", async () => {
    await request(app.getHttpServer()).get("/api/groups").expect(200);
  });
});