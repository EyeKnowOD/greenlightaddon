/**
 *
 * Inspector Component.
 *
*/

// Import dependencies
const { __ } = wp.i18n;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, TextareaControl, Popover } = wp.components;
const { useState } = wp.element;
import isEqual from 'lodash/isEqual';
import attributesDefault from './attributes';
import PlaceholdersPopover from './placeholders.js';
import CodeInspector from './codeinspector';


// Import blockypage dependencies
const {
	Animation,
	InteractionsPanel,
	IconPicker,
	AttributeTabs
} = gspblib.collections;
const { BlpgeColorPicker, UnitControl,GlobalClasses } = gspblib.components;
const { collectionsObjects } = gspblib.helpers;
const { gspb_getDeviceStateIndex } = gspblib.utilities;
const { Devices } = gspblib.components;
const { gspb_inherit_values } = gspblib.helpers;

const Inspector = (props) => {
	const {
		attributes: {
			textContent,
			anchor,
			styleAttributes,
			icon,
			localId,
			staticLocalId,
			enableSpecificity,
			color,
			unitArray,
		},
		setAttributes,
	} = props;

	// Get Device state
	const deviceStateIndex = gspb_getDeviceStateIndex();
	const [openPopupArray, setToolbarPopup] = useState({});
	const [isCodeInspectorVisible, setIsCodeInspectorVisible] = useState(false);
	const [devstate, setdevState] = useState(0);


	const iconBox = icon ? JSON.parse(JSON.stringify(icon)) : JSON.parse(JSON.stringify(collectionsObjects.iconPicker));


	let animationchange = isEqual(attributesDefault.animation.default, props.attributes.animation) ? false : true;
	let interactionchange = (typeof props.attributes.interactionLayers != 'undefined' && props.attributes.interactionLayers.length > 0) ? true : false;


	return (
		<>
			<InspectorControls>
				<div className="gspb_inspector gst-elements-inspector glfw-inspector">
					<GlobalClasses flexChild={true} {...props} />
					<PanelBody title={__("General", "greenlightaddon")} initialOpen={true}>
						<div className='gspb_right_abs_btn'>
							<div>
								<div style={{ display: "flex", gap: "5px", position: "absolute", top: "-5px", right: 0 }}>
									<button
										onClick={() => {
											setToolbarPopup({ ...openPopupArray, ["dynamic-placeholders-content"]: !openPopupArray["dynamic-placeholders-content"] });
										}}
										className="gspb_inspector_btn"
										style={{ padding: "4.5px", fontSize: 10, margin: 0 }}
									>
										{__("Placeholders", 'greenlightaddon')}
									</button>
								</div>
								{openPopupArray && openPopupArray["dynamic-placeholders-content"] &&
									<Popover
										popoverProps={{ position: 'bottom right' }}
										onClose={() => {
											setToolbarPopup({ ...openPopupArray, ["dynamic-placeholders-content"]: false });
										}}
									>
										<div className="gspb_inspector_preset_styles gspb_inspector_preset_border_styles" style={{ minWidth: 260, padding: 10 }}>
											<span style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5, marginTop: 5 }}>{__("Dynamic Placeholders", 'greenlightaddon')}</span>
											<div style={{ width: 340, display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
												<PlaceholdersPopover function_callback={(placeholder) => {
													setAttributes({ textContent: textContent + placeholder });
												}} />
											</div>
										</div>
									</Popover>
								}
								<TextareaControl
									label={__('Content', 'greenlightaddon')}
									value={textContent}
									onChange={value => setAttributes({ textContent: value })}
								/>

							</div>

						</div>
					</PanelBody>
					<PanelBody
						title={
							<div className="gspb-inspector-flex-row gs-flex-space-between gs-gutter-10 gs-flex-align-center" style={{ width: '100%' }}>
								{__('Local Styles', 'greenlightaddon')}
								<div className="gspb-inspector-flex-row gs-flex-space-between gs-gutter-10 gs-flex-align-center">
									<button className="gspb_inspector_btn gspb_inspector_btn--small" style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0, margin: 0, transform: 'translateX(5px)', color: enableSpecificity ? '#2084f9' : '#6c757d' }}
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											setIsCodeInspectorVisible(!isCodeInspectorVisible);
										}}
									>
										<i className="rhicon rhi-code" style={{ marginLeft: 0, marginRight: 0 }} title={__('Show CSS code', 'greenlightaddon')}></i>
									</button>
									<button className="gspb_inspector_btn gspb_inspector_btn--small" style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0, margin: 0, transform: 'translateX(5px)', color: enableSpecificity ? '#2084f9' : '#6c757d' }}
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											setAttributes({ enableSpecificity: !enableSpecificity });
										}}
									>
										<i className="rhicon rhi-dot-circle" style={{ marginLeft: 0, marginRight: 0 }} title={__('Enable higher specificity for local styles', 'greenlightaddon')}></i>
									</button>
								</div>

							</div>
						} initialOpen={(typeof greenShift_params.hide_local_styles != 'undefined' && greenShift_params.hide_local_styles == '1') ? false : true} className="gst-inspector-tab gst-elements-styles">
						<>
							{
								isCodeInspectorVisible &&
								<CodeInspector {...props} final_css={props.final_css} localId={localId} setAttributes={setAttributes} styleAttributes={styleAttributes} />
							}
							<AttributeTabs
								attributeName="styleAttributes"
								{...props}
								defaultTab={''}
								includes={['typography', 'color', 'spacing', 'shadow', 'border', 'position', 'size', 'layout', 'effects', 'csstransform', 'responsive']} svgcolors={true} selfAlign={"both"}
							/>
						</>

					</PanelBody>
					<PanelBody
						title={__("Icon Component", 'greenlightaddon')}
						initialOpen={false}
					>
						<IconPicker
							icon={iconBox}
							options={false}
							{...props}
							onChange={(icon) => {
								setAttributes({ icon: icon });
							}}
						/>
					</PanelBody>
					<PanelBody
						title={__("Extra Components", 'greenlightaddon')}
						initialOpen={false}
					>
						<div style={{ justifyContent: "flex-end", marginBottom: 10, display: "flex" }}>
							<Devices
								className=""
								onChange={() =>
									setdevState(!devstate)
								}
							/>
						</div>
						<div className="gspb-inspector-flex-row gs-flex-space-between gs-gutter-10 gs-child-width-9/3 gs-inspector-margin-bottom-5 gs-flex-align-center">
							<div className='gspb-inspector-flex-row gs-flex-space-between gs-gutter-10 gs-flex-align-center'>
								{__("Color", "greenlightaddon")}
							</div>
							<div
								className="gspb_text_align_right"
							>
								<BlpgeColorPicker
									color={color}
									onChange={(value) => {
										setAttributes({ color: value });
									}}

								/>
							</div>
						</div>
						<div className="gspb-inspector-flex-row gs-flex-space-between gs-gutter-10 gs-child-width-half gs-inspector-margin-bottom-5 gs-flex-align-center">
							<div>
								{__("Font Size", "greenlightaddon")}
							</div>
							<div>
							<UnitControl
								value={gspb_inherit_values(unitArray, deviceStateIndex)}
								onChange={(value) => {
									let currentValue = unitArray ? unitArray.slice() : [];
									currentValue[
										deviceStateIndex
									] = value;
									setAttributes({
										unitArray: currentValue,
									});
								}}
							/>
							</div>
						</div>
					</PanelBody>
					<PanelBody
						title={__("Animation", 'greenlightaddon')}
						initialOpen={false}
						className={`${!animationchange ? '' : 'gspb_panel_changed'}`}
					>
						<Animation
							attributeName="animation"
							{...props}
						/>
					</PanelBody>
					<PanelBody
						title={__("Interaction Layers", 'greenlightaddon')}
						initialOpen={false}
						className={`${interactionchange ? 'gspb_panel_changed' : ''}`}
					>
						<InteractionsPanel {...props} />
					</PanelBody>

					<PanelBody
						title={__("Anchor & Root Class", 'greenlightaddon')}
						initialOpen={false}
						className={`${(anchor || staticLocalId) ? 'gspb_panel_changed' : ''}`}
					>
						<TextareaControl
							label={__('Anchor', 'greenlightaddon')}
							help={__("Set an anchor (ID) for this element. Available placeholders: {POST_ID}", 'greenlightaddon')}
							value={anchor}
							onChange={value => {
								let newvalue = value.trim(); // Remove leading and trailing spaces
								setAttributes({ anchor: newvalue })
							}}
						/>
					</PanelBody>
				</div>
			</InspectorControls>
		</>
	);

}
export default Inspector;
