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

  var site;
  var testing;
  var testList;
  var startTime;
  var pendingFileWritings = 0;
  var fileWritingFinished = function () { };
  var allMessages = [];

  baseReporterDecorator(this);

  this.adapters = [function (msg) {
    allMessages.push(msg);
  }];

  this.onRunStart = function () {
    site = builder.create('Site', 
    {version: '1.0', encoding: 'UTF-8'}); // XML root
    site.att('BuildName', 'plugin-autobuild-dev');
    site.att('BuildStamp', '20150813-1157-Temasys-universal-trial');
    site.att('Name', 'Darth-Mac');
    site.att('Generator', 'ctest-3.3.0');
    site.att('CompilerName', '');
    site.att('OSName', 'Mac OS X');
    site.att('Hostname', 'Darth-Mac.local');
    site.att('OSRelease', '10.10.4');
    site.att('OSVersion', '14E46');
    site.att('OSPlatform', 'x86_64');
    site.att('Is64Bits', '1');
    site.att('VendorString', 'GenuineIntel');
    site.att('VendorID', 'Intel Corporation');
    site.att('FamilyID', '6');
    site.att('ModelID', '62');
    site.att('ProcessorCacheSize', '32768');
    site.att('NumberOfLogicalCPU', '12');
    site.att('NumberOfPhysicalCPU', '6');
    site.att('TotalVirtualMemory', '2048');
    site.att('TotalPhysicalMemory', '16384');
    site.att('LogicalProcessorsPerPhysical', '16');
    site.att('ProcessorClockFrequency', '3500');
    // TODO: set attibutes to the site node

    testing = site.ele('Testing');

    startTime = moment();
    testing.ele('StartTestTime', startTime.format('X'));
    testing.ele('StartDateTime', startTime.format('MMM D HH:mm Z')); //TODO display timezone in letters
    
    testList = testing.ele('TestList');

  };

  this.onBrowserStart = function(browser) {
  };
  
  this.onBrowserComplete = function(browser) {
  };

  this.onRunComplete = function () {
    var endTime = moment();
    testing.ele('EndTestTime', endTime.format('X'));
    testing.ele('EndDateTime', endTime.format('MMM D HH:mm Z')); 
    testing.ele('ElapsedMinutes', (endTime.diff(startTime, 'minutes')).toString()); 

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

  this.specSuccess = this.specSkipped = this.specFailure = function (browser, result) {     //for each test 
    var testFullName = result.suite + ' ' + result.description + ' (' + browser.name + ')';

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

    testList.ele('Test', testFullName);

    var test = testing.ele('Test');
    test.att('Status', pass);
    test.ele('Name', result.description);
    test.ele('FullName', testFullName);
    test.ele('Path', './Tests/AdapterJS');
    test.ele('FullCommandLine', 'grunt test');
    test.ele('Results', pass);
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
