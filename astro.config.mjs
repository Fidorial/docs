// @ts-check
import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

const GITHUB = 'https://github.com/Euphillya/Fidorial';
const JAVADOC = 'https://javadocs.fidorial.moe';

// https://astro.build/config
export default defineConfig({
    site: 'https://docs.fidorial.moe',
    integrations: [
        starlight({
            title: 'Fidorial',
            description:
                'Documentation for Fidorial, a Minecraft server written from scratch in Java, and its plugin API.',
            // English is the default language (served at /), French lives under /fr/.
            // A page is linked to its translation by sharing the same file path:
            // src/content/docs/guides/events.mdx <-> src/content/docs/fr/guides/events.mdx
            // A page missing in French falls back to the English one, with a notice.
            defaultLocale: 'root',
            locales: {
                root: {label: 'English', lang: 'en'},
                fr: {label: 'Français', lang: 'fr'},
            },
            social: [
                {icon: 'github', label: 'GitHub', href: GITHUB},
                {icon: 'discord', label: 'Discord', href: 'https://discord.gg/uUJQEB7XNN'},
            ],
            editLink: {
                baseUrl: 'https://github.com/Fidorial/docs/edit/master/',
            },
            lastUpdated: true,
            expressiveCode: {
                themes: ['catppuccin-mocha', 'catppuccin-latte'],
                styleOverrides: {
                    borderRadius: '0.8rem',
                    borderColor: 'var(--sl-color-gray-5)',
                    codeFontFamily: 'var(--__sl-font-mono)',
                    uiFontFamily: 'var(--__sl-font)',
                    codeBackground: ({theme}) => (theme.type === 'dark' ? '#1d0f27' : '#fff7fb'),
                    frames: {
                        editorActiveTabIndicatorTopColor: '#e0428e',
                        editorTabBarBackground: ({theme}) =>
                            theme.type === 'dark' ? '#170b1f' : '#f6ecf6',
                        editorActiveTabBackground: ({theme}) =>
                            theme.type === 'dark' ? '#1d0f27' : '#fff7fb',
                        terminalTitlebarBackground: ({theme}) =>
                            theme.type === 'dark' ? '#170b1f' : '#f6ecf6',
                        terminalBackground: ({theme}) => (theme.type === 'dark' ? '#1d0f27' : '#fff7fb'),
                        frameBoxShadowCssValue: 'none',
                    },
                },
            },
            customCss: [
                '@fontsource-variable/atkinson-hyperlegible-next',
                '@fontsource-variable/bricolage-grotesque',
                '@fontsource-variable/jetbrains-mono',
                './src/styles/fidorial.css',
            ],
            sidebar: [
                {
                    label: 'Getting started',
                    translations: {fr: 'Démarrer'},
                    items: [
                        {
                            label: 'Create a plugin',
                            translations: {fr: 'Créer un plugin'},
                            slug: 'getting-started/first-plugin',
                        },
                    ],
                },
                {
                    label: 'Guides',
                    translations: {fr: 'Guides'},
                    items: [
                        {label: 'Events', translations: {fr: 'Événements'}, slug: 'guides/events'},
                        {label: 'Commands', translations: {fr: 'Commandes'}, slug: 'guides/commands'},
                        {label: 'Services', translations: {fr: 'Services'}, slug: 'guides/services'},
                        {
                            label: 'Threads and regions',
                            translations: {fr: 'Threads et régions'},
                            slug: 'guides/threads',
                        },
                        {
                            label: 'Players and entities',
                            translations: {fr: 'Joueurs et entités'},
                            slug: 'guides/players',
                        },
                        {
                            label: 'Items and inventories',
                            translations: {fr: 'Items et inventaires'},
                            slug: 'guides/items',
                        },
                        {label: 'Permissions', translations: {fr: 'Permissions'}, slug: 'guides/permissions'},
                        {label: 'Dialogs', translations: {fr: 'Dialogues'}, slug: 'guides/dialogs'},
                        {
                            label: 'Custom mobs and effects',
                            translations: {fr: 'Mobs et effets personnalisés'},
                            slug: 'guides/mobs',
                        },
                        {label: 'Maps', translations: {fr: 'Cartes'}, slug: 'guides/maps'},
                    ],
                },
                {
                    label: 'Ecosystem',
                    translations: {fr: 'Écosystème'},
                    items: [
                        {
                            label: 'Compatible plugins',
                            translations: {fr: 'Plugins compatibles'},
                            slug: 'ecosystem/plugins',
                        },
                    ],
                },
                {
                    label: 'Reference',
                    translations: {fr: 'Référence'},
                    items: [
                        {label: 'fidorial.json', slug: 'reference/fidorial-json'},
                        {
                            label: 'Server configuration',
                            translations: {fr: 'Configuration du serveur'},
                            slug: 'reference/configuration',
                        },
                        {
                            label: 'Javadoc',
                            link: JAVADOC,
                            attrs: {target: '_blank', rel: 'noopener'},
                            badge: {text: {en: 'external', fr: 'externe'}, variant: 'default'},
                        },
                    ],
                },
            ],
        }),
    ],
});
