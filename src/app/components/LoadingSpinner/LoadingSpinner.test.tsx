import { useMutation } from "@tanstack/react-query";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { taskService, type TaskPage } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import { scrollToEnd } from "@/test/setup-dom";
import { TaskFeed } from "../TaskFeed/TaskFeed";
import { LoadingSpinner } from "./LoadingSpinner";

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const spinner = () => screen.queryByRole("status");

describe("LoadingSpinner", () => {
  it("is hidden while nothing is loading", async () => {
    taskService.createMany(3);
    renderWithTRPC(
      <>
        <TaskFeed />
        <LoadingSpinner delayMs={0} />
      </>,
    );
    await screen.findByText("No more tasks");
    expect(spinner()).toBeNull();
  });

  it("shows while the next page loads, then hides", async () => {
    taskService.createMany(25);
    renderWithTRPC(
      <>
        <TaskFeed />
        <LoadingSpinner delayMs={0} />
      </>,
    );
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(20));

    // hold page 2 open so the in-flight state is observable
    const page2 = deferred<TaskPage>();
    const real = taskService.listPage.bind(taskService);
    const spy = vi
      .spyOn(taskService, "listPage")
      .mockImplementation(((input: Parameters<typeof real>[0]) =>
        page2.promise.then(() => real(input))) as unknown as typeof real);

    scrollToEnd();
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByText("Loading…")).toBeTruthy();

    await act(async () => page2.resolve(undefined as unknown as TaskPage));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(25));
    await waitFor(() => expect(spinner()).toBeNull());
    spy.mockRestore();
  });

  it("shows while a mutation is running", async () => {
    const pending = deferred<void>();
    function Mutate() {
      const m = useMutation({ mutationFn: () => pending.promise });
      return <button onClick={() => m.mutate()}>go</button>;
    }
    renderWithTRPC(
      <>
        <Mutate />
        <LoadingSpinner delayMs={0} />
      </>,
    );

    await userEvent.setup().click(screen.getByRole("button", { name: "go" }));
    expect(await screen.findByRole("status")).toBeTruthy();

    await act(async () => pending.resolve());
    await waitFor(() => expect(spinner()).toBeNull());
  });

  it("waits for the delay before appearing", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const pending = deferred<void>();
    function Mutate() {
      const m = useMutation({ mutationFn: () => pending.promise });
      return <button onClick={() => m.mutate()}>go</button>;
    }
    renderWithTRPC(
      <>
        <Mutate />
        <LoadingSpinner delayMs={500} />
      </>,
    );

    await act(async () => screen.getByRole("button", { name: "go" }).click());
    await act(async () => vi.advanceTimersByTime(0)); // flush React Query's batched notify
    await act(async () => vi.advanceTimersByTime(400));
    expect(spinner()).toBeNull();
    await act(async () => vi.advanceTimersByTime(200));
    expect(spinner()).toBeTruthy();

    await act(async () => pending.resolve());
    await waitFor(() => expect(spinner()).toBeNull());
    vi.useRealTimers();
  });
});
