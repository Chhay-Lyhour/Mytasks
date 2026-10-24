import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Task } from './task.entity.js';
import { User } from './user.entity.js';

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
  entities: [Task, User],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});
