import { z } from "zod";

// Board creation input, shared by the create board dialog and the data layer so
// the rules live in one place. Matches the create_board RPC limits.
export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Give your board a name").max(120),
  arcSize: z.number().int().min(1).max(24),
  sprintLengthDays: z.number().int().min(1).max(60),
  // Optional first sprint start as YYYY-MM-DD. Left off means the RPC defaults
  // to today. Lets a new team start their first sprint tomorrow or later.
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
    .optional(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
