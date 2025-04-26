import { DOMParser } from 'xmldom'
import pptxgen from 'pptxgenjs'

/**
 * Draw.io XMLをPowerPointに変換するユーティリティ
 * pptxgenjsライブラリを使用してXMLをPPTXに変換する
 */
export const convertXmlToPptxandSave = async (
  xmlContent: string,
  title: string = 'AWS Architecture Diagram'
): Promise<void> => {
  console.log('[PPTX Convert] Starting XML to PPTX conversion')
  
  try {
    // xmlContentを解析
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml')
    console.log('[PPTX Convert] Successfully parsed XML document')

    // PowerPointライブラリの初期化
    const pptx = new pptxgen()
    console.log('[PPTX Convert] Initialized pptxgen')
    
    // スライドの基本設定
    pptx.layout = 'LAYOUT_16x9'
    pptx.title = title
    
    // スライドの作成
    const slide = pptx.addSlide()
    console.log('[PPTX Convert] Added new slide')
    
    // タイトルの追加
    slide.addText(title, { 
      x: 0.5, 
      y: 0.5, 
      fontSize: 24, 
      bold: true 
    })
    
    // ダイアグラムの概要情報を取得
    const diagrams = xmlDoc.getElementsByTagName('diagram')
    let diagramName = 'AWS Architecture'
    
    if (diagrams.length > 0 && diagrams[0].getAttribute('name')) {
      diagramName = diagrams[0].getAttribute('name') || diagramName
    }
    console.log('[PPTX Convert] Diagram name:', diagramName)
    
    // 説明テキスト追加
    slide.addText(`Diagram: ${diagramName}`, { 
      x: 0.5, 
      y: 1.5, 
      fontSize: 12 
    })
    
    // ダイアグラム要素を配置
    addDiagramElements(slide, xmlDoc)
    
    // 生成日時の追加
    const today = new Date()
    slide.addText(`Generated: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`, { 
      x: 0.5, 
      y: 6.5, 
      fontSize: 8, 
      color: '666666' 
    })
    
    // PPTXファイルをバッファとして生成
    console.log('[PPTX Convert] Generating PPTX buffer')
    await pptx.writeFile({ fileName:'diagram.pptx' }) 

  } catch (error) {
    console.error('[PPTX Convert] Error converting XML to PPTX:', error)
    throw new Error(`Failed to convert diagram to PowerPoint: ${error.message}`)
  }
}

/**
 * XMLからダイアグラム要素を抽出し、スライドに配置する
 */
function addDiagramElements(slide: pptxgen.Slide, xmlDoc: Document): void {
  console.log('[PPTX Convert] Adding diagram elements to slide')
  
  // 基本的なコンポーネント抽出
  const cells = xmlDoc.getElementsByTagName('mxCell')
  console.log('[PPTX Convert] Found', cells.length, 'mxCell elements')
  
  // Draw.ioとPowerPointの座標系変換用のスケール係数
  // Draw.ioの座標はピクセル単位、PowerPointはインチ単位
  // 1インチ = 96ピクセルとして換算
  const SCALE_FACTOR = 1/96
  
  // 処理済みのセルIDを記録
  const processedCellIds = new Set<string>()
  
  // 各セルを処理
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const id = cell.getAttribute('id')
    
    // 既に処理済みのセルや、IDがないセルはスキップ
    if (!id || processedCellIds.has(id)) continue
    
    // 処理済みとしてマーク
    processedCellIds.add(id)
    
    // 値（テキスト）とスタイルを取得
    const value = cell.getAttribute('value')
    const style = cell.getAttribute('style') || ''
    
    // 描画するテキストがない場合や、エッジ（接続線）の場合はスキップ
    if (!value || style.includes('edgeLabel') || cell.getAttribute('edge') === '1') continue
    
    // 位置情報（mxGeometry）を取得
    const geometryElements = cell.getElementsByTagName('mxGeometry')
    if (geometryElements.length === 0) continue
    
    const geometry = geometryElements[0]
    
    // x, y, width, heightの属性を取得して数値に変換
    const x = parseFloat(geometry.getAttribute('x') || '0') * SCALE_FACTOR
    const y = parseFloat(geometry.getAttribute('y') || '0') * SCALE_FACTOR
    const width = parseFloat(geometry.getAttribute('width') || '120') * SCALE_FACTOR
    const height = parseFloat(geometry.getAttribute('height') || '60') * SCALE_FACTOR
    
    // PowerPoint座標系へのオフセット（スライドの左上端を考慮）
    const offset = 0.5
    
    // テキストボックスをスライドに追加
    slide.addText(value, {
      x: x + offset,
      y: y + offset,
      w: width,
      h: height,
      fontSize: 10,
      align: 'center',
      valign: 'middle',
      fill: { color: 'F5F5F5' },
      line: { color: '000000', width: 1 }
    })
    
    console.log(`[PPTX Convert] Added text element "${value}" at (${x}, ${y}) with size ${width}x${height}`)
  }
  
  // 接続線（矢印など）を描画
  drawConnections(slide, xmlDoc, SCALE_FACTOR)
  
  console.log('[PPTX Convert] Finished adding diagram elements')
}

