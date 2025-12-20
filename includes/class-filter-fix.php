<?php
/**
 * Greenshift Filter & Popup Fix
 *
 * Fixes sorting persistence and popup reinitialization after AJAX filtering
 *
 * @package GreenlightAddon
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Greenlight_Filter_Fix {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Enqueue assets
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'), 100);

        // Add data attributes to query loops for popup connection
        add_filter('render_block', array($this, 'add_popup_data_attributes'), 10, 2);

        // Hook into Greenshift's AJAX filter response
        add_filter('gspb_filter_ajax_response', array($this, 'preserve_sorting_in_response'), 10, 2);

        // Alternative hook for Query addon
        add_filter('flavor_query_ajax_response', array($this, 'preserve_sorting_in_response'), 10, 2);

        // Add inline script for immediate initialization
        add_action('wp_footer', array($this, 'add_inline_init_script'), 100);
    }

    /**
     * Enqueue frontend assets
     */
    public function enqueue_assets() {
        // Only load on pages with Greenshift query blocks
        if (!$this->has_greenshift_query_block()) {
            return;
        }

        $plugin_url = GREENLIGHTADDON_DIR_URL;
        $version = defined('GREENLIGHTADDON_VERSION') ? GREENLIGHTADDON_VERSION : '1.0.0';

        // Enqueue CSS
        wp_enqueue_style(
            'greenlight-filter-fix',
            $plugin_url . 'assets/css/greenshift-filter-fix.css',
            array(),
            $version
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'greenlight-filter-fix',
            $plugin_url . 'assets/js/greenshift-filter-fix.js',
            array('jquery'), // jQuery as dependency for compatibility
            $version,
            true // Load in footer
        );

        // Pass configuration to JavaScript
        wp_localize_script('greenlight-filter-fix', 'gsFilterFixConfig', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('gs_filter_fix'),
            'debug' => WP_DEBUG,
            'selectors' => array(
                'queryLoop' => '.gspb_query_builder, .wp-block-flavor-query',
                'filterPanel' => '.gspb_filterpanel',
                'filterSorting' => '.gspb_filtersorting, .gs-filter-sorting',
                'popup' => '.gspb_popup, .gs-popup',
            )
        ));
    }

    /**
     * Check if current page has Greenshift query blocks
     */
    private function has_greenshift_query_block() {
        global $post;

        // Always return true for now - let CSS/JS handle detection
        // This prevents issues with dynamic content
        return true;

        // More specific check (optional):
        // if ($post && has_block('flavor/query', $post)) {
        //     return true;
        // }
        // return false;
    }

    /**
     * Add data attributes to blocks for popup connections
     */
    public function add_popup_data_attributes($block_content, $block) {
        // Check if this is a query loop item
        if (!isset($block['blockName'])) {
            return $block_content;
        }

        $query_blocks = array(
            'flavor/query',
            'flavor/queryitem',
            'greenshift-query/query',
            'gspb/query-builder',
        );

        if (in_array($block['blockName'], $query_blocks, true)) {
            // Add data attribute for JavaScript hooks
            $block_content = preg_replace(
                '/class="([^"]*)(gspb_query|gs-query|wp-block-flavor-query)/',
                'data-gs-filterable="true" class="$1$2',
                $block_content,
                1
            );
        }

        return $block_content;
    }

    /**
     * Preserve sorting parameters in AJAX response
     */
    public function preserve_sorting_in_response($response, $request_data) {
        // Check if sorting was specified in the request
        if (!empty($request_data['sorting']) || !empty($request_data['orderby'])) {
            // Ensure sorting is included in response data
            if (is_array($response)) {
                $response['sorting'] = array(
                    'orderby' => isset($request_data['orderby']) ? $request_data['orderby'] : '',
                    'order' => isset($request_data['order']) ? $request_data['order'] : 'DESC',
                    'meta_key' => isset($request_data['meta_key']) ? $request_data['meta_key'] : '',
                );
            }
        }

        return $response;
    }

    /**
     * Add inline script for immediate initialization
     */
    public function add_inline_init_script() {
        if (!$this->has_greenshift_query_block()) {
            return;
        }
        ?>
        <script type="text/javascript">
        (function() {
            // Immediate popup trigger fix using event delegation
            document.addEventListener('click', function(e) {
                var trigger = e.target.closest('[data-popup], [data-sliding-panel], .gspb_popup_trigger');
                if (!trigger) return;

                var popupId = trigger.dataset.popup ||
                              trigger.dataset.slidingPanel ||
                              trigger.dataset.target;

                if (!popupId) {
                    // Try to get from href
                    var href = trigger.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        popupId = href.substring(1);
                    }
                }

                if (popupId) {
                    var popup = document.getElementById(popupId) ||
                                document.querySelector('[data-popup-id="' + popupId + '"]');

                    if (popup) {
                        e.preventDefault();
                        e.stopPropagation();

                        // Try native Greenshift method first
                        if (typeof window.gspbHooks !== 'undefined' && window.gspbHooks.openPopup) {
                            window.gspbHooks.openPopup(popup);
                        } else if (typeof window.gspb !== 'undefined' && window.gspb.popup) {
                            window.gspb.popup.open(popup);
                        } else {
                            // Fallback: toggle active class
                            popup.classList.add('is-active', 'gspb_popup_active');
                            popup.style.display = 'block';
                            popup.style.visibility = 'visible';
                            popup.style.opacity = '1';
                            document.body.classList.add('gspb-popup-open');
                        }
                    }
                }
            }, true);

            // Listen for Greenshift AJAX completion
            var originalFetch = window.fetch;
            window.fetch = function() {
                return originalFetch.apply(this, arguments).then(function(response) {
                    // Trigger reinitialization after any fetch
                    setTimeout(function() {
                        if (typeof window.GSFilterFix !== 'undefined') {
                            window.GSFilterFix.reinit();
                        }
                    }, 200);
                    return response;
                });
            };
        })();
        </script>
        <?php
    }
}

// Initialize
Greenlight_Filter_Fix::get_instance();
