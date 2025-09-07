import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";
import axios from "axios";

export class AddAnimation implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Add Animation",
    name: "addAnimation",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle:
      '{{$parameter["animationType"] || "Animation"}} - {{$parameter["elementId"] || "Element"}}',
    description: "Add animation to an element in the AdCode structure",
    defaults: {
      name: "Add Animation",
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
        displayName: "Element ID",
        name: "elementId",
        type: "string",
        default: "",
        description:
          "ID of the element to animate (leave empty to use the last added element from previous node)",
        required: false,
      },
      {
        displayName: "Animation Type",
        name: "animationType",
        type: "options",
        options: [
          // Basic animations
          { name: "Fade", value: "fade" },
          { name: "Slide", value: "slide" },
          { name: "Scale", value: "scale" },
          { name: "Pop", value: "pop" },
          { name: "Blur", value: "blur" },
          { name: "Reveal", value: "reveal" },
          { name: "Breathe", value: "breathe" },
          { name: "Float", value: "float" },
          { name: "Pan", value: "pan" },
          { name: "Pulse", value: "pulse" },
          { name: "Elastic", value: "elastic" },
          { name: "Wipe", value: "wipe" },
          // Text-specific animations
          { name: "Typewriter", value: "typewriter" },
          { name: "Ascend", value: "ascend" },
          { name: "Shift", value: "shift" },
          { name: "Merge", value: "merge" },
          { name: "Block", value: "block" },
          { name: "Burst", value: "burst" },
          { name: "Bounce", value: "bounce" },
          { name: "Roll", value: "roll" },
          { name: "Skate", value: "skate" },
          { name: "Spread", value: "spread" },
          { name: "Clarify", value: "clarify" },
        ],
        default: "fade",
        description: "Type of animation to apply",
      },
      {
        displayName: "Load Type",
        name: "load",
        type: "options",
        options: [
          { name: "In", value: "in" },
          { name: "Out", value: "out" },
          { name: "Both", value: "both" },
        ],
        default: "in",
        description: "When to apply the animation",
      },
      {
        displayName: "Duration (frames)",
        name: "durationInFrames",
        type: "number",
        default: 30,
        description: "Duration of the animation in frames",
      },
      {
        displayName: "Speed",
        name: "speed",
        type: "number",
        default: 1,
        description: "Speed multiplier for the animation",
        typeOptions: {
          minValue: 0.1,
          maxValue: 5,
          numberPrecision: 1,
        },
      },
      // Direction Properties
      {
        displayName: "Direction",
        name: "direction",
        type: "options",
        options: [
          { name: "Left", value: "left" },
          { name: "Right", value: "right" },
          { name: "Top", value: "top" },
          { name: "Bottom", value: "bottom" },
        ],
        default: "left",
        displayOptions: {
          show: {
            animationType: [
              "slide",
              "reveal",
              "float",
              "shift",
              "block",
              "wipe",
            ],
          },
        },
        description: "Direction of the animation",
      },
      {
        displayName: "From Direction",
        name: "fromDirection",
        type: "options",
        options: [
          { name: "From Left", value: "fromLeft" },
          { name: "From Right", value: "fromRight" },
          { name: "From Top", value: "fromTop" },
          { name: "From Bottom", value: "fromBottom" },
        ],
        default: "fromLeft",
        displayOptions: {
          show: {
            animationType: ["pan", "ascend"],
          },
        },
        description: "Direction the animation comes from",
      },
      // Scale Properties
      {
        displayName: "Scale",
        name: "scale",
        type: "number",
        default: 1.2,
        displayOptions: {
          show: {
            animationType: [
              "scale",
              "pop",
              "breathe",
              "pan",
              "elastic",
              "spread",
            ],
          },
        },
        description: "Scale factor for size-based animations",
        typeOptions: {
          minValue: 0.1,
          maxValue: 3,
          numberPrecision: 1,
        },
      },
      // Blur Properties
      {
        displayName: "Max Blur",
        name: "maxBlur",
        type: "number",
        default: 10,
        displayOptions: {
          show: {
            animationType: ["blur", "elastic", "clarify"],
          },
        },
        description: "Maximum blur amount in pixels",
      },
      // Text Animation Properties
      {
        displayName: "Text Element",
        name: "element",
        type: "options",
        options: [
          { name: "Character", value: "character" },
          { name: "Word", value: "word" },
          { name: "Line", value: "line" },
        ],
        default: "character",
        displayOptions: {
          show: {
            animationType: [
              "typewriter",
              "ascend",
              "shift",
              "merge",
              "burst",
              "bounce",
              "roll",
              "skate",
              "spread",
              "clarify",
            ],
          },
        },
        description: "Text unit to animate",
      },
      {
        displayName: "Color",
        name: "color",
        type: "color",
        default: "#ffffff",
        displayOptions: {
          show: {
            animationType: ["block"],
          },
        },
        description: "Color for block animation overlay",
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
        displayName: "Start Time Override",
        name: "startTime",
        type: "number",
        default: 0,
        description: "Override start time (0 = use element timing)",
      },
      {
        displayName: "Strength",
        name: "strength",
        type: "options",
        options: [
          { name: "Linear", value: "linear" },
          { name: "Power 1", value: "power1" },
          { name: "Power 2", value: "power2" },
          { name: "Power 3", value: "power3" },
        ],
        default: "power2",
        description: "Easing strength for the animation",
      },
      // Dynamic Animation System
      {
        displayName: "Dynamic Animation",
        name: "dynamicSection",
        type: "notice",
        default: "Complete control over animation properties",
      },
      {
        displayName: "Custom Animation Config",
        name: "customAnimationConfig",
        type: "json",
        default: "{}",
        description:
          'Override any animation property: {"maxBlur": 15, "direction": "top", "scale": 1.5, "speed": 2.5}',
      },
      {
        displayName: "Animation Parameters",
        name: "animationParams",
        type: "json",
        default: "{}",
        description:
          'Advanced animation parameters: {"easing": "easeInOut", "delay": 0.2, "repeatCount": 2}',
      },
      {
        displayName: "Overlay Auto Visibility",
        name: "overlayAutoVisibility",
        type: "json",
        default: "{}",
        description:
          'Auto visibility config: {"from": 30, "to": 180, "currentOpacity": 1, "resting": {}}',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const inputData = items[i].json;

      // REDIS APPROACH: Fetch current adCode from Redis
      const executionId = this.getExecutionId();
      let adCode: any = null;

      try {
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

        adCode = response.data?.result?.data;
        console.log(
          `[AddAnimation] Retrieved adCode from Redis for execution ${executionId}`,
        );
      } catch (error: any) {
        console.warn(
          `[AddAnimation] Failed to retrieve adCode from Redis: ${error.message}`,
        );
        // Fallback to input data
        if (inputData.adCode) {
          adCode = JSON.parse(JSON.stringify(inputData.adCode));
          console.log(`[AddAnimation] Using fallback adCode from input`);
        } else {
          throw new Error(
            "No adCode found in Redis or input. Please run Initialize AdCode node first.",
          );
        }
      }

      if (!adCode) {
        throw new Error(
          "No adCode available. Please run Initialize AdCode node first.",
        );
      }
      const elementId = this.getNodeParameter("elementId", i) as string;

      // If elementId is empty, try to use the last added element
      const targetElementId =
        elementId || (inputData.meta as any)?.lastAddedElement?.id;

      if (!targetElementId) {
        throw new Error(
          "No element ID provided. Please specify an element ID or connect from a node that adds elements.",
        );
      }

      // Find the element in the adCode
      let targetElement: any = null;
      let targetLayer: "overlay" | "underlay" | "scene" = "scene";
      let targetSceneIndex = -1;

      // Search in overlay
      targetElement = adCode.overlay.elements.find(
        (el: any) => el.id === targetElementId,
      );
      if (targetElement) {
        targetLayer = "overlay";
      }

      // Search in underlay
      if (!targetElement) {
        targetElement = adCode.underlay.elements.find(
          (el: any) => el.id === targetElementId,
        );
        if (targetElement) {
          targetLayer = "underlay";
        }
      }

      // Search in scenes
      if (!targetElement) {
        for (
          let sceneIdx = 0;
          sceneIdx < adCode.scenes.scenes.length;
          sceneIdx++
        ) {
          const scene = adCode.scenes.scenes[sceneIdx];
          if (scene && scene.elements) {
            const foundElement = scene.elements.find(
              (el: any) => el.id === targetElementId,
            );
            if (foundElement) {
              targetElement = foundElement;
              targetLayer = "scene";
              targetSceneIndex = sceneIdx;
              break;
            }
          }
        }
      }

      if (!targetElement) {
        throw new Error(
          `Element with ID "${targetElementId}" not found in adCode.`,
        );
      }

      // Parse dynamic properties
      const customAnimationConfigStr = this.getNodeParameter(
        "customAnimationConfig",
        i,
      ) as string;
      const animationParamsStr = this.getNodeParameter(
        "animationParams",
        i,
      ) as string;
      const overlayAutoVisibilityStr = this.getNodeParameter(
        "overlayAutoVisibility",
        i,
      ) as string;

      let customAnimationConfig, animationParams, overlayAutoVisibility;
      try {
        customAnimationConfig = customAnimationConfigStr
          ? JSON.parse(customAnimationConfigStr)
          : {};
        animationParams = animationParamsStr
          ? JSON.parse(animationParamsStr)
          : {};
        overlayAutoVisibility = overlayAutoVisibilityStr
          ? JSON.parse(overlayAutoVisibilityStr)
          : {};
      } catch (e) {
        throw new Error("Invalid JSON in dynamic animation properties");
      }

      // Build animation config with complete flexibility
      const animationType = this.getNodeParameter("animationType", i) as string;
      const animation: any = {
        name: animationType,
        load: this.getNodeParameter("load", i) as "in" | "out" | "both",
        durationInFrames: this.getNodeParameter(
          "durationInFrames",
          i,
        ) as number,
        speed: this.getNodeParameter("speed", i) as number,
        strength: this.getNodeParameter("strength", i) as string,
        ...customAnimationConfig, // Override any animation property
        ...animationParams, // Add advanced parameters
      };

      // Add optional properties based on animation type
      const startTime = this.getNodeParameter("startTime", i) as number;
      if (startTime > 0) {
        animation.startTime = startTime;
      }

      // Add overlay auto visibility if provided
      if (Object.keys(overlayAutoVisibility).length > 0) {
        animation.overlayAutoVisibility = overlayAutoVisibility;
      }

      // Apply standard properties only if not overridden by custom config
      if (
        !customAnimationConfig.direction &&
        ["slide", "reveal", "float", "shift", "block", "wipe"].includes(
          animationType,
        )
      ) {
        animation.direction = this.getNodeParameter("direction", i) as string;
      }

      if (
        !customAnimationConfig.fromDirection &&
        ["pan", "ascend"].includes(animationType)
      ) {
        animation.fromDirection = this.getNodeParameter(
          "fromDirection",
          i,
        ) as string;
      }

      if (
        !customAnimationConfig.scale &&
        ["scale", "pop", "breathe", "pan", "elastic", "spread"].includes(
          animationType,
        )
      ) {
        animation.scale = this.getNodeParameter("scale", i) as number;
      }

      if (
        !customAnimationConfig.maxBlur &&
        ["blur", "elastic", "clarify"].includes(animationType)
      ) {
        animation.maxBlur = this.getNodeParameter("maxBlur", i) as number;
      }

      if (
        !customAnimationConfig.element &&
        [
          "typewriter",
          "ascend",
          "shift",
          "merge",
          "burst",
          "bounce",
          "roll",
          "skate",
          "spread",
          "clarify",
        ].includes(animationType)
      ) {
        animation.element = this.getNodeParameter("element", i) as string;
      }

      if (!customAnimationConfig.color && animationType === "block") {
        animation.color = this.getNodeParameter("color", i) as string;
      }

      // Add animation to element
      if (!targetElement.animations) {
        targetElement.animations = [];
      }
      targetElement.animations.push(animation);

      // Store updated adCode back to Redis
      try {
        const credentials = await this.getCredentials("creativeSuiteApi");
        const apiUrl = credentials.apiUrl as string;
        const apiKey = credentials.apiKey as string;

        await axios.post(
          `${apiUrl}/trpc/n8n.storeExecutionAdCode`,
          { executionId, adCode },
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
          },
        );

        console.log(
          `[AddAnimation] Updated adCode in Redis for execution ${executionId}`,
        );
      } catch (error: any) {
        console.warn(
          `[AddAnimation] Failed to update adCode in Redis: ${error.message}`,
        );
      }

      returnData.push({
        json: {
          ...(inputData as any),
          success: true,
          executionId,
          meta: {
            ...((inputData as any).meta || {}),
            lastAnimatedElement: {
              id: targetElementId,
              animationType,
              layer: targetLayer,
              sceneIndex: targetSceneIndex >= 0 ? targetSceneIndex : undefined,
            },
            nodeType: "addAnimation",
            timestamp: new Date().toISOString(),
            redisStorage: true,
          },
        },
      });
    }

    return [returnData];
  }
}
