// https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html

import { Queue, Stack } from "./dt.js";
import {
  isLeftAssoc,
  isVariable,
  isFun,
  isOperator,
  PRECEDENCE,
  isNumber,
} from "./misc.js";

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
}
class SAtom extends S {
  print() {
    process.stdout.write(this.c);
  }
}
class SCons extends S {
  constructor(c, next) {
    super(c);
    this.next = next; // []
  }

  print() {
    process.stdout.write("(" + this.c);
    this.next.forEach((e) => {
      process.stdout.write(" ");
      e.print();
    });
    process.stdout.write(")");
  }
}

class Lexer {
  constructor(text) {
    this.tokens = text
      .split("")
      .filter((c) => c != " ")
      .flatMap((c) => Token.fromChar(c))
      .reverse();
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
    process.stdout.write("bad token: ");
    lhs.print();
    process.stdout.write("\n");
    return;
  }

  while (true) {
    var op = lexer.peek();

    if (op instanceof Eof) {
      break;
    } else if (op instanceof Op) {
      op = op.c;
    } else {
      process.stdout.write("bad token: " + op.c);
      return;
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
    default:
      return null;
  }
}

function prefix_binding_power(op) {
  switch (op) {
    case "-":
    case "+":
      return 5;
    default:
      throw new Error("bad op " + op);
  }
}

function postfix_binding_power(op) {
  switch (op) {
    case "!":
      return 7;
    default:
      return null;
  }
}

// process.stdout.write(")");

// const s = expr("--1 * 2");
// console.log(s);
// s.print();

export { expr };
