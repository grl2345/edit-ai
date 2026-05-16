/**
 * 拿到 textarea 里某个字符位置的像素坐标。
 *
 * 思路：建一个绝对定位、视觉隐藏的 div，把 textarea 的所有排版相关样式复制
 * 过去，再把 0..pos 的文本写进去，末尾插一个 marker span，量 marker 的
 * offsetTop / offsetLeft 即可。
 *
 * 这是社区里 textarea-caret-position 的最小变体——只够"显示一个浮动菜单"
 * 用，不追求像素级精准。
 */

const MIRROR_PROPS = [
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'whiteSpace',
  'wordWrap',
  'wordBreak',
  'overflowWrap',
] as const;

export interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
}

export function getCaretCoordinates(
  ta: HTMLTextAreaElement,
  pos: number
): CaretCoordinates {
  const doc = ta.ownerDocument;
  const mirror = doc.createElement('div');
  mirror.id = 'caret-mirror';

  const style = mirror.style;
  style.position = 'absolute';
  style.visibility = 'hidden';
  style.top = '0';
  style.left = '-9999px';
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';

  const computed = window.getComputedStyle(ta);
  for (const prop of MIRROR_PROPS) {
    style[prop as unknown as number] = computed[prop as unknown as number];
  }

  mirror.textContent = ta.value.slice(0, pos);
  const marker = doc.createElement('span');
  // 必须有内容，否则 offsetTop 在某些浏览器返回 0
  marker.textContent = ta.value.slice(pos) || '.';
  mirror.appendChild(marker);

  doc.body.appendChild(mirror);
  const top = marker.offsetTop;
  const left = marker.offsetLeft;
  const height = parseInt(computed.lineHeight, 10) || marker.offsetHeight || 20;
  doc.body.removeChild(mirror);

  return { top, left, height };
}
