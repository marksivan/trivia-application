/**
 * Min/Max heap implementations mirroring the Java backend logic.
 */
class HeapNode {
  constructor(question) {
    this.question = question;
    this.left = null;
    this.right = null;
  }
}

class MinHeap {
  constructor() {
    this.root = null;
    this.numItems = 0;
  }

  isEmpty() {
    return this.root === null;
  }

  push(question) {
    this.root = this._pushRecursive(this.root, question);
    this.numItems += 1;
  }

  _pushRecursive(node, question) {
    if (!node) {
      return new HeapNode(question);
    }

    if (question.difficulty < node.question.difficulty) {
      const temp = node.question;
      node.question = question;
      question = temp;
    }

    if (question.difficulty < node.question.difficulty) {
      node.left = this._pushRecursive(node.left, question);
    } else {
      node.right = this._pushRecursive(node.right, question);
    }

    return node;
  }

  pop() {
    if (this.isEmpty()) {
      throw new Error("Heap is empty");
    }

    const removed = this.root.question;
    this.root = this._popRecursive(this.root);
    this.numItems -= 1;
    return removed;
  }

  _popRecursive(node) {
    if (!node) {
      return null;
    }

    if (!node.left && !node.right) {
      return null;
    }

    const leftLevel = node.left ? node.left.question.difficulty : Infinity;
    const rightLevel = node.right ? node.right.question.difficulty : Infinity;

    if (node.left && leftLevel < rightLevel) {
      const temp = node.question;
      node.question = node.left.question;
      node.left.question = temp;
      node.left = this._popRecursive(node.left);
    } else if (node.right) {
      const temp = node.question;
      node.question = node.right.question;
      node.right.question = temp;
      node.right = this._popRecursive(node.right);
    }

    return node;
  }
}

class MaxHeap {
  constructor() {
    this.root = null;
    this.numItems = 0;
  }

  isEmpty() {
    return this.root === null;
  }

  push(question) {
    this.root = this._pushRecursive(this.root, question);
    this.numItems += 1;
  }

  _pushRecursive(node, question) {
    if (!node) {
      return new HeapNode(question);
    }

    if (question.difficulty > node.question.difficulty) {
      const temp = node.question;
      node.question = question;
      question = temp;
    }

    if (question.difficulty > node.question.difficulty) {
      node.left = this._pushRecursive(node.left, question);
    } else {
      node.right = this._pushRecursive(node.right, question);
    }

    return node;
  }

  pop() {
    if (this.isEmpty()) {
      throw new Error("Heap is empty");
    }

    const removed = this.root.question;
    this.root = this._popRecursive(this.root);
    this.numItems -= 1;
    return removed;
  }

  _popRecursive(node) {
    if (!node) {
      return null;
    }

    if (!node.left && !node.right) {
      return null;
    }

    const leftLevel = node.left ? node.left.question.difficulty : -Infinity;
    const rightLevel = node.right ? node.right.question.difficulty : -Infinity;

    if (node.left && leftLevel > rightLevel) {
      const temp = node.question;
      node.question = node.left.question;
      node.left.question = temp;
      node.left = this._popRecursive(node.left);
    } else if (node.right) {
      const temp = node.question;
      node.question = node.right.question;
      node.right.question = temp;
      node.right = this._popRecursive(node.right);
    }

    return node;
  }
}

window.MinHeap = MinHeap;
window.MaxHeap = MaxHeap;
