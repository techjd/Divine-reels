import { ReportEntityType, ReportReasonCode } from '@prisma/client';
import { z } from 'zod';

// Schema for creating a report.
export const CreateReportBodySchema = z.object({
  entityType: z.nativeEnum(ReportEntityType),
  entityId: z.string().trim().min(1),
  reasonCode: z.nativeEnum(ReportReasonCode),
  reasonText: z.string().trim().optional()
});

// Optional schema for admin listing filters.
export const GetReportsQuerySchema = z.object({
  entityType: z.nativeEnum(ReportEntityType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateReportBody = z.infer<typeof CreateReportBodySchema>;
export type GetReportsQuery = z.infer<typeof GetReportsQuerySchema>;
