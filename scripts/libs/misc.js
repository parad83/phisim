const INPUT_REGEX =
  "/^(?:[a-z]|+|-|*|\/|^|(|))(?: (?:[a-z]|+|-|*|\/|^||(|)))*$/";

const OPERATORS = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  //   "^": (a, b) => Math.pow(a, b),
  "/": (a, b) => a / b,
  "!unary": (a) => factorial(a),
  "-unary": (a) => -a,
  "^": (a, b) => a ** b,
  "(": null,
  ")": null,
  cosunary: (a) => Math.cos(a),
  sinunary: (a) => Math.sin(a),
  tanunary: (a) => Math.tan(a),
  sqrtunary: (a) => Math.sqrt(a),
  lnunary: (a) => Math.log(a),
  absunary: (a) => Math.abs(a),
  expunary: (a) => Math.E ^ a,
};

const FUNCTIONS_SET = new Set([
  "cos",
  "sin",
  "tan",
  "ln",
  "abs",
  "sqrt",
  "exp",
]);

const factorial = (n) => {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
};

const operators_table = (op, arity) => {
  if (arity === 1) {
    return (a) => OPERATORS[`${op}unary`](a);
  }
  return (a, b) => OPERATORS[op](a, b);
};

export const glsl_mapping = (op, arity) => {
  if (arity === 1) {
    return (a) => GLSL_OPERATORS[`${op}unary`](toFloatOrString(a));
  }
  return (a, b) => GLSL_OPERATORS[op](toFloatOrString(a), toFloatOrString(b));
};

const GLSL_OPERATORS = {
  "+": (a, b) => `${a} + ${b}`,
  "-": (a, b) => `${a} - ${b}`,
  "*": (a, b) => `${a} * ${b}`,
  "^": (a, b) => `pow(${a}, ${b})`,
  "/": (a, b) => `${a} / ${b}`,
  "-unary": (a) => `-${a}`,
  "(": "(",
  ")": ")",
  cosunary: (a) => `cos(${a})`,
  sinunary: (a) => `sin(${a})`,
  tanunary: (a) => `tan(${a})`,
  sqrtunary: (a) => `sqrt(${a})`,
  lnunary: (a) => `log(${a})`,
  absunary: (a) => `abs(${a})`,
  expunary: (a) => `exp(${a})`,
};

const OPERATORS_SET = new Set(Object.keys(OPERATORS));

function getFont(token) {
  switch (token) {
    case "and":
      return "&#8743;";
    case "or":
      return "&#8744;";
    case "not":
      return "&#172;";
    case "xor":
      return "&#8853;";
    case "impl":
      return "&#8658;";
    default:
      return token;
  }
}

function getFonts(tokens) {
  var t = new Array(tokens.length);
  for (let i = 0; i < t.length; i++) {
    t[i] = getFont(tokens[i]);
  }
  return t.join(" ");
}

const isVariable = function (t) {
  if (!t) {
    return false;
  }
  return t.match(/^[A-Za-z]$/);
};

const isNumber = function (t) {
  if (!t) {
    return false;
  }
  return t.match(/\d+/);
};

const isOperator = function (t) {
  return OPERATORS_SET.has(t);
};

export const isFunction = function (t) {
  return FUNCTIONS_SET.has(t);
};

function assert(result, expected) {
  return arraysEqual(result, expected);
}

function printAllTests(test) {
  var c = 1;
  var p = 0;
  var np = 0;
  for (const t of Object.values(test)) {
    console.log("-----------------------");
    console.log(`TEST ${c}`);
    console.log("-----------------------");
    if (t()) {
      p += 1;
      console.log("PASSED");
    } else {
      np += 1;
      console.log("NOT PASSED");
      console.log(`${t} FAILED`);
    }
    console.log("-----------------------");
    c += 1;
  }
  console.log("-----------------------");
  console.log(`TOTAL PASSED ${p}`);
  console.log(`TOTAL NOT PASSED ${np}`);
  if (Object.keys(test).length == p) {
    console.log("ALL TESTS PASSED");
  }
}

function arraysEqual(a, b) {
  if (a == null || b == null) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function toFloatOrString(value) {
  return typeof value === "number" ? parseFloat(value) : value;
}

export {
  assert,
  printAllTests,
  operators_table,
  isVariable,
  isOperator,
  getFonts,
  isNumber,
  OPERATORS,
  INPUT_REGEX,
};
