import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createEmbedding } from '@neural-tools/vector-db';

/**
 * Measures whether an embedder can actually separate paraphrases from unrelated
 * text — the only property that makes a semantic cache "semantic".
 *
 *   npx tsx bench/run.ts              # the built-in hash placeholder
 *   npx tsx bench/run.ts --openai     # OpenAI text-embedding-3-small
 *
 * A cache miss costs one model call. A false hit serves a *wrong answer* to the
 * user, so both are reported separately — a single "hit rate" hides the failure
 * that actually matters.
 */

type Embedder = (text: string) => Promise<number[]> | number[];

interface Pairs {
  paraphrases: [string, string][];
  distractors: [string, string][];
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return dot;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

async function scoreAll(pairs: [string, string][], embed: Embedder): Promise<number[]> {
  const scores: number[] = [];
  for (const [a, b] of pairs) {
    scores.push(cosine(await embed(a), await embed(b)));
  }
  return scores;
}

async function loadOpenAiEmbedder(): Promise<Embedder> {
  const { openai } = await import('@ai-sdk/openai');
  const { embed } = await import('ai');
  return async (text: string) => {
    const { embedding } = await embed({ model: openai.embedding('text-embedding-3-small'), value: text });
    return embedding;
  };
}

async function main(): Promise<void> {
  const useOpenAi = process.argv.includes('--openai');
  const label = useOpenAi ? 'openai/text-embedding-3-small' : 'built-in hash placeholder';
  const embed: Embedder = useOpenAi ? await loadOpenAiEmbedder() : createEmbedding;

  const pairs = JSON.parse(readFileSync(join(__dirname, 'pairs.json'), 'utf-8')) as Pairs;

  const paraphrase = await scoreAll(pairs.paraphrases, embed);
  const distractor = await scoreAll(pairs.distractors, embed);

  console.log(`\nSemantic separation — ${label}`);
  console.log('='.repeat(62));
  console.log(`  paraphrase similarity   mean ${mean(paraphrase).toFixed(4)}   min ${Math.min(...paraphrase).toFixed(4)}`);
  console.log(`  distractor similarity   mean ${mean(distractor).toFixed(4)}   max ${Math.max(...distractor).toFixed(4)}`);

  const separation = mean(paraphrase) - mean(distractor);
  console.log(`  separation              ${separation.toFixed(4)}`);
  console.log('');

  console.log('  threshold   hit rate   false-hit rate   usable');
  console.log('  ' + '-'.repeat(50));

  let anyUsable = false;
  for (const threshold of [0.99, 0.95, 0.9, 0.85, 0.8, 0.7, 0.5]) {
    const hits = paraphrase.filter((s) => s >= threshold).length / paraphrase.length;
    const falseHits = distractor.filter((s) => s >= threshold).length / distractor.length;
    const usable = hits >= 0.5 && falseHits === 0;
    if (usable) anyUsable = true;
    console.log(
      `  ${threshold.toFixed(2).padEnd(11)} ${(hits * 100).toFixed(0).padStart(5)}%     ` +
        `${(falseHits * 100).toFixed(0).padStart(8)}%        ${usable ? 'yes' : 'no'}`,
    );
  }

  console.log('');
  if (anyUsable) {
    console.log('  At least one threshold catches most paraphrases with no false hits.');
  } else {
    console.log('  NO usable threshold: every setting either misses most paraphrases');
    console.log('  or admits unrelated prompts. This embedder cannot support semantic');
    console.log('  caching — the cache degrades to exact string matching.');
  }
  console.log('');

  if (!anyUsable && !useOpenAi) process.exitCode = 0; // documenting the baseline, not a build failure
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
