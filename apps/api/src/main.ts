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
    const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const defaultOrigins = ['http://localhost:3000', 'https://stockmanager-client.vercel.app'];
    const finalOrigins = [...new Set([...origins, ...defaultOrigins])];

    app.enableCors({
      origin: finalOrigins,
      credentials: true,
    });
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }

  // Basic root path check to confirm API is alive
  if (req.url === '/' || req.url === '/api') {
    res.status(200).json({ status: 'API is running', version: '1.0.0' });
    return;
  }

  return cachedApp(req, res);
}

// For local development
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const defaultOrigins = ['http://localhost:3000', 'https://stockmanager-client.vercel.app'];
  const finalOrigins = [...new Set([...origins, ...defaultOrigins])];

  app.enableCors({
    origin: finalOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

if (require.main === module) {
  bootstrap();
}
