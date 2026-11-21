import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, localLink } from "@trpc/client";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { TRPCProvider } from "@/trpc/client";
import { appRouter, type AppRouter } from "@/trpc/routers/_app";

/**
 * Renders with a tRPC client that calls the real router in-process,
 * so component tests exercise validation and the service too.
 */
export function renderWithTRPC(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const trpcClient = createTRPCClient<AppRouter>({
    links: [localLink({ router: appRouter, createContext: async () => ({ userId: null }) })],
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {ui}
      </TRPCProvider>
    </QueryClientProvider>,
  );
}
