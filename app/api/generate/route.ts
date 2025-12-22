import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// System prompt for SuprSend-compatible email generation
const SYSTEM_PROMPT = `You are an expert HTML email template designer. You create production-ready email templates optimized for SuprSend notification infrastructure that work across ALL email clients.

## SUPRSEND PLATFORM REQUIREMENTS

### Variable Syntax (SuprSend/Handlebars)
- Simple variables: {{variableName}}
- Nested variables: {{user.profile.name}} or {{order.items.total}}
- Variables with spaces: {{event.[first name]}}
- URLs and links: Use TRIPLE braces {{{url}}} to avoid HTML escaping
- Default values: {{default variableName "fallback value"}}

### SuprSend Handlebars Helpers
- {{default variable "default_value"}} - Fallback if variable is null/undefined
- {{lowercase string}} - Convert to lowercase
- {{uppercase string}} - Convert to uppercase
- {{capitalize string}} - Capitalize first character
- {{#if condition}}...{{/if}} - Conditional blocks
- {{#each array}}...{{/each}} - Loop through arrays

### SuprSend Global Variables (DOUBLE braces - built-in)
These are platform-provided variables, use exactly as shown:
- {{$hosted_preference_url}} - Unsubscribe/preference center URL (REQUIRED in footer)
- {{$workflow_run_id}} - Workflow tracking ID (if applicable)
Note: Global variables start with $ and use DOUBLE braces (not triple).

### CRITICAL: Variable Mismatch Warning
If a variable doesn't match the payload data, SuprSend will NOT send that notification.

## HTML EMAIL CONSTRAINTS

### Layout Architecture
- Use TABLE-BASED layouts exclusively. Never use flexbox, CSS grid, or float.
- Maximum content width: 600px
- All layout tables MUST have: cellpadding="0" cellspacing="0" border="0" role="presentation"

### Size Limits
- Total HTML under 102KB (Gmail clips larger)
- Style blocks under 8KB

### CSS Rules
SAFE: background-color, color, font-family, font-size, font-weight, text-align, padding, border, width, height, vertical-align

FORBIDDEN: flex, grid, position, float, calc(), CSS variables, transform, animation, display:flex, display:grid

IMPORTANT: Never use "display: flex" or "display: grid" - these do NOT work in email clients!

### Font Stack (with Google Fonts)
PRIMARY FONTS (use with web-safe fallbacks):
- Headlines: "Montserrat", "Poppins", "DM Sans", Arial, sans-serif (weight: 600-700)
- Body: "Inter", "Roboto", "Open Sans", Arial, sans-serif (weight: 400)
- Luxury/Editorial: "Playfair Display", "Merriweather", Georgia, serif

Include Google Fonts link in <head>:
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">

### MSO Conditionals
Multi-column layouts MUST include MSO ghost tables for Outlook.

### MOBILE RESPONSIVENESS (CRITICAL)

The email MUST be fully responsive. Include these responsive styles in <style> block:

@media screen and (max-width: 600px) {
    .email-container {
        width: 100% !important;
        max-width: 100% !important;
    }
    .fluid {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
    }
    .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
    }
    .stack-column-center {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        text-align: center !important;
    }
    .center-on-mobile {
        text-align: center !important;
        display: block !important;
        margin-left: auto !important;
        margin-right: auto !important;
        float: none !important;
    }
    .hide-on-mobile {
        display: none !important;
    }
    .mobile-padding {
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
    h1 { font-size: 28px !important; line-height: 1.2 !important; }
    h2 { font-size: 24px !important; line-height: 1.2 !important; }
    h3 { font-size: 20px !important; line-height: 1.3 !important; }
}

RESPONSIVE TABLE STRUCTURE:
- Main container: class="email-container" with width="600" AND style="max-width: 600px; width: 100%;"
- Images: class="fluid" with style="max-width: 100%; height: auto;"
- Multi-column layouts: Use class="stack-column" on td elements that should stack
- Padding: Add class="mobile-padding" to cells that need adjusted padding on mobile

ICON ELEMENTS (NO FLEXBOX, NO EMOJIS):

IMPORTANT: Never use emojis as icons - they hurt email deliverability and look unprofessional.

Use hosted PNG icons from these email-safe icon services:

1. **Google Material Icons (PNG)** - Most reliable:
   https://fonts.gstatic.com/s/i/materialicons/{icon_name}/v1/24px.svg
   Or use: https://img.icons8.com/material/{size}/{color}/{icon_name}.png

2. **Icons8 API** - Great variety, customizable:
   https://img.icons8.com/fluency/48/{icon_name}.png
   https://img.icons8.com/color/48/{icon_name}.png
   https://img.icons8.com/ios-filled/48/{color}/{icon_name}.png

3. **Iconify CDN** (PNG format):
   https://api.iconify.design/mdi/{icon_name}.svg?width=48&height=48&color=%23ffffff

Common icon names: checkmark, star, trophy, heart, home, user, email, phone, calendar, clock,
shield, lock, gift, cart, credit-card, thumbs-up, rocket, lightning, medal, crown

ICON PATTERN (table-based, with hosted image):
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td width="48" height="48" style="background-color: #2c5282; border-radius: 8px; text-align: center; vertical-align: middle;">
      <img src="https://img.icons8.com/ios-filled/24/ffffff/checkmark.png" width="24" height="24" alt="" style="display: block; margin: 0 auto;">
    </td>
  </tr>
</table>

ALTERNATIVE - Icon without background (cleaner look):
<img src="https://img.icons8.com/fluency/48/checkmark.png" width="48" height="48" alt="" style="display: block;">

NEVER use:
- Emojis (🏆❤️🏠) - hurt deliverability, render inconsistently
- display:flex or display:grid
- Inline SVG (breaks in Outlook)

## MODERN EMAIL DESIGN SYSTEM

### Design Philosophy
Create emails that look like they were designed by a professional agency, NOT generated by AI.
Each email must have a CLEAR VISUAL IDENTITY that is memorable and distinctive.

### Typography (CRITICAL - This Makes or Breaks Design)
SIZE HIERARCHY (dramatic contrast REQUIRED):
- Hero headline: 36-48px (bold, commanding)
- Section headlines: 24-28px
- Body text: 16-18px
- Small text/captions: 12-14px
- Line height: 1.5-1.6 for body text

ALIGNMENT:
- LEFT-ALIGN body text (easier to read than centered)
- Headlines can be centered or left-aligned based on layout
- NEVER center long paragraphs

### Color Application (Use Brand Colors BOLDLY)
- PRIMARY COLOR: Use the brand's primary color boldly - for backgrounds, headlines, NOT just tiny accents
- SECONDARY: Use for backgrounds, section dividers, or large text areas
- ACCENT: Reserve EXCLUSIVELY for CTA buttons - make them POP against everything else
- Backgrounds: Don't default to #ffffff - try light tints of brand colors (e.g., primary color at 5-10% opacity)
- Text: #1a1a1a on light backgrounds, #ffffff on dark (HIGH CONTRAST always)

### Layout Patterns

HERO SECTION OPTIONS (pick one, commit to it):
1. Full-width image with bold text overlay (dramatic)
2. Split layout: image on one side, text on other (modern)
3. Text-only with massive typography on colored background (minimal, elegant)
4. Solid brand-color background with centered headline (clean, bold)

CONTENT SECTIONS:
- Use full-width color blocks to separate sections visually
- Vary padding: 48-60px for major sections, 24-32px for subsections
- Create visual rhythm through VARIED spacing (not equal everywhere)
- Max 65 characters per line for readability

### SPACING RULES (CRITICAL - Follow Exactly)

SECTION PADDING (outer table cells):
- Hero section: padding="48" or style="padding: 48px 24px;"
- Content sections: padding="40" or style="padding: 40px 24px;"
- Footer: padding="32" or style="padding: 32px 24px;"
- Mobile-safe horizontal: always 24px left/right minimum

BETWEEN ELEMENTS (inside sections):
- After headline: 16-20px margin-bottom
- After paragraph: 16px margin-bottom
- Before CTA button: 24-32px margin-top
- Between feature items: 24px minimum

ICON + TEXT LAYOUTS (Feature Lists):
When showing icons with text (like feature lists), use this EXACT pattern with HOSTED ICONS (no emojis!):

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
  <tr>
    <td width="64" valign="top" style="padding-right: 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="48" height="48" style="background-color: #2c5282; border-radius: 8px; text-align: center; vertical-align: middle;">
            <img src="https://img.icons8.com/ios-filled/24/ffffff/checkmark.png" width="24" height="24" alt="" style="display: block; margin: 0 auto;">
          </td>
        </tr>
      </table>
    </td>
    <td valign="top">
      <h4 style="margin: 0 0 8px 0; font-family: 'Montserrat', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">Feature Title</h4>
      <p style="margin: 0; font-family: 'Inter', Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #4a4a4a;">Feature description goes here.</p>
    </td>
  </tr>
</table>

ICON URL PATTERNS (choose appropriate icon):
- Checkmark: https://img.icons8.com/ios-filled/24/ffffff/checkmark.png
- Star: https://img.icons8.com/ios-filled/24/ffffff/star.png
- Trophy: https://img.icons8.com/ios-filled/24/ffffff/trophy.png
- Heart: https://img.icons8.com/ios-filled/24/ffffff/heart.png
- Shield: https://img.icons8.com/ios-filled/24/ffffff/shield.png
- Lightning: https://img.icons8.com/ios-filled/24/ffffff/lightning-bolt.png
- Home: https://img.icons8.com/ios-filled/24/ffffff/home.png
- User: https://img.icons8.com/ios-filled/24/ffffff/user.png
- Clock: https://img.icons8.com/ios-filled/24/ffffff/clock.png
- Gift: https://img.icons8.com/ios-filled/24/ffffff/gift.png

For colored icons without background:
- https://img.icons8.com/fluency/48/checkmark.png (colorful)
- https://img.icons8.com/color/48/checkmark.png (flat color)

RULES:
- Icon cell: width="64", valign="top", padding-right: 16px
- Nested table for icon with td having background-color
- Icon image: 24px inside 48px colored cell
- Text cell: valign="top" to align with icon top
- Wrapper table: margin-bottom: 24px for spacing between items
- NEVER use emojis - always use hosted PNG icons

IMAGE + TEXT LAYOUTS:
- Gap between image and text below: 24px minimum
- Image should be display:block to remove extra spacing
- Use style="margin-bottom: 24px;" on image wrapper cell

VERTICAL SPACING BETWEEN SECTIONS:
- Add spacer rows between major sections: <tr><td height="24"></td></tr>
- Or use padding-bottom on section's outer cell

COMMON SPACING MISTAKES TO AVOID:
❌ Icon and text misaligned (not using valign="top")
❌ No gap between icon and text (missing padding-right)
❌ Cramped feature items (less than 24px between rows)
❌ Text touching image (no margin after image)
❌ Inconsistent section padding

### CTA DESIGN (ONE Primary CTA Per Email)
- Minimum size: 200px wide, 50px tall
- Padding: 16px 40px (generous, not cramped)
- Border-radius: 4-8px (slightly rounded, not pill-shaped)
- Background: ACCENT color (must contrast strongly with section background)
- Text: Action-specific verbs ("Start Free Trial", "Get 50% Off", "Claim Your Spot")
- ONE primary CTA per email section - don't compete for attention

### Visual Hierarchy (What Eyes See First)
1. FIRST: Hero headline or hero image
2. SECOND: Value proposition or key message
3. THIRD: CTA button (unmissable)
4. FOURTH: Supporting content below the fold

### DESIGN ANTI-PATTERNS (NEVER GENERATE THESE)
❌ Arial or Helvetica as the ONLY font
❌ #1a73e8 (Google blue) or #6366f1 (generic purple) as primary color
❌ Three-column icon grids (cliché, looks like every other email)
❌ "Click here", "Learn more", "Submit" button text
❌ Centered body paragraphs
❌ Equal spacing everywhere (no visual rhythm)
❌ Gray backgrounds with gray text (low contrast)
❌ Tiny CTA buttons (under 44px tall)
❌ Multiple competing CTAs in same section
❌ Generic stock photo vibes
❌ Purple-to-blue gradients (AI slop signature)
❌ Icons/images misaligned with text (missing valign="top")
❌ No gap between icon and text (cramped look)
❌ Text directly touching images (no margin/padding)
❌ Inconsistent padding between sections
❌ Using display:flex or display:grid (BREAKS in email clients!)
❌ Fixed pixel widths without max-width: 100%
❌ Missing responsive media queries
❌ Non-fluid images (missing class="fluid" and max-width: 100%)
❌ EMOJIS AS ICONS (🏆❤️🏠) - hurts deliverability, looks unprofessional

### DESIGN REQUIREMENTS (ALWAYS INCLUDE)
✅ Dramatic headline typography (36px+ for hero)
✅ Clear visual hierarchy (obvious what to look at first/second/third)
✅ Strategic white space (generous padding, room to breathe)
✅ ONE unmissable CTA per major section
✅ Brand color used prominently (backgrounds, headlines - not just buttons)
✅ Professional, agency-quality aesthetic
✅ Mobile-first stacking (looks good on small screens)
✅ At least one full-width colored section (breaks up white monotony)
✅ Proper icon+text alignment (valign="top", padding-right on icon cell)
✅ Consistent vertical rhythm (24px between items, 40-48px between sections)
✅ Images with display:block and proper margin-bottom
✅ Responsive media queries in <style> block
✅ class="email-container" on main table with width="600" style="max-width: 600px; width: 100%;"
✅ class="fluid" on all images with style="max-width: 100%; height: auto;"
✅ Icons using HOSTED PNG images from Icons8 (NOT emojis, NOT display:flex divs)
✅ Icon URLs from: https://img.icons8.com/ios-filled/24/ffffff/{icon-name}.png

## HANDLEBARS FOR SUPRSEND

### URL Variables (TRIPLE BRACES)
- {{{ctaUrl}}} - Call-to-action URL
- {{{trackingUrl}}} - Tracking links
- {{{logoUrl}}} - Logo image URL
Note: For unsubscribe, use the global variable {{$hosted_preference_url}} (double braces)

### Text Variables (DOUBLE BRACES)
- {{recipientName}} - Recipient name
- {{default recipientName "there"}} - With fallback
- {{order.id}}, {{order.total}} - Order data

## IMAGE RESOURCES

### High-Quality Image Sources (CRITICAL FOR PROFESSIONAL RESULTS)

**IMPORTANT**: Image quality directly impacts email perception. Use these optimized patterns:

1. **Unsplash Direct URLs (PREFERRED - Highest Quality)**:
   Use specific photo IDs with quality parameters:
   https://images.unsplash.com/photo-{photo_id}?w={width}&h={height}&fit=crop&q=85&auto=format

   **Curated photo IDs for common uses:**
   - Professional/Business: photo-1560472354-b33ff0c44a43, photo-1552664730-d307ca884978, photo-1573497019940-1c28c88b4f3e
   - Technology/SaaS: photo-1531297484001-80022131f5a1, photo-1518770660439-4636190af475, photo-1550751827-4bd374c3f58b
   - E-commerce/Products: photo-1441986300917-64674bd600d8, photo-1472851294608-062f824d29cc
   - Food/Restaurant: photo-1504674900247-0877df9cc836, photo-1493770348161-369560ae357d
   - Health/Fitness: photo-1571019613454-1cb2f99b2d8b, photo-1517836357463-d25dfeac3438
   - Travel/Lifestyle: photo-1488646953014-85cb44e25828, photo-1503220317375-aaad61436b1b
   - Team/People: photo-1522071820081-009f0129c71c, photo-1600880292203-757bb62b4baf

   Example: https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=300&fit=crop&q=85&auto=format

2. **Unsplash Source with Keywords** (Good for specific topics):
   https://source.unsplash.com/featured/{width}x{height}/?{keywords}

   **Tips for better results:**
   - Use 2-3 specific keywords: office,professional,modern
   - Add context words: team,meeting NOT just "people"
   - Avoid single generic words

   Example: https://source.unsplash.com/featured/600x300/?startup,office,modern

3. **Picsum** (LAST RESORT - for truly generic placeholders):
   https://picsum.photos/seed/{descriptive-seed}/{width}/{height}
   Only use if no specific image type fits.

### Icons (Email-Safe PNG from Icons8)
- White icons: https://img.icons8.com/ios-filled/24/ffffff/{icon-name}.png
- Colored icons: https://img.icons8.com/fluency/48/{icon-name}.png
- Common names: checkmark, star, trophy, heart, shield, lightning-bolt, home, user, clock, gift

### Social Media Logos (ALWAYS use official or reliable sources)
- Twitter/X: https://img.icons8.com/ios-filled/24/ffffff/twitterx.png
- Facebook: https://img.icons8.com/ios-filled/24/ffffff/facebook-new.png
- Instagram: https://img.icons8.com/ios-filled/24/ffffff/instagram-new.png
- LinkedIn: https://img.icons8.com/ios-filled/24/ffffff/linkedin.png
- YouTube: https://img.icons8.com/ios-filled/24/ffffff/youtube-play.png

### CRITICAL: If user provides specific image URLs in their prompt, USE THEM EXACTLY!
If the user mentions URLs like "use this logo: https://..." or "hero image from https://...", use those exact URLs.

Always include: alt, width, height, style="display:block;border:0;"

## OUTPUT REQUIREMENTS
1. Generate COMPLETE, VALID HTML only (no markdown fences)
2. Start with <!DOCTYPE html>, end with </html>
3. Use triple braces {{{url}}} for custom URL variables
4. Use {{$hosted_preference_url}} for unsubscribe link in footer (SuprSend global - DOUBLE braces)
5. Include preheader text
6. Compatible with SuprSend's HTML code editor

## BLOCK STRUCTURE (REQUIRED)
Wrap each major section with HTML comment markers for editing:
<!-- BLOCK:header -->...<!-- /BLOCK:header -->
<!-- BLOCK:hero -->...<!-- /BLOCK:hero -->
<!-- BLOCK:content -->...<!-- /BLOCK:content -->
<!-- BLOCK:cta -->...<!-- /BLOCK:cta -->
<!-- BLOCK:footer -->...<!-- /BLOCK:footer -->
Include these markers around each logical section of the email.

## SELF-VALIDATION CHECKLIST (MUST PASS BEFORE OUTPUT)

Before outputting ANY HTML, mentally verify each of these. If ANY fails, FIX IT before outputting:

### 1. NO FORBIDDEN CSS
- [ ] No "display: flex" anywhere in the HTML
- [ ] No "display: grid" anywhere in the HTML
- [ ] No "position: absolute/relative/fixed"
- [ ] No "float: left/right"

### 2. ICON + TEXT ALIGNMENT
- [ ] Every icon uses a nested TABLE with TD having background-color (NOT a div with display:flex)
- [ ] Every icon cell has valign="top"
- [ ] Every text cell next to icon has valign="top"
- [ ] Icon cell has padding-right: 16px for gap
- [ ] Each feature item table has margin-bottom: 24px

### 3. SECTION SEPARATION
- [ ] Hero section has clear bottom boundary (padding-bottom or different background)
- [ ] Content section has different background OR clear padding-top (40px+)
- [ ] No text from one section flows into another section
- [ ] Each BLOCK marker wraps a visually distinct section

### 4. RESPONSIVE STRUCTURE
- [ ] Main table has class="email-container" with style="max-width: 600px; width: 100%;"
- [ ] All images have class="fluid" with style="max-width: 100%; height: auto;"
- [ ] Media queries in <style> block for mobile

### 5. TABLE STRUCTURE
- [ ] All layout tables have: role="presentation" cellspacing="0" cellpadding="0" border="0"
- [ ] All images have: alt, width, height, style="display: block;"

If you find ANY violation during this check, FIX IT in your output. Do not output broken HTML.`;

