import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
// HACK: The `superjson` library is ESM-only (does not support CJS), while our codebase is CJS.
// This is a workaround to still get to use the latest version of the library from our codebase.
// https://github.com/blitz-js/superjson/issues/268
// https://www.npmjs.com/package/fix-esm
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const fixESM = require("fix-esm");
// @ts-expect-error This is a type-only import, so won't get transformed to `require()`.
import type SuperJSON from "superjson";
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
const SuperJSON: SuperJSON = fixESM.require("superjson");

@Injectable()
export class TrpcService {
  trpc = initTRPC.create({
    transformer: SuperJSON,
  });
  procedure = this.trpc.procedure;
  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;
}
