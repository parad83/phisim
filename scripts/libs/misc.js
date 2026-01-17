const INPUT_REGEX = "/^(?:[a-z]|+|-|*|:|^|(|))(?: (?:[a-z]|+|-|*|:|^||(|)))*$/";

const OPERATORS = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  //   "^": (a, b) => Math.pow(a, b),
  "/": (a, b) => a / b,
  "!unary": (a) => factorial(a),
  "-unary": (a) => -a,
};

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

// const OPERATORS_LIST = Object.keys(OPERATORS);
const OPERATORS_LIST = ["+", "-", "*", "/", "!", "(", ")"];

const PRECEDENCE = {
  "(": 0,
  ")": 0,
  "^": 1,
  "*": 2,
  ":": 2,
  "+": 3,
  "-": 3,
};

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
  return t.match(/^[A-Za-z]$/);
};

const isNumber = function (t) {
  return t.match(/\d+/);
};

const isOperator = function (t) {
  return OPERATORS_LIST.includes(t);
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

export {
  assert,
  printAllTests,
  operators_table,
  isVariable,
  isOperator,
  getFonts,
  isNumber,
  PRECEDENCE,
  OPERATORS,
  INPUT_REGEX,
};
