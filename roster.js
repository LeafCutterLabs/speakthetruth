(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.processRoster = function processRoster() {
        const text = document.getElementById("roster-input").value;
        const lines = text.split("\n");

        lines.forEach(function (line) {
            if (!line.trim()) {
                return;
            }

            const match = line.match(/^(\d+)\s*[-:]?\s*(.*)$/);
            if (!match) {
                return;
            }

            const id = match[1].trim();
            const name = match[2].trim();
            const existing = App.getJurorById(id);

            if (existing) {
                existing.name = name;
                return;
            }

            App.state.jurors.push(App.createJuror({
                id: id,
                name: name
            }));
        });

        App.save();
        App.renderAll();
    };

    App.autofillSeats = function autofillSeats() {
        const limit = App.getSeatLimit(App.state.currentLayout);
        const available = App.getPoolJurors();
        let index = 0;

        for (let seat = 1; seat <= limit; seat += 1) {
            if (index >= available.length) {
                break;
            }

            if (!App.getSeatedJuror(seat)) {
                const juror = available[index];
                index += 1;
                juror.seat = seat;
                juror.status = "Seated";
                juror.excuseType = "none";
                juror.strikeTime = null;
            }
        }

        App.save();
        App.renderAll();
    };

    App.emptySeatClick = function emptySeatClick(seatNumber) {
        let targetJuror = App.getPoolJurors()[0];

        if (!targetJuror) {
            targetJuror = App.createJuror({
                id: App.getNextJurorId(),
                status: "Seated",
                seat: seatNumber
            });
            App.state.jurors.push(targetJuror);
        } else {
            targetJuror.seat = seatNumber;
            targetJuror.status = "Seated";
            targetJuror.excuseType = "none";
            targetJuror.strikeTime = null;
        }

        App.save();
        App.renderAll();
        App.openModal(targetJuror.id);
    };

    window.processRoster = App.processRoster;
    window.autofillSeats = App.autofillSeats;
}());
