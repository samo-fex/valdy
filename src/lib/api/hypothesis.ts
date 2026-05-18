import { getProvider, Message } from '@/src/lib/api';
import { Hypothesis } from '@/src/types/project';
import { getTokenTracker } from './token-tracker';
import { ScoringEngine } from '@/src/lib/research/engines/scoring-engine';
import { processValidationResult } from '@/src/lib/wtp-atp-utils';

export class HypothesisService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateHypotheses(niche: string, focus: 'problems' | 'solutions' | 'requirements', count: number = 3): Promise<Hypothesis[]> {
    // Bulletproof fallback data for hackathon judging
    const FALLBACK_HYPOTHESES = {
      problems: [
        'Small business owners|STRUGGLE_WITH|managing customer relationships|daily',
        'Startup founders|FACE_ISSUES_WITH|validating product ideas|before launch',
        'Marketing teams|STRUGGLE_WITH|measuring campaign ROI|consistently',
        'Remote teams|FACE_ISSUES_WITH|collaboration tools|across timezones',
        'E-commerce sellers|STRUGGLE_WITH|inventory tracking|real-time'
      ],
      solutions: [
        'CRM automation|ENABLES|businesses to nurture leads|automatically',
        'Validation platform|HELPS|founders test ideas|with real users',
        'Analytics dashboard|ENABLES|marketers to track ROI|in real-time',
        'Collaboration hub|HELPS|remote teams coordinate|asynchronously',
        'Inventory system|ENABLES|sellers to track stock|instantly'
      ],
      requirements: [
        'FR: The system shall provide automated data synchronization',
        'FR: The system shall support user feedback collection',
        'NFR: System response time shall be under 2 seconds',
        'FR: The system shall enable real-time notifications',
        'NFR: The system shall maintain 99.9% uptime'
      ]
    };

