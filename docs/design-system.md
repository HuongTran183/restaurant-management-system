# Restaurant Management System - Design System

## Overview

This document defines the design tokens and component standards for consistent UI across the application.

---

## Colors

### Primary Palette

| Name | Value | Usage |
|------|-------|-------|
| `forest` | `#254640` | Primary actions, success states, interactive elements |
| `ember` | `#cc653f` | Alerts, errors, destructive actions |
| `sun` | `#f1c66d` | Warnings, highlights, accents |
| `slate` | `#3f4f5b` | Secondary text, muted content |
| `ink` | `#16211d` | Primary text, headings |
| `cream` | `#f5eee3` | Background, surfaces |

### Usage Examples

```tsx
// Primary button
className="bg-forest text-cream"

// Error message
className="text-ember"

// Warning badge
className="bg-sun/20 text-ink"

// Secondary text
className="text-slate"

// Background
className="bg-cream"
```

---

## Typography

### Font Families

| Name | Font | Usage |
|------|------|-------|
| `font-display` | Fraunces | Headings, hero text |
| `font-body` | Space Grotesk | Body text, UI elements |

### Text Hierarchy

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.heading-1` | 4xl (36px) | Bold | Page titles |
| `.heading-2` | xl (20px) | Semibold | Section titles |
| `.heading-3` | lg (18px) | Semibold | Subsection titles |
| `.heading-4` | base (16px) | Semibold | Card titles |
| `.label-text` | xs (12px) | Bold, uppercase | Form labels |
| `.body-text` | sm (14px) | Normal | Default body |
| `.body-text-lg` | base (16px) | Normal | Large body |

---

## Spacing

### Scale

| Token | Value | Usage |
|-------|-------|-------|
| `gap-2` | 0.5rem (8px) | Tight spacing |
| `gap-3` | 0.75rem (12px) | Default list items |
| `gap-4` | 1rem (16px) | Form fields |
| `gap-6` | 1.5rem (24px) | Sections |
| `gap-8` | 2rem (32px) | Major sections |

### Utility Classes

```css
.form-spacing    /* space-y-4 - Between form fields */
.list-spacing    /* space-y-3 - Between list items */
.section-spacing /* space-y-6 - Between sections */
.panel-padding   /* px-6 py-8 - Inside panels */
.grid-gap        /* gap-4 - Grid gaps */
```

---

## Components

### Buttons

| Class | Style | Usage |
|-------|-------|-------|
| `.button-primary` | Forest bg, cream text | Primary actions |
| `.button-secondary` | White bg, ink text, border | Secondary actions |
| `.button-danger` | Ember bg, cream text | Destructive actions |
| `.button-ghost` | Transparent bg | Tertiary actions |
| `.button-link` | Text only, underline on hover | Inline links |
| `.button-chip` | Small, uppercase | Filters, tags |
| `.button-chip-primary` | Chip with forest bg | Active filters |
| `.button-icon` | Circle, icon only | Icon buttons |

### Form Fields

| Class | Usage |
|-------|-------|
| `.field` | Standard text input |
| `.dish-field` | Input with cream background |
| `.field-error` | Error state modifier |
| `.textarea-field` | Multi-line input |

### Panels & Cards

| Class | Usage |
|-------|-------|
| `.panel` | Large container with blur |
| `.panel-solid` | Solid white container |
| `.card` | Small content card |
| `.data-row` | List item row |
| `.data-row-clickable` | Interactive row |

### Badges

| Class | Usage |
|-------|-------|
| `.badge-success` | Forest/green tone |
| `.badge-warning` | Sun/yellow tone |
| `.badge-danger` | Ember/red tone |
| `.badge-neutral` | Slate/gray tone |

### States

| Class | Usage |
|-------|-------|
| `.empty-state` | No data message |
| `.loading-spinner` | Loading indicator |

---

## Border Radius

| Value | Usage |
|-------|-------|
| `rounded-[18px]` | Input fields |
| `rounded-[22px]` | Cards, data rows |
| `rounded-[28px]` | Large panels |
| `rounded-[34px]` | Main panels |
| `rounded-full` | Buttons, badges |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-float` | Heavy shadow | Cards, panels |
| `shadow-md` | Medium shadow | Dropdowns |

---

## Transitions

All interactive elements should use:
```css
transition hover:-translate-y-0.5
```

This provides a subtle lift effect on hover.

---

## Icons

Use Material Symbols Outlined:

```tsx
<span className="material-symbols-outlined">icon_name</span>
```

With fill:
```tsx
<span className="material-symbols-outlined fill-icon">icon_name</span>
```

---

## Best Practices

1. **Never use hardcoded colors** - Always use theme colors (forest, ember, etc.)
2. **Use semantic classes** - `.button-primary` instead of custom styles
3. **Consistent spacing** - Use spacing utility classes
4. **Typography hierarchy** - Use heading classes for semantic meaning
5. **Accessible contrast** - Ensure 4.5:1 ratio for text

---

## Migration Guide

### From Hardcoded Colors

| Old | New |
|-----|-----|
| `bg-[#271310]` | `bg-forest` or `bg-ink` |
| `bg-[#fbf9f5]` | `bg-cream` |
| `text-stone-800` | `text-ink` |
| `ring-[#735c00]` | `ring-sun` |
| `amber-*` | `sun` equivalent |
| `stone-*` | `slate` equivalent |

### From Custom Fonts

| Old | New |
|-----|-----|
| `font-['Noto_Serif']` | `font-display` |
| `font-['Manrope']` | `font-body` |
