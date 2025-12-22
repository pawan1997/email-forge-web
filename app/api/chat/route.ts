import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  apiKey: string;
  currentHtml: string;
  messages: ChatMessage[];
  newMessage: string;
  context: {
    brandName: string;
    emailType: string;
    tone: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    industry?: string;
  };
}

const CHAT_SYSTEM_PROMPT = `You are an expert email template editor helping to iterate on an existing HTML email template.

## Your Role
You help users modify their email templates based on their instructions. You understand HTML email constraints and SuprSend requirements.

## Rules
1. When asked to make changes, output the COMPLETE updated HTML (not just the changed parts)
2. Preserve all existing SuprSend variables: {{variable}} for text, {{{url}}} for URLs, {{$hosted_preference_url}} for unsubscribe
3. Preserve ALL block markers: <!-- BLOCK:type -->...<!-- /BLOCK:type -->
4. Maintain email client compatibility (tables for layout, inline styles, no flexbox/grid)
5. Keep the same overall structure unless specifically asked to change it
6. Use table-based layouts, max 600px width
7. Maintain MSO conditionals for Outlook

## Response Format
ALWAYS respond in this exact format:

<html>
[COMPLETE HTML EMAIL HERE - from <!DOCTYPE html> to </html>]
</html>

<explanation>
[Brief description of what you changed - 1-3 sentences max]
</explanation>

## Important
- Output the FULL HTML every time, not just snippets
- Do NOT use markdown code fences inside the <html> tags
- Keep all block comment markers intact
- If you can't make a change, explain why in the explanation section`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { apiKey, currentHtml, messages, newMessage, context } = body;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!currentHtml || !newMessage) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new Anthropic({ apiKey });

    // Build conversation with context
    const systemPrompt = `${CHAT_SYSTEM_PROMPT}

## Current Template Context
- Brand: ${context.brandName}
- Email Type: ${context.emailType}
- Tone: ${context.tone}
- Primary Color: ${context.primaryColor}
- Secondary Color: ${context.secondaryColor}
${context.accentColor ? `- Accent Color: ${context.accentColor}` : ''}
${context.industry ? `- Industry: ${context.industry}` : ''}`;

    // Build message history
    const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add the current HTML as context in the first user message
    conversationMessages.push({
      role: 'user',
      content: `Here is the current email template:\n\n${currentHtml}\n\nPlease help me make changes to this template.`,
    });

    // Add a placeholder assistant acknowledgment
    conversationMessages.push({
      role: 'assistant',
      content: 'I can see your email template. What changes would you like me to make?',
    });

    // Add previous conversation messages
    for (const msg of messages) {
      conversationMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add the new user message
    conversationMessages.push({
      role: 'user',
      content: newMessage,
    });

    // Create streaming response
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,  // Large to accommodate full HTML
      system: systemPrompt,
      messages: conversationMessages,
    });

    // Create a TransformStream to process the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';

          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if ('text' in delta) {
                fullResponse += delta.text;
                // Send chunk to client
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: delta.text })}\n\n`)
                );
              }
            }
          }

          // Parse the final response
          const htmlMatch = fullResponse.match(/<html>([\s\S]*?)<\/html>/);
          const explanationMatch = fullResponse.match(/<explanation>([\s\S]*?)<\/explanation>/);

          const result = {
            type: 'complete',
            html: htmlMatch ? htmlMatch[1].trim() : null,
            explanation: explanationMatch ? explanationMatch[1].trim() : 'Changes applied.',
            fullResponse,
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Streaming failed' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof Error) {
      if (error.message.includes('api_key') || error.message.includes('authentication')) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
