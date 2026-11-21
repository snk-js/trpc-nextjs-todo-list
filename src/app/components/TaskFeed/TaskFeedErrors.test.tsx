import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import { scrollToEnd } from "@/test/setup-dom";
import { UNKNOWN_ERROR } from "@/trpc/errors";
import { TaskFeed } from "./TaskFeed";
import { TaskFeedBoundary } from "./TaskFeedBoundary";

afterEach(() => vi.restoreAllMocks());

const items = () => screen.queryAllByRole("listitem");
const fail = () => {
  throw new Error("db down");
};

const failSlowly = (() =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("db down")), 10),
  )) as unknown as typeof taskService.listPage;

function renderFeed() {
  return renderWithTRPC(
    <TaskFeedBoundary>
      <TaskFeed />
    </TaskFeedBoundary>,
  );
}

describe("TaskFeed errors", () => {
  it("shows a retry instead of crashing when the first load fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // React logs caught errors
    taskService.createMany(3);
    const listPage = vi.spyOn(taskService, "listPage").mockImplementation(fail);
    renderFeed();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      `Couldn't load tasks: ${UNKNOWN_ERROR}`,
    );

    listPage.mockRestore();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(items()).toHaveLength(3));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps loaded tasks when the next page fails, without retrying in a loop", async () => {
    taskService.createMany(25);
    const real = taskService.listPage.bind(taskService);
    const listPage = vi
      .spyOn(taskService, "listPage")
      .mockImplementation((input) =>
        input.cursor ? failSlowly(input) : real(input),
      );
    renderFeed();
    await waitFor(() => expect(items()).toHaveLength(20));

    scrollToEnd({ stayInView: true }); // a real observer would keep re-firing
    expect((await screen.findByRole("alert")).textContent).toContain(
      `Couldn't load more tasks: ${UNKNOWN_ERROR}`,
    );
    expect(items()).toHaveLength(20);
    const failedCalls = listPage.mock.calls.length;

    // the sentinel is still in view, but nothing refetches until Retry
    await new Promise((r) => setTimeout(r, 100));
    expect(listPage.mock.calls.length).toBe(failedCalls);

    listPage.mockRestore();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(items()).toHaveLength(25));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("No more tasks")).toBeTruthy();
  });

  it("keeps showing tasks and offers a retry when a refresh fails", async () => {
    taskService.createMany(3);
    const { queryClient } = renderFeed();
    await waitFor(() => expect(items()).toHaveLength(3));

    const listPage = vi.spyOn(taskService, "listPage").mockImplementation(fail);
    await queryClient.invalidateQueries().catch(() => {});

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Couldn't refresh tasks",
    );
    expect(items()).toHaveLength(3);

    listPage.mockRestore();
    taskService.createMany(1);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(items()).toHaveLength(4));
  });
});
