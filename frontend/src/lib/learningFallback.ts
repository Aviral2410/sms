import type {
  AiExample,
  ExampleResponse,
  VisualizationChart,
  VisualizationStep,
  VisualizeResponse,
} from './api';

type BuildVisualizationInput = {
  question: string;
  subject?: string;
  level: 'BEGINNER' | 'STANDARD' | 'ADVANCED';
  visualizationStyle: 'AUTO' | 'STEP_LIST' | 'SUMMARY' | 'SCIENTIFIC_PLOT' | 'MIND_MAP' | 'FLOWCHART' | 'COMPARISON';
};

type BuildExamplesInput = {
  question: string;
  context?: string;
  count: number;
};

export function buildBasicVisualization(input: BuildVisualizationInput): VisualizeResponse {
  const resolvedSubject = resolveSubject(input.question, input.subject);
  const concept = extractConcept(input.question);
  const chart = resolvedSubject === 'Mathematics' ? buildMathChart(input.question) : undefined;
  const visualizationStyle = input.visualizationStyle === 'AUTO'
    ? detectVisualizationStyle(input.question, resolvedSubject)
    : input.visualizationStyle;
  const steps = buildSteps(concept, resolvedSubject, input.level, visualizationStyle, Boolean(chart));
  const diagramDefinition = buildDiagram(concept, resolvedSubject, visualizationStyle);

  return {
    title: `Understanding: ${truncate(concept, 64)}`,
    summary: buildSummary(concept, resolvedSubject, visualizationStyle, Boolean(chart)),
    subject: resolvedSubject,
    level: input.level,
    steps,
    approaches: buildApproaches(resolvedSubject, Boolean(chart)),
    tags: [resolvedSubject, input.level, visualizationStyle.replace(/_/g, ' ')],
    llmEnhanced: false,
    diagramType: diagramDefinition ? 'FLOWCHART' : chart ? 'XY_CHART' : 'NONE',
    diagramDefinition,
    chart,
    generationMode: 'LOCAL',
  };
}

export function buildBasicExamples(input: BuildExamplesInput): ExampleResponse {
  const resolvedSubject = resolveSubject(input.question, input.context);
  const concept = extractConcept(input.question);
  const examples = buildExamples(concept, resolvedSubject, Math.max(1, Math.min(input.count, 3)));

  return {
    examples,
    relatedTopics: buildRelatedTopics(concept, resolvedSubject),
    llmEnhanced: false,
    generationMode: 'LOCAL',
  };
}

function buildSteps(
  concept: string,
  subject: string,
  level: string,
  visualizationStyle: BuildVisualizationInput['visualizationStyle'],
  hasChart: boolean,
): VisualizationStep[] {
  if (visualizationStyle === 'SUMMARY') {
    return [
      {
        stepNumber: 1,
        heading: 'Core Idea',
        explanation: `${concept} sits inside ${subject} as the main idea you need to recognize first.`,
        icon: '1',
        tip: level === 'BEGINNER' ? 'Start with the definition before memorizing formulas.' : undefined,
      },
      {
        stepNumber: 2,
        heading: 'Why It Matters',
        explanation: `Focus on what changes, what stays fixed, and where this concept shows up in a real problem.`,
        icon: '2',
        tip: hasChart ? 'Use the preview below to connect the rule to a visual pattern.' : undefined,
      },
    ];
  }

  if (subject === 'Mathematics') {
    return [
      {
        stepNumber: 1,
        heading: 'Read the expression',
        explanation: `Identify the variables, constants, and operation pattern inside ${concept}.`,
        icon: '1',
        tip: 'Ask whether the expression is linear, quadratic, periodic, or exponential.',
      },
      {
        stepNumber: 2,
        heading: 'Track how values change',
        explanation: hasChart
          ? 'Follow the curve to see intercepts, turning points, or repeating behavior.'
          : 'Test a few values to see how the output changes as x changes.',
        icon: '2',
      },
      {
        stepNumber: 3,
        heading: 'Link rule to shape',
        explanation: hasChart
          ? 'Use the graph preview to confirm the shape and behavior.'
          : 'Use a quick sketch or a small value table to confirm the pattern visually.',
        icon: '3',
        visual: hasChart ? 'Curve preview available below.' : 'Try a few x values and plot the points on paper.',
      },
    ];
  }

  if (subject === 'Physics') {
    return [
      {
        stepNumber: 1,
        heading: 'Name the system',
        explanation: `Pin down the object, force, field, or motion idea inside ${concept}.`,
        icon: '1',
      },
      {
        stepNumber: 2,
        heading: 'Identify interactions',
        explanation: 'Mark what is causing the change and what is responding to it.',
        icon: '2',
        tip: 'Free-body thinking usually makes the picture clearer.',
      },
      {
        stepNumber: 3,
        heading: 'Test with a simulation',
        explanation: 'Use the recommended free tools to see the relationship in motion instead of only reading about it.',
        icon: '3',
      },
    ];
  }

  if (subject === 'Chemistry') {
    return [
      {
        stepNumber: 1,
        heading: 'Spot the particles',
        explanation: `Break ${concept} into atoms, molecules, or reactants and products.`,
        icon: '1',
      },
      {
        stepNumber: 2,
        heading: 'Follow the transformation',
        explanation: 'Track which bonds change, what stays conserved, and what the reaction conditions imply.',
        icon: '2',
      },
      {
        stepNumber: 3,
        heading: 'Check a visual model',
        explanation: 'Use the chemistry tools to compare the symbolic form with a structure or balancing view.',
        icon: '3',
      },
    ];
  }

  return [
    {
      stepNumber: 1,
      heading: 'Define the concept',
      explanation: `Write ${concept} in one plain sentence before expanding it.`,
      icon: '1',
    },
    {
      stepNumber: 2,
      heading: 'Break it into parts',
      explanation: 'Separate the idea into components, stages, or relationships you can inspect one by one.',
      icon: '2',
    },
    {
      stepNumber: 3,
      heading: 'Connect it to an example',
      explanation: 'Tie the concept to a concrete example so the explanation becomes easier to remember.',
      icon: '3',
    },
  ];
}

