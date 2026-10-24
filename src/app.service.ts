import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getWelcome(name: string) {
    const tasks = [
      'Install Node.js',
      'Create mytasks',
      'Run my server',
    ];

    return {
      message: `Welcome to MyTasks, ${name}!`,
      taskCount: tasks.length,
      tasks,
      serverTime: new Date().toISOString(),
    };
  }
}
