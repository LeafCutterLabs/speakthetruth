(function () {
    const App = window.JuryApp = window.JuryApp || {};

    const RANK_SYMBOLS = {
        mountain: "&#9968;",
        bird: "&#128038;"
    };

    App.escapeHtml = function escapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    App.formatRichText = function formatRichText(text) {
        if (!text) {
            return "";
        }

        return String(text).split("\n").map(function (line) {
            let nextLine = line;
            let isRed = false;

            if (nextLine.startsWith("*")) {
                isRed = true;
                nextLine = nextLine.substring(1);
            }

            const processedLine = nextLine.split(/( +)/).map(function (token) {
                if (!token || /^ +$/.test(token)) {
                    return token;
                }

                if (token.startsWith("-")) {
                    return '<span class="under-word">' + App.escapeHtml(token.substring(1)) + "</span>";
                }

                return App.escapeHtml(token);
            }).join("");

            return '<div class="' + (isRed ? "star-line" : "") + '">' + processedLine + "</div>";
        }).join("");
    };

    App.formatNotesCentered = function formatNotesCentered(left, right) {
        const combined = [left, right].filter(Boolean).join("\n");
        return App.formatRichText(combined);
    };

    App.createCardHtml = function createCardHtml(juror, horiz, vert) {
        const exp = juror.experience || {};
        let expString = "";

        if (exp.type) {
            const typeCode = exp.type === "Crim" ? "M" : "V";
            const notePart = exp.note ? ":" + App.escapeHtml(exp.note) : "";
            const fullText = typeCode + notePart;
            expString = exp.verdict ? '<span class="underline">' + fullText + "</span>" : fullText;
        }

        const scoreTxt = (juror.selectionRating || juror.personality)
            ? App.escapeHtml(
                (juror.selectionRating || "") +
                (juror.selectionRating && juror.personality ? ":" : "") +
                (juror.personality || "")
            )
            : "";

        const jurorIdJs = JSON.stringify(String(juror.id));
        const jurorIdAttr = App.escapeHtml(juror.id);
        const rankSymbol = RANK_SYMBOLS[juror.rank] || "";

        return `
            <div draggable="true" ondragstart="dragStart(event)" onmouseenter="handleHover(this, true)" onmouseleave="handleHover(this, false)"
                 data-juror-id="${jurorIdAttr}" data-seat="${juror.seat}" onclick="event.stopPropagation(); openModal(${jurorIdJs})"
                 class="post-it ${horiz} ${vert} ${juror.rank !== "neutral" ? "selected-rank" : ""}">
                <div class="text-center border-b border-yellow-600/10 pb-0.5 mb-1 shrink-0">
                    <div class="font-black text-slate-800 text-[14px] uppercase truncate">${App.escapeHtml(juror.name || "...")} [${jurorIdAttr}]</div>
                </div>
                <div class="minimal-only flex-1 flex items-center justify-center">
                    <div class="text-slate-900 font-bold text-center leading-tight">${App.formatNotesCentered(juror.notes, juror.notes2)}</div>
                </div>
                <div class="expanded-only">
                    <div class="flex justify-between items-start gap-1 mb-2 border-b border-slate-300 pb-2">
                        <div class="text-[13px] font-bold text-slate-700 leading-tight whitespace-pre-wrap flex-1">${App.formatRichText(juror.household)}</div>
                        <div class="text-[14px] font-black text-blue-900">${App.escapeHtml(juror.city || "")}</div>
                    </div>
                    <div class="expanded-notes text-slate-900 font-bold text-center italic mt-2 whitespace-pre-wrap">${App.formatNotesCentered(juror.notes, juror.notes2)}</div>
                </div>
                <div class="flex justify-between items-center mt-auto shrink-0 px-1 pt-1 gap-2">
                    <div class="flex-1 flex items-center gap-2 overflow-hidden whitespace-nowrap">
                        <div class="font-black text-[13px] text-slate-800 uppercase">${expString}</div>
                        <div class="flex-1 text-center font-black text-[13px] text-slate-800 uppercase">${scoreTxt}</div>
                    </div>
                    <div class="w-8 text-right text-2xl leading-none">${rankSymbol}</div>
                </div>
            </div>
        `;
    };

    App.renderAll = function renderAll() {
        const wrapper = document.getElementById("courtroom-grid-wrapper");
        wrapper.innerHTML = "";

        const rowsCount = App.state.currentLayout === "sixpack" ? 3 : 2;
        for (let row = 0; row < rowsCount; row += 1) {
            const rowDiv = document.createElement("div");
            rowDiv.className = "grid grid-cols-6 gap-1.5 h-full";

            for (let column = 1; column <= 6; column += 1) {
                const seatNum = (row * 6) + column;
                const zone = document.createElement("div");
                zone.id = "seat-" + seatNum;
                zone.className = "seat-drop-zone";
                zone.ondragover = function onDragOver(event) { event.preventDefault(); };
                zone.ondrop = App.drop;

                const juror = App.getSeatedJuror(seatNum);
                if (juror) {
                    const horiz = column % 2 !== 0 ? "quad-left" : "quad-right";
                    const vert = row === 0 ? "quad-top" : "quad-bottom";
                    zone.innerHTML = App.createCardHtml(juror, horiz, vert);
                } else {
                    zone.innerText = String(seatNum);
                    zone.onclick = function onClick() {
                        App.emptySeatClick(seatNum);
                    };
                }

                rowDiv.appendChild(zone);
            }

            wrapper.appendChild(rowDiv);
        }

        const poolList = document.getElementById("pool-list");
        poolList.innerHTML = App.getPoolJurors().map(function (juror) {
            const jurorIdJs = JSON.stringify(String(juror.id));
            return '<div draggable="true" ondragstart="dragStart(event)" data-juror-id="' + App.escapeHtml(juror.id) + '" onclick="openModal(' + jurorIdJs + ')" class="bg-white border p-2 rounded text-xs font-black cursor-grab shadow-sm active:cursor-grabbing hover:border-blue-400 transition-colors">' + App.escapeHtml(juror.name || "...") + " [" + App.escapeHtml(juror.id) + "]</div>";
        }).join("");

        let peopleCount = 0;
        let defenseCount = 0;
        const strikeMarkup = App.getStruckJurors().map(function (juror) {
            const isPeople = juror.excuseType === "people";
            const strikeNumber = isPeople ? ++peopleCount : ++defenseCount;
            const jurorIdJs = JSON.stringify(String(juror.id));
            return '<div class="strike-card ' + (isPeople ? "strike-people" : "strike-defense") + '" onclick="openModal(' + jurorIdJs + ')">' + strikeNumber + ": " + App.escapeHtml(juror.name || "...") + " [" + App.escapeHtml(juror.id) + "]</div>";
        }).join("");

        const strikeList = document.getElementById("struck-juror-list");
        strikeList.innerHTML = strikeMarkup;
        strikeList.scrollTop = strikeList.scrollHeight;

        document.getElementById("tally-people").innerText = String(App.state.jurors.filter(function (juror) {
            return juror.excuseType === "people";
        }).length);

        document.getElementById("tally-defense").innerText = String(App.state.jurors.filter(function (juror) {
            return juror.excuseType === "defense";
        }).length);
    };
}());
