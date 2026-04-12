(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.dragStart = function dragStart(event) {
        event.dataTransfer.setData("jurorId", event.target.dataset.jurorId);
        event.dataTransfer.setData("fromSeat", event.target.dataset.seat || "");
    };

    App.drop = function drop(event) {
        event.preventDefault();

        const fromSeatRaw = event.dataTransfer.getData("fromSeat");
        const jurorId = event.dataTransfer.getData("jurorId");
        const targetSeat = parseInt(event.currentTarget.id.split("-")[1], 10);

        if (!fromSeatRaw) {
            const movingJuror = App.getJurorById(jurorId);
            const existing = App.getSeatedJuror(targetSeat);

            if (existing) {
                existing.seat = null;
                existing.status = "Pool";
            }

            if (movingJuror) {
                movingJuror.seat = targetSeat;
                movingJuror.status = "Seated";
                movingJuror.excuseType = "none";
            }
        } else {
            const fromSeat = parseInt(fromSeatRaw, 10);
            if (fromSeat !== targetSeat) {
                const jurorA = App.getSeatedJuror(fromSeat);
                const jurorB = App.getSeatedJuror(targetSeat);

                if (jurorA) {
                    jurorA.seat = targetSeat;
                }

                if (jurorB) {
                    jurorB.seat = fromSeat;
                }
            }
        }

        App.save();
        App.renderAll();
    };

    window.dragStart = App.dragStart;
    window.drop = App.drop;
}());
