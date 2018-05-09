const assert = require('assert');
const {sasCredentials} = require('..');
const nock = require('nock');
var url  = require('url');
const urls = require('taskcluster-lib-urls');

suite('index_test.js', function() {
  let scope;

  setup(function() {
    const rootUrl = urls.testRootUrl();
    const azureTableSASPath = url.parse(
      urls.api(rootUrl, 'auth', 'v1', '/azure/myaccount/table/mytable/read-write')
    ).pathname;
    scope = nock(rootUrl, {encodedQueryParams:true, allowUnmocked: true})
      .get(azureTableSASPath)
      .reply(200, function() {
        return {
          expiry: new Date().toJSON(),
          sas: 'x=10&y=20',
        };
      });
  });

  teardown(function() {
    assert(scope.isDone(), 'nock was not accessed');
  });

  test('fetches credentials', async function() {
    const creds = sasCredentials({
      accountId: 'myaccount',
      tableName: 'mytable',
      rootUrl: urls.testRootUrl(),
      credentials: {},
    });

    assert.equal(creds.accountId, 'myaccount');
    assert.equal(creds.minSASAuthExpiry, 15 * 60 * 1000);
    assert.equal(await creds.sas(), 'x=10&y=20');
  });
});
