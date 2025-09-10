# Greenlight Addon - WordPress Gutenberg Block Extension

A powerful WordPress plugin that extends Gutenberg blocks with Greenlight's high-quality library of components. This addon provides advanced styling, animation, interactions, dynamic placeholders and class system and customization capabilities for WordPress block development on top of Greenshift or GreenLight PRO plugins. 

## 🚀 Features

- **Advanced Block Styling**: Dynamic CSS generation with device-specific responsive controls
- **Class System**: AOS (Animate On Scroll) animations with interaction layers
- **Animation Support**: AOS (Animate On Scroll) animations with interaction layers
- **Rich Text Editing**: Enhanced text editing with RichText component
- **Icon Integration**: SVG icon support with customizable attributes
- **Dynamic Data Attributes**: Support for dynamic content and class management
- **Interactions**: Support for dynamic content and class management
- **Performance Optimized**: Efficient CSS generation and block rendering

## 📋 Requirements

- WordPress 5.0+ (Gutenberg support)
- Greenlight Builder plugin or Greenshift plugin (parent plugin)
- Node.js 14+ (for development)
- PHP 7.4+

## 🛠️ Installation

1. Clone this repository to your WordPress plugins directory:
```bash
git clone https://github.com/wpsoul/greenlightaddon.git
cd greenlightaddon
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Activate the plugin through the WordPress admin panel

## 🏗️ Development

### Available Scripts

- `npm start` - Start development mode with hot reloading
- `npm run build` - Build production assets
- `npm run lint:js` - Lint JavaScript files
- `npm run lint:style` - Lint CSS files

### Project Structure

```
greenlightaddon/
├── src/
│   └── blocks/
│       └── example/
│           ├── edit.js          # Block editor component
│           ├── inspector.js     # Block inspector controls
│           ├── save.js          # Block save component
│           └── index.js         # Block registration
├── build/                       # Compiled assets
├── greenlightaddon.php         # Main plugin file
└── package.json                # Dependencies and scripts
```

## 🔧 Block Editor Component (edit.js) Explained

The `edit.js` file is the core component that handles the block's appearance and functionality in the WordPress editor. Here's a detailed breakdown of its components:

### Dependencies

#### WordPress Dependencies
- `wp.i18n` - Internationalization support
- `wp.element` - React hooks (useRef, useEffect)
- `wp.blockEditor` - Gutenberg block editor components (RichText, useBlockProps)

#### Greenlight Dependencies
- `gspblib.utilities` - Core utility functions for block management
- `gspblib.helpers` - Helper functions for CSS generation
- `gspblib.components` - Reusable UI components
- `gspblib.collections` - Animation and wrapper components

### Key Components Breakdown

#### 1. Block ID Management
```javascript
useEffect(() => {
    gspb_setBlockId(props, 2);
}, []);
```
- Generates unique IDs for each block instance
- Ensures proper block identification and styling

#### 2. Local ID Management
```javascript
useEffect(() => {
    if (id != null) {
        // Logic for setting localId based on block ID. Used for root class. While id is unique, localId can be shared between several blocks
        props.setAttributes({ localId: id });
    }
}, [id]);
```
- Manages CSS class names for styling
- Allows similar styling across multiple blocks

#### 3. Animation System
```javascript
const animationRef = useRef();
let AnimationProps = AnimationRenderProps(animation, interactionLayers);
```
- Provides AOS (Animate On Scroll) animation support
- It has stagger support, hover actions, svg animations, etc
- Handles interaction layers for complex animations
- Uses refs for animation targeting

#### 4. Dynamic Data Attributes
```javascript
let DynamicDataAttributes = getDataAttributesfromDynamic(props);
```
- Supports dynamic content integration
- Enables class panel functionality
- Allows runtime attribute modification
- In blockrender folder, find server side rendering for block with gl_dynamic_placeholders that handle dynamic placeholders for content

#### 5. CSS Generation System

##### Dynamic Local Classes
```javascript
final_css = getFinalCssFromDynamicLocalClasses(props, final_css);
```
- Generates CSS from dynamic class system

##### Style Attributes
```javascript
if (styleAttributes) {
    local_css = getCssFromStyleAttributes(styleAttributes, css_selector_by_user, local_css, enableSpecificity);
}
```
- Converts style attributes to CSS
- Supports specificity control for CSS priority

##### Animation CSS
```javascript
final_css = aos_animation_cssGen(animation, css_selector_by_user, final_css, props);
```
- Generates AOS animation CSS
- Handles keyframe animations and transitions

##### Device-Responsive CSS
```javascript
final_css = gspb_cssGen(
    css_selector_by_user,
    ['font-size'],
    [
        [
            [(unitArray && unitArray[0]) ? unitArray[0] : null],
            [(unitArray && unitArray[1]) ? unitArray[1] : null],
            [(unitArray && unitArray[2]) ? unitArray[2] : null],
            [(unitArray && unitArray[3]) ? unitArray[3] : null],
        ],
    ], // [desktop, tablet, mobile, mobile-small]
    final_css
);
```
- gspb_cssGen is used to generate css for specific css option. First parameter - selector where to apply styles, second - array of css options, third - array of values for desktop, tablet, mobile, and mobile-small breakpoints. 
##### Static CSS Properties
```javascript
final_css = gspb_cssGen(
    css_selector_by_user,
    ['color'],
    [colorValue],
    final_css
);
```
- Handles non-responsive CSS properties
- Supports any CSS property with single values

#### 6. Block Props Configuration
```javascript
let blockProps = useBlockProps({
    "data-gspb-block-id": props.attributes.id,
    className: `gspb-selector-element ${localId ? localId : ''}`,
    ref: animationRef,
    ...DynamicDataAttributes,
    ...AnimationProps
});
```
- Combines all block attributes and properties + some extra attributes for editor.
- Sets up proper CSS classes and data attributes
- Integrates animation and dynamic data support

#### 7. Editor-Specific Styling
```javascript
let editor_css = gspb_convert_styles_for_editor(final_css);
```
- Converts frontend CSS for editor compatibility
- Ensures consistent styling between editor and frontend

#### 8. Component Rendering

##### Animation Wrapper
```javascript
<AnimationWrapper attributes={props.attributes} props={props} animationExtRef={animationRef}>
```
- Wraps the entire block for animation support
- Provides animation context and lifecycle management

##### Inspector and Toolbar
```javascript
{props.isSelected && (
    <>
        <Inspector {...props} />
        <BlockToolBar {...props} />
    </>
)}
```
- Shows block controls only when block is selected
- Provides customization interface for users

##### Rich Text Component
```javascript
<RichText
    tagName={'span'}
    placeholder={__("Greenlight - Page-Building Gutenberg Blocks", 'greenlightaddon')}
    value={textContent}
    onChange={(value) => {
        props.setAttributes({ textContent: value });
    }}
