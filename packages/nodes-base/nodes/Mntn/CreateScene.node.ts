import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class CreateScene implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Create Scene",
    name: "createScene",
    icon: "file:mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle:
      'Scene {{$parameter["sceneIndex"] || 0}} - {{$parameter["transitionAction"] || "instant"}}',
    description: "Create or update a scene in the AdCode structure",
    defaults: {
      name: "Create Scene",
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
        displayName: "Scene Index",
        name: "sceneIndex",
        type: "number",
        default: 0,
        description: "Index of the scene to create/update (0-based)",
      },
      {
        displayName: "Scene Duration (frames)",
        name: "durationInFrames",
        type: "number",
        default: 300,
        description: "Duration of the scene in frames",
      },
      {
        displayName: "Scene Description",
        name: "description",
        type: "string",
        default: "",
        description: "Optional description for the scene",
      },
      // Transition Properties
      {
        displayName: "Transition",
        name: "transitionSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Transition Type",
        name: "transitionAction",
        type: "options",
        options: [
          { name: "Instant", value: "instant" },
          { name: "Fade", value: "fade" },
          { name: "Slide", value: "slide" },
          { name: "Flip", value: "flip" },
          { name: "Wipe", value: "wipe" },
          { name: "Clock Wipe", value: "clockWipe" },
        ],
        default: "instant",
        description: "Type of transition to the next scene",
      },
      {
        displayName: "Transition Duration (frames)",
        name: "transitionDuration",
        type: "number",
        default: 30,
        displayOptions: {
          hide: {
            transitionAction: ["instant"],
          },
        },
        description: "Duration of the transition in frames",
      },
      {
        displayName: "Transition Direction",
        name: "transitionDirection",
        type: "options",
        options: [
          { name: "From Left", value: "from-left" },
          { name: "From Right", value: "from-right" },
          { name: "From Top", value: "from-top" },
          { name: "From Bottom", value: "from-bottom" },
          { name: "From Top Left", value: "from-top-left" },
          { name: "From Top Right", value: "from-top-right" },
          { name: "From Bottom Left", value: "from-bottom-left" },
          { name: "From Bottom Right", value: "from-bottom-right" },
        ],
        default: "from-right",
        displayOptions: {
          show: {
            transitionAction: ["slide", "flip", "wipe"],
          },
        },
        description: "Direction of the transition",
      },
      // Layout Properties
      {
        displayName: "Layout",
        name: "layoutSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Layout Type",
        name: "layoutType",
        type: "options",
        options: [
          { name: "Asset", value: "asset" },
          { name: "Products Scene", value: "products_scene" },
          { name: "End Card", value: "end_card" },
        ],
        default: "asset",
        description: "Type of scene layout",
      },
      {
        displayName: "Layout Theme",
        name: "layoutTheme",
        type: "options",
        options: [
          { name: "Light", value: "light" },
          { name: "Dark", value: "dark" },
        ],
        default: "dark",
        description: "Theme for the scene",
      },
      {
        displayName: "Layout Variant",
        name: "layoutVariant",
        type: "number",
        default: 1,
        description: "Variant number for the layout",
      },
      // Filter Properties
      {
        displayName: "Visual Effects",
        name: "effectsSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Filter Effect",
        name: "filterEffect",
        type: "string",
        default: "",
        description:
          "CSS filter effects (e.g., blur(2px), brightness(1.2), sepia(0.5))",
      },
      {
        displayName: "Filter Label",
        name: "filterLabel",
        type: "string",
        default: "",
        description: "Label for the filter effect",
      },
      // AI Properties
      {
        displayName: "AI Generation",
        name: "aiSection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "AI Objective",
        name: "aiObjective",
        type: "string",
        default: "",
        description: "Objective for AI generation of this scene",
      },
      {
        displayName: "AI Industry",
        name: "aiIndustry",
        type: "string",
        default: "",
        description: "Industry context for AI generation",
      },
      {
        displayName: "Keywords",
        name: "keywords",
        type: "string",
        default: "",
        description: "Comma-separated keywords for the scene",
      },
      {
        displayName: "Asset Type",
        name: "assetType",
        type: "options",
        options: [
          { name: "Video", value: "video" },
          { name: "Image", value: "image" },
          { name: "Mixed", value: "mixed" },
        ],
        default: "video",
        description: "Primary asset type for this scene",
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
        displayName: "Scene Locked",
        name: "isSceneLocked",
        type: "boolean",
        default: false,
        description: "Prevent modifications to this scene",
      },
      {
        displayName: "Execution ID",
        name: "executionId",
        type: "string",
        default: "",
        description:
          "Optional execution ID to use for Redis operations. If empty, uses the current execution ID",
      },
      // Dynamic Scene System
      {
        displayName: "Dynamic Scene Properties",
        name: "dynamicSection",
        type: "notice",
        default: "Complete control over scene configuration",
      },
      {
        displayName: "Custom Scene Props",
        name: "customSceneProps",
        type: "json",
        default: "{}",
        description:
          'Override any scene property: {"background": "#123", "overlay": true, "customField": "value"}',
      },
      {
        displayName: "Advanced Transition Config",
        name: "advancedTransition",
        type: "json",
        default: "{}",
        description:
          'Advanced transition: {"easing": "easeInOut", "timing": "custom", "props": {}}',
      },
      {
        displayName: "Scene Meta Override",
        name: "sceneMetaOverride",
        type: "json",
        default: "{}",
        description:
          'Custom scene metadata: {"generationPrompt": "...", "brand": {}, "customData": {}}',
      },
      {
        displayName: "Layout Override",
        name: "layoutOverride",
        type: "json",
        default: "{}",
        description:
          'Complete layout control: {"type": "custom", "variant": 5, "theme": "brand", "props": {}}',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      // REDIS ONLY: Get current adCode from Redis
      const executionIdParam = this.getNodeParameter(
        "executionId",
        i,
      ) as string;
      const executionId = executionIdParam || this.getExecutionId();
      const credentials = await this.getCredentials("creativeSuiteApi");
      const apiUrl = credentials.apiUrl as string;
      const apiKey = credentials.apiKey as string;

      const response = await axios.get(
        `${apiUrl}/trpc/n8n.getExecutionAdCode?input=${encodeURIComponent(JSON.stringify({ executionId }))}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000,
        },
      );

      const adCode = response.data?.result?.data;
      if (!adCode) {
        throw new Error(
          "No adCode found in Redis. Please run Initialize AdCode node first.",
        );
      }

      console.log(
        `[CreateScene] Retrieved adCode from Redis for execution ${executionId}`,
      );
      const sceneIndex = this.getNodeParameter("sceneIndex", i) as number;
      const transitionAction = this.getNodeParameter(
        "transitionAction",
        i,
      ) as string;

      // Parse dynamic properties
      const customScenePropsStr = this.getNodeParameter(
        "customSceneProps",
        i,
      ) as string;
      const advancedTransitionStr = this.getNodeParameter(
        "advancedTransition",
        i,
      ) as string;
      const sceneMetaOverrideStr = this.getNodeParameter(
        "sceneMetaOverride",
        i,
      ) as string;
      const layoutOverrideStr = this.getNodeParameter(
        "layoutOverride",
        i,
      ) as string;

      let customSceneProps,
        advancedTransition,
        sceneMetaOverride,
        layoutOverride;
      try {
        customSceneProps = customScenePropsStr
          ? JSON.parse(customScenePropsStr)
          : {};
        advancedTransition = advancedTransitionStr
          ? JSON.parse(advancedTransitionStr)
          : {};
        sceneMetaOverride = sceneMetaOverrideStr
          ? JSON.parse(sceneMetaOverrideStr)
          : {};
        layoutOverride = layoutOverrideStr ? JSON.parse(layoutOverrideStr) : {};
      } catch (e) {
        throw new Error("Invalid JSON in dynamic scene properties");
      }

      // Create scene ID
      const sceneId = `scene-${sceneIndex}`;

      // Build transition object with dynamic support
      const transition: any = {
        action: transitionAction,
        ...advancedTransition, // Override with advanced config
      };

      if (
        transitionAction !== "instant" &&
        !advancedTransition.durationInFrames
      ) {
        transition.durationInFrames = this.getNodeParameter(
          "transitionDuration",
          i,
        ) as number;
      }

      if (
        ["slide", "flip", "wipe"].includes(transitionAction) &&
        !advancedTransition.direction
      ) {
        transition.direction = this.getNodeParameter(
          "transitionDirection",
          i,
        ) as string;
      }

      // Build filter object
      const filterEffect = this.getNodeParameter("filterEffect", i) as string;
      const filter = filterEffect
        ? {
            label:
              (this.getNodeParameter("filterLabel", i) as string) ||
              "Custom Filter",
            value: {
              filter: filterEffect,
            },
          }
        : undefined;

      // Parse keywords
      const keywordsString = this.getNodeParameter("keywords", i) as string;
      const keywords = keywordsString
        ? keywordsString
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k)
        : [];

      // Create new scene with dynamic properties (always additive)
      const baseLayout = {
        type: this.getNodeParameter("layoutType", i) as
          | "asset"
          | "products_scene"
          | "end_card",
        theme: this.getNodeParameter("layoutTheme", i) as "light" | "dark",
        variant: this.getNodeParameter("layoutVariant", i) as number,
        ...layoutOverride, // Override with dynamic layout
      };

      const baseMeta = {
        isSceneLocked: this.getNodeParameter("isSceneLocked", i) as boolean,
        assetType: this.getNodeParameter("assetType", i) as string,
        ...sceneMetaOverride, // Override with dynamic meta
      };

      const scene = {
        id: sceneId,
        type: "scene" as const,
        elements: [], // Always start with empty elements - additive approach
        sequenceProps: {
          durationInFrames: this.getNodeParameter(
            "durationInFrames",
            i,
          ) as number,
        },
        transition,
        description: this.getNodeParameter("description", i) as string,
        aiObjective: this.getNodeParameter("aiObjective", i) as string,
        aiIndustry: this.getNodeParameter("aiIndustry", i) as string,
        keywords: keywords.length > 0 ? keywords : undefined,
        filter,
        layout: baseLayout,
        meta: baseMeta,
        ...customSceneProps, // Override any scene property dynamically
      };

      adCode.scenes.scenes[sceneIndex] = scene;

      // Store updated adCode back to Redis
      await axios.post(
        `${apiUrl}/trpc/n8n.storeExecutionAdCode`,
        { executionId, adCode },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000,
        },
      );

      console.log(
        `[CreateScene] Updated adCode in Redis for execution ${executionId}`,
      );

      returnData.push({
        json: {
          success: true,
          executionId,
          sceneCreated: {
            index: sceneIndex,
            id: sceneId,
          },
          meta: {
            nodeType: "createScene",
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return [returnData];
  }
}
