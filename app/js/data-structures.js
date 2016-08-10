// Object representing a position in the box.
// r is a number (int) representing the row
// c is a number (int) representing the col
function Point(r, c, pos) {
    this.row = r;
    this.col = c;
    this.pos = pos;
}

// Takes two Point objects.
function PointRange(p1, p2) {
    this.start = p1;
    this.end = p2;
    var colSpan = null;
    var rowSpan = null;
    this.getColSpan = function(getColFun) { 
        this.setColSpan(getColFun);
        return colSpan; 
    };
    this.setColSpan = function(getColFun) {
        // TODO: ensure getColFun is a function
        this.colSpan = getColFun(p2) - getColFun(p1);
    };
    this.getRowSpan = function(getRowFun) { 
        this.setRowSpan(getRowFun);
        return rowSpan; 
    };
    this.setRowSpan = function(getRowFun) {
        // TODO: ensure getColFun is a function
        this.rowSpan = getRowFun(p2) - getRowFun(p1);
    };
}
    
// Container for a string representing the canvas
function Image(currStr, position, r, c, spaces, hasBorders) {
    this.currStr = currStr;
    this.pos = position;
    this.ir = r;
    this.ic = c;
    this.sp = spaces;
    this.hb = hasBorders;
}

function Node(item, nextNode) {// TODO: put in model.js
    this.item = item;
    this.next = nextNode||null;
}

// TODO: test
// Stack that takes an element with a prev property, hopefully Images
function Stack() {
    this.top = null;
    this.pop = function() {
        var temp = this.top;
        if (temp) {
            this.top = temp.next;
        }
        return temp;
    };
    this.push = function(node) {
        if (node) {
            node.next = this.top;
            this.top = node;
        }
    };
    this.isEmpty = function() {
        return this.top == null || this.top.item == null;
    };
}

function Queue() {
    this.front = null;
    this.back = null;
    
    // takes an item (not a node) and enqueues it.
    this.enqueue = function(item) {
        if (!this.front)
            this.back = this.front = new Node(item);
        else {
            var newNode = new Node(item);
            this.back.next = newNode;
            this.back = newNode;
        }
    }
    
    // returns and dequeues the node (not item) in the front
    this.dequeue = function() {
        if (this.front) {
            var temp = this.front;
            this.front = this.front.next;
            if (!this.front)
                this.back = null;
            return temp;
        }
    }
    
    this.isEmpty = function() {
        return this.front === null;
    }
    
    this.toString = function() {
        var p = '[';
        var curr = this.front;
        while (curr != null) {
            p += curr.item + ', ';
            curr = curr.next;
        }
        return p + ']';
    }
}

// 
function Vector2D(x, y) { // TODO: put in model.js
    this.x = x;
    this.y = y;
    this.length = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    this.dotProduct = function(v) {
        if (v.dimension === this.dimension) 
            return this.x * v.x + this.y * v.y;
    };
    this.projectToUnit = function(v) {
        var scalar = this.dotProduct(v) / v.length();
        if (isNaN(scalar))
            scalar = 0;
        return new Vector2D(scalar * v.x, scalar * v.y);
    };
}

var sqrt2by2 = Math.sqrt(2)/2; // TODO: put in model.js
var unitVectors = { // TODO: put in model.js
    NW: new Vector2D(-sqrt2by2, sqrt2by2),
    N: new Vector2D(1, 0),
    NE: new Vector2D(sqrt2by2, sqrt2by2),
    E: new Vector2D(0, 1)
};