/**
 * セル間の接続線を描画する
 */
function drawConnections(slide: pptxgen.Slide, xmlDoc: Document, scaleFactor: number): void {
  console.log('[PPTX Convert] Drawing connections')
  
  const cells = xmlDoc.getElementsByTagName('mxCell')
  const offset = 0.5 // PowerPoint座標系へのオフセット
  
  // エッジ（接続線）を抽出
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    
    // エッジでないセルはスキップ
    if (cell.getAttribute('edge') !== '1') continue
    
    // 接続元と接続先のIDを取得
    const sourceId = cell.getAttribute('source')
    const targetId = cell.getAttribute('target')
    
    if (!sourceId || !targetId) continue
    
    // 接続元と接続先のセルを取得
    let sourceCell = null
    let targetCell = null
    
    for (let j = 0; j < cells.length; j++) {
      const checkCell = cells[j]
      const checkId = checkCell.getAttribute('id')
      
      if (checkId === sourceId) {
        sourceCell = checkCell
      } else if (checkId === targetId) {
        targetCell = checkCell
      }
      
      if (sourceCell && targetCell) break
    }
    
    if (!sourceCell || !targetCell) continue
    
    // 位置情報を取得
    const sourceGeometry = sourceCell.getElementsByTagName('mxGeometry')[0]
    const targetGeometry = targetCell.getElementsByTagName('mxGeometry')[0]
    
    if (!sourceGeometry || !targetGeometry) continue
    
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
    
    // 直線を描画
    slide.addShape('line', {
      x: startX,
      y: startY,
      w: endX - startX,
      h: endY - startY,
      line: { color: '000000', width: 1 },
      flipH: startX > endX,
      flipV: startY > endY
    })
    
    console.log(`[PPTX Convert] Added connection from (${startX}, ${startY}) to (${endX}, ${endY})`)
  }
  
  console.log('[PPTX Convert] Finished drawing connections')
}

/**
 * XMLからコンポーネント名を抽出してテキストリストとしてスライドに追加
 */
function addComponentTextList(slide: pptxgen.Slide, xmlDoc: Document): void {
  console.log('[PPTX Convert] Adding component text list to slide')
  
  slide.addText('AWS Architecture Components:', { 
    x: 0.5, 
    y: 2.0, 
    fontSize: 14, 
    bold: true 
  })
  
  // 基本的なコンポーネント抽出の試み
  const cells = xmlDoc.getElementsByTagName('mxCell')
  console.log('[PPTX Convert] Found', cells.length, 'mxCell elements')
  
  let yPos = 2.5
  const componentNames = new Set<string>()
  
  // mxCellから値を抽出してスライドに追加
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const value = cell.getAttribute('value')
    
    if (value && typeof value === 'string' && value.trim() !== '' && !componentNames.has(value)) {
      componentNames.add(value)
      slide.addText(`• ${value}`, { 
        x: 1.0, 
        y: yPos, 
        fontSize: 12 
      })
      yPos += 0.4
      
      // 1ページに収まる数に制限
      if (yPos > 6.0) break
    }
  }
  
  console.log('[PPTX Convert] Added', componentNames.size, 'component names to slide')
}