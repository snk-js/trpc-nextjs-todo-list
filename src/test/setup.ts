import { beforeEach } from "vitest";
import { taskService } from "@/server/services/task";

// the in-memory store lives on globalThis; empty it so tests don't leak into each other
beforeEach(() => {
  taskService.clear();
});
