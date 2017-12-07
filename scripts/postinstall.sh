#!/bin/bash

echo "Running postinstall.sh, from..."
pwd

servicesdir="../../www/js/services"
controllersdir="../../www/js/controllers"
templatesdir="../../www/templates"
testdestdir="../../tests/Services"

if [ -d "$servicesdir" ]; then
		echo "Directory exists!"
    cp js/globalSearch.service.js $servicesdir
    cp js/globalSearch.controller.js $controllersdir
    cp templates/globalSearch.html $templatesdir
    cp test/specs/globalSearchService.tests.js $testdestdir
fi
