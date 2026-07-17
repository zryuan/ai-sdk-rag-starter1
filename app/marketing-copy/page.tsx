'use client';

import { useState } from 'react';

interface Result {
  copy: string;
  qualityMetrics: {
    hasCallToAction: boolean;
    emotionalAppeal: number;
    clarity: number;
  };
}

export default function MarketingCopyPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      console.log('res', res);
      if (!res.ok) {
        const err = await res.text();
        console.error('API error:', err);
        return;
      }
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl py-24 mx-auto stretch">
      <h1 className="text-2xl font-bold mb-6">营销文案生成</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <input
          className="w-full p-3 border border-gray-300 rounded shadow-sm"
          value={input}
          placeholder="描述你的营销需求..."
          onChange={(e) => setInput(e.currentTarget.value)}
          disabled={loading}
        />
      </form>

      {loading && <p className="text-gray-500">生成中...</p>}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-white border rounded shadow-sm">
            <h2 className="text-lg font-bold mb-2">生成文案</h2>
            <p className="whitespace-pre-wrap">{result.copy}</p>
          </div>
          <div className="p-4 bg-zinc-50 border rounded shadow-sm">
            <h2 className="text-lg font-bold mb-2">质量评估</h2>
            <ul className="space-y-1 text-sm">
              <li>号召行动: {result.qualityMetrics.hasCallToAction ? '✅' : '❌'}</li>
              <li>情感吸引力: {'⭐'.repeat(result.qualityMetrics.emotionalAppeal)} ({result.qualityMetrics.emotionalAppeal}/10)</li>
              <li>清晰度: {'⭐'.repeat(result.qualityMetrics.clarity)} ({result.qualityMetrics.clarity}/10)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
