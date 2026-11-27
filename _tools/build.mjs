/* ==========================================================================
   build.mjs — gera dist/ para o Google Sites
   - inline de CSS/JS no index.html
   - reescrita de assets para o jsDelivr com tag imutável
   - variantes index-external.html (CSS/JS com SRI) e embed.html (loader)
   - manifest.json / manifest.md e asserts de segurança
   Uso:
     OWNER=seu-login REPO=vetcasa-demo TAG=v1.0.0 node _tools/build.mjs
     node _tools/build.mjs --local   (gera dist/preview.html)
   ========================================================================== */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const local = args.includes('--local');
const argValue = (name) => {
  const found = args.find((arg) => arg.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : '';
};
const owner = (argValue('owner') || process.env.OWNER || '').trim();
const repo = (argValue('repo') || process.env.REPO || 'vetcasa-demo').trim();
const tag = (argValue('tag') || process.env.TAG || 'v1.0.0').trim();

if (!local && !owner) {
  console.error('ERRO: defina OWNER. Ex.: OWNER=seu-login node _tools/build.mjs');
  process.exit(1);
}

const base = local
  ? '../'
  : `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${tag}/`;

const abs = (p) => path.join(root, p);
const read = (p) => fs.readFile(abs(p), 'utf8');
const write = (p, data) => fs.writeFile(abs(p), data);
const ensure = async (p) => {
  try {
    await fs.access(abs(p));
    return true;
  } catch {
    return false;
  }
};

const CSS_LINK_RE = /<link\s+rel="stylesheet"\s+href="css\/([^"]+)"\s*>/g;
const JS_TAG_RE = /<script\s+src="js\/([^"]+)"\s+defer><\/script>/g;
const ASSET_RE = /(?:\.\.\/)+assets\//g;

