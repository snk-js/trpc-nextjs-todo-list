"use client";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Component, Suspense, type ReactNode } from "react";
import { describeError } from "@/trpc/errors";

type BoundaryProps = {
  children: ReactNode;
  onReset: () => void;
  fallback: (error: unknown, retry: () => void) => ReactNode;
};

class ErrorBoundary extends Component<BoundaryProps, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  retry = () => {
    this.props.onReset();
    this.setState({ error: null });
  };
  render() {
    return this.state.error
      ? this.props.fallback(this.state.error, this.retry)
      : this.props.children;
  }
}

export function TaskFeedBoundary({ children }: { children: ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ErrorBoundary
      onReset={reset}
      fallback={(error, retry) => (
        <div role="alert">
          <p>Couldn&apos;t load tasks: {describeError(error).message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
    >
      <Suspense fallback={<p>Loading tasks…</p>}>{children}</Suspense>
    </ErrorBoundary>
  );
}
