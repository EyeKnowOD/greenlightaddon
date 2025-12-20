<?php
/**
 * Greenshift Filter Fix v2.0 - Standalone PHP Snippet
 *
 * Add this to your theme's functions.php or use a Code Snippets plugin.
 *
 * Fixes:
 * 1. Sorting lost when filters applied (preserves sort in URL)
 * 2. Popups stop working after filter navigation
 *
 * How it works:
 * - Intercepts filter link clicks
 * - Injects current sorting value into URL before navigation
 * - Uses event delegation for popups (works with dynamic content)
 */

add_action('wp_footer', 'greenshift_filter_fix_script', 100);

function greenshift_filter_fix_script() {
    // Only load on frontend
    if (is_admin()) {
        return;
    }
    ?>
    <style>
    /* Popup visibility states */
    .gspb_popup, .gs-popup, .gspb_slidingpanel, .gs-sliding-panel {
        visibility: hidden;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .gspb_popup.is-active, .gspb_popup.gspb_popup_active,
    .gspb_slidingpanel.is-active, .gs-sliding-panel.is-active {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
    }
    body.gspb-popup-open { overflow: hidden; }
    .gspb_popup, .gs-popup { z-index: 999999 !important; }
    </style>

    <script>
    (function() {
        'use strict';

        var DEBUG = false;
        var STORAGE_KEY = 'gs_sort_value';

        function log() {
            if (DEBUG) console.log.apply(console, ['[GS-Fix]'].concat(Array.from(arguments)));
        }

        // ===============================
        // SORTING MANAGEMENT
        // ===============================

        var Sorting = {
            // Get current value from sorting dropdown
            getCurrentValue: function() {
                var select = document.querySelector('.gspb_filtersorting select, [class*="filtersorting"] select');
                return select ? select.value : null;
            },

            // Store in sessionStorage
            store: function(value) {
                if (value) {
                    try { sessionStorage.setItem(STORAGE_KEY, value); } catch(e) {}
                }
            },

            // Retrieve stored value
            retrieve: function() {
                try { return sessionStorage.getItem(STORAGE_KEY); } catch(e) { return null; }
            },

            // Add sort param to URL
            addToURL: function(url, sortValue) {
                if (!sortValue) return url;
                try {
                    var urlObj = new URL(url, window.location.origin);
                    // Check if already has sort param
                    var sortParams = ['orderby', 'order', 'gspb_sort', 'sort'];
                    var hasSort = sortParams.some(function(p) { return urlObj.searchParams.has(p); });
                    if (!hasSort) {
                        urlObj.searchParams.set('orderby', sortValue);
                    }
                    return urlObj.toString();
                } catch(e) {
                    return url;
                }
            },

            // Apply stored value to dropdown
            applyToDropdown: function() {
                var stored = this.retrieve();
                if (!stored) return;
                var select = document.querySelector('.gspb_filtersorting select, [class*="filtersorting"] select');
                if (select) {
                    var exists = Array.from(select.options).some(function(opt) { return opt.value === stored; });
                    if (exists) select.value = stored;
                }
            }
        };

        // ===============================
        // FILTER INTERCEPTION
        // ===============================

        // Intercept filter link clicks - add sorting to URL
        document.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            if (!link || !link.href) return;

            // Check if this is a filter link
            var isFilter = link.closest('.gspb_filterpanel, [class*="filterpanel"]') ||
                          link.href.indexOf('filter_') > -1 ||
                          link.href.indexOf('gspb_filter') > -1;

            if (isFilter) {
                var currentSort = Sorting.getCurrentValue();
                if (currentSort) {
                    e.preventDefault();
                    Sorting.store(currentSort);
                    var newURL = Sorting.addToURL(link.href, currentSort);
                    log('Redirecting with sort:', newURL);
                    window.location.href = newURL;
                }
            }
        }, true);

        // When sorting changes, update URL (for next filter click)
        document.addEventListener('change', function(e) {
            var select = e.target.closest('.gspb_filtersorting select, [class*="filtersorting"] select');
            if (select) {
                var value = select.value;
                Sorting.store(value);

                // Update current URL with sort param
                var url = new URL(window.location.href);
                url.searchParams.set('orderby', value);
                window.history.replaceState({}, '', url.toString());
                log('URL updated with sort:', value);
            }
        });

        // ===============================
        // POPUP MANAGEMENT
        // ===============================

        var Popups = {
            open: function(popup) {
                // Try native Greenshift first
                if (window.gspbHooks && window.gspbHooks.openPopup) {
                    window.gspbHooks.openPopup(popup);
                    return;
                }

                // Fallback
                popup.classList.add('is-active', 'gspb_popup_active');
                popup.style.cssText = 'display:block;visibility:visible;opacity:1';
                document.body.classList.add('gspb-popup-open');

                this.bindClose(popup);
            },

            close: function(popup) {
                popup.classList.remove('is-active', 'gspb_popup_active');
                popup.style.cssText = '';
                document.body.classList.remove('gspb-popup-open');
            },

            bindClose: function(popup) {
                var self = this;

                // Close button
                var closeBtn = popup.querySelector('.gspb_popup_close, [data-close], .popup-close');
                if (closeBtn) {
                    closeBtn.onclick = function(e) {
                        e.preventDefault();
                        self.close(popup);
                    };
                }

                // Overlay
                var overlay = popup.querySelector('.gspb_popup_overlay, .popup-overlay');
                if (overlay) {
                    overlay.onclick = function() { self.close(popup); };
                }

                // ESC key
                var escHandler = function(e) {
                    if (e.key === 'Escape') {
                        self.close(popup);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);
            },

            getIdFromTrigger: function(trigger) {
                var id = trigger.dataset.popup ||
                        trigger.dataset.sliding ||
                        trigger.dataset.slidingPanel ||
                        trigger.dataset.target;

                if (!id) {
                    var href = trigger.getAttribute('href');
                    if (href && href.charAt(0) === '#') {
                        id = href.substring(1);
                    }
                }

                return id;
            },

            reinit: function() {
                log('Reinitializing popups...');

                // Try Greenshift native methods
                try {
                    if (window.gspbHooks) {
                        if (window.gspbHooks.initPopups) window.gspbHooks.initPopups();
                        if (window.gspbHooks.initSlidingPanels) window.gspbHooks.initSlidingPanels();
                        if (window.gspbHooks.initAll) window.gspbHooks.initAll();
                    }
                    if (window.gspb && window.gspb.initInteractions) {
                        window.gspb.initInteractions();
                    }
                } catch(e) {}

                document.dispatchEvent(new CustomEvent('gspb_content_loaded'));
            }
        };

        // Event delegation for popup triggers - works for dynamic content
        document.addEventListener('click', function(e) {
            var trigger = e.target.closest('[data-popup], [data-sliding], .gspb_popup_trigger, [href^="#gspb_popup"]');
            if (!trigger) return;

            var popupId = Popups.getIdFromTrigger(trigger);
            if (!popupId) return;

            var popup = document.getElementById(popupId) ||
                       document.querySelector('[data-popup-id="' + popupId + '"]');

            if (popup) {
                e.preventDefault();
                e.stopPropagation();
                log('Opening popup:', popupId);
                Popups.open(popup);
            }
        }, true);

        // ===============================
        // INITIALIZATION
        // ===============================

        function init() {
            log('Greenshift Filter Fix v2.0 initialized');
            Sorting.applyToDropdown();
            Popups.reinit();
        }

        // Run on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        // Run again on window load
        window.addEventListener('load', function() {
            setTimeout(function() {
                Sorting.applyToDropdown();
                Popups.reinit();
            }, 500);
        });

        // Handle back/forward navigation
        window.addEventListener('popstate', function() {
            Sorting.applyToDropdown();
            Popups.reinit();
        });

        // Expose for debugging
        window.GSFilterFix = {
            version: '2.0.0',
            debug: function(on) { DEBUG = on; },
            sorting: Sorting,
            popups: Popups,
            reinit: function() { Popups.reinit(); }
        };

    })();
    </script>
    <?php
}
