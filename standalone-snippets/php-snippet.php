<?php
/**
 * Greenshift Filter Fix - Standalone PHP Snippet
 *
 * Add this to your theme's functions.php or use a Code Snippets plugin.
 *
 * Fixes:
 * 1. Sorting resets after applying filters
 * 2. Popups stop working after AJAX content replacement
 */

add_action('wp_footer', 'greenshift_filter_fix_inline_script', 100);

function greenshift_filter_fix_inline_script() {
    // Only load on frontend
    if (is_admin()) {
        return;
    }
    ?>
    <style>
    /* Popup visibility fixes */
    .gspb_popup, .gs-popup, .gspb_slidingpanel, .gs-sliding-panel {
        visibility: hidden;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .gspb_popup.is-active, .gspb_popup.gs-popup-active, .gspb_popup.gspb_popup_active,
    .gs-popup.is-active, .gspb_slidingpanel.is-active, .gs-sliding-panel.is-active {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
    }
    body.gs-popup-open, body.gspb-popup-open { overflow: hidden; }
    .gspb_popup, .gs-popup { z-index: 999999 !important; }
    </style>

    <script>
    (function() {
        'use strict';

        var debug = false;

        function log() {
            if (debug) console.log.apply(console, ['[GS-Fix]'].concat(Array.from(arguments)));
        }

        // ===============================
        // POPUP REINITIALIZATION
        // ===============================

        function reinitPopups() {
            log('Reinitializing popups...');

            // Try Greenshift's native reinitialization
            if (typeof window.gspbHooks !== 'undefined') {
                if (typeof window.gspbHooks.initPopups === 'function') window.gspbHooks.initPopups();
                if (typeof window.gspbHooks.initSlidingPanels === 'function') window.gspbHooks.initSlidingPanels();
                if (typeof window.gspbHooks.initAll === 'function') window.gspbHooks.initAll();
            }

            if (typeof window.gspb !== 'undefined' && typeof window.gspb.initInteractions === 'function') {
                window.gspb.initInteractions();
            }

            // Trigger custom events
            document.dispatchEvent(new CustomEvent('gspb_content_loaded'));
            document.dispatchEvent(new CustomEvent('gspb_ajax_complete'));
        }

        function openPopup(popup) {
            popup.classList.add('is-active', 'gs-popup-active', 'gspb_popup_active');
            popup.style.display = 'block';
            popup.style.visibility = 'visible';
            popup.style.opacity = '1';
            document.body.classList.add('gs-popup-open', 'gspb-popup-open');

            // Bind close handlers
            var closeBtn = popup.querySelector('.gs-popup-close, .gspb_popup_close, [data-close]');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() { closePopup(popup); }, { once: true });
            }

            var overlay = popup.querySelector('.gs-popup-overlay, .gspb_popup_overlay');
            if (overlay) {
                overlay.addEventListener('click', function() { closePopup(popup); }, { once: true });
            }
        }

        function closePopup(popup) {
            popup.classList.remove('is-active', 'gs-popup-active', 'gspb_popup_active');
            popup.style.display = '';
            popup.style.visibility = '';
            popup.style.opacity = '';
            document.body.classList.remove('gs-popup-open', 'gspb-popup-open');
        }

        // ===============================
        // EVENT DELEGATION (Works for dynamic content)
        // ===============================

        document.addEventListener('click', function(e) {
            var trigger = e.target.closest('[data-popup], [data-sliding-panel], .gspb_popup_trigger, .gs-popup-trigger');
            if (!trigger) return;

            var popupId = trigger.dataset.popup ||
                          trigger.dataset.slidingPanel ||
                          trigger.dataset.target;

            if (!popupId) {
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
                    log('Opening popup:', popupId);

                    // Try native method first
                    if (typeof window.gspbHooks !== 'undefined' && window.gspbHooks.openPopup) {
                        window.gspbHooks.openPopup(popup);
                    } else if (typeof window.gspb !== 'undefined' && window.gspb.popup && window.gspb.popup.open) {
                        window.gspb.popup.open(popup);
                    } else {
                        openPopup(popup);
                    }
                }
            }
        }, true);

        // ===============================
        // SORTING PRESERVATION
        // ===============================

        var sortingStates = {};

        // Store sorting changes
        document.addEventListener('change', function(e) {
            var sortSelect = e.target.closest('.gspb_filtersorting select, .gs-filter-sorting select');
            if (sortSelect) {
                var key = window.location.pathname;
                sortingStates[key] = sortSelect.value;
                try {
                    sessionStorage.setItem('gs_sorting_state', JSON.stringify(sortingStates));
                } catch(err) {}
                log('Sorting stored:', sortSelect.value);
            }
        });

        // Restore on load
        try {
            var saved = sessionStorage.getItem('gs_sorting_state');
            if (saved) sortingStates = JSON.parse(saved);
        } catch(err) {}

        // ===============================
        // AJAX INTERCEPTION
        // ===============================

        // Intercept fetch
        var originalFetch = window.fetch;
        window.fetch = function() {
            return originalFetch.apply(this, arguments).then(function(response) {
                var url = arguments[0] && arguments[0].url ? arguments[0].url : arguments[0];
                if (url && (url.includes('admin-ajax') || url.includes('gspb') || url.includes('filter'))) {
                    setTimeout(reinitPopups, 150);
                }
                return response;
            });
        };

        // Intercept XHR
        var origOpen = XMLHttpRequest.prototype.open;
        var origSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url) {
            this._gsUrl = url;
            return origOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
            var self = this;
            if (this._gsUrl && (this._gsUrl.includes('admin-ajax') || this._gsUrl.includes('gspb'))) {
                this.addEventListener('load', function() {
                    setTimeout(reinitPopups, 150);
                });
            }
            return origSend.apply(this, arguments);
        };

        // ===============================
        // DOM OBSERVER (Backup method)
        // ===============================

        var observer = new MutationObserver(function(mutations) {
            for (var i = 0; i < mutations.length; i++) {
                if (mutations[i].addedNodes.length > 0) {
                    var target = mutations[i].target;
                    if (target.classList &&
                        (target.classList.contains('gspb_query_builder') ||
                         target.classList.contains('wp-block-flavor-query'))) {
                        setTimeout(reinitPopups, 200);
                        break;
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // ===============================
        // GREENSHIFT EVENTS
        // ===============================

        ['gspb_filter_applied', 'gspb_filter_complete', 'gspb_pagination_complete',
         'gsquery_loaded', 'flavor_filter_complete'].forEach(function(eventName) {
            document.addEventListener(eventName, function() {
                setTimeout(reinitPopups, 150);
            });
        });

        // ===============================
        // INITIAL SETUP
        // ===============================

        window.addEventListener('load', function() {
            setTimeout(reinitPopups, 500);
        });

        // Expose for debugging
        window.GSFilterFix = {
            reinit: reinitPopups,
            debug: function(on) { debug = on; },
            openPopup: openPopup,
            closePopup: closePopup
        };

        log('Greenshift Filter Fix initialized');

    })();
    </script>
    <?php
}
