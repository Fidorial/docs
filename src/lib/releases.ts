/**
 * Fidorial server builds, read from the GitHub releases of the server repository and sorted by
 * branch. Used by src/components/ReleaseDownloads.astro, both when the site is built and in the
 * browser (to pick up builds published since), so this file must not use Node-only APIs.
 *
 * Where the branch of a release comes from, in this order:
 *  1. `target_commitish`, when it is a branch name rather than a commit. GitHub fills it with the
 *     branch the workflow ran on for the `build-N` and `dev-N` releases;
 *  2. the body written by .github/workflows/snapshot.yml: "Automated development build from `dev/26.4`."
 *     Used for the releases whose `target_commitish` is a commit (dev/26.4 onwards). Not trusted
 *     before that: the snapshot.yml of dev/26.2 and dev/26.3 wrote "from `master`" whatever the branch;
 *  3. the tag: `dev-26.4-snapshot-8-build.43+0.1.0` belongs to `dev/26.4`.
 * Releases that are not pre-releases (the `v*` tags of release.yml) go to the "stable" channel.
 *
 * A build often holds several commits: pushes made together give one build, a push cancels the build
 * still running for the previous one, and pushes touching only Markdown files build nothing. The
 * commits of a build are the ones it adds to the previous build of its branch, read from the commit
 * history of the server repository (see `addChanges`).
 */

export const REPOSITORY = 'Fidorial/Fidorial';
export const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
export const RELEASES_URL = `${REPOSITORY_URL}/releases`;
const API_URL = `https://api.github.com/repos/${REPOSITORY}/releases`;
const COMMITS_API_URL = `https://api.github.com/repos/${REPOSITORY}/commits`;

/** Builds kept per Minecraft version of a branch: the latest one plus its history. */
export const MAX_BUILDS_PER_GROUP = 25;

/** Commits kept per build, the newest ones; the others are on the comparison page of GitHub. */
export const MAX_CHANGES = 10;

/** Commits shown per build in the table of previous builds. */
const HISTORY_CHANGES = 3;

export type Lang = 'en' | 'fr';

export interface Asset {
    name: string;
    url: string;
    size: number;
}

export interface Build {
    id: number;
    tag: string;
    /** `null` for a stable release. */
    branch: string | null;
    /** Maven version, e.g. `26.4-snapshot-8-build.43+0.1.0`; the tag when it does not follow that format. */
    version: string;
    /** Minecraft version id, e.g. `26.4-snapshot-8`. */
    minecraft?: string;
    /** Build number, counted on the branch since its Minecraft version last changed. */
    build?: number;
    /** `fr.fidorial:fidorial-api` was published under `version` with this build. */
    api: boolean;
    publishedAt: string;
    commit?: string;
    /**
     * The commits this build adds to the previous build of its branch, newest first, at most
     * `MAX_CHANGES`. Only the build's own commit when that previous build is unknown or out of reach.
     * Missing when the history could not be read.
     */
    changes?: Change[];
    /** How many commits the build adds in all; missing when not known for sure. */
    changeCount?: number;
    /** Commit of the previous build of the branch, for the comparison on GitHub. */
    previous?: string;
    page: string;
    jar: Asset;
    others: Asset[];
}

export interface Change {
    sha: string;
    /** First line of the commit message. */
    title: string;
}

/** The builds of a branch made for one Minecraft version, newest first. */
export interface VersionGroup {
    /** Minecraft version id (`26.4-snapshot-7`); `''` for builds whose version is unknown, or when the branch is not split. */
    id: string;
    builds: Build[];
}

export interface Channel {
    /** `stable`, or the branch name. */
    id: string;
    stable: boolean;
    /** One group per Minecraft version, newest first, when the branch built for several; a single group otherwise. */
    groups: VersionGroup[];
}

/** The fields of a GitHub release this file reads. */
export interface GitHubRelease {
    id: number;
    tag_name: string;
    name: string | null;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
    target_commitish: string;
    published_at: string | null;
    created_at: string;
    html_url: string;
    assets: { name: string; size: number; browser_download_url: string }[];
}

