"use client";

import { useState } from "react";
import { Plus, Users, User, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSharedExpenseSchema, type CreateSharedExpenseFormValues } from "@/lib/schemas/shared-expense";
import { useSharedExpenses, useCreateSharedExpense, useMarkParticipantPaid } from "@/hooks/use-shared-expenses";
import { useActiveAccounts } from "@/hooks/use-accounts";
import { formatCurrency } from "@/hooks/use-currency";
import type { SharedExpenseStatus } from "@/types/database";

export default function SharedExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: expenses, isLoading } = useSharedExpenses();
  const { data: accounts } = useActiveAccounts();
  const createMutation = useCreateSharedExpense();
  const updateStatusMutation = useMarkParticipantPaid();

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateSharedExpenseFormValues>({
    resolver: zodResolver(createSharedExpenseSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      total_amount: 0,
      participants: [{ name: "", amount_owed: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const openAddDialog = () => {
    reset({
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      total_amount: 0,
      participants: [{ name: "", amount_owed: 0 }],
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: CreateSharedExpenseFormValues) => {
    await createMutation.mutateAsync(values);
    setDialogOpen(false);
  };

  const handleToggleStatus = async (expenseId: string, participantId: string, currentStatus: string, currentAmountOwed: number) => {
    const newAmount = currentStatus === "paid" ? 0 : currentAmountOwed;
    await updateStatusMutation.mutateAsync({ participantId, amountPaid: newAmount });
  };

  const totalOwedToYou = (expenses ?? [])
    .filter(e => e.status !== "settled")
    .reduce((sum, e) => sum + (e.participants || []).filter(p => p.payment_status === "unpaid").reduce((pSum, p) => pSum + Number(p.amount_owed), 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shared Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track money owed to you by friends or colleagues</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={
            <Button onClick={openAddDialog} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 shadow-lg shadow-amber-500/20 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Split Bill
            </Button>
          } />
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Shared Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-xs">Title</Label>
                <Input placeholder="e.g., Dinner at Italian Restaurant" {...register("title")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Description (Optional)</Label>
                <Input placeholder="Extra details..." {...register("description")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Total Amount</Label>
                  <Input type="number" step="0.01" placeholder="0.00" {...register("total_amount")} />
                  {errors.total_amount && <p className="text-xs text-destructive">{errors.total_amount.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" {...register("date")} />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Participants</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => append({ name: "", amount_owed: undefined as unknown as number })} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add Person
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input placeholder="Name" {...register(`participants.${index}.name`)} className="h-9" />
                    </div>
                    <div className="w-1/3">
                      <Input type="number" step="0.01" placeholder="Amount" {...register(`participants.${index}.amount_owed`)} className="h-9" />
                    </div>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon-sm" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {errors.participants && <p className="text-xs text-destructive">{errors.participants.message}</p>}
              </div>

              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white mt-6">
                {createMutation.isPending ? "Saving..." : "Save Shared Expense"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/30 bg-card/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Owed To You</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalOwedToYou)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Active & Recent Bills</h3>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/30 bg-card/50">
              <CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))
        ) : !expenses?.length ? (
          <div className="py-12 text-center border rounded-xl border-dashed border-border/50 bg-card/50">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium">No shared expenses</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">You haven't added any shared bills. Keep track of who owes you money here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {expenses.map((expense) => {
              const allSettled = expense.status === "settled";
              const pendingCount = (expense.participants || []).filter((p) => p.payment_status === "unpaid").length;

              return (
                <Card key={expense.id} className={`border-border/30 bg-card/50 transition-all ${allSettled ? 'opacity-60 grayscale hover:grayscale-0' : ''}`}>
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{expense.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {format(new Date(expense.date), "MMM dd, yyyy")} • Total: {formatCurrency(expense.total_amount)}
                        {expense.description && <span className="block mt-1">{expense.description}</span>}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className={
                      allSettled ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    }>
                      {allSettled ? "Settled" : `${pendingCount} Pending`}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="mt-4 space-y-2">
                      {(expense.participants || []).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background border">
                              <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold tabular-nums">{formatCurrency(p.amount_owed)}</span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className={p.payment_status === "paid" ? "text-emerald-500 hover:text-emerald-600" : "text-muted-foreground hover:text-foreground"}
                              onClick={() => handleToggleStatus(expense.id, p.id, p.payment_status, p.amount_owed)}
                            >
                              {p.payment_status === "paid" ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
