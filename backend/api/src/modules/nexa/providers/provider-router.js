'use strict';

const groqProvider = require('./groq.provider');
const geminiProvider = require('./gemini.provider');

const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 60 * 1000;

const circuitState = {
  groq: { failures: 0, openUntil: 0 },
  gemini: { failures: 0, openUntil: 0 },
};

function isCircuitOpen(name) {
  const st = circuitState[name];
  if (!st) return false;
  if (st.openUntil > Date.now()) return true;
  if (st.openUntil > 0 && st.openUntil <= Date.now()) {
    st.failures = 0;
    st.openUntil = 0;
  }
  return false;
}

function recordSuccess(name) {
  if (circuitState[name]) {
    circuitState[name].failures = 0;
    circuitState[name].openUntil = 0;
  }
}

function recordFailure(name) {
  const st = circuitState[name];
  if (!st) return;
  st.failures += 1;
  if (st.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    st.openUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
  }
}

/**
 * Selects ordered providers based on task complexity, language, and circuit health.
 * Gemini is prioritized for Kannada/Hindi multilingual nuance when configured;
 * Groq is prioritized for ultra-low-latency English/fast responses.
 */
function selectProviders({ language = 'en', complexity = 'balanced' } = {}) {
  const all = [groqProvider, geminiProvider];
  const preferredOrder =
    (language === 'kn' || language === 'hi') && geminiProvider.isConfigured()
      ? [geminiProvider, groqProvider]
      : complexity === 'complex' && geminiProvider.isConfigured()
        ? [groqProvider, geminiProvider]
        : [groqProvider, geminiProvider];

  return preferredOrder.filter((p) => p.isConfigured() && !isCircuitOpen(p.name));
}

async function routeGenerate({ messages, maxTokens = 450, temperature = 0.25, language = 'en', complexity = 'balanced', signal }) {
  const providers = selectProviders({ language, complexity });
  if (providers.length === 0) {
    return { provider: 'fallback', model: 'none', text: null, fallbackUsed: true, usage: { inputTokens: 0, outputTokens: 0 } };
  }

  let lastError = null;
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      const result = await provider.generate({
        messages,
        maxTokens,
        temperature,
        tier: complexity === 'fast' ? 'fast' : 'balanced',
        signal,
      });
      recordSuccess(provider.name);
      return {
        ...result,
        fallbackUsed: i > 0,
      };
    } catch (err) {
      if (signal?.aborted) throw err;
      recordFailure(provider.name);
      lastError = err;
      console.warn(`[Nexa ProviderRouter] ${provider.name} failed: ${err.message}`);
    }
  }

  return {
    provider: 'fallback',
    model: 'none',
    text: null,
    fallbackUsed: true,
    error: lastError?.message || 'All providers failed',
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}

async function* routeGenerateStream({ messages, maxTokens = 450, temperature = 0.25, language = 'en', complexity = 'balanced', signal }) {
  const providers = selectProviders({ language, complexity });
  if (providers.length === 0) return;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    let emittedAny = false;
    try {
      for await (const chunk of provider.generateStream({
        messages,
        maxTokens,
        temperature,
        tier: complexity === 'fast' ? 'fast' : 'balanced',
        signal,
      })) {
        emittedAny = true;
        yield { ...chunk, fallbackUsed: i > 0 };
      }
      recordSuccess(provider.name);
      return;
    } catch (err) {
      if (signal?.aborted) throw err;
      recordFailure(provider.name);
      console.warn(`[Nexa ProviderRouter] Stream ${provider.name} failed: ${err.message}`);
      if (emittedAny) {
        // Do not mix partial streams from two different providers
        throw err;
      }
    }
  }
}

function getProviderStatus() {
  return {
    groq: { configured: groqProvider.isConfigured(), circuitOpen: isCircuitOpen('groq') },
    gemini: { configured: geminiProvider.isConfigured(), circuitOpen: isCircuitOpen('gemini') },
  };
}

module.exports = {
  routeGenerate,
  routeGenerateStream,
  getProviderStatus,
  selectProviders,
  _circuitState: circuitState,
};
