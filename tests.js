QUnit.test( "Box constructor", function( assert ) {
    assert.ok(new Box(), "Passed!" );
});

/* Box with id 'test' tests */
var testBox = new Box('test', 10, 20);

QUnit.test( "Box setPos", function( assert ) {
    assert.ok(testBox.setPos().pos === 0, "Passed!" );
});

QUnit.test( "Box getRow0", function( assert ) {
    assert.ok(testBox.getRow(3) === 0, "Passed!" );
});

QUnit.test( "Box getRow1", function( assert ) {
    assert.ok(testBox.getRow(21) === 1, "Passed!" );
});

QUnit.test( "Box getEllipseRanges0", function( assert ) {
    assert.ok(testBox.getEllipseRanges(new Point(0, 0, 0), new Point(0, 0, 0)).equals([[0, 0]]), "Passed!" );
});

var defaultBox = new Box('area', 20, 40)
// Steep line tests
// All of the true lines were generated from the original traceLinear
QUnit.test( "Box getLineRanges0 steep", function (assert) {
    var trueLine = 
[[0, 0], [41, 41], [83, 83], [124, 124], [165, 165], [207, 207], [248, 248], [289, 289], [331, 331], [372, 372], [413, 413], [454, 454], [496, 496], [537, 537], [578, 578], [620, 620], [661, 661], [702, 702], [744, 744], [785, 785]];
    var res = defaultBox.getLineRanges(new Point(0, 0, 0), new Point(defaultBox.getRow(785), defaultBox.getCol(785), 785));
    assert.ok(res.equals(trueLine), "Actual result: " + res);
})

QUnit.test( "Box getLineRanges1 steep", function (assert) {
    var trueLine = [[0, 0], [41, 41], [82, 82], [123, 123], [165, 165], [206, 206], [247, 247], [288, 288], [329, 329], [370, 370], [412, 412], [453, 453], [494, 494], [535, 535], [576, 576], [617, 617], [659, 659], [700, 700], [741, 741], [782, 782]];
    var res = defaultBox.getLineRanges(new Point(0, 0, 0), new Point(defaultBox.getRow(782), defaultBox.getCol(782), 782));    assert.ok(res.equals(trueLine), "Actual result: " + res);
})

QUnit.test( "Box getLineRanges2 steep negative max-col-1", function (assert) {
    var trueLine = [[39, 39], [80, 80], [120, 120], [161, 161], [201, 201], [242, 242], [282, 282], [323, 323], [363, 363], [404, 404], [444, 444], [485, 485], [525, 525], [566, 566], [606, 606], [647, 647], [687, 687], [728, 728], [768, 768], [809, 809]];
    var res = defaultBox.getLineRanges(new Point(defaultBox.getRow(39), defaultBox.getCol(39), 39), new Point(defaultBox.getRow(809), defaultBox.getCol(809), 809));
    assert.ok(res.equals(trueLine), "Actual result: " + res);
})

// Shallow line tests
QUnit.test( "Box getLineRanges3 shallow", function (assert) {
    var trueLine = [[0, 1], [43, 44], [86, 87], [129, 130], [172, 173], [215, 216], [258, 259], [301, 302], [344, 345], [387, 388], [430, 431], [473, 474], [516, 517], [559, 560], [602, 603], [645, 646], [688, 689], [731, 732], [774, 775], [817, 818]];
    var res = defaultBox.getLineRanges(new Point(defaultBox.getRow(0), defaultBox.getCol(0), 0), new Point(defaultBox.getRow(818), defaultBox.getCol(818), 818));
    assert.ok(res.equals(trueLine), "Actual result: " + res);
})

QUnit.test( "Box getLineRanges4 shallow negative", function (assert) {
    var trueLine = [[115, 116], [154, 155], [193, 194], [231, 233], [270, 271], [309, 310], [348, 349], [386, 388], [425, 426], [464, 465], [502, 504], [541, 542], [580, 581], [619, 620]];
    var res = defaultBox.getLineRanges(new Point(defaultBox.getRow(116), defaultBox.getCol(116), 116), new Point(defaultBox.getRow(619), defaultBox.getCol(619), 619));
    assert.ok(res.equals(trueLine), "Actual result: " + res);
})

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
