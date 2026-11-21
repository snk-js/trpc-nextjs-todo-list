"use client";
import { useMutation } from "@tanstack/react-query";
import { useInvalidateTasks } from "@/app/hooks/useInvalidateTasks";
import { useState } from "react";
import type { Task } from "@/server/services/task";
import { useTRPC } from "@/trpc/client";
import { DeleteTaskButton } from "../DeleteTaskButton/DeleteTaskButton";

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
          <input name="titulo" defaultValue={task.titulo} required maxLength={200} autoFocus />
          <input
            name="descricao"
            defaultValue={task.descricao ?? ""}
            placeholder="Descrição (opcional)"
            maxLength={2000}
          />
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
          {update.error && <span>{update.error.message}</span>}
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
