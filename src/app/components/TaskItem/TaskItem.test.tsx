import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import { TaskItem } from "./TaskItem";

function setup(input: { titulo: string; descricao?: string }) {
  const task = taskService.create(input);
  const user = userEvent.setup();
  const { invalidate } = renderWithTRPC(
    <ul>
      <TaskItem task={task} />
    </ul>,
  );
  return { task, user, invalidate };
}

const input = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;

describe("TaskItem", () => {
  it("shows titulo, descricao and dataCriacao", () => {
    const { task } = setup({ titulo: "Comprar pão", descricao: "padaria" });
    expect(screen.getByText("Comprar pão")).toBeTruthy();
    expect(screen.getByText("padaria")).toBeTruthy();
    expect(screen.getByText(new Date(task.dataCriacao).toISOString())).toBeTruthy();
  });

  it("edits titulo and descricao inline", async () => {
    const { task, user, invalidate } = setup({ titulo: "old", descricao: "old desc" });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(input("titulo").value).toBe("old");
    expect(input("descricao").value).toBe("old desc");

    await user.clear(input("titulo"));
    await user.type(input("titulo"), "new");
    await user.clear(input("descricao"));
    await user.type(input("descricao"), "new desc");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledOnce());
    expect(taskService.list()).toEqual([{ ...task, titulo: "new", descricao: "new desc" }]);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull(); // back to view mode
  });

  it("clears descricao when saved empty", async () => {
    const { user, invalidate } = setup({ titulo: "a", descricao: "remove me" });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(input("descricao"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(taskService.list()[0]).not.toHaveProperty("descricao");
  });

  it("cancel leaves the task unchanged", async () => {
    const { task, user, invalidate } = setup({ titulo: "a" });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.type(input("titulo"), "zzz");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("a")).toBeTruthy();
    expect(taskService.list()).toEqual([task]);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("keeps the form open and shows the error when the update fails", async () => {
    const { task, user, invalidate } = setup({ titulo: "a" });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    taskService.delete(task.id); // deleted elsewhere meanwhile
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(`Task ${task.id} not found`)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("deletes the task from the item", async () => {
    const { user, invalidate } = setup({ titulo: "a" });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledOnce());
    expect(taskService.list()).toEqual([]);
  });

  it("shows a field error and keeps editing when the new titulo is blank", async () => {
    const { task, user, invalidate } = setup({ titulo: "keep me" });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(input("titulo"));
    await user.type(input("titulo"), "  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Title is required.");
    expect(input("titulo").getAttribute("aria-invalid")).toBe("true");
    expect(taskService.list()).toEqual([task]);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
