import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  UIMessage,
  isStepCount,
  tool,
} from 'ai';
import { env } from "@/lib/env.mjs";
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { createResource } from '@/lib/actions/resources';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('Missing DeepSeek API key');
  const deepseek = createOpenAICompatible({
    name: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey,
  });
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: deepseek('deepseek-v4-flash'),
    messages: await convertToModelMessages(messages),
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    stopWhen: isStepCount(10),
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}