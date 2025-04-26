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