import pptxgen from 'pptxgenjs'
/**
 * テキストのみの要素を追加する
 */
export function addTextOnlyElement(
  slide: pptxgen.Slide, 
  cell: Element, 
  geometry: Element, 
  value: string | null, 
  scaleFactor: number
): void {
  if (!value) return
  
  const offset = 0.5 // PowerPoint座標系へのオフセット
  
  // x, y, width, heightの属性を取得して数値に変換
  const x = parseFloat(geometry.getAttribute('x') || '0') * scaleFactor
  const y = parseFloat(geometry.getAttribute('y') || '0') * scaleFactor
  const width = parseFloat(geometry.getAttribute('width') || '120') * scaleFactor
  const height = parseFloat(geometry.getAttribute('height') || '60') * scaleFactor
  
  // 透明なテキストボックスとして追加
  slide.addText(value, {
    x: x + offset,
    y: y + offset,
    w: width,
    h: height,
    fontSize: 8,
    align: 'center',
    valign: 'middle',
    fill: { color: 'FFFFFF', transparency: 100 }, // 完全透明
    line: { color: 'FFFFFF', width: 0 } // 枠線なし
  })
  
  console.log(`[PPTX Convert] Added label "${value}" at (${x}, ${y})`)
}
