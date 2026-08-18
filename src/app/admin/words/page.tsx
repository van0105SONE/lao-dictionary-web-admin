"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
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

import { Word } from "@/types";
import { useToast } from "@/app/hooks/use-toast";

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
    description: "",
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const { toast } = useToast();

  const loadData = useCallback(
    async (searchTerm: string = "", currentPage: number = 1) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
          ...(searchTerm && { search: searchTerm }),
        });
        const res = await fetch(`/api/admin/words?${params}`);

        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        setWords(data.words);
        setTotalPages(data.pagination.totalPages);
        setPage(currentPage);
      } catch (error) {
        console.error("Error loading words:", error);
        toast({
          title: "Error",
          description: "Failed to load words",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [limit, toast],
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData(search, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, loadData]);

  // Load data when page or limit changes
  useEffect(() => {
    loadData(search, page);
  }, [page, limit, loadData, search]);

  const handleOpenDialog = (word?: Word) => {
    if (word) {
      setEditingWord(word);
      setFormData({
        word: word.word,
        pronunciation: word.pronunciation,
        part_of_speech: word.part_of_speech || "",
        description: word.description || "",
      });
    } else {
      setEditingWord(null);
      setFormData({
        word: "",
        pronunciation: "",
        part_of_speech: "",
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    if (editingWord) {
      editingWord.word = formData.word;
      editingWord.pronunciation = formData.pronunciation;
      editingWord.part_of_speech = formData.part_of_speech;
      editingWord.description = formData.description;

      const response = await fetch("/api/admin/words/" + editingWord.id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingWord),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Word updated",
          description: result.success
            ? `"${formData.word}" has been updated.`
            : `Failed to update ${formData.word}  `,
        });
        setIsDialogOpen(false);
        await loadData(search, page);
      }
    } else {
      try {
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
          toast({
            title: "Word added",
            description: `"${formData.word}" has been added.`,
          });
          await loadData(search, 1);
          return;
        }
      } catch (err) {
        console.log("created error: ", err);
        toast({
          title: "Error",
          description: "Failed to add word",
          variant: "destructive",
        });
      }
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    const response = await fetch("/api/admin/words/" + id, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      toast({
        title: "Word deleted",
        description: `Word has been removed.`,
      });
      await loadData(search, page);
    } else {
      toast({
        title: "Error",
        description: "Failed to delete word",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="ຈັດການຄຳສັບ"
        description="ເພີ່ມ, ແກ້ໄຂ ແລະ ລຶບຄຳສັບ"
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4" />
            ເພີ່ມຄຳສັບ
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
        <Input
          placeholder="Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 sm:pl-10 py-2 text-sm sm:text-base"
        />
      </div>

      {/* Words Table */}
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden animate-fade-in">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ຄຳສັບ</TableHead>
                <TableHead>ຄຳອະທິບາຍ</TableHead>
                <TableHead className="w-[100px]">ຈັດການ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {words.map((word) => (
                <TableRow key={word.id}>
                  <TableCell className="font-medium text-primary">
                    {word.word}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <span className="truncate text-sm">{word.description}</span>
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
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    ບໍ່ພົບຄຳສັບ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-3">
          {words.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ບໍ່ພົບຄຳສັບ
            </div>
          ) : (
            words.map((word) => (
              <div
                key={word.id}
                className="bg-muted/40 rounded-lg border border-border/50 p-4 space-y-3"
              >
                {/* Word and Actions */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base text-primary break-words flex-1">
                      {word.word}
                    </h3>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(word)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(word.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Pronunciation */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">ສຽງອອກ: </span>
                    {word.pronunciation}
                  </div>

                  {/* Part of Speech */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">ປະເພດຄຳ: </span>
                    {word.part_of_speech}
                  </div>
                </div>

                {/* Description Section */}
                {word.description && (
                  <div className="border-t border-border/30 pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      ຄຳອະທິບາຍ
                    </p>
                    <div className="space-y-2">
                      <p className="text-foreground text-xs line-clamp-3">
                        {word.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto text-center sm:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              Page <span className="font-medium">{page}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </p>

            <Select
              value={limit.toString()}
              onValueChange={(v) => {
                setLimit(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-28 sm:w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / ໜ້າ</SelectItem>
                <SelectItem value="20">20 / ໜ້າ</SelectItem>
                <SelectItem value="50">50 / ໜ້າ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 px-2 sm:px-3"
            >
              <span className="hidden sm:inline">ກ່ອນ</span>
              <span className="sm:hidden">← ຫຼັງ</span>
            </Button>

            <div className="flex gap-0.5 sm:gap-1">
              {Array.from(
                { length: Math.min(5, totalPages) },
                (_, i) => i + 1,
              ).map((num) => (
                <Button
                  key={num}
                  variant={page === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(num)}
                  className="w-8 h-9 p-0"
                >
                  {num}
                </Button>
              ))}
              {totalPages > 5 && (
                <span className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
                  ...
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 px-2 sm:px-3"
            >
              <span className="hidden sm:inline">ຕໍ່ໄປ</span>
              <span className="sm:hidden">ຕໍ່ໄປ →</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWord ? "ແກ້ໄຂຄຳສັບ" : "ເພີ່ມຄຳສັບໃໝ່"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="word">ຄຳສັບ</Label>
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
              <Label htmlFor="pronunciation">ການອອກສຽງ (karaoke)</Label>
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
              <Label htmlFor="part_of_speech">ສະພາບຂອງຄຳສັບ</Label>
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
            <div className="space-y-2">
              <Label htmlFor="description">ຄຳອະທິບາຍ</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter the description"
                className="min-h-[80px]"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              {isLoading ? (
                <Button disabled={isLoading}>
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ກຳລັງສ້າງ...
                  </span>
                </Button>
              ) : (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    className="px-2"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    ຍົກເລີກ
                  </Button>
                  <Button type="submit" className="px-2 ml-2">
                    {editingWord ? "ອັບເດດ" : "ເພີ່ມ"}ຄຳສັບ
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
