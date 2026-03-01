sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageBox) => {
    	"use strict";

	return Controller.extend("wordle.wordle.controller.Wordle", {
		onInit: function() {
            this.aCurrentField = [];
            this.aGuessedLetter = [];
            this.sWordleWord = "WORDL"
            this.bFinished = false;

            this._initGuessGrid();
            this._initKeyboard();
            this._setActiveField(0,0);

            // Debugging
            window.oGuessModel = this.getView().getModel("guesses");
		},

		onAfterRendering: function () {
			this._attachClickEvents();
            this._attachKeyboardEvents();
		},

		_initGuessGrid: function () {
            var aRows = [];
            for (var i = 0; i < 6; i++) {
                var aFields = [];
                for (var j = 0; j < 5; j++) {
                    aFields.push({
                    letter: "",
                    state: "empty",
                    active: false
                    });
                }
                aRows.push({ fields: aFields });
            }
            var oGuesses = new JSONModel({
                rows: aRows,
                currentRow: 0,
                currentCol: 0
            });
            this.getView().setModel(oGuesses, "guesses");
		},

		_initKeyboard: function () {
            var aKeyboardRows = [
            { keys:
                [
                { letter: "Q", state: "default"},
                { letter: "W", state: "default" },
                { letter: "E", state: "default" },
                { letter: "R", state: "default" },
                { letter: "T", state: "default" },
                { letter: "Z", state: "default" },
                { letter: "U", state: "default" },
                { letter: "I", state: "default" },
                { letter: "O", state: "default" },
                { letter: "P", state: "default" }
                ]
            },
            { keys:
                [
                { letter: "A", state: "default" },
                { letter: "S", state: "default" },
                { letter: "D", state: "default" },
                { letter: "F", state: "default" },
                { letter: "G", state: "default" },
                { letter: "H", state: "default" },
                { letter: "J", state: "default" },
                { letter: "K", state: "default" },
                { letter: "L", state: "default" }
                ]
            },
            { keys:
                [
                { letter: "BACKSPACE", state: "default", wide: true },
                { letter: "Y", state: "default" },
                { letter: "X", state: "default" },
                { letter: "C", state: "default" },
                { letter: "V", state: "default" },
                { letter: "B", state: "default" },
                { letter: "N", state: "default" },
                { letter: "M", state: "default" },
                { letter: "ENTER", state: "default", wide: true }
                ]
            }];

            var oKeyboard = new JSONModel({ rows: aKeyboardRows });
            this.getView().setModel(oKeyboard, "keyboard");
		},
		
		_setActiveField: function (iRow, iCol) {
            var oModel = this.getView().getModel("guesses");
            var iOldRow = oModel.getProperty("/currentRow");
            var iOldCol = oModel.getProperty("/currentCol");

            if (iOldRow !== iRow || iOldCol !== iCol) {
                oModel.setProperty("/rows/" + iOldRow + "/fields/" + iOldCol + "/active", false);
            }

            oModel.setProperty("/rows/" + iRow + "/fields/" + iCol + "/active", true);
            oModel.setProperty("/currentRow", iRow);
            oModel.setProperty("/currentCol", iCol);
            
            this.aCurrentField = [iRow, iCol];
		},

		_attachClickEvents: function () {
			var oView = this.getView();

			oView.$().on("click", ".key", (oEvent) => {
				var sKey = oEvent.currentTarget.getAttribute("data-key");
				this._handleKeyClick(sKey);
			})
		},

		_handleKeyClick: function (sKey) {
			switch(sKey) {
				case "ENTER":
					this._onEnter();
					break;
				case "BACKSPACE":
					this._onBackspace();
					break;
				default:
					this._onLetter(sKey);
			}
		},

        _attachKeyboardEvents: function () {
            document.addEventListener("keydown", (oEvent) => {
                var sKey = oEvent.key.toUpperCase();

                if (sKey.length === 1 && sKey >= "A" && sKey <= "Z") {
                    this._onLetter(sKey);
                }
                else if (sKey === "ENTER") {
                    this._onEnter();
                }
                else if (sKey === "BACKSPACE") {
                    this._onBackspace();
                }
            });
        },

        _onLetter: function (sLetter) {
            if (this.bFinished == true) {
                return;
            }

            if (this.aCurrentField[1] >= 5) {
                console.log("Maximale länge erreicht!")
                return;
            }

            var oGuessModel = this.getView().getModel("guesses");
            var iCurrentRow = this.aCurrentField[0];
            var currentCol = this.aCurrentField[1];
            var sFieldPath = "/rows/" + iCurrentRow + "/fields/" + currentCol;

            oGuessModel.setProperty(sFieldPath + "/letter", sLetter);
            oGuessModel.setProperty(sFieldPath + "/state", "filled");

            this.aGuessedLetter.push(sLetter);
            console.log(this.aGuessedLetter);

            this._setActiveField(this.aCurrentField[0], this.aCurrentField[1] + 1);
		},

		_onEnter: function () {
            if (this.aCurrentField[1] != 5) {
                console.log("Wort unvollständig!");
                return;
            }

            this._setActiveField(this.aCurrentField[0] + 1, 0);

            this._validateGuess(this.aGuessedLetter);
            this.aGuessedLetter = [];

            if (this.aCurrentField[0] == 6) {
                // Gameover Check
                console.log("Spiel ende!");
                this.bFinished = true;
            }
		},

		_onBackspace: function () {
            if (this.aCurrentField[1] == 0) {
                return;
            }

            var oGuessModel = this.getView().getModel("guesses");
            var iCurrentRow = this.aCurrentField[0];
            var iPreviousCol = this.aCurrentField[1] - 1;
            var sFieldPath = "/rows/" + iCurrentRow + "/fields/" + iPreviousCol;

            oGuessModel.setProperty(sFieldPath + "/letter", "");
            oGuessModel.setProperty(sFieldPath + "/state", "default");

            this.aGuessedLetter.pop();
            console.log(this.aGuessedLetter);

            this._setActiveField(this.aCurrentField[0], this.aCurrentField[1] - 1);
        },

        _validateGuess: function (aGuessedLetter) {
            var iPreviousRow = this.aCurrentField[0] - 1;
            var sProxyWord = this.sWordleWord;
            var sGuessedWord = aGuessedLetter.join("");
            console.log("Geratenes Wort: " + sGuessedWord);

            if (this._vocalCheck(aGuessedLetter) === true) {
                return;
            }

            var aGuessCopy = aGuessedLetter.slice();

            // correct
            for (var i = 0; i < 5; i++) {
                if (aGuessCopy[i] === this.sWordleWord[i]) {
                    this._setFieldState(iPreviousRow, i, "correct", aGuessCopy[i]);
                    aGuessCopy[i] = null;
                    sProxyWord = sProxyWord.substring(0, i) + "$" + sProxyWord.substring(i + 1);
                }
            }

            // present and absent
            for (var i = 0; i < 5; i++) {
                if (aGuessCopy[i] === null) continue;

                var sLetter = aGuessCopy[i];

                if (sProxyWord.includes(sLetter)) {
                    this._setFieldState(iPreviousRow, i, "present", sLetter);
                    sProxyWord = sProxyWord.replace(sLetter, "$");
                } else {
                    this._setFieldState(iPreviousRow, i, "absent", sLetter);
                }
            }            

            if (sGuessedWord === this.sWordleWord) {
                MessageBox.show("Du bekommst 1 Coin!", {
                    title: "Gewonnen!"
                });
            }
        },

        _vocalCheck: function (aGuess) {
            var vocals = "AEIOU";
            for (var i = 0; i < 6; i++) {
                if (i === 5) {
                    MessageBox.show("Bruh! (ง •̀_•́)ง", {
                        title: "-1 Coin!"
                    });
                    return true;
                }
                if (!(vocals.includes(aGuess[i]))) {
                    break;
                }
            }
            return false;
        },

        _setFieldState: function (iRow, iCol, sState, sLetter) {
            var oModel = this.getView().getModel("guesses");
            var sPath = "/rows/" + iRow + "/fields/" + iCol;
            oModel.setProperty(sPath + "/state", sState);
            this._updateKeyboard(sLetter, sState);
        },

        _updateKeyboard: function (sLetter, sState) {
            var oKeyboard = this.getView().getModel("keyboard");
            var aRows = oKeyboard.getProperty("/rows");
            
            for (var i = 0; i < aRows.length; i++) {
                for (var j = 0; j < aRows[i].keys.length; j++) {
                    if (aRows[i].keys[j].letter === sLetter) {
                        var sCurrent = aRows[i].keys[j].state;
                        if (sState === "correct" || 
                           (sState === "present" && sCurrent !== "correct") ||
                           (sState === "absent" && sCurrent === "default")) {
                           oKeyboard.setProperty("/rows/" + i + "/keys/" + j + "/state", sState);
                        }
                    }
                }
            }
        },
	});
});
