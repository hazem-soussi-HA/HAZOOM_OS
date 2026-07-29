// HAZOOM BASIC — Tokenizer
// Converts BASIC source code into tokens for the parser

const TokenType = {
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  IDENTIFIER: 'IDENTIFIER',
  KEYWORD: 'KEYWORD',
  OPERATOR: 'OPERATOR',
  SYMBOL: 'SYMBOL',
  COLON: 'COLON',
  NEWLINE: 'NEWLINE',
  EOF: 'EOF',
  REM: 'REM',
};

const KEYWORDS = new Set([
  'PRINT', 'CLS', 'COLOR', 'PLOT', 'LINE', 'RECT', 'CIRCLE',
  'SPRITE', 'TILE', 'SCREEN', 'WAIT',
  'GOTO', 'GOSUB', 'RETURN', 'END', 'STOP',
  'IF', 'THEN', 'ELSE', 'ENDIF',
  'FOR', 'TO', 'STEP', 'NEXT',
  'LET', 'DIM', 'DATA', 'READ', 'RESTORE',
  'INPUT',
  'SOUND', 'MUSIC', 'PLAY',
  'SAVE', 'LOAD',
  'PLAYER', 'ENEMY', 'COLLIDE',
  'SCORE', 'LIVES', 'LEVEL',
  'AND', 'OR', 'NOT', 'MOD',
  'TRUE', 'FALSE',
  'SUB', 'ENDSUB', 'CALL',
  'FUNC', 'ENDFUNC',
  'POKE', 'PEEK',
]);
const OPERATORS = new Set(['+', '-', '*', '/', '\\', '^', '=', '<', '>', '<>', '<=', '>=']);

class Tokenizer {
  constructor(source) {
    this.source = source.toUpperCase();
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.tokens = [];
  }

  peek() { return this.pos < this.source.length ? this.source[this.pos] : '\0'; }
  advance() { const c = this.peek(); this.pos++; if (c === '\n') { this.line++; this.col = 1; } else { this.col++; } return c; }
  skipWhitespace() { while (this.pos < this.source.length && (this.peek() === ' ' || this.peek() === '\t')) this.advance(); }

