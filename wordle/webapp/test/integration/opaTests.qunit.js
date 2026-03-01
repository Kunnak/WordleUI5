/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["wordle/wordle/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
