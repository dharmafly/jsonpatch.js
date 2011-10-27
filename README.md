JSONPatch
=========

An implementation of the JSONPatch (and JSONPointer) IETF drafts.

A [Dharmafly][#dharmafly] project written by [Thomas Parslow][#tom] <tom@almostobsolete.net> and released with the kind permission of [NetDev][#netdev].

Quick Example
-------------

    doc = JSON.parse(sourceJSON);
    jsonpatch.apply_patch(mydoc, thepatch);
    destJSON = JSON.stringify(doc);

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

Are there tests?
----------------

Yes, there are tests. It also passes JSHint.

Is it documented?
----------------

Not enough yet, but see the [API Docs][#apidocs]

Origin of the Project
---------------------

[Dharmafly][#dharmafly] is currently working to create a collaboration web app for [NetDev][#netdev] that comprises a [Node.js][#nodejs] RESTful API on the back-end and an HTML5 [Backbone.js][#backbone] application on the front. The JSON Patch library was created as an essential part of the RESTful API, and has been subsequently open sourced for the community with NetDev's permission.

I've fixed/improved stuff
-------------------------

Great! Send me a pull request through GitHub <http://github.com/dharmafly/jsonpatch.js> or get in touch on Twitter @almostobsolete.net or email at tom@almostobsolete.net

[#tom]: http://www.almostobsolete.net
[#netdev]: http://www.netdev.co.uk
[#dharmafly]: http://dharmafly.com
[#nodejs]: http://nodejs.org
[#backbone]: http://documentcloud.github.com/backbone/
[#apidocs]:https://github.com/dharmafly/jsonpatch.js/blob/master/docs/api.md