"use client";

import { useDroppable, useDndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import type { Task } from "@/types/kanban";

export default function Column({
  id,
  title,
  tasks,
  count,
  headerRight,
}: {
  id: string;
  title: string;
  tasks: Task[];
  count: number;
  headerRight?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: "column", columnId: id },
  });

  const { active } = useDndContext();
  const activeTask = active?.data.current?.task as Task | undefined;
  const isDraggingTask = active?.data.current?.type === "task";

  return (
    <div
      className={[
        "w-80 shrink-0 rounded-xl transition-all duration-200",
        "bg-neutral-50 dark:bg-neutral-900/40",
        "border border-neutral-200/60 dark:border-neutral-800/60",
        isOver && isDraggingTask ? "ring-2 ring-neutral-300 dark:ring-neutral-600 border-neutral-400 dark:border-neutral-500 bg-neutral-100/50 dark:bg-neutral-800/50" : "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold capitalize text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200">
            {count}
          </span>
        </div>
        <div className="flex items-center gap-1">{headerRight}</div>
      </div>

      {/* Body */}
      <div
        ref={setNodeRef}
        className={[
          "rounded-b-xl p-2 space-y-3 min-h-[6rem] transition-all duration-200",
          isOver && isDraggingTask
            ? "bg-neutral-100/50 dark:bg-neutral-800/50"
            : "bg-transparent",
        ].join(" ")}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          
          {/* Show preview placeholder when hovering with a task */}
          {isOver && activeTask && isDraggingTask && (
            <div className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-100/30 dark:bg-neutral-800/30 px-4 py-3 opacity-50 transition-all duration-200">
              <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 opacity-70">
                {activeTask.title}
              </div>
              {activeTask.description && (
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 opacity-70 line-clamp-2">
                  {activeTask.description}
                </div>
              )}
              <div className="flex items-center mt-2">
                <span className={[
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium opacity-70",
                  activeTask.priority === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" :
                  activeTask.priority === "Medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" :
                  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                ].join(" ")}>
                  {activeTask.priority}
                </span>
              </div>
            </div>
          )}
          
          {tasks.length === 0 && !isOver && (
            <div className="flex items-center justify-center h-20 text-neutral-400 dark:text-neutral-500 text-sm">
              No tasks yet
            </div>
          )}
          {isOver && tasks.length === 0 && !activeTask && (
            <div className="flex items-center justify-center h-20 text-neutral-500 dark:text-neutral-400 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg">
              Drop task here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
