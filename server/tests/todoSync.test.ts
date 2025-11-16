import { expect, test } from 'bun:test';
import { extractTodos, stripCodeBlocks, computeLineHash } from '../lib/todoSync';

test('stripCodeBlocks removes fenced blocks', () => {
  const input = 'a\n```\n- [ ] task in code\n```\n- [x] real task';
  const cleaned = stripCodeBlocks(input);
  expect(cleaned.includes('task in code')).toBe(false);
  expect(cleaned.includes('real task')).toBe(true);
});

test('extractTodos parses tasks and checked state', () => {
  const input = '- [ ] A\n- [x] B';
  const todos = extractTodos(input);
  expect(todos.length).toBe(2);
  expect(todos[0].text).toBe('A');
  expect(todos[0].checked).toBe(false);
  expect(todos[1].text).toBe('B');
  expect(todos[1].checked).toBe(true);
});

test('computeLineHash is stable for same line', () => {
  const line = '- [ ] Task';
  const h1 = computeLineHash(line);
  const h2 = computeLineHash(line);
  expect(h1).toBe(h2);
});

