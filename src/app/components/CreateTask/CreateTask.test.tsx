import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import { CreateTask } from "./CreateTask";

describe("CreateTask", () => {
  it("creates a task with titulo and descricao, then resets the form", async () => {
    const user = userEvent.setup();
    const { invalidate } = renderWithTRPC(<CreateTask />);

    await user.type(screen.getByPlaceholderText("Título"), "Comprar pão");
    await user.type(screen.getByPlaceholderText("Descrição (opcional)"), "padaria");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledOnce());
    expect(taskService.list()).toMatchObject([{ titulo: "Comprar pão", descricao: "padaria" }]);
    await waitFor(() =>
      expect((screen.getByPlaceholderText("Título") as HTMLInputElement).value).toBe(""),
    );
  });

  it("creates a task without descricao", async () => {
    const user = userEvent.setup();
    const { invalidate } = renderWithTRPC(<CreateTask />);

    await user.type(screen.getByPlaceholderText("Título"), "Só título");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(taskService.list()[0]).not.toHaveProperty("descricao");
  });

  it("shows the server error for a blank titulo and creates nothing", async () => {
    const user = userEvent.setup();
    const { invalidate } = renderWithTRPC(<CreateTask />);

    // spaces pass the browser's `required` check but fail server validation
    await user.type(screen.getByPlaceholderText("Título"), "   ");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText(/too_small/)).toBeTruthy();
    expect(taskService.list()).toEqual([]);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
