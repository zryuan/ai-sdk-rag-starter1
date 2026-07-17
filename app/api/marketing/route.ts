import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { env } from "@/lib/env.mjs";

const zhipu = createOpenAICompatible({
  name: 'zhipu',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: env.ZHIPU_API_KEY,
});

export const maxDuration = 60;

// 手动解析模型返回的 JSON（因为 GLM-4.6V 不支持 Output.object）
function parseQualityMetrics(text: string) {
  // 尝试从文本中提取 JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // 解析失败返回默认值
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    if (!input) {
      return Response.json({ error: 'Input is required' }, { status: 400 });
    }

    const model = zhipu('GLM-5.2');

    // First step: Generate marketing copy
    const { text: copy } = await generateText({
      model,
      prompt: `Write persuasive marketing copy for: ${input}. Focus on benefits and emotional appeal.`,
    });

    // Perform quality check on copy (使用纯文本 + 手动解析 JSON)
    const { text: qualityText } = await generateText({
      model,
      prompt: `Evaluate this marketing copy and return ONLY a JSON object (no other text):
{
  "hasCallToAction": true/false,
  "emotionalAppeal": number (1-10),
  "clarity": number (1-10)
}

Copy to evaluate: ${copy}`,
    });

    const qualityMetrics = parseQualityMetrics(qualityText) || {
      hasCallToAction: false,
      emotionalAppeal: 5,
      clarity: 5,
    };

    // If quality check fails, regenerate with more specific instructions
    if (
      !qualityMetrics.hasCallToAction ||
      qualityMetrics.emotionalAppeal < 7 ||
      qualityMetrics.clarity < 7
    ) {
      const { text: improvedCopy } = await generateText({
        model,
        prompt: `Rewrite this marketing copy with:
      ${!qualityMetrics.hasCallToAction ? '- A clear call to action' : ''}
      ${qualityMetrics.emotionalAppeal < 7 ? '- Stronger emotional appeal' : ''}
      ${qualityMetrics.clarity < 7 ? '- Improved clarity and directness' : ''}

      Original copy: ${copy}`,
      });
      return Response.json({ copy: improvedCopy, qualityMetrics });
    }
    console.log('marketing copy:', copy, qualityMetrics);
    return Response.json({ copy, qualityMetrics });
  } catch (error) {
    console.error('Marketing copy error:', error);
    return Response.json(
      { error: 'Failed to generate marketing copy' },
      { status: 500 },
    );
  }
}
