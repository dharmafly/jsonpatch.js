if ('function' === typeof require) {
  jsonpatch = require('../lib/jsonpatch');
}

describe('JSONPointer', function () {
  var example;
  beforeEach(function () {
    example = {
      "foo": {
        "anArray": [
          { "prop": 44 },
          "second",
          "third"
        ],
        "another prop": {
          "baz": "A string"
        }
      }
    };
  });

  describe('.add()', function () {
    var add;
    beforeEach(function () {
      add = function (path, doc, value) {
        return (new jsonpatch.JSONPointer(path)).add(doc, value);
      }
    });

    it('should add a element to an object', function () {
      example = add('/foo/newprop',example,'test');
      expect(example.foo.newprop).toEqual('test');
    });
    it('should add an element to list, pushing up the remaing values', function () {
      example = add('/foo/anArray/1',example,'test');
      expect(example.foo.anArray.length).toEqual(4);
      expect(example.foo.anArray[1]).toEqual('test');
      expect(example.foo.anArray[2]).toEqual('second');
    });

    it('should allow adding to the end of an array', function () {
      example = add('/foo/anArray/3',example,'test');
      expect(example.foo.anArray.length).toEqual(4);
      expect(example.foo.anArray[3]).toEqual('test');
    });
    
    it('should allow adding to the end of an array', function () {
      example = add('/foo/anArray/-',example,'test');
      expect(example.foo.anArray.length).toEqual(4);
      expect(example.foo.anArray[3]).toEqual('test');
    });

    it('should fail if the object value already exists', function () {
      expect(function () {
        add('/foo/another prop',example,'test');
      }).toThrow(new jsonpatch.PatchApplyError('Add operation must not point to an existing value!'));
    });

    it('should fail if adding to an array would create a sparse array', function () {
      expect(function () {
        add('/foo/anArray/4',example,'test');
      }).toThrow(new jsonpatch.PatchApplyError('Add operation must not attempt to create a sparse array!'));
    });

    it('should should fail if the place to add specified does not exist', function () {
      expect(function () {
        add('/foo/newprop/alsonew',example,'test');
      }).toThrow(new jsonpatch.PatchApplyError('Path not found in document'));
    });

    it('should should fail when trying to add the root to a non-undefined value', function () {
      expect(function () {
        add('',example,'test');
      }).toThrow(new jsonpatch.PatchApplyError('Add operation must not point to an existing value!'));
    });

    it('should should succeed if replacing the root in undefined ', function () {
      expect(add('',undefined,'test')).toEqual('test');
    });
  });

  describe('.remove()', function () {
    function do_remove(pointerStr, doc) {
      return (new jsonpatch.JSONPointer(pointerStr)).remove(doc);
    }

    it('should remove an object key', function () {
      example = do_remove("/foo", example);
      expect(example.foo).toBeUndefined();
    });

    it('should remove an item from an array', function () {
      example = do_remove("/foo/anArray/1", example);
      expect(example.foo.anArray.length).toEqual(2);
      expect(example.foo.anArray[1]).toEqual('third');
    });

    it('should fail if the object key specified doesnt exist', function () {
      expect(function () {do_remove('/foo/notthere', example);}).toThrow(new jsonpatch.PatchApplyError('Remove operation must point to an existing value!'));
    });

    it('should should fail if the path specified doesnt exist', function () {
      expect(function () {do_remove('/foo/notthere/orhere', example);}).toThrow(new jsonpatch.PatchApplyError('Path not found in document'));
    });

    it('should fail if the array element specified doesnt exist', function () {
      expect(function () {do_remove('/foo/anArray/4', example);}).toThrow(new jsonpatch.PatchApplyError('Remove operation must point to an existing value!'));
    });

    it('should return undefined when removing the root', function () {
      expect(do_remove('', example)).toBeUndefined();
    });
  });

  describe('.get()', function () {
    function do_get(pointerStr, doc) {
      return (new jsonpatch.JSONPointer(pointerStr)).get(doc);
    }

    describe('JSONPointer examples', function () {
      var doc = {
        "foo": ["bar", "baz"],
        "numbers": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],
        "": 0,
        "a/b": 1,
        "c%d": 2,
        "e^f": 3,
        "g|h": 4,
        "i\\j": 5,
        "k\"l": 6,
        " ": 7,
        "m~n": 8
      };

      var examples = {
        // Examples from the spec document
        ""     :doc,
        "/foo"  :["bar", "baz"],
        "/foo/0":"bar",
        "/"     :0,
        "/a~1b" :1,
        "/c%d"  :2,
        "/e^f"  :3,
        "/g|h"  :4,
        "/i\\j" :5,
        "/k\"l" :6,
        "/ "    :7,
        "/m~0n" :8,
        // Extra examples
        "/numbers/010": 10,
        "/numbers/00010": 10,
        "/numbers/-": undefined
      };

      for (var example in examples) {
        (function (example) {
          it('should get the correct pointed object for example "' + example + '"', function () {
            expect(do_get(example, doc)).toEqual(examples[example]);
          });
        })(example);
      }
    });

    it('should get the object pointed to', function () {
      expect(do_get('/foo/another prop/baz', example)).toEqual('A string');
    });

    it('should get the array element pointed to', function () {
      expect(do_get('/foo/anArray/1', example)).toEqual('second');
    });
  });
});

