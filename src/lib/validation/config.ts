// ============================================================
// SUBCATEGORY CONFIGURATION
// ============================================================
// Note: Pillar definitions are in api-pillar-registry.json
// This file only contains subcategory prompts for LLM analysis

export interface SubcategoryConfig {
  key: string;
  name: string;
  prompt: string;
}

export interface PillarConfig {
  key: string;
  name: string;
  icon: string;
  weight: number;
  subcategories: SubcategoryConfig[];
}

export const PILLARS: PillarConfig[] = [
  {
    key: 'problem',
    name: 'Problem Severity',
    icon: '🎯',
    weight: 1.2,
    subcategories: [
      {
        key: 'pain_intensity',
        name: 'Pain Intensity',
        prompt: `You are researching PAIN INTENSITY for a business idea.

Your goal: Find evidence of how SEVERE and PAINFUL this problem is for people who experience it.

SEARCH FOR:
- Emotional language in complaints (frustrated, hate, nightmare, terrible)
- Financial impact of the problem (costs, losses, wasted time/money)
- Frequency of complaints and discussions
- Desperation indicators (people trying multiple solutions)

SCORING GUIDE:
- 90-100: Extreme pain - people describe it as a "nightmare", significant financial/emotional cost
- 70-89: High pain - clear frustration, active seeking of solutions
- 50-69: Moderate pain - inconvenient but manageable
- 30-49: Low pain - minor annoyance
- 0-29: No significant pain detected

For each source found, extract:
1. A relevant quote or data point
2. Why this indicates pain (or lack thereof)
3. Confidence level in this source`
      },
      {
        key: 'pain_frequency',
        name: 'Pain Frequency',
        prompt: `You are researching PAIN FREQUENCY for a business idea.

Your goal: Find evidence of how OFTEN people experience this problem.

SEARCH FOR:
- How often the problem occurs (daily, weekly, monthly, yearly)
- Number of people affected
- Recurring nature of the problem
- Triggers that cause the problem

SCORING GUIDE:
- 90-100: Daily occurrence for many people, affects millions
- 70-89: Weekly occurrence, affects significant population
- 50-69: Monthly occurrence, moderate affected population
- 30-49: Occasional occurrence, niche population
- 0-29: Rare occurrence, very small population

For each source found, extract:
1. Frequency data or estimates
2. Population affected
3. Confidence level in this source`
      },
      {
        key: 'current_workarounds',
        name: 'Current Workarounds',
        prompt: `You are researching CURRENT WORKAROUNDS for a business idea.

Your goal: Find what solutions people currently use to deal with this problem (indicates pain and opportunity).

SEARCH FOR:
- DIY solutions people have built
- Combinations of tools people use together
- Manual processes that are tedious
- Spreadsheets, scripts, or hacks people share
- Complaints about existing solutions

SCORING GUIDE:
- 90-100: Many painful workarounds exist, people cobble together 3+ tools, clearly underserved
- 70-89: Some workarounds exist, none fully solve the problem
- 50-69: Partial solutions exist, room for improvement
- 30-49: Decent solutions exist, minor gaps
- 0-29: Good solutions already exist, problem well-solved

For each source found, extract:
1. What workaround is being used
2. Why it's inadequate
3. Confidence level in this source`
      }
    ]
  },
  {
    key: 'market',
    name: 'Market Opportunity',
    icon: '',
    weight: 1.1,
    subcategories: [
      {
        key: 'market_size',
        name: 'Market Size (TAM)',
        prompt: `You are researching MARKET SIZE for a business idea.

Your goal: Find data on Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM).

SEARCH FOR:
- Market size reports and estimates
- Number of potential customers
- Industry revenue figures
- Comparable company valuations

SCORING GUIDE:
- 90-100: $10B+ TAM, clear path to $100M+ revenue
- 70-89: $1B-10B TAM, path to $10M+ revenue
- 50-69: $100M-1B TAM, viable business possible
- 30-49: $10M-100M TAM, niche but potentially profitable
- 0-29: <$10M TAM, very small market

For each source found, extract:
1. Market size figure with year and source
2. Methodology or basis for estimate
3. Confidence level in this source`
      },
      {
        key: 'growth_trajectory',
        name: 'Growth Trajectory',
        prompt: `You are researching GROWTH TRAJECTORY for a business idea.

Your goal: Find data on how fast this market is growing or declining.

SEARCH FOR:
- CAGR (Compound Annual Growth Rate) figures
- Year-over-year growth rates
- Emerging trends driving growth
- Analyst forecasts and predictions

SCORING GUIDE:
- 90-100: 30%+ annual growth, strong tailwinds, explosive market
- 70-89: 15-30% annual growth, healthy expanding market
- 50-69: 5-15% annual growth, stable market
- 30-49: 0-5% growth, mature/flat market
- 0-29: Declining market, headwinds

For each source found, extract:
1. Growth rate figure with timeframe
2. Drivers of growth/decline
3. Confidence level in this source`
      },
      {
        key: 'adjacent_markets',
        name: 'Adjacent Markets',
        prompt: `You are researching ADJACENT MARKETS for a business idea.

Your goal: Find related markets that could expand the opportunity or provide cross-sell potential.

SEARCH FOR:
- Related product categories
- Complementary services
- Upstream/downstream markets
- Geographic expansion opportunities
- Platform/ecosystem opportunities

SCORING GUIDE:
- 90-100: Multiple large adjacent markets, clear expansion paths
- 70-89: Several promising adjacent opportunities
- 50-69: Some adjacent markets, moderate expansion potential
- 30-49: Limited adjacent opportunities
- 0-29: Isolated niche, no clear expansion path

For each source found, extract:
1. Adjacent market identified
2. Size and relationship to core market
3. Confidence level in this source`
      }
    ]
  },
  {
    key: 'competition',
    name: 'Competitive Landscape',
    icon: '⚔️',
    weight: 1.0,
    subcategories: [
      {
        key: 'direct_competitors',
        name: 'Direct Competitors',
        prompt: `You are researching DIRECT COMPETITORS for a business idea.

Your goal: Identify companies solving the same problem for the same customers.

SEARCH FOR:
- Companies with similar products/services
- Their pricing, features, and positioning
- Their funding, team size, and traction
- Customer reviews and ratings

SCORING GUIDE (NOTE: Less competition = HIGHER score):
- 90-100: No direct competitors, true blue ocean
- 70-89: 1-3 weak competitors, clear opportunity
- 50-69: 3-5 competitors, differentiation needed
- 30-49: 5-10 competitors, crowded but possible
- 0-29: 10+ strong competitors, very crowded

For each source found, extract:
1. Competitor name and what they offer
2. Their apparent strengths and weaknesses
3. Confidence level in this source`
      },
      {
        key: 'competitor_weaknesses',
        name: 'Competitor Weaknesses',
        prompt: `You are researching COMPETITOR WEAKNESSES for a business idea.

Your goal: Find complaints, gaps, and failures in existing solutions.

SEARCH FOR:
- Negative reviews of competitors
- Feature requests and complaints
- Pricing objections
- Support/service issues
- Churn reasons and cancellation feedback

SCORING GUIDE:
- 90-100: Competitors have major, consistent weaknesses customers hate
- 70-89: Clear weaknesses that create opportunity
- 50-69: Some weaknesses, but competitors are decent
- 30-49: Minor weaknesses, competitors are solid
- 0-29: Competitors are excellent, hard to beat

For each source found, extract:
1. Specific weakness or complaint identified
2. How widespread this issue appears to be
3. Confidence level in this source`
      },
      {
        key: 'differentiation_opportunity',
        name: 'Differentiation Opportunity',
        prompt: `You are researching DIFFERENTIATION OPPORTUNITY for a business idea.

Your goal: Find angles where a new entrant could stand out from existing solutions.

SEARCH FOR:
- Unserved customer segments
- Missing features customers want
- New technology that enables better solutions
- Pricing/business model innovations
- UX/design improvements possible

SCORING GUIDE:
- 90-100: Clear, defensible differentiation possible, unique angle
- 70-89: Good differentiation opportunity, can stand out
- 50-69: Some differentiation possible, will need creativity
- 30-49: Differentiation difficult, incremental at best
- 0-29: No clear way to differentiate, commodity market

For each source found, extract:
1. Differentiation angle identified
2. Evidence this would resonate with customers
3. Confidence level in this source`
      }
    ]
  },
  {
    key: 'solution',
    name: 'Solution Fit',
    icon: '🔧',
    weight: 1.0,
    subcategories: [
      {
        key: 'problem_solution_match',
        name: 'Problem-Solution Match',
        prompt: `You are researching PROBLEM-SOLUTION MATCH for a business idea.

Your goal: Evaluate how well the proposed solution addresses the core problem.

SEARCH FOR:
- Evidence that this type of solution works
- Case studies of similar approaches
- User feedback on similar solutions
- Expert opinions on the approach

SCORING GUIDE:
- 90-100: Solution directly addresses root cause, proven approach
- 70-89: Good match, addresses main pain points
- 50-69: Partial match, solves some aspects
- 30-49: Weak match, might miss the mark
- 0-29: Mismatch, solution doesn't fit problem

For each source found, extract:
1. Evidence of solution effectiveness
2. How well it maps to the problem
3. Confidence level in this source`
      },
      {
        key: 'feature_completeness',
        name: 'Feature Completeness',
        prompt: `You are researching FEATURE COMPLETENESS for a business idea.

Your goal: Determine if the solution concept has all necessary features to deliver value.

SEARCH FOR:
- Must-have features for this type of product
- Table stakes vs. differentiators
- Common feature requests in this category
- MVP requirements vs. full product

SCORING GUIDE:
- 90-100: Concept covers all must-haves plus key differentiators
- 70-89: Covers must-haves, some nice-to-haves
- 50-69: Covers basics, missing some expected features
- 30-49: Incomplete, missing important features
- 0-29: Major gaps, not a viable product concept

For each source found, extract:
1. Feature expectation identified
2. Whether the concept appears to address it
3. Confidence level in this source`
      },
      {
        key: 'value_clarity',
        name: 'Value Clarity',
        prompt: `You are researching VALUE CLARITY for a business idea.

Your goal: Evaluate how clearly the value proposition can be communicated.

SEARCH FOR:
- How similar products explain their value
- Customer testimonials and success stories
- Before/after comparisons
- ROI calculations and case studies

SCORING GUIDE:
- 90-100: Crystal clear value prop, obvious benefit, easy to explain
- 70-89: Clear value, can be explained in one sentence
- 50-69: Value present but requires some explanation
- 30-49: Confusing value prop, hard to communicate
- 0-29: Unclear what the actual benefit is

For each source found, extract:
1. Value proposition articulation found
2. How compelling and clear it is
3. Confidence level in this source`
      }
    ]
  },
  {
    key: 'monetization',
    name: 'Monetization Potential',
    icon: '💰',
    weight: 1.0,
    subcategories: [
      {
        key: 'pricing_benchmarks',
        name: 'Pricing Benchmarks',
        prompt: `You are researching PRICING BENCHMARKS for a business idea.

Your goal: Find what similar products charge and pricing norms in this category.

SEARCH FOR:
- Competitor pricing pages
- Pricing surveys and reports
- Typical price ranges for this category
- Pricing models (subscription, usage, one-time)

SCORING GUIDE:
- 90-100: High pricing benchmarks ($100+/mo), strong willingness to pay
- 70-89: Good pricing ($50-100/mo), healthy margins possible
- 50-69: Moderate pricing ($20-50/mo), viable but competitive
- 30-49: Low pricing (<$20/mo), thin margins
- 0-29: Race to bottom, freemium dominates, hard to monetize

For each source found, extract:
1. Pricing data point found
2. Product/company it relates to
3. Confidence level in this source`
      },
      {
        key: 'willingness_to_pay',
        name: 'Willingness to Pay',
        prompt: `You are researching WILLINGNESS TO PAY for a business idea.

Your goal: Find evidence that customers actually pay for solutions to this problem.

SEARCH FOR:
- Customer testimonials mentioning payment
- Successful paid products in this space
- Survey data on willingness to pay
- Enterprise vs. consumer payment patterns

SCORING GUIDE:
- 90-100: Strong evidence customers pay premium prices eagerly
- 70-89: Good evidence of payment, customers see value
- 50-69: Some payment evidence, price sensitivity present
- 30-49: Limited evidence, customers expect free
- 0-29: No evidence of willingness to pay

For each source found, extract:
1. Evidence of payment willingness
2. Price points mentioned
3. Confidence level in this source`
      },
      {
        key: 'revenue_model_fit',
        name: 'Revenue Model Fit',
        prompt: `You are researching REVENUE MODEL FIT for a business idea.

Your goal: Identify what monetization models work best for this type of product.

SEARCH FOR:
- How successful companies in this space monetize
- Subscription vs. usage vs. transaction models
- Freemium conversion rates
- Enterprise vs. self-serve patterns

SCORING GUIDE:
- 90-100: Clear revenue model, multiple proven approaches
- 70-89: Good model options, one or two proven approaches
- 50-69: Some models possible, experimentation needed
- 30-49: Revenue model unclear, challenging to monetize
- 0-29: No clear revenue model, advertising-dependent

For each source found, extract:
1. Revenue model identified
2. Evidence of effectiveness
3. Confidence level in this source`
      }
    ]
  },
  {
    key: 'gtm',
    name: 'Go-to-Market Clarity',
    icon: '🚀',
    weight: 0.9,
    subcategories: [
      {
        key: 'channel_viability',
        name: 'Channel Viability',
        prompt: `You are researching CHANNEL VIABILITY for a business idea.

Your goal: Identify what marketing/sales channels work for this type of product.

SEARCH FOR:
- How similar products acquire customers
- Effective channels (SEO, paid ads, content, sales, partnerships)
- Channel saturation and costs
- Success stories and case studies

SCORING GUIDE:
- 90-100: Clear, proven channels with reasonable costs
- 70-89: Good channel options, some proven playbooks
- 50-69: Channels exist but competitive or expensive
- 30-49: Limited channels, high CAC likely
- 0-29: No clear channels, very difficult distribution

For each source found, extract:
1. Channel identified
2. Evidence of effectiveness
3. Confidence level in this source`
      },
      {
        key: 'customer_access',
        name: 'Customer Access',
        prompt: `You are researching CUSTOMER ACCESS for a business idea.

Your goal: Determine how easily target customers can be reached.

SEARCH FOR:
- Where target customers congregate (communities, events, platforms)
- How to identify and contact them
- Gatekeepers or barriers to access
- Self-serve vs. sales-required patterns

SCORING GUIDE:
- 90-100: Easy access, customers self-identify, can reach at scale
- 70-89: Good access, clear communities and touchpoints
- 50-69: Moderate access, some barriers but manageable
- 30-49: Difficult access, gatekeepers, requires relationships
- 0-29: Very hard to reach customers, enterprise sales only

For each source found, extract:
1. Customer access method identified
2. Barriers or enablers noted
3. Confidence level in this source`
      },
      {
        key: 'viral_organic_potential',
        name: 'Viral/Organic Potential',
        prompt: `You are researching VIRAL/ORGANIC POTENTIAL for a business idea.

Your goal: Evaluate potential for word-of-mouth, viral loops, or organic growth.

SEARCH FOR:
- Products in this space with viral growth
- Network effects or sharing mechanics
- SEO/content opportunities
- Community-driven growth examples

SCORING GUIDE:
- 90-100: Strong viral mechanics, natural sharing, network effects
- 70-89: Good organic potential, word-of-mouth likely
- 50-69: Some organic growth possible, but paid likely needed
- 30-49: Limited organic potential, mostly paid acquisition
- 0-29: No viral/organic potential, 100% paid

For each source found, extract:
1. Growth mechanic identified
2. Evidence of effectiveness
3. Confidence level in this source`
      }
    ]
  },
  {
    key: 'timing',
    name: 'Timing & Trends',
    icon: '⏰',
    weight: 0.8,
    subcategories: [
      {
        key: 'technology_enablers',
        name: 'Technology Enablers',
        prompt: `You are researching TECHNOLOGY ENABLERS for a business idea.

Your goal: Identify technologies that make this solution possible or better NOW.

SEARCH FOR:
- New technologies enabling this product
- APIs, platforms, or infrastructure that didn't exist before
- Cost reductions in relevant technology
- AI/ML capabilities if relevant

SCORING GUIDE:
- 90-100: Major new technology just matured, perfect timing
- 70-89: Good technology tailwinds, recent enablers
- 50-69: Technology exists, no major recent changes
- 30-49: Technology still maturing, might be early
- 0-29: Technology not ready, too early

For each source found, extract:
1. Technology enabler identified
2. How it helps this business idea
3. Confidence level in this source`
      },
      {
        key: 'market_readiness',
        name: 'Market Readiness',
        prompt: `You are researching MARKET READINESS for a business idea.

Your goal: Determine if the market is ready to adopt this solution.

SEARCH FOR:
- Customer awareness of the problem
- Education required for adoption
- Similar products gaining traction recently
- Behavior changes supporting adoption

SCORING GUIDE:
- 90-100: Market highly aware and ready, proven demand
- 70-89: Market becoming ready, awareness growing
- 50-69: Market somewhat ready, education needed
- 30-49: Market not ready, significant education required
- 0-29: Market unaware, too early

For each source found, extract:
1. Readiness indicator identified
2. Evidence of market state
3. Confidence level in this source`
      },
      {
        key: 'macro_tailwinds',
        name: 'Macro Tailwinds',
        prompt: `You are researching MACRO TAILWINDS for a business idea.

Your goal: Identify large-scale trends supporting this business.

SEARCH FOR:
- Economic trends (remote work, automation, etc.)
- Regulatory changes (helpful or harmful)
- Cultural shifts (sustainability, privacy, etc.)
- Demographic changes

SCORING GUIDE:
- 90-100: Multiple strong tailwinds, major trends align
- 70-89: Good tailwinds, trends supportive
- 50-69: Neutral environment, no strong tailwinds or headwinds
- 30-49: Some headwinds, challenging environment
- 0-29: Major headwinds, trends working against

For each source found, extract:
1. Macro trend identified
2. How it affects this business
3. Confidence level in this source`
      }
    ]
  }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function calculatePillarScore(subcategoryScores: number[]): number {
  if (subcategoryScores.length === 0) return 0;
  const sum = subcategoryScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / subcategoryScores.length);
}

export function calculateOverallScore(pillarScores: { key: string; score: number }[]): number {
  const pillarMap = new Map(PILLARS.map(p => [p.key, p]));

  let weightedSum = 0;
  let totalWeight = 0;

  for (const { key, score } of pillarScores) {
    const pillar = pillarMap.get(key);
    if (pillar) {
      weightedSum += score * pillar.weight;
      totalWeight += pillar.weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Strong - Worth Pursuing', color: '#22c55e' };
  if (score >= 60) return { label: 'Promising - Needs Refinement', color: '#eab308' };
  if (score >= 40) return { label: 'Risky - Significant Concerns', color: '#f97316' };
  return { label: 'Weak - Consider Pivoting', color: '#ef4444' };
}
