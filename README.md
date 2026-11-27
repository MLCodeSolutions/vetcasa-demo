# VetCasa — site estático + embed para Google Sites

Site institucional demonstrativo da **VetCasa** (veterinária domiciliar fictícia), construído para ser publicado como **um único `index.html`** dentro de um bloco “Incorporar código” do Google Sites. O site tem header sticky, menu mobile, botão flutuante de WhatsApp, voltar ao topo, preloader e lightbox próprios; nada depende dos recursos nativos do Sites.

> **Dados fictícios.** Marca, textos, contatos, CRMV e PDFs são de demonstração. Não use o WhatsApp/e-mail publicados como contato real. Troque em `src/js/site-config.js` antes de um uso de produção.

## Estrutura

```
assets/
  img/art/          23 ilustrações SVG (hero, galeria, capas, exóticos)
  img/brand/        logos VetCasa (SVG)
  img/social/       og-vetcasa.jpg (1200x630, 32 KB)
  img/favicon.svg
  video/            vazio (.gitkeep) — nenhum vídeo no projeto
  docs/             4 PDFs demonstrativos (~1,5 KB cada)
  fonts/            8 WOFF2 de texto + lucide.woff2
src/
  index.html        fonte editável
  css/              tokens, base, layout, components, illustrations, booking, motion, lucide, app
  js/               site-config, main, booking, motion, app
dist/
  index.html        completo, CSS/JS inline, assets absolutos no jsDelivr
  index-external.html  alternativa com app.css/app.js + SRI
  app.css / app.js  usados só pela variante external
  embed.html        loader (~1,5 KB) para o campo do Google Sites
  manifest.json     inventário legível por máquina
  manifest.md       tabela arquivo → URL → tipo → tamanho
_tools/
  build.mjs         build/inline/rewrite CDN/SRI/manifest/asserts
  make-pdfs.mjs     regenera os 4 PDFs
```

Regras de nome: minúsculas, sem espaço/acento, `[a-z0-9-]`.

## URLs imutáveis

Todo asset usa a tag fixa (nunca `@main`, nunca `raw.githubusercontent.com`, nunca caminho relativo no `dist`):

```
https://cdn.jsdelivr.net/gh/Mateus-TDM/vetcasa-demo@v1.0.0/<caminho>
```

> **OWNER provisório:** `Mateus-TDM` (nome do `git config` local). Confirme com `gh api user --jq .login` após o login; se for outro, rode `node _tools/build.mjs --owner=<login>` antes de commitar/taguear. O `dist` atual foi gerado com esse OWNER.

A tabela completa, com tipo e bytes, é gerada em [`dist/manifest.md`](dist/manifest.md). Resumo:

| Grupo | Qtd. | Caminho | Tipo | Tamanho |
|---|---:|---|---|---|
| Ilustrações | 23 | `assets/img/art/*.svg` | image/svg+xml | 1,0–3,0 KB |
| Logos | 2 | `assets/img/brand/*.svg` | image/svg+xml | ~1,1 KB |
| Favicon | 1 | `assets/img/favicon.svg` | image/svg+xml | 0,7 KB |
| OG | 1 | `assets/img/social/og-vetcasa.jpg` | image/jpeg | 32,1 KB |
| PDFs | 4 | `assets/docs/*.pdf` | application/pdf | 1,4–1,5 KB |
| Fontes | 9 | `assets/fonts/*.woff2` | font/woff2 | 11–214 KB |
| Vídeos | 0 | — | — | — |
| Página | 1 | `dist/index.html` | text/html | 216,5 KB |
| Loader | 1 | `dist/embed.html` | text/html | 1,5 KB |
| CSS/JS externos | 2 | `dist/app.css`, `dist/app.js` | text/css, text/javascript | 134,8 / 28,2 KB |

> As ilustrações são SVG (vetoriais). Por isso não há versões 600/1200 px: a regra de raster não se aplica. Se fotos raster forem adicionadas, gere WebP 600 e 1200 px.

## Build

```powershell
# QA local (gera dist/preview.html com caminhos ../assets)
node _tools/build.mjs --local

# Build de produção (tag imutável)
node _tools/build.mjs --owner=<OWNER> --repo=vetcasa-demo --tag=v1.0.0
```

