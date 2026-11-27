(() => {
  const KEY = 'rat-rascunho-v1', KEEP = 'rat-tecnico-v1';
  const form = document.getElementById('rat');

  // cada campo ganha um "envelope" (.inw) que desenha a linha fina no PDF
  form.querySelectorAll('.f > input:not([type=radio]):not([type=checkbox])').forEach(inp => {
    const w = document.createElement('span'); w.className = 'inw';
    inp.replaceWith(w); w.appendChild(inp);
  });

  /* ---------- sugestões de técnico ---------- */
  const TEC_KEY = 'rat-tecnicos-v1', DEFAULT_TECS = ['Derik Oliveira'];
  const tecInput = form.elements.tecnico, sugg = document.getElementById('suggTec');
  const savedTecs = () => JSON.parse(localStorage.getItem(TEC_KEY) || '[]');
  const allTecs = () => [...new Set([...DEFAULT_TECS, ...savedTecs()])];
  function rememberTec(){
    const n = tecInput.value.trim().replace(/\s+/g, ' ');
    if (!n || allTecs().some(t => t.toLowerCase() === n.toLowerCase())) return;
    localStorage.setItem(TEC_KEY, JSON.stringify([...savedTecs(), n]));
  }
  function forgetTec(n){ localStorage.setItem(TEC_KEY, JSON.stringify(savedTecs().filter(t => t !== n))); }
  function showSugg(filter){
    const f = (filter || '').trim().toLowerCase();
    const list = allTecs().filter(t => !f || t.toLowerCase().includes(f));
    if (!list.length){ sugg.classList.remove('open'); return; }
    sugg.innerHTML = '<div class="sugg-h">Escolha ou digite outro nome</div>' + list.map(t =>
      `<div class="sugg-i" data-n="${t.replace(/"/g,'&quot;')}"><span>${t.replace(/</g,'&lt;')}</span>` +
      (DEFAULT_TECS.includes(t) ? '' : '<button type="button" class="sugg-x" title="Remover da lista">✕</button>') + '</div>').join('');
    sugg.classList.add('open');
  }
  sugg.addEventListener('pointerdown', e => {
    e.preventDefault();
    const item = e.target.closest('.sugg-i'); if (!item) return;
    if (e.target.closest('.sugg-x')){ forgetTec(item.dataset.n); showSugg(''); return; }
    tecInput.value = item.dataset.n;
    tecInput.dispatchEvent(new Event('input', { bubbles: true }));
    sugg.classList.remove('open'); tecInput.blur();
  });
  tecInput.addEventListener('focus', () => showSugg(''));
  tecInput.addEventListener('click', () => showSugg(''));
  tecInput.addEventListener('input', e => { if (e.isTrusted) showSugg(tecInput.value); });
  tecInput.addEventListener('blur', () => { setTimeout(() => sugg.classList.remove('open'), 120); rememberTec(); });

  /* ---------- várias peças ---------- */
  const pecasBox = document.getElementById('pecas');
  const pecaTpl = pecasBox.firstElementChild.cloneNode(true);
  function renumberPecas(){
    [...pecasBox.children].forEach((p, k) => p.querySelectorAll('input').forEach(inp => {
      const base = inp.name.replace(/_\d+$/, '');
      inp.name = k === 0 ? base : base + '_' + (k + 1);
    }));
  }
  function addPeca(){
    const p = pecaTpl.cloneNode(true);
    p.querySelectorAll('input').forEach(inp => inp.value = '');
    const rm = document.createElement('button');
    rm.type = 'button'; rm.className = 'rm-peca'; rm.textContent = '✕ Remover esta peça';
    rm.onclick = () => { p.remove(); renumberPecas(); save(); };
    p.appendChild(rm);
    pecasBox.appendChild(p); renumberPecas();
    return p;
  }
  function setPecas(n){
    while (pecasBox.children.length < n) addPeca();
    while (pecasBox.children.length > n) pecasBox.lastElementChild.remove();
  }
  document.getElementById('addPeca').onclick = () => { addPeca().querySelector('input').focus(); save(); };
  const sigs = { sigTecnico: '', sigCliente: '' };
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
  const nowTime = () => new Date().toTimeString().slice(0,5);

  /* ---------- salvar / carregar ---------- */
  function collect(){
    const data = {};
    for (const el of form.elements){
      if (!el.name) continue;
      if (el.type === 'radio'){ if (el.checked) data[el.name] = el.value; }
      else data[el.name] = el.dataset.iso !== undefined ? el.dataset.iso : el.value;
    }
    return { ...data, ...sigs, nPecas: pecasBox.children.length };
  }
  function apply(data){
    setPecas(+data.nPecas || 1);
    for (const el of form.elements){
      if (!el.name) continue;
      if (el.type === 'radio') el.checked = data[el.name] === el.value;
      else el.value = data[el.name] ?? '';
    }
    for (const k in sigs) setSig(k, data[k] || '');
    syncMirrors();
    layoutLined();
  }
  /* ---------- várias RATs salvas no aparelho ---------- */
  const LIST = 'rat-lista-v1', CUR = 'rat-atual-v1';
  let list = [], currentId = null;
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function readList(){ try { return JSON.parse(localStorage.getItem(LIST) || '[]'); } catch(e){ return []; } }
  function writeList(){ localStorage.setItem(LIST, JSON.stringify(list)); localStorage.setItem(CUR, currentId); updateCount(); }
  const findRat = id => list.find(r => r.id === id);

  let t;
  function writeNow(){
    clearTimeout(t);
    const d = collect();
    try{
      const r = findRat(currentId);
      if (r){ r.data = d; r.updated = Date.now(); }
      writeList();
      const keep = { sigTecnico: d.sigTecnico };
      form.querySelectorAll('[data-keep]').forEach(el => keep[el.name] = el.value);
      localStorage.setItem(KEEP, JSON.stringify(keep));
      document.getElementById('saved').textContent = 'Salvo às ' + nowTime();
    }catch(e){
      document.getElementById('saved').textContent = 'Memória cheia: exclua RATs antigas em "Minhas RATs"';
    }
  }
  function save(){ clearTimeout(t); t = setTimeout(writeNow, 300); }
  window.addEventListener('pagehide', () => { clearTimeout(t); writeNow(); });   // ao sair da página (ex.: ir para a Máscara)
  function defaults(){
    const keep = JSON.parse(localStorage.getItem(KEEP) || '{}');
    return { ...keep, tecData: today(), clienteData: today() };
  }

  /* ---------- espelhos para impressão ---------- */
  function syncMirrors(){
    document.querySelectorAll('.print-text').forEach(div => {
      div.textContent = form.elements[div.dataset.for].value;
    });
  }
  form.addEventListener('input', () => { syncMirrors(); layoutLined(); save(); });

  /* ---------- linhas das caixas de texto (todas com a mesma espessura) ---------- */
  function layoutLined(){
    if (form.style.getPropertyValue('--fit')) return;
    document.querySelectorAll('.lined').forEach(w => {
      const ta = w.querySelector('textarea');
      const lh = parseFloat(getComputedStyle(ta).lineHeight);
      const min = +ta.getAttribute('rows');
      ta.style.height = lh * min + 'px';
      const n = Math.max(min, Math.ceil((ta.scrollHeight - 1) / lh));
      ta.style.height = n * lh + 'px';
      let lines = w.querySelector('.lines');
      if (!lines){ lines = document.createElement('div'); lines.className = 'lines'; w.prepend(lines); }
      lines.style.setProperty('--lh', lh + 'px');
      if (lines.children.length !== n) lines.innerHTML = '<i></i>'.repeat(n);
    });
  }
  window.addEventListener('resize', layoutLined);
  if (document.fonts) document.fonts.ready.then(layoutLined);
  form.addEventListener('change', save);

  /* ---------- hora digitável (sem o relógio do Android) ---------- */
  function maskHora(v){
    let d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length && +d[0] > 2) d = ('0' + d).slice(0, 4);     // "9" vira "09"
    return d.length > 2 ? d.slice(0, 2) + ':' + d.slice(2) : d;
  }
  function fixHora(v){
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    let h, m;
    if (d.length <= 2){ h = +d; m = 0; }
    else if (d.length === 3){ h = +d.slice(0, 1); m = +d.slice(1); }
    else { h = +d.slice(0, 2); m = +d.slice(2, 4); }
    h = Math.min(h, 23); m = Math.min(m, 59);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  form.querySelectorAll('input.hora').forEach(inp => {
    inp.addEventListener('input', e => {
      if (e.inputType && e.inputType.startsWith('delete')) return;   // deixa apagar normalmente
      inp.value = maskHora(inp.value);
    });
    inp.addEventListener('blur', () => { inp.value = fixHora(inp.value); save(); });
  });

  // tocar de novo no X desmarca
  form.addEventListener('pointerdown', e => {
    const lab = e.target.closest('.opt'); if (!lab) return;
    const r = lab.querySelector('input[type=radio]'); if (r) r.dataset.was = r.checked ? '1' : '';
  }, true);
  form.addEventListener('click', e => {
    const r = e.target;
    if (r.type !== 'radio' || r.dataset.was !== '1') return;
    r.checked = false; r.dataset.was = ''; save();
  });

  /* ---------- assinaturas ---------- */
  function setSig(key, url){
    sigs[key] = url;
    const box = document.querySelector(`[data-sig="${key}"]`);
    box.classList.toggle('has', !!url);
    box.innerHTML = url ? `<img alt="assinatura" src="${url}">` : '<span>✍️ Toque para assinar</span>';
  }

  const modal = document.getElementById('modal'), pad = document.getElementById('pad');
  const canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
  let current = null, drawing = false, dirty = false, pts = [];

  function sizeCanvas(){
    const r = { width: pad.clientWidth, height: pad.clientHeight }, dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b2a6b'; ctx.lineWidth = 2.6;
    dirty = false;
  }
  function openPad(key, title){
    current = key;
    document.getElementById('modalTitle').textContent = title;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setViewportVars();
    if (isPhone()) modal.classList.add('rot');
    requestAnimationFrame(sizeCanvas);
    lockLandscape();
  }
  function closePad(){
    modal.classList.remove('open', 'rot'); document.body.style.overflow = ''; current = null;
    unlockOrientation();
  }

  /* ---------- girar a tela ao assinar ---------- */
  const isPhone = () => matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 900;
  function setViewportVars(){
    document.documentElement.style.setProperty('--vw', window.innerWidth + 'px');
    document.documentElement.style.setProperty('--vh', window.innerHeight + 'px');
  }
  // Tenta girar a tela sem entrar em tela cheia (tela cheia mostra um aviso do Chrome).
  // Se o navegador não deixar, a área de assinatura já aparece deitada (modo .rot).
  async function lockLandscape(){
    if (!isPhone() || !screen.orientation || !screen.orientation.lock) return;
    try { await screen.orientation.lock('landscape'); } catch(e){ /* sem permissão: fica o modo deitado */ }
  }
  function unlockOrientation(){
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch(e){}
  }

  const pos = e => {
    if (!modal.classList.contains('rot') || !matchMedia('(orientation: portrait)').matches){
      const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    // modal girado 90°: converte a posição da tela para a posição dentro do canvas
    const r = canvas.getBoundingClientRect();
    return { x: e.clientY - r.top, y: r.right - e.clientX };
  };
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch(_){}
    drawing = true; dirty = true; pts = [pos(e)];
    const p = pts[0]; ctx.beginPath(); ctx.arc(p.x, p.y, 1.3, 0, Math.PI*2); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
  });
  canvas.addEventListener('pointermove', e => {
    if (!drawing) return; e.preventDefault();
    const co = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    const events = co.length ? co : [e];
    for (const ev of events){
      pts.push(pos(ev));
      if (pts.length < 3) continue;
      const [a,b,c] = pts.slice(-3);
      const m1 = {x:(a.x+b.x)/2, y:(a.y+b.y)/2}, m2 = {x:(b.x+c.x)/2, y:(b.y+c.y)/2};
      ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.quadraticCurveTo(b.x, b.y, m2.x, m2.y); ctx.stroke();
    }
  });
  ['pointerup','pointercancel','pointerleave'].forEach(ev => canvas.addEventListener(ev, () => drawing = false));

  function trimmed(){
    const w = canvas.width, h = canvas.height, d = ctx.getImageData(0,0,w,h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
      if (d[(y*w + x)*4 + 3] > 10){ if (x<x0)x0=x; if (x>x1)x1=x; if (y<y0)y0=y; if (y>y1)y1=y; }
    }
    if (x1 < 0) return '';
    const pad = 12, sx = Math.max(0,x0-pad), sy = Math.max(0,y0-pad);
    const sw = Math.min(w, x1+pad) - sx, sh = Math.min(h, y1+pad) - sy;
    const out = document.createElement('canvas'); out.width = sw; out.height = sh;
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return out.toDataURL('image/png');
  }

  document.querySelectorAll('.sig').forEach(box => box.addEventListener('click', () => openPad(box.dataset.sig, box.dataset.title)));
  document.getElementById('mClear').onclick = () => { sizeCanvas(); };
  document.getElementById('mCancel').onclick = closePad;
  document.getElementById('mOk').onclick = () => {
    if (dirty) setSig(current, trimmed());
    closePad(); save();
  };
  // ao girar o celular, redimensiona sem perder o que já foi assinado
  window.addEventListener('resize', () => {
    if (!modal.classList.contains('open')) return;
    setViewportVars();
    const wasDirty = dirty, tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height; tmp.getContext('2d').drawImage(canvas, 0, 0);
    sizeCanvas();
    if (wasDirty){
      const dpr = window.devicePixelRatio || 1;
      ctx.drawImage(tmp, 0, 0, tmp.width / dpr, tmp.height / dpr);
      dirty = true;
    }
  });

  /* ---------- ações ---------- */
  // nome do arquivo = número da ocorrência
  const fileName = () => (form.elements.ocorrencia.value.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'RAT');
  function checkMissing(what){
    const d = collect(), faltando = [];
    if (!d.ocorrencia) faltando.push('Número da Ocorrência');
    if (!d.sigTecnico) faltando.push('Assinatura do técnico');
    if (!d.sigCliente) faltando.push('Assinatura do cliente');
    return !faltando.length || confirm('Faltando: ' + faltando.join(', ') + '.\n\nGerar ' + what + ' mesmo assim?');
  }

  /* ---------- modo impressão: mesmo layout do PDF, cabendo em 1 folha ---------- */
  const root = document.documentElement;
  const pre = (sel, p) => sel.split(',').map(x => { x = x.trim(); return /^html\b/.test(x) ? p + x.slice(4) : p + ' ' + x; }).join(',');
  (function setupPrintMode(){
    const css = [];
    for (const sh of document.styleSheets){
      let rules; try { rules = sh.cssRules; } catch(e){ continue; }
      for (const r of rules){
        if (!(r instanceof CSSMediaRule)) continue;
        const mt = r.media.mediaText;
        if (mt === 'print'){ for (const ir of r.cssRules) if (ir.selectorText) css.push(pre(ir.selectorText, 'html.pm') + '{' + ir.style.cssText + '}'); }
        else if (/max-width/.test(mt)){ for (const ir of r.cssRules) if (ir.selectorText) ir.selectorText = pre(ir.selectorText, 'html:not(.pm)'); }
      }
    }
    const st = document.createElement('style'); st.textContent = css.join('\n'); document.head.appendChild(st);
  })();
  // Procura o maior tamanho em que a RAT inteira cabe numa folha A4
  // no PDF, campos de data viram texto (o Android desenha uma seta no campo de data que o CSS não remove)
  function datesToText(){
    form.querySelectorAll('input[type=date]').forEach(inp => {
      const v = inp.value; inp.dataset.iso = v;
      inp.type = 'text';
      inp.value = v ? v.split('-').reverse().join('/') : '';
    });
  }
  function datesBack(){
    form.querySelectorAll('input[data-iso]').forEach(inp => {
      inp.type = 'date'; inp.value = inp.dataset.iso; delete inp.dataset.iso;
    });
  }
  function enterPrintMode(fit){
    if (!root.classList.contains('pm')) datesToText();
    root.classList.add('pm');
    form.style.removeProperty('--fit'); form.style.removeProperty('--w');
    layoutLined();
    if (!fit) return;
    const avail = 281 * 96 / 25.4 * 0.98;          // A4 (297mm) menos as margens de 8mm
    const heightAt = f => { form.style.setProperty('--w', (194 / f) + 'mm'); layoutLined(); return form.getBoundingClientRect().height; };
    if (heightAt(1) <= avail){ form.style.removeProperty('--w'); layoutLined(); return; }
    let lo = 0.25, hi = 1;
    for (let k = 0; k < 9; k++){ const m = (lo + hi) / 2; if (heightAt(m) * m <= avail) lo = m; else hi = m; }
    heightAt(lo);
    form.style.setProperty('--fit', lo.toFixed(4));
  }
  function exitPrintMode(){
    if (!root.classList.contains('pm')) return;
    root.classList.remove('pm');
    datesBack();
    form.style.removeProperty('--fit'); form.style.removeProperty('--w');
    layoutLined();
  }
  let oldTitle = document.title;
  window.addEventListener('beforeprint', () => {
    if (!root.classList.contains('pm')) enterPrintMode(true);
    if (document.title !== fileName()) oldTitle = document.title;
    document.title = fileName();
  });
  window.addEventListener('afterprint', () => { exitPrintMode(); document.title = oldTitle; });
  document.addEventListener('pointerdown', () => {
    if (root.classList.contains('pm') && !matchMedia('print').matches){ exitPrintMode(); document.title = oldTitle; }
  }, true);

  document.getElementById('btnPdf').onclick = () => {
    syncMirrors();
    if (!checkMissing('o PDF')) return;
    oldTitle = document.title;
    document.title = fileName();
    enterPrintMode(true);
    window.print();
  };

  /* ---------- menu "Gerar RAT" (PDF ou Imagem) ---------- */
  const gerarWrap = document.getElementById('gerarWrap'), btnGerar = document.getElementById('btnGerar');
  function setMenu(open){ gerarWrap.classList.toggle('open', open); btnGerar.setAttribute('aria-expanded', open); }
  btnGerar.addEventListener('click', () => setMenu(!gerarWrap.classList.contains('open')));
  document.getElementById('gerarMenu').addEventListener('click', e => { if (e.target.closest('button')) setMenu(false); });
  document.addEventListener('pointerdown', e => { if (!gerarWrap.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- baixar como imagem ---------- */
  function loadH2C(){
    if (window.html2canvas) return Promise.resolve();
    return new Promise((ok, fail) => {
      const sc = document.createElement('script');
      sc.src = 'assets/js/vendor/html2canvas.min.js'; sc.onload = ok;
      sc.onerror = () => fail(new Error('arquivo html2canvas.min.js não encontrado'));
      document.head.appendChild(sc);
    });
  }
  function prepClone(doc){
    const f = doc.getElementById('rat');
    f.classList.add('capmode');
    // a imagem usa as linhas normais (as linhas finas são só para o PDF)
    f.querySelectorAll('.inw > html2canvaspseudoelement, .lines i > html2canvaspseudoelement, .sigline > html2canvaspseudoelement').forEach(e => e.remove());
    f.querySelectorAll('.inw').forEach(w => { w.className = 'inw-cap'; });
    f.querySelectorAll('.lines').forEach(l => { l.className = 'lines-cap'; });
    f.querySelectorAll('.sigline').forEach(l => { l.className = 'sigline-cap'; });
    f.querySelectorAll('input:not([type=radio]):not([type=checkbox])').forEach(inp => {
      let v = form.elements[inp.name] ? form.elements[inp.name].value : inp.value;
      if (inp.type === 'date' && v){ const [y, m, d] = v.split('-'); v = `${d}/${m}/${y}`; }
      if (inp.name === 'estado') v = v.toUpperCase();
      if (!v && inp.classList.contains('hora')) v = '--:--';
      const sp = doc.createElement('span'); sp.className = 'cap'; sp.textContent = v || ' ';
      inp.replaceWith(sp);
    });
    f.querySelectorAll('textarea').forEach(ta => {
      const dv = doc.createElement('div'); dv.className = 'cap-ta';
      dv.textContent = form.elements[ta.name].value; dv.style.height = ta.style.height;
      ta.replaceWith(dv);
    });
    // X desenhado à mão
    const probe = document.createElement('span'); probe.className = 'capbox on'; document.body.appendChild(probe);
    const xImg = (getComputedStyle(probe, '::after').backgroundImage.match(/url\(["']?(.*?)["']?\)$/) || [])[1];
    probe.remove();
    f.querySelectorAll('input[type=radio]').forEach(r => {
      const orig = form.querySelector(`input[type=radio][name="${r.name}"][value="${r.value}"]`);
      const sp = doc.createElement('span'); sp.className = 'capbox';
      if (orig && orig.checked && xImg){
        const im = doc.createElement('img'); im.src = xImg.replace("viewBox=", "width='96' height='96' viewBox=");
        im.style.cssText = 'position:absolute;left:-6px;top:-7px;width:31px;height:31px;max-width:none;transform:rotate(-4deg)';
        sp.appendChild(im);
      }
      r.replaceWith(sp);
    });
    // títulos laterais (texto vertical) viram imagem já girada
    const sidesOrig = form.querySelectorAll('.side');
    f.querySelectorAll('.side').forEach((sd, i) => {
      const o = sidesOrig[i]; if (!o) return;
      const rc = o.getBoundingClientRect(), W = Math.round(rc.width), H = Math.round(rc.height), k = 3;
      const cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k;
      const c = cv.getContext('2d'); c.scale(k, k);
      let fs = 11; const txt = o.textContent.trim();
      c.font = fs + 'px Arial'; while (c.measureText(txt).width > H - 6 && fs > 6){ fs -= .5; c.font = fs + 'px Arial'; }
      c.fillStyle = '#1b1b1b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.translate(W / 2, H / 2); c.rotate(-Math.PI / 2); c.fillText(txt, 0, 0);
      const im = doc.createElement('img'); im.src = cv.toDataURL(); im.style.cssText = `display:block;width:${W}px;height:${H}px`;
      sd.textContent = ''; sd.appendChild(im);
      sd.style.cssText = `writing-mode:horizontal-tb;transform:none;padding:0;min-width:${W}px;width:${W}px;flex:none;border-left:0;border-right:1.5px solid var(--line)`;
    });
    f.querySelectorAll('.add-peca,.rm-peca,.sugg').forEach(e => e.remove());
  }
  // corta o espaço branco que sobra embaixo da imagem
  function trimBottom(cv, pad){
    const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data;
    let last = h - 1;
    outer: for (; last > 0; last--){
      for (let x = 0; x < w; x += 2){ const i = (last * w + x) * 4; if (d[i] < 245 || d[i+1] < 245 || d[i+2] < 245) break outer; }
    }
    const out = document.createElement('canvas'); out.width = w; out.height = Math.min(h, last + pad);
    const c = out.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, w, out.height); c.drawImage(cv, 0, 0);
    return out;
  }
  // gera a RAT aberta como imagem PNG (mesmo layout do PDF)
  async function makeImage(){
    try {
      await loadH2C();
      if (document.fonts) await document.fonts.ready;
      enterPrintMode(false);
      const rect = form.getBoundingClientRect();
      const raw = await html2canvas(form, { scale: 2, backgroundColor: '#ffffff', windowWidth: 1000, logging: false,
        width: Math.ceil(rect.width), height: Math.ceil(rect.height) + 200, onclone: prepClone });
      exitPrintMode();
      const canvas = trimBottom(raw, 24);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const name = fileName() + '.png';
      return { blob, name, file: new File([blob], name, { type: 'image/png' }) };
    } finally { exitPrintMode(); }
  }
  function download(blob, name){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  document.getElementById('btnImg').onclick = async () => {
    syncMirrors();
    if (!checkMissing('a imagem')) return;
    const btn = document.getElementById('btnGerar'), lbl = btn.querySelector('span'), txt = lbl.textContent;
    btn.disabled = true; lbl.textContent = 'Gerando...';
    try {
      const { blob, name, file } = await makeImage();
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS && navigator.canShare && navigator.canShare({ files: [file] })){
        await navigator.share({ files: [file], title: name });
      } else download(blob, name);
    } catch(e){
      if (e.name !== 'AbortError') alert('Não foi possível gerar a imagem: ' + e.message);
    } finally {
      btn.disabled = false; lbl.textContent = txt;
    }
  };

  /* ---------- compartilhar a RAT (imagem) ---------- */
  const shareBar = document.getElementById('shareBar');
  let shareFile = null;
  async function doShare(file){
    await navigator.share({ files: [file], title: file.name.replace(/\.png$/, '') });
  }
  async function shareRat(){
    syncMirrors();
    toast('Preparando a RAT para compartilhar...');
    let img;
    try { img = await makeImage(); }
    catch(e){ alert('Não foi possível gerar a imagem: ' + e.message); return; }
    const { blob, name, file } = img;
    if (!(navigator.canShare && navigator.canShare({ files: [file] }))){
      download(blob, name);
      toast('Este navegador não compartilha arquivos: a imagem foi baixada');
      return;
    }
    try { await doShare(file); }
    catch(e){
      if (e.name === 'AbortError') return;
      // o navegador exige um toque logo antes de abrir o compartilhar
      shareFile = file; shareBar.querySelector('b').textContent = name; shareBar.classList.add('show');
    }
  }
  document.getElementById('shareGo').onclick = async () => {
    shareBar.classList.remove('show');
    if (shareFile) try { await doShare(shareFile); } catch(e){ if (e.name !== 'AbortError') download(shareFile, shareFile.name); }
    shareFile = null;
  };
  document.getElementById('shareX').onclick = () => { shareBar.classList.remove('show'); shareFile = null; };
  /* ---------- Nova RAT / abrir / duplicar / excluir ---------- */
  // RAT "vazia" = só tem dados do técnico e datas
  const IGNORE = ['tecnico', 'razaoSocial', 'tecData', 'clienteData', 'sigTecnico', 'nPecas'];
  const isEmpty = d => !Object.keys(d || {}).some(k => !IGNORE.includes(k) && d[k] && String(d[k]).trim());

  function openRat(id){
    writeNow();
    const r = findRat(id); if (!r) return;
    currentId = id; writeList();
    apply(r.data); window.scrollTo(0, 0);
    toast('RAT ' + (r.data.ocorrencia || 'sem número') + ' aberta');
  }
  function createRat(data){
    writeNow();
    const cur = findRat(currentId);
    if (cur && isEmpty(cur.data) && !data){            // a atual já está em branco: reaproveita
      apply(defaults()); writeNow(); window.scrollTo(0, 0); return;
    }
    const r = { id: newId(), created: Date.now(), updated: Date.now(), data: data || defaults() };
    list.push(r); currentId = r.id; writeList();
    apply(r.data); writeNow(); window.scrollTo(0, 0);
  }
  function duplicateRat(id){
    writeNow();
    const r = findRat(id); if (!r) return;
    const d = JSON.parse(JSON.stringify(r.data));
    d.ocorrencia = ''; d.sigCliente = ''; d.status = ''; d.inicio = ''; d.termino = '';
    d.tecData = today(); d.clienteData = today();
    createRat(d);
    toast('Cópia criada: preencha o nº da ocorrência');
  }
  function deleteRat(id){
    const r = findRat(id); if (!r) return;
    if (!confirm('Excluir a RAT ' + (r.data.ocorrencia || 'sem número') + (r.data.cliente ? ' (' + r.data.cliente + ')' : '') + '?\n\nIsso não pode ser desfeito.')) return;
    list = list.filter(x => x.id !== id);
    if (id === currentId){
      if (list.length){ const last = [...list].sort((a, b) => b.updated - a.updated)[0]; currentId = last.id; apply(last.data); }
      else { const n = { id: newId(), created: Date.now(), updated: Date.now(), data: defaults() }; list.push(n); currentId = n.id; apply(n.data); }
    }
    writeList(); renderList();
  }

  document.getElementById('btnNova').onclick = () => { createRat(); toast('A RAT anterior ficou salva em "Minhas RATs"'); };
  document.getElementById('btnLimpar').onclick = () => {
    if (!confirm('Limpar todos os campos DESTA RAT (inclusive nome e assinatura do técnico salvos)?\n\nAs outras RATs salvas não são apagadas.')) return;
    localStorage.removeItem(KEEP);
    apply({ tecData: today(), clienteData: today() }); writeNow(); window.scrollTo(0,0);
  };

  /* ---------- painel "Minhas RATs" ---------- */
  const drawer = document.getElementById('drawer'), dwList = document.getElementById('dwList');
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  function fmtWhen(ms){
    const d = new Date(ms), now = new Date();
    const hm = d.toTimeString().slice(0, 5);
    if (d.toDateString() === now.toDateString()) return 'hoje às ' + hm;
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'ontem às ' + hm;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + hm;
  }
  function updateCount(){
    const n = list.length;
    document.getElementById('listaCount').textContent = n > 1 ? n : '';
    document.getElementById('dwCount').textContent = '(' + n + ')';
  }
  function renderList(){
    const items = [...list].sort((a, b) => b.updated - a.updated);
    dwList.innerHTML = items.map(r => {
      const d = r.data || {}, cur = r.id === currentId;
      const st = d.status === 'CONCLUIDO' ? '<i class="tag ok">Concluído</i>' : d.status === 'PENDENTE' ? '<i class="tag pend">Pendente</i>' : '';
      const sig = d.sigCliente ? '' : '<i class="tag nosig">Sem assinatura do cliente</i>';
      const sigImg = d.sigCliente ? `<span class="dw-sig"><img src="${d.sigCliente}" alt="Assinatura do cliente"><small>Assinatura do cliente</small></span>` : '';
      return `<div class="dw-item${cur ? ' cur' : ''}" data-id="${r.id}">
        <button type="button" class="dw-open" data-act="open">
          <span class="dw-t">${d.ocorrencia ? 'RAT ' + esc(d.ocorrencia) : '<em>RAT sem número</em>'}${cur ? ' <i class="tag now">aberta</i>' : ''}</span>
          <span class="dw-s">${esc(d.cliente || 'Sem cliente')}${d.eqModelo ? ' · ' + esc(d.eqModelo) : ''}</span>
          <span class="dw-tags">${st}${sig}</span>
          ${sigImg}
          <span class="dw-w">Editada ${fmtWhen(r.updated)}</span>
        </button>
        <div class="dw-acts">
          <button type="button" data-act="dup" title="Duplicar (usar como modelo)"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg><span>Duplicar</span></button>
          <button type="button" data-act="share" title="Compartilhar"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg><span>Compartilhar</span></button>
          <button type="button" data-act="del" class="del" title="Excluir"><svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg><span>Excluir</span></button>
        </div>
      </div>`;
    }).join('');
  }
  function openDrawer(){ writeNow(); renderList(); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeDrawer(){ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  document.getElementById('btnLista').onclick = openDrawer;
  document.getElementById('dwClose').onclick = closeDrawer;
  document.getElementById('dwBg').onclick = closeDrawer;
  document.getElementById('dwNova').onclick = () => { createRat(); closeDrawer(); toast('Nova RAT em branco'); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });
  dwList.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.closest('.dw-item').dataset.id, act = b.dataset.act;
    if (act === 'open'){ if (id !== currentId) openRat(id); closeDrawer(); }
    else if (act === 'dup'){ duplicateRat(id); closeDrawer(); }
    else if (act === 'del') deleteRat(id);
    else if (act === 'share'){ if (id !== currentId) openRat(id); closeDrawer(); shareRat(); }
  });

  /* ---------- aviso rápido ---------- */
  let toastT;
  function toast(msg){
    let el = document.getElementById('toast');
    if (!el){ el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------- início ---------- */
  // deixa a letra de caneta da impressão já carregada antes de gerar o PDF
  if (document.fonts) document.fonts.load('600 20px CaveatPrint').catch(() => {});
  list = readList();
  if (!list.length){                                   // primeira vez: traz o rascunho antigo, se houver
    let old = null; try { old = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
    list.push({ id: newId(), created: Date.now(), updated: Date.now(), data: old || defaults() });
    localStorage.removeItem(KEY);
  }
  currentId = findRat(localStorage.getItem(CUR)) ? localStorage.getItem(CUR) : [...list].sort((a, b) => b.updated - a.updated)[0].id;
  writeList();
  apply(findRat(currentId).data);
  /* ---------- funcionar offline (app instalável) ---------- */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
