import { NextRequest, NextResponse } from 'next/server';
import { GeneratedPoster, POSTER_SIZE_DIMENSIONS, PosterSize } from '../../types/poster';

// OpenRouter API key from environment variable
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

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

function buildCompletionPrompt(
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

// OpenRouter API call
async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 16000
): Promise<string> {
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
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenRouter API error (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstSlide, // The selected first slide HTML
      prompt, // Original prompt
      profile, // Profile data
      totalSlides, // How many slides total
      variantIndex, // Which variant was selected
      size = 'instagram-square',
    } = body;

    if (!firstSlide || !prompt || !profile) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: firstSlide, prompt, profile'
      }, { status: 400 });
    }

    const dimensions = POSTER_SIZE_DIMENSIONS[size as Exclude<PosterSize, 'custom'>] || POSTER_SIZE_DIMENSIONS['instagram-square'];
    const slideCount = totalSlides || 5;

    const apiKey = body.openRouterApiKey || OPENROUTER_API_KEY;
    const model = 'google/gemini-3-pro-preview';

    // Helper to clean HTML
    const cleanHtml = (html: string): string => {
      html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      if (!html.startsWith('<!DOCTYPE')) {
        const idx = html.indexOf('<!DOCTYPE');
        if (idx !== -1) html = html.substring(idx);
      }
      return html;
    };

    // Build prompt for remaining slides
    const completionPrompt = buildCompletionPrompt(
      firstSlide,
      prompt,
      {
        display_name: profile.display_name,
        username: profile.username,
        profile_pic: profile.profile_pic,
      },
      dimensions,
      slideCount
    );

    const response = await callOpenRouter(
      apiKey,
      model,
      CAROUSEL_COMPLETION_SYSTEM_PROMPT,
      completionPrompt,
      20000
    );

    // Parse the response as JSON array
    let remainingSlides: string[] = [];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        remainingSlides = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found');
      }
    } catch {
      // Fallback: split by DOCTYPE
      const parts = response.split(/(?=<!DOCTYPE)/i).filter(p => p.trim().startsWith('<!DOCTYPE'));
      remainingSlides = parts.map(p => cleanHtml(p));
    }

    remainingSlides = remainingSlides.map(h => cleanHtml(h));

    if (remainingSlides.length === 0) {
      throw new Error('Failed to generate remaining slides');
    }

    // Combine first slide + remaining slides into complete carousel
    const allSlides: GeneratedPoster[] = [
      {
        html: firstSlide,
        dimensions,
        style: 'professional',
        topmateProfile: profile,
        generatedAt: new Date().toISOString(),
        slideIndex: 0,
        variantIndex: variantIndex || 0,
      },
      ...remainingSlides.map((html, index) => ({
        html,
        dimensions,
        style: 'professional' as const,
        topmateProfile: profile,
        generatedAt: new Date().toISOString(),
        slideIndex: index + 1,
        variantIndex: variantIndex || 0,
      })),
    ];

    return NextResponse.json({
      success: true,
      slides: allSlides,
      slideCount: allSlides.length,
    });

  } catch (error) {
    console.error('Carousel completion error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete carousel'
    }, { status: 500 });
  }
}
