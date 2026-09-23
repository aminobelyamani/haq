# Publishing Guide

## All publishable packages (@haq/astro, @haq/astro-ssr, @haq/utils, @haq/language-server)

- [ ] `pn deploy:dry-run`
- [ ] commit and push all changes made
- [ ] Run changesets
    - [ ] `pn changeset add`
    - [ ] `pn changeset version`

## @haq/utils

- [ ] Update version in jsr.json
- [ ] Review changes and commit and push [CI Release]
- [ ] `pn deploy:publish`

## All other packages

**NOTE** - We can skip running changesets if change was made in @haq/utils

- [ ] Review changes then run `pn deploy:publish`
