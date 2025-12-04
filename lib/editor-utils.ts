/**
 * Monaco Editor utility functions
 */

/**
 * Get Monaco Editor language from file extension
 */
export function getLanguageFromPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    txt: 'plaintext',
  };

  return languageMap[extension || ''] || 'plaintext';
}
