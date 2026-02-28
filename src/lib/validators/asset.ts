import { z } from "zod";

export const assetKindEnum = z.enum(["SESSION_SLIDE", "LAB_SLIDE", "CODE", "ETC"]);

export const createAssetSchema = z.object({
  sessionId: z.string().min(1),
  kind: assetKindEnum,
  title: z.string().min(1, "자료 제목을 입력해주세요"),
  description: z.string().optional().default(""),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
