import type { IResponse } from "@ryx/shared-types";
import { errorResponse } from "@ryx/api";

export type MockHandlerFn = (data: unknown) => IResponse<unknown>;

export interface MockRegistry {
  register(method: string, handler: MockHandlerFn): void;
  handle(method: string, data: unknown): IResponse<unknown>;
}

export function createMockRegistry(
  initialHandlers: Record<string, MockHandlerFn> = {},
): MockRegistry {
  const handlers = new Map<string, MockHandlerFn>(Object.entries(initialHandlers));

  return {
    register(method, handler) {
      handlers.set(method, handler);
    },
    handle(method, data) {
      const handler = handlers.get(method);
      if (!handler) {
        const response = errorResponse(
          "MOCK_NOT_FOUND",
          `No mock for ${method}`,
        );
        console.warn(`[mock] ${response.Message}`);
        return response;
      }
      return handler(data);
    },
  };
}

/** Async wrapper for ProxyClient mockHandler. */
export function createMockHandler(registry: MockRegistry) {
  return async (method: string, data: unknown): Promise<IResponse<unknown>> => {
    return registry.handle(method, data);
  };
}
