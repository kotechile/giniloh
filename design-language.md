# Design Language: Betterment | Automated investing & Financial planning

> Extracted from `https://www.betterment.com` on May 2, 2026
> 1949 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#1d6ae5` | rgb(29, 106, 229) | hsl(217, 79%, 51%) | 178 |
| Secondary | `#ffc729` | rgb(255, 199, 41) | hsl(44, 100%, 58%) | 6 |
| Accent | `#f9f0e2` | rgb(249, 240, 226) | hsl(37, 66%, 93%) | 8 |

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#212121` | hsl(0, 0%, 13%) | 1439 |
| `#ffffff` | hsl(0, 0%, 100%) | 1343 |
| `#000000` | hsl(0, 0%, 0%) | 351 |
| `#5c5c5c` | hsl(0, 0%, 36%) | 126 |
| `#f5f5f5` | hsl(0, 0%, 96%) | 16 |
| `#c7c7c7` | hsl(0, 0%, 78%) | 7 |
| `#a8a8a8` | hsl(0, 0%, 66%) | 1 |

### Background Colors

Used on large-area elements: `#f5f5f5`, `#ffffff`, `#000000`, `#000b50`, `#f9f0e2`, `#ffc729`, `#1d6ae5`

### Text Colors

Text color palette: `#000000`, `#212121`, `#1d6ae5`, `#ffffff`, `#5c5c5c`, `#21494e`, `#000b50`, `#cccccc`

### Gradients

```css
background-image: linear-gradient(rgb(29, 106, 229), rgb(0, 11, 80));
```

```css
background-image: linear-gradient(rgb(29, 106, 229), rgb(249, 240, 226));
```

```css
background-image: linear-gradient(rgb(249, 240, 226) 3.27%, rgb(87, 144, 235) 51.75%, rgb(29, 106, 229) 99.91%), none;
```

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#212121` | text, border, background | 1439 |
| `#ffffff` | background, text, border | 1343 |
| `#000b50` | text, border, background | 450 |
| `#000000` | text, border, background | 351 |
| `#1d6ae5` | text, border, background | 178 |
| `#5c5c5c` | text, border | 126 |
| `#f5f5f5` | background | 16 |
| `#f9f0e2` | background | 8 |
| `#c7c7c7` | border, text, background | 7 |
| `#ffc729` | background | 6 |
| `#21494e` | text, border, background | 5 |
| `#bdedeb` | background | 2 |
| `#a8a8a8` | border | 1 |

## Typography

### Font Families

