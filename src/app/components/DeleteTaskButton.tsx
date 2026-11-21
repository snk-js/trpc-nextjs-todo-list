"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

export function DeleteTaskButton({ id }: { id: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const remove = useMutation(
    trpc.deleteTask.mutationOptions({ onSuccess: () => router.refresh() }),
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
