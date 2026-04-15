(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.clearDropTargets = function clearDropTargets() {
        document.querySelectorAll(".seat-drop-zone.is-drop-target").forEach(function (zone) {
            zone.classList.remove("is-drop-target");
        });
    };

    App.dragStart = function dragStart(event) {
        const card = event.target.closest(".post-it, [data-juror-id]");
        if (!card) {
            return;
        }

        card.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("jurorId", card.dataset.jurorId);
        event.dataTransfer.setData("fromSeat", card.dataset.seat || "");
    };

    App.dragEnd = function dragEnd(event) {
        const card = event.target.closest(".post-it, [data-juror-id]");
        if (card) {
            card.classList.remove("is-dragging");
        }

        App.clearDropTargets();
    };

    App.dragEnterSeat = function dragEnterSeat(event) {
        const zone = event.currentTarget;
        if (zone) {
            zone.classList.add("is-drop-target");
        }
    };

    App.dragLeaveSeat = function dragLeaveSeat(event) {
        const zone = event.currentTarget;
        if (zone && !zone.contains(event.relatedTarget)) {
            zone.classList.remove("is-drop-target");
        }
    };

    App.drop = function drop(event) {
        event.preventDefault();
        App.clearDropTargets();

        const fromSeatRaw = event.dataTransfer.getData("fromSeat");
        const jurorId = event.dataTransfer.getData("jurorId");
        const targetSeat = parseInt(event.currentTarget.id.split("-")[1], 10);
        App.applyDragDropAction(jurorId, fromSeatRaw, targetSeat);
    };

    window.dragStart = App.dragStart;
    window.dragEnd = App.dragEnd;
    window.drop = App.drop;
}());
