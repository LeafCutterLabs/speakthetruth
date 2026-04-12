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

    function updateJurorDisposition(juror, excuseType) {
        if (excuseType === "none") {
            juror.excuseType = "none";
            juror.strikeTime = null;
            juror.status = juror.seat === null ? "Pool" : "Seated";
            return;
        }

        juror.excuseType = excuseType;
        juror.status = "Struck";
        juror.seat = null;

        if ((excuseType === "people" || excuseType === "defense") && !juror.strikeTime) {
            juror.strikeTime = Date.now();
        }
    }

    App.openModal = function openModal(id) {
        const juror = App.getJurorById(id);
        if (!juror) {
            return;
        }

        App.state.editingJurorId = juror.id;
        document.getElementById("edit-name").value = juror.name;
        document.getElementById("edit-id-input").value = juror.id;
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
            document.getElementById("edit-name").focus();
        }, 10);
    };

    App.closeModal = function closeModal() {
        const juror = App.getJurorById(App.state.editingJurorId);
        if (!juror) {
            return;
        }

        const nextId = String(document.getElementById("edit-id-input").value || "").trim();
        if (!nextId) {
            alert("Juror ID is required.");
            return;
        }

        const conflictingJuror = App.state.jurors.find(function (candidate) {
            return candidate !== juror && candidate.id === nextId;
        });

        if (conflictingJuror) {
            alert("Juror ID must be unique.");
            return;
        }

        juror.name = document.getElementById("edit-name").value;
        juror.id = nextId;
        juror.city = document.getElementById("edit-city").value;
        juror.household = document.getElementById("edit-household").value;
        juror.notes = document.getElementById("edit-notes").value;
        juror.notes2 = document.getElementById("edit-notes2").value;
        juror.selectionRating = document.getElementById("edit-rating").value;
        juror.personality = document.getElementById("edit-personality").value;
        juror.experience = readExperienceForm();
        updateJurorDisposition(juror, document.getElementById("edit-excuse-type").value);

        App.save();
        App.renderAll();
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
        ["btn-mtn", "btn-bird"].forEach(function (id) {
            const button = document.getElementById(id);
            const isActive = (id === "btn-mtn" && rank === "mountain") || (id === "btn-bird" && rank === "bird");
            button.style.borderWidth = isActive ? "4px" : "2px";
            button.style.borderColor = isActive ? "#1e293b" : "#cbd5e1";
            button.style.backgroundColor = isActive ? "#f1f5f9" : "white";
        });
    };

    window.openModal = App.openModal;
    window.closeModal = App.closeModal;
    window.toggleRankInModal = App.toggleRankInModal;
}());
