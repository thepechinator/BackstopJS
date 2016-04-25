/**
 * This file uses the Page Object pattern to define the main page for tests
 * https://docs.google.com/presentation/d/1B6manhG0zEXkC-H-tPo2vwU06JhL8w9-XCF9oehXzAQ
 */

'use strict';

var MainPage = function() {
  //this.jumbEl = element(by.css('.jumbotron'));
  //this.h1El = this.jumbEl.element(by.css('h1'));
  //this.imgEl = this.jumbEl.element(by.css('img'));
  //this.thumbnailEls = element(by.css('body')).all(by.repeater('awesomeThing in main.awesomeThings'));

  this.summary = element(by.css('.summary'));
  this.tests = element(by.css('body')).all(by.repeater('test in main.testResults.testPairs track by $index'));
};

module.exports = new MainPage();
