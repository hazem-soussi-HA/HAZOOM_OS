// HAZOOM BASIC — Interpreter / Executor v2
// Runs parsed BASIC programs on the Virtual Hardware

class Interpreter {
  constructor(hardware) {
    this.hw = hardware;
    this.program = null;
    this.sortedLines = [];
    this.variables = {};
    this.arrays = {};
    this.dataPointer = 0;
    this.dataValues = [];
    this.gosubStack = [];
    this.forStack = [];
    this.subroutines = {};
    this.userFunctions = {};
    this.pc = 0;
    this.running = false;
    this.waitFrames = 0;
    this.outputCallback = null;
    this.inputCallback = null;
    this.printBuffer = [];
    this.speed = 0;
    this.lineCount = 0;
    this.done = false;
    this.error = null;
    this.frameInterval = null;
  }

  load(program) {
    this.program = program;
    this.sortedLines = Array.from(program.keys()).sort((a, b) => a - b);
    this.variables = {};
    this.arrays = {};
    this.dataPointer = 0;
    this.dataValues = [];
    this.gosubStack = [];
    this.forStack = [];
    this.pc = 0;
    this.running = false;
    this.waitFrames = 0;
    this.done = false;
    this.error = null;
    this.lineCount = 0;

    // Collect all DATA values
    for (const lineNum of this.sortedLines) {
      const stmts = program.get(lineNum);
      for (const stmt of stmts) {
        if (stmt.type === 'DATA') {
          this.dataValues.push(...stmt.values);
        }
      }
    }
  }

  setOutputCallback(cb) { this.outputCallback = cb; }
  setInputCallback(cb) { this.inputCallback = cb; }

  run() {
    if (!this.program || this.sortedLines.length === 0) return;
    this.running = true;
    this.done = false;
    this._executeLoop();
  }

  stop() {
    this.running = false;
    this.done = true;
    if (this.frameInterval) {
      cancelAnimationFrame(this.frameInterval);
      this.frameInterval = null;
    }
  }

  step() {
    if (!this.running || this.pc >= this.sortedLines.length) {
      this.done = true;
      return false;
    }
    this._executeLine(this.sortedLines[this.pc]);
    return !this.done;
  }

  _executeLoop() {
    if (!this.running) return;

    try {
      const linesPerFrame = 80;
      for (let i = 0; i < linesPerFrame && this.running && !this.done; i++) {
        if (this.waitFrames > 0) {
          this.waitFrames--;
          break;
        }
        if (this.pc >= this.sortedLines.length) {
          this.done = true;
          this.running = false;
          break;
        }
        this._executeLine(this.sortedLines[this.pc]);
      }
    } catch (e) {
      this.error = e.message;
      this.running = false;
      this.done = true;
      if (this.outputCallback) {
        this.outputCallback('\n*** RUNTIME ERROR: ' + e.message + ' ***\n');
      }
      return;
    }

    if (this.running && !this.done) {
      this.frameInterval = requestAnimationFrame(() => this._executeLoop());
    }
  }

  _executeLine(lineNum) {
    const stmts = this.program.get(lineNum);
    if (!stmts) { this.pc++; return; }

    const pcBefore = this.pc;
    for (const stmt of stmts) {
      if (!this.running) break;
      this._execStatement(stmt);
    }

    // Only advance PC if no control-flow statement (GOTO, GOSUB, RETURN, etc.) changed it
    if (this.running && this.pc === pcBefore) {
      this.pc++;
      this.lineCount++;
    }
  }

  _execStatement(stmt) {
    if (!stmt) return;
    switch (stmt.type) {
      case 'REM': return;
      case 'DATA': return;  // DATA is static, collected at load time
      case 'PRINT': this._execPrint(stmt); return;
      case 'CLS': this.hw.clearScreen(); return;
      case 'COLOR': this._execColor(stmt); return;
      case 'PLOT': this._execPlot(stmt); return;
      case 'LINE': this._execLine(stmt); return;
      case 'RECT': this._execRect(stmt); return;
      case 'CIRCLE': this._execCircle(stmt); return;
      case 'SPRITE': this._execSprite(stmt); return;
      case 'TILE': this._execTile(stmt); return;
      case 'SCREEN': this._execScreen(stmt); return;
      case 'WAIT': this._execWait(stmt); return;
      case 'GOTO': this._execGoto(stmt); return;
      case 'GOSUB': this._execGosub(stmt); return;
      case 'RETURN': this._execReturn(); return;
      case 'END': case 'STOP': this.running = false; this.done = true; return;
      case 'IF': this._execIf(stmt); return;
      case 'FOR': this._execFor(stmt); return;
      case 'NEXT': this._execNext(stmt); return;
      case 'LET': this._execLet(stmt); return;
      case 'ARRAY_SET': this._execArraySet(stmt); return;
      case 'DIM': this._execDim(stmt); return;
      case 'READ': this._execRead(stmt); return;
      case 'RESTORE': this.dataPointer = 0; return;
      case 'INPUT': this._execInput(stmt); return;
      case 'SOUND': this._execSound(stmt); return;
      case 'MUSIC': this._execMusic(stmt); return;
      case 'SAVE': this._execSave(stmt); return;
      case 'LOAD': this._execLoad(stmt); return;
      case 'PLAYER': this._execPlayer(stmt); return;
      case 'ENEMY': this._execEnemy(stmt); return;
      case 'POKE': this._execPoke(stmt); return;
      case 'SUB': this._execSub(stmt); return;
      case 'ENDSUB': this._execEndsub(); return;
      case 'CALL': this._execCall(stmt); return;
      case 'DEF': this._execDefFn(stmt); return;
      case 'LOCATE': this._execLocate(stmt); return;
      case 'PAUSE': this._execPause(stmt); return;
      default:
        throw new Error(`Unknown statement type: ${stmt.type}`);
    }
  }

