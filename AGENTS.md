Projet du programme **A COMPLETER**

# Fichiers et répertoires clés

* `README.md` : présentation du projet et structure du repository. Maintenu par l'agent.
* `CODEMAP.md` : Carte du code du dépôt, établie uniquement à partir des sources. Maintenu par l'agent.
* `ARCHITECTURE.md` : **Architecture logicielle uniquement** — tout ce qu'il faut savoir sur l'architecture technique et logicielle du projet. On ne parle pas ici de fonctionnalités, ni de `CODEMAP.md`. Ce fichier est **autonome et sans lien sortant**. Maintenu par l'agent, au franchissement d'une frontière et non au fil de l'eau.
* `TODO.md` : géré en manuel par moi. L'agent n'y touche pas.
* `CHANGELOG.md` : Historique des changements logiciels. Maintenu par l'agent. Chaque entrée doit être compacte et faire référence à un work item s'il existe.
* `docs/`
	* `00-knowledge-base` : base de connaissance générale sur le projet, 
	  dont `010-glossary.md` qui est un glossaire métier.
	* `05-draft` : les brouillons en cours de rédaction. Rédigés par moi. L'agent ne les lit pas et ne les modifie pas.
	* `07-studies` : études ponctuelles sur le fonctionnement du dépôt ou sur des sujets généraux. Rédigées par l'agent **à ma demande**. Une étude reflète l'état du dépôt à sa date de rédaction : elle n'est **pas maintenue au fil de l'eau**.
	* `10-work-items` : Analyse de demandes. Rédigés par moi. Au format `<prefixe>-<nnnn>-<slug>.md`. Dans le cadre d'un brainstorming Superpowers, on indiquera spécifiquement à l'agent quel work item lire. L'agent n'en modifie que le **front matter** et, **si des arbitrages sont rendus** pendant le brainstorming, le chapitre final `# Arbitrages rendus pendant l'étude`, qu'il crée ou complète : un choix par ligne, avec renvoi à la spec ou à l'ADR s'il y en a une. Deux familles de work items cohabitent :
		* Les **work items locaux** créés par la skill `/create-work-item`, dont le préfixe est lu dans `docs/work-items-settings.json` et dont le numéro est alloué par la skill de création.
		* Les **work items importés de Jira** créés par la skill `/create-work-item-from-jira`, qui portent le préfixe du projet JIRA et le numéro du ticket JIRA complété à quatre chiffres. Dans ce cas, l'agent écrit aussi le corps, **à la création et seulement à la création**.
	* `20-specs` : Superpowers écrira ici ses spécifications produites au format `YYMMDD-<slug>.md`. Pour un brainstorming basé sur un **work item**, Superpowers nommera la spec `YYMMDD-<prefixe>-<nnnn>-<slug>.md`
	*  `30-plans` : Superpowers écrira ici ses plans d'exécution au format `YYMMDD-<slug>.md`. Si un plan s'appuie sur une spec contenant un numéro de work item, Superpowers nommera le plan `YYMMDD-<prefixe>-<nnnn>-<slug>.md`
	* `40-adr` : Architecture Decision Record. **Au fil de l'eau, dès qu'une décision est adoptée l'agent doit proposer de créer une ADR** au format : `YYMMDD-<slug>.md`. L'utilisateur doit confirmer cette création d'ADR.
	* `50-technical-references` :  documents techniques de référence. Chaque document traite un thème particulier. Important : Ils doivent être **maintenus à jour par l'agent, au fil de l'eau, dès que le changement a lieu** de manière synthétique et non verbeuse. L'agent ne crée pas de nouveaux documents spontanément, mais peut en proposer la création si le thème traité n'est pas déjà couvert par un autre document.
