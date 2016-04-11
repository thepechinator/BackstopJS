describe('service webDevTec', () => {
  beforeEach(angular.mock.module('compare'));

  it('should be registered', inject(webDevTec => {
    expect(webDevTec).not.to.equal(null);
  }));

  describe('getTec function', () => {
    it('should exist', inject(webDevTec => {
      expect(webDevTec.getTec).not.to.be.null;
    }));

    it('should return array of object', inject(webDevTec => {
      const data = webDevTec.getTec();
      expect(data).to.be.an('array');
      expect(data[0]).to.be.an('object');
      expect(data.length > 5).to.be.ok;
    }));
  });
});
