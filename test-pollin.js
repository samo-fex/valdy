async function run() {
  const validationPrompt = `Generate a comprehensive validation analysis in JSON format.
The JSON must strictly have this structure:
{
  "overallScore": 80,
  "scoreLabel": "Promising",
  "pillars": []
}
Output ONLY raw valid JSON.`;
  const requestBody = {
    model: 'openai',
    messages: [{role: 'user', content: validationPrompt}],
    temperature: 0.7,
    jsonMode: true
  };
  const response = await fetch('https://text.pollinations.ai/openai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  const data = await response.json();
  console.log(data.choices[0]?.message?.content);
}
run();
