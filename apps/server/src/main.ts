import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrpcRouter } from '@server/trpc/trpc.router';
import { expressHandler } from 'trpc-playground/handlers/express';
import { NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
  });
  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);
  const trpcApiEndpoint = '/trpc';
  const playgroundEndpoint = '/trpc-playground';
  app.use(
    playgroundEndpoint,
    await expressHandler({
      trpcApiEndpoint,
      playgroundEndpoint,
      router: trpc.appRouter,
      // uncomment this if you're using superjson
      // request: {
      //   superjson: true,
      // },
    }),
  );
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
