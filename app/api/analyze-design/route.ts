import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const DESIGN_ANALYSIS_PROMPT = `You are an expert email designer analyzing a reference image to extract design characteristics.
Analyze this email design image and extract the following design tokens that can be used to generate a similar-styled email.

Return a JSON object with this EXACT structure:
{
  "colorPalette": {
    "primary": "#hex - dominant brand/header color",
    "secondary": "#hex - secondary/background color",
    "accent": "#hex - CTA button or highlight color",
    "background": "#hex - main background color",
    "text": "#hex - primary text color",
    "mutedText": "#hex - secondary/subtle text color"
  },
  "typography": {
    "headlineStyle": "serif | sans-serif | display",
    "bodyStyle": "serif | sans-serif",
    "headlineWeight": "normal | medium | semibold | bold | extrabold",
    "sizeContrast": "low | medium | high - difference between headline and body sizes"
  },
  "layout": {
    "structure": "single-column | two-column | mixed",
    "alignment": "left | center | mixed",
    "density": "spacious | balanced | compact",
    "heroStyle": "image-full | image-contained | text-only | split"
  },
  "aesthetic": {
    "direction": "minimal | modern | elegant | bold | playful | corporate | editorial",
    "mood": "one word describing the overall feel",
    "distinctiveElements": ["list", "of", "notable", "design", "features"]
  },
  "components": {
    "hasHeroImage": true/false,
    "hasFeatureIcons": true/false,
    "hasSocialLinks": true/false,
    "ctaStyle": "pill | rounded | square | outlined",
    "dividerStyle": "line | space | color-block | none"
  },
  "summary": "2-3 sentence description of the design style that captures its essence"
}

Be precise with color extraction - try to identify the exact hex values visible in the design.
For typography, describe what you see rather than guessing specific fonts.
Return ONLY the JSON object, no additional text.`;

interface RequestBody {
  apiKey: string;
  imageData: string; // base64 encoded image
  imageType: string; // mime type like image/png
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { apiKey, imageData, imageType } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    // Use Claude's vision capability to analyze the image
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                data: imageData,
              },
            },
            {
              type: 'text',
              text: DESIGN_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract the text response
    let analysisText = '';
    if (response.content[0].type === 'text') {
      analysisText = response.content[0].text;
    }

    // Parse the JSON response
    let designTokens;
    try {
      // Clean up the response if it has markdown code blocks
      const cleaned = analysisText
        .replace(/^```json\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
      designTokens = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse design analysis', raw: analysisText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      designTokens,
    });
  } catch (error) {
    console.error('Design analysis error:', error);

    if (error instanceof Error) {
      if (error.message.includes('api_key') || error.message.includes('authentication')) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Design analysis failed' }, { status: 500 });
  }
}