function buildSummary(concept: string, subject: string, visualizationStyle: string, hasChart: boolean) {
  if (visualizationStyle === 'SUMMARY') {
    return `${concept} is being reduced to its essentials so you can see the idea, the relationship, and the next place to apply it.`;
  }

  if (subject === 'Mathematics' && hasChart) {
    return `${concept} includes a quick graph preview so you can connect the rule to the visual pattern immediately.`;
  }

  return `This guided mode turns ${concept} into a clear ${subject.toLowerCase()} explanation with structured steps and in-app visuals.`;
}

function buildApproaches(subject: string, hasChart: boolean) {
  const approaches = ['Concept-first explanation', 'Practice-friendly breakdown'];
  if (hasChart) approaches.push('Graph-assisted preview');
  if (subject === 'Physics') approaches.push('Simulation-ready framing');
  if (subject === 'Chemistry') approaches.push('Structure-and-reaction framing');
  return approaches;
}

function buildDiagram(concept: string, subject: string, visualizationStyle: string) {
  if (visualizationStyle === 'SCIENTIFIC_PLOT') {
    return `graph TD
    A["${escapeLabel(concept)}"] --> B["Observe the variables"]
    B --> C["Track the pattern"]
    C --> D["Interpret the result"]
    D --> E["Verify with a free visualization tool"]`;
  }

  return `graph TD
    A["${escapeLabel(concept)}"] --> B["${escapeLabel(subject)} context"]
    B --> C["Recognize the main rule"]
    C --> D["Break the idea into parts"]
    D --> E["Apply it to an example"]`;
}

function detectVisualizationStyle(question: string, subject: string): BuildVisualizationInput['visualizationStyle'] {
  const q = question.toLowerCase();
  const s = subject.toLowerCase();

  if (q.includes('binary search') || q.includes('algorithm') || q.includes('dfs') || q.includes('bfs')) return 'FLOWCHART';
  if (q.includes('quadratic') || q.includes('graph') || q.includes('plot') || q.includes('y=')) return 'SCIENTIFIC_PLOT';
  if (q.includes('photosynthesis') || q.includes('cycle') || q.includes('process') || s.includes('biology')) return 'MIND_MAP';
  if (q.includes('compare') || q.includes('difference') || q.includes('vs ') || q.includes('versus')) return 'COMPARISON';
  if (q.startsWith('summarize') || q.startsWith('summarise') || q.includes('summary')) return 'SUMMARY';
  return 'STEP_LIST';
}

function buildExamples(concept: string, subject: string, count: number): AiExample[] {
  const templates: AiExample[] = [
    {
      title: `Worked Example: ${truncate(concept, 42)}`,
      scenario: `A ${subject.toLowerCase()} problem asks you to explain or apply ${concept} in a classroom-friendly situation.`,
      solution: `1. Restate the concept in plain words.\n2. Identify the important inputs or conditions.\n3. Apply the rule or reasoning carefully.\n4. Check whether the result makes sense.`,
      difficulty: 'EASY',
    },
    {
      title: `Applied Scenario: ${truncate(concept, 42)}`,
      scenario: `Use ${concept} in a more realistic context where you need to justify why the result follows.`,
      solution: `1. Translate the scenario into the right model.\n2. Separate knowns from unknowns.\n3. Solve step by step.\n4. Interpret the answer in context.`,
      difficulty: 'MEDIUM',
    },
    {
      title: `Stretch Practice: ${truncate(concept, 42)}`,
      scenario: `Compare two cases involving ${concept} and explain what changes between them.`,
      solution: `1. Solve the first case.\n2. Solve the second case.\n3. Compare the patterns.\n4. Summarize the rule that stays consistent.`,
      difficulty: 'HARD',
    },
  ];

  return templates.slice(0, count);
}

