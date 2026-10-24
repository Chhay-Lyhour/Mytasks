import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity.js';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  async findAll(userId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
  }

  async findDone(userId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { done: true, userId },
      order: { id: 'ASC' },
    });
  }

  async findTodo(userId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { done: false, userId },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id, userId });
    if (!task) {
      this.logger.warn(`Task with ID ${id} was not found for user ${userId}`);
      throw new NotFoundException(`Task ${id} was not found`);
    }
    return task;
  }

  async create(title: string, userId: number): Promise<Task> {
    const task = this.tasksRepository.create({ title, done: false, userId });
    const savedTask = await this.tasksRepository.save(task);
    this.logger.log(`Created task ${savedTask.id}`);
    this.logger.debug(`Created task title: ${JSON.stringify(savedTask.title)}`);
    return savedTask;
  }

  async update(id: number, done: boolean, userId: number): Promise<Task> {
    const task = await this.findOne(id, userId);
    task.done = done;
    const updatedTask = await this.tasksRepository.save(task);
    this.logger.log(`Updated task ${updatedTask.id}`);
    return updatedTask;
  }

  async remove(id: number, userId: number): Promise<Task> {
    const task = await this.findOne(id, userId);
    await this.tasksRepository.delete({ id, userId });
    this.logger.log(`Deleted task ${id}`);
    return task;
  }
}
