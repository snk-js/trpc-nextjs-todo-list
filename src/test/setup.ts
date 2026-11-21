import { beforeEach } from "vitest";
import type { Task } from "@/server/services/task";

// the in-memory store lives on globalThis; empty it so tests don't leak into each other
beforeEach(() => {
  (globalThis as { __taskStore?: Map<string, Task> }).__taskStore?.clear();
});
