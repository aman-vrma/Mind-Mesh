/**
 * Shared utilities for the LOCAL MOCK AI MODE providers.
 * No network calls, no API keys, nothing here ever touches the internet.
 */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fixedMockDelay(stageKey, fallbackMs) {
  const envVal = process.env[`AI_MOCK_DELAY_${stageKey}_MS`];
  const parsed = envVal !== undefined ? parseInt(envVal, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallbackMs;
}

function rangedMockDelay(stageKey, fallbackMin, fallbackMax) {
  const minEnv = process.env[`AI_MOCK_DELAY_${stageKey}_MIN_MS`];
  const maxEnv = process.env[`AI_MOCK_DELAY_${stageKey}_MAX_MS`];
  const min = Number.isFinite(parseInt(minEnv, 10)) ? parseInt(minEnv, 10) : fallbackMin;
  const max = Number.isFinite(parseInt(maxEnv, 10)) ? parseInt(maxEnv, 10) : fallbackMax;
  return randomDelay(min, max);
}

function extractSections(text, labels) {
  const source = text || '';
  const found = labels
    .map((label) => ({ label, idx: source.indexOf(label) }))
    .filter((x) => x.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  const result = {};
  for (let i = 0; i < found.length; i++) {
    const start = found[i].idx + found[i].label.length;
    const end = i + 1 < found.length ? found[i + 1].idx : source.length;
    let value = source.slice(start, end).trim();
    value = value.replace(/^:\s*/, '');
    value = value.replace(/^"([\s\S]*)"$/, '$1');
    result[found[i].label] = value.trim();
  }
  return result;
}

function extractField(text, label) {
  const sections = extractSections(text, [label]);
  return sections[label] || '';
}

module.exports = {
  delay,
  randomDelay,
  fixedMockDelay,
  rangedMockDelay,
  extractSections,
  extractField,
};