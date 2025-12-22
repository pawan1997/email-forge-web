import { NextRequest, NextResponse } from 'next/server';
import { fetchTopmateProfile } from '../../lib/topmate';
import { PosterConfig, PosterSize, POSTER_SIZE_DIMENSIONS, GeneratedPoster } from '../../types/poster';

// OpenRouter API key from environment variable
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

const POSTER_SYSTEM_PROMPT = `You are a creative coder who generates stunning HTML/CSS posters. You have FULL access to modern web technologies - use them creatively.

## YOUR MISSION

Create a poster that serves the USER'S PROMPT. The prompt is king. Profile data (name, photo, bio) is ONLY used if the prompt implies it should be.

Examples:
- "fiery women empowerment poster" → Abstract, no profile data needed
- "promote my upcoming cohort" → Find relevant service, use minimally
- "personal brand poster" → Use name, photo strategically
- "announcement for mentorship sessions" → Focus on the offering, not the person

## CREATIVE TOOLKIT

You have access to EVERYTHING modern HTML/CSS offers:

### SVG PATTERNS & BACKGROUNDS
Use inline SVG for patterns. Examples:

\`\`\`css
/* Dot grid pattern */
background-image: radial-gradient(circle, #333 1px, transparent 1px);
background-size: 20px 20px;

/* Diagonal lines */
background: repeating-linear-gradient(
  45deg,
  transparent,
  transparent 10px,
  rgba(255,255,255,0.03) 10px,
  rgba(255,255,255,0.03) 20px
);

/* Noise texture via SVG filter */
<svg width="0" height="0">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" />
    <feColorMatrix type="saturate" values="0"/>
  </filter>
</svg>
<div style="filter: url(#noise); opacity: 0.05; position: absolute; inset: 0;"></div>
\`\`\`

### GRADIENT TECHNIQUES
\`\`\`css
/* Mesh gradient feel */
background:
  radial-gradient(ellipse at 20% 80%, rgba(255,100,100,0.3) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 20%, rgba(100,100,255,0.3) 0%, transparent 50%),
  #0a0a0a;

/* Text gradient */
background: linear-gradient(135deg, #ff6b6b, #feca57);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
\`\`\`

### TYPOGRAPHY EFFECTS
\`\`\`css
/* Glow effect */
text-shadow: 0 0 40px rgba(255,100,100,0.5), 0 0 80px rgba(255,100,100,0.3);

/* Outline text */
-webkit-text-stroke: 2px white;
color: transparent;

/* Stacked/layered text */
position: relative;
&::before { content: attr(data-text); position: absolute; /* offset and color */ }
\`\`\`

### GEOMETRIC SHAPES (inline SVG)
\`\`\`html
<svg viewBox="0 0 100 100" style="position: absolute; ...">
  <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-width="0.5"/>
</svg>
\`\`\`

### GLASSMORPHISM
\`\`\`css
background: rgba(255,255,255,0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255,255,255,0.1);
\`\`\`

### ICONS (use Iconify CDN)
\`\`\`html
<img src="https://api.iconify.design/mdi/fire.svg?color=%23ff6b6b" width="24" height="24" />
<img src="https://api.iconify.design/ph/lightning-fill.svg?color=%23feca57" />
<!-- Available icon sets: mdi, ph, ri, lucide, tabler, heroicons -->
\`\`\`

## POSTER LAYOUTS

### LAYOUT 1: HERO STATEMENT
- 70% giant text (the message)
- 30% supporting elements
- Best for: announcements, quotes, bold claims

### LAYOUT 2: SPLIT PANEL
- 50/50 or 60/40 split
- One side: visual/pattern/image
- Other side: text content
- Best for: event announcements, promotions

### LAYOUT 3: CENTERED FOCAL
- Central element dominates
- Surrounding space is intentional
- Best for: personal brand, minimalist

### LAYOUT 4: GRID/TILES
- Information in organized blocks
- Each block serves one purpose
- Best for: informational, multi-point

### LAYOUT 5: FULL BLEED VISUAL
- Background IS the design
- Text overlaid minimally
- Best for: mood, aesthetic, abstract

## COLOR SYSTEMS

### DARK MODE (premium feel)
- Background: #0a0a0a, #111, #1a1a2e
- Text: #fff, #f0f0f0
- Accent: ONE vibrant color (coral, cyan, lime, violet)

### LIGHT MODE (clean, modern)
- Background: #fafafa, #fff, cream
- Text: #111, #1a1a1a
- Accent: Deep saturated color

### VIBRANT (energetic)
- Bold background color
- Contrasting text
- Works for: events, announcements

## TYPOGRAPHY

Pick ONE font. Use weight for hierarchy.

\`\`\`html
<!-- Impact/Display -->
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap">

<!-- Modern Sans -->
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;800&display=swap">

<!-- Elegant Serif -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&display=swap">
\`\`\`

Font sizes for 1080px poster:
- Hero text: 80-200px
- Secondary: 24-40px
- Tertiary: 14-18px

## HTML STRUCTURE

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=FONT&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: [WIDTH]px;
      height: [HEIGHT]px;
      overflow: hidden;
    }
    .poster {
      width: [WIDTH]px;
      height: [HEIGHT]px;
      position: relative;
      overflow: hidden;
      /* background, font-family, etc */
    }
  </style>
</head>
<body>
  <div class="poster">
    <!-- Your creative design -->
  </div>
</body>
</html>
\`\`\`

## RULES

1. **PROMPT IS KING** - Design serves the user's vision, not a template
2. **LESS CONTENT** - A poster is not a webpage. 3-4 text elements max.
3. **NO UNSOLICITED CTAs** - Never add "Book now", "Connect", "Schedule" buttons/text unless explicitly asked
4. **SUBTLE BRANDING ONLY** - Creator name/photo goes in corner as small signature, like a watermark
5. **BE CREATIVE** - Use SVG, patterns, gradients, effects. This isn't email.
6. **EXACT DIMENSIONS** - Must render at specified pixel size
7. **NO AI SLOP** - No generic cards, no purple gradients, no cookie-cutter layouts

## OUTPUT

Return ONLY the HTML. No explanation. Start with <!DOCTYPE html>.`;

