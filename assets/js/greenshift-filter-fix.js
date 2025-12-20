/**
 * Greenshift Filter & Popup Fix
 *
 * Fixes two issues with Greenshift Query Loops:
 * 1. Sorting resets after applying filters
 * 2. Popups/Sliding panels stop working after AJAX content replacement
 *
 * @version 1.0.0
 * @author EyeKnowOD
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION - Adjust these if needed
    // ============================================
    const CONFIG = {
        // Debug mode - set to true to see console logs
        debug: false,

        // Selectors for Greenshift elements
        selectors: {
            queryLoop: '.gspb_query_builder, .wp-block-flavor-query',
            filterPanel: '.gspb_filterpanel',
            filterSorting: '.gspb_filtersorting, .gs-filter-sorting',
            sortingSelect: '.gspb_filtersorting select, .gs-filter-sorting select',
            popup: '.gspb_popup, .gs-popup',
            slidingPanel: '.gspb_slidingpanel, .gs-sliding-panel',
            popupTrigger: '[data-popup], [data-sliding-panel], .gs-popup-trigger, .gspb_popup_trigger',
            loopItem: '.gspb_query_builder_item, .gs-query-item, .wp-block-flavor-query > *'
        },

        // Storage key for sorting preference
        sortingStorageKey: 'gs_filter_sorting_state'
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    function log(...args) {
        if (CONFIG.debug) {
            console.log('[GS-Filter-Fix]', ...args);
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================
    // SORTING PRESERVATION
    // ============================================

    const SortingManager = {
        // Store current sorting states by query ID
        sortingStates: {},

        init() {
            this.bindSortingChangeEvents();
            this.restoreFromStorage();
            log('SortingManager initialized');
        },

        // Listen for sorting dropdown changes
        bindSortingChangeEvents() {
            document.addEventListener('change', (e) => {
                const sortingSelect = e.target.closest(CONFIG.selectors.sortingSelect);
                if (sortingSelect) {
                    const queryId = this.getConnectedQueryId(sortingSelect);
                    if (queryId) {
                        this.sortingStates[queryId] = sortingSelect.value;
                        this.saveToStorage();
                        log('Sorting changed:', queryId, sortingSelect.value);
                    }
                }
            });
        },

        // Get the connected Query Builder ID from the sorting block
        getConnectedQueryId(element) {
            const container = element.closest(CONFIG.selectors.filterSorting);
            if (container) {
                // Try data attribute first
                let queryId = container.dataset.queryId ||
                              container.dataset.connectionId ||
                              container.getAttribute('data-query-id');

                // Fallback: look for ID in class names
                if (!queryId) {
                    const classes = container.className.split(' ');
                    for (const cls of classes) {
                        if (cls.startsWith('gs-connected-') || cls.startsWith('gspb-query-')) {
                            queryId = cls.replace('gs-connected-', '').replace('gspb-query-', '');
                            break;
                        }
                    }
                }

                // Fallback: use a generic key based on page URL
                if (!queryId) {
                    queryId = 'page-' + window.location.pathname.replace(/\//g, '-');
                }

                return queryId;
            }
            return null;
        },

        // Restore sorting after AJAX
        restoreSorting(queryId) {
            const savedValue = this.sortingStates[queryId];
            if (savedValue) {
                const sortingSelects = document.querySelectorAll(CONFIG.selectors.sortingSelect);
                sortingSelects.forEach(select => {
                    const selectQueryId = this.getConnectedQueryId(select);
                    if (selectQueryId === queryId || !queryId) {
                        if (select.value !== savedValue) {
                            select.value = savedValue;
                            log('Restored sorting:', savedValue);

                            // Trigger change event to notify Greenshift
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                });
            }
        },

        // Save to sessionStorage for page persistence
        saveToStorage() {
            try {
                sessionStorage.setItem(CONFIG.sortingStorageKey, JSON.stringify(this.sortingStates));
            } catch (e) {
                log('Storage error:', e);
            }
        },

        // Restore from sessionStorage
        restoreFromStorage() {
            try {
                const saved = sessionStorage.getItem(CONFIG.sortingStorageKey);
                if (saved) {
                    this.sortingStates = JSON.parse(saved);
                    log('Restored states from storage:', this.sortingStates);
                }
            } catch (e) {
                log('Storage restore error:', e);
            }
        }
    };

    // ============================================
    // POPUP/SLIDING PANEL REINITIALIZATION
    // ============================================

    const PopupManager = {
        init() {
            log('PopupManager initialized');
        },

        // Reinitialize all Greenshift interactive elements
        reinitializeAll() {
            log('Reinitializing popups and sliding panels...');

            // Method 1: Trigger Greenshift's own reinitialization
            this.triggerGreenshiftReinit();

            // Method 2: Manually rebind popup triggers
            this.rebindPopupTriggers();

            // Method 3: Reinitialize sliding panels
            this.reinitSlidingPanels();
        },

        // Try to call Greenshift's initialization functions
        triggerGreenshiftReinit() {
            // Greenshift stores its functions in window.gspbHooks or gspb_hooks
            if (typeof window.gspbHooks !== 'undefined') {
                log('Found gspbHooks, reinitializing...');

                // Try common initialization methods
                if (typeof window.gspbHooks.initPopups === 'function') {
                    window.gspbHooks.initPopups();
                }
                if (typeof window.gspbHooks.initSlidingPanels === 'function') {
                    window.gspbHooks.initSlidingPanels();
                }
                if (typeof window.gspbHooks.initAll === 'function') {
                    window.gspbHooks.initAll();
                }
            }

            // Alternative: gspb global object
            if (typeof window.gspb !== 'undefined') {
                if (typeof window.gspb.initInteractions === 'function') {
                    window.gspb.initInteractions();
                }
            }

            // Alternative: FLAVOR query (Greenshift Query addon)
            if (typeof window.gsQueryInit !== 'undefined') {
                window.gsQueryInit();
            }

            // Trigger custom event that Greenshift might listen to
            document.dispatchEvent(new CustomEvent('gspb_content_loaded'));
            document.dispatchEvent(new CustomEvent('gspb_ajax_complete'));

            // Trigger WordPress block reinitialization event
            document.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        },

        // Manually rebind popup triggers using event delegation
        rebindPopupTriggers() {
            const popups = document.querySelectorAll(CONFIG.selectors.popup);

            popups.forEach(popup => {
                const triggerId = popup.id || popup.dataset.popupId;
                if (triggerId) {
                    // Find all triggers for this popup
                    const triggers = document.querySelectorAll(
                        `[data-popup="${triggerId}"], [href="#${triggerId}"], [data-target="${triggerId}"]`
                    );

                    triggers.forEach(trigger => {
                        // Remove existing listeners by cloning
                        const newTrigger = trigger.cloneNode(true);
                        trigger.parentNode.replaceChild(newTrigger, trigger);

                        newTrigger.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.openPopup(popup);
                        });
                    });
                }
            });
        },

        // Basic popup open function (fallback)
        openPopup(popup) {
            popup.classList.add('is-active', 'gs-popup-active', 'gspb_popup_active');
            popup.style.display = 'block';
            popup.style.visibility = 'visible';
            popup.style.opacity = '1';
            document.body.classList.add('gs-popup-open', 'gspb-popup-open');

            // Find and bind close button
            const closeBtn = popup.querySelector('.gs-popup-close, .gspb_popup_close, [data-close]');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closePopup(popup), { once: true });
            }

            // Close on overlay click
            const overlay = popup.querySelector('.gs-popup-overlay, .gspb_popup_overlay');
            if (overlay) {
                overlay.addEventListener('click', () => this.closePopup(popup), { once: true });
            }
        },

        closePopup(popup) {
            popup.classList.remove('is-active', 'gs-popup-active', 'gspb_popup_active');
            popup.style.display = '';
            popup.style.visibility = '';
            popup.style.opacity = '';
            document.body.classList.remove('gs-popup-open', 'gspb-popup-open');
        },

        // Reinitialize sliding panels
        reinitSlidingPanels() {
            const panels = document.querySelectorAll(CONFIG.selectors.slidingPanel);

            panels.forEach(panel => {
                const panelId = panel.id || panel.dataset.panelId;
                if (panelId) {
                    const triggers = document.querySelectorAll(
                        `[data-sliding-panel="${panelId}"], [data-panel="${panelId}"]`
                    );

                    triggers.forEach(trigger => {
                        const newTrigger = trigger.cloneNode(true);
                        trigger.parentNode.replaceChild(newTrigger, trigger);

                        newTrigger.addEventListener('click', (e) => {
                            e.preventDefault();
                            panel.classList.toggle('is-active');
                        });
                    });
                }
            });
        }
    };

    // ============================================
    // AJAX INTERCEPTION
    // ============================================

    const AjaxInterceptor = {
        originalFetch: null,
        originalXHR: null,

        init() {
            this.interceptFetch();
            this.interceptXHR();
            this.observeDOM();
            log('AjaxInterceptor initialized');
        },

        // Intercept fetch API calls
        interceptFetch() {
            this.originalFetch = window.fetch;

            window.fetch = async (...args) => {
                const response = await this.originalFetch.apply(window, args);

                // Check if this is a Greenshift filter request
                const url = args[0]?.url || args[0];
                if (this.isGreenshiftRequest(url)) {
                    log('Greenshift fetch detected:', url);

                    // Clone response to read it
                    const clonedResponse = response.clone();
                    clonedResponse.text().then(() => {
                        // Wait for DOM update, then reinitialize
                        setTimeout(() => {
                            this.onAjaxComplete();
                        }, 100);
                    });
                }

                return response;
            };
        },

        // Intercept XMLHttpRequest
        interceptXHR() {
            const self = this;
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                this._gsUrl = url;
                return originalOpen.apply(this, [method, url, ...rest]);
            };

            XMLHttpRequest.prototype.send = function(...args) {
                if (self.isGreenshiftRequest(this._gsUrl)) {
                    this.addEventListener('load', function() {
                        log('Greenshift XHR detected:', this._gsUrl);
                        setTimeout(() => {
                            self.onAjaxComplete();
                        }, 100);
                    });
                }
                return originalSend.apply(this, args);
            };
        },

        // Check if URL is a Greenshift AJAX request
        isGreenshiftRequest(url) {
            if (!url) return false;
            const urlStr = url.toString().toLowerCase();
            return urlStr.includes('admin-ajax.php') ||
                   urlStr.includes('wp-json') ||
                   urlStr.includes('gspb') ||
                   urlStr.includes('greenshift') ||
                   urlStr.includes('filter');
        },

        // Observe DOM for Greenshift content changes
        observeDOM() {
            const observer = new MutationObserver(debounce((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Check if query loop content was replaced
                        const target = mutation.target;
                        if (target.matches && (
                            target.matches(CONFIG.selectors.queryLoop) ||
                            target.closest(CONFIG.selectors.queryLoop)
                        )) {
                            log('Query loop content changed via DOM mutation');
                            this.onAjaxComplete();
                            break;
                        }
                    }
                }
            }, 150));

            // Observe the entire document for changes
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        // Called after AJAX content replacement
        onAjaxComplete() {
            log('AJAX complete - reinitializing...');

            // Reinitialize popups
            PopupManager.reinitializeAll();

            // Note: We don't restore sorting here to avoid infinite loop
            // The sorting should persist through the filter request itself
        }
    };

    // ============================================
    // GREENSHIFT HOOKS INTEGRATION
    // ============================================

    const GreenshiftHooks = {
        init() {
            // Wait for Greenshift to be ready
            this.waitForGreenshift();

            // Hook into filter events
            this.bindFilterEvents();

            log('GreenshiftHooks initialized');
        },

        waitForGreenshift() {
            // Check if Greenshift's JavaScript is loaded
            const checkInterval = setInterval(() => {
                if (typeof window.gspbHooks !== 'undefined' ||
                    typeof window.gspb !== 'undefined' ||
                    document.querySelector(CONFIG.selectors.queryLoop)) {
                    clearInterval(checkInterval);
                    log('Greenshift detected, binding hooks...');
                    this.bindGreenshiftHooks();
                }
            }, 100);

            // Stop checking after 10 seconds
            setTimeout(() => clearInterval(checkInterval), 10000);
        },

        bindGreenshiftHooks() {
            // Hook into Greenshift's custom events
            document.addEventListener('gspb_filter_applied', (e) => {
                log('Filter applied event:', e.detail);
                setTimeout(() => PopupManager.reinitializeAll(), 150);
            });

            document.addEventListener('gspb_filter_complete', (e) => {
                log('Filter complete event:', e.detail);
                setTimeout(() => PopupManager.reinitializeAll(), 150);
            });

            document.addEventListener('gspb_pagination_complete', (e) => {
                log('Pagination complete event:', e.detail);
                setTimeout(() => PopupManager.reinitializeAll(), 150);
            });

            // Alternative event names
            document.addEventListener('gsquery_loaded', () => {
                setTimeout(() => PopupManager.reinitializeAll(), 150);
            });

            document.addEventListener('flavor_filter_complete', () => {
                setTimeout(() => PopupManager.reinitializeAll(), 150);
            });
        },

        bindFilterEvents() {
            // Listen for filter changes via event delegation
            document.addEventListener('change', (e) => {
                if (e.target.closest(CONFIG.selectors.filterPanel)) {
                    log('Filter changed');
                    // Store current sorting before filter applies
                    const sortingSelects = document.querySelectorAll(CONFIG.selectors.sortingSelect);
                    sortingSelects.forEach(select => {
                        const queryId = SortingManager.getConnectedQueryId(select);
                        if (queryId) {
                            SortingManager.sortingStates[queryId] = select.value;
                        }
                    });
                }
            });

            // Listen for filter clicks (checkboxes, radios, tags)
            document.addEventListener('click', (e) => {
                const filterItem = e.target.closest('.gspb_filteritem, .gs-filter-item, [data-filter]');
                if (filterItem) {
                    log('Filter item clicked');
                }
            });
        }
    };

    // ============================================
    // EVENT DELEGATION FOR DYNAMIC CONTENT
    // ============================================

    const EventDelegation = {
        init() {
            // Use event delegation on document for all popup triggers
            // This ensures dynamically added content works
            document.addEventListener('click', (e) => {
                const trigger = e.target.closest(CONFIG.selectors.popupTrigger);
                if (trigger) {
                    const popupId = trigger.dataset.popup ||
                                   trigger.dataset.slidingPanel ||
                                   trigger.getAttribute('href')?.replace('#', '') ||
                                   trigger.dataset.target;

                    if (popupId) {
                        const popup = document.getElementById(popupId) ||
                                     document.querySelector(`[data-popup-id="${popupId}"]`) ||
                                     document.querySelector(`.${popupId}`);

                        if (popup) {
                            e.preventDefault();
                            log('Opening popup via delegation:', popupId);

                            // Try Greenshift's native method first
                            if (typeof window.gspbHooks?.openPopup === 'function') {
                                window.gspbHooks.openPopup(popup);
                            } else {
                                PopupManager.openPopup(popup);
                            }
                        }
                    }
                }
            });

            // Handle loop item clicks that should open popups
            document.addEventListener('click', (e) => {
                const loopItem = e.target.closest(CONFIG.selectors.loopItem);
                if (loopItem) {
                    // Check if this item has a popup association
                    const popupId = loopItem.dataset.popup ||
                                   loopItem.dataset.openPopup ||
                                   loopItem.querySelector('[data-popup]')?.dataset.popup;

                    if (popupId) {
                        log('Loop item clicked with popup:', popupId);
                    }
                }
            });

            log('EventDelegation initialized');
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        log('Initializing Greenshift Filter Fix...');

        SortingManager.init();
        PopupManager.init();
        AjaxInterceptor.init();
        GreenshiftHooks.init();
        EventDelegation.init();

        log('Greenshift Filter Fix initialized successfully');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also initialize on window load (ensures all scripts are loaded)
    window.addEventListener('load', () => {
        // Reinitialize after a short delay to catch late-loading content
        setTimeout(() => {
            PopupManager.reinitializeAll();
        }, 500);
    });

    // Expose for debugging
    window.GSFilterFix = {
        CONFIG,
        SortingManager,
        PopupManager,
        AjaxInterceptor,
        reinit: () => PopupManager.reinitializeAll(),
        debug: (enabled) => { CONFIG.debug = enabled; }
    };

})();
