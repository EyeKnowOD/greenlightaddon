# Standalone Snippets for Greenshift Filter Fix

These snippets can be used independently without modifying the Greenlight addon plugin.

## Option 1: Code Snippets Plugin (Recommended)

Install the "Code Snippets" plugin from WordPress.org and add each snippet separately.

## Option 2: Theme functions.php

Add the PHP snippet to your child theme's `functions.php` file.

## Option 3: Custom Plugin

Create a new file in `/wp-content/plugins/` with the PHP snippet.

---

## Files in this folder:

1. **php-snippet.php** - Add to Code Snippets plugin or functions.php
2. **javascript-snippet.js** - Add to Customizer > Additional JS or via wp_enqueue_script
3. **css-snippet.css** - Add to Customizer > Additional CSS

## Quick Implementation:

For the fastest fix, just add the JavaScript to your site via:
- Greenshift > Settings > Custom Scripts (if available)
- Appearance > Customize > Additional CSS/JS
- A code injection plugin

The JavaScript alone should fix most popup issues.
