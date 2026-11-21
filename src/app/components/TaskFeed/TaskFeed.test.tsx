import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import { scrollToEnd } from "@/test/setup-dom";
import { CreateTask } from "../CreateTask/CreateTask";
import { TaskFeed } from "./TaskFeed";

const shownTitulos = () =>
  screen.queryAllByRole("listitem").map((li) => li.querySelector("strong")?.textContent);

describe("TaskFeed", () => {
  it("shows an empty state", async () => {
    renderWithTRPC(<TaskFeed />);
    expect(await screen.findByText("No tasks yet")).toBeTruthy();
    expect(shownTitulos()).toEqual([]);
  });

  it("loads 20 newest-first, then the next page as the end comes into view", async () => {
    taskService.createMany(45);
    renderWithTRPC(<TaskFeed />);

    await waitFor(() => expect(shownTitulos()).toHaveLength(20));
    expect(shownTitulos()[0]).toBe("Tarefa 45");
    expect(screen.queryByText("No more tasks")).toBeNull();

    scrollToEnd();
    await waitFor(() => expect(shownTitulos()).toHaveLength(40));

    scrollToEnd();
    await waitFor(() => expect(shownTitulos()).toHaveLength(45));
    expect(shownTitulos().at(-1)).toBe("Tarefa 1");
    expect(screen.getByText("No more tasks")).toBeTruthy();

    // nothing left: further scrolling fetches nothing
    scrollToEnd();
    expect(shownTitulos()).toHaveLength(45);
  });

  it("keeps all loaded pages and shows the change after a delete", async () => {
    taskService.createMany(25);
    const user = userEvent.setup();
    renderWithTRPC(<TaskFeed />);
    await waitFor(() => expect(shownTitulos()).toHaveLength(20));
    scrollToEnd();
    await waitFor(() => expect(shownTitulos()).toHaveLength(25));

    const item = screen.getAllByRole("listitem")[22]; // on page 2
    expect(within(item).getByText("Tarefa 3")).toBeTruthy();
    await user.click(within(item).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(shownTitulos()).toHaveLength(24));
    expect(shownTitulos()).not.toContain("Tarefa 3");
  });

  it("shows a newly created task at the top", async () => {
    taskService.createMany(3);
    const user = userEvent.setup();
    renderWithTRPC(
      <>
        <CreateTask />
        <TaskFeed />
      </>,
    );
    await waitFor(() => expect(shownTitulos()).toHaveLength(3));

    await user.type(screen.getByPlaceholderText("Título"), "Nova");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => expect(shownTitulos()[0]).toBe("Nova"));
  });
});
