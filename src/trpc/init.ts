import { initTRPC } from "@trpc/server";
import { cache } from "react";

export const createTRPCContext = cache(async () => {
  return { userId: null as string | null };
});

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/** Field name -> first message, from Zod (or any Standard Schema) issues. */
function toFieldErrors(issues: unknown[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues as { path?: unknown[]; message?: string }[]) {
    const head = issue.path?.[0];
    const key = typeof head === "object" && head ? (head as { key: unknown }).key : head;
    if (key !== undefined && !(String(key) in out)) out[String(key)] = issue.message ?? "Invalid value.";
  }
  return out;
}

const isDev = process.env.NODE_ENV === "development";

const t = initTRPC.context<Context>().create({
  isDev,
  /**
   * The error contract the client relies on:
   * - input validation: message "Invalid input.", data.fieldErrors per field
   * - unexpected errors: a generic message and no stack outside development,
   *   so internals (SQL, connection strings) never reach the browser
   * - deliberate TRPCErrors (NOT_FOUND, ...) keep their message
   */
  errorFormatter({ shape, error }) {
    const issues = (error.cause as { issues?: unknown } | undefined)?.issues;
    const fieldErrors =
      error.code === "BAD_REQUEST" && Array.isArray(issues) ? toFieldErrors(issues) : null;
    const hideInternals = error.code === "INTERNAL_SERVER_ERROR" && !isDev;
    return {
      ...shape,
      message: fieldErrors
        ? "Invalid input."
        : hideInternals
          ? "Something went wrong. Please try again."
          : shape.message,
      data: { ...shape.data, fieldErrors },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
