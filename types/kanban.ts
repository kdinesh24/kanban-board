// types/kanban.ts
export type Priority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  progress?: number;
  columnId: string;
};

export type Column = {
  id: string;
  title: string;
};
