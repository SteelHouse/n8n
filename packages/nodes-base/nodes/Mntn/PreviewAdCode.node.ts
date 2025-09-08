import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";

export class PreviewAdCode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Preview AdCode",
    name: "previewAdCode",
    icon: "file:mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle: '{{$parameter["elementId"] || "Element"}}',
    description: "Preview adCode",
    defaults: {
      name: "Preview AdCode",
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [],
    properties: [],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      // SIMPLE: Just create preview URL with executionId
      const executionId = this.getExecutionId();
      const previewUrl = `https://vivarootlocal.mountain.com/preview/n8n?executionId=${executionId}`;

      // Return HTML for the built-in HTML node to render
      const buttonHtml = `<a href='${previewUrl}' target='_blank' style='display: block; padding: 20px; background: #28a745; color: white; text-decoration: none; text-align: center; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 10px 0;'>🚀 Preview Video</a>`;

      console.log(
        `[PreviewAdCode] Created preview URL for execution ${executionId}`,
      );

      returnData.push({
        json: {
          message: "🎬 Preview Ready!",
          previewUrl,
          executionId,
          html: buttonHtml,
        },
      });
    }

    return [returnData];
  }
}
