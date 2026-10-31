/**
 * Parser aritmético seguro para Room.
 * Soporta: +, -, *, /, % (módulo), ^ (potencia), √ (raíz cuadrada) y paréntesis ().
 * No usa eval(): parser recursivo descendente restringido a tokens numéricos y operadores.
 */

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '√') { tokens.push('√'); i++; continue; }
    if ('+-*/%^()'.includes(c)) { tokens.push(c); i++; continue; }
    if (/\d/.test(c) || c === '.') {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        num += expr[i++];
      }
      tokens.push(parseFloat(num));
      continue;
    }
    throw new Error('Carácter no válido: ' + c);
  }
  return tokens;
}

function evaluate(expr) {
  const tokens = tokenize(expr);
  let pos = 0;

  function peek() { return pos < tokens.length ? tokens[pos] : null; }
  function consume() { return tokens[pos++]; }

  function parseExpr() {
    let left = parseTerm();
    while (true) {
      const t = peek();
      if (t === '+' || t === '-') {
        consume();
        const right = parseTerm();
        left = t === '+' ? left + right : left - right;
      } else break;
    }
    return left;
  }

  function parseTerm() {
    let left = parseFactor();
    while (true) {
      const t = peek();
      if (t === '*' || t === '/' || t === '%') {
        consume();
        const right = parseFactor();
        if (t === '*') left = left * right;
        else if (t === '/') left = left / right;
        else left = left % right;
      } else break;
    }
    return left;
  }

  function parseFactor() {
    const t = peek();
    if (t === '√') {
      consume();
      return Math.sqrt(parseFactor());
    }
    return parsePower();
  }

  function parsePower() {
    let base = parseUnary();
    const t = peek();
    if (t === '^') {
      consume();
      return Math.pow(base, parsePower());
    }
    return base;
  }

  function parseUnary() {
    const t = peek();
    if (t === '+' || t === '-') {
      consume();
      return t === '+' ? parseUnary() : -parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const t = peek();
    if (t === '(') {
      consume();
      const val = parseExpr();
      if (peek() === ')') consume();
      else throw new Error('Paréntesis no cerrado');
      return val;
    }
    if (typeof t === 'number') {
      consume();
      return t;
    }
    throw new Error('Token inesperado: ' + t);
  }

  const result = parseExpr();
  if (peek() !== null) throw new Error('Tokens sobrantes');
  if (!Number.isFinite(result)) throw new Error('Resultado no válido');
  return result;
}

function formatResult(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(6).replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.$/, '');
}

export { evaluate, formatResult };
