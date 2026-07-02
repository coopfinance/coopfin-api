import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Keypair } from "@stellar/stellar-sdk";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../common/prisma.service";

describe("Stellar JWT auth flow", () => {
  let app: INestApplication;
  const admin = Keypair.random();

  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    group: {
      create: jest.fn(),
    },
    member: {
      findUnique: jest.fn(),
    },
    loan: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("issues a nonce, verifies a Stellar signature, and authorizes a protected group write", async () => {
    const nonceResponse = await request(app.getHttpServer())
      .get("/api/auth/nonce")
      .query({ address: admin.publicKey() })
      .expect(200);

    const signature = admin.sign(Buffer.from(nonceResponse.body.nonce, "utf8")).toString("base64");

    const verifyResponse = await request(app.getHttpServer())
      .post("/api/auth/verify")
      .send({ address: admin.publicKey(), signedNonce: signature })
      .expect(201);

    prismaMock.group.create.mockResolvedValueOnce({
      id: "group_1",
      name: "Builders Coop",
      adminAddress: admin.publicKey(),
    });

    await request(app.getHttpServer())
      .post("/api/groups")
      .set("Authorization", `Bearer ${verifyResponse.body.accessToken}`)
      .send({ name: "Builders Coop", adminAddress: admin.publicKey() })
      .expect(201);
  });
});