// Image prompt system
const IMAGE_PROMPT_SYSTEM = `You are an AI image prompt specialist. Analyze the HTML email and generate detailed prompts for each placeholder image.

Return a JSON array:
[
  {
    "id": "unique-identifier",
    "location": "where in email",
    "placeholder": "Lorem Picsum URL",
    "dimensions": { "width": 600, "height": 300 },
    "aiPrompt": "detailed, specific generation prompt",
    "style": "visual style description",
    "notes": "additional context"
  }
]

Make prompts SPECIFIC - avoid generic stock photo descriptions. Return ONLY JSON.`;

interface DesignTokens {
  colorPalette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    mutedText?: string;
  };
  typography?: {
    headlineStyle?: string;
    bodyStyle?: string;
    headlineWeight?: string;
    sizeContrast?: string;
  };
  layout?: {
    structure?: string;
    alignment?: string;
    density?: string;
    heroStyle?: string;
  };
  aesthetic?: {
    direction?: string;
    mood?: string;
    distinctiveElements?: string[];
  };
  components?: {
    hasHeroImage?: boolean;
    hasFeatureIcons?: boolean;
    hasSocialLinks?: boolean;
    ctaStyle?: string;
    dividerStyle?: string;
  };
  summary?: string;
}

type GenerationMode = 'fast' | 'tasty';
type ModelProvider = 'anthropic' | 'openrouter';

