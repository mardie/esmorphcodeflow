var should = require('should'),
    esprima = require('esprima'),
    esmorph = require('../../lib/esmorph.js'),
    buildSrc = require('../lib/testHelpers').buildSrc;

describe('Function tracer', function() {

  describe('entrance', function() {
    var trace = esmorph.Tracer.FunctionEntrance('myTrace'),

        code = buildSrc([
                         'function foo() {',
                         'var a = 24;',
                         'return a;',
                         '}'
        ]),

        expectedCode = buildSrc([
                         'function foo() {',
                         'myTrace({ name: \'foo\', lineNumber: 1, range: [0, 37] });',
                         'var a = 24;',
                         'return a;',
                         '}'
        ]);

    it('should insert trace call at beginning of function', function() {
      ( trace(code) ).should.equal( expectedCode );
    });
  });

  describe('exit (simple, with return)', function() {
    var trace = esmorph.Tracer.FunctionExit('myTrace'),

        code = buildSrc([
                         'function foo() {',
                         'var a = 24;',
                         'return a;',
                         '}'
        ]),

        expectedCode = buildSrc([
                         'function foo() {',
                         'var a = 24;',
                         'myTrace({ name: \'foo\', lineNumber: 1, range: [0, 37] });',
                         'return a;',
                         '}'
        ]);

    it('should insert trace call at end of function', function() {
      ( trace(code) ).should.equal( expectedCode );
    });

  });

  describe('exit (no return)', function() {
    var trace = esmorph.Tracer.FunctionExit('myTrace'),

        code = buildSrc([
                         'function foo() {',
                         'var a = 24;',
                         '}'
        ]),

        expectedCode = buildSrc([
                         'function foo() {',
                         'var a = 24;',
                         'myTrace({ name: \'foo\', lineNumber: 1, range: [0, 28] });',
                         '}'
        ]);

    it('should insert trace call at end of function', function() {
      ( trace(code) ).should.equal( expectedCode );
    });

  });

  describe('exit (empty function body)', function() {
    var trace = esmorph.Tracer.FunctionExit('myTrace'),

        code = buildSrc([
                         'function foo() {',
                         '}'
        ]),

        expectedCode = buildSrc([
                         'function foo() {',
                         'myTrace({ name: \'foo\', lineNumber: 1, range: [0, 17] });',
                         '}'
        ]);

    it('should insert trace call at end of function', function() {
      ( trace(code) ).should.equal( expectedCode );
    });

  });


  describe('entrance and exit', function() {
    var trace = esmorph.Tracer.FunctionEntranceAndExit('myTrace');

        code = buildSrc([
                         'function foo() {',
                         'var a = 24;',
                         'return a;',
                         '}'
        ]),

        expectedCode = buildSrc([
                         'function foo() {',
                         'myTrace({ name: \'foo\', lineNumber: 1, range: [0, 37] });',
                         'var a = 24;',
                         'myTrace({ name: \'foo\', lineNumber: 1, range: [0, 37] });',
                         'return a;',
                         '}'
        ]);

    it('should insert trace call at beginning and end of function', function() {
      ( trace(code) ).should.equal( expectedCode );
    });
  });


});

