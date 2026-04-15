(function () {
    const App = window.JuryApp = window.JuryApp || {};

    App.escapeHtml = function escapeHtml(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    };

    App.highlightAttentionMarkup = function highlightAttentionMarkup(text) {
        return String(text || "")
            .replace(/!!/g, '<span class="attention-mark">!!</span>')
            .replace(/\?\?/g, '<span class="attention-mark">??</span>');
    };

    App.formatRichText = function formatRichText(text) {
        if (!text) {
            return "";
        }

        return String(text).split("\n").map(function (line) {
            let nextLine = line;
            let isRed = false;
            const hasAlert = nextLine.indexOf("!!") !== -1;
            const hasQuestion = nextLine.indexOf("??") !== -1;

            if (nextLine.startsWith("*")) {
                isRed = true;
                nextLine = nextLine.substring(1);
            }

            const processedLine = nextLine.split(/(".*?")/).map(function (segment) {
                if (!segment) {
                    return "";
                }

                const isQuoted = segment.length >= 2 && segment.startsWith("\"") && segment.endsWith("\"");
                if (isQuoted) {
                    return '<span class="quote-line">' + App.escapeHtml(segment) + "</span>";
                }

                return segment.split(/( +)/).map(function (token) {
                    if (!token || /^ +$/.test(token)) {
                        return token;
                    }

                    if (token.startsWith("-")) {
                        return '<span class="under-word">' + App.highlightAttentionMarkup(App.escapeHtml(token.substring(1))) + "</span>";
                    }

                    return App.highlightAttentionMarkup(App.escapeHtml(token));
                }).join("");
            }).join("");

            const lineClasses = [
                isRed ? "star-line" : "",
                hasAlert ? "attention-line attention-line-alert" : "",
                hasQuestion ? "attention-line attention-line-question" : ""
            ].filter(Boolean).join(" ");

            return '<div class="' + lineClasses + '">' + processedLine + "</div>";
        }).join("");
    };

    App.formatNotesCentered = function formatNotesCentered(left, right) {
        const combined = [left, right].filter(Boolean).join("\n");
        return App.formatRichText(combined);
    };

    App.formatOverviewNotes = function formatOverviewNotes(text) {
        return App.formatRichText(text || "");
    };

    App.getOverviewNotesClass = function getOverviewNotesClass(left, right) {
        const combined = String(left || "").trim();
        const overviewFontSize = App.state.preferences.overviewFontSize || "medium";
        if (!combined) {
            return "post-it-notes-size-md";
        }

        const lines = combined.split("\n").filter(function (line) {
            return line.trim().length > 0;
        });
        const maxLineLength = lines.reduce(function (maxLength, line) {
            return Math.max(maxLength, line.trim().length);
        }, 0);

        if (lines.length <= 2 && maxLineLength <= 18) {
            return "post-it-notes-size-xl";
        }

        if (lines.length <= 3 && maxLineLength <= 28) {
            return "post-it-notes-size-lg";
        }

        if (lines.length >= 5 || maxLineLength > 40) {
            return "post-it-notes-size-sm";
        }

        if (overviewFontSize === "xlarge") {
            if (lines.length >= 4 || maxLineLength > 32) {
                return "post-it-notes-size-sm";
            }

            if (lines.length >= 3 || maxLineLength > 24) {
                return "post-it-notes-size-md";
            }
        }

        return "post-it-notes-size-md";
    };

    App.getOverviewTitleConfig = function getOverviewTitleConfig(juror) {
        const overviewFontSize = App.state.preferences.overviewFontSize || "medium";
        const baseFontSizeByPreference = {
            small: 1.1,
            medium: 1.3,
            large: 1.5,
            xlarge: 1.7
        };

        const name = App.normalizePersonName(juror.name || "...");
        const jurorNumber = App.normalizeJurorNumber(juror.jurorNumber);
        const nameParts = name.split(/\s+/).filter(Boolean);
        const lastName = nameParts.length ? nameParts[nameParts.length - 1] : name;
        const label = (lastName || name) + " [" + jurorNumber + "]";
        const labelLength = label.length;
        const baseSize = baseFontSizeByPreference[overviewFontSize] || baseFontSizeByPreference.medium;
        let scale = 1;

        if (labelLength <= 14) {
            scale = 1.08;
        } else if (labelLength <= 18) {
            scale = 1;
        } else if (labelLength <= 22) {
            scale = 0.92;
        } else {
            scale = 0.84;
        }

        return {
            label: label,
            style: "font-size: " + (baseSize * scale).toFixed(2) + "rem;"
        };
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
        const titleConfig = App.getOverviewTitleConfig(juror);
        const jurorLabel = App.escapeHtml(titleConfig.label);
        const rankIcon = juror.rank === "neutral"
            ? ""
            : '<span class="post-it-rank-icon-wrap"><i data-lucide="' + (juror.rank === "mountain" ? "mountain" : "bird") + '" class="post-it-rank-icon"></i></span>';
        const overviewNotesClass = App.getOverviewNotesClass(juror.notes, juror.notes2);

        return `
            <div draggable="true"
                 data-juror-id="${jurorIdAttr}" data-seat="${juror.seat}"
                 class="post-it ${horiz} ${vert} ${juror.rank !== "neutral" ? "selected-rank" : ""}">
                <div class="post-it-header shrink-0">
                    <div class="post-it-title" style="${titleConfig.style}">${jurorLabel}</div>
                </div>
                <div class="minimal-only post-it-topline">
                    <div class="post-it-context-preview">${App.formatRichText(juror.household)}</div>
                    <div class="post-it-area-preview">${App.escapeHtml(juror.city || "")}</div>
                </div>
                <div class="minimal-only post-it-body">
                    <div class="post-it-notes ${overviewNotesClass}">${App.formatOverviewNotes(juror.notes)}</div>
                </div>
                <div class="expanded-only post-it-expanded">
                    <div class="post-it-expanded-top">
                        <div class="post-it-household">${App.formatRichText(juror.household)}</div>
                        <div class="post-it-city">${App.escapeHtml(juror.city || "")}</div>
                    </div>
                    <div class="expanded-notes post-it-expanded-notes">${App.formatOverviewNotes(juror.notes)}</div>
                </div>
                <div class="post-it-footer shrink-0">
                    <div class="post-it-metadata">
                        <div class="post-it-chip post-it-chip-exp">${expString}</div>
                        <div class="post-it-chip post-it-chip-score">${scoreTxt}</div>
                    </div>
                    ${rankIcon}
                </div>
            </div>
        `;
    };

    App.renderCourtroom = function renderCourtroom() {
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
                zone.ondragenter = App.dragEnterSeat;
                zone.ondragleave = App.dragLeaveSeat;
                zone.ondrop = App.drop;

                const juror = App.getSeatedJuror(seatNum);
                if (juror) {
                    const horiz = column % 2 !== 0 ? "quad-left" : "quad-right";
                    const vert = row === 0 ? "quad-top" : "quad-bottom";
                    zone.innerHTML = App.createCardHtml(juror, horiz, vert);
                    const card = zone.querySelector(".post-it");
                    if (card) {
                        card.addEventListener("dragstart", App.dragStart);
                        card.addEventListener("dragend", App.dragEnd);
                        card.addEventListener("mouseenter", function () {
                            App.handleHover(card, true);
                        });
                        card.addEventListener("mouseleave", function () {
                            App.handleHover(card, false);
                        });
                        card.addEventListener("click", function (event) {
                            event.preventDefault();
                            event.stopPropagation();
                            App.openModal(juror.id);
                        });
                    }
                } else {
                    zone.innerHTML = '<span class="seat-number-label">' + String(seatNum) + "</span>";
                    zone.onclick = function onClick() {
                        App.emptySeatClick(seatNum);
                    };
                }

                rowDiv.appendChild(zone);
            }

            wrapper.appendChild(rowDiv);
        }
        App.scheduleLucideRender();
    };

    App.renderPool = function renderPool() {
        const poolList = document.getElementById("pool-list");
        poolList.innerHTML = App.getPoolJurors().map(function (juror) {
            return '<div draggable="true" data-juror-id="' + App.escapeHtml(juror.id) + '" class="pool-juror-item bg-white border p-2 rounded text-sm font-black text-slate-800 cursor-grab shadow-sm active:cursor-grabbing hover:border-blue-400 hover:bg-blue-50 transition-colors">' + App.escapeHtml(App.formatJurorLabel(juror)) + "</div>";
        }).join("");
    };

    App.renderStrikes = function renderStrikes() {
        let peopleCount = 0;
        let defenseCount = 0;
        const strikeMarkup = App.getStruckJurors().map(function (juror) {
            const isPeople = juror.excuseType === App.constants.excuseType.people;
            const strikeNumber = isPeople ? ++peopleCount : ++defenseCount;
            return '<div class="strike-card ' + (isPeople ? "strike-people" : "strike-defense") + '" data-juror-id="' + App.escapeHtml(juror.id) + '">' + strikeNumber + ": " + App.escapeHtml(App.formatJurorLabel(juror)) + "</div>";
        }).join("");

        const strikeList = document.getElementById("struck-juror-list");
        strikeList.innerHTML = strikeMarkup;
        strikeList.scrollTop = strikeList.scrollHeight;
    };

    App.renderTallies = function renderTallies() {
        document.getElementById("tally-people").innerText = String(App.state.jurors.filter(function (juror) {
            return juror.excuseType === App.constants.excuseType.people;
        }).length);

        document.getElementById("tally-defense").innerText = String(App.state.jurors.filter(function (juror) {
            return juror.excuseType === App.constants.excuseType.defense;
        }).length);
    };

    App.renderAll = function renderAll() {
        App.renderCourtroom();
        App.renderPool();
        App.renderStrikes();
        App.renderTallies();
    };
}());
