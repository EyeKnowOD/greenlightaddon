/**
 * Greenshift Filter & Popup Fix
 *
 * Fixes two issues with Greenshift Query Loops:
 * 1. Sorting is lost when filters are applied (URL doesn't preserve sort param)
 * 2. Popups/dynamic content stops working after filter navigation
 *
 * How it works:
 * - Intercepts filter link clicks and form submissions
 * - Injects current sorting value into the URL before navigation
 * - Reinitializes popups after page load
 *
 * @version 2.0.0
 * @author EyeKnowOD
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        debug: false,

        // Storage keys
        storageKey: 'gs_sort_value',

        // URL parameter names (Greenshift uses these)
        sortParams: ['orderby', 'order', 'gspb_sort', 'sort', 'sortby'],

        // Selectors
        selectors: {
            // Filter Sorting block
            sortingBlock: '.gspb_filtersorting, .gs-filter-sorting, [class*="filtersorting"]',
            sortingSelect: '.gspb_filtersorting select, .gs-filter-sorting select, [class*="filtersorting"] select',

            // Filter Panel and items
            filterPanel: '.gspb_filterpanel, .gs-filter-panel, [class*="filterpanel"]',
            filterItem: '.gspb_filteritem, .gs-filter-item, [class*="filteritem"]',
            filterLink: '.gspb_filterpanel a, .gspb_filteritem a, [data-filter]',
            filterCheckbox: '.gspb_filterpanel input[type="checkbox"], .gspb_filterpanel input[type="radio"]',

            // Query loop
            queryLoop: '.gspb_query_builder, .wp-block-flavor-query, [class*="query_builder"]',

            // Popups
            popup: '.gspb_popup, .gs-popup, [class*="gspb_popup"]',
            popupTrigger: '[data-popup], [data-sliding], .gspb_popup_trigger, [href*="#gspb_popup"]',
            slidingPanel: '.gspb_slidingpanel, .gs-sliding-panel'
        }
    };

    function log(...args) {
        if (CONFIG.debug) console.log('[GS-Fix]', ...args);
    }

    // ============================================
    // URL & SORTING MANAGEMENT
    // ============================================

    const SortingManager = {

        // Get current sorting value from the dropdown
        getCurrentSortValue() {
            const select = document.querySelector(CONFIG.selectors.sortingSelect);
            if (select && select.value) {
                log('Current sort value:', select.value);
                return select.value;
            }
            return null;
        },

        // Get sorting from URL parameters
        getSortFromURL() {
            const params = new URLSearchParams(window.location.search);
            for (const param of CONFIG.sortParams) {
                if (params.has(param)) {
                    return { param: param, value: params.get(param) };
                }
            }
            return null;
        },

        // Store sorting value in sessionStorage
        storeSortValue(value) {
            if (value) {
                try {
                    sessionStorage.setItem(CONFIG.storageKey, value);
                    log('Stored sort value:', value);
                } catch (e) {
                    log('Storage error:', e);
                }
            }
        },

        // Retrieve stored sorting value
        getStoredSortValue() {
            try {
                return sessionStorage.getItem(CONFIG.storageKey);
            } catch (e) {
                return null;
            }
        },

        // Add sorting parameter to a URL
        addSortToURL(url, sortValue) {
            if (!sortValue) return url;

            try {
                const urlObj = new URL(url, window.location.origin);

                // Check if sort param already exists
                let hasSort = false;
                for (const param of CONFIG.sortParams) {
                    if (urlObj.searchParams.has(param)) {
                        hasSort = true;
                        break;
                    }
                }

                // Add sorting if not present
                if (!hasSort) {
                    // Use 'orderby' as the default param name (common in WP)
                    urlObj.searchParams.set('orderby', sortValue);
                    log('Added sort to URL:', urlObj.toString());
                }

                return urlObj.toString();
            } catch (e) {
                log('URL parse error:', e);
                return url;
            }
        },

        // Apply stored sorting to dropdown on page load
        applySortToDropdown() {
            const storedValue = this.getStoredSortValue();
            const urlSort = this.getSortFromURL();

            const valueToApply = urlSort?.value || storedValue;

            if (valueToApply) {
                const select = document.querySelector(CONFIG.selectors.sortingSelect);
                if (select) {
                    // Check if option exists
                    const optionExists = Array.from(select.options).some(opt => opt.value === valueToApply);
                    if (optionExists) {
                        select.value = valueToApply;
                        log('Applied sort to dropdown:', valueToApply);
                    }
                }
            }
        }
    };

    // ============================================
    // FILTER INTERCEPTION
    // ============================================

    const FilterInterceptor = {

        init() {
            // Intercept filter link clicks
            this.interceptLinks();

            // Intercept filter checkbox/radio changes
            this.interceptInputs();

            // Intercept sorting changes
            this.interceptSorting();

            // Handle browser back/forward
            this.handlePopState();

            log('FilterInterceptor initialized');
        },

        // Intercept all filter link clicks
        interceptLinks() {
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (!link) return;

                // Check if this is a filter-related link
                const isFilterLink = link.closest(CONFIG.selectors.filterPanel) ||
                                    link.closest(CONFIG.selectors.filterItem) ||
                                    link.href?.includes('filter_') ||
                                    link.href?.includes('gspb_filter');

                if (isFilterLink && link.href) {
                    const currentSort = SortingManager.getCurrentSortValue();

                    if (currentSort) {
                        e.preventDefault();

                        // Store the sort value
                        SortingManager.storeSortValue(currentSort);

                        // Add sort to URL and navigate
                        const newURL = SortingManager.addSortToURL(link.href, currentSort);
                        log('Intercepted filter link, redirecting to:', newURL);

                        window.location.href = newURL;
                    }
                }
            }, true);
        },

        // Intercept checkbox/radio filter changes
        interceptInputs() {
            document.addEventListener('change', (e) => {
                const input = e.target;

                // Check if this is a filter input
                const isFilterInput = input.closest(CONFIG.selectors.filterPanel) &&
                                     (input.type === 'checkbox' || input.type === 'radio');

                if (isFilterInput) {
                    const currentSort = SortingManager.getCurrentSortValue();
                    if (currentSort) {
                        SortingManager.storeSortValue(currentSort);
                        log('Stored sort before filter change:', currentSort);
                    }
                }
            });
        },

        // Intercept sorting dropdown changes
        interceptSorting() {
            document.addEventListener('change', (e) => {
                const select = e.target.closest(CONFIG.selectors.sortingSelect);
                if (select) {
                    const newValue = select.value;
                    SortingManager.storeSortValue(newValue);
                    log('Sort changed to:', newValue);

                    // If sorting changes, update the current URL
                    const currentURL = new URL(window.location.href);
                    currentURL.searchParams.set('orderby', newValue);

                    // Use replaceState to update URL without reload
                    // This ensures the sort param is in the URL for next filter click
                    window.history.replaceState({}, '', currentURL.toString());
                    log('Updated URL with sort:', currentURL.toString());
                }
            });
        },

        // Handle browser back/forward navigation
        handlePopState() {
            window.addEventListener('popstate', () => {
                SortingManager.applySortToDropdown();
                setTimeout(() => PopupManager.reinitialize(), 100);
            });
        }
    };

    // ============================================
    // POPUP REINITIALIZATION
    // ============================================

    const PopupManager = {

        init() {
            // Set up event delegation for popups
            this.setupEventDelegation();

            // Initial popup binding
            this.reinitialize();

            log('PopupManager initialized');
        },

        // Reinitialize all popup functionality
        reinitialize() {
            log('Reinitializing popups...');

            // Method 1: Try Greenshift's native functions
            this.tryNativeReinit();

            // Method 2: Re-scan and bind popups
            this.bindPopupTriggers();
        },

        // Try to call Greenshift's native initialization
        tryNativeReinit() {
            // Various possible Greenshift global objects/methods
            const attempts = [
                () => window.gspbHooks?.initPopups?.(),
                () => window.gspbHooks?.initSlidingPanels?.(),
                () => window.gspbHooks?.initAll?.(),
                () => window.gspb?.initInteractions?.(),
                () => window.gspb?.popup?.init?.(),
                () => window.gsQuery?.init?.(),
                () => document.dispatchEvent(new CustomEvent('gspb_content_loaded')),
                () => document.dispatchEvent(new CustomEvent('gspb_reinit'))
            ];

            attempts.forEach(fn => {
                try { fn(); } catch (e) { /* ignore */ }
            });
        },

        // Event delegation - this works regardless of when content loads
        setupEventDelegation() {
            document.addEventListener('click', (e) => {
                const trigger = e.target.closest(CONFIG.selectors.popupTrigger);
                if (!trigger) return;

                // Get popup ID from various attributes
                const popupId = this.getPopupId(trigger);
                if (!popupId) return;

                // Find the popup element
                const popup = document.getElementById(popupId) ||
                             document.querySelector(`[data-popup-id="${popupId}"]`) ||
                             document.querySelector(`.${popupId}`);

                if (popup) {
                    e.preventDefault();
                    e.stopPropagation();
                    log('Opening popup:', popupId);
                    this.openPopup(popup);
                }
            }, true);
        },

        // Extract popup ID from trigger element
        getPopupId(trigger) {
            // Try various attributes
            let id = trigger.dataset.popup ||
                    trigger.dataset.sliding ||
                    trigger.dataset.slidingPanel ||
                    trigger.dataset.target ||
                    trigger.dataset.popupId;

            // Try href
            if (!id) {
                const href = trigger.getAttribute('href');
                if (href?.startsWith('#')) {
                    id = href.substring(1);
                }
            }

            // Try aria-controls
            if (!id) {
                id = trigger.getAttribute('aria-controls');
            }

            return id;
        },

        // Open a popup
        openPopup(popup) {
            // Try native Greenshift method first
            if (typeof window.gspbHooks?.openPopup === 'function') {
                window.gspbHooks.openPopup(popup);
                return;
            }

            // Fallback: manual open
            popup.classList.add('is-active', 'gspb_popup_active', 'gs-popup-active');
            popup.style.display = 'block';
            popup.style.visibility = 'visible';
            popup.style.opacity = '1';
            document.body.classList.add('gspb-popup-open', 'popup-open');

            // Bind close handlers
            this.bindCloseHandlers(popup);

            // Trigger event for other scripts
            popup.dispatchEvent(new CustomEvent('popup:opened'));
        },

        // Close a popup
        closePopup(popup) {
            popup.classList.remove('is-active', 'gspb_popup_active', 'gs-popup-active');
            popup.style.display = '';
            popup.style.visibility = '';
            popup.style.opacity = '';
            document.body.classList.remove('gspb-popup-open', 'popup-open');

            popup.dispatchEvent(new CustomEvent('popup:closed'));
        },

        // Bind close button and overlay click handlers
        bindCloseHandlers(popup) {
            // Close button
            const closeBtn = popup.querySelector('.gspb_popup_close, .gs-popup-close, [data-close], .popup-close');
            if (closeBtn) {
                closeBtn.onclick = (e) => {
                    e.preventDefault();
                    this.closePopup(popup);
                };
            }

            // Overlay click
            const overlay = popup.querySelector('.gspb_popup_overlay, .gs-popup-overlay, .popup-overlay');
            if (overlay) {
                overlay.onclick = () => this.closePopup(popup);
            }

            // ESC key
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closePopup(popup);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        },

        // Re-scan and bind popup triggers (for non-delegated scenarios)
        bindPopupTriggers() {
            const triggers = document.querySelectorAll(CONFIG.selectors.popupTrigger);
            log(`Found ${triggers.length} popup triggers`);

            triggers.forEach(trigger => {
                // Mark as initialized to avoid double-binding
                if (trigger.dataset.gsInitialized) return;
                trigger.dataset.gsInitialized = 'true';

                // The actual click handling is done via delegation above
                // This just ensures triggers are discoverable
            });
        }
    };

    // ============================================
    // MUTATION OBSERVER (Content Change Detection)
    // ============================================

    const ContentObserver = {
        observer: null,

        init() {
            // Watch for content changes in query loops
            this.observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        const target = mutation.target;

                        // Check if query loop content changed
                        if (target.matches?.(CONFIG.selectors.queryLoop) ||
                            target.closest?.(CONFIG.selectors.queryLoop)) {
                            log('Query loop content changed');

                            // Debounce to avoid multiple calls
                            clearTimeout(this.debounceTimer);
                            this.debounceTimer = setTimeout(() => {
                                PopupManager.reinitialize();
                            }, 200);
                            break;
                        }
                    }
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            log('ContentObserver initialized');
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        log('Initializing Greenshift Filter Fix v2.0...');

        // Apply stored sorting on page load
        SortingManager.applySortToDropdown();

        // Initialize modules
        FilterInterceptor.init();
        PopupManager.init();
        ContentObserver.init();

        log('Initialization complete');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also run on window load for late-loading content
    window.addEventListener('load', () => {
        setTimeout(() => {
            SortingManager.applySortToDropdown();
            PopupManager.reinitialize();
        }, 500);
    });

    // Expose API for debugging and manual control
    window.GSFilterFix = {
        version: '2.0.0',
        config: CONFIG,
        sorting: SortingManager,
        popups: PopupManager,

        // Debug helpers
        debug(enabled) { CONFIG.debug = enabled; },
        reinitPopups() { PopupManager.reinitialize(); },
        getCurrentSort() { return SortingManager.getCurrentSortValue(); },

        // Manual popup control
        openPopup(id) {
            const popup = document.getElementById(id);
            if (popup) PopupManager.openPopup(popup);
        },
        closePopup(id) {
            const popup = document.getElementById(id);
            if (popup) PopupManager.closePopup(popup);
        }
    };

})();
