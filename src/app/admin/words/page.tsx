"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Globe,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Word, Definition, Example } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/app/hooks/use-toast";

const LANGUAGES = [
  { code: "la", name: "Lao" },
  { code: "en", name: "English" },
  { code: "th", name: "Thai" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
];

export default function Words() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [formData, setFormData] = useState({
    word: "",
    part_of_speech: "",
    pronunciation: "",
    definitions: [] as Definition[],
    examples: [] as Example[],
  });

  const [definitions, setDefinitions] = useState<Definition[]>([
    { id: 0, definitionId: 0, language: "en", text: "" },
  ]);
  const [examples, setExamples] = useState<Example[]>([
    { id: 0, exampleId: 0, text: "" },
  ]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const { toast } = useToast();

  const loadData = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      // You can add search later: search: search
    });
    const res = await fetch(`/api/admin/words?${params}`);

    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();

    setWords(data.words);
    setTotalPages(data.pagination.totalPages);
    setPage(data.pagination.page);
  };
  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (word?: Word) => {
    if (word) {
      setEditingWord(word);
      setFormData({
        word: word.word,
        pronunciation: word.pronunciation,
        part_of_speech: word.part_of_speech,
        definitions: word.definitions,
        examples: word.examples,
      });
      setDefinitions(
        word.definitions.length > 0
          ? word.definitions
          : [{ id: 0, definitionId: 0, language: "en", text: "" }]
      );
      setExamples(
        word.examples.length > 0
          ? word.examples
          : [{ id: 0, exampleId: 0, text: "" }]
      );
    } else {
      setEditingWord(null);
      setFormData({
        word: "",
        pronunciation: "",
        part_of_speech: "",
        definitions: [],
        examples: [],
      });
      setDefinitions([{ id: 0, definitionId: 0, language: "en", text: "" }]);
      setExamples([{ id: 0, exampleId: 0, text: "" }]);
    }
    setIsDialogOpen(true);
  };

  const handleAddDefinition = () => {
    const usedLanguages = definitions.map((d) => d.language);
    const availableLanguage = LANGUAGES.find(
      (l) => !usedLanguages.includes(l.code)
    );
    if (availableLanguage) {
      setDefinitions([
        ...definitions,
        { id: 0, definitionId: 0, language: availableLanguage.code, text: "" },
      ]);
    }
  };

  const handleRemoveDefinition = (index: number) => {
    if (definitions.length > 1) {
      setDefinitions(definitions.filter((_, i) => i !== index));
    }
  };

  const handleDefinitionChange = (
    index: number,
    field: "language" | "text",
    value: string
  ) => {
    const updated = [...definitions];
    updated[index] = { ...updated[index], [field]: value };
    setDefinitions(updated);
  };

  const handleAddExample = () => {
    setExamples([...examples, { id: 0, exampleId: 0, text: "" }]);
  };

  const handleRemoveExample = (index: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  const handleExampleChange = (index: number, value: string) => {
    const updated = [...examples];
    updated[index].text = value;
    setExamples(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    const examplesArray = examples.filter((ex) => ex.text.trim());
    const validDefinitions = definitions.filter((d) => d.text.trim());

    if (validDefinitions.length === 0) {
      toast({
        title: "Error",
        description: "At least one definition is required.",
        variant: "destructive",
      });
      return;
    }

    if (editingWord) {
      editingWord.word = formData.word;
      editingWord.pronunciation = formData.pronunciation;
      editingWord.part_of_speech = formData.part_of_speech;
      editingWord.definitions = validDefinitions;
      editingWord.examples = examplesArray;

      const response = await fetch("/api/admin/words/" + editingWord.id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      toast({
        title: "Word updated",
        description: `"${formData.word}" has been updated.`,
      });
    } else {
      try {
        formData.examples = examplesArray;
        formData.definitions = validDefinitions;
        const response = await fetch("/api/admin/words", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const result = await response.json();
          setIsDialogOpen(false);
          console.log("result: ", result);
        } else {
          console.log("error");
        }
      } catch (err) {
        console.log("created error: ", err);
      }
      await loadData();
      toast({
        title: "Word added",
        description: `"${formData.word}" has been added.`,
      });
    }
    setIsLoading(false);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    const response = await fetch("/api/admin/words/" + id, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    await loadData();
    toast({
      title: "Word deleted",
      description: `Word has been removed.`,
    });
  };

  const getLanguageName = (code: string) => {
    return LANGUAGES.find((l) => l.code === code)?.name || code;
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Word Management"
        description="Add, edit, and manage dictionary words"
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4" />
            Add Word
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Words Table */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead>Definitions</TableHead>
              <TableHead>Examples</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {words.map((word) => (
              <TableRow key={word.id}>
                <TableCell className="font-medium text-primary">
                  {word.word}
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="space-y-1">
                    {word.definitions.slice(0, 2).map((def, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {getLanguageName(def.language)}
                        </Badge>
                        <span className="truncate text-sm">{def.text}</span>
                      </div>
                    ))}
                    {word.definitions.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{word.definitions.length - 2} more
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {word.examples.length} example
                    {word.examples.length !== 1 ? "s" : ""}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(word)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(word.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {words.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No words found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>

            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                setLimit(Number(value));
                setPage(1); // Reset to first page
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>

            {/* Optional: Show page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            {totalPages > 5 && (
              <span className="px-3 text-sm text-muted-foreground">...</span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWord ? "Edit Word" : "Add New Word"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="word">Word</Label>
              <Input
                id="word"
                value={formData.word}
                onChange={(e) =>
                  setFormData({ ...formData, word: e.target.value })
                }
                placeholder="Enter the word"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pronunciation">Pronunciation</Label>
              <Input
                id="pronunciation"
                value={formData.pronunciation}
                onChange={(e) =>
                  setFormData({ ...formData, pronunciation: e.target.value })
                }
                placeholder="Enter the pronunciation"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="part_of_speech">Part Of Speech</Label>
              <Input
                id="part_of_speech"
                value={formData.part_of_speech}
                onChange={(e) =>
                  setFormData({ ...formData, part_of_speech: e.target.value })
                }
                placeholder="Enter the part of speech"
                required
              />
            </div>
            {/* Multi-language Definitions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Definitions
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDefinition}
                  disabled={definitions.length >= LANGUAGES.length}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Language
                </Button>
              </div>

              <div className="space-y-3">
                {definitions.map((def, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-start p-3 bg-muted/50 rounded-lg"
                  >
                    <Select
                      value={def.language}
                      onValueChange={(value) =>
                        handleDefinitionChange(index, "language", value)
                      }
                    >
                      <SelectTrigger className="w-32 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem
                            key={lang.code}
                            value={lang.code}
                            disabled={definitions.some(
                              (d, i) => i !== index && d.language === lang.code
                            )}
                          >
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={def.text}
                      onChange={(e) =>
                        handleDefinitionChange(index, "text", e.target.value)
                      }
                      placeholder={`Definition in ${getLanguageName(
                        def.language
                      )}`}
                      className="flex-1 min-h-[60px]"
                    />
                    {definitions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDefinition(index)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Examples List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Examples
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddExample}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Example
                </Button>
              </div>

              <div className="space-y-2">
                {examples.map((example, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground w-6 shrink-0">
                      {index + 1}.
                    </span>
                    <Input
                      value={example.text}
                      onChange={(e) =>
                        handleExampleChange(index, e.target.value)
                      }
                      placeholder={`Example sentence ${index + 1}`}
                      className="flex-1"
                    />
                    {examples.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExample(index)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              {isLoading ? (
                <Button disabled={isLoading}>
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                  
                </Button>
              ) : (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingWord ? "Update" : "Add"} Word
                  </Button>
                </div>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
