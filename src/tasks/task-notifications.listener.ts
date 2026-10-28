import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { TaskCreatedEvent } from './task-created.event.js';
import { TaskUpdatedEvent } from './task-updated.event.js';

@Injectable()
export class TaskNotificationsListener {
  private readonly logger = new Logger(TaskNotificationsListener.name);

  constructor(@InjectQueue('tasks') private readonly tasksQueue: Queue) {}

  @OnEvent('task.created')
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    this.logger.log(
      `Task ${event.task.id} created: ${JSON.stringify(event.task.title)}`,
    );
    await this.tasksQueue.add(
      'send-reminder',
      {
        taskId: event.task.id,
        title: event.task.title,
        ownerId: event.task.ownerId,
      },
      {
        delay: 5000,
        attempts: 3,
        backoff: { type: 'fixed', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );
  }

  @OnEvent('task.updated')
  handleTaskUpdated(event: TaskUpdatedEvent): void {
    this.logger.log(
      `Task ${event.id} updated: ${JSON.stringify(event.title)}, done: ${event.done}`,
    );
  }
}
