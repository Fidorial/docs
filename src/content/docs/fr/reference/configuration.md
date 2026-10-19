---
title: Configuration du serveur
description: Tous les réglages de config/fidorial.yaml et des fichiers par monde.
---

Le serveur lit ses réglages dans des fichiers YAML du dossier `config/`, écrits avec leurs valeurs
par défaut et un commentaire sur chaque clé au premier démarrage. Redémarre le serveur après les
avoir modifiés.

| Fichier                                                                | Contenu                                                                                                 |
|------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| `config/fidorial.yaml`                                                 | Réglages de tout le serveur.                                                                            |
| `config/fidorial-world-default.yaml`                                   | Réglages par défaut de chaque monde.                                                                    |
| `world/dimensions/<namespace>/<nom>/data/fidorial/fidorial-world.yaml` | Surcharges pour un seul monde (par exemple `…/minecraft/overworld/…`). N'y mets que les clés à changer. |

:::tip
Les anciens builds utilisaient un fichier `fidorial.properties`. S'il t'en reste un, reporte ses
valeurs à la main dans les fichiers YAML : les noms de clés sont presque les mêmes, mais rangés par
sections.
:::

## `fidorial.yaml`

### `network`

| Clé                                | Défaut  | Rôle                                                                                                          |
|------------------------------------|---------|---------------------------------------------------------------------------------------------------------------|
| `port`                             | `25565` | Port d'écoute du serveur (1–65535).                                                                           |
| `online-mode`                      | `true`  | Authentifier les joueurs auprès de Mojang. `false` accepte n'importe quel pseudo : tests en local uniquement. |
| `encrypt-offline-mode-connections` | `false` | Chiffrer les connexions même en mode hors ligne.                                                              |
| `compression-threshold`            | `256`   | Les paquets d'au moins cette taille (en octets) sont compressés. `-1` désactive la compression.               |
| `use-io-uring`                     | `false` | Utiliser le transport réseau io_uring quand le système le permet (Linux).                                     |
| `enforce-secure-chat`              | `true`  | Exiger des messages de chat signés.                                                                           |
| `proxy.mode`                       | `none`  | `none` pour des connexions directes, `velocity` derrière un proxy Velocity (modern forwarding).               |
| `proxy.secret`                     | vide    | Le `forwarding.secret` de Velocity. Obligatoire quand `mode` vaut `velocity`.                                 |

### `status`

L'apparence du serveur dans la liste multijoueur.

