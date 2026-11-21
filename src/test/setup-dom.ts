import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

export const routerRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

afterEach(() => {
  cleanup();
  routerRefresh.mockClear();
});
