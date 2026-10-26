import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origin = process.env.ADMIN_ORIGIN || 'http://localhost:5173';
  app.use(helmet());
  app.enableCors({ origin: origin.split(','), credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  const config = new DocumentBuilder().setTitle('文小贤运营后台 API').setVersion('0.1.0').build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(Number(process.env.PORT || 3001));
}
bootstrap();
