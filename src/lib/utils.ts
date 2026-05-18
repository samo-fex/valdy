import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip markdown code fences (```json, ```html, ```markdown, etc.) from LLM responses.
 * Returns the inner content trimmed.
 */
export function stripCodeFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('```')) {
    // Remove opening fence (```json, ```html, ```markdown, or bare ```)
    text = text.replace(/^```\w*\n?/, '');
    // Remove closing fence
    text = text.replace(/```\s*$/, '');
  }
  return text;
}
