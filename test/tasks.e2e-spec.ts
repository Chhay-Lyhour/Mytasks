import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('Tasks API (e2e)', () => {
  let app: INestApplication<App>;

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

  it('serves the public welcome route', async () => {
    await request(app.getHttpServer())
      .get('/api/todos/welcome')
      .expect(200)
      .expect('Welcome to MyTasks! We are glad you are here.');
  });

  it('rejects access to the protected tasks route without a token', async () => {
    await request(app.getHttpServer()).get('/api/todos').expect(401);
  });

  it('serves the protected tasks route for an authenticated user', async () => {
    const email = `tasks.e2e.${Date.now()}@test.dev`;
    const password = 'secret123';

    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email, password })
      .expect(201);

    const { body: loginBody } = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/todos')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200)
      .expect([]);
  });
});