| Clé           | Défaut                                                       | Rôle                                                                                                                 |
|---------------|--------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `motd`        | `<red>Fidorial <white>\| <blue>Alternative Minecraft Server` | Description, en [MiniMessage](https://docs.advntr.dev/minimessage/format.html) (couleurs et décorations uniquement). |
| `max-players` | `100`                                                        | Nombre maximal de joueurs connectés en même temps.                                                                   |

Un plugin peut changer les deux en cours de route avec `server().listing()`, ou répondre
différemment à chaque ping avec `ServerStatusRequestEvent` (voir
[Événements](/fr/guides/events/#personnaliser-la-liste-des-serveurs)).

### `general`

| Clé                 | Défaut    | Rôle                                                                                          |
|---------------------|-----------|-----------------------------------------------------------------------------------------------|
| `view-distance`     | `10`      | Distance de rendu annoncée aux clients, en chunks.                                            |
| `send-distance`     | `10`      | Rayon des chunks réellement envoyés autour d'un joueur. Ne peut pas dépasser `view-distance`. |
| `auto-save-seconds` | `5`       | Intervalle entre deux sauvegardes automatiques.                                               |
| `plugins-path`      | `plugins` | Dossier d'où sont chargés les plugins.                                                        |

### `worlds`

| Clé                     | Défaut                | Rôle                                                                                                            |
|-------------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------|
| `path`                  | `world`               | Dossier qui contient les mondes.                                                                                |
| `default-world`         | `minecraft:overworld` | Monde utilisé par défaut, par exemple pour faire apparaître les nouveaux joueurs.                               |
| `level-seed`            | aléatoire             | Graine du générateur du monde par défaut.                                                                       |
| `initial-enabled-packs` | `[minecraft:vanilla]` | Feature packs activés à la création du monde. Doit contenir `minecraft:vanilla`. Ignoré pour un monde existant. |

### `threading`

Taille des pools de threads, et découpage en régions. Laisse une valeur vide pour que le serveur la
choisisse (la taille des pools dépend du nombre de cœurs, `N`). Les changements s'appliquent au
redémarrage.

| Clé                    | Défaut               | Rôle                                                                                                                                                                                                                                                                                                                      |
|------------------------|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `region-workers`       | `N / 2` (au moins 2) | Threads qui font tourner les [régions](/fr/guides/threads/).                                                                                                                                                                                                                                                              |
| `chunk-workers`        | `N / 8` (au moins 2) | Chargement et génération des chunks.                                                                                                                                                                                                                                                                                      |
| `light-workers`        | `N / 8` (au moins 2) | Mises à jour de la lumière.                                                                                                                                                                                                                                                                                               |
| `ai-workers`           | `N / 8` (au moins 2) | Recherche de chemin des mobs.                                                                                                                                                                                                                                                                                             |
| `region-section-shift` | `5`                  | Taille des [régions](/fr/guides/threads/), en puissance de deux : une région fait 2<sup>shift</sup> × 2<sup>shift</sup> chunks. `4` = 16×16, `5` = 32×32, `6` = 64×64. Des régions plus petites répartissent le monde sur plus de threads ; des régions plus grandes, ce sont moins de frontières à traverser. De 0 à 10. |

### `resource-pack`

Envoyé aux joueurs à leur arrivée. Laisse `url` vide pour ne rien envoyer.

| Clé        | Rôle                                                                 |
|------------|----------------------------------------------------------------------|
| `url`      | Adresse du pack.                                                     |
| `hash`     | SHA-1 du pack, en hexadécimal minuscule (facultatif mais conseillé). |
| `id`       | UUID du pack, généré au premier démarrage s'il manque.               |
| `required` | Expulser les joueurs qui refusent le pack.                           |
| `prompt`   | Message affiché avec la demande, en MiniMessage.                     |

### `code-of-conduct`

| Clé       | Défaut          | Rôle                                                                                       |
|-----------|-----------------|--------------------------------------------------------------------------------------------|
| `enabled` | `false`         | Afficher un écran de Code de conduite aux joueurs qui se connectent pour la première fois. |
| `path`    | `codeofconduct` | Dossier des textes. Des fichiers d'exemple y sont écrits au premier démarrage.             |

### `spark`

| Clé       | Défaut  | Rôle                                                                                   |
|-----------|---------|----------------------------------------------------------------------------------------|
| `enabled` | `true`  | Activer le profileur [spark](https://spark.lucko.me/) intégré et sa commande `/spark`. |
| `path`    | `spark` | Dossier des fichiers temporaires de spark.                                             |

## Réglages des mondes

Ces clés vont dans `fidorial-world-default.yaml` (tous les mondes) ou dans le
`fidorial-world.yaml` d'un monde (ce monde seulement).

### `gameplay`

| Clé                                                         | Défaut                        | Rôle                                                                                             |
|-------------------------------------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------|
| `pvp`                                                       | `true`                        | Les joueurs peuvent-ils se blesser entre eux.                                                    |
| `default-game-mode`                                         | `survival`                    | Mode des joueurs à leur première connexion : `survival`, `creative`, `adventure` ou `spectator`. |
| `generate-structures`                                       | `true`                        | Générer les structures. N'a d'effet que si un datapack en fournit.                               |
| `spawn.x`, `spawn.y`, `spawn.z`, `spawn.yaw`, `spawn.pitch` | `8.5`, `-48`, `8.5`, `0`, `0` | Où apparaissent les nouveaux joueurs. La valeur par défaut correspond au monde plat intégré.     |

### `storage`

| Clé                       | Défaut | Rôle                                                                                                                                                                                                                                                            |
|---------------------------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `region-compression`      | `zlib` | Compression des chunks dans les fichiers de région : `zlib` (le défaut de vanilla), `gzip`, `lz4` (bien plus rapide, fichiers plus gros), `none`, ou `zstd` (plus compact, **illisible par vanilla**). Fidorial lit tous les formats, quel que soit le réglage. |
| `convert-existing-chunks` | `true` | Après un changement de `region-compression`, réécrire chaque chunk sauvegardé dans le nouveau format la prochaine fois qu'il est chargé. Avec `false`, les chunks ne sont convertis qu'au fil de leur chargement.                                               |
