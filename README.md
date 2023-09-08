# repofe

Simple github repository fetcher

## Install

Require deno

```
$ deno install -A https://raw.githubusercontent.com/mizchi/repofe/main/repofe.ts
```

```bash
## Your repository root
export REPOFE_ROOT=$HOME/repo # default
## If repo owner matches to owner, use REPOFE_OWNER_ROOT
export REPOFE_OWNER=mizchi
export REPOFE_OWNER_ROOT=$HOME/mizchi
```

### Clone

```bash
$ repofe https://github.com/github/Spoon-Knife # => ~/repo/github/Spoon-Knife
$ repofe github/Spoon-Knife # same

# clone as owner
$ repofe mizchi/repofe #=> ~/owner/repofe
```

### Connect

CAUTION: it causes mv and create github repo as public.

```bash
$ repofe connect mylib
# move to ~/owner/mylib
# git remote add origin https://github.com/owner/mylib --public
# gh repo create owner/mylib

## Specify reponame
$ repofe connect ../mylib repo-name
```

## LICENSE

MIT