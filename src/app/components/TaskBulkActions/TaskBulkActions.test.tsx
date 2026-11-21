import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import { TaskBulkActions } from "./TaskBulkActions";

describe("TaskBulkActions", () => {
  it("adds 50 numbered tasks, continuing from the existing ones", async () => {
    taskService.create({ titulo: "existing" });
    const { invalidate } = renderWithTRPC(<TaskBulkActions />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Add 50 tasks" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledOnce());
    const titulos = taskService.list().map((t) => t.titulo);
    expect(titulos).toHaveLength(51);
    expect(titulos.slice(0, 2)).toEqual(["Tarefa 51", "Tarefa 50"]);
    expect(titulos.at(-1)).toBe("existing");
  });

  it("clears all tasks", async () => {
    taskService.createMany(3);
    const { invalidate } = renderWithTRPC(<TaskBulkActions />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Clear all" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledOnce());
    expect(taskService.list()).toEqual([]);
  });
});