describe('JSONPatch', function () {
  var patch;
  describe('constructor', function () {
    it('should accept a JSON string as a patch', function () {
      patch = new jsonpatch.JSONPatch('[{"op":"remove", "path":"/"}]');
      expect(patch = patch.compiledOps.length).toEqual(1);
    });
    it('should accept a JS object as a patch', function () {
      patch = new jsonpatch.JSONPatch([{"op":"remove", "path":"/"}, {"op":"remove", "path":"/"}]);
      expect(patch.compiledOps.length).toEqual(2);
    });
    it('should raise an error for  patches that arent arrays', function () {
      expect(function () {patch = new jsonpatch.JSONPatch({});}).toThrow(new jsonpatch.InvalidPatch('Patch must be an array of operations'));
    });
    it('should raise an error if value is not supplied for add or replace operation', function () {
      expect(function () {patch = new jsonpatch.JSONPatch([{op:"add", path:'/'}]);}).toThrow(new jsonpatch.InvalidPatch('add must have key value'));
      expect(function () {patch = new jsonpatch.JSONPatch([{op:"replace", path:'/'}]);}).toThrow(new jsonpatch.InvalidPatch('replace must have key value'));
    });
    it('should raise an error if an operation is not specified', function () {
      expect(function () {patch = new jsonpatch.JSONPatch([{}]);}).toThrow(new jsonpatch.InvalidPatch('Operation missing!'));
    });
    it('should raise an error if un-recognised operation is specified', function () {
      expect(function () {patch = new jsonpatch.JSONPatch([{op:"blam"}]);}).toThrow(new jsonpatch.InvalidPatch('Invalid operation!'));
    });

  });


  
  it('should not mutate the source document', function () {
    var doc = {
      "foo": {
        "anArray": [
          { "prop": 44 },
          "second",
          "third"
        ],
        "another prop": {
          "baz": "A string"
        }
      }
    };
    var json = JSON.stringify(doc);
    var patch = [
      {"op": "remove", "path": "/foo/another prop/baz"},
      {"op": "add", "path": "/foo/new", "value": "hello"},
      {"op": "move", "path": "/foo/new", "to": "/newnew"},
      {"op": "copy", "path": "/foo/anArray/1", "to": "/foo/anArray/-"},
      {"op": "test", "path": "/foo/anArray/3", "value": "second"}
    ];
    var patched = jsonpatch.apply_patch(doc, patch);
    // Check that the doc has not been mutated
    expect(JSON.stringify(doc)).toEqual(json)
  });

  // describe('._operations', function () {
  // });

  describe('.apply()', function () {
    var patch;
    it('should call each operation in turn', function () {
      patch = new jsonpatch.JSONPatch([]);
      var callOrder = [];
      function mockOp(name) {
        return function(doc) {
          expect(doc).toEqual('TEST_DOC');
          callOrder.push(name);
          return doc;
        };
      }
      patch.compiledOps = [mockOp('one'),mockOp('two'),mockOp('three')];
      patch.apply('TEST_DOC');
      expect(callOrder[0]).toEqual('one');
      expect(callOrder[2]).toEqual('three');
    });
  });

  describe('Examples from the JSON Patch draft', function () {
    function deepEqual(a,b) {
      var key;
      if (typeof a !== typeof b) {
        return false;
      }
      if ('object' === typeof(a)) {
        for(key in a) {
          if (!(key in b && deepEqual(a[key], b[key]))) {
            return false;
          }
        }
        for(key in b) {
          if (!(key in a)) {
            return false;
          }
        }
        return true;
      } else {
        return a === b;
      }
    }

    var check = function (example) {
      var documentUnderTest = jsonpatch.apply_patch(example.doc, example.patch);
      var eq = deepEqual(
          documentUnderTest,
          example.result
        );
      if (!eq) {
        console.log('\n',documentUnderTest, '\n', example.result);
      }
      expect(eq).toEqual(true);
    };


    var examples = {
      
      'A.1.  Adding an Object Member': {
        doc: {
          "foo": "bar"
        },
        patch: [
          { "op": "add", "path": "/baz", "value": "qux" }
        ],
        result: {
          "baz": "qux",
          "foo": "bar"
       }
      },
      
      'A.2.  Adding an Array Element': {
        doc:{
          "foo": [ "bar", "baz" ]
        },
        patch: [
          { "op": "add", "path": "/foo/1", "value": "qux" }
        ],
        result: {
          "foo": [ "bar", "qux", "baz" ]
        }
      },
      
      'A.3.  Removing an Object Member': {
        doc: {
          "baz": "qux",
          "foo": "bar"
        },
        patch: [
          { "op": "remove", "path": "/baz" }
        ],
        result: {
          "foo": "bar"
        }
      },
      
      'A.4.  Removing an Array Element': {
        doc: {
          "foo": [ "bar", "qux", "baz" ]
        },
        patch: [
          { "op": "remove", "path": "/foo/1" }
        ],
        result: {
          "foo": [ "bar", "baz" ]
        }
      },
      
      'A.5.  Replacing a Value': {
        doc: {
          "baz": "qux",
          "foo": "bar"
        },
        patch: [
          { "op": "replace", "path": "/baz", "value": "boo" }
        ],
        result: {
          "baz": "boo",
          "foo": "bar"
        }
      },
      
      'A.6.  Moving a Value': {
        doc: {
          "foo": {
            "bar": "baz",
            "waldo": "fred"
          },
          "qux": {
            "corge": "grault"
          }
       },
       patch: [
          { "op": "move", "path": "/foo/waldo", "to": "/qux/thud" }
       ],
       result: {
          "foo": {
            "bar": "baz"
          },
          "qux": {
            "corge": "grault",
            "thud": "fred"
          }
        }
      },
      
      'A.7.  Moving an Array Element': {
        doc: {
          "foo": [ "all", "grass", "cows", "eat" ]
        },
        patch: [
          { "op": "move", "path": "/foo/1", "to": "/foo/3" }
        ],
        result: {
          "foo": [ "all", "cows", "eat", "grass" ]
        }
      },
      
      'A.8.  Testing a Value: Success': {
        doc: {
          "baz": "qux",
          "foo": [ "a", 2, "c" ]
        },
        patch: [
          { "op": "test", "path": "/baz", "value": "qux" },
          { "op": "test", "path": "/foo/1", "value": 2 }
        ],
        result: {
          "baz": "qux",
          "foo": [ "a", 2, "c" ]
        }
      },

      // See below for A.9 (it returns an error so has to handled
      // differently)
      
      'A.10.  Adding a nested Member Object': {
        doc: {
          "foo": "bar"
        },
        patch: [
          { "op": "add", "path": "/child", "value": { "grandchild": {} } }
        ],
        result: {
          "foo": "bar",
          "child": {
            "grandchild": {}
          }
        }
      },
      
      'A.10.   Ignoring Unrecognized Elements': {
        doc: {
          "foo": "bar"
        },
        patch: [
          { "op":"add", "path":"/baz", "value":"qux", "xyz":123 }
        ],
        result: {
          "foo":"bar",
          "baz":"qux"
        }
      },
      // See below for A.11 (it returns an error so has to be done in
      // a different way)
      
      // The spec is a little unclear about what the result of A.12
      // should be, but it is clear that it SHOULD NOT be interpreted
      // as an add operation.
      'A.12.   Invalid JSON Patch Document': {
        doc: {
          "baz": "hello"
        },
        patch: "[{ \"op\":\"add\", \"path\":\"/baz\", \"value\":\"qux\", \"op\":\"remove\" }]",
        result: {
        }
      },

      // Some extra examples not from the spec

      'Test value with lots of types': {
        doc: {
          "baz": "qux",
          "foo": [ "a", 2, "c" , true, [-1], {a:'b'}]
        },
        patch: [
          { "op": "test", "path": "", "value": {"baz": "qux", "foo": [ "a", 2, "c" , true, [-1], {a:'b'}]} }
        ],
        result: {
          "baz": "qux",
          "foo": [ "a", 2, "c" , true, [-1], {a:'b'}]
        }
      }
    };

    for (var name in examples) {
      (function (name) {
        it(name, function () { check(examples[name]); });
      })(name);
    }

    it('A.9.  Testing a Value: Error', function () {
      var doc = {
       "baz": "qux"
      };
      expect(function () {
        jsonpatch.apply_patch(doc, [{ "op": "test", "path": "/baz", "value": "bar" }]);
      }).toThrow(new jsonpatch.PatchApplyError("Test operation failed. Value did not match."));
    });

    it('A.12.  Adding to a Non-existant Target', function () {
      var doc = {
        "foo": "bar"
      };
      expect(function () {
        jsonpatch.apply_patch(doc, [{ "op": "add", "path": "/baz/bat", "value": "qux" }]);
      }).toThrow(new jsonpatch.InvalidPatch('Path not found in document'));
    });


  });

  describe('to attribute', function () {
    it('MUST NOT be part of the location specified by "path" in a move operation', function () {
      var doc = {a:{b:true, c:false}};
      expect(function () {
        jsonpatch.apply_patch(doc, [{op: 'move', path: '/a', to: '/a/b'}]);
      }).toThrow(new jsonpatch.InvalidPatch('destination must not be a child of source'));
    });
    it('MUST NOT be part of the location specified by "path" in a copy operation', function () {
      var doc = {a:{b:true, c:false}};
      expect(function () {
        jsonpatch.apply_patch(doc, [{op: 'copy', path: '/a', to: '/a/b'}]);
      }).toThrow(new jsonpatch.InvalidPatch('destination must not be a child of source'));
    });
    it('MUST ALLOW source to start with the destinations string as long as one is not actually a subset of the other', function () {
      var doc = {a:{b:true, c:false}};
      jsonpatch.apply_patch(doc, [{op: 'copy', path: '/a', to: '/ab'}]);
    });
  });

  describe('Regressions', function () {
    it('should reject unknown patch operations (even if they are properties of the base Object)', function () {
      expect(function () {
        new jsonpatch.JSONPatch([{op:'hasOwnProperty', path:'/'}]);
      }).toThrow(new jsonpatch.InvalidPatch('Invalid operation!'));
    });
  });

  describe('Atomicity', function () {
    it ('should not apply the patch if any of the operations fails, and the original object should be unaffected', function () {
      var doc = {
        "alpha": 1,
        "omega": "lots"
      };

      expect(function () {
        jsonpatch.apply_patch(doc, [
          {"op": "add", "path": "/delta", "value": 2},
          {"op": "replace", "path": "/beta///", "value": 2}
        ]);
      }).toThrow(new Error('Path not found in document'));


      expect(doc.beta).toEqual(undefined);
      //expect(doc.delta).toEqual(undefined);
    });
  });

});
