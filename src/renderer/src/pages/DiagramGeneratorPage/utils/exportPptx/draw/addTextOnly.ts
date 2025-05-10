import pptxgen from 'pptxgenjs'
import { calculateAbsolutePosition } from './calculateAbsolutePosition'
/**
 * テキストのみの要素を追加する
 */
export function addTextOnlyElement(
  slide: pptxgen.Slide, 
  cell: Element, 
  geometry: Element, 
  value: string | null, 
  scaleFactor: number,
  parentGeometry: Element | null = null, // 直接の親要素のgeometryを受け取る（デフォルトはnull）
  parentGeometries: Element[] = [] // 親の親、親の親の親...のgeometryを受け取る（デフォルトは空配列）
): void {
  if (!value) return
  
  const offset = 0.5 // PowerPoint座標系へのオフセット
  
  // 親要素の座標を考慮して絶対座標を計算（複数階層の親要素も考慮）
  const { x, y, width, height } = calculateAbsolutePosition(geometry, parentGeometry, scaleFactor, parentGeometries)
  
  // 透明なテキストボックスとして追加
  slide.addText(value, {
    x: x + offset,
    y: y + offset,
    w: width,
    h: height,
    fontSize: 8,
    align: 'center',
    valign: 'middle',
    fill: { color: 'FFFFFF', transparency:100 }, // 完全透明
    line: { color: 'FFFFFF', width: 0 } // 枠線なし
  })
  
  console.log(`[PPTX Convert] Added label "${value}" at (${x}, ${y})`)
}
