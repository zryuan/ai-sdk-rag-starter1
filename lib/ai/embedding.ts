import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { env } from "@/lib/env.mjs";

const openai = createOpenAI({
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: env.ZHIPU_API_KEY,
});

const embeddingModel = openai.embedding('embedding-2');

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '');
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};