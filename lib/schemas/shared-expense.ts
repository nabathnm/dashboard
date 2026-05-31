import { z } from "zod";

const participantSchema = z.object({
  name: z.string().min(1, "Participant name is required"),
  amount_owed: z.coerce.number().positive("Amount must be greater than 0"),
});

export const createSharedExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  total_amount: z.coerce.number().positive("Total amount must be greater than 0"),
  description: z.string().max(500).optional(),
  date: z.string().min(1, "Please select a date"),
  participants: z
    .array(participantSchema)
    .min(1, "At least one participant is required"),
});

export const markPaidSchema = z.object({
  participant_id: z.string().min(1),
  amount_paid: z.coerce.number().min(0),
});

export type CreateSharedExpenseFormValues = z.infer<typeof createSharedExpenseSchema>;
export type MarkPaidFormValues = z.infer<typeof markPaidSchema>;
