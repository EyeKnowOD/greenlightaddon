# WordPress Archive Template Fixes - Complete Guide

## Issues Identified and Fixed

### 🔴 **Critical Issue #1: Line-Height Bug**

**Location:** Main title heading (gsbp-main-title)

**Problem:**
```json
"lineHeight":["1.2rem"]  // ❌ WRONG
```

**Why it's broken:**
- Font size is `clamp(2.5rem, 5vw, 3.5rem)` (40-56px)
- Line-height of `1.2rem` (19.2px) is MUCH smaller than the font size
- This causes severe text overlap, cutting, and unreadable headers
- The header text gets crushed and overlaps other elements

**Fix:**
```json
"lineHeight":["1.2"]  // ✅ CORRECT (unitless)
```

**Why this works:**
- Unitless line-height multiplies by the font size
- `1.2` means 120% of font size
- For 40px font: 48px line-height
- For 56px font: 67.2px line-height
- Maintains proper spacing regardless of viewport size

**CSS Output:**
```css
/* Before (BROKEN) */
.gsbp-main-title {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    line-height: 1.2rem; /* Only 19.2px! Text gets crushed */
}

/* After (FIXED) */
.gsbp-main-title {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    line-height: 1.2; /* Scales properly with font size */
}
```

---

### 🔴 **Critical Issue #2: Block Validation Errors**

**Problem:**
WordPress Block Editor shows "Block contains unexpected or invalid content"

**Root Causes:**
1. **Escaped CSS Variables** - Incorrect escape sequences in CSS custom properties
2. **Malformed JSON** - Invalid characters in block attributes
3. **Inconsistent Spacing** - Tabs/spaces issues in inline CSS

**Examples Found:**

**WRONG:**
```json
"inlineCssStyles":".gsbp-sec-wrapper{padding-top:1rem;padding-bottom:var(\u002d\u002dwp\u002d\u002dpreset\u002d\u002dspacing\u002d\u002d60, 2.25rem);}"
```

**CORRECT:**
```json
"inlineCssStyles":".gsbp-sec-wrapper{padding-top:1rem;padding-bottom:var(--wp--preset--spacing--60, 2.25rem);}"
```

**Why the escapes are problematic:**
- `\u002d` is Unicode for `-` (hyphen)
- WordPress Block Parser doesn't always handle Unicode escapes correctly in JSON
- Direct hyphens work fine in JSON strings
- Escaping causes validation mismatches between saved and expected content

**Fix Applied:**
- Removed ALL Unicode escape sequences (`\u002d` → `-`)
- Used proper CSS custom property syntax
- Ensured consistent formatting

---

### 🟡 **Performance Issue: Verbose Inline CSS**

**Problem:**
- Extremely long inline CSS strings in block attributes
- Repeated CSS declarations
- Unminified CSS with unnecessary whitespace (in some areas)
- Large page size and slow editor loading

**Current Impact:**
```
Average inline CSS per block: 200-500 characters
Total template size: ~15KB (mostly CSS)
Editor load time: Increased due to parsing overhead
```

**Improvements Made:**
1. **Removed unnecessary whitespace** in CSS
2. **Consolidated media queries** where possible
3. **Used consistent formatting** (no tabs/newlines in strings)

**Example:**

**Before:**
```css
.gsbp-main-title{
    font-size:clamp(2.5rem, 5vw, 3.5rem);
    font-weight:800;
    margin-top:0px;
    margin-bottom:0px;
    text-align:center;
    color:#0f172a;
    line-height:1.2rem;
    letter-spacing:-0.03em;
}
```

**After:**
```css
.gsbp-main-title{font-size:clamp(2.5rem, 5vw, 3.5rem);font-weight:800;margin-top:0px;margin-bottom:0px;text-align:center;color:#0f172a;line-height:1.2;letter-spacing:-0.03em;}
```

---

### 🟢 **Additional Improvements**

#### 1. **CSS Custom Properties Syntax**
Ensured all CSS variables use proper syntax:
```css
var(--wp--preset--spacing--60, 2.25rem)  /* ✅ Correct */
var(--wp--style--global--wide-size, 1200px)  /* ✅ Correct */
```

#### 2. **Consistent Inline CSS Formatting**
- All CSS on single line within JSON strings
- No newlines in `inlineCssStyles` values
- Proper escaping only where necessary (quotes, backslashes)

#### 3. **Media Query Optimization**
Kept responsive breakpoints but ensured proper syntax:
```css
@media (max-width: 991.98px){...}
@media (max-width: 767.98px){...}
@media (max-width: 575.98px){...}
```

---

## How to Implement the Fix

### Option 1: Replace Template in WordPress Admin (Recommended)

1. **Backup your current template:**
   - Go to WordPress Admin → Appearance → Editor
   - Find your archive template
   - Copy the entire content to a safe place

2. **Replace with fixed version:**
   - Open `archive-drugs-fixed.html` from this repository
   - Copy the entire content
   - Paste into your template editor
   - Click "Save"

3. **Clear caches:**
   ```bash
   # If using WP CLI
   wp cache flush

   # Or clear from admin
   # Go to your caching plugin and clear all caches
   ```

4. **Test the template:**
   - View the archive page on frontend
   - Check the header title displays correctly
   - Verify filters work
   - Inspect in browser DevTools

### Option 2: Manual Fix (If you made customizations)

