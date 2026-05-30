"use client";

import { Suspense } from "react";
import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Trash2, Mail, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransactionSchema, type CreateTransactionFormValues } from "@/lib/schemas/transaction";
import { useTransactions, useCreateTransaction, useDeleteTransaction, useTransactionCategories } from "@/hooks/use-transactions";
import { useActiveAccounts } from "@/hooks/use-accounts";
import { formatCurrency } from "@/hooks/use-currency";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TransactionFilters, TransactionType } from "@/types/database";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  expense: { icon: ArrowUpRight, color: "text-rose-400", bg: "bg-rose-500/10", label: "Expense" },
  income: { icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Income" },
  transfer: { icon: ArrowLeftRight, color: "text-blue-400", bg: "bg-blue-500/10", label: "Transfer" },
};

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");
  const initialType = searchParams.get("type") as TransactionType | null;

  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, per_page: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(initialAction === "add");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const queryClient = useQueryClient();
  const debouncedSearch = useMemo(() => searchTerm, [searchTerm]);
  const activeFilters = useMemo(() => ({ ...filters, search: debouncedSearch || undefined }), [filters, debouncedSearch]);

  const { data: result, isLoading } = useTransactions(activeFilters);
  const { data: categories } = useTransactionCategories();
  const { data: accounts } = useActiveAccounts();
  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema) as any,
    defaultValues: { type: initialType || "expense", date: format(new Date(), "yyyy-MM-dd"), amount: 0 },
  });

  const watchType = watch("type");

  const onSubmit = useCallback(async (values: CreateTransactionFormValues) => {
    await createMutation.mutateAsync(values);
    reset();
    setDialogOpen(false);
  }, [createMutation, reset]);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteMutation]);

  const handleSyncGmail = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/gmail/sync", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }
      
      if (data.syncedCount > 0) {
        toast.success(`Successfully synced ${data.syncedCount} new transaction(s) from Gmail!`);
      } else {
        toast.info("No new transactions found in your Gmail inbox.");
      }
      
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to sync transactions from Gmail.");
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your income, expenses, and transfers</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncGmail} 
            disabled={isSyncing}
            className="border-border/30 hover:bg-muted/20 flex items-center gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin text-violet-400" />
            ) : (
              <Mail className="h-4 w-4 text-violet-400" />
            )}
            {isSyncing ? "Syncing..." : "Sync Gmail"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 shadow-lg shadow-violet-500/20">
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>}>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(["expense", "income", "transfer"] as const).map((t) => {
                  const cfg = typeConfig[t];
                  return (
                    <button key={t} type="button"
                      onClick={() => setValue("type", t)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all ${watchType === t ? `border-primary ${cfg.bg}` : "border-border/50 hover:border-border"}`}
                    >
                      <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Amount</Label>
                <Input type="number" placeholder="0" className="h-11 text-lg font-bold" {...register("amount", { valueAsNumber: true })} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Account</Label>
                <Select onValueChange={(v) => { if (typeof v === "string") setValue("account_id", v) }}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {(accounts ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
              </div>

              {watchType === "transfer" && (
                <div className="space-y-2">
                  <Label className="text-xs">Transfer To</Label>
                  <Select onValueChange={(v) => { if (typeof v === "string") setValue("destination_account_id", v) }}>
                    <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>
                      {(accounts ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {watchType !== "transfer" && (
                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <Select onValueChange={(v) => { if (typeof v === "string") setValue("category_id", v) }}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).filter((c) => c.type === watchType).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Date</Label>
                <Input type="date" {...register("date")} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Textarea placeholder="Optional description..." rows={2} {...register("description")} />
              </div>

              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                {createMutation.isPending ? "Saving..." : "Save Transaction"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Filters */}
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-10 bg-background/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select onValueChange={(v) => setFilters((f) => ({ ...f, type: v === "all" || !v ? undefined : v as TransactionType, page: 1 }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => setFilters((f) => ({ ...f, account_id: v === "all" || !v ? undefined : (v as string), page: 1 }))}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All accounts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {(accounts ?? []).map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => setFilters((f) => ({ ...f, category_id: v === "all" || !v ? undefined : (v as string), page: 1 }))}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(categories ?? []).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Account</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/20">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !result?.data.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                result.data.map((tx) => {
                  const cfg = typeConfig[tx.type];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={tx.id} className="border-border/20 hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(tx.transaction_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${cfg.bg} ${cfg.color} border-0 text-[10px]`}>
                          <Icon className="mr-1 h-3 w-3" />{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">{tx.merchant || tx.note || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.account?.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.category?.name || "-"}</TableCell>
                      <TableCell className={`text-sm font-semibold tabular-nums text-right ${tx.type === "expense" ? "text-rose-400" : tx.type === "income" ? "text-emerald-400" : ""}`}>
                        {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}{formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(tx.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {result && result.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {result.page} of {result.total_pages} ({result.count} total)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={result.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={result.page >= result.total_pages} onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