  _execPrint(stmt) {
    let output = '';
    for (const arg of stmt.args) {
      if (arg.type === 'TAB') { output += '\t'; }
      else { output += String(this._evalExpr(arg)); }
    }
    this.printBuffer.push(output);
    if (this.outputCallback) {
      this.outputCallback(output + (stmt.trailingSemicolon ? '' : '\n'));
    }
  }

  _execColor(stmt) {
    const color = this._evalExpr(stmt.color) | 0;
    const bg = stmt.bg ? (this._evalExpr(stmt.bg) | 0) : null;
    this.hw.setColor(color, bg);
  }

  _execPlot(stmt) {
    this.hw.setPixel(this._evalExpr(stmt.x) | 0, this._evalExpr(stmt.y) | 0);
  }

  _execLine(stmt) {
    this.hw.drawLine(
      this._evalExpr(stmt.x1) | 0, this._evalExpr(stmt.y1) | 0,
      this._evalExpr(stmt.x2) | 0, this._evalExpr(stmt.y2) | 0
    );
  }

  _execRect(stmt) {
    this.hw.drawRect(
      this._evalExpr(stmt.x) | 0, this._evalExpr(stmt.y) | 0,
      this._evalExpr(stmt.w) | 0, this._evalExpr(stmt.h) | 0
    );
  }

  _execCircle(stmt) {
    this.hw.drawCircle(
      this._evalExpr(stmt.x) | 0, this._evalExpr(stmt.y) | 0,
      this._evalExpr(stmt.r) | 0
    );
  }

  _execSprite(stmt) {
    const n = this._evalExpr(stmt.n) | 0;
    const x = this._evalExpr(stmt.x) | 0;
    const y = this._evalExpr(stmt.y) | 0;
    const tile = stmt.tile !== undefined ? (this._evalExpr(stmt.tile) | 0) : undefined;
    const color = stmt.color !== undefined ? (this._evalExpr(stmt.color) | 0) : undefined;
    this.hw.setSprite(n, x, y, tile, color);
  }

  _execTile(stmt) {
    this.hw.setTile(
      this.hw.activeLayer,
      this._evalExpr(stmt.x) | 0,
      this._evalExpr(stmt.y) | 0,
      this._evalExpr(stmt.t) | 0
    );
  }

  _execScreen(stmt) {
    this.hw.activeLayer = this._evalExpr(stmt.layer) | 0;
  }

  _execWait(stmt) {
    this.waitFrames = this._evalExpr(stmt.frames) | 0;
  }

  _execGoto(stmt) {
    const idx = this.sortedLines.indexOf(stmt.line);
    if (idx >= 0) { this.pc = idx; }
    else { throw new Error(`Line ${stmt.line} not found`); }
  }

  _execGosub(stmt) {
    this.gosubStack.push(this.pc + 1);
    const idx = this.sortedLines.indexOf(stmt.line);
    if (idx >= 0) { this.pc = idx; }
    else { throw new Error(`Line ${stmt.line} not found (GOSUB)`); }
  }

  _execReturn() {
    if (this.gosubStack.length > 0) {
      this.pc = this.gosubStack.pop();
    } else {
      throw new Error('RETURN without GOSUB');
    }
  }

  _execIf(stmt) {
    const cond = this._evalExpr(stmt.condition);
    if (cond) {
      for (const s of stmt.thenBranch) this._execStatement(s);
    } else {
      for (const s of stmt.elseBranch) this._execStatement(s);
    }
  }

