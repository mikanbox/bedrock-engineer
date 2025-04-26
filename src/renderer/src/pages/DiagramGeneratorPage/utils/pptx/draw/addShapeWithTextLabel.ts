import pptxgen from 'pptxgenjs'
/**
 * テキスト付きの図形要素を追加する
 */
export async function addShapeWithTextElement(
    slide: pptxgen.Slide, 
    cell: Element, 
    geometry: Element, 
    value: string | null, 
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
    
    // AWSサービス名を抽出してアイコンがあるか確認
    const awsServiceName = extractAwsServiceName(value)
    console.warn(`[PPTX Convert] Successfully Extract : ${awsServiceName}`);
    
    // Base64形式の画像データを取得
    let imageData: string | null = null;
    
    // リソース名を取得（例：User, Database など）
    const resourceName = extractResourceName(value);
    
    // IPC経由でAWS画像アイコンのBase64データを取得
    if (awsServiceName) {
      try {
        // メインプロセスを経由して画像を取得する（IPC通信）
        let servicefileName = awsServiceName;
        servicefileName = servicefileName.replace(/\s+/g, '-')

        console.error(`[PPTX Convert] file path ${servicefileName}`)
        const iconData: string | null = await window.electron.ipcRenderer.invoke('get-aws-icon', servicefileName);
        imageData = iconData;
        
        if (imageData) {
          console.warn(`[PPTX Convert] Successfully loaded icon data for ${servicefileName}`);
        } else {
          console.warn(`[PPTX Convert] Icon not found for ${servicefileName}`);
        }
      } catch (error) {
        console.error(`[PPTX Convert] Error loading icon : ${error}`);
        imageData = null;
      }
    }
    // AWSサービス名でなければ、一般的なリソースアイコンを取得
    else if (resourceName) {
      try {
        // メインプロセスを経由してリソースアイコンを取得する（IPC通信）
        console.error(`[PPTX Convert] Trying to load resource icon for ${resourceName}`)
        const iconData: string | null = await window.electron.ipcRenderer.invoke('get-resource-icon', resourceName);
        imageData = iconData;
        
        if (imageData) {
          console.warn(`[PPTX Convert] Successfully loaded resource icon data for ${resourceName}`);
        } else {
          console.warn(`[PPTX Convert] Resource icon not found for ${resourceName}`);
        }
      } catch (error) {
        console.error(`[PPTX Convert] Error loading resource icon : ${error}`);
        imageData = null;
      }
    }
  
    
    
    try {
    // アイコンが存在する場合は画像を追加
    if (imageData) {
        const iconType = awsServiceName ? `AWS icon for "${awsServiceName}"` : `Resource icon for "${resourceName}"`
        console.log(`[PPTX Convert] Added ${iconType} at (${x}, ${y}) with base64 data`)
  
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
      } else {
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
      
    }
  }


/**
 * テキストからAWSサービス名を抽出する
 * 例: "AWS Lambda" -> "AWS Lambda"
 * 例: "Arch_AWS-Lambda_64@5x.png" -> "AWS Lambda"
 */
function extractAwsServiceName(text: string | null): string | null {
    if (!text) return null
    

    // 通常のテキストパターンの検出
    // AWS または Amazon プレフィックス付きのパターン
    const prefixedPatterns = [
      /\b(AWS)\s+([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)*)(?:\s|$)/i,  // "AWS Lambda" -> "AWS Lambda"
      /\b(Amazon)\s+([A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+)*)(?:\s|$)/i  // "Amazon S3" -> "Amazon S3"
    ]
    
    for (const pattern of prefixedPatterns) {
      const match = text.match(pattern)
      if (match && match[1] && match[2]) {
        const prefix = match[1] // AWS または Amazon
        const serviceName = match[2] // サービス名部分
        return `${prefix} ${serviceName}`
      }
    }
    

    
    // プレフィックスなしの一般的なAWSサービス名
    const servicePattern = /\b(Lambda|S3|EC2|DynamoDB|CloudFront|Route53|SQS|SNS|RDS|ECS|EKS|Fargate|Step\s*Functions|API\s*Gateway|CloudWatch|IAM|VPC|Cognito|Amplify|AppSync|Athena|Glue|Kinesis|CodePipeline|CodeBuild|CodeDeploy|CloudFormation)(?:\s|$)/i
    const serviceMatch = text.match(servicePattern)
    if (serviceMatch && serviceMatch[1]) {
      // サービス名を正規化（スペースを削除し、特殊なケースを処理）
      let serviceName = serviceMatch[1].replace(/\s+/g, ' ')
      
      // 特殊なケースの処理
      if (serviceName.toLowerCase() === 'api gateway') serviceName = 'API Gateway'
      if (serviceName.toLowerCase() === 'step functions') serviceName = 'Step Functions'
      
      // AWS をプレフィックスとして追加
      return `AWS ${serviceName}`
    }
    
    // ファイル名パターンの検出（例: Arch_AWS-Lambda_64@5x.png）
    const fileNamePattern = /Arch_(AWS|Amazon)-([A-Za-z0-9\-&_]+)_64@5x\.png/i
    const fileNameMatch = text.match(fileNamePattern)
    if (fileNameMatch) {
      // ファイル名からサービス名を抽出
      const provider = fileNameMatch[1] // AWS または Amazon
      let serviceName = fileNameMatch[2] // サービス名部分（例: Lambda, S3, Application-Auto-Scaling）
      
      // 特殊なケースの処理
      if (serviceName === 'Marketplace_Dark' || serviceName === 'Marketplace_Light') {
        serviceName = 'Marketplace'
      }
      
      // ハイフンをスペースに置換
      const formattedServiceName = serviceName.replace(/-/g, ' ').replace(/_/g, ' ').replace(/&/g, 'and')
      
      // プレフィックス（AWSまたはAmazon）を含めて返す
      return `${provider} ${formattedServiceName}`
    }
    

    return null
  }

/**
 * テキストから一般的なリソース名を抽出する
 * 例: "Database" -> "Database"
 * 例: "User" -> "User"
 */
function extractResourceName(text: string | null): string | null {
  if (!text) return null
  
  // テキストをトリムして基本的な処理
  const trimmedText = text.trim()
  
  return trimmedText
}
