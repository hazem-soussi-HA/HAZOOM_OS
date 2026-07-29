// HAZOOM BASIC — Parser
// Converts token stream into AST (Abstract Syntax Tree)
// Supports line-numbered BASIC with structured constructs

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.program = new Map();  // lineNumber -> AST node
    this.dataStatements = [];   // all DATA values in order
  }

  peek() { return this.pos < this.tokens.length ? this.tokens[this.pos] : { type: 'EOF', value: '' }; }
  advance() { return this.tokens[this.pos++]; }
  expect(type, value) {
    const t = this.peek();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`Line ${t.line}: Expected ${type}${value ? ' ' + value : ''}, got ${t.type} '${t.value}'`);
    }
    return this.advance();
  }

  parse() {
    let currentLineNum = null;
    let currentStatements = [];

    while (this.peek().type !== 'EOF') {
      const t = this.peek();

      // Skip newlines
      if (t.type === 'NEWLINE') { this.advance(); continue; }

      // Line number
      if (t.type === 'NUMBER' && this.isAtStatementStart()) {
        // Save previous line
        if (currentLineNum !== null) {
          this.program.set(currentLineNum, currentStatements);
        }
        currentLineNum = this.advance().value;
        currentStatements = [];
        continue;
      }

      // Remark — skip
      if (t.type === 'REM') {
        currentStatements.push({ type: 'REM', comment: this.advance().value });
        continue;
      }

      // Parse a statement
      const stmt = this.parseStatement();
      if (stmt) currentStatements.push(stmt);

      // Consume optional colon separator or newline
      if (this.peek().type === 'COLON') this.advance();
    }

    // Save last line
    if (currentLineNum !== null) {
      this.program.set(currentLineNum, currentStatements);
    }

    return this.program;
  }

  isAtStatementStart() {
    if (this.pos === 0) return true;
    const prev = this.tokens[this.pos - 1];
    return prev.type === 'NEWLINE' || prev.type === 'COLON';
  }

  parseStatement() {
    const t = this.peek();

    if (t.type === 'KEYWORD') {
      switch (t.value) {
        case 'PRINT':   return this.parsePrint();
        case 'CLS':     this.advance(); return { type: 'CLS' };
        case 'COLOR':   return this.parseColor();
        case 'PLOT':    return this.parsePlot();
        case 'LINE':    return this.parseLine();
        case 'RECT':    return this.parseRect();
        case 'CIRCLE':  return this.parseCircle();
        case 'SPRITE':  return this.parseSprite();
        case 'TILE':    return this.parseTile();
        case 'SCREEN':  return this.parseScreen();
        case 'WAIT':    return this.parseWait();
        case 'GOTO':    return this.parseGoto();
        case 'GOSUB':   return this.parseGosub();
        case 'RETURN':  this.advance(); return { type: 'RETURN' };
        case 'END':     this.advance(); return { type: 'END' };
        case 'STOP':    this.advance(); return { type: 'STOP' };
        case 'IF':      return this.parseIf();
        case 'FOR':     return this.parseFor();
        case 'NEXT':    return this.parseNext();
        case 'LET':     return this.parseLet();
        case 'DIM':     return this.parseDim();
        case 'DATA':    return this.parseData();
        case 'READ':    return this.parseRead();
        case 'RESTORE': this.advance(); return { type: 'RESTORE' };
        case 'INPUT':   return this.parseInput();
        case 'SOUND':   return this.parseSound();
        case 'MUSIC':   return this.parseMusic();
        case 'SAVE':    return this.parseSave();
        case 'LOAD':    return this.parseLoad();
        case 'PLAYER':  return this.parsePlayer();
        case 'ENEMY':   return this.parseEnemy();
        case 'COLLIDE': return this.parseCollide();
        case 'POKE':    return this.parsePoke();
        case 'SUB':     return this.parseSub();
        case 'ENDSUB':  this.advance(); return { type: 'ENDSUB' };
        case 'CALL':    return this.parseCall();
        default:
          // Could be assignment without LET: A = 10
          if (this.tokens[this.pos + 1] && this.tokens[this.pos + 1].type === 'OPERATOR' && this.tokens[this.pos + 1].value === '=') {
            return this.parseAssignment();
          }
          throw new Error(`Line ${t.line}: Unexpected keyword ${t.value}`);
      }
    }

    if (t.type === 'IDENTIFIER') {
      return this.parseAssignment();
    }

    if (t.type === 'COLON' || t.type === 'NEWLINE' || t.type === 'EOF') {
      return null;
    }

    throw new Error(`Line ${t.line}: Unexpected token ${t.type} '${t.value}'`);
  }

  // --- Statement Parsers ---

  parsePrint() {
    this.advance(); // PRINT
    const args = [];
    let trailingSemicolon = false;

    while (this.peek().type !== 'COLON' && this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF' && this.peek().type !== 'REM') {
      if (this.peek().type === 'SYMBOL' && this.peek().value === ';') {
        this.advance();
        trailingSemicolon = true;
        continue;
      }
      if (this.peek().type === 'SYMBOL' && this.peek().value === ',') {
        this.advance();
        args.push({ type: 'TAB' });
        continue;
      }
      trailingSemicolon = false;
      args.push(this.parseExpression());
    }

    return { type: 'PRINT', args, trailingSemicolon };
  }

  parseColor() {
    this.advance();
    const color = this.parseExpression();
    let bg = null;
    if (this.peek().type === 'SYMBOL' && this.peek().value === ',') {
      this.advance();
      bg = this.parseExpression();
    }
    return { type: 'COLOR', color, bg };
  }

  parsePlot() {
    this.advance();
    const x = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y = this.parseExpression();
    return { type: 'PLOT', x, y };
  }

  parseLine() {
    this.advance();
    const x1 = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y1 = this.parseExpression();
    this.expect('SYMBOL', ',');
    const x2 = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y2 = this.parseExpression();
    return { type: 'LINE', x1, y1, x2, y2 };
  }

  parseRect() {
    this.advance();
    const x = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y = this.parseExpression();
    this.expect('SYMBOL', ',');
    const w = this.parseExpression();
    this.expect('SYMBOL', ',');
    const h = this.parseExpression();
    return { type: 'RECT', x, y, w, h };
  }

  parseCircle() {
    this.advance();
    const x = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y = this.parseExpression();
    this.expect('SYMBOL', ',');
    const r = this.parseExpression();
    return { type: 'CIRCLE', x, y, r };
  }

  parseSprite() {
    this.advance();
    const n = this.parseExpression();
    this.expect('SYMBOL', ',');
    const x = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y = this.parseExpression();
    return { type: 'SPRITE', n, x, y };
  }

  parseTile() {
    this.advance();
    const x = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y = this.parseExpression();
    this.expect('SYMBOL', ',');
    const t = this.parseExpression();
    return { type: 'TILE', x, y, t };
  }

  parseScreen() {
    this.advance();
    const layer = this.parseExpression();
    return { type: 'SCREEN', layer };
  }

  parseWait() {
    this.advance();
    const frames = this.parseExpression();
    return { type: 'WAIT', frames };
  }

  parseGoto() {
    this.advance();
    const line = this.expect('NUMBER');
    return { type: 'GOTO', line: line.value };
  }

  parseGosub() {
    this.advance();
    const line = this.expect('NUMBER');
    return { type: 'GOSUB', line: line.value };
  }

  parseIf() {
    this.advance(); // IF
    const condition = this.parseExpression();
    this.expect('KEYWORD', 'THEN');
    const thenBranch = [];
    const elseBranch = [];

    // Single-line IF
    while (this.peek().type !== 'COLON' && this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF' && this.peek().type !== 'REM') {
      if (this.peek().type === 'KEYWORD' && this.peek().value === 'ELSE') {
        this.advance();
        while (this.peek().type !== 'COLON' && this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF') {
          const s = this.parseStatement();
          if (s) elseBranch.push(s);
        }
        break;
      }
      const s = this.parseStatement();
      if (s) thenBranch.push(s);
    }

    return { type: 'IF', condition, thenBranch, elseBranch };
  }

  parseFor() {
    this.advance(); // FOR
    const varName = this.expect('IDENTIFIER').value;
    this.expect('OPERATOR', '=');
    const start = this.parseExpression();
    this.expect('KEYWORD', 'TO');
    const end = this.parseExpression();
    let step = null;
    if (this.peek().type === 'KEYWORD' && this.peek().value === 'STEP') {
      this.advance();
      step = this.parseExpression();
    }
    return { type: 'FOR', varName, start, end, step };
  }

  parseNext() {
    this.advance();
    let varName = null;
    if (this.peek().type === 'IDENTIFIER') {
      varName = this.advance().value;
    }
    return { type: 'NEXT', varName };
  }

  parseLet() {
    this.advance(); // LET
    return this.parseAssignment();
  }

  parseAssignment() {
    const varName = this.expect('IDENTIFIER').value;
    // Check for array assignment: A(index) = value
    if (this.peek().type === 'SYMBOL' && this.peek().value === '(') {
      this.advance(); // consume (
      const index = this.parseExpression();
      this.expect('SYMBOL', ')');
      this.expect('OPERATOR', '=');
      const value = this.parseExpression();
      return { type: 'ARRAY_SET', varName, index, value };
    }
    this.expect('OPERATOR', '=');
    const value = this.parseExpression();
    return { type: 'LET', varName, value };
  }

  parseDim() {
    this.advance();
    const name = this.expect('IDENTIFIER').value;
    this.expect('SYMBOL', '(');
    const size = this.parseExpression();
    this.expect('SYMBOL', ')');
    return { type: 'DIM', name, size };
  }

  parseData() {
    this.advance();
    const values = [];
    while (this.peek().type !== 'COLON' && this.peek().type !== 'NEWLINE' && this.peek().type !== 'EOF' && this.peek().type !== 'REM') {
      if (this.peek().type === 'NUMBER') {
        values.push(this.advance().value);
      } else if (this.peek().type === 'STRING') {
        values.push(this.advance().value);
      } else {
        break;
      }
      if (this.peek().type === 'SYMBOL' && this.peek().value === ',') {
        this.advance();
      } else {
        break;
      }
    }
    return { type: 'DATA', values };
  }

  parseRead() {
    this.advance();
    const vars = [];
    do {
      vars.push(this.expect('IDENTIFIER').value);
      if (this.peek().type === 'SYMBOL' && this.peek().value === ',') {
        this.advance();
      } else {
        break;
      }
    } while (true);
    return { type: 'READ', vars };
  }

  parseInput() {
    this.advance();
    let prompt = '';
    if (this.peek().type === 'STRING') {
      prompt = this.advance().value;
      this.expect('SYMBOL', ';');
    }
    const varName = this.expect('IDENTIFIER').value;
    return { type: 'INPUT', prompt, varName };
  }

  parseSound() {
    this.advance();
    const freq = this.parseExpression();
    this.expect('SYMBOL', ',');
    const dur = this.parseExpression();
    return { type: 'SOUND', freq, dur };
  }

  parseMusic() {
    this.advance();
    const n = this.parseExpression();
    return { type: 'MUSIC', n };
  }

  parseSave() {
    this.advance();
    const name = this.parseExpression();
    return { type: 'SAVE', name };
  }

  parseLoad() {
    this.advance();
    const name = this.parseExpression();
    return { type: 'LOAD', name };
  }

  parsePlayer() {
    this.advance();
    const x = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y = this.parseExpression();
    return { type: 'PLAYER', x, y };
  }

  parseEnemy() {
    this.advance();
    const n = this.parseExpression();
    this.expect('SYMBOL', ',');
    const x = this.parseExpression();
    this.expect('SYMBOL', ',');
    const y = this.parseExpression();
    return { type: 'ENEMY', n, x, y };
  }

  parseCollide() {
    this.advance();
    const a = this.parseExpression();
    this.expect('SYMBOL', ',');
    const b = this.parseExpression();
    return { type: 'COLLIDE', a, b };
  }

  parsePoke() {
    this.advance();
    const addr = this.parseExpression();
    this.expect('SYMBOL', ',');
    const val = this.parseExpression();
    return { type: 'POKE', addr, val };
  }

  parseSub() {
    this.advance();
    const name = this.expect('IDENTIFIER').value;
    const params = [];
    if (this.peek().type === 'SYMBOL' && this.peek().value === '(') {
      this.advance();
      while (this.peek().type !== 'SYMBOL' || this.peek().value !== ')') {
        params.push(this.expect('IDENTIFIER').value);
        if (this.peek().type === 'SYMBOL' && this.peek().value === ',') this.advance();
      }
      this.expect('SYMBOL', ')');
    }
    return { type: 'SUB', name, params };
  }

  parseCall() {
    this.advance();
    const name = this.expect('IDENTIFIER').value;
    const args = [];
    if (this.peek().type === 'SYMBOL' && this.peek().value === '(') {
      this.advance();
      while (this.peek().type !== 'SYMBOL' || this.peek().value !== ')') {
        args.push(this.parseExpression());
        if (this.peek().type === 'SYMBOL' && this.peek().value === ',') this.advance();
      }
      this.expect('SYMBOL', ')');
    }
    return { type: 'CALL', name, args };
  }

  // --- Expression Parser (Precedence Climbing) ---

  parseExpression() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.peek().type === 'KEYWORD' && this.peek().value === 'OR') {
      this.advance();
      const right = this.parseAnd();
      left = { type: 'BINOP', op: 'OR', left, right };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseNot();
    while (this.peek().type === 'KEYWORD' && this.peek().value === 'AND') {
      this.advance();
      const right = this.parseNot();
      left = { type: 'BINOP', op: 'AND', left, right };
    }
    return left;
  }

  parseNot() {
    if (this.peek().type === 'KEYWORD' && this.peek().value === 'NOT') {
      this.advance();
      const expr = this.parseComparison();
      return { type: 'UNARY', op: 'NOT', expr };
    }
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseAddition();
    const t = this.peek();
    if (t.type === 'OPERATOR' && ['=', '<', '>', '<>', '<=', '>='].includes(t.value)) {
      const op = this.advance().value;
      const right = this.parseAddition();
      return { type: 'BINOP', op, left, right };
    }
    return left;
  }

  parseAddition() {
    let left = this.parseMultiplication();
    while (this.peek().type === 'OPERATOR' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.advance().value;
      const right = this.parseMultiplication();
      left = { type: 'BINOP', op, left, right };
    }
    return left;
  }

  parseMultiplication() {
    let left = this.parsePower();
    while ((this.peek().type === 'OPERATOR' && (this.peek().value === '*' || this.peek().value === '/')) ||
           (this.peek().type === 'KEYWORD' && this.peek().value === 'MOD')) {
      const op = this.advance().value;
      const right = this.parsePower();
      left = { type: 'BINOP', op, left, right };
    }
    return left;
  }

  parsePower() {
    let left = this.parseUnary();
    if (this.peek().type === 'OPERATOR' && this.peek().value === '^') {
      this.advance();
      const right = this.parsePower(); // right-associative
      return { type: 'BINOP', op: '^', left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.peek().type === 'OPERATOR' && this.peek().value === '-') {
      this.advance();
      const expr = this.parsePrimary();
      return { type: 'UNARY', op: '-', expr };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.peek();

    // Number literal
    if (t.type === 'NUMBER') {
      this.advance();
      return { type: 'NUMBER', value: t.value };
    }

    // String literal
    if (t.type === 'STRING') {
      this.advance();
      return { type: 'STRING', value: t.value };
    }

    // Built-in functions (some are keywords like PEEK, some are identifiers like RND)
    const builtinFuncs = new Set(['RND','ABS','SIN','COS','TAN','SQR','INT','LEN','STR','VAL','CHR','ASC','KEY','BUTTON','PEEK','SCORE','LIVES','LEVEL','TIMER','XPOS','YPOS','SGN','MAX','MIN']);
    if ((t.type === 'IDENTIFIER' || t.type === 'KEYWORD') && builtinFuncs.has(t.value)) {
      const name = t.value;
      this.advance();
      if (this.peek().type === 'SYMBOL' && this.peek().value === '(') {
        this.advance();
        const args = [];
        while (this.peek().type !== 'SYMBOL' || this.peek().value !== ')') {
          args.push(this.parseExpression());
          if (this.peek().type === 'SYMBOL' && this.peek().value === ',') this.advance();
        }
        this.expect('SYMBOL', ')');
        return { type: 'FUNC', name, args };
      }
      return { type: 'FUNC', name, args: [] };
    }

    // Variable (identifier that's not a built-in function)
    if (t.type === 'IDENTIFIER') {
      const name = t.value;
      this.advance();
      if (this.peek().type === 'SYMBOL' && this.peek().value === '(') {
        // Array access
        this.advance();
        const index = this.parseExpression();
        this.expect('SYMBOL', ')');
        return { type: 'ARRAY', name, index };
      }
      return { type: 'VAR', name };
    }

    // Parenthesized expression
    if (t.type === 'SYMBOL' && t.value === '(') {
      this.advance();
      const expr = this.parseExpression();
      this.expect('SYMBOL', ')');
      return expr;
    }

    throw new Error(`Line ${t.line}: Unexpected token in expression: ${t.type} '${t.value}'`);
  }
}

if (typeof module !== 'undefined') module.exports = { Parser };
