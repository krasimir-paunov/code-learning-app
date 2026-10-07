/**
 * What a form submission sends. The browser's FormData decides which fields go; this module
 * explains why a field is left out and writes the request the way the network panel shows it.
 */

export interface Field {
  label: string;
  name: string | null;
  type: string;
  checked?: boolean;
  disabled?: boolean;
}

export function sentReason(field: Field): { sent: boolean; reason: string } {
  if (!field.name) return { sent: false, reason: 'no name attribute' };
  if (field.disabled) return { sent: false, reason: 'disabled' };
  if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked)
    return { sent: false, reason: 'not checked' };
  return { sent: true, reason: `sent as ${field.name}` };
}

export type Method = 'get' | 'post';

export interface Request {
  /** "GET /search?q=trail+shoes HTTP/1.1" style first line, without the protocol. */
  line: string;
  contentType: string | null;
  body: string | null;
}

/** application/x-www-form-urlencoded, exactly as forms send it (spaces become "+"). */
export function encode(pairs: readonly [string, string][]): string {
  return new URLSearchParams(pairs.map(([k, v]) => [k, v])).toString();
}

export function request(
  method: Method,
  action: string,
  pairs: readonly [string, string][],
): Request {
  const query = encode(pairs);
  if (method === 'get') {
    return { line: `GET ${action}${query ? `?${query}` : ''}`, contentType: null, body: null };
  }
  return { line: `POST ${action}`, contentType: 'application/x-www-form-urlencoded', body: query };
}
