import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the welcome message, tasks, and server time', () => {
      const response = appController.getHello();

      expect(response.message).toBe('Welcome to MyTasks, Dara!');
      expect(response.taskCount).toBe(response.tasks.length);
      expect(response.tasks).toEqual([
        'Install Node.js',
        'Create mytasks',
        'Run my server',
      ]);
      expect(Number.isNaN(Date.parse(response.serverTime))).toBe(false);
    });
  });
});
