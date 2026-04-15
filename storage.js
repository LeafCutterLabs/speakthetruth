(function () {
    const App = window.JuryApp = window.JuryApp || {};

    const KEY_DATA = "jury_pro_v37_data";
    const KEY_ROSTER = "jury_pro_v37_roster";
    const KEY_LAYOUT = "jury_pro_v37_layout";
    const KEY_PREFERENCES = "jury_pro_v37_preferences";

    App.storageKeys = {
        data: KEY_DATA,
        roster: KEY_ROSTER,
        layout: KEY_LAYOUT,
        preferences: KEY_PREFERENCES
    };

    App.readCaseFields = function readCaseFields() {
        return {
            name: document.getElementById("case-name").value,
            num: document.getElementById("case-num").value,
            date: document.getElementById("case-date").value
        };
    };

    App.writeCaseFields = function writeCaseFields(caseData) {
        const next = caseData || {};
        document.getElementById("case-name").value = next.name || "";
        document.getElementById("case-num").value = next.num || "";
        document.getElementById("case-date").value = next.date || "";
    };

    App.normalizeImportedData = function normalizeImportedData(data) {
        const jurors = Array.isArray(data && data.jurors)
            ? data.jurors.map(App.normalizeJuror)
            : Array.isArray(data)
                ? data.map(App.normalizeJuror)
                : [];

        return {
            jurors: jurors,
            case: (data && data.case) || {},
            roster: (data && data.roster) || "",
            layout: (data && data.layout) || "box"
        };
    };

    App.save = function save() {
        const payload = {
            jurors: App.state.jurors,
            case: App.readCaseFields()
        };

        localStorage.setItem(KEY_DATA, JSON.stringify(payload));
        localStorage.setItem(KEY_ROSTER, document.getElementById("roster-input").value);
        localStorage.setItem(KEY_LAYOUT, App.state.currentLayout);
        localStorage.setItem(KEY_PREFERENCES, JSON.stringify(App.state.preferences));
    };

    App.loadAppData = function loadAppData() {
        const rawData = localStorage.getItem(KEY_DATA);
        const rawRoster = localStorage.getItem(KEY_ROSTER);
        const rawLayout = localStorage.getItem(KEY_LAYOUT);
        const rawPreferences = localStorage.getItem(KEY_PREFERENCES);

        if (rawRoster) {
            document.getElementById("roster-input").value = rawRoster;
        }

        if (rawData) {
            const parsed = JSON.parse(rawData);
            const normalized = App.normalizeImportedData(parsed);
            App.state.jurors = normalized.jurors;
            App.writeCaseFields(normalized.case);
        }

        if (rawLayout) {
            App.state.currentLayout = rawLayout;
        }

        if (rawPreferences) {
            try {
                App.state.preferences = Object.assign({}, App.state.preferences, JSON.parse(rawPreferences));
            } catch (_error) {
                App.state.preferences = Object.assign({}, App.state.preferences);
            }
        }
    };

    App.exportData = function exportData() {
        const data = {
            jurors: App.state.jurors,
            case: App.readCaseFields(),
            roster: document.getElementById("roster-input").value,
            layout: App.state.currentLayout,
            ts: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "jury-backup.json";
        link.click();
        URL.revokeObjectURL(link.href);
    };

    App.importData = function importData(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function onLoad(loadEvent) {
            try {
                const parsed = JSON.parse(loadEvent.target.result);
                const normalized = App.normalizeImportedData(parsed);
                App.state.jurors = normalized.jurors;
                document.getElementById("roster-input").value = normalized.roster;
                App.writeCaseFields(normalized.case);
                if (App.setRosterFeedback) {
                    App.setRosterFeedback("", "neutral");
                }
                App.setLayout(normalized.layout);
                App.renderAll();
            } catch (error) {
                alert("Invalid file");
            }
        };

        reader.readAsText(file);
    };

    App.resetData = function resetData() {
        if (!confirm("Reset All Data?")) {
            return;
        }

        App.state.jurors = [];
        App.writeCaseFields({});
        document.getElementById("roster-input").value = "";
        if (App.setRosterFeedback) {
            App.setRosterFeedback("", "neutral");
        }
        App.save();
        App.renderAll();
    };

    window.save = App.save;
    window.exportData = App.exportData;
    window.importData = App.importData;
    window.resetData = App.resetData;
}());
