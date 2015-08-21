// Adapted from the Karma junit reporter
var os = require('os');
var path = require('path');
var fs = require('fs');
var builder = require('xmlbuilder');
var moment = require('moment');

var CDashReporter = function (baseReporterDecorator, config, logger, helper, formatError) {
  var log = logger.create('reporter.xml');
  var reporterConfig = config.cdashReporter || {};

  // output file
  var outputFile = helper.normalizeWinPath(path.resolve(config.basePath, reporterConfig.outputFile || 'test-results.testxml'));

  // CDash site config for report
  var siteConfigPath = helper.normalizeWinPath(path.resolve(config.basePath, reporterConfig.siteConfig));
  var cdashConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf8'));
  var siteConfig = cdashConfig.site;
  var testConfig = cdashConfig.testConfig;

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
    site.att('BuildName', siteConfig.BuildName);
    site.att('BuildStamp', siteConfig.BuildStamp);
    site.att('Name', siteConfig.Name);
    site.att('Generator', siteConfig.Generator);
    site.att('CompilerName', siteConfig.CompilerName);
    site.att('OSName', siteConfig.OSName);
    site.att('Hostname', siteConfig.Hostname);
    site.att('OSRelease', siteConfig.OSRelease);
    site.att('OSVersion', siteConfig.OSVersion);
    site.att('OSPlatform', siteConfig.OSPlatform);
    site.att('Is64Bits', siteConfig.Is64Bits);
    site.att('VendorString', siteConfig.VendorString);
    site.att('VendorID', siteConfig.VendorID);
    site.att('FamilyID', siteConfig.FamilyID);
    site.att('ModelID', siteConfig.ModelID);
    site.att('ProcessorCacheSize', siteConfig.ProcessorCacheSize);
    site.att('NumberOfLogicalCPU', siteConfig.NumberOfLogicalCPU);
    site.att('NumberOfPhysicalCPU', siteConfig.NumberOfPhysicalCPU);
    site.att('TotalVirtualMemory', siteConfig.TotalVirtualMemory);
    site.att('TotalPhysicalMemory', siteConfig.TotalPhysicalMemory);
    site.att('LogicalProcessorsPerPhysical', siteConfig.LogicalProcessorsPerPhysical);
    site.att('ProcessorClockFrequency', siteConfig.ProcessorClockFrequency);
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
      pass = 'passed';
    }
    else if (result.skipped) {
      pass = 'skipped';
    }
    else { // Test failed 
      pass = 'failed';
    }

    testList.ele('Test', testFullName);

    var test = testing.ele('Test');
    test.att('Status', pass);
    test.ele('Name', result.description);
    test.ele('FullName', testFullName);
    test.ele('Path', testConfig.Path);
    test.ele('FullCommandLine', testConfig.FullCommandLine);
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
