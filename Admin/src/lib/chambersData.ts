export interface ChamberStep {
  title: string;
  type: 'text' | 'pdf' | 'audio' | 'video' | 'image';
  contentUrl?: string;
  textContent?: string;
}

export interface ChamberScript {
  title?: string;
  when: string;
  duration: string;
  steps: ChamberStep[];
  directive: string;
}

export const CHAMBER_KEYS = [
  'mental-clarity',
  'frequency-field',
  'field-design',
  'living-frame',
  'the-plate',
  'sleep-cocoon',
  'breath-atelier',
  'the-signature'
] as const;

export const CHAMBERS_INFO = {
  'mental-clarity': { name: 'MENTAL CLARITY', number: 1, defaultSystem: 'Mental Clarity', defaultAnchor: 'Warm water · 8 breaths · cold rinse · light mobility' },
  'frequency-field': { name: 'THE FREQUENCY FIELD', number: 2, defaultSystem: 'Activation Sequence', defaultAnchor: 'Tai Chi flow · joint articulation · nasal walking' },
  'field-design': { name: 'FIELD DESIGN', number: 3, defaultSystem: 'Activation Sequence', defaultAnchor: 'Tai Chi flow · joint articulation · nasal walking' },
  'living-frame': { name: 'THE LIVING FRAME', number: 4, defaultSystem: 'Activation Sequence', defaultAnchor: 'Tai Chi flow · joint articulation · nasal walking' },
  'the-plate': { name: 'THE PLATE', defaultSystem: 'Strength + Digestion', defaultAnchor: 'Largest meal · 10 breaths before eating · slow chewing' },
  'sleep-cocoon': { name: 'SLEEP COCOON', defaultSystem: 'Sleep Cocoon', defaultAnchor: '60-minute descent · delta · darkness · nasal only' },
  'breath-atelier': { name: 'BREATH ATELIER', defaultSystem: 'Nervous-System Pacing', defaultAnchor: 'Midday Reset audio · brown noise · 8-minute breath' },
  'the-signature': { name: 'THE SIGNATURE', defaultSystem: 'Parasympathetic Descent', defaultAnchor: 'Light dinner before 7:30pm · 6 Hz theta · alternate nostril' }
};

export const WEEK_THEMES = [
  { day: 1, label: 'Monday', theme: 'Ignition', discipline: 'Cold rinse 30 sec · phone off 20 min · one written sentence' },
  { day: 2, label: 'Tuesday', theme: 'Momentum', discipline: 'Hydrate 20 min before meals · remove one notification' },
  { day: 3, label: 'Wednesday', theme: 'The Pivot', discipline: 'Silence until first tea · fruit alone · evening Frequency Field added' },
  { day: 4, label: 'Thursday', theme: 'Refinement', discipline: 'No multitasking before noon · 20 chews per bite · voice note in The Signature' },
  { day: 5, label: 'Friday', theme: 'Release', discipline: 'One hour digital silence · scent anchor · Yoga Nidra' },
  { day: 6, label: 'Saturday', theme: 'Restoration', discipline: 'Nature 20 min · breath before speaking · review the week\'s entries' },
  { day: 7, label: 'Sunday', theme: 'The Seal', discipline: '3-min immersion · no reactive conversations · write Personal Operating Notes' },
];

export const DEFAULT_CHAMBER_SCRIPTS: Record<string, Record<number, any>> = {};

export const getDayOfWeekLabel = (dayNum: number): string => {
  const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return labels[(dayNum - 1) % 7];
};

