"use client";

import {
  Archive,
  Bold,
  Edit,
  FileText,
  Grid,
  Image as ImageIcon,
  Italic,
  Link,
  List,
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
import { Textarea } from "@/components/ui/textarea";

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
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Sample notes data
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
      },
      {
        id: "2",
        title: "Weekly Grocery List",
        content:
          "Organic vegetables\nWhole grain bread\nGreek yogurt\nFresh fruits\nChicken breast\nQuinoa\nAlmond milk",
        tags: ["Personal", "Meetings"],
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
        isStarred: false,
        isArchived: false,
        images: [],
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
      },
      {
        id: "5",
        title: "Home Renovation Tasks",
        content:
          "Paint living room\nReplace kitchen faucet\nFix bathroom tiles",
        tags: [],
        createdAt: new Date("2024-01-25"),
        updatedAt: new Date("2024-01-25"),
        isStarred: false,
        isArchived: false,
        images: [],
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
      newNoteImages.length === 0
    )
      return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle.trim() || "Untitled Note",
      content: newNoteContent,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isStarred: false,
      isArchived: false,
      images: newNoteImages,
    };
    setNotes([newNote, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteImages([]);
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

                {/* Rich Text Toolbar */}
                <div className="flex items-center gap-1 border-b pb-2">
                  <Button variant="ghost" size="sm">
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Underline className="w-4 h-4" />
                  </Button>
                  <div className="ml-2">
                    <Button variant="ghost" size="sm">
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Textarea
                  placeholder="Enter note description..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  onPaste={async (e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;

                    for (let i = 0; i < items.length; i++) {
                      const item = items[i];
                      if (item.type.startsWith("image/")) {
                        e.preventDefault();
                        const file = item.getAsFile();
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const imageUrl = event.target?.result as string;
                            setNewNoteImages((prev) => [...prev, imageUrl]);
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }
                  }}
                  rows={8}
                  className="min-h-[200px] border-none resize-none bg-transparent focus-visible:ring-0"
                />

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
                      newNoteImages.length === 0
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
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border border-gray-200 dark:border-gray-700 shadow-md ${
                    selectedNote?.id === note.id ? "ring-2 ring-primary" : ""
                  } ${viewMode === "grid" ? "h-auto min-h-64" : "h-auto min-h-32"} bg-white dark:bg-gray-800 flex flex-col`}
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
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                      {note.content.substring(0, 120)}
                      {note.content.length > 120 && "..."}
                    </p>
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
              <Button variant="ghost" size="sm">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
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
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {selectedNote.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt="Note"
                      className="rounded border max-h-32 object-cover"
                    />
                  ))}
                </div>
              )}

              <Textarea
                ref={textareaRef}
                className="min-h-[400px] resize-none border-none outline-none bg-transparent text-sm leading-relaxed"
                placeholder="Start writing your note... (Ctrl+V to paste images, Ctrl+Z to undo)"
                value={selectedNote.content}
                onChange={(e) => updateNoteContent(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
