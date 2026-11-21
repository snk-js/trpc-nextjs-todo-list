import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import TaskList from "./TaskList";

const shownTitulos = () =>
  screen.queryAllByRole("listitem").map((li) => li.querySelector("strong")?.textContent);

describe("TaskList", () => {
  it("prefetches page 1 on the server, so it renders with data and no fetch", async () => {
    taskService.createMany(25);

    const { invalidate, queryClient } = renderWithTRPC(await TaskList());

    // synchronous: the hydrated cache already holds page 1, nothing suspends
    expect(screen.queryByText("Suspended…")).toBeNull();
    expect(shownTitulos()).toHaveLength(20);
    expect(shownTitulos()[0]).toBe("Tarefa 25");
    // one cached query, i.e. the client reused the prefetched key
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("renders each task with Edit and Delete only", async () => {
    taskService.create({ titulo: "first" });
    taskService.create({ titulo: "second", descricao: "desc" });

    renderWithTRPC(await TaskList());

    expect(shownTitulos()).toEqual(["second", "first"]);
    for (const li of screen.getAllByRole("listitem")) {
      const buttons = within(li).getAllByRole("button").map((b) => b.textContent);
      expect(buttons).toEqual(["Edit", "Delete"]);
    }
  });

  it("renders the empty state", async () => {
    renderWithTRPC(await TaskList());
    expect(screen.getByRole("heading", { name: "Tasks" })).toBeTruthy();
    expect(screen.getByText("No tasks yet")).toBeTruthy();
  });
});
