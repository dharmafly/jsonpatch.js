--- 
category: overview
heading: About jsonpatch.js
---

Example
-------

    mydoc = {
      "baz": "qux",
      "foo": "bar"
    };
    thepatch = [
      { "replace": "/baz", "value": "boo" }
    ]
    patcheddoc = jsonpatch.apply_patch(mydoc, thepatch);
    // patcheddoc now equals {"baz": "boo", "foo": "bar"}}


Where can jsonpatch.js be used?
-------------------------------

You can use JSONPatch either in the browser or as a Node.js dependency. The tests will run in both environments.

To install JSONPatch as a Node.js dependency:

    npm install jsonpatch


Testing jsonpatch.js
--------------------

There are Jasmine tests for JSONPatch in the [test folder](https://github.com/dharmafly/jsonpatch.js/tree/master/test).

It also passes [JSHint](http://www.jshint.com).


Fixes and improvements
----------------------

Send a [pull request through GitHub](http://github.com/dharmafly/jsonpatch.js) or get in touch on Twitter ([@almostobsolete](https://twitter.com/almostobsolete) / [@dharmafly](https://twitter.com/dharmafly)) or email at [tom@almostobsolete.net](mailto:tom@almostobsolete.net)


History
-------

[Dharmafly][df] is currently working to create a collaboration web app for [NetDev][netdev] that comprises a [Node.js][node] [RESTful][rest] API on the back-end and an [HTML5][html5] [Backbone.js][backbone] application on the front. The JSON Patch library was created as an essential part of the RESTful API, and has been subsequently open sourced for the community with NetDev's permission.

For further information about the API's architecture, see Tom's slides "[Hypermedia APIs and JavaScript Applications][hypermedia-slides]", presented at [Async in 2012][hypermedia-event].


[df]: http://dharmafly.com
[netdev]: http://www.netdev.co.uk
[node]: http://nodejs.org
[backbone]: http://documentcloud.github.com/backbone/
[html5]: https://en.wikipedia.org/wiki/HTML5
[rest]: https://en.wikipedia.org/wiki/Representational_state_transfer
[hypermedia-event]: http://asyncjs.com/hypermedia/
[hypermedia-slides]: http://almostobsolete.net/talks/hypermedia/
