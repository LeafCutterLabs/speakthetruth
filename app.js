(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.setLayout = function setLayout(mode) {
        const container = document.getElementById("courtroom-container");
        const boxButton = document.getElementById("btn-box");
        const sixpackButton = document.getElementById("btn-sixpack");
        const isInitialSync = !container.dataset.layoutInitialized;

        if (mode === "sixpack") {
            container.classList.add("layout-sixpack");
        } else {
            container.classList.remove("layout-sixpack");
        }

        container.dataset.layoutInitialized = "true";

        if (boxButton) {
            boxButton.textContent = "BOX (1-12)";
            boxButton.className = "px-5 py-1 rounded-md text-xs font-bold transition " + (mode === "box" ? "bg-blue-600 text-white" : "hover:bg-slate-700 text-slate-400");
        }

        if (sixpackButton) {
            sixpackButton.textContent = "SIX-PACK (1-18)";
            sixpackButton.className = "px-5 py-1 rounded-md text-xs font-bold transition " + (mode === "sixpack" ? "bg-blue-600 text-white" : "hover:bg-slate-700 text-slate-400");
        }

        if (!isInitialSync && mode === App.state.currentLayout) {
            return;
        }

        App.setLayoutAction(mode);
    };

    App.expandCard = function expandCard(element) {
        return;
    };

    App.shrinkCard = function shrinkCard(element) {
        element.classList.remove("is-expanded");
        if (element.parentElement) {
            element.parentElement.style.zIndex = "1";
        }
    };

    App.shrinkAll = function shrinkAll() {
        document.querySelectorAll(".post-it").forEach(function (card) {
            App.shrinkCard(card);
        });
    };

    App.handleHover = function handleHover(element, enter) {
        App.state.lastHoveredElement = enter ? element : null;
    };

    App.setRosterInputExpanded = function setRosterInputExpanded(isExpanded) {
        const rosterInput = document.getElementById("roster-input");
        if (!rosterInput) {
            return;
        }

        rosterInput.classList.toggle("is-expanded", isExpanded);
    };

    App.renderLucideIcons = function renderLucideIcons() {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    };

    App.scheduleLucideRender = function scheduleLucideRender() {
        if (App.state.lucideFrame) {
            cancelAnimationFrame(App.state.lucideFrame);
        }

        App.state.lucideFrame = requestAnimationFrame(function () {
            App.state.lucideFrame = null;
            App.renderLucideIcons();
        });
    };

    App.normalizeOverviewFontPreference = function normalizeOverviewFontPreference(value) {
        const nextValue = value || "medium";
        if (["compact", "xsmall", "default"].includes(nextValue)) {
            return "small";
        }

        if (["small", "medium", "large", "xlarge"].includes(nextValue)) {
            return nextValue;
        }

        return "medium";
    };

    App.normalizeBoxSeatOriginPreference = function normalizeBoxSeatOriginPreference(value) {
        return value === "right" ? "right" : "left";
    };

    App.applyPreferences = function applyPreferences() {
        const theme = App.state.preferences.theme || "default";
        const overviewFontSize = App.normalizeOverviewFontPreference(App.state.preferences.overviewFontSize);
        const boxSeatOrigin = App.normalizeBoxSeatOriginPreference(App.state.preferences.boxSeatOrigin);
        const body = document.body;
        const courtroom = document.getElementById("courtroom-container");

        App.state.preferences.overviewFontSize = overviewFontSize;
        App.state.preferences.boxSeatOrigin = boxSeatOrigin;

        if (body) {
            body.classList.toggle("app-theme-dark", theme === "dark");
        }

        if (courtroom) {
            courtroom.dataset.overviewFontSize = overviewFontSize;
            courtroom.dataset.boxSeatOrigin = boxSeatOrigin;
        }

        const themeSelect = document.getElementById("prefs-theme");
        const fontSelect = document.getElementById("prefs-overview-font");
        const boxOriginSelect = document.getElementById("prefs-box-origin");
        if (themeSelect) {
            themeSelect.value = theme;
        }
        if (fontSelect) {
            fontSelect.value = overviewFontSize;
        }
        if (boxOriginSelect) {
            boxOriginSelect.value = boxSeatOrigin;
        }
    };

    App.setPreference = function setPreference(key, value) {
        App.state.preferences[key] = value;
        App.applyPreferences();
        App.save();
        App.renderCourtroom();
    };

    App.setPreferencesPanelOpen = function setPreferencesPanelOpen(isOpen) {
        const panel = document.getElementById("prefs-panel");
        const toggle = document.getElementById("prefs-toggle");
        if (!panel || !toggle) {
            return;
        }

        panel.classList.toggle("hidden", !isOpen);
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

    App.setSidebarOpen = function setSidebarOpen(isOpen) {
        const sidebar = document.getElementById("sidebar");
        if (!sidebar) {
            return;
        }

        if (sidebar.classList.contains("is-open") === !!isOpen) {
            return;
        }

        sidebar.classList.toggle("is-open", isOpen);
    };

    App.syncSidebarPinIndicator = function syncSidebarPinIndicator() {
        const indicator = document.getElementById("sidebar-pin-indicator");
        if (!indicator) {
            return;
        }

        indicator.classList.toggle("hidden", !App.state.isSidebarPinned);
    };

    App.clearSidebarTimer = function clearSidebarTimer() {
        if (!App.state.sidebarTimer) {
            return;
        }

        clearTimeout(App.state.sidebarTimer);
        App.state.sidebarTimer = null;
    };

    App.queueSidebarOpen = function queueSidebarOpen(isOpen) {
        App.clearSidebarTimer();
        App.state.sidebarTimer = setTimeout(function () {
            App.state.sidebarTimer = null;
            App.setSidebarOpen(isOpen);
        }, isOpen ? 95 : 140);
    };

    App.setSidebarPinned = function setSidebarPinned(isPinned) {
        App.state.isSidebarPinned = !!isPinned;
        App.clearSidebarTimer();
        App.setSidebarOpen(App.state.isSidebarPinned);
        App.syncSidebarPinIndicator();
    };

    App.init = function init() {
        App.loadAppData();
        App.setLayout(App.state.currentLayout);
        App.applyPreferences();
        App.renderAll();
        App.scheduleLucideRender();
        App.setSidebarPinned(true);

        const prefsToggle = document.getElementById("prefs-toggle");
        const prefsPanel = document.getElementById("prefs-panel");
        const prefsFont = document.getElementById("prefs-overview-font");
        const prefsTheme = document.getElementById("prefs-theme");
        const prefsBoxOrigin = document.getElementById("prefs-box-origin");
        if (prefsToggle && prefsPanel) {
            prefsToggle.addEventListener("click", function (event) {
                event.stopPropagation();
                const isOpen = prefsPanel.classList.contains("hidden");
                App.setPreferencesPanelOpen(isOpen);
            });

            document.addEventListener("click", function (event) {
                if (!event.target.closest(".prefs-wrap")) {
                    App.setPreferencesPanelOpen(false);
                }
            });
        }

        if (prefsFont) {
            prefsFont.addEventListener("change", function () {
                App.setPreference("overviewFontSize", prefsFont.value);
            });
        }

        if (prefsTheme) {
            prefsTheme.addEventListener("change", function () {
                App.setPreference("theme", prefsTheme.value);
            });
        }

        if (prefsBoxOrigin) {
            prefsBoxOrigin.addEventListener("change", function () {
                App.setPreference("boxSeatOrigin", prefsBoxOrigin.value);
            });
        }

        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            const sidebarPeek = sidebar.querySelector(".sidebar-peek");

            sidebar.addEventListener("mouseenter", function () {
                if (App.state.isSidebarPinned) {
                    return;
                }
                App.queueSidebarOpen(true);
            });

            sidebar.addEventListener("mouseleave", function () {
                if (App.state.isSidebarPinned) {
                    return;
                }
                App.queueSidebarOpen(false);
            });

            if (sidebarPeek) {
                sidebarPeek.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    App.setSidebarPinned(!App.state.isSidebarPinned);
                });
            }
        }

        const rosterInput = document.getElementById("roster-input");
        if (rosterInput) {
            rosterInput.addEventListener("focus", function () {
                App.setRosterInputExpanded(true);
                App.setSidebarPinned(true);
            });

            rosterInput.addEventListener("click", function () {
                App.setRosterInputExpanded(true);
                App.setSidebarPinned(true);
            });

            rosterInput.addEventListener("blur", function () {
                App.setRosterInputExpanded(false);
            });
        }

        const modalOverlay = document.getElementById("modal-overlay");
        if (modalOverlay) {
            modalOverlay.addEventListener("click", function (event) {
                if (event.target === modalOverlay && modalOverlay.classList.contains("flex")) {
                    App.closeModal();
                }
            });
        }

        const poolList = document.getElementById("pool-list");
        if (poolList) {
            poolList.addEventListener("click", function (event) {
                const item = event.target.closest("[data-juror-id]");
                if (!item) {
                    return;
                }

                App.openModal(item.dataset.jurorId);
            });

            poolList.addEventListener("dragstart", function (event) {
                const item = event.target.closest("[data-juror-id]");
                if (!item) {
                    return;
                }

                App.dragStart(event);
            });

            poolList.addEventListener("dragend", function (event) {
                const item = event.target.closest("[data-juror-id]");
                if (!item) {
                    return;
                }

                App.dragEnd(event);
            });
        }

        const strikeList = document.getElementById("struck-juror-list");
        if (strikeList) {
            strikeList.addEventListener("click", function (event) {
                const item = event.target.closest("[data-juror-id]");
                if (!item) {
                    return;
                }

                App.openModal(item.dataset.jurorId);
            });
        }

        window.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                if (document.getElementById("modal-overlay").classList.contains("flex")) {
                    App.closeModal();
                    return;
                }

                App.shrinkAll();
                App.setSidebarPinned(false);
                App.setPreferencesPanelOpen(false);
            }
        });
    };

    window.setLayout = App.setLayout;
    window.handleHover = App.handleHover;
    window.onload = App.init;
}());