// Creative Director prompt - analyzes content and decides best visual approach
const CREATIVE_DIRECTOR_SYSTEM_PROMPT = `You are a world-class creative director with expertise in graphic design, typography, data visualization, and visual storytelling. You analyze content and decide the BEST visual approach - not generic, not AI-slop, but something a talented human designer would create.

## YOUR ROLE
Analyze the content and return precise creative direction that will guide another AI to create a stunning poster/carousel.

## CONTENT-AWARE DESIGN DECISIONS
Based on content type, recommend specific treatments:

### DATA/NUMBERS/STATISTICS
- Use charts: bar charts (comparison), line charts (trends), pie/donut (proportions)
- Large number typography with supporting context
- Visual data callouts, progress bars, stat cards
- Example: "47% increase" → big bold "47%" with upward arrow, subtle graph background

### BEFORE/AFTER or COMPARISON
- Split panel layouts (50/50 or 60/40)
- Left/right or top/bottom comparison
- Visual contrast (dark vs light, old vs new)
- Connecting elements showing transformation

### LISTS/STEPS/TIPS
- Numbered visual hierarchy (1, 2, 3 with icons)
- Timeline or flowchart layouts
- Card-based grid systems
- Icon + text pairings

### QUOTES/THOUGHTS/OPINIONS
- Typography-dominant design
- Large quotation marks as design element
- Minimal supporting elements
- Author attribution styling

### EVENTS/ANNOUNCEMENTS
- Date as hero element (large, styled)
- Urgency indicators (countdown feel)
- Clear information hierarchy (what, when, where)

### EDUCATIONAL/INFORMATIONAL
- Infographic elements
- Icon systems
- Visual metaphors
- Clear sections and flow

### PROMOTIONAL/MARKETING
- Bold color schemes
- Strong CTAs (if requested)
- Brand-focused layouts
- High visual impact

## OUTPUT FORMAT
Return a JSON object with your creative direction:
{
  "contentType": "data|comparison|list|quote|event|educational|promotional|other",
  "concept": "One-sentence visual concept description",
  "layout": "Specific layout recommendation with positioning details",
  "colorScheme": {
    "background": "#hex or gradient description",
    "primary": "#hex for main text/elements",
    "accent": "#hex for highlights",
    "mood": "dark/light/vibrant"
  },
  "typography": {
    "headlineFont": "Specific Google Font name",
    "headlineSize": "Size in px for 1080px canvas",
    "bodyFont": "Font for secondary text",
    "style": "bold/elegant/playful/minimal"
  },
  "specialElements": ["List of specific visual elements to include"],
  "cssEffects": ["Any CSS effects: gradients, shadows, patterns, etc."],
  "avoidPatterns": ["Things NOT to do for this content"]
}

Be SPECIFIC. Don't say "use nice colors" - say "use #1a1a2e background with #feca57 accent for a premium dark feel".`;

