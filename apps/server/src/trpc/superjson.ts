import type { SuperJSON } from 'superjson';

// Declare the superjson variable with a type
let superjson: SuperJSON | undefined;

(async () => {
  const module = await import('superjson');
  superjson = new module.default;
})();

// Export a function that returns superjson
module.exports = (): SuperJSON => {
  if (!superjson) {
    throw new Error('superjson is not yet loaded');
  }
  return superjson;
};

export type { SuperJSON };
