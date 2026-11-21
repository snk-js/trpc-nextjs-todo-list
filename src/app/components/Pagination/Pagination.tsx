import Link from "next/link";

/** Prev/next links driven by the `?page=` search param. Renders nothing for a single page. */
export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination">
      {page > 1 ? <Link href={`?page=${page - 1}`}>← Previous</Link> : <span>← Previous</span>}{" "}
      <span>
        Page {page} of {totalPages}
      </span>{" "}
      {page < totalPages ? (
        <Link href={`?page=${page + 1}`}>Next →</Link>
      ) : (
        <span>Next →</span>
      )}
    </nav>
  );
}
