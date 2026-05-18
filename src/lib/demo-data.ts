/**
 * Demo mode data for valdy.
 * Provides pre-generated validation results, gap analysis, improved idea,
 * and business plan so judges can experience the full flow without API keys or database.
 */

// ============================================================
// DEMO VALIDATION DATA
// ============================================================

export const DEMO_IDEA = 'AI-powered fitness coaching for seniors';
export const DEMO_CANONICAL = 'An AI-driven personalized fitness coaching platform designed specifically for adults aged 60+, providing adaptive exercise routines, health monitoring integration, and virtual coaching sessions that adjust to individual mobility levels, medical conditions, and fitness goals.';

function makeSource(type: string, title: string, url: string, snippet: string, confidence: number) {
  return {
    type,
    icon: null,
    color: null,
    name: type,
    status: 'found',
    title,
    url,
    snippet,
    relevanceScore: confidence,
    supports: confidence >= 60 ? 'Strong market signals detected' : 'Moderate signals',
    concerns: confidence < 70 ? 'Limited data coverage' : null,
    confidence,
  };
}

function makeSub(key: string, name: string, score: number, sources: any[]) {
  return { key, name, score, status: 'complete', sources };
}

export const DEMO_VALIDATION_DATA = {
  sessionId: 'demo-session',
  idea: DEMO_IDEA,
  canonicalDescription: DEMO_CANONICAL,
  status: 'complete',
  overallScore: 78,
  scoreLabel: 'Strong',
  scoreColor: '#10b981',
  completedAt: new Date().toISOString(),
  pillars: [
    {
      key: 'problem',
      name: 'Problem Severity',
      icon: '🎯',
      score: 85,
      status: 'completed',
      subcategories: [
        makeSub('pain_intensity', 'Pain Intensity', 88, [
          makeSource('serper', 'Senior Fitness Challenges Survey 2025', 'https://ncbi.nlm.nih.gov/pmc/articles/fitness-aging', 'Over 60% of adults 65+ report difficulty maintaining exercise routines due to fear of injury and lack of personalized guidance.', 90),
          makeSource('openrouter', 'WHO Physical Activity Report', 'https://who.int/news-room/physical-activity-aging', 'Insufficient physical activity is the 4th leading risk factor for mortality in older adults.', 85),
          makeSource('serper', 'AARP Fitness Market Study', 'https://aarp.org/health/fitness-2025', 'Seniors spend $12B annually on fitness but satisfaction rates are below 40%.', 82),
          makeSource('openrouter', 'McKinsey Silver Economy Report', 'https://mckinsey.com/silver-economy', 'The senior wellness market is projected to reach $1.5T by 2030.', 78),
          makeSource('serper', 'Reddit r/fitness over60', 'https://reddit.com/r/fitness/comments/seniors', 'Most gym programs are designed for younger adults. Seniors need adaptive routines.', 75),
        ]),
        makeSub('pain_frequency', 'Pain Frequency', 82, [
          makeSource('serper', 'CDC Physical Activity Statistics', 'https://cdc.gov/physical-activity/seniors', 'Only 28% of adults 65+ meet recommended physical activity guidelines.', 88),
          makeSource('openrouter', 'Journal of Aging Research', 'https://journals.plos.org/aging-exercise', 'Daily exercise adherence drops 65% within 3 months for seniors without coaching.', 84),
          makeSource('serper', 'Fitbit Senior Usage Data', 'https://fitbit.com/research/senior-engagement', 'Senior users engage with fitness apps 3x less than younger demographics.', 76),
          makeSource('openrouter', 'Harvard Health Letter', 'https://health.harvard.edu/exercise-aging', 'Regular exercise reduces fall risk by 23% in seniors over 70.', 80),
          makeSource('serper', 'SilverSneakers Engagement Report', 'https://silversneakers.com/annual-report', '4.2M seniors actively participate in SilverSneakers, showing massive demand.', 72),
        ]),
        makeSub('current_workarounds', 'Current Workarounds', 84, [
          makeSource('serper', 'SilverSneakers Program Review', 'https://silversneakers.com/about', 'SilverSneakers offers group classes but lacks personalization and AI adaptation.', 86),
          makeSource('openrouter', 'Peloton 65+ User Survey', 'https://peloton.com/research/demographics', 'Only 8% of Peloton users are over 60, citing content difficulty as main barrier.', 82),
          makeSource('serper', 'YouTube Senior Fitness Channels', 'https://youtube.com/results?search_query=senior+fitness', 'Millions of views on senior fitness videos but no adaptive feedback loop.', 78),
          makeSource('openrouter', 'Physical Therapy Market Size', 'https://grandviewresearch.com/physical-therapy-market', 'PT costs $150-300/session, making regular coaching financially prohibitive.', 85),
          makeSource('serper', 'Apple Watch Health Features', 'https://apple.com/watch/health-features', 'Wearables track metrics but dont provide actionable exercise coaching for seniors.', 74),
        ]),
      ],
    },
    {
      key: 'market',
      name: 'Market Opportunity',
      icon: '📊',
      score: 82,
      status: 'completed',
      subcategories: [
        makeSub('market_size', 'Market Size (TAM)', 90, [
          makeSource('serper', 'Global Fitness App Market Report', 'https://statista.com/fitness-app-market', 'Global fitness app market: $14.7B in 2025, projected $32B by 2030.', 92),
          makeSource('openrouter', 'Senior Population Statistics', 'https://un.org/aging/population-projections', '1.4B people will be 60+ by 2030. Fastest growing demographic globally.', 90),
          makeSource('serper', 'Digital Health for Seniors Market', 'https://marketsandmarkets.com/digital-health-seniors', 'Senior digital health market: $8.2B, growing at 18% CAGR.', 88),
          makeSource('openrouter', 'US Medicare Fitness Benefits', 'https://medicare.gov/fitness-benefits', 'Medicare covers some fitness programs, validating senior fitness as healthcare.', 82),
          makeSource('serper', 'Deloitte Health Tech Report', 'https://deloitte.com/health-tech-2025', 'AI health coaching market expected to reach $5.6B by 2028.', 85),
        ]),
        makeSub('growth_trajectory', 'Growth Trajectory', 78, [
          makeSource('serper', 'CB Insights Health Tech Trends', 'https://cbinsights.com/research/health-tech-trends', 'AI health coaching startups raised $2.3B in 2025, up 40% from 2024.', 80),
          makeSource('openrouter', 'PwC Global Health Report', 'https://pwc.com/global-health-megatrends', 'Telehealth adoption among seniors jumped from 11% to 46% post-pandemic.', 82),
          makeSource('serper', 'App Annie Senior App Downloads', 'https://appannie.com/senior-apps-trend', 'Health app downloads by 60+ users grew 67% year-over-year.', 76),
          makeSource('openrouter', 'Accenture Digital Health Survey', 'https://accenture.com/digital-health-consumer', '72% of seniors are now comfortable using smartphones for health management.', 78),
          makeSource('serper', 'Crunchbase AI Fitness Funding', 'https://crunchbase.com/hub/ai-fitness-startups', '15 AI fitness startups funded in Q4 2025, but none focused exclusively on seniors.', 74),
        ]),
        makeSub('adjacent_markets', 'Adjacent Markets', 76, [
          makeSource('serper', 'Telehealth Market Size', 'https://fortunebusinessinsights.com/telehealth-market', 'Telehealth market: $87B, seniors are fastest-growing segment.', 80),
          makeSource('openrouter', 'Wearables for Seniors', 'https://gartner.com/wearables-elderly', 'Senior wearable adoption expected to double by 2027.', 76),
          makeSource('serper', 'Senior Living Technology', 'https://seniorhousingnet.com/technology-trends', 'Assisted living facilities spending $3.2B on resident technology.', 74),
          makeSource('openrouter', 'Corporate Wellness Programs', 'https://wellnesscreative.com/corporate-wellness', 'Corporate wellness for older workers: $8B market opportunity.', 72),
          makeSource('serper', 'Insurance Wellness Incentives', 'https://healthaffairs.org/insurance-wellness', 'Health insurers offering premium discounts for verified exercise programs.', 78),
        ]),
      ],
    },
    {
      key: 'competition',
      name: 'Competitive Landscape',
      icon: '⚔️',
      score: 74,
      status: 'completed',
      subcategories: [
        makeSub('direct_competitors', 'Direct Competitors', 70, [
          makeSource('serper', 'SilverSneakers Overview', 'https://silversneakers.com', 'SilverSneakers: 17M eligible members, group classes only, no AI personalization.', 82),
          makeSource('openrouter', 'Noom for Seniors', 'https://noom.com/programs/senior', 'Noom offers weight management but limited exercise coaching for seniors.', 76),
          makeSource('serper', 'Bold App Review', 'https://agebold.com', 'Bold: Exercise app for seniors, raised $17M, but uses pre-recorded videos only.', 80),
          makeSource('openrouter', 'Peloton Guide', 'https://peloton.com/guide', 'Peloton Guide uses camera for form correction but not designed for senior limitations.', 72),
          makeSource('serper', 'Fitbit Premium Senior Features', 'https://fitbit.com/premium', 'Fitbit Premium offers generic wellness programs, not senior-specific coaching.', 68),
        ]),
        makeSub('competitor_weaknesses', 'Competitor Weaknesses', 76, [
          makeSource('serper', 'G2 Reviews SilverSneakers', 'https://g2.com/products/silversneakers/reviews', 'Users complain about lack of personalization and one-size-fits-all approach.', 78),
          makeSource('openrouter', 'Bold App Store Reviews', 'https://apps.apple.com/bold-reviews', 'Average 3.8 stars. Common complaint: exercises dont adapt to individual conditions.', 80),
          makeSource('serper', 'Peloton Churn Analysis', 'https://businessinsider.com/peloton-senior-churn', 'Peloton sees 3x higher churn among 60+ users vs younger demographics.', 76),
          makeSource('openrouter', 'Noom Senior Satisfaction', 'https://trustpilot.com/noom-seniors', 'Senior users rate Noom 2.8/5 for exercise features, citing content misalignment.', 74),
          makeSource('serper', 'Physical Therapy vs Apps', 'https://ptjournal.org/digital-vs-traditional', 'Digital solutions lack the adaptive feedback that in-person PT provides.', 72),
        ]),
        makeSub('differentiation_opportunity', 'Differentiation Opportunity', 78, [
          makeSource('serper', 'AI Personalization in Health', 'https://nature.com/ai-personalized-health', 'AI-driven personalization improves exercise adherence by 47% in clinical trials.', 84),
          makeSource('openrouter', 'Voice-First Design for Seniors', 'https://nngroup.com/articles/senior-ux', 'Voice interfaces reduce cognitive load by 60% for users 65+.', 78),
          makeSource('serper', 'Medical Integration Gap', 'https://healthit.gov/integration-standards', 'No current fitness app integrates with EHR systems for medical-aware exercise plans.', 76),
          makeSource('openrouter', 'Caregiver Communication', 'https://caregiving.org/technology-caregivers', 'Caregivers want real-time updates on exercise activity and fall risk metrics.', 74),
          makeSource('serper', 'Gamification for Seniors', 'https://frontiersin.org/gamification-elderly', 'Gamified exercise programs show 2x better adherence in 60+ populations.', 80),
        ]),
      ],
    },
    {
      key: 'solution',
      name: 'Solution Fit',
      icon: '💡',
      score: 80,
      status: 'completed',
      subcategories: [
        makeSub('problem_solution_match', 'Problem-Solution Match', 84, [
          makeSource('serper', 'AI Exercise Adaptation Study', 'https://pubmed.gov/ai-exercise-adaptation', 'Machine learning models can predict optimal exercise intensity with 89% accuracy.', 86),
          makeSource('openrouter', 'Senior UX Research', 'https://uxplanet.org/designing-for-seniors', 'Large text, voice guidance, and simple navigation increase senior app adoption 3x.', 82),
          makeSource('serper', 'Wearable Health Data Integration', 'https://ieee.org/wearable-health-data', 'Real-time health data from wearables enables dynamic exercise adjustment.', 80),
          makeSource('openrouter', 'Virtual Coaching Outcomes', 'https://jmir.org/virtual-coaching-seniors', 'Virtual coaching achieves 82% of in-person PT outcomes at 20% of the cost.', 84),
          makeSource('serper', 'FDA Digital Therapeutics', 'https://fda.gov/digital-therapeutics', 'FDA increasingly approving digital therapeutics, validating AI health coaching.', 78),
        ]),
        makeSub('feature_completeness', 'Feature Completeness', 78, [
          makeSource('serper', 'Feature Comparison Senior Apps', 'https://tomsguide.com/senior-fitness-apps', 'Current apps lack: medical condition awareness, fall detection, caregiver alerts.', 80),
          makeSource('openrouter', 'Voice AI in Healthcare', 'https://voicebot.ai/healthcare-voice-assistants', 'Voice-first interfaces preferred by 78% of seniors for daily health interactions.', 76),
          makeSource('serper', 'Progress Tracking UX', 'https://smashingmagazine.com/health-app-ux', 'Visual progress tracking increases long-term engagement by 35%.', 78),
          makeSource('openrouter', 'Social Features in Health Apps', 'https://mhealth.jmir.org/social-health-apps', 'Social/community features boost retention 2.5x in senior health apps.', 74),
          makeSource('serper', 'Multilingual Health Content', 'https://commonwealthfund.org/health-equity', 'Only 12% of senior fitness content available in languages other than English.', 72),
        ]),
        makeSub('value_clarity', 'Value Clarity', 80, [
          makeSource('serper', 'Senior Fitness ROI Study', 'https://healthaffairs.org/fitness-roi-seniors', 'Every $1 spent on senior fitness saves $3.20 in healthcare costs.', 84),
          makeSource('openrouter', 'Fall Prevention Economics', 'https://cdc.gov/falls/cost-of-falls', 'Fall-related injuries cost $50B annually. Prevention saves $28,000 per incident.', 82),
          makeSource('serper', 'Senior App Willingness to Pay', 'https://apptentive.com/senior-spending', 'Seniors willing to pay $15-30/month for health apps that show measurable results.', 78),
          makeSource('openrouter', 'Insurance Partnership Value', 'https://mckinsey.com/insurance-digital-health', 'Insurers pay $8-15/member/month for verified exercise compliance programs.', 80),
          makeSource('serper', 'Family Decision Making', 'https://agingcare.com/tech-adoption', '64% of senior tech purchases are influenced or made by family members.', 76),
        ]),
      ],
    },
    {
      key: 'monetization',
      name: 'Monetization',
      icon: '💰',
      score: 76,
      status: 'completed',
      subcategories: [
        makeSub('pricing_benchmarks', 'Pricing Benchmarks', 78, [
          makeSource('serper', 'Fitness App Pricing Survey', 'https://businessofapps.com/fitness-app-pricing', 'Premium fitness apps average $12.99/mo consumer, $4.99-8.99 for basic.', 80),
          makeSource('openrouter', 'Senior Health App Pricing', 'https://mobihealthnews.com/senior-app-pricing', 'Senior-focused health apps: $19.99-29.99/mo (higher willingness to pay than general).', 78),
          makeSource('serper', 'B2B Health Platform Pricing', 'https://g2.com/categories/corporate-wellness', 'B2B wellness platforms charge $3-8 PEPM (per employee per month).', 76),
          makeSource('openrouter', 'Physical Therapy Costs', 'https://costhelper.com/physical-therapy-cost', 'Average PT session: $150-350. AI coaching at $25/mo = 95% cost reduction.', 82),
          makeSource('serper', 'Medicare Advantage Plans', 'https://kff.org/medicare-advantage', 'Medicare Advantage plans cover fitness benefits for 27M enrollees.', 74),
        ]),
        makeSub('willingness_to_pay', 'Willingness to Pay', 74, [
          makeSource('serper', 'AARP Tech Spending Survey', 'https://aarp.org/tech-spending-2025', 'Adults 60+ spend average $85/month on health and wellness services.', 78),
          makeSource('openrouter', 'Senior Subscription Economy', 'https://zuora.com/senior-subscriptions', 'Senior subscription adoption up 34% YoY, prefer monthly over annual billing.', 74),
          makeSource('serper', 'Digital Health Price Sensitivity', 'https://rockhealth.com/price-sensitivity', '58% of seniors say they would pay more for AI-personalized health coaching.', 76),
          makeSource('openrouter', 'Caregiver Spending on Tech', 'https://caregiving.org/spending-report', 'Family caregivers spend $7,200/year on average for care technology.', 72),
          makeSource('serper', 'Health App Retention vs Price', 'https://appsflyer.com/health-app-retention', 'Higher-priced health apps ($20+) show 2x better retention than free/cheap ones.', 70),
        ]),
        makeSub('revenue_model_fit', 'Revenue Model Fit', 76, [
          makeSource('serper', 'SaaS Health Business Models', 'https://a16z.com/saas-health-business-models', 'B2B2C model (via insurers/employers) shows highest LTV in health apps.', 80),
          makeSource('openrouter', 'Freemium Health Apps', 'https://healthtechmagazine.com/freemium-model', 'Freemium converts at 5-8% in senior health apps vs 2-3% in general fitness.', 76),
          makeSource('serper', 'Hardware + Software Bundle', 'https://techcrunch.com/fitness-hardware-software', 'Bundling wearable + app increases ARPU by 3.5x in health tech.', 74),
          makeSource('openrouter', 'White Label Health Platforms', 'https://businesswire.com/white-label-health', 'White-label licensing to senior living facilities: $2-5/resident/month.', 72),
          makeSource('serper', 'Data Monetization in Health', 'https://nature.com/health-data-ethics', 'Anonymized health data partnerships provide 15-20% additional revenue.', 68),
        ]),
      ],
    },
    {
      key: 'gtm',
      name: 'Go-to-Market',
      icon: '🚀',
      score: 72,
      status: 'completed',
      subcategories: [
        makeSub('channel_viability', 'Channel Viability', 74, [
          makeSource('serper', 'Senior Marketing Channels', 'https://seniormarketing.com/channels-2025', 'Facebook, YouTube, and email are top 3 channels for reaching seniors.', 78),
          makeSource('openrouter', 'Healthcare Provider Referrals', 'https://healthleadersmedia.com/referral-marketing', 'Provider referrals drive 40% of senior health app adoption.', 76),
          makeSource('serper', 'AARP Partnership Programs', 'https://aarp.org/partnerships', 'AARP endorsement increases trust by 67% among target demographic.', 74),
          makeSource('openrouter', 'Senior Community Centers', 'https://ncoa.org/community-centers', '11,000+ senior centers in US serve as distribution channel.', 72),
          makeSource('serper', 'Medicare Advantage Marketing', 'https://cms.gov/medicare-advantage-marketing', 'Medicare Advantage plans actively seek health app partnerships.', 70),
        ]),
        makeSub('customer_access', 'Customer Access', 70, [
          makeSource('serper', 'Senior Online Behavior', 'https://pewresearch.org/seniors-online', '75% of adults 65+ use the internet daily, 61% own smartphones.', 76),
          makeSource('openrouter', 'Family Influence on Adoption', 'https://gerontology.org/family-tech-adoption', 'Adult children drive 58% of health tech adoption for parents.', 72),
          makeSource('serper', 'Senior Living Partnerships', 'https://argentum.org/technology-partnerships', '28,900 assisted living facilities in US, growing 3% annually.', 70),
          makeSource('openrouter', 'Clinical Trial Recruitment', 'https://clinicaltrials.gov/senior-fitness', 'Academic partnerships provide access to large senior cohorts for validation.', 68),
          makeSource('serper', 'Pharmacy Distribution', 'https://nacds.org/pharmacy-health-services', 'Pharmacy chains expanding health services reach 90% of US population.', 66),
        ]),
        makeSub('viral_organic_potential', 'Viral/Organic Potential', 72, [
          makeSource('serper', 'Word of Mouth in Senior Health', 'https://nielsen.com/senior-word-of-mouth', 'Seniors trust peer recommendations 4x more than advertising.', 76),
          makeSource('openrouter', 'Senior Social Media Usage', 'https://sproutsocial.com/senior-demographics', 'Facebook group participation among 60+ up 45% since 2023.', 72),
          makeSource('serper', 'Health App Referral Programs', 'https://nerdwallet.com/health-app-referrals', 'Family referral programs show 3x higher conversion than standard ads.', 74),
          makeSource('openrouter', 'Community Health Champions', 'https://who.int/community-health-champions', 'Peer health champions increase program adoption by 2.8x.', 70),
          makeSource('serper', 'SEO for Senior Health', 'https://semrush.com/senior-health-keywords', 'Senior fitness keywords: 2.3M monthly searches, low competition.', 68),
        ]),
      ],
    },
    {
      key: 'timing',
      name: 'Timing',
      icon: '⏰',
      score: 77,
      status: 'completed',
      subcategories: [
        makeSub('technology_enablers', 'Technology Enablers', 82, [
          makeSource('serper', 'AI Health Coaching Models', 'https://arxiv.org/ai-health-coaching', 'GPT-4 class models now score 89% on medical exercise safety assessments.', 84),
          makeSource('openrouter', 'Wearable API Ecosystem', 'https://developer.apple.com/healthkit', 'HealthKit and Google Fit APIs enable real-time health data integration.', 82),
          makeSource('serper', 'Voice AI Maturity', 'https://voicebot.ai/voice-ai-report-2025', 'Voice AI accuracy exceeds 95% for health-related commands in 2025.', 80),
          makeSource('openrouter', 'Edge Computing for Health', 'https://gartner.com/edge-computing-health', 'On-device AI processing enables real-time exercise form analysis.', 78),
          makeSource('serper', '5G Health Applications', 'https://qualcomm.com/5g-health', '5G enables real-time video coaching with <50ms latency.', 76),
        ]),
        makeSub('market_readiness', 'Market Readiness', 74, [
          makeSource('serper', 'Senior Digital Literacy', 'https://pewresearch.org/senior-digital-literacy', 'Senior digital literacy has doubled since 2020, removing adoption barriers.', 78),
          makeSource('openrouter', 'Telehealth Acceptance', 'https://ama-assn.org/telehealth-adoption', 'Post-pandemic: 83% of seniors comfortable with virtual health services.', 76),
          makeSource('serper', 'Senior Smartphone Ownership', 'https://statista.com/senior-smartphone', 'Smartphone ownership among 65+: 61% (2025) vs 42% (2020).', 74),
          makeSource('openrouter', 'Medicare Digital Health Policy', 'https://cms.gov/digital-health-coverage', 'CMS expanding coverage for digital health tools in 2026.', 72),
          makeSource('serper', 'Aging in Place Trend', 'https://jointcenter.org/aging-in-place', '90% of seniors prefer aging in place, driving home health technology demand.', 70),
        ]),
        makeSub('macro_tailwinds', 'Macro Tailwinds', 76, [
          makeSource('serper', 'Global Aging Demographics', 'https://un.org/aging/demographics', 'By 2050, 1 in 6 people globally will be 65+. Unprecedented demographic shift.', 80),
          makeSource('openrouter', 'Healthcare Cost Crisis', 'https://cms.gov/healthcare-spending', 'US healthcare spending: $4.5T. Prevention-focused solutions in high demand.', 78),
          makeSource('serper', 'Longevity Economy', 'https://oxford.com/longevity-economy', 'The longevity economy contributes $8.3T to US GDP annually.', 76),
          makeSource('openrouter', 'AI Regulation Tailwinds', 'https://whitehouse.gov/ai-health-regulation', 'US AI health regulation becoming clearer, reducing compliance uncertainty.', 72),
          makeSource('serper', 'ESG Health Investment', 'https://morganstanley.com/esg-health-investment', 'ESG funds increasingly investing in senior health technology.', 70),
        ]),
      ],
    },
  ],
};

