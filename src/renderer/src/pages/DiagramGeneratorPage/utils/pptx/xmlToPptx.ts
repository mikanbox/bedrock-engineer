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
    pptx.layout = 'LAYOUT_16x9'
    pptx.title = title    
    const slide = pptx.addSlide()
    
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

  } catch (error: any) {
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
  
  // 処理済みのsセルIDを記録
  const processedCellIds = new Set<string>()
  
  // 親子関係のマップを作成
  const childrenMap = buildChildrenMap(cells)
  
  // 各セルを処理
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const id = cell.getAttribute('id')
    
    // 既に処理済みのセルや、IDがないセルはスキップ
    if (!id || processedCellIds.has(id)) continue
    
    // 処理済みとしてマーク
    processedCellIds.add(id)
    
    // 要素の種類を判別して適切な関数を呼び出す
    const elementType = determineElementType(cell)
    
    switch (elementType) {
      case 'textOnly':
        const textValue = cell.getAttribute('value')
        const geometryElements = cell.getElementsByTagName('mxGeometry')
        if (geometryElements.length > 0 && textValue) {
          addTextOnlyElement(slide, cell, geometryElements[0], textValue, SCALE_FACTOR)
        }
        break
      case 'shapeWithText':
        const shapeValue = cell.getAttribute('value')
        const shapeGeometryElements = cell.getElementsByTagName('mxGeometry')
        if (shapeGeometryElements.length > 0 && shapeValue) {
          addShapeWithTextElement(slide, cell, shapeGeometryElements[0], shapeValue, SCALE_FACTOR, childrenMap, processedCellIds)
        }
        break
      case 'emptyShape':
        const emptyGeometryElements = cell.getElementsByTagName('mxGeometry')
        if (emptyGeometryElements.length > 0) {
          addEmptyShapeElement(slide, cell, emptyGeometryElements[0], SCALE_FACTOR)
        }
        break
      case 'connection':
        // フォーマットにエラーがあるっぽい
        // addConnectionElement(slide, cell, cells, SCALE_FACTOR)
        break
      default:
        // 未知の要素タイプは処理しない
        console.log(`[PPTX Convert] Unknown element type for cell ID: ${id}`)
    }
  }
  
  console.log('[PPTX Convert] Finished adding diagram elements')
}

/**
 * 親子関係のマップを構築する
 */
function buildChildrenMap(cells: HTMLCollectionOf<Element>): Record<string, Array<Element>> {
  const childrenMap: Record<string, Array<Element>> = {}
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const parentId = cell.getAttribute('parent')
    const id = cell.getAttribute('id')
    
    if (parentId && id && parentId !== '1') {
      if (!childrenMap[parentId]) {
        childrenMap[parentId] = []
      }
      childrenMap[parentId].push(cell)
    }
  }
  
  return childrenMap
}

/**
 * 要素の種類を判別する
 */
function determineElementType(
  cell: Element
): 'textOnly' | 'shapeWithText' | 'emptyShape' | 'connection' {
  // 接続線（エッジ）の場合
  if (cell.getAttribute('edge') === '1') {
    return 'connection'
  }
  
  const value = cell.getAttribute('value')
  const style = cell.getAttribute('style') || ''
  
  // エッジラベルの場合はスキップ（通常は親のエッジで処理される）
  if (style.includes('edgeLabel')) {
    return 'textOnly' // エッジラベルはテキストとして扱う
  }
  
  // テキストがある場合
  if (value && value.trim() !== '') {
    // テキストスタイルの判定
    const isTextOnly = style.includes('text;html=1') || 
                       style.includes('label;') || 
                       !style.includes('shape=') || 
                       cell.getAttribute('vertex') !== '1'
    
    return isTextOnly ? 'textOnly' : 'shapeWithText'
  } 
  // テキストがない場合
  else {
    return 'emptyShape'
  }
}

/**
 * テキストのみの要素を追加する
 */