/** The fields of a GitHub commit (`GET /repos/{owner}/{repo}/commits`) this file reads. */
export interface GitHubCommit {
    sha: string;
    commit: { message: string; committer: { date?: string } | null };
    parents: { sha: string }[];
}

const BODY_BRANCH = /Automated development build from `([^`]+)`/;
const BODY_COMMIT = /Commit:\s*([0-9a-f]{7,40})\b/i;
const SHA = /^[0-9a-f]{40}$/i;
const SHA_IN_TEXT = /\b([0-9a-f]{40})\b/i;
const DEV_TAG = /^dev-(\d+\.\d+)-/;
const MAVEN_VERSION = /^(.+)-build\.(\d+)\+(.+)$/;
const JAR_VERSION = /^Fidorial-(.+)\.jar$/;

function branchOf(release: GitHubRelease): string | null {
    if (!release.prerelease) return null;
    if (release.target_commitish && !SHA.test(release.target_commitish)) return release.target_commitish;
    const fromBody = release.body?.match(BODY_BRANCH)?.[1];
    if (fromBody) return fromBody;
    const fromTag = release.tag_name.match(DEV_TAG)?.[1];
    return fromTag ? `dev/${fromTag}` : 'other';
}

function commitOf(release: GitHubRelease): string | undefined {
    if (SHA.test(release.target_commitish)) return release.target_commitish;
    return release.name?.match(SHA_IN_TEXT)?.[1] ?? release.body?.match(BODY_COMMIT)?.[1];
}

/** The jar to run: `Fidorial-<version>.jar`, not `fidorial-server-<version>.jar`. */
function mainJar(assets: Asset[]): Asset | undefined {
    const jars = assets.filter((asset) => asset.name.endsWith('.jar'));
    return (
        jars.find((asset) => /^Fidorial[-.]/.test(asset.name)) ??
        jars.find((asset) => !asset.name.toLowerCase().startsWith('fidorial-server')) ??
        jars[0]
    );
}

/** Turns a GitHub release into a build; `undefined` for drafts and releases without a jar. */
export function toBuild(release: GitHubRelease): Build | undefined {
    if (release.draft) return undefined;
    const assets: Asset[] = release.assets.map((asset) => ({
        name: asset.name,
        url: asset.browser_download_url,
        size: asset.size,
    }));
    const jar = mainJar(assets);
    if (!jar) return undefined;

    // The version comes from the tag (`dev-26.4-snapshot-8-build.43+0.1.0`), or else from the jar
    // name: the last `dev-N` builds of dev/26.3 ship `Fidorial-26.3-build.88+0.1.0.jar`.
    const tagVersion = release.tag_name.replace(/^(dev-|v)/, '');
    const jarVersion = jar.name.match(JAR_VERSION)?.[1] ?? '';
    const fromTag = tagVersion.match(MAVEN_VERSION);
    const parsed = fromTag ?? jarVersion.match(MAVEN_VERSION);
    const version = fromTag || !release.prerelease ? tagVersion : parsed ? jarVersion : release.tag_name;
    return {
        id: release.id,
        tag: release.tag_name,
        branch: branchOf(release),
        version,
        minecraft: parsed?.[1],
        build: parsed ? Number(parsed[2]) : undefined,
        // Only the workflow that puts the version in the tag publishes the API.
        api: fromTag !== null,
        publishedAt: release.published_at ?? release.created_at,
        commit: commitOf(release),
        page: release.html_url,
        jar,
        others: assets.filter((asset) => asset !== jar),
    };
}

/** `dev/26.4` → [26, 4]; anything else → null. */
function devVersion(branch: string): number[] | null {
    const match = branch.match(/^dev\/(\d+(?:\.\d+)*)$/);
    return match ? match[1].split('.').map(Number) : null;
}

function compareVersions(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] ?? 0) - (b[i] ?? 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

const newestFirst = (a: Build, b: Build) => b.publishedAt.localeCompare(a.publishedAt);

/**
 * Splits the builds of a branch by Minecraft version (dev/26.4: Snapshot 8, Snapshot 7…), newest
 * version first, builds of unknown version last. A branch that built for a single known version
 * stays in one group, so that its older builds are not set apart.
 */
function groupByVersion(builds: Build[]): VersionGroup[] {
    const byVersion = new Map<string, Build[]>();
    for (const build of builds.sort(newestFirst)) {
        const id = build.minecraft ?? '';
        byVersion.set(id, [...(byVersion.get(id) ?? []), build]);
    }
    const known = [...byVersion.keys()].filter((id) => id !== '');
    const groups =
        known.length < 2
            ? [{id: '', builds}]
            : [...known.map((id) => ({id, builds: byVersion.get(id)!})), ...(byVersion.has('') ? [{
                id: '',
                builds: byVersion.get('')!
            }] : [])];
    return groups.map((group) => ({...group, builds: group.builds.slice(0, MAX_BUILDS_PER_GROUP)}));
}

/**
 * Groups builds by branch, then by Minecraft version. Channel order: stable releases, then the
 * `dev/X.Y` branches from the newest Minecraft version down, then any other branch by its latest build.
 */
export function groupByChannel(builds: Build[]): Channel[] {
    const byId = new Map<string, Build[]>();
    const seen = new Set<number>();
    for (const build of builds) {
        if (seen.has(build.id)) continue;
        seen.add(build.id);
        const id = build.branch ?? 'stable';
        byId.set(id, [...(byId.get(id) ?? []), build]);
    }

    const channels: Channel[] = [...byId].map(([id, list]) => ({
        id,
        stable: id === 'stable',
        groups: groupByVersion(list),
    }));

    const rank = (channel: Channel) => (channel.stable ? 0 : devVersion(channel.id) ? 1 : 2);
    const latest = (channel: Channel) => channel.groups[0].builds[0].publishedAt;
    return channels.sort((a, b) => {
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        const versionA = devVersion(a.id);
        const versionB = devVersion(b.id);
        if (versionA && versionB) return compareVersions(versionB, versionA);
        return latest(b).localeCompare(latest(a));
    });
}

/** The builds kept by `groupByChannel`, flattened: what the page embeds for the browser to merge with. */
export function keptBuilds(channels: Channel[]): Build[] {
    return channels.flatMap((channel) => channel.groups.flatMap((group) => group.builds));
}

/** GETs a GitHub API URL. Throws when GitHub cannot be reached or answers with an error (rate limit included). */
async function getJson<T>(url: string, token?: string): Promise<T> {
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, {headers, signal: AbortSignal.timeout(15_000)});
    if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${response.url}`);
    return (await response.json()) as T;
}

