import pptxgen from 'pptxgenjs'
import { calculateAbsolutePosition } from './calculateAbsolutePosition'
import { getGeometryElementById, getAllParentGeometries } from '../xmlToPptx'

/**
 * 接続線（エッジ）要素を追加する
 */
export function addConnectionElement(
    slide: pptxgen.Slide,
    cell: Element,
    allCells: HTMLCollectionOf<Element>,
    scaleFactor: number
  ): void {
    // console.log('[PPTX Convert] Adding connection element')
    
    const offset = 0.5 // PowerPoint座標系へのオフセット
    
    // 接続元と接続先のIDを取得
    const sourceId = cell.getAttribute('source')
    const targetId = cell.getAttribute('target')
    
    if (!sourceId || !targetId) return
    
    // 接続元と接続先のセルを取得
    let sourceCell: Element | null = null
    let targetCell: Element | null = null
    
    for (let j = 0; j < allCells.length; j++) {
      const checkCell = allCells[j]
      const checkId = checkCell.getAttribute('id')
      
      if (checkId === sourceId) {
        sourceCell = checkCell
      } else if (checkId === targetId) {
        targetCell = checkCell
      }
      
      if (sourceCell && targetCell) break
    }
    
    if (!sourceCell || !targetCell) return
    
    // 位置情報を取得
    const sourceGeometry = sourceCell.getElementsByTagName('mxGeometry')[0]
    const targetGeometry = targetCell.getElementsByTagName('mxGeometry')[0]
    
    if (!sourceGeometry || !targetGeometry) return
    
    // 親要素の情報を取得
    const sourceParentId = sourceCell.getAttribute('parent')
    const targetParentId = targetCell.getAttribute('parent')
    
    // 親要素のgeometryを取得
    const sourceParentGeometry = sourceParentId ? getGeometryElementById(allCells, sourceParentId) : null
    const targetParentGeometry = targetParentId ? getGeometryElementById(allCells, targetParentId) : null
    
    // 親の親、親の親の親...と辿って、すべての親要素のgeometryを取得
    const sourceParentGeometries = sourceId ? getAllParentGeometries(allCells, sourceId) : []
    const targetParentGeometries = targetId ? getAllParentGeometries(allCells, targetId) : []
    
    // 親要素の座標を考慮して絶対座標を計算
    const sourcePosition = calculateAbsolutePosition(sourceGeometry, sourceParentGeometry, scaleFactor, sourceParentGeometries)
    const targetPosition = calculateAbsolutePosition(targetGeometry, targetParentGeometry, scaleFactor, targetParentGeometries)
    
    // 接続の開始点と終了点を計算（単純化のためオブジェクトの中心を使用）
    const startX = sourcePosition.x + sourcePosition.width / 2 + offset
    const startY = sourcePosition.y + sourcePosition.height / 2 + offset
    const endX = targetPosition.x + targetPosition.width / 2 + offset
    const endY = targetPosition.y + targetPosition.height / 2 + offset
    
    const x = startX;
    let y = startY;
    let w = endX - startX;
    let h = endY - startY;

    // console.error(` xxy = (${startX}, ${startY})  w,h = (${w}, ${h}) `);
    if (w == 0) {
      if (h < 0) {
        h = h * -1;
        y = y - h;
      }
    }

    // console.error(` xxy = (${startX}, ${startY})  w,h = (${w}, ${h}) `);
    // // 直線を描画
    slide.addShape('line', {
      x: x,
      y: y,
      w: w,
      h: h,
      line: { color: '000000', width: 1, dashType: "solid" },
    })

    
  }
