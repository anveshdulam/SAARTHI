import { z } from "zod";

export const CreateScheduleProposalResultSchema = z.object({
  status: z.string(),
  planId: z.string(),
  version: z.number(),
  supersedes_version: z.number().nullable(),
  explanation: z.string(),
  totalScheduledBlocks: z.number(),
  conflictsCount: z.number(),
  blocks: z.array(z.object({
    commitmentId: z.string(),
    startTime: z.string(),
    endTime: z.string()
  }))
});
