import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Task } from '../task.entity.js';
import { TaskCreatedEvent } from './task-created.event.js';
import { TasksService } from '../tasks.service.js';

describe('TasksService', () => {
  let service: TasksService;
  const tasksRepository = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const eventEmitter = { emit: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: tasksRepository,
        },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('finds tasks belonging to the requested user in ID order', async () => {
    const tasks = [
      { id: 1, title: 'First task', done: false, priority: 0, ownerId: 7 },
    ];
    tasksRepository.find.mockResolvedValue(tasks);

    await expect(service.findAll(7)).resolves.toEqual(tasks);
    expect(tasksRepository.find).toHaveBeenCalledWith({
      where: { ownerId: 7 },
      order: { id: 'ASC' },
    });
  });

  it('throws NotFoundException when findOne cannot find a task', async () => {
    tasksRepository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(42, 7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tasksRepository.findOneBy).toHaveBeenCalledWith({
      id: 42,
      ownerId: 7,
    });
  });

  it('creates a task and emits the task.created event', async () => {
    const task = {
      id: 3,
      title: 'Write tests',
      done: false,
      priority: 0,
      ownerId: 7,
    } satisfies Partial<Task>;
    tasksRepository.create.mockReturnValue(task);
    tasksRepository.save.mockResolvedValue(task);

    await expect(service.create('Write tests', 7)).resolves.toEqual(task);
    expect(tasksRepository.create).toHaveBeenCalledWith({
      title: 'Write tests',
      done: false,
      ownerId: 7,
    });
    expect(tasksRepository.save).toHaveBeenCalledWith(task);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'task.created',
      expect.any(TaskCreatedEvent),
    );
  });

  it('throws NotFoundException when updating a missing task', async () => {
    tasksRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.update(42, { title: 'Missing task' }, 7),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tasksRepository.save).not.toHaveBeenCalled();
  });
});
