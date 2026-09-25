import dns from 'node:dns/promises';
import { isPrivateOrReservedIp, validateDomain } from '../validation/domain.ts';
import type { ScanProtocol, ScanResultItem } from '../../types/scanner.ts';

export interface CandidateProbeResult {
  candidate: string;
  subdomain: string;
  active: boolean;
  result?: ScanResultItem;
  error?: string;
}

/**
 * Decodes basic HTML entities in page titles.
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Extracts <title> from HTML response text up to 32KB.
 */
function extractTitle(html: string): string {
  if (!html) return 'N/A';
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (match && match[1]) {
    const cleaned = decodeHtmlEntities(match[1].replace(/\s+/g, ' '));
    return cleaned.slice(0, 120) || 'N/A';
  }
  return 'N/A';
}

/**
 * Resolves a hostname via DNS and checks for SSRF.
 */
export async function resolveDnsWithSsrfCheck(hostname: string): Promise<{
  resolved: boolean;
  ip?: string;
  ssrfBlocked?: boolean;
  error?: string;
}> {
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      return { resolved: false, error: 'ENOTFOUND' };
    }

    // SSRF Check: Verify none of the resolved IPs are private/reserved
    for (const rec of records) {
      if (isPrivateOrReservedIp(rec.address)) {
        return {
          resolved: true,
          ip: rec.address,
          ssrfBlocked: true,
          error: `Blocked SSRF: Resolves to private/loopback IP (${rec.address})`,
        };
      }
    }

    return {
      resolved: true,
      ip: records[0].address,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      resolved: false,
      error: errorMsg,
    };
  }
}

/**
 * Probes HTTP or HTTPS endpoint with timeout, SSRF protection on redirects, and metadata extraction.
 */
