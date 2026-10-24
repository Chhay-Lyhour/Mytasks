import { Injectable, Logger } from '@nestjs/common';
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

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({ order: { id: 'ASC' } });
  }

  async findDone(): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { done: true },
      order: { id: 'ASC' },
    });
  }

  async findTodo(): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { done: false },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Task | undefined> {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) {
      this.logger.warn(`Task with ID ${id} was not found`);
    }
    return task ?? undefined;
  }

  async create(title: string): Promise<Task> {
    const task = this.tasksRepository.create({ title, done: false });
    const savedTask = await this.tasksRepository.save(task);
    this.logger.log(`Created task ${savedTask.id}`);
    this.logger.debug(`Created task title: ${JSON.stringify(savedTask.title)}`);
    return savedTask;
  }

  async update(id: number, done: boolean): Promise<Task | undefined> {
    const task = await this.findOne(id);
    if (!task) {
      return undefined;
    }
    task.done = done;
    const updatedTask = await this.tasksRepository.save(task);
    this.logger.log(`Updated task ${updatedTask.id}`);
    return updatedTask;
  }

  async remove(id: number): Promise<Task | undefined> {
    const task = await this.findOne(id);
    if (!task) {
      return undefined;
    }
    await this.tasksRepository.delete(id);
    this.logger.log(`Deleted task ${id}`);
    return task;
  }
}
