import { getProvider, Message } from '@/src/lib/api';
import { Hypothesis } from '@/src/types/project';
import { PRIMARY_MODEL } from '@/src/lib/config/models';
import { stripCodeFences } from '@/src/lib/utils';

export class StreamingService {
  private apiKey: string;
  private isLiveMode: boolean;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.isLiveMode = apiKey === 'live';
  }

  async streamHypothesisGeneration(
    niche: string,
    focus: 'problems' | 'solutions',
    onRationaleUpdate: (text: string) => void
  ): Promise<void> {
    const systemPrompt = `You are a market research expert. Think step by step about ${focus} in the ${niche} niche. Show your reasoning process as you analyze and generate insights. Start each thought with "> " and be concise.`;

    const userPrompt = `Analyze the ${niche} market for ${focus}. Think out loud about your research process. Start with reading the niche, then analyzing the market, then generating a specific hypothesis.`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      // In live mode, use server-side proxy to access API key
      const url = this.isLiveMode
        ? '/api/stream'
        : 'https://gen.pollinations.ai/openai/chat/completions';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add Authorization header for direct OpenRouter calls (not live mode)
      if (!this.isLiveMode) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://curatos.app';
        headers['X-Title'] = 'valdy';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          messages,
          stream: !this.isLiveMode, // Server handles streaming flag for live mode
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter streaming error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onRationaleUpdate(content);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      // Fallback to structured thinking
      const fallbackMessages = [
        `> Reading niche: ${niche}`,
        `> Analyzing market for potential ${focus}...`,
        focus === 'problems' 
          ? `> Identifying pain points in ${niche} sector...`
          : `> Exploring solution opportunities in ${niche}...`,
        `> Generating hypothesis about ${focus === 'problems' ? 'market challenges' : 'technical solutions'}...`
      ];

      for (const message of fallbackMessages) {
        onRationaleUpdate(message + '\n');
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
  }

  async generateLandingPage(
    niche: string,
    problems: Hypothesis[],
    solutions: Hypothesis[]
  ): Promise<string> {

    const provider = getProvider('openrouter', this.apiKey);

    const problemsList = problems
      .filter(p => p.state === 'fact' && p.confidence >= 85)
      .map(p => `- ${p.text}`)
      .join('\n');

    const solutionsList = solutions
      .filter(s => s.state === 'fact' && s.confidence >= 85)
      .map(s => `- ${s.text}`)
      .join('\n');

    const prompt = `Generate a complete, self-contained HTML landing page for a SaaS product in the ${niche} niche.

VALIDATED PROBLEMS:
${problemsList}

VALIDATED SOLUTIONS:
${solutionsList}

Requirements:
- Complete HTML with inline CSS (Tailwind-like utility classes)
- Modern, professional design
- Hero section with compelling headline based on main problem
- Problem/pain points section highlighting the validated problems
- Solution/features section showcasing the validated solutions
- CTA section with email signup
- Footer with copyright
- Responsive design
- No external dependencies (all CSS inline)
- Use a modern color scheme (dark mode friendly)

Return ONLY the HTML code, no explanations.`;

    const messages: Message[] = [
      { role: 'user', content: prompt }
    ];

    const response = await provider.chat(messages, PRIMARY_MODEL);
    
    return stripCodeFences(response.content);
  }

  async generatePRD(
    niche: string,
    problems: Hypothesis[],
    solutions: Hypothesis[]
  ): Promise<string> {

    const provider = getProvider('openrouter', this.apiKey);

    const problemsList = problems
      .filter(p => p.state === 'fact' && p.confidence >= 85)
      .map(p => `- ${p.text}`)
      .join('\n');

    const solutionsList = solutions
      .filter(s => s.state === 'fact' && s.confidence >= 85)
      .map(s => `- ${s.text}`)
      .join('\n');

    const prompt = `Generate a comprehensive Product Requirements Document (PRD) for a SaaS product in the ${niche} niche.

VALIDATED PROBLEMS:
${problemsList}

VALIDATED SOLUTIONS:
${solutionsList}

Create a professional PRD in markdown format with these sections:

# Product Requirements Document: [Product Name]

## Executive Summary
2-3 sentences summarizing the product vision and value proposition.

## Problem Statement
Detailed description of the problems being solved (use validated problems above).

## Target Users
Define 2-3 user personas with their needs and pain points.

## Proposed Solution
Comprehensive solution description (use validated solutions above).

## Requirements

### Functional Requirements
List 6-8 specific functional requirements. Format each as:
FR-001: [Requirement description]
FR-002: [Requirement description]
FR-003: [Requirement description]
...

### Non-Functional Requirements
List 4-6 non-functional requirements (performance, security, scalability, etc.). Format each as:
NFR-001: [Requirement description]
NFR-002: [Requirement description]
NFR-003: [Requirement description]
...

## Success Metrics
Define 5-7 KPIs to measure product success.

## Timeline Estimate
High-level phases and estimated timeline.

## Risks and Mitigation
Identify 3-5 key risks and mitigation strategies.

IMPORTANT: Use the exact format FR-001, FR-002, NFR-001, NFR-002 for requirements. Return ONLY the markdown, no explanations.`;

    const messages: Message[] = [
      { role: 'user', content: prompt }
    ];

    const response = await provider.chat(messages, PRIMARY_MODEL);
    
    return stripCodeFences(response.content);
  }
}
