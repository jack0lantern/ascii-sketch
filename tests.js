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
    assert.ok(testBox.getEllipseRanges(0, 0) === [[0, 0]], "Passed!" );
});