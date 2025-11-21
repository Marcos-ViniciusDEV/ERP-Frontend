/**
 * Mock tRPC client for components not yet refactored to REST API.
 * This is a temporary solution to allow the frontend to build.
 * Components using this mock will fail at runtime until fully refactored.
 */

const createRecursiveProxy = (): any => {
  return new Proxy(() => {}, {
    get: () => createRecursiveProxy(),
    apply: () => createRecursiveProxy(),
  });
};

export const trpc = createRecursiveProxy() as any;

// Mock utilities
export const createTRPCReact = () => trpc;
export const httpBatchLink = () => ({});
export const loggerLink = () => ({});
export const createTRPCProxyClient = () => trpc;
