import styles from "./page.module.css";
import TaskList from "./components/TaskList/TaskList";

// the task list is live data; never prerender it at build time
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <TaskList />
      </main>
    </div>
  );
}
