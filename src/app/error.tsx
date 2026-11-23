"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main role="alert">
      <h2>Something went wrong</h2>
      {error.digest && <p>Reference: {error.digest}</p>}
      <button onClick={reset}>Try again</button>
    </main>
  );
}
