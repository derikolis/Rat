# RAT – Relatório de Atendimento Técnico

**App no ar:** https://derikolis.github.io/Rat/

Aplicativo web (PWA) para o técnico de campo preencher a **RAT** e a **Máscara de atendimento** no celular, sem papel.
Funciona offline depois de aberto uma vez e pode ser instalado como app no Android e no iPhone.

Os dados ficam **somente no aparelho**, no armazenamento do navegador. Não há servidor nem login, e nada é enviado para a internet.

---

## Funcionalidades

### RAT (`index.html`)
- **Formulário igual ao papel**: os mesmos campos e a mesma disposição da RAT impressa, com os desenhos dos equipamentos e o rodapé original.
- **Assinaturas com o dedo**: do técnico e do cliente. A tela gira, ou a área aparece deitada, para assinar com mais espaço.
- **Várias peças** na mesma RAT.
- **Hora digitável**, sem o relógio do Android.
- **Sugestões de técnico**: lembra os nomes já usados.
- **Rascunho automático**: tudo é salvo enquanto você digita.
- **Gerar RAT**:
  - **PDF**: sempre 1 folha A4, com linhas finas e letra de caneta.
  - **Imagem PNG**: o mesmo layout do PDF.
  - O nome do arquivo é o número da ocorrência.
- **Minhas RATs**: o painel lista as RATs salvas no aparelho.
  - **Pesquisa** por nº, cliente, equipamento, data ou status (pendente/concluído), sem diferenciar acento nem maiúscula.
  - Mostra a assinatura do cliente, ou o aviso "Sem assinatura do cliente".
  - Ações: **Abrir**, **Duplicar** (usar como modelo), **Compartilhar** (envia a imagem da RAT) e **Excluir**.
- **Nova RAT** e **Limpar**.

### Máscara de atendimento (`mascara.html`)
- Formulário próprio, **independente da RAT**, que monta o texto de fechamento no modelo da Voke:
  - Chamado, Diagnóstico, Solução, Imagem instalada, NS / peças;
  - Recolhido, Testes, Autômatos / SGM, Hardware, Preventiva;
  - Fechamento validado, Avaria (SIM/NÃO) e descrições.
- **Campos vazios saem como `N/A`**.
- **Texto pronto** com prévia para conferir, mais os botões **Copiar**, **WhatsApp** e **Compartilhar**.
- **Máscaras salvas**: guarde uma máscara pronta (ex.: "Headset Logitech") para reaproveitar.
  - Tem pesquisa.
  - Ao carregar uma máscara salva, o nº do chamado digitado não é apagado.
  - Ao salvar, o nome já vem preenchido com o nº do chamado.
- **No PC**, as máscaras salvas ficam numa coluna à direita.
- **No celular**, há uma barra de botões embaixo (Copiar · Máscaras · WhatsApp · Limpar) e as máscaras abrem num painel que sobe de baixo.

### Navegação
- **Celular**: arraste para a **esquerda** na RAT para abrir a Máscara. Arraste para a **direita** na Máscara para voltar à RAT.
  - O gesto não funciona perto da borda da tela, que fica para o "voltar" do Android.
  - Também não funciona sobre assinaturas nem com painéis abertos.
- **PC**: use o botão **Máscara** na barra da RAT e o botão **Voltar** na Máscara.

---

## Instalar no celular

1. Abra o link **uma vez com internet**.
2. **Android (Chrome):** menu ⋮ → *Instalar app*.
   **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.
3. Pronto: o ícone RAT abre mesmo sem sinal.

> Os dados ficam no navegador do aparelho. Limpar os dados do navegador ou desinstalar o app **apaga as RATs e as máscaras salvas**.

---

## Estrutura

```
RAT/
├── index.html                  RAT
├── mascara.html                Máscara de atendimento
├── manifest.json               dados do app instalável (nome, ícones, cores)
├── sw.js                       service worker (modo offline) – precisa ficar na raiz
├── vercel.json                 configuração opcional para a Vercel
└── assets/
    ├── css/style.css           visual da RAT (tela, celular e impressão/PDF)
    ├── css/mascara.css         visual da Máscara
    ├── css/swipe.css           setinha e animação do gesto de arrastar
    ├── js/app.js               RAT: rascunho, assinaturas, PDF, imagem, Minhas RATs
    ├── js/mascara.js           Máscara: formulário, texto pronto, máscaras salvas
    ├── js/swipe.js             gesto de arrastar entre as páginas
    ├── js/vendor/html2canvas.min.js   biblioteca que gera a imagem PNG
    ├── fonts/caveat-latin.woff2       letra de caneta
    ├── img/equipamentos.png           desenhos dos equipamentos (do PDF original)
    ├── img/rodape.png                 rodapé (do PDF original)
    └── icons/                         favicon e ícones do app
```

Não há build nem dependências: são arquivos estáticos (HTML, CSS e JavaScript puro).

### Onde os dados ficam (`localStorage`)

| Chave | Conteúdo |
|---|---|
| `rat-atual-v1` | RAT aberta no momento (rascunho) |
| `rat-lista-v1` | RATs salvas (Minhas RATs) |
| `rat-tecnico-v1`, `rat-tecnicos-v1` | dados e nomes de técnicos já usados |
| `rat-mascara-v1` | máscara sendo preenchida |
| `rat-mascara-modelos-v1` | máscaras salvas |

---

## Publicar uma atualização

O site é publicado pelo **GitHub Pages** a partir da branch `main` (pasta raiz).

1. Faça as alterações.
2. Em `sw.js`, aumente a versão do cache: `const CACHE = 'rat-v55'` → `'rat-v56'`.
3. Em **`index.html` e `mascara.html`**, aumente o `?v=` dos arquivos CSS/JS para o mesmo número (ex.: `style.css?v=55` → `?v=56`).
   Assim o celular não mistura arquivos novos com antigos guardados.
4. `git add -A`, `git commit` e `git push`.
5. Em cerca de 1 minuto o site atualiza. Os celulares pegam a versão nova na próxima vez que abrirem com internet.

Se algum aparelho continuar mostrando a versão antiga: no PC, use **Ctrl+F5**. No celular, feche o app e abra de novo com internet.

O site precisa estar em **https** para instalar como app e funcionar offline.

### Outras hospedagens (opcional)
- **Vercel:** dentro da pasta, rode `npx vercel --prod`. Na primeira vez, faça login e confirme as perguntas.
- **Netlify:** em https://app.netlify.com/drop, arraste a **pasta `RAT` inteira**.

---

## Testar no computador

Abra com um servidor local, por exemplo:

```bash
python -m http.server 8000
# depois acesse http://localhost:8000
```

Também serve a extensão *Live Server* do VS Code.

Abrir o `index.html` com duplo clique (`file://`) não funciona por completo: o PDF, a imagem e o modo offline precisam de um servidor.

Para ver o layout de celular, use o modo dispositivo do navegador (F12 → ícone de celular). O gesto de arrastar só funciona com toque.

### Cuidados ao mexer no layout
- **Tela e PDF são ajustados separadamente.** Para mudar o PDF, altere só o CSS de impressão (`@media print` em `style.css`), para não estragar a tela de preenchimento.
- O **PDF precisa caber em 1 folha A4** e ficar igual ao modelo em papel. Confira gerando o PDF depois de cada mudança.
