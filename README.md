karma-cdash-reporter
==================

A Karma plugin. Reports results in a CDash compatible format.

## Installation

The easiest way is to keep `karma-cdash-reporter` as a dependency in your `package.json`.
```json
{
  "dependencies": {
    "karma": "^0.9",
    "karma-cdash-reporter": "^0.1.0"
  }
}
```

You can simple do it by:

    $ npm install karma-cdash-reporter --save

## Configuration in Karma

```js
// karma.conf.js
module.exports = function(config) {
  config.set({

    // reporters configuration
    reporters: ['cdash'],

    cdashReporter: {
      outputFolder: 'results',
      outputFileName: 'cdash-result.xml',
      siteConfig: './gen/cdash-site-config.json'
    },

    plugins: [
      'karma-cdash-reporter'
    ]
  });
};
```

**outputFolder [OPTIONAL]**

Path to the folder in which the report should be written.
Defaults to '.'.

**outputFileName [OPTIONAL]** 

Name of the file in which the report should be written (in the outputFolder).
Defaults to ```'cdash-result' + (siteConfig.BuildStamp ? '-' + siteConfig.BuildStamp : '') + '.xml'```.

**siteConfig [MANDATORY]** 
Path to a json file defined as follow:
```json
{
  "site": {
    "BuildName": "...",
    "BuildStamp": "...",
    "Name": "...",
    "Generator": "...",
    "CompilerName": "...",
    "OSName": "...",
    "Hostname": "...",
    "OSRelease": "...",
    "OSVersion": "...",
    "OSPlatform": "...",
    "Is64Bits": "...",
    "VendorString": "...",
    "VendorID": "...",
    "FamilyID": "...",
    "ModelID": "...",
    "ProcessorCacheSize": "...",
    "NumberOfLogicalCPU": "...",
    "NumberOfPhysicalCPU": "...",
    "TotalVirtualMemory": "...",
    "TotalPhysicalMemory": "...",
    "LogicalProcessorsPerPhysical": "...",
    "ProcessorClockFrequency": "..."
  },
  "testConfig": {
    "Path": "...",
    "FullCommandLine": "..."
  }
}
```
These are valued that will be entered in your CDash xml document.
The important values are:

Value | Description | CMake variable (if any)
----- | ----------- |-------------------
`BuildName` | The name you gave to your build | `CTEST_BUILD_NAME`
`BuildStamp` | The identifier of this specific build | `file(STRINGS "${CTEST_BINARY_DIRECTORY}/Testing/TAG" KARMA_CTEST_TAG LIMIT_COUNT 1)`
|||If you set a specific track when you called ctest_start, you will have to happen "-YourTrackName"
`Name` | The name of your build site | `CTEST_SITE`

## Submission to CDash

For some reason you need to send the configure and build reports BEFORE your send the test report.
From your ctest script, run
```bash
  ctest_submit(PARTS Configure Build) #submit configure and build reports first
  ctest_submit(FILES "Path/to/the/result/file") #submit tests results
```
