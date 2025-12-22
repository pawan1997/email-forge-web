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

// 3 distinct poster generation strategies for single images
// Uses EXACT same directives as carousel strategies for visual consistency
const POSTER_STRATEGIES = [
  {
    name: 'reference-based',
    directive: 'Follow the reference image style closely if provided. Match colors, typography, and visual approach. BRANDING: Include creator photo (small circle, 40-50px) and name in bottom corner.',
  },
  {
    name: 'editorial-dark',
    directive: `Magazine editorial style on dark background (#0a0a0a or #111).
TYPOGRAPHY: Large serif headline (Playfair Display or Cormorant), clean sans body text.
LAYOUT: Generous whitespace, asymmetric composition, elegant spacing.
ACCENT: One warm accent color (gold #d4af37, coral #ff6b6b, or amber #f59e0b).
BRANDING: Creator photo (circular, 40-50px) + name + @handle in bottom-left or bottom-right corner. This is REQUIRED on every slide.
AESTHETIC: Think Vogue, The New Yorker, luxury magazine covers.`,
  },
  {
    name: 'light-minimal',
    directive: `Clean, airy design on white/cream/off-white background.
TYPOGRAPHY: Modern sans-serif (Space Grotesk, Outfit), strong weight contrast.
LAYOUT: Centered or left-aligned, plenty of breathing room, 60px+ padding.
ACCENT: One muted accent (sage green, dusty rose, slate blue).
BRANDING: Creator photo (circular, 40-50px) + name in corner. Required on ALL slides.
AESTHETIC: Think Apple keynotes, Notion marketing, clean SaaS design.`,
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

// 3 distinct carousel style strategies - each generates ONLY first slide initially
const CAROUSEL_STRATEGIES = [
  {
    name: 'reference-based',
    directive: 'Follow the reference image style closely if provided. Match colors, typography, and visual approach. BRANDING: Include creator photo (small circle, 40-50px) and name in bottom corner.',
  },
  {
    name: 'editorial-dark',
    directive: `Magazine editorial style on dark background (#0a0a0a or #111).
TYPOGRAPHY: Large serif headline (Playfair Display or Cormorant), clean sans body text.
LAYOUT: Generous whitespace, asymmetric composition, elegant spacing.
ACCENT: One warm accent color (gold #d4af37, coral #ff6b6b, or amber #f59e0b).
BRANDING: Creator photo (circular, 40-50px) + name + @handle in bottom-left or bottom-right corner. This is REQUIRED on every slide.
AESTHETIC: Think Vogue, The New Yorker, luxury magazine covers.`,
  },
  {
    name: 'light-minimal',
    directive: `Clean, airy design on white/cream/off-white background.
TYPOGRAPHY: Modern sans-serif (Space Grotesk, Outfit), strong weight contrast.
LAYOUT: Centered or left-aligned, plenty of breathing room, 60px+ padding.
ACCENT: One muted accent (sage green, dusty rose, slate blue).
BRANDING: Creator photo (circular, 40-50px) + name in corner. Required on ALL slides.
AESTHETIC: Think Apple keynotes, Notion marketing, clean SaaS design.`,
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
  strategy: typeof CAROUSEL_STRATEGIES[0],
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

  if (hasReferenceImage && strategy.name === 'reference-based') {
    text += `\n\nREFERENCE IMAGE PROVIDED: Use it for visual style inspiration (colors, typography, layout).`;
  } else if (strategy.name !== 'reference-based') {
    text += `\n\nIGNORE any reference image. Follow the style direction above.`;
  }

  return text;
}

// Build prompt for single poster - mirrors carousel first slide prompt structure
function buildSinglePosterPrompt(
  prompt: string,
  profile: { display_name: string; username: string; profile_pic: string },
  dimensions: { width: number; height: number },
  strategy: typeof POSTER_STRATEGIES[0],
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

  if (hasReferenceImage && strategy.name === 'reference-based') {
    text += `\n\nREFERENCE IMAGE PROVIDED: Use it for visual style inspiration (colors, typography, layout).`;
  } else if (strategy.name !== 'reference-based') {
    text += `\n\nIGNORE any reference image. Follow the style direction above.`;
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

    // Use OpenRouter with Gemini 3 Pro
    const apiKey = body.openRouterApiKey || OPENROUTER_API_KEY;
    const model = 'google/gemini-3-pro-preview'; // Best quality with vision

    // Helper to clean HTML response
    const cleanHtml = (html: string): string => {
      html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      if (!html.startsWith('<!DOCTYPE')) {
        const idx = html.indexOf('<!DOCTYPE');
        if (idx !== -1) html = html.substring(idx);
      }
      return html;
    };

    // CAROUSEL MODE - Generate only FIRST SLIDE for each of 4 style variants
    // User picks their favorite, then we complete the rest (saves tokens!)
    if (config.mode === 'carousel') {
      const slideCount = config.carouselSlides || 5;

      const profileForCarousel = {
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio,
        profile_pic: profile.profile_pic,
      };

      // Generate first slide for each strategy in parallel
      const firstSlidePromises = CAROUSEL_STRATEGIES.map(async (strategy, index) => {
        try {
          const promptText = buildFirstSlidePrompt(
            config.prompt,
            profileForCarousel,
            dimensions,
            slideCount,
            strategy,
            hasReferenceImage
          );

          // Only pass reference image for reference-based strategy
          const useRef = hasReferenceImage && strategy.name === 'reference-based';

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
    // Uses same strategy directives as carousel for visual consistency
    const profileForPoster = {
      display_name: profile.display_name,
      username: profile.username,
      profile_pic: profile.profile_pic,
    };

    const posterPromises = POSTER_STRATEGIES.map(async (strategy, index) => {
      try {
        // Only pass reference image for reference-based strategy (first one)
        const useRef = hasReferenceImage && strategy.name === 'reference-based';

        // Build prompt using same structure as carousel
        const promptText = buildSinglePosterPrompt(
          config.prompt,
          profileForPoster,
          dimensions,
          strategy,
          hasReferenceImage
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