export const getDayTheme = (programId: string | null, dayNum: number): string => {
  const storageKey = programId ? `program_${programId}_day_theme_${dayNum}` : `day_theme_${dayNum}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) return saved;

  const weekDayNum = ((dayNum - 1) % 7) + 1;
  const defaultTheme = WEEK_THEMES.find(t => t.day === weekDayNum);
  return defaultTheme ? defaultTheme.theme : `Day ${dayNum}`;
};

export const saveDayTheme = (programId: string | null, dayNum: number, theme: string): void => {
  const storageKey = programId ? `program_${programId}_day_theme_${dayNum}` : `day_theme_${dayNum}`;
  if (theme.trim()) {
    localStorage.setItem(storageKey, theme.trim());
  } else {
    localStorage.removeItem(storageKey);
  }
};

export const normalizeScript = (script: any, chamberId: string, dayNum: number, programId: string | null = null): ChamberScript => {
  if (!script) {
    const info = CHAMBERS_INFO[chamberId as keyof typeof CHAMBERS_INFO];
    const themeStr = getDayTheme(programId, dayNum);
    return {
      title: info ? `${info.name} - ${themeStr}` : `Day ${dayNum}`,
      when: '',
      duration: '',
      steps: [],
      directive: ''
    };
  }

  const steps = (script.steps || []).map((step: any) => {
    if (typeof step === 'string') {
      return {
        title: step,
        type: 'text' as const,
        textContent: ''
      };
    }
    return {
      title: step.title || '',
      type: step.type || 'text',
      contentUrl: step.contentUrl || '',
      textContent: step.textContent || ''
    };
  });

  let title = script.title;
  if (!title) {
    const info = CHAMBERS_INFO[chamberId as keyof typeof CHAMBERS_INFO];
    const themeStr = getDayTheme(programId, dayNum);
    title = info ? `${info.name} - ${themeStr}` : `Day ${dayNum}`;
  }

  return {
    title,
    when: script.when || '',
    duration: script.duration || '',
    steps,
    directive: script.directive || ''
  };
};

export const getChamberScript = (chamberId: string, dayNum: number): ChamberScript => {
  const storageKey = `chamber_script_${chamberId}_day${dayNum}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return normalizeScript(JSON.parse(saved), chamberId, dayNum, null);
    } catch (e) {
      console.error('Error parsing script from localStorage:', e);
    }
  }
  // Return empty script for global/default template to keep it empty
  return {
    title: '',
    when: '',
    duration: '',
    steps: [],
    directive: ''
  };
};

export const getChamberDayTitles = (chamberId: string): { day: number; title: string }[] => {
  const list: { day: number; title: string }[] = [];
  for (let d = 1; d <= 7; d++) {
    const script = getChamberScript(chamberId, d);
    list.push({ day: d, title: script.title || `Day ${d}` });
  }
  return list;
};

