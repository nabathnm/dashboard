import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sharedExpensesService } from "@/services/shared-expenses.service";
import type { CreateSharedExpenseDTO } from "@/types/database";
import { toast } from "sonner";

export const sharedExpenseKeys = {
  all: ["shared-expenses"] as const,
  detail: (id: string) => ["shared-expenses", id] as const,
  outstanding: ["shared-expenses", "outstanding"] as const,
};

export function useSharedExpenses() {
  return useQuery({
    queryKey: sharedExpenseKeys.all,
    queryFn: () => sharedExpensesService.getAll(),
  });
}

export function useSharedExpense(id: string) {
  return useQuery({
    queryKey: sharedExpenseKeys.detail(id),
    queryFn: () => sharedExpensesService.getById(id),
    enabled: !!id,
  });
}

export function useOutstandingTotal() {
  return useQuery({
    queryKey: sharedExpenseKeys.outstanding,
    queryFn: () => sharedExpensesService.getOutstandingTotal(),
  });
}

export function useCreateSharedExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSharedExpenseDTO) =>
      sharedExpensesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: sharedExpenseKeys.outstanding });
      toast.success("Shared expense created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create shared expense");
    },
  });
}

export function useMarkParticipantPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      participantId,
      amountPaid,
    }: {
      participantId: string;
      amountPaid: number;
    }) => sharedExpensesService.markParticipantPaid(participantId, amountPaid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: sharedExpenseKeys.outstanding });
      toast.success("Payment marked successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark payment");
    },
  });
}

export function useDeleteSharedExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sharedExpensesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: sharedExpenseKeys.outstanding });
      toast.success("Shared expense deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete shared expense");
    },
  });
}
