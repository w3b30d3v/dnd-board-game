// Claude AI Client
// Handles all interactions with Anthropic's Claude API

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';
import { logger } from './logger.js';

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropicClient = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }
  return anthropicClient;
}

// Message types for conversation
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason: string | null;
}

// Chat with Claude (Sonnet for conversation)
export async function chat(
  systemPrompt: string,
  messages: ConversationMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<ClaudeResponse> {
  const client = getClient();

  const { maxTokens = 4096, temperature = 0.7 } = options;

  logger.debug({ messageCount: messages.length }, 'Sending chat request to Claude');

  const response = await client.messages.create({
    model: config.claudeModelChat,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textContent = response.content.find((block) => block.type === 'text');
  const content = textContent?.type === 'text' ? textContent.text : '';

  logger.debug(
    {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    'Claude chat response received'
  );

  return {
    content,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    stopReason: response.stop_reason,
  };
}

// Generate content with Claude (Opus for high-quality generation)
export async function generate(
  systemPrompt: string,
  userPrompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<ClaudeResponse> {
  const client = getClient();

  const { maxTokens = 8192, temperature = 0.8 } = options;

  logger.debug('Sending generation request to Claude Opus');

  const response = await client.messages.create({
    model: config.claudeModelGeneration,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === 'text');
  const content = textContent?.type === 'text' ? textContent.text : '';

  logger.debug(
    {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    'Claude generation response received'
  );

  return {
    content,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    stopReason: response.stop_reason,
  };
}

// Structured JSON generation
export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: string,
  options: {
    maxTokens?: number;
  } = {}
): Promise<{ data: T; usage: { inputTokens: number; outputTokens: number } }> {
  const fullSystemPrompt = `${systemPrompt}

You must respond with valid JSON that matches this schema:
${schema}

Respond ONLY with the JSON object, no markdown code blocks or other text.`;

  const response = await generate(fullSystemPrompt, userPrompt, {
    maxTokens: options.maxTokens || 8192,
    temperature: 0.7,
  });

  // Parse JSON from response
  let data: T;
  try {
    // Try to extract JSON from the response
    let jsonStr = response.content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    data = JSON.parse(jsonStr);
  } catch (error) {
    logger.error({ content: response.content, error }, 'Failed to parse JSON from Claude response');
    throw new Error('Failed to parse JSON response from Claude');
  }

  return {
    data,
    usage: response.usage,
  };
}

// Estimate cost based on token usage
export function estimateCost(usage: { inputTokens: number; outputTokens: number }, model: 'chat' | 'generation'): number {
  // Pricing as of Jan 2025 (per 1M tokens)
  const pricing = {
    chat: {
      // Claude Sonnet 4
      input: 3.0,
      output: 15.0,
    },
    generation: {
      // Claude Opus 4
      input: 15.0,
      output: 75.0,
    },
  };

  const rates = pricing[model];
  const inputCost = (usage.inputTokens / 1_000_000) * rates.input;
  const outputCost = (usage.outputTokens / 1_000_000) * rates.output;

  return inputCost + outputCost;
}