async function probeHttpUrl(
  initialUrl: string,
  timeoutMs = 2800,
  maxRedirects = 2
): Promise<{
  success: boolean;
  status: number | null;
  statusText: string;
  responseTime: number;
  server: string;
  contentType: string;
  title: string;
  finalUrl: string;
  error?: string;
}> {
  const startTime = performance.now();
  let currentUrl = initialUrl;
  let redirectsFollowed = 0;

  while (redirectsFollowed <= maxRedirects) {
    const controller = new AbortController();
    const remainingTime = Math.max(800, timeoutMs - Math.round(performance.now() - startTime));
    const timeoutId = setTimeout(() => controller.abort(), remainingTime);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'SubScope-Recon/1.0 (+https://github.com/ishasonaria568-prog; authorized-recon)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal,
        redirect: 'manual', // Enforce manual handling to inspect and SSRF-validate redirect destinations
      });

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - startTime);
      const status = response.status;
      const statusText = response.statusText || `${status}`;
      const server = response.headers.get('server') || 'N/A';
      const contentType = response.headers.get('content-type') || 'N/A';

      // Check for redirect status codes (301, 302, 303, 307, 308)
      if (status >= 300 && status < 400) {
        const locationHeader = response.headers.get('location');
        if (locationHeader && redirectsFollowed < maxRedirects) {
          try {
            const redirectUrl = new URL(locationHeader, currentUrl);

            // Only allow HTTP/HTTPS redirects
            if (redirectUrl.protocol !== 'http:' && redirectUrl.protocol !== 'https:') {
              return {
                success: true,
                status,
                statusText: `${statusText} -> Blocked non-HTTP redirect (${redirectUrl.protocol})`,
                responseTime: elapsed,
                server,
                contentType,
                title: 'N/A',
                finalUrl: currentUrl,
              };
            }

            const redirectHost = redirectUrl.hostname;

            // SSRF Check 1: Hostname validation against reserved TLDs/localhost
            const domainVal = validateDomain(redirectHost);
            if (!domainVal.valid) {
              return {
                success: true,
                status,
                statusText: `${statusText} -> SSRF Blocked (Reserved Hostname: ${redirectHost})`,
                responseTime: elapsed,
                server,
                contentType,
                title: 'N/A',
                finalUrl: currentUrl,
                error: domainVal.error,
              };
            }

            // SSRF Check 2: DNS & IP validation for the redirect destination
            const dnsCheck = await resolveDnsWithSsrfCheck(domainVal.normalizedDomain);
            if (!dnsCheck.resolved || dnsCheck.ssrfBlocked) {
              return {
                success: true,
                status,
                statusText: `${statusText} -> SSRF Blocked (Target Resolves to Private/Internal IP: ${dnsCheck.ip || 'Unknown'})`,
                responseTime: elapsed,
                server,
                contentType,
                title: 'N/A',
                finalUrl: currentUrl,
                error: dnsCheck.error || 'Blocked by SSRF policy',
              };
            }

            // Safe to follow redirect
            currentUrl = redirectUrl.toString();
            redirectsFollowed++;
            continue;
          } catch {
            return {
              success: true,
              status,
              statusText: `${statusText} (Invalid Location Header)`,
              responseTime: elapsed,
              server,
              contentType,
              title: 'N/A',
              finalUrl: currentUrl,
            };
          }
        }
      }

      let title = 'N/A';
      if (contentType.toLowerCase().includes('text') || contentType.toLowerCase().includes('html') || contentType === 'N/A') {
        try {
          const text = await response.text();
          title = extractTitle(text.slice(0, 32768));
        } catch {
          // Failed to read text body
        }
      }

      return {
        success: true,
        status,
        statusText,
        responseTime: elapsed,
        server,
        contentType,
        title,
        finalUrl: currentUrl,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - startTime);
      const errorMsg = err instanceof Error ? err.name : 'NetworkError';
      return {
        success: false,
        status: null,
        statusText: errorMsg === 'AbortError' ? 'Request Timed Out' : 'Connection Failed',
        responseTime: elapsed,
        server: 'N/A',
        contentType: 'N/A',
        title: 'N/A',
        finalUrl: currentUrl,
        error: errorMsg,
      };
    }
  }

  return {
    success: false,
    status: null,
    statusText: 'Maximum Redirect Limit Exceeded',
    responseTime: Math.round(performance.now() - startTime),
    server: 'N/A',
    contentType: 'N/A',
    title: 'N/A',
    finalUrl: currentUrl,
  };
}

/**
 * Checks a single candidate subdomain.
 */
