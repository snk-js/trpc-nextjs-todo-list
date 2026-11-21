import { caller } from "@/trpc/server";
import { CreateTask } from "./CreateTask";
import { DeleteTaskButton } from "./DeleteTaskButton";

export default async function TaskList() {
  // fully typed, no http roundtrips
  const tasks = await caller.listTasks();

  return (
    <section>
      <h2>Tasks ({tasks.length})</h2>
      <CreateTask />
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.titulo}</strong>
            {task.descricao && <p>{task.descricao}</p>}
            <small>{new Date(task.dataCriacao).toISOString()}</small>{" "}
            <DeleteTaskButton id={task.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
