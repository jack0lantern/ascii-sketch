// Object representing a position in the box.
// r is a number (int) representing the row
// c is a number (int) representing the col
export class Point {
    row: number;
    col: number;
    pos: number;

    constructor(x: number, y: number, pos: number) {
        this.row = x;
        this.col = y;
        this.pos = pos;
    }
}

// Takes two Point objects.
export class PointRange {
    start: Point;
    end: Point;
    colSpan: number;
    rowSpan: number;
    
    constructor(p1: Point, p2: Point) {
        this.start = p1;
        this.end = p2;
    }

    getColSpan(getColFun: any) { 
        this.setColSpan(getColFun);
        return this.colSpan; 
    };
    
    setColSpan(getColFun: any) {
        // TODO: ensure getColFun is a function
        this.colSpan = getColFun(this.end) - getColFun(this.start);
    };
    
    getRowSpan = function(getRowFun: any) { 
        this.setRowSpan(getRowFun);
        return this.rowSpan; 
    };

    setRowSpan = function(getRowFun: any) {
        // TODO: ensure getColFun is a function
        this.rowSpan = getRowFun(this.end) - getRowFun(this.start);
    };
}
    
// Container for a string representing the canvas
export class Image {
    currStr: string;
    pos: number;
    ir: number;
    ic: number;
    sp: string;
    hb: boolean;
    constructor(currStr: string, position: number, r: number, c: number, spaces: string, hasBorders: boolean) {
        this.currStr = currStr;
        this.pos = position;
        this.ir = r;
        this.ic = c;
        this.sp = spaces;
        this.hb = hasBorders;
    }
}

class Node {// TODO: put in model.js
    item: any;
    next: Node;
    constructor(item: any, nextNode: Node = null) {
        this.item = item;
        this.next = nextNode;
    }
}

// TODO: test
// Stack that takes an element with a prev property, hopefully Images
export class Stack {
    top: any = null;

    pop() {
        var temp = this.top;
        if (temp) {
            this.top = temp.next;
        }
        return temp;
    }

    push(node: any) {
        if (node) {
            node.next = this.top;
            this.top = node;
        }
    }

    isEmpty() {
        return this.top == null || this.top.item == null;
    };
}

export class Queue {
    front: any = null;
    back: any = null;
    
    constructor() {

    }

    // takes an item (not a node) and enqueues it.
    enqueue(item: any) {
        if (!this.front)
            this.back = this.front = new Node(item);
        else {
            var newNode = new Node(item);
            this.back.next = newNode;
            this.back = newNode;
        }
    }
    
    // returns and dequeues the node (not item) in the front
    dequeue() {
        if (this.front) {
            var temp = this.front;
            this.front = this.front.next;
            if (!this.front)
                this.back = null;
            return temp;
        }
    }
    
    isEmpty() {
        return this.front === null;
    }
    
    toString() {
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
export class Vector2D { // TODO: put in model.js
    x: number;
    y: number;
    dimension: number = 2;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    dotProduct(v: Vector2D) {
        if (v.dimension === this.dimension) 
            return this.x * v.x + this.y * v.y;
    }
    
    // @param: uv is a given unit vector, one of unitVectors
    projectToUnit(uv: Vector2D) {
        var scalar = this.dotProduct(uv) / uv.length();
        if (isNaN(scalar))
            scalar = 0;
        return new Vector2D(scalar * uv.x, scalar * uv.y);
    }
}

export const sqrt2by2 = Math.sqrt(2)/2; // TODO: put in model.js
export const unitVectors = { // TODO: put in model.js
    NW: new Vector2D(-sqrt2by2, sqrt2by2),
    N: new Vector2D(1, 0),
    NE: new Vector2D(sqrt2by2, sqrt2by2),
    E: new Vector2D(0, 1)
};