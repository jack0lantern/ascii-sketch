QUnit.test( "Box constructor", function( assert ) {
    assert.ok(new Box(), "Passed!" );
});

QUnit.test( "Box setPos", function( assert ) {
    assert.ok((new Box('test')).setPos() === 0, "Passed!" );
});

QUnit.test( "Box getRow0", function( assert ) {
    var box = new Box('test', 10, 20);
    assert.ok(box.getRow(3) === 0, "Passed!" );
});

QUnit.test( "Box getRow1", function( assert ) {
    var box = new Box('test', 10, 20);
    assert.ok(box.getRow(21) === 1, "Passed!" );
});

