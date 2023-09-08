import { join } from "https://deno.land/std@0.201.0/path/mod.ts";

const OWNER = Deno.env.get("REPOFE_OWNER") as string | undefined;
const OWNER_ROOT = Deno.env.get("REPOFE_OWNER_ROOT") as string | undefined;
const REPO_ROOT = Deno.env.get("REPOFE_ROOT") as string;
const HOME = Deno.env.get("HOME") as string;

function getRepoInfo(url: string): { owner: string, repo: string } {
  if (url.startsWith("https")) {
    const u = new URL(url);
    const [, owner, repo] = u.pathname.split('/');
    return { owner, repo };
  }
  if (url.startsWith("git@")) {
    const [, expr] = url.split(':');
    const [owner, repo] = expr.split('/');
    // const repoName = repo.split('.')[0];
    return { owner, repo: repo.replace(/\.git/, "") };
  }

  const [owner, repo] = url.split('/');
  return { owner, repo };
}

async function fetchRepo() {
  const info = getRepoInfo(input);
  const gitUrl = `https://github.com/${info.owner}/${info.repo}`;

  let destination: string;
  if (OWNER === info.owner && OWNER_ROOT) {
    Deno.mkdirSync(OWNER_ROOT, { recursive: true });
    destination = `${OWNER_ROOT}/${info.repo}`;
  } else if (REPO_ROOT) {
    Deno.mkdirSync(REPO_ROOT, { recursive: true });
    destination = `${REPO_ROOT}/${info.owner}/${info.repo}`;
  } else {
    Deno.mkdirSync(`${HOME}/repo`, { recursive: true });
    destination = `${HOME}/repo/${info.owner}/${info.repo}`;
  }

  const stats = await Deno.stat(destination).catch(() => null);
  if (stats) {
    console.error(`[repofe] ${destination} already exists`)
    Deno.exit(1);
  }

  const clone = new Deno.Command('git', {
    args: ["clone", gitUrl, destination],
    stdout: "piped",
    stderr: "piped",
  }).output();
  printCommandResult(await clone);
  console.log('[repofe:clone]', gitUrl, '->', destination);
}

function printCommandResult(output: Deno.CommandOutput) {
  if (output.code === 0) {
    console.info(new TextDecoder().decode(output.stdout));
  } else {
    console.error(new TextDecoder().decode(output.stderr));
  }
}

async function connectRepo(dir: string, preferredName?: string) {
  if (!OWNER_ROOT) {
    console.error("[repofe] REPOFE_OWNER_ROOT is not set");
    Deno.exit(1);
  }
  const repoName = preferredName ?? dir.slice().split('/').pop();
  const destination = join(OWNER_ROOT as string, repoName as string);
  const origin = `https://github.com/${OWNER}/${repoName}`;
  {
    await Deno.mkdir(OWNER_ROOT as string, { recursive: true });
    const move = await new Deno.Command('mv', {
      args: [dir, destination],
      stdout: "piped",
      stderr: "piped",
    }).output();
    printCommandResult(move);
  }
  // {
  const alreadyInit = await Deno.stat(join(destination, '.git')).catch(() => null);
  if (!alreadyInit) {
    const init = await new Deno.Command('git', {
      args: ["init"],
      stdout: "piped",
      stderr: "piped",
      cwd: destination,
    }).output();
    printCommandResult(init);
  }

  const addRemote = await new Deno.Command('git', {
    args: ["remote", "add", "origin", origin],
    stdout: "piped",
    stderr: "piped",
    cwd: destination,
  }).output();
  printCommandResult(addRemote);

  const repoCreate = await new Deno.Command('gh', {
    args: ["repo", "create", `${OWNER}/${repoName}`, '--public'],
    stdout: "piped",
    stderr: "piped",
    cwd: destination,
  }).output();
  printCommandResult(repoCreate);

  const gitPush = await new Deno.Command('git', {
    args: ["push", "origin", "main"],
    stdout: "piped",
    stderr: "piped",
    cwd: destination,
  }).output();
  printCommandResult(gitPush);
  console.log('[repofe:created]', destination, '->', origin)
}

const input = Deno.args[0];

if (input.includes("/")) {
  fetchRepo();
}

if (input === 'connect') {
  const cwd = Deno.cwd();
  connectRepo(join(cwd, Deno.args[1], Deno.args[2]));
}