const rewriteAssets = (text) => text.replace(ASSET_RE, `${base}assets/`);
const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const stripHtmlComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.woff2': 'font/woff2',
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.mp4': 'video/mp4'
  }[ext] || 'application/octet-stream';
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function sri(content) {
  return 'sha384-' + crypto.createHash('sha384').update(content).digest('base64');
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(abs(dir), { withFileTypes: true });
  for (const entry of entries) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await walk(rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}

async function main() {
  /* ---------- 1. Lê e valida as referências locais ---------- */

  const sourceHtml = await read('src/index.html');
  const cssNames = [...sourceHtml.matchAll(CSS_LINK_RE)].map((m) => m[1]);
  const jsNames = [...sourceHtml.matchAll(JS_TAG_RE)].map((m) => m[1]);

  if (!cssNames.length || !jsNames.length) {
    throw new Error('CSS ou JS não encontrados no src/index.html');
  }

  const cssRaw = [];
  for (const name of cssNames) {
    cssRaw.push({ name, content: await read(`src/css/${name}`) });
  }
  const jsRaw = [];
  for (const name of jsNames) {
    jsRaw.push({ name, content: await read(`src/js/${name}`) });
  }

  const refs = new Set();
  const htmlRefs = sourceHtml.matchAll(/(?:\.\.\/)+assets\/([^"')\s?#]+)/g);
  for (const m of htmlRefs) refs.add(m[1]);
  for (const css of cssRaw) {
    const cssRefs = css.content.matchAll(/(?:\.\.\/)+assets\/([^"')\s?#]+)/g);
    for (const m of cssRefs) refs.add(m[1]);
  }

  const missing = [];
  for (const rel of refs) {
    if (!await ensure(`assets/${rel}`)) missing.push(rel);
  }
  if (missing.length) {
    throw new Error('Assets referenciados e ausentes:\n - ' + missing.join('\n - '));
  }

  /* ---------- 2. CSS/JS processados ---------- */

  const cssFiles = cssRaw.map(({ name, content }) => ({
    name,
    content: stripCssComments(rewriteAssets(content))
  }));
  const jsFiles = jsRaw.map(({ name, content }) => ({
    name,
    content: rewriteAssets(content)
  }));

  const appCss = cssFiles.map((c) => `/* ${c.name} */\n${c.content}`).join('\n');
  const appJs = jsFiles.map((j) => `/* ${j.name} */\n${j.content}`).join('\n');
  const cssIntegrity = sri(appCss);
  const jsIntegrity = sri(appJs);

  /* ---------- 3. index.html inline ---------- */

  let inline = sourceHtml;
  let cssIndex = 0;
  let jsIndex = 0;

  inline = inline.replace(CSS_LINK_RE, () => {
    const file = cssFiles[cssIndex++];
    return `<style data-src="css/${file.name}">\n${file.content}\n</style>`;
  });

  inline = inline.replace(JS_TAG_RE, () => {
    const file = jsFiles[jsIndex++];
    return `<script data-src="js/${file.name}">\n${file.content}\n</script>`;
  });

  inline = rewriteAssets(inline);
  inline = stripHtmlComments(inline);

  const forbidden = ['javascript:', 'innerHTML'];
  if (!local) forbidden.push('@main', 'raw.githubusercontent.com');
  for (const token of forbidden) {
    if (inline.includes(token)) {
      throw new Error(`Token proibido no dist/index.html: ${token}`);
    }
  }
  if (!local && /(?:href|src|content)="(?:\.\.\/)*assets\//.test(inline)) {
    throw new Error('Ainda há caminho relativo de assets no HTML final.');
  }

  if (local) {
    await write('dist/preview.html', inline);
    const bytes = Buffer.byteLength(inline);
    console.log(`OK preview: dist/preview.html (${kb(bytes)})`);
    return;
  }

  await write('dist/index.html', inline);

  /* ---------- 4. Variante external + SRI ---------- */

  await write('dist/app.css', appCss);
  await write('dist/app.js', appJs);

  let external = sourceHtml;
  let firstCss = true;
  external = external.replace(CSS_LINK_RE, () => {
    if (!firstCss) return '';
    firstCss = false;
    return `<link rel="stylesheet" href="${base}dist/app.css" integrity="${cssIntegrity}" crossorigin="anonymous">`;
  });

  let firstJs = true;
  external = external.replace(JS_TAG_RE, () => {
    if (!firstJs) return '';
    firstJs = false;
    return `<script src="${base}dist/app.js" integrity="${jsIntegrity}" crossorigin="anonymous" defer></script>`;
  });

  external = rewriteAssets(external);
  external = stripHtmlComments(external);
  await write('dist/index-external.html', external);

  /* ---------- 5. Loader para o campo "Incorporar código" ---------- */

  const pageUrl = `${base}dist/index.html`;
  const embed = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>VetCasa</title>
<style>html,body{margin:0;height:100%;background:#f8f3ee}#app-fallback{font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#6e121b;padding:24px;text-align:center}#app-fallback a{color:#6e121b}</style>
</head>
<body>
<p id="app-fallback">Carregando o site…</p>
<script>
(function () {
  var url = ${JSON.stringify(pageUrl)};
  var fallback = document.getElementById('app-fallback');
  var timer = setTimeout(showFallback, 8000);

  function showFallback() {
    if (!fallback || !document.body.contains(fallback)) return;
    fallback.textContent = 'Não foi possível carregar o site. ';
    var link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Abrir em nova aba';
    fallback.appendChild(link);
  }

  fetch(url, { cache: 'force-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.text();
    })
    .then(function (html) {
      clearTimeout(timer);
      document.open();
      document.write(html);
      document.close();
    })
    .catch(showFallback);
}());
</script>
<noscript><p><a href="${pageUrl}" target="_blank" rel="noopener noreferrer">Abrir o site</a></p></noscript>
</body>
</html>
`;
  await write('dist/embed.html', embed);

  /* ---------- 6. Manifest ---------- */

  const assetFiles = await walk('assets');
  const distFiles = ['dist/index.html', 'dist/index-external.html', 'dist/embed.html', 'dist/app.css', 'dist/app.js'];
  const files = [];

  for (const rel of [...assetFiles, ...distFiles]) {
    const stat = await fs.stat(abs(rel));
    files.push({
      path: rel,
      url: `${base}${rel}`,
      mime: mimeOf(rel),
      bytes: stat.size
    });
  }

  files.sort((a, b) => a.path.localeCompare(b.path));

  const manifest = {
    owner,
    repo,
    tag,
    base,
    generatedAt: new Date().toISOString(),
    totalBytes: files.reduce((sum, f) => sum + f.bytes, 0),
    files
  };

  await write('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

  const rows = files.map((f) => `| \`${f.path}\` | ${f.url} | ${f.mime} | ${f.bytes} B (${kb(f.bytes)}) |`);
  const md = [
    '# Manifesto de assets',
    '',
    `Base: \`${base}\``,
    `Tag: \`${tag}\``,
    '',
    '| Arquivo | URL jsDelivr | Tipo | Tamanho |',
    '|---|---|---|---|',
    ...rows,
    ''
  ].join('\n');
  await write('dist/manifest.md', md);

  /* ---------- 7. Relatório ---------- */

  const sizeInline = Buffer.byteLength(inline);
  const sizeEmbed = Buffer.byteLength(embed);
  const sizeCss = Buffer.byteLength(appCss);
  const sizeJs = Buffer.byteLength(appJs);

  console.log('');
  console.log('Build concluído');
  console.log(`  CSS inline : ${kb(sizeCss)}`);
  console.log(`  JS inline  : ${kb(sizeJs)}`);
  console.log(`  index.html : ${kb(sizeInline)}`);
  console.log(`  embed.html : ${kb(sizeEmbed)}`);
  console.log(`  app.css    : ${kb(sizeCss)}  SRI ${cssIntegrity}`);
  console.log(`  app.js     : ${kb(sizeJs)}  SRI ${jsIntegrity}`);
  console.log('');
  console.log('Campo do Google Sites: teste a colagem de dist/index.html;');
  console.log('se recusar/truncar, use dist/embed.html (loader).');
}

main().catch((error) => {
  console.error('FALHA:', error.message);
  process.exit(1);
});
