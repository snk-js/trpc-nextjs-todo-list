"use client";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateTasks } from "@/app/hooks/useInvalidateTasks";
import { useState } from "react";
import type { Task } from "@/server/services/task";
import { DESCRICAO_MAX, TITULO_MAX } from "@/shared/task-limits";
import { useTRPC } from "@/trpc/client";
import { describeError } from "@/trpc/errors";
import { DeleteTaskButton } from "../DeleteTaskButton/DeleteTaskButton";
import { FieldError } from "../FieldError/FieldError";

export function TaskItem({ task }: { task: Task }) {
  const trpc = useTRPC();
  const invalidateTasks = useInvalidateTasks();
  const [editing, setEditing] = useState(false);
  const update = useMutation(
    trpc.updateTask.mutationOptions({
      onSuccess: () => {
        setEditing(false);
        invalidateTasks();
      },
    }),
  );

  const err = update.error ? describeError(update.error) : null;
  const tituloErrId = `titulo-error-${task.id}`;
  const descricaoErrId = `descricao-error-${task.id}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const descricao = String(data.get("descricao") ?? "").trim();
    update.mutate({
      id: task.id,
      titulo: String(data.get("titulo") ?? ""),
      descricao: descricao || null, // empty clears it
    });
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={onSubmit}>
          <input
            name="titulo"
            defaultValue={task.titulo}
            required
            maxLength={TITULO_MAX}
            autoFocus
            aria-invalid={!!err?.fieldErrors.titulo}
            aria-describedby={tituloErrId}
          />
          <FieldError id={tituloErrId} message={err?.fieldErrors.titulo} />
          <input
            name="descricao"
            defaultValue={task.descricao ?? ""}
            placeholder="Descrição (opcional)"
            maxLength={DESCRICAO_MAX}
            aria-invalid={!!err?.fieldErrors.descricao}
            aria-describedby={descricaoErrId}
          />
          <FieldError id={descricaoErrId} message={err?.fieldErrors.descricao} />
          <button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              update.reset();
              setEditing(false);
            }}
            disabled={update.isPending}
          >
            Cancel
          </button>
          {err && !Object.keys(err.fieldErrors).length && <span role="alert">{err.message}</span>}
        </form>
      </li>
    );
  }

  return (
    <li>
      <strong>{task.titulo}</strong>
      {task.descricao && <p>{task.descricao}</p>}
      <small>{new Date(task.dataCriacao).toISOString()}</small>{" "}
      <button onClick={() => setEditing(true)}>Edit</button>{" "}
      <DeleteTaskButton id={task.id} />
    </li>
  );
}
