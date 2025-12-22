import { NextRequest, NextResponse } from 'next/server';

interface RequestBody {
  apiKey: string;
  prompt: string;
  width?: number;
  height?: number;
  style?: string;
}

// OpenRouter image generation using Gemini 2.5 Flash Image (Nano Banana)
// Uses chat completions endpoint with modalities parameter
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { apiKey, prompt, width = 1024, height = 1024, style = 'professional' } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key is required' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Enhance prompt for email-appropriate images
    const enhancedPrompt = `Generate an image: ${prompt}. Style: ${style}, professional quality, suitable for email marketing, clean composition, high resolution, photorealistic`;

    // Determine aspect ratio based on dimensions
    let aspectRatio = '1:1';
    const ratio = width / height;
    if (ratio >= 1.7) aspectRatio = '16:9';
    else if (ratio >= 1.4) aspectRatio = '3:2';
    else if (ratio >= 1.2) aspectRatio = '4:3';
    else if (ratio <= 0.6) aspectRatio = '9:16';
    else if (ratio <= 0.7) aspectRatio = '2:3';
    else if (ratio <= 0.85) aspectRatio = '3:4';

    console.log('Calling OpenRouter for image generation with Nano Banana 3 (Gemini 3 Pro Image)');
    console.log('Aspect ratio:', aspectRatio);

    // Call OpenRouter API with Nano Banana 3 (Gemini 3 Pro Image)
    // Uses chat completions endpoint with modalities parameter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Email Forge',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt,
          },
        ],
        modalities: ['image', 'text'],
        image_config: {
          aspect_ratio: aspectRatio,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter Image API error:', response.status, errorText);

      let errorMessage = 'Image generation failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || `OpenRouter error (${response.status})`;
      } catch {
        errorMessage = `OpenRouter error (${response.status}): ${errorText.slice(0, 200)}`;
      }

      // Check for specific error types
      if (response.status === 401) {
        errorMessage = 'OpenRouter API key is invalid or expired';
      } else if (response.status === 402) {
        errorMessage = 'Insufficient credits on OpenRouter account';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('OpenRouter image response received');

    // Extract image from response
    // Response format: choices[0].message.images[0].image_url.url (base64 data URL)
    const message = data.choices?.[0]?.message;

    if (message?.images && message.images.length > 0) {
      const imageUrl = message.images[0]?.image_url?.url;
      if (imageUrl) {
        return NextResponse.json({
          success: true,
          status: 'completed',
          imageUrl: imageUrl,
        });
      }
    }

    // Alternative: Check content array for image parts
    if (message?.content && Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          return NextResponse.json({
            success: true,
            status: 'completed',
            imageUrl: part.image_url.url,
          });
        }
      }
    }

    // Check if content is a string with base64 data
    if (message?.content && typeof message.content === 'string' && message.content.startsWith('data:image')) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        imageUrl: message.content,
      });
    }

    console.error('Unexpected response format:', JSON.stringify(data, null, 2));
    throw new Error('No image found in response. The model may not have generated an image.');
  } catch (error) {
    console.error('Image generation error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}

// GET endpoint not needed - Nano Banana generates synchronously
export async function GET() {
  return NextResponse.json({
    error: 'Use POST to generate images. Nano Banana generates synchronously.'
  }, { status: 400 });
}
