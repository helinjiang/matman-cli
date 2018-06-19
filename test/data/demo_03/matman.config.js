const path = require('path');

module.exports = {
  basePath: __dirname,
  dataPath: path.resolve(__dirname, './app'),
  mockServerPath: path.resolve(__dirname, '../../../../matman/test/data/fixtures/mock_server/mockers'),
  clientScriptBuildPath: path.join(__dirname, 'dist-client-script'),
  clientScriptMatch: /crawlers\/.*\.js$/,
  entry: {
    'page_rule/crawlers/get-page-info': path.join(__dirname, 'e2e_test/targets/page_rule/crawlers/get-page-info.js')
  }
};
