# Fidorial documentation

Sources of [docs.fidorial.moe](https://docs.fidorial.moe), built with
[Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

- Main site: [www.fidorial.moe](https://www.fidorial.moe)
- API Javadoc: [javadocs.fidorial.moe](https://javadocs.fidorial.moe)
- Server code: [Euphillya/Fidorial](https://github.com/Euphillya/Fidorial)

## Working locally

Requires Node.js 22 or newer.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in ./dist/
npm run preview  # serves ./dist/ locally
```

## Layout

```
src/
├── content/docs/
│   ├── index.mdx                 # home page (English, the default language)
│   ├── getting-started/          # first steps
│   ├── guides/                   # events, commands, services, threads
│   ├── reference/                # fidorial.json…
│   └── fr/                       # French translation, same file paths
└── styles/fidorial.css           # accent colours
astro.config.mjs                  # title, links, sidebar, languages
```

## Languages

English is served at `/`, French at `/fr/`. A page is linked to its translation by **sharing the
same path**: `guides/events.mdx` ↔ `fr/guides/events.mdx`. A page missing in French falls back to
the English one with a notice, so English is the one to write first.

To add a page: create the `.md`/`.mdx` file in `src/content/docs/`, add it to `sidebar` in
`astro.config.mjs` (with a `translations: { fr: '…' }` label), then add the French version under
`src/content/docs/fr/` when ready.

## Code examples

Examples must compile against the API of the documented branch (currently `dev/26.3`, API
`0.1.0-SNAPSHOT`). When the API changes, check the affected pages, especially the event list and the
services table in `guides/services.mdx`, in both languages.
