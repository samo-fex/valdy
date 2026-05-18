import type { Feature, PRD } from './types';
import { callLLM } from './llm';
import type { DesignSystem } from './designer';
import { stripCodeFences } from '@/src/lib/utils';

export interface ValidationCheck {
  name: string;
  passed: boolean;
  feedback: string;
}

export interface ValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
}

const SYSTEM_PROMPT = `You are a world-class UI/UX designer and frontend developer. You build stunning single-page HTML mockups.

OUTPUT: Return ONLY the complete updated index.html content. No markdown fences, no explanation — just raw HTML starting with <!DOCTYPE html>.

DESIGN RULES:
- Single index.html with ALL CSS in <style> and ALL JS in <script>
- Google Fonts via CDN — pick distinctive fonts, not just Inter
- Fully responsive (320px to 2560px)
- CSS custom properties for theming
- Vanilla JS only — no frameworks
- Bold, distinctive typography with dramatic size contrast
- Unexpected color combos — NOT default blue/purple gradients
- CSS animations with cubic-bezier timing
- Never use plain white backgrounds — use gradients, noise, subtle patterns
- Professional SaaS/startup aesthetic
- Smooth scroll behavior
- Intersection Observer for scroll animations

CRITICAL: Return the FULL HTML file every time, starting with <!DOCTYPE html> and ending with </html>. Never return partial HTML.`;

export async function implementFeature(
  feature: Feature,
  currentHtml: string,
  prd: PRD,
  designSystem?: DesignSystem | null,
  validationFeedback?: string[]
): Promise<string> {
  const designBlock = designSystem
    ? `\nDESIGN SYSTEM (MANDATORY — apply these exact values):
- Aesthetic: ${designSystem.aesthetic}
- Primary Color: ${designSystem.primaryColor}
- Accent Color: ${designSystem.accentColor}
- Background: ${designSystem.backgroundColor}
- Text Color: ${designSystem.textColor}
- Display Font (headings): ${designSystem.displayFont} (load from Google Fonts)
- Body Font: ${designSystem.bodyFont} (load from Google Fonts)
- Layout: ${designSystem.layoutPhilosophy}
- Memorable Element: ${designSystem.memorableElement}
- Mood: ${designSystem.moodKeywords.join(', ')}

ANTI-PATTERNS (NEVER do these):
- NEVER use Inter, Roboto, Arial, system fonts, or Space Grotesk
- NEVER use purple gradients on white backgrounds
- NEVER use generic AI-generated aesthetics or cookie-cutter layouts
- NEVER use predictable component patterns
- Add textures, grain, shadows, or patterns for depth — not flat solid colors
- Use CSS animations for micro-interactions and staggered reveals
`
    : '';

  const feedbackBlock = validationFeedback?.length
    ? `\n\nVALIDATION FAILURES (FIX THESE):\n${validationFeedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n`
    : '';

  const userMessage = currentHtml
    ? `Current index.html:\n${currentHtml}\n\n---\n\nAdd this section to the page:\nName: ${feature.name}\nDetails: ${feature.description}\n${feature.acceptance_criteria.length > 0 ? `Acceptance Criteria:\n${feature.acceptance_criteria.map(ac => `- ${ac}`).join('\n')}` : ''}${feedbackBlock}\n\nReturn the COMPLETE updated HTML file.`
    : `Create the initial index.html scaffold for: ${prd.executive_summary}\n\nFirst section: ${feature.name}\nDetails: ${feature.description}${feedbackBlock}\n\nReturn the COMPLETE HTML file starting with <!DOCTYPE html>.`;

  const response = await callLLM([
    { role: 'system', content: SYSTEM_PROMPT + designBlock },
    { role: 'user', content: userMessage },
  ], { maxTokens: 32000 });

  const html = stripCodeFences(response);

  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    throw new Error('Response does not contain valid HTML');
  }

  return html;
}

/**
 * TDD-like HTML validation — checks structural integrity after each feature.
 */
export function validateHtml(html: string, feature: Feature): ValidationResult {
  const checks: ValidationCheck[] = [];

  // Check 1: Has DOCTYPE
  checks.push({
    name: 'has_doctype',
    passed: html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>'),
    feedback: 'HTML must start with <!DOCTYPE html>',
  });

  // Check 2: Has complete structure
  checks.push({
    name: 'has_html_structure',
    passed: html.includes('<html') && html.includes('</html>') && html.includes('<head') && html.includes('<body'),
    feedback: 'HTML must have complete <html>, <head>, and <body> tags',
  });

  // Check 3: Has closing tags (not truncated)
  checks.push({
    name: 'not_truncated',
    passed: html.includes('</html>') && html.includes('</body>'),
    feedback: 'HTML appears truncated — missing </body> or </html> closing tags',
  });

  // Check 4: Has CSS (style block)
  checks.push({
    name: 'has_styles',
    passed: html.includes('<style') && html.includes('</style>'),
    feedback: 'HTML must include a <style> block with CSS',
  });

  // Check 5: Feature-specific — check feature name appears in content (loose match)
  const featureKeywords = feature.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const htmlLower = html.toLowerCase();
  const keywordFound = featureKeywords.some(kw => htmlLower.includes(kw));
  checks.push({
    name: 'feature_content_present',
    passed: keywordFound,
    feedback: `Feature "${feature.name}" content not found in HTML — ensure the section was actually added`,
  });

  // Check 6: Reasonable size (not empty, not suspiciously small)
  checks.push({
    name: 'reasonable_size',
    passed: html.length > 500,
    feedback: `HTML is only ${html.length} chars — too small for a complete page`,
  });

  // Check 7: No broken script/style tags
  const styleCount = (html.match(/<style/g) || []).length;
  const styleCloseCount = (html.match(/<\/style>/g) || []).length;
  const scriptCount = (html.match(/<script/g) || []).length;
  const scriptCloseCount = (html.match(/<\/script>/g) || []).length;
  checks.push({
    name: 'balanced_tags',
    passed: styleCount === styleCloseCount && scriptCount === scriptCloseCount,
    feedback: `Unbalanced tags: ${styleCount} <style> vs ${styleCloseCount} </style>, ${scriptCount} <script> vs ${scriptCloseCount} </script>`,
  });

  // Valid if all critical checks pass (first 3 are critical, rest are warnings)
  const criticalPassed = checks.slice(0, 3).every(c => c.passed);
  return {
    valid: criticalPassed,
    checks,
  };
}
