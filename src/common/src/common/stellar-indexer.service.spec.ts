import { Test, TestingModule } from '@nestjs/testing';
import { StellarIndexerService } from './stellar-indexer.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('StellarIndexerService', () => {
  let service: StellarIndexerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StellarIndexerService,
        {
          provide: PrismaService,
          useValue: {
            contribution: { upsert: jest.fn() },
            loan: { upsert: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('https://horizon-testnet.stellar.org') },
        },
      ],
    }).compile();

    service = module.get<StellarIndexerService>(StellarIndexerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process contribution events', async () => {
    // Mock data and test
    // ...
  });

  // Más pruebas según aceptación
});