import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";

export class AddVideoElement implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Add Video Element",
    name: "addVideoElement",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle: '{{$parameter["src"] || "Video Element"}}',
    description:
      "Create a video element object (use Attach Element to add to AdCode)",
    defaults: {
      name: "Add Video Element",
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
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
      // Media Properties
      {
        displayName: "Media Controls",
        name: "mediaSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Volume",
        name: "volume",
        type: "number",
        default: 1,
        description: "Volume level (0-1)",
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 2,
        },
      },
      {
        displayName: "Muted",
        name: "muted",
        type: "boolean",
        default: false,
        description: "Whether the video should be muted",
      },
      {
        displayName: "Start From (seconds)",
        name: "startFrom",
        type: "number",
        default: 0,
        description: "Start playing from this time in the video (seconds)",
        typeOptions: {
          minValue: 0,
          numberPrecision: 2,
        },
      },
      {
        displayName: "Playback Rate",
        name: "playbackRate",
        type: "number",
        default: 1,
        description: "Speed of playback (1 = normal speed)",
        typeOptions: {
          minValue: 0.25,
          maxValue: 4,
          numberPrecision: 2,
        },
      },
      // Style Properties
      {
        displayName: "Styling",
        name: "stylingSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Border Radius",
        name: "borderRadius",
        type: "number",
        default: 0,
        description: "Border radius in pixels",
      },
      {
        displayName: "Opacity",
        name: "opacity",
        type: "number",
        default: 1,
        description: "Opacity of the video (0-1)",
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 2,
        },
      },
      {
        displayName: "Z-Index",
        name: "zIndex",
        type: "number",
        default: 1,
        description: "Stack order (higher numbers appear on top)",
      },
      {
        displayName: "Filter",
        name: "filter",
        type: "string",
        default: "",
        description: "CSS filter effects (e.g., blur(5px), brightness(1.2))",
      },
      // Advanced Properties
      {
        displayName: "Advanced",
        name: "advancedSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Lock Aspect Ratio",
        name: "lockAspectRatio",
        type: "boolean",
        default: true,
        description: "Whether to maintain the video aspect ratio",
      },
      {
        displayName: "Preload",
        name: "preload",
        type: "options",
        options: [
          { name: "Auto", value: "auto" },
          { name: "Metadata", value: "metadata" },
          { name: "None", value: "none" },
        ],
        default: "auto",
        description: "How much of the video to preload",
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
      const elementId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
            borderRadius: `${this.getNodeParameter("borderRadius", i)}px`,
            opacity: this.getNodeParameter("opacity", i) as number,
            zIndex: this.getNodeParameter("zIndex", i) as number,
            filter: this.getNodeParameter("filter", i) as string,
          },
          volume: this.getNodeParameter("volume", i) as number,
          muted: this.getNodeParameter("muted", i) as boolean,
          startFrom: this.getNodeParameter("startFrom", i) as number,
          playbackRate: this.getNodeParameter("playbackRate", i, 1) as number,
          preload: this.getNodeParameter("preload", i) as string,
        },
        animations: [],
        groupId: undefined,
        aspectRatio: {
          src: finalSrc,
          width: this.getNodeParameter("width", i) as number,
          height: this.getNodeParameter("height", i) as number,
        },
        meta: {
          lockAspectRatio: this.getNodeParameter(
            "lockAspectRatio",
            i,
          ) as boolean,
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
            nodeType: "addVideoElement",
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return [returnData];
  }
}
