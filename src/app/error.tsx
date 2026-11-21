"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // this is the last in instance of the error and it would not be in prod
  // if one existed
  return (
    <main role="alert">
      <h2>Something went wrong</h2>
      {error.digest && <p>Reference: {error.digest}</p>}
      <button onClick={reset}>Try again</button>
    </main>
  );
}
