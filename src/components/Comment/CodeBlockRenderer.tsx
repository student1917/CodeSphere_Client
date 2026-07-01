import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';

// load language nếu cần
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';

interface CodeBlockProps {
  code: string;
  language: string;
}

const normalizeLanguage = (raw?: string) => {
  const lang = (raw || '').trim().toLowerCase();
  if (!lang) return 'text';
  if (lang === 'c++' || lang === 'cxx' || lang === 'cc') return 'cpp';
  if (lang === 'js') return 'javascript';
  if (lang === 'py') return 'python';
  return lang;
};

const CodeBlockRenderer = ({ code, language }: CodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null);
  const safeLanguage = normalizeLanguage(language);
  const safeCode = typeof code === 'string' ? code : '';
  const prismLanguage =
    safeLanguage === 'cpp'
      ? 'clike'
      : safeLanguage === 'java'
        ? (Prism.languages.java ? 'java' : 'clike')
        : safeLanguage;

  useEffect(() => {
    if (codeRef.current) {
      try {
        Prism.highlightElement(codeRef.current);
      } catch {
        // Fallback to plain text rendering if Prism fails on unexpected input.
      }
    }
  }, [safeCode, safeLanguage]);

  return (
    <div className="mt-2 mb-2 rounded-lg overflow-hidden bg-gray-900">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
        <span className="text-xs font-mono text-gray-400">
          {safeLanguage}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(safeCode)}
          className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
        >
          Copy
        </button>
      </div>

      <pre className="p-3 overflow-x-auto">
        <code
          ref={codeRef}
          className={`language-${prismLanguage}`}
        >
          {safeCode}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlockRenderer;