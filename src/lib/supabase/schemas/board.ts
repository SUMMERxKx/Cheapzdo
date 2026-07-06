import { z } from "zod";

// Board creation input, shared by the onboarding form and the data layer so the
// rules live in one place. Matches the create_board RPC limits.
export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Give your board a name").max(120),
  arcSize: z.number().int().min(1).max(24),
  sprintLengthDays: z.number().int().min(1).max(60),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
