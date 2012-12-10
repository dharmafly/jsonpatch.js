UPDATE: Another draft of JSONPatch is out (07) and there are breaking changes. We'll update soon!

NEW: Now suppots JSONPointer Draft 05 and JSONPatch Draft 06 (the latest as of 8/Nov/2012)

JSONPatch
=========

An implementation of the [JSONPatch][#jsonpatch] (and [JSONPointer][#jsonpointer]) IETF drafts.

A [Dharmafly][#dharmafly] project written by [Thomas Parslow][#tom] <tom@almostobsolete.net> and released with the kind permission of [NetDev][#netdev].

**For full documentation, see [jsonpatchjs.com][#site]**


Quick Example
-------------

```javascript
    mydoc = {
      "baz": "qux",
      "foo": "bar"
    };
    thepatch = [
      { "op": "replace", "path": "/baz", "value": "boo" }
    ]
    patcheddoc = jsonpatch.apply_patch(mydoc, thepatch);
    // patcheddoc now equals {"baz": "boo", "foo": "bar"}}
```

And that's all you need for basic use. For more see the [docs][#site].

Is it any good?
---------------

Yes, I hope so

Does it work in the browser?
----------------------------

Yes. The tests will run in the browser as well if you want to check. It's been tested in modern browsers and even in IE6!


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


Origin of the project
---------------------

[Dharmafly][#dharmafly] is currently working to create a collaboration web app for [NetDev][#netdev] that comprises a [Node.js][#nodejs] RESTful API on the back-end and an HTML5 [Backbone.js][#backbone] application on the front. The JSON Patch library was created as an essential part of the RESTful API, and has been subsequently open sourced for the community with NetDev's permission.

I've fixed/improved stuff
-------------------------

Great! Send me a pull request [through GitHub](http://github.com/dharmafly/jsonpatch.js) or get in touch on Twitter [@almostobsolete][#tom-twitter] or email at tom@almostobsolete.net

[#site]:http://jsonpatchjs.com
[#tom]: http://www.almostobsolete.net
[#tom-twitter]: https://twitter.com/almostobsolete
[#netdev]: http://www.netdev.co.uk
[#dharmafly]: http://dharmafly.com
[#nodejs]: http://nodejs.org
[#backbone]: http://documentcloud.github.com/backbone/
[#jsonpatch]: http://tools.ietf.org/html/draft-pbryan-json-patch-06
[#jsonpointer]:http://tools.ietf.org/html/draft-pbryan-zyp-json-pointer-05