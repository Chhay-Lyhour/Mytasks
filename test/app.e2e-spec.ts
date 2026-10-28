import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  Injectable,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { TaskCreatedEvent } from '../src/tasks/task-created.event.js';

@Injectable()
class ThrowingTaskCreatedTestListener {
  static enabled = false;
  private readonly logger = new Logger(ThrowingTaskCreatedTestListener.name);

  @OnEvent('task.created')
  handleTaskCreated(_event: TaskCreatedEvent): void {
    if (ThrowingTaskCreatedTestListener.enabled) {
      throw new Error('Intentional listener error for isolation test');
    }
  }
}

describe('Session 3 auth lab (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const alice = {
    email: `alice.${stamp}@test.dev`,
    password: 'secret123',
  };
  const bob = {
    email: `bob.${stamp}@test.dev`,
    password: 'secret123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [ThrowingTaskCreatedTestListener],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/signup returns 201 { id, email } with no hash', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send(alice)
      .expect(201);

    expect(body).toEqual({
      id: expect.any(Number),
      email: alice.email,
    });
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('passwordHash');
  });

  it('signup with the same email returns 409 Conflict', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send(alice)
      .expect(409);
  });

  it('login with the wrong password returns 401 Invalid credentials', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'wrong-password' })
      .expect(401);

    expect(body.message).toBe('Invalid credentials');
  });

  it('GET /api/todos without a token returns 401', async () => {
    await request(app.getHttpServer()).get('/api/todos').expect(401);
  });

  it("Alice only sees her todos, and Bob's todo is 404", async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send(bob)
      .expect(201);

    const aliceLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(alice)
      .expect(200);
    const bobLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(bob)
      .expect(200);

    expect(aliceLogin.body.accessToken).toEqual(expect.any(String));
    expect(aliceLogin.headers['set-cookie']?.join(';')).toMatch(
      /refreshToken=/,
    );

    const aliceTodo = await request(app.getHttpServer())
      .post('/api/todos')
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .send({ title: "Alice's homework" })
      .expect(201);

    const titleUpdatedTodo = await request(app.getHttpServer())
      .patch(`/api/todos/${aliceTodo.body.id}`)
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .send({ title: 'Buy milk' })
      .expect(200);
    expect(titleUpdatedTodo.body.title).toBe('Buy milk');
    expect(titleUpdatedTodo.body.done).toBe(false);

    const completedTodo = await request(app.getHttpServer())
      .patch(`/api/todos/${aliceTodo.body.id}`)
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .send({ done: true })
      .expect(200);
    expect(completedTodo.body.title).toBe('Buy milk');
    expect(completedTodo.body.done).toBe(true);

    const bobTodo = await request(app.getHttpServer())
      .post('/api/todos')
      .set('Authorization', `Bearer ${bobLogin.body.accessToken}`)
      .send({ title: "Bob's secret" })
      .expect(201);

    const aliceTodos = await request(app.getHttpServer())
      .get('/api/todos')
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .expect(200);

    expect(aliceTodos.body).toHaveLength(1);
    expect(aliceTodos.body[0].title).toBe('Buy milk');
    expect(aliceTodos.body[0].done).toBe(true);
    expect(
      aliceTodos.body.every(
        (todo: { ownerId: number }) =>
          todo.ownerId === aliceTodos.body[0].ownerId,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .get(`/api/todos/${bobTodo.body.id}`)
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .expect(404);
  });

  it('returns 201 when a task-created listener throws', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(alice)
      .expect(200);

    ThrowingTaskCreatedTestListener.enabled = true;
    try {
      await request(app.getHttpServer())
        .post('/api/todos')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .send({ title: 'Listener failure should not fail this request' })
        .expect(201);
    } finally {
      ThrowingTaskCreatedTestListener.enabled = false;
    }
  });

  it('rotates refresh tokens once and revokes them on logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(alice)
      .expect(200);
    const refreshCookie = login.headers['set-cookie']?.[0]?.split(';', 1)[0];
    expect(refreshCookie).toMatch(/^refreshToken=/);
    if (!refreshCookie) {
      throw new Error('Login did not set the refresh-token cookie');
    }

    const refreshAttempts = await Promise.all([
      request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie),
      request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie),
    ]);
    expect(
      refreshAttempts
        .map((response) => response.status)
        .sort((left, right) => left - right),
    ).toEqual([200, 401]);

    const logoutLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(alice)
      .expect(200);
    const logoutCookie = logoutLogin.headers['set-cookie']?.[0]?.split(
      ';',
      1,
    )[0];
    expect(logoutCookie).toMatch(/^refreshToken=/);
    if (!logoutCookie) {
      throw new Error('Login did not set the refresh-token cookie');
    }

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', logoutCookie)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', logoutCookie)
      .expect(401);
  });
});
