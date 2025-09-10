import { __ } from '@wordpress/i18n';
import edit from './edit';
import save from './save';
import {registerBlockType} from '@wordpress/blocks';
import blockIcon from './icon';
import './styles.editor.scss';
import attributes from './attributes';

registerBlockType( 'greenlightaddon/example', {
    category: 'greenlightaddon',
    icon: blockIcon,
    example: {},
    title: __('Example Greenlight Block', 'greenlightaddon'),
    description: __('Example block', 'greenlightaddon'),
    keywords: [],
    attributes,
    edit,
    save
});