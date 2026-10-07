import { describe, expect, it } from 'vitest';
import { encode, request, sentReason } from './model.ts';

describe('sentReason', () => {
  it('leaves out fields without a name', () => {
    expect(sentReason({ label: 'Email', name: null, type: 'email' })).toEqual({
      sent: false,
      reason: 'no name attribute',
    });
  });

  it('leaves out unchecked boxes and disabled fields', () => {
    expect(
      sentReason({ label: 'Digest', name: 'digest', type: 'checkbox', checked: false }).sent,
    ).toBe(false);
    expect(sentReason({ label: 'Code', name: 'code', type: 'text', disabled: true }).reason).toBe(
      'disabled',
    );
  });

  it('sends named, enabled fields', () => {
    expect(sentReason({ label: 'Name', name: 'name', type: 'text' })).toEqual({
      sent: true,
      reason: 'sent as name',
    });
  });
});

describe('encode', () => {
  it('encodes like a form: spaces as +, reserved characters escaped', () => {
    expect(
      encode([
        ['q', 'trail shoes'],
        ['email', 'ana@example.com'],
        ['note', 'a&b=c'],
      ]),
    ).toBe('q=trail+shoes&email=ana%40example.com&note=a%26b%3Dc');
  });
});

describe('request', () => {
  const pairs: [string, string][] = [['q', 'trail shoes']];

  it('puts GET data in the URL', () => {
    expect(request('get', '/search', pairs)).toEqual({
      line: 'GET /search?q=trail+shoes',
      contentType: null,
      body: null,
    });
  });

  it('puts POST data in the body', () => {
    expect(request('post', '/subscribe', pairs)).toEqual({
      line: 'POST /subscribe',
      contentType: 'application/x-www-form-urlencoded',
      body: 'q=trail+shoes',
    });
  });

  it('sends a bare URL when nothing is filled in', () => {
    expect(request('get', '/search', []).line).toBe('GET /search');
  });
});
