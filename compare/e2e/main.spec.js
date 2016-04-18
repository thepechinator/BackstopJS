'use strict';

var chai = require('chai');
var expect = chai.expect;
console.info('expect: ', expect); //wf
describe('The main view', function () {
  var page;

  beforeEach(function () {
    browser.get('/index.html');
    page = require('./main.po');
  });

/*  it('should include jumbotron with correct data', function() {
    expect(page.h1El.getText()).toBe('\'Allo, \'Allo!');
    expect(page.imgEl.getAttribute('src')).toMatch(/assets\/images\/yeoman.png$/);
    expect(page.imgEl.getAttribute('alt')).toBe('I\'m Yeoman');
  });

  it('should list at least 3 tests', function () {
    expect(page.tests.count()).toBeGreaterThan(5);
  });*/

  it('should display the summary list of tests', () => {
    expect(page.summary).to.exist;
  });

  it('should list at least 3 tests', function () {
    expect(page.tests.count()).to.be.at.least(3);
  });

});