O build:
- valida se todo asset referenciado existe;
- embute os 9 CSS e os 5 JS na `dist/index.html`;
- reescreve `../assets/` e `url("../../assets/...")` para o jsDelivr com a tag;
- remove comentários de CSS/HTML;
- falha se encontrar `@main`, `raw.githubusercontent.com`, `javascript:`, `innerHTML` ou caminho relativo de asset;
- gera `dist/index-external.html` com `integrity="sha384-..."` e `crossorigin="anonymous"`;
- gera `dist/embed.html`, `dist/manifest.json` e `dist/manifest.md`.

O teste local pode ser servido com `python -m http.server 8765` na raiz e `http://localhost:8765/dist/preview.html`.

### Tamanho e limite do Google Sites

- `dist/index.html` completo: **216,5 KB**.
- Somente o HTML (variante external): **53,6 KB**.
- `dist/embed.html`: **1,5 KB**.

Há relatos de limite de ~10.000 caracteres no campo “Incorporar código”, mas **não trate isso como certo**: cole e teste. Se o campo recusar/truncar o arquivo completo, use `dist/embed.html`. Ele busca `dist/index.html` no jsDelivr e substitui o documento com `document.write` (sem iframe aninhado), mantendo header fixo, âncoras e rolagem única. A variante external não resolve sozinha o limite porque o HTML ainda tem ~54 KB.

## Publicação no GitHub

Pré-requisitos: `gh auth login` (device flow/navegador) — nunca cole token no chat ou no repositório. O `OWNER` é o login retornado por `gh api user --jq .login`.

```powershell
git init -b main
git add .
git commit -m "VetCasa: site estatico, build CDN e embed para Google Sites"

node _tools/build.mjs --owner=Mateus-TDM --repo=vetcasa-demo --tag=v1.0.0

git add dist
git commit -m "build: dist v1.0.0"

gh repo create Mateus-TDM/vetcasa-demo --public --source . --remote origin --push
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

- O `dist/` é **commitado** (o jsDelivr serve os arquivos da tag).
- Qualquer alteração exige **nova tag** (`v1.0.1`, ...). Nunca mover, apagar ou reutilizar uma tag.
- O jsDelivr pode levar alguns minutos para indexar a tag; um 404 logo após o push pode ser atraso. Teste novamente.
- Verificação rápida de todas as URLs:

```powershell
Get-Content dist/manifest.json | ConvertFrom-Json | ForEach-Object { $_.files } | ForEach-Object { $r = Invoke-WebRequest -Uri $_.url -Method Head -UseBasicParsing; "$($r.StatusCode) $($_.path)" }
```

## Google Sites — passo a passo

1. Abra `sites.google.com` no editor e crie/abra a página que receberá o site.
2. Na engrenagem da página, use **“Ocultar título da página”** (se existir).
3. Em **Tema**, escolha o cabeçalho mínimo/sem banner e remova logo. Em **Configurações → Navegação** (ou **Tema → Navegação**), oculte a navegação nativa. Os rótulos mudam por versão; confira no editor.
4. **Inserir → Incorporar → aba “Incorporar código”**.
   - **1ª tentativa:** abra `dist/index.html`, copie tudo, cole e clique em **Avançar → Inserir**.
   - **Se recusar/truncar:** cole `dist/embed.html` (loader de 1,5 KB). Ele carrega a página completa do jsDelivr.
5. Selecione o bloco e arraste as alças até as quatro bordas; use **Largura total** na seção, se aparecer; estique a altura ao máximo. Não há garantia de “embed em página inteira” para código — é manual.
6. Apague todos os outros blocos/seções: a página deve conter **somente** o embed, para não criar rolagem dupla.
7. **Publicar → “Qualquer pessoa”** e abra a URL publicada (não valide só no editor).
8. Teste em **Chrome desktop, Safari iOS e Chrome Android reais**: header grudado, menu mobile, WhatsApp, voltar ao topo, âncoras, lightbox e preloader.

### Limitações do Sites

- O Sites pode manter header/nav/footer conforme o tema; “sem nada nativo” é uma meta, não uma garantia.
- A largura do embed é limitada pela área de conteúdo no desktop; pode haver margem no mobile.
- A altura do bloco é fixa em px. Em telas curtas pode ocorrer rolagem externa + interna (dupla). Estique o bloco e teste no aparelho.
- O comportamento de “tela cheia” varia por dispositivo.
- `title`, meta, OG, canonical e JSON-LD não contam para SEO dentro do embed; o source os mantém apenas para uso direto da página.
- Analytics está desligado por padrão.

## Segurança

- Nenhum token, senha ou `.env` no repositório, no chat ou no código.
- Login apenas via `gh auth login`/Git Credential Manager.
- 2FA na conta GitHub (ação manual).
- Branch protection em `main` (bloquear force push/deleção; PR opcional para repo solo).
- Secret scanning e Dependabot alerts em Settings → Code security.
- Sem `@main` e sem `raw.githubusercontent.com` (asserts do build).
- Links externos com `rel="noopener noreferrer"`; URLs de config passam por `safeUrl()` (somente `http(s)`).
- Sem `innerHTML` com dado não confiável; o loader cria o link de fallback via DOM.
- Sem backend, e-commerce, carrinho, login ou agendamento real: o wizard é mock e o envio final é um link `wa.me`.
- Documentos confidenciais nunca entram neste repositório público; os 4 PDFs aqui são demonstrativos.

## PENDENTE

- [ ] Concluir `gh auth login` e confirmar `OWNER` (o build resolve por `gh api user --jq .login`).- [ ] Criar o repositório público e enviar a tag `v1.0.0`.
- [ ] Substituir contatos fictícios (`5511912345678`, `contato@vetcasa.com.br`, `@vetcasa.demo`) por dados reais, se for produção.
- [ ] Vídeos: não há arquivos. Manter placeholders ou informar IDs do YouTube (aí liberar `frame-src https://www.youtube-nocookie.com`).
- [ ] Fotos reais: nenhuma; pipeline WebP 600/1200 só se entrarem.
- [ ] Testar o limite real do campo do Sites e a altura máxima do bloco.
- [ ] Ativar 2FA, branch protection e secret scanning.
- [ ] Registrar a URL publicada do Google Sites.

