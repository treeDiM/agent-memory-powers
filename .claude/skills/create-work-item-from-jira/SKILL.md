---
name: create-work-item-from-jira
description: Use when the user asks to import a Jira ticket into this project as a work item, or invokes /create-work-item-from-jira <cle>. Reads the Jira issue, writes docs/10-work-items/<ID>-<slug>.md with its front matter and description, updates the folder index, and adds the Claude label on the Jira issue.
---

# Importer un work item depuis Jira

Crée **un** work item dans `docs/10-work-items/` à partir d'un ticket Jira. Ne renumérote rien,
n'écrase rien, ne met à jour aucun import précédent. Créer est le seul verbe de cette skill.

La clé du ticket est l'argument de la commande — `PROJ-1061`. Si elle est absente, la demander
avant toute chose.

## 1. Résoudre le site Atlassian

Appeler `getAccessibleAtlassianResources` et retenir l'`id` du site comme `cloudId`.

**Un seul site est attendu.** S'il en rend plusieurs, **s'arrêter** et demander lequel plutôt
que d'en choisir un : se tromper de site importerait un ticket homonyme d'un autre projet.

## 2. Lire le ticket

Appeler `getJiraIssue` avec le `cloudId` retenu au bloc 1, la clé du ticket,
`responseContentFormat: "markdown"`, et les champs `summary`, `description`, `parent`.

Ticket introuvable ou inaccessible : **s'arrêter**. Rien n'est écrit, ni en local ni dans Jira.

Retenir :

| Valeur | Où la lire |
|---|---|
| `summary` | `fields.summary` |
| `parent` | `fields.parent.fields.summary`, ou rien s'il n'y a pas de parent |
| `description` | `fields.description` |
| `url` | `webUrl` |

## 3. Écrire le fichier

`compose.js` fait tout le travail exact — validation de la clé, complément du numéro à quatre
chiffres, garde-fou de préfixe, refus d'un doublon, slug borné, échappement YAML, substitution
des images. Ne rien réimplémenter ici : cette logique est la seule du dispositif à être testée,
et une seconde copie non testée la contredirait un jour.

Écrire d'abord la charge utile dans un fichier temporaire, dans le répertoire de travail
temporaire de la session — hors du dépôt, sans besoin d'être conservé après usage — la
description peut contenir n'importe quoi, y compris ce qui casserait un document en ligne
de commande :

```json
{
  "cle": "PROJ-1061",
  "summary": "<fields.summary>",
  "parent": "<libellé du parent, ou null>",
  "description": "<fields.description, ou null>",
  "url": "<webUrl>"
}
```

Puis :

```bash
node .claude/skills/create-work-item-from-jira/compose.js < "<chemin-du-json>"
```

La commande affiche le chemin du fichier créé. Si elle sort en erreur, **s'arrêter** et
rapporter son message tel quel. Rien n'a encore été écrit dans Jira à ce stade.

## 4. Poser le label `Claude`

Seulement après que le bloc 3 a réussi. L'ordre compte : un ticket portant le label existe
toujours en local, jamais l'inverse.

Relire les labels par un `getJiraIssue` avec le `cloudId` retenu au bloc 1 et la clé du
ticket, sur le seul champ `labels`, plutôt que de réutiliser ceux du bloc 2 : cela réduit
la fenêtre pendant laquelle une modification concurrente serait perdue.

- `Claude` déjà présent : ne rien écrire.
- Sinon, `editJiraIssue` avec le `cloudId` retenu au bloc 1, la clé du ticket, et
  `fields: { labels: [ ...les labels relus, "Claude" ] }`.
  **La liste complète**, jamais `["Claude"]` seul : ce tool remplace le champ, il ne l'augmente
  pas, et écrire la seule étiquette effacerait toutes les autres.

Si Jira refuse, **ne pas défaire le travail local**. Le fichier reste, et l'échec est annoncé
au bloc 6.

## 5. Mettre à jour l'index

Dans `docs/10-work-items/README.md`, ajouter une entrée à la suite des entrées voisines : le
nom du fichier entre accents graves, un tiret cadratin, puis une description réelle du
contenu du ticket, en français accentué — jamais le titre Jira recopié tel quel. Par exemple :

```
- `PROJ-1061-rc-libelles-inverses-dans-le-menu.md` — ticket Jira importé
  (épopée « Application 2.1 - Support ») : les libellés des commandes Exporter et Imprimer sont
  inversés dans le menu, alors que les infobulles restent correctes.
```

## 6. Annoncer

Dire le chemin créé, et l'état du label — posé, déjà présent, ou refusé avec la raison. Rien de
plus.
