import pptxgen from 'pptxgenjs'

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
    
    // 座標を取得
    const sourceX = parseFloat(sourceGeometry.getAttribute('x') || '0')
    const sourceY = parseFloat(sourceGeometry.getAttribute('y') || '0')
    const sourceWidth = parseFloat(sourceGeometry.getAttribute('width') || '0')
    const sourceHeight = parseFloat(sourceGeometry.getAttribute('height') || '0')
    
    const targetX = parseFloat(targetGeometry.getAttribute('x') || '0')
    const targetY = parseFloat(targetGeometry.getAttribute('y') || '0')
    const targetWidth = parseFloat(targetGeometry.getAttribute('width') || '0')
    const targetHeight = parseFloat(targetGeometry.getAttribute('height') || '0')
    
    // 接続の開始点と終了点を計算（単純化のためオブジェクトの中心を使用）
    const startX = (sourceX + sourceWidth / 2) * scaleFactor + offset
    const startY = (sourceY + sourceHeight / 2) * scaleFactor + offset
    const endX = (targetX + targetWidth / 2) * scaleFactor + offset
    const endY = (targetY + targetHeight / 2) * scaleFactor + offset
    
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