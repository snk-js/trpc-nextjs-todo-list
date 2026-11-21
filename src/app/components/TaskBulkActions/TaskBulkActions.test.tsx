import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import { routerRefresh } from "@/test/setup-dom";
import { TaskBulkActions } from "./TaskBulkActions";

describe("TaskBulkActions", () => {
  it("adds 50 numbered tasks, continuing from the existing ones", async () => {
    taskService.create({ titulo: "existing" });
    renderWithTRPC(<TaskBulkActions />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Add 50 tasks" }));

    await waitFor(() => expect(routerRefresh).toHaveBeenCalledOnce());
    const titulos = taskService.list().map((t) => t.titulo);
    expect(titulos).toHaveLength(51);
    expect(titulos.slice(1, 3)).toEqual(["Tarefa 2", "Tarefa 3"]);
    expect(titulos.at(-1)).toBe("Tarefa 51");
  });

  it("clears all tasks", async () => {
    taskService.createMany(3);
    renderWithTRPC(<TaskBulkActions />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Clear all" }));

    await waitFor(() => expect(routerRefresh).toHaveBeenCalledOnce());
    expect(taskService.list()).toEqual([]);
  });
});
