// https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html

import { Queue, Stack } from "./ds.js";
import {
  isVariable,
  isOperator,
  isNumber,
  operators_table,
  isFunction,
} from "./misc.js";

function log(e) {
  if (typeof window === "undefined") {
    process.stdout.write(e);
  } else {
    console.log(e);
  }
}

class Token {
  constructor(c) {
    this.c = c;
  }

  static fromChar(c) {
    if (isVariable(c) || isNumber(c)) {
      return new Atom(c);
    }
    if (isOperator(c)) {
      return new Op(c);
    }
    throw new Error("unknown char " + c);
  }
}

class Op extends Token {}
class Atom extends Token {}
class Eof extends Token {
  constructor() {
    super(" ");
  }
}

class S {
  constructor(c) {
    this.c = c;
  }

  print() {}

  toArray() {
    return [this.c];
  }

  eval(vars) {}
}
class SAtom extends S {
  print() {
    log(this.c);
  }

  toArray() {
    return [this.c];
  }

  eval(vars) {
    if (isNumber(this.c)) {
      return parseFloat(this.c);
    }
    return vars[this.c];
  }

  toString() {
    return this.c;
  }
}
class SCons extends S {
  constructor(c, next) {
    super(c);
    this.next = next; // []
  }

  print() {
    log("(" + this.c);
    this.next.forEach((e) => {
      process.stdout.write(" ");
      e.print();
    });
    log(")");
  }

  toArray() {
    return [this.c, ...this.next.flatMap((e) => e.toArray())];
  }

  toString() {
    return (
      "(" + this.c + " " + this.next.map((e) => e.toString()).join(" ") + ")"
    );
  }

  eval(vars) {
    return operators_table(
      this.c,
      this.next.length,
    )(...this.next.map((e) => e.eval(vars)));
  }
}

class Lexer {
  constructor(text) {
    function evalNum(que) {
      //   console.log(que);
      if (que.isEmpty()) {
        return "";
      }
      if (!isNumber(q.peek())) {
        return "";
      }
      const a = q.dequeue();
      if (!isNumber(q.peek())) {
        return `${a}`;
      }
      return `${a}` + evalNum(que);
    }

    var arr = [];
    let fun_buff = "";
    function lexify(q) {
      if (q.isEmpty()) {
        return;
      }
      const a = q.dequeue();
      if (isOperator(a)) {
        arr.push(new Op(a));
        if ((a == ")") & (q.peek() == "(")) {
          arr.push(new Op("*"));
        }
      } else if (isVariable(a)) {
        fun_buff += a;
        if (q.isEmpty() || !isVariable(q.peek())) {
          if (isFunction(fun_buff)) {
            arr.push(new Op(fun_buff));
            fun_buff = "";
          } else {
            arr.push(new Atom(fun_buff));
          }
          fun_buff = "";
        }

        lexify(q);
      } else if (isNumber(a)) {
        // q.enqueue(a);
        const n = a + evalNum(q);
        arr.push(new Atom(n));
        if (isVariable(q.peek())) {
          arr.push(new Op("*"));
        }
      }
      lexify(q);
    }

    const q = Queue.fromArray(text);
    lexify(q);
    this.tokens = arr.reverse();
  }

  next() {
    if (this.tokens.length != 0) {
      return this.tokens.pop();
    }
    return new Eof();
  }

  peek() {
    if (this.tokens.length != 0) {
      return this.tokens.at(-1);
    }
    return new Eof();
  }
}

function expr(string) {
  var lexer = new Lexer(string);
  return expr_bp(lexer, 0);
}

function expr_bp(lexer, min_bp) {
  var lhs = lexer.next();

  if (lhs instanceof Atom) {
    lhs = new SAtom(lhs.c);
  } else if (lhs instanceof Op) {
    if (lhs.c === "(") {
      lhs = expr_bp(lexer, 0);
      const close = lexer.next();
      if (!(close instanceof Op && close.c === ")")) {
        throw new Error("expected ')'");
      }
    } else {
      var r_bp = prefix_binding_power(lhs.c);
      var rhs = expr_bp(lexer, r_bp);
      lhs = new SCons(lhs.c, [rhs]);
    }
  } else {
    log("bad token: ");
    throw new Error("bad token: " + lhs.c);
  }

  while (true) {
    var op = lexer.peek();

    if (op instanceof Eof) {
      break;
    } else if (op instanceof Op) {
      op = op.c;
    } else {
      log("bad token: " + op.c);
      throw new Error("bad token: " + lhs.toString());
    }

    const post = postfix_binding_power(op);
    if (post != null) {
      const l_bp = post;
      if (l_bp < min_bp) {
        break;
      }
      lexer.next();

      lhs = new SCons(op, [lhs]);
      continue;
    }

    const inf = infix_binding_power(op);
    if (inf != null) {
      var [l_bp, r_bp] = inf;
      if (l_bp < min_bp) {
        break;
      }

      lexer.next();
      const rhs = expr_bp(lexer, r_bp);

      lhs = new SCons(op, [lhs, rhs]);
      continue;
    }

    break;
  }
  //   console.log(lhs);
  return lhs;
}

function infix_binding_power(op) {
  switch (op) {
    case "+":
    case "-":
      return [1, 2];
    case "*":
    case "/":
      return [3, 4];
    case "^":
      return [6, 5];
    default:
      return null;
  }
}

function prefix_binding_power(op) {
  switch (op) {
    case "-":
    case "+":
      return 5;
    case "abs":
    case "cos":
    case "sin":
    case "ln":
    case "sqrt":
    case "tan":
    case "exp":
      return 7;
    default:
      throw new Error("bad op " + op);
  }
}

function postfix_binding_power(op) {
  switch (op) {
    // case "!":
    //   return 7;
    default:
      return null;
  }
}

// log(")");

// const s = expr("sqrt(abs(-25) + 11)");
// // expr("--1 * 2").print();
// console.log(s.toString());
// console.log(s.eval());
// console.log(s.eval(VARIABLES));
// console.log(s);
// traverse(s);

export { expr };
