// Tests de compose.js. Lancer : node .claude/skills/create-work-item-from-jira/tests.js
'use strict';
const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const compose = path.join(__dirname, 'compose.js');
let echecs = 0;

function bac(prefixeLocal) {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'wi-'));
  const tickets = path.join(racine, 'tickets');
  fs.mkdirSync(tickets);
  const reglages = path.join(racine, 'reglages.json');
  fs.writeFileSync(reglages, JSON.stringify({ prefixe: prefixeLocal || 'LOC' }));
  return { tickets, reglages };
}

function lancer(entree, b) {
  return execFileSync('node', [compose, '--tickets', b.tickets, '--reglages', b.reglages],
    { input: JSON.stringify(entree), encoding: 'utf8' }).trim();
}

function lancerEnEchec(entree, b) {
  try {
    lancer(entree, b);
    return null;
  } catch (e) {
    return String(e.stderr || '');
  }
}

function cas(nom, fn) {
  try {
    fn();
    console.log('ok   ' + nom);
  } catch (e) {
    echecs += 1;
    console.log('ECHEC ' + nom + ' : ' + e.message);
  }
}

const base = {
  cle: 'PROJ-1061',
  summary: 'RC : nom inverse dans le menu ',
  parent: 'Application 2.1 - Support',
  description: 'texte de la description',
  url: 'https://example.atlassian.net/browse/PROJ-1061'
};

cas('numero complete a quatre chiffres', () => {
  const b = bac();
  const chemin = lancer(Object.assign({}, base, { cle: 'PROJ-558', url: 'https://x/PROJ-558' }), b);
  assert.strictEqual(path.basename(chemin).startsWith('PROJ-0558-'), true, chemin);
  assert.match(fs.readFileSync(chemin, 'utf8'), /^id: PROJ-0558$/m);
  assert.match(fs.readFileSync(chemin, 'utf8'), /^jira: PROJ-558$/m);
});

cas('numero deja a quatre chiffres inchange', () => {
  const b = bac();
  const chemin = lancer(base, b);
  assert.strictEqual(path.basename(chemin).startsWith('PROJ-1061-'), true, chemin);
  assert.match(fs.readFileSync(chemin, 'utf8'), /^jira: PROJ-1061$/m);
});

cas('titre concatene avec l epic, espaces de bord coupees', () => {
  const b = bac();
  const contenu = fs.readFileSync(lancer(base, b), 'utf8');
  assert.match(contenu, /^title: "RC : nom inverse dans le menu \[Application 2.1 - Support\]"$/m);
});

cas('sans parent, pas de crochets vides', () => {
  const b = bac();
  const contenu = fs.readFileSync(lancer(Object.assign({}, base, { parent: null }), b), 'utf8');
  assert.match(contenu, /^title: "RC : nom inverse dans le menu"$/m);
});

cas('guillemet et barre oblique inverse echappes', () => {
  const b = bac();
  const entree = Object.assign({}, base, { summary: 'le "x" et le \\ ', parent: null });
  const contenu = fs.readFileSync(lancer(entree, b), 'utf8');
  assert.match(contenu, /^title: "le \\"x\\" et le \\\\"$/m);
});

cas('slug calcule sur le summary seul', () => {
  const b = bac();
  const chemin = lancer(Object.assign({}, base, { summary: 'Bug simple' }), b);
  assert.strictEqual(path.basename(chemin), 'PROJ-1061-bug-simple.md');
});

cas('slug borne a 60 caracteres, coupe sur un tiret', () => {
  const b = bac();
  const long = 'aaaaaaaaaa bbbbbbbbbb cccccccccc dddddddddd eeeeeeeeee ffffffffff gggg';
  const chemin = lancer(Object.assign({}, base, { summary: long }), b);
  const slug = path.basename(chemin).replace(/^PROJ-1061-/, '').replace(/\.md$/, '');
  assert.ok(slug.length <= 60, 'slug de ' + slug.length + ' caracteres');
  assert.strictEqual(slug.endsWith('-'), false, slug);
  assert.strictEqual(slug, 'aaaaaaaaaa-bbbbbbbbbb-cccccccccc-dddddddddd-eeeeeeeeee');
});