/**
 * Reads up to `pages` × 100 releases, newest first. Throws when GitHub cannot be reached or answers
 * with an error (rate limit included).
 */
export async function fetchBuilds(options: { pages?: number; token?: string } = {}): Promise<Build[]> {
    const {pages = 1, token} = options;
    const builds: Build[] = [];
    for (let page = 1; page <= pages; page++) {
        const releases = await getJson<GitHubRelease[]>(`${API_URL}?per_page=100&page=${page}`, token);
        for (const release of releases) {
            const build = toBuild(release);
            if (build) builds.push(build);
        }
        if (releases.length < 100) break;
    }
    return builds;
}

// ── Commits of a build ────────────────────────────────────────────────────────────────────────

interface Commit {
    title: string;
    date: string;
    parents: string[];
}

/** The part of the commit graph read so far, by full SHA. */
type Graph = Map<string, Commit>;

/** Same commit, one of the two SHAs being possibly abbreviated (`Commit: 8bfe395` in older release bodies). */
const sameCommit = (a: string, b: string) => {
    const [x, y] = [a.toLowerCase(), b.toLowerCase()];
    return x.startsWith(y) || y.startsWith(x);
};

/** The full SHA of `sha`, possibly abbreviated, when that commit has been read. */
function resolve(graph: Graph, sha: string): string | undefined {
    const lower = sha.toLowerCase();
    if (graph.has(lower)) return lower;
    if (lower.length >= 40) return undefined;
    for (const full of graph.keys()) if (full.startsWith(lower)) return full;
    return undefined;
}

