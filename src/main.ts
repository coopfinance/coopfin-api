import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" });

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle("CoopFinance API")
    .setDescription("REST API for the CoopFinance cooperative finance platform")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, doc);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 CoopFinance API running on http://localhost:${port}`);
  console.log(`📚 Docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
