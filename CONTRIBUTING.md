# Contributing to OpenSquawk

Bug reports, documentation improvements, and code contributions are welcome.
Please open an issue before starting a large change so that its scope can be
agreed in advance.

## Contribution terms

By intentionally submitting a pull request, patch, or other contribution for
inclusion in OpenSquawk, you agree to the contribution grant in section 6 of
the [OpenSquawk Community Source License](./LICENSE). In summary, you retain
ownership of your contribution and grant the OpenSquawk copyright holders the
rights needed to use, modify, distribute, sublicense, and relicense it,
including in commercial offerings.

Only submit material that you have the legal right to contribute. If your
employer or another organization may own the material, obtain its written
permission before submitting it. Do not submit a contribution if you do not
agree to the contribution terms.

## Development

OpenSquawk uses Node.js 22 and Yarn 4. Install dependencies and run the checks
relevant to your change:

```bash
corepack enable
yarn install
yarn test
yarn typecheck
```

Keep pull requests focused, explain user-visible behavior changes, and include
tests when practical.
