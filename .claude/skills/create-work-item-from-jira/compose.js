// Compose un work item a partir d'un ticket Jira.
// Entree  : JSON sur l'entree standard { cle, summary, parent, description, url }
// Sortie  : le chemin du fichier cree, sur la sortie standard.
// Arret   : message sur la sortie d'erreur et code 1, sans rien avoir ecrit.
'use strict';
const fs = require('fs');
const path = require('path');

function arret(message) {
  process.stderr.write(message + '\n');
  process.exit(1);
}

function lireOptions(argv) {
  const o = { tickets: 'docs/10-work-items', reglages: 'docs/work-items-settings.json' };
  for (let i = 0; i < argv.length; i += 2) {
    if (argv[i] === '--tickets') o.tickets = argv[i + 1];
    else if (argv[i] === '--reglages') o.reglages = argv[i + 1];
    else arret('option inconnue : ' + argv[i]);
  }
  return o;
}

function slugifier(texte) {
  const brut = String(texte || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (brut.length <= 60) return brut;
  const coupe = brut.slice(0, 60);
  const tiret = coupe.lastIndexOf('-');
  return (tiret > 0 ? coupe.slice(0, tiret) : coupe).replace(/-+$/, '');
}

function echapperYaml(texte) {
  return texte.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function composerTitre(summary, parent) {
  const s = String(summary || '').trim();
  const p = String(parent || '').trim();
  return p ? s + ' [' + p + ']' : s;
}

function composerCorps(description, cle, url) {
  const lien = '[' + cle + '](' + url + ')';
  const texte = String(description || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '_[image — voir le ticket Jira]_')
    .trim();
  return texte ? lien + '\n\n' + texte + '\n' : lien + '\n';
}

function main() {
  const o = lireOptions(process.argv.slice(2));

  let entree;
  try {
    entree = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    arret('entree JSON illisible : ' + e.message);
  }

  const cle = String(entree.cle || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9]*-[0-9]+$/.test(cle)) {
    arret('cle mal formee : ' + JSON.stringify(entree.cle || '') + ' - arret');
  }

  let reglages;
  try {
    reglages = JSON.parse(fs.readFileSync(o.reglages, 'utf8'));
  } catch (e) {
    arret('reglage illisible : ' + o.reglages + ' - arret');
  }
  if (!reglages.prefixe) arret('prefixe vide dans ' + o.reglages + ' - arret');

  const coupure = cle.lastIndexOf('-');
  const prefixe = cle.slice(0, coupure);
  const numero = parseInt(cle.slice(coupure + 1), 10);
  if (prefixe === reglages.prefixe) {
    arret('prefixe ' + prefixe + ' identique au prefixe local - arret');
  }

  const id = prefixe + '-' + String(numero).padStart(4, '0');

  let presents;
  try {
    presents = fs.readdirSync(o.tickets);
  } catch (e) {
    arret('dossier des tickets illisible : ' + o.tickets + ' - arret');
  }
  const doublon = presents.find(f => f.startsWith(id + '-'));
  if (doublon) arret('un work item existe deja pour ' + id + ' : ' + doublon + ' - arret');

  const slug = slugifier(entree.summary);
  if (!slug) arret('titre Jira irreductible en slug - arret');

  const url = String(entree.url || '').trim();
  if (!url) arret('URL du ticket absente - arret');

  const contenu =
    '---\n' +
    'id: ' + id + '\n' +
    'title: "' + echapperYaml(composerTitre(entree.summary, entree.parent)) + '"\n' +
    'status: new\n' +
    'superpowers-class: \n' +
    'tags: [Jira]\n' +
    'jira: ' + cle + '\n' +
    '---\n\n' +
    composerCorps(entree.description, cle, url);

  const chemin = path.join(o.tickets, id + '-' + slug + '.md');
  fs.writeFileSync(chemin, contenu);
  process.stdout.write(chemin + '\n');
}

main();
