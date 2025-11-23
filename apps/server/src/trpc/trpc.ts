import { TrpcService } from './trpc.service';

const trpcService = new TrpcService();

export const router = trpcService.router;
export const publicProcedure = trpcService.procedure; 