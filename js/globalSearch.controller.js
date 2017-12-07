/**
* Global Search Controller
*
* @description Controller that allows the user to search for a word through all
* the database tables, click on the results found and see the most recent ones
* when accessed later
*
*/
(function() {
  'use strict';

  angular
  .module('starter.controllers')
  .controller('GlobalSearchCtrl', GlobalSearchCtrl);


  GlobalSearchCtrl.$inject = ['$rootScope','$scope', '$ionicLoading',
  '$ionicModal', 'logger','GlobalSearchService', '$location'];

  function GlobalSearchCtrl($rootScope, $scope, $ionicLoading, $ionicModal, logger,
    GlobalSearchService, $location) {

      var vm = this;
      var logTag = "GlobalSearchCtrl";
      vm.table = "";
      vm.recentSearches = [];
      vm.searchDone = false;
      vm.searchFocus = false;
      vm.doSearch = doSearch;
      vm.clearSearch = clearSearch;
      vm.resultClicked = resultClicked;

      showRecentSearches();

      /**
      * @function showRecentSearches
      * @description gets recent search results from the GlobalSearchService
      **/
      function showRecentSearches(){
        vm.recentSearches = GlobalSearchService.getRecentSearches();
      }

      /**
      * @function doSearch
      * @param {String} string word that the user inputted in the search box
      * to search for in the database tables
      * @description calls the search function from the GlobalSearchService
      * to perform a search with the String parameter. Sets the Boolean variable
      * searchDone to true, which is used in the template
      **/
      function doSearch(string){
        if ((string != undefined) && (string != "")){
          vm.configInfo = GlobalSearchService.search(string);
          vm.searchDone = true;
        }
      }

      /**
      * @function clearSearch
      * @description clears the search box and sets the Boolean variable
      * searchDone to false, which is used in the template
      */
      function clearSearch() {
        vm.queryString = "";
        vm.searchDone = false;
        window.setTimeout(function () {
          document.getElementById('searchBox').focus();
        }, 0);
      }

      /**
      * @function resultClicked
      * @param {Object} item contains the config information of the result
      * @param {Object} result the result object that will be added
      * @description calls the addRecentSearch function from the
      * GlobalSearchService to add the result to the recent searches list. Then
      * calls the function showRecentSearches to update the results in the UI.
      * If the result has an href, it changes the current location of the app
      * to that path.
      **/
      function resultClicked(item, result){
        GlobalSearchService.addRecentSearch(item, result);
        showRecentSearches();
        if (result.href != undefined){
          $location.path("/app" + result.href);
        } else {
          console.log(logTag, "No href: ", result.status);
        }
      }



      //Getting the broadcast with the results from the GlobalSearchService
      $rootScope.$on('globalSearchResult', function(event, args) {
        vm.configInfo.find((item, index) => {
          if (item.table === args.table) {
            item.results = args.results;
            //Stop searching after finding the element that meets the condition
            return true;
          }
        });
        //This line allows to see the new results automatically in the UI
        $scope.$apply();
      });

    }
  })();
