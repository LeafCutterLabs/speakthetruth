(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.setRosterFeedback = function setRosterFeedback(message, tone) {
        const feedback = document.getElementById("roster-feedback");
        if (!feedback) {
            return;
        }

        feedback.innerText = message || "";
        feedback.className = "min-h-[1rem] text-[10px] font-bold uppercase tracking-wide " + (
            tone === "warn" ? "text-amber-600" :
            tone === "ok" ? "text-blue-600" :
            "text-slate-400"
        );
    };

    App.processRoster = function processRoster() {
        const summary = App.loadRosterEntries(document.getElementById("roster-input").value);

        document.getElementById("roster-input").value = "";
        App.setRosterInputExpanded(false);
        App.setRosterFeedback(
            "Loaded " + summary.loaded + "  Updated " + summary.updated + "  Skipped " + summary.skipped,
            summary.skipped > 0 ? "warn" : "ok"
        );
    };

    App.autofillSeats = function autofillSeats() {
        App.autofillSeatsAction();
    };

    App.emptySeatClick = function emptySeatClick(seatNumber) {
        const targetJuror = App.fillEmptySeatAction(seatNumber);
        App.openModal(targetJuror.id);
    };

    window.processRoster = App.processRoster;
    window.autofillSeats = App.autofillSeats;
}());
