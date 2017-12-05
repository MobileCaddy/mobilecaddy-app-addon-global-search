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
    var maxItems;
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
    * @param {Object} confObject contains the config information of the tables
    * to do a global search on
    * @description Sets three global variables, the first for the max number of
    * search results, the second to define if the items will be stored in the
    * database (encrypted) or in local storage and the third for the config
    * information
    */
    function setConfig(confObject){
      maxItems = confObject.maxItems;
      encryptedStore = confObject.encrypted;
      config = confObject.config;
    }

    /**
    * @function search
    * @param {String} str it's the String that the user wants to search for in
    * the database tables
    * @return {[Object]} Array of Objects that have the config information of
    * the tables, that the controller will use
    * @description Gets the table information from the config variable,
    * for each table it calls the function searchTable with the inputed String
    * and returns the Array of config data to the controller. When the Promise
    * in the function searchTable resolves or rejects, the result is broadcasted,
    * so the controller can update its variables as necessary
    */
    function search(str){
      var confForController = [];
      config.forEach(function(configElement){
        confForController.push(setConfigForController(configElement));
        searchTable(configElement, str).then(function(resultsArray){
          $rootScope.$broadcast('globalSearchResult',
          {table : configElement.table, results : resultsArray});
        }, function(e) {
          logger.error("Global Search Service", e);
        });
      });
      return confForController;

    }

    /**
    * @function setConfigForController
    * @param {Object} element has the configuration information of a database
    * table
    * @return {Object} Object that has some of the elements of the config
    * Object of a specific table
    * @description generates an Object that has some elements of the config
    * parameter of a specific table, to be used by the controller
    */
    function setConfigForController(element){
      var object = {};
      object.table = element.table;
      object.name = element.name;
      object.icon = element.icon;
      return object;
    }

    /**
    * @function searchTable
    * @param {Object} element has the config information of the table on which
    * the SOQL query will be performed
    * @param {String} str it's the String that the user wants to search for in
    * the database tables
    * @return {Promise} resolves to a success with the Array of results, or
    * rejects an error object
    * @description Uses a smartSQL query from the devUtils API to find the
    * String parameter in any of the fields specified in the config information.
    * When it finishes the search it returns a promise that can have the
    * the records or a status if something unexpected happened.
    */
    function searchTable(element, str){

      //These are not being used for the moment because the query only
      //works when doing a SELECT * for now.
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
        whereCondition += "{" + element.table + ":" + field + "} LIKE '%" + str.toLocaleLowerCase() + "%'";
        if (index < element.fieldsToQuery.length - 1){
          whereCondition += " OR ";
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
            logger.error(resObject);
            reject(resObject);
          }
        });
      });
    }

    /**
    * @function createResultsArray
    * @param {[Object]} results it's the array that has the result object(s) from
    * the SOQL query
    * @param {Object} configElement has the configuration information for the
    * corresponding table of the result(s)
    * @return {[Object]} array that contains data of the result object(s)
    * @description creates an array of three objects for each result, one is the
    * Id of the result, the second is a String that contains the concatenated
    * fields to show from the result and the third is either the href that will
    * be used when the item is clicked in the view or a status explaining why
    * the href couldn't be created
    **/
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

    /**
    * @function setHref
    * @param {Object} result represents the result object
    * @param {String} href the href String with placeholders, that should be
    * used when the result is clicked
    * @return {String or Object} if the Id values are found on the object, then
    * it returns the String with the href, if they weren't, then an object with
    * the status is returned
    * @description It adds an href element to the result object or a status
    * element if an error occurred
    **/
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

      //idValues are the actual Ids of the result Object
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

      //If the status wasn't set, it means the Id values were found,
      //so we form the href String using the indexOfIds and the values
      //in idValues
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

    /**
    * @function findId
    * @param {Object} object represents a result object of the globlal search
    * @param {String} idName name of the placeholder containing an Id,
    * e.g.: AccountId
    * @return {String} value of the Id placeholder in the object
    * @description Auxiliar function that searches through the object,
    * to try to find the value of the corresponding idName
    **/
    function findId(object, idName){
      var idValue = "";
      //Searching for the idName in the keys of the Object
      Object.keys(object).find((objKey) => {
        if (objKey === idName) {
          //If the idName was found in the Object, then save its value
          idValue = object[objKey];
          //Stop searching after finding the element that meets the condition
          return true;
        }
      });
      return idValue;
    }

    /**
    * @function setString
    * @param {Object} result represents the result object
    * @param {[String]} fields each String is one field that should appear in
    * the result String
    * @return {String} the String that contains the result information,
    * e.g. "Judy Smith, CEO"
    * @description For each of the fields to show, it checks if the result
    * has it and if it does, the value is concatenated with the previous values
    * with a comma
    **/
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


    /**
    * @function getRecentSearches
    * @return {[Object]} represents the most recent results clicked
    * @description returns an Array with Objects representing the the most
    * recent results clicked. If encryptedStore is false then it will be
    * obtained from localStorage
    **/
    function getRecentSearches(){
      if (encryptedStore === false){
        var recentSearches = JSON.parse(localStorage.getItem('recentSearches'));
        if (recentSearches !== null){
          return recentSearches.reverse();
        } else {
          return [];
        }
      }
    }

    /**
    * @function addRecentSearch
    * @param {Object} item contains the config information of the result
    * @param {Object} result the result object that will be added
    * @description Adds an item to the recent searches list. It can be added to
    * the localStorage, if encryptedStore is false, or to the database otherwise.
    * Any repeated item will be deleted before adding the same one. Also if the
    * max number is reached the oldest item will be deleted.
    **/
    function addRecentSearch(item, result){
      var maxRecentSearches;
      if (maxItems === null) {
        maxRecentSearches = 10;
        maxItems = 10;
      } else {
        maxRecentSearches = maxItems;
      }
      var search = {
        "icon": item.icon,
        "href": item.href,
        "result": result
      };

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

        //Add the new result to the list
        recentSearches.push(search);

        //Checking the size of the list, because if it already has the
        //maximum amount of items then we need to remove one, before pushing
        //the new one
        if (recentSearches.length > maxRecentSearches){
          recentSearches.shift();
        }
        localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
      }
    }
  }

})();
