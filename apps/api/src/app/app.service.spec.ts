import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('component metadata', () => {
    it('loads source and package versions together', () => {
      expect(service.getComponent('date-range-picker')).toMatchObject({
        packageName: '@organization/date-range-picker',
        sourceVersion: '0.0.0',
        releaseState: 'unreleased',
        storyId: 'components-date-range-picker--showcase',
        repositoryPath: 'packages/components/date-range-picker',
        releases: [],
      });
    });
  });
});
