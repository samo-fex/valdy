<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Valdy - AI-Powered Startup Validation

Valdy is an AI-powered startup validation tool that helps entrepreneurs and product managers validate their business ideas using real-world data and AI analysis.

## Features

- **Idea Validation**: Submit your startup idea and get comprehensive validation analysis
- **Market Analysis**: Deep dive into market viability, competition, and financial projections
- **Gap Analysis**: Identify weaknesses in your business model with actionable recommendations
- **Business Plan Generation**: Automatically generate detailed business plans
- **PRD Creation**: Create Product Requirements Documents from your validated ideas
- **AutoCoder**: AI-powered code generation for building your MVP

## Powered by Pollinations.ai BYOP

Valdy uses [Pollinations.ai](https://pollinations.ai) with the **Bring Your Own Pollen (BYOP)** feature for AI capabilities:

- **Base URL**: `https://gen.pollinations.ai/v1`
- **API Keys**: Get your API key at [enter.pollinations.ai](https://enter.pollinations.ai)
- **Documentation**: [gen.pollinations.ai/docs](https://gen.pollinations.ai/docs)
- **Models Available**: openai, deepseek, mistral, qwen, claude, gemini, llama, and more

### API Authentication

Valdy supports two authentication methods:

1. **Header-based**: `Authorization: Bearer YOUR_API_KEY`
2. **Query parameter**: `?key=YOUR_API_KEY`

Key types:
- `sk_` - Secret keys (server-side)
- `pk_` - Publishable keys (client-side, rate limited)

## Run Locally

**Prerequisites:** Node.js 18+

1. Clone the repository:
   ```bash
   git clone https://github.com/samo-fex/valdy.git
   cd valdy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set your Pollinations.ai API key:
   Create a `.env.local` file with:
   ```
   POLLINATIONS_API_KEY=your_api_key_here
   ```
   
   Get your API key at [enter.pollinations.ai](https://enter.pollinations.ai)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js
- **AI**: Pollinations.ai BYOP (OpenAI-compatible API)
- **PDF Generation**: React-PDF

## License

MIT

## Links

- [Pollinations.ai](https://pollinations.ai)
- [API Documentation](https://gen.pollinations.ai/docs)
- [Get API Key](https://enter.pollinations.ai)
