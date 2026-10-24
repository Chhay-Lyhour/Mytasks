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
import { UserAgent } from './common/user-agent.decorator.js';
import { CreateTaskDto } from './tasks/dto/create-task.dto.js';
import { UpdateTaskDto } from './tasks/dto/update-task.dto.js';
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
  createTask(@Body() body: CreateTaskDto) {
    return this.tasksService.create(body.title);
  }

  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, body.done);
  }

  @Delete(':id')
  deleteTask(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }

  @Get(':id')
  getTaskById(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }
}