export async function checkSubdomainCandidate(
  candidate: string,
  domain: string,
  protocol: ScanProtocol
): Promise<CandidateProbeResult> {
  const subdomain = `${candidate}.${domain}`.toLowerCase();
  const timestamp = new Date().toISOString();

  // Step 1: DNS Resolution & SSRF Guard
  const dnsResult = await resolveDnsWithSsrfCheck(subdomain);

  if (!dnsResult.resolved) {
    return {
      candidate,
      subdomain,
      active: false,
      error: dnsResult.error || 'NXDOMAIN',
    };
  }

  // If SSRF blocked, record finding with security block notice
  if (dnsResult.ssrfBlocked) {
    return {
      candidate,
      subdomain,
      active: true,
      result: {
        id: `res-${candidate}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        subdomain,
        url: `http://${subdomain}`,
        status: null,
        statusText: 'SSRF Protection Blocked',
        responseTime: null,
        protocol: 'DNS',
        title: 'N/A (Private IP Detected)',
        ip: dnsResult.ip || 'Private IP',
        server: 'N/A',
        contentType: 'N/A',
        timestamp,
        isResponsive: false,
        dnsResolved: true,
        error: dnsResult.error,
      },
    };
  }

  const resolvedIp = dnsResult.ip || 'N/A';

  // Step 2: HTTP(S) Probe
  let targetProtocol: 'HTTPS' | 'HTTP' | 'DNS' = 'HTTPS';
  let targetUrl = `https://${subdomain}`;
  let probe = await probeHttpUrl(targetUrl, 3500);

  // If protocol was 'http', probe http directly
  if (protocol === 'http') {
    targetProtocol = 'HTTP';
    targetUrl = `http://${subdomain}`;
    probe = await probeHttpUrl(targetUrl, 3500);
  } else if (protocol === 'fallback' && !probe.success) {
    // Try fallback to HTTP
    const httpProbe = await probeHttpUrl(`http://${subdomain}`, 3000);
    if (httpProbe.success) {
      probe = httpProbe;
      targetProtocol = 'HTTP';
      targetUrl = `http://${subdomain}`;
    }
  }

  // If HTTP check succeeded:
  if (probe.success && probe.status !== null) {
    return {
      candidate,
      subdomain,
      active: true,
      result: {
        id: `res-${candidate}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        subdomain,
        url: targetUrl,
        status: probe.status,
        statusText: probe.statusText,
        responseTime: probe.responseTime,
        protocol: targetProtocol,
        title: probe.title,
        ip: resolvedIp,
        server: probe.server,
        contentType: probe.contentType,
        timestamp,
        isResponsive: true,
        dnsResolved: true,
      },
    };
  }

  // If DNS resolved but HTTP probe failed (e.g. port 80/443 closed or timed out)
  // This is a legitimate active DNS discovery!
  return {
    candidate,
    subdomain,
    active: true,
    result: {
      id: `res-${candidate}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      subdomain,
      url: targetUrl,
      status: null,
      statusText: probe.statusText || 'DNS Resolved (HTTP Unreachable)',
      responseTime: null,
      protocol: 'DNS',
      title: 'N/A',
      ip: resolvedIp,
      server: 'N/A',
      contentType: 'N/A',
      timestamp,
      isResponsive: false,
      dnsResolved: true,
      error: probe.error,
    },
  };
}

/**
 * Runs the concurrent enumeration pipeline.
 */
export async function runControlledEnumeration({
  domain,
  candidates,
  protocol,
  concurrency,
  onProgress,
  onResult,
  abortSignal,
}: {
  domain: string;
  candidates: string[];
  protocol: ScanProtocol;
  concurrency: number;
  onProgress: (progress: {
    candidate: string;
    checked: number;
    total: number;
    discovered: number;
    responsive: number;
    failed: number;
    active: boolean;
    status: number | null;
    responseTime: number | null;
  }) => void;
  onResult: (result: ScanResultItem) => void;
  abortSignal?: AbortSignal;
}): Promise<ScanResultItem[]> {
  const total = candidates.length;
  let checked = 0;
  let discovered = 0;
  let responsive = 0;
  let failed = 0;

  const results: ScanResultItem[] = [];
  let index = 0;

  // Worker loop pulling from shared candidate index
  const worker = async () => {
    while (index < total) {
      if (abortSignal?.aborted) break;

      const currentIndex = index++;
      if (currentIndex >= total) break;

      const candidate = candidates[currentIndex];
      try {
        const probeResult = await checkSubdomainCandidate(candidate, domain, protocol);

        checked++;
        if (probeResult.active && probeResult.result) {
          discovered++;
          if (probeResult.result.isResponsive) {
            responsive++;
          }
          results.push(probeResult.result);
          onResult(probeResult.result);
        } else {
          failed++;
        }

        onProgress({
          candidate,
          checked,
          total,
          discovered,
          responsive,
          failed,
          active: probeResult.active,
          status: probeResult.result?.status ?? null,
          responseTime: probeResult.result?.responseTime ?? null,
        });
      } catch (err) {
        checked++;
        failed++;
        onProgress({
          candidate,
          checked,
          total,
          discovered,
          responsive,
          failed,
          active: false,
          status: null,
          responseTime: null,
        });
      }
    }
  };

  const poolSize = Math.min(concurrency, total, 100);
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);

  return results;
}
