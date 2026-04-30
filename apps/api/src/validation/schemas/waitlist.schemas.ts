import { z } from "zod";

export const WaitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
  tier_interest: z.enum(["pro", "family"]).optional(),
  source: z.string().max(50).optional(),
});
