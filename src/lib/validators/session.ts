import { z } from "zod";

export const blockSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(0),
  type: z.enum(["FLOW", "TIMELINE"]),
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().optional().default(""),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
});

export const createSessionSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  date: z.string().min(1, "날짜를 입력해주세요"),
  summary: z.string().min(1, "요약을 입력해주세요"),
  goals: z.array(z.string()).min(1, "목표를 최소 1개 입력해주세요"),
  prerequisites: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  location: z.string().nullable().optional(),
  presenterId: z.string().nullable().optional(),
  blocks: z.array(blockSchema).default([]),
});

export const updateSessionSchema = createSessionSchema.partial();

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type BlockInput = z.infer<typeof blockSchema>;
