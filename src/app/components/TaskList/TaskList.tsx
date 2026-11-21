import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { CreateTask } from "../CreateTask/CreateTask";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";
import { TaskBulkActions } from "../TaskBulkActions/TaskBulkActions";
import { getNextPageParam, TASK_FEED_INPUT } from "../TaskFeed/feed-options";
import { TaskFeed } from "../TaskFeed/TaskFeed";
import { TaskFeedBoundary } from "../TaskFeed/TaskFeedBoundary";

export default async function TaskList() {
  // page 1 is fetched in-process and handed to the client cache, so the feed
  // renders with data and no spinner; later pages load on the client
  const queryClient = getQueryClient();
  // (prefetchInfiniteQuery is deprecated in favour of this.) A failure here
  // isn't fatal: the failed query isn't dehydrated, so the client fetches page 1
  // itself, and TaskFeedBoundary handles it if that fails too.
  await queryClient
    .infiniteQuery(trpc.listTasks.infiniteQueryOptions(TASK_FEED_INPUT, { getNextPageParam }))
    .catch((error) => console.error("[TaskList] server prefetch failed; client will retry", error));

  return (
    <section>
      <h2>Tasks</h2>
      <CreateTask />
      <TaskBulkActions />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TaskFeedBoundary>
          <TaskFeed />
        </TaskFeedBoundary>
      </HydrationBoundary>
      <LoadingSpinner />
    </section>
  );
}
