import hljs from 'highlight.js/lib/core';
import cppLang from 'highlight.js/lib/languages/cpp';
import javaLang from 'highlight.js/lib/languages/java';
import sqlLang from 'highlight.js/lib/languages/sql';
import bashLang from 'highlight.js/lib/languages/bash';
import yamlLang from 'highlight.js/lib/languages/yaml';
import dockerLang from 'highlight.js/lib/languages/dockerfile';
import jsonLang from 'highlight.js/lib/languages/json';
import pythonLang from 'highlight.js/lib/languages/python';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('cpp', cppLang);
hljs.registerLanguage('java', javaLang);
hljs.registerLanguage('sql', sqlLang);
hljs.registerLanguage('bash', bashLang);
hljs.registerLanguage('yaml', yamlLang);
hljs.registerLanguage('dockerfile', dockerLang);
hljs.registerLanguage('json', jsonLang);
hljs.registerLanguage('python', pythonLang);
hljs.registerLanguage('text', plaintext);

export function highlight(code: string, lang: string): string {
  const language = hljs.getLanguage(lang) ? lang : 'text';
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
