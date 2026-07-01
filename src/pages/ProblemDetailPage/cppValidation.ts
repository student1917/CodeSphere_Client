export const setupCppValidation = (editor: any, monaco: any) => {
  const model = editor.getModel();
  if (!model) return;

  const validateCpp = () => {
    const text = model.getValue();
    const lines = text.split('\n');
    const markers: any[] = [];

    // 1. Kiểm tra dấu ngoặc đơn, ngoặc nhọn, ngoặc vuông
    const bracketStack: Array<{ char: string; line: number; col: number }> = [];
    const bracketPairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
    const openBrackets = Object.keys(bracketPairs);
    const closeBrackets = Object.values(bracketPairs);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const trimmedLine = line.trim();

      // Bỏ qua dòng trống, comment, preprocessor directives
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) {
        continue;
      }

      // Kiểm tra dấu ngoặc trong dòng
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (openBrackets.includes(char)) {
          bracketStack.push({ char, line: lineNumber, col: j + 1 });
        } else if (closeBrackets.includes(char)) {
          if (bracketStack.length === 0) {
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: lineNumber,
              startColumn: j + 1,
              endLineNumber: lineNumber,
              endColumn: j + 2,
              message: `Unexpected '${char}'`,
              source: 'cpp-validator'
            });
          } else {
            const lastOpen = bracketStack.pop()!;
            if (bracketPairs[lastOpen.char] !== char) {
              markers.push({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: lastOpen.line,
                startColumn: lastOpen.col,
                endLineNumber: lastOpen.line,
                endColumn: lastOpen.col + 1,
                message: `Expected '${bracketPairs[lastOpen.char]}' but found '${char}'`,
                source: 'cpp-validator'
              });
            }
          }
        }
      }

      // 2. Phát hiện thiếu dấu chấm phẩy
      const hasVariableDecl = /^\s*(int|char|float|double|bool|string|auto|const|static|extern|volatile|register|long|short|unsigned|signed|void)\s+\w+/.test(line);
      const hasReturn = /^\s*return\s+/.test(line);
      const hasCout = /^\s*cout\s*<</.test(line);
      const hasPrintf = /^\s*printf\s*\(/.test(line);
      const hasCin = /^\s*cin\s*>>/.test(line);
      const hasFunctionCall = /^\s*\w+\s*\([^)]*\)\s*$/.test(line) && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{');
      const hasAssignment = /^\s*\w+\s*=\s*[^=]/.test(line) && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}');

      const needsSemicolon = hasVariableDecl || hasReturn || hasCout || hasPrintf || hasCin || hasFunctionCall || hasAssignment;

      if (needsSemicolon && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}') && !trimmedLine.endsWith(',')) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lineNumber,
          startColumn: line.length + 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
          message: "Expected ';' at end of statement",
          source: 'cpp-validator'
        });
      }

      // 3. Phát hiện thiếu dấu đóng ngoặc kép/đơn trong string
      const stringMatches = line.match(/["']/g);
      if (stringMatches) {
        let inString = false;
        let stringChar = '';
        for (let j = 0; j < line.length; j++) {
          if (line[j] === '"' || line[j] === "'") {
            if (!inString) {
              inString = true;
              stringChar = line[j];
            } else if (line[j] === stringChar && (j === 0 || line[j - 1] !== '\\')) {
              inString = false;
              stringChar = '';
            }
          }
        }
        if (inString) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber,
            startColumn: line.length,
            endLineNumber: lineNumber,
            endColumn: line.length + 1,
            message: `Unterminated string literal`,
            source: 'cpp-validator'
          });
        }
      }

      // 4. Phát hiện lỗi cú pháp cơ bản
      if (/^\s*(if|for|while|switch)\s+[^(]/.test(line) && !line.includes('(')) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: lineNumber,
          startColumn: trimmedLine.indexOf('if') !== -1 ? trimmedLine.indexOf('if') + 1 : trimmedLine.indexOf('for') !== -1 ? trimmedLine.indexOf('for') + 1 : trimmedLine.indexOf('while') + 1,
          endLineNumber: lineNumber,
          endColumn: line.length + 1,
          message: "Expected '(' after control statement",
          source: 'cpp-validator'
        });
      }

      // 5. Phát hiện thiếu dấu đóng ngoặc trong function call
      const functionCallMatch = line.match(/(\w+)\s*\(/g);
      if (functionCallMatch) {
        functionCallMatch.forEach((match: string) => {
          const openParenIndex = line.indexOf(match);
          let parenCount = 0;
          let foundClose = false;
          for (let j = openParenIndex; j < line.length; j++) {
            if (line[j] === '(') parenCount++;
            if (line[j] === ')') {
              parenCount--;
              if (parenCount === 0) {
                foundClose = true;
                break;
              }
            }
          }
          if (!foundClose && parenCount > 0) {
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: lineNumber,
              startColumn: line.length + 1,
              endLineNumber: lineNumber,
              endColumn: line.length + 1,
              message: `Missing closing ')' for function call`,
              source: 'cpp-validator'
            });
          }
        });
      }
    }

    // Kiểm tra dấu ngoặc chưa đóng
    bracketStack.forEach((bracket) => {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: bracket.line,
        startColumn: bracket.col,
        endLineNumber: bracket.line,
        endColumn: bracket.col + 1,
        message: `Missing closing '${bracketPairs[bracket.char]}'`,
        source: 'cpp-validator'
      });
    });

    // 6. Kiểm tra include thiếu <>
    const includePattern = /^\s*#include\s+[^<"]/;
    lines.forEach((line: string, index: number) => {
      if (includePattern.test(line) && !line.includes('<') && !line.includes('"')) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: index + 1,
          startColumn: line.indexOf('#include') + 9,
          endLineNumber: index + 1,
          endColumn: line.length + 1,
          message: "Expected '<>' or '\"\"' after #include",
          source: 'cpp-validator'
        });
      }
    });

    monaco.editor.setModelMarkers(model, 'cpp-validator', markers);
  };

  // Validate ngay lập tức
  validateCpp();

  // Validate khi code thay đổi (debounce)
  let timeoutId: any;
  model.onDidChangeContent(() => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      validateCpp();
    }, 300);
  });
};

