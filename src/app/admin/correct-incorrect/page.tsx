"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CorrectIncorrectWord } from "@/types";
import { useToast } from "@/app/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Shared responsive pagination rendered below both table and card views */
function Pagination({
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-border bg-muted/30">
      {/* Left: page info + per-page selector */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Page {page} of {totalPages}
        </p>
        <Select
          value={limit.toString()}
          onValueChange={(value) => {
            onLimitChange(Number(value));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right: page buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          );
        })}
        {totalPages > 5 && (
          <span className="px-2 text-sm text-muted-foreground">…</span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function CorrectIncorrect() {
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<CorrectIncorrectWord[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<CorrectIncorrectWord | null>(
    null
  );
  const [formData, setFormData] = useState({
    correct_word: "",
    incorrect_word: "",
    explanation: "",
  });
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`/api/admin/correct-incorrect?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPairs(data.words);
      setTotalPages(data.pagination.totalPages);
      setPage(data.pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, limit]);

  const handleOpenDialog = (pair?: CorrectIncorrectWord) => {
    if (pair) {
      setEditingPair(pair);
      setFormData({
        correct_word: pair.correct_word,
        incorrect_word: pair.incorrect_word,
        explanation: pair.explanation || "",
      });
    } else {
      setEditingPair(null);
      setFormData({ correct_word: "", incorrect_word: "", explanation: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingPair) {
      editingPair.correct_word = formData.correct_word;
      editingPair.incorrect_word = formData.incorrect_word;
      editingPair.explanation = formData.explanation;

      await fetch("/api/admin/correct-incorrect/" + editingPair.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPair),
      });
      toast({ title: "Pair updated", description: "The word pair has been updated." });
    } else {
      await fetch("/api/admin/correct-incorrect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      toast({ title: "Pair added", description: "The word pair has been added." });
    }
    setLoading(false);
    setIsDialogOpen(false);
    await loadData();
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/admin/correct-incorrect/" + id, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    toast({ title: "Pair deleted", description: "The word pair has been removed." });
    await loadData();
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Correct & Incorrect Words"
        description="Manage commonly confused word pairs"
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4" />
            Add Pair
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search word pairs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden animate-fade-in">
        {/* ── Desktop Table (md+) ── */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Correct Word</TableHead>
                <TableHead>Incorrect/Confused</TableHead>
                <TableHead>Explanation</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin inline-block text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : pairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No word pairs found
                  </TableCell>
                </TableRow>
              ) : (
                pairs.map((pair) => (
                  <TableRow key={pair.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                        <Check className="w-3.5 h-3.5" />
                        {pair.correct_word}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                        <X className="w-3.5 h-3.5" />
                        {pair.incorrect_word}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-muted-foreground truncate">
                        {pair.explanation}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pair)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pair.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Mobile Card List (< md) ── */}
        <div className="block md:hidden divide-y divide-border">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : pairs.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">
              No word pairs found
            </p>
          ) : (
            pairs.map((pair) => (
              <div key={pair.id} className="p-4 space-y-3">
                {/* Word badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                    <Check className="w-3.5 h-3.5" />
                    {pair.correct_word}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                    <X className="w-3.5 h-3.5" />
                    {pair.incorrect_word}
                  </span>
                </div>
                {/* Explanation */}
                {pair.explanation && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pair.explanation}
                  </p>
                )}
                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => handleOpenDialog(pair)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => handleDelete(pair.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPair ? "Edit Word Pair" : "Add New Word Pair"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="correctWord">Correct Word</Label>
              <Input
                id="correctWord"
                value={formData.correct_word}
                onChange={(e) =>
                  setFormData({ ...formData, correct_word: e.target.value })
                }
                placeholder="Enter the correct word"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incorrectWord">Incorrect/Confused Word</Label>
              <Input
                id="incorrectWord"
                value={formData.incorrect_word}
                onChange={(e) =>
                  setFormData({ ...formData, incorrect_word: e.target.value })
                }
                placeholder="Enter the incorrect or confused word"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                placeholder="Explain the difference between the words"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>{editingPair ? "Update" : "Add"} Pair</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
