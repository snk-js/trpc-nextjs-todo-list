"use client";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateTasks } from "@/app/hooks/useInvalidateTasks";
import { useTRPC } from "@/trpc/client";

export function TaskBulkActions() {
  const trpc = useTRPC();
  const invalidateTasks = useInvalidateTasks();
  const onSuccess = () => invalidateTasks();
  const add = useMutation(trpc.addSampleTasks.mutationOptions({ onSuccess }));
  const clear = useMutation(trpc.clearTasks.mutationOptions({ onSuccess }));
  const busy = add.isPending || clear.isPending;
  const error = add.error ?? clear.error;

  return (
    <div>
      <button onClick={() => add.mutate({ count: 50 })} disabled={busy}>
        {add.isPending ? "Adding…" : "Add 50 tasks"}
      </button>{" "}
      <button onClick={() => clear.mutate()} disabled={busy}>
        {clear.isPending ? "Clearing…" : "Clear all"}
      </button>
      {error && <p>{error.message}</p>}
    </div>
  );
}