function ancestors(graph: Graph, sha: string): Set<string> {
    const seen = new Set([sha]);
    const queue = [sha];
    while (queue.length > 0) {
        for (const parent of graph.get(queue.pop()!)?.parents ?? []) {
            if (seen.has(parent) || !graph.has(parent)) continue;
            seen.add(parent);
            queue.push(parent);
        }
    }
    return seen;
}

/**
 * The commits reachable from `head` and not from `base` (`git log base..head`), newest first.
 * `complete` is false when a path from `head` leaves the part of the history read before meeting
 * `base`: more pages are needed. The commits returned are right even then, as long as a commit is
 * not dated before its parents, since the API lists the newest commits first.
 */
function commitRange(graph: Graph, head: string, base: string): { commits: string[]; complete: boolean } {
    const stop = ancestors(graph, base);
    const commits: string[] = [];
    let complete = true;
    const seen = new Set([head]);
    const queue = [head];
    while (queue.length > 0) {
        const sha = queue.pop()!;
        if (stop.has(sha)) continue;
        commits.push(sha);
        for (const parent of graph.get(sha)!.parents) {
            if (seen.has(parent)) continue;
            seen.add(parent);
            if (graph.has(parent)) queue.push(parent);
            else complete = false;
        }
    }
    commits.sort((a, b) => graph.get(b)!.date.localeCompare(graph.get(a)!.date));
    return {commits, complete};
}

const change = (graph: Graph, sha: string): Change => ({sha, title: graph.get(sha)!.title});

/** The build published before `build` on its branch, skipping rebuilds of the same commit. */
function previousBuild(branch: Build[], build: Build): Build | undefined {
    return branch
        .filter((other) => other.commit && other.publishedAt < build.publishedAt && !sameCommit(other.commit, build.commit!))
        .reduce<Build | undefined>((latest, other) => (!latest || other.publishedAt > latest.publishedAt ? other : latest), undefined);
}

/**
 * Reads the history of one branch, newest first, until the commits of every target are known, then
 * fills them in. When the commit of a target is not met before the history ends (the branch was
 * rewritten since), reading starts again from that commit.
 */
async function addBranchChanges(branch: Build[], targets: Build[], pages: number, token?: string): Promise<number> {
    const graph: Graph = new Map();
    const previous = new Map(targets.map((build) => [build, previousBuild(branch, build)]));

    const settled = (build: Build) => {
        const head = resolve(graph, build.commit!);
        if (!head) return false;
        const before = previous.get(build);
        if (!before) return true;
        const base = resolve(graph, before.commit!);
        return base !== undefined && commitRange(graph, head, base).complete;
    };

    targets.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    let start: string | undefined = targets[0]?.commit;
    let page = 1;
    for (let read = 0; read < pages && start; read++) {
        let commits: GitHubCommit[];
        try {
            commits = await getJson<GitHubCommit[]>(`${COMMITS_API_URL}?sha=${encodeURIComponent(start)}&per_page=100&page=${page}`, token);
        } catch {
            break; // Rate limited or offline: what was read is used.
        }
        for (const commit of commits) {
            graph.set(commit.sha.toLowerCase(), {
                title: commit.commit.message.split('\n', 1)[0].trim(),
                date: commit.commit.committer?.date ?? '',
                parents: commit.parents.map((parent) => parent.sha.toLowerCase()),
            });
        }
        const pending = targets.filter((build) => !settled(build));
        if (pending.length === 0) break;
        if (commits.length < 100) {
            start = pending.find((build) => !resolve(graph, build.commit!))?.commit;
            page = 1;
        } else {
            page++;
        }
    }

    let filled = 0;
    for (const build of targets) {
        const head = resolve(graph, build.commit!);
        if (!head) continue;
        filled++;
        const before = previous.get(build);
        const base = before && resolve(graph, before.commit!);
        const range = base ? commitRange(graph, head, base) : undefined;
        build.previous = before?.commit;
        if (range && range.commits.length > 0) {
            build.changes = range.commits.slice(0, MAX_CHANGES).map((sha) => change(graph, sha));
            build.changeCount = range.complete ? range.commits.length : undefined;
        } else {
            // No previous build, or it was not reached: at least the message of the build's own commit.
            build.changes = [change(graph, head)];
            build.changeCount = undefined;
        }
    }
    return filled;
}

