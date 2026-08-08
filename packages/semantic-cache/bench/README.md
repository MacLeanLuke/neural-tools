# Semantic separation benchmark

A semantic cache is only useful if its embedder can tell a paraphrase apart from
an unrelated prompt. This measures exactly that.

```bash
npm run bench              # the built-in hash placeholder
npx tsx bench/run.ts --openai   # OpenAI text-embedding-3-small
```

## Why two numbers, not one

A cache **miss** costs one model call. A **false hit** serves a wrong answer to
the user. Those failures are not comparable, so a single "hit rate" hides the one
that matters. The benchmark reports hit rate and false-hit rate separately across
a threshold sweep, and calls a threshold *usable* only when it catches at least
half the paraphrases with zero false hits.

## Result: the built-in placeholder cannot support semantic caching

`createEmbedding` in `@neural-tools/vector-db` maps a string hash across 384
dimensions. It is deterministic per exact input and carries no meaning.

```
paraphrase similarity   mean -0.0118   min -0.0495
distractor similarity   mean -0.0028   max  0.0515
separation              -0.0090
```

**The separation is negative.** Paraphrases score *lower* than unrelated prompts —
the signal isn't weak, it's absent. Across every threshold from 0.99 down to 0.50
the hit rate is 0%.

The practical consequence: with the default `similarityThreshold: 0.95`, the cache
only ever matches byte-identical prompts. It is an exact-match cache.

## What to do instead

Pass a real embedding model via `embedder`:

```ts
import { createSemanticCache } from '@neural-tools/semantic-cache';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const cache = createSemanticCache({
  embedder: async (text) => {
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: text,
    });
    return embedding;
  },
});
```

Then re-run the benchmark with `--openai` to pick a threshold from measured data
rather than by feel. Tune it so false-hit rate is 0 on your own prompts — the
right threshold is workload-specific, which is the reason this is a benchmark you
run and not a constant someone hardcodes.

## Fixtures

`pairs.json` holds ten paraphrase pairs and ten distractor pairs sharing the same
left-hand prompts, so the two sets differ only in whether the right-hand prompt
means the same thing. Add your own production prompts before choosing a threshold.
