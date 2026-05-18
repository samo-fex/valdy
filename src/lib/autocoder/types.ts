import { z } from 'zod';

export const PRDSchema = z.object({
  executive_summary: z.string(),
  target_users: z.array(z.object({
    id: z.string(),
    persona: z.string(),
    age_range: z.string().optional().default(''),
    description: z.string(),
    pain_points: z.array(z.string()).optional().default([]),
    primary_need: z.string().optional().default(''),
  })).default([]),
  user_stories: z.array(z.object({
    id: z.string(),
    persona_id: z.string(),
    story: z.string(),
    acceptance_criteria: z.array(z.string()).optional().default([]),
  })).default([]),
  functional_requirements: z.array(z.object({
    id: z.string(),
    name: z.string(),
    story_ids: z.array(z.string()).optional().default([]),
    priority: z.number().optional().default(1),
    description: z.string(),
  })).default([]),
  non_functional_requirements: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    applies_to: z.union([z.array(z.string()), z.literal('global')]).optional().default('global'),
    description: z.string(),
    target: z.string().optional().default(''),
  })).default([]),
});

export type PRD = z.infer<typeof PRDSchema>;

export interface Feature {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  priority: number;
  fr_id?: string;
  story_ids: string[];
  nfr_ids: string[];
  acceptance_criteria: string[];
  attempts: number;
}

export interface AutoCoderEvent {
  type: 'pipeline_started' | 'phase_started' | 'feature_started' | 'feature_completed' | 'feature_skipped' | 'feature_error' | 'progress' | 'preview_updated' | 'pipeline_completed' | 'error';
  timestamp: string;
  [key: string]: unknown;
}

export interface AutoCoderSession {
  html: string;
  events: AutoCoderEvent[];
  features: Feature[];
  status: 'running' | 'completed' | 'error';
}
