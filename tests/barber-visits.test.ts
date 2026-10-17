import { it, expect } from 'vitest';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { referenceCodes, visitEndpoint } from '../src/lib/barber-visits';
import { dailyTotals } from '../src/server/barber-visits/store';
import { visitListener } from '../src/server/barber-visits/http';

it('accepts only bounded opaque allowlists and owned HTTPS endpoints', () => {
  expect(referenceCodes('DEMO01, DEMO01,BARBER_02')).toEqual(['DEMO01', 'BARBER_02']);
  for (const value of [
    'john@example.com',
    '447700900123',
    'A'.repeat(25),
    Array(101).fill('DEMO01').join(','),
  ])
    expect(() => referenceCodes(value)).toThrow();
  expect(visitEndpoint('')).toBe('');
  expect(visitEndpoint('https://counts.fintaxtech.co.uk/visits')).toContain('/visits');
  for (const value of [
    'http://fintaxtech.co.uk/visits',
    'https://example.com/visits',
    'https://fintaxtech.co.uk.evil.test/visits',
    'https://counts.fintaxtech.co.uk/visits?name=Jay',
    'https://x:y@fintaxtech.co.uk/visits',
  ])
    expect(() => visitEndpoint(value)).toThrow();
});

it('persists concurrent daily totals without event metadata and prunes old buckets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'barber-counts-'));
  const file = join(dir, 'counts.json');
  try {
    const increment = dailyTotals(file);
    await increment('OLD', new Date('2025-01-01T00:00:00Z'));
    await Promise.all(
      Array.from({ length: 10 }, () => increment('DEMO01', new Date('2026-10-17T12:00:00Z'))),
    );
    // Restarting the service retains totals; UTC midnight creates a distinct bucket.
    await dailyTotals(file)('DEMO01', new Date('2026-10-18T00:00:00Z'));
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({
      '2026-10-17': { DEMO01: 10 },
      '2026-10-18': { DEMO01: 1 },
    });
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it('HTTP endpoint accepts only exact requests, offers restricted CORS and bounds abuse without IP keys', async () => {
  const records: unknown[] = [];
  const server = createServer(
    visitListener({
      origin: 'https://fintaxtech.co.uk',
      codes: ['DEMO01'],
      now: () => new Date('2026-10-17T12:00:00Z'),
      increment: async (...args) => {
        records.push(args);
      },
    }),
  );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/visits`;
  const headers = { Origin: 'https://fintaxtech.co.uk', 'Content-Type': 'application/json' };
  const post = (body: unknown, more = {}) =>
    fetch(url, { method: 'POST', headers: { ...headers, ...more }, body: JSON.stringify(body) });
  try {
    const preflight = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        Origin: headers.Origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe(headers.Origin);
    expect(preflight.headers.get('access-control-allow-credentials')).toBeNull();
    expect((await post({ ref: 'DEMO01' }, { Origin: 'https://evil.test' })).status).toBe(403);
    expect((await fetch(url, { headers })).status).toBe(405);
    expect((await fetch(url + '?name=Jay', { headers })).status).toBe(404);
    for (const body of [{ ref: 'UNKNOWN' }, { ref: 'DEMO01', name: 'Jay' }, null, ['DEMO01']])
      expect((await post(body)).status).toBe(400);
    expect((await post({ ref: 'X'.repeat(100) })).status).toBe(413);
    expect((await post({ ref: 'DEMO01' }, { DNT: '1' })).status).toBe(204);
    expect((await post({ ref: 'DEMO01' }, { 'Sec-GPC': '1' })).status).toBe(204);
    expect(records).toHaveLength(0);
    const response = await post(
      { ref: 'DEMO01' },
      { Referer: 'https://fintaxtech.co.uk/?name=Jay', 'User-Agent': 'private' },
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(records).toEqual([['DEMO01', new Date('2026-10-17T12:00:00Z')]]);
    for (let i = 0; i < 60; i++) await post({ ref: 'DEMO01' });
    expect((await post({ ref: 'DEMO01' })).status).toBe(429);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
