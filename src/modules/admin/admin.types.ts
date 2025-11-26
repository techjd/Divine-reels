import { ReportEntityType } from '@prisma/client';
import { z } from 'zod';

// Types for admin actions and placeholders.
export interface AdminActionResult {
  action: string;
  status: string;
}

export const GetReportsQuerySchema = z.object({
  entityType: z.nativeEnum(ReportEntityType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type GetReportsQuery = z.infer<typeof GetReportsQuerySchema>;

export type ReportSummaryDto = {
  entityType: ReportEntityType;
  entityId: string;
  reportCount: number;
  reasonBreakdown: Record<string, number>;
  lastReportedAt: Date;
  isBanned: boolean;
  previewTitle: string;
  previewText: string | null;
  previewThumbnailUrl: string | null;
  previewExtra: Record<string, unknown>;
};
