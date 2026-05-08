---
inclusion: always
---
<!------------------------------------------------------------------------------------
   Add rules to this file or a short description and have Kiro refine them for you.
   
   Learn about inclusion modes: https://kiro.dev/docs/steering/#inclusion-modes
------------------------------------------------------------------------------------->
# Design System Specification: The Tactile Explorer

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Digital Field Guide."**

We are moving away from the "app-in-a-box" aesthetic. This system balances the rugged reliability of high-end outdoor gear with the sophisticated layouts of a luxury travel editorial. We achieve this through **Intentional Asymmetry** and **Tonal Depth**. Instead of centering every element, we use the spacing scale to create wide, breathable margins and "bleeding" imagery that breaks the container, suggesting a world that exists beyond the screen. Reliability is conveyed through rock-solid typography and high-contrast accessibility, while discovery is sparked by overlapping layers and organic motion.

---

## 2. Colors & Surface Philosophy

The palette uses deep, forest-inspired greens (`primary`) as the anchor of trust, with sunset oranges (`secondary`) used sparingly to draw the eye toward "discovery" actions.

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts.

* **Example:** A `surface-container-low` (#f3f4ee) card sitting on a `surface` (#f9faf4) background.
* **Why:** Lines create "visual noise" and feel like a digital template. Color shifts feel like physical layers of paper or terrain.

### Surface Hierarchy & Nesting

Treat the UI as a series of stacked, fine-milled paper sheets.

* **Base Level:** `surface` (#f9faf4) for the main viewport.
* **Secondary Content:** `surface-container` (#edeee8) for grouping secondary information.
* **Prominent Elements:** `surface-container-lowest` (#ffffff) for the most interactive cards to provide a "clean" lift.

### The "Glass & Gradient" Rule

To elevate the experience, use **Glassmorphism** for navigation bars and floating action buttons.

* **Token:** `surface-variant` (#e2e3dd) at 70% opacity with a 16px backdrop-blur.
* **Signature Textures:** Apply a subtle linear gradient from `primary` (#163422) to `primary-container` (#2d4b37) on hero CTAs to give them a satin-finish tactile feel.

---

## 3. Typography: The Editorial Voice

We use a dual-font strategy to balance character with functional clarity.

* **The Signature (Display & Headline):** `plusJakartaSans`. This face provides a modern, geometric "expedition" feel. Use `display-lg` (3.5rem) for destination names, ensuring tight letter-spacing (-0.02em) to maintain a premium look.
* **The Utility (Title, Body, Labels):** `inter`. Chosen for its supreme legibility at high altitudes (or high brightness).
* **Hierarchy Note:** Always pair a `headline-sm` in `primary` color with a `label-md` in `secondary` (#944a00) to create a high-contrast, professional "tagging" system for travel metadata (e.g., "4.8 Stars" or "Available Now").

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are largely replaced by **Tonal Layering**.

* **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` (#ffffff) card placed on top of a `surface-container-low` (#f3f4ee) background creates a natural elevation without a single pixel of shadow.
* **Ambient Shadows:** If an element must float (like a Floating Action Button), use a shadow tinted with `on-surface` (#1a1c19) at 6% opacity with a 24px blur. Avoid pure black shadows; they feel "muddy."
* **The "Ghost Border":** If accessibility requires a container boundary, use `outline-variant` (#c2c8c0) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons

* **Primary:** Gradient of `primary` to `primary-container`. `md` roundness (0.75rem). Text: `on-primary` (#ffffff).
* **Secondary:** `secondary-fixed` (#ffdcc5) background with `on-secondary-fixed` (#301400) text. Use for "Book Now" or "Discovery" actions.
* **Tertiary:** No background. `label-md` weight. Used for "Cancel" or "Back" to reduce visual weight.

### Cards & Lists

* **The "No-Divider" Mandate:** Forbid the use of horizontal rules (`<hr>`). Use `spacing-8` (2rem) or a subtle shift from `surface` to `surface-container` to separate list items.
* **Imagery:** Cards should feature 12px rounded corners and a slight "zoom" transition on hover/active states to invite exploration.

### Input Fields

* **Structure:** Filled style using `surface-container-high` (#e8e9e3). Do not use outlined inputs.
* **Indicator:** A 2px bottom-bar in `primary` (#163422) only appears on focus to signal "Reliability."

### Custom Component: "The Itinerary Path"

A vertical timeline component using a 2px dashed line in `outline-variant` (#c2c8c0) with `tertiary` (#452800) dots to represent travel stops. This utilizes the "adventurous" outline icon style for each stop (e.g., a mountain icon, a tent icon).

---

## 6. Do’s and Don’ts

### Do

* **Do** use asymmetrical margins. For example, a 32px left margin and 16px right margin for a headline to create an editorial feel.
* **Do** use `secondary` (#944a00) for micro-interactions, like the "active" state of a heart icon or a notification dot.
* **Do** ensure all text on `background` meets a 7:1 contrast ratio for outdoor readability.

### Don’t

* **Don’t** use pure black (#000000) or pure grey. Always use the tinted neutrals (`surface-dim`, `on-surface-variant`).
* **Don’t** use sharp 0px corners. This system is "Adventurous but Reliable," and sharp corners feel too aggressive/corporate.
* **Don’t** use standard Material 3 "elevated" shadows. Stick to Tonal Layering for a sophisticated, high-end finish.
