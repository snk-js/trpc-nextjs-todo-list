import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { taskService } from "@/server/services/task";

const titulo = z.string().trim().min(1).max(200);
const descricao = z.string().trim().max(2000);
const id = z.uuid();

export const DEFAULT_PAGE_SIZE = 10;

function notFound(taskId: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `Task ${taskId} not found` });
}

export const appRouter = createTRPCRouter({
  listTasks: baseProcedure
    .input(
      z
        .object({
          page: z.int().min(1).default(1),
          pageSize: z.int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
        })
        .default({ page: 1, pageSize: DEFAULT_PAGE_SIZE }),
    )
    .query(({ input }) => taskService.listPage(input.page, input.pageSize)),

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
