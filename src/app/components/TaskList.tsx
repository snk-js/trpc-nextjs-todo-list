import { caller } from "@/trpc/server";
import { CreateTask } from "./CreateTask";
import { TaskItem } from "./TaskItem";

export default async function TaskList() {
  // fully typed, no http roundtrips
  const tasks = await caller.listTasks();

  return (
    <section>
      <h2>Tasks ({tasks.length})</h2>
      <CreateTask />
      <ul>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </section>
  );
}
