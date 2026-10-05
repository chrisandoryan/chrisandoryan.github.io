(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LANGS = {
    php: 'PHP', python: 'Python', py: 'Python', js: 'JavaScript', javascript: 'JavaScript',
    json: 'JSON', html: 'HTML', xml: 'XML', shell: 'Shell', bash: 'Shell', sh: 'Shell',
    console: 'Terminal', http: 'HTTP', sql: 'SQL', css: 'CSS', text: 'Text', plaintext: 'Text'
  };

  function enhanceCode() {
    $$('.prose div.highlighter-rouge').forEach((block) => {
      const pre = $('pre.highlight', block);
      const code = $('code', pre);
      if (!pre || !code) return;

      const langClass = Array.from(block.classList).find((c) => c.startsWith('language-'));
      const lang = langClass ? langClass.slice(9) : 'text';
      const file = block.getAttribute('file') || block.dataset.file;

      const text = code.textContent.replace(/\n$/, '');
      const lineCount = text.split('\n').length;

      const head = document.createElement('div');
      head.className = 'code-head';
      const label = document.createElement('span');
      label.className = 'code-label';
      if (file) {
        const name = document.createElement('span');
        name.className = 'code-file';
        name.textContent = file;
        label.append(name);
      }
      const langEl = document.createElement('span');
      langEl.className = 'code-lang';
      langEl.textContent = LANGS[lang] || lang;
      label.append(langEl);

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'code-copy';
      copy.textContent = 'Copy';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = 'Copied';
          copy.classList.add('is-done');
        } catch {
          copy.textContent = 'Press Ctrl+C';
          const range = document.createRange();
          range.selectNodeContents(code);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        clearTimeout(copy._t);
        copy._t = setTimeout(() => {
          copy.textContent = 'Copy';
          copy.classList.remove('is-done');
        }, 1800);
      });

      head.append(label, copy);

      const body = document.createElement('div');
      body.className = 'code-body';
      if (lineCount > 2) {
        const gutter = document.createElement('div');
        gutter.className = 'code-gutter';
        gutter.setAttribute('aria-hidden', 'true');
        gutter.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
        body.append(gutter);
      }
      const container = pre.parentElement;
      container.insertBefore(body, pre);
      body.append(pre);
      pre.tabIndex = 0;
      pre.setAttribute('aria-label', `${LANGS[lang] || lang} code`);

      block.prepend(head);
      block.classList.add('code-block');

      if (lineCount > 30) {
        block.classList.add('is-collapsed');
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'code-more';
        more.textContent = `Show all ${lineCount} lines`;
        more.setAttribute('aria-expanded', 'false');
        more.addEventListener('click', () => {
          const collapsed = block.classList.toggle('is-collapsed');
          more.textContent = collapsed ? `Show all ${lineCount} lines` : 'Collapse';
          more.setAttribute('aria-expanded', String(!collapsed));
          if (collapsed) block.scrollIntoView({ block: 'nearest' });
        });
        block.append(more);
      }
    });
  }

  function slug(str) {
    return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  }

  function buildToc() {
    const prose = $('[data-prose]');
    if (!prose) return;
    const heads = $$('h2, h3', prose);
    heads.forEach((h) => {
      if (!h.id) h.id = slug(h.textContent);
      const a = document.createElement('a');
      a.className = 'anchor';
      a.href = `#${h.id}`;
      a.setAttribute('aria-label', `Link to ${h.textContent}`);
      a.textContent = '#';
      h.append(a);
    });
    if (heads.length < 2) return;

    const lists = $$('[data-toc-list]');
    lists.forEach((list) => {
      heads.forEach((h) => {
        const li = document.createElement('li');
        li.className = `toc-${h.tagName.toLowerCase()}`;
        const a = document.createElement('a');
        a.href = `#${h.id}`;
        a.textContent = h.firstChild.textContent.trim();
        li.append(a);
        list.append(li);
      });
    });
    $$('[data-toc-side], [data-toc-inline]').forEach((el) => (el.hidden = false));
    $('[data-toc-inline]')?.addEventListener('click', (e) => {
      if (e.target.closest('a')) e.currentTarget.open = false;
    });

    const sideLinks = $$('[data-toc-side] a');
    const setActive = () => {
      const offset = 120;
      let current = heads[0];
      for (const h of heads) {
        if (h.getBoundingClientRect().top - offset <= 0) current = h;
        else break;
      }
      sideLinks.forEach((a) => a.classList.toggle('is-active', a.hash === `#${current.id}`));
    };
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setActive();
        ticking = false;
      });
    }, { passive: true });
    setActive();
  }

  function lightbox() {
    const box = $('[data-lightbox]');
    const img = $('[data-lightbox-img]');
    if (!box) return;
    $$('.prose img').forEach((el) => {
      if (el.closest('a')) return;
      el.classList.add('zoomable');
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Enlarge image');
      const open = () => {
        img.src = el.currentSrc || el.src;
        img.alt = el.alt;
        box.showModal();
      };
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
    box.addEventListener('click', () => box.close());
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function search() {
    const dialog = $('[data-search]');
    const input = $('[data-search-input]');
    const results = $('[data-search-results]');
    const empty = $('[data-search-empty]');
    if (!dialog) return;
    let index = null;
    let active = -1;

    const load = async () => {
      if (index) return index;
      const res = await fetch(window.SEARCH_INDEX);
      index = await res.json();
      return index;
    };

    const open = () => {
      if (dialog.open) return;
      dialog.showModal();
      input.select();
      load();
    };

    const snippet = (body, term) => {
      const i = body.toLowerCase().indexOf(term);
      if (i < 0) return escapeHtml(body.slice(0, 160)) + '...';
      const start = Math.max(0, i - 60);
      const raw = (start > 0 ? '...' : '') + body.slice(start, i + 120) + '...';
      const re = new RegExp(escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
      return escapeHtml(raw).replace(re, (m) => `<mark>${m}</mark>`);
    };

    const setActive = (i) => {
      const items = $$('li', results);
      if (!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach((li, n) => li.classList.toggle('is-active', n === active));
      items[active].scrollIntoView({ block: 'nearest' });
    };

    const render = async () => {
      const q = input.value.trim().toLowerCase();
      const data = await load();
      results.innerHTML = '';
      active = -1;
      if (!q) {
        empty.hidden = true;
        return;
      }
      const terms = q.split(/\s+/);
      const hits = data
        .map((p) => {
          const title = p.title.toLowerCase();
          const tags = p.tags.toLowerCase();
          const body = p.body.toLowerCase();
          let score = 0;
          for (const t of terms) {
            if (title.includes(t)) score += 10;
            else if (tags.includes(t)) score += 5;
            else if (body.includes(t)) score += 1;
            else return null;
          }
          return { p, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);

      empty.hidden = hits.length > 0;
      results.innerHTML = hits
        .map(({ p }) => `<li><a href="${p.url}"><span class="sr-title">${escapeHtml(p.title)}</span><span class="sr-date">${p.date}</span><span class="sr-snippet">${snippet(p.body, terms[0])}</span></a></li>`)
        .join('');
      if (hits.length) setActive(0);
    };

    $$('[data-search-open]').forEach((b) => b.addEventListener('click', open));
    $('[data-search-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const a = $$('li a', results)[Math.max(active, 0)];
        if (a) window.location.href = a.href;
      }
    });
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
      if (!typing && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) {
        e.preventDefault();
        open();
      }
    });
  }

  function typePayload() {
    const cards = $$('[data-payloads] .payload');
    if (!cards.length) return;
    const pick = cards[Math.floor(Math.random() * cards.length)];
    cards.forEach((c) => (c.hidden = c !== pick));
    const code = $('.payload-code code', pick) || $('.payload-code pre', pick);
    if (!code) return;

    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const last = nodes[nodes.length - 1];
    if (last) last.data = last.data.replace(/\n+$/, '');
    const parts = nodes.map((n) => ({ node: n, text: n.data }));
    const total = parts.reduce((sum, p) => sum + p.text.length, 0);

    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    code.append(caret);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !total) {
      caret.classList.add('is-idle');
      return;
    }

    parts.forEach((p) => (p.node.data = ''));
    const step = Math.max(3, Math.min(28, 1600 / total));
    let part = 0;
    let i = 0;
    const tick = () => {
      while (part < parts.length && i >= parts[part].text.length) {
        part += 1;
        i = 0;
      }
      if (part >= parts.length) {
        caret.classList.add('is-idle');
        return;
      }
      const p = parts[part];
      i += 1;
      p.node.data = p.text.slice(0, i);
      const ch = p.text[i - 1];
      setTimeout(tick, ch === '\n' ? step * 8 : step + Math.random() * step);
    };
    setTimeout(tick, 450);
  }

  function decryptBrand() {
    const el = $('.brand');
    if (!el) return;
    const final = el.textContent.trim();
    if (!final || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const glyphs = '!<>-_\\/[]{}=+*^?#%&$@01ABCDEFabcdef';
    const random = () => glyphs[Math.floor(Math.random() * glyphs.length)];

    el.setAttribute('aria-label', final);
    el.style.display = 'inline-block';
    el.style.minWidth = `${el.getBoundingClientRect().width}px`;
    const view = document.createElement('span');
    view.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    el.append(view);

    const start = performance.now();
    const settle = Array.from(final, (_, i) => 250 + i * 70 + Math.random() * 120);
    let lastSwap = 0;
    let noise = Array.from(final, random);

    const frame = (now) => {
      const t = now - start;
      if (now - lastSwap > 55) {
        noise = Array.from(final, random);
        lastSwap = now;
      }
      view.textContent = '';
      let done = true;
      Array.from(final).forEach((ch, i) => {
        if (t >= settle[i] || ch === ' ') {
          view.append(ch);
        } else {
          done = false;
          const s = document.createElement('span');
          s.className = 'cipher';
          s.textContent = noise[i];
          view.append(s);
        }
      });
      if (done) {
        el.textContent = final;
        el.removeAttribute('aria-label');
        el.style.minWidth = '';
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function unregisterOldWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
  }

  decryptBrand();
  enhanceCode();
  buildToc();
  lightbox();
  search();
  typePayload();
  unregisterOldWorker();
})();