// 3 poster generation strategies
// A & B: Reference-based (two unique interpretations from the same reference)
// C: AI Creative Director decides the best approach based on content type
interface PosterStrategy {
  name: string;
  type: 'reference' | 'creative';
  directive: string;
}

const POSTER_STRATEGIES: PosterStrategy[] = [
  {
    name: 'reference-faithful',
    type: 'reference',
    directive: `REFERENCE IMAGE ANALYSIS - FAITHFUL INTERPRETATION

Study the reference image carefully and create a poster that CAPTURES ITS ESSENCE:

1. COLOR PALETTE: Extract and use the exact color palette from the reference
2. TYPOGRAPHY STYLE: Match the font weight, style, and hierarchy shown
3. LAYOUT STRUCTURE: Follow similar composition and spacing
4. VISUAL MOOD: Recreate the same emotional feel (premium, bold, minimal, etc.)
5. DESIGN ELEMENTS: Use similar patterns, textures, or effects if present

ADAPTATION: Apply the reference's visual language to THIS specific content.
The poster should feel like it could be from the same design series.

BRANDING: Creator photo (circular, 40-50px) + name in bottom corner. REQUIRED.`,
  },
  {
    name: 'reference-remix',
    type: 'reference',
    directive: `REFERENCE IMAGE ANALYSIS - CREATIVE REMIX

Study the reference image and create a FRESH INTERPRETATION:

1. EXTRACT 2-3 KEY ELEMENTS: Pick standout aspects (a color, a font treatment, a layout concept)
2. REMIX CREATIVELY: Use these elements as inspiration, not a template
3. ADD YOUR TWIST: Introduce one new design element that complements
4. DIFFERENT COMPOSITION: Try an alternative layout while keeping the vibe
5. EVOLVE THE STYLE: Make it feel like a creative evolution, not a copy

The result should be recognizably inspired by the reference but distinctly different.

BRANDING: Creator photo (circular, 40-50px) + name in bottom corner. REQUIRED.`,
  },
  {
    name: 'ai-creative-director',
    type: 'creative',
    directive: '', // Dynamically filled by the Creative Director orchestrator
  },
];

// System prompt for carousel slide generation
const CAROUSEL_SYSTEM_PROMPT = `You create individual slides for Instagram/LinkedIn carousels. Each slide is a standalone HTML poster that's part of a cohesive series.

## CAROUSEL PRINCIPLES
1. Each slide should work alone BUT feel part of a series
2. Consistent visual language: same fonts, colors, style across all slides
3. Content should flow logically (intro → points → conclusion)
4. Slides should have visual continuity (matching backgrounds, consistent branding placement)

## SLIDE STRUCTURE FOR CAROUSELS
- Slide 1: Hook/Title - grab attention, introduce topic
- Middle slides: Key points, one idea per slide, easy to read
- Last slide: Summary/CTA or memorable conclusion

## RULES
1. Each slide must be exactly the specified dimensions
2. One main idea per slide - don't overcrowd
3. Large, readable text (this will be viewed on mobile)
4. Keep branding consistent but subtle on ALL slides
5. Use the same color palette throughout
6. Output ONLY HTML starting with <!DOCTYPE html>

Return a JSON array of HTML strings, one per slide.`;

// 3 carousel strategies matching poster strategies
// A & B: Reference-based (two unique interpretations)
// C: AI Creative Director decides the best approach
interface CarouselStrategy {
  name: string;
  type: 'reference' | 'creative';
  directive: string;
}

const CAROUSEL_STRATEGIES: CarouselStrategy[] = [
  {
    name: 'reference-faithful',
    type: 'reference',
    directive: `REFERENCE IMAGE ANALYSIS - FAITHFUL INTERPRETATION

Study the reference image and create carousel slides that CAPTURE ITS ESSENCE:

1. COLOR PALETTE: Extract and use the exact color palette from the reference
2. TYPOGRAPHY STYLE: Match the font weight, style, and hierarchy shown
3. LAYOUT STRUCTURE: Follow similar composition and spacing
4. VISUAL MOOD: Recreate the same emotional feel across all slides
5. CONSISTENCY: All slides should feel like a cohesive series

BRANDING: Creator photo (circular, 40-50px) + name in bottom corner on EVERY slide.`,
  },
  {
    name: 'reference-remix',
    type: 'reference',
    directive: `REFERENCE IMAGE ANALYSIS - CREATIVE REMIX

Study the reference image and create a FRESH carousel series:

1. EXTRACT KEY ELEMENTS: Pick 2-3 standout aspects from the reference
2. REMIX CREATIVELY: Use these as inspiration, not a template
3. ADD YOUR TWIST: Introduce complementary design elements
4. SERIES COHESION: All slides should feel connected but fresh

BRANDING: Creator photo (circular, 40-50px) + name in bottom corner on EVERY slide.`,
  },
  {
    name: 'ai-creative-director',
    type: 'creative',
    directive: '', // Dynamically filled by the Creative Director orchestrator
  },
];

