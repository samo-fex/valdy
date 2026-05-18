
import '@/src/styles/glassmorphism.css';
import { useState, useEffect, useCallback, useMemo, Suspense, lazy, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { EngineState, Hypothesis, DNAData } from '@/src/types/project';
import { getStoredApiKey } from '@/src/lib/api';
import { HypothesisService } from '@/src/lib/api/hypothesis';
import { StreamingService } from '@/src/lib/api/streaming';
import { useScoring } from '@/src/hooks/useScoring';
import { buildAgentContext } from '@/src/lib/orchestrator/context-builder';
import { AgentAction } from '@/src/types/orchestrator';
import { SectionKey } from '@/src/lib/colors';
import { PRIMARY_MODEL } from '@/src/lib/config/models';
import { DEMO_IDEA, DEMO_CANONICAL, DEMO_VALIDATION_DATA, DEMO_GAP_ANALYSIS, DEMO_IMPROVED_IDEA, DEMO_BUSINESS_PLAN, DEMO_PRD_DATA } from '@/src/lib/demo-data';
import Sidebar from '@/src/components/Sidebar';
import InputDashboard from '@/src/components/sections/InputDashboard';
import ProcessingSection from '@/src/components/sections/ProcessingSection';
import PRDSection from '@/src/components/sections/PRDSection';
import BusinessPlanSection from '@/src/components/sections/BusinessPlanSection';
import ConfirmationModal from '@/src/components/dashboard/ConfirmationModal';
import HypothesisModal from '@/src/components/dashboard/HypothesisModal';
import ValidationDashboardV2 from '@/src/components/dashboard/ValidationDashboardV2';
import SourceModal from '@/src/components/dashboard/SourceModal';
import ModalLoading from '@/src/components/ui/ModalLoading';
import { KeyboardShortcuts } from '@/src/components/ui/KeyboardShortcuts';
import StopProcessingButton from '@/src/components/dashboard/StopProcessingButton';

// Lazy load heavy modals
const DNAModal = lazy(() => import('@/src/components/dashboard/DNAModal'));
const LandingPageModal = lazy(() => import('@/src/components/dashboard/LandingPageModal'));
const PRDModal = lazy(() => import('@/src/components/dashboard/PRDModal'));
const ExportModal = lazy(() => import('@/src/components/dashboard/ExportModal').then(m => ({ default: m.ExportModal })));

// Section navigation order
const SECTION_ORDER: SectionKey[] = ['INPUT', 'PROCESSING', 'BUSINESS_PLAN', 'PRD'];

export default function Dashboard() {
  const [state, setState] = useState<EngineState>({
    niche: '',
    nicheLocked: false,
    selectedRegions: [],
    avoidedThemes: [],
    autopilotEnabled: false,
    tokenBudget: 10000,
    tokensAvailable: 10000,
    tokensUsed: 0,
    totalTokensSpent: 0,
    tokenRate: 0,
    hypotheses: [],
    solutions: [],
    requirements: [],
    slider: 60,
    problemsScore: 0,
    solutionsScore: 0,
    requirementsUnlocked: false,
    dnaUnlocked: false,
    generatedDNA: null,
    agentRationale: [],
    chatHistory: [],
    prdAssessed: false
  });
  
  const [geography, setGeography] = useState('Global');
  
  // Continuous mode state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  
  // Ref to track current state for use in intervals
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  
  // Ref for researchHypothesis to avoid dependency issues
  const researchHypothesisRef = useRef<((h: Hypothesis, c: 'hypotheses' | 'solutions' | 'requirements') => Promise<void>) | null>(null);
  
  // Ref to prevent duplicate initialization in StrictMode
  const initializedRef = useRef(false);
  
  // Ref to track if processing should stop
  const shouldStopRef = useRef(false);
  
  // Ref to track all pending timeouts
  const pendingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  // Ref to track streaming interval
  const orchestratorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track all active abort controllers
  const abortControllersRef = useRef<AbortController[]>([]);
  
  // Helper function to schedule timeouts that tracks them
  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      // Remove from tracking after execution
      pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter(id => id !== timeoutId);
      callback();
    }, delay);
    pendingTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);
  
  // Track recent messages to prevent duplicates
  const recentMessagesRef = useRef<Set<string>>(new Set());
  
  // Helper to add rationale message (prevents duplicates with Set)
  const addRationale = useCallback((msg: string) => {
    // Normalize message for comparison (first 50 chars)
    const key = msg.substring(0, 50);
    
    if (recentMessagesRef.current.has(key)) return;
    
    recentMessagesRef.current.add(key);
    
    // Clear old messages from Set after 2 seconds
    scheduleTimeout(() => {
      recentMessagesRef.current.delete(key);
    }, 2000);
    
    setState(prev => ({
      ...prev,
      agentRationale: [...prev.agentRationale, msg].slice(-8)
    }));
  }, [scheduleTimeout]);
  
  // Stop all processing
  const stopAllProcessing = useCallback(() => {
    // Set stop flag
    shouldStopRef.current = true;
    
    // Abort all active API calls
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore errors from already aborted controllers
      }
    });
    abortControllersRef.current = [];
    
    // Clear all pending timeouts
    pendingTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    pendingTimeoutsRef.current = [];
    
    // Clear orchestrator interval
    if (orchestratorIntervalRef.current) {
      clearInterval(orchestratorIntervalRef.current);
      orchestratorIntervalRef.current = null;
    }
    
    // Stop engine
    setEngineRunning(false);
    setEngineStartTime(null);
    
    addRationale('[STOPPED] All processing halted by user');
    toast.info('Processing stopped');
  }, [addRationale]);

  const [apiError, setApiError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('INPUT');
  const [unlockedSections, setUnlockedSections] = useState<SectionKey[]>(['INPUT']);
  const [newlyUnlocked, setNewlyUnlocked] = useState<SectionKey[]>([]);
  const [engineRunning, setEngineRunning] = useState(false);
  const [engineStartTime, setEngineStartTime] = useState<Date | null>(null);
  const [runningTime, setRunningTime] = useState('00:00');
  const [hypothesisService, setHypothesisService] = useState<HypothesisService | null>(null);
  const [streamingService, setStreamingService] = useState<StreamingService | null>(null);
  const [selectedHypothesis, setSelectedHypothesis] = useState<Hypothesis | null>(null);
  const [showDNAModal, setShowDNAModal] = useState(false);
  const [showLandingPageModal, setShowLandingPageModal] = useState(false);
  const [showPRDModal, setShowPRDModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [landingPageHtml, setLandingPageHtml] = useState('');
  const [prdData, setPrdData] = useState<any>(null);
  const [isGeneratingLandingPage, setIsGeneratingLandingPage] = useState(false);
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);
  const [currentRationaleStream, setCurrentRationaleStream] = useState('');
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    hypothesis: Hypothesis | null;
    columnType: 'hypotheses' | 'solutions' | 'requirements';
  }>({
    isOpen: false,
    hypothesis: null,
    columnType: 'hypotheses'
  });

  // Validation state
  const [validationSessionId, setValidationSessionId] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<any[]>([]);
  const [isAnalyzingGaps, setIsAnalyzingGaps] = useState(false);
  const [improvedIdea, setImprovedIdea] = useState<any>(null);
  const [businessPlanData, setBusinessPlanData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [isGeneratingBusinessPlan, setIsGeneratingBusinessPlan] = useState(false);
  const [clearInputAnalysis, setClearInputAnalysis] = useState(false);
  const [normalizedAnalysis, setNormalizedAnalysis] = useState<any>(null);

  // Scoring hook for stage progression
  const scoring = useScoring({
    hypotheses: state.hypotheses,
    solutions: state.solutions,
    requirements: state.requirements,
  });

  // Memoized computed values to prevent unnecessary re-renders
  const validatedProblems = useMemo(
    () => state.hypotheses.filter(h => h.state === 'fact' || h.state === 'validated'),
    [state.hypotheses]
  );

  const validatedSolutions = useMemo(
    () => state.solutions.filter(h => h.state === 'fact' || h.state === 'validated'),
    [state.solutions]
  );

  const validatedRequirements = useMemo(
    () => state.requirements.filter(h => h.state === 'fact' || h.state === 'validated'),
    [state.requirements]
  );

  const problemsScore = useMemo(
    () => state.hypotheses.filter(h => h.state === 'fact').length,
    [state.hypotheses]
  );
  
  // Track if any processing is happening
  const isProcessing = useMemo(
    () => engineRunning || isGeneratingLandingPage || isGeneratingPRD || 
          pendingTimeoutsRef.current.length > 0 || 
          abortControllersRef.current.length > 0,
    [engineRunning, isGeneratingLandingPage, isGeneratingPRD]
  );

  const solutionsScore = useMemo(
    () => state.solutions.filter(h => h.state === 'fact').length,
    [state.solutions]
  );

  const requirementsScore = useMemo(
    () => state.requirements.filter(h => h.state === 'fact').length,
    [state.requirements]
  );

  const canCreateDNA = useMemo(
    () => validatedProblems.length >= 2 && validatedSolutions.length >= 2,
    [validatedProblems.length, validatedSolutions.length]
  );

  // Update running time
  useEffect(() => {
    if (!engineRunning || !engineStartTime) {
      setRunningTime('00:00');
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - engineStartTime.getTime()) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setRunningTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [engineRunning, engineStartTime]);

  // Load total spent and stored DNA from localStorage on mount
  useEffect(() => {
    const storedSpent = localStorage.getItem('curatos_total_spent');
    if (storedSpent) {
      setState(prev => ({ ...prev, totalTokensSpent: Number(storedSpent) }));
    }

    const storedDNA = localStorage.getItem('curatos_dna');
    if (storedDNA) {
      try {
        const dnaData = JSON.parse(storedDNA);
        // Convert date string back to Date object
        dnaData.generatedAt = new Date(dnaData.generatedAt);
        setState(prev => ({ ...prev, generatedDNA: dnaData }));
      } catch (error) {
        console.error('Error loading stored DNA:', error);
      }
    }
  }, []);

  // Persist total spent to localStorage
  useEffect(() => {
    localStorage.setItem('curatos_total_spent', state.totalTokensSpent.toString());
  }, [state.totalTokensSpent]);

  // Initialize services on mount (prevent double init in StrictMode)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    console.log('[Init] Initializing services...');
    setHypothesisService(new HypothesisService('live'));
    setStreamingService(new StreamingService('live'));
    addRationale('Ready');
  }, [addRationale]);

  // Validation polling effect
  useEffect(() => {
    if (!validationSessionId || !isValidating) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/validate/${validationSessionId}`);
        const data = await res.json();
        setValidationData(data);

        if (data.status === 'complete') {
          setIsValidating(false);
          clearInterval(poll);
          addRationale(`[VALIDATION COMPLETE] Score: ${data.overallScore}/100 - ${data.scoreLabel}`);
        }
      } catch (error) {
        console.error('Validation poll error:', error);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [validationSessionId, isValidating, addRationale]);

  // Reset clearInputAnalysis when returning to INPUT section
  useEffect(() => {
    if (activeSection === 'INPUT') {
      setClearInputAnalysis(false);
    }
  }, [activeSection]);

  // Start validation function
  const startValidation = useCallback(async (idea: string, canonicalDescription?: string, geography?: string) => {
    if (!idea || idea.trim().length < 3) {
      toast.error('Please select a market niche');
      return;
    }

    // Unlock PROCESSING section
    setUnlockedSections(prev => { const s = new Set([...prev, 'PROCESSING']); return Array.from(s) as SectionKey[]; });

    try {
      let canonical = canonicalDescription;
      
      // Only normalize if canonical not provided
      if (!canonical) {
        addRationale('[NORMALIZING] Converting idea to canonical description...');
        
        const apiKey = getStoredApiKey();
        const normalizeRes = await fetch('/api/validate/normalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
          body: JSON.stringify({ userInput: idea })
        });

        if (!normalizeRes.ok) {
          const error = await normalizeRes.json();
          throw new Error(error.error || 'Normalization failed');
        }

        const data = await normalizeRes.json();
        canonical = data.analysis ? Object.values(data.analysis).join(' ') : (data.canonical || data.original || idea);
      }
      
      addRationale('[NORMALIZED] Starting 7-pillar validation...');

      // Step 2: Start validation
      const apiKey = getStoredApiKey();
      const validateRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({ idea, canonicalDescription: canonical, geography })
      });

      if (!validateRes.ok) {
        const error = await validateRes.json();
        throw new Error(error.error || 'Validation failed');
      }

      const { sessionId } = await validateRes.json();
      setValidationSessionId(sessionId);
      setIsValidating(true);
      
      addRationale('[VALIDATING] Researching 7 pillars × 3 subcategories × 5 sources = 105 searches...');
    } catch (error) {
      console.error('Validation error:', error);
      const message = error instanceof Error ? error.message : 'Validation failed';
      addRationale(`[ERROR] ${message}`);
      toast.error(message);
    }
  }, [addRationale]);

  // Calculate scores and unlock status
  useEffect(() => {
    const problemsScore = state.hypotheses
      .filter(h => h.state === 'fact')
      .reduce((sum, h) => sum + h.confidence, 0);
    
    const solutionsScore = state.solutions
      .filter(h => h.state === 'fact')
      .reduce((sum, h) => sum + h.confidence, 0);
    
    // New progression logic: Problems (3+ green) -> Solutions -> Solutions (3+ green) -> Requirements -> Requirements (3+ green) -> DNA
    const problemsGreenFacts = state.hypotheses.filter(h => h.state === 'fact').length;
    const solutionsGreenFacts = state.solutions.filter(h => h.state === 'fact').length;
    const requirementsGreenFacts = state.requirements.filter(h => h.state === 'fact').length;
    
    const solutionsUnlocked = problemsGreenFacts >= 2;
    const requirementsUnlocked = problemsGreenFacts >= 2 && solutionsGreenFacts >= 2;
    const dnaUnlocked = scoring.canCreateDNA;
    
    setState(prev => ({
      ...prev,
      problemsScore,
      solutionsScore,
      requirementsUnlocked,
      dnaUnlocked
    }));
  }, [state.hypotheses, state.solutions, state.requirements, scoring.canCreateDNA]);

  // Assess if requirements are sufficient for PRD generation
  const assessRequirements = useCallback(async (requirements: Hypothesis[], niche: string): Promise<{ sufficient: boolean; missing: string[] }> => {
    const reqList = requirements.map((r, i) => `${i + 1}. ${r.text}`).join('\n');
    
    const prompt = `You are a software architect reviewing requirements for a ${niche} app. Here are the current requirements:

${reqList}

Are these SUFFICIENT to build a complete, production-ready app? If NOT sufficient, respond with JSON: {"sufficient": false, "missing": ["FR: ...", "NFR: ..."]}.
If sufficient, respond with JSON: {"sufficient": true, "missing": []}.

Respond ONLY with valid JSON, no other text.`;

    try {
      const abortController = new AbortController();
      abortControllersRef.current.push(abortController);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: PRIMARY_MODEL,
          temperature: 0.3,
        }),
        signal: abortController.signal,
      });
      
      // Remove from tracking after completion
      abortControllersRef.current = abortControllersRef.current.filter(c => c !== abortController);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{"sufficient": true, "missing": []}';
      
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { sufficient: true, missing: [] };
      
      return result;
    } catch (error) {
      // Ignore abort errors (user stopped processing)
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('[AUTO-PRD] Assessment aborted by user');
        return { sufficient: false, missing: ['Processing stopped'] };
      }
      console.error('[AUTO-PRD] Assessment error:', error);
      return { sufficient: true, missing: [] }; // Fail open
    }
  }, []);

  // AUTO-PRD: Assess requirements when threshold reached
  useEffect(() => {
    const validatedProblems = state.hypotheses.filter(h => h.state === 'fact').length;
    const validatedSolutions = state.solutions.filter(h => h.state === 'fact').length;
    const requirementsCount = state.requirements.length;
    
    // Trigger when: 15+ requirements AND 2+ validated problems AND 2+ validated solutions
    const shouldAssess = requirementsCount >= 15 && validatedProblems >= 2 && validatedSolutions >= 2;
    
    if (shouldAssess && !state.prdAssessed && hypothesisService) {
      console.log('[AUTO-PRD] Threshold reached - assessing requirements...');
      setState(prev => ({ ...prev, prdAssessed: true })); // Prevent re-assessment
      
      addRationale('Assessing requirements for PRD...');
      
      // Assess and handle result
      (async () => {
        const assessment = await assessRequirements(state.requirements, state.niche);
        
        if (!assessment.sufficient && assessment.missing.length > 0) {
          console.log('[AUTO-PRD] Missing requirements:', assessment.missing);
          addRationale(`Missing ${assessment.missing.length} requirements - generating...`);
          
          // Generate missing requirements
          for (const missingReq of assessment.missing) {
            const type = missingReq.startsWith('NFR:') ? 'non-functional' : 'functional';
            const text = missingReq.replace(/^(FR:|NFR:)\s*/, '');
            
            // Check for duplicates
            const isDuplicate = stateRef.current.requirements.some(r => 
              r.text.toLowerCase().trim() === text.toLowerCase().trim()
            );
            
            if (isDuplicate) continue;
            
            const newReq: Hypothesis = {
              id: `req-${Date.now()}-${Math.random()}`,
              text,
              type: type as 'functional' | 'non-functional',
              state: 'hypothesis',
              confidence: 0,
              sources: [],
              status: 'pending',
              createdAt: new Date()
            };
            
            setState(prev => ({
              ...prev,
              requirements: [...prev.requirements, newReq]
            }));
            
            // Research the new requirement
            scheduleTimeout(() => researchHypothesisRef.current?.(newReq, 'requirements'), 300);
          }
        } else {
          console.log('[AUTO-PRD] Requirements sufficient - generating PRD...');
          addRationale('✓ Requirements sufficient - generating PRD...');
          
          // Auto-generate PRD
          scheduleTimeout(() => {
            handleGeneratePRD();
          }, 1000);
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.requirements.length, state.hypotheses, state.solutions, state.prdAssessed, state.requirements, state.niche, hypothesisService, assessRequirements, addRationale]);

  // Agent orchestrator loop
  useEffect(() => {
    if (!engineRunning || !hypothesisService) {
      // Clear interval if engine stopped
      if (orchestratorIntervalRef.current) {
        clearInterval(orchestratorIntervalRef.current);
        orchestratorIntervalRef.current = null;
      }
      return;
    }

    const interval = setInterval(async () => {
      // Check if processing should stop
      if (shouldStopRef.current) {
        if (orchestratorIntervalRef.current) {
          clearInterval(orchestratorIntervalRef.current);
          orchestratorIntervalRef.current = null;
        }
        return;
      }
      
      try {
        const apiKey = getStoredApiKey();
        if (!apiKey) {
          console.log('[Orchestrator] No API key, skipping');
          return;
        }
        
        const abortController = new AbortController();
        abortControllersRef.current.push(abortController);
        
        // CONTINUOUS MODE: Call /api/research/cycle
        if (continuousMode) {
          const response = await fetch('/api/research/cycle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sessionId,
              niche: stateRef.current.niche,
              apiKey 
            }),
            signal: abortController.signal,
          });
          
          abortControllersRef.current = abortControllersRef.current.filter(c => c !== abortController);
          
          if (!response.ok) {
            console.error('[Continuous] Cycle failed:', response.status);
            return;
          }
          
          const { sessionId: newSessionId, state: newState, action, thought } = await response.json();
          
          // Update session ID if new
          if (!sessionId && newSessionId) {
            setSessionId(newSessionId);
          }
          
          // Update state from backend
          setState(prev => ({
            ...prev,
            hypotheses: newState.hypotheses || prev.hypotheses,
            solutions: newState.solutions || prev.solutions,
            requirements: newState.requirements || prev.requirements,
            tokensUsed: newState.tokensUsed || prev.tokensUsed,
          }));
          
          // Display agent thought
          if (thought) {
            addRationale(`[Continuous] ${thought}`);
          }
          
          return;
        }
        
        // MANUAL MODE: Call /api/agent/orchestrate and execute locally
        const context = buildAgentContext(stateRef.current);
        
        const response = await fetch('/api/agent/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, apiKey }),
          signal: abortController.signal,
        });
        
        // Remove from tracking after completion
        abortControllersRef.current = abortControllersRef.current.filter(c => c !== abortController);
        
        if (!response.ok) return;
        
        const { thought, action, parameters } = await response.json();
        
        // Check if processing should stop before continuing
        if (shouldStopRef.current) return;
        
        // 3. Display agent thought
        if (thought) {
          addRationale(thought);
        }
        
        // 4. Execute the action
        switch (action) {
          case AgentAction.GENERATE_PROBLEM:
            if (hypothesisService) {
              const newProblems = await hypothesisService.generateHypotheses(stateRef.current.niche, 'problems', 1);
              if (newProblems.length > 0) {
                setState(prev => ({
                  ...prev,
                  hypotheses: [...prev.hypotheses, { ...newProblems[0], status: 'pending' }]
                }));
                scheduleTimeout(() => researchHypothesisRef.current?.(newProblems[0], 'hypotheses'), 500);
              }
            }
            break;
            
          case AgentAction.GENERATE_SOLUTION:
            if (hypothesisService && parameters?.problemId) {
              const problem = stateRef.current.hypotheses.find(h => h.id === parameters.problemId);
              if (problem) {
                const newSolutions = await hypothesisService.generateSolutionForProblem(
                  stateRef.current.niche, 
                  problem.text, 
                  problem.id
                );
                if (newSolutions.length > 0) {
                  setState(prev => ({
                    ...prev,
                    solutions: [...prev.solutions, { ...newSolutions[0], status: 'pending' }]
                  }));
                  scheduleTimeout(() => researchHypothesisRef.current?.(newSolutions[0], 'solutions'), 500);
                }
              }
            }
            break;
            
          case AgentAction.GENERATE_REQUIREMENT:
            if (hypothesisService && parameters?.solutionId) {
              const solution = stateRef.current.solutions.find(s => s.id === parameters.solutionId);
              if (solution) {
                const newReqs = await hypothesisService.generateRequirementForSolution(
                  stateRef.current.niche,
                  solution.text,
                  solution.id
                );
                if (newReqs.length > 0) {
                  setState(prev => ({
                    ...prev,
                    requirements: [...prev.requirements, { ...newReqs[0], status: 'pending' }]
                  }));
                  scheduleTimeout(() => researchHypothesisRef.current?.(newReqs[0], 'requirements'), 500);
                }
              }
            }
            break;
            
          case AgentAction.RESEARCH_CARD:
            if (parameters?.cardId) {
              const card = [...stateRef.current.hypotheses, ...stateRef.current.solutions, ...stateRef.current.requirements]
                .find(c => c.id === parameters.cardId);
              if (card) {
                const column = stateRef.current.hypotheses.includes(card) ? 'hypotheses' :
                             stateRef.current.solutions.includes(card) ? 'solutions' : 'requirements';
                researchHypothesisRef.current?.(card, column);
              }
            }
            break;
            
          case AgentAction.GENERATE_PRD:
            handleGeneratePRD();
            break;
            
          case AgentAction.THINK:
          case AgentAction.WAIT:
          default:
            // No action needed
            break;
        }
        
      } catch (error) {
        // Ignore abort errors (user stopped processing)
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('Orchestrator loop aborted by user');
          return;
        }
        console.error('Orchestrator loop error:', error);
      }
    }, 6000); // Every 6 seconds

    orchestratorIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
      orchestratorIntervalRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineRunning, hypothesisService, addRationale, scheduleTimeout, continuousMode, sessionId]);

  // Helper function to research a hypothesis with paced API status updates
  const researchHypothesis = useCallback(async (hypothesis: Hypothesis, column: 'hypotheses' | 'solutions' | 'requirements') => {
    // Check if processing should stop
    if (shouldStopRef.current) {
      return;
    }
    
    if (!hypothesisService) return;
    
    // Skip if already researching or complete
    const current = stateRef.current[column].find(h => h.id === hypothesis.id);
    if (!current || current.status === 'downloading' || current.status === 'analyzing' || current.status === 'complete') {
      return;
    }
    
    // Set status to downloading
    setState(prev => ({
      ...prev,
      [column]: prev[column].map(h => h.id === hypothesis.id ? { ...h, status: 'downloading' as const } : h)
    }));
    
    // Show API status updates
    addRationale(`[SEARCHING] Querying Serper API...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    addRationale(`[FOUND] Analyzing web results...`);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      const result = await hypothesisService.researchHypothesis(hypothesis, stateRef.current.niche, column === 'hypotheses');
      
      // Show research findings before displaying confidence
      if (result.sources.length > 0) {
        const sourceCount = result.sources.length;
        addRationale(`[VALIDATING] Found ${sourceCount} sources`);
        
        // Show key finding
        const firstSource = result.sources[0];
        const domain = firstSource.split('|||')[0].replace(/\[.*?\]/g, '').trim();
        addRationale(`[EVIDENCE] ${domain}: "${firstSource.split('|||')[1]?.substring(0, 40) || 'Supporting evidence'}..."`);
        
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      const isFact = result.confidence >= 90;
      const updatedHypothesis = { 
        ...hypothesis, 
        state: isFact ? 'fact' as const : 'hypothesis' as const, 
        confidence: result.confidence, 
        sources: result.sources,
        status: 'complete' as const
      };
      
      setState(prev => ({
        ...prev,
        [column]: prev[column].map(h => h.id === hypothesis.id ? updatedHypothesis : h)
      }));
      addRationale(`[VALIDATED] ${isFact ? `✓ FACT ${result.confidence}%` : `○ ${result.confidence}%`}`);
      
      // CHAINED HYPOTHESIS SYSTEM
      if (column === 'hypotheses' && result.confidence >= 70) {
        // Problem validated - generate solution for this problem
        setTimeout(async () => {
          try {
            addRationale(`[CHAINING] Generating solution for problem...`);
            const newSolutions = await hypothesisService.generateSolutionForProblem(stateRef.current.niche, hypothesis.text, hypothesis.id);
            const newSolution = newSolutions[0];
            
            // Check for duplicates
            const isDuplicate = stateRef.current.solutions.some(s =>
              s.text.toLowerCase().trim() === newSolution.text.toLowerCase().trim()
            );
            
            if (!isDuplicate) {
              setState(prev => ({
                ...prev,
                solutions: [...prev.solutions, { ...newSolution, status: 'pending' as const }]
              }));
              setTimeout(() => researchHypothesisRef.current?.(newSolution, 'solutions'), 2000);
            }
          } catch (e) { console.error('Chain solution error:', e); }
        }, 1500);
      }
      
      if (column === 'solutions') {
        if (result.confidence < 70) {
          // Solution failed - increment parent problem attempts and retry
          const parentProblem = stateRef.current.hypotheses.find(p => p.id === hypothesis.parentProblemId);
          if (parentProblem) {
            const attempts = (parentProblem.solutionAttempts || 0) + 1;
            
            setState(prev => ({
              ...prev,
              hypotheses: prev.hypotheses.map(p => 
                p.id === parentProblem.id 
                  ? { ...p, solutionAttempts: attempts, status: attempts >= 3 ? 'not_solvable' as const : p.status }
                  : p
              )
            }));
            
            if (attempts < 3) {
              addRationale(`[RETRY] Solution failed, generating new one (${attempts}/3)...`);
              setTimeout(async () => {
                try {
                  const newSolutions = await hypothesisService.generateSolutionForProblem(stateRef.current.niche, parentProblem.text, parentProblem.id);
                  const newSolution = newSolutions[0];
                  setState(prev => ({
                    ...prev,
                    solutions: [...prev.solutions, { ...newSolution, status: 'pending' as const }]
                  }));
                  setTimeout(() => researchHypothesisRef.current?.(newSolution, 'solutions'), 2000);
                } catch (e) { console.error('Retry solution error:', e); }
              }, 1500);
            } else {
              addRationale(`[FAILED] Problem marked as not solvable after 3 attempts`);
            }
          }
        } else {
          // Solution validated - check if we have 3+ validated solutions to generate requirements
          const validatedSolutions = stateRef.current.solutions.filter(s => s.state === 'fact').length + 1; // +1 for current
          if (validatedSolutions >= 3) {
            setTimeout(async () => {
              try {
                addRationale(`[CHAINING] Generating requirement from solutions...`);
                const newRequirements = await hypothesisService.generateRequirementForSolution(stateRef.current.niche, hypothesis.text, hypothesis.id);
                const newRequirement = newRequirements[0];
                
                const isDuplicate = stateRef.current.requirements.some(r => 
                  r.text.toLowerCase().trim() === newRequirement.text.toLowerCase().trim()
                );
                
                if (!isDuplicate) {
                  setState(prev => ({
                    ...prev,
                    requirements: [...prev.requirements, { ...newRequirement, status: 'pending' as const }]
                  }));
                  setTimeout(() => researchHypothesisRef.current?.(newRequirement, 'requirements'), 2000);
                }
              } catch (e) { console.error('Chain requirement error:', e); }
            }, 1500);
          }
        }
      }
    } catch (error) {
      console.error('[Research] Error:', error);
      setState(prev => ({
        ...prev,
        [column]: prev[column].map(h => h.id === hypothesis.id ? { ...h, status: 'complete' as const } : h)
      }));
      addRationale(`[ERROR] Research failed`);
    }
  }, [hypothesisService, addRationale]);
  
  // Keep ref updated
  useEffect(() => { researchHypothesisRef.current = researchHypothesis; }, [researchHypothesis]);

  // Engine logic - dynamic speed based on completion
  useEffect(() => {
    if (!engineRunning || !hypothesisService) return;
    
    let timeoutId: NodeJS.Timeout;

    const generateAndResearch = async () => {
      const currentNiche = stateRef.current.niche;
      if (!currentNiche) return;
      
      const currentState = stateRef.current;
      const problemsFacts = currentState.hypotheses.filter(h => h.state === 'fact').length;
      const solutionsFacts = currentState.solutions.filter(h => h.state === 'fact').length;
      const requirementsFacts = currentState.requirements.filter(h => h.state === 'fact').length;
      const allComplete = problemsFacts >= 4 && solutionsFacts >= 4 && requirementsFacts >= 15;
      
      // Dynamic interval: slower for more deliberate feel
      const nextInterval = allComplete ? 5000 : 2500;
      
      // Update tokens (slower when complete)
      setState(prev => {
        const tokensUsed = allComplete ? 1 : Math.floor(Math.random() * 10) + 5;
        return {
          ...prev,
          tokensAvailable: Math.max(0, prev.tokensAvailable - tokensUsed),
          tokensUsed: prev.tokensUsed + tokensUsed,
          totalTokensSpent: prev.totalTokensSpent + tokensUsed,
          tokenRate: tokensUsed
        };
      });

      // Skip generation if all complete
      if (!allComplete && Math.random() < 0.85) {
        const problemsCount = currentState.hypotheses.length;
        
        const shouldGenerateProblem = problemsCount < 4;
        
        try {
          if (shouldGenerateProblem) {
            addRationale(`[HYPOTHESIS] Generating problem...`);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const newProblems = await hypothesisService.generateHypotheses(currentNiche, 'problems', 1);
            const newProblem = { ...newProblems[0], status: 'pending' as const };
            
            // Check for duplicates
            const isDuplicate = stateRef.current.hypotheses.some(h =>
              h.text.toLowerCase().trim() === newProblem.text.toLowerCase().trim()
            );
            
            if (!isDuplicate) {
              setState(prev => ({
                ...prev,
                hypotheses: [...prev.hypotheses, newProblem].slice(0, 4)
              }));
              addRationale(`+ Problem: "${newProblem.text.substring(0, 35)}..."`);
              
              // Add 2-second delay before research
              setTimeout(() => researchHypothesisRef.current?.(newProblem, 'hypotheses'), 2000);
            }
          }
        } catch (error) {
          console.error('Generation error:', error);
          
          // Informative error messages based on error type
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('429')) {
            addRationale(`[RATE LIMITED] Switching to backup - please wait...`);
          } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
            addRationale(`[NETWORK] Retrying connection...`);
          } else if (errorMsg.includes('auth') || errorMsg.includes('key')) {
            addRationale(`[CONFIG] Check API configuration`);
          } else {
            addRationale(`[FALLBACK] Using backup data...`);
          }
        }
      }
      
      // Research pending hypotheses - MAX 1 researching at once per column for paced flow
      const researchingProblems = currentState.hypotheses.filter(h => h.status === 'downloading' || h.status === 'analyzing').length;
      const researchingSolutions = currentState.solutions.filter(h => h.status === 'downloading' || h.status === 'analyzing').length;
      const researchingRequirements = currentState.requirements.filter(h => h.status === 'downloading' || h.status === 'analyzing').length;
      
      const pendingProblems = currentState.hypotheses.filter(h => h.status === 'pending' && h.confidence === 0);
      const pendingSolutions = currentState.solutions.filter(h => h.status === 'pending' && h.confidence === 0);
      const pendingRequirements = currentState.requirements.filter(h => h.status === 'pending' && h.confidence === 0);
      
      if (pendingProblems.length > 0 && researchingProblems < 1) researchHypothesisRef.current?.(pendingProblems[0], 'hypotheses');
      if (pendingSolutions.length > 0 && researchingSolutions < 1) researchHypothesisRef.current?.(pendingSolutions[0], 'solutions');
      if (pendingRequirements.length > 0 && researchingRequirements < 1) researchHypothesisRef.current?.(pendingRequirements[0], 'requirements');
      if (pendingRequirements.length > 0 && researchingRequirements < 2) researchHypothesisRef.current?.(pendingRequirements[0], 'requirements' as any);
      
      // Schedule next run with dynamic interval
      timeoutId = setTimeout(generateAndResearch, nextInterval);
    };

    generateAndResearch();
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineRunning, hypothesisService]);

  const handleStartEngine = useCallback(() => {
    if (!state.niche.trim()) {
      toast.error('Enter a niche first');
      return;
    }
    shouldStopRef.current = false;
    setEngineRunning(true);
    setEngineStartTime(new Date());
  }, [state.niche]);

  const handleStopEngine = useCallback(() => {
    setEngineRunning(false);
    setEngineStartTime(null);
    setState(prev => ({ ...prev, tokenRate: 0 }));
    // Clear all pending timeouts
    pendingTimeoutsRef.current.forEach(clearTimeout);
    pendingTimeoutsRef.current = [];
    // Clear orchestrator interval
    if (orchestratorIntervalRef.current) {
      clearInterval(orchestratorIntervalRef.current);
      orchestratorIntervalRef.current = null;
    }
  }, []);

  const handleEngineToggle = useCallback(() => {
    if (engineRunning) {
      handleStopEngine();
    } else {
      handleStartEngine();
    }
  }, [engineRunning, handleStartEngine, handleStopEngine]);

  const handleNicheLockToggle = useCallback(() => {
    setState(prev => ({ ...prev, nicheLocked: !prev.nicheLocked }));
  }, []);

  const handleRegionsChange = useCallback((regions: string[]) => {
    setState(prev => ({ ...prev, selectedRegions: regions }));
  }, []);

  const handleCloseGaps = useCallback(async () => {
    console.log('[CloseGaps] Starting...', { hasValidationData: !!validationData });
    
    if (!validationData) {
      console.error('[CloseGaps] No validation data');
      return;
    }
    
    setIsAnalyzingGaps(true);
    console.log('[CloseGaps] Calling API...');
    
    try {
      const apiKey = getStoredApiKey();
      const response = await fetch('/api/validate/close-gaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({
          idea: validationData.idea,
          canonicalDescription: validationData.canonicalDescription,
          pillars: validationData.pillars,
          geography
        })
      });
      
      console.log('[CloseGaps] Response status:', response.status);
      
      const data = await response.json();
      console.log('[CloseGaps] Response data:', data);
      
      if (data.gaps) {
        setGapAnalysis(data.gaps);
      }
      if (data.improvedIdea) {
        setImprovedIdea(data.improvedIdea);
      }
      
      // Unlock Business Plan after successful gap analysis or improved idea
      if (data.improvedIdea || (data.gaps && data.gaps.length > 0)) {
        setUnlockedSections(prev => {
          const newSet = new Set<SectionKey>([...prev, 'BUSINESS_PLAN']);
          return Array.from(newSet);
        });
        setNewlyUnlocked(['BUSINESS_PLAN']);
        setTimeout(() => setNewlyUnlocked([]), 5000);
      }
    } catch (error) {
      console.error('[CloseGaps] Error:', error);
    } finally {
      setIsAnalyzingGaps(false);
      console.log('[CloseGaps] Finished');
    }
  }, [validationData, geography]);

  const handleItemClick = useCallback((hypothesis: Hypothesis) => {
    setSelectedHypothesis(hypothesis);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedHypothesis(null);
  }, []);

  const removeHypothesis = useCallback((hypothesis: Hypothesis, columnType: 'hypotheses' | 'solutions' | 'requirements') => {
    setState(prev => ({
      ...prev,
      [columnType]: prev[columnType].filter(h => h.id !== hypothesis.id),
      avoidedThemes: [...prev.avoidedThemes, hypothesis.text]
    }));
  }, []);

  const handleItemRemove = useCallback((hypothesis: Hypothesis, columnType: 'hypotheses' | 'solutions' | 'requirements') => {
    const skipConfirmation = localStorage.getItem('skipRemovalConfirmation') === 'true';
    
    if (skipConfirmation) {
      removeHypothesis(hypothesis, columnType);
    } else {
      setConfirmationModal({
        isOpen: true,
        hypothesis,
        columnType
      });
    }
  }, [removeHypothesis]);

  const handleConfirmRemoval = useCallback((skipFuture: boolean) => {
    if (skipFuture) {
      localStorage.setItem('skipRemovalConfirmation', 'true');
    }
    
    if (confirmationModal.hypothesis) {
      removeHypothesis(confirmationModal.hypothesis, confirmationModal.columnType);
    }
    
    setConfirmationModal({ isOpen: false, hypothesis: null, columnType: 'hypotheses' });
  }, [confirmationModal.hypothesis, confirmationModal.columnType, removeHypothesis]);

  const handleCancelRemoval = useCallback(() => {
    setConfirmationModal({ isOpen: false, hypothesis: null, columnType: 'hypotheses' });
  }, []);

  const handleAutopilotToggle = () => {
    setState(prev => ({ ...prev, autopilotEnabled: !prev.autopilotEnabled }));
    
    if (!state.autopilotEnabled) {
      // Autopilot activated - start the magic
      addRationale('Autopilot engaged');
      
      // Auto-configure settings with animations
      setTimeout(() => typewriterNiche(), 500);
      setTimeout(() => animateGeoSelection(), 2500);
      setTimeout(() => animateSlider(), 4000);
      setTimeout(() => {
        if (!engineRunning) {
          handleStartEngine();
        }
      }, 5500);
    }
  };

  const typewriterNiche = () => {
    const niches = ['fintech payments', 'ai saas tools', 'healthcare tech', 'climate solutions', 'developer tools'];
    const selectedNiche = niches[Math.floor(Math.random() * niches.length)];
    
    let i = 0;
    const typeInterval = setInterval(() => {
      setState(prev => ({ ...prev, niche: selectedNiche.slice(0, i) }));
      i++;
      if (i > selectedNiche.length) {
        clearInterval(typeInterval);
        setState(prev => ({
          ...prev,
          nicheLocked: true
        }));
      }
    }, 100);
  };

  const animateGeoSelection = () => {
    const regions = ['US', 'GB', 'DE'];
    
    regions.forEach((region, index) => {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          selectedRegions: Array.from(new Set([...prev.selectedRegions, region]))
        }));
      }, index * 800);
    });
  };

  const animateSlider = () => {
    
    const targetValue = 70;
    const currentValue = state.slider;
    const steps = 20;
    const increment = (targetValue - currentValue) / steps;
    
    let step = 0;
    const sliderInterval = setInterval(() => {
      setState(prev => ({ 
        ...prev, 
        slider: Math.round(currentValue + (increment * step))
      }));
      step++;
      if (step > steps) {
        clearInterval(sliderInterval);
      }
    }, 100);
  };

  const handleSliderChange = (value: number) => {
    setState(prev => ({ ...prev, slider: value }));
  };

  const handleTokenBudgetChange = (budget: number) => {
    setState(prev => ({ 
      ...prev, 
      tokenBudget: budget,
      tokensAvailable: budget - prev.tokensUsed
    }));
  };

  const handleSendMessage = (message: string) => {
    const userMessage = {
      role: 'user' as const,
      message,
      timestamp: new Date()
    };
    
    const agentResponse = {
      role: 'agent' as const,
      message: `Understood. I'll ${message.toLowerCase().includes('focus') ? 'adjust focus' : 'incorporate that guidance'}.`,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMessage, agentResponse].slice(-20)
    }));
  };

  const handleCreateDNA = async () => {
    const validatedProblems = state.hypotheses.filter(h => h.state === 'fact');
    const validatedSolutions = state.solutions.filter(h => h.state === 'fact');
    const validatedRequirements = state.requirements.filter(h => h.state === 'fact');

    const dnaData: DNAData = {
      niche: state.niche || 'fintech payments',
      generatedAt: new Date(),
      problems: validatedProblems,
      solutions: validatedSolutions,
      requirements: validatedRequirements,
      tokenCost: state.totalTokensSpent
    };

    try {
      setState(prev => ({ 
        ...prev, 
        generatedDNA: dnaData
      }));
      localStorage.setItem('curatos_dna', JSON.stringify(dnaData));
    } catch (error) {
      console.error('Error saving DNA:', error);
      toast.error('Failed to save DNA', { description: 'LocalStorage may be full' });
    }
    
    setShowDNAModal(true);
  };

  const handleGenerateLandingPage = async () => {
    if (!streamingService) {
      toast.error('Service not initialized', { description: 'Please refresh the page' });
      return;
    }

    setIsGeneratingLandingPage(true);
    addRationale('Generating landing page...');

    try {
      const validatedProblems = state.hypotheses.filter(h => h.state === 'fact');
      const validatedSolutions = state.solutions.filter(h => h.state === 'fact');

      const html = await streamingService.generateLandingPage(
        state.niche,
        validatedProblems,
        validatedSolutions
      );

      setLandingPageHtml(html);
      setShowDNAModal(false);
      setShowLandingPageModal(true);
      addRationale('✓ Landing page ready');
    } catch (error) {
      console.error('Landing page generation failed:', error);
      toast.error('Landing page generation failed', { description: String(error) });
      addRationale('✗ LP generation failed');
    } finally {
      setIsGeneratingLandingPage(false);
    }
  };

  const handleProceedToPRD = () => {
    setActiveSection('PRD');
    if (!prdData && !isGeneratingPRD) {
      handleGeneratePRD();
    }
  };

  const handleGeneratePRD = async () => {
    if (!validationData) {
      toast.error('No validation data', { description: 'Please complete validation first' });
      return;
    }

    setIsGeneratingPRD(true);
    console.log('[GeneratePRD] Starting...');

    try {
      const apiKey = getStoredApiKey();
      const response = await fetch('/api/validate/generate-prd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({
          idea: validationData.idea,
          canonicalDescription: validationData.canonicalDescription,
          pillars: validationData.pillars,
          gapAnalysis,
          improvedIdea,
          geography
        })
      });

      const data = await response.json();
      console.log('[GeneratePRD] Response:', data);

      if (data.prd) {
        setPrdData(data.prd);
        toast.success('PRD generated successfully');
      } else {
        throw new Error(data.error || 'Failed to generate PRD');
      }
    } catch (error) {
      console.error('[GeneratePRD] Error:', error);
      toast.error('PRD generation failed', { description: String(error) });
    } finally {
      setIsGeneratingPRD(false);
    }
  };

  // Navigation handlers
  const handleNextStage = useCallback(() => {
    const currentIndex = SECTION_ORDER.indexOf(activeSection);
    const nextUnlocked = SECTION_ORDER.slice(currentIndex + 1).find(section => unlockedSections.includes(section));
    if (nextUnlocked) {
      setActiveSection(nextUnlocked);
    }
  }, [activeSection, unlockedSections]);

  const handleCompleteStartOver = useCallback(() => {
    setActiveSection('INPUT');
    setUnlockedSections(['INPUT']);
    setValidationData(null);
    setValidationSessionId(null);
    setIsValidating(false);
    setShowValidation(false);
    setGapAnalysis([]);
    setImprovedIdea(null);
    setBusinessPlanData(null);
    setChartData(null);
    setPrdData(null);
    setState(prev => ({ ...prev, niche: '' }));
    toast.success('Reset complete');
  }, []);

  const getNextUnlockedSection = useCallback(() => {
    const currentIndex = SECTION_ORDER.indexOf(activeSection);
    return SECTION_ORDER.slice(currentIndex + 1).find(section => unlockedSections.includes(section));
  }, [activeSection, unlockedSections]);

  const handleGenerateBusinessPlan = async () => {
    if (!validationData || !improvedIdea) return;
    setIsGeneratingBusinessPlan(true);
    try {
      const apiKey = getStoredApiKey();
      const response = await fetch('/api/validate/generate-business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({
          improvedIdea,
          idea: validationData.idea,
          canonicalDescription: validationData.canonicalDescription,
          pillars: validationData.pillars,
          gapAnalysis,
          geography
        })
      });
      const data = await response.json();
      if (data.businessPlan) {
        setBusinessPlanData(data.businessPlan);
        if (data.businessPlan.chart_data) {
          setChartData(data.businessPlan.chart_data);
        }
        setUnlockedSections(prev => { const s = new Set([...prev, 'BUSINESS_PLAN', 'PRD']); return Array.from(s) as SectionKey[]; });
        setNewlyUnlocked(['PRD']);
        setTimeout(() => setNewlyUnlocked([]), 5000);
        toast.success('Business plan generated');
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (error) {
      console.error('[BusinessPlan] Error:', error);
      toast.error('Business plan generation failed');
    } finally {
      setIsGeneratingBusinessPlan(false);
    }
  };

  const handleUpdateBusinessPlanSection = (key: string, value: string) => {
    setBusinessPlanData((prev: any) => prev ? { ...prev, [key]: value } : prev);
  };

  // Auto-generate business plan when navigating to BUSINESS_PLAN section
  useEffect(() => {
    if (activeSection === 'BUSINESS_PLAN' && !businessPlanData && !isGeneratingBusinessPlan && validationData && improvedIdea) {
      handleGenerateBusinessPlan();
    }
  }, [activeSection, businessPlanData, isGeneratingBusinessPlan, validationData, improvedIdea]);

  // Auto-generate PRD when navigating to PRD section
  useEffect(() => {
    if (activeSection === 'PRD' && !prdData && !isGeneratingPRD && validationData) {
      handleGeneratePRD();
    }
  }, [activeSection, prdData, isGeneratingPRD, validationData]);

  // Auto-start deep validation when navigating to PROCESSING section
  useEffect(() => {
    if (activeSection === 'PROCESSING' && !validationSessionId && !isValidating && normalizedAnalysis && state.niche) {
      console.log('[AutoValidation] Starting deep validation from PROCESSING page');
      startValidation(state.niche, normalizedAnalysis.solution || state.niche, geography);
    }
  }, [activeSection]);

  const handleDNAModalClose = () => {
    setShowDNAModal(false);
  };

  const handleStartBuild = () => {
    console.log('Starting build phase...');
    setShowDNAModal(false);
  };

  const handleExportDNA = () => {
    if (!state.generatedDNA) return;

    const dna = state.generatedDNA;
    const markdown = generateDNAMarkdown(dna);
    
    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dna.niche.replace(/\s+/g, '-').toLowerCase()}-dna.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDNAMarkdown = (dna: DNAData): string => {
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    return `# ${dna.niche.toUpperCase()} - Product DNA

> **Generated:** ${formatDate(dna.generatedAt)}
> **Token Cost:** ${dna.tokenCost.toLocaleString()}

---

## Validated Problems (${dna.problems.length})

${dna.problems.map(p => `- **${p.text}** (${p.confidence}% confidence)`).join('\n')}

---

## Validated Solutions (${dna.solutions.length})

${dna.solutions.map(s => `- **${s.text}** (${s.confidence}% confidence)`).join('\n')}

---

## Requirements (${dna.requirements.length})

${dna.requirements.map(r => `- **[${r.type === 'functional' ? 'F' : 'NF'}]** ${r.text} (${r.confidence}% confidence)`).join('\n')}

---

## Summary

This DNA contains ${dna.problems.length + dna.solutions.length + dna.requirements.length} validated hypotheses ready for product development.

**Next Steps:**
1. Review and prioritize features
2. Create technical architecture
3. Begin development sprint planning

---

*Generated by valdy - Autonomous AI Hypothesis Engine*
`;
  };

  return (
    <div className="flex min-h-screen">
      {/* Stop Processing Button - Global */}
      <StopProcessingButton isProcessing={isProcessing} onStop={stopAllProcessing} />
      
      {/* Navigation Bar - Top Right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {getNextUnlockedSection() && (
          <button
            onClick={handleNextStage}
            className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 animate-pulse"
            style={{
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            Next Stage →
          </button>
        )}
      </div>

      {/* Reset Button - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleCompleteStartOver}
          className="px-6 py-3 rounded-lg font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 transition-all"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          Reset
        </button>
      </div>
      
      {/* Continuous Mode Toggle */}
      {state.nicheLocked && hypothesisService && (
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2 shadow-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-cyan-400 font-medium">Continuous Mode</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={continuousMode}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setContinuousMode(enabled);
                    if (!enabled) {
                      // Clear session when disabling
                      setSessionId(null);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </div>
              {continuousMode && (
                <span className="text-xs text-green-400 animate-pulse">● Active</span>
              )}
            </label>
            {sessionId && (
              <div className="text-xs text-gray-400 mt-1 font-mono">
                Session: {sessionId.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        unlockedSections={unlockedSections}
        newlyUnlocked={newlyUnlocked}
      />
      
      {/* Main Content with offset for sidebar */}
      <main className="flex-1 ml-56">
        <div style={{ display: activeSection === 'INPUT' ? 'block' : 'none' }}>
          <InputDashboard
            key="input"
            niche={state.niche}
            geography={geography}
            onNicheChange={(niche) => setState(prev => ({ ...prev, niche }))}
            onGeographyChange={setGeography}
            onStartValidation={(niche, canonicalDescription, geography) => {
              setClearInputAnalysis(true);
              setActiveSection('PROCESSING');
              startValidation(niche, canonicalDescription, geography);
            }}
            clearAnalysis={clearInputAnalysis}
            onNormalizationComplete={(analysis) => {
              setNormalizedAnalysis(analysis);
              setUnlockedSections(prev => {
                const s = new Set([...prev, 'PROCESSING']);
                return Array.from(s) as SectionKey[];
              });
            }}
          />
        </div>
        
        <div style={{ display: activeSection === 'PROCESSING' ? 'block' : 'none' }}>
          <ProcessingSection key="processing">
            {/* Continuous Mode Indicator */}
            {continuousMode && (
              <div className="mb-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-cyan-400 font-medium">Continuous Mode Active</span>
                    <span className="text-gray-400 text-sm">Backend executing cycles every 15s</span>
                  </div>
                  {sessionId && (
                    <span className="text-xs text-gray-500 font-mono">
                      Session: {sessionId.slice(0, 12)}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Validation Dashboard - Always show */}
            <ValidationDashboardV2
              idea={validationData?.idea}
              canonicalDescription={validationData?.canonicalDescription}
              overallScore={validationData?.overallScore ?? null}
              scoreLabel={validationData?.scoreLabel}
              pillars={validationData?.pillars || []}
              onSourceClick={setSelectedSource}
              agentLogs={[...state.agentRationale, currentRationaleStream].filter(Boolean)}
              onCloseGaps={handleCloseGaps}
              gapAnalysis={gapAnalysis}
              isAnalyzingGaps={isAnalyzingGaps}
              improvedIdea={improvedIdea}
              isResearchComplete={!isValidating}
              onProceedToPlan={() => setActiveSection('BUSINESS_PLAN')}
            />
          </ProcessingSection>
        </div>
        
        <div style={{ display: activeSection === 'BUSINESS_PLAN' ? 'block' : 'none' }}>
          <BusinessPlanSection
            key='business_plan'
            businessPlan={businessPlanData}
            isGenerating={isGeneratingBusinessPlan}
            onGenerate={handleGenerateBusinessPlan}
            onUpdateSection={handleUpdateBusinessPlanSection}
            chartData={chartData}
            ideaName={validationData?.idea || 'Business'}
            canGenerate={!!improvedIdea}
          />
        </div>
        
        <div style={{ display: activeSection === 'PRD' ? 'block' : 'none' }}>
          <PRDSection
            key="prd"
            prdData={prdData}
            isGenerating={isGeneratingPRD}
            onGenerate={handleGeneratePRD}
            canGenerate={!!businessPlanData}
          />
        </div>
      </main>
      
      {/* Modals - rendered outside sections */}
      <HypothesisModal
        hypothesis={selectedHypothesis}
        onClose={handleModalClose}
      />
      
      {/* Lazy loaded modals with Suspense */}
      <Suspense fallback={<ModalLoading message="Loading DNA Modal..." />}>
        {showDNAModal && (
          <DNAModal
            dna={state.generatedDNA}
            onClose={handleDNAModalClose}
            onStartBuild={handleStartBuild}
            onExport={handleExportDNA}
            onGenerateLandingPage={handleGenerateLandingPage}
            onGeneratePRD={handleGeneratePRD}
            isGeneratingLandingPage={isGeneratingLandingPage}
            isGeneratingPRD={isGeneratingPRD}
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoading message="Loading Landing Page..." />}>
        {showLandingPageModal && (
          <LandingPageModal
            isOpen={showLandingPageModal}
            onClose={() => setShowLandingPageModal(false)}
            problems={validatedProblems}
            solutions={validatedSolutions}
            niche={state.niche}
            html={landingPageHtml}
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoading message="Loading PRD..." />}>
        {showPRDModal && (
          <PRDModal
            isOpen={showPRDModal}
            onClose={() => setShowPRDModal(false)}
            problems={validatedProblems}
            solutions={validatedSolutions}
            niche={state.niche}
            markdown={prdData}
          />
        )}
      </Suspense>

      <Suspense fallback={<ModalLoading message="Loading Export..." />}>
        {showExportModal && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            niche={state.niche}
            hypotheses={state.hypotheses}
            solutions={state.solutions}
            prdContent={prdData || undefined}
            landingPageHTML={landingPageHtml || undefined}
          />
        )}
      </Suspense>
      
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title="Remove Hypothesis?"
        message="This hypothesis and related themes will be avoided in future AI generations"
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelRemoval}
      />

      {/* Source Modal for Validation */}
      <SourceModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onExport={() => setShowExportModal(true)}
      />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(26, 26, 36, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            backdropFilter: 'blur(12px)',
            color: '#FFFFFF',
          },
          className: 'font-mono text-sm',
        }}
      />
    </div>
  );
}
