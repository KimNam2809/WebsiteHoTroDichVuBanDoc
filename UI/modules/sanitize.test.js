import { escapeHTML, safeHTML } from './sanitize.js';

function testEscapeHTML() {
  const input = `<script>alert('x')</script><b>bold</b>&"`;
  const out = escapeHTML(input);
  if (out.includes('<') || out.includes('>') || out.includes('script')) throw new Error('escapeHTML failed');
  console.log('escapeHTML OK');
}

function testSafeHTML() {
  const input = `<p>ok</p><script>alert(1)</script><b>bold</b><img src=x onerror=alert(1)><a href='javascript:alert(1)'>x</a>`;
  const html = safeHTML(input);
  if (html.includes('script') || html.includes('onerror') || html.includes('javascript:')) throw new Error('safeHTML failed to sanitize');
  if (!html.includes('<b>bold</b>') || !html.includes('<p>ok</p>')) throw new Error('safeHTML removed allowed tags');
  console.log('safeHTML OK');
}

try {
  testEscapeHTML();
  testSafeHTML();
  console.log('All sanitize tests passed');
} catch (e) {
  console.error(e);
}
