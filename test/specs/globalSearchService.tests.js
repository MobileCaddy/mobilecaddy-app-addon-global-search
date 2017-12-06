// G L O B A L    S E A R C  H  S E R V I C E

describe('GlobalSearchService Unit Tests', function(){

  beforeEach(module('starter.services'));

  var devUtilsMock,
      loggerMock;

  beforeEach(function() {
    // loggerMock mock - we want to use these in out 'expects'
    loggerMock = jasmine.createSpyObj('logger', ['log', 'error']);

    devUtilsMock = jasmine.createSpyObj(['smartSql']);

    module(function($provide) {
      $provide.value('devUtils', devUtilsMock);
      $provide.value('logger', loggerMock);
    });

  });

  beforeEach(inject(function(_$rootScope_, _GlobalSearchService_){

    GlobalSearchService = _GlobalSearchService_;

    $rootScope = _$rootScope_;

    GlobalSearchService.setConfig({
      maxItems: 10,
      encrypted: false,
      tables: [
        {
          table: 'Account__ap',
          name: 'Accounts',
          icon: 'ion-folder',
          href: '/accounts/:Id',
          fieldsToShow : ['field1', 'field2'],
          fieldsToQuery : ['query1', 'query2']
        },
        {
          table: 'Contact__ap',
          name: 'Contacts',
          icon: 'ion-person',
          href: '/contacts/:Id',
          fieldsToShow : ['field3', 'field4'],
          fieldsToQuery : ['query3', 'query4']
        }
      ]
    });

  }));

  /* SUCCESS setConfig */
  describe('setConfig', function(){
    it('should have setConfig', function(){
      var c = GlobalSearchService._getConfig();
      expect(c[0].name).toBe("Accounts");
      expect(c[0].icon).toBe("ion-folder");
      expect(c[0].href).toBe("/accounts/:Id");
      expect(c[1].name).toBe("Contacts");
      expect(c[1].icon).toBe("ion-person");
      expect(c[1].href).toBe("/contacts/:Id");
    });
  });


  /* getRecentSearches */
  describe('getRecentSearches', function(){
    it('should return [] for empty getRecentSearches', function(){
      localStorage.removeItem('recentSearches');
      expect(GlobalSearchService.getRecentSearches()).toEqual([]);
    });
  });

  /* getRecentSearches */
  describe('getRecentSearches', function(){
    it('should return reverse ordered getRecentSearches', function(){
      localStorage.setItem('recentSearches', '[2,1]');
      expect(GlobalSearchService.getRecentSearches()).toEqual([1,2]);
    });
  });


  /* addRecentSearch */
  describe('addRecentSearch', function(){
    it('should add new recent search to empty array', function(){
      localStorage.removeItem('recentSearches');
      var myIcon = 'test-icon', myHref = 'test-href', myId = 1;
      GlobalSearchService.addRecentSearch({icon: myIcon, href: myHref}, {Id:myId});
      var r = JSON.parse(localStorage.getItem('recentSearches'));
      expect(r[0].icon).toBe(myIcon);
      expect(r[0].href).toBe(myHref);
      expect(r[0].result.Id).toBe(myId);
    });

    it('should add new recent search to non empty array, not existing Id', function(){
      localStorage.setItem('recentSearches', JSON.stringify([{icon: "duff", href: "duff", result: {Id:"duffId"}}]));
      var myIcon = 'test-icon', myHref = 'test-href', myId = 1;
      GlobalSearchService.addRecentSearch({icon: myIcon, href: myHref}, {Id:myId});
      var r = JSON.parse(localStorage.getItem('recentSearches'));
      expect(r[1].icon).toBe(myIcon);
      expect(r[1].href).toBe(myHref);
      expect(r[1].result.Id).toBe(myId);
    });


    it('should add new recent search to non empty array, not existing Id, max items', function(){
      var duff = {icon: "duff", href: "duff", result: {Id:"duffId"}};
      localStorage.setItem('recentSearches', JSON.stringify([duff, duff, duff, duff, duff, duff, duff, duff, duff, duff]));
      var myIcon = 'test-icon', myHref = 'test-href', myId = 1;
      GlobalSearchService.addRecentSearch({icon: myIcon, href: myHref}, {Id:myId});
      var r = JSON.parse(localStorage.getItem('recentSearches'));
      expect(r.length).toBe(10);
      expect(r[9].icon).toBe(myIcon);
      expect(r[9].href).toBe(myHref);
      expect(r[9].result.Id).toBe(myId);
    });


    it('should add new recent search to non empty array, existing Id', function(){
      var myIcon = 'test-icon', myHref = 'test-href', myId = 1;

      localStorage.setItem('recentSearches', JSON.stringify([{icon: "duff", href: "duff", result: {Id:3}},{icon: myIcon, href: myHref, result: {Id:myId}}, {icon: "duff", href: "duff", result: {Id:"duffId"}}]));
      GlobalSearchService.addRecentSearch({icon: myIcon, href: myHref}, {Id:myId});

      var r = JSON.parse(localStorage.getItem('recentSearches'));
      expect(r.length).toBe(3);
      expect(r[2].icon).toBe(myIcon);
      expect(r[2].href).toBe(myHref);
      expect(r[2].result.Id).toBe(myId);
    });
  });

  /* search */
  describe('search', function(){
    it('should search OK', function(done){
      var expectedCalls = 2;
      var currCalls = 0;
      var expectedReturns = expectedCalls
      var currReturns = 0;

      devUtilsMock.smartSql.and.callFake(function(soql){
        // TODO - verify soql query (table, field, etc)
        return new Promise(function(resolve, reject) {
          currCalls += 1;
          resolve({records : [{Id: currCalls.toString()}]});
        });
      });

      var mySearchStr = "mySearchStr";
      GlobalSearchService.search(mySearchStr);

      $rootScope.$on('globalSearchResult', function(event, args) {
        currReturns += 1;
        if (currReturns == 1) {
          expect(args.table).toBe("Account__ap");
          expect(args.results[0].href).toBe('/accounts/1');
        } else {
          expect(args.table).toBe("Contact__ap");
          expect(args.results[0].href).toBe('/contacts/2');
        }
        if (currReturns == expectedReturns) done();
      });

    });
  })

});
