import type { TaskPage } from "@/server/services/task";

/**
 * Shared by the server prefetch and the client hook. The query key is built
 * from the input, so if the two differ the client ignores the prefetched page
 * and fetches it again.
 */
export const TASK_FEED_INPUT = { limit: 20 };

export const getNextPageParam = (last: TaskPage) => last.nextCursor;