export const getChamberScriptForProgram = (programId: string | null, chamberId: string, dayNum: number): ChamberScript => {
  if (!programId) {
    return getChamberScript(chamberId, dayNum);
  }
  const storageKey = `program_${programId}_chamber_script_${chamberId}_day${dayNum}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return normalizeScript(JSON.parse(saved), chamberId, dayNum, programId);
    } catch (e) {
      console.error('Error parsing program-scoped script from localStorage:', e);
    }
  }
  const info = CHAMBERS_INFO[chamberId as keyof typeof CHAMBERS_INFO];
  const themeStr = getDayTheme(programId, dayNum);
  return {
    title: info ? `${info.name} - ${themeStr}` : `Day ${dayNum}`,
    when: '',
    duration: '',
    steps: [],
    directive: ''
  };
};

export const getChamberDayTitlesForProgram = (programId: string | null, chamberId: string, durationDays: number = 30): { day: number; title: string }[] => {
  const list: { day: number; title: string }[] = [];
  for (let d = 1; d <= durationDays; d++) {
    const script = getChamberScriptForProgram(programId, chamberId, d);
    let title = script.title;
    if (!title) {
      const info = CHAMBERS_INFO[chamberId as keyof typeof CHAMBERS_INFO];
      const themeStr = getDayTheme(programId, d);
      title = info ? `${info.name} - ${themeStr}` : `${getDayOfWeekLabel(d)} (Day ${d}) — ${themeStr}`;
    }
    list.push({ day: d, title });
  }
  return list;
};

export const matchChamberKey = (moduleTitle: string | null | undefined): string => {
  if (!moduleTitle) return '';
  const cleanTitle = moduleTitle.replace(/^(chamber\s*\d+\s*[:\-]?\s*|\d+\s*[:\-]?\s*)/i, '').trim().toLowerCase();
  
  return Object.keys(CHAMBERS_INFO).find(key => {
    const chamberName = CHAMBERS_INFO[key as keyof typeof CHAMBERS_INFO].name.toLowerCase();
    return cleanTitle.includes(chamberName) || chamberName.includes(cleanTitle);
  }) || '';
};

export interface CombinedChamberStep extends ChamberStep {
  chamberKey: string;
  chamberName: string;
  routineWindow: string;
}

export const getStepWindow = (title: string, chamberId: string): string => {
  const t = title.toLowerCase();
  if (t.includes('mid-morning') || t.includes('mid morning')) return 'Mid-Morning';
  if (t.includes('morning')) return 'Morning';
  if (t.includes('midday') || t.includes('mid-day')) return 'Midday';
  if (t.includes('afternoon')) return 'Afternoon';
  if (t.includes('evening')) return 'Evening';
  if (t.includes('night')) return 'Night';

  // Default by chamberId
  if (chamberId === 'mental-clarity' || chamberId === 'frequency-field') return 'Morning';
  if (chamberId === 'field-design' || chamberId === 'living-frame') return 'Mid-Morning';
  if (chamberId === 'the-plate') return 'Midday';
  if (chamberId === 'breath-atelier') return 'Afternoon';
  if (chamberId === 'the-signature') return 'Evening';
  if (chamberId === 'sleep-cocoon') return 'Night';
  return 'General Task';
};

export const getChamberWindow = (chamberKey: string, whenText?: string): string => {
  if (whenText) {
    const t = whenText.toLowerCase();
    if (t.includes('mid-morning') || t.includes('mid morning')) return 'Mid-Morning';
    if (t.includes('morning')) return 'Morning';
    if (t.includes('midday') || t.includes('mid-day')) return 'Midday';
    if (t.includes('afternoon')) return 'Afternoon';
    if (t.includes('evening')) return 'Evening';
    if (t.includes('night')) return 'Night';
    if (t.includes('waking') || t.includes('rise') || t.includes('sunrise')) return 'Morning';
    if (t.includes('sleep') || t.includes('bed') || t.includes('cocoon')) return 'Night';
  }
  
  // Default fallback by chamber key
  switch (chamberKey) {
    case 'mental-clarity':
    case 'frequency-field':
      return 'Morning';
    case 'field-design':
    case 'living-frame':
      return 'Mid-Morning';
    case 'the-plate':
      return 'Midday';
    case 'breath-atelier':
      return 'Afternoon';
    case 'the-signature':
      return 'Evening';
    case 'sleep-cocoon':
      return 'Night';
    default:
      return 'Morning';
  }
};

export const getCombinedStepsForDay = (programId: string | null, dayNum: number): CombinedChamberStep[] => {
  const combined: CombinedChamberStep[] = [];
  
  CHAMBER_KEYS.forEach(chamberKey => {
    const script = getChamberScriptForProgram(programId, chamberKey, dayNum);
    const info = CHAMBERS_INFO[chamberKey as keyof typeof CHAMBERS_INFO];
    const chamberName = info ? info.name : chamberKey.toUpperCase();
    
    if (script && script.steps) {
      script.steps.forEach(step => {
        const windowName = getStepWindow(step.title, chamberKey);
        
        combined.push({
          ...step,
          chamberKey,
          chamberName,
          routineWindow: windowName
        });
      });
    }
  });

  const orderMap: Record<string, number> = {
    'Morning': 1,
    'Mid-Morning': 2,
    'Midday': 3,
    'Afternoon': 4,
    'Evening': 5,
    'Night': 6
  };

  combined.sort((a, b) => {
    const orderA = orderMap[a.routineWindow] || 99;
    const orderB = orderMap[b.routineWindow] || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const indexA = CHAMBER_KEYS.indexOf(a.chamberKey as any);
    const indexB = CHAMBER_KEYS.indexOf(b.chamberKey as any);
    return indexA - indexB;
  });

  return combined;
};

export const generateRoutineHtml = (routine: Array<{ window: string, system: string, anchor: string, instruction: string }>) => {
  let cardsHtml = '';
  routine.forEach(item => {
    let instructionHtml = '';
    if (item.instruction) {
      instructionHtml = `
      <div style="margin-top:12px; padding-top:12px; border-top:1px dashed rgba(212,175,55,0.15); color:#EAEAEA; font-size:0.85rem; line-height:1.5; text-align:left;">
        <div style="color:#D4AF37; font-weight:700; font-size:0.75rem; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:6px;">Process Instructions:</div>
        <div class="routine-instruction-content">${item.instruction}</div>
      </div>`;
    }

    cardsHtml += `
    <div style="background:rgba(212,175,55,0.02); border:1px solid rgba(212,175,55,0.08); border-radius:12px; padding:16px; margin-bottom:12px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="color:#D4AF37; font-weight:800; font-size:0.75rem; letter-spacing:1px; text-transform:uppercase;">${item.window}</span>
        <span style="color:#666; font-size:0.75rem; font-weight:600;">Routine Window</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
        <div style="color:#EAEAEA; font-weight:700; font-size:1rem;">${item.system}</div>
        <div style="color:#B0B0B0; font-size:0.85rem; line-height:1.4;">${item.anchor}</div>
      </div>
      ${instructionHtml}
    </div>`;
  });

  const jsonStr = JSON.stringify(routine);
  return `
  <div class="day-routine-container" style="margin-top:16px; margin-bottom:16px;">
    ${cardsHtml}
    <script type="application/json" id="routine-json">${jsonStr}</script>
  </div>`;
};





