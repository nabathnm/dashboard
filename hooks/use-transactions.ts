import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactions.service";
import type {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilters,
  Transaction,
} from "@/types/database";
import { accountKeys } from "./use-accounts";
import { toast } from "sonner";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) => ["transactions", "list", filters] as const,
  recent: (limit?: number) => ["transactions", "recent", limit] as const,
  categories: ["transactions", "categories"] as const,
  monthlyTotals: (year: number, month: number) =>
    ["transactions", "monthlyTotals", year, month] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionsService.getAll(filters),
  });
}

export function useRecentTransactions(limit: number = 5) {
  return useQuery({
    queryKey: transactionKeys.recent(limit),
    queryFn: () => transactionsService.getRecent(limit),
  });
}

export function useTransactionCategories() {
  return useQuery({
    queryKey: transactionKeys.categories,
    queryFn: () => transactionsService.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes — categories rarely change
  });
}

export function useMonthlyTotals(year: number, month: number) {
  return useQuery({
    queryKey: transactionKeys.monthlyTotals(year, month),
    queryFn: () => transactionsService.getMonthlyTotals(year, month),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionDTO) => transactionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.totalBalance });
      toast.success("Transaction created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create transaction");
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      oldTransaction,
    }: {
      id: string;
      data: UpdateTransactionDTO;
      oldTransaction: Transaction;
    }) => transactionsService.update(id, data, oldTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.totalBalance });
      toast.success("Transaction updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update transaction");
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.totalBalance });
      toast.success("Transaction deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete transaction");
    },
  });
}
