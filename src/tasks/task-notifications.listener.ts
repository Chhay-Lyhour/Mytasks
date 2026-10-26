import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TaskCreatedEvent } from './task-created.event.js';
import { TaskUpdatedEvent } from './task-updated.event.js';

@Injectable()
export class TaskNotificationsListener {
  private readonly logger = new Logger(TaskNotificationsListener.name);

  @OnEvent('task.created')
  handleTaskCreated(event: TaskCreatedEvent): void {
    this.logger.log(
      `Task ${event.task.id} created: ${JSON.stringify(event.task.title)}`,
    );
  }

  @OnEvent('task.updated')
  handleTaskUpdated(event: TaskUpdatedEvent): void {
    this.logger.log(
      `Task ${event.id} updated: ${JSON.stringify(event.title)}, done: ${event.done}`,
    );
  }
}
