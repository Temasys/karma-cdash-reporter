// Adapted from the Karma junit reporter
var os = require('os');
var path = require('path');
var fs = require('fs');
var builder = require('xmlbuilder');
var moment = require('moment');

var CDashReporter = function (baseReporterDecorator, config, logger, helper, formatError) {
	var log = logger.create('reporter.xml');
	var reporterConfig = config.cdashReporter || {};
	var outputFile = helper.normalizeWinPath(path.resolve(config.basePath, reporterConfig.outputFile || 'test-results.testxml'));

	// var xml;
	var site;
	var testing;
	var pendingFileWritings = 0;
	var fileWritingFinished = function () { };
	var allMessages = [];

	baseReporterDecorator(this);

	this.adapters = [function (msg) {
		allMessages.push(msg);
	}];

	this.onRunStart = function () {
		site = builder.create('Site', {version: '1.0', encoding: 'UTF-8'}); // XML root
    site.att('Name', 'Darth-Mac');
		site.att('BuildStamp', '20150813-1157-Temasys-universal-trial');
		// TODO: add attibutes to the site node

		testing = site.ele('Testing');

    var time = moment();
    testing.ele('StartTestTime', time.format('X'));
		testing.ele('StartDateTime', time.format('MMM D HH:mm Z')); //TODO display timezone in letters
		
		// TODO: add child TestList (contains a list of test FullName ??)
	};

	this.onBrowserStart = function(browser) {
	};
	
	this.onBrowserComplete = function(browser) {
    // TODO: add child EndDateTime
    // TODO: add child EndTestTime
    // TODO: add child ElapsedMinutes
	};

	this.onRunComplete = function () {
		var xmlToOutput = site;

		pendingFileWritings++;
		helper.mkdirIfNotExists(path.dirname(outputFile), function () {
			fs.writeFile(outputFile, xmlToOutput.end({ pretty: true }), function (err) {
				if (err) {
					log.warn('Cannot write xml\n\t' + err.message);
				} else {
					log.debug('XML results written to "%s".', outputFile);
				}

				if (!--pendingFileWritings) {
					fileWritingFinished();
				}
			});
		});

		allMessages.length = 0;
	};

	this.specSuccess = this.specSkipped = this.specFailure = function (browser, result) { 		//for each test 
		var pass;
    if (result.success) {
      pass = 'Passed';
    }
    else if (result.skipped) {
      pass = 'Skipped';
    }
    else { // Test failed 
      pass = 'Failed';
    }

    var spec = testing;

    var test = testing.ele('Test');
    test.att('Status', pass);
    test.ele('Name', result.description);
		test.ele('FullName', result.suite + ' ' + result.description + ' (' + browser.name + ')');
    test.ele('Path');
    test.ele('FullCommandLine');
    test.ele('Results');

    // if (result.suite && result.suite[0] === 'Jasmine__TopLevel__Suite') {
    //   result.suite.shift();
    // }
    
	};

	// wait for writing all the xml files, before exiting
	this.onExit = function (done) {
		if (pendingFileWritings) {
			fileWritingFinished = done;
		} else {
			done();
		}
	};

  this.makeTestNode = function() {

  }
};

CDashReporter.$inject = ['baseReporterDecorator', 'config', 'logger', 'helper', 'formatError'];

// PUBLISH DI MODULE
module.exports = {
	'reporter:cdash': ['type', CDashReporter]
};