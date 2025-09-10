// WordPress dependencies
const { __ } = wp.i18n;
const { useRef, useEffect } = wp.element;
const { RichText, useBlockProps } = wp.blockEditor;

// Greenlight dependencies
const { gspb_setBlockId, getDataAttributesfromDynamic } = gspblib.utilities;
const {
	aos_animation_cssGen,
	gspb_Css_Final,
	getFinalCssFromDynamicLocalClasses,
	getCssFromStyleAttributes,
} = gspblib.utilities;
const { gspb_cssGen } = gspblib.helpers;
const { BlockToolBar } = gspblib.components;
const { AnimationRenderProps } = gspblib.collections;
const { AnimationWrapper } = gspblib.collections;
const { gspb_convert_styles_for_editor } = gspblib.helpers;
const { SVGViewer } = gspblib.components;

// Inspector
import Inspector from './inspector';

export default function edit(props) {

	const {
		id,
		localId,
		animation,
		styleAttributes,
		textContent,
		enableSpecificity,
		color,
		unitArray,
		interactionLayers,
		anchor,
		icon
	} = props.attributes;

	// Generate Unique ID for The Block. Id is always unique for each block.
	useEffect(() => {
		gspb_setBlockId(props, 2);
	}, []);

	// Set Root class for the block (stored in localId). Root class can be similar in several blocks
	useEffect(() => {
		if (id != null) {
			if (props.attributes.localId && props.attributes.localId == id) {
				//do nothing
			} else {
				if (props.attributes.staticLocalId && props.attributes.localId) {
					//do nothing
				} else {
					props.setAttributes({ localId: id });
				}
			}
		}
	}, [id]);

	// Render Icon Box
	let iconBox = icon ? JSON.parse(JSON.stringify(icon)) : null;

	//Render Animation Properties for Animation Panel support
	const animationRef = useRef();
	let AnimationProps = {};
	AnimationProps = AnimationRenderProps(animation, interactionLayers);

	// Get Dynamic Data Attributes for Dynamic Data Panel support (Class panel)
	let DynamicDataAttributes = getDataAttributesfromDynamic(props);

	// Set Block Props for the block
	let blockProps = useBlockProps({
		"data-gspb-block-id": props.attributes.id,
		className: `gspb-selector-element ${localId ? localId : ''}`,
		ref: animationRef,
		...DynamicDataAttributes,
		...AnimationProps
	});

	let css_selector_by_user = '.' + localId;
	let final_css = '';
	// Get Final CSS from Dynamic Local Classes
	final_css = getFinalCssFromDynamicLocalClasses(props, final_css);

	let local_css = '';
	// Get CSS from Style Attributes
	if (styleAttributes) {
		local_css = getCssFromStyleAttributes(styleAttributes, css_selector_by_user, local_css, enableSpecificity);
	}
	if (local_css != '') {
		final_css += local_css;
	}

	// Animation CSS Generation
	final_css = aos_animation_cssGen(
		animation,
		css_selector_by_user,
		final_css,
		props
	);

	// Example for Device Related custom CSS Generation
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
		],
		final_css
	);

	// Example for non Device Related custom CSS Generation
	final_css = gspb_cssGen(
		css_selector_by_user,
		['color'],
		[color],
		final_css
	);

	let ElementTag = 'div';

	if (anchor) {
		blockProps.id = anchor;
	}

	// Get Final CSS for Editor. Attach editor-styles-wrapper to the block in editor.
	let editor_css = final_css;
	editor_css = gspb_convert_styles_for_editor(editor_css);

	// Set Stored CSS
	gspb_Css_Final(id, final_css, props);

	return (
		<>
			<AnimationWrapper attributes={props.attributes} props={props} animationExtRef={animationRef}>
				{props.isSelected &&
					<>
						<Inspector {...props} />
						<BlockToolBar {...props} />
					</>
				}
				<ElementTag {...blockProps}>
					<RichText
						tagName={'span'}
						placeholder={__("Greenlight - Page-Building Gutenberg Blocks", 'greenlightaddon')}
						value={textContent}
						onChange={(value) => {
							props.setAttributes({ textContent: value });
						}}
					/>
					{iconBox &&
						<SVGViewer attributeName="icon" blockProps={blockProps} {...props} />
					}
					{editor_css && (
						<style
							dangerouslySetInnerHTML={{
								__html: editor_css,
							}}
						/>
					)}
				</ElementTag>
			</AnimationWrapper>
		</>
	);

}