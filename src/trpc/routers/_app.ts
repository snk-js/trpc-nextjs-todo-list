import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { CURSOR_PATTERN, taskService } from "@/server/services/task";
import { descricao, titulo } from "@/shared/task-schema";

const id = z.uuid();

function notFound(taskId: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `Task ${taskId} not found` });
}

export const appRouter = createTRPCRouter({
  listTasks: baseProcedure
    .input(
      z.object({
        // filled in by tRPC from the infinite query's page param; never pass it yourself
        cursor: z.string().regex(CURSOR_PATTERN).nullish(),
        limit: z.int().min(1).max(50).default(20),
      }),
    )
    .query(({ input }) => taskService.listPage(input)),

  createTask: baseProcedure
    .input(z.object({ titulo, descricao: descricao.optional() }))
    .mutation(({ input }) => taskService.create(input)),

  updateTask: baseProcedure
    .input(z.object({ id, titulo: titulo.optional(), descricao: descricao.nullable().optional() }))
    .mutation(({ input }) => taskService.update(input) ?? notFound(input.id)),

  deleteTask: baseProcedure
    .input(z.object({ id }))
    .mutation(({ input }) => {
      if (!taskService.delete(input.id)) notFound(input.id);
      return { id: input.id };
    }),

  addSampleTasks: baseProcedure
    .input(z.object({ count: z.int().min(1).max(100) }))
    .mutation(({ input }) => ({ created: taskService.createMany(input.count).length })),

  clearTasks: baseProcedure.mutation(() => ({ deleted: taskService.clear() })),
});

export type AppRouter = typeof appRouter;
