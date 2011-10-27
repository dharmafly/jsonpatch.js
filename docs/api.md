apply_patch(document, patch)
============================


A shortcut to apply a patch given as an Array or as a JSON String (see the [draft JSONPatch spec][#jsonpatch] for the patch format) to a document. May (and usually does)  mutate the given document.

   * document - The document to operate against. May be mutated.
   * patch - The patch document as a JS Array of operations or as a JSON String representing the same

Example:

    mydoc = {
      "baz": "qux",
      "foo": "bar"
    };
    thepatch = [
      { "replace": "/baz", "value": "boo" }
    ]
    patcheddoc = jsonpatch.apply_patch(mydoc, thepatch);
    // patcheddoc now equals {"baz": "boo", "foo": "bar"}}

[#jsonpatch]: http://tools.ietf.org/html/draft-pbryan-json-patch-01


JSONPatch class
=========

A JSONPatch object represents a compiled patch. The constructor takes a single argument giving the patch as an Array or as a String.

    mypatch = new JSONPatch([{ "replace": "/baz", "value": "boo" }]);

apply(document)
---------------

Applies the patch to the given document and returns the result. May also mutate the document!

    patched = mypatch.apply(mydoc);


JSONPointer class
===========

Represents a pointer into a Javascript object. The constructor takes a single string argument giving the pointer (see the [draft JSONPointer spec][#jsonpointer] for the pointer format).

    mypointer = new JSONPointer('/foo/baz/bar');

[#jsonpointer]:http://tools.ietf.org/html/draft-pbryan-zyp-json-pointer-02

add(document, value)
---

Takes a JSON document and a value and adds the value into
the doc at the position pointed to. If the position pointed to is
in an array then the existing element at that position (if any)
and all that follow it have there position incremented to make
room. It is an error to add to a parent object that doesn't exist
or to try to replace an existing value in an object.

  * document - The document to operate against. May be mutated.
  * value - The value to insert at the position pointed to

Example:

       var doc = new JSONPointer("/obj/new").add({obj: {old: o"}},"world");
       // doc now equals {obj: {old: "hello", new: "world"}}

Returns the updated doc (the value passed in may also have been mutated)

remove(document)
------

Takes a JSON document and removes the value pointed to.
It is an error to attempt to remove a value that doesn't exist.

   * document - The document to operate against. May be mutated.

Example:

      var doc = new JSONPointer("/obj/old").remove({obj: {old: "string"}});
      // doc now equals {obj: {}}

Returns the updated doc (the value passed in may also have been mutated)
  

replace(document, value)
-------

Takes a JSON document and removes the value pointed to. It is an error to attempt to remove a value that doesn't exist.

   * document - The document to operate against. May be mutated.
   * value - The value to replace at the position pointed to   

Examples

     var doc = new JSONPointer("/obj/bar).replace({obj: {bar: "old"}}, "new");
     // doc now equals {obj: {old: "new"}}

Returns the updated doc (the value passed in may also have been mutated)
  

get(document)
---

Returns the value pointed to by the pointer in the given doc.

   * document - The document to operate against. 

Examples

     var value = new JSONPointer("/obj/value").get({obj: {value: "hello"}});
     // value now equals 'hello'

Returns the value
    

InvalidPatch class
============

Error thrown when an invalid patch is passed in.

PatchApplyError class
===============

Error thrown when a patch can not be applied against a given document.