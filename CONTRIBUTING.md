# Contributing to Skyblock Calculator

Thank you for your interest in contributing to Skyblock Calculator! We welcome contributions from the community.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/sbcalc.git`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- pnpm 10+

### Running the Project

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run linting
pnpm lint

# Format code
pnpm format
```

## 📝 Code Guidelines

### TypeScript

- Use strict TypeScript
- Prefer interfaces over types for object definitions
- Export types and interfaces explicitly

### React/Next.js

- Use functional components with hooks
- Prefer server components when possible
- Use proper TypeScript types for props

### Styling

- Use Tailwind CSS classes
- Follow the existing design system
- Use shadcn/ui components when available

### Code Style

- Use Prettier for formatting (automatic on save)
- Follow ESLint rules
- Use meaningful variable and function names
- Add comments for complex logic

## 🐛 Bug Reports

When reporting bugs, please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/environment information
- Screenshots if applicable

## ✨ Feature Requests

For feature requests:

- Describe the problem you're solving
- Explain your proposed solution
- Consider implementation complexity
- Check if it aligns with project goals

## 🔍 Pull Request Process

1. Ensure your code follows the style guidelines
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure all tests pass: `pnpm test`
5. Update the README.md if necessary
6. Create a descriptive pull request title and description

### Commit Message Format

Use conventional commits:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code refactoring`
- `test: add tests`
- `chore: maintenance tasks`

## 📦 Package Structure

- `apps/web/` - Main Next.js application
- `packages/ui/` - Shared UI components
- `packages/neu-recipe-processor/` - Data processing utilities
- `packages/eslint-config/` - ESLint configuration
- `packages/typescript-config/` - TypeScript configuration

## 🎯 Areas for Contribution

- **UI/UX Improvements**: Better user interface and experience
- **Performance**: Optimization and faster load times
- **Features**: New calculator features or item support
- **Documentation**: Improve docs and add examples
- **Testing**: Add unit and integration tests
- **Accessibility**: Improve a11y support

## 🤝 Community

- Be respectful and constructive
- Help others learn and grow
- Focus on the project's goals
- Follow the code of conduct

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to open an issue for any questions about contributing!
