"use client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { TaskItem } from "../TaskItem/TaskItem";
import { getNextPageParam, TASK_FEED_INPUT } from "./feed-options";

export function TaskFeed() {
  const trpc = useTRPC();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, error } =
    useSuspenseInfiniteQuery(
      trpc.listTasks.infiniteQueryOptions(TASK_FEED_INPUT, { getNextPageParam }),
    );

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px" }, // start loading ~600px before the end
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const tasks = data.pages.flatMap((p) => p.items);

  return (
    <>
      <ul>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
      <div ref={sentinel} />
      {error && <p>{error.message}</p>}
      {!hasNextPage && <p>{tasks.length ? "No more tasks" : "No tasks yet"}</p>}
    </>
  );
}
