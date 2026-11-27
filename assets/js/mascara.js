/* Máscara de atendimento: formulário próprio (não usa a RAT) que monta o texto no modelo da Voke */
(function(){
  'use strict';
  const KEY = 'rat-mascara-v1';

  // cada item do modelo: chave, rótulo exatamente como sai no texto, tipo e a explicação do modelo
  const CAMPOS = [
    ['chamado', 'Chamado:', 'text', 'Número do chamado'],
    ['diagnostico', 'Diagnostico:', 'area', 'Descrever detalhadamente o defeito que você encontrado no ato do atendimento'],
    ['solucao', 'Solução do atendimento:', 'area', 'Descrever a solução implementada na solução da falha'],
    ['imagem', 'Imagem instalada:', 'text', 'Código da Imagem'],
    ['nsAtivado', 'NS / peça ativado:', 'text', 'Patrimonio e Serial do equipamento novo'],
    ['nsDanificado', 'NS / peça danificado:', 'text', 'Patrimonio e Serial do equipamento atendido'],
    ['recolhido', 'NS IC / peça danificado recolhido:', 'simnao', 'OBRIGATÓRIAMENTE todos os chamados de CA precisam ser recolhidos exceto VLI CUBATÃO e clientes emissores pois precisa de NF'],
    ['testes', 'Testes realizados:', 'area', 'Descrever os testes realizados e quem acompanhou'],
    ['automatos', 'Validação do Autômatos / SGM :', 'simnao', 'é necessário sempre validar em cliente que tem o software'],
    ['hardware', 'Validação do Hardware (HD, processador e memória):', 'text', 'Configurações do ativo'],
    ['preventiva', 'Realizado preventiva (limpeza/diagnostico do fabricante/ troca pasta térmica):', 'simnao', 'OBRIGATÓRIAMENTE precisa ser feito em TODOS os clientes'],
    ['fechamento', 'Fechamento validado pela Voke com o usuário:', 'text', 'Nome do usuário que validou o atendimento'],
    ['avaria', 'Identificada avaria no equipamento?', 'avaria', ''],
    ['avariaDesc', 'Descrição da avaria encontrada (descrição detalhada):', 'area', 'Informar avarias identificadas no equipamento'],
    ['diagResolucao', 'Diagnostico para resolução (descrição detalhada):', 'area', '']
  ];

  const $ = id => document.getElementById(id);
  const form = $('mkForm'), out = $('mkOut');
  const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  // monta o formulário
  form.innerHTML = CAMPOS.map(([k, rot, tipo, dica]) => {
    const titulo = rot.replace(/\s*:\s*$/, '').replace(/\?$/, '?');
    let campo;
    if (tipo === 'area') campo = `<textarea id="f_${k}" name="${k}" rows="3" placeholder="${esc(dica)}"></textarea>`;
    else if (tipo === 'text') campo = `<input id="f_${k}" name="${k}" type="text" placeholder="${esc(dica)}">`;
    else {
      const [a, b] = tipo === 'avaria' ? ['SIM', 'NÃO'] : ['Sim', 'Não'];
      campo = `<div class="mk-sn" data-k="${k}">
        <button type="button" data-v="${a}">${a}</button><button type="button" data-v="${b}">${b}</button>
      </div>` + (dica ? `<small class="mk-dica">${esc(dica)}</small>` : '');
    }
    return `<div class="mk-f"><label class="mk-lbl" for="f_${k}">${esc(titulo)}</label>${campo}</div>`;
  }).join('');

  // dados
  let dados = {};
  try { dados = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ dados = {}; }

  function texto(){
    const linhas = CAMPOS.map(([k, rot, tipo]) => {
      const v = String(dados[k] || '').trim();
      if (tipo === 'avaria'){
        const x = s => dados[k] === s ? '(  X  )' : '(    )';
        return `${rot} ${x('SIM')} SIM  ${x('NÃO')} NÃO`;
      }
      return `${rot} ${v || 'N/A'}`;                                  // não preenchido sai N/A
    });
    return linhas.join('\n');
  }
  function grow(t){ t.style.height = 'auto'; t.style.height = (t.scrollHeight + 4) + 'px'; }
  function atualizar(){
    out.value = texto();
    // texto simples; cada item num bloco para a continuação da linha ficar recuada
    $('mkPrev').innerHTML = out.value.split('\n').map(l => `<div>${esc(l) || '&nbsp;'}</div>`).join('');
    localStorage.setItem(KEY, JSON.stringify(dados));
  }
  function preencher(){
    for (const [k, , tipo] of CAMPOS){
      if (tipo === 'area' || tipo === 'text'){ const el = $('f_' + k); el.value = dados[k] || ''; if (tipo === 'area') grow(el); }
      else form.querySelectorAll(`.mk-sn[data-k="${k}"] button`).forEach(b => b.classList.toggle('on', b.dataset.v === dados[k]));
    }
    atualizar();
  }

  form.addEventListener('input', e => {
    const el = e.target; if (!el.name) return;
    dados[el.name] = el.value;
    if (el.tagName === 'TEXTAREA') grow(el);
    atualizar();
  });
  form.addEventListener('click', e => {
    const b = e.target.closest('.mk-sn button'); if (!b) return;
    const k = b.parentElement.dataset.k;
    dados[k] = dados[k] === b.dataset.v ? '' : b.dataset.v;          // tocar de novo desmarca
    b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.v === dados[k]));
    atualizar();
  });
  $('mkClear').onclick = () => {
    if (!confirm('Limpar todos os campos da máscara?')) return;
    dados = {}; preencher(); window.scrollTo(0, 0);
  };

  /* ---------- modelos salvos (ex.: "Headset Logitech") ---------- */
  const MKEY = 'rat-mascara-modelos-v1';
  let modelos = [];
  try { modelos = JSON.parse(localStorage.getItem(MKEY) || '[]'); } catch(e){ modelos = []; }
  const gravarModelos = () => localStorage.setItem(MKEY, JSON.stringify(modelos));
  // pesquisa sem diferenciar acento e maiúscula
  const norm = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const busca = $('mdBusca'), mdList = $('mdList');

  function resumo(d){
    return [d.diagnostico, d.solucao, d.imagem].map(v => String(v || '').trim()).filter(Boolean).join(' · ');
  }
  function renderModelos(){
    $('mdCount').textContent = modelos.length ? '(' + modelos.length + ')' : '';
    $('dkCount').textContent = modelos.length || '';
    const termos = norm(busca.value).split(/\s+/).filter(Boolean);
    const achados = modelos
      .filter(m => { const t = norm(m.nome + ' ' + Object.values(m.dados).join(' ')); return termos.every(x => t.includes(x)); })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (!modelos.length){
      mdList.innerHTML = '<p class="mk-empty">Nenhuma máscara salva ainda. Preencha e toque em <b>Salvar</b>.</p>';
      return;
    }
    if (!achados.length){ mdList.innerHTML = '<p class="mk-empty">Nenhuma máscara encontrada.</p>'; return; }
    mdList.innerHTML = achados.map(m => `<div class="mk-md" data-id="${m.id}">
        <button type="button" class="mk-md-use" data-act="usar">
          <b>${esc(m.nome)}</b><small>${esc(resumo(m.dados) || 'Sem descrição')}</small>
        </button>
        <button type="button" class="mk-md-del" data-act="del" aria-label="Excluir máscara ${esc(m.nome)}">
          <svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>
        </button>
      </div>`).join('');
  }
  busca.addEventListener('input', renderModelos);
  mdList.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const m = modelos.find(x => x.id === b.closest('.mk-md').dataset.id); if (!m) return;
    if (b.dataset.act === 'usar'){
      // o nº do chamado é de cada atendimento: mantém o que já está digitado
      dados = { ...m.dados, chamado: dados.chamado || '' };
      preencher();
      fecharModelos();
      toast('Máscara "' + m.nome + '" carregada. Edite se precisar.');
      $('mkForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (confirm('Excluir a máscara "' + m.nome + '"?')){
      modelos = modelos.filter(x => x !== m); gravarModelos(); renderModelos();
    }
  });
  $('mdSalvar').onclick = () => {
    // já sugere o nº do chamado como nome: a pessoa só confirma ou edita
    const nome = (prompt('Nome da máscara (ex.: Headset Logitech):', String(dados.chamado || '').trim()) || '').trim();
    if (!nome) return;
    const { chamado, ...resto } = dados;                                  // o chamado não entra no modelo
    const igual = modelos.find(m => norm(m.nome) === norm(nome));
    if (igual){
      if (!confirm('Já existe a máscara "' + igual.nome + '". Substituir pelo que está preenchido agora?')) return;
      igual.dados = resto; igual.updated = Date.now();
    } else {
      modelos.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nome, dados: resto, updated: Date.now() });
    }
    gravarModelos(); busca.value = ''; renderModelos();
    toast('Máscara "' + nome + '" salva');
  };

  // ações
  let toastT;
  function toast(msg){
    const el = $('mkToast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400);
  }
  $('mkCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(out.value); }
    catch(e){ out.removeAttribute('readonly'); out.select(); document.execCommand('copy'); out.setAttribute('readonly', ''); }
    if (!/Android/i.test(navigator.userAgent)) toast('Máscara copiada');   // no Android o próprio sistema já mostra "Copiado"
  };
  $('mkWa').onclick = () => { window.open('https://wa.me/?text=' + encodeURIComponent(out.value), '_blank'); };
  $('mkShare').onclick = async () => {
    if (navigator.share){ try { await navigator.share({ text: out.value }); } catch(e){} }
    else { try { await navigator.clipboard.writeText(out.value); toast('Este navegador não compartilha: o texto foi copiado'); } catch(e){} }
  };

  // celular: os modelos abrem num painel que sobe de baixo
  const abrirModelos = () => { document.body.classList.add('md-open'); busca.value = ''; renderModelos(); };
  function fecharModelos(){ document.body.classList.remove('md-open'); busca.blur(); }
  $('dkModelos').onclick = abrirModelos;
  $('mdClose').onclick = fecharModelos;
  $('mdBg').onclick = fecharModelos;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModelos(); });

  // barra de baixo do celular repete as ações principais
  document.addEventListener('click', e => {
    const b = e.target.closest('.mk-dock [data-go], .mk-hsave'); if (b) $(b.dataset.go).click();
  });

  preencher();
  renderModelos();
})();
