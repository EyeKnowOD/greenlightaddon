// Import wp dependencies
const { __ } = wp.i18n;
const { RichText } = wp.blockEditor;

import isEqual from 'lodash/isEqual';

// Import block dependencies
import attributes from './attributes';


const {
    getDataAttributesfromDynamic,
} = gspblib.utilities;
const { AnimationRenderProps } = gspblib.collections;
const { SVGViewer } = gspblib.components;

export default function save(props) {
    const {
        anchor,
        textContent,
        localId,
        animation,
        interactionLayers,
        styleAttributes,
      
    } = props.attributes;

    let DynamicDataAttributes = getDataAttributesfromDynamic(props);

    let AnimationProps = {};
    AnimationProps = AnimationRenderProps(animation, interactionLayers);

    let ElementTag = 'div';
    const blockProps = {
        ...DynamicDataAttributes,
        ...AnimationProps,
        className: props.attributes.className || null,
    };
    if (localId && (styleAttributes || !isEqual(animation, attributes.animation.default))) {
        if (blockProps.className) {
            blockProps.className = blockProps.className + ' ' + localId;
        } else {
            blockProps.className = localId;
        }
    }
    if (anchor) {
        blockProps.id = anchor;
    }


    return (
        <>
            <ElementTag {...blockProps}>
                <RichText.Content value={textContent} />
                <SVGViewer attributeName="icon" attributeText="textPathAttributes" blockProps={blockProps} {...props} />
            </ElementTag>
        </>
    );
}