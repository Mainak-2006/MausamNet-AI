import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'mausamnet',
  password: process.env.DB_PASSWORD || 'mausamnet123',
  database: process.env.DB_DATABASE || 'mausamnet',
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});