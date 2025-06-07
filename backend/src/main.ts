import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin:'http://localhost:'+process.env.FRONTEND_PORT,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  })

  const config = new DocumentBuilder()
    .setTitle('Visual Forge API')
    .setDescription('The Visual Forge API description')
    .setVersion('1.0')
    .addTag('Visual Forge')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // This line sets up the Swagger UI endpoint:
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.BACKEND_PORT ?? 3000);
}
bootstrap();
