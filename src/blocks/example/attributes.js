/**
 * Set the block attributes
 * @type {Object}
 */
const { collectionsObjects } = gspblib.helpers;
export default {
	id: {
		type: 'string',
		default: null,
	},
    localId: {
		type: 'string',
	},
	staticLocalId: {
		type: 'boolean',
	},
	localClassInstance: {
		type: 'string',
	},
	anchor: {
		type: 'string',
	},
	inlineCssStyles: {
		type: 'string',
	},
	dynamicGClasses: {
		type: "array",
	},        
    interactionLayers: {
		type: "array",
	},
	textContent: {
		type: 'string',
		default: '',
		role: "content"
	},
	animation: {
		type: 'object',
		default: collectionsObjects.animation,
	},
	icon: {
		type: 'object',
	},
	className: {
		type: 'string',
	},
	styleAttributes: {
		type: 'object',
	},
	enableSpecificity: {
		type: 'boolean',
	},
    color: {
		type: 'string',
	},
	unitArray: {
		type: 'array',
	},
};