// System prompt for generating a single carousel first slide (preview)
const CAROUSEL_FIRST_SLIDE_SYSTEM_PROMPT = `You create the FIRST SLIDE (hook/title slide) for an Instagram/LinkedIn carousel.

## YOUR TASK
Create ONE slide that:
1. Grabs attention immediately
2. Introduces the topic compellingly
3. Sets the visual style for the entire carousel

## DESIGN RULES
1. Exact dimensions as specified - content must stay within frame
2. One clear hook/title - easy to read on mobile (minimum 32px font)
3. 50px minimum padding from all edges - NO text touching edges
4. Maximum 3-4 text elements on the slide

## BRANDING (REQUIRED)
You MUST include creator branding on EVERY slide:
- Circular profile photo (40-50px diameter)
- Creator name (14-18px)
- Placement: bottom-left or bottom-right corner
- This is NOT optional - missing branding is a failure

## OUTPUT
- Output ONLY HTML starting with <!DOCTYPE html>
- NO explanation, just the HTML`;

// System prompt for single poster generation - matches carousel aesthetic
const SINGLE_POSTER_SYSTEM_PROMPT = `You create a stunning single-image poster for Instagram/LinkedIn.

## YOUR TASK
Create ONE poster that:
1. Communicates the message clearly and beautifully
2. Has strong visual impact
3. Works as a standalone piece

## DESIGN RULES
1. Exact dimensions as specified - content must stay within frame
2. Clear headline - easy to read on mobile (minimum 32px font)
3. 50px minimum padding from all edges - NO text touching edges
4. Maximum 4-5 text elements on the poster

## BRANDING (REQUIRED)
You MUST include creator branding:
- Circular profile photo (40-50px diameter)
- Creator name (14-18px)
- Placement: bottom-left or bottom-right corner
- This is NOT optional - missing branding is a failure

## OUTPUT
- Output ONLY HTML starting with <!DOCTYPE html>
- NO explanation, just the HTML`;

// System prompt for completing remaining carousel slides
const CAROUSEL_COMPLETION_SYSTEM_PROMPT = `You complete a carousel by generating the remaining slides to match an existing first slide.

## YOUR TASK
Given a first slide and topic, create the remaining slides that:
1. Match the EXACT visual style of slide 1 (fonts, colors, backgrounds, effects)
2. Continue the content logically
3. End with a strong conclusion

## SLIDE STRUCTURE
- Given: Slide 1 (hook/intro)
- Generate: Slides 2 to N
  - Middle slides: Key points, one idea per slide
  - Last slide: Conclusion/takeaway

## RULES
1. EXACT same visual style as slide 1
2. Same fonts, colors, backgrounds
3. Same branding placement
4. One idea per slide - mobile readable
5. Return JSON array of HTML strings (slides 2 to N only)`;

function buildFirstSlidePrompt(
  prompt: string,
  profile: { display_name: string; username: string; bio: string; profile_pic: string },
  dimensions: { width: number; height: number },
  totalSlides: number,
  strategy: CarouselStrategy,
  hasReferenceImage: boolean
): string {
  let text = `Create the FIRST SLIDE of a ${totalSlides}-slide carousel. Dimensions: ${dimensions.width}x${dimensions.height}px.

TOPIC/CONTENT:
"${prompt}"

CREATOR BRANDING (subtle signature):
- Name: ${profile.display_name}
- Photo URL: ${profile.profile_pic}
- Handle: @${profile.username}

STYLE DIRECTION: ${strategy.directive}

This is slide 1 of ${totalSlides}. Make it a strong hook that grabs attention.`;

  if (hasReferenceImage && strategy.type === 'reference') {
    text += `\n\nREFERENCE IMAGE PROVIDED: Use it for visual style inspiration (colors, typography, layout).`;
  } else if (strategy.type === 'creative') {
    text += `\n\nNO reference image for this variant. Follow the creative direction above precisely.`;
  }

  return text;
}

