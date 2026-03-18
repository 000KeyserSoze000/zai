import { db as prisma } from '@/lib/db';

export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * Fetches the user's business profile and returns a map of brand tags to values.
 */
export async function getBrandSubstitutions(userId: string): Promise<Record<string, string>> {
  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { userId }
    });

    if (profile) {
      return {
        '{{MARCA}}': profile.brandName || '',
        '{{SOCIETE}}': profile.companyName || '',
        '{{CLIENTE}}': profile.targetAudience || '',
        '{{AUDIENCE}}': profile.targetAudience || '',
        '{{OFFRE}}': profile.valueProposition || '',
        '{{TON}}': profile.toneOfVoice || '',
      };
    }
  } catch (error) {
    console.error('[AI Provider] Error fetching substitutions:', error);
  }
  return {};
}

/**
 * Replaces all brand tags in a text string.
 */
export function applyBrandSubstitutions(text: string, substitutions: Record<string, string>): string {
  if (!text) return text;
  let result = text;
  Object.entries(substitutions).forEach(([tag, value]) => {
    if (value) {
      const regex = new RegExp(tag, 'g');
      result = result.replace(regex, value);
    }
  });
  return result;
}

export async function generateAIResponse(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    userId?: string; 
  } = {}
): Promise<AIResponse> {
  let finalSystemPrompt = systemPrompt;
  let finalUserPrompt = userPrompt;
  let brandSubstitutions: Record<string, string> = {};

  if (options.userId) {
    brandSubstitutions = await getBrandSubstitutions(options.userId);
    finalSystemPrompt = applyBrandSubstitutions(systemPrompt, brandSubstitutions);
    finalUserPrompt = applyBrandSubstitutions(userPrompt, brandSubstitutions);
  }

  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 4000;

  console.log('[AI Provider] ========== STARTING AI GENERATION ==========');
  console.log('[AI Provider] System prompt length:', finalSystemPrompt.length);
  console.log('[AI Provider] User prompt length:', finalUserPrompt.length);
  console.log('[AI Provider] Temperature:', temperature);
  console.log('[AI Provider] Max tokens:', maxTokens);

  // Get API key from environment
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  console.log('[AI Provider] Google AI Key exists:', !!googleApiKey);
  console.log('[AI Provider] Anthropic Key exists:', !!anthropicApiKey);
  console.log('[AI Provider] OpenAI Key exists:', !!openaiApiKey);

  // Try Google AI first (free tier available)
  if (googleApiKey) {
    try {
      console.log('[AI Provider] Trying Google AI (Gemini)...');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: finalSystemPrompt + '\n\n' + finalUserPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Provider] Google AI error:', errorText);
        throw new Error(`Google AI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('[AI Provider] ========== AI GENERATION SUCCESS (Google AI) ==========');
      console.log('[AI Provider] Response length:', content.length);
      console.log('[AI Provider] Response preview:', content.slice(0, 200));
      
      return {
        content: Object.keys(brandSubstitutions).length > 0 
          ? applyBrandSubstitutions(content, brandSubstitutions) 
          : content,
        tokensUsed: data.usageMetadata?.totalTokenCount || Math.ceil((finalSystemPrompt.length + finalUserPrompt.length + content.length) / 4),
        model: 'google/gemini-2.0-flash',
      };
    } catch (error) {
      console.error('[AI Provider] Google AI failed:', error);
      // Continue to next provider
    }
  }

  // Try Anthropic Claude
  if (anthropicApiKey) {
    try {
      console.log('[AI Provider] Trying Anthropic Claude...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system: finalSystemPrompt,
          messages: [
            { role: 'user', content: finalUserPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Provider] Anthropic error:', errorText);
        throw new Error(`Anthropic error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      
      console.log('[AI Provider] ========== AI GENERATION SUCCESS (Anthropic) ==========');
      console.log('[AI Provider] Response length:', content.length);
      console.log('[AI Provider] Response preview:', content.slice(0, 200));
      
      return {
        content: Object.keys(brandSubstitutions).length > 0 
          ? applyBrandSubstitutions(content, brandSubstitutions) 
          : content,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || Math.ceil((finalSystemPrompt.length + finalUserPrompt.length + content.length) / 4),
        model: 'anthropic/claude-sonnet-4',
      };
    } catch (error) {
      console.error('[AI Provider] Anthropic failed:', error);
      // Continue to next provider
    }
  }

  // Try OpenAI
  if (openaiApiKey) {
    try {
      console.log('[AI Provider] Trying OpenAI...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: maxTokens,
          temperature: temperature,
          messages: [
            { role: 'system', content: finalSystemPrompt },
            { role: 'user', content: finalUserPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Provider] OpenAI error:', errorText);
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      console.log('[AI Provider] ========== AI GENERATION SUCCESS (OpenAI) ==========');
      console.log('[AI Provider] Response length:', content.length);
      console.log('[AI Provider] Response preview:', content.slice(0, 200));
      
      return {
        content: Object.keys(brandSubstitutions).length > 0 
          ? applyBrandSubstitutions(content, brandSubstitutions) 
          : content,
        tokensUsed: data.usage?.total_tokens || Math.ceil((finalSystemPrompt.length + finalUserPrompt.length + content.length) / 4),
        model: 'openai/gpt-4o-mini',
      };
    } catch (error) {
      console.error('[AI Provider] OpenAI failed:', error);
    }
  }

  // No API keys available
  console.error('[AI Provider] ========== AI GENERATION FAILED ==========');
  console.error('[AI Provider] No valid API keys configured or all providers failed');
  throw new Error('No AI API keys configured. Please set GOOGLE_AI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in your environment.');
}

export function calculateCost(model: string, tokensUsed: number): number {
  const costs: Record<string, number> = {
    // OpenAI
    'openai/gpt-4o': 0.000015,
    'openai/gpt-4o-mini': 0.0000015,
    'gpt-4o': 0.000015,
    'gpt-4o-mini': 0.0000015,
    // Anthropic
    'anthropic/claude-3-5-sonnet': 0.000003,
    'anthropic/claude-3-5-sonnet-20241022': 0.000003,
    'claude-3-5-sonnet-20241022': 0.000003,
    'claude-3-5-sonnet-20240620': 0.000003,
    'anthropic/claude-3-opus': 0.000015,
    'claude-3-opus-20240229': 0.000015,
    'anthropic/claude-3-haiku': 0.00000025,
    'claude-3-haiku-20240307': 0.00000025,
    'anthropic/claude-sonnet-4': 0.000003,
    'claude-sonnet-4-20250514': 0.000003,
    // Google
    'google/gemini-pro-1.5': 0.00000125,
    'google/gemini-flash-1.5': 0.000000375,
    'google/gemini-2.0-flash': 0.0000001,
    'gemini-1.5-pro': 0.00000125,
    'gemini-1.5-flash': 0.000000375,
    'gemini-2.0-flash': 0.0000001,
  }
  
  const perToken = costs[model] || 0.000002;
  return tokensUsed * perToken;
}