// ============================================================
// DEMO GAP ANALYSIS
// ============================================================

export const DEMO_GAP_ANALYSIS = [
  {
    pillarName: 'Go-to-Market',
    score: 72,
    priority: 'HIGH' as const,
    diagnosis: 'Channel strategy lacks concrete partnerships. Need specific go-to-market partnerships with senior living facilities, Medicare Advantage plans, and healthcare providers to scale customer acquisition beyond organic channels.',
    actions: [
      'Establish B2B2C distribution via Medicare Advantage plan partnerships',
      'Pursue senior living facility licensing deals (28,900 facilities in US)',
      'Secure AARP endorsement for trust and credibility boost',
      'Build provider referral program targeting 500+ primary care physicians',
    ],
  },
  {
    pillarName: 'Competitive Landscape',
    score: 74,
    priority: 'HIGH' as const,
    diagnosis: 'Several funded competitors exist (Bold: $17M, SilverSneakers: 17M members) but none combine AI personalization with medical condition awareness. Differentiation needs to be sharper on the AI + medical integration angle.',
    actions: [
      'Position as the only AI coaching platform with EHR integration',
      'Build medically-aware adaptive exercise plans as core differentiator',
      'Partner with geriatricians for clinical validation and credibility',
      'Create defensible moat through medical data partnerships',
    ],
  },
  {
    pillarName: 'Monetization',
    score: 76,
    priority: 'MEDIUM' as const,
    diagnosis: 'Pricing strategy is viable but needs validation with the specific B2B2C model. Insurance partnerships are the highest-value channel but require compliance infrastructure.',
    actions: [
      'Launch consumer DTC at $24.99/mo as initial revenue stream',
      'Pursue Medicare Advantage partnerships at $8-15/member/month',
      'Build compliance infrastructure for insurance billing',
    ],
  },
];

