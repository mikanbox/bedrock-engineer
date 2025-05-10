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
  
  console.log(`[PPTX Convert] Added label "${value}" at (${cell})`)
  let offset = 0.5 // PowerPoint座標系へのオフセット
  let transparency = 0;

  // // 親が線分の場合のラベルなら特殊処理
  if (parentGeometry && parentGeometry.getElementsByTagName('mxPoint').length == 2) {
    offset = 0.4 // PowerPoint座標系へのオフセット
    transparency = 100;
    // 親要素の座標を考慮して絶対座標を計算（複数階層の親要素も考慮）
    const {x,y,width,height} = calculateAbsolutePosition(geometry, parentGeometry, scaleFactor, parentGeometries, true)

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
      line: { color: 'FFFFFF', transparency:100  } // 枠線なし
    })
    console.log(`[PPTX Convert] Added label "${value}" at (${x}, ${y})`)


  } else {
    // 親要素の座標を考慮して絶対座標を計算（複数階層の親要素も考慮）
    const {x,y,width,height} = calculateAbsolutePosition(geometry, parentGeometry, scaleFactor, parentGeometries, false)
        
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
      line: { color: '000000', transparency:transparency } // 枠線なし
    })
    console.log(`[PPTX Convert] Added label "${value}" at (${x}, ${y})`)
  }


  
  
}
