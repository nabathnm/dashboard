import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountsService } from "@/services/accounts.service";
import type { CreateAccountDTO, UpdateAccountDTO } from "@/types/database";
import { toast } from "sonner";

export const accountKeys = {
  all: ["accounts"] as const,
  active: ["accounts", "active"] as const,
  detail: (id: string) => ["accounts", id] as const,
  totalBalance: ["accounts", "totalBalance"] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () => accountsService.getAll(),
  });
}

export function useActiveAccounts() {
  return useQuery({
    queryKey: accountKeys.active,
    queryFn: () => accountsService.getActive(),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountsService.getById(id),
    enabled: !!id,
  });
}

export function useTotalBalance() {
  return useQuery({
    queryKey: accountKeys.totalBalance,
    queryFn: () => accountsService.getTotalBalance(),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountDTO) => accountsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.active });
      queryClient.invalidateQueries({ queryKey: accountKeys.totalBalance });
      toast.success("Account created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create account");
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountDTO }) =>
      accountsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.active });
      queryClient.invalidateQueries({ queryKey: accountKeys.totalBalance });
      toast.success("Account updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update account");
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.active });
      queryClient.invalidateQueries({ queryKey: accountKeys.totalBalance });
      toast.success("Account deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });
}

export function useToggleAccountActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      accountsService.toggleActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.active });
      toast.success("Account status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update account status");
    },
  });
}
