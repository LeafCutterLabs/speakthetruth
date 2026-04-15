(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.state = {
        currentLayout: "box",
        jurors: [],
        preferences: {
            overviewFontSize: "medium",
            theme: "default"
        },
        editingJurorId: null,
        hoverTimer: null,
        sidebarTimer: null,
        lucideFrame: null,
        lastHoveredElement: null,
        isShiftPressed: false,
        isSidebarPinned: false
    };

    App.getJurorById = function getJurorById(id) {
        return App.state.jurors.find(function (juror) {
            return juror.id === String(id);
        });
    };

    App.getSeatedJuror = function getSeatedJuror(seat) {
        return App.state.jurors.find(function (juror) {
            return juror.status === App.constants.status.seated && juror.seat === seat;
        });
    };

    App.getJurorByNumber = function getJurorByNumber(jurorNumber) {
        return App.state.jurors.find(function (juror) {
            return juror.jurorNumber === String(jurorNumber);
        });
    };

    App.getPoolJurors = function getPoolJurors() {
        return App.state.jurors
            .filter(function (juror) { return juror.status === App.constants.status.pool; })
            .sort(App.sortJurorsByDisplayOrder);
    };

    App.getStruckJurors = function getStruckJurors() {
        return App.state.jurors
            .filter(function (juror) {
                return juror.status === App.constants.status.struck && juror.excuseType !== App.constants.excuseType.cause;
            })
            .sort(function (left, right) {
                return (left.strikeTime || 0) - (right.strikeTime || 0);
            });
    };

    App.getNextJurorId = function getNextJurorId() {
        if (!App.state.jurors.length) {
            return "1";
        }

        const nextId = Math.max.apply(null, App.state.jurors.map(function (juror) {
            return parseInt(juror.id, 10) || 0;
        })) + 1;

        return String(nextId);
    };
}());
