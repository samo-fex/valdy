import { callLLM } from './llm';

export interface DesignSystem {
  aesthetic: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  displayFont: string;
  bodyFont: string;
  layoutPhilosophy: string;
  memorableElement: string;
  moodKeywords: string[];
}

const DESIGNER_PROMPT = `You are an elite UI/UX designer creating a UNIQUE design system for a business MVP prototype.

BUSINESS CONTEXT:
- Name: {name}
- Problem: {problem}
- Target Users: {targetUsers}
- Domain: {domain}

YOUR TASK: Create a bold, distinctive design system that perfectly fits this specific business.

DESIGN PHILOSOPHY:
- Choose an EXTREME aesthetic direction: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian — pick what FITS the business context.
- Typography: Choose DISTINCTIVE Google Fonts. NEVER use Inter, Roboto, Arial, system fonts, or Space Grotesk. Pair a characterful display font with a refined body font.
- Color: Commit to a DOMINANT color with sharp accents. No timid, evenly-distributed palettes. No purple gradients on white backgrounds.
- The design must feel INTENTIONAL, not generic AI output.

RETURN JSON ONLY with this exact structure:
{
  "aesthetic": "2-3 word aesthetic label (e.g. 'Brutalist Industrial', 'Soft Editorial', 'Neo-Retro Futurism')",
  "primaryColor": "#hex - dominant brand color",
  "accentColor": "#hex - sharp contrast accent",
  "backgroundColor": "#hex - page background",
  "textColor": "#hex - primary text",
  "displayFont": "Exact Google Font name for headings",
  "bodyFont": "Exact Google Font name for body text",
  "layoutPhilosophy": "One sentence describing spatial approach (asymmetry, overlap, grid-breaking, generous whitespace, etc.)",
  "memorableElement": "One sentence describing the single most distinctive visual element (a texture, animation, pattern, or effect)",
  "moodKeywords": ["3-5 mood words"]
}`;

export async function generateDesignSystem(prd: { name: string; problem: string; targetUsers: string; features: { name: string }[] }): Promise<DesignSystem> {
  const domain = prd.features.map(f => f.name).join(', ');

  const prompt = DESIGNER_PROMPT
    .replace('{name}', prd.name)
    .replace('{problem}', prd.problem)
    .replace('{targetUsers}', prd.targetUsers || 'general users')
    .replace('{domain}', domain);

  const raw = await callLLM(
    [{ role: 'user', content: prompt }],
    { json: true, maxTokens: 1000 }
  );

  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as DesignSystem;
}
