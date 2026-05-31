import { z } from "zod";

export const createTransactionSchema = z
  .object({
    account_id: z.string().min(1, "Please select an account"),
    category_id: z.string().optional(),
    destination_account_id: z.string().optional(),
    type: z.enum(["expense", "income", "transfer"] as const, {
      error: "Please select a transaction type",
    }),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    description: z.string().max(255).optional(),
    date: z.string().min(1, "Please select a date"),
  })
  .refine(
    (data) => {
      if (data.type === "transfer") {
        return !!data.destination_account_id;
      }
      return true;
    },
    {
      message: "Please select a destination account for transfer",
      path: ["destination_account_id"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "transfer") {
        return data.account_id !== data.destination_account_id;
      }
      return true;
    },
    {
      message: "Source and destination accounts must be different",
      path: ["destination_account_id"],
    }
  );

export const updateTransactionSchema = createTransactionSchema;

export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["expense", "income", "transfer"]).optional(),
  category_id: z.string().optional(),
  account_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>;
export type TransactionFilterValues = z.infer<typeof transactionFilterSchema>;
