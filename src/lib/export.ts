import { Hypothesis } from '@/src/types/project';

export type ExportFormat = 'json' | 'csv' | 'markdown';

interface ExportData {
  niche: string;
  hypotheses: Hypothesis[];
  solutions: Hypothesis[];
  exportedAt: string;
}

// Download helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// JSON Export
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(data: ExportData, filename = 'curatos-export') {
  downloadFile(exportToJSON(data), `${filename}.json`, 'application/json');
}

// CSV Export for validated hypotheses
export function exportToCSV(hypotheses: Hypothesis[]): string {
  const validated = hypotheses.filter(h => h.confidence && h.confidence >= 90);
  
  const headers = ['ID', 'Type', 'Text', 'Confidence', 'State', 'Sources'];
  const rows = validated.map(h => [
    h.id,
    h.type || 'general',
    `"${(h.text || '').replace(/"/g, '""')}"`,
    h.confidence || 0,
    h.state,
    `"${(h.sources || []).join('; ')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function downloadCSV(hypotheses: Hypothesis[], filename = 'validated-hypotheses') {
  downloadFile(exportToCSV(hypotheses), `${filename}.csv`, 'text/csv');
}

export function downloadMarkdown(content: string, filename = 'prd') {
  downloadFile(content, `${filename}.md`, 'text/markdown');
}

// HTML Export for Landing Page
export function downloadHTML(content: string, filename = 'landing-page') {
  downloadFile(content, `${filename}.html`, 'text/html');
}

// Generate shareable link (encodes data in URL hash)
export function generateShareableLink(data: ExportData): string {
  const compressed = btoa(encodeURIComponent(JSON.stringify({
    n: data.niche,
    h: data.hypotheses.slice(0, 10).map(h => ({ t: h.text, c: h.confidence })),
    s: data.solutions.slice(0, 10).map(s => ({ t: s.text, c: s.confidence })),
  })));
  return `${window.location.origin}${window.location.pathname}?share=${compressed}`;
}

// Copy to clipboard helper
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}