# Qui croire ?
* Le **code source est la seule source de référence fiable**
* Les `10-work-items` sont intéressants puisqu'ils décrivent la demande brute d'évolution ou de correction. Mais la solution retenue peut varier de la demande initiale. Ces documents sont conservés pour mémoire.
* Les `50-technical-references` visent à proposer des documents techniques thématiques à un utilisateur découvrant le projet. Mais bien que l'agent doive les maintenir quand une modification est réalisée, **le code source reste la seule vraie vérité**.
# Cycle de traitement
* L'utilisateur écrit ses documents dans `00-knowledge-base`,  `05-draft`,  et maintient son `TODO.md`
* L'utilisateur crée un nouveau work item par la skill `/create-work-item <titre>` et l'agent met à jour `docs/10-work-items/README.md`
* L'utilisateur importe un ticket Jira par la skill `/create-work-item-from-jira <cle>` : l'agent crée le work item, met à jour `docs/10-work-items/README.md`, et pose le label `Claude` sur le ticket Jira d'origine
* L'utilisateur soumet un `10-work-items` au brainstorming de Superpowers
* Superpowers itère la réflexion avec l'utilisateur et finit par produire des `20-specs`. L'agent met à jour `docs/20-specs/README.md`
* Quand l'utilisateur valide la `20-specs`, Superpowers produit un plan d'exécution dans `30-plans` et l'agent met à jour `docs/30-plans/README.md`
* Quand l'utilisateur valide le `30-plans`, Superpowers **lance le développement avec les consignes suivantes**  :
	* **Sequential only**: One task at a time. No parallel runs. 
	* **Clean context**: Give sub-agent only needed context with specs.
	* **Adaptive effort**: Match model power and reasoning depth to task difficulty.
	* **Strict review**: Check each delivery yourself. Reject if specs or edge cases fail. Fix before next step. 
	* **Compact memory**: Summarize validated output into main context. Drop intermediate logs.
* Au fil de l'eau quand des décisions sont prises l'agent crée une entrée dans `40-adr` après confirmation de l'utilisateur et l'agent met à jour `docs/40-adr/README.md`
* Au fil des développements, l'agent met à jour le document thématique dans `50-technical-references` et s'il en a proposé la création d'une nouvelle qui a été acceptée,  l'agent met à jour `docs/50-technical-references/README.md`
# Front matter des work items
Chaque `10-work-items` porte un front matter :  
```
---
id: <prefixe>-<nnnn>
title: "Le titre du work item"
status: new
superpowers-class: 
tags: []
---
```
Le préfixe de l'id est configuré dans `docs/work-items-settings.json`.
Le préfixe peut aussi être libre ; saisi manuellement, ou importé de JIRA.
Un ticket importé de Jira porte deux marques de plus : `tags` contient `Jira`, et un champ `jira` porte la clé exacte du ticket — `PROJ-558` pour un work item `PROJ-0558`, le numéro local étant complété à quatre chiffres alors que la clé Jira ne l'est pas.
Le front matter d'un ticket importé s'écrit ainsi :
```
---
id: PROJ-0558
title: "Le titre du ticket Jira, tel quel"
status: new
superpowers-class: 
tags: [Jira]
jira: PROJ-558
---
```
Les `status` possibles sont :
* `draft` : Statut positionné manuellement par l'utilisateur.
* `new` : Statut après la création du work item par la skill `/create-work-item` ou `/create-work-item-from-jira`
* `deferred` : Statut positionné manuellement par l'utilisateur.
* `in-progress` : Positionné par l'agent, lors de l'écriture de la spécification dans `20-specs` 
* `review` : Positionné par l'agent, lorsque Superpowers arrive à l'étape de revue de code.
* `done` : Positionné par l'agent au commit final du développement.
* `canceled` : Positionné manuellement par l'utilisateur.
Le `superpowers-class` doit être attribué par Superpowers lors de sa classification et peut contenir les valeurs :
* `spike` : une question dont la sortie est une réponse, pas du code.
* `bounded` : un changement bien cerné dans du code qui existe déjà dans le dépôt.
* `architectural` : nouveau projet, nouveau sous-système ou changement architectural.
Les `tags` sont mis à jour manuellement par l'utilisateur, mais l'agent peut en proposer.
