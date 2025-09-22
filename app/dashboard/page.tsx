import KanbanBoard from "@/components/KanbanBoard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}
