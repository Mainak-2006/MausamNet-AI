import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = moduleRef.get<AppService>(AppService);
  });

  it('should return health status', () => {
    expect(service.getHealth()).toEqual({
      status: 'ok',
      service: 'mausamnet-api',
    });
  });
});