function addTextOnlyElement(
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

/**
 * テキスト付きの図形要素を追加する
 */
function addShapeWithTextElement(
  slide: pptxgen.Slide, 
  cell: Element, 
  geometry: Element, 
  value: string | null, 
  scaleFactor: number,
  childrenMap: Record<string, Array<Element>>,
  processedCellIds: Set<string>
): void {
  if (!value) return
  
  const offset = 0.5 // PowerPoint座標系へのオフセット
  const id = cell.getAttribute('id')
  
  // x, y, width, heightの属性を取得して数値に変換
  const x = parseFloat(geometry.getAttribute('x') || '0') * scaleFactor
  const y = parseFloat(geometry.getAttribute('y') || '0') * scaleFactor
  const width = parseFloat(geometry.getAttribute('width') || '120') * scaleFactor
  const height = parseFloat(geometry.getAttribute('height') || '60') * scaleFactor
  
  // AWSサービス名を抽出してアイコンがあるか確認
  const awsServiceName = extractAwsServiceName(value)
  const iconPath = awsServiceName ? `awsicons/Arch_AWS-${awsServiceName}_64@5x.png` : null
  
  try {
    // アイコンが存在する場合は画像を追加
    if (awsServiceName && iconPath) {

      // 画像を追加
      slide.addImage({
        path: iconPath,
        x: x + offset,
        y: y + offset,
        w: width,
        h: height * 0.7, // 画像の高さを調整
      })
      console.log(`[PPTX Convert] Added AWS icon for "${awsServiceName}" at (${x}, ${y}) from ${iconPath}`)
      
      // サービス名をラベルとして下部に追加
      const y_label = (parseFloat(geometry.getAttribute('y') || '0') + 75) * scaleFactor
      const height_label = (parseFloat(geometry.getAttribute('height') || '60') - 45) * scaleFactor
      
      slide.addText(value, {
        x: x + offset,
        y: y_label + offset,
        w: width,
        h: height_label,
        fontSize: 8,
        align: 'center',
        valign: 'middle',
      })
      console.log(`[PPTX Convert] Added label "${value}" at (${x}, ${y_label})`)
    } else {
      // アイコンがない場合は通常のテキストボックスを追加
      slide.addText(value, {
        x: x + offset,
        y: y + offset,
        w: width,
        h: height,
        fontSize: 10,
        align: 'center',
        valign: 'middle',
        line: { color: '000000', width: 1 }
      })
      console.log(`[PPTX Convert] Added shape "${value}" at (${x}, ${y}) with size ${width}x${height}`)

      const y_label = (parseFloat(geometry.getAttribute('y') || '0') + 75) * scaleFactor
      const height_label = (parseFloat(geometry.getAttribute('height') || '60') - 45) * scaleFactor

      // その下にラベルを表示
      slide.addText(value, {
        x: x + offset,
        y: y_label + offset,
        w: width,
        h: height_label,
        fontSize: 8,
        align: 'center',
        valign: 'middle',
      })
      console.log(`[PPTX Convert] Added shape "${value}" at (${x}, ${y_label}) with size ${width}x${height_label}`)
    }
  } catch (error) {
    console.error(`[PPTX Convert] Error adding shape with text: ${error}`)
    // エラーが発生した場合は通常のテキストボックスを追加
    slide.addText(value, {
      x: x + offset,
      y: y + offset,
      w: width,
      h: height,
      fontSize: 10,
      align: 'center',
      valign: 'middle',
      line: { color: '000000', width: 1 }
    })
  }
}


/**
 * 空の図形要素を追加する
 */
function addEmptyShapeElement(
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

/**
 * テキストからAWSサービス名を抽出する
 * 例: "AWS Lambda" -> "Lambda"
 */
function extractAwsServiceName(text: string | null): string | null {
  if (!text) return null
  
  // AWSサービス名のパターンを検出
  // 例: "AWS Lambda", "Amazon S3", "Lambda", "S3" など
  const awsPatterns = [
    /\bAWS\s+([A-Za-z0-9\-]+)(?:\s|$)/i,  // "AWS Lambda" -> "Lambda"
    /\bAmazon\s+([A-Za-z0-9\-]+)(?:\s|$)/i,  // "Amazon S3" -> "S3"
    /\b(Lambda|S3|EC2|DynamoDB|CloudFront|Route53|SQS|SNS|RDS|ECS|EKS|Fargate|Step\s*Functions|API\s*Gateway|CloudWatch|IAM|VPC|Cognito|Amplify|AppSync|Athena|Glue|Kinesis|CodePipeline|CodeBuild|CodeDeploy|CloudFormation)(?:\s|$)/i  // 一般的なAWSサービス名
  ]
  
  for (const pattern of awsPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      // サービス名を正規化（スペースを削除し、特殊なケースを処理）
      let serviceName = match[1].replace(/\s+/g, '-')
      
      // 特殊なケースの処理
      if (serviceName.toLowerCase() === 'api-gateway') serviceName = 'API-Gateway'
      if (serviceName.toLowerCase() === 'step-functions') serviceName = 'Step-Functions'
      
      return serviceName
    }
  }
  
  return null
}

/**
 * 接続線（エッジ）要素を追加する
 */
function addConnectionElement(
  slide: pptxgen.Slide,
  cell: Element,
  allCells: HTMLCollectionOf<Element>,
  scaleFactor: number
): void {
  console.log('[PPTX Convert] Adding connection element')
  
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
  console.log(`[PPTX Convert] Added connection from (${startX}, ${startY}) to (${endX}, ${endY})`)
}