// Build prompt for single poster - mirrors carousel first slide prompt structure
function buildSinglePosterPrompt(
  prompt: string,
  profile: { display_name: string; username: string; profile_pic: string },
  dimensions: { width: number; height: number },
  strategy: PosterStrategy,
  hasReferenceImage: boolean
): string {
  let text = `Create a single poster. Dimensions: ${dimensions.width}x${dimensions.height}px.

TOPIC/CONTENT:
"${prompt}"

CREATOR BRANDING (subtle signature):
- Name: ${profile.display_name}
- Photo URL: ${profile.profile_pic}
- Handle: @${profile.username}

STYLE DIRECTION: ${strategy.directive}

Make it visually striking and memorable.`;

  if (hasReferenceImage && strategy.type === 'reference') {
    text += `\n\nREFERENCE IMAGE PROVIDED: Use it for visual style inspiration (colors, typography, layout).`;
  } else if (strategy.type === 'creative') {
    text += `\n\nNO reference image for this variant. Follow the creative direction above precisely.`;
  }

  return text;
}

function buildCarouselCompletionPrompt(
  firstSlideHtml: string,
  prompt: string,
  profile: { display_name: string; username: string; profile_pic: string },
  dimensions: { width: number; height: number },
  totalSlides: number
): string {
  return `FIRST SLIDE HTML (match this style exactly):
\`\`\`html
${firstSlideHtml}
\`\`\`

CAROUSEL TOPIC: "${prompt}"

CREATOR BRANDING (same placement as slide 1):
- Name: ${profile.display_name}
- Photo: ${profile.profile_pic}
- Handle: @${profile.username}

Generate slides 2 through ${totalSlides}. Each slide is ${dimensions.width}x${dimensions.height}px.
- Slides 2-${totalSlides - 1}: Key points/content
- Slide ${totalSlides}: Conclusion

Return a JSON array with ${totalSlides - 1} HTML strings:
["<!DOCTYPE html>...", "<!DOCTYPE html>...", ...]`;
}

function buildCarouselPrompt(
  prompt: string,
  profile: {
    display_name: string;
    username: string;
    bio: string;
    profile_pic: string;
  },
  dimensions: { width: number; height: number },
  slideCount: number,
  hasReferenceImage: boolean
): string {
  let text = `Create a ${slideCount}-slide carousel. Each slide is ${dimensions.width}x${dimensions.height}px.

TOPIC/CONTENT:
"${prompt}"

CREATOR BRANDING (subtle signature on each slide):
- Name: ${profile.display_name}
- Photo URL: ${profile.profile_pic}
- Handle: @${profile.username}

## SLIDE BREAKDOWN:
- Slide 1: Hook/attention-grabber related to the topic
- Slides 2-${slideCount - 1}: Key points, insights, or content (one idea per slide)
- Slide ${slideCount}: Conclusion or takeaway

## REQUIREMENTS:
1. All ${slideCount} slides must share the same visual style (fonts, colors, backgrounds)
2. Creator branding should be consistent and subtle on ALL slides (small corner signature)
3. One clear message per slide - easy to read on mobile
4. NO CTAs unless the prompt asks for them
5. Make it visually striking - use patterns, gradients, typography effects`;

  if (hasReferenceImage) {
    text += `

REFERENCE IMAGE: Use it for visual style inspiration only (colors, typography, layout). Do NOT copy any text or branding from it.`;
  }

  text += `

OUTPUT FORMAT: Return a JSON array with exactly ${slideCount} HTML strings:
["<!DOCTYPE html>...", "<!DOCTYPE html>...", ...]

Each HTML string is a complete standalone page for one slide.`;

  return text;
}

