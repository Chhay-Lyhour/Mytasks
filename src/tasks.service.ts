import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity.js';
import { TaskCreatedEvent } from './tasks/task-created.event.js';
import { TaskUpdatedEvent } from './tasks/task-updated.event.js';
import { UpdateTaskDto } from './tasks/dto/update-task.dto.js';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async findAll(userId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { ownerId: userId },
      order: { id: 'ASC' },
    });
  }

  async findDone(userId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { done: true, ownerId: userId },
      order: { id: 'ASC' },
    });
  }

  async findTodo(userId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { done: false, ownerId: userId },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id, ownerId: userId });
    if (!task) {
      this.logger.warn(`Task with ID ${id} was not found for user ${userId}`);
      throw new NotFoundException(`Task with ID ${id} was not found`);
    }
    return task;
  }

  async create(title: string, userId: number): Promise<Task> {
    const task = this.tasksRepository.create({
      title,
      done: false,
      ownerId: userId,
    });
    const savedTask = await this.tasksRepository.save(task);
    this.logger.log(`Created task ${savedTask.id}`);
    this.logger.debug(`Created task title: ${JSON.stringify(savedTask.title)}`);
    this.eventEmitter.emit('task.created', new TaskCreatedEvent(savedTask));
    return savedTask;
  }

  async update(
    id: number,
    changes: UpdateTaskDto,
    userId: number,
  ): Promise<Task> {
    const task = await this.findOne(id, userId);
    Object.assign(task, changes);
    const updatedTask = await this.tasksRepository.save(task);
    this.logger.log(`Updated task ${updatedTask.id}`);
    this.eventEmitter.emit(
      'task.updated',
      new TaskUpdatedEvent(updatedTask.id, updatedTask.title, updatedTask.done),
    );
    return updatedTask;
  }

  async remove(id: number, userId: number): Promise<Task> {
    const task = await this.findOne(id, userId);
    await this.tasksRepository.delete({ id, ownerId: userId });
    this.logger.log(`Deleted task ${id}`);
    return task;
  }
}
