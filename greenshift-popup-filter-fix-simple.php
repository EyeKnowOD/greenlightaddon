<?php
/**
 * Greenshift Popup Filter Fix - Simple Version
 *
 * Lightweight fix for interaction layer popups not working after AJAX filtering.
 * Add this to WP Code Snippets with "Only run on frontend" option.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_footer', 'greenshift_popup_filter_fix_simple', 100);

function greenshift_popup_filter_fix_simple() {
    ?>
    <script type="text/javascript">
    (function() {
        'use strict';

        // Target the specific grid container
        const gridSelector = '.gspbgrid_id-gsbp-drug-grid';
        const grid = document.querySelector(gridSelector);

        if (!grid) return;

        // Method 1: Use event delegation on the grid container
        // This ensures clicks work even after DOM replacement
        grid.addEventListener('click', function(e) {
            // Find the closest popup trigger
            const trigger = e.target.closest('[data-gspb-synced-popup], [data-interaction], .gspb-interaction-trigger');

            if (trigger) {
                // Get popup ID from various possible attributes
                const popupId = trigger.dataset.gspbSyncedPopup ||
                               trigger.dataset.interaction ||
                               trigger.dataset.popupId;

                if (popupId) {
                    // Try Greenshift's API first
                    if (window.gspb && window.gspb.showPopup) {
                        window.gspb.showPopup(popupId);
                    } else if (window.JESGSPB && window.JESGSPB.showPopup) {
                        window.JESGSPB.showPopup(popupId);
                    } else {
                        // Manual popup show
                        const popup = document.getElementById(popupId) ||
                                     document.querySelector('[data-popup-id="' + popupId + '"]');
                        if (popup) {
                            popup.classList.add('active', 'show');
                            popup.style.display = 'block';
                        }
                    }
                }
            }
        }, true);

        // Method 2: Observer to reinit after AJAX
        const observer = new MutationObserver(function(mutations) {
            let hasNewContent = false;

            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.classList &&
                            (node.classList.contains('gspbgrid_item') ||
                             node.querySelector && node.querySelector('.gspbgrid_item'))) {
                            hasNewContent = true;
                        }
                    });
                }
            });

            if (hasNewContent) {
                // Wait for DOM to settle
                setTimeout(reinitInteractions, 100);
            }
        });

        observer.observe(grid, { childList: true, subtree: true });

        function reinitInteractions() {
            // Try Greenshift's native reinit methods
            if (typeof window.gspb_interaction_init === 'function') {
                window.gspb_interaction_init();
            }

            // Try the gspblib approach
            if (window.gspblib && typeof window.gspblib.initInteractions === 'function') {
                window.gspblib.initInteractions();
            }

            // Trigger events that Greenshift might listen to
            document.dispatchEvent(new CustomEvent('gspb_grid_updated'));

            // jQuery fallback
            if (typeof jQuery !== 'undefined') {
                jQuery(document).trigger('gspb_filter_complete');
            }
        }

        // Also intercept jQuery AJAX for immediate reinit
        if (typeof jQuery !== 'undefined') {
            jQuery(document).ajaxComplete(function(event, xhr, settings) {
                if (settings.url && settings.url.includes('admin-ajax.php')) {
                    setTimeout(reinitInteractions, 150);
                }
            });
        }

    })();
    </script>
    <?php
}
