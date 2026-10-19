---
title: fidorial.json
description: Every field of the file that describes a plugin.
---

Every plugin contains a `fidorial.json` file **at the root of its jar**. A jar dropped in
`plugins/` without this file is ignored, with a warning in the console.

## Full example

```json
{
  "id": "myplugin",
  "name": "My Plugin",
  "version": "1.2.0",
  "main": "com.example.myplugin.MyPlugin",
  "authors": ["you", "a friend"],
  "depends": ["otherplugin"],
  "permissions": {
    "myplugin.admin": {
      "description": "Access to admin commands",
      "regular": "NOT_SET",
      "operator": "TRUE"
    },
    "myplugin.help": {
      "description": "Use /help",
      "regular": "TRUE",
      "operator": "TRUE"
    }
  }
}
```

## Fields

| Field | Required | Type | Purpose |
| --- | :---: | --- | --- |
| `id` | ✔ | text | Unique identifier. Also used as the folder name (`plugins/<id>/`), the logger name (`plugin/<id>`) and the command namespace (`/<id>:command`). Short, lowercase, no spaces. |
| `name` | ✔ | text | Display name. |
| `version` | ✔ | text | Display version. No format enforced. |
| `main` | ✔ | text | Fully qualified name of the class implementing `Plugin`. It needs a public no-argument constructor. |
| `authors` | | list of text | The authors. |
| `depends` | | list of `id`s | Plugins to load and enable **before** this one. |
| `permissions` | | object | Permissions declared by the plugin (see below). |
| `repositories` | | list of URLs | Maven repositories to download the plugin's libraries from (advanced, see below). |

Missing fields are read as empty lists or objects.

:::caution
For now, a missing required field (`main`, for instance) **prevents the server from starting**,
instead of only skipping that plugin. Double-check the four required fields.
:::

## Dependencies

- If a dependency listed in `depends` is missing, the plugin is skipped.
- A circular dependency (A depends on B which depends on A) is detected, and the plugin is skipped.
- Two plugins with the same `id`: the second one is skipped.

`depends` only sets the **loading order**. It does not give access to the other plugin's classes:
each plugin has its own class loader.

## Permissions

Each entry of `permissions` is keyed by the **node** (for instance `myplugin.admin`) and contains:

| Field | Purpose |
| --- | --- |
| `description` | What the permission allows. |
| `regular` | Default value for regular players. |
| `operator` | Default value for operators (and the console). |

`regular` and `operator` are **required** and must be exactly `"TRUE"`, `"FALSE"` or `"NOT_SET"`, in
uppercase. With any other value (`"true"`, for instance) or a missing field, the permission is
rejected with an error in the console. The plugin itself still loads.

`NOT_SET` means "no opinion": the server then looks at the parent wildcards (`myplugin.*`). If
nobody decides, the permission is denied.

Permissions declared here are removed automatically when the plugin stops.

## Downloaded libraries (advanced)

A plugin can ask the server to download libraries instead of bundling them. It lists them in
`META-INF/fidorial/libraries.list`, inside its jar, and the Maven repositories to use in
`repositories`. The Gradle tooling that generates this file is not published yet: in the meantime,
bundle your dependencies in your jar (with [Shadow](https://gradleup.com/shadow/), for instance).
