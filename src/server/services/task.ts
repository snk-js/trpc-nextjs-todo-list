import { randomUUID } from "node:crypto";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
};

const store = ((globalThis as { __taskStore?: Map<string, Task> }).__taskStore ??=
  new Map());

export const taskService = {
  list(): Task[] {
    return [...store.values()].sort((a, b) => a.dataCriacao - b.dataCriacao);
  },

  create(input: { titulo: string; descricao?: string }): Task {
    const task: Task = {
      id: randomUUID(),
      titulo: input.titulo,
      ...(input.descricao ? { descricao: input.descricao } : {}),
      dataCriacao: Date.now(),
    };
    store.set(task.id, task);
    return task;
  },

  update(input: { id: string; titulo?: string; descricao?: string | null }): Task | null {
    const current = store.get(input.id);
    if (!current) return null;
    const next: Task = { ...current };
    if (input.titulo !== undefined) next.titulo = input.titulo;
    if (input.descricao === null || input.descricao === "") delete next.descricao;
    else if (input.descricao !== undefined) next.descricao = input.descricao;
    store.set(next.id, next);
    return next;
  },

  delete(id: string): boolean {
    return store.delete(id);
  },
};
