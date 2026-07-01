import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma.service';
import { Keypair } from '@stellar/stellar-sdk';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const keypair = Keypair.random();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/auth/nonce (GET)', async () => {
    const address = keypair.publicKey();
    const res = await request(app.getHttpServer())
      .get(`/api/auth/nonce?address=${address}`)
      .expect(200);

    expect(res.body.nonce).toBeDefined();
  });

  it('/api/auth/verify (POST)', async () => {
    const address = keypair.publicKey();
    
    // Get nonce
    const nonceRes = await request(app.getHttpServer())
      .get(`/api/auth/nonce?address=${address}`)
      .expect(200);
      
    const nonce = nonceRes.body.nonce;
    
    // Sign nonce
    const signature = keypair.sign(Buffer.from(nonce)).toString('base64');
    
    // Verify
    const verifyRes = await request(app.getHttpServer())
      .post('/api/auth/verify')
      .send({ address, signedNonce: signature })
      .expect(201);
      
    expect(verifyRes.body.accessToken).toBeDefined();

    // Verify token can be used on protected route
    await request(app.getHttpServer())
      .post('/groups')
      .set('Authorization', `Bearer ${verifyRes.body.accessToken}`)
      .send({})
      .expect((res: any) => {
         if (res.status === 401) {
             throw new Error('Expected authenticated response, got 401');
         }
      });
  });
});