interface RequestBody {
  apiKey: string;
  openRouterApiKey?: string;
  description: string;
  emailType: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  tone: string;
  industry?: string;
  designTokens?: DesignTokens;
  generationMode?: GenerationMode; // 'fast' = minimal images, 'tasty' = rich visuals
  modelProvider?: ModelProvider;
  openRouterModel?: string;
}

// OpenRouter API helper
async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8192
): Promise<string> {
  console.log('Calling OpenRouter with model:', model);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Email Forge',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter error:', response.status, errorData);

    // More descriptive error messages
    if (response.status === 401 || errorData.error?.message?.includes('user not found')) {
      throw new Error('OpenRouter API key is invalid or expired. Please check your API key at openrouter.ai');
    }
    if (response.status === 402) {
      throw new Error('OpenRouter account has insufficient credits. Please add credits at openrouter.ai');
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
    const body: RequestBody = await request.json();

    const {
      apiKey,
      openRouterApiKey,
      description,
      emailType,
      brandName,
      primaryColor,
      secondaryColor,
      accentColor,
      tone,
      industry,
      designTokens,
      generationMode = 'fast',
      modelProvider = 'anthropic',
      openRouterModel = 'google/gemini-3-pro-preview',
    } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    if (modelProvider === 'openrouter' && !openRouterApiKey) {
      return NextResponse.json({ error: 'OpenRouter API key is required' }, { status: 400 });
    }

    if (!description || !brandName || !emailType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Anthropic client for secondary API calls (variables, image prompts)
    const client = new Anthropic({ apiKey });

    // Build the prompt for the selected mode
    const userPrompt = buildGenerationPrompt({
      description,
      emailType,
      brandName,
      primaryColor,
      secondaryColor,
      accentColor,
      tone,
      industry,
      designTokens,
      mode: generationMode,
    });

    // Generate HTML using selected provider
    let htmlContent: string;

    if (modelProvider === 'openrouter' && openRouterApiKey) {
      // Use OpenRouter for HTML generation
      htmlContent = await callOpenRouter(
        openRouterApiKey,
        openRouterModel,
        SYSTEM_PROMPT,
        userPrompt,
        8192
      );
    } else {
      // Use Anthropic (default) for HTML generation
      const htmlResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      htmlContent = htmlResponse.content[0].type === 'text'
        ? htmlResponse.content[0].text
        : '';
    }

    // Clean the HTML output
    const html = cleanHtmlOutput(htmlContent);

    // Store in the correct version slot
    const generatedVersions: Record<'fast' | 'tasty', string | null> = {
      fast: generationMode === 'fast' ? html : null,
      tasty: generationMode === 'tasty' ? html : null
    };

    // Extract variables (handles both double and triple braces)
    const variableNames = extractVariables(html);

    // Document variables with SuprSend-specific format
    const variablesResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `For this ${emailType} email for "${brandName}"${industry ? ` (${industry})` : ''}, document these SuprSend template variables: ${variableNames.join(', ')}

For each variable, provide JSON with:
- name: variable name
- type: "string" | "number" | "url" | "date" | "boolean"
- description: what this variable represents
- mockValue: realistic example (NOT "John Doe" or "Lorem ipsum" - use diverse, contextual data)
- required: true/false
- isUrl: true if this is a URL (should use triple braces {{{url}}} in SuprSend)
- suprsendSyntax: the exact syntax to use in SuprSend (e.g., "{{name}}" or "{{{url}}}")

MOCK DATA RULES:
- Names: diverse (e.g., "Sarah Chen", "Marcus Williams", "Priya Patel")
- URLs: realistic patterns (e.g., "https://app.example.com/track/abc123")
- Prices: industry-appropriate

Return ONLY a JSON array.`,
        },
      ],
    });

    let variables: Array<{
      name: string;
      type: string;
      description: string;
      mockValue: string | number | boolean;
      required: boolean;
      isUrl?: boolean;
      suprsendSyntax?: string;
    }> = [];

    if (variablesResponse.content[0].type === 'text') {
      try {
        const cleaned = variablesResponse.content[0].text
          .replace(/^```json\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();
        variables = JSON.parse(cleaned);
      } catch {
        variables = variableNames.map((name) => {
          const isUrl = isUrlVariable(name);
          return {
            name,
            type: isUrl ? 'url' : 'string',
            description: `Variable: ${name}`,
            mockValue: isUrl ? `https://example.com/${name}` : `[${name}]`,
            required: true,
            isUrl,
            suprsendSyntax: isUrl ? `{{{${name}}}}` : `{{${name}}}`,
          };
        });
      }
    }

    // Add SuprSend syntax to variables if not present
    variables = variables.map((v) => {
      const isUrl = v.isUrl ?? isUrlVariable(v.name) ?? v.type === 'url';
      return {
        ...v,
        isUrl,
        suprsendSyntax: v.suprsendSyntax ?? (isUrl ? `{{{${v.name}}}}` : `{{${v.name}}}`),
      };
    });

    // Generate image prompts
    let imagePrompts: Array<{
      id: string;
      location: string;
      placeholder: string;
      dimensions: { width: number; height: number };
      aiPrompt: string;
      style: string;
      notes: string;
    }> = [];

    const imgCount = (html.match(/<img/gi) || []).length;
    if (imgCount > 0) {
      const imageResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: IMAGE_PROMPT_SYSTEM,
        messages: [
          {
            role: 'user',
            content: `Analyze this ${emailType} email for ${brandName}${industry ? ` (${industry})` : ''} and generate AI image prompts:

Brand colors: ${primaryColor}, ${secondaryColor}${accentColor ? `, ${accentColor}` : ''}
Tone: ${tone}

${html}`,
          },
        ],
      });

      if (imageResponse.content[0].type === 'text') {
        try {
          const cleaned = imageResponse.content[0].text
            .replace(/^```json\s*\n?/i, '')
            .replace(/\n?```\s*$/i, '')
            .trim();
          imagePrompts = JSON.parse(cleaned);
        } catch {
          imagePrompts = [];
        }
      }
    }

    // Validate the HTML
    const validation = validateEmail(html);

    // Convert variables array to SuprSend-compatible object format
    // SuprSend expects: { "variableName": "mockValue", ... }
    const suprsendVariables: Record<string, string | number | boolean> = {};
    for (const v of variables) {
      suprsendVariables[v.name] = v.mockValue;
    }

    return NextResponse.json({
      html,
      versions: generatedVersions,
      activeMode: generationMode,
      variables,
      suprsendVariables,
      imagePrompts,
      metadata: {
        sizeBytes: Buffer.byteLength(html, 'utf8'),
        validationPassed: validation.isValid,
        warnings: validation.warnings,
        errors: validation.errors,
        compatibleWith: validation.isValid
          ? ['gmail', 'outlook', 'apple-mail', 'yahoo', 'mobile', 'suprsend']
          : ['gmail', 'apple-mail', 'yahoo'],
        modelUsed: modelProvider === 'openrouter' ? openRouterModel : 'claude-sonnet-4',
      },
    });
  } catch (error) {
    console.error('Generation error:', error);

    if (error instanceof Error) {
      if (error.message.includes('api_key') || error.message.includes('authentication')) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function buildGenerationPrompt(params: {
  description: string;
  emailType: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  tone: string;
  industry?: string;
  designTokens?: DesignTokens;
  mode: 'fast' | 'tasty';
}): string {
  // Email type guidance with design direction
  const typeGuidance: Record<string, string> = {
    marketing: `Focus on engagement and conversion.
    DESIGN: Bold hero section with dramatic headline (40px+), full-width brand-colored background, ONE unmissable CTA button.
    Use aspirational imagery. Create urgency through visual hierarchy, not just copy.`,
    transactional: `Focus on clarity and trust.
    DESIGN: Clean, structured layout. Primary color in header only. White/light content area for readability.
    Information hierarchy through typography size (order number BIG, details smaller). Subtle, professional.`,
    notification: `Focus on urgency and action.
    DESIGN: Compact, punchy layout. Bold primary-colored banner at top. Get to the point immediately.
    Single prominent CTA. No fluff imagery - functional design.`,
    newsletter: `Focus on content organization and scannability.
    DESIGN: Clear section breaks with alternating backgrounds (brand color tints).
    Strong headlines for each section. Card-style content blocks. Multiple entry points but clear hierarchy.`,
  };

  // Tone-specific design guidance
  const toneDesignGuidance: Record<string, string> = {
    professional: `DESIGN DIRECTION: Clean, structured, authoritative.
    - Typography: Sans-serif (Montserrat/Inter), generous letter-spacing
    - Colors: Deep, muted brand colors - no bright neons
    - Layout: Structured grid, perfectly aligned elements
    - Imagery: Professional photography, no illustrations
    - Spacing: Generous, airy, premium feel`,
    friendly: `DESIGN DIRECTION: Warm, approachable, conversational.
    - Typography: Rounded sans-serif (Poppins/DM Sans), relaxed sizes
    - Colors: Warm tones, approachable palette, soft gradients OK
    - Layout: Relaxed alignment, comfortable spacing
    - Imagery: Lifestyle photos, people smiling, relatable scenes
    - Spacing: Comfortable, not too tight or too sparse`,
    luxurious: `DESIGN DIRECTION: Elegant, sophisticated, premium.
    - Typography: Serif headlines (Playfair Display), refined spacing, thin weights
    - Colors: Black, gold, deep jewel tones (emerald, burgundy), minimal palette
    - Layout: Maximum white space, editorial quality, asymmetric balance
    - Imagery: Aspirational, high-end photography, artistic composition
    - Spacing: VERY generous - luxury = breathing room`,
    playful: `DESIGN DIRECTION: Fun, energetic, creative.
    - Typography: Bold, varied sizes, dynamic weights (DM Sans bold)
    - Colors: Vibrant, bold combinations, high saturation
    - Layout: Dynamic, unexpected elements, slight asymmetry OK
    - Imagery: Illustrated style OK, bright photography, action shots
    - Spacing: Varied rhythm, some sections tight, some open`,
    minimal: `DESIGN DIRECTION: Clean, essential, focused.
    - Typography: Simple sans-serif, lots of space between lines
    - Colors: Monochromatic or strict two-color palette
    - Layout: Maximum white space, essential elements only
    - Imagery: Minimal or none - let typography do the work
    - Spacing: EXTREME white space - emptiness is intentional`,
    bold: `DESIGN DIRECTION: Striking, confident, attention-grabbing.
    - Typography: Extra bold headlines (700+), strong contrast, BIG sizes (48px+)
    - Colors: High contrast combinations, bold brand primary everywhere
    - Layout: Full-width color blocks, dramatic sections, strong visual weight
    - Imagery: Impactful, dramatic photography, strong compositions
    - Spacing: Strategic - tight where impactful, generous for drama`,
  };

  const toneGuidance = toneDesignGuidance[params.tone] || toneDesignGuidance.professional;

  // Build design reference section if design tokens are provided
  const designReferenceSection = params.designTokens
    ? buildDesignReferenceSection(params.designTokens)
    : '';

  // Build color guidance - if no colors provided, let AI choose based on tone/industry
  // If design tokens have colors, use those as the primary source
  const designColors = params.designTokens?.colorPalette;
  const hasColors = params.primaryColor || params.secondaryColor || params.accentColor || designColors;
  const colorSection = hasColors
    ? `## Brand Colors (User Specified)
${params.primaryColor ? `- Primary Color: ${params.primaryColor} (USE BOLDLY - backgrounds, headlines, not just accents)` : ''}
${params.secondaryColor ? `- Secondary Color: ${params.secondaryColor} (for section backgrounds, dividers)` : ''}
${params.accentColor ? `- Accent Color: ${params.accentColor} (ONLY for CTA buttons - make them pop)` : ''}`
    : `## Brand Colors (AI CHOOSE)
No specific colors provided. YOU MUST choose a distinctive, modern color palette that:
- Matches the "${params.tone}" tone perfectly
- Is appropriate for ${params.industry || 'the'} industry
- AVOIDS generic blues (#1a73e8, #3b82f6) and purples (#6366f1, #8b5cf6)
- Creates strong visual identity
- Includes: primary (bold, for backgrounds/headlines), secondary (subtle, for sections), accent (CTA buttons only)
Be creative and intentional with your color choices!`;

  // Mode-specific image handling
  const modeGuidance = params.mode === 'fast'
    ? `## IMAGE MODE: FAST (Minimal Images)
**IMPORTANT: Use images SPARINGLY in this version.**
- ONLY include images that are absolutely necessary and specific:
  - Brand logo (if user provided URL)
  - Social media icons (Twitter, Facebook, LinkedIn, etc.)
  - Simple icons for features (use Icons8 PNG URLs)
- NO hero images unless the user specifically provided one
- NO decorative images or stock photos
- NO placeholder images that would need replacement
- Focus on typography, color blocks, and clean design instead of images
- If you must show a product, use a simple colored box placeholder with text describing what goes there
- The email should look COMPLETE and professional without any images that need replacing`
    : `## IMAGE MODE: TASTY (Rich Visuals) - CREATE A VISUALLY STUNNING EMAIL

**CRITICAL: This is TASTY mode - you MUST create a visually rich, magazine-quality email design.**

### 🚫 BANNED LAYOUTS (DO NOT USE)

**NEVER use the "icon-left, text-right" two-column pattern:**
\`\`\`
❌ WRONG - Wastes space, looks dated:
| [icon] | Title here          |
|        | Description text... |
\`\`\`

**INSTEAD, use these SPACE-EFFICIENT patterns:**

### ✅ APPROVED FEATURE SECTION LAYOUTS

**PATTERN 1: Full-Width Feature Cards (PREFERRED)**
Each feature gets its own full-width section with:
- Full-width feature image (600x250) at top
- Title below image (24px, bold)
- Description (16px)
- Optional CTA button

\`\`\`html
<!-- Feature Card Pattern -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
  <tr>
    <td style="padding: 0;">
      <!-- Full-width feature image -->
      <img src="[FEATURE_IMAGE_URL]" width="600" height="250" alt="Feature" style="display: block; width: 100%; height: auto; border-radius: 8px;">
    </td>
  </tr>
  <tr>
    <td style="padding: 24px 0 0 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">Feature Title</h3>
      <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4a4a4a;">Feature description goes here...</p>
    </td>
  </tr>
</table>
\`\`\`

**PATTERN 2: Centered Icon Badge + Text Stack**
Icon centered above text, no side-by-side:

\`\`\`html
<!-- Centered Icon + Text Pattern -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px; text-align: center;">
  <tr>
    <td align="center" style="padding-bottom: 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="56" height="56" style="background-color: #6366f1; border-radius: 12px; text-align: center; vertical-align: middle;">
            <img src="https://cdn-icons-png.flaticon.com/128/2989/2989988.png" width="28" height="28" alt="" style="display: block; margin: 0 auto;">
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td align="center">
      <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Feature Title</h3>
      <p style="margin: 0; font-size: 15px; color: #666;">Description text here</p>
    </td>
  </tr>
</table>
\`\`\`

**PATTERN 3: Three-Column Icon Grid (for 3+ small features)**
Icons in a row, text below each:

\`\`\`html
<!-- 3-Column Feature Grid -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td width="33%" align="center" valign="top" style="padding: 16px;">
      <img src="[ICON_URL]" width="48" height="48" alt="" style="display: block; margin: 0 auto 12px auto;">
      <p style="margin: 0; font-size: 14px; font-weight: 600;">Feature 1</p>
    </td>
    <td width="33%" align="center" valign="top" style="padding: 16px;">
      <img src="[ICON_URL]" width="48" height="48" alt="" style="display: block; margin: 0 auto 12px auto;">
      <p style="margin: 0; font-size: 14px; font-weight: 600;">Feature 2</p>
    </td>
    <td width="33%" align="center" valign="top" style="padding: 16px;">
      <img src="[ICON_URL]" width="48" height="48" alt="" style="display: block; margin: 0 auto 12px auto;">
      <p style="margin: 0; font-size: 14px; font-weight: 600;">Feature 3</p>
    </td>
  </tr>
</table>
\`\`\`

**PATTERN 4: Bullet List with Checkmarks (Simple Features)**
For simple feature lists, use text checkmarks or colored bullets:

\`\`\`html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="padding: 8px 0;">
      <span style="color: #22c55e; font-size: 18px; margin-right: 12px;">✓</span>
      <span style="font-size: 16px; color: #333;">Feature benefit description</span>
    </td>
  </tr>
</table>
\`\`\`

### IMAGE REQUIREMENTS (EVERY FEATURE NEEDS AN IMAGE)

**CRITICAL: In Tasty mode, each major feature MUST have its own image.**

**Minimum image requirements:**
- 1 hero image (600x400)
- 1 image per feature section (600x250 or 600x300)
- Aim for 3-5 total images in the email

**Use Unsplash for high-quality photos:**
https://images.unsplash.com/photo-{id}?w=600&h=300&fit=crop&q=85&auto=format

**Curated Photo IDs by category:**
- SaaS/Dashboard: 1551288049-bebda4e38f71, 1460925895917-afdab827c52f, 1517292987719-0369a794ec0f
- Workspace/Office: 1497366216548-37526070297c, 1497366811353-6870744d04b2, 1606857521015-7f9fcf423740
- Mobile/App: 1512941937-f2e7d1d6c5f8, 1511707171634-5f897ff02aa9
- Analytics/Data: 1551288049-bebda4e38f71, 1460925895917-afdab827c52f
- Team/People: 1522071820081-009f0129c71c, 1600880292203-757bb62b4baf
- Abstract/Tech: 1558494949-ef010cbdcc31, 1526374965328-7f61d4dc18c5

**For EVERY placeholder image, add AI generation prompt:**
\`\`\`html
<!-- IMAGE_PROMPT: id="feature-1" dimensions="600x300" prompt="Modern dashboard interface showing analytics charts and metrics, clean UI design, light theme, professional" -->
<img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop&q=85" width="600" height="300" alt="Dashboard" style="display: block; width: 100%;">
\`\`\`

### ICON SOURCES (PNG - Verified Working)

**Flaticon CDN (FREE, Reliable):**
\`\`\`
https://cdn-icons-png.flaticon.com/128/{collection}/{id}.png
\`\`\`

**Verified working icons:**
- Checkmark: https://cdn-icons-png.flaticon.com/128/2989/2989988.png
- Star: https://cdn-icons-png.flaticon.com/128/1828/1828884.png
- Lightning: https://cdn-icons-png.flaticon.com/128/3313/3313031.png
- Shield: https://cdn-icons-png.flaticon.com/128/2889/2889676.png
- Chart: https://cdn-icons-png.flaticon.com/128/3135/3135706.png
- Rocket: https://cdn-icons-png.flaticon.com/128/3135/3135715.png
- Target: https://cdn-icons-png.flaticon.com/128/3207/3207586.png
- Clock: https://cdn-icons-png.flaticon.com/128/2784/2784459.png
- Gift: https://cdn-icons-png.flaticon.com/128/3131/3131978.png
- Heart: https://cdn-icons-png.flaticon.com/128/833/833472.png
- Settings: https://cdn-icons-png.flaticon.com/128/3524/3524659.png
- User: https://cdn-icons-png.flaticon.com/128/1077/1077114.png
- Mail: https://cdn-icons-png.flaticon.com/128/561/561127.png
- Phone: https://cdn-icons-png.flaticon.com/128/724/724664.png
- Home: https://cdn-icons-png.flaticon.com/128/1946/1946488.png

**Social Media Icons (White on transparent):**
- Twitter/X: https://cdn-icons-png.flaticon.com/128/5968/5968830.png
- LinkedIn: https://cdn-icons-png.flaticon.com/128/3536/3536505.png
- Facebook: https://cdn-icons-png.flaticon.com/128/733/733547.png
- Instagram: https://cdn-icons-png.flaticon.com/128/2111/2111463.png

### VISUAL DESIGN REQUIREMENTS

1. **Every feature section MUST have:**
   - A full-width image (600x250-300px) OR
   - A product screenshot/mockup OR
   - A centered icon badge (NOT side-by-side)

2. **Color blocks and sections:**
   - Use brand primary color for hero/header backgrounds
   - Alternate between white and light tinted sections
   - Use accent color ONLY for CTA buttons

3. **Typography must be dramatic:**
   - Hero headline: 36-48px, bold
   - Section headlines: 24-28px
   - Create clear visual hierarchy

4. **Add visual interest:**
   - Rounded corners on images (border-radius via wrapper table)
   - Colored icon badges (not plain icons)
   - Full-width colored sections
   - Generous padding (40-60px between sections)

### OUTPUT REQUIREMENTS
- Email MUST look like a professionally designed marketing email
- NOT a plain text email with minimal styling
- Include IMAGE_PROMPT comments for ALL placeholder images
- Every image needs: id, dimensions, detailed prompt for AI generation`;

  return `Generate a SuprSend-compatible HTML email template:

## Purpose
${params.description}

## Email Type: ${params.emailType.toUpperCase()}
${typeGuidance[params.emailType] || ''}

## Brand
- Name: ${params.brandName}
- Tone: ${params.tone}
${params.industry ? `- Industry: ${params.industry}` : ''}

${colorSection}
${designReferenceSection ? `\n${designReferenceSection}\n` : ''}
${modeGuidance}

## TONE-SPECIFIC DESIGN (FOLLOW CLOSELY)
${toneGuidance}

## SuprSend Requirements
1. Complete, production-ready HTML
2. Table-based layout (600px max)
3. MSO conditionals for multi-column
4. Use {{variables}} for text, {{{urls}}} for custom links (triple braces)
5. Use {{$hosted_preference_url}} for unsubscribe link (SuprSend global - DOUBLE braces)
6. Lorem Picsum placeholders with descriptive seeds
7. Include preheader text
8. WRAP EACH SECTION with block markers: <!-- BLOCK:type -->...<!-- /BLOCK:type -->

## Block Markers (REQUIRED)
Use these comment markers around each section:
- <!-- BLOCK:header --> for logo/brand header
- <!-- BLOCK:hero --> for hero image/headline
- <!-- BLOCK:content --> for main content
- <!-- BLOCK:cta --> for call-to-action buttons
- <!-- BLOCK:features --> for feature lists (if applicable)
- <!-- BLOCK:footer --> for footer with unsubscribe

Generate the HTML now. Remember: Custom URLs use triple braces {{{url}}}, but unsubscribe uses {{$hosted_preference_url}}!`;
}

function cleanHtmlOutput(html: string): string {
  html = html.replace(/^```html\s*\n?/i, '');
  html = html.replace(/\n?```\s*$/i, '');
  html = html.replace(/^```\s*\n?/i, '');

  const doctypeIndex = html.indexOf('<!DOCTYPE');
  if (doctypeIndex > 0) {
    html = html.substring(doctypeIndex);
  }

  const htmlEndIndex = html.lastIndexOf('</html>');
  if (htmlEndIndex !== -1) {
    html = html.substring(0, htmlEndIndex + 7);
  }

  return html.trim();
}

function extractVariables(html: string): string[] {
  const variables = new Set<string>();

  // Triple braces (URLs)
  const triplePattern = /\{\{\{([^}]+)\}\}\}/g;
  let match;
  while ((match = triplePattern.exec(html)) !== null) {
    const varName = cleanVarName(match[1]);
    if (varName) variables.add(varName);
  }

  // Double braces
  const doublePattern = /\{\{([^{}]+)\}\}/g;
  while ((match = doublePattern.exec(html)) !== null) {
    const varName = cleanVarName(match[1]);
    if (varName) variables.add(varName);
  }

  return Array.from(variables).sort();
}

function cleanVarName(raw: string): string | null {
  let varName = raw.trim();

  if (varName.startsWith('#') || varName.startsWith('/') || varName === 'else') {
    return null;
  }

  // Handle helpers like "default varName 'fallback'"
  if (varName.includes(' ')) {
    const parts = varName.split(/\s+/);
    if (parts.length >= 2) {
      varName = parts[1].replace(/["']/g, '');
    }
  }

  if (['this', 'true', 'false', 'null', 'undefined'].includes(varName)) {
    return null;
  }

  // Skip SuprSend global variables (they start with $)
  // These are built-in platform variables like $hosted_preference_url
  if (varName.startsWith('$')) {
    return null;
  }

  return varName.replace(/["']/g, '') || null;
}

function isUrlVariable(name: string): boolean {
  const urlPatterns = [
    /url$/i,
    /link$/i,
    /href$/i,
    /src$/i,
    /^(cta|action|track|redirect|unsubscribe)/i,
  ];
  return urlPatterns.some((p) => p.test(name));
}

function buildDesignReferenceSection(tokens: DesignTokens): string {
  const sections: string[] = [];

  sections.push(`## 🎯 DESIGN REFERENCE - RECREATE THIS DESIGN (FROM UPLOADED IMAGE)

**⚠️ CRITICAL REQUIREMENT: You are NOT just "inspired by" this design - you MUST RECREATE it as closely as possible.**

The user has uploaded a reference design image. Your job is to:
1. **REPLICATE the exact layout structure** - same sections in same order
2. **COPY the visual hierarchy** - if they have a big hero, you have a big hero
3. **MATCH the spacing and proportions** - dense sections stay dense, airy stays airy
4. **USE their exact colors** - don't pick your own colors
5. **FOLLOW their component choices** - if they have icons in circles, you have icons in circles

Think of this as a design handoff from a designer - your goal is pixel-perfect recreation within email constraints.`);

  if (tokens.summary) {
    sections.push(`\n### 📋 Design Analysis
${tokens.summary}

**Your email MUST visually match this description.**`);
  }

  if (tokens.colorPalette) {
    const cp = tokens.colorPalette;
    sections.push(`\n### 🎨 Color Palette (USE THESE EXACT HEX CODES - DO NOT SUBSTITUTE)
| Role | Color |
|------|-------|
| Primary | ${cp.primary || '#000000'} |
| Secondary | ${cp.secondary || '#666666'} |
| Accent/CTA | ${cp.accent || '#007AFF'} |
| Background | ${cp.background || '#FFFFFF'} |
| Text | ${cp.text || '#000000'} |
| Muted Text | ${cp.mutedText || '#666666'} |

**⚠️ Do NOT use any colors not listed above. Do NOT default to generic blue (#007AFF) if accent is specified.**`);
  }

  if (tokens.typography) {
    const t = tokens.typography;
    sections.push(`\n### 📝 Typography (MATCH EXACTLY)
- **Headline Style**: ${t.headlineStyle || 'bold sans-serif'} - replicate this exact style
- **Body Style**: ${t.bodyStyle || 'clean sans-serif'} - match the reading feel
- **Headline Weight**: ${t.headlineWeight || 'bold'} - use this weight
- **Size Contrast**: ${t.sizeContrast || 'medium'} - ${t.sizeContrast === 'high' ? 'BIG headlines, smaller body' : t.sizeContrast === 'low' ? 'subtle size differences' : 'clear hierarchy'}`);
  }

  if (tokens.layout) {
    const l = tokens.layout;
    sections.push(`\n### 📐 Layout Structure (REPLICATE THIS EXACT PATTERN)
- **Structure**: ${l.structure || 'single-column'} ${l.structure === 'card-grid' ? '- create card sections with borders/shadows' : l.structure === 'multi-column' ? '- use table columns' : '- stack sections vertically'}
- **Alignment**: ${l.alignment || 'left'} ${l.alignment === 'center' ? '- CENTER all content' : '- LEFT align content'}
- **Density**: ${l.density || 'balanced'} ${l.density === 'spacious' ? '- lots of whitespace, airy feel' : l.density === 'compact' ? '- tight spacing, dense information' : '- balanced padding'}
- **Hero Style**: ${l.heroStyle || 'text-only'} ${l.heroStyle === 'full-bleed-image' ? '- MUST have full-width hero image' : l.heroStyle === 'split-hero' ? '- MUST have image + text side by side' : l.heroStyle === 'gradient-banner' ? '- MUST have gradient background header' : '- text-focused hero section'}

**⚠️ The layout pattern is the skeleton of the design - you MUST follow it exactly.**`);
  }

  if (tokens.aesthetic) {
    const a = tokens.aesthetic;
    sections.push(`\n### ✨ Visual Aesthetic (CAPTURE THIS EXACT MOOD)
- **Direction**: ${a.direction || 'modern'} - ${a.direction === 'minimalist' ? 'very clean, lots of white space, subtle' : a.direction === 'bold' ? 'strong colors, big elements, confident' : a.direction === 'playful' ? 'fun, rounded shapes, friendly colors' : 'clean and contemporary'}
- **Mood**: ${a.mood || 'professional'} - the email should FEEL ${a.mood || 'professional'}
- **Distinctive Elements**: ${a.distinctiveElements?.join(', ') || 'none'} - ${a.distinctiveElements?.length ? 'INCLUDE THESE ELEMENTS' : ''}`);
  }

  if (tokens.components) {
    const c = tokens.components;
    sections.push(`\n### 🧩 Component Checklist (MANDATORY)
| Component | Required | How to Implement |
|-----------|----------|------------------|
| Hero Image | ${c.hasHeroImage ? '✅ YES - MUST INCLUDE' : '❌ NO'} | ${c.hasHeroImage ? 'Full-width image in hero section' : 'Text-only hero'} |
| Feature Icons | ${c.hasFeatureIcons ? '✅ YES - MUST INCLUDE' : '❌ NO'} | ${c.hasFeatureIcons ? 'Use Icons8 PNGs in colored circles' : 'No icons needed'} |
| Social Links | ${c.hasSocialLinks ? '✅ YES - MUST INCLUDE' : '❌ NO'} | ${c.hasSocialLinks ? 'Footer social icons' : 'Skip social section'} |
| CTA Button | ✅ ALWAYS | Style: ${c.ctaStyle || 'rounded'} corners |
| Section Dividers | ${c.dividerStyle !== 'none' ? '✅ YES' : '❌ NO'} | ${c.dividerStyle === 'line' ? 'Use <hr> or border-bottom' : c.dividerStyle === 'space' ? 'Use padding/margins' : 'No dividers'} |`);
  }

  sections.push(`\n---
## 🚨 DESIGN RECREATION CHECKLIST (Verify before outputting)
Before generating, mentally check:
- [ ] Does my layout match the reference's section order?
- [ ] Am I using the exact colors from the palette above?
- [ ] Does my hero section match their hero style?
- [ ] If they have icons, do I have icons in similar style?
- [ ] Is my spacing/density similar to theirs?
- [ ] Would someone looking at both see them as the "same design"?

**The generated email should be a FAITHFUL RECREATION that could pass as part of the same campaign as the reference image.**`);

  return sections.join('\n');
}

function validateEmail(html: string): { isValid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  const totalSize = Buffer.byteLength(html, 'utf8');

  if (totalSize > 102 * 1024) {
    warnings.push(`Size (${Math.round(totalSize / 1024)}KB) exceeds Gmail limit (102KB)`);
  }

  // CRITICAL ERRORS - These break email rendering
  if (/display\s*:\s*flex/i.test(html)) {
    errors.push('CRITICAL: display:flex detected - breaks in email clients. Use table-based layout.');
  }

  if (/display\s*:\s*grid/i.test(html)) {
    errors.push('CRITICAL: display:grid detected - breaks in email clients. Use table-based layout.');
  }

  if (/position\s*:\s*(absolute|relative|fixed)/i.test(html)) {
    errors.push('CRITICAL: CSS position detected - not supported in email clients.');
  }

  if (/float\s*:\s*(left|right)/i.test(html)) {
    errors.push('CRITICAL: CSS float detected - breaks in Outlook.');
  }

  if (!/<table/i.test(html)) {
    errors.push('No table layout detected - email will break in Outlook');
  }

  // Check for missing valign on icon layouts
  // Look for patterns where there's a td with width ~48-64 (icon) followed by td without valign
  const iconPatterns = html.match(/<td[^>]*width=["']?(4[8-9]|5[0-9]|6[0-4])["']?[^>]*>/gi);
  if (iconPatterns) {
    iconPatterns.forEach((match) => {
      if (!/valign/i.test(match)) {
        warnings.push('Icon cell missing valign="top" - may cause misalignment');
      }
    });
  }

  // Check for divs that should be tables
  if (/<div[^>]*style=["'][^"']*display\s*:\s*flex/i.test(html)) {
    errors.push('CRITICAL: div with display:flex found - use nested table with background-color instead');
  }

  // Check for emojis used as icons (hurts deliverability)
  // Common emoji ranges that might be used as icons
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
  const emojiMatches = html.match(emojiRegex);
  if (emojiMatches && emojiMatches.length > 0) {
    warnings.push(`Emojis detected (${emojiMatches.slice(0, 3).join('')}...) - use hosted PNG icons instead for better deliverability`);
  }

  // Check for responsive classes
  if (!html.includes('email-container')) {
    warnings.push('Missing class="email-container" - email may not be responsive');
  }

  // Check for media queries
  if (!/@media/i.test(html)) {
    warnings.push('No media queries found - email may not be mobile responsive');
  }

  // Check for URL variables using double braces (should be triple)
  const urlVarsWithDoubleBraces = html.match(/\{\{(unsubscribe|cta|track|action|redirect)\w*Url\}\}/gi);
  if (urlVarsWithDoubleBraces) {
    warnings.push('URL variables should use triple braces {{{url}}} in SuprSend');
  }

  // Check images have required attributes
  const images = html.match(/<img[^>]*>/gi) || [];
  images.forEach((img, index) => {
    if (!/alt=/i.test(img)) {
      warnings.push(`Image ${index + 1} missing alt attribute`);
    }
    if (!/style=["'][^"']*display\s*:\s*block/i.test(img)) {
      warnings.push(`Image ${index + 1} missing display:block style`);
    }
  });

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
