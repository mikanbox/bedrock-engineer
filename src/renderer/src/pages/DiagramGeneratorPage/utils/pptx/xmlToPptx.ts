import { DOMParser } from 'xmldom'
import pptxgen from 'pptxgenjs'
import {addEmptyShapeElement} from './draw/addEmptyShape'
import {addTextOnlyElement} from './draw/addTextOnly'
import {addShapeWithTextElement} from './draw/addShapeWithTextLabel'
import { addConnectionElement } from './draw/addConnection'
// IPC経由でメインプロセスと通信するためにwindow.electronを使用
// Electronのcontextブリッジで公開されたAPIを使用

/**
 * Draw.io XMLをPowerPointに変換するユーティリティ
 * pptxgenjsライブラリを使用してXMLをPPTXに変換する
 */
export const convertXmlToPptxandSave = async (
  xmlContent: string,
  title: string = 'AWS Architecture Diagram',
  scaleFactor: number = 1/96
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
    await addDiagramElements(slide, xmlDoc, scaleFactor)
    
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
async function addDiagramElements(slide: pptxgen.Slide, xmlDoc: Document, scaleFactor: number): Promise<void> {
  console.log('[PPTX Convert] Adding diagram elements to slide')
  
  // 基本的なコンポーネント抽出
  const cells = xmlDoc.getElementsByTagName('mxCell')
  console.log('[PPTX Convert] Found', cells.length, 'mxCell elements')
  
  // Draw.ioとPowerPointの座標系変換用のスケール係数
  // Draw.ioの座標はピクセル単位、PowerPointはインチ単位
  // デフォルトは1インチ = 96ピクセルとして換算
  const SCALE_FACTOR = scaleFactor
  
  
  // 処理済みのsセルIDを記録
  const processedCellIds = new Set<string>()
  
  
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

    // 親要素のIDを取得
    const parentId = cell.getAttribute('parent')
    // 直接の親要素のgeometryを取得
    const parentGeometry = parentId ? getGeometryElementById(cells, parentId) : null
    // 親の親、親の親の親...と辿って、すべての親要素のgeometryを取得
    const parentGeometries = id ? getAllParentGeometries(cells, id) : []
    
    switch (elementType) {
      case 'textOnly':
        const textValue = cell.getAttribute('value')
        const geometryElements = cell.getElementsByTagName('mxGeometry')
        if (geometryElements.length > 0 && textValue) {
          addTextOnlyElement(
            slide, 
            cell, 
            geometryElements[0], 
            textValue, 
            SCALE_FACTOR, 
            parentGeometry,
            parentGeometries
          )
        }
        break
      case 'shapeWithText':
        const labelValue = cell.getAttribute('value')
        const shapeValue = cell.getAttribute('style')
        const shapeGeometryElements = cell.getElementsByTagName('mxGeometry')

        if (shapeGeometryElements.length > 0 && shapeValue) {
          await addShapeWithTextElement(
            slide, 
            cell, 
            shapeGeometryElements[0], 
            labelValue, 
            shapeValue, 
            SCALE_FACTOR, 
            parentGeometry, // 直接の親要素のgeometryを渡す
            parentGeometries // 親の親、親の親の親...のgeometryを渡す
          )
        }
        break
      case 'emptyShape':
        const emptyGeometryElements = cell.getElementsByTagName('mxGeometry')
        if (emptyGeometryElements.length > 0) {
          addEmptyShapeElement(
            slide, 
            cell, 
            emptyGeometryElements[0], 
            SCALE_FACTOR,
            parentGeometry, // 直接の親要素のgeometryを渡す
            parentGeometries // 親の親、親の親の親...のgeometryを渡す
          )
        }
        break
      case 'connection':
        // フォーマットにエラーがあるっぽい
        addConnectionElement(slide, cell, cells, SCALE_FACTOR)
        break
      default:
        // 未知の要素タイプは処理しない
        console.log(`[PPTX Convert] Unknown element type for cell ID: ${id}`)
    }
  }
  
  console.log('[PPTX Convert] Finished adding diagram elements')
}


/**
 * 指定されたIDのセルのgeometry要素を取得する
 */
export function getGeometryElementById(cells: HTMLCollectionOf<Element>, id: string): Element | null {
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    if (cell.getAttribute('id') === id) {
      const geometryElements = cell.getElementsByTagName('mxGeometry')
      if (geometryElements.length > 0) {
        return geometryElements[0]
      }
    }
  }
  return null
}

/**
 * 指定されたIDのセルの親要素のIDを取得する
 */
export function getParentIdById(cells: HTMLCollectionOf<Element>, id: string): string | null {
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    if (cell.getAttribute('id') === id) {
      return cell.getAttribute('parent')
    }
  }
  return null
}

/**
 * 指定されたIDのセルの親要素のgeometry要素を再帰的に取得する
 * 親の親、親の親の親...と辿って、すべての親要素のgeometryを配列として返す
 */
export function getAllParentGeometries(cells: HTMLCollectionOf<Element>, id: string): Element[] {
  const parentGeometries: Element[] = []
  let currentId = id
  let parentId: string | null
  
  // 親要素のIDを再帰的に辿る
  while ((parentId = getParentIdById(cells, currentId)) !== null && parentId !== '1') {
    const parentGeometry = getGeometryElementById(cells, parentId)
    if (parentGeometry) {
      parentGeometries.push(parentGeometry)
    }
    currentId = parentId
  }
  
  return parentGeometries
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
