# Skyblock Calculator - Tailwind CSS + shadcn/ui

This is a modern, dark-themed crafting calculator for Skyblock items built with Tailwind CSS and shadcn/ui components for a professional, responsive design.

## Features

### 🎨 Modern Design with Tailwind CSS

- **Dark gradient background** (`bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800`)
- **Glassmorphism effects** with `backdrop-blur-sm` and semi-transparent backgrounds
- **Professional color scheme** using Tailwind's slate and blue color palettes
- **Smooth animations** with Tailwind's `transition-all` and `hover:` utilities
- **Fully responsive** design with Tailwind's responsive prefixes

### 🔍 Advanced Search

- Clean search input with focus states and transitions
- Dropdown suggestions with proper z-index and backdrop blur
- Real-time filtering and item selection

### 📊 Stats Dashboard

- Responsive grid layout with `flex-wrap` for mobile
- Gradient text for the main title using `bg-gradient-to-r` and `bg-clip-text`
- Card-based stats display with hover effects

### 🌳 Interactive Fusion Tree

- Expandable/collapsible recipe tree with smooth animations
- Visual hierarchy using Tailwind's spacing and border utilities
- Item cards with hover effects (`hover:translate-x-1`, `hover:bg-slate-800/60`)
- Color-coded elements (Direct materials with green badges, quantities with blue)
- Proper nesting with `ml-4` and `ml-8` for visual depth

### 📋 Materials Grid

- Responsive grid layout (`grid-cols-1 md:grid-cols-2`)
- Card-based material display with hover animations
- Clean typography hierarchy using Tailwind's text sizing
- Rate calculations with proper formatting

## Design System

### Color Palette (Tailwind)

- **Background**: `slate-900`, `gray-900`, `slate-800` with gradients
- **Cards**: `slate-800/60` with backdrop blur for glassmorphism
- **Accents**: `blue-400`, `blue-500` for interactive elements
- **Text**: `slate-100`, `slate-200`, `slate-400` for hierarchy
- **Success**: `green-500/20` and `green-300` for direct materials
- **Borders**: `blue-500/20`, `blue-500/30` for subtle definition

### Typography

- **Titles**: `text-4xl md:text-5xl font-bold` with gradient text
- **Cards**: `text-xl font-semibold` for section headers
- **Body**: `text-lg font-medium` for main content
- **Small text**: `text-sm` for rates and metadata

### Spacing & Layout

- **Container**: `max-w-7xl mx-auto` for main content
- **Grid**: `grid-cols-1 xl:grid-cols-2` for two-column layout
- **Padding**: `p-4 md:p-8` for responsive spacing
- **Gaps**: `gap-4`, `gap-8` for consistent spacing

### Interactive Elements

- **Hover effects**: `hover:bg-slate-800/60`, `hover:-translate-y-1`
- **Focus states**: `focus:border-blue-400`, `focus:ring-4`
- **Transitions**: `transition-all`, `transition-colors`
- **Cursors**: `cursor-pointer` for interactive elements

## File Structure

### Components (Tailwind-styled)

- **`components/item-search-client.tsx`** - Main component with full Tailwind layout
- **`components/item-search.tsx`** - Custom search with Tailwind dropdown
- **`components/recipe-tree.tsx`** - Interactive tree with Tailwind animations
- **`components/base-requirements-list.tsx`** - Material grid with Tailwind cards
- **`components/item-image.tsx`** - Item images with Tailwind styling

### Utilities (unchanged)

- **`lib/types.ts`** - TypeScript type definitions
- **`lib/constants.ts`** - Application constants
- **`lib/utils.ts`** - General utility functions
- **`lib/recipe-utils.ts`** - Recipe-specific functions

## Key Tailwind Features Used

### Layout

- **CSS Grid**: `grid`, `grid-cols-*` for responsive layouts
- **Flexbox**: `flex`, `items-center`, `justify-between`
- **Responsive**: `md:`, `lg:`, `xl:` prefixes for breakpoints

### Styling

- **Background**: `bg-gradient-to-*`, `bg-slate-*` with opacity
- **Borders**: `border`, `border-*`, `rounded-*`
- **Typography**: `text-*`, `font-*` for hierarchy
- **Spacing**: `p-*`, `m-*`, `gap-*` for consistent spacing

### Effects

- **Shadows**: `shadow-*` for depth (used sparingly)
- **Blur**: `backdrop-blur-sm` for glassmorphism
- **Transforms**: `translate-*`, `scale-*` for interactions
- **Transitions**: `transition-*` for smooth animations

## Usage

The calculator now uses pure Tailwind CSS with no custom CSS files, making it fully compatible with shadcn/ui and Tailwind's design system:

```tsx
import { ItemSearchClient } from "@/components/item-search-client";

export default function Page() {
  return <ItemSearchClient />;
}
```

All styling is done through Tailwind utility classes, making the codebase more maintainable and consistent with modern React + Tailwind practices.