  tokenize() {
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const c = this.peek();

      // Newline
      if (c === '\n' || c === '\r') {
        this.advance();
        if (c === '\r' && this.peek() === '\n') this.advance();
        this.tokens.push({ type: TokenType.NEWLINE, value: '\n', line: this.line, col: this.col });
        continue;
      }

      // Remark / Comment — check ' // and REM
      if (c === '\'') {
        this.advance();
        let comment = '';
        while (this.pos < this.source.length && this.peek() !== '\n' && this.peek() !== '\r') {
          comment += this.advance();
        }
        this.tokens.push({ type: TokenType.REM, value: comment.trim(), line: this.line, col: this.col });
        continue;
      }

      if (c === '/' && this.pos + 1 < this.source.length && this.source[this.pos + 1] === '/') {
        this.advance(); this.advance();
        let comment = '';
        while (this.pos < this.source.length && this.peek() !== '\n' && this.peek() !== '\r') {
          comment += this.advance();
        }
        this.tokens.push({ type: TokenType.REM, value: comment.trim(), line: this.line, col: this.col });
        continue;
      }

      if (c === 'R' && this.source.substr(this.pos, 3) === 'REM') {
        this.advance(); this.advance(); this.advance();
        let comment = '';
        while (this.pos < this.source.length && this.peek() !== '\n' && this.peek() !== '\r') {
          comment += this.advance();
        }
        this.tokens.push({ type: TokenType.REM, value: comment.trim(), line: this.line, col: this.col });
        continue;
      }

      // String literal
      if (c === '"') {
        this.advance();
        let str = '';
        while (this.pos < this.source.length && this.peek() !== '"' && this.peek() !== '\n') {
          str += this.advance();
        }
        if (this.peek() === '"') this.advance();
        this.tokens.push({ type: TokenType.STRING, value: str, line: this.line, col: this.col });
        continue;
      }

      // Number
      if (this._isDigit(c) || (c === '.' && this._isDigit(this.source[this.pos + 1]))) {
        let num = '';
        while (this.pos < this.source.length && (this._isDigit(this.peek()) || this.peek() === '.')) {
          num += this.advance();
        }
        this.tokens.push({ type: TokenType.NUMBER, value: parseFloat(num), line: this.line, col: this.col });
        continue;
      }

      // Line number (at start of line)
      if (this._isDigit(c) && this._isNewStatement()) {
        let num = '';
        while (this.pos < this.source.length && this._isDigit(this.peek())) {
          num += this.advance();
        }
        this.tokens.push({ type: TokenType.NUMBER, value: parseInt(num), line: this.line, col: this.col });
        continue;
      }

      // Two-char operators
      const twoChar = this.source.substr(this.pos, 2);
      if (twoChar === '<>' || twoChar === '<=' || twoChar === '>=') {
        this.advance(); this.advance();
        this.tokens.push({ type: TokenType.OPERATOR, value: twoChar, line: this.line, col: this.col });
        continue;
      }

      // Single-char operators
      if (OPERATORS.has(c)) {
        this.advance();
        this.tokens.push({ type: TokenType.OPERATOR, value: c, line: this.line, col: this.col });
        continue;
      }

      // Symbols
      if ('(),;:'.includes(c)) {
        this.advance();
        if (c === ':') {
          this.tokens.push({ type: TokenType.COLON, value: ':', line: this.line, col: this.col });
        } else {
          this.tokens.push({ type: TokenType.SYMBOL, value: c, line: this.line, col: this.col });
        }
        continue;
      }

      // Identifier / Keyword
      if (this._isAlpha(c)) {
        let id = '';
        while (this.pos < this.source.length && (this._isAlphaNum(this.peek()) || this.peek() === '$' || this.peek() === '%')) {
          id += this.advance();
        }
        if (KEYWORDS.has(id)) {
          // Some keywords can also be used as variable names (SCORE, LIVES, LEVEL)
          // when NOT followed by '(' — they're treated as identifiers in that case
          const softKeywords = new Set(['SCORE', 'LIVES', 'LEVEL']);
          if (softKeywords.has(id)) {
            let nextNonSpace = this.pos;
            while (nextNonSpace < this.source.length && (this.source[nextNonSpace] === ' ' || this.source[nextNonSpace] === '\t')) {
              nextNonSpace++;
            }
            if (nextNonSpace < this.source.length && this.source[nextNonSpace] === '(') {
              this.tokens.push({ type: TokenType.KEYWORD, value: id, line: this.line, col: this.col });
            } else {
              this.tokens.push({ type: TokenType.IDENTIFIER, value: id, line: this.line, col: this.col });
            }
          } else {
            this.tokens.push({ type: TokenType.KEYWORD, value: id, line: this.line, col: this.col });
          }
        } else {
          this.tokens.push({ type: TokenType.IDENTIFIER, value: id, line: this.line, col: this.col });
        }
        continue;
      }

      // Skip unknown
      this.advance();
    }

    this.tokens.push({ type: TokenType.EOF, value: '', line: this.line, col: this.col });
    return this.tokens;
  }

  _isDigit(c) { return c >= '0' && c <= '9'; }
  _isAlpha(c) { return (c >= 'A' && c <= 'Z') || c === '_'; }
  _isAlphaNum(c) { return this._isAlpha(c) || this._isDigit(c); }
  _isNewStatement() {
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const t = this.tokens[i];
      if (t.type === TokenType.NEWLINE) return true;
      if (t.type === TokenType.COLON) return false;
      if (t.type === TokenType.REM) continue;
      return false;
    }
    return true;
  }
}

if (typeof module !== 'undefined') module.exports = { Tokenizer, TokenType, KEYWORDS };
