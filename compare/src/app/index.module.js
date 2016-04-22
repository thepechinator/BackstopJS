/* global malarkey:false, moment:false */

import { config } from './index.config';
import { routerConfig } from './index.route';
import { runBlock } from './index.run';
import { MainController } from './main/main.controller';
import { RunTestController } from './runTest/runTest.controller';
import { SetupTestService } from '../app/components/setupTest/setupTest.service';
import { TestResultsService } from '../app/components/testResults/testResults.service';
import { BlessService } from '../app/components/bless/bless.service';
import { GithubContributorService } from '../app/components/githubContributor/githubContributor.service';
import { WebDevTecService } from '../app/components/webDevTec/webDevTec.service';
import { NavbarDirective } from '../app/components/navbar/navbar.directive';
import { MalarkeyDirective } from '../app/components/malarkey/malarkey.directive';
import { TestMetaDirective } from '../app/components/testMeta/testMeta.directive';
import { ScreenshotDetailsDirective } from '../app/components/screenshotDetails/screenshotDetails.directive';

angular.module('compare', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngMessages', 'ngAria', 'ngResource', 'ui.router', 'ngMaterial', 'toastr'])
  .constant('malarkey', malarkey)
  .constant('moment', moment)
  .config(config)
  .config(routerConfig)
  .run(runBlock)
  .service('setupTest', SetupTestService)
  .service('testResults', TestResultsService)
  .service('bless', BlessService)
  .service('githubContributor', GithubContributorService)
  .service('webDevTec', WebDevTecService)
  .controller('MainController', MainController)
  .controller('RunTestController', RunTestController)
  .directive('acmeNavbar', NavbarDirective)
  .directive('acmeMalarkey', MalarkeyDirective)
  .directive('testMeta', TestMetaDirective)
  .directive('screenshotDetails', ScreenshotDetailsDirective);
