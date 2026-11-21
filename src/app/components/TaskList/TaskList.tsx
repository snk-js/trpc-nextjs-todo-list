import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { CreateTask } from "../CreateTask/CreateTask";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";
import { TaskBulkActions } from "../TaskBulkActions/TaskBulkActions";
import { getNextPageParam, TASK_FEED_INPUT } from "../TaskFeed/feed-options";
import { TaskFeed } from "../TaskFeed/TaskFeed";

export default async function TaskList() {
  // page 1 is fetched in-process and handed to the client cache, so the feed
  // renders with data and no spinner; later pages load on the client
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    trpc.listTasks.infiniteQueryOptions(TASK_FEED_INPUT, { getNextPageParam }),
  );

  return (
    <section>
      <h2>Tasks</h2>
      <CreateTask />
      <TaskBulkActions />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TaskFeed />
      </HydrationBoundary>
      <LoadingSpinner />
    </section>
  );
}