function buildPrompt(
  prompt: string,
  profile: {
    display_name: string;
    username: string;
    bio: string;
    profile_pic: string;
    total_bookings: number;
    average_rating: number;
    services: Array<{ title: string; description: string }>;
  },
  dimensions: { width: number; height: number },
  hasReferenceImage: boolean,
  variationDirective?: string
): string {
  const topServices = profile.services.slice(0, 3).map(s => `- ${s.title}`).join('\n');

  let text = `POSTER DIMENSIONS: ${dimensions.width}px × ${dimensions.height}px

USER'S PROMPT (this is what matters):
"${prompt}"

CREATOR BRANDING (for subtle attribution only):
- Name: ${profile.display_name}
- Photo URL: ${profile.profile_pic}
- Handle: @${profile.username}

CONTEXT DATA (use only if prompt specifically needs it):
- Bio: ${profile.bio}
- Stats: ${profile.total_bookings.toLocaleString()} bookings, ${profile.average_rating}/5 rating
- Services:
${topServices}

## BRANDING RULES:
1. Add creator name/photo as a SUBTLE SIGNATURE - small, tasteful, corner placement like a watermark or artist signature
2. Do NOT add CTAs like "Book now", "Connect", "Schedule a call" unless the prompt explicitly asks for it
3. Do NOT add links (topmate.io/...) unless the prompt asks for it
4. The poster's main focus is the PROMPT MESSAGE, not promoting the creator
5. Think of the branding like a photographer's signature on a photo - present but not the focus

IMPORTANT: The prompt drives the design. Profile data is for subtle branding attribution, not promotion.`;

  if (variationDirective) {
    text += `

STYLE DIRECTION: ${variationDirective}`;
  }

  if (hasReferenceImage) {
    text += `

REFERENCE IMAGE PROVIDED: I've attached a reference image. Use it ONLY as VISUAL STYLE inspiration:
- Color palette and mood
- Typography style (fonts, sizing, weight) - NOT the actual text
- Layout structure and composition
- Visual effects and textures

⚠️ CRITICAL: Do NOT copy any text, brand names, logos, slogans, or specific content from the reference image. The reference is for AESTHETIC DIRECTION only. All text content must come from the user's prompt and profile data above. If the reference shows "Nike" or "Apple" or any brand - IGNORE that completely. You are only learning from HOW it looks, not WHAT it says.`;
  }

  text += `

Generate the HTML poster. Be creative with patterns, gradients, SVG, typography. Output only HTML starting with <!DOCTYPE html>`;

  return text;
}

