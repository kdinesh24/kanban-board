"use client";

import { type AnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";
import type { Task } from "@/types/kanban";

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  if (args.isDragging) return false;
  return true;
};

function TaskCardBase({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
    animateLayoutChanges,
    transition: {
      duration: 180,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // While dragging this card, show a subtle placeholder
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-100/50 dark:bg-neutral-800/50 opacity-30 transition-all duration-200"
      >
        <div className="px-4 py-3 opacity-0">
          <div className="text-sm font-medium leading-5">{task.title}</div>
          {task.description && (
            <div className="text-xs mt-1 line-clamp-2">{task.description}</div>
          )}
          <div className="flex items-center mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
              {task.priority}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "cursor-grab active:cursor-grabbing",
        "hover:bg-neutral-50 dark:hover:bg-neutral-800/80",
        "opacity-100 scale-100",
      ].join(" ")}
      aria-label={task.title}
    >
      <div className="text-sm font-medium leading-5 text-neutral-900 dark:text-neutral-100">
        {task.title}
      </div>
      {task.description && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
          {task.description}
        </div>
      )}
      <div className="flex items-center mt-2">
        <span
          className={[
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            task.priority === "High"
              ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              : task.priority === "Medium"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
          ].join(" ")}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
}

export default memo(TaskCardBase);
