Les **work items** sont des analyses de demandes d'évolutions ou de corrections. Ils sont créés par les skills `/create-work-item` ou `/create-work-item-from-jira`, et **rédigés par l'utilisateur** — à l'exception d'un ticket importé de Jira, dont l'agent écrit le corps à la création, et à la création seulement. L'agent y ajoute en fin de fichier les arbitrages rendus pendant le brainstorming, sous `# Arbitrages rendus pendant l'étude`.
Quand un work item sera soumis à **brainstorming**, **Superpowers** lui associera une classe de traitement (mémorisée dans le front matter du work item dans le champ `superpowers-class`) :
* `spike` : une question dont la sortie est une réponse, pas du code.
* `bounded` : un changement bien cerné dans du code qui existe déjà dans le dépôt. Dans ce cas **Superpowers** pourra enchaîner directement le développement.
* `architectural` : nouveau projet, nouveau sous-système ou changement architectural. C'est uniquement dans ce cas de figure que **Superpowers** générera une **spécification** (`20-specs`) puis un **plan d'exécution** (`30-plans`).

Ce fichier est un index des **work items** présents dans ce dossier. 
Cette liste est maintenue à jour par l'agent.

---

# Contenu
