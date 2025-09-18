// components/KanbanBoard.tsx
"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  DragOverlay,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useEffect, useMemo, useState } from "react";
import { GripVertical, Search, Filter as FilterIcon, Plus, CircleCheck, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import Column from "./Column";
import TaskOverlay from "./TaskOverlay";
import type { Task, Column as ColumnType, Priority } from "@/types/kanban";

// Columns
const initialColumns: ColumnType[] = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

// Tasks
const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Integrate Stripe payment gateway",
    description: "Connect checkout and test webhooks.",
    priority: "High",
    progress: 10,
    columnId: "backlog",
  },
  {
    id: "t2",
    title: "Dark mode toggle implementation",
    description: "Add theme switcher and persist preference.",
    priority: "High",
    progress: 40,
    columnId: "in-progress",
  },
  {
    id: "t3",
    title: "Set up CI/CD pipeline",
    description: "CI with checks, CD to Vercel.",
    priority: "Medium",
    progress: 100,
    columnId: "done",
  },
];

type BoardState = {
  columns: ColumnType[];
  tasksByColumn: Record<string, Task[]>;
};

function toTasksByColumn(cols: ColumnType[], tasks: Task[]): Record<string, Task[]> {
  const map: Record<string, Task[]> = {};
  cols.forEach((c) => (map[c.id] = []));
  tasks.forEach((t) => {
    if (!map[t.columnId]) map[t.columnId] = [];
    map[t.columnId].push({ ...t });
  });
  return map;
}

// Top tabs
function Tabs() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm">Board</Button>
      <Button variant="ghost" size="sm">List</Button>
      <Button variant="ghost" size="sm">Table</Button>
    </div>
  );
}

type Filters = {
  search: string;
  columns: Record<string, boolean>;
  priorities: Record<Priority, boolean>;
  minProgress?: number;
  maxProgress?: number;
};

function defaultFilters(columnList: ColumnType[]): Filters {
  return {
    search: "",
    columns: Object.fromEntries(columnList.map((c) => [c.id, true])) as Record<string, boolean>,
    priorities: { High: true, Medium: true, Low: true },
    minProgress: undefined,
    maxProgress: undefined,
  };
}

function matchesFilters(task: Task, f: Filters) {
  const q = f.search.trim().toLowerCase();
  const t = `${task.title} ${task.description ?? ""}`.toLowerCase();
  const inSearch = q.length ? t.includes(q) : true;
  const inColumns = f.columns[task.columnId] ?? false;
  const pr = task.priority ?? "Medium";
  const inPriority = f.priorities[pr];
  const inMin = f.minProgress == null ? true : (task.progress ?? 0) >= f.minProgress;
  const inMax = f.maxProgress == null ? true : (task.progress ?? 0) <= f.maxProgress;
  return inSearch && inColumns && inPriority && inMin && inMax;
}

// Column overlay during drag
function ColumnOverlay({ column }: { column: ColumnType | null }) {
  if (!column) return null;
  return (
    <div className="w-80 select-none">
      <div className="rounded-xl border bg-white dark:bg-neutral-900 shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-3">
        <div className="text-sm font-semibold capitalize">{column.title}</div>
        <div className="mt-2 h-20 rounded-md bg-neutral-100/80 dark:bg-neutral-800/80" />
      </div>
    </div>
  );
}

// Sortable wrapper for entire column with header actions
function DraggableColumn({
  column,
  tasks,
  activeColumnId,
  onOpenAddTask,
}: {
  column: ColumnType;
  tasks: Task[];
  activeColumnId: string | null;
  onOpenAddTask: (colId: string) => void;
}) {
  const animateLayoutChanges: AnimateLayoutChanges = () => false;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `col-${column.id}`,
    data: { type: "column-sortable", columnId: column.id },
    animateLayoutChanges,
    transition: {
      duration: 180,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    willChange: "transform",
  };

  const isActive = activeColumnId === column.id;

  const headerRight = (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onOpenAddTask(column.id)}
        aria-label={`Add task to ${column.title}`}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        ref={setActivatorNodeRef as any}
        {...attributes}
        {...listeners}
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 cursor-grab active:cursor-grabbing"
        aria-label={`Reorder ${column.title}`}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={["relative touch-none", isActive ? "opacity-0" : "opacity-100"].join(" ")}
    >
      <Column id={column.id} title={column.title} tasks={tasks} headerRight={headerRight} />
    </div>
  );
}