// OpenRouter API call with vision support
async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  referenceImage?: string,
  maxTokens: number = 12000
): Promise<string> {
  console.log('Calling OpenRouter with model:', model);

  // Build message content
  type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
  const content: ContentPart[] = [];

  // Add image first if provided (for vision models)
  if (referenceImage && referenceImage.startsWith('data:image/')) {
    content.push({
      type: 'image_url',
      image_url: { url: referenceImage }
    });
  }

  // Add text prompt
  content.push({
    type: 'text',
    text: userPrompt
  });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Poster Creator',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content.length === 1 ? userPrompt : content },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter error:', response.status, errorData);

    if (response.status === 401) {
      throw new Error('OpenRouter API key is invalid or expired.');
    }
    if (response.status === 402) {
      throw new Error('OpenRouter account has insufficient credits.');
    }
    if (response.status === 429) {
      throw new Error('OpenRouter rate limit exceeded. Please try again later.');
    }

    throw new Error(errorData.error?.message || `OpenRouter API error (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Creative Director orchestrator - analyzes content and returns design direction
interface CreativeDirection {
  contentType: string;
  concept: string;
  layout: string;
  colorScheme: {
    background: string;
    primary: string;
    accent: string;
    mood: string;
  };
  typography: {
    headlineFont: string;
    headlineSize: string;
    bodyFont: string;
    style: string;
  };
  specialElements: string[];
  cssEffects: string[];
  avoidPatterns: string[];
}

async function getCreativeDirection(
  apiKey: string,
  model: string,
  prompt: string
): Promise<CreativeDirection | null> {
  try {
    console.log('Getting creative direction from AI...');

    const userPrompt = `Analyze this poster/carousel request and provide creative direction:

"${prompt}"

Return ONLY a valid JSON object with your creative direction. No explanation, just JSON.`;

    const response = await callOpenRouter(
      apiKey,
      model,
      CREATIVE_DIRECTOR_SYSTEM_PROMPT,
      userPrompt,
      undefined,
      2000 // Smaller token limit for direction
    );

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const direction = JSON.parse(jsonMatch[0]) as CreativeDirection;
      console.log('Creative direction received:', direction.contentType, direction.concept);
      return direction;
    }

    console.warn('Could not parse creative direction JSON');
    return null;
  } catch (error) {
    console.error('Creative direction failed:', error);
    return null;
  }
}

// Convert CreativeDirection to a detailed prompt directive
function buildCreativeDirective(direction: CreativeDirection): string {
  return `AI CREATIVE DIRECTOR'S VISION

CONTENT TYPE: ${direction.contentType}
CONCEPT: ${direction.concept}

LAYOUT: ${direction.layout}

COLOR SCHEME:
- Background: ${direction.colorScheme.background}
- Primary text/elements: ${direction.colorScheme.primary}
- Accent color: ${direction.colorScheme.accent}
- Mood: ${direction.colorScheme.mood}

TYPOGRAPHY:
- Headline: ${direction.typography.headlineFont} at ${direction.typography.headlineSize}
- Body: ${direction.typography.bodyFont}
- Style: ${direction.typography.style}

SPECIAL ELEMENTS TO INCLUDE:
${direction.specialElements.map(e => `- ${e}`).join('\n')}

CSS EFFECTS TO USE:
${direction.cssEffects.map(e => `- ${e}`).join('\n')}

AVOID THESE PATTERNS:
${direction.avoidPatterns.map(e => `- ${e}`).join('\n')}

BRANDING: Creator photo (circular, 40-50px) + name in bottom corner. REQUIRED.

Execute this creative vision with precision. Make it distinctive and memorable.`;
}

// Fallback directive if Creative Director fails
const FALLBACK_CREATIVE_DIRECTIVE = `SMART CONTENT-AWARE DESIGN

Analyze the content and choose the BEST visual approach:

1. IF DATA/NUMBERS → Use visual data representation (charts, large numbers, progress indicators)
2. IF COMPARISON → Use split layout, before/after design
3. IF LIST/TIPS → Use numbered visual hierarchy, icons
4. IF QUOTE → Typography-focused, minimal design
5. IF EVENT → Bold date treatment, urgency design
6. IF EDUCATIONAL → Infographic style, clear hierarchy

Choose one strong color palette:
- Dark premium: #0a0a0a background, white text, one warm accent
- Light minimal: #fafafa background, dark text, one muted accent
- Bold vibrant: Strong background color with contrasting text

Typography: Pick ONE font family. Use weight for hierarchy.
- Headlines: 60-120px for impact
- Body: 18-24px for readability

BRANDING: Creator photo (circular, 40-50px) + name in bottom corner. REQUIRED.

Make it look like a professional designer created it, not an AI.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, profile: providedProfile, referenceImage } = body as {
      config: PosterConfig;
      profile?: any;
      referenceImage?: string;
    };

    if (!config.topmateUsername) {
      return NextResponse.json({ success: false, error: 'Topmate username is required' }, { status: 400 });
    }

    let profile;
    try {
      profile = providedProfile || await fetchTopmateProfile(config.topmateUsername);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch Topmate profile for "${config.topmateUsername}". Please check the username.`
      }, { status: 404 });
    }

    const dimensions = config.size === 'custom' && config.customDimensions
      ? config.customDimensions
      : POSTER_SIZE_DIMENSIONS[config.size as Exclude<PosterSize, 'custom'>] || POSTER_SIZE_DIMENSIONS['instagram-square'];

    const hasReferenceImage = !!referenceImage;

    // Use OpenRouter with selected model (default to Gemini 3 Pro)
    const apiKey = body.openRouterApiKey || OPENROUTER_API_KEY;
    const selectedModel = body.model || 'pro'; // 'pro' or 'flash'
    const model = selectedModel === 'flash'
      ? 'google/gemini-2.5-flash-preview-05-20'
      : 'google/gemini-2.5-pro-preview-06-05';

    console.log('Using model:', model, '(selected:', selectedModel, ')');

    // Helper to clean HTML response
    const cleanHtml = (html: string): string => {
      html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      if (!html.startsWith('<!DOCTYPE')) {
        const idx = html.indexOf('<!DOCTYPE');
        if (idx !== -1) html = html.substring(idx);
      }
      return html;
    };

    // CAROUSEL MODE - Generate only FIRST SLIDE for each of 3 style variants
    // A & B: Reference-based interpretations
    // C: AI Creative Director decides the best approach
    if (config.mode === 'carousel') {
      const slideCount = config.carouselSlides || 5;

      const profileForCarousel = {
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio,
        profile_pic: profile.profile_pic,
      };

      // Get Creative Director's vision for variant C (runs in parallel with A & B)
      const creativeDirectionPromise = getCreativeDirection(apiKey, model, config.prompt);

      // Prepare strategies with Creative Director's directive for variant C
      const prepareStrategies = async (): Promise<CarouselStrategy[]> => {
        const strategies = [...CAROUSEL_STRATEGIES];
        const direction = await creativeDirectionPromise;

        // Update the ai-creative-director strategy with actual directive
        const creativeIdx = strategies.findIndex(s => s.name === 'ai-creative-director');
        if (creativeIdx !== -1) {
          strategies[creativeIdx] = {
            ...strategies[creativeIdx],
            directive: direction
              ? buildCreativeDirective(direction)
              : FALLBACK_CREATIVE_DIRECTIVE,
          };
        }

        return strategies;
      };

      const strategies = await prepareStrategies();

      // Generate first slide for each strategy in parallel
      const firstSlidePromises = strategies.map(async (strategy, index) => {
        try {
          // For reference-based strategies, use the reference image
          // For creative strategy, don't use reference (let AI decide)
          const useRef = hasReferenceImage && strategy.type === 'reference';

          const promptText = buildFirstSlidePrompt(
            config.prompt,
            profileForCarousel,
            dimensions,
            slideCount,
            strategy,
            hasReferenceImage && strategy.type === 'reference'
          );

          let html = await callOpenRouter(
            apiKey,
            model,
            CAROUSEL_FIRST_SLIDE_SYSTEM_PROMPT,
            promptText,
            useRef ? referenceImage : undefined,
            8000
          );
          html = cleanHtml(html);

          return {
            html,
            dimensions,
            style: config.style,
            topmateProfile: profile,
            generatedAt: new Date().toISOString(),
            slideIndex: 0,
            variantIndex: index,
            strategyName: strategy.name,
          } as GeneratedPoster;
        } catch (err) {
          console.error(`Carousel first slide ${strategy.name} failed:`, err);
          return null;
        }
      });

      const firstSlideResults = await Promise.all(firstSlidePromises);
      const validFirstSlides = firstSlideResults.filter((p): p is GeneratedPoster => p !== null);

      if (validFirstSlides.length === 0) {
        throw new Error('Failed to generate carousel previews');
      }

      // Return only first slides - each variant has just 1 slide for now
      // Frontend will show these as previews, user picks one, then calls complete-carousel
      const carouselPreviews = validFirstSlides.map(slide => [slide]);

      return NextResponse.json({
        success: true,
        carousels: carouselPreviews, // Array of single-slide arrays (previews only)
        mode: 'carousel',
        previewOnly: true, // Flag to indicate these are previews
        variantCount: carouselPreviews.length,
        slideCount: 1, // Only first slide generated
        totalSlides: slideCount, // How many slides will be in complete carousel
      });
    }

    // SINGLE MODE - Generate 3 diverse posters in parallel
    // A & B: Reference-based interpretations
    // C: AI Creative Director decides the best approach
    const profileForPoster = {
      display_name: profile.display_name,
      username: profile.username,
      profile_pic: profile.profile_pic,
    };

    // Get Creative Director's vision for variant C
    const creativeDirectionPromise = getCreativeDirection(apiKey, model, config.prompt);

    // Prepare strategies with Creative Director's directive for variant C
    const prepareStrategies = async (): Promise<PosterStrategy[]> => {
      const strategies = [...POSTER_STRATEGIES];
      const direction = await creativeDirectionPromise;

      // Update the ai-creative-director strategy with actual directive
      const creativeIdx = strategies.findIndex(s => s.name === 'ai-creative-director');
      if (creativeIdx !== -1) {
        strategies[creativeIdx] = {
          ...strategies[creativeIdx],
          directive: direction
            ? buildCreativeDirective(direction)
            : FALLBACK_CREATIVE_DIRECTIVE,
        };
      }

      return strategies;
    };

    const strategies = await prepareStrategies();

    const posterPromises = strategies.map(async (strategy, index) => {
      try {
        // For reference-based strategies, use the reference image
        // For creative strategy, don't use reference (let AI decide)
        const useRef = hasReferenceImage && strategy.type === 'reference';

        // Build prompt using same structure as carousel
        const promptText = buildSinglePosterPrompt(
          config.prompt,
          profileForPoster,
          dimensions,
          strategy,
          hasReferenceImage && strategy.type === 'reference'
        );

        let html = await callOpenRouter(
          apiKey,
          model,
          SINGLE_POSTER_SYSTEM_PROMPT,
          promptText,
          useRef ? referenceImage : undefined
        );
        html = cleanHtml(html);

        return {
          html,
          dimensions,
          style: config.style,
          topmateProfile: profile,
          generatedAt: new Date().toISOString(),
          variantIndex: index,
          strategyName: strategy.name,
        } as GeneratedPoster;
      } catch (err) {
        console.error(`Poster strategy ${strategy.name} failed:`, err);
        return null;
      }
    });

    const posterResults = await Promise.all(posterPromises);
    const posters = posterResults.filter((p): p is GeneratedPoster => p !== null);

    if (posters.length === 0) {
      throw new Error('All poster generations failed');
    }

    return NextResponse.json({ success: true, posters, mode: 'single' });

  } catch (error) {
    console.error('Poster generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate poster'
    }, { status: 500 });
  }
}
