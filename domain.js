(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.constants = {
        layouts: {
            box: "box",
            sixpack: "sixpack"
        },
        status: {
            pool: "Pool",
            seated: "Seated",
            struck: "Struck"
        },
        excuseType: {
            none: "none",
            cause: "cause",
            people: "people",
            defense: "defense"
        }
    };

    App.getSeatLimit = function getSeatLimit(layout) {
        return layout === App.constants.layouts.sixpack ? 18 : 12;
    };

    App.normalizeJurorNumber = function normalizeJurorNumber(value) {
        const nextValue = String(value || "").trim();
        return /^\d+$/.test(nextValue) ? nextValue : "*";
    };

    App.toTitleCase = function toTitleCase(value) {
        return String(value || "").split(/\s+/).filter(Boolean).map(function (part) {
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join(" ");
    };

    App.normalizePersonName = function normalizePersonName(rawName) {
        const cleaned = String(rawName || "").replace(/\s+/g, " ").trim();
        if (!cleaned) {
            return "";
        }

        if (cleaned.indexOf(",") !== -1) {
            const parts = cleaned.split(",").map(function (part) {
                return part.trim();
            }).filter(Boolean);

            if (parts.length >= 2) {
                return App.toTitleCase(parts.slice(1).join(" ") + " " + parts[0]);
            }
        }

        return App.toTitleCase(cleaned);
    };

    App.createJuror = function createJuror(overrides) {
        const base = {
            id: "",
            jurorNumber: "*",
            name: "",
            city: "",
            household: "",
            status: App.constants.status.pool,
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
            excuseType: App.constants.excuseType.none,
            strikeTime: null
        };

        const next = Object.assign({}, base, overrides || {});
        next.id = String(next.id || "");
        next.jurorNumber = App.normalizeJurorNumber(next.jurorNumber);
        next.name = App.normalizePersonName(next.name);
        next.seat = next.seat === null || next.seat === undefined || next.seat === "" ? null : Number(next.seat);
        next.experience = Object.assign({}, base.experience, next.experience || {});
        return next;
    };

    App.normalizeJuror = function normalizeJuror(raw) {
        const experience = Array.isArray(raw && raw.experience)
            ? (raw.experience[0] || {})
            : ((raw && raw.experience) || {});

        return App.createJuror(Object.assign({}, raw || {}, {
            jurorNumber: (raw && raw.jurorNumber) || (raw && raw.id) || "*",
            experience: experience
        }));
    };

    App.sortJurorsByDisplayOrder = function sortJurorsByDisplayOrder(left, right) {
        const leftHasNumber = /^\d+$/.test(left.jurorNumber || "");
        const rightHasNumber = /^\d+$/.test(right.jurorNumber || "");

        if (leftHasNumber && rightHasNumber) {
            return (parseInt(left.jurorNumber, 10) || 0) - (parseInt(right.jurorNumber, 10) || 0);
        }

        if (leftHasNumber) {
            return -1;
        }

        if (rightHasNumber) {
            return 1;
        }

        return String(left.name || "").localeCompare(String(right.name || ""));
    };

    App.formatJurorLabel = function formatJurorLabel(juror) {
        return App.normalizePersonName(juror.name || "...") + " [" + App.normalizeJurorNumber(juror.jurorNumber) + "]";
    };

    App.parseRosterLine = function parseRosterLine(line) {
        const trimmed = String(line || "").trim();
        if (!trimmed) {
            return null;
        }

        const tokens = trimmed.match(/[A-Za-z]+(?:['.-][A-Za-z]+)*|\d+|[^\s]/g) || [];
        const numberTokenIndex = tokens.findIndex(function (token) {
            return /^\d+$/.test(token);
        });

        const jurorNumber = numberTokenIndex === -1 ? "*" : tokens[numberTokenIndex];
        const nameTokens = tokens.filter(function (_token, index) {
            return index !== numberTokenIndex;
        }).filter(function (token) {
            return /[A-Za-z]/.test(token);
        });

        const name = App.normalizePersonName(nameTokens.join(" ")
            .replace(/^[,\-:;#()[\]\s]+/, "")
            .replace(/[,\-:;#()[\]\s]+$/, "")
            .replace(/\s+/g, " ")
            .trim());

        if (!name) {
            return null;
        }

        return {
            jurorNumber: App.normalizeJurorNumber(jurorNumber),
            name: name
        };
    };

    App.findMatchingJurorForRosterEntry = function findMatchingJurorForRosterEntry(jurors, parsed) {
        if (parsed.jurorNumber !== "*") {
            return jurors.find(function (juror) {
                return juror.jurorNumber === parsed.jurorNumber;
            }) || null;
        }

        return jurors.find(function (juror) {
            return juror.jurorNumber === "*" && App.normalizePersonName(juror.name) === parsed.name;
        }) || null;
    };

    App.assignJurorToSeat = function assignJurorToSeat(juror, seat) {
        juror.seat = seat;
        juror.status = App.constants.status.seated;
        juror.excuseType = App.constants.excuseType.none;
        juror.strikeTime = null;
        return juror;
    };

    App.returnJurorToPool = function returnJurorToPool(juror) {
        juror.seat = null;
        juror.status = App.constants.status.pool;
        juror.excuseType = App.constants.excuseType.none;
        juror.strikeTime = null;
        return juror;
    };

    App.swapJurorSeats = function swapJurorSeats(jurorA, jurorB) {
        const seatA = jurorA ? jurorA.seat : null;
        const seatB = jurorB ? jurorB.seat : null;

        if (jurorA) {
            jurorA.seat = seatB;
        }

        if (jurorB) {
            jurorB.seat = seatA;
        }
    };

    App.applyJurorDisposition = function applyJurorDisposition(juror, excuseType) {
        if (excuseType === App.constants.excuseType.none) {
            juror.excuseType = App.constants.excuseType.none;
            juror.strikeTime = null;
            juror.status = juror.seat === null ? App.constants.status.pool : App.constants.status.seated;
            return juror;
        }

        juror.excuseType = excuseType;
        juror.status = App.constants.status.struck;
        juror.seat = null;

        if ((excuseType === App.constants.excuseType.people || excuseType === App.constants.excuseType.defense) && !juror.strikeTime) {
            juror.strikeTime = Date.now();
        }

        if (excuseType === App.constants.excuseType.cause) {
            juror.strikeTime = null;
        }

        return juror;
    };
}());
