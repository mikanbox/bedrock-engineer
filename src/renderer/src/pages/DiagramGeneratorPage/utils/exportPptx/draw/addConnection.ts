import pptxgen from 'pptxgenjs'
import { calculateAbsolutePosition } from './calculateAbsolutePosition'
import { getGeometryElementById, getAllParentGeometries } from '../xmlToPptx'

/**
 * 2つのオブジェクト間の接続点を計算する
 * オブジェクトの外周上の点（四角形の辺の中心）を使用
 */
function calculateConnectionPoints(
  sourceX: number,
  sourceY: number,
  sourceWidth: number,
  sourceHeight: number,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number
): { startX: number; startY: number; endX: number; endY: number } {
  // ソースオブジェクトの中心
  const sourceCenterX = sourceX + sourceWidth / 2
  const sourceCenterY = sourceY + sourceHeight / 2
  
  // ターゲットオブジェクトの中心
  const targetCenterX = targetX + targetWidth / 2
  const targetCenterY = targetY + targetHeight / 2
  
  // 2つのオブジェクト間の角度を計算
  const angle = Math.atan2(targetCenterY - sourceCenterY, targetCenterX - sourceCenterX)
  
  // 角度に基づいて、ソースオブジェクトのどの辺を使用するかを決定
  let startX: number
  let startY: number
  
  // 右: -π/4 から π/4
  // 下: π/4 から 3π/4
  // 左: 3π/4 から 5π/4 (または -3π/4 から -π/4)
  // 上: 5π/4 から 7π/4 (または -π/4 から -3π/4)
  
  if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
    // 右辺の中心
    startX = sourceX + sourceWidth
    startY = sourceCenterY
  } else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
    // 下辺の中心
    startX = sourceCenterX
    startY = sourceY + sourceHeight
  } else if ((angle > 3 * Math.PI / 4 && angle <= Math.PI) || (angle >= -Math.PI && angle <= -3 * Math.PI / 4)) {
    // 左辺の中心
    startX = sourceX
    startY = sourceCenterY
  } else {
    // 上辺の中心
    startX = sourceCenterX
    startY = sourceY
  }
  
  // ターゲットへの角度を計算（ソースからターゲットへの角度の逆）
  const reverseAngle = Math.atan2(sourceCenterY - targetCenterY, sourceCenterX - targetCenterX)
  
  // 角度に基づいて、ターゲットオブジェクトのどの辺を使用するかを決定
  let endX: number
  let endY: number
  
  if (reverseAngle > -Math.PI / 4 && reverseAngle <= Math.PI / 4) {
    // 右辺の中心
    endX = targetX + targetWidth
    endY = targetCenterY
  } else if (reverseAngle > Math.PI / 4 && reverseAngle <= 3 * Math.PI / 4) {
    // 下辺の中心
    endX = targetCenterX
    endY = targetY + targetHeight
  } else if ((reverseAngle > 3 * Math.PI / 4 && reverseAngle <= Math.PI) || (reverseAngle >= -Math.PI && reverseAngle <= -3 * Math.PI / 4)) {
    // 左辺の中心
    endX = targetX
    endY = targetCenterY
  } else {
    // 上辺の中心
    endX = targetCenterX
    endY = targetY
  }
  
  return { startX, startY, endX, endY }
}

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
  
  // 接続の開始点と終了点を計算（オブジェクトの外周上の点を使用）
  const { startX: calcStartX, startY: calcStartY, endX: calcEndX, endY: calcEndY } = calculateConnectionPoints(
    sourcePosition.x + offset,
    sourcePosition.y + offset,
    sourcePosition.width,
    sourcePosition.height,
    targetPosition.x + offset,
    targetPosition.y + offset,
    targetPosition.width,
    targetPosition.height
  )
  
  const startX = calcStartX
  const startY = calcStartY
  const endX = calcEndX
  const endY = calcEndY
  
  const x = startX
  let y = startY
  let w = endX - startX
  let h = endY - startY

  // console.error(` xxy = (${startX}, ${startY})  w,h = (${w}, ${h}) `);
  if (w == 0) {
    if (h < 0) {
      h = h * -1;
      y = y - h;
    }
  }

  // 矢印のタイプを取得
  const style = cell.getAttribute('style') || ''
  const styleMap = new Map<string, string>()
  
  style.split(';').forEach(item => {
    const [key, value] = item.split('=')
    if (key && value) {
      styleMap.set(key.trim(), value.trim())
    }
  })
  
  // 矢印のスタイル情報を取得
  const beginArrow = styleMap.get('startArrow')
  const endArrow = styleMap.get('endArrow')
  
  // 矢印タイプの定義
  type ArrowType = 'none' | 'diamond' | 'triangle' | 'arrow' | 'oval' | 'stealth' | undefined;
  
  // 矢印タイプのマッピング
  const arrowTypeMap: Record<string, ArrowType> = {
    'classic': 'arrow',
    'diamond': 'diamond',
    'oval': 'oval',
    'block': 'stealth',
    'open': 'triangle',
    'none': 'none'
  }
  
  // 矢印タイプを設定
  const beginArrowType: ArrowType = beginArrow ? (arrowTypeMap[beginArrow] || 'none') : undefined
  const endArrowType: ArrowType = endArrow ? (arrowTypeMap[endArrow] || 'none') : undefined
  
  // // 直線を描画
  slide.addShape('line', {
    x: x,
    y: y,
    w: w,
    h: h,
    line: { color: '000000', width: 1, dashType: "solid",
      beginArrowType: beginArrowType,
      endArrowType: endArrowType
     },
  })
  
}
