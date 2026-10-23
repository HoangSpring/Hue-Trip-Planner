---
name: Hue Imperial Editorial
colors:
  surface: '#fdf9f1'
  surface-dim: '#dddad2'
  surface-bright: '#fdf9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3eb'
  surface-container: '#f1ede6'
  surface-container-high: '#ece8e0'
  surface-container-highest: '#e6e2da'
  on-surface: '#1c1c17'
  on-surface-variant: '#4a4550'
  inverse-surface: '#31302b'
  inverse-on-surface: '#f4f0e8'
  outline: '#7b7481'
  outline-variant: '#ccc3d2'
  surface-tint: '#6e4da0'
  primary: '#432173'
  on-primary: '#ffffff'
  primary-container: '#5b3a8c'
  on-primary-container: '#ceadff'
  inverse-primary: '#d6baff'
  secondary: '#286958'
  on-secondary: '#ffffff'
  secondary-container: '#aef0da'
  on-secondary-container: '#2f6f5e'
  tertiary: '#483000'
  on-tertiary: '#ffffff'
  tertiary-container: '#664500'
  on-tertiary-container: '#e8b358'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ecdcff'
  primary-fixed-dim: '#d6baff'
  on-primary-fixed: '#280056'
  on-primary-fixed-variant: '#563587'
  secondary-fixed: '#aef0da'
  secondary-fixed-dim: '#93d3bf'
  on-secondary-fixed: '#002019'
  on-secondary-fixed-variant: '#055141'
  tertiary-fixed: '#ffdead'
  tertiary-fixed-dim: '#f4bd61'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#fdf9f1'
  on-background: '#1c1c17'
  surface-variant: '#e6e2da'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies the regal serenity and cultural cadence of Hue, Vietnam. Tailored for discerning travelers seeking bespoke, unhurried cultural immersion, the aesthetic synthesizes editorial travel journalism with classical Vietnamese heritage. 

The visual language draws directly from the Imperial Citadel, court textiles, and Perfume River mist:
- **Style Archetype:** Editorial Warmth meets Heritage Modernism.
- **Atmosphere:** Poetic, contemplative, trustworthy, and generous in whitespace. Layouts feel like a bound art catalog or a high-end bespoke travel journal rather than a sterile transactional booking engine.
- **Emotional Signature:** Dignified hospitality, unhurried discovery, and authentic imperial elegance.

## Colors

The palette directly references the court colors and historic natural dyes of Hue. Surfaces move away from stark synthetic whites, opting for an unbleached linen and ivory tactile ground.

### Palette Architecture
- **Primary (`#5B3A8C` - Royal Violet):** Evoking the royal áo dài and traditional twilight ceremonies. Used for key call-to-actions, active navigation highlights, and core architectural anchors. Interactive hover: `#4A2E75`. Tint container: `#EFE9F7`.
- **Secondary (`#2F6F5E` - Jade Green):** Echoing moss-covered tomb tiles and the flora of garden houses. Used for confirmed itineraries, sustainability tags, ecological milestones, and semantic success. Tint container: `#E3F1EC`.
- **Tertiary (`#C8963E` - Imperial Gold):** Derived from royal lacquerware and gilded palace rafters. Applied deliberately for featured curator selections, VIP tags, and special historical badges. Tint container: `#F8EEDB`.
- **Neutral Canvas (`#FAF6EE` - Warm Ivory):** The atmospheric canvas tone representing archival parchment.
- **Surface (`#FFFFFF` - Pure Card Surface):** Delivers clean contrast against the ivory background without jarring clinical blues.
- **Typography & Details:**
  - Ink (`#1F1A24`): Softened soot-black ensuring maximum contrast with antique warmth.
  - Muted Plum-Grey (`#6B6475`): Secondary body, timestamps, and captioning.
  - Border/Filigree Line (`#E7E0D3`): Delicate, parchment-matched dividers.

## Typography

The typography pairing reconciles classical Vietnamese literature with modern legibility:
- **Headlines (Source Serif 4):** A graceful, bookish serif displaying exquisite proportions in both Latin and tone-marked Vietnamese text. It anchors editorial itineraries, historical monuments, and narrative headers.
- **Body & Interface (Be Vietnam Pro):** Chosen specifically for its native, pristine handling of complex Vietnamese diacritics without clipped vertical bounds. It maintains crisp legibility across compact schedule cards, map legends, and utility controls.

### Implementation Principles
- Maintain generous line-heights (minimum 1.5x on long-form body text) to accommodate upward and downward Vietnamese tonal marks without visual crowding.
- For dates, times, and imperial era timestamps, use `label-md` with slight positive tracking to evoke historical register indexes.

## Layout & Spacing

The layout philosophy follows a calm, structured editorial grid with comfortable breathing room. Content is framed as chapters and visual spreads rather than dense utility dashboards.

