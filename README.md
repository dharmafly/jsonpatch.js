UPDATE: JSON Patch draft 4 has just been released which contains two new operations (move and test). This library will be updated to support them shortly.

JSONPatch
=========

An implementation of the [JSONPatch][#jsonpatch] (and [JSONPointer][#jsonpointer]) IETF drafts.

A [Dharmafly][#dharmafly] project written by [Thomas Parslow][#tom] <tom@almostobsolete.net> and released with the kind permission of [NetDev][#netdev].

Quick Example
-------------

```javascript
    mydoc = {
      "baz": "qux",
      "foo": "bar"
    };
    thepatch = [
      { "replace": "/baz", "value": "boo" }
    ]
    patcheddoc = jsonpatch.apply_patch(mydoc, thepatch);
    // patcheddoc now equals {"baz": "boo", "foo": "bar"}}
```    

See also: [API Docs][#apidocs]

Is it any good?
---------------

Yes, I hope so

Does it work in the browser?
----------------------------

Yes. The tests will run in the browser as well if you want to check.


Does it work with Node.JS?
--------------------------

Yes. Install with:

    npm install jsonpatch

Is it finished?
---------------

Probably. I do have some ideas for some extra bits but nothing that would break backwards compatibility. I'll probably bump the version up to 1.0.0 in a few weeks if no one spots any problems with the way it works now.

Are there tests?
----------------

Yes, there are tests. It also passes JSHint.

Is it documented?
----------------

Not enough yet, but see the [API Docs][#apidocs]

Origin of the project?
---------------------

[Dharmafly][#dharmafly] is currently working to create a collaboration web app for [NetDev][#netdev] that comprises a [Node.js][#nodejs] RESTful API on the back-end and an HTML5 [Backbone.js][#backbone] application on the front. The JSON Patch library was created as an essential part of the RESTful API, and has been subsequently open sourced for the community with NetDev's permission.

I've fixed/improved stuff
-------------------------

Great! Send me a pull request through GitHub <http://github.com/dharmafly/jsonpatch.js> or get in touch on Twitter @almostobsolete or email at tom@almostobsolete.net

[#tom]: http://www.almostobsolete.net
[#netdev]: http://www.netdev.co.uk
[#dharmafly]: http://dharmafly.com
[#nodejs]: http://nodejs.org
[#backbone]: http://documentcloud.github.com/backbone/
[#apidocs]:https://github.com/dharmafly/jsonpatch.js/blob/master/docs/api.md
[#jsonpatch]: http://tools.ietf.org/html/draft-pbryan-json-patch-01
[#jsonpointer]:http://tools.ietf.org/html/draft-pbryan-zyp-json-pointer-02