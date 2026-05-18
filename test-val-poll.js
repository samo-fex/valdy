async function run() {
  const idea = "A mobile app for dog walkers";
  const canonicalDescription = "A platform connecting dog owners with vetted dog walkers.";
  const geography = "Global";

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
              "url": "string",
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
Include exactly 2 pillars. Each pillar should have 1 subcategory, and each subcategory should have 1 simulated source.
Output ONLY raw valid JSON, no markdown code blocks formatting.`;

  const requestBody = {
    model: 'openai',
    messages: [{role: 'user', content: validationPrompt}],
    temperature: 0.7,
    jsonMode: true
  };
  
  try {
    const response = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    console.log(data.choices[0]?.message?.content);
  } catch (e) {
    console.error(e);
  }
}
run();
