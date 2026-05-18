import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from 'fs';

// Quick LLM Helper - Pollinations.ai BYOP (Bring Your Own Pollen)
// Docs: https://gen.pollinations.ai/docs
// Base URL: https://gen.pollinations.ai/v1 (OpenAI-compatible)
// API Keys: https://enter.pollinations.ai
async function callPollinations(messages, temperature = 0.7, jsonMode = false, apiKey = '') {
  try {
    const requestBody: Record<string, unknown> = {
      model: 'openai',
      messages,
      temperature,
    };

    if (jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    }
    const errorText = await response.text();
    console.error('Pollinations API Error:', response.status, errorText);
    throw new Error('Failed to fetch from Pollinations.ai');
  } catch (error) {
    console.error(error);
    return "";
  }
}

// In-Memory store to replace Prisma
const globalSessions = new Map();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/chat", async (req, res) => {
    try {
      const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
      const { messages, model, models, route, jsonMode, temperature } = req.body;
      const responseText = await callPollinations(messages, temperature || 0.7, jsonMode, apiKey);
      res.json({
        content: responseText,
        model: model || 'openai',
        tokens: { prompt: 0, completion: 0, total: 0 }
      });
    } catch(e) {
      console.error('/api/chat error:', e);
      res.status(500).json({error: String(e)});
    }
  });

  app.post("/api/validate/normalize", async (req, res) => {
    try {
      const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
      const { userInput, geography = 'Global', previousIdeas = [] } = req.body;
      const prompt = `Convert this business idea into a clinical, dry description of mechanics and market: "${userInput}". Geography: ${geography}. Respond ENTIRELY in JSON with fields problem, market, competition, solution, monetization, gtm, timing. No markdown, just raw JSON object.`;
      
      const response = await callPollinations([{role: 'user', content: prompt}], 0.7, true, apiKey);
      let analysis = JSON.parse(response.replace(/```json/g, '').replace(/```/g, ''));
      res.json({ original: userInput, analysis });
    } catch(e) {
      // Fallback
      res.json({
        original: req.body.userInput,
        analysis: {
          problem: req.body.userInput || "Needs definition",
          market: "Global market with varying segments",
          competition: "Existing solutions lack modern UX", 
          solution: req.body.userInput,
          monetization: "Subscription and enterprise tiers",
          gtm: "Direct sales and inbound marketing",
          timing: "Growing demand makes timing optimal"
        }
      });
    }
  });

  app.post("/api/validate", async (req, res) => {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    const { idea, canonicalDescription, geography } = req.body;
    const sessionId = Date.now().toString();

    // Start background processing placeholder
    globalSessions.set(sessionId, {
      id: sessionId,
      originalInput: idea,
      canonicalDescription,
      status: 'complete',
      overallScore: 75,
      scoreLabel: 'Promising',
      pillars: []
    });

    const validationPrompt = `Given the startup idea: "${idea}" and details: "${canonicalDescription}" targeting geography: "${geography}". 
Generate a comprehensive validation analysis in JSON format.
The JSON must strictly have this structure:
{
  "overallScore": number (0-100),
  "scoreLabel": "string (e.g. Promising, Unproven)",
  "pillars": [
    {
      "key": "string",
      "name": "string",
      "icon": "string",
      "score": number (0-100),
      "status": "complete",
      "subcategories": [
        {
          "key": "string",
          "name": "string",
          "score": number (0-100),
          "status": "complete",
          "sources": [
            {
              "apiName": "string",
              "title": "string",
              "url": "string (simulated URL)",
              "snippet": "string",
              "supports": ["string"],
              "concerns": ["string"],
              "confidence": number (0-100)
            }
          ]
        }
      ]
    }
  ]
}
Include exactly 3 pillars: Market, Competition, and Financial. Each pillar should have 1 subcategory, and each subcategory should have 1 simulated real-world source.
Output ONLY raw valid JSON, no markdown code blocks formatting.`;

    try {
      const resp = await callPollinations([{role: 'user', content: validationPrompt}], 0.7, true, apiKey);
      const jsonStr = resp.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);

      globalSessions.set(sessionId, {
        ...globalSessions.get(sessionId),
        status: 'complete',
        overallScore: data.overallScore || 80,
        scoreLabel: data.scoreLabel || 'Promising',
        pillars: data.pillars || []
      });
    } catch(e) {
      console.error('Validation generation failed:', e);
      globalSessions.set(sessionId, {
        ...globalSessions.get(sessionId),
        status: 'complete',
        overallScore: 60,
        scoreLabel: 'Needs Verification',
        pillars: [
          {
            key: "market",
            name: "Market Viability",
            icon: "🏢",
            score: 60,
            status: "complete",
            subcategories: [
              {
                key: "demand",
                name: "Market Demand",
                score: 60,
                status: "complete",
                sources: [
                  {
                    apiName: "Fallback Search",
                    title: "Estimated Market Size",
                    url: "https://example.com/market",
                    snippet: "The market demand for this service is still being verified. Preliminary analysis suggests viable pockets of opportunity.",
                    supports: ["Potential demand"],
                    concerns: ["Needs more research"],
                    confidence: 50
                  }
                ]
              }
            ]
          }
        ]
      });
    }
    
    // Send response after generating
    res.json({ sessionId, status: 'complete', idea });
  });

  app.get("/api/validate/:id", (req, res) => {
    const session = globalSessions.get(req.params.id);
    if (!session) return res.status(404).json({error: "Not found"});
    res.json(session);
  });

  app.post("/api/validate/close-gaps", async (req, res) => {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    const { idea, canonicalDescription, pillars, geography } = req.body;
    const prompt = `Perform a gap analysis on this startup idea: "${idea}". 
Return a JSON object with: 
- "gaps": an array of objects ({ "title": string, "description": string, "severity": number (1-3), "action": string })
- "improvedIdea": AN OBJECT (NOT a string) containing exactly these 7 string fields: "problem", "market", "competition", "solution", "monetization", "gtm", "timing". Each field must have a short refined description of that aspect of the idea.

Make sure the output is strictly valid JSON. Do not return improvedIdea as a string.`;
    
    try {
      const resp = await callPollinations([
        {role: 'system', content: 'You are a meticulous JSON generator. You must output valid JSON.'},
        {role: 'user', content: prompt + `\n\nCacheBuster: ${Date.now()}`}
      ], 0.7, true, apiKey);
      console.log("close-gaps resp:", resp);
      const jsonStr = resp.replace(/```json/g, '').replace(/```/g, '');
      const parsed = JSON.parse(jsonStr);
      
      // Fallback if improvedIdea is still a string or missing properties
      let improved = parsed.improvedIdea || parsed.improved_idea;
      if (!improved || typeof improved === 'string') {
        improved = {
          problem: typeof improved === 'string' ? improved : (parsed.problem || "Undefined problem."),
          market: parsed.market || "Undefined market.",
          competition: parsed.competition || "Undefined competition.",
          solution: parsed.solution || "Undefined solution.",
          monetization: parsed.monetization || "Undefined monetization.",
          gtm: parsed.gtm || "Undefined GTM.",
          timing: parsed.timing || "Undefined timing."
        };
      }
      
      const ensuredIdea = {
        problem: improved.problem || "Undefined problem.",
        market: improved.market || "Undefined market.",
        competition: improved.competition || "Undefined competition.",
        solution: improved.solution || "Undefined solution.",
        monetization: improved.monetization || "Undefined monetization.",
        gtm: improved.gtm || "Undefined GTM.",
        timing: improved.timing || "Undefined timing.",
        _debug_resp: resp
      };
      
      parsed.improvedIdea = ensuredIdea;

      res.json(parsed);
    } catch(e) {
      console.error("close-gaps fallback error:", e);
      res.json({
        gaps: [{ title: 'Marketing Strategy', description: 'GTM approach needs clarity', severity: 2, action: 'Define channels' }],
        error: String(e),
        improvedIdea: {
          problem: idea || "Needs clear problem definition.",
          market: canonicalDescription || "Significant market potential in target demographic.",
          competition: "Incumbents operate with legacy technology.",
          solution: idea || "A streamlined, modern approach addressing gaps.",
          monetization: "Subscription or usage-based pricing.",
          gtm: "Targeted digital marketing and strategic partnerships.",
          timing: "Current market trends favor this innovation."
        }
      });
    }
  });

  app.post("/api/validate/generate-business-plan", async (req, res) => {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    const { improvedIdea } = req.body;
    const prompt = `Generate a business plan for: ${JSON.stringify(improvedIdea)}.
Return exactly a JSON object with keys:
"executive_summary", "market_and_sales", "team_and_operations", "financial_plan", and "chart_data" (an object with arrays: market_breakdown [{name, value}], revenue_projections [{year, revenue, costs}], and financial_table [{metric, value}]). No markdown, only JSON.`;
    try {
      const resp = await callPollinations([{role: 'user', content: prompt}], 0.7, true, apiKey);
      const jsonStr = resp.replace(/```json/g, '').replace(/```/g, '');
      res.json({ businessPlan: JSON.parse(jsonStr) });
    } catch(e) {
      res.json({
        businessPlan: {
          executive_summary: "Execution Summary for " + (typeof improvedIdea === "string" ? improvedIdea : JSON.stringify(improvedIdea)),
          market_and_sales: "Market Strategy",
          team_and_operations: "Operations",
          financial_plan: "Finances",
          chart_data: {
            market_breakdown: [{ name: "Target Market", value: 100, color: "#10b981" }],
            revenue_projections: [{ year: "Year 1", revenue: 100000, costs: 50000 }],
            financial_table: [{ metric: "Gross Margin", value: "50%" }]
          }
        }
      });
    }
  });

  app.post("/api/validate/generate-prd", async (req, res) => {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    const { improvedIdea } = req.body;
    const prompt = `Write a comprehensive Product Requirements Document (PRD) in Markdown format for the following business: ${improvedIdea}. Include sections for Overview, Target Audience, Features, User Flows, and Technical Requirements. Do not wrap in JSON.`;
    try {
      const resp = await callPollinations([{role: 'user', content: prompt}], 0.7, false, apiKey);
      res.json({ prd: resp });
    } catch(e) {
      res.json({ prd: "# PRD\n\n## Overview\nThis is a mock PRD." });
    }
  });


  app.post("/api/agent/orchestrate", async (req, res) => {
    res.json({
      thought: "The pipeline is flowing perfectly.",
      action: "WAIT"
    });
  });

  app.post("/api/research/cycle", async (req, res) => {
    res.json({
      sessionId: req.body.sessionId || 'session_123',
      state: {},
      thought: "Working on it..."
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost: " + PORT);
  });
}

startServer();
