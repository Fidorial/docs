/**
 * Plugins known to run on Fidorial, shown on /ecosystem/plugins/ (and /fr/ecosystem/plugins/).
 *
 * To add yours, append an entry to `plugins` below and open a pull request.
 * Keep the list sorted by name inside each support level. Both languages read this file,
 * so write the description in English and in French (a machine translation is fine, a
 * maintainer will polish it).
 */
export type Support =
/** Maintained with Fidorial in mind: the project ships a Fidorial build itself. */
    | 'official'
    /** A fork that adds Fidorial support until the upstream project does it. */
    | 'port';

export interface Localized {
    en: string;
    fr: string;
}

export interface FidorialPlugin {
    /** The plugin's `id` from its fidorial.json. */
    id: string;
    name: string;
    /** Where to find the code (and, ideally, the releases). */
    repository: string;
    /** Branch holding the Fidorial support, when it is not the default one. */
    branch?: string;
    /** For a port: the original project. */
    upstream?: string;
    authors: string[];
    support: Support;
    description: Localized;
    /** Optional practical details: command, build steps, caveats. Markdown is not rendered. */
    notes?: Localized;
}

export const plugins: FidorialPlugin[] = [
    // ── Official support ────────────────────────────────────────────────────────────────
    {
        id: 'doom',
        name: 'Doom',
        repository: 'https://github.com/Fidorial/Doom-Fidorial',
        authors: ['Euphyllia'],
        support: 'official',
        description: {
            en: 'Doom should be able to run everywhere, even on Minecraft. A showcase of what a Fidorial plugin can do.',
            fr: 'Doom doit pouvoir tourner partout, même sur Minecraft. Une vitrine de ce qu’un plugin Fidorial peut faire.',
        },
    },
    {
        id: 'flare',
        name: 'Flare',
        repository: 'https://github.com/SerlithNetwork/FlarePlatform',
        authors: ['PaulBGD', 'SerlithNetwork', 'Euphyllia'],
        support: 'official',
        description: {
            en: 'The Flare profiler (from Airplane), brought to platforms that do not ship it. The flare-fidorial module adds per-region TPS to the profiles.',
            fr: 'Le profileur Flare (issu d’Airplane), porté sur les plateformes qui ne l’embarquent pas. Le module flare-fidorial ajoute le TPS par région aux profils.',
        },
        notes: {
            en: 'Command: /flaref (alias /flare), permission airplane.flare (operators by default). Set your token and backend URL in plugins/flare/config.yml.',
            fr: 'Commande : /flaref (alias /flare), permission airplane.flare (opérateurs par défaut). Renseigne ton token et l’URL du backend dans plugins/flare/config.yml.',
        },
    },

    // ── Unofficial, temporary ports ─────────────────────────────────────────────────────
    {
        id: 'luckperms',
        name: 'LuckPerms',
        repository: 'https://github.com/Euphillya/LuckPerms',
        branch: 'support/fidorial',
        upstream: 'https://github.com/LuckPerms/LuckPerms',
        authors: ['Luck'],
        support: 'port',
        description: {
            en: 'The permissions plugin, with a fidorial platform module. It plugs into the server as a PermissionResolver, so every hasPermission check goes through LuckPerms.',
            fr: 'Le plugin de permissions, avec un module de plateforme fidorial. Il se branche sur le serveur comme PermissionResolver : chaque appel à hasPermission passe par LuckPerms.',
        },
        notes: {
            en: 'No release yet: build the support/fidorial branch with ./gradlew :fidorial:loader:shadowJar (JDK 25), the jar lands in fidorial/loader/build/libs/.',
            fr: 'Pas encore de release : compile la branche support/fidorial avec ./gradlew :fidorial:loader:shadowJar (JDK 25), le jar arrive dans fidorial/loader/build/libs/.',
        },
    },
];
