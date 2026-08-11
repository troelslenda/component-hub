import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [AppController], providers: [AppService] }).compile();
    controller = module.get(AppController);
  });

  it('lists components from their checked-in metadata', () => {
    expect(controller.listComponents().components.map(({ id }) => id)).toEqual(['date-range-picker', 'notification-banner']);
  });

  it('returns a component by id', () => {
    expect(controller.getComponent('notification-banner').component.packageName).toBe('@organization/notification-banner');
  });

  it('rejects unknown component ids', () => {
    expect(() => controller.getComponent('missing')).toThrow(NotFoundException);
  });
});
