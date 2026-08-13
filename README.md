# Skyblock Calculator (sbcalc)

Web app for calculating Hypixel Skyblock item recipes, forge times, and base material requirements. Built with Next.js and TypeScript.

Live sites:

- https://sbcalc.net
- https://skyexit.github.io/sbcalc/

## Features

- Recipe tree view for crafting chains
- Base material requirements calculator
- Forge time calculation
- Persistent forge tracker with nested requirements, live timers, and progress
- Fast item search
- Quantity multiplier

## Tech stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS, shadcn/ui
- Turbo (monorepo), pnpm
- Custom NEU data processor

## Repository layout

- `apps/web/` – Next.js app
- `packages/ui/` – shared UI components
- `packages/neu-recipe-processor/` – pulls and processes NEU data
- `packages/eslint-config/` – shared ESLint config
- `packages/typescript-config/` – shared TS config

## Getting started

Prerequisites:

- Node.js 20+
- pnpm 10+

Install:

```bash
pnpm install
```

Development:

```bash
pnpm dev
```

Other commands:

```bash
pnpm build    # build all packages
pnpm lint     # lint all packages
pnpm format   # format with Prettier
```

The web app runs at http://localhost:3000.

## Data

This project uses item and recipe data from the NotEnoughUpdates (NEU) repository: https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO

To refresh data and reclone the NEU repo:

```bash
# from repo root
pnpm run build:clean:neu

# or for a clean web build with fresh data
pnpm --filter sbcalc-web run build:clean
```

Regular dev/build scripts in `apps/web` will generate data as part of the run.
They also clone or update the `26.2` branch of Hypixel's official SkyBlock
resource pack and generate `apps/web/public/hypixel.cats`. The daily data
workflow commits changes from both upstream repositories.

## GitHub Pages deployment

The `deploy-pages.yml` workflow builds a static export from the committed data
whenever `main` changes. It deliberately calls `next build` directly so a Pages
deployment never clones or rewrites the upstream data during the build.

The Pages build uses `/sbcalc` as its base path. The regular deployment at
`sbcalc.net` keeps its root path because the static export settings are enabled
only when `GITHUB_PAGES=true`.

## Contributing

Contributions are welcome. See CONTRIBUTING.md for guidelines.

## License

MIT

## Acknowledgments

- NotEnoughUpdates for item and recipe data
- [MCHeads](https://mc-heads.net/) for rendering Minecraft head textures in the
  static GitHub Pages build
- shadcn/ui for UI components