  _execFor(stmt) {
    const start = this._evalExpr(stmt.start);
    const end = this._evalExpr(stmt.end);
    const step = stmt.step ? this._evalExpr(stmt.step) : 1;
    this.variables[stmt.varName] = start;
    this.forStack.push({ varName: stmt.varName, end, step, lineIndex: this.pc });
    if ((step > 0 && start > end) || (step < 0 && start < end)) {
      this._skipToNext();
    }
  }

  _execNext(stmt) {
    if (this.forStack.length === 0) throw new Error('NEXT without FOR');
    const ctx = this.forStack[this.forStack.length - 1];
    if (stmt.varName && stmt.varName !== ctx.varName) {
      throw new Error(`NEXT ${stmt.varName} doesn't match FOR ${ctx.varName}`);
    }
    this.variables[ctx.varName] += ctx.step;
    const done = ctx.step > 0
      ? this.variables[ctx.varName] > ctx.end
      : this.variables[ctx.varName] < ctx.end;
    if (!done) {
      this.pc = ctx.lineIndex + 1;
    } else {
      this.forStack.pop();
    }
  }

  _skipToNext() {
    let depth = 1, idx = this.pc + 1;
    while (idx < this.sortedLines.length) {
      const stmts = this.program.get(this.sortedLines[idx]);
      for (const s of stmts) {
        if (s.type === 'FOR') depth++;
        if (s.type === 'NEXT') { depth--; if (depth === 0) { this.pc = idx + 1; this.forStack.pop(); return; } }
      }
      idx++;
    }
  }

  _execLet(stmt) {
    this.variables[stmt.varName] = this._evalExpr(stmt.value);
  }

  _execArraySet(stmt) {
    const arr = this.arrays[stmt.varName];
    if (!arr) {
      // Auto-create array if not DIM'd (size 10 by default, like GW-BASIC)
      this.arrays[stmt.varName] = new Array(11).fill(0);
    }
    const idx = Math.max(0, this._evalExpr(stmt.index) | 0);
    this.arrays[stmt.varName][idx] = this._evalExpr(stmt.value);
  }

  _execDim(stmt) {
    const size = Math.max(0, this._evalExpr(stmt.size) | 0);
    this.arrays[stmt.name] = new Array(size + 1).fill(0);
  }

  _execRead(stmt) {
    for (const varName of stmt.vars) {
      if (this.dataPointer >= this.dataValues.length) throw new Error('Out of DATA');
      this.variables[varName] = this.dataValues[this.dataPointer++];
    }
  }

  _execInput(stmt) {
    if (this.inputCallback) {
      const value = this.inputCallback(stmt.prompt || '? ');
      const num = parseFloat(value);
      this.variables[stmt.varName] = isNaN(num) ? (value || '') : num;
    }
  }

  _execSound(stmt) {
    this.hw.playSound(this._evalExpr(stmt.freq) | 0, this._evalExpr(stmt.dur) | 0);
  }

  _execMusic(stmt) {
    this.hw.playMusic(this._evalExpr(stmt.n) | 0);
  }

  _execSave(stmt) {
    const name = String(typeof stmt.name === 'string' ? stmt.name : this._evalExpr(stmt.name));
    this.hw.saveCartridge(name);
  }

  _execLoad(stmt) {
    const name = String(typeof stmt.name === 'string' ? stmt.name : this._evalExpr(stmt.name));
    this.hw.loadCartridge(name);
  }

  _execPlayer(stmt) {
    this.hw.setPlayer(this._evalExpr(stmt.x) | 0, this._evalExpr(stmt.y) | 0);
  }

  _execEnemy(stmt) {
    this.hw.setEnemy(this._evalExpr(stmt.n) | 0, this._evalExpr(stmt.x) | 0, this._evalExpr(stmt.y) | 0);
  }

  _execPoke(stmt) {
    this.hw.poke(this._evalExpr(stmt.addr) | 0, this._evalExpr(stmt.val) | 0);
  }

  _execSub(stmt) {
    this.subroutines[stmt.name] = { params: stmt.params, lineIndex: this.pc };
    let depth = 1, idx = this.pc + 1;
    while (idx < this.sortedLines.length) {
      for (const s of this.program.get(this.sortedLines[idx])) {
        if (s.type === 'SUB') depth++;
        if (s.type === 'ENDSUB') { depth--; if (depth === 0) { this.pc = idx; return; } }
      }
      idx++;
    }
  }

  _execEndsub() {
    if (this.gosubStack.length > 0) { this.pc = this.gosubStack.pop(); }
    else { this.pc++; }
  }

  _execCall(stmt) {
    const sub = this.subroutines[stmt.name];
    if (!sub) throw new Error(`SUB ${stmt.name} not defined`);
    const savedVars = {};
    for (let i = 0; i < sub.params.length; i++) {
      savedVars[sub.params[i]] = this.variables[sub.params[i]];
      this.variables[sub.params[i]] = this._evalExpr(stmt.args[i]);
    }
    this.gosubStack.push(this.pc + 1);
    this.pc = sub.lineIndex + 1;
  }

