import styles from "./page.module.css";
import TrpcDemo from "./components/TrpcDemo";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <TrpcDemo />
      </main>
      <footer className={styles.footer}>something</footer>
    </div>
  );
}
