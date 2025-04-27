/**
 * 親要素の座標を考慮して子要素の絶対座標を計算する関数
 * geometryElementsは親の座標からの相対位置を表しているため、
 * 親の座標を加算して絶対座標を求める
 * 
 * 複数の親要素がネストしている場合（親→子→孫）も対応
 */
export function calculateAbsolutePosition(
  geometry: Element,
  parentGeometry: Element | null,
  scaleFactor: number,
  parentGeometries: Element[] = []
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  // 子要素の相対座標を取得
  const relativeX = parseFloat(geometry.getAttribute('x') || '0') * scaleFactor
  const relativeY = parseFloat(geometry.getAttribute('y') || '0') * scaleFactor
  const width = parseFloat(geometry.getAttribute('width') || '120') * scaleFactor
  const height = parseFloat(geometry.getAttribute('height') || '60') * scaleFactor
  
  // 親要素がなく、親の階層も空の場合は相対座標をそのまま返す
  if (!parentGeometry && parentGeometries.length === 0) {
    return {
      x: relativeX,
      y: relativeY,
      width,
      height
    }
  }
  
  // 親要素の座標を計算
  let totalParentX = 0
  let totalParentY = 0
  
  // 直接の親要素がある場合はその座標を加算
  if (parentGeometry) {
    totalParentX += parseFloat(parentGeometry.getAttribute('x') || '0') * scaleFactor
    totalParentY += parseFloat(parentGeometry.getAttribute('y') || '0') * scaleFactor
  }
  
  // 親の親、親の親の親...と辿って、すべての親要素の座標を加算
  for (const pg of parentGeometries) {
    totalParentX += parseFloat(pg.getAttribute('x') || '0') * scaleFactor
    totalParentY += parseFloat(pg.getAttribute('y') || '0') * scaleFactor
  }
  
  // すべての親の座標を加算して絶対座標を計算
  return {
    x: totalParentX + relativeX,
    y: totalParentY + relativeY,
    width,
    height
  }
}
