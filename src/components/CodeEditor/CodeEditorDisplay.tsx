import CodeEditor from './CodeEditor';

const CodeEditorDisplay = () => {
  return (
    <div className="relative">
      <div className="transform lg:-rotate-2 hover:rotate-0 transition-transform duration-300">
        <CodeEditor />
      </div>
    </div>
  );
};

export default CodeEditorDisplay;

