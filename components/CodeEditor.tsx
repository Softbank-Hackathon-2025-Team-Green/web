'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { getLanguageFromPath, FileSystemItem } from '@/lib/filesystem-utils';
import InputDialog from './InputDialog';
import CodeReviewDialog from './CodeReviewDialog';

interface FileTreeNode extends FileSystemItem {
  children?: FileTreeNode[];
  isExpanded?: boolean;
}

interface CodeEditorProps {
  projectPath: string; // e.g., 'func-uuid' - function ID, path relative to user's functions directory
  onSave?: (files: { path: string; content: string }[]) => void;
}

export default function CodeEditor({ projectPath, onSave }: CodeEditorProps) {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('plaintext');
  const [openFiles, setOpenFiles] = useState<Map<string, string>>(new Map());
  const [modifiedFiles, setModifiedFiles] = useState<Map<string, string>>(new Map()); // Track unsaved changes
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{ title: string; placeholder: string; isFolder: boolean }>({ title: '', placeholder: '', isFolder: false });
  const [isCheckingVulnerability, setIsCheckingVulnerability] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewedCode, setReviewedCode] = useState<string>('');
  const [hasSecurityIssues, setHasSecurityIssues] = useState(false);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Build tree structure from flat file list
  const buildTree = (files: FileSystemItem[]): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const map: { [key: string]: FileTreeNode } = {};

    files.forEach(file => {
      map[file.path] = { ...file, children: [], isExpanded: false };
    });

    files.forEach(file => {
      const node = map[file.path];
      const pathParts = file.path.split('/');
      
      if (pathParts.length === 1) {
        tree.push(node);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = map[parentPath];
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    });

    return tree;
  };

  // Load directory tree
  const loadDirectoryTree = async () => {
    try {
      console.log('Loading directory tree for:', projectPath);
      const response = await fetch('/api/vscode/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: projectPath }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Directory data received:', data);
        const tree = buildTree(data.items || []);
        console.log('Built tree:', tree);
        setFileTree(tree);
      } else {
        console.error('Failed to load directory:', await response.text());
        showMessage('error', 'Failed to load directory');
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
      showMessage('error', 'Failed to load directory');
    }
  };

  useEffect(() => {
    loadDirectoryTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPath]);

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    const updateTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.map(node => {
        if (node.path === path) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateTree(fileTree));
  };

  // Open file
  const openFile = async (filePath: string) => {
    // Save current file changes before switching
    if (currentFile) {
      const originalContent = openFiles.get(currentFile);
      if (currentContent !== originalContent) {
        // Content is modified, save to modifiedFiles
        setModifiedFiles(new Map(modifiedFiles.set(currentFile, currentContent)));
      } else {
        // Content matches original, remove from modifiedFiles if it exists
        const newModified = new Map(modifiedFiles);
        newModified.delete(currentFile);
        setModifiedFiles(newModified);
      }
    }

    // Check if file is already loaded (in modified or open state)
    if (modifiedFiles.has(filePath)) {
      setCurrentFile(filePath);
      setCurrentContent(modifiedFiles.get(filePath) || '');
      setLanguage(getLanguageFromPath(filePath));
      return;
    }
    
    if (openFiles.has(filePath)) {
      setCurrentFile(filePath);
      setCurrentContent(openFiles.get(filePath) || '');
      setLanguage(getLanguageFromPath(filePath));
      return;
    }

    try {
      const fullPath = `${projectPath}/${filePath}`;
      const response = await fetch('/api/vscode/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content || '';
        setOpenFiles(new Map(openFiles.set(filePath, content)));
        setCurrentFile(filePath);
        setCurrentContent(content);
        setLanguage(getLanguageFromPath(filePath));
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      showMessage('error', 'Failed to open file');
    }
  };

  // Check for vulnerabilities using AI
  const checkVulnerabilities = async () => {
    if (!currentFile || !currentContent) {
      showMessage('error', 'No file selected');
      return;
    }

    setIsCheckingVulnerability(true);
    try {
      const response = await fetch('/api/ai/vulnerability-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentContent,
          language,
          filename: currentFile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check vulnerabilities');
      }

      const data = await response.json();
      setReviewedCode(data.modifiedCode);
      setHasSecurityIssues(data.hasIssues);
      setReviewDialogOpen(true);
    } catch (error) {
      console.error('Vulnerability check error:', error);
      showMessage('error', 'Failed to analyze code');
    } finally {
      setIsCheckingVulnerability(false);
    }
  };

  // Apply reviewed code changes
  const applyReviewedCode = () => {
    setCurrentContent(reviewedCode);
    setModifiedFiles(new Map(modifiedFiles.set(currentFile, reviewedCode)));
    setReviewDialogOpen(false);
    showMessage('success', 'Security comments applied');
  };

  // Track previous modified files to prevent infinite loops
  const prevModifiedFilesRef = useRef<string>('');

  // Expose save function via callback when modified files change
  useEffect(() => {
    if (!onSave) return;
    
    // Include current file if it has unsaved changes
    const allModified = new Map(modifiedFiles);
    if (currentFile && currentContent !== openFiles.get(currentFile)) {
      allModified.set(currentFile, currentContent);
    }
    
    // Convert to array format
    const modifiedArray = Array.from(allModified.entries()).map(([path, content]) => ({
      path: `${projectPath}/${path}`,
      content,
    }));
    
    // Only call onSave if the modified files actually changed
    const currentState = JSON.stringify(modifiedArray);
    if (currentState !== prevModifiedFilesRef.current) {
      prevModifiedFilesRef.current = currentState;
      onSave(modifiedArray);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifiedFiles, currentFile, currentContent, projectPath]);

  // Create new file
  const createFile = async (fileName: string, isFolder: boolean = false) => {
    if (!fileName.trim()) return;

    try {
      const fullPath = `${projectPath}/${fileName}`;
      const response = await fetch('/api/vscode/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath, isDirectory: isFolder }),
      });

      if (response.ok) {
        loadDirectoryTree();
      } else {
        showMessage('error', 'Failed to create file');
      }
    } catch (error) {
      console.error('Create error:', error);
      showMessage('error', 'Failed to create file');
    }
  };

  // Render tree node
  const renderTreeNode = (node: FileTreeNode, level: number = 0) => {
    const isFolder = node.type === 'folder';
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer ${
            currentFile === node.path ? 'bg-gray-700' : ''
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => isFolder ? toggleFolder(node.path) : openFile(node.path)}
        >
          {isFolder && (
            <span className="text-xs text-gray-400">
              {node.isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="text-sm">
            {isFolder ? '📁' : '📄'}
          </span>
          <span className="text-sm text-gray-300 truncate flex-1">
            {node.name}
          </span>
        </div>
        {isFolder && node.isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Message */}
      {message && (
        <div className={`px-4 py-2 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white text-sm`}>
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Explorer */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">FILES</h2>
            <button
              onClick={() => {
                setDialogConfig({ title: 'Create New File', placeholder: 'filename.js', isFolder: false });
                setDialogOpen(true);
              }}
              className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mb-1"
            >
              + New File
            </button>
            <button
              onClick={() => {
                setDialogConfig({ title: 'Create New Folder', placeholder: 'folder-name', isFolder: true });
                setDialogOpen(true);
              }}
              className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New Folder
            </button>
          </div>

          {/* File Tree */}
          <div className="flex-1 overflow-y-auto">
            {fileTree.length === 0 ? (
              <div className="text-xs text-gray-500 text-center mt-4 px-2">
                No files yet. Create one!
              </div>
            ) : (
              fileTree.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {currentFile ? (
            <>
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">{currentFile}</span>
                  {currentContent !== openFiles.get(currentFile) && (
                    <span className="text-xs text-yellow-400">● Modified</span>
                  )}
                </div>
                <button
                  onClick={checkVulnerabilities}
                  disabled={isCheckingVulnerability || !currentFile}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isCheckingVulnerability ? (
                    <>
                      <span className="animate-spin">⚙</span>
                      Checking...
                    </>
                  ) : (
                    <>
                      🛡️ Check Security
                    </>
                  )}
                </button>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={language}
                  value={currentContent}
                  onChange={(value) => setCurrentContent(value || '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    automaticLayout: true,
                    suggest: {
                      showWords: true,
                      showSnippets: true,
                    },
                    quickSuggestions: true,
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: 'on',
                    tabCompletion: 'on',
                    wordBasedSuggestions: 'matchingDocuments',
                    fixedOverflowWidgets: true, // Prevents widgets from being clipped
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">No file open</p>
                <p className="text-sm">Select a file from the explorer</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Dialog */}
      <InputDialog
        isOpen={dialogOpen}
        title={dialogConfig.title}
        placeholder={dialogConfig.placeholder}
        onConfirm={(name) => {
          createFile(name, dialogConfig.isFolder);
          setDialogOpen(false);
        }}
        onCancel={() => setDialogOpen(false)}
      />

      {/* Code Review Dialog */}
      <CodeReviewDialog
        isOpen={reviewDialogOpen}
        modifiedCode={reviewedCode}
        hasIssues={hasSecurityIssues}
        onConfirm={applyReviewedCode}
        onCancel={() => setReviewDialogOpen(false)}
      />
    </div>
  );
}