### Grid & Breakpoints
- **Mobile (< 768px):** 4-column fluid layout, `margin: 1rem`, `gutter: 1rem`. Bottom safe-area padding includes compensation for the docked navigation bar (88px baseline clearance).
- **Tablet (768px – 1024px):** 8-column grid, `margin-tablet: 2rem`, `gutter: 1.5rem`. Suitable for side-by-side timeline/map views.
- **Desktop (> 1024px):** 12-column constrained fluid grid (maximum content width `1200px`), centered, `margin-desktop: 3rem`. Itineraries split into an editorial narrative rail on the left and an interactive cartographic/detail panel on the right.

### Vertical Rhythm
- Use `space-xl` (2.5rem) between distinct editorial segments (e.g., transitioning from "Morning in the Citadel" to "Afternoon Along the Perfume River").
- Card interior padding is consistently locked to `space-md` (1rem) on mobile and `space-lg` (1.5rem) on tablet/desktop.

## Elevation & Depth

This system avoids aggressive artificial dropshadows and heavy dark casting. Visual hierarchy is mediated through warm paper layering, tonal tints, and soft natural diffusion.

- **Canvas to Surface:** The base canvas is `#FAF6EE` (Warm Ivory). Cards sit atop this field using solid `#FFFFFF` with a barely perceptible hairline border (`1px solid #E7E0D3`) and an ink-tinted ambient shadow: `0 2px 8px rgba(31, 26, 36, 0.06)`.
- **Interactive Hover & Popover:** On active cards or itinerary drags, the element rises slightly with `box-shadow: 0 8px 24px rgba(31, 26, 36, 0.10)`.
- **Modal / Floating Sheets:** Overlays use a warm dimming wash (`rgba(31, 26, 36, 0.45)`) paired with rounded bottom sheets carrying a subtle highlight border at the apex.

## Shapes

The shape hierarchy is organic, tactile, and rounded, balancing contemporary ergonomics with the curvature found in royal Hue pavilion archways.

- **Cards & Modal Containers:** Fixed to `16px` (`rounded-lg`), creating an approachable, polished surface.
- **Primary & Secondary Buttons:** Formed with `12px` radius for a balanced, grounded button structure.
- **Chips, Pills, & Status Badges:** Fully rounded (`9999px`) to maintain contrast against structural rectangles.
- **Interactive Thumbnails:** Clipped at `12px` to harmoniously mirror card corners.

## Components

### Buttons
- **Primary ("Tạo lịch trình" / Core actions):** Solid Hue Purple background (`#5B3A8C`), text `#FFFFFF`, radius `12px`, padding `12px 24px`. Hover state transitions to `#4A2E75`.
- **Secondary (Detail exploration, filtering):** Warm Ivory border `1.5px solid #5B3A8C`, text `#5B3A8C`, background transparent or `#EFE9F7`.
- **Accent Action (Gilded highlights / booking specials):** Background `#C8963E`, text `#FFFFFF`.

### Chips & Tags
- Fully rounded pills (`height: 32px`, `padding: 0 16px`).
- Category filters (e.g., "Lăng tẩm", "Ẩm thực", "Nhã nhạc"): Unselected state uses `#FFFFFF` background with `#E7E0D3` border and `#1F1A24` text. Selected state switches to `#5B3A8C` background with `#FFFFFF` text.

### Cards (Itinerary & Monument Cards)
- Background `#FFFFFF`, radius `16px`, border `1px solid #E7E0D3`, shadow `0 2px 8px rgba(31, 26, 36, 0.06)`.
- Includes photo aspect ratio `16:9` or `4:3` with subtle gradient overlay at bottom edge. Titles are styled in `Source Serif 4` (`headline-sm`), accompanied by travel duration chips and walking distance tags.

### Lists & Timeline Track
- Itinerary timelines feature a continuous vertical filigree line in `#E7E0D3` with hollow circular timeline nodes in `#C8963E` (Imperial Gold) for major stops, and `#2F6F5E` (Jade Green) for resting/dining interludes.

### Form Inputs & Selectors
- Background `#FFFFFF`, border `1px solid #E7E0D3`, radius `12px`, padding `14px 16px`. Active focus state switches border to `#5B3A8C` with a `0 0 0 3px #EFE9F7` halo. Labels use `label-md` in `#1F1A24`.

### Navigation: Mobile Bottom Tab Bar
- **Structure:** 5-item fixed bottom navigation dock. Background `#FFFFFF` with top border `1px solid #E7E0D3`, elevated with ambient shadow `0 -4px 16px rgba(31, 26, 36, 0.05)`.
- **Standard Tabs:**
  1. *Trang chủ* (Home)
  2. *Khám phá* (Explore)
  4. *Bản đồ* (Map)
  5. *Tôi* (Profile)
  Standard tabs use 22px icon + `label-sm` (11px). Default state `#6B6475`; active state `#5B3A8C`.
- **Prominent Center Action (*Tạo lịch trình*):**
  - Raised circular button (`56px x 56px`), protruding 16px above the top border line.
  - Background is primary royal violet `#5B3A8C` (or subtle gradient to `#4A2E75`), encased in a `4px` ring matching the `#FAF6EE` canvas.
  - Icon in bright white (`#FFFFFF`) featuring a plus-schedule or imperial scroll icon, flanked with an underneath micro-label "Tạo lịch trình" in `#5B3A8C` font weight 600.