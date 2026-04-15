(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.refreshView = function refreshView(options) {
        const next = Object.assign({
            save: false,
            courtroom: false,
            pool: false,
            strikes: false,
            tallies: false
        }, options || {});

        if (next.save) {
            App.save();
        }

        if (next.courtroom) {
            App.renderCourtroom();
        }

        if (next.pool) {
            App.renderPool();
        }

        if (next.strikes) {
            App.renderStrikes();
        }

        if (next.tallies) {
            App.renderTallies();
        }

        App.scheduleLucideRender();
    };

    App.loadRosterEntries = function loadRosterEntries(text) {
        const lines = String(text || "").split("\n");
        const summary = {
            loaded: 0,
            updated: 0,
            skipped: 0
        };

        lines.forEach(function (line) {
            const parsed = App.parseRosterLine(line);
            if (!parsed) {
                summary.skipped += 1;
                return;
            }

            const existing = App.findMatchingJurorForRosterEntry(App.state.jurors, parsed);
            if (existing) {
                existing.name = parsed.name;
                existing.jurorNumber = parsed.jurorNumber;
                summary.updated += 1;
                return;
            }

            App.state.jurors.push(App.createJuror({
                id: App.getNextJurorId(),
                jurorNumber: parsed.jurorNumber,
                name: parsed.name
            }));
            summary.loaded += 1;
        });

        App.refreshView({
            save: true,
            courtroom: true,
            pool: true,
            strikes: true
        });

        return summary;
    };

    App.autofillSeatsAction = function autofillSeatsAction() {
        const limit = App.getSeatLimit(App.state.currentLayout);
        const available = App.getPoolJurors();
        let index = 0;

        for (let seat = 1; seat <= limit; seat += 1) {
            if (index >= available.length) {
                break;
            }

            if (!App.getSeatedJuror(seat)) {
                App.assignJurorToSeat(available[index], seat);
                index += 1;
            }
        }

        App.refreshView({
            save: true,
            courtroom: true,
            pool: true
        });
    };

    App.fillEmptySeatAction = function fillEmptySeatAction(seatNumber) {
        let targetJuror = App.getPoolJurors()[0];

        if (!targetJuror) {
            targetJuror = App.createJuror({
                id: App.getNextJurorId(),
                jurorNumber: "*",
                status: App.constants.status.seated,
                seat: seatNumber
            });
            App.state.jurors.push(targetJuror);
        } else {
            App.assignJurorToSeat(targetJuror, seatNumber);
        }

        App.refreshView({
            save: true,
            courtroom: true,
            pool: true
        });

        return targetJuror;
    };

    App.applyDragDropAction = function applyDragDropAction(jurorId, fromSeatRaw, targetSeat) {
        const movingJuror = App.getJurorById(jurorId);
        if (!movingJuror) {
            return;
        }

        if (!fromSeatRaw) {
            const existing = App.getSeatedJuror(targetSeat);

            if (existing && existing !== movingJuror) {
                App.returnJurorToPool(existing);
            }

            App.assignJurorToSeat(movingJuror, targetSeat);
        } else {
            const fromSeat = parseInt(fromSeatRaw, 10);
            if (fromSeat !== targetSeat) {
                const targetJuror = App.getSeatedJuror(targetSeat);

                if (targetJuror && targetJuror !== movingJuror) {
                    targetJuror.seat = fromSeat;
                    targetJuror.status = App.constants.status.seated;
                }

                movingJuror.seat = targetSeat;
                movingJuror.status = App.constants.status.seated;
                movingJuror.excuseType = App.constants.excuseType.none;
            }
        }

        App.refreshView({
            save: true,
            courtroom: true,
            pool: true
        });
    };

    App.saveJurorDetailsAction = function saveJurorDetailsAction(juror, formData) {
        const nextJurorNumber = String(formData.jurorNumber || "").trim() || "*";
        if (App.normalizeJurorNumber(nextJurorNumber) !== nextJurorNumber && nextJurorNumber !== "*") {
            return {
                ok: false,
                message: "Juror number must be digits or *."
            };
        }

        const conflictingJuror = App.state.jurors.find(function (candidate) {
            return candidate !== juror && candidate.jurorNumber === nextJurorNumber && nextJurorNumber !== "*";
        });

        if (conflictingJuror) {
            return {
                ok: false,
                message: "Juror number must be unique."
            };
        }

        juror.name = App.normalizePersonName(formData.name);
        juror.jurorNumber = App.normalizeJurorNumber(nextJurorNumber);
        juror.city = formData.city;
        juror.household = formData.household;
        juror.notes = formData.notes;
        juror.notes2 = formData.notes2;
        juror.selectionRating = formData.selectionRating;
        juror.personality = formData.personality;
        juror.experience = formData.experience;
        App.applyJurorDisposition(juror, formData.excuseType);

        App.refreshView({
            save: true,
            courtroom: true,
            pool: true,
            strikes: true,
            tallies: true
        });

        return { ok: true };
    };

    App.setLayoutAction = function setLayoutAction(mode) {
        App.state.currentLayout = mode;
        const seatLimit = App.getSeatLimit(mode);

        App.state.jurors.forEach(function (juror) {
            if (juror.status === App.constants.status.seated && juror.seat !== null && juror.seat > seatLimit) {
                App.returnJurorToPool(juror);
            }
        });

        App.refreshView({
            save: true,
            courtroom: true,
            pool: true,
            strikes: true,
            tallies: true
        });
    };
}());
