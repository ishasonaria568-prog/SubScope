/**
 * Domain validation and SSRF prevention guards.
 * Ensures targets are valid public hostnames and never point to local/internal/private networks.
 */

export interface DomainValidationResult {
  valid: boolean;
  normalizedDomain: string;
  error?: string;
}

const RESERVED_TLDS = new Set([
  'local',
  'localhost',
  'lan',
  'internal',
  'intranet',
  'test',
  'example',
  'invalid',
  'onion',
  'arpa',
  'corp',
  'home',
  'localdomain',
  'priv',
  'box',
]);

/**
 * Normalizes and validates user-submitted target domain.
 */
export function validateDomain(input: string): DomainValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      normalizedDomain: '',
      error: 'Please enter a target domain name.',
    };
  }

  let cleaned = input.trim().toLowerCase();

  // Strip protocol if user entered it (e.g., https://example.com)
  cleaned = cleaned.replace(/^https?:\/\//i, '');

  // Strip trailing slashes, paths, query parameters or fragments
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];

  // Strip port if present (e.g. example.com:443)
  if (cleaned.includes(':') && !cleaned.includes(']')) {
    cleaned = cleaned.split(':')[0];
  }

  // Remove trailing dot if present (FQDN)
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }

  if (!cleaned) {
    return {
      valid: false,
      normalizedDomain: '',
      error: 'Domain input cannot be empty.',
    };
  }

  // Reject raw IP addresses directly (users must enter domains)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(cleaned)) {
    return {
      valid: false,
      normalizedDomain: cleaned,
      error: 'Target must be a domain name (e.g. example.com), not an IP address.',
    };
  }

  if (cleaned.startsWith('[') || cleaned.includes(':')) {
    return {
      valid: false,
      normalizedDomain: cleaned,
      error: 'IPv6 address targets are not permitted. Please specify a domain name.',
    };
  }

  // Disallow localhost
  if (cleaned === 'localhost') {
    return {
      valid: false,
      normalizedDomain: cleaned,
      error: 'Scanning localhost is prohibited for security reasons.',
    };
  }

  // Length constraints
  if (cleaned.length > 253) {
    return {
      valid: false,
      normalizedDomain: cleaned,
      error: 'Domain name exceeds maximum RFC limit of 253 characters.',
    };
  }

  // Domain structure validation: labels separated by dots
  const parts = cleaned.split('.');
  if (parts.length < 2) {
    return {
      valid: false,
      normalizedDomain: cleaned,
      error: 'Please enter a complete domain with a valid TLD (e.g. example.com).',
    };
  }

  const tld = parts[parts.length - 1];
  if (RESERVED_TLDS.has(tld)) {
    return {
      valid: false,
      normalizedDomain: cleaned,
      error: `Scanning internal or reserved TLD (.${tld}) is prohibited.`,
    };
  }

  // Validate each label
  const labelRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  for (const part of parts) {
    if (!part || part.length > 63) {
      return {
        valid: false,
        normalizedDomain: cleaned,
        error: 'Each domain segment must be between 1 and 63 characters.',
      };
    }
    if (!labelRegex.test(part)) {
      return {
        valid: false,
        normalizedDomain: cleaned,
        error: `Invalid characters in domain segment "${part}". Use letters, digits, and hyphens only.`,
      };
    }
  }

  // TLD must be alphabetic and at least 2 chars
  if (!/^[a-z]{2,24}$/.test(tld)) {
    return {
      valid: false,
      normalizedDomain: cleaned,
      error: 'The top-level domain (TLD) must contain letters only (e.g. .com, .org, .io).',
    };
  }

  return {
    valid: true,
    normalizedDomain: cleaned,
  };
}

/**
 * Checks if an IP address belongs to private, loopback, link-local or reserved ranges.
 * Critical SSRF mitigation.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;

  // Handle IPv4-mapped IPv6 (::ffff:192.0.2.1)
  let cleanIp = ip.toLowerCase();
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.substring(7);
  }

  // IPv4 checks
  const ipv4Parts = cleanIp.split('.').map(Number);
  if (ipv4Parts.length === 4 && ipv4Parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
    const [a, b, c] = ipv4Parts;

    // 0.0.0.0/8 (Current network / "this host")
    if (a === 0) return true;

    // 10.0.0.0/8 (Private-Use RFC 1918)
    if (a === 10) return true;

    // 100.64.0.0/10 (Carrier-Grade NAT RFC 6598)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-Local / Cloud IMDS e.g. 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (Private-Use RFC 1918 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments RFC 6890)
    if (a === 192 && b === 0 && c === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1 RFC 5737)
    if (a === 192 && b === 0 && c === 2) return true;

    // 192.88.99.0/24 (6to4 Relay Anycast)
    if (a === 192 && b === 88 && c === 99) return true;

    // 192.168.0.0/16 (Private-Use RFC 1918)
    if (a === 192 && b === 168) return true;

    // 198.18.0.0/15 (Benchmarking RFC 2544)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2 RFC 5737)
    if (a === 198 && b === 51 && c === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3 RFC 5737)
    if (a === 203 && b === 0 && c === 113) return true;

    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved / Future Use)
    if (a >= 224) return true;

    return false;
  }

  // IPv6 checks
  if (cleanIp.includes(':')) {
    // Loopback ::1
    if (cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1') return true;

    // Unspecified ::
    if (cleanIp === '::' || cleanIp === '0:0:0:0:0:0:0:0') return true;

    // Unique local address fc00::/7 (fc00:: - fdff::)
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true;

    // Link-local unicast fe80::/10 (fe80:: - febf::)
    if (cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) {
      return true;
    }

    // Multicast ff00::/8
    if (cleanIp.startsWith('ff')) return true;

    // Documentation 2001:db8::/32
    if (cleanIp.startsWith('2001:db8:') || cleanIp.startsWith('2001:0db8:')) return true;

    // Discard prefix 100::/64
    if (cleanIp.startsWith('100:')) return true;

    return false;
  }

  return true;
}
