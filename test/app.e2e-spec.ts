import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

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

  it('Alice only sees her todos, and Bob\'s todo is 404', async () => {
    await request(app.getHttpServer()).post('/api/auth/signup').send(bob).expect(201);

    const aliceLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(alice)
      .expect(200);
    const bobLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(bob)
      .expect(200);

    expect(aliceLogin.body.accessToken).toEqual(expect.any(String));
    expect(aliceLogin.headers['set-cookie']?.join(';')).toMatch(/refreshToken=/);

    await request(app.getHttpServer())
      .post('/api/todos')
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .send({ title: "Alice's homework" })
      .expect(201);

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
    expect(aliceTodos.body[0].title).toBe("Alice's homework");
    expect(
      aliceTodos.body.every(
        (todo: { userId: number }) => todo.userId === aliceTodos.body[0].userId,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .get(`/api/todos/${bobTodo.body.id}`)
      .set('Authorization', `Bearer ${aliceLogin.body.accessToken}`)
      .expect(404);
  });
});
