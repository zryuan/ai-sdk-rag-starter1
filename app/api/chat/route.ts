import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  UIMessage,
} from 'ai';
import { chatAgent } from '@/lib/agent/chat'

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);
  const result = await chatAgent.stream({
    messages: modelMessages,
  });
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}