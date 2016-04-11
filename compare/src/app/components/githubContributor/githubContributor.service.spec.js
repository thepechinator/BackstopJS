

describe('service githubContributor', () => {
  beforeEach(angular.mock.module('compare'));

  it('should be registered', inject(githubContributor => {
    expect(githubContributor).to.not.equal(null);
  }));

  describe('apiHost variable', () => {
    it('should exist', inject(githubContributor => {
      expect(githubContributor.apiHost).to.not.equal(null);
    }));
  });

  describe('getContributors function', () => {
    it('should exist', inject(githubContributor => {
      expect(githubContributor.getContributors).to.not.equal(null);
    }));

    it('should return data', inject((githubContributor, $httpBackend) => {
      $httpBackend.when('GET',  githubContributor.apiHost + '/contributors?per_page=1').respond(200, [{pprt: 'value'}]);
      var data;
      githubContributor.getContributors(1).then(function(fetchedData) {
        data = fetchedData;
      });
      $httpBackend.flush();
      expect(data).to.be.an('array');
      expect(data.length === 1).to.be.ok;
      expect(data[0]).to.be.an('object');
    }));

    it('should define a limit per page as default value', inject((githubContributor, $httpBackend) => {
      $httpBackend.when('GET',  githubContributor.apiHost + '/contributors?per_page=30').respond(200, new Array(30));
      var data;
      githubContributor.getContributors().then(function(fetchedData) {
        data = fetchedData;
      });
      $httpBackend.flush();
      expect(data).to.be.an('array');
      expect(data.length === 30).to.be.ok;
    }));

    it('should log a error', inject((githubContributor, $httpBackend, $log) => {
      $httpBackend.when('GET',  githubContributor.apiHost + '/contributors?per_page=1').respond(500);
      githubContributor.getContributors(1);
      $httpBackend.flush();
      expect($log.error.logs[0][0]).to.include('XHR Failed for');
    }));
  });
});
