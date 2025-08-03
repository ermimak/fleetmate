import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 5000;
  await app.listen(port);
  
  console.log(`🚀 FleetMate API is running on: http://localhost:${port}/api`);
}

bootstrap();