// ============================================================
// DEMO IMPROVED IDEA
// ============================================================

export const DEMO_IMPROVED_IDEA = {
  problem: 'Adults 60+ face a critical fitness gap: 72% cannot maintain exercise routines due to fear of injury, lack of personalization, and prohibitive PT costs ($150-300/session). This inactivity costs $50B/year in fall-related injuries alone, while existing solutions like SilverSneakers (group-only) and Bold (pre-recorded videos) fail to adapt to individual medical conditions, mobility levels, and daily health fluctuations.',
  market: 'The senior digital health market ($8.2B, 18% CAGR) sits at the intersection of a $14.7B fitness app market and a $1.5T silver economy. With 1.4B people 60+ by 2030 and senior smartphone adoption at 61%, the TAM for AI-powered senior fitness coaching is $3.2B. Medicare Advantage (27M enrollees) and 28,900 assisted living facilities provide built-in B2B distribution channels.',
  competition: 'No competitor combines AI personalization + EHR integration + real-time wearable adaptation for seniors. SilverSneakers (17M eligible, group classes only), Bold ($17M raised, pre-recorded only), and Peloton (8% senior users, 3x churn) all lack medically-aware adaptive coaching. Our EHR integration moat is defensible — requires medical partnerships competitors cannot easily replicate.',
  solution: 'AI-driven adaptive fitness platform that creates personalized exercise plans based on medical conditions (arthritis, osteoporosis, cardiac), real-time wearable data (heart rate, balance, activity), and progressive difficulty adjustment. Voice-first interface reduces cognitive load 60%. Caregiver dashboard provides real-time safety alerts. Clinical validation shows 82% of in-person PT outcomes at 20% cost.',
  monetization: 'Three-tier model: Consumer DTC ($24.99/mo), B2B via Medicare Advantage plans ($8-15/member/month for 27M eligible), and white-label licensing to senior living facilities ($2-5/resident/month across 28,900 facilities). Consumer LTV: $450 (18-month retention). B2B LTV: $1,200+ per facility contract. Insurance channel provides 80% gross margins.',
  gtm: 'Phase 1 (months 1-6): Launch DTC via Facebook/YouTube ads targeting adult children (58% influence senior tech purchases) + provider referral partnerships. Phase 2 (months 6-12): AARP endorsement pursuit + 3 pilot Medicare Advantage partnerships. Phase 3 (year 2): Senior living facility licensing program. Target: 10K DTC users + 2 MA partnerships in year 1.',
  timing: 'Perfect storm convergence: (1) AI models now score 89% on medical exercise safety, (2) senior smartphone adoption at all-time high (61%), (3) post-pandemic telehealth acceptance at 83%, (4) CMS expanding digital health coverage in 2026, (5) no market leader has combined AI + EHR + wearable integration for seniors. First-mover advantage window: 12-18 months before incumbents adapt.',
};

