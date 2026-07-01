import CodeBlockRenderer from './CodeBlockRenderer';

interface CommentContentProps {
  content: string;
  enableAutoDetect?: boolean; // 🔥 bật/tắt auto detect
}

// Detect ```code block```
const CODE_BLOCK_REGEX = /```([^\n`]+)?\r?\n([\s\S]*?)```/g;

// Detect inline code `...`
const INLINE_CODE_REGEX = /`([^`]+)`/g;

// 🔥 Detect có phải code không (chỉ dùng cho comment)
const isLikelyCode = (text: string) => {
  const trimmed = text.trim();

  // nhiều dòng + có dấu hiệu code
  if (trimmed.split('\n').length > 1 && /(;|\{|\}|=>)/.test(trimmed)) return true;

  // keyword code
  if (/\b(function|const|let|var|#include|def)\b/.test(trimmed)) return true;

  return false;
};

// 🔥 Detect language
const detectLanguage = (text: string) => {
  if (/#include\s*<|using\s+namespace\s+std|std::|cout\s*<</i.test(text)) return 'cpp';
  if (/\bimport\s+java\.|\bpublic\s+class\b|\bpublic\s+static\s+void\s+main\b|\bSystem\.out\.print/i.test(text)) return 'java';
  if (/SELECT|INSERT|UPDATE|DELETE/i.test(text)) return 'sql';
  if (/def |print\(/i.test(text)) return 'python';
  if (/console\.log|const|let|=>/i.test(text)) return 'javascript';
  return 'text';
};

const normalizeLanguage = (raw?: string) => {
  const lang = (raw || '').trim().toLowerCase();
  if (!lang) return 'text';
  if (lang === 'c++' || lang === 'cxx' || lang === 'cc') return 'cpp';
  if (lang === 'jav') return 'java';
  if (lang === 'js') return 'javascript';
  if (lang === 'py') return 'python';
  return lang;
};

// 🔥 check inline code (fix bug regex /g)
const hasInlineCode = (text: string) => {
  return /`([^`]+)`/.test(text);
};

const isCodeLine = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return false;

  return /(;|\{|\}|=>|#include|using\s+namespace|std::|cout\s*<<|cin\s*>>|\b(def|class|function|const|let|var|public|private|protected|static|void|int|long|double|float|String|Scanner|return|if|else|for|while|try|catch)\b|^\s*\/\*|^\s*\*|^\s*\/\/|^\s*#)/i.test(trimmed);
};

const splitMixedAutoDetectedParts = (text: string): Array<{ type: 'text' | 'code'; value: string }> | null => {
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines.length < 2) return null;

  const parts: Array<{ type: 'text' | 'code'; value: string }> = [];
  let currentType: 'text' | 'code' | null = null;
  let buffer: string[] = [];

  const pushBuffer = () => {
    if (!currentType || buffer.length === 0) return;
    parts.push({ type: currentType, value: buffer.join('\n').trimEnd() });
    buffer = [];
  };

  lines.forEach((line) => {
    const nextType: 'text' | 'code' = isCodeLine(line) ? 'code' : 'text';

    if (currentType === null) {
      currentType = nextType;
      buffer.push(line);
      return;
    }

    if (nextType !== currentType && line.trim() !== '') {
      pushBuffer();
      currentType = nextType;
    }

    buffer.push(line);
  });

  pushBuffer();

  const hasCode = parts.some((p) => p.type === 'code' && p.value.trim() !== '');
  const hasText = parts.some((p) => p.type === 'text' && p.value.trim() !== '');

  if (!hasCode) return null;
  if (parts.length === 1 && !hasText) return parts;
  return parts;
};

const CommentContentRenderer = ({
  content,
  enableAutoDetect = false, // 🔥 mặc định TẮT (cho post)
}: CommentContentProps) => {
  const safeContent = typeof content === 'string' ? content : '';
  const parts: Array<{ type: 'text' | 'code'; value?: string; language?: string }> = [];

  let lastIndex = 0;
  let match;

  CODE_BLOCK_REGEX.lastIndex = 0;

  // 🔹 Tách code block ```
  while ((match = CODE_BLOCK_REGEX.exec(safeContent)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: safeContent.substring(lastIndex, match.index),
      });
    }

    const [, rawLanguage, code] = match;
    parts.push({
      type: 'code',
      language: normalizeLanguage(rawLanguage),
      value: code.trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  // 🔹 Text còn lại
  if (lastIndex < safeContent.length) {
    parts.push({
      type: 'text',
      value: safeContent.substring(lastIndex),
    });
  }

  if (parts.length === 0) {
    parts.push({
      type: 'text',
      value: safeContent,
    });
  }

  // 🔹 Render inline code
  const renderTextPart = (text: string) => {
    const textParts = text.split(INLINE_CODE_REGEX);

    return (
      <>
        {textParts.map((part, idx) => {
          if (idx % 2 === 1) {
            return (
              <code
                key={idx}
                className="bg-gray-200 text-red-600 px-1.5 py-0.5 rounded font-mono text-sm"
              >
                {part}
              </code>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="text-gray-700 break-words leading-relaxed">
      {parts.map((part, idx) => {
        // ✅ Code block từ ```
        if (part.type === 'code') {
          return (
            <CodeBlockRenderer
              key={idx}
              code={part.value || ''}
              language={part.language || 'text'}
            />
          );
        }

        const text = part.value || '';

        const mixedParts = enableAutoDetect && !hasInlineCode(text)
          ? splitMixedAutoDetectedParts(text)
          : null;

        if (mixedParts) {
          return (
            <div key={idx}>
              {mixedParts.map((mixedPart, mixedIdx) => {
                if (!mixedPart.value.trim()) return null;

                if (mixedPart.type === 'code') {
                  return (
                    <CodeBlockRenderer
                      key={`${idx}-${mixedIdx}`}
                      code={mixedPart.value}
                      language={detectLanguage(mixedPart.value)}
                    />
                  );
                }

                return (
                  <span key={`${idx}-${mixedIdx}`}>
                    {renderTextPart(mixedPart.value)}
                  </span>
                );
              })}
            </div>
          );
        }

        // 🔥 Auto detect (CHỈ dùng cho comment)
        if (enableAutoDetect && !hasInlineCode(text) && isLikelyCode(text)) {
          return (
            <CodeBlockRenderer
              key={idx}
              code={text}
              language={detectLanguage(text)}
            />
          );
        }

        // ✅ Text bình thường
        return (
          <span key={idx}>
            {renderTextPart(text)}
          </span>
        );
      })}
    </div>
  );
};

export default CommentContentRenderer;