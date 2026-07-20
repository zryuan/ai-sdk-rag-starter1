import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { env } from '@/lib/env.mjs';

const createZhipu = () => {
  const apiKey = env.ZHIPU_API_KEY;
  if (!apiKey) throw new Error('Missing Zhipu API key');
  const zhipu = createOpenAICompatible({
    name: 'zhipu',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey,
  });
  return zhipu;
};

export const zhipu = createZhipu();
