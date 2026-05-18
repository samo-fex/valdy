import type { PRD, Feature } from './types';
import { callLLM } from './llm';
import { stripCodeFences } from '@/src/lib/utils';

const SYSTEM_PROMPT = `You are a software architect. Decompose this PRD into implementable UI features for a single-page HTML mockup.

RULES:
1. Feature 1: HTML scaffold + design system (fonts, CSS variables, color palette, reset)
2. Feature 2: Navigation/header section
3. Features 3-N: Visual sections top-to-bottom (hero, features, content, testimonials, pricing, CTA, footer)
4. Last feature: Polish, animations, scroll effects, responsive fixes
5. Total: 5-7 features maximum (NEVER more than 7)
6. Each feature must reference its FR-xxx and US-xxx IDs where applicable

Return ONLY a JSON object with a "features" array. Each feature object must have:
- id: "feat-001", "feat-002", etc.
- name: short descriptive name
- description: detailed implementation instructions
- priority: number (1 = first to implement)
- fr_id: linked functional requirement ID or null
- story_ids: array of linked user story IDs
- nfr_ids: array of linked NFR IDs
- acceptance_criteria: array of strings

Return ONLY valid JSON. No markdown, no explanation.`;

export async function decomposePRDToFeatures(prd: PRD): Promise<Feature[]> {
  const prdText = formatPRD(prd);

  const response = await callLLM([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Decompose this PRD into features:\n\n${prdText}` },
  ], { json: true, maxTokens: 4096 });

  let parsed: any[];
  try {
    const data = JSON.parse(stripCodeFences(response));
    parsed = Array.isArray(data) ? data : data.features || [];
  } catch {
    throw new Error('Failed to parse features JSON');
  }

  return parsed.map((f: any, i: number) => ({
    id: f.id || `feat-${String(i + 1).padStart(3, '0')}`,
    name: f.name || `Feature ${i + 1}`,
    description: f.description || '',
    status: 'pending' as const,
    priority: f.priority || i + 1,
    fr_id: f.fr_id || undefined,
    story_ids: f.story_ids || [],
    nfr_ids: f.nfr_ids || [],
    acceptance_criteria: f.acceptance_criteria || [],
    attempts: 0,
  }));
}

function formatPRD(prd: PRD): string {
  const sections: string[] = [];
  sections.push(`## Executive Summary\n${prd.executive_summary}`);

  if (prd.target_users.length > 0) {
    sections.push('## Target Users');
    for (const u of prd.target_users) {
      sections.push(`- [${u.id}] ${u.persona}: ${u.description}`);
    }
  }

  if (prd.user_stories.length > 0) {
    sections.push('## User Stories');
    for (const s of prd.user_stories) {
      sections.push(`- [${s.id}] (${s.persona_id}) ${s.story}`);
      for (const ac of s.acceptance_criteria) {
        sections.push(`  - AC: ${ac}`);
      }
    }
  }

  if (prd.functional_requirements.length > 0) {
    sections.push('## Functional Requirements');
    for (const fr of prd.functional_requirements) {
      sections.push(`- [${fr.id}] ${fr.name} (priority: ${fr.priority}, stories: ${fr.story_ids.join(', ') || 'none'})`);
      sections.push(`  ${fr.description}`);
    }
  }

  if (prd.non_functional_requirements.length > 0) {
    sections.push('## Non-Functional Requirements');
    for (const nfr of prd.non_functional_requirements) {
      const applies = Array.isArray(nfr.applies_to) ? nfr.applies_to.join(', ') : nfr.applies_to;
      sections.push(`- [${nfr.id}] ${nfr.name} (${nfr.category}, applies to: ${applies})`);
      sections.push(`  ${nfr.description}${nfr.target ? ` Target: ${nfr.target}` : ''}`);
    }
  }

  return sections.join('\n\n');
}
