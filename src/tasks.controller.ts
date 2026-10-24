import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserAgent } from './common/user-agent.decorator.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Get()
  getTasks() {
    return this.tasksService.findAll();
  }

  @Get('done')
  getDoneTasks() {
    return this.tasksService.findDone();
  }

  @Get('todo')
  getTodoTasks() {
    return this.tasksService.findTodo();
  }

  @Get('welcome')
  getWelcome() {
    return 'Welcome to MyTasks! We are glad you are here.';
  }

  @Get('agent')
  whoIsAsking(@UserAgent() agent: string | undefined) {
    return { agent };
  }

  @Post()
  createTask(@Body() body: { title: string }) {
    return this.tasksService.create(body.title);
  }

  @Patch(':id')
  updateTask(@Param('id') id: string, @Body() body: { done: boolean }) {
    return this.tasksService.update(Number(id), body.done);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string) {
    return this.tasksService.remove(Number(id));
  }

  @Get(':id')
  async getTaskById(@Param('id') id: string) {
    const task = await this.tasksService.findOne(Number(id));
    return task;
  }
}
