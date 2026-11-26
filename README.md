# RAT – Relatório de Atendimento Técnico

**App no ar:** https://derikolis.github.io/Rat/

Site para preencher a RAT no celular: campos digitáveis, assinatura do técnico e do cliente com o dedo, e geração de PDF (1 folha A4) ou imagem PNG. Funciona offline depois de instalado.

## Estrutura

```
RAT/
├── index.html              página principal
├── manifest.json           dados do app instalável (nome, ícones, cores)
├── sw.js                   service worker (modo offline) – precisa ficar na raiz
├── vercel.json             configuração para publicar na Vercel
└── assets/
    ├── css/style.css       visual da RAT (tela, celular e impressão)
    ├── js/app.js           funcionamento (rascunho, assinaturas, PDF, imagem)
    ├── js/vendor/html2canvas.min.js   biblioteca que gera a imagem PNG
    ├── fonts/caveat-latin.woff2       letra de caneta
    ├── img/equipamentos.png           desenhos dos equipamentos (do PDF original)
    ├── img/rodape.png                 rodapé (do PDF original)
    └── icons/                         favicon e ícones do app
```

## Como publicar

**GitHub Pages (atual):** o site é publicado automaticamente a partir da branch `main`.
Para atualizar: aumente a versão em `sw.js`, faça commit e `git push` — em ~1 minuto o site atualiza.


O site precisa estar em **https** para instalar como app e funcionar offline.

**Vercel:**
1. No terminal, dentro da pasta `RAT`: `npx vercel --prod`
2. Na primeira vez, faça login e confirme as perguntas (o nome do projeto vira o link: `nome.vercel.app`)
3. Para publicar de novo depois de alterar: `npx vercel --prod`

**Netlify:** acesse https://app.netlify.com/drop e arraste a **pasta `RAT` inteira**.

**GitHub Pages:** envie o conteúdo da pasta para um repositório e ative o Pages em *Settings → Pages*.

## Instalar no celular

1. Abra o link **uma vez com internet**
2. **Android (Chrome):** menu ⋮ → *Instalar app*
   **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*
3. Pronto: o ícone RAT abre mesmo sem sinal

## Ao atualizar o site

1. Faça as alterações
2. Em `sw.js`, aumente a versão: `const CACHE = 'rat-v13'` → `'rat-v14'`
3. Publique de novo; os celulares pegam a versão nova na próxima vez que abrirem com internet

## Testar no computador

Abra com um servidor local (ex.: extensão *Live Server* do VS Code). Abrir o `index.html` com duplo clique (`file://`) não funciona por completo: o modo PDF/imagem e o modo offline precisam de um servidor.