/**
 * Fills the commits (`changes`, `changeCount`, `previous`) of the `targets` that do not have them,
 * reading at most `pages` × 100 commits per branch. `builds` are all the builds known: the previous
 * build of a target is looked for among them. Never throws: a branch whose history cannot be read
 * keeps its builds as they were. Returns how many builds were filled.
 */
export async function addChanges(
    builds: Build[],
    targets: Build[],
    options: { pages?: number; token?: string } = {},
): Promise<number> {
    const {pages = 1, token} = options;
    const key = (build: Build) => build.branch ?? 'stable';
    const byBranch = new Map<string, Build[]>();
    for (const build of targets) {
        if (!build.commit || build.changes) continue;
        byBranch.set(key(build), [...(byBranch.get(key(build)) ?? []), build]);
    }
    const filled = await Promise.all(
        [...byBranch].map(([id, list]) => addBranchChanges(builds.filter((build) => key(build) === id), list, pages, token)),
    );
    return filled.reduce((sum, count) => sum + count, 0);
}

/** Copies the commits of `from` to `to`, the same build read at another time. */
export function copyChanges(from: Build | undefined, to: Build): void {
    if (!from?.changes || to.changes) return;
    to.changes = from.changes;
    to.changeCount = from.changeCount;
    to.previous = from.previous;
}

let buildTimeBuilds: Promise<Build[]> | undefined;

/**
 * `fetchBuilds`, then the commits of the builds the page keeps (`addChanges`, `commitPages` pages per
 * branch), done once per process: the English and French pages share the result when the site is
 * built. A failure to read the releases is not kept, so the next page tries again.
 */
export function fetchBuildsOnce(options: { pages?: number; commitPages?: number; token?: string } = {}): Promise<Build[]> {
    buildTimeBuilds ??= fetchBuilds(options)
        .then(async (builds) => {
            await addChanges(builds, keptBuilds(groupByChannel(builds)), {pages: options.commitPages, token: options.token});
            return builds;
        })
        .catch((error: unknown) => {
            buildTimeBuilds = undefined;
            throw error;
        });
    return buildTimeBuilds;
}

// ── Rendering ─────────────────────────────────────────────────────────────────────────────────
// Plain HTML strings, so that the build-time render and the browser refresh share one template.

const labels = {
    en: {
        stable: 'Stable',
        tablist: 'Branches',
        versions: 'Minecraft version',
        earlier: 'Earlier builds',
        latest: 'Latest build',
        download: 'Download',
        published: 'Published',
        commit: 'Commit',
        changes: 'Changes',
        commitCount: (count: number) => (count === 1 ? '1 commit' : `${count} commits`),
        moreCommits: (count: number) => (count === 1 ? '1 more commit on GitHub' : `${count} more commits on GitHub`),
        moreOnGitHub: 'More on GitHub',
        compare: 'Compare on GitHub',
        api: 'Plugin API',
        otherFiles: 'Other files:',
        releasePage: 'Release page',
        history: (count: number) => `Previous builds (${count})`,
        build: 'Build',
        minecraft: 'Minecraft',
        date: 'Date',
        file: 'File',
        buildCount: (count: number) => (count === 1 ? '1 build listed' : `${count} builds listed`),
        empty: 'The build list could not be loaded.',
        allReleases: 'All releases on GitHub',
        source: 'From the GitHub releases of',
        mb: 'MB',
    },
    fr: {
        stable: 'Stable',
        tablist: 'Branches',
        versions: 'Version de Minecraft',
        earlier: 'Builds antérieurs',
        latest: 'Dernier build',
        download: 'Télécharger',
        published: 'Publié le',
        commit: 'Commit',
        changes: 'Changements',
        commitCount: (count: number) => (count === 1 ? '1 commit' : `${count} commits`),
        moreCommits: (count: number) => (count === 1 ? '1 autre commit sur GitHub' : `${count} autres commits sur GitHub`),
        moreOnGitHub: 'La suite sur GitHub',
        compare: 'Comparer sur GitHub',
        api: 'API des plugins',
        otherFiles: 'Autres fichiers :',
        releasePage: 'Page de la release',
        history: (count: number) => `Builds précédents (${count})`,
        build: 'Build',
        minecraft: 'Minecraft',
        date: 'Date',
        file: 'Fichier',
        buildCount: (count: number) => (count === 1 ? '1 build listé' : `${count} builds listés`),
        empty: 'Impossible de charger la liste des builds.',
        allReleases: 'Toutes les releases sur GitHub',
        source: 'D’après les releases GitHub de',
        mb: 'Mo',
    },
} as const;

