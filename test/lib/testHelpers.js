/**
 * Some simple test helpers used in unit tests for esmorph
 * @author Seth McLaughlin <s@sethmcl.com>
 */
'use strict';

// dependencies
var fs   = require('fs'),
    path = require('path');

// locals
var sourceCode = {};

/**
 * Load sample source code
 * @param {String} codeFile the file name. Will be resolved relative
 * to the /test/data/sample_source_code/ directory
 * @return {String} contents of codeFile
 */
module.exports.loadSampleCode = function( codeFile ) {
  var code,
      codeRoot = path.resolve( __dirname, '..', 'data', 'sample_source_code' );

  // check if we have already cached the file contents
  if(sourceCode[codeFile]) {
    code = sourceCode[codeFile];
  } else {
    try {
      code = sourceCode[codeFile] = fs.readFileSync( path.resolve( codeRoot, codeFile + '.js' ) ).toString();
    } catch(e) {
      throw Error('Could not load codeFile "' + codeFile + '": ' + e.message);
    }
  }

  return code;
};

/**
 * Build string of source code from array
 * @param {Array} lines code
 * @return {String} source code
 */
module.exports.buildSrc = function( lines ) {
  return lines.join('');
};

