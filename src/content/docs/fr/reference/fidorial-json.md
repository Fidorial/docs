---
title: fidorial.json
description: Tous les champs du fichier qui décrit un plugin.
---

Chaque plugin contient un fichier `fidorial.json` **à la racine de son jar**. Un jar placé dans
`plugins/` sans ce fichier est ignoré, avec un avertissement dans la console.

## Exemple complet

```json
{
  "id": "monplugin",
  "name": "Mon Plugin",
  "version": "1.2.0",
  "main": "com.exemple.monplugin.MonPlugin",
  "authors": ["toi", "un ami"],
  "depends": ["autreplugin"],
  "permissions": {
    "monplugin.admin": {
      "description": "Accès aux commandes d'administration",
      "regular": "NOT_SET",
      "operator": "TRUE"
    },
    "monplugin.aide": {
      "description": "Utiliser /aide",
      "regular": "TRUE",
      "operator": "TRUE"
    }
  }
}
```

## Champs

| Champ | Obligatoire | Type | Rôle |
| --- | :---: | --- | --- |
| `id` | ✔ | texte | Identifiant unique. Sert aussi de nom de dossier (`plugins/<id>/`), de nom de logger (`plugin/<id>`) et d'espace de noms pour les commandes (`/<id>:commande`). Court, en minuscules, sans espaces. |
| `name` | ✔ | texte | Nom affiché. |
| `version` | ✔ | texte | Version affichée. Aucun format imposé. |
| `main` | ✔ | texte | Nom complet de la classe qui implémente `Plugin`. Elle doit avoir un constructeur public sans argument. |
| `authors` | | liste de textes | Les auteurs. |
| `depends` | | liste d'`id` | Plugins à charger et activer **avant** celui-ci. |
| `permissions` | | objet | Permissions déclarées par le plugin (voir ci-dessous). |
| `repositories` | | liste d'URL | Dépôts Maven où télécharger les bibliothèques du plugin (usage avancé, voir plus bas). |

Les champs absents sont lus comme des listes ou des objets vides.

:::caution
Pour l'instant, un champ obligatoire manquant (`main`, par exemple) **empêche le serveur de
démarrer**, au lieu d'ignorer seulement ce plugin. Vérifie bien les quatre champs obligatoires.
:::

## Dépendances

- Si une dépendance listée dans `depends` est absente, le plugin est ignoré.
- Une dépendance circulaire (A dépend de B qui dépend de A) est détectée, et le plugin est ignoré.
- Deux plugins avec le même `id` : le second est ignoré.

`depends` règle seulement **l'ordre de chargement**. Il ne donne pas accès aux classes de l'autre
plugin : chaque plugin a son propre classloader.

## Permissions

Chaque entrée de `permissions` a pour clé le **nœud** (par exemple `monplugin.admin`) et contient :

| Champ | Rôle |
| --- | --- |
| `description` | Ce que la permission autorise. |
| `regular` | Valeur par défaut pour les joueurs normaux. |
| `operator` | Valeur par défaut pour les opérateurs (et la console). |

`regular` et `operator` sont **obligatoires** et valent exactement `"TRUE"`, `"FALSE"` ou `"NOT_SET"`,
en majuscules. Avec une autre valeur (`"true"`, par exemple) ou un champ manquant, la permission est
rejetée avec une erreur dans la console. Le plugin, lui, se charge quand même.

`NOT_SET` signifie « pas d'avis » : le serveur regarde alors les jokers parents (`monplugin.*`).
Si personne ne tranche, la permission est refusée.

Les permissions déclarées ici sont retirées automatiquement quand le plugin s'arrête.

## Bibliothèques téléchargées (avancé)

Un plugin peut demander au serveur de télécharger des bibliothèques au lieu de les embarquer. Il les
liste dans `META-INF/fidorial/libraries.list`, dans son jar, et les dépôts Maven à utiliser dans
`repositories`. L'outillage Gradle qui génère ce fichier n'est pas encore publié : en attendant,
embarque tes dépendances dans ton jar (avec [Shadow](https://gradleup.com/shadow/), par exemple).
