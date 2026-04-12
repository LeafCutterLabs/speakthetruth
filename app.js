(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.setLayout = function setLayout(mode) {
        App.state.currentLayout = mode;

        const container = document.getElementById("courtroom-container");
        if (mode === "sixpack") {
            container.classList.add("layout-sixpack");
        } else {
            container.classList.remove("layout-sixpack");
        }

        document.getElementById("btn-box").className = "px-5 py-1 rounded-md text-xs font-bold transition " + (mode === "box" ? "bg-blue-600 text-white" : "hover:bg-slate-700 text-slate-400");
        document.getElementById("btn-sixpack").className = "px-5 py-1 rounded-md text-xs font-bold transition " + (mode === "sixpack" ? "bg-blue-600 text-white" : "hover:bg-slate-700 text-slate-400");

        App.save();
        App.renderAll();
    };

    App.expandCard = function expandCard(element) {
        if (App.state.hoverTimer) {
            clearTimeout(App.state.hoverTimer);
        }

        element.classList.add("is-expanded");
        if (element.parentElement) {
            element.parentElement.style.zIndex = "1000";
        }

        App.state.hoverTimer = setTimeout(function () {
            App.shrinkCard(element);
        }, 5000);
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
        if (enter) {
            App.state.lastHoveredElement = element;
            if (App.state.isShiftPressed) {
                App.expandCard(element);
            }
            return;
        }

        App.state.lastHoveredElement = null;
        App.shrinkCard(element);
    };

    App.init = function init() {
        App.loadAppData();
        App.setLayout(App.state.currentLayout);

        window.addEventListener("keydown", function (event) {
            if (event.key === "Shift") {
                App.state.isShiftPressed = true;
                if (App.state.lastHoveredElement) {
                    App.expandCard(App.state.lastHoveredElement);
                }
            }
        });

        window.addEventListener("keyup", function (event) {
            if (event.key === "Shift") {
                App.state.isShiftPressed = false;
                App.shrinkAll();
            }
        });
    };

    window.setLayout = App.setLayout;
    window.handleHover = App.handleHover;
    window.onload = App.init;
}());