cas('accents deplies dans le slug', () => {
  const b = bac();
  const chemin = lancer(Object.assign({}, base, { summary: 'Libellé inversé' }), b);
  assert.strictEqual(path.basename(chemin), 'PROJ-1061-libelle-inverse.md');
});

cas('lien en tete du corps', () => {
  const b = bac();
  const contenu = fs.readFileSync(lancer(base, b), 'utf8');
  assert.ok(contenu.includes('\n[PROJ-1061](https://example.atlassian.net/browse/PROJ-1061)\n'), contenu);
});

cas('image remplacee par une mention', () => {
  const b = bac();
  const entree = Object.assign({}, base, { description: 'avant\n\n![](blob:https://media/x?a=1&b=2)\n\napres' });
  const contenu = fs.readFileSync(lancer(entree, b), 'utf8');
  assert.strictEqual(contenu.includes('blob:'), false, contenu);
  assert.ok(contenu.includes('_[image — voir le ticket Jira]_'), contenu);
  assert.ok(contenu.includes('avant') && contenu.includes('apres'), contenu);
});

cas('description vide : le corps se reduit au lien', () => {
  const b = bac();
  const contenu = fs.readFileSync(lancer(Object.assign({}, base, { description: null }), b), 'utf8');
  const corps = contenu.split('---\n')[2];
  assert.strictEqual(corps.trim(), '[PROJ-1061](https://example.atlassian.net/browse/PROJ-1061)');
});

cas('tags et statut a la creation', () => {
  const b = bac();
  const contenu = fs.readFileSync(lancer(base, b), 'utf8');
  assert.match(contenu, /^status: new$/m);
  assert.match(contenu, /^tags: \[Jira\]$/m);
  assert.match(contenu, /^superpowers-class: $/m);
});

cas('doublon refuse meme sous un autre slug', () => {
  const b = bac();
  lancer(base, b);
  const erreur = lancerEnEchec(Object.assign({}, base, { summary: 'titre entierement different' }), b);
  assert.ok(erreur && erreur.includes('PROJ-1061'), erreur);
  assert.strictEqual(fs.readdirSync(b.tickets).length, 1);
});

cas('prefixe local refuse', () => {
  const b = bac('LOC');
  const erreur = lancerEnEchec(Object.assign({}, base, { cle: 'LOC-0001' }), b);
  assert.ok(erreur && erreur.includes('LOC'), erreur);
  assert.strictEqual(fs.readdirSync(b.tickets).length, 0);
});

cas('cle mal formee refusee', () => {
  const b = bac();
  for (const cle of ['', 'PROJ', '1061', 'PROJ-', '-1061', 'PROJ 1061', 'proj-10a1']) {
    const erreur = lancerEnEchec(Object.assign({}, base, { cle }), b);
    assert.ok(erreur !== null, 'acceptee a tort : ' + JSON.stringify(cle));
    assert.ok(erreur.includes('cle mal formee'), erreur);
  }
  assert.strictEqual(fs.readdirSync(b.tickets).length, 0);
});

cas('cle en minuscules normalisee', () => {
  const b = bac();
  const chemin = lancer(Object.assign({}, base, { cle: 'proj-1061' }), b);
  assert.strictEqual(path.basename(chemin).startsWith('PROJ-1061-'), true, chemin);
});

cas('summary irreductible en slug refuse', () => {
  const b = bac();
  const erreur = lancerEnEchec(Object.assign({}, base, { summary: '??? — :' }), b);
  assert.ok(erreur !== null, 'accepte a tort');
  assert.ok(erreur.includes('slug'), erreur);
  assert.strictEqual(fs.readdirSync(b.tickets).length, 0);
});

cas('url absente refusee', () => {
  const b = bac();
  const erreur = lancerEnEchec(Object.assign({}, base, { url: '' }), b);
  assert.ok(erreur !== null, 'accepte a tort');
  assert.ok(erreur.includes('URL'), erreur);
  assert.strictEqual(fs.readdirSync(b.tickets).length, 0);
});

cas('la plage de diacritiques est echappee, pas ecrite en clair', () => {
  const source = fs.readFileSync(compose, 'utf8');
  assert.ok(source.includes('[\\u0300-\\u036f]'), 'echappement absent ou altere');
});

console.log(echecs === 0 ? 'TOUS LES CAS PASSENT' : echecs + ' CAS EN ECHEC');
process.exit(echecs === 0 ? 0 : 1);
