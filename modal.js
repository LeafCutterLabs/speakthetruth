(function () {
    const App = window.JuryApp = window.JuryApp || {};

    function setModalVisible(isVisible) {
        const overlay = document.getElementById("modal-overlay");
        overlay.classList.replace(isVisible ? "hidden" : "flex", isVisible ? "flex" : "hidden");
    }

    function readExperienceForm() {
        return {
            type: document.getElementById("exp-type").value,
            verdict: document.getElementById("exp-verdict").checked,
            foreperson: document.getElementById("exp-fore").checked,
            note: document.getElementById("exp-note").value
        };
    }

    App.openModal = function openModal(id) {
        const juror = App.getJurorById(id);
        if (!juror) {
            return;
        }

        App.state.editingJurorId = juror.id;
        document.getElementById("edit-name").value = App.normalizePersonName(juror.name);
        document.getElementById("edit-id-input").value = juror.jurorNumber || "*";
        document.getElementById("edit-city").value = juror.city;
        document.getElementById("edit-household").value = juror.household;
        document.getElementById("edit-notes").value = juror.notes || "";
        document.getElementById("edit-notes2").value = juror.notes2 || "";
        document.getElementById("edit-rating").value = juror.selectionRating || "";
        document.getElementById("edit-personality").value = juror.personality || "";
        document.getElementById("edit-excuse-type").value = juror.excuseType || "none";
        document.getElementById("edit-ids").innerText = "Seat Location " + (juror.seat === null ? "-" : juror.seat);

        const exp = juror.experience || {};
        document.getElementById("exp-type").value = exp.type || "";
        document.getElementById("exp-verdict").checked = !!exp.verdict;
        document.getElementById("exp-fore").checked = !!exp.foreperson;
        document.getElementById("exp-note").value = exp.note || "";

        App.updateModalRankUI(juror.rank);
        setModalVisible(true);
        setTimeout(function () {
            document.getElementById("edit-city").focus();
        }, 10);
    };

    App.closeModal = function closeModal() {
        const juror = App.getJurorById(App.state.editingJurorId);
        if (!juror) {
            return;
        }

        const result = App.saveJurorDetailsAction(juror, {
            name: document.getElementById("edit-name").value,
            jurorNumber: document.getElementById("edit-id-input").value,
            city: document.getElementById("edit-city").value,
            household: document.getElementById("edit-household").value,
            notes: document.getElementById("edit-notes").value,
            notes2: document.getElementById("edit-notes2").value,
            selectionRating: document.getElementById("edit-rating").value,
            personality: document.getElementById("edit-personality").value,
            experience: readExperienceForm(),
            excuseType: document.getElementById("edit-excuse-type").value
        });

        if (!result.ok) {
            alert(result.message);
            return;
        }

        setModalVisible(false);
    };

    App.toggleRankInModal = function toggleRankInModal(rank) {
        const juror = App.getJurorById(App.state.editingJurorId);
        if (!juror) {
            return;
        }

        juror.rank = juror.rank === rank ? "neutral" : rank;
        App.updateModalRankUI(juror.rank);
    };

    App.updateModalRankUI = function updateModalRankUI(rank) {
        const isDark = document.body.classList.contains("app-theme-dark");
        ["btn-mtn", "btn-bird"].forEach(function (id) {
            const button = document.getElementById(id);
            const isActive = (id === "btn-mtn" && rank === "mountain") || (id === "btn-bird" && rank === "bird");
            button.style.borderWidth = isActive ? "4px" : "2px";
            button.style.borderColor = isActive ? (isDark ? "#93c5fd" : "#1e293b") : (isDark ? "#475569" : "#cbd5e1");
            button.style.backgroundColor = isActive ? (isDark ? "#162133" : "#f1f5f9") : (isDark ? "#0f172a" : "white");
        });
    };

    window.openModal = App.openModal;
    window.closeModal = App.closeModal;
    window.toggleRankInModal = App.toggleRankInModal;
}());
