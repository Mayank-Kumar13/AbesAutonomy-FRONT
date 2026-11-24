import { useEffect, useRef, useState } from 'react';

// Render uploaded Office content in an opaque-origin frame. Only the already
// authorised bytes cross the boundary. The frame cannot fetch remote content.
async function makeViewer(format) {
  const modules = format === 'pptx'
    ? [await import('pptx-preview/dist/pptx-preview.umd.js?raw')]
    : await Promise.all([
      import('jszip/dist/jszip.min.js?raw'),
      import('../../node_modules/docx-preview/dist/docx-preview.min.js?raw'),
    ]);
  const nonce = crypto.randomUUID();
  const script = code => '<script nonce="' + nonce + '">' + code.replace(/<\/script/gi, '<\\/script') + '</script>';
  const render = format === 'pptx'
    ? `const designWidth = 960;
       const deck = document.createElement('div');
       root.appendChild(deck);
       deck.style.width = designWidth + 'px';
       const fit = () => { deck.style.zoom = root.clientWidth / designWidth; };
       fit();
       new ResizeObserver(fit).observe(root);
       await pptxPreview.init(deck, { width: designWidth, mode: 'list' }).preview(await event.data.arrayBuffer());`
    : 'await docx.renderAsync(event.data, root, undefined, { inWrapper: true, ignoreWidth: true, renderAltChunks: false, useBase64URL: true });';
  return `<!doctype html><meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:; media-src data: blob:; base-uri 'none'; form-action 'none'">
    <style>body{background:#e6e8eb;font:16px system-ui;margin:0}main{margin:auto;max-width:${format === 'pptx' ? 'none' : '1100px'}}p{text-align:center}.docx-wrapper{padding:12px!important}.docx-wrapper section{max-width:100%;box-sizing:border-box}</style>
    <main id="content"></main><p id="status" role="status">Opening document…</p>
    ${modules.map(module => script(module.default)).join('')}
    ${script(`addEventListener('message', async event => {
      if (event.source !== parent || !(event.data instanceof Blob)) return;
      const root = document.getElementById('content'), status = document.getElementById('status');
      try { ${render} status.remove(); }
      catch { status.textContent = 'This Office file could not be opened. It may be damaged or password protected.'; }
    });`)}`;
}

export default function OfficePreview({ blob, format, dark }) {
  const sentFrame = useRef(null);
  const [html, setHtml] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setHtml('');
    makeViewer(format).then(value => { if (active) setHtml(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [format, blob]);
  if (!html) return <p role="status">{failed ? 'The Office viewer could not load. Please refresh to retry.' : 'Opening document…'}</p>;
  return <iframe title="Office document preview" sandbox="allow-scripts" srcDoc={html}
    onLoad={event => {
      const frame = event.currentTarget;
      if (sentFrame.current === frame) return;
      sentFrame.current = frame;
      frame.contentWindow.postMessage(blob, '*');
    }}
    style={{ width: '100%', height: format === 'pptx' ? '100%' : '100vh', display: 'block', border: 0, filter: dark ? 'invert(1) hue-rotate(180deg)' : undefined }} />;
}
