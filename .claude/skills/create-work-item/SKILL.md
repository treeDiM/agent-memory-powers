---
name: create-work-item
description: Use when the user asks to create a new work item or ticket for this project, or invokes /create-work-item <titre>. Allocates the next ticket number, writes docs/10-work-items/<PREFIXE>-<nnnn>-<slug>.md with its front matter, and updates the folder index.
---

# Créer un work item

Crée **un** work item numéroté dans `docs/10-work-items/`. Ne renumérote rien, ne réécrit aucun ticket existant, ne touche à aucun statut. Créer est le seul verbe de cette skill.

Le titre est l'argument de la commande. S'il est absent, le demander avant toute chose.

## 1. Lire le préfixe

L'état du shell ne survit pas d'une commande à l'autre : chaque bloc ci-dessous pose donc
lui-même sa variable plutôt que de compter sur un héritage qui n'existe pas.

```bash
prefixe=$(node -e "const s=JSON.parse(require('fs').readFileSync('docs/work-items-settings.json','utf8')); if(!s.prefixe) throw new Error('prefixe vide'); process.stdout.write(s.prefixe)")
test -n "$prefixe" || { echo "réglage illisible ou prefixe vide — arrêt"; exit 1; }
```

Si la commande échoue — fichier absent, JSON invalide, `prefixe` vide — **s'arrêter** et le
dire à l'utilisateur. Ne jamais retomber sur une valeur par défaut : un ticket mal nommé
passerait inaperçu.

## 2. Calculer le numéro suivant

Reposer `prefixe` (bloc 1) avant de s'en servir : c'est un nouveau bloc, sans état hérité.

```bash
prefixe=$(node -e "const s=JSON.parse(require('fs').readFileSync('docs/work-items-settings.json','utf8')); if(!s.prefixe) throw new Error('prefixe vide'); process.stdout.write(s.prefixe)")
test -n "$prefixe" || { echo "réglage illisible ou prefixe vide — arrêt"; exit 1; }

dernier=$(ls docs/10-work-items/ | sed -nE "s/^${prefixe}-0*([0-9]+)-.*/\1/p" | sort -n | tail -1)

if [ -z "$dernier" ]; then
  if ls docs/10-work-items/ | grep -q "^${prefixe}-"; then
    echo "balayage vide alors que des tickets ${prefixe}-* existent — anomalie, arrêt"; exit 1
  fi
  numero=1
else
  numero=$((dernier + 1))
fi
```

Le motif lit `([0-9]+)` et **jamais** `([0-9]{3})` : le jour où la largeur changerait, une
lecture à largeur fixe cesserait de voir les tickets existants et repartirait de 1 en
écrasant.

**Un balayage qui ne rend rien alors que `docs/10-work-items/` contient déjà des fichiers
`<prefixe>-*` est une anomalie, pas un dépôt vide — dans ce cas, s'arrêter.** Le repli sur `1` ne vaut que pour un dossier réellement sans aucun ticket portant ce préfixe. Sinon, le plus grand numéro trouvé plus un.

Formater sur quatre chiffres : `printf '%04d' "$numero"`.

## 3. Réduire le titre en slug

`titre` est l'argument reçu par la commande (voir plus haut) ; le poser explicitement avant de s'en servir, pour la même raison qu'au bloc précédent.

```bash
slug=$(node -e "process.stdout.write(process.argv[1].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''))" "$titre")
test -n "$slug" || { echo "titre irréductible en slug — redemander un titre — arrêt"; exit 1; }
```

Accents dépliés, minuscules, tout le reste en tirets, tirets multiples réduits, tirets de
bord coupés. La plage de diacritiques est écrite avec les échappements `\u0300-\u036f`, jamais en caractères nus : des octets bruts survivraient à une normalisation d'éditeur ou à un pipeline non-UTF-8, silencieusement.

Si `slug` est vide — titre comme `"???"`, `"— :"` ou des espaces seules — **s'arrêter** et
redemander un titre. Un slug vide donnerait un fichier `<PREFIXE>-<nnnn>-.md`.

## 4. Refuser d'écraser

Si `docs/10-work-items/<PREFIXE>-<nnnn>-<slug>.md` existe déjà, **s'arrêter** et le dire.
Ne jamais écraser un work item.

## 5. Écrire le fichier

Le fichier contient **le front matter et rien d'autre** — pas de titre `#`, pas de plan de
document. Le corps appartient à l'auteur, et un gabarit qu'il faut effacer est pire que rien.

```yaml
---
id: <PREFIXE>-<nnnn>
title: "Le titre saisi, tel quel"
status: new
superpowers-class: 
tags: []
---
```

`title` est **toujours** entre guillemets droits : un titre contenant « : » casse l'analyse
YAML s'il ne l'est pas. Le titre est repris tel que saisi, sans reformulation.

`status: new` toujours. Les valeurs possibles sont `draft`, `new`, `deferred`,
`in-progress`, `review`, `done`, `canceled` — mais la création en pose une seule.

`superpowers-class` : valeurs possibles : `spike`, `bounded`, `architectural`. Non renseigné à la création.

## 6. Mettre à jour l'index

Dans `docs/10-work-items/README.md`, ajouter une entrée relative au nouveau fichier créé

## 7. Annoncer

Dire le chemin créé, et rien de plus.
