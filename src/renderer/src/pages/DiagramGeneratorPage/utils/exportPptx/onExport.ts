import pako from 'pako'

/**
 * DrawIoEmbedコンポーネントのonExportプロパティに渡す関数
 * エクスポートされたデータを処理し、XMLデータを更新する
 */
export const handleDrawioExport = (data: any, setXml: (xml: string) => void) => {
  console.log("On Export")
  console.log(data.xml)
  console.log("On Export")
  console.log(data.data)
  
  try {
    // data.xmlがmxfileフォーマットの場合、デコード処理を実行
    if (data.xml && data.xml.includes('<mxfile')) {
      console.log("Decoding mxfile XML data");
      const decodedXml = decodeMxFile(data.xml);
      console.log("Decoded XML data:", decodedXml);
      setXml(decodedXml);
    } 
    // data.dataがbase64エンコードされたSVGデータの場合、デコードして使用
    else if (data.data && typeof data.data === 'string' && data.data.startsWith('data:image/svg+xml;base64,')) {
      try {
        // Base64エンコードされた部分を抽出
        const base64Data = data.data.replace('data:image/svg+xml;base64,', '');
        // Base64デコード
        const decodedData = atob(base64Data);
        console.log("Decoded SVG data:", decodedData);
        // デコードされたSVGデータをセット
        setXml(decodedData);
      } catch (error) {
        console.error("Failed to decode SVG data:", error);
        // デコードに失敗した場合は元のXMLを使用
        setXml(data.xml);
      }
    } else {
      // どちらの形式でもない場合は元のXMLを使用
      setXml(data.xml);
    }
  } catch (error) {
    console.error("Error processing export data:", error);
    setXml(data.xml);
  }
}


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
