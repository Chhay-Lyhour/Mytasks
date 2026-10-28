import 'dotenv/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { RefreshToken } from './refresh-token.entity.js';
import { Task } from './task.entity.js';
import { User } from './user.entity.js';
import { Recipe } from './recipes/recipe.entity.js';

const migrationsDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'migrations',
);

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export default new DataSource({
  type: 'postgres',
  host: requiredEnv('DB_HOST'),
  port: Number(requiredEnv('DB_PORT')),
  username: requiredEnv('DB_USERNAME'),
  password: requiredEnv('DB_PASSWORD'),
  database: requiredEnv('DB_DATABASE'),
  entities: [Task, User, RefreshToken, Recipe],
  migrations: [`${migrationsDirectory}/*{.ts,.js}`],
  synchronize: false,
});