const escapeHtml = (text: string) =>
    text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** `26.4-snapshot-8` → `26.4 Snapshot 8`, following the minecraftVersionName rules of gradle.properties. */
export function minecraftName(id: string): string {
    const kinds: Record<string, string> = {snapshot: 'Snapshot', pre: 'Pre-Release', rc: 'Release Candidate'};
    const match = id.match(/^(\d+(?:\.\d+)*)-(snapshot|pre|rc)-(\d+)$/);
    return match ? `${match[1]} ${kinds[match[2]]} ${match[3]}` : id;
}

/** Tab label inside a branch, where the base version is already known: `26.4-snapshot-7` → `Snapshot 7`. */
function versionLabel(group: VersionGroup, lang: Lang): string {
    if (group.id === '') return labels[lang].earlier;
    return minecraftName(group.id).replace(/^\d+(?:\.\d+)* (?=\D)/, '');
}

function formatSize(bytes: number, lang: Lang): string {
    const value = new Intl.NumberFormat(lang, {maximumFractionDigits: 1}).format(bytes / 1024 / 1024);
    return `${value} ${labels[lang].mb}`;
}

function formatDate(iso: string, lang: Lang): string {
    const date = new Intl.DateTimeFormat(lang, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
    }).format(new Date(iso));
    return `${date} UTC`;
}

const channelLabel = (channel: Channel, lang: Lang) => (channel.stable ? labels[lang].stable : channel.id);

function shaLink(commit: string): string {
    const sha = escapeHtml(commit);
    return `<a href="${REPOSITORY_URL}/commit/${sha}" rel="noopener"><code>${sha.slice(0, 7)}</code></a>`;
}

const commitLink = (build: Build) => (build.commit ? shaLink(build.commit) : '—');