If you customized the original template, apply just the critical fix:

1. **Find this line in your template:**
```json
"lineHeight":["1.2rem"]
```

2. **Change it to:**
```json
"lineHeight":["1.2"]
```

3. **Find and replace all escaped CSS variables:**

Search for: `\u002d\u002d`
Replace with: `--`

4. **Save and test**

### Option 3: Using Search & Replace in Code Editor

If editing the template file directly:

```bash
# Replace line-height issue
sed -i 's/"lineHeight":\["1\.2rem"\]/"lineHeight":["1.2"]/g' your-template.html

# Replace Unicode escapes
sed -i 's/\\u002d/-/g' your-template.html
```

---

## Verification Steps

After applying the fix, verify everything works:

### ✅ **Visual Checks**

1. **Header Title:**
   - Should be readable and properly sized
   - No text overlap or cutting
   - Proper spacing above and below

2. **Badge ("Clinical Reference"):**
   - Should display above the title
   - Proper padding and styling

3. **Filter Section:**
   - Search box displays correctly
   - Category dropdown works
   - Both elements align properly on mobile

4. **Grid Layout:**
   - Cards display in 3 columns (desktop)
   - Responsive: 2 columns (tablet), 1 column (mobile)

### ✅ **Technical Checks**

1. **Block Editor:**
   - No "Block contains unexpected or invalid content" errors
   - No React errors in console
   - All blocks editable

2. **Browser Console:**
   ```javascript
   // Should be NO errors related to:
   // - React Hook violations
   // - Block validation
   // - CSS parsing
   ```

3. **CSS Validation:**
   ```javascript
   // In DevTools, check computed styles for .gsbp-main-title
   // line-height should be computed value (e.g., 67.2px for 56px font)
   // NOT a fixed 1.2rem (19.2px)
   ```

4. **Performance:**
   - Page should load faster in editor
   - No lag when editing blocks

---

## Understanding the Root Cause

### Why did this happen?

1. **Greenshift Block Complexity:**
   - Greenshift generates very detailed styleAttributes
   - Easy to make unit mistakes (rem vs unitless)
   - Inline CSS can accumulate errors

2. **WordPress Block Parser:**
   - Sensitive to JSON format changes
   - Unicode escapes in CSS can cause validation failures
   - Expects exact markup match between save/edit

3. **React Hooks Error:**
   - Often a symptom, not the root cause
   - Block validation errors can trigger React errors
   - Fixing template usually resolves both

---

## Prevention Tips

### For Future Template Editing:

1. **Line-Height Best Practices:**
   ```css
   /* ✅ GOOD - Use unitless for scalability */
   line-height: 1.2;
   line-height: 1.5;

   /* ⚠️ OK - Use em for relative sizing */
   line-height: 1.2em;

   /* ❌ BAD - Avoid fixed rem/px with responsive fonts */
   line-height: 1.2rem;  /* Breaks with clamp() */
   line-height: 20px;    /* Doesn't scale */
   ```

2. **CSS Variables:**
   ```css
   /* ✅ ALWAYS use direct hyphens */
   var(--wp--preset--color--primary)

   /* ❌ NEVER use Unicode escapes */
   var(\u002d\u002dwp\u002d\u002dpreset...)
   ```

3. **Testing Workflow:**
   - Save template → Check editor for errors
   - View frontend → Inspect in DevTools
   - Test on mobile devices
   - Clear cache between tests

4. **Use Browser DevTools:**
   ```javascript
   // Check computed line-height
   const title = document.querySelector('.gsbp-main-title');
   const styles = window.getComputedStyle(title);
   console.log('Font size:', styles.fontSize);
   console.log('Line height:', styles.lineHeight);
   // Line height should be larger than font size!
   ```

---

## Additional Resources

### Greenshift Documentation
- [Greenshift Style Attributes](https://greenshiftwp.com/docs/)
- [CSS Generation System](https://greenshiftwp.com/docs/css-generation/)

### WordPress Block Editor
- [Block Validation](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation)
- [Template Parts](https://developer.wordpress.org/block-editor/how-to-guides/themes/block-theme-overview/)

### CSS Best Practices
- [MDN: line-height](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Responsive Typography](https://developer.mozilla.org/en-US/docs/Learn/CSS/Styling_text/Responsive_design)

---

## Support

If you encounter issues after applying these fixes:

1. **Check WordPress Error Log:**
   ```bash
   tail -f wp-content/debug.log
   ```

2. **Browser Console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Greenshift Support:**
   - [Support Forum](https://shop.greenshiftwp.com/support-board/)
   - [GitHub Issues](https://github.com/wpsoul/greenshift-animation-and-page-builder-blocks/issues)

---

## Summary

**Critical Fixes Applied:**
- ✅ Changed line-height from `1.2rem` to `1.2` (unitless)
- ✅ Removed Unicode escape sequences in CSS variables
- ✅ Cleaned up inline CSS formatting
- ✅ Ensured consistent block markup

**Expected Results:**
- ✅ No block validation errors
- ✅ No React errors in console
- ✅ Proper header text display
- ✅ Better editor performance
- ✅ Fully functional archive page

**File to Use:**
📄 `archive-drugs-fixed.html` - Copy this into your WordPress template editor

---

*Last Updated: 2025-12-16*
*Greenlight Addon Version: 0.1*
