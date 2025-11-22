<?php

/**
 * Plugin Name: GreenLight Boilerplate Addon
 * Description: Extend your blocks with GreenLight high quality library and performance
 * Author: GreenLight Builder
 * Author URI: https://greenlightbuilder.pro
 * Version: 0.1
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
	exit;
}

// Define Dir URL
define('GREENLIGHTADDON_DIR_URL', plugin_dir_url(__FILE__));
define('GREENLIGHTADDON_DIR_PATH', plugin_dir_path(__FILE__));


function gspb_greenLightAddon_is_parent_active()
{
	$active_plugins = get_option('active_plugins', array());

	if (is_multisite()) {
		$network_active_plugins = get_site_option('active_sitewide_plugins', array());
		$active_plugins         = array_merge($active_plugins, array_keys($network_active_plugins));
	}

	foreach ($active_plugins as $basename) {
		if (
			0 === strpos($basename, 'gl-page-builder/') || 0 === strpos($basename, 'greenshift-animation-and-page-builder-blocks/')
		) {
			return true;
		}
	}

	return false;
}

if (gspb_greenLightAddon_is_parent_active()) {
	add_action('enqueue_block_editor_assets', 'greenLightAddon_editor_assets');
} else {
	add_action('admin_notices', 'gspb_greenLightAddon_admin_notice_warning');
}
//////////////////////////////////////////////////////////////////
// Show if parent is not loaded
//////////////////////////////////////////////////////////////////
function gspb_greenLightAddon_admin_notice_warning()
{
?>
	<div class="notice notice-warning">
		<p><?php printf(__('Please, activate %s plugin to use Boilerplate Addon'), '<a href="https://greenlightbuilder.pro" target="_blank">GreenLight Builder</a>'); ?></p>
	</div>
<?php
}

/**
 * GreenShift Blocks Category
 */
if (!function_exists('gspb_greenLightAddon_category')) {
	function gspb_greenLightAddon_category($categories, $post)
	{
		return array_merge(
			array(
				array(
					'slug'  => 'greenLightAddon',
					'title' => __('GreenLight Addon'),
				),
			),
			$categories
		);
	}
}
add_filter('block_categories_all', 'gspb_greenLightAddon_category', 1, 2);

//////////////////////////////////////////////////////////////////
// Enqueue Gutenberg block assets for backend editor.
//////////////////////////////////////////////////////////////////

if (!function_exists('greenLightAddon_editor_assets')) {
	function greenLightAddon_editor_assets()
	{
		// phpcs:ignor

		$index_asset_file = include(GREENLIGHTADDON_DIR_PATH . 'build/index.asset.php');


		// Blocks Assets Scripts
		wp_enqueue_script(
			'greenLightAddon-block-js', // Handle.
			GREENLIGHTADDON_DIR_URL . 'build/index.js',
			array('greenShift-editor-js', 'greenShift-library-script', 'wp-block-editor', 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 'wp-data'),
			rand(1, 9999),
			true
		);


		// Styles.
		wp_enqueue_style(
			'greenLightAddon-block-css', // Handle.
			GREENLIGHTADDON_DIR_URL . 'build/index.css', // Block editor CSS.
			array('greenShift-library-editor', 'wp-edit-blocks'),
			$index_asset_file['version']
		);
	}
}

//////////////////////////////////////////////////////////////////
// Register server side functions
//////////////////////////////////////////////////////////////////
require_once GREENLIGHTADDON_DIR_PATH . 'blockrender/example/block.php';


//////////////////////////////////////////////////////////////////
// Functions to render conditional scripts
//////////////////////////////////////////////////////////////////


// Conditional scripts and frontend render
add_filter('render_block', 'greenLightAddon_block_script_assets', 10, 2);
if (!function_exists('greenLightAddon_block_script_assets')) {
	function greenLightAddon_block_script_assets($html, $block)
	{
		// phpcs:ignore


		if (!is_admin()) {

		}

		return $html;
	}
}

//////////////////////////////////////////////////////////////////
// Remove counter from Greenshift filter dropdown options
//////////////////////////////////////////////////////////////////
add_action('wp_footer', 'greenLightAddon_remove_filter_counter');
if (!function_exists('greenLightAddon_remove_filter_counter')) {
	function greenLightAddon_remove_filter_counter()
	{
		?>
		<script>
		document.addEventListener('DOMContentLoaded', function() {
			// Target the specific filter or all Greenshift select filters
			var selects = document.querySelectorAll('.gspb-filterpanel select, .gspb-select');

			selects.forEach(function(select) {
				var options = select.querySelectorAll('option');
				options.forEach(function(option) {
					// Remove counter pattern like "(3)" or "(0)" from end of text
					var text = option.textContent;
					option.textContent = text.replace(/\s*\(\d+\)\s*$/, '').trim();
				});
			});
		});
		</script>
		<?php
	}
}