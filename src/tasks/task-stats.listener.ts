import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TaskCreatedEvent } from './task-created.event.js';
import { TaskUpdatedEvent } from './task-updated.event.js';

@Injectable()
export class TaskStatsListener {
  private readonly logger = new Logger(TaskStatsListener.name);
  private readonly taskDoneStates = new Map<number, boolean>();
  private createdCount = 0;
  private doneCount = 0;

  @OnEvent('task.created')
  handleTaskCreated(event: TaskCreatedEvent): void {
    this.createdCount += 1;
    this.taskDoneStates.set(event.task.id, event.task.done);
    this.logger.log(`Tasks created: ${this.createdCount}`);
  }

  @OnEvent('task.updated')
  handleTaskUpdated(event: TaskUpdatedEvent): void {
    const wasDone = this.taskDoneStates.get(event.id);
    if (event.done && wasDone !== true) {
      this.doneCount += 1;
      this.logger.log(`Tasks marked done: ${this.doneCount}`);
    }
    this.taskDoneStates.set(event.id, event.done);
  }
}
