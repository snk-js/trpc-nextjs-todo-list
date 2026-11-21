"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

export function CreateTask() {
  const trpc = useTRPC();
  const router = useRouter();
  const create = useMutation(
    trpc.createTask.mutationOptions({
      onSuccess: () => router.refresh(),
    }),
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const descricao = String(data.get("descricao") ?? "").trim();
    create.mutate(
      {
        titulo: String(data.get("titulo") ?? ""),
        ...(descricao ? { descricao } : {}),
      },
      { onSuccess: () => form.reset() },
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <input name="titulo" placeholder="Título" required maxLength={200} />
      <input
        name="descricao"
        placeholder="Descrição (opcional)"
        maxLength={2000}
      />
      <button type="submit" disabled={create.isPending}>
        {create.isPending ? "Creating…" : "Create task"}
      </button>
      {create.error && <p>{create.error.message}</p>}
    </form>
  );
}
