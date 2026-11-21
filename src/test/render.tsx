import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, localLink } from "@trpc/client";
import { render } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import { vi } from "vitest";
import { TRPCProvider } from "@/trpc/client";
import { appRouter, type AppRouter } from "@/trpc/routers/_app";

export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/**
 * Renders with a tRPC client that calls the real router in-process,
 * so component tests exercise validation and the service too.
 * `invalidate` spies on cache invalidation, which every mutation triggers.
 */
export function renderWithTRPC(ui: ReactElement, queryClient = makeTestQueryClient()) {
  const trpcClient = createTRPCClient<AppRouter>({
    links: [localLink({ router: appRouter, createContext: async () => ({ userId: null }) })],
  });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const result = render(
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <Suspense fallback={<p>Suspended…</p>}>{ui}</Suspense>
      </TRPCProvider>
    </QueryClientProvider>,
  );
  return { ...result, queryClient, invalidate };
}
