import { z } from "zod";

export const createSubmissionSchema = z.object({
  sessionId: z.string().min(1),
  githubUrl: z
    .string()
    .url("올바른 URL을 입력해주세요")
    .refine((url) => url.includes("github.com"), "GitHub URL이어야 합니다")
    .optional()
    .or(z.literal("")),
  fileAssetId: z.string().optional(),
  message: z.string().optional().default(""),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
