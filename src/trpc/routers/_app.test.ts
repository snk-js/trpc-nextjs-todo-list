import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { createCallerFactory } from "../init";
import { appRouter } from "./_app";

const caller = createCallerFactory(appRouter)({ userId: null });
const unknownId = "00000000-0000-4000-8000-000000000000";

async function errorCode(promise: Promise<unknown>) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(TRPCError);
  return (err as TRPCError).code;
}

describe("appRouter", () => {
  describe("createTask", () => {
    it("creates and lists a task", async () => {
      const task = await caller.createTask({ titulo: "  Comprar pão  ", descricao: "padaria" });
      expect(task.titulo).toBe("Comprar pão"); // trimmed
      expect(typeof task.dataCriacao).toBe("number");
      expect(await caller.listTasks()).toEqual([task]);
    });

    it("rejects a missing, blank or too long titulo", async () => {
      // @ts-expect-error titulo is required
      expect(await errorCode(caller.createTask({}))).toBe("BAD_REQUEST");
      expect(await errorCode(caller.createTask({ titulo: "   " }))).toBe("BAD_REQUEST");
      expect(await errorCode(caller.createTask({ titulo: "x".repeat(201) }))).toBe("BAD_REQUEST");
    });

    it("rejects a too long descricao", async () => {
      const input = { titulo: "a", descricao: "x".repeat(2001) };
      expect(await errorCode(caller.createTask(input))).toBe("BAD_REQUEST");
    });

    it("ignores client-supplied id and dataCriacao", async () => {
      const task = await caller.createTask({
        titulo: "a",
        // @ts-expect-error not part of the input
        id: unknownId,
        dataCriacao: 1,
      });
      expect(task.id).not.toBe(unknownId);
      expect(task.dataCriacao).not.toBe(1);
    });
  });

  describe("updateTask", () => {
    it("updates titulo and clears descricao", async () => {
      const task = await caller.createTask({ titulo: "old", descricao: "x" });
      const updated = await caller.updateTask({ id: task.id, titulo: "new", descricao: null });
      expect(updated).toEqual({ id: task.id, titulo: "new", dataCriacao: task.dataCriacao });
    });

    it("returns NOT_FOUND for an unknown id", async () => {
      expect(await errorCode(caller.updateTask({ id: unknownId, titulo: "x" }))).toBe("NOT_FOUND");
    });

    it("rejects a non-uuid id and a blank titulo", async () => {
      const task = await caller.createTask({ titulo: "a" });
      expect(await errorCode(caller.updateTask({ id: "nope" }))).toBe("BAD_REQUEST");
      expect(await errorCode(caller.updateTask({ id: task.id, titulo: " " }))).toBe("BAD_REQUEST");
    });
  });

  describe("deleteTask", () => {
    it("deletes a task", async () => {
      const task = await caller.createTask({ titulo: "a" });
      expect(await caller.deleteTask({ id: task.id })).toEqual({ id: task.id });
      expect(await caller.listTasks()).toEqual([]);
    });

    it("returns NOT_FOUND for an unknown id", async () => {
      expect(await errorCode(caller.deleteTask({ id: unknownId }))).toBe("NOT_FOUND");
    });
  });

  describe("addSampleTasks", () => {
    it("adds the requested number of tasks", async () => {
      expect(await caller.addSampleTasks({ count: 50 })).toEqual({ created: 50 });
      expect(await caller.listTasks()).toHaveLength(50);
    });

    it("rejects counts outside 1..100 and non-integers", async () => {
      for (const count of [0, 101, 1.5]) {
        expect(await errorCode(caller.addSampleTasks({ count }))).toBe("BAD_REQUEST");
      }
    });
  });

  describe("clearTasks", () => {
    it("deletes all tasks and reports how many", async () => {
      await caller.addSampleTasks({ count: 3 });
      expect(await caller.clearTasks()).toEqual({ deleted: 3 });
      expect(await caller.listTasks()).toEqual([]);
    });
  });
});