/>
```
- Provides rich text editing capabilities
- Supports formatting, links, and other text features
- Handles content updates and persistence


##### Style Tabs
```javascript
<AttributeTabs
    attributeName="styleAttributes"
    {...props}
    defaultTab={''}
    includes={['typography', 'color', 'spacing', 'shadow', 'border', 'position', 'size', 'layout', 'effects', 'csstransform', 'responsive']} svgcolors={true} selfAlign={"both"}
/>
```
- Provides rich style control
- You can select which panels to include
- If you don't want to have tabs, you can put only one option in includes parameter

##### SVG Icon Viewer
```javascript
{iconBox && (
    <SVGViewer attributeName="icon" blockProps={blockProps} {...props} />
)}
```
- Renders SVG icons for Icon component
- Integrates with the block's styling system

##### Dynamic CSS Injection
```javascript
{editor_css && (
    <style dangerouslySetInnerHTML={{ __html: editor_css }} />
)}
```
- Injects generated CSS directly into the editor
- Ensures real-time styling updates in editor

## 🎨 Customization

### Adding New CSS Properties

To add support for new CSS properties, use the `gspb_cssGen` helper:

```javascript
// For responsive properties
final_css = gspb_cssGen(
    css_selector_by_user,
    ['margin-top', 'padding-bottom'],
    [responsiveValues],
    final_css
);

// For static properties
final_css = gspb_cssGen(
    css_selector_by_user,
    ['background-color'],
    [backgroundColor],
    final_css
);
```

### Adding New Attributes

1. Add the attribute to your block's `attributes` object in `index.js`
2. Destructure it in the `edit.js` component
3. Use it in your CSS generation or component logic
4. Add corresponding controls in `inspector.js`

## 📚 API Reference

### Greenlight Library Functions

- `gspb_setBlockId(props, prefix)` - Sets unique block ID
- `getDataAttributesfromDynamic(props)` - Gets dynamic data attributes
- `getFinalCssFromDynamicLocalClasses(props, css)` - Generates CSS from dynamic classes
- `getCssFromStyleAttributes(attributes, selector, css, specificity)` - Converts style attributes to CSS
- `aos_animation_cssGen(animation, selector, css, props)` - Generates animation CSS
- `gspb_cssGen(selector, properties, values, css)` - Generates custom CSS
- `gspb_convert_styles_for_editor(css)` - Converts CSS for editor compatibility
- `gspb_Css_Final(id, css, props)` - Stores final CSS

### Components

- `AnimationWrapper` - Wraps blocks with animation support
- `BlockToolBar` - Provides block toolbar controls
- `SVGViewer` - Renders SVG icons
- `BlpgeColorPicker` - Special Color component, use instead of core color component of gutenberg for extra features (more presets, color picker, variables)
- `UnitControl` - Improved UnitControl, use instead of core UnitControl for extra features (right mouse click for variable selection)
- `Devices` - Device Selector

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GreenLight Plugin**: [Greenlight Builder Documentation](https://greenlightbuilder.pro)
- **Support**: [Greenlight Builder Support](https://shop.greenshiftwp.com/support-board/)
- **Issues**: [GitHub Issues](https://github.com/wpsoul/greenlightaddon/issues)


**Made with ❤️ by the Greenlight Builder team**
