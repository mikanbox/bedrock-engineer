import pptxgen from 'pptxgenjs'
import { calculateAbsolutePosition } from './calculateAbsolutePosition'
/**
 * 空の図形要素を追加する
 */
export function addEmptyShapeElement(
    slide: pptxgen.Slide, 
    cell: Element, 
    geometry: Element, 
    scaleFactor: number,
    parentGeometry: Element | null = null, // 直接の親要素のgeometryを受け取る（デフォルトはnull）
    parentGeometries: Element[] = [] // 親の親、親の親の親...のgeometryを受け取る（デフォルトは空配列）
  ): void {
    // 頂点でない場合はスキップ
    if (cell.getAttribute('vertex') !== '1') return
    
    const offset = 0.5 // PowerPoint座標系へのオフセット
    
    // 親要素の座標を考慮して絶対座標を計算（複数階層の親要素も考慮）
    const { x, y, width, height } = calculateAbsolutePosition(geometry, parentGeometry, scaleFactor, parentGeometries)
    
    // 空のシェイプとして追加
    slide.addShape('rect', {
      x: x + offset,
      y: y + offset,
      w: width,
      h: height,
      fill: { color: 'F5F5F5' },
      line: { color: '000000', width: 1 }
    })
    
    console.log(`[PPTX Convert] Added empty shape at (${x}, ${y}) with size ${width}x${height}`)
  }
