import { ToolLoopAgent } from 'ai';
import { openai } from "@ai-sdk/openai";
import { z } from 'zod';

const supportAgent = new ToolLoopAgent({
  model: openai("gpt-5.5"),
  callOptionsSchema: z.object({
    userId: z.string(),
    accountType: z.enum(['free', 'pro', 'enterprise']),
  }),
  instructions: 'You are a helpful customer support agent.',
  prepareCall: ({ options, ...settings }) => ({
    ...settings,
    instructions:
      settings.instructions +
      `\nUser context:
- Account type: ${options.accountType}
- User ID: ${options.userId}

Adjust your response based on the user's account level.`,
  }),
});

// Call the agent with specific user context
const result = await supportAgent.generate({
  prompt: 'How do I upgrade my account?',
  options: {
    userId: 'user_123',
    accountType: 'free',
  },
});