- **GT America** — used for all (1685 elements)
- **Times** — used for body (172 elements)
- **Arial** — used for all (53 elements)
- **Season Mix** — used for all (36 elements)
- **GT America Black** — used for body (3 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 72px | 4.5rem | 500 | 72px | normal | h1, br |
| 44px | 2.75rem | 500 | 48.4px | normal | h2, span, br |
| 32px | 2rem | 500 | 38.4px | normal | h2, span, h3 |
| 24px | 1.5rem | 500 | 32.4px | normal | h4 |
| 22px | 1.375rem | 400 | 29.7px | normal | h5, strong |
| 20px | 1.25rem | 700 | 30px | -0.2px | h3 |
| 18px | 1.125rem | 400 | 24.3px | normal | button, svg, title, path |
| 16px | 1rem | 400 | 24px | normal | body, div, noscript, a |
| 15px | 0.9375rem | 500 | 20.25px | normal | h2 |
| 14px | 0.875rem | 400 | 16.1px | normal | img, div, p, a |
| 12px | 0.75rem | 400 | 21px | normal | div, span, p, br |
| 11px | 0.6875rem | 700 | 16.5px | normal | a |
| 10px | 0.625rem | 400 | 11.5px | normal | html, head, style, script |

### Heading Scale

```css
h1 { font-size: 72px; font-weight: 500; line-height: 72px; }
h2 { font-size: 44px; font-weight: 500; line-height: 48.4px; }
h2 { font-size: 32px; font-weight: 500; line-height: 38.4px; }
h4 { font-size: 24px; font-weight: 500; line-height: 32.4px; }
h5 { font-size: 22px; font-weight: 400; line-height: 29.7px; }
h3 { font-size: 20px; font-weight: 700; line-height: 30px; }
h2 { font-size: 15px; font-weight: 500; line-height: 20.25px; }
```

### Body Text

```css
body { font-size: 16px; font-weight: 400; line-height: 24px; }
```

### Font Weights in Use

`400` (1802x), `500` (100x), `700` (38x), `600` (9x)

## Spacing

**Base unit:** 2px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-0 | 0px | 0rem |
| spacing-24 | 24px | 1.5rem |
| spacing-36 | 36px | 2.25rem |
| spacing-40 | 40px | 2.5rem |
| spacing-46 | 46px | 2.875rem |
| spacing-56 | 56px | 3.5rem |
| spacing-64 | 64px | 4rem |
| spacing-70 | 70px | 4.375rem |
| spacing-80 | 80px | 5rem |
| spacing-96 | 96px | 6rem |
| spacing-152 | 152px | 9.5rem |
| spacing-160 | 160px | 10rem |
| spacing-200 | 200px | 12.5rem |
| spacing-216 | 216px | 13.5rem |
| spacing-340 | 340px | 21.25rem |
| spacing-381 | 381px | 23.8125rem |
| spacing-400 | 400px | 25rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| sm | 3px | 17 |
| md | 6px | 3 |
| lg | 12px | 11 |
| lg | 16px | 1 |
| xl | 20px | 9 |
| xl | 24px | 1 |
| full | 42px | 2 |

## Box Shadows

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(7, 26, 36, 0.24) 0px 3px 10px 1px;
```

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px;
```

**sm (inset)** — blur: 1.5px
```css
box-shadow: rgba(0, 11, 80, 0.25) -1.5px -1.5px 1.5px 0px inset, rgb(255, 255, 255) 1.5px 1.5px 1.5px 0px inset, rgba(0, 11, 80, 0.1) 6px 6px 0px 0px;
```

**sm** — blur: 0px
```css
box-shadow: rgb(143, 143, 143) 0px 4px 0px 0px;
```

**sm (inset)** — blur: 1.7px
```css
box-shadow: rgb(255, 255, 255) 1.7px 1.7px 1.7px 0px inset;
```

**sm** — blur: 8px
```css
box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 8px 0px;
```

**md (inset)** — blur: 0px
```css
box-shadow: rgba(0, 11, 80, 0.2) 10.244px 10.244px 0px 0px, rgba(0, 0, 0, 0.25) -1.707px -1.707px 1.707px 0px inset, rgb(255, 255, 255) 1.707px 1.707px 1.707px 0px inset;
```

**md** — blur: 15px
```css
box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 15px 0px;
```

## CSS Custom Properties

### Colors

```css
--btm-card-bg: rgba(245, 245, 245, 0.7);
--btm-card-text: var(--bt-navy);
--btm-card-radius: 20px;
--btm-card-pad: 16px;
--btm-card-shadow: 10.244px 10.244px 0 0 rgba(0, 11, 80, 0.20), -1.707px -1.707px 1.707px 0 rgba(0, 0, 0, 0.25) inset, 1.707px 1.707px 1.707px 0 #FFF inset;
--btm-card-gap: 16px;
--k-banner-buttons-primary-cornerRadius: 3px;
--k-banner-buttons-primary-background-color: rgba(29, 106, 229, 1);
--k-banner-buttons-primary-text-color: rgba(255, 255, 255, 1);
--k-banner-buttons-secondary-cornerRadius: 3px;
--k-banner-buttons-secondary-background-color: rgba(29, 106, 229, 1);
--k-banner-buttons-secondary-text-color: rgba(255, 255, 255, 1);
--k-banner-buttons-tertiary-background-color: rgba(29, 106, 229, 1);
--k-banner-buttons-tertiary-text-color: rgba(255, 255, 255, 1);
--k-banner-container-backdrop-background-color: rgba(0, 0, 0, 0.24);
--k-banner-container-background-color: rgba(255, 255, 255, 1);
--k-banner-description-link-color: rgba(29, 106, 229, 1);
--k-banner-description-text-color: rgba(33, 33, 33, 1);
--k-banner-header-returnButton-background-color: rgba(255, 255, 255, 1);
--k-banner-header-returnButton-icon-color: rgba(33, 33, 33, 1);
--k-banner-header-title-color: rgba(33, 33, 33, 1);
--k-banner-gpcBanner-fill-color: rgba(235, 237, 237, 1);
--k-banner-gpcBanner-outline-color: rgba(235, 237, 237, 1);
--k-banner-gpcBanner-title-text-color: rgba(0, 0, 0, 1);
--k-banner-gpcBanner-description-text-color: rgba(0, 0, 0, 1);
--k-modal-container-backdrop-background-color: rgba(0, 0, 0, 0.24);
--k-modal-container-background-color: rgba(255, 255, 255, 1);
--k-modal-description-link-color: rgba(33, 33, 33, 1);
--k-modal-description-text-color: rgba(33, 33, 33, 1);
--k-modal-description-title-color: rgba(33, 33, 33, 1);
--k-modal-footer-actionButton-background-color: rgba(29, 106, 229, 1);
--k-modal-footer-actionButton-text-color: rgba(255, 255, 255, 1);
--k-modal-footer-background-color: rgba(255, 255, 255, 1);
--k-modal-header-background-color: rgba(255, 255, 255, 1);
--k-modal-header-returnButton-background-color: rgba(255, 255, 255, 1);
--k-modal-header-returnButton-icon-color: rgba(33, 33, 33, 1);
--k-modal-header-title-color: rgba(33, 33, 33, 1);
--k-modal-gpcBanner-fill-color: rgba(235, 237, 237, 1);
--k-modal-gpcBanner-outline-color: rgba(235, 237, 237, 1);
--k-modal-gpcBanner-title-text-color: rgba(0, 0, 0, 1);
--k-modal-gpcBanner-description-text-color: rgba(0, 0, 0, 1);
--k-modal-purposeList-purposeListItems-purposeContent-color: rgba(33, 33, 33, 1);
--k-modal-purposeList-purposeListItems-purposeFill-color: rgba(255, 255, 255, 1);
--k-modal-purposeList-purposeListItems-purposeOutline-color: rgba(33, 33, 33, 1);
--k-modal-purposeList-purposeListItems-arrowIcon-color: rgba(33, 33, 33, 1);
--k-modal-purposeList-purposeListItems-purposeLinks-color: rgba(33, 33, 33, 1);
--k-modal-purposeList-switchButtons-off-text-color: rgba(33, 33, 33, 1);
--k-modal-purposeList-switchButtons-on-background-color: rgba(29, 106, 229, 1);
--k-modal-purposeList-switchButtons-off-background-color: rgba(163, 163, 163, 1);
--k-modal-purposeList-switchButtons-on-text-color: rgba(33, 33, 33, 1);
--k-modal-purposeListHeader-acceptAllButton-background-color: rgba(29, 106, 229, 1);
--k-modal-purposeListHeader-acceptAllButton-text-color: rgba(255, 255, 255, 1);
--k-modal-purposeListHeader-rejectAllButton-background-color: rgba(29, 106, 229, 1);
--k-modal-purposeListHeader-rejectAllButton-text-color: rgba(255, 255, 255, 1);
--k-modal-purposeListHeader-title-color: rgba(33, 33, 33, 1);
--k-preference-container-background-color: rgba(255, 255, 255, 1);
--k-preference-exitButton-background-color: rgba(255, 255, 255, 1);
--k-preference-exitButton-text-color: rgba(29, 106, 229, 1);
--k-preference-exitButton-iconColor-color: rgba(0, 0, 0, 1);
--k-preference-header-background-color: rgba(255, 255, 255, 1);
--k-preference-header-title-color: rgba(7, 26, 36, 1);
--k-preference-navigation-layout-background-color: rgba(255, 255, 255, 1);
--k-preference-navigation-layout-item-selectedBackground-color: rgba(255, 255, 255, 1);
--k-preference-navigation-layout-item-selectedText-color: rgba(7, 26, 36, 1);
--k-preference-navigation-layout-item-unselectedBackground-color: rgba(255, 255, 255, 1);
--k-preference-navigation-layout-item-unselectedText-color: rgba(176, 174, 174, 1);
--k-preference-navigation-layout-item-arrowIcon-color: rgba(7, 26, 36, 1);
--k-preference-tabs-purposes-footer-actionButton-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-purposes-footer-actionButton-text-color: rgba(255, 255, 255, 1);
--k-preference-tabs-purposes-footer-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-purposes-header-description-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-header-link-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-header-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-gpcBanner-fill-color: rgba(235, 237, 237, 1);
--k-preference-tabs-purposes-gpcBanner-outline-color: rgba(235, 237, 237, 1);
--k-preference-tabs-purposes-gpcBanner-title-text-color: rgba(0, 0, 0, 1);
--k-preference-tabs-purposes-gpcBanner-description-text-color: rgba(0, 0, 0, 1);
--k-preference-tabs-purposes-purposeList-purposeListItems-purposeContent-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-purposeList-purposeListItems-purposeFill-color: rgba(255, 255, 255, 1);
--k-preference-tabs-purposes-purposeList-purposeListItems-purposeOutline-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-purposeList-purposeListItems-arrowIcon-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-purposeList-purposeListItems-purposeLinks-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-purposeList-switchButtons-on-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-purposes-purposeList-switchButtons-off-background-color: rgba(199, 199, 199, 1);
--k-preference-tabs-purposes-purposeList-switchButtons-off-text-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-purposeList-switchButtons-on-text-color: rgba(33, 33, 33, 1);
--k-preference-tabs-purposes-purposeListHeader-acceptAllButton-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-purposes-purposeListHeader-acceptAllButton-text-color: rgba(255, 255, 255, 1);
--k-preference-tabs-purposes-purposeListHeader-rejectAllButton-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-purposes-purposeListHeader-rejectAllButton-text-color: rgba(255, 255, 255, 1);
--k-preference-tabs-purposes-purposeListHeader-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-dsrPortalLink-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-dsrPortalLink-description-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-dsrPortalLink-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-home-dsrPortalLink-arrowIcon-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-header-description-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-header-link-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-header-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-rightsList-item-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-rightsList-item-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-home-rightsList-item-arrowIcon-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-home-rightsList-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-rightForm-header-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-rightForm-header-returnButton-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-rightForm-header-returnButton-icon-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-rightForm-actionButton-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-requests-rightForm-actionButton-text-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-rightForm-form-checkboxes-selected-background-color: rgba(0, 0, 0, 1);
--k-preference-tabs-requests-rightForm-form-checkboxes-selected-label-color: rgba(0, 0, 0, 1);
--k-preference-tabs-requests-rightForm-form-checkboxes-unselected-background-color: rgba(193, 198, 200, 1);
--k-preference-tabs-requests-rightForm-form-checkboxes-unselected-label-color: rgba(0, 0, 0, 1);
--k-preference-tabs-requests-rightForm-form-checkboxes-error-background-color: rgba(240, 0, 0, 1);
--k-preference-tabs-requests-rightForm-form-checkboxes-error-label-color: rgba(240, 0, 0, 1);
--k-preference-tabs-requests-rightForm-form-dividers-subtitle-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-rightForm-form-dividers-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-rightForm-form-fields-active-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-rightForm-form-fields-active-outline-color: rgba(0, 0, 0, 1);
--k-preference-tabs-requests-rightForm-form-fields-fieldLabel-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-rightForm-form-fields-hintText-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-rightForm-form-fields-inactive-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-rightForm-form-fields-inactive-outline-color: rgba(194, 194, 194, 1);
--k-preference-tabs-requests-rightForm-form-fields-inputText-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-rightForm-form-fields-error-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-rightForm-form-fields-error-outline-color: rgba(240, 0, 0, 1);
--k-preference-tabs-requests-form-error-text-color: rgba(240, 0, 0, 1);
--k-preference-tabs-requests-submitted-header-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-submitted-text-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-submitted-text-description-color: rgba(33, 33, 33, 1);
--k-preference-tabs-requests-submitted-header-returnButton-background-color: rgba(235, 237, 237, 1);
--k-preference-tabs-requests-submitted-header-returnButton-icon-color: rgba(0, 0, 0, 1);
--k-preference-tabs-requests-submitted-footer-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-submitted-footer-actionButton-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-requests-submitted-footer-actionButton-outline-color: rgba(29, 106, 229, 1);
--k-preference-tabs-requests-submitted-footer-actionButton-text-color: rgba(255, 255, 255, 1);
--k-preference-tabs-requests-submitted-footer-actionButton-icon-color: rgba(NaN, 239, NaN, 0);
--k-preference-tabs-subscriptions-footer-actionButton-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-subscriptions-footer-actionButton-text-color: rgba(255, 255, 255, 1);
--k-preference-tabs-subscriptions-footer-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-subscriptions-header-description-color: rgba(33, 33, 33, 1);
--k-preference-tabs-subscriptions-header-link-color: rgba(0, 0, 0, 1);
--k-preference-tabs-subscriptions-header-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-subscriptions-list-checkbox-selected-background-color: rgba(33, 33, 33, 1);
--k-preference-tabs-subscriptions-list-checkbox-selected-label-color: rgba(33, 33, 33, 1);
--k-preference-tabs-subscriptions-list-checkbox-unselected-background-color: rgba(33, 33, 33, 1);
--k-preference-tabs-subscriptions-list-checkbox-unselected-label-color: rgba(33, 33, 33, 1);
--k-preference-tabs-subscriptions-list-layout-text-color: rgba(33, 33, 33, 1);
--k-preference-tabs-subscriptions-list-layout-background-color: rgba(218, 221, 222, 1);
--k-preference-tabs-subscriptions-list-layout-link-color: rgba(0, 0, 0, 1);
--k-preference-tabs-subscriptions-list-switchButton-on-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-subscriptions-list-switchButton-off-background-color: rgba(199, 199, 199, 1);
--k-preference-tabs-subscriptions-list-switchButton-off-text-color: rgba(0, 0, 0, 1);
--k-preference-tabs-subscriptions-list-switchButton-on-text-color: rgba(0, 0, 0, 1);
--k-preference-tabs-subscriptions-unsubscribeAll-text-color: rgba(33, 33, 33, 1);
--k-preference-tabs-subscriptions-unsubscribeAll-background-color: rgba(255, 255, 255, 1);
--k-preference-tabs-subscriptions-unsubscribeAll-switchButton-on-background-color: rgba(29, 106, 229, 1);
--k-preference-tabs-subscriptions-unsubscribeAll-switchButton-off-background-color: rgba(199, 199, 199, 1);
--k-preference-tabs-subscriptions-unsubscribeAll-switchButton-off-text-color: rgba(7, 26, 36, 1);
--k-preference-tabs-subscriptions-unsubscribeAll-switchButton-on-text-color: rgba(7, 26, 36, 1);
--k-preference-tabs-welcome-about-link-color: rgba(33, 33, 33, 1);
--k-preference-tabs-welcome-about-text-color: rgba(33, 33, 33, 1);
--k-preference-tabs-welcome-about-title-color: rgba(33, 33, 33, 1);
--k-preference-tabs-welcome-quickLinks-link-color: rgba(33, 33, 33, 1);
--k-preference-tabs-welcome-quickLinks-title-color: rgba(0, 0, 0, 1);
--k-preference-tabs-welcome-welcomeMsg-link-color: rgba(33, 33, 33, 1);
--k-preference-tabs-welcome-welcomeMsg-subtitle-color: rgba(33, 33, 33, 1);
--k-preference-tabs-welcome-welcomeMsg-title-color: rgba(33, 33, 33, 1);
--k-consentGate-container-background-color: rgba(255, 255, 255, 1);
--k-consentGate-header-title-color: rgba(0, 0, 0, 1);
--k-consentGate-header-closeButton-background-color: rgba(235, 237, 237, 1);
--k-consentGate-header-closeButton-text-color: rgba(0, 0, 0, 1);
--k-consentGate-header-closeButton-icon-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-header-title-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-header-description-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-header-description-link-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-header-title-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-bulkActionButtons-acceptAllButton-background-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-bulkActionButtons-acceptAllButton-text-color: rgba(255, 255, 255, 1);
--k-consentGate-consentBlock-purposes-list-bulkActionButtons-rejectAllButton-background-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-bulkActionButtons-rejectAllButton-text-color: rgba(255, 255, 255, 1);
--k-consentGate-consentBlock-purposes-list-items-arrowIcon-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-items-purposeContent-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-items-purposeFill-color: rgba(235, 237, 237, 1);
--k-consentGate-consentBlock-purposes-list-items-purposeOutline-color: rgba(193, 198, 200, 1);
--k-consentGate-consentBlock-purposes-list-switchButtons-on-text-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-switchButtons-off-text-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-items-purposeLinks-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-switchButtons-on-background-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-purposes-list-switchButtons-off-background-color: rgba(193, 198, 200, 1);
--k-consentGate-consentBlock-button-background-color: rgba(0, 0, 0, 1);
--k-consentGate-consentBlock-button-text-color: rgba(255, 255, 255, 1);
--k-consentGate-consentBlock-footer-links-color: rgba(0, 0, 0, 1);
--k-consentGate-actionBlock-header-title-color: rgba(0, 0, 0, 1);
--k-consentGate-actionBlock-header-description-color: rgba(0, 0, 0, 1);
--k-consentGate-actionBlock-header-link-color: rgba(0, 0, 0, 1);
--k-consentGate-actionBlock-button-background-color: rgba(0, 0, 0, 1);
--k-consentGate-actionBlock-button-text-color: rgba(255, 255, 255, 1);
--k-consentGate-actionBlock-footer-teaser-text-color: rgba(0, 0, 0, 1);
--k-consentGate-actionBlock-footer-link-text-color: rgba(0, 0, 0, 1);
```

### Typography

```css
--bt-font-body: "GT America", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
```

### Radii

```css
--k-banner-buttons-tertiary-cornerRadius: 3px;
--k-banner-container-cornerRadius: 0;
--k-banner-header-returnButton-cornerRadius: 0;
--k-banner-gpcBanner-cornerRadius: 11px;
--k-modal-container-cornerRadius: 0;
--k-modal-footer-actionButton-cornerRadius: 3px;
--k-modal-header-returnButton-cornerRadius: 0;
--k-modal-gpcBanner-cornerRadius: 11px;
--k-modal-purposeList-purposeListItems-purposeCornerRadius: 0;
--k-modal-purposeListHeader-acceptAllButton-cornerRadius: 3px;
--k-modal-purposeListHeader-rejectAllButton-cornerRadius: 3px;
--k-preference-exitButton-cornerRadius: undefined;
--k-preference-navigation-layout-cornerRadius: 0;
--k-preference-navigation-layout-item-cornerRadius: 0;
--k-preference-tabs-purposes-footer-actionButton-cornerRadius: 3px;
--k-preference-tabs-purposes-gpcBanner-cornerRadius: 11px;
--k-preference-tabs-purposes-purposeList-purposeListItems-purposeCornerRadius: 0;
--k-preference-tabs-purposes-purposeListHeader-acceptAllButton-cornerRadius: 3px;
--k-preference-tabs-purposes-purposeListHeader-rejectAllButton-cornerRadius: 3px;
--k-preference-tabs-requests-home-dsrPortalLink-cornerRadius: 0;
--k-preference-tabs-requests-home-rightsList-item-cornerRadius: 0;
--k-preference-tabs-requests-rightForm-header-returnButton-cornerRadius: 0;
--k-preference-tabs-requests-rightForm-actionButton-cornerRadius: 3px;
--k-preference-tabs-requests-rightForm-form-fields-cornerRadius: 5px;
--k-preference-tabs-requests-submitted-header-returnButton-cornerRadius: 0;
--k-preference-tabs-requests-submitted-footer-actionButton-cornerRadius: undefined;
--k-preference-tabs-subscriptions-footer-actionButton-cornerRadius: 3px;
--k-preference-tabs-subscriptions-list-layout-cornerRadius: 0;
--k-preference-tabs-subscriptions-unsubscribeAll-cornerRadius: 0;
--k-consentGate-container-cornerRadius: 0;
--k-consentGate-header-closeButton-cornerRadius: 0;
--k-consentGate-consentBlock-purposes-list-bulkActionButtons-acceptAllButton-cornerRadius: 0;
--k-consentGate-consentBlock-purposes-list-bulkActionButtons-rejectAllButton-cornerRadius: 0;
--k-consentGate-consentBlock-purposes-list-items-cornerRadius: 0;
--k-consentGate-consentBlock-button-cornerRadius: 0;
--k-consentGate-actionBlock-button-cornerRadius: 0;
```

### Other

```css
--bt-navy: #000B50;
--bt-blue-60: #1856BA;
--bt-blue-70: var(--color-primitives-blue-70, #1856BA);
--bt-gold: #f8c72a;
--k-consentGate-header-background: rgba(255, 255, 255, 1);
--safe-area-inset-top: env(safe-area-inset-top);
--safe-area-inset-right: env(safe-area-inset-right);
--safe-area-inset-bottom: env(safe-area-inset-bottom);
--safe-area-inset-left: env(safe-area-inset-left);
```

### Dependencies

```css
--bt-blue-70: --color-primitives-blue-70;
--btm-card-text: --bt-navy;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| sm | 420px | min-width |
| sm | 480px | max-width |
| sm | 481px | min-width |
| 568px | 568px | max-width |
| sm | 640px | max-width |
| sm | 699px | max-width |
| sm | 700px | min-width |
| sm | 701px | min-width |
| md | 767px | max-width |
| md | 768px | max-width |
| md | 769px | min-width |
| lg | 962px | max-width |
| lg | 963px | min-width |
| lg | 964px | min-width |
| lg | 1024px | min-width |
| lg | 1074px | max-width |
| lg | 1075px | min-width |
| 1139px | 1139px | max-width |
| 1150px | 1150px | max-width |
| xl | 1239px | max-width |
| xl | 1280px | min-width |
| 1380px | 1380px | min-width |
| 1440px | 1440px | min-width |
| 1920px | 1920px | min-width |

## Transitions & Animations

**Easing functions:** `[object Object]`, `[object Object]`, `[object Object]`

**Durations:** `0.3s`, `0.25s`, `0.12s`, `0.15s`, `0.4s`, `0.2s`

### Common Transitions

```css
transition: all;
transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), fill 0.3s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
transition: text-decoration-color 0.25s ease-in-out;
transition: opacity 0.25s ease-in-out;
transition: background-color 0.12s, transform 0.12s;
transition: transform 0.12s;
transition: 0.15s linear;
transition: transform 0.3s ease-in-out;
transition: 0.4s;
transition: 0.2s linear;
```

### Keyframe Animations

**spinner**
```css
@keyframes spinner {
  100% { transform: rotate(360deg); }
}
```

**spinner-circle**
```css
@keyframes spinner-circle {
  0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; }
  100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; }
}
```

**ketch-backdropFadeOut**
```css
@keyframes ketch-backdropFadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
```

**ketch-bannerAnimateCenter**
```css
@keyframes ketch-bannerAnimateCenter {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

**ketch-bannerAnimateTop**
```css
@keyframes ketch-bannerAnimateTop {
  0% { transform: translateY(-900px); }
  100% { transform: translateY(0px); }
}
```

**ketch-bannerDesktopAnimate**
```css
@keyframes ketch-bannerDesktopAnimate {
  0% { transform: translateY(900px); }
  100% { transform: translateY(0px); }
}
```

**ketch-bannerDismissBottom**
```css
@keyframes ketch-bannerDismissBottom {
  0% { transform: translateY(0px); }
  100% { transform: translateY(900px); }
}
```

**ketch-bannerDismissCenter**
```css
@keyframes ketch-bannerDismissCenter {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
```

**ketch-bannerMobileBottomAnimate**
```css
@keyframes ketch-bannerMobileBottomAnimate {
  0% { transform: translateY(900px); }
  100% { transform: translateY(0px); }
}
```

**ketch-bannerMobileDismissBottom**
```css
@keyframes ketch-bannerMobileDismissBottom {
  0% { transform: translateY(0px); }
  100% { transform: translateY(900px); }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (46 instances)

```css
.button {
  background-color: rgb(29, 106, 229);
  color: rgb(255, 255, 255);
  font-size: 16px;
  font-weight: 500;
  padding-top: 0px;
  padding-right: 24px;
  border-radius: 0px;
}
```

### Cards (58 instances)

```css
.card {
  background-color: rgb(255, 255, 255);
  border-radius: 0px;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 8px 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (174 instances)

```css
.link {
  color: rgb(255, 255, 255);
  font-size: 16px;
  font-weight: 400;
}
```

### Navigation (43 instances)

```css
.navigatio {
  background-color: rgb(0, 11, 80);
  color: rgb(33, 33, 33);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Footer (67 instances)

```css
.foote {
  background-color: rgb(0, 11, 80);
  color: rgb(255, 255, 255);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 16px;
}
```

### Modals (11 instances)

```css
.modal {
  background-color: rgb(255, 255, 255);
  border-radius: 0px;
  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(7, 26, 36, 0.24) 0px 3px 10px 1px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Dropdowns (112 instances)

```css
.dropdown {
  background-color: rgb(255, 255, 255);
  border-radius: 0px;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0px 8px 0px;
  border-color: rgb(33, 33, 33);
  padding-top: 0px;
}
```

### Accordions (10 instances)

```css
.accordion {
  background-color: rgb(0, 11, 80);
  color: rgb(255, 255, 255);
  font-size: 16px;
  padding-top: 0px;
  padding-right: 0px;
  border-color: rgb(255, 255, 255);
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
  background: rgb(29, 106, 229);
  color: rgb(255, 255, 255);
  padding: 0px 16px 0px 16px;
  border-radius: 3px;
  border: 0px none rgb(0, 0, 0);
  font-size: 14px;
  font-weight: 600;
```

### Button — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 8px 8px 8px 8px;
  border-radius: 0px;
  border: 1px solid rgba(0, 0, 0, 0);
  font-size: 16px;
  font-weight: 400;
```

### Button — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(29, 106, 229);
  padding: 0px 21px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(29, 106, 229);
  font-size: 14px;
  font-weight: 400;
```

### Button — 11 instances, 4 variants

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 8px 8px 8px 8px;
  border-radius: 0px;
  border: 1px solid rgba(0, 0, 0, 0);
  font-size: 16px;
  font-weight: 400;
```

**Variant 2** (3 instances)

```css
  background: rgb(255, 199, 41);
  color: rgb(0, 11, 80);
  padding: 13px 25.6px 13px 25.6px;
  border-radius: 3px;
  border: 0px solid rgb(29, 106, 229);
  font-size: 16px;
  font-weight: 500;
```

**Variant 3** (2 instances)

```css
  background: rgb(29, 106, 229);
  color: rgb(255, 255, 255);
  padding: 13px 24px 13px 24px;
  border-radius: 3px;
  border: 1px solid rgb(29, 106, 229);
  font-size: 16px;
  font-weight: 500;
```

**Variant 4** (4 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(29, 106, 229);
  padding: 0px 24px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(29, 106, 229);
  font-size: 16px;
  font-weight: 500;
```

### Link — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(245, 245, 245, 0.7);
  color: rgb(0, 11, 80);
  padding: 16px 16px 16px 16px;
  border-radius: 20px;
  border: 0px none rgb(0, 11, 80);
  font-size: 16px;
  font-weight: 400;
```

### Card — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(0, 11, 80);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(0, 11, 80);
  font-size: 16px;
  font-weight: 400;
```

### Card — 6 instances, 1 variant

**Variant 1** (6 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(0, 11, 80);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(0, 11, 80);
  font-size: 14px;
  font-weight: 400;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(0, 11, 80);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(0, 11, 80);
  font-size: 16px;
  font-weight: 400;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(0, 11, 80);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(0, 11, 80);
  font-size: 16px;
  font-weight: 400;
```

### Card — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(0, 11, 80);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(0, 11, 80);
  font-size: 16px;
  font-weight: 700;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(33, 33, 33);
  padding: 0px 16px 0px 16px;
  border-radius: 0px;
  border: 0px none rgb(33, 33, 33);
  font-size: 16px;
  font-weight: 400;
```

### Card — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(33, 33, 33);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(33, 33, 33);
  font-size: 16px;
  font-weight: 400;
```

### Link — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
  background: rgba(245, 245, 245, 0.7);
  color: rgb(0, 11, 80);
  padding: 24px 24px 24px 24px;
  border-radius: 20px;
  border: 0px none rgb(0, 11, 80);
  font-size: 16px;
  font-weight: 400;
```

### Card — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(0, 11, 80);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(0, 11, 80);
  font-size: 16px;
  font-weight: 600;
```

### Button — 4 instances, 1 variant

**Variant 1** (4 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 32px 40px 32px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 18px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 12px;
  font-weight: 400;
```

## Layout System

**6 grid containers** and **213 flex containers** detected.

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 328px | 0px |
| 1650px | 0px |
| 568px | 0px |
| 1440px | 28.8px |
| 50% | 16px |
| 100% | 0px |
| 46.6667% | 16px |
| 83.3333% | 16px |
| 45% | 16px |
| 41.6667% | 16px |
| 1139px | 16px |

### Grid Column Patterns

| Columns | Usage Count |
|---------|-------------|
| 3-column | 4x |
| 2-column | 2x |

### Grid Templates

```css
grid-template-columns: 391.469px 391.469px 391.469px;
gap: 24px;
grid-template-columns: 402.125px 402.141px 402.125px;
gap: 24px;
grid-template-columns: 402.125px 402.141px 402.125px;
gap: 24px;
grid-template-columns: 595.203px 595.203px;
gap: 16px;
grid-template-columns: repeat(2, minmax(0px, 1fr));
gap: 16px;
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| row/nowrap | 120x |
| column/nowrap | 51x |
| row/wrap | 42x |

**Gap values:** `12px`, `16px`, `20px`, `24px`, `4px`, `8px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 20 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio | Level |
|------------|------------|-------|-------|
| `#ffffff` | `#1d6ae5` | 4.95:1 | AA |
| `#000b50` | `#ffc729` | 11.56:1 | AAA |
| `#ffffff` | `#212121` | 16.1:1 | AAA |
| `#ffffff` | `#000b50` | 18.05:1 | AAA |
| `#ffffff` | `#21494e` | 9.87:1 | AAA |
| `#212121` | `#ffffff` | 16.1:1 | AAA |

## Design System Score

**Overall: 83/100 (Grade: B)**

| Category | Score |
|----------|-------|
| Color Discipline | 92/100 |
| Typography Consistency | 50/100 |
| Spacing System | 100/100 |
| Shadow Consistency | 90/100 |
| Border Radius Consistency | 90/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 100/100 |

**Strengths:** Tight, disciplined color palette, Well-defined spacing scale, Clean elevation system, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**
- 5 font families — consider limiting to 2 (heading + body)
- 448 !important rules — prefer specificity over overrides
- 85% of CSS is unused — consider purging
- 3838 duplicate CSS declarations

## Gradients

**3 unique gradients** detected.

| Type | Direction | Stops | Classification |
|------|-----------|-------|----------------|
| linear | — | 2 | brand |
| linear | — | 2 | brand |
| linear | — | 3 | bold |

```css
background: linear-gradient(rgb(29, 106, 229), rgb(0, 11, 80));
background: linear-gradient(rgb(29, 106, 229), rgb(249, 240, 226));
background: linear-gradient(rgb(249, 240, 226) 3.27%, rgb(87, 144, 235) 51.75%, rgb(29, 106, 229) 99.91%);
```

## Z-Index Map

**12 unique z-index values** across 4 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| modal | 9989,2147483647 | div.g.o.2.4.1.7.2.4.9.4.6.4. .g.o.6.1.3.3.0.5.1.5.5, div.g.o.2.4.1.7.2.4.9.4.6.4. .g.o.4.7.1.5.8.3.5.0.6, div.g.o.2.4.1.7.2.4.9.4.6.4. .g.o.3.9.2.1.3.6.6.3.9.3 |
| dropdown | 100,100 | div.g.e.t.-.s.t.a.r.t.e.d.-.m.o.b.i.l.e.-.p.o.p.u.p.-.w.r.a.p.p.e.r |
| sticky | 97,99 | button.b.t.-.P.r.i.m.a.r.y.B.u.t.t.o.n. .p.e.r.s.i.s.t.a.n.t.-.c.t.a. .p.e.r.s.i.s.t.a.n.t.-.c.t.a.-.h.i.d.d.e.n. .g.e.t.-.s.t.a.r.t.e.d.-.m.o.b.i.l.e.-.p.o.p.u.p.-.t.r.i.g.g.e.r. .g.e.t.-.s.t.a.r.t.e.d.-.m.o.b.i.l.e.-.p.o.p.u.p.-.t.r.i.g.g.e.r.-.u.n.h.i.d.d.e.n, div.n.a.v.-.h.e.a.d.e.r.-.w.r.a.p.-.c.h.i.l.d.r.e.n |
| base | -1,8 | img, img, img |

**Issues:**
- [object Object]

## SVG Icons

**8 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
|------------|-------|
| md | 5 |
| lg | 2 |
| xl | 1 |

**Icon colors:** `#FFC729`, `rgb(255, 255, 255)`, `currentColor`, `rgb(0, 0, 0)`, `rgb(29, 106, 229)`, `url(#paint0_linear_2090_61405)`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| GT America | self-hosted | 400, 500, 700 | normal |
| GT America Extended | self-hosted | 400 | normal |
| GT America Black | self-hosted | 400 | normal |
| GT America Compressed Medium Italic | self-hosted | 500 | normal |
| GT America Compressed Bold Italic | self-hosted | 700 | normal |
| GT America Light | self-hosted | 300 | normal |
| Season Mix | self-hosted | 500 | normal |
| Season Mix Italic | self-hosted | 500 | normal |
| WistiaPlayerInterNumbersSemiBold | self-hosted | 400, normal | normal |

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| thumbnail | 29 | objectFit: fill, borderRadius: 0px, shape: square |
| gallery | 4 | objectFit: fill, borderRadius: 0px, shape: square |
| general | 4 | objectFit: cover, borderRadius: 0px, shape: square |

**Aspect ratios:** 1:1 (17x), 21:9 (7x), 4:3 (4x), 2:3 (3x), 2.49:1 (2x), 7.27:1 (1x), 16:9 (1x), 1.95:1 (1x)

## Motion Language

**Feel:** smooth · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `xs` | `120ms` | 120 |
| `sm` | `200ms` | 200 |
| `md` | `300ms` | 300 |

### Easing Families

- **custom** (3 uses) — `cubic-bezier(0.4, 0, 0.2, 1)`
- **ease-in-out** (17 uses) — `ease`
- **linear** (10 uses) — `linear`

### Keyframes In Use

| name | kind | properties | uses |
|---|---|---|---|
| `ketch-bannerDesktopAnimate` | slide-y | transform | 1 |

## Component Anatomy

### button — 29 instances

**Slots:** label
**Variants:** outline · link
**Sizes:** sm · medium

| variant | count | sample label |
|---|---|---|
| default | 21 | Invest |
| link | 5 | Learn more |
| outline | 3 | Accept All |

### card — 27 instances

**Slots:** media
**Sizes:** lg

### link — 5 instances


## Brand Voice

**Tone:** friendly · **Pronoun:** you-only · **Headings:** Sentence case (balanced)

### Top CTA Verbs

- **learn** (4)
- **get** (4)
- **claim** (3)
- **open** (2)
- **log** (2)
- **start** (2)
- **accept** (1)
- **reject** (1)

### Button Copy Patterns

- "learn more" (3×)
- "claim offer" (3×)
- "get started" (3×)
- "log in" (2×)
- "accept all" (1×)
- "open preferences" (1×)
- "reject all" (1×)
- "invest" (1×)
- "cash" (1×)
- "retirement" (1×)

### Sample Headings

> Build your wealth in the background
> Invest with fewertax surprises
>    
> Start with our most popular accounts.
> Build your wealth in the background
> Invest with fewertax surprises
>    
> Start with our most popular accounts.
>   Automated investing
>   High-yield cash

## Page Intent

**Type:** `landing` (confidence 0.51)
**Description:** Betterment can help grow your money by making saving and investing easy. 
Invest in a tailored portfolio, set buckets for your goals, and earn 
rewards.

Alternates: pricing (0.6), blog-post (0.35)

## Section Roles

Reading order (top→bottom): nav → pricing-table → content → hero → testimonial → content → content → content → nav → cta → pricing-table → cta → nav → pricing-table → content → logo-wall → content → feature-grid → content → testimonial → feature-grid → content → cta → pricing-table → pricing-table → feature-grid → pricing-table → gallery → testimonials → testimonial → hero → cta → footer → nav

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | nav | — | 0.9 |
| 1 | cta | — | 0.75 |
| 2 | nav | — | 0.9 |
| 3 | nav | — | 0.9 |
| 4 | pricing-table | — | 0.9 |
| 5 | cta | — | 0.75 |
| 6 | pricing-table | — | 0.9 |
| 7 | content | — | 0.3 |
| 8 | pricing-table | Invest with fewertax surprises | 0.9 |
| 9 | content | — | 0.3 |
| 10 | hero | — | 0.85 |
| 11 | logo-wall |     | 0.85 |
| 12 | content | Start with our most popular accounts. | 0.3 |
| 13 | testimonial |   Automated investing | 0.8 |
| 14 | feature-grid | INVEST
Automated investing | 0.8 |
| 15 | content | Invest the way you want. | 0.3 |
| 16 | testimonial | INVEST
Investing should always be this easy. | 0.8 |
| 17 | feature-grid | — | 0.8 |
| 18 | content | — | 0.3 |
| 19 | content | 
                     
                     
                        Invest with | 0.3 |

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.276 |
| Shadow profile | soft |
| Avg shadow blur | 0px |
| Max radius | 42px |
| backdrop-filter in use | no |
| Gradients | 3 |

## Imagery Style

**Label:** `photography` (confidence 0.072)
**Counts:** total 37, svg 10, icon 21, screenshot-like 0, photo-like 0
**Dominant aspect:** square-ish
**Radius profile on images:** square

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `GT America` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
