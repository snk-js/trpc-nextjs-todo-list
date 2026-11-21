import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import TaskList from "./TaskList";

describe("TaskList", () => {
  it("renders an empty list", async () => {
    renderWithTRPC(await TaskList());
    expect(screen.getByRole("heading", { name: "Tasks (0)" })).toBeTruthy();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("renders each task with Edit and Delete only", async () => {
    taskService.create({ titulo: "first" });
    taskService.create({ titulo: "second", descricao: "desc" });

    renderWithTRPC(await TaskList());

    expect(screen.getByRole("heading", { name: "Tasks (2)" })).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.querySelector("strong")?.textContent)).toEqual([
      "first",
      "second",
    ]);
    for (const li of items) {
      const buttons = within(li).getAllByRole("button").map((b) => b.textContent);
      expect(buttons).toEqual(["Edit", "Delete"]);
    }
  });

  it("shows 10 tasks per page with pagination", async () => {
    taskService.createMany(25);

    renderWithTRPC(await TaskList({ page: 3 }));

    expect(screen.getByRole("heading", { name: "Tasks (25)" })).toBeTruthy();
    const titulos = screen.getAllByRole("listitem").map((li) => li.querySelector("strong")?.textContent);
    expect(titulos).toEqual(["Tarefa 21", "Tarefa 22", "Tarefa 23", "Tarefa 24", "Tarefa 25"]);
    expect(screen.getByText("Page 3 of 3")).toBeTruthy();
  });

  it("hides pagination when everything fits on one page", async () => {
    taskService.createMany(10);
    renderWithTRPC(await TaskList());
    expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
  });
});
