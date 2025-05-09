/**
 * shapeValueからresIconとgrIconの値を抽出する関数
 * @param shapeValue セミコロン区切りのキー=値形式の文字列
 * @returns {resIcon: string | null, grIcon: string | null} 抽出された値、存在しない場合はnull
 * example : "sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#232F3E;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.user;"
 */
export function extractIconValues(shapeValue: string | null): {awsresIcon:string | null, resIcon: string | null, grIcon: string | null } {
  
  // デフォルト値を設定
  const result = {
    awsresIcon:null as string | null,
    resIcon: null as string | null,
    grIcon: null as string | null
  };

  // shapeValueがnullまたは空文字列の場合はデフォルト値を返す
  if (!shapeValue) {
    return result;
  }

  try {
    // セミコロンで分割して各キー=値のペアを取得
    const pairs = shapeValue.split(';');
    
    // 各ペアをループして処理
    for (const pair of pairs) {
      // 空の場合はスキップ
      if (!pair.trim()) continue;
      
      // キーと値に分割
      const [key, value] = pair.split('=');
      
      // キーがresIconの場合
      if (key === 'resIcon') {
        result.awsresIcon = value || null;
      }
      if (key === 'grIcon') {
        result.grIcon = value || null;
      }
      if (key === 'shape') {
        result.resIcon = value || null;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting icon values:', error);
    return result;
  }
}
