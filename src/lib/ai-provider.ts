import { db as prisma } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

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

  console.log('[AI Provider] Using z-ai-web-dev-sdk');
  
  try {
    // Use z-ai-web-dev-sdk which has built-in API keys
    const zai = await ZAI.create();
    
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: finalUserPrompt }
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    console.log('[AI Provider] z-ai-web-dev-sdk success');
    
    return {
      content: Object.keys(brandSubstitutions).length > 0 
        ? applyBrandSubstitutions(content, brandSubstitutions) 
        : content,
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model || 'z-ai-default',
    };
  } catch (error) {
    console.error('[AI Provider] z-ai-web-dev-sdk failed:', error);
    throw new Error('AI generation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
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
    // Google
    'google/gemini-pro-1.5': 0.00000125,
    'google/gemini-flash-1.5': 0.000000375,
    'gemini-1.5-pro': 0.00000125,
    'gemini-1.5-flash': 0.000000375,
  }
  
  const perToken = costs[model] || 0.000002;
  return tokensUsed * perToken;
}
