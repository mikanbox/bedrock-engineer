import { decodeMxFile } from './diagramXmlUtils'

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
