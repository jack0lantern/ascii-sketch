QUnit.test( "Box constructor", function( assert ) {
    assert.ok(new Box(), "Passed!" );
});

/* Box with id 'test' tests */
var testBox = new Box('test', 10, 20);

QUnit.test( "Box setPos", function( assert ) {
    assert.ok(testBox.setPos() === 0, "Passed!" );
});

QUnit.test( "Box getRow0", function( assert ) {
    assert.ok(testBox.getRow(3) === 0, "Passed!" );
});

QUnit.test( "Box getRow1", function( assert ) {
    assert.ok(testBox.getRow(21) === 1, "Passed!" );
});

QUnit.test( "Box getEllipseRanges0", function( assert ) {
    assert.ok(testBox.getEllipseRanges(0, 0).equals([[0, 0]]), "Passed!" );
});

/* Things left to test:
 * shiftVert
 * shiftHoriz
 * trim
 * cut
 * copy
 * paste
 *
 */

// http://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});
