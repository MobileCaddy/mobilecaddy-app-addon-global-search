# MobileCaddy App Addon - Global Search

## Overview

AngularJS service used to look for a word in all the existing database tables and see the results in the UI, within a MobileCaddy application.

[![Build Status](https://travis-ci.org/MobileCaddy/mobilecaddy-app-addon-global-search.svg)](https://travis-ci.org/MobileCaddy/mobilecaddy-app-addon-global-search)


## Installation

```
npm install mobilecaddy-app-addon-global-search
```

The installation will include the tasks of moving the relevant scripts into the correct place of your MobileCaddy application project structure. The relevant unit tests will also be included.

## Setup

* Ensure that the MobileCaddy _appDataUtils_ is exposed in your project's _www/js/services/service.module.js_. It should contain these lines.

```
angular.module('appDataUtils', [])
  .factory('appDataUtils', function() {
    return mobileCaddy.require('mobileCaddy/appDataUtils');
});
```

And the appDataUtils should be included in this line also.

```
angular.module('starter.services', ['underscore', 'devUtils', 'vsnUtils',
'smartStoreUtils', 'syncRefresh', 'appDataUtils', 'logger']);
```

## Configuring

You can set the configuration information of the global search, to specify if the results will be saved in localStorage or encrypted in the database, the name of the tables that will be used to search, fields to query, among other details. This can be run in the `.run` in the _app.js_ file, thus it can be updated by the developer easily.

```
GlobalSearchService.setConfig({
    encrypted: false,
    config: [
      {
        table: 'Account__ap',
        name: 'Accounts',
        fieldsToQuery: ['Name', 'Description'],
        fieldsToShow: ['Name', 'BillingCountry'],
        icon: 'ion-folder',
        href: '/accounts/:Id'
     },
     {
       table: 'Contact__ap',
       name: 'Contacts',
       fieldsToQuery: ['Name', 'Title'],
       fieldsToShow: ['Name', 'Email'],
       icon: 'ion-person',
       href: '/accounts/:AccountId/contacts/:Id'
    }
   ]
  });

```

## Calls Available


### search ###

Calls an internal function for each table specified in the config information, that does the SOQL query to find the inputted word. Since the results are obtained asynchronously, when each call returns with a result it does a broadcast of the result so the controller can update the template appropriately.

#### Parameters ####

str : String. Represents the word inputted in the search box.

#### Returns ####

An array of the configuration information so the controller can use it to update the UI, from the start, with the names of the tables, the icons, etc.

#### Example ####

```
//The word was inputted by the user in a search box
var configInfo = GlobalSearchService.search(wordToSearch);

//In the controller the broadcast is triggered by the service when it finishes searching
$rootScope.$on('globalSearchResult', function(event, args) {
        console.log("Results of the search", args.results);
});

```

### getRecentSearches ###

It returns an Array of Objects representing all the results clicked after doing a global search. If encryptedStore is false then it will be obtained from localStorage.

#### Returns ####

An Array of Objects representing all the results clicked after doing a global search.

#### Example ####

```
var recentSearches = GlobalSearchService.getRecentSearches();
console.log("Recent Searches Array: ", recentSearches);

```

### addRecentSearch ###

Adds an item to the recent searches list. It can be added to the localStorage, if encryptedStore is false, or to the encrypted database otherwise. Any repeated item will be deleted before adding the same one. Also if the max number is reached the oldest item will be deleted.

#### Parameters ####

item : Object. Contains the config information of the result.

result : Object. The result object that will be added.

#### Example ####

```
var item = {
  table: 'Account__ap',
  name: 'Accounts',
  icon: 'ion-folder',
  results: [{Id: ab1, string: 'Account 1, UK', href: '/accounts/ab1'},
            {Id: ab2, string: 'Account 2, UK', href: '/accounts/ab2'}]
};
var result = {Id: ab1, string: 'Account 1, UK', href: '/accounts/ab1'};
GlobalSearchService.addRecentSearch(item, result);

```
