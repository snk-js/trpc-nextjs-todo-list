"use client";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateTasks } from "@/app/hooks/useInvalidateTasks";
import { DESCRICAO_MAX, TITULO_MAX } from "@/shared/task-limits";
import { useTRPC } from "@/trpc/client";
import { describeError } from "@/trpc/errors";
import { FieldError } from "../FieldError/FieldError";

export function CreateTask() {
  const trpc = useTRPC();
  const invalidateTasks = useInvalidateTasks();
  const create = useMutation(
    trpc.createTask.mutationOptions({
      onSuccess: () => invalidateTasks(),
    }),
  );

  const err = create.error ? describeError(create.error) : null;

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
      <input
        name="titulo"
        placeholder="Título"
        required
        maxLength={TITULO_MAX}
        aria-invalid={!!err?.fieldErrors.titulo}
        aria-describedby="create-titulo-error"
      />
      <FieldError id="create-titulo-error" message={err?.fieldErrors.titulo} />
      <input
        name="descricao"
        placeholder="Descrição (opcional)"
        maxLength={DESCRICAO_MAX}
        aria-invalid={!!err?.fieldErrors.descricao}
        aria-describedby="create-descricao-error"
      />
      <button type="submit" disabled={create.isPending}>
        {create.isPending ? "Creating…" : "Create task"}
      </button>
      <FieldError id="create-descricao-error" message={err?.fieldErrors.descricao} />
      {err && !Object.keys(err.fieldErrors).length && <p role="alert">{err.message}</p>}
    </form>
  );
}
