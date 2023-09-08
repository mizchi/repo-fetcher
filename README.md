# repofe

Simple github repository fetcher

## Install

```
$ deno install -A WIP
```

```bash
## Your repository root
export REPOFE_ROOT=$HOME/repo # default
## If repo owner match to owner, use REPOFE_OWNER_ROOT
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

CAUTION: it causes mv and create repo

```bash
$ repofe connect mylib
# move to ~/owner/mylib
# git remote add origin https://github.com/owner/mylib --public
# gh repo create owner/mylib
```

## LICENSE

MIT