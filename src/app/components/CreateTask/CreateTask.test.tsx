import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { httpBatchLink } from "@trpc/client";
import { describe, expect, it, vi } from "vitest";
import { taskService } from "@/server/services/task";
import { renderWithTRPC } from "@/test/render";
import { NETWORK_ERROR, UNKNOWN_ERROR } from "@/trpc/errors";
import { CreateTask } from "./CreateTask";

describe("CreateTask", () => {
  it("creates a task with titulo and descricao, then resets the form", async () => {
    const user = userEvent.setup();
    const { invalidate } = renderWithTRPC(<CreateTask />);

    await user.type(screen.getByPlaceholderText("Título"), "Comprar pão");
    await user.type(
      screen.getByPlaceholderText("Descrição (opcional)"),
      "padaria",
    );
    await user.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledOnce());
    expect(taskService.list()).toMatchObject([
      { titulo: "Comprar pão", descricao: "padaria" },
    ]);
    await waitFor(() =>
      expect(
        (screen.getByPlaceholderText("Título") as HTMLInputElement).value,
      ).toBe(""),
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

  it("shows the server's message next to the field for a blank titulo", async () => {
    const user = userEvent.setup();
    const { invalidate } = renderWithTRPC(<CreateTask />);

    await user.type(screen.getByPlaceholderText("Título"), "   ");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Title is required.",
    );
    const field = screen.getByPlaceholderText("Título");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe(
      screen.getByRole("alert").id,
    );
    expect(taskService.list()).toEqual([]);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("shows a friendly message when the server can't be reached", async () => {
    const user = userEvent.setup();
    renderWithTRPC(<CreateTask />, {
      links: [
        httpBatchLink({
          url: "http://localhost/api/trpc",
          fetch: () => Promise.reject(new TypeError("Failed to fetch")),
        }),
      ],
    });

    await user.type(screen.getByPlaceholderText("Título"), "x");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect((await screen.findByRole("alert")).textContent).toBe(NETWORK_ERROR);
  });

  it("shows a generic message, not internals, for an unexpected server error", async () => {
    vi.spyOn(taskService, "create").mockImplementation(() => {
      throw new Error("connect ECONNREFUSED postgres://admin:hunter2@db");
    });
    const user = userEvent.setup();
    renderWithTRPC(<CreateTask />);

    await user.type(screen.getByPlaceholderText("Título"), "x");
    await user.click(screen.getByRole("button", { name: "Create task" }));

    expect((await screen.findByRole("alert")).textContent).toBe(UNKNOWN_ERROR);
    vi.restoreAllMocks();
  });
});
