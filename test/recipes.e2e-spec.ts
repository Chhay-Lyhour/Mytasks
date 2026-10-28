import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('Recipe Box API (e2e)', () => {
  let app: INestApplication<App>;
  const credentials = {
    email: `recipes.e2e.${Date.now()}@test.dev`,
    password: 'secret123',
  };
  let accessToken: string;
  let recipeId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send(credentials)
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(credentials)
      .expect(200);
    accessToken = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps recipe reads public and returns the recipe CRUD lifecycle', async () => {
    await request(app.getHttpServer()).get('/api/recipes').expect(200);

    await request(app.getHttpServer())
      .get('/api/recipes/2147483647')
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/recipes')
      .send({ name: 'Pancakes', ingredients: 'Flour, eggs, milk' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '', ingredients: 'Flour, eggs, milk' })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/recipes/2147483647')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Missing recipe' })
      .expect(404);

    await request(app.getHttpServer())
      .delete('/api/recipes/2147483647')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    const created = await request(app.getHttpServer())
      .post('/api/recipes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Pancakes', ingredients: 'Flour, eggs, milk' })
      .expect(201);

    recipeId = created.body.id as number;
    expect(created.body).toMatchObject({
      id: expect.any(Number),
      name: 'Pancakes',
      ingredients: 'Flour, eggs, milk',
      isFavorite: false,
    });

    await request(app.getHttpServer())
      .get(`/api/recipes/${recipeId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Pancakes');
      });

    await request(app.getHttpServer())
      .patch(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isFavorite: true })
      .expect(200)
      .expect(({ body }) => {
        expect(body.isFavorite).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/api/recipes')
      .expect(200)
      .expect(({ body }) => {
        expect(
          body.some((recipe: { id: number }) => recipe.id === recipeId),
        ).toBe(true);
      });

    await request(app.getHttpServer())
      .delete(`/api/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/recipes/${recipeId}`)
      .expect(404);
  });
});
