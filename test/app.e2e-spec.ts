import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body.message).toBe('Welcome to MyTasks, Dara!');
        expect(body.taskCount).toBe(body.tasks.length);
        expect(body.tasks).toEqual([
          'Install Node.js',
          'Create mytasks',
          'Run my server',
        ]);
        expect(Number.isNaN(Date.parse(body.serverTime))).toBe(false);
      });
  });

  it('/tasks (GET)', () => {
    return request(app.getHttpServer())
      .get('/tasks')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(5);
        expect(body).toEqual([
          { id: 1, title: 'Plan the week in MyTasks', done: true },
          { id: 2, title: 'Review the NestJS controller', done: false },
          { id: 3, title: 'Test the tasks API routes', done: false },
          { id: 4, title: 'Update the project README', done: false },
          { id: 5, title: "Organize tomorrow's priorities", done: false },
        ]);
      });
  });

  it('creates three tasks and includes them in /tasks (GET)', async () => {
    const newTasks = [
      { id: 6, title: 'Plan the grocery list', done: false },
      { id: 7, title: 'Book a dentist appointment', done: false },
      { id: 8, title: 'Water the plants', done: false },
    ];

    for (const task of newTasks) {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: task.title })
        .expect(201)
        .expect(task);
    }

    return request(app.getHttpServer())
      .get('/tasks')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(8);
        expect(body.slice(-3)).toEqual(newTasks);
      });
  });

  it('creates, marks done, and deletes a task', async () => {
    const createdTask = {
      id: 6,
      title: 'Complete the MyTasks CRUD demo',
      done: false,
    };

    await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: createdTask.title })
      .expect(201)
      .expect(createdTask);

    await request(app.getHttpServer())
      .get('/tasks')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toContainEqual(createdTask);
      });

    const doneTask = { ...createdTask, done: true };
    await request(app.getHttpServer())
      .patch(`/tasks/${createdTask.id}`)
      .send({ done: true })
      .expect(200)
      .expect(doneTask);

    await request(app.getHttpServer())
      .get('/tasks')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toContainEqual(doneTask);
      });

    await request(app.getHttpServer())
      .delete(`/tasks/${createdTask.id}`)
      .expect(200)
      .expect(doneTask);

    return request(app.getHttpServer())
      .get('/tasks')
      .expect(200)
      .expect(({ body }) => {
        expect(body).not.toContainEqual(doneTask);
        expect(body).toHaveLength(5);
      });
  });

  it('/tasks/todo (GET)', () => {
    return request(app.getHttpServer())
      .get('/tasks/todo')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(4);
        expect(body.every((task: { done: boolean }) => task.done === false))
          .toBe(true);
        expect(body.map((task: { id: number }) => task.id)).toEqual([
          2, 3, 4, 5,
        ]);
      });
  });

  it('/tasks/done (GET)', () => {
    return request(app.getHttpServer())
      .get('/tasks/done')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual([
          { id: 1, title: 'Plan the week in MyTasks', done: true },
        ]);
      });
  });

  it('/tasks/agent (GET) returns the request user-agent', () => {
    return request(app.getHttpServer())
      .get('/tasks/agent')
      .set('User-Agent', 'MyTasks-Test-Agent/1.0')
      .expect(200)
      .expect({ agent: 'MyTasks-Test-Agent/1.0' });
  });

  it.each([
    [1, 'Plan the week in MyTasks', true],
    [2, 'Review the NestJS controller', false],
    [3, 'Test the tasks API routes', false],
  ])('/tasks/%s (GET) returns that task', (id, title, done) => {
    return request(app.getHttpServer())
      .get(`/tasks/${id}`)
      .expect(200)
      .expect({
        id,
        title,
        done,
      });
  });

  it('/tasks/999 (GET) returns an empty response', () => {
    return request(app.getHttpServer())
      .get('/tasks/999')
      .expect(200)
      .expect('');
  });

  afterEach(async () => {
    await app.close();
  });
});
