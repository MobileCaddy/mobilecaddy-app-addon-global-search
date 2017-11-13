/**
*
* Global Search Factory
*
* @description Factory to be able to do a search among all the database
* tables from SF
*/
(function() {
  'use strict';

  angular
  .module('starter.services')
  .factory('GlobalSearchService', GlobalSearchService);

  GlobalSearchService.$inject = ['$rootScope','devUtils', 'logger'];

  function GlobalSearchService($rootScope, devUtils, logger){
    var encryptedStore;
    var config;

    return {
      setConfig: setConfig,
      search: search,
      searchTable: searchTable,
      getRecentSearches: getRecentSearches,
      addRecentSearch: addRecentSearch
    };

    /**
    * @function setConfig
    * @param {[Object]} confObject
    * @description
    */
    function setConfig(confObject){
      encryptedStore = confObject.encrypted;
      config = confObject.config;
    }

    /**
    * @function search
    * @param {String} str
    * @return {[Object]}
    * @description Gets the table information from the config variable and
    * for each table it calls function searchTable with the inputed String
    */
    function search(str){
      var confForController = [];
      config.forEach(function(configElement){
        confForController.push(setConfigForController(configElement));
        searchTable(configElement, str).then(function(resultsArray){
          $rootScope.$broadcast('globalSearchResult', {table : configElement.table, results : resultsArray});
        }, function(e) {
          logger.error("global search service", e);
        });
      });
      return confForController;

    }

    /**
    * @function setConfigForController
    * @param {Object} element
    * @return {Object}
    * @description
    */
    function setConfigForController(element){
      var object = {};
      object.table = element.table;
      object.name = element.name;
      object.icon = element.icon;
      object.fieldsToShow = element.fieldsToShow;
      return object;
    }

    /**
    * @function searchTable
    * @param {Object} element
    * @param {String} str
    * @return {Promise}
    * @description  Uses a smartSQL query from the devUtils API to find the
    * String parameter in any of the fields specified in the config information.
    * When it finishes the search it returns a promise that can have the
    * the records or a status if something unexpected happened.
    */
    function searchTable(element, str){

      var fieldsToShow = element.fieldsToShow.join(", ");
      var selectCondition = "";
      element.fieldsToShow.forEach(function(field, index){
        selectCondition += "{" + element.table + ":" + field + "}";
        if (index < element.fieldsToShow.length - 1){
          selectCondition += ",";
        }
      });

      var whereCondition = "";
      element.fieldsToQuery.forEach(function(field, index){
        whereCondition += "{" + element.table + ":" + field + "} LIKE '%" + str + "%'";
        if (index < element.fieldsToQuery.length - 1){
          whereCondition += " or ";
        }
      });


      return new Promise(function(resolve, reject) {
        //This returns results on the phone
        //Browser: Error caught when calling com.salesforce.smartstore:pgRunSmartQuery TypeError: Cannot read property '2' of null
        var smartSql = "SELECT * from {" + element.table + "} WHERE " + whereCondition;

        //TIMING com.salesforce.smartstore:pgRunSmartQuery failed on phone, result is undefined
        //var smartSql = "SELECT " + fieldsToShow + " from {" + element.table + "} WHERE " + whereCondition;

        //{status: 101001, mc_add_status: "Contact__ap:Name},{Contact__ap:Email"} on browser and phone
        //var smartSql = "SELECT " + selectCondition + " from {" + element.table + "} WHERE " + whereCondition;


        console.log("smartSql", smartSql);
        devUtils.smartSql(smartSql).then(function(resObject) {
          if (resObject != undefined){
            var resultsArray = createResultsArray(resObject.records, element);
            resolve(resultsArray);
          } else {
            resolve([]);
          }
        }).catch(function(resObject){
          if (resObject == undefined){
            reject([]);
          } else {
            reject(resObject);
          }
        });
      });
    }

    function createResultsArray(results, configElement){
      var resultsArray = [];
      results.forEach(function(result){
        var obtainedHref = setHref(result, configElement.href);
        var resultString = setString(result, configElement.fieldsToShow);
        if (obtainedHref.status === undefined){
          resultsArray.push({Id: result.Id, string: resultString, href: obtainedHref});
        } else {
          resultsArray.push({Id: result.Id, string: resultString, status: obtainedHref.status});
        }
      });
      return resultsArray;
    }

    function setHref(result, href){
      //Splitting the href String so I can have each part in a separate
      //position of an array.
      var splitHref = href.split('/');

      //Removes the empty String generated in the first position
      splitHref.splice(0,1);

      //idNames will have the names of the Strings that represent Ids
      //in the href String, such as AccountId, or Id
      var idNames = [];

      //indexOfIds will have the indexes of the idNames that are in
      //splitHref
      var indexOfIds = [];

      // Run through splitHref to save in idNames only the Strings that
      // have a ':' at the beginning, which are the ones that should
      // contain a placeholer
      splitHref.forEach(function(hrefItem, index){
        if (hrefItem.substring(0,1) === ':'){
          indexOfIds.push(index);
          idNames.push(hrefItem.substring(1, hrefItem.length));
        }
      });

      //idValues are the actual Ids of the recent item
      //It might be only one
      var idValues = [];
      var statusObj = {};
      for (let i = 0; i < idNames.length; i++){
        var id = findId(result,idNames[i]);
        if (id != ""){
          idValues.push(id);
        } else {
          //If at least one idName wasn't found, set the status message
          //so that the developer knows what happened
          statusObj = {status: "At least one id of the href was not found"};
          break;
        }
      }

      //If the Id values were found in the object, then we form
      //the href String using the indexOfIds and the values in
      //idValues
      if (_.isEmpty(statusObj)){
        for (let i = 0; i < indexOfIds.length; i++){
          splitHref[indexOfIds[i]] = idValues[i];
        }
        //An '/' is added to the first String of the href String
        splitHref[0] = '/' + splitHref[0];
        //The splitHref is joined to form the complete href String
        return splitHref.join('/');
      } else {
        return statusObj;
      }
    }

    function findId(object, idName){
      var idValue = "";
      //Searching for the idName in the keys of the item object
      Object.keys(object).find((objKey) => {
        if (objKey === idName) {
          //If the idName was found in the object, then save its value
          idValue = object[objKey];
          //Stop searching after finding the element that meets the condition
          return true;
        }
      });
      return idValue;
    }

    function setString(result, fields){
      var resultString = "";
      fields.forEach(function(field, index){
        if (index < fields.length - 1){
          if (result[fields[index + 1]] != ""){
            resultString += result[field] + ", ";
          } else {
            resultString += result[field];
          }
        } else {
          resultString += result[field];
        }
      });
      return resultString;
    }

    function getRecentSearches(){
      if (encryptedStore === false){
        var recentSearches = JSON.parse(localStorage.getItem('recentSearches'));
        if (recentSearches != null){
          return recentSearches.reverse();
        } else {
          return [];
        }
      }
    }

    function addRecentSearch(item, result){
      var search = {};
      search.icon = item.icon;
      search.href = item.href;
      search.result = result;
      if (encryptedStore === false){
        var recentSearches = JSON.parse(localStorage.getItem("recentSearches"));
        if (recentSearches === null){
          recentSearches = [];
        }

        //Checking if the new search already exists in the list, in that case,
        //it's deleted
        recentSearches.find((recentSearch, index) => {
          if (recentSearch.result.Id === result.Id) {
            recentSearches.splice(index, 1);
            //Stop searching after finding the element that meets the condition
            return true;
          }
        });
        recentSearches.push(search);
        localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
      }
    }
  }

})();
