import { afterEach, describe, expect, it, vi } from "vitest";
import { taskService } from "./task";

afterEach(() => vi.useRealTimers());

const titulos = (tasks: { titulo: string }[]) => tasks.map((t) => t.titulo);

describe("taskService", () => {
  it("creates a task with a generated id and creation timestamp", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-02T03:04:05Z"));

    const task = taskService.create({ titulo: "Comprar pão", descricao: "padaria" });

    expect(task).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      titulo: "Comprar pão",
      descricao: "padaria",
      dataCriacao: Date.parse("2026-01-02T03:04:05Z"),
    });
  });

  it("generates unique ids", () => {
    const a = taskService.create({ titulo: "a" });
    const b = taskService.create({ titulo: "b" });
    expect(a.id).not.toBe(b.id);
  });

  it("gives tasks created in the same millisecond increasing timestamps", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1000);
    const [a, b, c] = taskService.createMany(3);
    expect([a.dataCriacao, b.dataCriacao, c.dataCriacao]).toEqual([1000, 1001, 1002]);
  });

  it("omits descricao when not given or empty", () => {
    expect(taskService.create({ titulo: "a" })).not.toHaveProperty("descricao");
    expect(taskService.create({ titulo: "b", descricao: "" })).not.toHaveProperty("descricao");
  });

  it("lists tasks newest first and returns a copy", () => {
    taskService.create({ titulo: "older" });
    taskService.create({ titulo: "newer" });

    const list = taskService.list();
    expect(titulos(list)).toEqual(["newer", "older"]);

    list.pop();
    expect(taskService.list()).toHaveLength(2);
  });

  describe("listPage", () => {
    it("returns the first page and a cursor when more remain", () => {
      taskService.createMany(5);
      const page = taskService.listPage({ limit: 2 });
      expect(titulos(page.items)).toEqual(["Tarefa 5", "Tarefa 4"]);
      expect(page.nextCursor).toEqual(expect.any(String));
    });

    it("returns a null cursor when everything fits, including exactly `limit`", () => {
      taskService.createMany(2);
      expect(taskService.listPage({ limit: 2 }).nextCursor).toBeNull();
      expect(taskService.listPage({ limit: 3 }).nextCursor).toBeNull();
    });

    it("walks every task exactly once across pages", () => {
      taskService.createMany(7);
      const seen: string[] = [];
      let cursor: string | null = null;
      do {
        const page = taskService.listPage({ cursor, limit: 3 });
        seen.push(...titulos(page.items));
        cursor = page.nextCursor;
      } while (cursor);
      expect(seen).toEqual(titulos(taskService.list()));
      expect(seen).toHaveLength(7);
    });

    it("doesn't repeat or skip rows when tasks are created while scrolling", () => {
      taskService.createMany(4);
      const first = taskService.listPage({ limit: 2 });
      taskService.createMany(3); // newer tasks land at the top, before page 1
      const second = taskService.listPage({ cursor: first.nextCursor, limit: 2 });
      expect(titulos(first.items)).toEqual(["Tarefa 4", "Tarefa 3"]);
      expect(titulos(second.items)).toEqual(["Tarefa 2", "Tarefa 1"]);
      expect(second.nextCursor).toBeNull();
    });

    it("still works when the cursor's task was deleted", () => {
      taskService.createMany(4);
      const first = taskService.listPage({ limit: 2 });
      taskService.delete(first.items[1].id);
      const second = taskService.listPage({ cursor: first.nextCursor, limit: 2 });
      expect(titulos(second.items)).toEqual(["Tarefa 2", "Tarefa 1"]);
    });

    it("returns nothing past the end", () => {
      taskService.createMany(2);
      const cursor = `1_${"0".repeat(8)}-0000-4000-8000-${"0".repeat(12)}`; // older than everything
      expect(taskService.listPage({ cursor, limit: 5 })).toEqual({ items: [], nextCursor: null });
    });
  });

  describe("update", () => {
    it("changes only the given fields", () => {
      const task = taskService.create({ titulo: "old", descricao: "keep" });
      const updated = taskService.update({ id: task.id, titulo: "new" });
      expect(updated).toEqual({ ...task, titulo: "new" });
      expect(taskService.list()).toEqual([updated]);
    });

    it("clears descricao with null or empty string", () => {
      const a = taskService.create({ titulo: "a", descricao: "x" });
      const b = taskService.create({ titulo: "b", descricao: "y" });
      expect(taskService.update({ id: a.id, descricao: null })).not.toHaveProperty("descricao");
      expect(taskService.update({ id: b.id, descricao: "" })).not.toHaveProperty("descricao");
    });

    it("never changes id or dataCriacao, so the task keeps its place", () => {
      const task = taskService.create({ titulo: "a" });
      const updated = taskService.update({ id: task.id, titulo: "b", descricao: "c" });
      expect(updated?.id).toBe(task.id);
      expect(updated?.dataCriacao).toBe(task.dataCriacao);
    });

    it("returns null for an unknown id", () => {
      expect(taskService.update({ id: "missing", titulo: "x" })).toBeNull();
    });
  });

  describe("delete", () => {
    it("removes the task", () => {
      const keep = taskService.create({ titulo: "keep" });
      const gone = taskService.create({ titulo: "gone" });
      expect(taskService.delete(gone.id)).toBe(true);
      expect(taskService.list()).toEqual([keep]);
    });

    it("returns false for an unknown id", () => {
      expect(taskService.delete("missing")).toBe(false);
    });
  });

  it("createMany adds numbered tasks with unique ids", () => {
    taskService.create({ titulo: "existing" });
    const created = taskService.createMany(3);
    expect(titulos(created)).toEqual(["Tarefa 2", "Tarefa 3", "Tarefa 4"]);
    expect(new Set(created.map((t) => t.id)).size).toBe(3);
    expect(taskService.list()).toHaveLength(4);
  });

  it("clear removes everything and returns the count", () => {
    taskService.createMany(5);
    expect(taskService.clear()).toBe(5);
    expect(taskService.list()).toEqual([]);
  });
});
