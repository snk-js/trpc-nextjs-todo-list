import { afterEach, describe, expect, it, vi } from "vitest";
import { taskService } from "@/server/services/task";
import { GET, POST } from "./route";

// The HTTP contract the client relies on, through the real route handler.

afterEach(() => vi.restoreAllMocks());

const post = (path: string, body: unknown) =>
  POST(
    new Request(`http://localhost/api/trpc/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const get = (path: string, input: unknown) =>
  GET(
    new Request(
      `http://localhost/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input))}`,
    ),
  );

describe("/api/trpc error contract", () => {
  it("returns 400 with a message per invalid field", async () => {
    const res = await post("createTask", { titulo: " ", descricao: "x".repeat(2001) });
    expect(res.status).toBe(400);
    const { error } = await res.json();
    expect(error.message).toBe("Invalid input.");
    expect(error.data).toMatchObject({
      code: "BAD_REQUEST",
      fieldErrors: {
        titulo: "Title is required.",
        descricao: "Description must be at most 2000 characters.",
      },
    });
  });

  it("reports a missing titulo as required", async () => {
    const { error } = await (await post("createTask", {})).json();
    expect(error.data.fieldErrors).toEqual({ titulo: "Title is required." });
  });

  it("keeps deliberate error messages, with fieldErrors null", async () => {
    const id = "00000000-0000-4000-8000-000000000000";
    const res = await post("deleteTask", { id });
    expect(res.status).toBe(404);
    const { error } = await res.json();
    expect(error.message).toBe(`Task ${id} not found`);
    expect(error.data).toMatchObject({ code: "NOT_FOUND", fieldErrors: null });
  });

  it("hides internals of unexpected errors and logs them on the server", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(taskService, "listPage").mockImplementation(() => {
      throw new Error("connect ECONNREFUSED postgres://admin:hunter2@db");
    });

    const res = await get("listTasks", { limit: 20 });

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("hunter2");
    expect(JSON.parse(text).error.message).toBe("Something went wrong. Please try again.");
    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0])).toContain("listTasks");
    expect(String(log.mock.calls[0][1])).toContain("hunter2");
  });

  it("doesn't log expected errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await post("createTask", {});
    expect(log).not.toHaveBeenCalled();
  });
});
