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

export const DEFAULT_CHAMBER_SCRIPTS: Record<string, Record<number, any>> = {
  'mental-clarity': {
    1: {
      when: 'Upon waking',
      duration: '12 minutes total',
      steps: [
        '06:30 Open eyes. Don\'t reach for phone. — Three full breaths in bed. Let the body register: it is morning.',
        '06:33 Stand. Walk to bathroom. — Slowly. Note the floor under your feet.',
        '06:35 Run cold water. Test it on the wrist. — Aim for 65°F. Cool but not shocking.',
        '06:36 Splash face 8 times. — Each splash, exhale. Make the exhale audible.',
        '06:37 Step into the shower or sit on the edge of the tub. Cold rinse 30 sec. — Sternum down. Breathe slowly. Do not gasp.',
        '06:38 Step out. Wrap in a towel. Stand still 30 sec. — Feel the body re-warm itself. This is the vagus tone waking up.',
        '06:39 Eight slow breaths. Eyes open, soft gaze. — Inhale 4 through nose, exhale 6 through nose.',
        '06:42 Phone stays off for the next 20 minutes. — Drink the warm lemon water (see Chamber 05). Then the day begins.'
      ],
      directive: 'Write one sentence in your notebook before the phone: \'The dominant thought pattern I woke with was ___\'. Just one sentence. No analysis.'
    },
    2: {
      when: 'Upon waking',
      duration: '15 minutes total',
      steps: [
        '06:30 Same wake protocol as Day 1. — Three breaths in bed. No phone.',
        '06:35 Cold rinse — 45 seconds. — Up from 30. The body can take more today.',
        '06:36 Step out. Stand. Eight breaths. — Inhale 4, exhale 6.',
        '06:40 Nasal walking — 10 minutes. — Inside or outside. Mouth closed the entire walk. If you can\'t breathe through the nose, slow down.',
        '06:50 Return to the space. Begin Chamber 02.'
      ],
      directive: 'Today: remove ONE unnecessary notification from your phone. Email, social, app — your choice. One. That is the entire digital practice.'
    },
    3: {
      when: 'Upon waking',
      duration: '15 minutes',
      steps: [
        '06:30 Wake. No phone. Three breaths.',
        '06:35 Cold immersion — 60 seconds. — Today, full body submersion if possible. Bath or shower.',
        '06:36 Step out. Stand. Eight breaths. Inhale 4, exhale 6.',
        '06:40 SILENCE until the first tea. — Today\'s rule: no speech, no music, no podcast, no phone — until the first warm liquid touches your lips. Could be 20 minutes. Could be 45. Whenever you choose.',
        'After first tea: Read 2 pages of a physical book. — Not digital. Paper. The hands need the weight of the page.'
      ],
      directive: 'The \'silence until first tea\' window is the single most important rule of Week 1. It teaches the nervous system that the day begins on YOUR terms, not the world\'s.'
    },
    4: {
      when: 'Upon waking',
      duration: '18 minutes',
      steps: [
        '06:30 Wake. No phone. Three breaths.',
        '06:35 Cold immersion — 90 seconds. — The longest immersion yet. Slow your breathing the entire time.',
        '06:36 Step out. Eight breaths. — Today specifically: inhale 4 through the nose, exhale 6 through the nose. Counted.',
        'After exit: No multitasking before noon. — One thing at a time. Reading is reading. Eating is eating. Walking is walking.'
      ],
      directive: 'The single-tasking rule is the discipline of Day 4. If you catch yourself doing two things at once before noon, stop. Choose one. Resume.'
    },
    5: {
      when: 'Upon waking',
      duration: '20 minutes',
      steps: [
        '06:30 Wake. No phone. Three breaths.',
        '06:35 Cold immersion — 2 minutes. — The longest yet. Add three drops of menthol oil (peppermint or eucalyptus) to the water before stepping in.',
        '06:38 Step out. Stand. Twelve breaths. — Inhale 4, exhale 6.',
        'After exit: ONE HOUR — no digital stimulation. — No phone, no email, no screen. Read, walk, eat, breathe. Just be inside the field you have been building.'
      ],
      directive: 'The one-hour digital silence is the centerpiece of Day 5. If this is the only thing you do today, it is enough.'
    },
    6: {
      when: 'Upon waking (later — no alarm)',
      duration: '30 minutes',
      steps: [
        'Wake: Whenever the body wakes. — If you set no alarm last night, notice when your body chooses to rise. Note the time.',
        'First action: Nature exposure — 20 minutes. — Outside. Even if it\'s the porch, backyard, or one block of street. Outdoor light directly on skin and eyes within 30 min of waking.',
        'Optional: Grounding barefoot. — Feet on grass, dirt, sand, or stone. Five minutes. The electron exchange is real.',
        'Return: Journal mental fatigue triggers from the week. — What was the hardest moment of the last 5 days? What pattern do you see?'
      ],
      directive: 'Nature exposure is the most under-rated medicine in the protocol. 20 minutes today. No phone. Just light, air, ground.'
    },
    7: {
      when: 'Upon waking — slow',
      duration: 'Open-ended',
      steps: [
        'Wake: Slowly. Without alarm if possible.',
        'Cold immersion: 3 minutes — the deepest of the week. — Full body if possible. Bath, lake, ocean, cold shower.',
        'After: FULL nervous-system reset morning. — Cold + breath + silence + nature. Take the full morning.',
        'Rule for today: NO reactive conversations. — If conversation arises that triggers reactivity, take a breath and choose to delay the response or release the need to respond at all.'
      ],
      directive: 'Sunday is the seal. The work of the week is now in the body. Do not waste it on reactivity. Move through the day like someone who has just emerged from temple.'
    }
  },
  'frequency-field': {
    1: {
      when: 'Within 30 minutes of waking',
      duration: '8 minutes',
      steps: [
        'After Mental Clarity: Closed-back headphones on. — Phone in airplane mode. Do not browse.',
        'Audio: 432 Hz track, low atmospheric texture. — Volume low — you should be able to hear your own breath under it.',
        'Position: Seated upright. Spine long. Eyes closed. — Hands resting on thighs, palms up.',
        'Breath: Inhale 5, exhale 7. — Through the nose only.',
        'Mind: Let thoughts pass. Do not chase them. — The frequency is doing the work. You are just present to it.',
        'After 8 min: Remove headphones. Sit 30 sec in silence. — Then stand. Do not check the phone yet.'
      ],
      directive: 'No lyrics anywhere in the day. No podcasts before noon. Music with words is a tax on the field; today, you pay nothing you don\'t have to.'
    },
    2: {
      when: 'Within 30 minutes of waking',
      duration: '8 minutes',
      steps: [
        'Audio: 432 Hz morning track. — Same as Day 1. Repetition is the point.',
        'Position: Seated, spine long, eyes closed. — Same posture as yesterday — let it become a familiar position.',
        'Eating: Silence during all meals today. — No music, no conversation, no screens during breakfast, lunch, dinner.'
      ],
      directive: 'The field is built by repetition. Today\'s task is to repeat Day 1\'s listening — not to add anything.'
    },
    3: {
      when: 'Two windows today',
      duration: '8 min morning + 8 min evening',
      steps: [
        'Morning (07:00): 432 Hz — same as Days 1–2. — Same protocol.',
        'Evening (19:00): 6 Hz theta binaural — 8 minutes. — New window introduced. After dinner, before Sleep Cocoon prep. Closed-back headphones.',
        'Observe: Track the emotional shift. — What did the evening session do to your state? Write one line in The Signature about it tonight.'
      ],
      directive: 'Two listening windows today. The evening one is new. Notice its effect on your sleep tonight.'
    },
    4: {
      when: 'Morning + evening',
      duration: '10 + 10 minutes',
      steps: [
        'Morning: 432 Hz — 10 minutes (extended from 8).',
        'Position: Eyes closed the entire session. — Do not open them to check time.',
        'Evening: 6 Hz theta — 10 minutes. — Same protocol as Day 3, extended.'
      ],
      directive: 'Eyes closed for the FULL session today. The eye is the most stimulating sensory portal. Closing it deepens the descent.'
    },
    5: {
      when: 'Morning + evening',
      duration: '10 + 12 minutes',
      steps: [
        'Morning: 432 Hz — 10 min.',
        'Evening: 6 Hz theta — 12 minutes (deeper). — Today\'s evening session is longer. Dim the lights during it. No overhead lighting.',
        'Setting: Lamp light only after sundown today.'
      ],
      directive: 'Today the theta pulse deepens. Notice if there\'s any vivid imagery, association, or memory that arises. Don\'t chase it. Just notice.'
    },
    6: {
      when: 'During breathwork or stillness',
      duration: '8 minutes',
      steps: [
        'When: During the morning breath practice OR during midday stillness. — Pair it with another chamber today.',
        'Audio: 6 Hz theta OR 432 Hz — your choice. — Begin to develop your own sense of what the body wants at what moment.',
        'Rule: No random social media audio today. — If you scroll, mute it.'
      ],
      directive: 'Saturday is when frequencies pair with practices. The audio is no longer a separate window — it accompanies whatever you are already doing.'
    },
    7: {
      when: 'Sunrise + before sleep',
      duration: 'Two listening windows',
      steps: [
        'Sunrise: 432 Hz — 10 minutes. — If you can sit outside facing east, do that. Headphones still on.',
        'Pre-sleep: 4 Hz delta bridge — 15 minutes. — Introducing today. Delta is the sleep frequency. Use it as the descent into the Cocoon tonight.',
        'Track: Your nervous-system tone after each session. — Note in The Signature tonight.'
      ],
      directive: 'Two windows today. Sunrise and pre-sleep. The day is bookended by frequency.'
    }
  },
  'field-design': {
    1: {
      when: 'Before the day begins fully',
      duration: '15 minutes',
      steps: [
        'First task: Walk through the space. Note 3 sources of visual or auditory noise. — Not to fix them all — to see them.',
        'Action 1: Remove one source of visual clutter from the bedroom. — Just one object. Move it out of sight.',
        'Action 2: Identify one harsh overhead light you use in the morning. — Don\'t turn it on today. Use only lamps or natural light until 9am.',
        'Anchor: Place ONE object of beauty where you wake up. — A stone, a candle, a single flower, a photograph. The eye finds it first; the mind follows.',
        'Sound: First 30 minutes of the day: silent. — No radio, no music with words, no news.',
        'Touch: Find one natural material to keep within reach. — Linen, wood, stone, cotton. Pick it up once today.'
      ],
      directive: 'The field around you is shaped by what is in your line of sight. Today you remove one thing and place one thing. That is the entire instruction.'
    },
    2: {
      when: 'Mid-morning',
      duration: '10 minutes',
      steps: [
        'Add: One grounding object placed deliberately. — Choose: a stone, a piece of wood, a candle, a plant. Place it where your eyes land when you sit at your desk or favorite chair.',
        'Position: Eye level or slightly below. — Not behind you. Not above. Where you will see it 50 times today.',
        'Why: The eye trains the mind. — An object of weight or warmth in the visual field shifts the entire system.'
      ],
      directive: 'Spend 60 seconds looking at the object after placing it. Then leave it alone. It works on its own.'
    },
    3: {
      when: 'Mid-morning',
      duration: '12 minutes',
      steps: [
        'Eliminate: Background TV / radio noise — entire day. — If someone in your space wants background sound, ask for headphones or a separate room.',
        'Reinforce: Morning silence — 30 minutes after waking. — Same as Day 1 rule, now habitual.',
        'Notice: What does silence reveal? — Often the first thing silence shows you is your own internal noise. That is information.'
      ],
      directive: 'Silence is not absence of sound. Silence is the field that lets sound become meaningful again.'
    },
    4: {
      when: 'Mid-morning',
      duration: '10 minutes',
      steps: [
        'Create: Designate a \'reset chair\' or corner. — One specific seat in your home where you do nothing — no phone, no work, no eating. Just sit.',
        'Rule: No phone use in that space. Ever. — It becomes a phone-free zone.',
        'Use: Sit in it once today for 5 minutes. — Eyes open, soft gaze, breath natural.'
      ],
      directive: 'The reset chair is a place you go when the field needs clearing. It works because the space holds the practice.'
    },
    5: {
      when: 'Mid-morning',
      duration: '8 minutes',
      steps: [
        'Introduce: A scent anchor. — Choose ONE: cedar, sandalwood, vetiver, frankincense, or palo santo. Acquire it today if you don\'t have it.',
        'Place: Near your reset chair OR near where you wake.',
        'Use: Light or apply it ONCE today. — Notice how the scent shifts your state. The olfactory is the only sense directly connected to the limbic system.'
      ],
      directive: 'Scent is the fastest field-shifter we have. One smell and the nervous system relocates. Choose your scent like you choose your altar.'
    },
    6: {
      when: 'Sometime today',
      duration: '20 minutes',
      steps: [
        'Organize: The sleeping area — fully. — Make the bed. Clear the surfaces. Replace anything visible that doesn\'t belong in a place of rest.',
        'Simplify: Visible surfaces. — Nightstand, dresser top, floor — only what serves the room.',
        'Add: One thing of beauty. — If not yet present near the bed: a candle, a stone, a single book of poetry.'
      ],
      directive: 'The bedroom is the most important field design space because it is where the most repair happens. Honor it today.'
    },
    7: {
      when: 'Across the day',
      duration: 'The Full Energetic Audit',
      steps: [
        'Sound: Walk through your space. Note every sound source. — AC, fridge, distant traffic, electronic hum. Note what you\'ve stopped hearing.',
        'Light: Note the light architecture. — Where is harsh light? Where is warm? Where does sunlight enter?',
        'Visual pressure: Note where the eye lands most often. — What is in those spots? Does it serve you?',
        'Emotional pressure: Note where in the home you feel constricted. — A particular hallway, a corner, a chair. Note it.',
        'Action: Choose ONE item to address in Week 2. — Not today. Just identify it.'
      ],
      directive: 'The audit is the seal. You have built awareness of the field this week. Today you note what remains to be tended.'
    }
  },
  'living-frame': {
    1: {
      when: 'Mid-morning (between 7:30 and 9:30am)',
      duration: '20 minutes',
      steps: [
        '00:00 – 02:00 Toe activation. — Standing barefoot. Spread the toes. Anchor the big toe. Lift the arches gently. Repeat 10 times each foot.',
        '02:00 – 04:00 Spinal waves. — Standing. Slow undulation from tailbone to crown. Breath synchronized. 20 repetitions.',
        '04:00 – 06:00 Hip circles. — Standing, hands on hips. 10 slow circles each direction. Full circumference.',
        '06:00 – 11:00 Tai Chi weight shifts. — Wide stance. Heel-to-toe transfers. Slow, controlled. Five minutes.',
        '11:00 – 13:00 Cat-Cow. — On hands and knees. Inhale arch, exhale round. 12 repetitions.',
        '13:00 – 16:00 Deep squat hold ×3. — Sit into a deep squat. Hold 60 seconds. Stand. Repeat 3 times.',
        '16:00 – 19:00 Shoulder circles + thoracic rotation. — Arms out wide. 10 forward, 10 back. Then seated rotation: 10 each direction.',
        '19:00 – end Five minutes of nasal walking. — Continue into Chamber 05 — the morning meal.'
      ],
      directive: 'Move every joint through its full range today. The minimum dose. Tomorrow we extend. This week is for waking the body, not exhausting it.'
    },
    2: {
      when: 'Mid-morning',
      duration: '22 minutes',
      steps: [
        '00:00 – 04:00 Foot-to-floor activation drills. — Barefoot. Roll through the foot — heel, outer edge, ball, toes. Then reverse. 30 reps each foot.',
        '04:00 – 08:00 Shoulder CARs (Controlled Articular Rotations). — Stand. Slowly rotate one arm in the largest circle the shoulder allows. 5 each direction, each side.',
        '08:00 – 12:00 Breath into the ribs. — Lying on back, knees bent. Hands on the side ribs. Inhale, expand sideways into the hands. 20 breaths.',
        '12:00 – 16:00 Spinal waves. — Same as Day 1. 20 reps.',
        '16:00 – 22:00 Walking mobility — 6 minutes. — Slow, deliberate steps. Each step articulating heel-to-toe.'
      ],
      directive: 'Add the foot-to-floor drills to your daily set. They live with you now.'
    },
    3: {
      when: 'Mid-morning',
      duration: '25 minutes',
      steps: [
        '00:00 – 03:00 Standard warm-up — toes, spine, hips. — Same as Days 1–2.',
        '03:00 – 13:00 Fascial rolling — 10 minutes. — Three regions: calves (3 min), glutes (4 min), feet (3 min). Use a ball or roller. Slow pressure. Breath through the points that resist.',
        '13:00 – 18:00 Tai Chi weight shifts — 5 min. — Same as Day 1.',
        '18:00 – 22:00 Cat-Cow + supine twist — 4 min. — End on the floor, relaxed.',
        '22:00 – 25:00 Stillness — 3 minutes. — Lying down. Breath natural. Notice what the body is doing without instruction.'
      ],
      directive: 'Fascial rolling is uncomfortable on Day 3. It will not be on Day 13. Trust the gradient.'
    },
    4: {
      when: 'Mid-morning',
      duration: '25 minutes',
      steps: [
        '00:00 – 03:00 Standard warm-up. — Toes, spine, hips.',
        '03:00 – 09:00 Controlled deep squat holds. — Sit into deep squat. Hold 90 seconds. Stand. Walk for 30 sec. Repeat 4 times.',
        '09:00 – 24:00 Walking mobility — 15 minutes. — Outside if possible. Each step articulated. Nasal breathing only.',
        '24:00 – 25:00 Standing stillness — 1 minute. — Eyes closed. Feel the body breathe itself.'
      ],
      directive: 'The deep squat is the position the body has lost to chairs. Today we return some of it. Discomfort in the squat is normal; pain is not.'
    },
    5: {
      when: 'Mid-morning',
      duration: '25 minutes',
      steps: [
        '00:00 – 03:00 Warm-up.',
        '03:00 – 10:00 Rotational thoracic work — 7 minutes. — Seated or kneeling. Twist slowly to each side. Hands behind head, then arms extended. 12 reps each side.',
        '10:00 – 14:00 Hanging stretch — 20 sec intervals. — If you have a bar: hang from it, 20 seconds, rest 20 seconds, repeat 6 times. If no bar, use a doorway frame or skip.',
        '14:00 – 20:00 Tai Chi flow — 6 min. — Cloud Hands or weight shifts.',
        '20:00 – 25:00 Floor stillness — 5 min. — Lying down. Body scan from feet to crown.'
      ],
      directive: 'Rotational work today. The body wants to twist; modern life has stolen that from you. Restore it slowly.'
    },
    6: {
      when: 'Mid-morning or afternoon',
      duration: '30 minutes',
      steps: [
        'Full-chain flow: 20 minutes of integrated movement. — Combine: spinal waves, hip circles, Tai Chi weight shifts, deep squats, shoulder reach, foot articulation. One slow flowing sequence.',
        'Multi-planar stepping: 10 minutes. — Step forward, back, sideways, diagonal — each direction articulated. Mobility while moving in space.'
      ],
      directive: 'Day 6 is full-chain integration. Yesterday\'s work, the day before\'s work, the first day\'s work — all in one flow. The body now connects what was previously separate.'
    },
    7: {
      when: 'Whenever the body asks',
      duration: 'Restore day — mobility only',
      steps: [
        'Mobility only: No intensity. No strength work. No effort. — Long stretches. Tai Chi flow. Walking. Whatever the body wants.',
        'Long stretches: Hold each position for at least 60 seconds. — Forward fold, hip openers, supine twists, child\'s pose, legs up the wall.',
        'Listen: The body will tell you what it wants. — Today, listen more than instruct.'
      ],
      directive: 'Sunday is restore day. The body has worked. Today it integrates.'
    }
  },
  'the-plate': {
    1: {
      when: 'Throughout the day',
      duration: 'Three meals + hydration windows',
      steps: [
        '06:42 (rising) Warm lemon water. — 8 oz warm water + juice of half a lemon + pinch of mineral salt. Drink slowly, standing or seated. NOT in bed.',
        '07:30 (breakfast) Protein + cooked vegetable + fat. — Option: 3 eggs, sautéed spinach, half an avocado, drizzle of olive oil. No bread. No sugar. No cold food.',
        '10:30 (only if hungry) Mid-morning support. — A handful of pumpkin seeds OR a boiled egg OR cucumber slices with mineral salt.',
        '13:00 (lunch — largest meal) The performance plate. — Protein (salmon or lamb), two cooked vegetables (one green, one root), a smart carb (sweet potato or quinoa), olive oil. Eat in silence or near silence.',
        '16:00 (afternoon reset) Cortisol-aware snack. — Green tea + walnuts OR an apple with almond butter OR a square of dark cacao.',
        '18:30 (dinner — small) Light, digestive. — Soup OR lentil stew OR bone broth with soft vegetables. Eaten before 7:30pm. The body needs four hours before sleep.',
        '20:00 (night tea) Digestive close. — Chamomile, peppermint, ginger, fennel, or tulsi. Slowly. While the room dims.'
      ],
      directive: 'Today\'s only rule: no screens during ANY meal. 10 breaths before the first bite. Slow chewing. Stop when satisfied, not stuffed.'
    },
    2: {
      when: 'Throughout the day',
      duration: 'Same architecture as Day 1, refined',
      steps: [
        '06:50 Warm lemon water + pinch of mineral salt. — Same as Day 1. Hydrate before coffee. Today: NO coffee until AFTER breakfast.',
        '07:45 Breakfast — protein + cooked vegetable + fat. — Today add a cooked vegetable variety. Yesterday spinach — today try zucchini or asparagus or kale.',
        '13:00 Lunch — same architecture. — Hydrate 20 minutes BEFORE eating, not during the meal.',
        '18:30 Dinner — lighter than Day 1. — Soup OR bone broth + cooked vegetables. Practice the \'small dinner\' rule.',
        '20:00 Night tea. — Choose differently from yesterday. Build the rotation.'
      ],
      directive: 'Today\'s rule: hydrate 20 minutes before each meal. Not during. The stomach\'s acid needs to be undiluted.'
    },
    3: {
      when: 'Throughout the day',
      duration: 'Rule of the day: fruit alone',
      steps: [
        'Morning hydration: Warm liquid first. No exception.',
        'Breakfast: Same architecture — protein + vegetable + fat.',
        'Rule of the day: Fruit eaten ALONE. Never with a meal. — If you want fruit, eat it on its own, 30 minutes before or after other food. Fruit ferments behind heavier food.',
        'Lunch: Same performance plate.',
        'Afternoon: If snacking — only between meals. Not after dinner. — Today: NO snacking after dinner. Whatever your evening craving is, observe it and let it pass.',
        'Dinner: Light, before 7:30pm.'
      ],
      directive: 'The \'fruit alone\' rule and the \'no snacking after dinner\' rule are the two food disciplines of Day 3.'
    },
    4: {
      when: 'Throughout the day',
      duration: 'Rule of the day: midday is the largest meal',
      steps: [
        'Morning hydration: Same.',
        'Breakfast: Smaller than usual today. — Eggs + one cooked vegetable. No avocado, no extras. Save the appetite for lunch.',
        'Lunch (13:00): The largest, most complete meal of the day. — Protein, two vegetables, smart carb, fat. Slow chewing — count 20 chews per bite for one full meal.',
        'Afternoon: Light reset only. — Green tea, walnuts, or fennel tea.',
        'Dinner (18:30): Small. Soup or stew.'
      ],
      directive: 'Today: count 20 chews per bite for at least one meal. The body cannot register satiety if the mouth doesn\'t do its share of the work.'
    },
    5: {
      when: 'Throughout the day',
      duration: 'Rule of the day: remove inflammatory foods',
      steps: [
        'Today\'s removal: No fried food. — Anywhere. Any meal.',
        'Today\'s removal: No soda or sugary drinks.',
        'Today\'s removal: Limit dairy — none at all today if possible. — If you take dairy in coffee, try black or with oat/almond instead. One day.',
        'Otherwise: Same architecture as Days 1–4.'
      ],
      directive: 'Three removals today. Just for one day. Notice what changes. The body often tells you what it has been working against.'
    },
    6: {
      when: 'Throughout the day',
      duration: 'Rule of the day: no screens at meals',
      steps: [
        'Hydration: Same. Warm liquid first.',
        'Breakfast: Eat without screens. 10 breaths before the first bite.',
        'Lunch: Same — fully present. No phone. No reading. Just eating.',
        'Dinner: Same.',
        'Observation: How does food taste different when you don\'t divide attention? — Note this in The Signature tonight.'
      ],
      directive: 'The 10-breath rule today: before EVERY meal, take 10 slow breaths. Then begin. The body cannot digest what the mind has not arrived for.'
    },
    7: {
      when: 'Throughout the day',
      duration: 'Rule of the day: observe digestion',
      steps: [
        'All meals: Standard architecture.',
        'After each meal: Note your energy 30 minutes later. — Was the meal nourishing? Did it create heaviness? Did it create clarity?',
        'Track: Record energy after meals in The Signature. — This becomes baseline data for Week 2.'
      ],
      directive: 'Today is observation. After each meal, ask: how do I feel? The body teaches you what to eat next week.'
    }
  },
  'sleep-cocoon': {
    1: {
      when: 'Beginning at 9:00pm',
      duration: '60-minute descent',
      steps: [
        '-60 min (21:00) Lights down. Phone outside the bedroom. — Warm tea (already underway from Chamber 05). Dim amber lamps only.',
        '-45 min (21:15) Legs up the wall. — 5 minutes. Slow nasal breathing. The day drains.',
        '-30 min (21:30) Theta audio begins. — 6 Hz binaural at low volume. Continue lying or seated. Eyes closed.',
        '-15 min (21:45) Body scan in bed. — Move attention from feet to crown. 12 minutes. Let each region soften.',
        'Sleep (22:00) Delta frequencies. Dark. Cool. Nasal breathing only. — The last conscious thought: a long exhale.'
      ],
      directive: 'Phone is OUT of the room tonight. Not face down. Not on do-not-disturb. Out. This is non-negotiable for Week 1.'
    },
    2: {
      when: 'Beginning 9:00pm',
      duration: '60-minute descent',
      steps: [
        '-60 min Same descent as Day 1. — Tea, dim lights, phone out.',
        '-45 min Legs up the wall — 5 minutes. — Add a body scan audio (12 min) during this position if you have one.',
        '-30 min Theta begins. — Same.',
        '-15 min Body scan in bed. — Continue from feet upward.',
        'Sleep Delta. Dark. Nasal only.'
      ],
      directive: 'Phone outside the room — same rule as Day 1. Add: no work conversations after 8pm.'
    },
    3: {
      when: 'Beginning 9:00pm',
      duration: '60-minute descent',
      steps: [
        '-60 min Standard descent begins.',
        'Add tonight: Magnesium glycinate — 200–400 mg. — If you\'re not already supplementing. With warm water before the descent begins.',
        'Cool room: 65–68°F. — If not already set, set it tonight.',
        'Rest of descent: Same as Days 1–2.'
      ],
      directive: 'Magnesium tonight. Cool room. The body falls more easily in a cold dark room than a warm bright one.'
    },
    4: {
      when: 'Beginning 9:00pm',
      duration: '60-minute descent',
      steps: [
        '-90 min (20:30) No stimulation after 8:30pm. — No work, no news, no intense conversation, no scrolling.',
        '-60 min Standard descent begins.',
        'In bed: Slow nasal breathing. — Once lying down, count breaths. Each inhale-exhale cycle is one count. Aim for 30 cycles before the mind drifts.'
      ],
      directive: 'The \'no stimulation after 8:30\' rule is the practice of Day 4. Whatever is unfinished can be unfinished. The night is for descent.'
    },
    5: {
      when: 'Beginning 9:00pm',
      duration: '60-minute descent + Yoga Nidra',
      steps: [
        '-60 min Standard descent.',
        '-45 min Yoga Nidra session — 25 minutes. — Find a recorded Yoga Nidra (Shree can send you one, or use a trusted source). Lie on your back, eyes closed, follow the voice. Do not try to fall asleep; the practice is the rest.',
        'After Nidra: Continue descent. — Body scan, slow breath, into sleep.',
        'Wake without alarm: Tomorrow, if possible. — Don\'t set one for Saturday morning. Trust the body.'
      ],
      directive: 'Yoga Nidra is not sleep — it is conscious rest. 25 minutes of Nidra is metabolically equivalent to 2 hours of sleep. Use it tonight.'
    },
    6: {
      when: 'Beginning 9:00pm',
      duration: '60-minute descent — same',
      steps: [
        'Sleep same time: 9:30–10:00pm to sleep. — Same time as last night. Consistency anchors the circadian rhythm.',
        'No caffeine after 2pm: Today, no caffeine after 2pm. Tomorrow, the same. By Week 2, this is normal.',
        'Rest of descent: Standard.'
      ],
      directive: 'Caffeine has a 6-hour half-life. The body still has half the dose in its system 6 hours after the last sip. Adjust accordingly.'
    },
    7: {
      when: 'Beginning 9:00pm',
      duration: 'Full cocoon night',
      steps: [
        '-60 min Standard descent.',
        'Tonight specifically: Dark, cool, silent, grounded. — All four. No compromise. Phone OUT of the room. Lights at zero. Temperature 65–68°F. Feet on the floor or wool socks for grounding.',
        'Last breath of the week: One long exhale into sleep. — Acknowledge the week. Release it.'
      ],
      directive: 'Tonight is the seal of Week 1. Honor it like a ritual close. The body and the mind have done significant work this week.'
    }
  },
  'breath-atelier': {
    1: {
      when: 'Three windows — morning, midday, evening',
      duration: '8 + 5 + 10 minutes',
      steps: [
        'Morning (07:15) After Mental Clarity, before food. — Box breathing 4-4-4-4 for five rounds. Seated. Eyes closed.',
        'Midday (12:30) Before lunch. — Five minutes of box breath. Restores the nervous system before eating.',
        'Evening (20:30) After dinner, before Sleep Cocoon begins. — Alternate nostril breathing (Nadi Shodhana) — 10 minutes. Use the right thumb on the right nostril, ring finger on the left. Slow, equal in-out cycles.'
      ],
      directive: 'Breath is the only autonomic function you can take by hand. This week, you take it by hand three times a day. By Day 7, your nervous system already knows it.'
    },
    2: {
      when: 'Three windows',
      duration: 'Refined from Day 1',
      steps: [
        'Morning: Extended exhale: inhale 4, exhale 8. — Five rounds. Seated.',
        'Midday: Box breath 4-4-4-4. — Same as Day 1. Before lunch.',
        'Evening: Alternate nostril — 10 minutes. — Same. Builds the autonomic balance.'
      ],
      directive: 'The extended exhale (4-in, 8-out) is the parasympathetic switch. Use it any time today when the system spikes.'
    },
    3: {
      when: 'Three windows',
      duration: 'Adding Nadi Shodhana',
      steps: [
        'Morning: Inhale 4, exhale 8 — 5 rounds. — Continue from Day 2.',
        'Midday: Nadi Shodhana (alternate nostril) — 5 minutes. — Introducing today. Right thumb closes the right nostril; ring finger closes the left. Slow equal cycles.',
        'Evening: Nadi Shodhana — 10 minutes. — Same technique, extended.'
      ],
      directive: 'Nadi Shodhana literally means \'purification of the channels.\' It balances left and right hemispheric activity. By Day 7 it will feel like a tuning fork for the day.'
    },
    4: {
      when: 'Three windows',
      duration: 'Coherent breath introduced',
      steps: [
        'Morning: Inhale 4, exhale 8.',
        'Midday: Coherent breathing — 5 seconds in, 5 seconds out. — Introducing today. 5 minutes. Easy, symmetrical.',
        'Evening: Nadi Shodhana — 10 minutes.'
      ],
      directive: 'Coherent breath (5-5) is the resting frequency of the heart. Use it before decisions. The body chooses better at coherence.'
    },
    5: {
      when: 'Three windows',
      duration: 'Kapalabhati introduced',
      steps: [
        'Morning: Kapalabhati — 30 quick exhalations × 3 rounds. — Seated. Sharp exhales through the nose, passive inhales. 30 in a row, rest 30 sec, repeat 3 times.',
        'Midday: Coherent breath — 5 minutes.',
        'Evening: Nadi Shodhana — 10 minutes.'
      ],
      directive: 'Kapalabhati is \'skull-shining.\' It is ignition — MORNINGS ONLY. Never before bed. The practice clears mental cobwebs in 90 seconds.'
    },
    6: {
      when: 'Three windows',
      duration: 'Speaking practice introduced',
      steps: [
        'Morning: Coherent breath — 5 minutes.',
        'Midday: Box breath — 5 minutes.',
        'Evening: Nadi Shodhana — 10 minutes.',
        'All day: Breath before speaking. — Today\'s discipline: before you respond in any conversation, take one full breath. ONE. Just enough to create the pause.'
      ],
      directive: 'Breath before speaking. The single most transformative practice of Week 1. The pause is the sovereignty.'
    },
    7: {
      when: 'One integrated session today',
      duration: '20 minutes — combined practice',
      steps: [
        '00:00 – 05:00 Box breath 4-4-4-4. — Five rounds, steady.',
        '05:00 – 12:00 Nadi Shodhana — 7 minutes.',
        '12:00 – 17:00 Coherent breath 5-5.',
        '17:00 – 20:00 Silent sitting. — Breath natural. No technique. Just presence.'
      ],
      directive: 'Today\'s session combines what you have learned this week. The breath has become a vocabulary; today you speak in full sentences.'
    }
  },
  'the-signature': {
    1: {
      when: 'Once today, evening preferred',
      duration: '5 minutes',
      steps: [
        'Prompt: Answer in one sentence: \'What drains me most?\' — Be specific. Not \'work\' — what about work. Not \'people\' — which person, what about them.',
        'Format: Write it in the interface, or in a notebook. — If notebook, transfer to the interface tomorrow morning.',
        'After: Sit 30 seconds with the answer. — Do not solve it. Just see it.'
      ],
      directive: 'One sentence. Not a paragraph. The constraint is the practice.'
    },
    2: {
      when: 'Evening',
      duration: '5 minutes',
      steps: [
        'Prompt: Answer in one sentence: \'What restores me fastest?\' — Be specific. Not \'rest\' — what kind. Not \'nature\' — which place, which time of day.',
        'After: Sit with the answer. — If the answer surprises you, note that.'
      ],
      directive: 'By Day 7 you will have written 7 sentences that together describe the architecture of your energy. That is the value of the practice.'
    },
    3: {
      when: 'Evening',
      duration: '5 minutes',
      steps: [
        'Prompt: Write the emotional triggers you observed today. — Specific moments. What set off agitation, anxiety, irritation, or hunger that wasn\'t physical.',
        'Format: List them — three to five entries. — Not analyzed. Not solved. Just listed.'
      ],
      directive: 'Triggers are not the enemy. Triggers are signals from the nervous system about where the boundary is. Today you observe them. Later we will work with them.'
    },
    4: {
      when: 'Today: VOICE NOTE instead of typing',
      duration: '3 minutes',
      steps: [
        'Format: Record a voice note, not text. — Phone voice recorder or the interface, if voice is enabled.',
        'Prompt: Speak for 3 minutes about the past 4 days. — What changed. What was hard. What surprised you. Unscripted.',
        'After: Listen back ONCE. — Notice the tone of your voice. Notice where it tightens. Notice where it opens. Don\'t analyze.'
      ],
      directive: 'The voice carries information the text cannot. Today we begin to use both.'
    },
    5: {
      when: 'Evening',
      duration: '5 minutes',
      steps: [
        'Prompt: Answer in one sentence: \'What environment strengthens me?\' — Specific. Not \'home\' — which room. Not \'nature\' — which kind, which time.',
        'After: Look at the answer. — Could you arrange more of your week around that environment? The question is rhetorical for today. Tomorrow we look at it again.'
      ],
      directive: 'By Day 5 you have written five short sentences about your own architecture: what drains you, what restores you, your triggers, the four-day arc, your strengthening environment. Five sentences. Already a portrait.'
    },
    6: {
      when: 'Evening',
      duration: '10 minutes — review',
      steps: [
        'Open: Read back all 5 previous entries. — Day 1: what drains you. Day 2: what restores you. Day 3: triggers. Day 4 voice note: review of the arc. Day 5: strengthening environment.',
        'Notice: What pattern do you see across the week? — Don\'t write a thesis. Write 2–3 sentences of observation.',
        'Tag: If using the interface, observe the AI tags applied to your entries. Do they match what you feel?'
      ],
      directive: 'Day 6 is a review day. The Signature is not just for writing — it is for reading back. The auric ledger reveals patterns the conscious mind cannot.'
    },
    7: {
      when: 'Evening — the seal',
      duration: '20 minutes',
      steps: [
        'Create: Your first \'Personal Operating Notes.\' — Read back the entire week\'s entries. From them, write what you have learned about yourself in 7 days.',
        'Format: 5–10 sentences. Personal directives. — Things like: \'I am more reactive when I have not had silence in the morning.\' \'My body wants warmth before food.\' \'I sleep better when the room is below 68°F.\'',
        'This is the document: That you carry into Week 2. — These are not rules. These are your operating notes — the architecture of you, written by you, after one week of attention.'
      ],
      directive: 'The Personal Operating Notes are the deliverable of Week 1. Everything else was preparation for this. Take 20 minutes. Write what you have learned.'
    }
  }
};

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





