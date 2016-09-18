// Takes a new subject and imposes it on tgt, taking tgt's content where subject has a space.
function mergeOverSpace(subject, tgt) {
    if (subject && tgt && subject.length === tgt.length) {
        var i = 0;
        var result = '';
        while(i < subject.length) { // TODO: make more efficient with regex? Will be more complicated
            if (subject[i] === CHAR_SPACE)
                result += tgt[i];
            else
                result += subject[i];
            i++;
        }
        return result;
    }
    else
        return null;
}

// Takes a list, returns a reversed version of that list without modifying it
// (and this is because arguments are passed by value)
function reverseList(list) {
    var tempVal;
    for (var i = 0; i < Math.floor(list.length/2); i++) {
        tempVal = list[i];
        list[i] = list[list.length - 1 - i];
        list[list.length - 1 - i] = tempVal;
    }
    return list;
}

function inRange(value, a, b) {
    return (a <= value && value <= b) || (b <= value && value <= a);
}


// loop through ranges list, if it is within 1 outside of a range, absorb it, otherwise add new range
// return the changed range
// @param value: a number we are adding to the range
// @param ranges: the ranges array we are adding to
// NOTE: this is a HUUUGE bottle neck for certain functions like bucket. optimize it
function addToRanges(value, ranges) {// TODO: put in model.js
    var changedRange = null;
    assert(ranges, 'ranges is ' + ranges);
    for (var i = 0; i < ranges.length && !changedRange; i++) {
        // If number is one off previous and one off next, merge
        if (i < ranges.length - 1 && value - ranges[i][1] === 1 && ranges[i + 1][0] - value === 1) {
            ranges.splice(i, 2, [ranges[i][0], ranges[i + 1][1]]);
            changedRange = ranges[i];
        }
        else if (ranges[i][0] - value === 1) {
            ranges[i][0]--;
            changedRange = ranges[i];
        }
        else if (value - ranges[i][1] === 1) {
            ranges[i][1]++;
            changedRange = ranges[i];
        }
        else if (ranges[i][0] <= value && value <= ranges[i][1]) {
            changedRange = ranges[i];
        }
    }
    
    // If number is not within 1 of any existing ranges, add a new one in sorted order
    if (changedRange === null) {
        var insert = 0;
        if (ranges.length) {
            while(insert < ranges.length && value >= ranges[insert][0]) {
                insert++;
            }
        }
        ranges.splice(insert, 0, [value, value]);
        changedRange = ranges[insert];
    }
    return changedRange;
}
