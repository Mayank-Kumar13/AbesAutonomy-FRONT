import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDocument } from './documentLoader.js';

test('loads the complete PDF without issuing range requests and sends auth only to the backend', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/notes/123/pdf');
    assert.deepEqual(options.headers, { Authorization: 'Bearer session-token' });
    assert.equal(options.credentials, 'include');
    return new Response('%PDF-1.7\nexample', { headers: { 'Content-Type': 'application/octet-stream' } });
  });
  const result = await loadDocument({ file: 'https://cdn.test/a.pdf', backendUrl: '/api/notes/123/pdf', token: 'session-token' });
  assert.equal(result.blob.type, 'application/pdf');
  assert.equal(result.isImage, false);
});

test('rejects an HTML success response and retries the next storage source', async (t) => {
  const urls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    urls.push(url);
    assert.equal(options.headers, undefined);
    return urls.length === 1 ? new Response('<html>Not a document</html>') : new Response('%PDF-1.7\nbackup');
  });
  const result = await loadDocument({ file: 'https://cdn.test/a.pdf', fallbackUrl: 'https://backup.test/a.pdf', token: 'private' });
  assert.equal(urls.length, 2);
  assert.equal(result.source, 'https://backup.test/a.pdf');
});

test('recognizes images returned by extensionless API document URLs', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('image data', { headers: { 'Content-Type': 'image/jpeg' } }));
  assert.equal((await loadDocument({ file: '/api/notes/123/pdf' })).isImage, true);
});

test('keeps access denials visible without falling back to a raw storage URL', async (t) => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    requests++;
    return Response.json({ message: 'Please sign in.' }, { status: 403 });
  });
  await assert.rejects(loadDocument({ file: 'https://cdn.test/a.pdf', backendUrl: '/api/notes/123/pdf' }), /Please sign in/);
  assert.equal(requests, 1);
});

test('cancelled requests never start a fallback fetch', async (t) => {
  const controller = new AbortController();
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    requests++;
    controller.abort();
    throw new DOMException('Aborted', 'AbortError');
  });
  await assert.rejects(loadDocument({ file: 'https://cdn.test/a.pdf', fallbackUrl: 'https://backup.test/a.pdf', signal: controller.signal }), { name: 'AbortError' });
  assert.equal(requests, 1);
});
