import { randomUUID } from "node:crypto";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
};

export type TaskPage = { items: Task[]; nextCursor: string | null };

type Store = { tasks: Map<string, Task>; lastCreated: number };

const store = ((globalThis as { __taskDb?: Store }).__taskDb ??= {
  tasks: new Map(),
  lastCreated: 0,
});

/** Newest first; id breaks ties so the order is total, as keyset pagination requires. */
function newestFirst(a: Task, b: Task): number {
  return b.dataCriacao - a.dataCriacao || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}

/**
 * The cursor is the sort key of the last task on the previous page, and the
 * next page starts strictly after it. Unlike an offset, it doesn't skip or
 * repeat rows when tasks are created or deleted while scrolling, and it still
 * works if that last task was deleted.
 */
const cursorOf = (t: Task) => `${t.dataCriacao}_${t.id}`;
export const CURSOR_PATTERN = /^(\d+)_([0-9a-f-]{36})$/;

function parseCursor(cursor: string): Pick<Task, "dataCriacao" | "id"> {
  const m = CURSOR_PATTERN.exec(cursor);
  if (!m) throw new Error(`Invalid cursor: ${cursor}`);
  return { dataCriacao: Number(m[1]), id: m[2] };
}

export const taskService = {
  /** Every task, newest first. */
  list(): Task[] {
    return [...store.tasks.values()].sort(newestFirst);
  },

  /** Up to `limit` tasks after `cursor` (from the start when null), newest first. */
  listPage({ cursor, limit }: { cursor?: string | null; limit: number }): TaskPage {
    const all = this.list();
    let start = 0;
    if (cursor) {
      const after = parseCursor(cursor) as Task;
      start = all.findIndex((t) => newestFirst(after, t) < 0);
      if (start === -1) start = all.length;
    }
    // read one extra to learn whether another page exists, without counting
    const rows = all.slice(start, start + limit + 1);
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    return { items: rows, nextCursor: hasMore ? cursorOf(rows[rows.length - 1]) : null };
  },

  create(input: { titulo: string; descricao?: string }): Task {
    // strictly increasing, so tasks created in the same millisecond (e.g. by
    // createMany) keep their creation order
    const dataCriacao = Math.max(Date.now(), store.lastCreated + 1);
    store.lastCreated = dataCriacao;
    const task: Task = {
      id: randomUUID(),
      titulo: input.titulo,
      ...(input.descricao ? { descricao: input.descricao } : {}),
      dataCriacao,
    };
    store.tasks.set(task.id, task);
    return task;
  },

  update(input: { id: string; titulo?: string; descricao?: string | null }): Task | null {
    const current = store.tasks.get(input.id);
    if (!current) return null;
    const next: Task = { ...current };
    if (input.titulo !== undefined) next.titulo = input.titulo;
    if (input.descricao === null || input.descricao === "") delete next.descricao;
    else if (input.descricao !== undefined) next.descricao = input.descricao;
    store.tasks.set(next.id, next);
    return next;
  },

  /** Creates `count` numbered sample tasks, continuing from the current size. */
  createMany(count: number): Task[] {
    const start = store.tasks.size;
    return Array.from({ length: count }, (_, i) =>
      this.create({ titulo: `Tarefa ${start + i + 1}` }),
    );
  },

  /** Deletes every task; returns how many were removed. */
  clear(): number {
    const count = store.tasks.size;
    store.tasks.clear();
    store.lastCreated = 0;
    return count;
  },

  delete(id: string): boolean {
    return store.tasks.delete(id);
  },
};