// ============================================================
// DEMO BUSINESS PLAN
// ============================================================

export const DEMO_BUSINESS_PLAN = {
  executive_summary: `**FitSenior AI** is an AI-powered fitness coaching platform purpose-built for adults 60+, addressing a **$3.2B market opportunity** where 72% of seniors cannot maintain exercise routines.

- **Problem:** Seniors face fear of injury, lack of personalization, and prohibitive PT costs ($150-300/session). Current solutions (SilverSneakers, Bold, Peloton) lack AI adaptation and medical awareness.
- **Solution:** Adaptive exercise plans powered by AI that integrate medical conditions, real-time wearable data, and progressive difficulty adjustment. Voice-first interface with caregiver dashboard.
- **Market:** 1.4B people 60+ globally by 2030. Senior digital health: $8.2B growing 18% CAGR.
- **Competitive Advantage:** Only platform combining AI personalization + EHR integration + real-time wearable adaptation. 82% of in-person PT outcomes at 20% cost.
- **Financial Highlights:** Year 1 revenue target: $2.4M. Breakeven at month 18. LTV/CAC ratio: 8.5x. Three revenue streams: DTC ($24.99/mo), Medicare Advantage ($8-15 PMPM), facility licensing ($2-5/resident/mo).`,

  market_and_sales: `**Total Addressable Market (TAM):** $3.2B — AI-powered fitness coaching for 1.4B adults 60+ globally.
- **SAM:** $800M — English-speaking seniors with smartphones in US, UK, Canada, Australia.
- **SOM:** $32M — Realistic year-3 capture with focused go-to-market.

**Competitive Analysis:**
- **SilverSneakers** — 17M eligible members, group classes only, no AI personalization. Partnership opportunity.
- **Bold** — $17M raised, pre-recorded videos, no adaptive coaching or medical integration.
- **Peloton** — 8% senior users, 3x higher churn in 60+ segment, content too intense.
- **Our Edge:** EHR integration + AI adaptation + voice-first = defensible moat.

**Go-to-Market Strategy:**
- **Channel 1 (40%): Digital Ads** — Facebook/YouTube targeting adult children (58% influence).
- **Channel 2 (30%): Provider Referrals** — Partnerships with 500+ primary care physicians.
- **Channel 3 (20%): Medicare Advantage** — B2B2C via health plan partnerships.
- **Channel 4 (10%): Senior Living** — White-label licensing to facilities.

**Pricing:** $24.99/mo consumer, $8-15 PMPM insurance, $2-5/resident/mo facility.`,

  team_and_operations: `**Founding Team:**
- **CEO/Product** — 10 years in health tech, previously scaled a telehealth platform to $5M ARR.
- **CTO** — Former engineering lead at a health AI startup, expertise in ML and wearable integration.
- **Medical Advisor** — Board-certified geriatrician with 20+ years clinical experience.

**Team Composition (Year 1):**
- **Engineering (5):** 2 full-stack, 1 ML/AI, 1 mobile, 1 backend/infrastructure
- **Product & Design (2):** 1 product manager, 1 UX designer (senior-focused)
- **Sales & Marketing (3):** 1 growth lead, 1 B2B partnerships, 1 content/community
- **Operations (1):** Medical compliance and regulatory

**12-Month Roadmap:**
- **Q1:** MVP launch — iOS app with core AI coaching, basic wearable integration (Apple Watch, Fitbit). Beta with 200 seniors.
- **Q2:** Android launch, voice interface, caregiver dashboard. Target 2,000 active users.
- **Q3:** EHR integration pilot (Epic/Cerner), first Medicare Advantage partnership signed.
- **Q4:** Scale to 10,000 users, launch facility licensing program, prepare Series A.

**Tech Stack:** React Native (mobile), Next.js (web dashboard), Python/PyTorch (ML), AWS (infra), FHIR (EHR integration).`,

  financial_plan: `**Revenue Model:** Three streams — Consumer subscriptions, insurance B2B2C, facility licensing.

**3-Year Projections:**
- **Year 1:** $2.4M revenue (8K DTC subscribers + 2 MA pilot partners)
- **Year 2:** $8.5M revenue (25K DTC + 8 MA partners + 50 facilities)
- **Year 3:** $22M revenue (60K DTC + 20 MA partners + 200 facilities)

**Unit Economics:**
- **Consumer CAC:** $85 (Facebook/YouTube) → **LTV:** $450 (18-month avg retention) → **LTV/CAC: 5.3x**
- **B2B CAC:** $15,000/partner → **Annual Contract Value:** $180,000+ → **Payback: 1 month**
- **Gross Margin:** 78% (consumer), 82% (B2B)

**Funding:**
- **Pre-Seed (completed):** $500K — MVP development and beta testing
- **Seed (Q3 Y1):** $3M — Scale consumer acquisition, build B2B partnerships
- **Series A (Q4 Y2):** $12M — National expansion, EHR integration, international markets

**Breakeven:** Month 18 on unit economics, month 24 on operating basis.

**Key Risks:**
- **Regulatory:** FDA classification of AI health coaching — mitigated by wellness (not medical device) positioning
- **Adoption:** Senior tech adoption barriers — mitigated by family-driven acquisition and voice-first design
- **Competition:** Incumbents adding AI features — mitigated by EHR integration moat and medical advisor network`,

  chart_data: {
    key_metrics: [
      { label: 'TAM', value: '$3.2B', icon: 'target' },
      { label: 'Year 1 Revenue', value: '$2.4M', icon: 'dollar' },
      { label: 'Breakeven', value: '18 months', icon: 'clock' },
      { label: 'LTV/CAC Ratio', value: '5.3x', icon: 'trending' },
    ],
    market_breakdown: [
      { name: 'TAM', value: 3200, color: '#047857' },
      { name: 'SAM', value: 800, color: '#059669' },
      { name: 'SOM', value: 32, color: '#10b981' },
      { name: 'Year 1 Target', value: 2.4, color: '#34d399' },
    ],
    channels: [
      { name: 'Digital Ads', percentage: 40 },
      { name: 'Provider Referrals', percentage: 30 },
      { name: 'Medicare Advantage', percentage: 20 },
      { name: 'Senior Living', percentage: 10 },
    ],
    competitive_landscape: [
      { name: 'AI Personalization', us: 95, competitor_avg: 35 },
      { name: 'Medical Awareness', us: 90, competitor_avg: 20 },
      { name: 'Voice Interface', us: 85, competitor_avg: 25 },
      { name: 'Wearable Integration', us: 80, competitor_avg: 55 },
      { name: 'Price Value', us: 85, competitor_avg: 50 },
      { name: 'Content Library', us: 60, competitor_avg: 75 },
    ],
    milestones: [
      { quarter: 'Q1', milestone: 'MVP launch with AI coaching + Apple Watch integration' },
      { quarter: 'Q2', milestone: 'Android + voice interface + 2,000 active users' },
      { quarter: 'Q3', milestone: 'EHR integration pilot + first MA partnership' },
      { quarter: 'Q4', milestone: '10,000 users + facility licensing + Series A prep' },
    ],
    team_composition: [
      { role: 'Engineering', count: 5, color: '#047857' },
      { role: 'Sales & Marketing', count: 3, color: '#059669' },
      { role: 'Product & Design', count: 2, color: '#10b981' },
      { role: 'Operations', count: 1, color: '#34d399' },
    ],
    revenue_projections: [
      { year: 'Year 1', revenue: 2.4, costs: 1.8 },
      { year: 'Year 2', revenue: 8.5, costs: 5.2 },
      { year: 'Year 3', revenue: 22, costs: 12 },
    ],
    financial_table: [
      { metric: 'Total Addressable Market (TAM)', value: '$3.2B' },
      { metric: 'Serviceable Addressable Market (SAM)', value: '$800M' },
      { metric: 'Serviceable Obtainable Market (SOM)', value: '$32M' },
      { metric: 'Year 1 Revenue Target', value: '$2.4M' },
      { metric: 'Year 3 Revenue Target', value: '$22M' },
      { metric: 'Customer Acquisition Cost (CAC)', value: '$85' },
      { metric: 'Lifetime Value (LTV)', value: '$450' },
      { metric: 'LTV/CAC Ratio', value: '5.3x' },
      { metric: 'Gross Margin', value: '78-82%' },
      { metric: 'Breakeven Timeline', value: '18 months' },
    ],
  },
};

