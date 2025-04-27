import pptxgen from 'pptxgenjs'
import { extractIconValues } from './extractIconValues'
/**
 * テキスト付きの図形要素を追加する
 */

// AZとかはtextonly とされちゃう問題がある...
export async function addShapeWithTextElement(
  slide: pptxgen.Slide, 
  cell: Element, 
  geometry: Element, 
  value: string | null, 
  shapeValue: string | null, 
  scaleFactor: number,
  childrenMap: Record<string, Array<Element>>,
  processedCellIds: Set<string>
): Promise<void> {
  if (!value) return
  
  const offset = 0.5 // PowerPoint座標系へのオフセット
  const id = cell.getAttribute('id')
  
  // x, y, width, heightの属性を取得して数値に変換
  const x = parseFloat(geometry.getAttribute('x') || '0') * scaleFactor
  const y = parseFloat(geometry.getAttribute('y') || '0') * scaleFactor
  const width = parseFloat(geometry.getAttribute('width') || '120') * scaleFactor
  const height = parseFloat(geometry.getAttribute('height') || '60') * scaleFactor

  // console.log(cell)
  // console.log('value : ', value)
  console.log('shapeValue : ',shapeValue)
  
  // example "sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#232F3E;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.user;"
  const {awsresIcon, resIcon ,grIcon} = extractIconValues(shapeValue)

  const type = (awsresIcon)?"aws":"resource";
  const fileName = transformToFileName(awsresIcon,resIcon,grIcon);

  let imageData = await window.electron.ipcRenderer.invoke('get-icon', type, fileName);



  try {

    // 画像データをBase64として追加
    if (grIcon) {
      slide.addText(value, {
        x: x + offset,
        y: y + offset,
        w: width,
        h: height,
        fontSize: 10,
        align: 'left' ,
        valign: 'top' ,
        line: { color: '000000', width: 1 }
      })
      console.log(`[PPTX Convert] Added groupIcon "${value}" at (${x}, ${y}) with size ${width}x${height}`)        
      return ;
    }

    // アイコンが存在しない場合は画像を追加
    if (!imageData) {
      // アイコンがない場合は通常のテキストボックスを追加
      // AWS Cloud の場合は左上に配置、それ以外は中央に配置
      slide.addText(value, {
        x: x + offset,
        y: y + offset,
        w: width,
        h: height,
        fontSize: 10,
        align: value === 'AWS Cloud' ? 'left' : 'center',
        valign: value === 'AWS Cloud' ? 'top' : 'middle',
        line: { color: '000000', width: 1 }
      })
      console.log(`[PPTX Convert] Added shape "${value}" at (${x}, ${y}) with size ${width}x${height}`)        
      return ;
    }

    console.log(`[PPTX Convert] Added ${type} at (${x}, ${y}) with base64 data`)
    // 画像データをBase64として追加
    slide.addImage({
      data: imageData as string, // Base64形式の画像データ
      x: x + offset,
      y: y + offset,
      w: width,
      h: height, // 画像の高さを調整
    })
    
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


  } catch (error) {
    console.error(`[PPTX Convert] Error adding shape with text: ${error}`)      
  }

}



function transformToFileName(awsresIcon: string | null, resIcon: string | null, grIcon: string | null) : string{
  let iconName = "";

  // mxgraph.aws4.user;
  if (resIcon) {
    iconName = resIcon;
  }

  // mxgraph.aws4.api_gateway;
  if (awsresIcon) {
    iconName = awsresIcon;
  }

  // mxgraph.aws4.group_aws_cloud_alt
  if (grIcon) {
    iconName = grIcon;
  }

  if (!iconName) return "";


  // 最後のドット以降の部分を取得（例：mxgraph.aws4.api_gateway → api_gateway）
  const parts = iconName.split('.');
  const lastPart = parts[parts.length - 1];

  // セミコロンがあれば削除
  const cleanPart = lastPart.replace(';', '');

  console.log(`[PPTX Convert] get Icon Name ${cleanPart}`)    

  // 例外処理
  const correctedIconFileName = correctExceptionServices(cleanPart)
  if (correctedIconFileName) {
    return correctedIconFileName;
  }

  // アンダースコアをハイフンに置き換え、単語の先頭を大文字に
  const words = cleanPart.split('_');
  let capitalizedWords = words.map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  );

  let iconFileName = capitalizedWords.join('-')
  // ハイフンで結合
  return iconFileName;
}


function correctExceptionServices(iconName:string):string|null {

  if (iconName == "application_load_balancer" || iconName == "network_load_balancer") {
    return "Elastic-Load-Balancing"
  }
  if (iconName == "auto_scaling2") {
    return "Application-Auto-Scaling"
  }


  return null;
}