/** A commit title, with `#184` linked to its pull request. */
function commitTitle(title: string): string {
    return escapeHtml(title).replace(/(^|[\s(])#(\d+)\b/g, `$1<a href="${REPOSITORY_URL}/issues/$2" rel="noopener">#$2</a>`);
}

/** Every commit of the build on GitHub: the comparison with the previous build, or else the history. */
function changesUrl(build: Build): string {
    const head = escapeHtml(build.commit ?? '');
    return build.previous
        ? `${REPOSITORY_URL}/compare/${escapeHtml(build.previous)}...${head}`
        : `${REPOSITORY_URL}/commits/${head}`;
}

/**
 * The commits of a build, `limit` at most, then a link to GitHub for the others. With `compare`, the
 * link to the comparison is there even when every commit is shown.
 */
function renderCommits(build: Build, lang: Lang, limit: number, compare: boolean): string {
    const t = labels[lang];
    const changes = build.changes ?? [];
    const shown = changes.slice(0, limit);
    const hidden = build.changeCount === undefined ? undefined : build.changeCount - shown.length;
    const link =
        hidden === undefined
            ? t.moreOnGitHub
            : hidden > 0
                ? t.moreCommits(hidden)
                : compare && build.previous
                    ? t.compare
                    : '';
    const items = shown
        .map((change) => `<li>${shaLink(change.sha)} <span class="fido-dl__commit-title">${commitTitle(change.title)}</span></li>`)
        .join('');
    return `<ul class="fido-dl__commits">${items}</ul>${link && `<a class="fido-dl__more" href="${changesUrl(build)}" rel="noopener">${link}</a>`}`;
}

function renderChanges(build: Build, lang: Lang): string {
    if (!build.changes?.length) return '';
    const t = labels[lang];
    const count = build.changeCount === undefined ? '' : ` · ${t.commitCount(build.changeCount)}`;
    return `
	<div class="fido-dl__changes">
		<p class="fido-dl__changes-title">${t.changes}${count}</p>
		${renderCommits(build, lang, MAX_CHANGES, true)}
	</div>`;
}

function buildTitle(build: Build): string {
    if (build.build === undefined) return `<code>${escapeHtml(build.tag)}</code>`;
    return `#${build.build}`;
}

function renderLatest(build: Build, lang: Lang): string {
    const t = labels[lang];
    const rows: [string, string][] = [];
    if (build.minecraft) rows.push([t.minecraft, escapeHtml(minecraftName(build.minecraft))]);
    rows.push([t.published, escapeHtml(formatDate(build.publishedAt, lang))]);
    rows.push([t.commit, commitLink(build)]);
    const api = build.api ? `<code>fr.fidorial:fidorial-api:${escapeHtml(build.version)}</code>` : '';

    const others = build.others
        .map(
            (asset) =>
                `<a href="${escapeHtml(asset.url)}" rel="noopener">${escapeHtml(asset.name)}</a> (${formatSize(asset.size, lang)})`,
        )
        .concat(`<a href="${escapeHtml(build.page)}" rel="noopener">${t.releasePage}</a>`)
        .join(' · ');

    return `
<div class="fido-dl__latest">
	<p class="fido-dl__eyebrow">${t.latest}</p>
	<p class="fido-dl__version"><code>${escapeHtml(build.version)}</code></p>
	<div class="fido-dl__cta">
		<a class="fido-dl__button" href="${escapeHtml(build.jar.url)}" rel="noopener">
			<svg aria-hidden="true" viewBox="0 0 24 24" width="1.2em" height="1.2em"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V4a1 1 0 0 1 1-1Zm-7 15a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"/></svg>
			${t.download}
			<span class="fido-dl__size">${formatSize(build.jar.size, lang)}</span>
		</a>
		<code class="fido-dl__file">${escapeHtml(build.jar.name)}</code>
	</div>
	<dl class="fido-dl__facts">
		${rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join('\n\t\t')}
		${api && `<div class="fido-dl__wide"><dt>${t.api}</dt><dd>${api}</dd></div>`}
	</dl>
	${renderChanges(build, lang)}
	<p class="fido-dl__others">${t.otherFiles} ${others}</p>
</div>`;
}

function renderHistory(builds: Build[], lang: Lang): string {
    if (builds.length === 0) return '';
    const t = labels[lang];
    // Only useful when the builds listed differ: not inside a Minecraft version tab, and not for
    // the old builds, which have no Minecraft version in their name.
    const minecraft = new Set(builds.map((build) => build.minecraft ?? '')).size > 1;
    // One <tbody> per build: its row, then its commits across the other columns, where they have room.
    const rows = builds
        .map((build) => {
            const commits = build.changes?.length
                ? renderCommits(build, lang, HISTORY_CHANGES, false)
                : build.commit
                    ? `<ul class="fido-dl__commits"><li>${commitLink(build)}</li></ul>`
                    : '';
            return `
			<tbody>
				<tr>
					<td>${buildTitle(build)}</td>
					${minecraft ? `<td>${build.minecraft ? escapeHtml(minecraftName(build.minecraft)) : '—'}</td>` : ''}
					<td>${escapeHtml(formatDate(build.publishedAt, lang))}</td>
					<td><a href="${escapeHtml(build.jar.url)}" rel="noopener">${t.download}</a> <span class="fido-dl__size">${formatSize(build.jar.size, lang)}</span></td>
				</tr>${commits && `
				<tr class="fido-dl__changes-row"><td></td><td colspan="${minecraft ? 3 : 2}">${commits}</td></tr>`}
			</tbody>`;
        })
        .join('');
    return `
<details class="fido-dl__history">
	<summary>${t.history(builds.length)}</summary>
	<div class="fido-dl__table">
		<table>
			<thead><tr><th>${t.build}</th>${minecraft ? `<th>${t.minecraft}</th>` : ''}<th>${t.date}</th><th>${t.file}</th></tr></thead>${rows}
		</table>
	</div>
</details>`;
}

function tab(id: string, controls: string, active: boolean, data: string, label: string): string {
    return `<button type="button" role="tab" id="${id}" aria-controls="${controls}" aria-selected="${active}" tabindex="${active ? 0 : -1}" ${data}>${escapeHtml(label)}</button>`;
}

/** A branch: its Minecraft version tabs when it has several, then one block per version. */
function renderChannel(channel: Channel, index: number, isActive: boolean, lang: Lang, version?: string): string {
    const t = labels[lang];
    const split = channel.groups.length > 1;
    const active = channel.groups.some((group) => group.id === version) ? version : channel.groups[0].id;
    const count = channel.groups.reduce((sum, group) => sum + group.builds.length, 0);

    const versionTabs = split
        ? `
	<div class="fido-dl__versions">
		<span class="fido-dl__versions-label" id="fido-dl-versions-${index}">${t.versions}</span>
		<div class="fido-dl__subtabs" role="tablist" aria-labelledby="fido-dl-versions-${index}">${channel.groups
            .map((group, j) =>
                tab(`fido-dl-vtab-${index}-${j}`, `fido-dl-group-${index}-${j}`, group.id === active, `data-version="${escapeHtml(group.id)}"`, versionLabel(group, lang)),
            )
            .join('')}</div>
	</div>`
        : '';

    const groups = channel.groups
        .map((group, j) => {
            const [latest, ...history] = group.builds;
            const attributes = split
                ? ` role="tabpanel" id="fido-dl-group-${index}-${j}" aria-labelledby="fido-dl-vtab-${index}-${j}"`
                : '';
            const heading = split
                ? `<p class="fido-dl__group-heading"><strong>${escapeHtml(group.id ? minecraftName(group.id) : t.earlier)}</strong> · ${t.buildCount(group.builds.length)}</p>`
                : '';
            return `
	<div class="fido-dl__group${group.id === active ? ' is-active' : ''}"${attributes} data-version="${escapeHtml(group.id)}">
		${heading}
		${renderLatest(latest, lang)}
		${renderHistory(history, lang)}
	</div>`;
        })
        .join('');

    return `
<section class="fido-dl__panel${isActive ? ' is-active' : ''}" role="tabpanel" id="fido-dl-panel-${index}" aria-labelledby="fido-dl-tab-${index}" data-channel="${escapeHtml(channel.id)}">
	<p class="fido-dl__heading"><strong>${escapeHtml(channelLabel(channel, lang))}</strong> · ${t.buildCount(count)}</p>
	${versionTabs}
	${groups}
</section>`;
}

/**
 * The whole widget: one tab per branch, then, in a branch built for several Minecraft versions, one
 * tab per version. The selected ones (or the first ones) are open. Without JavaScript the tabs are
 * hidden and everything is shown, one block after the other.
 */
export function renderChannels(
    channels: Channel[],
    lang: Lang,
    selected: { channel?: string; version?: string } = {},
): string {
    const t = labels[lang];
    if (channels.length === 0) {
        return `<p class="fido-dl__empty">${t.empty} <a href="${RELEASES_URL}" rel="noopener">${t.allReleases}</a></p>`;
    }
    const active = (
        channels.find((channel) => channel.id === selected.channel) ??
        channels.find((channel) => channel.groups.length > 1 && channel.groups.some((group) => group.id === selected.version)) ??
        channels[0]
    ).id;

    const tabs = channels
        .map((channel, index) =>
            tab(`fido-dl-tab-${index}`, `fido-dl-panel-${index}`, channel.id === active, `data-channel="${escapeHtml(channel.id)}"`, channelLabel(channel, lang)),
        )
        .join('');

    const panels = channels
        .map((channel, index) => renderChannel(channel, index, channel.id === active, lang, selected.version))
        .join('');

    return `
<div class="fido-dl__tabs" role="tablist" aria-label="${t.tablist}">${tabs}</div>
${panels}
<p class="fido-dl__source">${t.source} <a href="${RELEASES_URL}" rel="noopener">${REPOSITORY}</a>.</p>`;
}
