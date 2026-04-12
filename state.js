(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.state = {
        currentLayout: "box",
        jurors: [],
        editingJurorId: null,
        hoverTimer: null,
        lastHoveredElement: null,
        isShiftPressed: false
    };

    App.getSeatLimit = function getSeatLimit(layout) {
        return layout === "sixpack" ? 18 : 12;
    };

    App.createJuror = function createJuror(overrides) {
        const base = {
            id: "",
            name: "",
            city: "",
            household: "",
            status: "Pool",
            seat: null,
            rank: "neutral",
            personality: "",
            notes: "",
            notes2: "",
            selectionRating: "",
            experience: {
                type: "",
                verdict: false,
                foreperson: false,
                note: ""
            },
            excuseType: "none",
            strikeTime: null
        };

        const next = Object.assign({}, base, overrides || {});
        next.id = String(next.id || "");
        next.seat = next.seat === null || next.seat === undefined || next.seat === "" ? null : Number(next.seat);
        next.experience = Object.assign({}, base.experience, next.experience || {});
        return next;
    };

    App.normalizeJuror = function normalizeJuror(raw) {
        const experience = Array.isArray(raw && raw.experience)
            ? (raw.experience[0] || {})
            : ((raw && raw.experience) || {});

        return App.createJuror(Object.assign({}, raw || {}, { experience: experience }));
    };

    App.getJurorById = function getJurorById(id) {
        return App.state.jurors.find(function (juror) {
            return juror.id === String(id);
        });
    };

    App.getSeatedJuror = function getSeatedJuror(seat) {
        return App.state.jurors.find(function (juror) {
            return juror.status === "Seated" && juror.seat === seat;
        });
    };

    App.getPoolJurors = function getPoolJurors() {
        return App.state.jurors
            .filter(function (juror) { return juror.status === "Pool"; })
            .sort(App.sortJurorsById);
    };

    App.getStruckJurors = function getStruckJurors() {
        return App.state.jurors
            .filter(function (juror) {
                return juror.status === "Struck" && juror.excuseType !== "cause";
            })
            .sort(function (left, right) {
                return (left.strikeTime || 0) - (right.strikeTime || 0);
            });
    };

    App.sortJurorsById = function sortJurorsById(left, right) {
        return (parseInt(left.id, 10) || 0) - (parseInt(right.id, 10) || 0);
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