  _execDefFn(stmt) {
    // DEF FNX(X) = expression — store user function
    this.userFunctions[stmt.name] = { param: stmt.param, body: stmt.body };
    this.advance(); // consume DEF
  }

  _execLocate(stmt) {
    this.hw.cursorX = this._evalExpr(stmt.x) | 0;
    this.hw.cursorY = this._evalExpr(stmt.y) | 0;
  }

  _execPause(stmt) {
    const ms = this._evalExpr(stmt.ms) | 0;
    this.waitFrames = Math.ceil(ms / 16.67); // convert ms to frames (approx 60fps)
  }

  _evalExpr(expr) {
    if (!expr) return 0;
    switch (expr.type) {
      case 'NUMBER': return expr.value;
      case 'STRING': return expr.value;
      case 'VAR': return this.variables[expr.name] || 0;
      case 'ARRAY': {
        const arr = this.arrays[expr.name];
        const idx = this._evalExpr(expr.index) | 0;
        return arr ? (arr[idx] || 0) : 0;
      }
      case 'BINOP': return this._evalBinop(expr);
      case 'UNARY': return this._evalUnary(expr);
      case 'FUNC': return this._evalFunc(expr);
      default: return 0;
    }
  }

  _evalBinop(expr) {
    const l = this._evalExpr(expr.left);
    const r = this._evalExpr(expr.right);
    switch (expr.op) {
      case '+': return l + r;
      case '-': return l - r;
      case '*': return l * r;
      case '/': return r !== 0 ? l / r : 0;
      case '^': return Math.pow(l, r);
      case 'MOD': return r !== 0 ? ((l % r) + r) % r : 0;
      case '=': return l === r ? 1 : 0;
      case '<>': return l !== r ? 1 : 0;
      case '<': return l < r ? 1 : 0;
      case '>': return l > r ? 1 : 0;
      case '<=': return l <= r ? 1 : 0;
      case '>=': return l >= r ? 1 : 0;
      case 'AND': return (l && r) ? 1 : 0;
      case 'OR': return (l || r) ? 1 : 0;
      default: return 0;
    }
  }

  _evalUnary(expr) {
    const v = this._evalExpr(expr.expr);
    switch (expr.op) {
      case '-': return -v;
      case 'NOT': return v ? 0 : 1;
      default: return v;
    }
  }

  _evalFunc(expr) {
    const args = expr.args.map(a => this._evalExpr(a));
    const n = args[0] || 0;

    // Check user-defined functions first
    if (this.userFunctions[expr.name]) {
      const fn = this.userFunctions[expr.name];
      const saved = this.variables[fn.param];
      this.variables[fn.param] = n;
      const result = this._evalExpr(fn.body);
      this.variables[fn.param] = saved;
      return result;
    }

    switch (expr.name) {
      case 'RND': return Math.floor(Math.random() * Math.max(1, n + 1));
      case 'ABS': return Math.abs(n);
      case 'SIN': return Math.sin(n);
      case 'COS': return Math.cos(n);
      case 'TAN': return Math.tan(n);
      case 'SQR': return Math.sqrt(Math.abs(n));
      case 'INT': return Math.floor(n);
      case 'LEN': return String(n).length;
      case 'STR': return String(n);
      case 'VAL': return parseFloat(n) || 0;
      case 'CHR': return String.fromCharCode(n);
      case 'ASC': return String(n).charCodeAt(0);
      case 'PEEK': return this.hw.peek(n);
      case 'KEY': {
        if (typeof n === 'string') return this.hw.keys[n] ? 1 : 0;
        const keyNames = ['UP','DOWN','LEFT','RIGHT','SPACE','ENTER','ESC','A','B'];
        return this.hw.keys[keyNames[n] || ''] ? 1 : 0;
      }
      case 'BUTTON': return this.hw.buttonState;
      case 'SCORE': return this.hw.score;
      case 'LIVES': return this.hw.lives;
      case 'LEVEL': return this.hw.level;
      case 'TIMER': return this.hw.frameCount;
      case 'XPOS': return this.hw.playerX;
      case 'YPOS': return this.hw.playerY;
      case 'SGN': return n > 0 ? 1 : (n < 0 ? -1 : 0);
      case 'MAX': return args.length > 1 ? Math.max(n, args[1]) : n;
      case 'MIN': return args.length > 1 ? Math.min(n, args[1]) : n;
      default: return 0;
    }
  }
}

if (typeof module !== 'undefined') module.exports = { Interpreter };
