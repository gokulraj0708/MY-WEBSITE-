// Test harness: runs sw.js's fetch handler in a mocked service-worker global
// environment and asserts that event.respondWith() ALWAYS resolves with a
// real Response (never undefined, never a rejection) across all scenarios.
'use strict';
const fs = require('fs');
const vm = require('vm');

const scenarios = [
  // [name, requestUrl, mode, networkBehavior, cacheContents, expect]
  { name: 'A. Navigation "/" + network OK -> fresh Response, cache refreshed',
    url: 'https://site.test/', mode: 'navigate', net: 'ok', cache: [],
    expect: r => r.status === 200 },
  { name: 'B. Navigation "/" + network FAILS + cache MISS -> 503 Response (was: undefined!)',
    url: 'https://site.test/', mode: 'navigate', net: 'reject', cache: [],
    expect: r => r.status === 503 },
  { name: 'C. Navigation "/" + network FAILS + cached index.html -> cached shell',
    url: 'https://site.test/', mode: 'navigate', net: 'reject',
    cache: ['https://site.test/index.html'],
    expect: r => r.status === 200 && r.__from === 'cache' },
  { name: 'D. script.js + network FAILS + cached script.js -> cached file',
    url: 'https://site.test/script.js', mode: 'cors', net: 'reject',
    cache: ['https://site.test/script.js'],
    expect: r => r.status === 200 && r.__from === 'cache' },
  { name: 'E. script.js + network FAILS + cache MISS -> 503 Response (was: undefined!)',
    url: 'https://site.test/script.js', mode: 'cors', net: 'reject', cache: [],
    expect: r => r.status === 503 },
  { name: 'F. Cross-origin (Supabase) -> SW must not call respondWith at all',
    url: 'https://wjxcileyccpxxautqxxx.supabase.co/rest/v1/students', mode: 'cors',
    net: 'ok', cache: [], expectNoRespondWith: true },
  { name: 'G. POST request -> SW must not call respondWith at all',
    url: 'https://site.test/index.html', mode: 'navigate', method: 'POST',
    net: 'ok', cache: [], expectNoRespondWith: true },
];

function makeMockEnv(cacheList) {
  const cacheStore = new Map(cacheList.map(u => [u, makeResponse(u, 'cache', 200)]));
  const listeners = {};
  let putCalls = [];
  const self = {
    location: { origin: 'https://site.test' },
    registration: { scope: 'https://site.test/' },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
    addEventListener: (type, fn) => { listeners[type] = fn; },
  };
  const sandbox = {
    self,
    console: { warn: () => {}, log: () => {} },
    URL,
    Request, // Node 18+ global (undici)
    Response,
    fetch: async (req) => {
      if (mockNet === 'reject') throw new TypeError('Failed to fetch');
      return makeResponse(req.url, 'network', 200);
    },
    caches: {
      open: async () => ({
        add: async (file) => { cacheStore.set(new URL(file, 'https://site.test/').href, makeResponse(file, 'network', 200)); },
        put: async (req, res) => { putCalls.push(req.url); cacheStore.set(req.url, res); },
      }),
      match: async (req) => cacheStore.get(req.url) || undefined,
      keys: async () => ['sms-shell-v2', 'sms-shell-v3'],
      delete: async () => true,
    },
  };
  let mockNet = 'ok';
  const env = { sandbox, listeners, setNet: (n) => { mockNet = n; }, cacheStore, get putCalls() { return putCalls; } };
  return env;
}

let respCounter = 0;
function makeResponse(url, from, status) {
  const r = new Response(`body-of:${url}`, { status });
  r.__from = from;
  return r;
}

async function run() {
  const source = fs.readFileSync('sw.js', 'utf8');
  let failures = 0;

  for (const sc of scenarios) {
    const env = makeMockEnv(sc.cache);
    vm.createContext(env.sandbox);
    vm.runInContext(source, env.sandbox, { filename: 'sw.js' });
    env.setNet(sc.net);

    const req = { url: sc.url, method: sc.method || 'GET', mode: sc.mode };
    let respondWithArg = undefined;
    let respondWithCalled = false;
    const event = {
      request: req,
      waitUntil: () => {},
      respondWith: (p) => { respondWithCalled = true; respondWithArg = p; },
    };

    env.listeners['fetch'](event);

    if (sc.expectNoRespondWith) {
      if (respondWithCalled) { console.log(`FAIL  ${sc.name} (respondWith WAS called)`); failures++; }
      else console.log(`PASS  ${sc.name}`);
      continue;
    }

    try {
      const res = await respondWithArg; // would throw if promise rejects
      const isRealResponse = res instanceof Response;
      const ok = isRealResponse && sc.expect(res);
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${sc.name} -> ${isRealResponse ? `Response(status=${res.status}, from=${res.__from})` : typeof res}`);
      if (!ok) failures++;
    } catch (e) {
      console.log(`FAIL  ${sc.name} -> respondWith promise REJECTED: ${e.message}`);
      failures++;
    }
  }

  // Also verify install/activate don't throw in the mocked environment.
  console.log(failures === 0 ? '\nAll scenarios passed ✅' : `\n${failures} scenario(s) FAILED ❌`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
