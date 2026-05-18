export interface APIResult {
  source: string;
  success: boolean;
  data: { title: string; snippet: string; url?: string }[];
  error?: string;
  queryTime: number;
}
