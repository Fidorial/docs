---
title: Server configuration
description: Every setting of config/fidorial.yaml and of the per-world files.
---

The server reads its settings from YAML files in `config/`, written with their default values and a
comment on each key the first time it starts. Restart the server after changing them.

| File                                                                    | Content                                                                                                  |
|-------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `config/fidorial.yaml`                                                  | Settings of the whole server.                                                                            |
| `config/fidorial-world-default.yaml`                                    | Default settings of every world.                                                                         |
| `world/dimensions/<namespace>/<name>/data/fidorial/fidorial-world.yaml` | Overrides for one world (for instance `…/minecraft/overworld/…`). Only list the keys you want to change. |

:::tip
Older builds used a `fidorial.properties` file. If you still have one, move its values to the YAML
files by hand: the key names are almost the same, but grouped into sections.
:::

## `fidorial.yaml`

### `network`

| Key                                | Default | Purpose                                                                                |
|------------------------------------|---------|----------------------------------------------------------------------------------------|
| `port`                             | `25565` | Port the server listens on (1–65535).                                                  |
| `online-mode`                      | `true`  | Authenticate players with Mojang. `false` accepts any name: local tests only.          |
| `encrypt-offline-mode-connections` | `false` | Encrypt connections even in offline mode.                                              |
| `compression-threshold`            | `256`   | Packets at least this size (in bytes) are compressed. `-1` disables compression.       |
| `use-io-uring`                     | `false` | Use the io_uring network transport when the system supports it (Linux).                |
| `enforce-secure-chat`              | `true`  | Require signed chat messages.                                                          |
| `proxy.mode`                       | `none`  | `none` for direct connections, `velocity` behind a Velocity proxy (modern forwarding). |
| `proxy.secret`                     | empty   | Velocity's `forwarding.secret`. Required when `mode` is `velocity`.                    |

### `status`

How the server appears in the multiplayer list.

| Key           | Default                                                      | Purpose                                                                                                        |
|---------------|--------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| `motd`        | `<red>Fidorial <white>\| <blue>Alternative Minecraft Server` | Description, in [MiniMessage](https://docs.advntr.dev/minimessage/format.html) (colours and decorations only). |
| `max-players` | `100`                                                        | Maximum number of players online at once.                                                                      |

A plugin can change both at runtime with `server().listing()`, or answer each ping differently
with `ServerStatusRequestEvent` (see [Events](/guides/events/#customising-the-server-list)).

### `general`

| Key                 | Default   | Purpose                                                                        |
|---------------------|-----------|--------------------------------------------------------------------------------|
| `view-distance`     | `10`      | Render distance announced to clients, in chunks.                               |
| `send-distance`     | `10`      | Radius of chunks actually sent around a player. Cannot exceed `view-distance`. |
| `auto-save-seconds` | `5`       | Interval between automatic saves.                                              |
| `plugins-path`      | `plugins` | Folder plugins are loaded from.                                                |

### `worlds`

| Key                     | Default               | Purpose                                                                                                               |
|-------------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------|
| `path`                  | `world`               | Folder holding the worlds.                                                                                            |
| `default-world`         | `minecraft:overworld` | World used by default, for instance to spawn new players.                                                             |
| `level-seed`            | random                | Seed of the default world generator.                                                                                  |
| `initial-enabled-packs` | `[minecraft:vanilla]` | Feature packs enabled when the world is first created. Must contain `minecraft:vanilla`. Ignored for existing worlds. |

### `threading`

Sizes of the thread pools, and layout of the regions. Leave a value empty to let the server pick it (pool sizes are
based on the number of cores, `N`). Changes take effect on restart.

| Key                    | Default              | Purpose                                                                                                                                                                                                                                                                        |
|------------------------|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `region-workers`       | `N / 2` (at least 2) | Threads ticking the [regions](/guides/threads/).                                                                                                                                                                                                                               |
| `chunk-workers`        | `N / 8` (at least 2) | Chunk loading and generation.                                                                                                                                                                                                                                                  |
| `light-workers`        | `N / 8` (at least 2) | Light updates.                                                                                                                                                                                                                                                                 |
| `ai-workers`           | `N / 8` (at least 2) | Mob pathfinding.                                                                                                                                                                                                                                                               |
| `region-section-shift` | `5`                  | Size of the [regions](/guides/threads/), as a power of two: a region is 2<sup>shift</sup> × 2<sup>shift</sup> chunks. `4` = 16×16, `5` = 32×32, `6` = 64×64. Smaller regions spread the world over more threads; larger ones mean fewer region borders to cross. From 0 to 10. |

### `resource-pack`

Sent to players when they join. Leave `url` empty to send nothing.

| Key        | Purpose                                                                 |
|------------|-------------------------------------------------------------------------|
| `url`      | Address of the pack.                                                    |
| `hash`     | SHA-1 of the pack, in lowercase hexadecimal (optional but recommended). |
| `id`       | UUID of the pack, generated on first start if missing.                  |
| `required` | Kick players who refuse the pack.                                       |
| `prompt`   | Message shown with the request, in MiniMessage.                         |

### `code-of-conduct`

| Key       | Default         | Purpose                                                                   |
|-----------|-----------------|---------------------------------------------------------------------------|
| `enabled` | `false`         | Show a Code of Conduct screen to players joining for the first time.      |
| `path`    | `codeofconduct` | Folder holding the texts. Example files are written there on first start. |

### `spark`

| Key       | Default | Purpose                                                                                 |
|-----------|---------|-----------------------------------------------------------------------------------------|
| `enabled` | `true`  | Enable the built-in [spark](https://spark.lucko.me/) profiler and its `/spark` command. |
| `path`    | `spark` | Folder for spark's temporary files.                                                     |

## World settings

These keys go in `fidorial-world-default.yaml` (every world) or in a world's own
`fidorial-world.yaml` (that world only).

### `gameplay`

| Key                                                         | Default                       | Purpose                                                                                         |
|-------------------------------------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------|
| `pvp`                                                       | `true`                        | Whether players can hurt each other.                                                            |
| `default-game-mode`                                         | `survival`                    | Mode of players joining for the first time: `survival`, `creative`, `adventure` or `spectator`. |
| `generate-structures`                                       | `true`                        | Generate structures. Only has an effect if a datapack provides them.                            |
| `spawn.x`, `spawn.y`, `spawn.z`, `spawn.yaw`, `spawn.pitch` | `8.5`, `-48`, `8.5`, `0`, `0` | Where new players appear. The default matches the built-in flat world.                          |

### `storage`

| Key                       | Default | Purpose                                                                                                                                                                                                                  |
|---------------------------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `region-compression`      | `zlib`  | Compression of chunks in region files: `zlib` (vanilla's default), `gzip`, `lz4` (much faster, bigger files), `none`, or `zstd` (smaller, **unreadable by vanilla**). Fidorial reads every format, whatever the setting. |
| `convert-existing-chunks` | `true`  | After changing `region-compression`, rewrite every saved chunk in the new format the next time it loads. With `false`, chunks are only converted as they load.                                                           |