function buildRelatedTopics(concept: string, subject: string) {
  const base = [subject, 'Practice Problems', 'Visual Review'];
  if (subject === 'Mathematics') {
    base.push('Graph Interpretation');
  }
  if (subject === 'Physics') {
    base.push('Simulation Checks');
  }
  if (subject === 'Chemistry') {
    base.push('Reaction Patterns');
  }
  base.unshift(truncate(concept, 28));
  return Array.from(new Set(base));
}

function buildMathChart(question: string): VisualizationChart | undefined {
  const expression = extractFunctionExpression(question);
  if (!expression) return undefined;

  const evaluator = buildMathEvaluator(expression);
  if (!evaluator) return undefined;

  const data = [];
  for (let x = -10; x <= 10; x += 1) {
    const y = evaluator(x);
    if (Number.isFinite(y) && Math.abs(y) < 1_000_000) {
      data.push({
        label: `${x}`,
        x,
        y: Number(y.toFixed(3)),
      });
    }
  }

  if (data.length < 4) return undefined;

  return {
    title: `Function preview for ${expression}`,
    subtitle: 'Local graph preview for the basic plan.',
    xLabel: 'x',
    yLabel: 'y',
    data,
  };
}

function extractFunctionExpression(question: string) {
  const normalized = question
    .replace(/[–—]/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .trim();

  const patterns = [
    /y\s*=\s*([^?.,;]+)/i,
    /(?:graph|plot|visuali(?:s|z)e|draw)\s+([^?.,;]+)/i,
    /function\s+([^?.,;]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (candidate.toLowerCase().includes('x')) return candidate;
    }
  }

  return undefined;
}

function buildMathEvaluator(expression: string): ((x: number) => number) | undefined {
  const raw = expression.toLowerCase().replace(/\s+/g, '');
  if (!/^[0-9x+\-*/^().,a-z]+$/.test(raw)) return undefined;

  let jsExpression = raw
    .replace(/(\d)(x)/g, '$1*$2')
    .replace(/(\d)\(/g, '$1*(')
    .replace(/x\(/g, 'x*(')
    .replace(/\)(\d|x)/g, ')*$1')
    .replace(/\)\(/g, ')*(')
    .replace(/\^/g, '**')
    .replace(/\bpi\b/g, 'Math.PI')
    .replace(/\bsin\(/g, 'Math.sin(')
    .replace(/\bcos\(/g, 'Math.cos(')
    .replace(/\btan\(/g, 'Math.tan(')
    .replace(/\bsqrt\(/g, 'Math.sqrt(')
    .replace(/\babs\(/g, 'Math.abs(')
    .replace(/\blog\(/g, 'Math.log(');

  const stripped = jsExpression
    .replace(/Math\.(sin|cos|tan|sqrt|abs|log|PI)/g, '')
    .replace(/[0-9x+\-*/().]/g, '');

  if (stripped.length > 0) return undefined;

  try {
    const fn = new Function('x', `return ${jsExpression};`) as (x: number) => number;
    const probe = fn(1);
    if (!Number.isFinite(probe) && !Number.isNaN(probe)) return undefined;
    return fn;
  } catch {
    return undefined;
  }
}

function resolveSubject(question: string, subject?: string) {
  if (subject && subject.trim()) return subject.trim();
  const text = question.toLowerCase();
  if (/(equation|algebra|graph|function|fraction|derivative|integral|quadratic)/.test(text)) return 'Mathematics';
  if (/(force|motion|velocity|acceleration|newton|energy|circuit|electric)/.test(text)) return 'Physics';
  if (/(atom|molecule|reaction|chemical|equation|compound|acid|base)/.test(text)) return 'Chemistry';
  if (/(cell|dna|photosynthesis|ecosystem|enzyme)/.test(text)) return 'Biology';
  if (/(war|revolution|empire|history|ancient|medieval)/.test(text)) return 'History';
  if (/(algorithm|code|sorting|database|binary|compiler)/.test(text)) return 'Computer Science';
  return 'General';
}

function extractConcept(question: string) {
  const cleaned = question
    .replace(/^(what is|how does|explain|define|visuali(?:s|z)e|graph|plot)\s+/i, '')
    .trim();
  return cleaned || 'this concept';
}

function escapeLabel(value: string) {
  return value.replace(/"/g, '\'');
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}