export default function KanbanBoard() {
  const [board, setBoard] = useState<BoardState>({
    columns: initialColumns,
    tasksByColumn: toTasksByColumn(initialColumns, initialTasks),
  });

  const [filters, setFilters] = useState<Filters>(() => defaultFilters(initialColumns));
  const [showFilter, setShowFilter] = useState(false);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);

  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogCol, setTaskDialogCol] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");

  // Board dialog
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [boardFirstTask, setBoardFirstTask] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Collision
  const collisionDetection = (args: any) => {
    const pointer = pointerWithin(args);
    return pointer.length ? pointer : rectIntersection(args);
  };

  const columnSortableIds = useMemo(
    () => board.columns.map((c) => `col-${c.id}`),
    [board.columns]
  );

  // Filters
  const filteredTasksByColumn = useMemo(() => {
    const out: Record<string, Task[]> = {};
    for (const col of board.columns) {
      const list = board.tasksByColumn[col.id] ?? [];
      out[col.id] = list.filter((t) => matchesFilters(t, filters));
    }
    return out;
  }, [board.tasksByColumn, board.columns, filters]);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setFilters((f) => ({ ...f, search: value }));
  }

  function toggleColumnFilter(id: string) {
    setFilters((f) => ({ ...f, columns: { ...f.columns, [id]: !f.columns[id] } }));
  }
  function togglePriorityFilter(p: Priority) {
    setFilters((f) => ({ ...f, priorities: { ...f.priorities, [p]: !f.priorities[p] } }));
  }

  // Column/task helpers
  function createColumn(id: string, title: string) {
    setBoard((prev) => ({
      columns: [...prev.columns, { id, title }],
      tasksByColumn: { ...prev.tasksByColumn, [id]: [] },
    }));
    setFilters((f) => ({
      ...f,
      columns: { ...f.columns, [id]: true },
    }));
  }

  function addTask(colId: string, title: string) {
    const newId = `t-${Math.random().toString(36).slice(2, 8)}`;
    const newTask: Task = {
      id: newId,
      title,
      description: "",
      priority: "Medium",
      progress: 0,
      columnId: colId,
    };
    setBoard((prev) => ({
      columns: prev.columns,
      tasksByColumn: {
        ...prev.tasksByColumn,
        [colId]: [...(prev.tasksByColumn[colId] ?? []), newTask],
      },
    }));
  }

  // Add task dialog
  function openTaskDialog(colId: string) {
    setTaskDialogCol(colId);
    setTaskTitle("");
    setTaskDialogOpen(true);
  }
  function confirmAddTask() {
    const colId = taskDialogCol;
    const title = taskTitle.trim();
    if (colId && title) addTask(colId, title);
    setTaskDialogOpen(false);
  }

  // Add board dialog
  function openBoardDialog() {
    setBoardTitle("");
    setBoardFirstTask("");
    setBoardDialogOpen(true);
  }
  function confirmAddBoard() {
    const title = boardTitle.trim();
    if (!title) {
      setBoardDialogOpen(false);
      return;
    }
    const idBase = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let id = idBase || "board";
    if (board.columns.some((c) => c.id === id)) {
      let i = 2;
      while (board.columns.some((c) => c.id === `${id}-${i}`)) i += 1;
      id = `${id}-${i}`;
    }
    createColumn(id, title);
    const firstTask = boardFirstTask.trim();
    if (firstTask) addTask(id, firstTask);
    setBoardDialogOpen(false);
  }

  function findContainerOfTask(taskId: string): string | null {
    for (const colId of Object.keys(board.tasksByColumn)) {
      if (board.tasksByColumn[colId].some((t) => t.id === taskId)) return colId;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const type = active.data.current?.type as string | undefined;
    if (type === "task") {
      setActiveTask(active.data.current.task as Task);
      setActiveColumn(null);
      return;
    }
    if (type === "column-sortable") {
      const colId = String(active.id).replace(/^col-/, "");
      const col = board.columns.find((c) => c.id === colId) ?? null;
      setActiveColumn(col);
      setActiveTask(null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type as string | undefined;
    const overType = over.data.current?.type as string | undefined;

    // Columns
    if (activeType === "column-sortable" && overType === "column-sortable") {
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;
      setBoard((prev) => {
        const ids = prev.columns.map((c) => `col-${c.id}`);
        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        return { ...prev, columns: arrayMove(prev.columns, oldIndex, newIndex) };
      });
      return;
    }

    // Tasks
    const activeId = String(active.id);
    const overId = String(over.id);

    if (overType === "task" && activeId !== overId) {
      const sourceCol = findContainerOfTask(activeId);
      const targetCol = findContainerOfTask(overId);
      if (!sourceCol || !targetCol) return;
      setBoard((prev) => {
        const source = [...prev.tasksByColumn[sourceCol]];
        const target = sourceCol === targetCol ? source : [...prev.tasksByColumn[targetCol]];
        const fromIndex = source.findIndex((t) => t.id === activeId);
        const toIndex = target.findIndex((t) => t.id === overId);
        const [moved] = source.splice(fromIndex, 1);
        moved.columnId = targetCol;
        target.splice(toIndex, 0, moved);
        return {
          columns: prev.columns,
          tasksByColumn: { ...prev.tasksByColumn, [sourceCol]: source, [targetCol]: target },
        };
      });
      return;
    }

    if (overType === "column") {
      const sourceCol = findContainerOfTask(activeId);
      const targetCol = String(over.data.current?.columnId);
      if (!sourceCol || !targetCol || sourceCol === targetCol) return;
      setBoard((prev) => {
        const source = [...prev.tasksByColumn[sourceCol]];
        const target = [...prev.tasksByColumn[targetCol]];
        const fromIndex = source.findIndex((t) => t.id === activeId);
        const [moved] = source.splice(fromIndex, 1);
        moved.columnId = targetCol;
        target.push(moved);
        return {
          columns: prev.columns,
          tasksByColumn: { ...prev.tasksByColumn, [sourceCol]: source, [targetCol]: target },
        };
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);
    if (!over) return;

    const activeType = active.data.current?.type as string | undefined;
    const overType = over.data.current?.type as string | undefined;

    if (activeType === "column-sortable" && overType === "column-sortable") return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const sourceCol = findContainerOfTask(activeId);
    const targetCol =
      overType === "task"
        ? findContainerOfTask(overId)
        : overType === "column"
        ? String(over.data.current?.columnId)
        : null;
    if (!sourceCol || !targetCol) return;

    if (sourceCol === targetCol && overType === "task") {
      setBoard((prev) => {
        const list = [...prev.tasksByColumn[sourceCol]];
        const oldIndex = list.findIndex((t) => t.id === activeId);
        const newIndex = list.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        return {
          columns: prev.columns,
          tasksByColumn: { ...prev.tasksByColumn, [sourceCol]: arrayMove(list, oldIndex, newIndex) },
        };
      });
    }
  }

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Tabs />
        <div className="flex items-center gap-3 flex-1 max-w-2xl mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              value={filters.search}
              onChange={handleSearch}
              placeholder="Search tasks..."
              className="pl-9"
              aria-label="Search tasks"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilter((s) => !s)}>
            <FilterIcon className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        <Button onClick={openBoardDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Board
        </Button>
      </div>

      {/* Board lanes */}
      {mounted ? (
        <DndContext
          id="kanban-dnd"
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
          measuring={{
            droppable: { strategy: MeasuringStrategy.Always },
            draggable: { strategy: MeasuringStrategy.Always },
            dragOverlay: { measure: (el) => el.getBoundingClientRect() },
          }}
        >
          <div
            className={[
              "mt-4 pt-3 pb-4",
              "max-h-[calc(100vh-160px)] overflow-x-auto overflow-y-auto",
              "overscroll-x-contain overscroll-y-contain",
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            ].join(" ")}
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <SortableContext items={columnSortableIds} strategy={horizontalListSortingStrategy}>
              <div className="inline-flex min-w-max gap-4 md:gap-6">
                {board.columns.map((col) => (
                  <DraggableColumn
                    key={col.id}
                    column={col}
                    tasks={(board.tasksByColumn[col.id] ?? []).filter((t) =>
                      matchesFilters(t, filters)
                    )}
                    activeColumnId={activeColumn?.id ?? null}
                    onOpenAddTask={openTaskDialog}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 220,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeTask ? <TaskOverlay task={activeTask} /> : <ColumnOverlay column={activeColumn} />}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="mt-4 pt-3 pb-4 max-h-[calc(100vh-160px)] overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="inline-flex min-w-max gap-4 md:gap-6">
            {board.columns.map((c) => (
              <Card key={c.id} className="w-80 h-40 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task name..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmAddTask();
                }
              }}
              aria-label="Task name"
              className="h-11"
            />
            <Button type="button" className="h-11 w-11" onClick={confirmAddTask} aria-label="Confirm add task">
              <CircleCheck className="h-5 w-5" />
            </Button>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Add Board Dialog */}
      <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add New Board</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Board title</label>
              <Input
                autoFocus
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                placeholder="Enter board name..."
                aria-label="Board title"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">First task (optional)</label>
              <Input
                value={boardFirstTask}
                onChange={(e) => setBoardFirstTask(e.target.value)}
                placeholder="Enter task name..."
                aria-label="First task name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmAddBoard();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={confirmAddBoard} disabled={!boardTitle.trim()}>
              <CircleCheck className="mr-2 h-4 w-4" />
              Create
            </Button>
          </DialogFooter>

          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
