import type { IncomingMessage, ServerResponse } from 'node:http';
import { validateDomain } from '../../src/lib/validation/domain.ts';
import { QUICK_WORDLIST, STANDARD_WORDLIST, FULL_WORDLIST, sanitizeWordlist } from '../../src/lib/scanner/wordlists.ts';
import { runControlledEnumeration } from '../../src/lib/scanner/core.ts';
import { checkRateLimit, markScanStarted, markScanEnded } from '../../src/lib/security/rateLimiter.ts';
import type { ScanProtocol, ScanSummary, ScanResultItem } from '../../src/types/scanner.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Rate Limiting & DoS Protection
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    if (rateLimit.retryAfter) {
      res.setHeader('Retry-After', rateLimit.retryAfter);
    }
    return res.status(429).json({
      error: rateLimit.error || 'Rate limit exceeded. Please wait before initiating another scan.',
    });
  }

  const { domain, protocol = 'https', concurrency = 25, wordlistPreset = 'quick', customWordlist } = req.body || {};

  const validation = validateDomain(domain);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error || 'Invalid target domain.' });
  }

  const normalizedDomain = validation.normalizedDomain;

  // Resolve candidate list
  let candidateList: string[] = [];
  if (wordlistPreset === 'custom' && customWordlist) {
    candidateList = sanitizeWordlist(customWordlist, 500);
  } else if (wordlistPreset === 'full') {
    candidateList = FULL_WORDLIST;
  } else if (wordlistPreset === 'standard') {
    candidateList = STANDARD_WORDLIST;
  } else {
    candidateList = QUICK_WORDLIST;
  }

  if (candidateList.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one valid subdomain candidate.' });
  }

  const safeConcurrency = Math.min(Math.max(Number(concurrency) || 25, 5), 100);
  const validProtocols: ScanProtocol[] = ['https', 'http', 'fallback'];
  const safeProtocol: ScanProtocol = validProtocols.includes(protocol) ? protocol : 'https';

  // Mark active scan
  markScanStarted(req);

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const abortController = new AbortController();
  req.on('close', () => {
    abortController.abort();
  });

  const sendEvent = (event: string, data: unknown) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const startTime = Date.now();
  sendEvent('init', {
    target: normalizedDomain,
    totalCandidates: candidateList.length,
    protocol: safeProtocol,
    concurrency: safeConcurrency,
    startedAt: new Date(startTime).toISOString(),
  });

  try {
    const results: ScanResultItem[] = await runControlledEnumeration({
      domain: normalizedDomain,
      candidates: candidateList,
      protocol: safeProtocol,
      concurrency: safeConcurrency,
      abortSignal: abortController.signal,
      onProgress: (progress) => {
        sendEvent('progress', progress);
      },
      onResult: (result) => {
        sendEvent('result', result);
      },
    });

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    let httpsCount = 0;
    let httpCount = 0;
    let successfulCount = 0;
    let responsiveCount = 0;

    for (const r of results) {
      if (r.protocol === 'HTTPS') httpsCount++;
      if (r.protocol === 'HTTP') httpCount++;
      if (r.status && r.status >= 200 && r.status < 300) successfulCount++;
      if (r.isResponsive) responsiveCount++;
    }

    const summary: ScanSummary = {
      target: normalizedDomain,
      protocol: safeProtocol,
      concurrency: safeConcurrency as any,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date(endTime).toISOString(),
      durationMs,
      totalChecked: candidateList.length,
      subdomainsFound: results.length,
      responsiveCount,
      httpsCount,
      httpCount,
      successfulCount,
      results,
    };

    sendEvent('complete', { summary });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Enumeration encountered an unexpected failure';
    sendEvent('error', { error: errorMsg });
  } finally {
    markScanEnded(req);
    res.end();
  }
}
