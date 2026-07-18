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
import { findRelevantContent } from '@/lib/ai/embedding';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
const apiKey = env.ZHIPU_API_KEY;
  if (!apiKey) throw new Error('Missing Zhipu API key');
  const zhipu = createOpenAICompatible({
    name: 'zhipu',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: apiKey,
  });
  const { messages }: { messages: UIMessage[] } = await req.json();

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: zhipu('GLM-4.6V'),
    messages: modelMessages,
    instructions: `You are a helpful assistant. Check your knowledge base before answering any questions.
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
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
    prepareStep(ctx) {
      console.log('ctx', ctx.instructions)
      return {}
    }
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}