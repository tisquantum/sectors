import { createTRPCClientProxy, httpBatchLink } from "@trpc/client";
import {
  createTRPCReact,
  httpBatchLink as httpBatchLinkReact,
} from "@trpc/react-query";
import type { AppRouter } from "@server/trpc/trpc.router";
import superjson from "superjson";
import { createClient } from "@sectors/utils/supabase/client";
// import { customTransformer } from "@server/trpc/trpc.service";
// export const trpc = createTRPCClientProxy<AppRouter>({
//   links: [
//     httpBatchLink({
//       url: `${process.env.NEXT_PUBLIC_NESTJS_SERVER}/trpc`,
//     }),
//   ],
// });
const supabase = createClient();
export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLinkReact({
      url: `${process.env.NEXT_PUBLIC_NESTJS_SERVER}/trpc`,
      transformer: superjson,
      headers: async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        return {
          "ngrok-skip-browser-warning": "true",
          Authorization: session ? `Bearer ${session.access_token}` : "",
        };
      },
    }),
  ],
});
