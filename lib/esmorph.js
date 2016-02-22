/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2016 Diego Marquina <d@mardie.net>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint node:true browser:true */
/*global esmorph:true,esprima:true */
(function (exports, esprimaRef) {
    'use strict';

    if(module && module.exports) {
      var esprima = require('esprima');
    }

    var Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    // Executes visitor on the object and its children (recursively).

    function traverse(object, visitor, master) {
        var key, child, parent, path;

        parent = (typeof master === 'undefined') ? [] : master;

        if (visitor.call(null, object, parent) === false) {
            return;
        }
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                child = object[key];
                path = [ object ];
                path.push(parent);
                if (typeof child === 'object' && child !== null) {
                    traverse(child, visitor, path);
                }
            }
        }
    }

    // Insert trace function call(s) in function bodies
    // It will be in the form of a function call:
    //
    //     traceName(object);
    //
    // where the object contains the following properties:
    //
    //    'name' holds the name of the function
    //    'lineNumber' holds the starting line number of the function block
    //    'range' contains the index-based range of the function
    //
    // The name of the function represents the associated reference for
    // the function (deduced on a best-effort basis if it is not
    // a function declaration).
    //
    // If traceName is a function instead of a string, it will be invoked and
    // the result will be used as the entire prolog. The arguments for the
    // invocation are the function name, range, and location info.

    function traceFunctionBody(traceName, options) {
        options = options || {};

        return function (code) {
            var tree,
                functionList,
                methodList,
                constructorList,
                param,
                signature,
                pos,
                i,
                j,
                lastChild,
                posPre,
                posPost,
                flItem;

            tree = esprima.parse(code, { range: true, loc: true });

            functionList = [];
            methodList = [];
            constructorList = [];

            traverse(tree, function (node, path) {
                var parent,
                    pos = [],
                    posEntrance,
                    posExit;
                //console.log(node.type);
                /*
                if (node.type === Syntax.FunctionDeclaration) {
                  // calculate entrance position
                  posEntrance = node.body.range[0];

                  // calculate exit position
                  lastChild = node.body.body[node.body.body.length - 1];

                  if(!lastChild) {
                    posExit = node.body.range[0];
                  } else if (lastChild.type === Syntax.ReturnStatement) {
                    posExit = lastChild.range[0] - 1;
                  } else {
                    posExit = lastChild.range[1] - 1;
                  }

                  if(options.entrance) {
                    pos.push(posEntrance);
                  }

                  if(options.exit) {
                    pos.push(posExit);
                  }

                  if(!options.exit && !options.entrance) {
                    pos.push(posEntrance, posExit);
                  }

                  functionList.push({
                      name: node.id.name,
                      range: node.range,
                      loc: node.loc,
                      blockStarts: pos
                  });
                }
                if (node.type === Syntax.FunctionExpression) {
                    // calculate entrance position
                    posEntrance = node.body.range[0];

                    // calculate exit position
                    lastChild = node.body.body[node.body.body.length - 1];

                    if(!lastChild) {
                        posExit = node.body.range[0];
                    } else if (lastChild.type === Syntax.ReturnStatement) {
                        posExit = lastChild.range[0] - 1;
                    } else {
                        posExit = lastChild.range[1] - 1;
                    }

                    if(options.entrance) {
                        pos.push(posEntrance);
                    }

                    if(options.exit) {
                        pos.push(posExit);
                    }

                    if(!options.exit && !options.entrance) {
                        pos.push(posEntrance, posExit);
                    }
                    functionList.push({
                        name: 'anonFunction',
                        range: node.range,
                        loc: node.loc,
                        blockStarts: pos
                    });
                }
*/
                //else if (node.type === Syntax.FunctionExpression) {
                    //parent = path[0];
                    //if (parent.type === Syntax.AssignmentExpression) {
                        //if (typeof parent.left.range !== 'undefined') {
                            //functionList.push({
                                //name: code.slice(parent.left.range[0],
                                          //parent.left.range[1] + 1),
                                //range: node.range,
                                //loc: node.loc,
                                //blockStart: node.body.range[0]
                            //});
                        //}
                    //} else if (parent.type === Syntax.VariableDeclarator) {
                        //functionList.push({
                            //name: parent.id.name,
                            //range: node.range,
                            //loc: node.loc,
                            //blockStart: node.body.range[0]
                        //});
                    //} else if (parent.type === Syntax.CallExpression) {
                        //functionList.push({
                            //name: parent.id ? parent.id.name : '[Anonymous]',
                            //range: node.range,
                            //loc: node.loc,
                            //blockStart: node.body.range[0]
                        //});
                    //} else if (typeof parent.length === 'number') {
                        //functionList.push({
                            //name: parent.id ? parent.id.name : '[Anonymous]',
                            //range: node.range,
                            //loc: node.loc,
                            //blockStart: node.body.range[0]
                        //});
                    //} else if (typeof parent.key !== 'undefined') {
                        //if (parent.key.type === 'Identifier') {
                            //if (parent.value === node && parent.key.name) {
                                //functionList.push({
                                    //name: parent.key.name,
                                    //range: node.range,
                                    //loc: node.loc,
                                    //blockStart: node.body.range[0]
                                //});
                            //}
                        //}
                    //}
                //}
            });

            // Insert the instrumentation code from the last entry.
            // This is to ensure that the range for each entry remains valid
            // (it won't shift due to some new inserting string before the range).
            for (i = functionList.length - 1; i >= 0; i -= 1) {
                flItem = functionList[i];
                param = {
                    name: flItem.name,
                    range: flItem.range,
                    loc: flItem.loc
                };
                if (typeof traceName === 'function') {
                    signature = traceName.call(null, param);
                } else {
                    signature = traceName + '({ ';
                    signature += 'name: \'' + flItem.name + '\', ';
                    if (typeof flItem.loc !== 'undefined') {
                        signature += 'lineNumber: ' + flItem.loc.start.line + ', ';
                    }
                    signature += 'range: [' + flItem.range[0] + ', ' +
                        flItem.range[1] + '] ';
                    signature += '});';
                }

                for (j = flItem.blockStarts.length - 1; j >= 0; j -= 1) {
                  pos = flItem.blockStarts[j] + 1;
                  //code = code.slice(0, pos) + '\n' + signature + code.slice(pos, code.length);
                  code = code.slice(0, pos) + signature + code.slice(pos, code.length);
                }
            }

            return code;
        };
    }


    function traceMethodBody(traceName, options) {
        options = options || {};
        return function (code) {
            var tree,
                functionList,
                methodList,
                constructorList,
                param,
                signature,
                pos,
                i,
                j,
                lastChild,
                posPre,
                posPost,
                flItem;

            tree = esprima.parse(code, { range: true, loc: true });

            functionList = [];
            methodList = [];
            constructorList = [];

            traverse(tree, function (node, path) {
                var parent,
                    pos = [],
                    posEntrance,
                    posExit;
                //console.log(node.type);
                //if (node.type === Syntax.FunctionDeclaration) {
                //    // calculate entrance position
                //    posEntrance = node.body.range[0];
                //
                //    // calculate exit position
                //    lastChild = node.body.body[node.body.body.length - 1];
                //
                //    if(!lastChild) {
                //        posExit = node.body.range[0];
                //    } else if (lastChild.type === Syntax.ReturnStatement) {
                //        posExit = lastChild.range[0] - 1;
                //    } else {
                //        posExit = lastChild.range[1] - 1;
                //    }
                //
                //    if(options.entrance) {
                //        pos.push(posEntrance);
                //    }
                //
                //    if(options.exit) {
                //        pos.push(posExit);
                //    }
                //
                //    if(!options.exit && !options.entrance) {
                //        pos.push(posEntrance, posExit);
                //    }
                //
                //    functionList.push({
                //        name: node.id.name,
                //        range: node.range,
                //        loc: node.loc,
                //        blockStarts: pos
                //    });
                //}
                /*if (node.type === Syntax.FunctionExpression) {
                 // calculate entrance position
                 posEntrance = node.body.range[0];

                 // calculate exit position
                 lastChild = node.body.body[node.body.body.length - 1];

                 if(!lastChild) {
                 posExit = node.body.range[0];
                 } else if (lastChild.type === Syntax.ReturnStatement) {
                 posExit = lastChild.range[0] - 1;
                 } else {
                 posExit = lastChild.range[1] - 1;
                 }

                 if(options.entrance) {
                 pos.push(posEntrance);
                 }

                 if(options.exit) {
                 pos.push(posExit);
                 }

                 if(!options.exit && !options.entrance) {
                 pos.push(posEntrance, posExit);
                 }
                 functionList.push({
                 name: 'anonfunction',
                 range: node.range,
                 loc: node.loc,
                 blockStarts: pos
                 });
                 }*/
                if (node.type === 'MethodDefinition' && node.key.name != 'constructor') {
                   // console.log(JSON.stringify(node,null,2));
                    // calculate entrance position
                   // console.log(node.value);
                    var className = path[1][1][0].id.name;

                    posEntrance = node.value.body.range[0];

                    // calculate exit position
                    lastChild = node.value.body.body[node.value.body.body.length - 1];

                    if(!lastChild) {
                        posExit = node.value.body.range[0];
                    } else if (lastChild.type === Syntax.ReturnStatement) {
                        posExit = lastChild.range[0] - 1;
                    } else {
                        posExit = lastChild.range[1] - 1;
                    }

                    if(options.entrance) {
                        pos.push(posEntrance);
                    }

                    if(options.exit) {
                        pos.push(posExit);
                    }

                    if(!options.exit && !options.entrance) {
                        pos.push(posEntrance, posExit);
                    }
                    methodList.push({
                        name: node.key.name,
                        range: node.range,
                        loc: node.loc,
                        className: className,
                        blockStarts: pos
                    });
                }
                //else if (node.type === Syntax.FunctionExpression) {
                //parent = path[0];
                //if (parent.type === Syntax.AssignmentExpression) {
                //if (typeof parent.left.range !== 'undefined') {
                //functionList.push({
                //name: code.slice(parent.left.range[0],
                //parent.left.range[1] + 1),
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //}
                //} else if (parent.type === Syntax.VariableDeclarator) {
                //functionList.push({
                //name: parent.id.name,
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (parent.type === Syntax.CallExpression) {
                //functionList.push({
                //name: parent.id ? parent.id.name : '[Anonymous]',
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (typeof parent.length === 'number') {
                //functionList.push({
                //name: parent.id ? parent.id.name : '[Anonymous]',
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (typeof parent.key !== 'undefined') {
                //if (parent.key.type === 'Identifier') {
                //if (parent.value === node && parent.key.name) {
                //functionList.push({
                //name: parent.key.name,
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //}
                //}
                //}
                //}
            });

            // Insert the instrumentation code from the last entry.
            // This is to ensure that the range for each entry remains valid
            // (it won't shift due to some new inserting string before the range).

            for (i = methodList.length - 1; i >= 0; i -= 1) {
                flItem = methodList[i];
                param = {
                    className: flItem.className,
                    name: flItem.name,
                    range: flItem.range,
                    loc: flItem.loc
                };
                if (typeof traceName === 'function') {
                    signature = traceName.call(null, param);
                } else {
                    signature = traceName + '({ ';
                    signature += 'name: \'' + flItem.name + '\', ';
                    if (typeof flItem.loc !== 'undefined') {
                        signature += 'lineNumber: ' + flItem.loc.start.line + ', ';
                    }
                    signature += 'range: [' + flItem.range[0] + ', ' +
                        flItem.range[1] + '] ';
                    signature += '});';
                }

                for (j = flItem.blockStarts.length - 1; j >= 0; j -= 1) {
                    pos = flItem.blockStarts[j] + 1;
                    //code = code.slice(0, pos) + '\n' + signature + code.slice(pos, code.length);
                    code = code.slice(0, pos) + signature + code.slice(pos, code.length);
                }
            }

            return code;
        };
    }


    function getSuperExit(node){
        var ind0, ind1

        if(!node || !node.value || !node.value.body || !node.value.body.body || !node.value.body.body.length || !node.value.body.body[0] || !node.value.body.body[0].expression
            || !node.value.body.body[0].expression.callee ){// ||!node.value.body.body[0].expression.callee[0] || !node.value.body.body[0].expression.callee){
            ind0 = true;
        }

        if(!ind0) {
            if (node.value.body.body[0].expression.callee.type == 'Super') {
                return node.value.body.body[0].expression.range[1];
            }
        }

        if(!node || !node.value || !node.value.body || !node.value.body.body || !node.value.body.body.length || !node.value.body.body[1] || !node.value.body.body[1].expression
            || !node.value.body.body[1].expression.callee ){// ||!node.value.body.body[0].expression.callee[0] || !node.value.body.body[0].expression.callee){
            ind1 = true;
        }

        if(!ind1) {
            if (node.value.body.body[1].expression.callee.type == 'Super') {
                return node.value.body.body[1].expression.range[1];
            }
        }

        return -1;
    };



    function traceConstructorBody(traceName, options) {
        options = options || {};

        return function (code) {
            var tree,
                functionList,
                methodList,
                constructorList,
                param,
                signature,
                pos,
                i,
                j,
                lastChild,
                posPre,
                posPost,
                flItem;

            tree = esprima.parse(code, { range: true, loc: true });

            functionList = [];
            methodList = [];
            constructorList = [];

            traverse(tree, function (node, path) {
                var parent,
                    pos = [],
                    posEntrance,
                    posExit;
                //console.log(node.type);

                /*if (node.type === Syntax.FunctionExpression) {
                 // calculate entrance position
                 posEntrance = node.body.range[0];

                 // calculate exit position
                 lastChild = node.body.body[node.body.body.length - 1];

                 if(!lastChild) {
                 posExit = node.body.range[0];
                 } else if (lastChild.type === Syntax.ReturnStatement) {
                 posExit = lastChild.range[0] - 1;
                 } else {
                 posExit = lastChild.range[1] - 1;
                 }

                 if(options.entrance) {
                 pos.push(posEntrance);
                 }

                 if(options.exit) {
                 pos.push(posExit);
                 }

                 if(!options.exit && !options.entrance) {
                 pos.push(posEntrance, posExit);
                 }
                 functionList.push({
                 name: 'anonfunction',
                 range: node.range,
                 loc: node.loc,
                 blockStarts: pos
                 });
                 }*/
                if (node.type === 'MethodDefinition' && node.key.name === 'constructor') {
                    // console.log(JSON.stringify(node,null,2));
                    // calculate entrance position
                    // console.log(node.value);
                    var className = path[1][1][0].id.name;

                    var superExit = getSuperExit(node);

                    posEntrance = node.value.body.range[0];
                    if(superExit != -1){//executing code before super is a bad thing.
                        posEntrance = superExit;
                    }



                    // calculate exit position
                    lastChild = node.value.body.body[node.value.body.body.length - 1];

                    if(!lastChild) {
                        posExit = node.value.body.range[0];
                    } else if (lastChild.type === Syntax.ReturnStatement) {
                        posExit = lastChild.range[0] - 1;
                    } else {
                        posExit = lastChild.range[1] - 1;
                    }

                    if(options.entrance) {
                        pos.push(posEntrance);
                    }

                    if(options.exit) {
                        pos.push(posExit);
                    }

                    if(!options.exit && !options.entrance) {
                        pos.push(posEntrance, posExit);
                    }
                    constructorList.push({
                        name: node.key.name,
                        className : className,
                        range: node.range,
                        loc: node.loc,
                        blockStarts: pos
                    });
                }
                /*
                if (node.type === 'MethodDefinitionConstructor') {
                    console.log(JSON.stringify(node,null,2));
                    // calculate entrance position
                    console.log(node.value);
                    posEntrance = node.value.body.range[0];

                    // calculate exit position
                    lastChild = node.value.body.body[node.value.body.body.length - 1];

                    if(!lastChild) {
                        posExit = node.value.body.range[0];
                    } else if (lastChild.type === Syntax.ReturnStatement) {
                        posExit = lastChild.range[0] - 1;
                    } else {
                        posExit = lastChild.range[1] - 1;
                    }

                    if(options.entrance) {
                        pos.push(posEntrance);
                    }

                    if(options.exit) {
                        pos.push(posExit);
                    }

                    if(!options.exit && !options.entrance) {
                        pos.push(posEntrance, posExit);
                    }
                    functionList.push({
                        name: '.'+node.key.name,
                        range: node.range,
                        loc: node.loc,
                        blockStarts: pos
                    });
                }*/
                //else if (node.type === Syntax.FunctionExpression) {
                //parent = path[0];
                //if (parent.type === Syntax.AssignmentExpression) {
                //if (typeof parent.left.range !== 'undefined') {
                //functionList.push({
                //name: code.slice(parent.left.range[0],
                //parent.left.range[1] + 1),
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //}
                //} else if (parent.type === Syntax.VariableDeclarator) {
                //functionList.push({
                //name: parent.id.name,
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (parent.type === Syntax.CallExpression) {
                //functionList.push({
                //name: parent.id ? parent.id.name : '[Anonymous]',
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (typeof parent.length === 'number') {
                //functionList.push({
                //name: parent.id ? parent.id.name : '[Anonymous]',
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (typeof parent.key !== 'undefined') {
                //if (parent.key.type === 'Identifier') {
                //if (parent.value === node && parent.key.name) {
                //functionList.push({
                //name: parent.key.name,
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //}
                //}
                //}
                //}
            });

            // Insert the instrumentation code from the last entry.
            // This is to ensure that the range for each entry remains valid
            // (it won't shift due to some new inserting string before the range).

            for (i = constructorList.length - 1; i >= 0; i -= 1) {
                flItem = constructorList[i];
                param = {
                    name: flItem.name,
                    range: flItem.range,
                    className: flItem.className,
                    loc: flItem.loc
                };
                if (typeof traceName === 'function') {
                    signature = traceName.call(null, param);
                } else {
                    signature = traceName + '({ ';
                    signature += 'name: \'' + flItem.name + '\', ';
                    if (typeof flItem.loc !== 'undefined') {
                        signature += 'lineNumber: ' + flItem.loc.start.line + ', ';
                    }
                    signature += 'range: [' + flItem.range[0] + ', ' +
                        flItem.range[1] + '] ';
                    signature += '});';
                }

                for (j = flItem.blockStarts.length - 1; j >= 0; j -= 1) {
                    pos = flItem.blockStarts[j] + 1;
                    //code = code.slice(0, pos) + '\n' + signature + code.slice(pos, code.length);
                    code = code.slice(0, pos) + signature + code.slice(pos, code.length);
                }
            }

            return code;
        };
    }

    function traceExpressionCall(traceName, options) {
        options = options || {};

        return function (code) {
            var tree,
                functionList,
                methodList,
                constructorList,
                param,
                signature,
                pos,
                i,
                j,
                lastChild,
                posPre,
                posPost,
                flItem;

            tree = esprima.parse(code, { range: true, loc: true });

            functionList = [];
            methodList = [];
            constructorList = [];

            traverse(tree, function (node, path) {
                var parent,
                    pos = [],
                    posEntrance,
                    posExit;
                if (node.type === 'CallExpression' ) {

                    // calculate entrance position
                    posEntrance = node.range[0]-1;

                    // calculate exit position
                    //lastChild = node.body.body[node.body.body.length - 1];

                    //if(!lastChild) {
                    //    posExit = node.body.range[0];
                    //} else if (lastChild.type === Syntax.ReturnStatement) {
                    //    posExit = lastChild.range[0] - 1;
                    //} else {
                    //    posExit = lastChild.range[1] - 1;
                    //}
                    //posExit = node.range[1];


                    pos.push(posEntrance);

/*
                    if(options.exit) {
                        pos.push(posExit);
                    }

                    if(!options.exit && !options.entrance) {
                        pos.push(posEntrance, posExit);
                    }*/
                    //console.info('object es la instancia, type?')
                    var name = node.callee.name;//type identifier
                    if(node.callee.object && node.callee.property){
                        //console.log(JSON.stringify(node,null,2));
                        var caller = node.callee.object.name;
                        if(node.callee.object.type =='ThisExpression'){
                            caller = 'this';
                        }
                        name = node.callee.property.name;
                    }
                    if(name) { //this case is for when super()
                        functionList.push({
                            caller: caller,
                            name: name,
                            range: node.range,
                            loc: node.loc,
                            blockStarts: pos
                        })
                    };
                }
                /*if (node.type === Syntax.FunctionExpression) {
                 // calculate entrance position
                 posEntrance = node.body.range[0];

                 // calculate exit position
                 lastChild = node.body.body[node.body.body.length - 1];

                 if(!lastChild) {
                 posExit = node.body.range[0];
                 } else if (lastChild.type === Syntax.ReturnStatement) {
                 posExit = lastChild.range[0] - 1;
                 } else {
                 posExit = lastChild.range[1] - 1;
                 }

                 if(options.entrance) {
                 pos.push(posEntrance);
                 }

                 if(options.exit) {
                 pos.push(posExit);
                 }

                 if(!options.exit && !options.entrance) {
                 pos.push(posEntrance, posExit);
                 }
                 functionList.push({
                 name: 'anonfunction',
                 range: node.range,
                 loc: node.loc,
                 blockStarts: pos
                 });
                 }*/

                /*
                 if (node.type === 'MethodDefinitionConstructor') {
                 console.log(JSON.stringify(node,null,2));
                 // calculate entrance position
                 console.log(node.value);
                 posEntrance = node.value.body.range[0];

                 // calculate exit position
                 lastChild = node.value.body.body[node.value.body.body.length - 1];

                 if(!lastChild) {
                 posExit = node.value.body.range[0];
                 } else if (lastChild.type === Syntax.ReturnStatement) {
                 posExit = lastChild.range[0] - 1;
                 } else {
                 posExit = lastChild.range[1] - 1;
                 }

                 if(options.entrance) {
                 pos.push(posEntrance);
                 }

                 if(options.exit) {
                 pos.push(posExit);
                 }

                 if(!options.exit && !options.entrance) {
                 pos.push(posEntrance, posExit);
                 }
                 functionList.push({
                 name: '.'+node.key.name,
                 range: node.range,
                 loc: node.loc,
                 blockStarts: pos
                 });
                 }*/
                //else if (node.type === Syntax.FunctionExpression) {
                //parent = path[0];
                //if (parent.type === Syntax.AssignmentExpression) {
                //if (typeof parent.left.range !== 'undefined') {
                //functionList.push({
                //name: code.slice(parent.left.range[0],
                //parent.left.range[1] + 1),
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //}
                //} else if (parent.type === Syntax.VariableDeclarator) {
                //functionList.push({
                //name: parent.id.name,
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (parent.type === Syntax.CallExpression) {
                //functionList.push({
                //name: parent.id ? parent.id.name : '[Anonymous]',
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (typeof parent.length === 'number') {
                //functionList.push({
                //name: parent.id ? parent.id.name : '[Anonymous]',
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //} else if (typeof parent.key !== 'undefined') {
                //if (parent.key.type === 'Identifier') {
                //if (parent.value === node && parent.key.name) {
                //functionList.push({
                //name: parent.key.name,
                //range: node.range,
                //loc: node.loc,
                //blockStart: node.body.range[0]
                //});
                //}
                //}
                //}
                //}
            });

            // Insert the instrumentation code from the last entry.
            // This is to ensure that the range for each entry remains valid
            // (it won't shift due to some new inserting string before the range).

            for (i = functionList.length - 1; i >= 0; i -= 1) {
                flItem = functionList[i];
                param = {
                    name: flItem.name,
                    caller: flItem.caller,
                    range: flItem.range,
                    loc: flItem.loc
                };
                if (typeof traceName === 'function') {
                    signature = traceName.call(null, param);
                } else {
                    signature = traceName + '({ ';
                    signature += 'name: \'' + flItem.name + '\', ';
                    if (typeof flItem.loc !== 'undefined') {
                        signature += 'lineNumber: ' + flItem.loc.start.line + ', ';
                    }
                    signature += 'range: [' + flItem.range[0] + ', ' +
                        flItem.range[1] + '] ';
                    signature += '});';
                }

                for (j = flItem.blockStarts.length - 1; j >= 0; j -= 1) {
                    pos = flItem.blockStarts[j] + 1;
                    //code = code.slice(0, pos) + '\n' + signature + code.slice(pos, code.length);
                    code = code.slice(0, pos) + signature + code.slice(pos, code.length);
                }
            }
            return code;
        };
    }
    // Insert trace at beginning of function bodies

    function traceFunctionEntrance(traceName) {
      return traceFunctionBody(traceName, { entrance: true } );
    }

    // Same as traceFunctionEntrance, but inserts trace at end of function bodies

    function traceFunctionExit(traceName) {
      return traceFunctionBody(traceName, { exit: true } );
    }

    // Combination of traceFunctionEntrance and traceFunctionExit

    function traceFunctionEntranceAndExit(traceName) {
      return traceFunctionBody(traceName, { entrance: true, exit: true } );
    }


    function traceConstructorEntrance(traceName) {
        return traceConstructorBody(traceName, { entrance: true } );
    }

    // Same as traceFunctionEntrance, but inserts trace at end of function bodies

    function traceConstructorExit(traceName) {
        return traceConstructorBody(traceName, { exit: true } );
    }

    // Combination of traceFunctionEntrance and traceFunctionExit

    function traceConstructorEntranceAndExit(traceName) {
        return traceConstructorBody(traceName, { entrance: true, exit: true } );
    }

    function expressionCall(traceName) {
        return traceExpressionCall(traceName);
    }

    function traceMethodEntrance(traceName) {
        return traceMethodBody(traceName, { entrance: true } );
    }

    // Same as traceFunctionEntrance, but inserts trace at end of function bodies

    function traceMethodExit(traceName) {
        return traceMethodBody(traceName, { exit: true } );
    }

    // Combination of traceFunctionEntrance and traceFunctionExit

    function traceMethodEntranceAndExit(traceName) {
        return traceMethodBody(traceName, { entrance: true, exit: true } );
    }
    function modify(code, modifiers) {
        var i;
        if (Object.prototype.toString.call(modifiers) === '[object Array]') {
            for (i = 0; i < modifiers.length; i += 1) {
                code = modifiers[i].call(null, code);
            }
        } else if (typeof modifiers === 'function') {
            code = modifiers.call(null, code);
        } else {
            throw new Error('Wrong use of esmorph.modify() function');
        }

        return code;
    }

    // Sync with package.json.
    exports.version = '0.0.0-dev';

    exports.modify = modify;

    exports.Tracer = {
        FunctionEntrance: traceFunctionEntrance,
        FunctionExit: traceFunctionExit,
        FunctionEntranceAndExit: traceFunctionEntranceAndExit,
        ConstructorEntranceAndExit: traceConstructorEntranceAndExit,
        ConstructorEntrance: traceConstructorEntrance,
        ConstructorExit: traceConstructorExit,
        MethodEntranceAndExit: traceMethodEntranceAndExit,
        MethodEntrance: traceMethodEntrance,
        MethodExit: traceMethodExit,
        ExpressionCall: expressionCall
    };

}(typeof exports === 'undefined' ? (esmorph = {}) : exports));
