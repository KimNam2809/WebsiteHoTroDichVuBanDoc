// modules/sanitize.js
// Provide escapeHTML for plain text and safeHTML with allow-list tag filtering.
// NOTE: safeHTML strips disallowed tags and attributes, and escapes leftover angle brackets.

const DEFAULT_ALLOWED_TAGS = new Set(['p','strong','em','b','i','u','ul','ol','li','br','h1','h2','h3','h4','h5','h6','blockquote','code','pre','span']);
const ALLOWED_GLOBAL_ATTR = new Set(['class']);

export function escapeHTML(str){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// Very small HTML sanitizer: parses with DOMParser and rebuilds
export function safeHTML(html, {allowedTags=DEFAULT_ALLOWED_TAGS, allowedAttrs=ALLOWED_GLOBAL_ATTR}={}){
  if(!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  const out = [];
  function walk(node){
    node.childNodes.forEach(child=>{
      if(child.nodeType===Node.TEXT_NODE){ out.push(escapeHTML(child.textContent)); return; }
      if(child.nodeType===Node.ELEMENT_NODE){
        const tag = child.tagName.toLowerCase();
        if(!allowedTags.has(tag)) { // skip element but still traverse children (could allow nested text)
          walk(child); return;
        }
        // build opening tag
        let attrStr='';
        [...child.attributes].forEach(a=>{
          const name=a.name.toLowerCase();
          if(allowedAttrs.has(name) && !/on[a-z]+/.test(name) && !/javascript:/i.test(a.value)){
            attrStr += ` ${name}="${escapeHTML(a.value)}"`;
          }
        });
        out.push(`<${tag}${attrStr}>`);
        walk(child);
        out.push(`</${tag}>`);
      }
    });
  }
  walk(root);
  return out.join('');
}
