# @mizchi/repo

Simple github repository fetcher inspired by https://github.com/x-motemen/ghq

## Install

```bash
$ deno install -Afg jsr:@mizchi/repo # (optional) --name your-cli-name
$ repo -h
```

### How to use

```bash
# Fetch
$ repo https://github.com/github/Spoon-Knife.git # => ~/repo/github/Spoon-Knife
$ repo github/Spoon-Knife
# Partial checkout to dest
$ repo https://github.com/owner/repo/tree/main/target-dir ./dest # 
```

## Setup

```bash
## Your repository root
export REPO_FETCHER_ROOT=$HOME/repo # default
```

## LICENSE

MIT