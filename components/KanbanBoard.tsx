"use client";

import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  type AnimateLayoutChanges,
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CircleCheck,
  Filter as FilterIcon,
  GripVertical,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Column as ColumnType, Priority, Task } from "@/types/kanban";
import Column from "./Column";
import TaskOverlay from "./TaskOverlay";

const initialColumns: ColumnType[] = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Integrate Stripe payment gateway",
    description: "Connect checkout and test webhooks.",
    priority: "High",
    columnId: "backlog",
  },
  {
    id: "t2",
    title: "Dark mode toggle implementation",
    description: "Add theme switcher and persist preference.",
    priority: "High",
    columnId: "in-progress",
  },
  {
    id: "t3",
    title: "Set up CI/CD pipeline",
    description: "CI with checks, CD to Vercel.",
    priority: "Medium",
    columnId: "done",
  },
];

type BoardState = {
  columns: ColumnType[];
  tasksByColumn: Record<string, Task[]>;
};

function toTasksByColumn(
  cols: ColumnType[],
  tasks: Task[],
): Record<string, Task[]> {
  const map: Record<string, Task[]> = {};
  cols.forEach((c) => (map[c.id] = []));
  tasks.forEach((t) => {
    if (!map[t.columnId]) map[t.columnId] = [];
    map[t.columnId].push({ ...t });
  });
  return map;
}

function Tabs() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm">
        Board
      </Button>
      <Button variant="ghost" size="sm">
        List
      </Button>
      <Button variant="ghost" size="sm">
        Table
      </Button>
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
    columns: Object.fromEntries(columnList.map((c) => [c.id, true])) as Record<
      string,
      boolean
    >,
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
  const inMin =
    f.minProgress == null ? true : (task.progress ?? 0) >= f.minProgress;
  const inMax =
    f.maxProgress == null ? true : (task.progress ?? 0) <= f.maxProgress;
  return inSearch && inColumns && inPriority && inMin && inMax;
}

function taskMatchScore(task: Task, qLower: string): number {
  if (!qLower) return Infinity;
  const s = `${task.title} ${task.description ?? ""}`.toLowerCase();
  const idx = s.indexOf(qLower);
  return idx === -1 ? Infinity : idx;
}

function ColumnOverlay({ column }: { column: ColumnType | null }) {
  if (!column) return null;
  return (
    <div className="w-80 select-none pointer-events-none">
      <div className="rounded-xl border bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm shadow-2xl ring-1 ring-black/10 dark:ring-white/10 p-3 opacity-80 scale-100">
        <div className="text-sm font-semibold capitalize text-neutral-900 dark:text-neutral-100">
          {column.title}
        </div>
        <div className="mt-2 h-20 rounded-md bg-neutral-100/80 dark:bg-neutral-800/80" />
      </div>
    </div>
  );
}

