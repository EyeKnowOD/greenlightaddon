/**
 *
 * Inspector Component.
 *
*/

const { TextareaControl } = wp.components;
const { __ } = wp.i18n;


const CodeInspector = (props) => {
    const {
        final_css,
        setAttributes,
        styleAttributes,
        localId,

    } = props;

    // Generate CSS for specific device
    const generateCSSForDevice = (deviceIndex) => {
        if (!styleAttributes || !localId) return '';

        const cssProperties = [];
        Object.keys(styleAttributes).forEach(property => {
            if (property.includes('_')) return; // Skip custom CSS

            const values = styleAttributes[property];
            if (Array.isArray(values) && values[deviceIndex] !== null && values[deviceIndex] !== undefined) {
                const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
                cssProperties.push(`${kebabProperty}: ${values[deviceIndex]};`);
            }
        });

        if (cssProperties.length > 0) {
            return `.${localId} {\n  ${cssProperties.join('\n  ')}\n}`;
        }

        return '';
    };

    // Convert CSS to attributes for specific device
    const convertCSSToAttributesForDevice = (cssCode, deviceIndex) => {
        if (!localId) {
            return;
        }

        // If CSS is empty, clear the device-specific properties
        if (!cssCode || cssCode.trim() === '') {
            const newStyleAttributes = { ...styleAttributes };
            Object.keys(newStyleAttributes).forEach(property => {
                if (property === 'customCSS_Extra') return; // Skip custom CSS

                const values = newStyleAttributes[property];
                if (Array.isArray(values)) {
                    values[deviceIndex] = null;
                    newStyleAttributes[property] = values;
                }
            });
            setAttributes({ styleAttributes: newStyleAttributes });
            return;
        }

        // Parse CSS and extract rules
        const cssRules = parseCSS(cssCode);
        const newStyleAttributes = { ...styleAttributes };

        cssRules.forEach(rule => {
            const { selector, properties } = rule;

            // Check if selector matches the current block's localId
            if (selector === '.' + localId) {
                // Convert properties to styleAttributes for specific device
                Object.keys(properties).forEach(property => {
                    const camelCaseProperty = toCamelCase(property);
                    const value = properties[property];

                    // Create or update the property array
                    if (!newStyleAttributes[camelCaseProperty]) {
                        newStyleAttributes[camelCaseProperty] = [null, null, null, null];
                    }

                    // Ensure array has 4 elements
                    while (newStyleAttributes[camelCaseProperty].length < 4) {
                        newStyleAttributes[camelCaseProperty].push(null);
                    }

                    // Set value at the specific device index
                    newStyleAttributes[camelCaseProperty][deviceIndex] = value;
                });
            }
        });

        // Update attributes
        if (Object.keys(newStyleAttributes).length > 0) {
            setAttributes({ styleAttributes: newStyleAttributes });
        }
    };

    // Helper function to convert kebab-case to camelCase
    const toCamelCase = (str) => {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    };

    // CSS parsing function
    const parseCSS = (cssString) => {
        const rules = [];

        try {
            // Simple but effective CSS parser
            let currentIndex = 0;
            const length = cssString.length;

            while (currentIndex < length) {
                // Skip whitespace and comments
                while (currentIndex < length && /\s/.test(cssString[currentIndex])) {
                    currentIndex++;
                }

                if (currentIndex >= length) break;

                // Check for media query
                if (cssString.substring(currentIndex, currentIndex + 7) === '@media ') {
                    const mediaQueryStart = currentIndex;
                    currentIndex += 7;

                    // Find media query condition
                    let braceCount = 0;
                    let mediaQuery = '';
                    let mediaContent = '';
                    let inMediaQuery = true;

                    while (currentIndex < length) {
                        const char = cssString[currentIndex];

                        if (char === '{') {
                            braceCount++;
                            if (braceCount === 1) {
                                mediaQuery = cssString.substring(mediaQueryStart + 7, currentIndex).trim();
                                inMediaQuery = false;
                            }
                        } else if (char === '}') {
                            braceCount--;
                            if (braceCount === 0) {
                                break;
                            }
                        }

                        if (!inMediaQuery) {
                            mediaContent += char;
                        }

                        currentIndex++;
                    }

                    // Parse rules within media query
                    const mediaRules = parseRulesFromContent(mediaContent);
                    mediaRules.forEach(rule => {
                        rule.mediaQuery = mediaQuery;
                        rule.originalRule = `@media ${mediaQuery} {\n  ${rule.selector} {\n    ${Object.entries(rule.properties).map(([k, v]) => `${k}: ${v}`).join(';\n    ')}\n  }\n}`;
                    });
                    rules.push(...mediaRules);

                } else {
                    // Regular CSS rule
                    const ruleStart = currentIndex;
                    let braceCount = 0;
                    let selector = '';
                    let properties = '';
                    let inSelector = true;

                    while (currentIndex < length) {
                        const char = cssString[currentIndex];

                        if (char === '{') {
                            braceCount++;
                            if (braceCount === 1) {
                                selector = cssString.substring(ruleStart, currentIndex).trim();
                                inSelector = false;
                            }
                        } else if (char === '}') {
                            braceCount--;
                            if (braceCount === 0) {
                                break;
                            }
                        }

                        if (!inSelector) {
                            properties += char;
                        }

                        currentIndex++;
                    }

                    if (selector && properties) {
                        const parsedProperties = parseProperties(properties);
                        if (Object.keys(parsedProperties).length > 0) {
                            rules.push({
                                selector,
                                properties: parsedProperties,
                                mediaQuery: null,
                                originalRule: `${selector} {\n  ${Object.entries(parsedProperties).map(([k, v]) => `${k}: ${v}`).join(';\n  ')}\n}`
                            });
                        }
                    }
                }

                currentIndex++;
            }
        } catch (error) {
            console.error('Error parsing CSS:', error);
        }

        return rules;
    };

    // Helper function to parse rules from content
    const parseRulesFromContent = (content) => {
        const rules = [];
        let currentIndex = 0;
        const length = content.length;

        while (currentIndex < length) {
            // Skip whitespace
            while (currentIndex < length && /\s/.test(content[currentIndex])) {
                currentIndex++;
            }

            if (currentIndex >= length) break;

            const ruleStart = currentIndex;
            let braceCount = 0;
            let selector = '';
            let properties = '';
            let inSelector = true;

            while (currentIndex < length) {
                const char = content[currentIndex];

                if (char === '{') {
                    braceCount++;
                    if (braceCount === 1) {
                        selector = content.substring(ruleStart, currentIndex).trim();
                        inSelector = false;
                    }
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        break;
                    }
                }

                if (!inSelector) {
                    properties += char;
                }

                currentIndex++;
            }

            if (selector && properties) {
                const parsedProperties = parseProperties(properties);
                if (Object.keys(parsedProperties).length > 0) {
                    rules.push({
                        selector,
                        properties: parsedProperties
                    });
                }
            }

            currentIndex++;
        }

        return rules;
    };

    // Helper function to parse CSS properties
    const parseProperties = (propertiesString) => {
        const properties = {};
        const propertyRegex = /([a-zA-Z-]+)\s*:\s*([^;]*);?/g;
        let match;

        while ((match = propertyRegex.exec(propertiesString)) !== null) {
            const property = match[1].trim();
            const value = match[2].trim();

            // Skip comments but allow empty values
            if (!value.startsWith('/*') && !value.endsWith('*/')) {
                properties[property] = value;
            }
        }

        return properties;
    };


    return (
        <>
            <div style={{ marginBottom: 15 }}>
                <div style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
                    {__('Desktop CSS', 'greenlightaddon')}
                </div>
                <TextareaControl
                    value={generateCSSForDevice(0)}
                    onChange={(value) => {
                        convertCSSToAttributesForDevice(value, 0)
                    }}
                    placeholder={__('Add properties in Style section below..', 'greenlightaddon')}
                />
            </div>

            <div style={{ marginBottom: 15 }}>
                <div style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
                    {__('Tablet CSS', 'greenlightaddon')}
                </div>
                <TextareaControl
                    value={generateCSSForDevice(1)}
                    onChange={(value) => {
                        convertCSSToAttributesForDevice(value, 1)
                    }}
                />
            </div>

            <div style={{ marginBottom: 15 }}>
                <div style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
                    {__('Landscape Mobile CSS', 'greenlightaddon')}
                </div>
                <TextareaControl
                    value={generateCSSForDevice(2)}
                    onChange={(value) => {
                        convertCSSToAttributesForDevice(value, 2)
                    }}

                />
            </div>

            <div style={{ marginBottom: 15 }}>
                <div style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
                    {__('Portrait Mobile CSS', 'greenlightaddon')}
                </div>
                <TextareaControl
                    value={generateCSSForDevice(3)}
                    onChange={(value) => {
                        convertCSSToAttributesForDevice(value, 3)
                    }}

                />
            </div>

            <div style={{ marginBottom: 15 }}>
                <div style={{ margin: '0 0 10px 0', fontSize: '13px' }}>
                    {__('Custom CSS', 'greenlightaddon')}
                </div>
                <TextareaControl
                    value={styleAttributes?.customCSS_Extra || ''}
                    onChange={(value) => {
                        const newStyleAttributes = { ...styleAttributes };
                        newStyleAttributes.customCSS_Extra = value;
                        setAttributes({ styleAttributes: newStyleAttributes })
                    }}

                />
            </div>

        </>
    );

}
export default CodeInspector;