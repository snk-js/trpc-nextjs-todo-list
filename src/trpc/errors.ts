import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "./routers/_app";

export type DescribedError = {
  // safe to show in the UI for the user
  message: string;
  // per field validation
  fieldErrors: Record<string, string>;
};

export const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";
export const UNKNOWN_ERROR = "Something went wrong. Please try again.";

export function describeError(error: unknown): DescribedError {
  if (error instanceof TRPCClientError) {
    const { data } = error as TRPCClientError<AppRouter>;
    if (!data) return { message: NETWORK_ERROR, fieldErrors: {} };
    return { message: error.message, fieldErrors: data.fieldErrors ?? {} };
  }
  return { message: UNKNOWN_ERROR, fieldErrors: {} };
}
