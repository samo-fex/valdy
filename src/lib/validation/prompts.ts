export const NORMALIZER_PROMPT = `You are a senior business analyst. Your job is to take a user's raw idea input and transform it into a structured, detailed JSON analysis across 7 business validation pillars.

USER INPUT:
"{user_input}"

TARGET GEOGRAPHY:
"{geography}"

Analyze the business idea specifically for the target geography. Tailor all 7 pillars to this region including local market conditions, regional competitors, regulations, and cultural context.

Return a JSON object with exactly these 7 fields:

{
  "problem": "[3-5 sentences, 60-100 words] What specific pain point or problem does this solve? Who experiences this pain? How severe and frequent is it? Include concrete evidence, statistics, or real-world examples that demonstrate the problem exists.",
  "market": "[3-5 sentences, 60-100 words] What is the target market? Provide specific TAM/SAM/SOM estimates for the geography. What is the growth rate? Who are the ideal early adopter customers? Include market data and segment breakdowns.",
  "competition": "[3-5 sentences, 60-100 words] What alternatives or competitors exist? Name specific competitors and their market position. How is this different? What is the competitive advantage and differentiation opportunity? Include competitor weaknesses.",
  "solution": "[3-5 sentences, 60-100 words] How does the product/service work? Describe the core mechanism, technology, and approach. What makes it unique vs alternatives? Include specific features and capabilities that address the identified problem.",
  "monetization": "[3-5 sentences, 60-100 words] How will this make money? Describe the pricing model, revenue tiers, and expected revenue per customer. Include pricing benchmarks from similar products and unit economics estimates.",
  "gtm": "[3-5 sentences, 60-100 words] How will customers be acquired? What are the primary marketing channels and go-to-market strategy? Describe specific tactics, partnerships, and early adopter acquisition approaches for the target geography.",
  "timing": "[3-5 sentences, 60-100 words] Why is now the right time? What specific technology, market, regulatory, or cultural trends support this? Include recent developments, enabling technologies, and macro shifts that create opportunity."
}

RULES:
- Return ONLY valid JSON, no markdown, no code blocks, no explanation
- Each field must be 3-5 detailed sentences (60-100 words minimum)
- Include specific numbers, statistics, competitor names, pricing data where possible
- Write in third person ("This product..." not "You will...")
- Be factual and precise, not promotional or generic
- If information is not provided in input, make well-reasoned inferences based on the idea
- Do NOT add features not implied by the input
- Use clear, professional business language

OUTPUT:
Return the JSON object only.

{exclusion}`;
