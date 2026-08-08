import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

type StorageMap = Map<string, unknown>;
let requestStorageInstance: {
  getStore: () => StorageMap | undefined;
  run: <R>(store: StorageMap, callback: () => R) => R;
} | null = null;

export function getRequestStorage() {
  if (typeof window !== "undefined") return null;
  return requestStorageInstance;
}

const requestContextMiddleware = createMiddleware().server(async ({ next }) => {
  if (!requestStorageInstance) {
    const { AsyncLocalStorage } = await import("node:async_hooks");
    requestStorageInstance = new AsyncLocalStorage<StorageMap>();
  }
  const store = new Map<string, unknown>();
  return requestStorageInstance.run(store, async () => {
    return await next();
  });
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [requestContextMiddleware, errorMiddleware, csrfMiddleware],
}));
