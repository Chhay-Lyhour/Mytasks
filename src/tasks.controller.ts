import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { type AuthenticatedUser } from './auth/auth.guard.js';
import { CurrentUser } from './auth/current-user.decorator.js';
import { Public } from './auth/public.decorator.js';
import { UserAgent } from './common/user-agent.decorator.js';
import { CreateTaskDto } from './tasks/dto/create-task.dto.js';
import { UpdateTaskDto } from './tasks/dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller(['todos', 'tasks'])
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.findAll(user.sub);
  }

  @Get('done')
  getDoneTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.findDone(user.sub);
  }

  @Get('todo')
  getTodoTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.findTodo(user.sub);
  }

  @Public()
  @Get('welcome')
  getWelcome() {
    return 'Welcome to MyTasks! We are glad you are here.';
  }

  @Public()
  @Get('agent')
  whoIsAsking(@UserAgent() agent: string | undefined) {
    return { agent };
  }

  @Post()
  createTask(
    @Body() body: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.create(body.title, user.sub);
  }

  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.update(id, body.done, user.sub);
  }

  @Delete(':id')
  deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.remove(id, user.sub);
  }

  @Get(':id')
  getTaskById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findOne(id, user.sub);
  }
}
