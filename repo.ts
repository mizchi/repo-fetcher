#!/usr/bin/env -S deno run -A

type RepoInfo = {
  owner: string,
  repo: string,
  branch: string,
  dir: string,
}

const HELP_TEXT = `
Usage: repo <github-url> [dest]

Examples:
    $ repo https://github.com/github/Spoon-Knife
    $ repo github/Spoon-Knife
    $ repo https://github.com/mizchi/monorepo/tree/main/packages/lib-base ./lib
    $ repo mizchi/monorepo/packages/lib-base ./lib

Environment Variables:
    export REPO_FETCHER_ROOT=$HOME/repo # default
    export REPO_FETCHER_OWNER=yourname
    export REPO_FETCHER_OWNER_ROOT=$HOME/mizchi # clone if owner is you
`;

import { join, dirname } from "https://deno.land/std@0.201.0/path/mod.ts";
import { $, cd } from "npm:zx@7.1.1";
import { parse } from "https://deno.land/std@0.202.0/flags/mod.ts";

const args = parse(Deno.args, {
  alias: {
    branch: "b",
    root: "r",
    help: 'h'
  },
});

const OWNER = Deno.env.get("REPO_FETCHER_OWNER") as string | undefined;
const OWNER_ROOT = Deno.env.get("REPO_FETCHER_OWNER_ROOT") as string | undefined;
const REPO_ROOT = args.root ?? Deno.env.get("REPO_FETCHER_ROOT") as string;
const HOME = Deno.env.get("HOME") as string;

function getDestByEnv(info: RepoInfo) {
  if (OWNER === info.owner && OWNER_ROOT) {
    return `${OWNER_ROOT}/${info.repo}`;
  } else if (REPO_ROOT) {
    return `${REPO_ROOT}/${info.owner}/${info.repo}`;
  } else {
    return `${HOME}/repo/${info.owner}/${info.repo}`;
  }
}

function parseRepoUrl(url: string): RepoInfo {
  if (url.startsWith("https")) {
    const u = new URL(url);
    const [, owner, repo, _tree, branch, ...paths] = u.pathname.split('/');
    return { owner, repo, branch: branch ?? "main", dir: paths.join("/") };
  }
  if (url.startsWith("git@")) {
    const [, expr] = url.split(':');
    const [owner, repo, _tree, branch, ...paths] = expr.split('/');
    return { owner, repo: repo.replace(/\.git/, ""), branch: branch ?? "main", dir: paths.join("/") };
  }

  const [owner, repo, ...paths] = url.split('/');
  return { owner, repo, branch: "main", dir: paths.join("/") };
}

async function fetchRepo(input: string, manualDest?: string) {
  const info = parseRepoUrl(input);
  const gitUrl = `https://github.com/${info.owner}/${info.repo}`;
  const dest = manualDest ?? getDestByEnv(info);
  if (info.dir) {
    if (await Deno.stat(dest).catch(() => null)) {
      console.error(`[repo] directory checkout is only supported for new repo`);
      Deno.exit(1);
    }

    const cwd = Deno.cwd();
    const tempDir = await Deno.makeTempDir();
    try {
      cd(tempDir);
      await $`git clone --filter=blob:none --no-checkout --depth 1 --sparse ${gitUrl} .`;
      await $`git sparse-checkout init`;
      await $`git sparse-checkout add ${info.dir}`;
      await $`git checkout`;
      cd(cwd);
      const copyPath = join(tempDir, info.dir);
      await $`mkdir -p ${dirname(dest)}`;
      await $`mv ${copyPath} ${dest}`;
    } finally {
      await Deno.remove(tempDir, { recursive: true });
      cd(cwd);
    }
    Deno.exit(0);
  }
  // clone
  if (await Deno.stat(dest).catch(() => null)) {
    cd(dest);
    const diff = await $`git status --porcelain`;
    if (diff.stdout.trim() !== "") {
      console.error(`[repo] can't sync: ${dest} is dirty repo`);
      Deno.exit(1);
    }
    await $`git pull origin ${args.branch ?? info.branch}`;
  } else {
    // use repository default branch
    if (args.branch) {
      await $`git clone ${gitUrl} ${dest} --depth 1 --branch ${args.branch}`;
    } else {
      await $`git clone ${gitUrl} ${dest} --depth 1`;
    }
  }
  Deno.exit(0);
}

async function manageRepo(dir: string, preferredName?: string) {
  if (!OWNER_ROOT) {
    console.error("[repo] REPO_FETCHER_OWNER_ROOT is not set");
    Deno.exit(1);
  }
  const repoName = preferredName ?? dir.slice().split('/').pop();
  const dest = join(OWNER_ROOT as string, repoName as string);
  const origin = `https://github.com/${OWNER}/${repoName}`;
  await Deno.mkdir(OWNER_ROOT as string, { recursive: true });
  await $`mv ${dir} ${dest}`;

  // ensure git init
  if (!await Deno.stat(join(dest, '.git')).catch(() => null)) {
    await $`git init`;
  }
  await $`git remote add origin ${origin}`;
  console.log('[repo:created]', dest, '->', origin);

  const hasRemote = await $`git remote -v`.then(() => true).catch(() => false);
  if (!hasRemote && args.private) {
    await $`gh repo create ${OWNER}/${repoName} --private --confirm`;
  }
  if (!hasRemote && args.public) {
    await $`gh repo create ${OWNER}/${repoName} --public --confirm`;
  }
  Deno.exit(0);
}

if (args.help || args._.length === 0) {
  console.log(HELP_TEXT);
  Deno.exit(0);
}

const cmd = args._[0] as string | undefined;
if (cmd?.includes("/")) {
  const dest = args._[1] as string | undefined;
  await fetchRepo(cmd, dest);
}

if (cmd === 'manage') {
  const cwd = Deno.cwd();
  await manageRepo(join(cwd, Deno.args[1], Deno.args[2]));
}

