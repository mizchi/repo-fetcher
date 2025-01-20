# repo-fetcher

Simple github repository fetcher inspired by ghq

## Install

Require deno

```bash
$ deno install --allow-read --allow-write --allow-env --allow-sys --allow-run https://raw.githubusercontent.com/mizchi/repofe/main/repo.ts
```

Simple usage
```bash

```

```bash
## Your repository root
export REPO_FETCHER_ROOT=$HOME/repo # default

 # If repo owner matches to owner, use REPO_FETCHER_OWNER_ROOT
export REPO_FETCHER_OWNER=mizchi
export REPO_FETCHER_OWNER_ROOT=$HOME/mizchi
```

### Clone

```bash
$ repo https://github.com/github/Spoon-Knife # => ~/repo/github/Spoon-Knife

# clone as owner
$ repo https://github.com/owner/repo #=> ~/owner/repo

# Partial checkout
$ repo https://github.com/owner/repo/tree/main/dir dest # destdir
```

### Connect

CAUTION: it causes mv and create github repo as public.

```bash
$ repo manage mylib
# move to ~/owner/mylib
# git remote add origin https://github.com/owner/mylib --public
# gh repo create owner/mylib

## Specify reponame
$ repo manage ../mylib repo-name
```

## LICENSE

MIT