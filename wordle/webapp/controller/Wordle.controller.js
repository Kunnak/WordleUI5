sap.ui.define([
	"sap/ui/core/mvc/Controller",
    	"sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    	"use strict";

	return Controller.extend("wordle.wordle.controller.Wordle", {
		onInit: function() {
	    		this._initGuessGrid();
	    		this._initKeyboard();

	    	// Debugging
	    	window.WordleModel = this.getView().getModel("guesses");
		},

		_initGuessGrid: function () {
	    		var aRows = [];
	    		for (var i = 0; i < 6; i++) {
				var aFields = [];
				for (var j = 0; j < 5; j++) {
		    			aFields.push({
						letter: "",
						state: "empty"
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
						{ letter: "ENTER", state: "default" },
						{ letter: "Z", state: "default" },
						{ letter: "X", state: "default" },
						{ letter: "C", state: "default" },
						{ letter: "V", state: "default" },
						{ letter: "B", state: "default" },
						{ letter: "N", state: "default" },
						{ letter: "M", state: "default" },
						{ letter: "BACKSPACE", state: "default" }
		    			]
				}
	    		];
	    		var oKeyboard = new JSONModel({
				rows: aKeyboardRows
	    		});
	    		this.getView().setModel(oKeyboard, "keyboard");
		}
    	});
});