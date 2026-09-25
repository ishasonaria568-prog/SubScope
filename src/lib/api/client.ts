import type {
  ScanRequestConfig,
  ScanResultItem,
  ScanSummary,
  ScanProgress,
} from '../../types/scanner';

export interface ScanStreamCallbacks {
  onInit?: (data: { target: string; totalCandidates: number; protocol: string }) => void;
  onProgress?: (
    progress: ScanProgress & {
      active: boolean;
      status: number | null;
      responseTime: number | null;
    }
  ) => void;
  onResult?: (result: ScanResultItem) => void;
  onComplete?: (summary: ScanSummary) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

/**
 * Executes a streaming subdomain enumeration request over SSE/ReadableStream.
 */
export async function startSubdomainScan(
  config: ScanRequestConfig,
  callbacks: ScanStreamCallbacks
): Promise<void> {
  const startTime = Date.now();
  let elapsedTimer: any = null;

  try {
    const response = await fetch('/api/scan/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
      signal: callbacks.signal,
    });

    if (!response.ok) {
      let errorText = 'Scan failed to start';
      try {
        const errorJson = await response.json();
        errorText = errorJson.error || errorText;
      } catch {
        errorText = await response.text();
      }
      callbacks.onError?.(errorText || `HTTP ${response.status}`);
      return;
    }

    if (!response.body) {
      callbacks.onError?.('Readable stream is not supported in this browser environment');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || ''; // keep trailing incomplete chunk

      for (const eventBlock of events) {
        if (!eventBlock.trim()) continue;

        let eventType = 'message';
        let eventData = '';

        const lines = eventBlock.split('\n');
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6).trim();
          }
        }

        if (!eventData) continue;

        try {
          const parsed = JSON.parse(eventData);

          if (eventType === 'init') {
            callbacks.onInit?.(parsed);
          } else if (eventType === 'progress') {
            const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
            const currentRate = parseFloat((parsed.checked / elapsedSeconds).toFixed(1));
            callbacks.onProgress?.({
              ...parsed,
              elapsedSeconds,
              currentRate,
            });
          } else if (eventType === 'result') {
            callbacks.onResult?.(parsed);
          } else if (eventType === 'complete') {
            if (elapsedTimer) clearInterval(elapsedTimer);
            callbacks.onComplete?.(parsed.summary);
          } else if (eventType === 'error') {
            if (elapsedTimer) clearInterval(elapsedTimer);
            callbacks.onError?.(parsed.error || 'Server error occurred');
          }
        } catch (e) {
          console.error('Failed to parse SSE event data:', e, eventData);
        }
      }
    }
  } catch (err: unknown) {
    if (elapsedTimer) clearInterval(elapsedTimer);
    if (callbacks.signal?.aborted) {
      // User aborted
      return;
    }
    const msg = err instanceof Error ? err.message : 'Connection failed';
    callbacks.onError?.(msg);
  }
}
