/**
 * 段落内"目前打开但还没关闭"的格式栈分析。
 *
 * 用途：用户在 `**红色文字|这里换行**` 这样的位置按回车，要避免回车产生的
 * `\n\n` 把 `**...**` / `<span>...</span>` 切断（markdown 跨段落不认同一段
 * 内联格式）。做法是把光标所在段落里 0..pos 这段字符做一次"开/闭 token
 * 栈"扫描，得到栈底→栈顶的所有打开格式，回车时输出：
 *
 *   closeAll (栈顶→栈底) + \n\n + openAll (栈底→栈顶)
 *
 * 处理的格式：
 *   - `**` 加粗
 *   - `==` 高亮
 *   - `<span style="color:...">` 颜色（任意属性顺序，但必须 style 在前）
 *
 * 不处理 italic 单 `*`、code 反引号等——保持简单，避免误判。
 */

interface OpenTag {
  openTag: string;
  closeTag: string;
}

export interface FormatSplit {
  /** 在光标处先输出这段，把所有打开的格式关掉 */
  close: string;
  /** 段落分隔后输出这段，重新打开同样的格式 */
  open: string;
}

const SPAN_OPEN_RE = /^<span\s+style="color:[^"]*">/;

export function findOpenFormatting(src: string, pos: number): FormatSplit | null {
  // 段落边界 = 最近的空行 \n\n
  const prevBlank = src.lastIndexOf('\n\n', Math.max(0, pos - 1));
  const paraStart = prevBlank === -1 ? 0 : prevBlank + 2;
  const text = src.slice(paraStart, pos);

  const stack: OpenTag[] = [];
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);

    const spanMatch = rest.match(SPAN_OPEN_RE);
    if (spanMatch) {
      stack.push({ openTag: spanMatch[0], closeTag: '</span>' });
      i += spanMatch[0].length;
      continue;
    }
    if (rest.startsWith('</span>')) {
      // 弹出最近的 span（不一定是栈顶，因为外面可能嵌着 **）
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k].closeTag === '</span>') {
          stack.splice(k, 1);
          break;
        }
      }
      i += '</span>'.length;
      continue;
    }
    if (rest.startsWith('**')) {
      const top = stack[stack.length - 1];
      if (top && top.openTag === '**') stack.pop();
      else stack.push({ openTag: '**', closeTag: '**' });
      i += 2;
      continue;
    }
    if (rest.startsWith('==')) {
      const top = stack[stack.length - 1];
      if (top && top.openTag === '==') stack.pop();
      else stack.push({ openTag: '==', closeTag: '==' });
      i += 2;
      continue;
    }
    i++;
  }

  if (stack.length === 0) return null;

  let close = '';
  for (let k = stack.length - 1; k >= 0; k--) close += stack[k].closeTag;
  let open = '';
  for (let k = 0; k < stack.length; k++) open += stack[k].openTag;

  return { close, open };
}
