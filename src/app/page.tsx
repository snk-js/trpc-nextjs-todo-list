import styles from "./page.module.css";
import TaskList from "./components/TaskList/TaskList";

/** Lenient: anything that isn't a positive integer falls back to page 1. */
function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page } = await searchParams;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <TaskList page={parsePage(page)} />
      </main>
    </div>
  );
}