function DraggableColumn({
  column,
  tasks,
  count,
  activeColumnId,
  onOpenAddTask,
}: {
  column: ColumnType;
  tasks: Task[];
  count: number;
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
    transition: { duration: 180, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
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
        className="h-7 w-7 hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
        className="h-7 w-7 cursor-grab active:cursor-grabbing hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
      className={[
        "relative touch-none transition-opacity duration-200",
        isActive ? "opacity-30" : "opacity-100",
      ].join(" ")}
    >
      <Column
        id={column.id}
        title={column.title}
        tasks={tasks}
        count={count}
        headerRight={headerRight}
      />
    </div>
  );
}

export default function KanbanBoard() {
  const [board, setBoard] = useState<BoardState>({
    columns: initialColumns,
    tasksByColumn: toTasksByColumn(initialColumns, initialTasks),
  });

  const [filters, setFilters] = useState<Filters>(() =>
    defaultFilters(initialColumns),
  );
  const [_showFilter, setShowFilter] = useState(false);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);

  // Dialogs
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogCol, setTaskDialogCol] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("Medium");

  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [boardFirstTask, setBoardFirstTask] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sensors with improved activation constraints
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const collisionDetection = (args: any) => {
    const pointer = pointerWithin(args);
    return pointer.length ? pointer : rectIntersection(args);
  };

  // Search state
  const qLower = filters.search.trim().toLowerCase();

  // Compute render model with counts and search-aware ordering
  const renderModel = useMemo(() => {
    const columns = board.columns.map((c) => {
      const tasks = board.tasksByColumn[c.id] ?? [];
      const totalCount = tasks.length;

      const scored = tasks.map((t, idx) => ({
        task: t,
        score: taskMatchScore(t, qLower),
        idx,
      }));
      const matchedCount = scored.reduce(
        (acc, s) => acc + (s.score !== Infinity ? 1 : 0),
        0,
      );
      const bestScore = scored.reduce(
        (min, s) => (s.score < min ? s.score : min),
        Infinity,
      );

      const tasksForRender =
        qLower.length === 0
          ? tasks
          : scored
              .sort((a, b) => {
                const am = a.score !== Infinity ? 0 : 1;
                const bm = b.score !== Infinity ? 0 : 1;
                if (am !== bm) return am - bm;
                if (a.score !== b.score) return a.score - b.score;
                return a.idx - b.idx;
              })
              .map((s) => s.task);

      return {
        column: c,
        totalCount,
        matchedCount,
        bestScore,
        tasksForRender,
      };
    });

    const columnsForRender =
      qLower.length === 0
        ? columns
        : [...columns].sort((a, b) => {
            if (a.matchedCount !== b.matchedCount)
              return b.matchedCount - a.matchedCount;
            if (a.bestScore !== b.bestScore) return a.bestScore - b.bestScore;
            const ai = board.columns.findIndex((c) => c.id === a.column.id);
            const bi = board.columns.findIndex((c) => c.id === b.column.id);
            return ai - bi;
          });

    return columnsForRender;
  }, [board.columns, board.tasksByColumn, qLower]);

  const columnSortableIds = useMemo(
    () => renderModel.map((r) => `col-${r.column.id}`),
    [renderModel],
  );

  function matchesFiltersAll(task: Task) {
    return matchesFilters(task, filters);
  }

  // Handlers
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setFilters((f) => ({ ...f, search: e.target.value }));
  }

  function createColumn(id: string, title: string) {
    setBoard((prev) => ({
      columns: [...prev.columns, { id, title }],
      tasksByColumn: { ...prev.tasksByColumn, [id]: [] },
    }));
    setFilters((f) => ({ ...f, columns: { ...f.columns, [id]: true } }));
  }

  function addTask(colId: string, title: string, priority: Priority) {
    const newId = `t-${Math.random().toString(36).slice(2, 8)}`;
    const newTask: Task = {
      id: newId,
      title,
      description: "",
      priority,
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

  function openTaskDialog(colId: string) {
    setTaskDialogCol(colId);
    setTaskTitle("");
    setTaskPriority("Medium");
    setTaskDialogOpen(true);
  }

  function confirmAddTask() {
    const colId = taskDialogCol;
    const title = taskTitle.trim();
    if (colId && title) addTask(colId, title, taskPriority);
    setTaskDialogOpen(false);
  }

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
    const idBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    let id = idBase || "board";
    if (board.columns.some((c) => c.id === id)) {
      let i = 2;
      while (board.columns.some((c) => c.id === `${id}-${i}`)) i += 1;
      id = `${id}-${i}`;
    }
    createColumn(id, title);
    const first = boardFirstTask.trim();
    if (first) addTask(id, first, "Medium");
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
    if (type === "task" && active.data.current) {
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

    if (activeType === "column-sortable" && overType === "column-sortable") {
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;
      setBoard((prev) => {
        const ids = prev.columns.map((c) => `col-${c.id}`);
        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
          return prev;
        return {
          ...prev,
          columns: arrayMove(prev.columns, oldIndex, newIndex),
        };
      });
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (overType === "task" && activeId !== overId) {
      const sourceCol = findContainerOfTask(activeId);
      const targetCol = findContainerOfTask(overId);
      if (!sourceCol || !targetCol) return;

      setBoard((prev) => {
        const source = [...prev.tasksByColumn[sourceCol]];
        const target =
          sourceCol === targetCol ? source : [...prev.tasksByColumn[targetCol]];
        const fromIndex = source.findIndex((t) => t.id === activeId);
        const toIndex = target.findIndex((t) => t.id === overId);
        const [moved] = source.splice(fromIndex, 1);
        moved.columnId = targetCol;
        target.splice(toIndex, 0, moved);
        return {
          columns: prev.columns,
          tasksByColumn: {
            ...prev.tasksByColumn,
            [sourceCol]: source,
            [targetCol]: target,
          },
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
          tasksByColumn: {
            ...prev.tasksByColumn,
            [sourceCol]: source,
            [targetCol]: target,
          },
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

    if (activeType === "column-sortable" && overType === "column-sortable")
      return;

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
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex)
          return prev;
        return {
          columns: prev.columns,
          tasksByColumn: {
            ...prev.tasksByColumn,
            [sourceCol]: arrayMove(list, oldIndex, newIndex),
          },
        };
      });
    }
  }

  return (
    <div className="px-6 py-4 space-y-6 overflow-x-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Tabs />
        <div className="flex items-center gap-3 flex-1 max-w-2xl mx-6">
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

      {/* Board lanes with search-aware order */}
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
            dragOverlay: { measure: (el) => el.getBoundingClientRect() },
          }}
        >
          <div
            className={[
              "px-2 py-4",
              "max-h-[calc(100vh-160px)] overflow-x-auto overflow-y-auto",
              "overscroll-x-contain overscroll-y-contain",
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
            ].join(" ")}
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <SortableContext
              items={columnSortableIds}
              strategy={horizontalListSortingStrategy}
            >
              <div className="inline-flex min-w-max gap-4 md:gap-6">
                {renderModel.map(({ column, tasksForRender, totalCount }) => (
                  <DraggableColumn
                    key={column.id}
                    column={column}
                    tasks={tasksForRender.filter(matchesFiltersAll)}
                    count={totalCount}
                    activeColumnId={activeColumn?.id ?? null}
                    onOpenAddTask={openTaskDialog}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 300,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
            style={{ cursor: "grabbing" }}
          >
            {activeTask ? (
              <TaskOverlay task={activeTask} />
            ) : (
              <ColumnOverlay column={activeColumn} />
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="px-2 py-4 max-h-[calc(100vh-160px)] overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Task name</label>
              <Input
                autoFocus
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter task name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    confirmAddTask();
                  }
                }}
                aria-label="Task name"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={taskPriority}
                onValueChange={(value: Priority) => setTaskPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={confirmAddTask} disabled={!taskTitle.trim()}>
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
              <label className="text-sm font-medium">
                First task (optional)
              </label>
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
