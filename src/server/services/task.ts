import { randomUUID } from "node:crypto";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const store = ((globalThis as { __taskStore?: Map<string, Task> }).__taskStore ??=
  new Map());

export const taskService = {
  list(): Task[] {
    return [...store.values()].sort((a, b) => a.dataCriacao - b.dataCriacao);
  },

  /**
   * One page of tasks, oldest first. A page past the end is clamped to the
   * last page, so deleting the last item on a page never shows an empty one.
   */
  listPage(page: number, pageSize: number): Paginated<Task> {
    const all = this.list();
    const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
    const current = Math.min(Math.max(1, page), totalPages);
    const start = (current - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      page: current,
      pageSize,
      total: all.length,
      totalPages,
    };
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

  /** Creates `count` numbered sample tasks, continuing from the current size. */
  createMany(count: number): Task[] {
    const start = store.size;
    return Array.from({ length: count }, (_, i) =>
      this.create({ titulo: `Tarefa ${start + i + 1}` }),
    );
  },

  /** Deletes every task; returns how many were removed. */
  clear(): number {
    const count = store.size;
    store.clear();
    return count;
  },

  delete(id: string): boolean {
    return store.delete(id);
  },
};
