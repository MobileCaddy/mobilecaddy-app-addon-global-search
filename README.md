# MobileCaddy App Addon - Global Search

## Overview

AngularJS service used to look for a word in all the existing database tables and see the results in the UI, within a MobileCaddy application.

[![Build Status](https://travis-ci.org/MobileCaddy/mobilecaddy-app-addon-global-search.svg)](https://travis-ci.org/MobileCaddy/mobilecaddy-app-addon-global-search)


## Installation

```
npm install mobilecaddy-app-addon-global-search
```

The installation will include the tasks of moving the relevant scripts into the correct place of your MobileCaddy application project structure. The relevant unit tests will also be included.

## Configuring

You can set the configuration information of the global search, to specify if the results will be saved in localStorage or encrypted in the database, the name of the tables that will be used to search, fields to query, among other details. This can be run in the `.run` in the _app.js_ file, thus it can be updated by the developer easily.

```
GlobalSearchService.setConfig({
    encrypted: false,
    tables: [
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

### Syntax
```
GlobalSearchService.setConfig({encrypted, tables});
```

### Parameters

#### encrypted Optional

Whether or not to use the encrypted database to store the recently clicked on search results. If _false_, stored in localStorage. Defaults to *false*. **Note: Not yet supported**.

#### tables

Array of objects configuring each table to be included in the global search, thus;
```
[{
  table,          // string: Name of the mobilised table
  name,           // string: Label to be shown in search output
  fieldsToQuery,  // [string]: Array of field names to be queried
  fieldsToShow,   // [string]: Array of field names to be used in search output
  icons,          // string:  Ionicon to be used in search output
  href            // string: State URL to be used for direct record access.
}]
```


## API


### search

Calls an internal function for each table specified in the config information, that does the SOQL query to find the inputted word. Since the results are obtained asynchronously, when each call returns with a result it does a broadcast of the result so the controller can update the template appropriately.

#### Syntax
```
search(str)
```


#### Parameters

**str**: string. Represents the word inputted in the search box.

#### Returns ####

The *tables* config, as input in configuration (above)

#### Example ####

```
GlobalSearchService.search("test");

//In the controller the broadcast is triggered by the service when it finishes searching
$rootScope.$on('globalSearchResult', function(event, args) {
        console.log("Results of the search", args.results);
});

```

### getRecentSearches

returns an Array of Objects representing all the results clicked after doing a global search. If encryptedStore is false then it will be obtained from localStorage.

#### Syntax
```
getRecentSearches();
```

#### Returns ####

An Array of Objects representing all the results clicked after doing a global search.

#### Example ####

```
var recentSearches = GlobalSearchService.getRecentSearches();

```

### addRecentSearch ###

Adds an item to the recent searches list. It can be added to the localStorage, if encryptedStore is false, or to the encrypted database otherwise. Any repeated item will be deleted before adding the same one. Also if the max number is reached the oldest item will be deleted.

#### Parameters ####

**item** : object. Contains the config information of the result.

**result** : object. The result object that will be added.

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
