export function softmax(scores: number[], temperature = 1): number[] {
  if (!scores.length || scores.some(x => !Number.isFinite(x))) throw new Error('Scores must be finite and nonempty');
  if (!Number.isFinite(temperature) || temperature <= 0) throw new Error('Temperature must be positive');
  const max = Math.max(...scores);
  const exp = scores.map(x => Math.exp((x - max) / temperature));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(x => x / sum);
}
export function dot(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length || [...a, ...b].some(x => !Number.isFinite(x))) throw new Error('Vector dimensions must match and values must be finite');
  return a.reduce((sum, x, i) => sum + x * b[i], 0);
}
export function scaledAttention(query: number[], keys: number[][], values: number[][], temperature = 1) {
  if (keys.length !== values.length || !values.length || !values[0].length || values.some(v => v.length !== values[0].length || v.some(x => !Number.isFinite(x)))) throw new Error('Invalid values');
  const scores = keys.map(key => dot(query, key) / Math.sqrt(query.length));
  const weights = softmax(scores, temperature);
  const output = values[0].map((_, d) => values.reduce((sum, v, i) => sum + weights[i] * v[d], 0));
  return { scores, weights, output };
}
// Fixed illustrative embeddings and projections, not weights from a trained model.
const embeddings = [[1, .2, .1, .4], [.2, 1, .4, .1], [.4, .3, 1, .2], [.1, .6, .2, 1], [.8, .2, .5, .3], [.2, .8, .6, .4]];
export function toyAttention(queryIndex: number, temperature = 1, head = 0) {
  if (!Number.isInteger(queryIndex) || queryIndex < 0 || queryIndex >= embeddings.length) throw new Error('Invalid token');
  const project = (v: number[], key: boolean) => v.map((_, d) => v[(d + head + (key ? 1 : 0)) % v.length] * (1 + ((d + head) % 3)));
  return scaledAttention(project(embeddings[queryIndex], false), embeddings.map(v => project(v, true)), embeddings, temperature);
}
