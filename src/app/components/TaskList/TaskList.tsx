import { caller } from "@/trpc/server";
import { CreateTask } from "../CreateTask/CreateTask";
import { TaskBulkActions } from "../TaskBulkActions/TaskBulkActions";
import { Pagination } from "../Pagination/Pagination";
import { TaskItem } from "../TaskItem/TaskItem";

export default async function TaskList({ page = 1 }: { page?: number } = {}) {
  // fully typed, no http roundtrips
  const { items, total, ...pageInfo } = await caller.listTasks({ page });

  return (
    <section>
      <h2>Tasks ({total})</h2>
      <CreateTask />
      <TaskBulkActions />
      <ul>
        {items.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
      <Pagination page={pageInfo.page} totalPages={pageInfo.totalPages} />
    </section>
  );
}
