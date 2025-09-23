"use client";

import {
  Archive,
  Bold,
  CheckSquare,
  Edit,
  FileText,
  Grid,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  Plus,
  Search,
  Tag,
  Trash2,
  Underline,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isStarred: boolean;
  isArchived: boolean;
  images?: string[];
  tasks?: Task[];
  noteType: "text" | "task";
}

interface Label {
  id: string;
  name: string;
  color: string;
}

type ViewType = "notes" | "archive";

export function NotesApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentView, setCurrentView] = useState<ViewType>("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<Label[]>([
    { id: "1", name: "Family", color: "#ec4899" },
    { id: "2", name: "Tasks", color: "#8b5cf6" },
    { id: "3", name: "Personal", color: "#10b981" },
    { id: "4", name: "Meetings", color: "#06b6d4" },
    { id: "5", name: "Shopping", color: "#06b6d4" },
    { id: "6", name: "Planning", color: "#f97316" },
    { id: "7", name: "Travel", color: "#3b82f6" },
  ]);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteImages, setNewNoteImages] = useState<string[]>([]);
  const [newNoteTasks, setNewNoteTasks] = useState<Task[]>([]);
  const [newNoteType, setNewNoteType] = useState<"text" | "task">("text");
  const [currentTask, setCurrentTask] = useState("");
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const selectedNoteEditorRef = useRef<HTMLDivElement>(null);
  const newNoteEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Formatting functions for text
  const applyFormatting = (
    format: "bold" | "italic" | "underline",
    editorRef: React.RefObject<HTMLDivElement | null>,
  ) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    try {
      switch (format) {
        case "bold":
          document.execCommand("bold", false, undefined);
          break;
        case "italic":
          document.execCommand("italic", false, undefined);
          break;
        case "underline":
          document.execCommand("underline", false, undefined);
          break;
      }
    } catch (error) {
      console.error("Formatting command failed:", error);
    }
  };

  const formatNewNoteText = (format: "bold" | "italic" | "underline") => {
    applyFormatting(format, newNoteEditorRef);
  };

  const formatSelectedNoteText = (format: "bold" | "italic" | "underline") => {
    applyFormatting(format, selectedNoteEditorRef);
  };

  useEffect(() => {
    const sampleNotes: Note[] = [
      {
        id: "1",
        title: "Mountain Sunset Photography",
        content:
          "Captured this beautiful sunset during our hiking trip. The colors were absolutely stunning!",
        tags: ["Family", "Personal"],
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        isStarred: false,
        isArchived: false,
        images: [],
        noteType: "text",
      },
      {
        id: "2",
        title: "Weekly Grocery List",
        content: "",
        tags: ["Personal", "Meetings"],
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
        isStarred: false,
        isArchived: false,
        images: [],
        noteType: "task",
        tasks: [
          { id: "1", text: "Organic vegetables", completed: true },
          { id: "2", text: "Whole grain bread", completed: true },
          { id: "3", text: "Greek yogurt", completed: false },
          { id: "4", text: "Fresh fruits", completed: false },
          { id: "5", text: "Chicken breast", completed: false },
          { id: "6", text: "Quinoa", completed: true },
          { id: "7", text: "Almond milk", completed: false },
        ],
      },
      {
        id: "3",
        title: "Project Milestones",
        content:
          "Q1 Goals: - Launch beta version\n- Gather user feedback\n- Implement core features\n- Performance optimization\n- Security audit\n- Documentation update\n\nQ1 Goals:\n- Launch beta version\n- Gather user feedback\n- Implement core features\n- Performance optimization\n- Security audit\n- Documentation update",
        tags: ["Tasks"],
        createdAt: new Date("2024-01-18"),
        updatedAt: new Date("2024-01-18"),
        isStarred: true,
        isArchived: false,
        images: [],
        noteType: "text",
      },
      {
        id: "4",
        title: "Desert Road Trip Ideas",
        content:
          "Potential routes for our upcoming desert adventure. Need to plan stops and accommodation.",
        tags: ["Personal"],
        createdAt: new Date("2024-01-22"),
        updatedAt: new Date("2024-01-22"),
        isStarred: false,
        isArchived: false,
        images: [],
        noteType: "text",
      },
      {
        id: "5",
        title: "Home Renovation Tasks",
        content: "",
        tags: [],
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-01-25"),
        isStarred: false,
        isArchived: false,
        images: [],
        noteType: "task",
        tasks: [
          { id: "1", text: "Paint living room", completed: false },
          { id: "2", text: "Replace kitchen faucet", completed: false },
          { id: "3", text: "Fix bathroom tiles", completed: false },
        ],
      },
    ];
    setNotes(sampleNotes);
  }, []);

  const filteredNotes = notes.filter((note) => {
    const matchesView =
      currentView === "notes" ? !note.isArchived : note.isArchived;
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesView && matchesSearch;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedNote) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const updatedNote = {
          ...selectedNote,
          images: [...(selectedNote.images || []), imageUrl],
          updatedAt: new Date(),
        };
        setSelectedNote(updatedNote);
        setNotes(
          notes.map((note) =>
            note.id === selectedNote.id ? updatedNote : note,
          ),
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0 && selectedNote) {
      const previousContent = undoStack[undoStack.length - 1];
      setRedoStack([...redoStack, selectedNote.content]);
      setUndoStack(undoStack.slice(0, -1));

      const updatedNote = {
        ...selectedNote,
        content: previousContent,
        updatedAt: new Date(),
      };
      setSelectedNote(updatedNote);
      setNotes(
        notes.map((note) => (note.id === selectedNote.id ? updatedNote : note)),
      );
    }
  }, [undoStack, redoStack, selectedNote, notes]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0 && selectedNote) {
      const nextContent = redoStack[redoStack.length - 1];
      setUndoStack([...undoStack, selectedNote.content]);
      setRedoStack(redoStack.slice(0, -1));

      const updatedNote = {
        ...selectedNote,
        content: nextContent,
        updatedAt: new Date(),
      };
      setSelectedNote(updatedNote);
      setNotes(
        notes.map((note) => (note.id === selectedNote.id ? updatedNote : note)),
      );
    }
  }, [undoStack, redoStack, selectedNote, notes]);

  const handlePaste = useCallback(
    async (_e: KeyboardEvent) => {
      if (!selectedNote) return;

      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
          for (const type of clipboardItem.types) {
            if (type.startsWith("image/")) {
              const blob = await clipboardItem.getType(type);
              const reader = new FileReader();
              reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                const updatedNote = {
                  ...selectedNote,
                  images: [...(selectedNote.images || []), imageUrl],
                  updatedAt: new Date(),
                };
                setSelectedNote(updatedNote);
                setNotes(
                  notes.map((note) =>
                    note.id === selectedNote.id ? updatedNote : note,
                  ),
                );
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      } catch (err) {
        console.error("Failed to read clipboard:", err);
      }
    },
    [selectedNote, notes],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        e.ctrlKey &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      } else if (e.ctrlKey && e.key === "v" && selectedNote) {
        handlePaste(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, handlePaste, selectedNote]);

  const createNewNote = () => {
    if (
      !newNoteTitle.trim() &&
      !newNoteContent.trim() &&
      newNoteImages.length === 0 &&
      newNoteTasks.length === 0
    )
      return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle.trim() || "Untitled Note",
      content: newNoteEditorRef.current?.innerHTML || newNoteContent,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isStarred: false,
      isArchived: false,
      images: newNoteImages,
      noteType: newNoteType,
      tasks: newNoteType === "task" ? newNoteTasks : undefined,
    };
    setNotes([newNote, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    if (newNoteEditorRef.current) {
      newNoteEditorRef.current.innerHTML = "";
    }
    setNewNoteImages([]);
    setNewNoteTasks([]);
    setNewNoteType("text");
    setCurrentTask("");
    setIsAddNoteOpen(false);
  };

  const createNewLabel = () => {
    if (!newLabelName.trim()) return;

    const newLabel: Label = {
      id: Date.now().toString(),
      name: newLabelName,
      color: newLabelColor,
    };
    setLabels([...labels, newLabel]);
    setNewLabelName("");
    setNewLabelColor("#3b82f6");
    setIsLabelDialogOpen(false);
  };

  const addTask = () => {
    if (!currentTask.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: currentTask.trim(),
      completed: false,
    };
    setNewNoteTasks([...newNoteTasks, newTask]);
    setCurrentTask("");
  };

  const removeTask = (taskId: string) => {
    setNewNoteTasks(newNoteTasks.filter((task) => task.id !== taskId));
  };

  const toggleTaskInNote = (noteId: string, taskId: string) => {
    setNotes(
      notes.map((note) => {
        if (note.id === noteId && note.tasks) {
          return {
            ...note,
            tasks: note.tasks.map((task) =>
              task.id === taskId
                ? { ...task, completed: !task.completed }
                : task,
            ),
            updatedAt: new Date(),
          };
        }
        return note;
      }),
    );

    if (selectedNote?.id === noteId && selectedNote.tasks) {
      setSelectedNote({
        ...selectedNote,
        tasks: selectedNote.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        ),
        updatedAt: new Date(),
      });
    }
  };

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter((note) => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
  };

  const archiveNote = (noteId: string) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, isArchived: !note.isArchived } : note,
      ),
    );
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
  };

  const updateNoteContent = (content: string) => {
    if (!selectedNote) return;

    setUndoStack([...undoStack, selectedNote.content]);
    setRedoStack([]);

    const updatedNote = {
      ...selectedNote,
      content,
      updatedAt: new Date(),
    };
    setSelectedNote(updatedNote);
    setNotes(
      notes.map((note) => (note.id === selectedNote.id ? updatedNote : note)),
    );
  };

  const addTagToNote = (noteId: string, tagName: string) => {
    setNotes(
      notes.map((note) => {
        if (note.id === noteId && !note.tags.includes(tagName)) {
          return { ...note, tags: [...note.tags, tagName] };
        }
        return note;
      }),
    );
    if (selectedNote?.id === noteId && !selectedNote.tags.includes(tagName)) {
      setSelectedNote({
        ...selectedNote,
        tags: [...selectedNote.tags, tagName],
      });
    }
  };

  const removeTagFromNote = (noteId: string, tagName: string) => {
    setNotes(
      notes.map((note) => {
        if (note.id === noteId) {
          return { ...note, tags: note.tags.filter((tag) => tag !== tagName) };
        }
        return note;
      }),
    );
    if (selectedNote?.id === noteId) {
      setSelectedNote({
        ...selectedNote,
        tags: selectedNote.tags.filter((tag) => tag !== tagName),
      });
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-64 border-r bg-background flex flex-col">
        {/* Add Note Button */}
        <div className="p-4">
          <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-black text-white hover:bg-gray-800">
                <Edit className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader className="sr-only">
                <DialogTitle>Add New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="border-none text-lg font-medium bg-transparent focus-visible:ring-0 px-0"
                />

                {/* Rich Text Toolbar (only for text notes) */}
                {newNoteType === "text" && (
                  <div className="flex items-center gap-1 border-b pb-2 mb-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => formatNewNoteText("bold")}
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => formatNewNoteText("italic")}
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => formatNewNoteText("underline")}
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                    <div className="ml-2">
                      <Button variant="ghost" size="sm">
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Text Content (only for text notes) */}
                {newNoteType === "text" && (
                  <div
                    ref={newNoteEditorRef}
                    contentEditable
                    suppressContentEditableWarning={true}
                    onInput={(e) => {
                      const target = e.target as HTMLDivElement;
                      setNewNoteContent(target.innerHTML);
                    }}
                    onPaste={async (e) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;

                      for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item.type.indexOf("image") === 0) {
                          const file = item.getAsFile();
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string;
                              setNewNoteImages([...newNoteImages, imageUrl]);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }
                    }}
                    className="mt-0 pt-3 min-h-[200px] border-none resize-none bg-transparent focus:outline-none text-sm leading-relaxed [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none"
                    style={{ wordBreak: "break-word" }}
                    data-placeholder="Enter note description..."
                  />
                )}

                {/* Task Input (only for task notes) */}
                {newNoteType === "task" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a task..."
                        value={currentTask}
                        onChange={(e) => setCurrentTask(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTask();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={addTask} disabled={!currentTask.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Task List Preview */}
                    {newNoteTasks.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                        {newNoteTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 group"
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => {
                                setNewNoteTasks(
                                  newNoteTasks.map((t) =>
                                    t.id === task.id
                                      ? { ...t, completed: !t.completed }
                                      : t,
                                  ),
                                );
                              }}
                            />
                            <span
                              className={`flex-1 ${task.completed ? "line-through text-gray-500" : ""}`}
                            >
                              {task.text}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Display uploaded images */}
                {newNoteImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {newNoteImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => {
                            setNewNoteImages(
                              newNoteImages.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom Toolbar */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {newNoteType === "text" && (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const imageUrl = event.target?.result as string;
                                setNewNoteImages([...newNoteImages, imageUrl]);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setNewNoteType(
                                newNoteType === "task" ? "text" : "task",
                              )
                            }
                          >
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add tasks</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="sm">
                      <Tag className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={createNewNote}
                    disabled={
                      !newNoteTitle.trim() &&
                      !newNoteContent.trim() &&
                      newNoteImages.length === 0 &&
                      newNoteTasks.length === 0
                    }
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Add Note
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-4">
          <div className="border rounded-lg p-3 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="space-y-1">
              <Button
                variant={currentView === "notes" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentView("notes")}
              >
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </Button>
              <Button
                variant={currentView === "archive" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentView("archive")}
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>

              <Dialog
                open={isLabelDialogOpen}
                onOpenChange={setIsLabelDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Labels
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Edit Labels</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {/* Existing Labels */}
                    <div className="space-y-2">
                      {labels.map((label) => (
                        <div
                          key={label.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: label.color }}
                            />
                            <span className="text-sm font-medium">
                              {label.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              6
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                setLabels(
                                  labels.filter((l) => l.id !== label.id),
                                )
                              }
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add New Label Section */}
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2">
                        Add New Label
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: newLabelColor }}
                          />
                          <Input
                            placeholder="New label name"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            className="flex-1 h-8 text-sm"
                          />
                          <Button
                            onClick={createNewLabel}
                            disabled={!newLabelName.trim()}
                            size="sm"
                            className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700"
                          >
                            +
                          </Button>
                        </div>

                        {/* Color Picker */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Select color:
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {[
                              "#ef4444",
                              "#f97316",
                              "#f59e0b",
                              "#eab308",
                              "#84cc16",
                              "#22c55e",
                              "#10b981",
                              "#14b8a6",
                              "#06b6d4",
                              "#3b82f6",
                              "#6366f1",
                              "#8b5cf6",
                            ].map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-5 h-5 rounded-full border-2 ${
                                  newLabelColor === color
                                    ? "border-gray-900"
                                    : "border-gray-300"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewLabelColor(color)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Separator */}
              <div className="border-t my-3 -mx-3" />

              {/* Labels Section */}
              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                  Labels
                </h3>
                <div className="space-y-1">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-2 py-1"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm">{label.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notes Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">
                {currentView === "notes" ? "No notes yet" : "No archived notes"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentView === "notes"
                  ? "Create your first note to get started."
                  : "Archived notes will appear here."}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
                  : "space-y-4"
              }
            >
              {filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className={`cursor-pointer transition-shadow duration-200 hover:shadow-lg border border-gray-200 dark:border-gray-700 shadow-sm ${
                    selectedNote?.id === note.id ? "ring-2 ring-primary" : ""
                  } ${viewMode === "grid" ? "break-inside-avoid mb-6 inline-block w-full" : "h-auto min-h-32"} bg-white dark:bg-gray-800 flex flex-col`}
                  onClick={() => setSelectedNote(note)}
                >
                  {note.images &&
                    note.images.length > 0 &&
                    viewMode === "grid" && (
                      <div className="h-32 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-t-lg overflow-hidden -mt-6">
                        <img
                          src={note.images[0]}
                          alt="Note"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold line-clamp-2 text-gray-900 dark:text-gray-100">
                      {note.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                    {note.noteType === "task" && note.tasks ? (
                      <div className="space-y-2 mb-4">
                        {note.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => {
                                toggleTaskInNote(note.id, task.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span
                              className={`text-sm ${task.completed ? "line-through text-gray-500" : "text-gray-600 dark:text-gray-300"}`}
                            >
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                        {note.content.substring(0, 120)}
                        {note.content.length > 120 && "..."}
                      </p>
                    )}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {note.tags.map((tag) => {
                          const label = labels.find((l) => l.name === tag);
                          return (
                            <span
                              key={tag}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                              style={
                                label
                                  ? { backgroundColor: label.color }
                                  : { backgroundColor: "#6b7280" }
                              }
                            >
                              {tag}
                              <X className="w-3 h-3 ml-1.5 cursor-pointer hover:opacity-70" />
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Editor Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background w-full max-w-4xl h-full max-h-[90vh] rounded-lg shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <Input
                value={selectedNote.title}
                onChange={(e) => {
                  const updatedNote = {
                    ...selectedNote,
                    title: e.target.value,
                  };
                  setSelectedNote(updatedNote);
                  setNotes(
                    notes.map((note) =>
                      note.id === selectedNote.id ? updatedNote : note,
                    ),
                  );
                }}
                className="text-lg font-semibold border-none outline-none bg-transparent"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => archiveNote(selectedNote.id)}
                >
                  <Archive className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote(selectedNote.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNote(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Editor Toolbar */}
            <div className="flex items-center gap-2 p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatSelectedNoteText("bold")}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatSelectedNoteText("italic")}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatSelectedNoteText("underline")}
              >
                <Underline className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Link className="w-4 h-4" />
              </Button>

              {/* Tag Management */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Tag className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manage Tags</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => (
                        <Button
                          key={label.id}
                          variant={
                            selectedNote.tags.includes(label.name)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => {
                            if (selectedNote.tags.includes(label.name)) {
                              removeTagFromNote(selectedNote.id, label.name);
                            } else {
                              addTagToNote(selectedNote.id, label.name);
                            }
                          }}
                          style={
                            selectedNote.tags.includes(label.name)
                              ? {
                                  backgroundColor: label.color,
                                  borderColor: label.color,
                                }
                              : { borderColor: label.color, color: label.color }
                          }
                        >
                          {label.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="ml-auto text-xs text-muted-foreground">
                Ctrl+Z to undo, Ctrl+V to paste images
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {/* Tags Display */}
              {selectedNote.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNote.tags.map((tag) => {
                      const label = labels.find((l) => l.name === tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={
                            label
                              ? { backgroundColor: label.color }
                              : { backgroundColor: "#6b7280" }
                          }
                        >
                          {tag}
                          <X
                            className="w-3 h-3 ml-2 cursor-pointer hover:opacity-70"
                            onClick={() =>
                              removeTagFromNote(selectedNote.id, tag)
                            }
                          />
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Images */}
              {selectedNote.images && selectedNote.images.length > 0 && (
                <div className="mb-4 flex gap-2 flex-wrap">
                  {selectedNote.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt="Note"
                        className="rounded border max-h-32 object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const updatedNote = {
                            ...selectedNote,
                            images: selectedNote.images?.filter(
                              (_, i) => i !== index,
                            ),
                            updatedAt: new Date(),
                          };
                          setSelectedNote(updatedNote);
                          setNotes(
                            notes.map((note) =>
                              note.id === selectedNote.id ? updatedNote : note,
                            ),
                          );
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Task List or Text Content */}
              {selectedNote.noteType === "task" && selectedNote.tasks ? (
                <div className="space-y-3">
                  {selectedNote.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 group"
                    >
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() =>
                          toggleTaskInNote(selectedNote.id, task.id)
                        }
                      />
                      <span
                        className={`flex-1 ${task.completed ? "line-through text-gray-500" : ""}`}
                      >
                        {task.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedNote = {
                            ...selectedNote,
                            tasks: selectedNote.tasks?.filter(
                              (t) => t.id !== task.id,
                            ),
                            updatedAt: new Date(),
                          };
                          setSelectedNote(updatedNote);
                          setNotes(
                            notes.map((note) =>
                              note.id === selectedNote.id ? updatedNote : note,
                            ),
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {/* Add new task */}
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Add a task..."
                      value={currentTask}
                      onChange={(e) => setCurrentTask(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (currentTask.trim()) {
                            const newTask: Task = {
                              id: Date.now().toString(),
                              text: currentTask.trim(),
                              completed: false,
                            };
                            const updatedNote = {
                              ...selectedNote,
                              tasks: [...(selectedNote.tasks || []), newTask],
                              updatedAt: new Date(),
                            };
                            setSelectedNote(updatedNote);
                            setNotes(
                              notes.map((note) =>
                                note.id === selectedNote.id
                                  ? updatedNote
                                  : note,
                              ),
                            );
                            setCurrentTask("");
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (currentTask.trim()) {
                          const newTask: Task = {
                            id: Date.now().toString(),
                            text: currentTask.trim(),
                            completed: false,
                          };
                          const updatedNote = {
                            ...selectedNote,
                            tasks: [...(selectedNote.tasks || []), newTask],
                            updatedAt: new Date(),
                          };
                          setSelectedNote(updatedNote);
                          setNotes(
                            notes.map((note) =>
                              note.id === selectedNote.id ? updatedNote : note,
                            ),
                          );
                          setCurrentTask("");
                        }
                      }}
                      disabled={!currentTask.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  ref={selectedNoteEditorRef}
                  contentEditable
                  suppressContentEditableWarning={true}
                  className="min-h-[400px] border-none outline-none bg-transparent text-sm leading-relaxed focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none"
                  style={{ wordBreak: "break-word" }}
                  dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                  onInput={(e) => {
                    const target = e.target as HTMLDivElement;
                    updateNoteContent(target.innerHTML);
                  }}
                  data-placeholder="Start writing your note... (Ctrl+V to paste images, Ctrl+Z to undo)"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
