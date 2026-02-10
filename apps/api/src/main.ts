import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// For Vercel serverless
let cachedApp;

export default async function handler(req, res) {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    app.use(helmet());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp(req, res);
}

// For local development
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

if (require.main === module) {
  bootstrap();
}
