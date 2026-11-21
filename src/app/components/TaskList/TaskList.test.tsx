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
});
