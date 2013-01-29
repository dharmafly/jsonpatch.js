// Run the jasmine tests and produce TAP output (for
// ci.browserling.com)

var jasmine = require('jasmine-node');
var TAPReporter = require('jasmine-tapreporter');

require('./jsonpatch_spec.js');

jasmine.getEnv().addReporter(new TAPReporter(console.log));
jasmine.getEnv().execute();