export const DEMO_PRD_DATA = {
  executive_summary: "FitSenior AI is a B2C SaaS platform delivering AI-powered, personalized fitness coaching for adults 60+. It adapts exercise routines based on mobility level, health conditions, and real-time progress to capture 0.5% of the $3.1B senior fitness market within 18 months.",

  target_users: [
    {
      id: "U-001",
      persona: "Active Senior",
      age_range: "60-75",
      description: "Mobile adults who want to maintain fitness independently",
      pain_points: ["Fear of injury from generic workouts", "No apps designed for their age group", "Expensive personal trainers"],
      primary_need: "Adaptive exercise routines with injury prevention"
    },
    {
      id: "U-002",
      persona: "Recovery Senior",
      age_range: "65-80",
      description: "Post-surgery or post-injury adults needing gentle rehabilitation",
      pain_points: ["Generic rehab programs ignore specific conditions", "No medical context in fitness apps", "Afraid to exercise without guidance"],
      primary_need: "Safe, medically-aware gentle exercise programs"
    },
    {
      id: "U-003",
      persona: "Caregiver",
      age_range: "35-55",
      description: "Adult children managing a parent's health remotely",
      pain_points: ["Cannot monitor parent's activity", "No visibility into exercise adherence", "Worry about falls"],
      primary_need: "Remote progress monitoring and alerts"
    }
  ],

  user_stories: [
    {
      id: "US-001",
      persona_id: "U-001",
      story: "As an Active Senior, I want to complete a health assessment onboarding, so that my exercise plan accounts for my conditions",
      acceptance_criteria: ["Captures mobility level, health conditions, and fitness goals", "Takes under 5 minutes to complete", "Results stored for plan generation"]
    },
    {
      id: "US-002",
      persona_id: "U-001",
      story: "As an Active Senior, I want to receive a personalized weekly exercise plan, so that I can stay fit without risking injury",
      acceptance_criteria: ["Plan adapts to mobility level", "Excludes exercises for flagged conditions", "New plan generated weekly"]
    },
    {
      id: "US-003",
      persona_id: "U-001",
      story: "As an Active Senior, I want video-guided sessions with voice cues, so that I can follow along without reading a screen",
      acceptance_criteria: ["Video plays with audio instructions", "Large UI elements for easy tapping", "Pause and replay available"]
    },
    {
      id: "US-004",
      persona_id: "U-002",
      story: "As a Recovery Senior, I want exercises filtered by my medical conditions, so that I don't aggravate my recovery",
      acceptance_criteria: ["Filters by joint replacement, arthritis, balance disorders", "Conservative intensity defaults", "Medical disclaimer shown"]
    },
    {
      id: "US-005",
      persona_id: "U-001",
      story: "As an Active Senior, I want to track my progress with a mobility score, so that I can see improvement over time",
      acceptance_criteria: ["Dashboard shows weekly mobility score", "Trend chart over 30 days", "Celebrates milestones"]
    },
    {
      id: "US-006",
      persona_id: "U-003",
      story: "As a Caregiver, I want to view my parent's exercise progress remotely, so that I can ensure they stay active",
      acceptance_criteria: ["View-only dashboard access", "Weekly summary email", "Alert if no activity for 3 days"]
    }
  ],

  functional_requirements: [
    {
      id: "FR-001",
      name: "Health Assessment Onboarding",
      description: "User completes questionnaire capturing mobility level, health conditions, and fitness goals",
      story_ids: ["US-001"],
      priority: 1
    },
    {
      id: "FR-002",
      name: "AI Exercise Plan Generation",
      description: "AI generates personalized weekly exercise plan based on assessment data and progress history",
      story_ids: ["US-002"],
      priority: 2
    },
    {
      id: "FR-003",
      name: "Video-Guided Sessions",
      description: "Exercise sessions with video playback, voice cues, and large-tap UI controls",
      story_ids: ["US-003"],
      priority: 3
    },
    {
      id: "FR-004",
      name: "Medical Condition Filtering",
      description: "Exercise library filtered by user health conditions to prevent aggravating injuries",
      story_ids: ["US-004"],
      priority: 4
    },
    {
      id: "FR-005",
      name: "Progress Dashboard",
      description: "Dashboard displaying mobility score, weekly trends, and milestone achievements",
      story_ids: ["US-005"],
      priority: 5
    },
    {
      id: "FR-006",
      name: "Caregiver View",
      description: "Read-only dashboard for caregivers with weekly summaries and inactivity alerts",
      story_ids: ["US-006"],
      priority: 6
    }
  ],

  non_functional_requirements: [
    {
      id: "NFR-001",
      name: "Accessibility Compliance",
      category: "Accessibility",
      description: "WCAG 2.1 AA with minimum 18px font and voice navigation",
      target: "Full WCAG 2.1 AA compliance",
      applies_to: ["global"]
    },
    {
      id: "NFR-002",
      name: "App Responsiveness",
      category: "Performance",
      description: "App launch to first exercise interaction",
      target: "Under 3 taps",
      applies_to: ["FR-003"]
    },
    {
      id: "NFR-003",
      name: "Data Encryption",
      category: "Security",
      description: "All health data encrypted at rest and in transit",
      target: "AES-256 at rest, TLS 1.3 in transit",
      applies_to: ["global"]
    },
    {
      id: "NFR-004",
      name: "Offline Mode",
      category: "Performance",
      description: "Core exercise library available without internet connection",
      target: "Full offline playback for downloaded sessions",
      applies_to: ["FR-003"]
    }
  ]
};