## Riscos e limites

- **Limite do campo:** 216,5 KB inline pode ser recusado; o fallback é `embed.html`. Teste a colagem.
- **Sandbox do Sites:** `fetch`/`document.write` precisam ser validados nos três navegadores; se bloquearem, use a variante que o campo aceitar.
- **jsDelivr:** atraso de indexação da tag; arquivos >20 MB não são suportados (nenhum aqui chega perto; vídeos são 0).
- **Rolagem dupla** em telas curtas por altura fixa do bloco.
- **OneDrive + git:** locks eventuais; prefira uma cópia local fora do OneDrive se possível.
- **Fonte de ícones:** `lucide.woff2` tem 214 KB; o modo leve não remove a fonte, só animações/sombras.

## Rollback

1. Recoloque no Sites o bloco da tag anterior (URLs com `@v-anterior`).
2. Para corrigir, crie uma **nova tag**, rode o build e recole o novo bloco.
3. Nunca mova/apague/reutilize tags já publicadas.

## Checklist de aceite

- [x] Sem token/senha/.env no repo, no chat ou no código.
- [x] Sem `@main` e sem `raw.githubusercontent.com` no `dist` (verificado pelo build).
- [ ] URLs do jsDelivr testadas após o push/tag (200 OK).
- [x] Sem rolagem horizontal em 390, 768 e 1440 px (medido: `scrollWidth == clientWidth`).
- [x] Header sticky, menu mobile, WhatsApp, voltar ao topo, âncoras, lightbox e preloader testados localmente.
- [x] Preloader libera em ≤3 s; fallback CSS funciona sem JS (testado com JS desativado).
- [x] `prefers-reduced-motion` e modo leve (`is-lite`) funcionando.
- [x] Links externos com `rel="noopener noreferrer"`; `safeUrl()` ativo.
- [x] PDFs abrem em nova aba (200 OK no servidor local).
- [ ] Teste em celular real (iOS Safari + Android Chrome) na URL publicada.
- [ ] Tag `v1.0.0` publicada e imutável.
