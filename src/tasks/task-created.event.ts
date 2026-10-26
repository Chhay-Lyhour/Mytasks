import { Task } from '../task.entity.js';

export class TaskCreatedEvent {
  constructor(public readonly task: Task) {}
}
