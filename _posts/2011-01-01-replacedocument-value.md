---
category: reference
heading: 11. replace(document, value)
---



Takes a JSON document and removes the value pointed to. It is an error to attempt to remove a value that doesn't exist.

   * document - The document to operate against. May be mutated.
   * value - The value to replace at the position pointed to

Examples

    var doc = new JSONPointer("/obj/bar).replace({obj: {bar: "old"}}, "new");
    // doc now equals {obj: {old: "new"}}

Returns the updated doc (the value passed in may also have been mutated)