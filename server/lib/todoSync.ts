import crypto from 'crypto';

export function stripCodeBlocks(input: string) {
  return input.replace(/```[\s\S]*?```/g, '');
}

export type ParsedTodo = { text: string; checked: boolean; hash: string; position: number };

export function extractTodos(input: string): ParsedTodo[] {
  const cleaned = stripCodeBlocks(input || '');
  const lines = cleaned.split(/\r?\n/);
  const todos: ParsedTodo[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^\s*[-*]\s*\[( |x|X)\]\s*(.*)$/.exec(line);
    if (m) {
      const checked = m[1].toLowerCase() === 'x';
      const text = m[2] || '';
      const hash = computeLineHash(line);
      todos.push({ text, checked, hash, position: i });
    }
  }
  return todos;
}

export function computeLineHash(line: string) {
  return crypto.createHash('sha1').update(line.trim()).digest('hex');
}

