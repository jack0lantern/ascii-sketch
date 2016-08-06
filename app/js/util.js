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