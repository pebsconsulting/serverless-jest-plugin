'use strict';

const path = require('path');
const ejs = require('ejs');
const fse = require('fs-extra');
const utils = require('./utils');
const BbPromise = require('bluebird');

const writeFile = BbPromise.promisify(fse.writeFile);

const testTemplateFile = path.join('templates', 'test-template.ejs');

const createTest = (serverless, options) => {
  const functionName = options.f || options.function;
  if (!serverless.service.functions.hasOwnProperty(functionName)) {
    throw new Error(`Error while creating test. Function "${functionName}" is undefined.`);
  }

  const functionItem = serverless.service.functions[functionName];
  const functionPath = path.parse(functionItem.handler);
  const testFilePath = path.join(functionPath.dir, `${functionPath.name}.test.js`); // @todo regex e.g.*.test.js from config

  const testConfig = {
    functionName,
    functionItem,
    functionPath,
    testFilePath
  };

  console.log(testConfig);

  testfileNotExists(testConfig)
    .then(writeTestfile)
    .catch(console.log);
};

const writeTestfile = (testConfig) => {
  const templateFile = path.join(__dirname, testTemplateFile);
  console.log('write', templateFile);
  const templateString = utils.getTemplateFromFile(templateFile);
  const content = ejs.render(templateString, {
    functionName: testConfig.functionName,
    functionPath: testConfig.functionPath.dir,
    handlerName: testConfig.functionPath.base,
  });

  return writeFile(testConfig.testFilePath, content);
};

const testfileNotExists = (testConfig) => new BbPromise((resolve, reject) => {
  fse.exists(testConfig.testFilePath, (exists) => {
    if(exists) {
      return reject(`File ${testConfig.testFilePath} already exists`);
    }

    return resolve(testConfig);
  });
});

module.exports = createTest;