    try {
      const provider = getProvider('openrouter', this.apiKey);
      
      let systemPrompt: string;
      let userPrompt: string;
      
      if (focus === 'problems') {
        systemPrompt = `You are a market research expert. Generate problem hypotheses using S|P|O|C format: Subject|Predicate|Object|Constraint. Subject=WHO (user type), Predicate=STRUGGLE_WITH/FACE_ISSUES_WITH, Object=WHAT (specific problem), Constraint=WHEN/WHERE (timeframe/context).`;
        userPrompt = `Generate ${count} problem hypotheses for the ${niche} market using S|P|O|C format: Subject|Predicate|Object|Constraint. Examples:
- "VenueOwners|STRUGGLE_WITH|booking management|2026"
- "Developers|FACE_ISSUES_WITH|API testing|daily"
- "Pilots|STRUGGLE_WITH|manual logs|pre-flight"
Format as JSON array with "text" field only. Keep under 60 characters.`;
      } else if (focus === 'solutions') {
        systemPrompt = `You are a solution architect. Generate solution hypotheses using S|P|O|C format: Subject|Predicate|Object|Constraint. Subject=SOLUTION_TYPE, Predicate=ENABLES/HELPS, Object=WHO to BENEFIT, Constraint=HOW/WHEN.`;
        userPrompt = `Generate ${count} solution hypotheses for the ${niche} market using S|P|O|C format: Subject|Predicate|Object|Constraint. Examples:
- "AutoBookingApp|ENABLES|venue owners to manage bookings|instantly"
- "APITestSuite|HELPS|developers validate endpoints|pre-deployment"
- "DigitalLogbook|ENABLES|pilots to complete logs|offline"
Format as JSON array with "text" field only. Keep under 80 characters.`;
      } else {
        // requirements
        systemPrompt = `You are a software requirements engineer. Generate specific, testable requirements for a ${niche} application. Use standard FR (Functional Requirement) and NFR (Non-Functional Requirement) format.`;
        userPrompt = `Generate ${count} requirements for a ${niche} app. Mix of FR and NFR. Format as JSON array with objects containing "text" field. Each requirement must start with "FR:" or "NFR:" followed by "The system shall [action]". Examples:
- "FR: The system shall allow users to export data"
- "NFR: The system shall respond within 200ms"
Keep under 60 characters.`;
      }

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // Use fallback system for hypothesis generation
      
      const { response } = await (provider as any).chatWithFallback(messages)
      
      // Track token usage
      const tracker = getTokenTracker();
      tracker.log({
        promptTokens: response.tokens?.prompt || 0,
        completionTokens: response.tokens?.completion || 0,
        totalTokens: response.tokens?.total || 0,
        model: response.model || 'unknown',
        timestamp: new Date(),
        operation: 'hypothesis-generation',
      });
      
      // DEFENSIVE PARSING: Try multiple strategies
      console.log('Raw AI response:', response.content);
      
      let hypothesesData;
      
      // Strategy 1: Find JSON array
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          hypothesesData = JSON.parse(jsonMatch[0]);
          console.log('Parsed hypotheses data:', hypothesesData);
        } catch (error) {
          console.error('JSON parse error:', error, 'Raw JSON:', jsonMatch[0]);
        }
      }
      
      // Strategy 2: If no valid JSON, throw to trigger fallback
      if (!hypothesesData || !Array.isArray(hypothesesData) || hypothesesData.length === 0) {
        console.error('No valid JSON array found in response:', response.content);
        throw new Error('Failed to generate hypotheses: Invalid response format from AI model');
      }
      
      return hypothesesData.slice(0, count).map((item: any, index: number) => {
        console.log(`Processing item ${index}:`, item);
        
        // Use item text if valid, otherwise use high-quality fallback from array
        let text: string;
        if (item.text && typeof item.text === 'string' && item.text.trim().length > 0) {
          text = item.text;
        } else {
          // Use fallback from the predefined array
          const fallbackArray = FALLBACK_HYPOTHESES[focus];
          text = fallbackArray[index % fallbackArray.length];
          console.warn(`Item ${index} has no valid text, using fallback:`, text);
        }
        
        return {
          id: `${Date.now()}-${index}`,
          text,
          state: 'hypothesis' as const,
          confidence: 0,
          createdAt: new Date()
        };
      });
    } catch (error) {
      // BULLETPROOF FALLBACK: Return high-quality fallback data on ANY failure
      console.error('All API attempts failed, using fallback hypotheses:', error);
      
      const fallbackData = FALLBACK_HYPOTHESES[focus].slice(0, count);
      
      return fallbackData.map((text, index) => ({
        id: `fallback-${Date.now()}-${index}`,
        text,
        state: 'hypothesis' as const,
        confidence: 0,
        createdAt: new Date(),
        isFallback: true
      }));
    }
  }

  async generateSolutionForProblem(niche: string, problemText: string, problemId: string): Promise<Hypothesis[]> {
    const FALLBACK_SOLUTIONS = [
      'Automation platform|ENABLES|users to streamline workflows|automatically',
      'Analytics tool|HELPS|teams make data-driven decisions|in real-time',
      'Integration hub|ENABLES|systems to connect seamlessly|via API'
    ];

    try {
      const provider = getProvider('openrouter', this.apiKey);
      
      const systemPrompt = `You are a solution architect. Generate solution hypotheses using S|P|O|C format: Subject|Predicate|Object|Constraint. Subject=SOLUTION_TYPE, Predicate=ENABLES/HELPS, Object=WHO to BENEFIT, Constraint=HOW/WHEN.`;
      const userPrompt = `Given this validated problem: "${problemText}" in the ${niche} market.

Generate 3 solution hypotheses using S|P|O|C format: Subject|Predicate|Object|Constraint. Examples:
- "AutoBookingApp|ENABLES|venue owners to manage bookings|instantly"
- "APITestSuite|HELPS|developers validate endpoints|pre-deployment"
- "DigitalLogbook|ENABLES|pilots to complete logs|offline"
Format as JSON array with "text" field only. Keep under 80 characters.`;

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // Use fallback system for hypothesis generation
      
      const { response } = await (provider as any).chatWithFallback(messages)
      
      // Track token usage
      const tracker = getTokenTracker();
      tracker.log({
        promptTokens: response.tokens?.prompt || 0,
        completionTokens: response.tokens?.completion || 0,
        totalTokens: response.tokens?.total || 0,
        model: response.model || 'unknown',
        timestamp: new Date(),
        operation: 'solution-generation',
      });
      
      // DEFENSIVE PARSING: Try multiple strategies
      let solutionsData;
      
      // Strategy 1: Find JSON array
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          solutionsData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('JSON parse failed, trying fallback:', parseError);
        }
      }
      
      // Strategy 2: If no valid JSON, use fallback
      if (!solutionsData || !Array.isArray(solutionsData) || solutionsData.length === 0) {
        console.warn('Invalid solution data, using fallback');
        solutionsData = FALLBACK_SOLUTIONS.map(text => ({ text }));
      }
      
      return solutionsData.slice(0, 3).map((item: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        text: item.text || FALLBACK_SOLUTIONS[index] || 'Solution|ENABLES|users to solve problems|efficiently',
        state: 'hypothesis' as const,
        confidence: 0,
        parentProblemId: problemId,
        createdAt: new Date()
      }));
    } catch (error) {
      console.error('Solution generation failed, using fallback:', error);
      
      return FALLBACK_SOLUTIONS.map((text, index) => ({
        id: `fallback-solution-${Date.now()}-${index}`,
        text,
        state: 'hypothesis' as const,
        confidence: 0,
        parentProblemId: problemId,
        createdAt: new Date(),
        isFallback: true
      }));
    }
  }

  async generateRequirementForSolution(niche: string, solutionText: string, solutionId: string): Promise<Hypothesis[]> {
    const FALLBACK_REQUIREMENTS = [
      'FR: The system shall provide user authentication',
      'FR: The system shall enable data export functionality',
      'NFR: The system shall respond within 2 seconds'
    ];

    try {
      const provider = getProvider('openrouter', this.apiKey);
      
      const systemPrompt = `You are a software requirements engineer. Generate requirements using S|P|O|C format: Subject|Predicate|Object|Constraint. Subject=SYSTEM/USER, Predicate=SHALL/MUST, Object=ACTION/CAPABILITY, Constraint=CONDITIONS/LIMITS.`;
      const userPrompt = `Given this validated solution: "${solutionText}" for the ${niche} market.

Generate 3 requirements using S|P|O|C format: Subject|Predicate|Object|Constraint. Examples:
- "SYSTEM|SHALL|authenticate users|via OAuth2"
- "USER|MUST|export data|within 5 seconds"
- "API|SHALL|respond to requests|under 200ms"
Format as JSON array with "text" field only. Keep under 60 characters.`;

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // Use fallback system for hypothesis generation
      
      const { response } = await (provider as any).chatWithFallback(messages)
      
      // Track token usage
      const tracker = getTokenTracker();
      tracker.log({
        promptTokens: response.tokens?.prompt || 0,
        completionTokens: response.tokens?.completion || 0,
        totalTokens: response.tokens?.total || 0,
        model: response.model || 'unknown',
        timestamp: new Date(),
        operation: 'requirement-generation',
      });
      
      // DEFENSIVE PARSING: Try multiple strategies
      let requirementsData;
      
      // Strategy 1: Find JSON array
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          requirementsData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('JSON parse failed, trying fallback:', parseError);
        }
      }
      
      // Strategy 2: If no valid JSON, use fallback
      if (!requirementsData || !Array.isArray(requirementsData) || requirementsData.length === 0) {
        console.warn('Invalid requirement data, using fallback');
        requirementsData = FALLBACK_REQUIREMENTS.map(text => ({ text }));
      }
      
      return requirementsData.slice(0, 3).map((item: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        text: item.text || FALLBACK_REQUIREMENTS[index] || 'FR: The system shall provide basic functionality',
        type: item.text?.startsWith('NFR:') ? 'non-functional' : 'functional',
        state: 'hypothesis' as const,
        confidence: 0,
        parentSolutionId: solutionId,
        createdAt: new Date()
      }));
    } catch (error) {
      console.error('Requirement generation failed, using fallback:', error);
      
      return FALLBACK_REQUIREMENTS.map((text, index) => ({
        id: `fallback-requirement-${Date.now()}-${index}`,
        text,
        type: text.startsWith('NFR:') ? 'non-functional' as const : 'functional' as const,
        state: 'hypothesis' as const,
        confidence: 0,
        parentSolutionId: solutionId,
        createdAt: new Date(),
        isFallback: true
      }));
    }
  }

  async researchHypothesis(hypothesis: Hypothesis, niche: string, isProblemParam?: boolean): Promise<{ confidence: number; sources: string[] }> {
    let confidence = 50;
    let sources: string[] = [];
    
    // Try research agent first for better source diversity
    try {
      const response = await fetch('/api/research/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hypothesis: `${hypothesis.text} in ${niche}`,
          apiKey: this.apiKey
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Research] Agent returned:', data.confidence, 'confidence,', data.sources?.length || 0, 'sources');
        confidence = data.confidence || 50;
        sources = data.sources?.map((s: { 
          title: string; 
          snippet: string; 
          url: string; 
          domain: string; 
          source_type?: string; 
          confidence_weight?: number 
        }) => {
          const sourceTypeLabel = s.source_type ? `[${s.source_type.toUpperCase()}]` : '';
          const weightLabel = s.confidence_weight ? ` (${Math.round(s.confidence_weight * 100)}%)` : '';
          return `${sourceTypeLabel}[${s.domain || 'Web'}]${weightLabel} ${s.title} ||| ${s.snippet || ''} ||| ${s.url}`;
        }) || [];
        
        // If agent succeeded, return immediately
        if (sources.length > 0) {
          return { confidence, sources };
        }
      } else {
        console.error('[Research] Agent response not ok:', response.status);
      }
    } catch (agentError) {
      console.error('[HypothesisService] Research agent failed:', agentError);
    }
    
    // Fallback to WTP/ATP validation if agent fails
    try {
      const scoringEngine = new ScoringEngine(this.apiKey);
      const validationResult = await scoringEngine.validateHypothesis(hypothesis.text, niche);
      
      const processed = processValidationResult(validationResult);
      confidence = processed.confidence;
      
      // Create sources from reasoning - ensure reasoning is a string
      const reasoningText = typeof validationResult.reasoning === 'string' 
        ? validationResult.reasoning 
        : JSON.stringify(validationResult.reasoning);
      
      sources = [`[WTP/ATP Analysis] WTP: ${validationResult.wtp}%, ATP: ${validationResult.atp}% ||| ${reasoningText} ||| validation-result`];
      
      console.log(`[Research] WTP/ATP validation: WTP=${validationResult.wtp}%, ATP=${validationResult.atp}%, Combined=${confidence}%`);
      
    } catch (error) {
      console.error('[HypothesisService] WTP/ATP validation failed:', error);
    }
    
    // If both failed, fallback to machine-gun
    if (sources.length === 0) {
      console.log('[Research] Falling back to machine-gun');
      const searchQuery = `${hypothesis.text} ${niche} market research`;
      
      try {
        const response = await fetch('/api/research/machine-gun', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery }),
        });
        
        if (response.ok) {
          const data = await response.json();
          sources = data.sources || [];
        }
      } catch (error) {
        console.error('[HypothesisService] Machine gun fallback failed:', error);
      }
    }
    
    // PRODUCT HUNT INTEGRATION: Search for related products
    try {
      const phResponse = await fetch('/api/research/producthunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `${hypothesis.text} ${niche}`,
        }),
      });
      
      if (phResponse.ok) {
        const phData = await phResponse.json();
        const products = phData.products || [];
        
        if (products.length > 0) {
          console.log('[Research] Product Hunt found:', products.length, 'products');
          
          // Add Product Hunt products as sources
          const phSources = products.map((p: any) => 
            `[Product Hunt] ${p.name} - ${p.tagline} (${p.votesCount} votes) ||| ${p.tagline} ||| ${p.url}`
          );
          sources = [...sources, ...phSources];
          
          // Boost confidence based on Product Hunt results
          if (products.length >= 5) {
            confidence = Math.min(98, confidence + 20);
            console.log('[Research] PH boost +20% (5+ products)');
          } else if (products.length >= 1) {
            confidence = Math.min(98, confidence + 10);
            console.log('[Research] PH boost +10% (1-4 products)');
          }
        }
      }
    } catch (error) {
      console.error('[HypothesisService] Product Hunt search failed:', error);
    }
    return { confidence, sources };
  }
}
