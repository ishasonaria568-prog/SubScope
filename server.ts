import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { validateDomain } from './src/lib/validation/domain.ts';
import { QUICK_WORDLIST, STANDARD_WORDLIST, FULL_WORDLIST, sanitizeWordlist } from './src/lib/scanner/wordlists.ts';
import { runControlledEnumeration } from './src/lib/scanner/core.ts';
import { checkRateLimit, markScanStarted, markScanEnded } from './src/lib/security/rateLimiter.ts';
import type { ScanProtocol, ScanSummary, ScanResultItem } from './src/types/scanner.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'SubScope Recon Engine',
      timestamp: new Date().toISOString(),
    });
  });

  // Streaming enumeration endpoint (SSE)
  app.post('/api/scan/stream', async (req, res) => {
    const rateLimit = checkRateLimit(req);
    if (!rateLimit.allowed) {
      if (rateLimit.retryAfter) {
        res.setHeader('Retry-After', rateLimit.retryAfter);
      }
      res.status(429).json({
        error: rateLimit.error || 'Rate limit exceeded. Please wait before initiating another scan.',
      });
      return;
    }

    const { domain, protocol = 'https', concurrency = 25, wordlistPreset = 'quick', customWordlist } = req.body || {};

    const validation = validateDomain(domain);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error || 'Invalid target domain' });
      return;
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
      res.status(400).json({ error: 'Please provide at least one valid subdomain candidate.' });
      return;
    }

    const safeConcurrency = Math.min(Math.max(Number(concurrency) || 25, 5), 100);
    const validProtocols: ScanProtocol[] = ['https', 'http', 'fallback'];
    const safeProtocol: ScanProtocol = validProtocols.includes(protocol) ? protocol : 'https';

    markScanStarted(req);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

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
      startedAt: new Date().toISOString(),
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
  });

  // Non-streaming fallback endpoint
  app.post('/api/scan', async (req, res) => {
    const rateLimit = checkRateLimit(req);
    if (!rateLimit.allowed) {
      if (rateLimit.retryAfter) {
        res.setHeader('Retry-After', rateLimit.retryAfter);
      }
      res.status(429).json({
        error: rateLimit.error || 'Rate limit exceeded. Please wait before initiating another scan.',
      });
      return;
    }

    const { domain, protocol = 'https', concurrency = 25, wordlistPreset = 'quick', customWordlist } = req.body || {};

    const validation = validateDomain(domain);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error || 'Invalid target domain' });
      return;
    }

    const normalizedDomain = validation.normalizedDomain;
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
      res.status(400).json({ error: 'Please provide at least one valid subdomain candidate.' });
      return;
    }

    const safeConcurrency = Math.min(Math.max(Number(concurrency) || 25, 5), 100);
    const validProtocols: ScanProtocol[] = ['https', 'http', 'fallback'];
    const safeProtocol: ScanProtocol = validProtocols.includes(protocol) ? protocol : 'https';

    markScanStarted(req);
    const startTime = Date.now();
    try {
      const results = await runControlledEnumeration({
        domain: normalizedDomain,
        candidates: candidateList,
        protocol: safeProtocol,
        concurrency: safeConcurrency,
        onProgress: () => {},
        onResult: () => {},
      });

      const endTime = Date.now();
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
        durationMs: endTime - startTime,
        totalChecked: candidateList.length,
        subdomainsFound: results.length,
        responsiveCount,
        httpsCount,
        httpCount,
        successfulCount,
        results,
      };

      res.json({ success: true, summary });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Scan failed';
      res.status(500).json({ error: errorMsg });
    } finally {
      markScanEnded(req);
    }
  });

  // Client serving setup
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SubScope Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
