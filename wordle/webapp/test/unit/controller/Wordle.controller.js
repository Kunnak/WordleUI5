/*global QUnit*/

sap.ui.define([
	"wordle/controller/Wordle.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Wordle Controller");

	QUnit.test("I should test the Wordle controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
