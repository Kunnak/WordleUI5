sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, JSONModel, Filter, FilterOperator,MessageBox, MessageToast) => {
    	"use strict";

	return Controller.extend("wordle.wordle.controller.Wordle", {
		onInit: function() {
            this.aCurrentField = [];
            this.aGuessedLetter = [];
            this.sWordleWord = null;
            this.bFinished = false;

            this._initGuessGrid();
            this._initKeyboard();
            this._setActiveField(0,0);

            // Debugging
            window.oGuessModel = this.getView().getModel("guesses");
		},

		onAfterRendering: async function () {
            await this._getWordleWord();
			this._attachClickEvents();
            this._attachKeyboardEvents();
            this._startTimer();
		},

        _startTimer: function () {
            this.iStartTime = Date.now();
        },

        _stopTimer: function () {
            var iEndTime = Date.now();
            var iEllapsedTime = Math.round((iEndTime - this.iStartTime) / 1000);
            console.log("Benötigte Zeit:", iEllapsedTime)
            return iEllapsedTime;
        },

        _getCurrentUser: async function () {
            const oResponse = await fetch("/sap/bc/ui2/start_up");
            const oData = await oResponse.json();
            console.log("User:", oData.id);
            this._saveLog("Login");
            return oData.id;
        },

        _checkAlreadyPlayed: async function () {
            var oModel = this.getView().getModel();

            var oPlayerBinding = oModel.bindList("_Player", this.oWordleContext);
            const aContexts = await oPlayerBinding.requestContexts(0, 9999);

            console.log("Gefundene Spieler heute:", aContexts.length);

            var bAlreadyPlayed = aContexts.some((oContext) => {
                var sPlayer = oContext.getObject().Player;
                return sPlayer === this.sCurrentUser;
            });

            console.log("Bereits gespielt:", bAlreadyPlayed);
            return bAlreadyPlayed;
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
                MessageToast.show("Maximale länge erreicht!");
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
            if (this.bFinished == true) {
                return;
            }

            if (this.aCurrentField[1] != 5 && this.bFinished != true) {
                MessageToast.show("Wort unvollständig!");
                return;
            }

            this._setActiveField(this.aCurrentField[0] + 1, 0);

            this._validateGuess(this.aGuessedLetter);
            this.aGuessedLetter = [];

            // Gameover Check
            if (this.aCurrentField[0] == 6 && this.bFinished == false) {
                MessageToast.show("Das heutige Wort war: " + this.sWordleWord);
                this._saveLog("Loss");
                this._saveGame(this.aCurrentField[0], this.bFinished);
                this.bFinished = true;
            }
		},

		_onBackspace: function () {
            if (this.bFinished == true) {
                return;
            }

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
            console.log("Guessed: ", sGuessedWord);
            this._saveLog('Guess', sGuessedWord);

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
                this.bFinished = true;
                this._saveLog("Win");
                this._saveGame(this.aCurrentField[0], this.bFinished);
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

        _getWordleFilter: function(field, value) {
            var aFilters = [];
            aFilters.push(
                new Filter({
                    path:field,
                    operator:FilterOperator.EQ,
                    value1:value,
                })
            );
            return aFilters;
        },

        _getWordleWord: async function () {
            var oModel = this.getView().getModel();

            let d = new Date();
            let formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            var aWordleFilter = this._getWordleFilter("WordleDate", formatted);
            var oWordleBinding = oModel.bindList("/Wordle", null, null, aWordleFilter);

            this.sCurrentUser = await this._getCurrentUser();

            const aContexts = await oWordleBinding.requestContexts(0, 1);

            if (aContexts.length > 0) {
                this.sWordleWord = aContexts[0].getObject().Word.toUpperCase();

                var bIsActive = aContexts[0].getProperty("IsActiveEntity");

                if (bIsActive) {
                    this.oWordleContext = aContexts[0];

                } else {
                    await this._activateDraft(aContexts[0]);

                    const aRefreshed = await oWordleBinding.requestContexts(0, 1);
                    this.oWordleContext = aRefreshed[0];
                }

            } else {
                await this._loadRandomWordAndSave();
            }

            var bAlreadyPlayed = await this._checkAlreadyPlayed();
            if (bAlreadyPlayed) {
                MessageBox.information("Du hast das heutige Wordle bereits gespielt!");
                this.bFinished = true;
                return;
            }

            console.log("Finales Wort:", this.sWordleWord);
        },

        _saveTodaysWordle: async function (sWord) {
            var oModel = this.getView().getModel();
            var oListBinding = oModel.bindList("/Wordle");
            this.oWordleContext = oListBinding.create({ Word: sWord });
            await this.oWordleContext.created();
            await this._activateDraft(this.oWordleContext);

            let d = new Date();
            let formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            var aWordleFilter = this._getWordleFilter("WordleDate", formatted);
            var oWordleBinding = oModel.bindList("/Wordle", null, null, aWordleFilter);
            const aContexts = await oWordleBinding.requestContexts(0, 1);
            this.oWordleContext = aContexts[0];
        },

        _saveGame: async function (sTrys, bDone) {
            var iSeconds = this._stopTimer();
            var oModel = this.getView().getModel();

            var oDraftContext = await this._editDraft(this.oWordleContext);

            var oPlayerBinding = oModel.bindList("_Player", oDraftContext);
            var oPlayerContext = oPlayerBinding.create({
                Time: iSeconds,
                Trys: sTrys,
                Done: bDone ? "X" : ""
            });

            await oPlayerContext.created().catch((oError) => {
                console.error("Fehler:", oError.message);
            });

            await this._activateDraft(oDraftContext);
            this.oWordleContext = await this._refreshActiveContext();

        },

        _refreshActiveContext: async function () {
            var oModel = this.getView().getModel();
            let d = new Date();
            let formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            var aWordleFilter = this._getWordleFilter("WordleDate", formatted);
            var oWordleBinding = oModel.bindList("/Wordle", null, null, aWordleFilter);
            const aContexts = await oWordleBinding.requestContexts(0, 1);
            return aContexts[0];
        },

        _editDraft: async function (oActiveContext) {
            var oModel = this.getView().getModel();
            var oOperation = oModel.bindContext(
                "com.sap.gateway.srvd.zui_wordle_ys.v0001.Edit(...)",
                oActiveContext
            );
            oOperation.setParameter("PreserveChanges", false);
            const oDraftContext = await oOperation.execute();
            return oDraftContext;
        },

        _activateDraft: async function (oUnactiveContext) {
            var oModel = this.getView().getModel();
            var oOperation = oModel.bindContext(
                "com.sap.gateway.srvd.zui_wordle_ys.v0001.Activate(...)",
                oUnactiveContext
            );
            await oOperation.execute();
        },
        
        _loadRandomWordAndSave: async function () {
            var oModel = this.getView().getModel();
            var oWordsBinding = oModel.bindList("/Words");
        
            const aContexts = await oWordsBinding.requestContexts(0, 9999);
            var aWords = aContexts.map((oContext) => oContext.getObject().Word);
            var sRandom = aWords[Math.floor(Math.random() * aWords.length)];
            this.sWordleWord = sRandom.toUpperCase();
        
            console.log("Zufälliges Wort geladen:", this.sWordleWord);
            await this._saveTodaysWordle(this.sWordleWord);
        },
        
        _saveGame: async function (sTrys, bDone) {
            this.oWordleContext = await this._editDraft(this.oWordleContext);
            var iSeconds = this._stopTimer();
            var oModel = this.getView().getModel();
            var oPlayerBinding = oModel.bindList("_Player", this.oWordleContext);
            var oPlayerContext = oPlayerBinding.create({
                Time: iSeconds,
                Trys: sTrys,
                Done: bDone ? "X" : ""
            });
        
            await oPlayerContext.created().catch((oError) => {
                console.error("Fehler Detail:", oError);
                console.error("Fehler Message:", oError.message);
            });

            this._oWordleContext = await this._activateDraft(this.oWordleContext);

        },

        _saveLog: async function (pLogType, pGuess) {
            var oModel = this.getView().getModel();
            var oLogBinding = oModel.bindList("/Logger");
            var sFormattedGuess = this._formatWordToUpper(pGuess);
            var oLogContext = oLogBinding.create({
                LogType: pLogType,
                Guess: sFormattedGuess ? sFormattedGuess : ""
            });

            await oLogContext.created();
        },

        _formatWordToUpper: function (sWord) {
            if (!sWord) { return "" };
            return sWord.charAt(0).toUpperCase() + sWord.slice(1).toLowerCase();
        },

        // ...
        
	});
});
