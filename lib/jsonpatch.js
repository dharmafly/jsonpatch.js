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
        root.jsonpatch = {};
        root.returnExports = factory(root.jsonpatch);
  }
}(this, function (exports) {
  var apply_patch, JSONPatch, JSONPointer,_operation,_operationRequired,isArray;

  // Taken from underscore.js
  isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
  };

  /* Public: Shortcut to apply a patch to a clone of the document
   * without having to create a patch object first. Returns the
   * patched document.
   *
   * doc - The target document to which the patch should be applied.
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
      path[i-1] = split[i].replace('~1','/').replace('~0','~');
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
      if ('-' === segment) {
        segment = doc.length;
      } else {
        // Must be a non-negative integer in base-10
        if (!segment.match(/^[0-9]*$/)) {
          throw new PatchApplyError('Expected a number to segment an array');
        }
        segment = parseInt(segment,10);
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
   * doc - The document to operate against. Will be mutated so should
   * not be reused after the call.
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
      return value;
    }
    return this._action(doc, function (node, lastSegment) {
      if (isArray(node)) {
        if (lastSegment > node.length) {
          throw new PatchApplyError('Add operation must not attempt to create a sparse array!');
        }
        node.splice(lastSegment, 0, value);
      } else {
        node[lastSegment] = value;
      }
      return doc;
    });
  };


  /* Public: Takes a JSON document and removes the value pointed to.
   * It is an error to attempt to remove a value that doesn't exist.
   *
   * doc - The document to operate against. May be mutated so should
   * not be reused after the call.
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
   * doc - The document to operate against. May be mutated so should
   * not be reused after the call.
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
    if (0 === this.length) {
      return doc;
    }
    return this._action(doc, function (node, lastSegment) {
      return node[lastSegment];
    });
  };

  
  /* Public: returns true if this pointer points to a child of the
   * other pointer given. Returns true if both point to the same place.
   *
   * otherPointer - Another JSONPointer object
   *
   * Examples
   *
   *    var pointer1 = new JSONPointer('/animals/mammals/cats/holly');
   *    var pointer2 = new JSONPointer('/animals/mammals/cats');
   *    var isChild = pointer1.subsetOf(pointer2);
   *
   * Returns a boolean
   */
  JSONPointer.prototype.subsetOf = function (otherPointer) {
    if (this.length <= otherPointer.length) {
      return false;
    }
    for (var i = 0; i < otherPointer.length; i++) {
      if (otherPointer.path[i] !== this.path[i]) {
        return false;
      }
    }
    return true;
  };

  _operationRequired = {
    add: ['value'],
    replace: ['value'],
    test: ['value'],
    remove: [],
    move: ['from'],
    copy: ['from']
  };

  function contains(arr, value) {
    var i, len;
    for(i = 0, len = arr.length; i < len; i++) {
      if (arr[i] === value) return true;
    }
    return false;
  }

  
  // Check if a is deep equal to b (by the rules given in the
  // JSONPatch spec)
  function deepEqual(a,b) {
    var key;
    if (a === b) {
      return true;
    } else if (typeof a !== typeof b) {
      return false;
    } else if ('object' === typeof(a)) {
      var aIsArray = isArray(a),
          bIsArray = isArray(b);
      if (aIsArray !== bIsArray) {
        return false;
      } else if (aIsArray) {
        // Both are arrays
        if (a.length != b.length) {
          return false;
        } else {
          for (var i = 0; i < a.length; i++) {
            return deepEqual(a[i], b[i]);
          }
        }
      } else {
        // Check each key of the object recursively
        for(key in a) {
          if (Object.hasOwnProperty(a, key)) {
            if (!(Object.hasOwnProperty(b,key) && deepEqual(a[key], b[key]))) {
              return false;
            }
          } 
        }
        for(key in b) {
          if(Object.hasOwnProperty(b,key) && !Object.hasOwnProperty(a, key)) {
            return false;
          }
        }
        return true;
      }
    } else {
      return false;
    }
  }

  function validateOp(operation) {
    var key, i, required;
    if (!operation.op) {
      throw new InvalidPatch('Operation missing!');
    }
    if (!_operationRequired.hasOwnProperty(operation.op)) {
      throw new InvalidPatch('Invalid operation!');
    }
    if (!('path' in operation)) {
      throw new InvalidPatch('Path missing!');
    }

    required = _operationRequired[operation.op];

    // Check that all required keys are present
    for(i = 0; i < required.length; i++) {
      if(!(required[i] in operation)) {
        throw new InvalidPatch(operation.op + ' must have key ' + required[i]);
      }
    }
  }
  
  function compileOperation(operation) {
    validateOp(operation);
    var op = operation.op;
    var path = new JSONPointer(operation.path);
    var value = operation.value;
    var from = operation.from ? new JSONPointer(operation.from) : null;

    
    // Check that destination isn't a subset of source
    if (op == 'move') {
      if (path.subsetOf(from)) {
        throw new InvalidPatch('destination must not be a child of source');
      }
    }
    
    switch (op) {
    case 'add':
      return function (doc) {
        return path.add(doc, value);
      };
    case 'remove':
      return function (doc) {
        return path.remove(doc);
      };
    case 'replace':
      return function (doc) {
        return path.replace(doc, value);
      };
    case 'move':
      return function (doc) {
        var value = from.get(doc);
        var intermediate = from.remove(doc);
        return path.add(intermediate, value);
      };
    case 'copy':
      return function (doc) {
        var value = from.get(doc);
        return path.add(doc, value);
      };
    case 'test':
      return function (doc) {
        if (!deepEqual(path.get(doc), value)) {
          throw new PatchApplyError("Test operation failed. Value did not match.");
        }
        return doc;
      };
    }
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
    for(i = 0; i < patch.length; i++) {
      var compiled = compileOperation(patch[i]);
      _this.compiledOps.push(compiled);
    }
  };

  /* Public: Apply the patch to a document and returns the patched
   * document. The document is first cloned by converting to JSON and
   * back again, so only JSON-safe values are allowed.
   *
   * doc - The document to which the patch should be applied.
   *
   * Returns the patched document 
   */
  exports.JSONPatch.prototype.apply = function (doc) {
    return this.apply_unsafe(JSON.parse(JSON.stringify(doc)));
  };

  
  /* Public: Mutating version of of apply, this is faster but it may
   * mutate its argument (though you should not rely on this side
   * effect, if there are operations effecting the root then it may
   * not).
   *
   * What this means in practice is that you must not re-use the value
   * you pass in, instead use code like this:
   *
   *     var doc = (new JSONPatch(patch).apply_unsafe(doc));
   *
   * The reason you need to take the return value and can't just use
   * the mutated original is that sometimes a patch needs to replace
   * the root element.
   *
   * doc - The document to which the patch should be applied. May be
   * mutated.
   *
   * Returns the patched document (original may be mutated too)
   */
  exports.JSONPatch.prototype.apply_unsafe = function (doc) {
    var i;
    for(i = 0; i < this.compiledOps.length; i++) {
      doc = this.compiledOps[i](doc);
    }
    return doc;
  };
}));
