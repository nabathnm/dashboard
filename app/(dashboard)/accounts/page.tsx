"use client";

import { useState } from "react";
import { Plus, Landmark, Smartphone, Banknote, PiggyBank, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAccountSchema, type CreateAccountFormValues } from "@/lib/schemas/account";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "@/hooks/use-accounts";
import { formatCurrency } from "@/hooks/use-currency";
import type { Account } from "@/types/database";

const typeIcons: Record<string, React.ElementType> = {
  bank: Landmark,
  ewallet: Smartphone,
  cash: Banknote,
  savings: PiggyBank,
};

const typeColors: Record<string, string> = {
  bank: "from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/20",
  ewallet: "from-violet-500/20 to-violet-600/20 text-violet-400 border-violet-500/20",
  cash: "from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/20",
  savings: "from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/20",
};

export default function AccountsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: accounts, isLoading } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema) as any,
    defaultValues: { type: "bank", is_active: true, balance: 0 },
  });

  const watchType = watch("type");

  const openAddDialog = () => {
    setEditingAccount(null);
    reset({ type: "bank", is_active: true, balance: 0 });
    setDialogOpen(true);
  };

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    reset({
      name: account.name,
      type: account.type as any,
      balance: account.balance,
      is_active: account.is_active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: CreateAccountFormValues) => {
    if (editingAccount) {
      await updateMutation.mutateAsync({ id: editingAccount.id, data: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const totalBalance = (accounts ?? [])
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your bank accounts, e-wallets, and cash</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={
            <Button onClick={openAddDialog} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 shadow-lg shadow-violet-500/20">
              <Plus className="mr-2 h-4 w-4" /> Add Account
            </Button>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit Account" : "New Account"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-xs">Account Name</Label>
                <Input placeholder="e.g., Main Checking, Cash, GoPay" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Account Type</Label>
                <Select value={watchType} onValueChange={(v) => { if (typeof v === "string") setValue("type", v as any) }}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="ewallet">E-Wallet</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">{editingAccount ? "Current Balance" : "Initial Balance"}</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register("balance")} />
                {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Input type="checkbox" id="is_active" className="w-4 h-4 rounded" {...register("is_active")} />
                <Label htmlFor="is_active" className="text-sm font-medium leading-none cursor-pointer">Active Account</Label>
              </div>

              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 mt-4">
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/30 bg-card/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl -z-10" />
        <CardHeader className="pb-2">
          <CardDescription>Total Net Worth</CardDescription>
          <CardTitle className="text-4xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-10 w-48 mt-1" /> : formatCurrency(totalBalance)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Across {(accounts ?? []).filter(a => a.is_active).length} active accounts
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/30 bg-card/50"><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : !accounts?.length ? (
          <div className="col-span-full py-12 text-center border rounded-xl border-dashed border-border/50">
            <Landmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium">No accounts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">You haven't added any accounts yet. Create one to start tracking your finances.</p>
            <Button onClick={openAddDialog} variant="outline">Add your first account</Button>
          </div>
        ) : (
          accounts.map((account) => {
            const Icon = typeIcons[account.type] || Landmark;
            const styleClass = typeColors[account.type] || typeColors.bank;

            return (
              <Card key={account.id} className={`border-border/30 bg-card/50 relative overflow-hidden transition-all hover:border-border/50 group ${!account.is_active ? 'opacity-60 grayscale' : ''}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${styleClass.split(' ')[0]} ${styleClass.split(' ')[1]} rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100`} />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br ${styleClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(account)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(account.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{account.name}</h3>
                      {!account.is_active && <span className="text-[10px] uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold tracking-wider">Inactive</span>}
                    </div>
                    <p className="text-2xl font-bold tabular-nums tracking-tight mb-1">{formatCurrency(account.balance)}</p>
                    <p className="text-xs text-muted-foreground capitalize font-medium">{account.type} Account</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will delete the account and potentially break associated transactions. 
              Consider marking it as inactive instead if you have historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
