"use client";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateTasks } from "@/app/hooks/useInvalidateTasks";
import { useTRPC } from "@/trpc/client";

export function DeleteTaskButton({ id }: { id: string }) {
  const trpc = useTRPC();
  const invalidateTasks = useInvalidateTasks();
  const remove = useMutation(
    trpc.deleteTask.mutationOptions({ onSuccess: () => invalidateTasks() }),
  );

  return (
    <>
      <button onClick={() => remove.mutate({ id })} disabled={remove.isPending}>
        {remove.isPending ? "Deleting…" : "Delete"}
      </button>
      {remove.error && <span>{remove.error.message}</span>}
    </>
  );
}
