"use client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { describeError } from "@/trpc/errors";
import { TaskItem } from "../TaskItem/TaskItem";
import { getNextPageParam, TASK_FEED_INPUT } from "./feed-options";

export function TaskFeed() {
  const trpc = useTRPC();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
  } = useSuspenseInfiniteQuery(
    trpc.listTasks.infiniteQueryOptions(TASK_FEED_INPUT, { getNextPageParam }),
  );

  const autoLoad = hasNextPage && !isFetchingNextPage && !isFetchNextPageError;

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !autoLoad) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoLoad, fetchNextPage]);

  const tasks = data.pages.flatMap((p) => p.items);

  return (
    <>
      <ul>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
      <div ref={sentinel} />
      {error && (
        <p role="alert">
          {isFetchNextPageError
            ? "Couldn't load more tasks"
            : "Couldn't refresh tasks"}
          : {describeError(error).message}{" "}
          <button
            onClick={() => (isFetchNextPageError ? fetchNextPage() : refetch())}
          >
            Retry
          </button>
        </p>
      )}
      {!hasNextPage && !error && (
        <p>{tasks.length ? "No more tasks" : "No tasks yet"}</p>
      )}
    </>
  );
}
