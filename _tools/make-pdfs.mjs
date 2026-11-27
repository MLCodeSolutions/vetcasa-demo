import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'assets', 'docs');
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  {
    file: 'coprofagia.pdf',
    title: 'Coprofagia',
    subtitle: 'Guia VetCasa - entenda, previna e trate',
    lines: [
      'Este guia e um material demonstrativo da VetCasa.',
      '',
      '1. Coprofagia pode ter causas comportamentais ou clinicas.',
      '2. Observe quando acontece e o que muda na rotina.',
      '3. Nunca puna o pet: investigue a causa com a equipe.',
      '4. Exames podem ser necessarios para descartar doencas.',
      '',
      'Em caso de duvida, fale com a equipe VetCasa.'
    ]
  },
  {
    file: 'primeiro-pet.pdf',
    title: 'Seu Primeiro Pet',
    subtitle: 'Guia VetCasa - caes e gatos: por onde comecar',
    lines: [
      'Este guia e um material demonstrativo da VetCasa.',
      '',
      'Antes da chegada: prepare um cantinho seguro e tranquilo.',
      'Vacinas: siga o protocolo indicado na primeira consulta.',
      'Alimentacao: escolha a racao adequada a idade e porte.',
      'Rotina: sono, brincadeira e passeios com supervisao.',
      'Seguranca: telas, plantas e produtos de limpeza.',
      '',
      'Em caso de duvida, fale com a equipe VetCasa.'
    ]
  },
  {
    file: 'primeiro-pet-exotico.pdf',
    title: 'Seu Primeiro Pet Exotico',
    subtitle: 'Guia VetCasa - coelhos, aves e roedores',
    lines: [
      'Este guia e um material demonstrativo da VetCasa.',
      '',
      'Coelhos: feno a vontade e espaco para se mover.',
      'Aves: poleiros de madeira e banho de sol indireto.',
      'Roedores: enriquecimento ambiental e abrigos.',
      'Repteis: temperatura e umidade controladas.',
      'Exoticos precisam de manejo e ambiente especificos.',
      '',
      'Em caso de duvida, fale com a equipe VetCasa.'
    ]
  },
  {
    file: 'psitacideos.pdf',
    title: 'Psitacideos',
    subtitle: 'Guia VetCasa - alimentacao e ambiente ideais',
    lines: [
      'Este guia e um material demonstrativo da VetCasa.',
      '',
      'Alimentacao: racao extrusada e frutas com moderacao.',
      'Evite: sementes em excesso, sal, cafe e abacate.',
      'Ambiente: gaiola ampla, poleiros variados e brinquedos.',
      'Rotina: banho, sol indireto e horas de sono.',
      'Comportamento: aves sociais precisam de interacao.',
      '',
      'Em caso de duvida, fale com a equipe VetCasa.'
    ]
  }
];

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function buildPdf(page) {
  const body = [];
  page.lines.forEach((line, i) => {
    body.push(`BT /F1 12 Tf 56 ${620 - i * 26} Td (${esc(line)}) Tj ET`);
  });

  const content = [
    '0.431 0.071 0.106 rg 0 700 595 142 re f',
    '1 1 1 rg BT /F1 26 Tf 56 790 Td (VetCasa) Tj ET',
    '0.949 0.843 0.788 rg BT /F1 11 Tf 56 766 Td (VETERINARIA EM CASA) Tj ET',
    '0.431 0.071 0.106 rg BT /F1 24 Tf 56 660 Td (' + esc(page.title) + ') Tj ET',
    '0.506 0.208 0.220 rg BT /F1 12 Tf 56 638 Td (' + esc(page.subtitle) + ') Tj ET',
    '0.173 0.102 0.106 rg'
  ].concat(body).join('\n') + '\n';

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Length ' + Buffer.byteLength(content, 'latin1') + ' >>\nstream\n' + content + 'endstream'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  fs.writeFileSync(path.join(outDir, page.file), Buffer.from(pdf, 'latin1'));
}

pages.forEach(buildPdf);
console.log('PDFs gerados:', pages.map((p) => p.file).join(', '));
