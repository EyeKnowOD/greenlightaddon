<?php
/**
 * Greenshift Popup Filter Fix
 *
 * This snippet fixes the issue where interaction layer popups stop working
 * after applying filters in Greenshift query grids.
 *
 * Add this code to WP Code Snippets plugin with "Run snippet everywhere" or
 * "Only run on frontend" option enabled.
 *
 * Problem: When Greenshift's AJAX filter replaces DOM elements, popup event
 * handlers are lost because they were bound to the original elements.
 *
 * Solution: Re-initialize Greenshift's interaction handlers after AJAX completes.
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enqueue the popup fix script on frontend
 */
add_action('wp_footer', 'greenshift_popup_filter_fix_script', 100);

function greenshift_popup_filter_fix_script() {
    // Only load on pages that might have Greenshift filter grids
    ?>
    <script type="text/javascript">
    (function() {
        'use strict';

        /**
         * Greenshift Popup Filter Fix
         * Re-initializes interaction layers after AJAX filter updates
         */
        const GS_PopupFilterFix = {

            // Configuration
            config: {
                // Selectors for the grid containers that get filtered
                gridSelectors: [
                    '.gspbgrid_list_builder',
                    '.wp-block-greenshift-blocks-querygrid',
                    '[class*="gspbgrid_id-"]'
                ],
                // Selector for filter loader (indicates AJAX in progress)
                loaderSelector: '.gspb-filter-post-loader-container',
                // Debounce delay for mutation observer (ms)
                debounceDelay: 100,
                // Debug mode
                debug: false
            },

            // State
            debounceTimer: null,
            observer: null,

            /**
             * Initialize the fix
             */
            init: function() {
                this.log('Initializing Greenshift Popup Filter Fix');

                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => this.setup());
                } else {
                    this.setup();
                }
            },

            /**
             * Setup observers and event listeners
             */
            setup: function() {
                // Method 1: MutationObserver to watch for DOM changes in grid containers
                this.setupMutationObserver();

                // Method 2: Listen for Greenshift's custom AJAX events
                this.setupAjaxListeners();

                // Method 3: Override fetch/XHR to detect AJAX completion
                this.setupAjaxInterceptor();

                this.log('Setup complete');
            },

            /**
             * Setup MutationObserver to watch grid containers
             */
            setupMutationObserver: function() {
                const self = this;

                this.observer = new MutationObserver(function(mutations) {
                    let shouldReinit = false;

                    mutations.forEach(function(mutation) {
                        // Check if nodes were added to a grid container
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            // Check if this mutation is within a grid container
                            const target = mutation.target;
                            if (self.isGridElement(target) || self.hasGridParent(target)) {
                                shouldReinit = true;
                            }
                        }

                        // Check for class changes on loader (loading state changes)
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            const target = mutation.target;
                            if (target.classList.contains('gspb-filter-post-loader-container')) {
                                // Loader class changed - check if loading finished
                                if (!target.classList.contains('loading')) {
                                    shouldReinit = true;
                                }
                            }
                        }
                    });

                    if (shouldReinit) {
                        self.debouncedReinit();
                    }
                });

                // Observe the entire document for changes
                this.observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class']
                });

                this.log('MutationObserver initialized');
            },

            /**
             * Setup listeners for Greenshift's custom events
             */
            setupAjaxListeners: function() {
                const self = this;

                // Greenshift may dispatch custom events after AJAX
                const eventNames = [
                    'gspb_filter_complete',
                    'gspb_ajax_complete',
                    'gspb_grid_updated',
                    'gspb_content_loaded',
                    'greenshift_filter_done'
                ];

                eventNames.forEach(function(eventName) {
                    document.addEventListener(eventName, function(e) {
                        self.log('Event detected: ' + eventName);
                        self.debouncedReinit();
                    });
                });

                // Also listen on window
                eventNames.forEach(function(eventName) {
                    window.addEventListener(eventName, function(e) {
                        self.log('Window event detected: ' + eventName);
                        self.debouncedReinit();
                    });
                });
            },

            /**
             * Setup AJAX interceptor to detect filter requests
             */
            setupAjaxInterceptor: function() {
                const self = this;

                // Intercept jQuery AJAX if available
                if (typeof jQuery !== 'undefined') {
                    jQuery(document).ajaxComplete(function(event, xhr, settings) {
                        // Check if this was a filter-related request
                        if (settings.url && (
                            settings.url.includes('admin-ajax.php') ||
                            settings.url.includes('wp-json') ||
                            settings.url.includes('filter')
                        )) {
                            self.log('jQuery AJAX complete detected');
                            self.debouncedReinit();
                        }
                    });
                }

                // Intercept native fetch
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).then(function(response) {
                        const url = args[0];
                        if (typeof url === 'string' && (
                            url.includes('admin-ajax.php') ||
                            url.includes('wp-json') ||
                            url.includes('filter')
                        )) {
                            self.log('Fetch complete detected: ' + url);
                            // Small delay to allow DOM updates
                            setTimeout(function() {
                                self.debouncedReinit();
                            }, 50);
                        }
                        return response;
                    });
                };
            },

            /**
             * Check if element is a grid container
             */
            isGridElement: function(element) {
                if (!element || !element.classList) return false;

                return this.config.gridSelectors.some(function(selector) {
                    try {
                        return element.matches(selector);
                    } catch (e) {
                        return false;
                    }
                });
            },

            /**
             * Check if element has a grid parent
             */
            hasGridParent: function(element) {
                if (!element) return false;

                const self = this;
                return this.config.gridSelectors.some(function(selector) {
                    try {
                        return element.closest(selector) !== null;
                    } catch (e) {
                        return false;
                    }
                });
            },

            /**
             * Debounced reinitialization
             */
            debouncedReinit: function() {
                const self = this;

                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                }

                this.debounceTimer = setTimeout(function() {
                    self.reinitializeInteractionLayers();
                }, this.config.debounceDelay);
            },

            /**
             * Reinitialize Greenshift interaction layers (popups)
             */
            reinitializeInteractionLayers: function() {
                this.log('Reinitializing interaction layers...');

                // Method 1: Call Greenshift's built-in reinit functions
                this.callGreenshiftReinit();

                // Method 2: Manually reinit popup triggers
                this.reinitPopupTriggers();

                // Method 3: Re-dispatch DOMContentLoaded for any listeners
                this.triggerContentLoaded();

                // Method 4: Trigger resize event (some scripts reinit on resize)
                this.triggerResize();

                this.log('Reinitialization complete');
            },

            /**
             * Call Greenshift's built-in reinitialization functions
             */
            callGreenshiftReinit: function() {
                // Try various Greenshift global objects and methods
                const reinitMethods = [
                    // Greenshift library methods
                    { obj: 'gspblib', method: 'reinit' },
                    { obj: 'gspblib', method: 'initInteractions' },
                    { obj: 'gspblib', method: 'initPopups' },
                    { obj: 'gspblib', method: 'init' },

                    // Greenshift frontend
                    { obj: 'JESGSPB', method: 'reinit' },
                    { obj: 'JESGSPB', method: 'initInteractions' },
                    { obj: 'gspb_frontend', method: 'init' },
                    { obj: 'gspb_frontend', method: 'reinit' },

                    // Greenshift interactions
                    { obj: 'gspb_interactions', method: 'init' },
                    { obj: 'GSInteractions', method: 'init' },
                    { obj: 'gsInteractionLayers', method: 'init' },

                    // Animation library
                    { obj: 'gsap', nested: 'gsapInit', method: null },
                    { obj: 'gsAnimation', method: 'init' }
                ];

                const self = this;

                reinitMethods.forEach(function(item) {
                    try {
                        let target = window[item.obj];
                        if (target) {
                            if (item.nested && target[item.nested]) {
                                target = target[item.nested];
                            }
                            if (item.method && typeof target[item.method] === 'function') {
                                self.log('Calling ' + item.obj + '.' + item.method + '()');
                                target[item.method]();
                            }
                        }
                    } catch (e) {
                        self.log('Error calling ' + item.obj + ': ' + e.message);
                    }
                });

                // Try calling any global gspb init functions
                if (typeof window.gspb_init_front === 'function') {
                    this.log('Calling gspb_init_front()');
                    window.gspb_init_front();
                }

                // Trigger Greenshift's interaction layer initialization
                if (typeof window.gspb_interaction_init === 'function') {
                    this.log('Calling gspb_interaction_init()');
                    window.gspb_interaction_init();
                }
            },

            /**
             * Manually reinitialize popup triggers
             */
            reinitPopupTriggers: function() {
                const self = this;

                // Find all popup triggers in the grid
                const popupTriggers = document.querySelectorAll([
                    '[data-gspb-popup]',
                    '[data-popup-trigger]',
                    '[data-interaction-layer]',
                    '.gspb-popup-trigger',
                    '.gs-popup-trigger',
                    '[class*="gspb-interaction"]',
                    '[data-gspb-interaction]'
                ].join(', '));

                this.log('Found ' + popupTriggers.length + ' popup triggers');

                popupTriggers.forEach(function(trigger) {
                    // Remove old event listeners by cloning
                    // This prevents duplicate handlers
                    const clone = trigger.cloneNode(true);

                    // Re-attach click handler for popup
                    clone.addEventListener('click', function(e) {
                        self.handlePopupClick(e, clone);
                    });

                    // Replace original with clone
                    if (trigger.parentNode) {
                        trigger.parentNode.replaceChild(clone, trigger);
                    }
                });

                // Also look for synced popups
                this.reinitSyncedPopups();
            },

            /**
             * Handle popup click
             */
            handlePopupClick: function(e, trigger) {
                const popupId = trigger.dataset.gspbPopup ||
                               trigger.dataset.popupTrigger ||
                               trigger.dataset.interactionLayer;

                if (popupId) {
                    this.log('Popup trigger clicked: ' + popupId);

                    // Try to show the popup using Greenshift's API
                    const popup = document.querySelector('#' + popupId) ||
                                 document.querySelector('[data-popup-id="' + popupId + '"]') ||
                                 document.querySelector('.gspb-popup-' + popupId);

                    if (popup) {
                        popup.classList.add('active', 'show', 'gspb-popup-active');
                        popup.style.display = 'block';
                        popup.style.visibility = 'visible';
                        popup.style.opacity = '1';
                    }
                }
            },

            /**
             * Reinitialize synced popups (Greenshift feature)
             */
            reinitSyncedPopups: function() {
                // Synced popups use data attributes to link triggers with content
                const syncedElements = document.querySelectorAll('[data-gspb-synced-popup]');

                const self = this;
                syncedElements.forEach(function(element) {
                    const popupData = element.dataset.gspbSyncedPopup;
                    if (popupData) {
                        self.log('Found synced popup: ' + popupData);
                    }
                });
            },

            /**
             * Trigger content loaded event
             */
            triggerContentLoaded: function() {
                // Dispatch a custom event that scripts may listen for
                const event = new CustomEvent('gspb_content_reloaded', {
                    bubbles: true,
                    detail: { source: 'filter_fix' }
                });
                document.dispatchEvent(event);

                // Also try triggering native events that some scripts use
                try {
                    const readyEvent = new Event('ready');
                    document.dispatchEvent(readyEvent);
                } catch (e) {}

                // jQuery document ready trigger
                if (typeof jQuery !== 'undefined') {
                    try {
                        jQuery(document).trigger('ready');
                        jQuery(document).trigger('gspb_ajax_loaded');
                    } catch (e) {}
                }
            },

            /**
             * Trigger resize event
             */
            triggerResize: function() {
                // Some scripts reinitialize on window resize
                try {
                    window.dispatchEvent(new Event('resize'));
                } catch (e) {
                    // Fallback for older browsers
                    const evt = document.createEvent('UIEvents');
                    evt.initUIEvent('resize', true, false, window, 0);
                    window.dispatchEvent(evt);
                }
            },

            /**
             * Debug logging
             */
            log: function(message) {
                if (this.config.debug) {
                    console.log('[GS Popup Fix] ' + message);
                }
            }
        };

        // Initialize the fix
        GS_PopupFilterFix.init();

        // Expose globally for debugging
        window.GS_PopupFilterFix = GS_PopupFilterFix;

    })();
    </script>
    <?php
}
