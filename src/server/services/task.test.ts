import { afterEach, describe, expect, it, vi } from "vitest";
import { taskService } from "./task";

afterEach(() => vi.useRealTimers());

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

  it("omits descricao when not given or empty", () => {
    expect(taskService.create({ titulo: "a" })).not.toHaveProperty("descricao");
    expect(taskService.create({ titulo: "b", descricao: "" })).not.toHaveProperty("descricao");
  });

  it("lists tasks oldest first and returns a copy", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(2000);
    const later = taskService.create({ titulo: "later" });
    vi.setSystemTime(1000);
    const earlier = taskService.create({ titulo: "earlier" });

    const list = taskService.list();
    expect(list.map((t) => t.id)).toEqual([earlier.id, later.id]);

    list.pop();
    expect(taskService.list()).toHaveLength(2);
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

    it("never changes id or dataCriacao", () => {
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
    expect(created.map((t) => t.titulo)).toEqual(["Tarefa 2", "Tarefa 3", "Tarefa 4"]);
    expect(new Set(created.map((t) => t.id)).size).toBe(3);
    expect(taskService.list()).toHaveLength(4);
  });

  it("clear removes everything and returns the count", () => {
    taskService.createMany(5);
    expect(taskService.clear()).toBe(5);
    expect(taskService.list()).toEqual([]);
  });
});
