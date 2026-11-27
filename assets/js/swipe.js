/* Gesto de arrastar para o lado (celular): troca entre a RAT e a Máscara de atendimento.
   No <body>: data-swipe-next="página à direita" e/ou data-swipe-prev="página à esquerda". */
(function(){
  'use strict';
  const next = document.body.dataset.swipeNext, prev = document.body.dataset.swipePrev;
  if (!next && !prev) return;

  const MIN = 90;          // quanto precisa arrastar (px)
  let x0, y0, t0, ativo = false, dir = 0;

  // setinha que aparece na borda durante o arraste
  const seta = document.createElement('div');
  seta.className = 'swipe-hint';
  seta.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg><span></span>';
  document.body.appendChild(seta);

  // onde o gesto não deve funcionar
  function bloqueado(el){
    if (document.querySelector('.modal.open, .modal[style*="flex"], .drawer.open, body.md-open')) return true;
    for (let n = el; n && n !== document.body; n = n.parentElement){
      if (n.tagName === 'CANVAS' || n.tagName === 'SELECT' || n.isContentEditable) return true;
      if (n.scrollWidth > n.clientWidth + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;   // algo que rola para o lado
    }
    return false;
  }

  document.addEventListener('touchstart', e => {
    ativo = false;
    if (e.touches.length !== 1 || bloqueado(e.target)) return;
    const t = e.touches[0];
    // perto da borda é o "voltar" do próprio Android: deixa com ele
    if (t.clientX < 24 || t.clientX > innerWidth - 24) return;
    x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); ativo = true; dir = 0;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!ativo) return;
    const t = e.touches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)){ ativo = false; esconder(); return; }   // é rolagem
    const destino = dx < 0 ? next : prev;
    if (!destino || Math.abs(dx) < 25){ esconder(); return; }
    dir = dx < 0 ? -1 : 1;
    const p = Math.min(1, Math.abs(dx) / MIN);
    seta.className = 'swipe-hint show ' + (dir < 0 ? 'right' : 'left') + (p >= 1 ? ' ready' : '');
    seta.style.setProperty('--p', p.toFixed(2));
    seta.querySelector('span').textContent = destino.includes('mascara') ? 'Máscara' : 'RAT';
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!ativo) return;
    ativo = false;
    const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    esconder();
    if (Math.abs(dx) < MIN || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - t0 > 900) return;
    const destino = dx < 0 ? next : prev;
    if (!destino) return;
    if (document.activeElement) document.activeElement.blur();          // salva o campo que estava sendo digitado
    document.documentElement.classList.add(dx < 0 ? 'swipe-out-left' : 'swipe-out-right');
    setTimeout(() => { location.href = destino; }, 120);
  }, { passive: true });
  document.addEventListener('touchcancel', () => { ativo = false; esconder(); }, { passive: true });

  function esconder(){ seta.className = 'swipe-hint'; }

  // ao voltar pelo botão "voltar" do celular, a página pode vir da memória ainda deslizada
  window.addEventListener('pageshow', () => document.documentElement.classList.remove('swipe-out-left', 'swipe-out-right'));
})();
