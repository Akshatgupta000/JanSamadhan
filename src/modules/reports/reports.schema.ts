import { z } from 'zod';
import { RecurrenceType, SeverityLevel, UrgencyLevel, Visibility } from '@prisma/client';

export const createReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  domain: z.string().min(2, 'Domain is required'),
  subdomain: z.string().optional(),
  problemType: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  address: z.string().optional(),
  villageOrTown: z.string().optional(),
  district: z.string().min(2, 'District is required'),
  state: z.string().default('Jharkhand'),
  estimatedAffectedPopulation: z.coerce.number().int().nonnegative().default(0),
  firstObservedDate: z.string().datetime().optional(),
  recurrence: z.nativeEnum(RecurrenceType).default(RecurrenceType.ONCE),
  severity: z.nativeEnum(SeverityLevel).default(SeverityLevel.MEDIUM),
  urgency: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.MEDIUM),
  publicSafetyConcern: z.boolean().default(false),
  supportingText: z.string().optional(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
});

export const updateReportSchema = createReportSchema.partial();

