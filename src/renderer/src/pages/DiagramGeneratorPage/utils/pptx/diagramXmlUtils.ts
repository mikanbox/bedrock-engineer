import pako from 'pako'

// XMLからdiagramの内容を抽出する関数
export const extractDiagramContent = (xmlData: string): string | null => {
  try {
    // DOMParserを使用してXMLをパース
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
    
    // diagram要素を取得
    const diagrams = xmlDoc.getElementsByTagName('diagram');
    
    if (diagrams.length > 0) {
      // 最初のdiagram要素のテキスト内容を返す
      return diagrams[0].textContent;
    }
  } catch (e) {
    console.error('Failed to parse XML:', e);
  }
  
  return null;
};

// DrawIO XMLデータをデコードする関数
export const decodeMxFile = (xmlData: string): string => {
  try {
    // diagram要素の内容を抽出
    const diagramContent = extractDiagramContent(xmlData);
    
    if (diagramContent) {
      try {
        // Base64デコード
        const base64Decoded = atob(diagramContent);
        
        try {
          // Deflate解凍
          const inflated = pako.inflateRaw(
            Uint8Array.from(base64Decoded, c => c.charCodeAt(0)), 
            { to: 'string' }
          );
          
          try {
            // URLデコード
            return decodeURIComponent(inflated);
          } catch (e) {
            console.error('Failed to URL decode:', e);
            return inflated;
          }
        } catch (e) {
          console.error('Failed to inflate:', e);
          return base64Decoded;
        }
      } catch (e) {
        console.error('Failed to base64 decode:', e);
        return diagramContent;
      }
    }
    
    return xmlData;
  } catch (e) {
    console.error('Failed to decode mxFile:', e);
    return xmlData;
  }
};
