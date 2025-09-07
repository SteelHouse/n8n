import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";

export class AddVideoElement3 implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Add Video Element3",
    name: "addVideoElement3",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle: '{{$parameter["src"] || "Video Element3"}}',
    description:
      "Create a video element object with enhanced features (use Attach Element to add to AdCode)",
    defaults: {
      name: "Add Video Element3",
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: "creativeSuiteApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Video Source URL",
        name: "src",
        type: "string",
        default: "",
        description:
          "URL or path to the video file (optional - will use placeholder if empty)",
        required: false,
      },
      {
        displayName: "Asset ID",
        name: "assetId",
        type: "number",
        default: 0,
        description: "Internal asset ID for tracking",
      },
      {
        displayName: "Asset Name",
        name: "assetName",
        type: "string",
        default: "",
        description: "Name for the video asset",
      },
      {
        displayName: "Start Frame",
        name: "from",
        type: "number",
        default: 0,
        description: "Frame when the video should start appearing",
      },
      {
        displayName: "Duration (frames)",
        name: "durationInFrames",
        type: "number",
        default: 900,
        description: "How long the video should be visible (in frames)",
      },
      // Position Properties
      {
        displayName: "Position & Size",
        name: "positionSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "X Position",
        name: "left",
        type: "number",
        default: 0,
        description: "Horizontal position in pixels from left edge",
      },
      {
        displayName: "Y Position",
        name: "top",
        type: "number",
        default: 0,
        description: "Vertical position in pixels from top edge",
      },
      {
        displayName: "Width",
        name: "width",
        type: "number",
        default: 1920,
        description: "Width of the video element in pixels",
      },
      {
        displayName: "Height",
        name: "height",
        type: "number",
        default: 1080,
        description: "Height of the video element in pixels",
      },
      {
        displayName: "Object Fit",
        name: "objectFit",
        type: "options",
        options: [
          { name: "Cover", value: "cover" },
          { name: "Contain", value: "contain" },
          { name: "Fill", value: "fill" },
          { name: "Scale Down", value: "scale-down" },
          { name: "None", value: "none" },
        ],
        default: "cover",
        description: "How the video should be resized to fit its container",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const inputData = items[i].json;
      const inputSrc = this.getNodeParameter("src", i) as string;
      let finalAssetId = this.getNodeParameter("assetId", i) as number;
      let finalSrc =
        inputSrc ||
        `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`;
      let isPlaceholder = !inputSrc || inputSrc.trim().length === 0;

      // Generate placeholder asset ID if needed
      if (!finalAssetId) {
        finalAssetId = Date.now() + Math.floor(Math.random() * 1000);
      }

      // Create unique ID for the element
      const elementId = `video3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const videoElement = {
        id: elementId,
        type: "video" as const,
        src: finalSrc,
        assetId: finalAssetId,
        sequenceProps: {
          from: this.getNodeParameter("from", i) as number,
          durationInFrames: this.getNodeParameter(
            "durationInFrames",
            i,
          ) as number,
        },
        props: {
          style: {
            position: "absolute" as const,
            left: `${this.getNodeParameter("left", i)}px`,
            top: `${this.getNodeParameter("top", i)}px`,
            width: `${this.getNodeParameter("width", i)}px`,
            height: `${this.getNodeParameter("height", i)}px`,
            objectFit: this.getNodeParameter("objectFit", i) as string,
          },
        },
        animations: [],
        groupId: undefined,
        meta: {
          isPlaceholder,
          assetName: this.getNodeParameter("assetName", i) as string,
        },
      };

      // Return just the element object - AttachElement will handle adding to adCode
      returnData.push({
        json: {
          ...inputData,
          element: videoElement,
          success: true,
          meta: {
            lastCreatedElement: {
              id: elementId,
              type: "video",
              src: finalSrc,
              assetId: finalAssetId,
              isPlaceholder,
            },
            nodeType: "addVideoElement3",
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return [returnData];
  }
}
