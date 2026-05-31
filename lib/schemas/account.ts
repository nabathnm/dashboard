import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(50),
  type: z.enum(["bank", "ewallet", "cash", "savings"] as const, {
    error: "Please select an account type",
  }),
  balance: z.coerce.number().min(0, "Balance cannot be negative"),
  color: z.string().optional(),
  icon: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>;
