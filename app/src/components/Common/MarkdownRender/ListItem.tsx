import { Icon } from '@/components/Common/Iconify/icons';
import React from 'react';

interface ListItemProps {
  children: React.ReactNode;
  content: string;
  onChange?: (newContent: string) => void;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNodeAsText = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  
  const { type, props } = node;
  switch (type) {
    case 'strong':
      return `**${getNodesAsText(props.children)}**`;
    case 'em':
      return `*${props.children}*`;
    case 'del':
      return `~~${props.children}~~`;
  }

  const name = type?.name;
  const children = props?.children;
  switch (name) {
    case 'a':
      return `[${children}](${props.href})`;
  }

  return Array.isArray(children) ? getNodesAsText(children) : '';
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNodesAsText = (nodes: any[]): string => {
  return Array.isArray(nodes) ?
    nodes.filter(v => {
      if (v === null || v.type === 'input' || v === '\n') return false;
      if (v.type === 'ul'
        && v.props?.className?.includes('contains-task-list')) {
        return false;
      }
      return true;
    }).map(getNodeAsText).join('') :
    getNodeAsText(nodes);
}

const replaceTaskMark = (
  content: string, isChecked: boolean, taskText: string,
  newContent: string, targetState: boolean
): string => {
  const key = `]${taskText}`;
  const index = content.indexOf(key);
  if (index === -1) return newContent;

  const start = index - 4;
  if (start < 0) return newContent;
  if (isChecked === (content.charAt(index - 1) === ' ')) return newContent;  

  const oldMark = content.slice(start, index + key.length);
  const targetMark = `${oldMark.charAt(0)} [${targetState ? 'x' : ' '}]${taskText}`;
  return newContent.replace(oldMark, targetMark);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getChildTasks = (nodes: any[]): { text: string; checked: boolean }[] => {
  return nodes.map(node => {
    const className = node?.props?.className;
    if (!className) return null;

    if (className.includes('task-list-item')) {
      const children = node.props.children;
      const childCheckbox = children.find(child => child?.type === 'input');
      const text = getNodeAsText(node);
      return [{ text, checked: childCheckbox?.props?.checked ?? false }, ...getChildTasks(children)];
    }
    if (className.includes('contains-task-list')) {
      return getChildTasks(node.props.children);
    }
    return null;
  }).filter(v => v !== null).flat();
};

export const ListItem: React.FC<ListItemProps> = ({ children, content, onChange, className }) => {
  if (!className?.includes('task-list-item')) {
    return <li className={className}>{children}</li>;
  }

  const childArray = React.Children.toArray(children);
  const checkbox = childArray.find((child: any) => child?.type === 'input') as any;
  const isChecked = checkbox?.props?.checked ?? false;

  const taskText = getNodesAsText(childArray);
  const textContent = childArray.map((child: any) => {
    if (child?.type === 'input') return null;
    if (child?.props?.children?.[0]?.props?.type === 'checkbox') {
      return {
        ...child,
        props: {
          ...child.props,
          children: child.props.children.slice(1),
        }
      }
    }
    return child;
  }).filter(v => v !== null);
  const childTasks = getChildTasks(childArray);
  const hasChildren = childTasks.length > 0;
  const allChildrenChecked = hasChildren && childTasks.every(task => task.checked);
  const someChildrenChecked = hasChildren && childTasks.some(task => task.checked);

  const handleToggle = (e: React.MouseEvent) => {
    if (!onChange) return;
    e.stopPropagation();
    
    const targetState = hasChildren ? !allChildrenChecked : !isChecked;

    let newContent = replaceTaskMark(content, isChecked, taskText, content, targetState);
    if (hasChildren) {
      childTasks.forEach(task => {
        newContent = replaceTaskMark(content, task.checked, task.text, newContent, targetState);
      });
    }

    onChange(newContent);
  };

  const getIcon = () => {
    if (!hasChildren) {
      return isChecked ? "lets-icons:check-fill" : "ci:radio-unchecked";
    }
    if (allChildrenChecked) {
      return "lets-icons:check-fill";
    }
    if (someChildrenChecked) {
      return "ri:indeterminate-circle-line";
    }
    return "ci:radio-unchecked";
  };

  const getTextStyle = () => {
    if (!hasChildren) {
      return isChecked ? 'line-through text-desc' : '';
    }
    return allChildrenChecked ? 'line-through text-desc' : '';
  };

  const computeLineHash = () => {
    const key = `]${taskText}`;
    const index = content.indexOf(key);
    if (index === -1) return null;
    const start = index - 4;
    if (start < 0) return null;
    const mark = content.slice(start, index + key.length).trim();
    function sha1(str: string) {
      const utf8 = new TextEncoder().encode(str);
      let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
      const ml = utf8.length * 8;
      const withOne = new Uint8Array(((utf8.length + 9 + 63) >> 6) << 6);
      withOne.set(utf8);
      withOne[utf8.length] = 0x80;
      const dv = new DataView(withOne.buffer);
      dv.setUint32(withOne.length - 4, ml >>> 0);
      for (let i = 0; i < withOne.length; i += 64) {
        const w = new Uint32Array(80);
        for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
        for (let j = 16; j < 80; j++) w[j] = ((w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16]) << 1) | (((w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16]) >>> 31) & 1);
        let a = h0, b = h1, c = h2, d = h3, e = h4;
        for (let j = 0; j < 80; j++) {
          const f = j < 20 ? ((b & c) | (~b & d)) : j < 40 ? (b ^ c ^ d) : j < 60 ? ((b & c) | (b & d) | (c & d)) : (b ^ c ^ d);
          const k = j < 20 ? 0x5A827999 : j < 40 ? 0x6ED9EBA1 : j < 60 ? 0x8F1BBCDC : 0xCA62C1D6;
          const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) >>> 0;
          e = d; d = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = temp;
        }
        h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
      }
      function hex(n: number) { return n.toString(16).padStart(8, '0'); }
      return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4);
    }
    return sha1(mark);
  };
  const lineHash = computeLineHash();

  return (
    <li className={`${className} !list-none`} id={lineHash ? `task-${lineHash}` : undefined}>
      <div 
        className='flex items-start gap-1 -ml-[15px] cursor-pointer justify-center'
        onClick={handleToggle}
      >
        <div className='w-[20px] h-[20px] flex-shrink-0 mt-[3px] hover:opacity-80 !transition-all'>
          <Icon 
            className='text-[#EAB308]' 
            icon={getIcon()} 
            width="20" 
            height="20" 
          />
        </div>
        <div
          className={`${getTextStyle()} break-all flex-1 min-w-0 md:mt-0 mt-[2px]`}
          onClick={e => e.stopPropagation()}
        >
          {textContent}
        </div>
      </div>
    </li>
  );
};
