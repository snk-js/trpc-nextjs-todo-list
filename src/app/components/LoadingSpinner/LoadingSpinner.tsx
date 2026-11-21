"use client";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import styles from "./LoadingSpinner.module.css";

/**
 * Centered spinner while the task list is fetching (next page, refetch after
 * a write) or any mutation is running. Waits `delayMs` before appearing so
 * fast requests don't flash it.
 */
export function LoadingSpinner({ delayMs = 150 }: { delayMs?: number }) {
  const trpc = useTRPC();
  const busy = useIsFetching(trpc.listTasks.pathFilter()) + useIsMutating() > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [busy, delayMs]);

  if (!visible) return null;
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <span className={styles.srOnly}>Loading…</span>
    </div>
  );
}
