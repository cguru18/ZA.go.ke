---
name: Cyber-Architectural Blueprint
colors:
  surface: '#111316'
  surface-dim: '#111316'
  surface-bright: '#37393c'
  surface-container-lowest: '#0c0e11'
  surface-container-low: '#1a1c1f'
  surface-container: '#1e2023'
  surface-container-high: '#282a2d'
  surface-container-highest: '#333538'
  on-surface: '#e2e2e6'
  on-surface-variant: '#bbcac3'
  inverse-surface: '#e2e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#85948e'
  outline-variant: '#3c4a45'
  surface-tint: '#4dddb9'
  primary: '#4fdebb'
  on-primary: '#00382c'
  primary-container: '#25c2a0'
  on-primary-container: '#004a3b'
  inverse-primary: '#006b57'
  secondary: '#bdf4ff'
  on-secondary: '#00363d'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#ffbc47'
  on-tertiary: '#432c00'
  tertiary-container: '#e59f00'
  on-tertiary-container: '#583b00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6efad5'
  primary-fixed-dim: '#4dddb9'
  on-primary-fixed: '#002019'
  on-primary-fixed-variant: '#005141'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#ffdeae'
  tertiary-fixed-dim: '#ffba3f'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#604100'
  background: '#111316'
  on-background: '#e2e2e6'
  surface-variant: '#333538'
  background-deep: '#0C0D0E'
  surface-slate: '#24282D'
  secure-emerald: '#25C2A0'
  active-cyan: '#00E5FF'
  warning-amber: '#FFB100'
  border-glass: rgba(255, 255, 255, 0.1)
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code-xs:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1600px
---

## Brand & Style
The design system is engineered for high-trust technical environments, specifically for the visualization of complex system architectures and security indices. The aesthetic, "Technical & Secure Dashboard," prioritizes data density without sacrificing clarity, evoking the feeling of a real-time command center.

The style is a hybrid of **Corporate Modern** and **Glassmorphism**, utilizing translucent layers to maintain context across deep navigational hierarchies. Subtle glowing accents and vector-like precision represent the "blueprint" nature of the product, communicating authority, security, and enterprise-grade reliability.

## Colors
The palette is rooted in a deep-space monochromatic base to minimize eye strain during long-form technical analysis.

- **Primary (Emerald):** Used for "Secure" states, active system nodes, and successful health checks.
- **Secondary (Cyan):** Reserved for interactive elements, highlights, and real-time data streams.
- **Tertiary (Amber):** Specific to technical warnings, pending states, and architectural notes.
- **Neutral:** A range of slates and charcoals provide the structural foundation. 

The interface utilizes high-contrast ratios for all technical IDs and status indicators to ensure maximum readability against the dark backdrop.

## Typography
This design system employs a dual-font strategy. **Inter** provides a highly legible, neutral foundation for administrative controls and descriptive body text. **JetBrains Mono** is utilized for all technical identifiers, file paths, IP addresses, and architecture nodes, signaling to the user that the data is "raw" or "system-generated."

Headlines are tight and bold to establish clear section hierarchy, while small uppercase labels are used for metadata headers to maximize vertical space in dense dashboard views.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a strictly enforced 4px baseline shift. 

- **Desktop:** 12-column grid with 16px gutters. Sidebars are fixed at 280px to accommodate deep tree-view navigation.
- **Tablet:** 8-column grid. Sidebars collapse into icons.
- **Mobile:** 4-column grid with a simplified 16px margin.

Spacing is tight to accommodate the "data-dense" requirement. Use `12px` (3 units) for internal card padding and `24px` (6 units) for section separation.

## Elevation & Depth
Depth is communicated through **Glassmorphism** and **Tonal Layering** rather than traditional shadows.

1.  **Level 0 (Base):** Deep Charcoal (#0C0D0E).
2.  **Level 1 (Cards/Panels):** Semi-transparent Slate with a 12px backdrop blur and a 1px `border-glass` outline.
3.  **Level 2 (Modals/Popovers):** Higher opacity fills with a subtle cyan outer glow (2px blur, 10% opacity) to indicate "Active" focus.

Relationship lines in architecture maps should be 1px wide, using low-opacity secondary colors to show connections without cluttering the view.

## Shapes
The shape language is "Soft-Technical." Elements use a 4px (`rounded-sm`) radius to maintain a precise, engineered feel. 

- **Input Fields & Buttons:** 4px radius.
- **Data Containers:** 8px (`rounded-lg`) radius.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Connectors:** Architecture lines should use 90-degree angles with a small 2px corner radius for a "circuit board" aesthetic.

## Components
- **Buttons:** Primary buttons use a solid Emerald fill with black text. Secondary buttons use a ghost style with a Cyan border and glow on hover.
- **System Nodes:** Cards that represent architecture components should feature a "Status Bar" at the top (2px thick) using Primary, Secondary, or Tertiary colors to show health at a glance.
- **Technical Inputs:** Text fields should use the Monospace font. The active state is indicated by a 1px Cyan border and a subtle inner glow.
- **Chips/Status Labels:** Compact, using `label-caps` typography. They should have a 10% opacity background of their respective status color (e.g., Warning Amber at 10% for "Pending").
- **Architecture Maps:** Use thin vector lines with animated "data pulses" (small dots moving along the line) to indicate active traffic between nodes.
- **Data Tables:** Zebra-striping is avoided; instead, use 1px horizontal dividers in `border-glass` color to maintain the glass aesthetic.