import pptxgen from 'pptxgenjs'
/**
 * 空の図形要素を追加する
 */
export function addEmptyShapeElement(
    slide: pptxgen.Slide, 
    cell: Element, 
    geometry: Element, 
    scaleFactor: number
  ): void {
    // 頂点でない場合はスキップ
    if (cell.getAttribute('vertex') !== '1') return
    
    const offset = 0.5 // PowerPoint座標系へのオフセット
    
    // x, y, width, heightの属性を取得して数値に変換
    const x = parseFloat(geometry.getAttribute('x') || '0') * scaleFactor
    const y = parseFloat(geometry.getAttribute('y') || '0') * scaleFactor
    const width = parseFloat(geometry.getAttribute('width') || '120') * scaleFactor
    const height = parseFloat(geometry.getAttribute('height') || '60') * scaleFactor
    
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
  