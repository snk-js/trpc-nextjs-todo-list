"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * After a write, refetch every loaded page of the task list. Refetching keeps
 * the pages already scrolled in; a router.refresh() would re-hydrate page 1
 * over them.
 */
export function useInvalidateTasks() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries(trpc.listTasks.pathFilter());
}
