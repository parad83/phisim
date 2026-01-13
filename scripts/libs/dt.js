class Queue {
  constructor() {
    this.items = [];
  }
  enqueue(e) {
    return this.items.push(e);
  }
  dequeue() {
    return this.items.shift();
  }
  isEmpty() {
    return this.items.length <= 0;
  }
  flat() {
    return this.items;
  }
  copy() {
    const q = new Queue();
    q.items = [...this.items];
    return q;
  }
}

class Stack {
  constructor() {
    this.items = [];
  }
  push(e) {
    return this.items.push(e);
  }
  pop() {
    return this.items.pop();
  }
  isEmpty() {
    return this.items.length <= 0;
  }
  top() {
    return this.items.at(-1);
  }
  flat() {
    return this.items;
  }
}

export { Stack, Queue };
