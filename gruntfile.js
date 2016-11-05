var _ = require('underscore');

var findDuplicates = function (sourceArray, prop) {
  var duplicates = [];
  var groupedByCount = _.countBy(sourceArray, function (item) { return item[prop]; });

  for (var name in groupedByCount) {
    if (groupedByCount[name] > 1) {
      var whereClause = [];
      whereClause[prop] = name;
      _.where(sourceArray, whereClause).map(function (item) { duplicates.push(item); });
    }
  }

  return _.uniq(_.pluck(duplicates, prop));
};

var getJSON = function (grunt) {
  var content = '';
  try {
    content = grunt.file.readJSON("data.json");
  } catch (e) {
    grunt.fail.fatal("data.json is not valid JSON. Error: " + e);
  }
  return content;
};
var getIso2to3JSON = function (grunt) {
  var content = '';
  try {
    content = grunt.file.readJSON("iso2toiso3.json");
  } catch (e) {
    grunt.fail.fatal("iso2toiso3.json is not valid JSON. Error: " + e);
  }
  return content;
};
var getIsoJSON = function (grunt) {
  var content = '';
  try {
    content = grunt.file.readJSON("data.iso3.json");
  } catch (e) {
    grunt.fail.fatal("data.iso3.json is not valid JSON. Error: " + e);
  }
  return content;
};



module.exports = function(grunt) {

  function validate () {
    var content = getJSON(grunt);

    // check country names and country shortcodes are unique
    var duplicateCountryNames = findDuplicates(content, 'countryName');
    if (duplicateCountryNames.length > 0) {
      grunt.fail.fatal('The country names are not unique - duplicates: ' + duplicateCountryNames);
    }
    var duplicateCountryShortCodes = findDuplicates(content, 'countryShortCode');
    if (duplicateCountryShortCodes.length > 0) {
      grunt.fail.fatal('The country short codes are not unique - duplicates: ' + duplicateCountryShortCodes);
    }

    // now check region names and short codes are unique for each country
    content.forEach(function (countryData) {
      var duplicateRegionNames = findDuplicates(countryData.regions, 'name');
      if (duplicateRegionNames.length > 0) {
        grunt.fail.fatal('The region names for ' + countryData.countryName + ' are not unique - duplicates: ' + duplicateRegionNames);
      }
    });
    console.log("PASS!");
  }


  function findIncomplete () {
    var content = getJSON(grunt);

    var incompleteCountries = [];
    content.forEach(function (countryData) {
      for (var i=0; i<countryData.regions.length; i++) {
        if (!_.has(countryData.regions[i], 'shortCode')) {
          incompleteCountries.push(countryData.countryName);
          break;
        }
      }
    });

    if (incompleteCountries.length > 0) {
      console.log('\nThe following countries are missing region short codes: \n-', incompleteCountries.join('\n- '));
      console.log('\n(' + incompleteCountries.length + ' countries)');
    } else {
      console.log('All regions now have short codes. Nice!');
    }
  }

  // convert country to iso3. remove region shortcodes as we don't have a mapping.
  function convertToIso3() {
    var content = getJSON(grunt);
    var mapping = getIso2to3JSON(grunt);
    content.forEach(function (countryData) {
      if (mapping[countryData.countryShortCode]) {
        countryData.countryShortCode = mapping[countryData.countryShortCode];
      }
      for (var i=0; i<countryData.regions.length; i++) {
        delete countryData.regions[i].shortCode;
      }
    });
    grunt.file.write('data.iso3.json', JSON.stringify(content), {encoding: 'UTF-8'});
  }
  function shrinkJson() {
    var content = getIsoJSON(grunt);
    content.forEach(function (countryData) {
      if (countryData.countryShortCode) {
        countryData.code = countryData.countryShortCode;
        delete countryData.countryShortCode;
      }
      var regions = [];
      for (var i=0; i<countryData.regions.length; i++) {
        regions.push(countryData.regions[i].name);
      }
      delete countryData.regions;
      countryData.regions = regions;
      countryData.name = countryData.countryName;
      delete countryData.countryName;
    });
    grunt.file.write('data.iso3.min.json', JSON.stringify(content), {encoding: 'UTF-8'});
  }


  grunt.registerTask("default", ['validate']);
  grunt.registerTask("validate", validate);
  grunt.registerTask("findIncomplete", findIncomplete);
  grunt.registerTask('iso3', convertToIso3);
  grunt.registerTask("shrink", shrinkJson);
};
