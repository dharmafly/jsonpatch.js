/* JSONPatch.js
 *
 * A Dharmafly project written by Thomas Parslow
 * <tom@almostobsolete.net> and released with the kind permission of
 * NetDev.
 *
 * Copyright 2011 Thomas Parslow. All rights reserved.
 * Permission is hereby granted,y free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 * Implements the JSON Patch IETF Draft as specified at:
 *
 *   http://tools.ietf.org/html/draft-pbryan-json-patch-06
 *
 * Also implements the JSON Pointer IETF Draft as specified at:
 *
 *   http://tools.ietf.org/html/draft-pbryan-zyp-json-pointer-05
 *
 */

(function (root, factory) {
    if (typeof exports === 'object') {
        // Node
        factory(module.exports);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root.jsonpatch);
  }
}(this, function (exports) {
  var apply_patch, JSONPatch, JSONPointer,_operations,isArray;

  // Taken from underscore.js
  isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
  };

  /* Public: Shortcut to apply a patch to a document without having to
   * create a patch object first. Returns the patched document.
   *
   * doc - The target document to which the patch should be applied.
   *       May be mutated
   * patch - A JSON Patch document specifying the changes to the
   *         target documentment
   *
   * Example (node.js)
   *
   *    jsonpatch = require('jsonpatch');
   *    doc = JSON.parse(sourceJSON);
   *    jsonpatch.apply_patch(mydoc, thepatch);
   *    destJSON = JSON.stringify(doc);
   *
   * Example (in browser)
   *
   *     <script src="jsonpatch.js" type="text/javascript"></script>
   *     <script type="application/javascript">
   *      doc = JSON.parse(sourceJSON);
   *      jsonpatch.apply_patch(mydoc, thepatch);
   *      destJSON = JSON.stringify(doc);
   *     </script>
   *
   * Returns the patched document
   */
  exports.apply_patch = apply_patch = function (doc, patch) {
    return (new JSONPatch(patch)).apply(doc);
  };

  /* Public: Error thrown if the patch supplied is invalid.
   */
  function InvalidPatch(message) {
    Error.call(this, message); this.message = message;
  }
  exports.InvalidPatch = InvalidPatch;
  InvalidPatch.prototype = new Error();
  /* Public: Error thrown if the patch can not be apllied to the given document
   */
  function PatchApplyError(message) {
    Error.call(this, message); this.message = message;
  }
  exports.PatchApplyError = PatchApplyError;
  PatchApplyError.prototype = new Error();

  /* Public: A class representing a JSON Pointer. A JSON Pointer is
   * used to point to a specific sub-item within a JSON document.
   *
   * Example (node.js);
   *
   *     jsonpatch = require('jsonpatch');
   *     var pointer = new jsonpatch.JSONPointer('/path/to/item');
   *     var item = pointer.follow(doc)
   *
   * Draft Spec: http://tools.ietf.org/html/draft-pbryan-zyp-json-pointer-00
   */
  exports.JSONPointer = JSONPointer = function JSONPointer (pathStr) {
    var i,split,path=[];
    // Split up the path
    split = pathStr.split('/');
    if ('' !== split[0]) {
      throw new InvalidPatch('JSONPointer must start with a slash (or be an empty string)!');
    }
    for (i = 1; i < split.length; i++) {
      path[i-1] = decodeURIComponent(split[i]);
    }
    this.path = path;
    this.length = path.length;
  };

  /* Private: Get a segment of the pointer given a current doc
   * context.
   */
  JSONPointer.prototype._get_segment = function (index, doc) {
    var segment = this.path[index];
    if(isArray(doc)) {
      segment = parseInt(segment,10);
      if (isNaN(segment) || segment < 0) {
        throw new PatchApplyError('Expected a number to segment an array');
      }
    }
    return segment;
  };

  /* Private: Follow the pointer to its penultimate segment then call
   * the handler with the current doc and the last key (converted to
   * an int if the current doc is an array).
   *
   * doc - The document to search within
   * handler - The callback function to handle the last part
   *
   * Returns the result of calling the handler
   */
  JSONPointer.prototype._action = function (doc, handler) {
    var i,segment;
    for (i = 0; i < this.length-1; i++) {
      segment = this._get_segment(i, doc);
      if (!Object.hasOwnProperty.call(doc,segment)) {
        throw new PatchApplyError('Path not found in document');
      }
      doc = doc[segment];
    }
    return handler(doc, this._get_segment(this.length-1, doc));
  };

  /* Public: Takes a JSON document and a value and adds the value into
   * the doc at the position pointed to. If the position pointed to is
   * in an array then the existing element at that position (if any)
   * and all that follow it have there position incremented to make
   * room. It is an error to add to a parent object that doesn't exist
   * or to try to replace an existing value in an object.
   *
   * doc - The document to operate against. May be mutated.
   * value - The value to insert at the position pointed to
   *
   * Examples
   *
   *    var doc = new JSONPointer("/obj/new").add({obj: {old: "hello"}}, "world");
   *    // doc now equals {obj: {old: "hello", new: "world"}}
   *
   * Returns the updated doc (the value passed in may also have been mutated)
   */
  JSONPointer.prototype.add = function (doc, value) {
    // Special case for a pointer to the root
    if (0 === this.length) {
      // Adding the root only works if there is no root already (if
      // the doc is undefined)
      if ('undefined' === typeof doc) {
        return value;
      } else {
        throw new PatchApplyError('Add operation must not point to an existing value!');
      }
    }
    return this._action(doc, function (node, lastSegment) {
      if (isArray(node)) {
        if (lastSegment > node.length) {
          throw new PatchApplyError('Add operation must not attempt to create a sparse array!');
        }
        node.splice(lastSegment, 0, value);
      } else {
        if (Object.hasOwnProperty.call(node,lastSegment)) {
          throw new PatchApplyError('Add operation must not point to an existing value!');
        }
        node[lastSegment] = value;
      }
      return doc;
    });
  };


  /* Public: Takes a JSON document and removes the value pointed to.
   * It is an error to attempt to remove a value that doesn't exist.
   *
   * doc - The document to operate against. May be mutated.
   *
   * Examples
   *
   *    var doc = new JSONPointer("/obj/old").add({obj: {old: "hello"}});
   *    // doc now equals {obj: {}}
   *
   * Returns the updated doc (the value passed in may also have been mutated)
   */
  JSONPointer.prototype.remove = function (doc) {
    // Special case for a pointer to the root
    if (0 === this.length) {
      // Removing the root makes the whole value undefined.
      // NOTE: Should it be an error to remove the root if it is
      // ALREADY undefined? I'm not sure...
      return undefined;
    }
    return this._action(doc, function (node, lastSegment) {
        if (!Object.hasOwnProperty.call(node,lastSegment)) {
          throw new PatchApplyError('Remove operation must point to an existing value!');
        }
        if (isArray(node)) {
          node.splice(lastSegment, 1);
        } else {
          delete node[lastSegment];
        }
      return doc;
    });
  };

  /* Public: Semantically equivalent to an remove followed by an add
   * except when the pointer points to the root element in which case
   * the whole document is replaced.
   *
   * doc - The document to operate against. May be mutated.
   *
   * Examples
   *
   *    var doc = new JSONPointer("/obj/old").replace({obj: {old: "hello"}}, "world");
   *    // doc now equals {obj: {old: "world"}}
   *
   * Returns the updated doc (the value passed in may also have been mutated)
   */
  JSONPointer.prototype.replace = function (doc, value) {
    return this.add(this.remove(doc), value);
  };

  JSONPointer.prototype.move = function (doc, to) {
    var value = this.get(doc);
    var dest = new JSONPointer(to);
    dest.replace(doc, value);
    return this.remove(doc);
  };

  /* Public: Returns the value pointed to by the pointer in the given doc.
   *
   * doc - The document to operate against.
   *
   * Examples
   *
   *    var value = new JSONPointer("/obj/value").get({obj: {value: "hello"}});
   *    // value now equals 'hello'
   *
   * Returns the value
   */
  JSONPointer.prototype.get = function (doc) {
    return this._action(doc, function (node, lastSegment) {
      return node[lastSegment];
    });
  };

  _operations = {
    add: function(doc, operation) {
      return this.add(doc, operation.value);
    },
    remove: function(doc, operation) {
      return this.remove(doc);
    },
    replace: function(doc, operation) {
      return this.replace(doc, operation.value);
    },
    move: function(doc, operation) {
      if(startsWith(operation.to, operation.path)) {
        throw new InvalidPatch('destination must not be a child of path');
      }
      var value = this.get(doc);
      var intermediate = this.remove(doc);
      var dest = new JSONPointer(operation.to);
      return dest.add(intermediate, value);
    },
    copy: function(doc, operation) {
      if(startsWith(operation.to, operation.path)) {
        throw new InvalidPatch('destination must not be a child of path');
      }
      var value = this.get(doc);
      var dest = new JSONPointer(operation.to);
      return dest.add(doc, value);
    },
    test: function(doc, operation) {
      throw new Error('not implemented');
    }
  };

  function startsWith(str, strPrefix) {
    return str.substr(0, strPrefix.length) === strPrefix;
  }
  function contains(arr, value) {
    var i, len;
    for(i = 0, len = arr.length; i < len; i++) {
      if (arr[i] === value) return true;
    }
    return false;
  }

  function compileOperation(operation) {
    var op = operation.op;
    var path = new JSONPointer(operation.path);
    return function (doc) {
      return _operations[op].call(path, doc, operation);
    };
  }

  var operationRequired = {
    add: ['value'],
    replace: ['value'],
    test: ['value'],
    remove: [],
    move: ['to'],
    copy: ['to']
  };
  function validateOp(operation) {
    var key;
    if (!operation.op) {
      throw new InvalidPatch('Operation missing!');
    }
    if (!operationRequired.hasOwnProperty(operation.op)) {
      throw new InvalidPatch('Invalid operation!');
    }
    if (!operation.path) {
      throw new InvalidPatch('Path missing!');
    }

    for(key in operation) {
      if(key === 'op' || key === 'path' || !operation.hasOwnProperty) {
        continue;
      }
      if (!contains(operationRequired[operation.op], key)) {
        throw new InvalidPatch(operation.op + ' must not have key ' +key);
      }
    }

    operationRequired[operation.op].forEach(function (key) {
      if(!operation.hasOwnProperty(key)) {
        throw new InvalidPatch(operation.op + ' must have key ' +key);
      }
    });
  }

  /* Public: A class representing a patch.
   *
   *  patch - The patch as an array or as a JSON string (containing an array)
   */
  exports.JSONPatch = JSONPatch = function JSONPatch(patch) {
    this._compile(patch);
  };

  JSONPatch.prototype._compile = function (patch) {
    var i, n, key;
    var _this = this;
    this.compiledOps = [];

    if ('string' === typeof patch) {
      patch = JSON.parse(patch);
    }
    if(!isArray(patch)) {
      throw new InvalidPatch('Patch must be an array of operations');
    }
    patch.forEach(function (operation) {
      validateOp(operation);
      var compiled = compileOperation(operation);
      _this.compiledOps.push(compiled);
    });

  };

  /* Public: Apply the patch to a document and returns the patched
   * document. The original may be mutated.
   *
   * doc - The document to which the patch should be applied. May be
   * mutated.
   *
   * Returns the patched document (original may be mutated too)
   */
  exports.JSONPatch.prototype.apply = function (doc) {
    var i;
    for(i = 0; i < this.compiledOps.length; i++) {
      doc = this.compiledOps[i](doc);
    }
    return doc;
  };
}));