"use client";  

import KanbanBoard from "@/components/KanbanBoard";

export default function Page() {
  return (
    <main className="min-h-screen p-10">
      <h1 className="text-2xl font-bold mb-6">Kanban Board</h1>
      <KanbanBoard />
    </main>
  );
}
