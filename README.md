# Skyblock Calculator (sbcalc)

A comprehensive web application for calculating Minecraft Hypixel Skyblock item recipes, forge times, and base material requirements. Built with Next.js, TypeScript, and shadcn/ui components.

## 🎮 Features

- **Recipe Tree Visualization**: Interactive tree view of item crafting recipes
- **Base Requirements Calculator**: Calculate all base materials needed for any item
- **Forge Time Calculator**: Compute total forge times for items requiring furnace/forge processing
- **Item Search**: Fast search through thousands of Skyblock items
- **Multiplier Support**: Calculate requirements for multiple quantities
- **Expandable Recipe Views**: Drill down into complex crafting chains
- **Real-time Data**: Uses the latest item and recipe data from NotEnoughUpdates (NEU)

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Build System**: Turbo (monorepo)
- **Package Manager**: pnpm
- **Data Processing**: Custom NEU recipe processor
- **Deployment**: Ready for Vercel/Netlify

## 📦 Project Structure

This is a monorepo containing:

- `apps/web/` - Main Next.js web application
- `packages/ui/` - Shared UI components library
- `packages/neu-recipe-processor/` - Data processing utilities for NEU repo
- `packages/eslint-config/` - Shared ESLint configuration
- `packages/typescript-config/` - Shared TypeScript configuration

## 🛠️ Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/Hexeption/sbcalc.git
cd sbcalc

# Install dependencies
pnpm install
```

### Running the Development Server

```bash
# Start development server for all apps
pnpm dev

# Or run specific commands
pnpm build    # Build all packages
pnpm lint     # Lint all packages
pnpm format   # Format code with Prettier
```

The web app will be available at `http://localhost:3000`.

## 📊 Data Sources

This project uses data from the [NotEnoughUpdates (NEU) repository](https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO), which provides comprehensive item and recipe information for Hypixel Skyblock.

## 🎯 Usage

1. **Search for Items**: Use the search bar to find any Skyblock item
2. **View Recipe Tree**: See the complete crafting chain for complex items
3. **Calculate Requirements**: Get a breakdown of all base materials needed
4. **Adjust Quantities**: Use the multiplier to calculate for multiple items
5. **Expand/Collapse**: Click on recipe nodes to explore crafting dependencies

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [NotEnoughUpdates](https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO) for the comprehensive item and recipe data
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- The Hypixel Skyblock community for inspiration and feedback
