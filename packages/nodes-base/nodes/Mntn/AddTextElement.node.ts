import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionTypes,
} from "n8n-workflow";

export class AddTextElement implements INodeType {
  description: INodeTypeDescription = {
    displayName: "MNTN - AdCode - Add Text Element",
    name: "addTextElement",
    icon: "file:icons/mntn.svg",
    group: ["transform"],
    version: 1,
    subtitle: '{{$parameter["content"] || "Text Element"}}',
    description:
      "Create a text element object (use Attach Element to add to AdCode)",
    defaults: {
      name: "Add Text Element",
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    properties: [
      {
        displayName: "Text Content",
        name: "content",
        type: "string",
        default: "Your text here",
        description: "The text content to display",
        required: true,
      },
      {
        displayName: "Start Frame",
        name: "from",
        type: "number",
        default: 0,
        description: "Frame when the text should start appearing",
      },
      {
        displayName: "Duration (frames)",
        name: "durationInFrames",
        type: "number",
        default: 90,
        description: "How long the text should be visible (in frames)",
      },
      // Position Properties
      {
        displayName: "Position",
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
        default: 100,
        description: "Horizontal position in pixels from left edge",
      },
      {
        displayName: "Y Position",
        name: "top",
        type: "number",
        default: 100,
        description: "Vertical position in pixels from top edge",
      },
      {
        displayName: "Width",
        name: "width",
        type: "number",
        default: 400,
        description: "Width of the text element in pixels",
      },
      {
        displayName: "Height",
        name: "height",
        type: "string",
        default: "auto",
        description:
          "Height of the text element in pixels (auto for dynamic height)",
      },
      // Typography Properties
      {
        displayName: "Typography",
        name: "typographySection",
        type: "notice",
        default: "",
        displayOptions: {
          show: {},
        },
      },
      {
        displayName: "Font Size",
        name: "fontSize",
        type: "number",
        default: 24,
        description: "Font size in pixels",
      },
      {
        displayName: "Font Weight",
        name: "fontWeight",
        type: "options",
        options: [
          { name: "100 - Thin", value: 100 },
          { name: "200 - Extra Light", value: 200 },
          { name: "300 - Light", value: 300 },
          { name: "400 - Normal", value: 400 },
          { name: "500 - Medium", value: 500 },
          { name: "600 - Semi Bold", value: 600 },
          { name: "700 - Bold", value: 700 },
          { name: "800 - Extra Bold", value: 800 },
          { name: "900 - Black", value: 900 },
        ],
        default: 400,
        description: "Font weight for the text",
      },
      {
        displayName: "Font Family",
        name: "fontFamily",
        type: "string",
        default: "Arial",
        description: "Font family to use",
      },
      {
        displayName: "Text Color",
        name: "color",
        type: "color",
        default: "#ffffff",
        description: "Color of the text",
      },
      {
        displayName: "Text Align",
        name: "textAlign",
        type: "options",
        options: [
          { name: "Left", value: "left" },
          { name: "Center", value: "center" },
          { name: "Right", value: "right" },
          { name: "Justify", value: "justify" },
        ],
        default: "left",
        description: "Text alignment",
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
        displayName: "Background Color",
        name: "backgroundColor",
        type: "color",
        default: "transparent",
        description: "Background color for the text element",
      },
      {
        displayName: "Border Radius",
        name: "borderRadius",
        type: "number",
        default: 0,
        description: "Border radius in pixels",
      },
      {
        displayName: "Padding",
        name: "padding",
        type: "number",
        default: 0,
        description: "Padding in pixels",
      },
      {
        displayName: "Z-Index",
        name: "zIndex",
        type: "number",
        default: 1,
        description: "Stack order (higher numbers appear on top)",
      },
      // Font Properties
      {
        displayName: "Font Configuration",
        name: "fontSection",
        type: "notice",
        default: "Advanced font loading and configuration",
      },
      {
        displayName: "Font Family with Suffix",
        name: "fontFamilyWithSuffix",
        type: "string",
        default: "",
        description:
          "Font family name with brand suffix (e.g., 'Marcellus brand')",
      },
      {
        displayName: "Font Source URL",
        name: "fontSrc",
        type: "string",
        default: "",
        description: "URL to the font file for brand fonts",
      },
      {
        displayName: "Font Type",
        name: "fontType",
        type: "options",
        options: [
          { name: "Brand", value: "brand" },
          { name: "System", value: "system" },
          { name: "Web", value: "web" },
        ],
        default: "system",
        description: "Type of font being used",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const inputData = items[i].json;

      // Create unique ID for the element
      const elementId = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const textElement = {
        id: elementId,
        type: "text" as const,
        content: AddTextElement.buildHtmlContent(this, i),
        sequenceProps: {
          from: this.getNodeParameter("from", i) as number,
          durationInFrames: this.getNodeParameter(
            "durationInFrames",
            i,
          ) as number,
        },
        props: {
          fontSize: this.getNodeParameter("fontSize", i) as number,
          fontWeight: this.getNodeParameter("fontWeight", i) as number,
          fontFamily: this.getNodeParameter("fontFamily", i) as string,
          color: this.getNodeParameter("color", i) as string,
          textAlign: this.getNodeParameter("textAlign", i) as string,
          backgroundColor: this.getNodeParameter(
            "backgroundColor",
            i,
          ) as string,
          borderRadius: this.getNodeParameter("borderRadius", i) as number,
          padding: this.getNodeParameter("padding", i) as number,
          style: {
            position: "absolute" as const,
            left: `${this.getNodeParameter("left", i)}px`,
            top: `${this.getNodeParameter("top", i)}px`,
            width: `${this.getNodeParameter("width", i)}px`,
            height:
              (this.getNodeParameter("height", i) as string) === "auto"
                ? "auto"
                : `${this.getNodeParameter("height", i) as number}px`,
            fontSize: `${this.getNodeParameter("fontSize", i)}px`,
            fontWeight: this.getNodeParameter("fontWeight", i),
            fontFamily: this.getNodeParameter("fontFamily", i) as string,
            color: this.getNodeParameter("color", i) as string,
            textAlign: this.getNodeParameter("textAlign", i) as string,
            backgroundColor: this.getNodeParameter(
              "backgroundColor",
              i,
            ) as string,
            borderRadius: `${this.getNodeParameter("borderRadius", i)}px`,
            padding: `${this.getNodeParameter("padding", i)}px`,
            zIndex: this.getNodeParameter("zIndex", i),
          },
        },
        animations: [],
        assetId: 0,
        groupId: undefined,
        meta: {
          slateContentConfig: AddTextElement.buildSlateContentConfig(this, i),
          fontsToLoad: AddTextElement.buildFontsToLoad(this, i),
        },
      };

      // Return just the element object - AttachElement will handle adding to adCode
      returnData.push({
        json: {
          ...inputData,
          element: textElement,
          success: true,
          meta: {
            lastCreatedElement: {
              id: elementId,
              type: "text",
              content: this.getNodeParameter("content", i) as string,
            },
            nodeType: "addTextElement",
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return [returnData];
  }

  private static buildSlateContentConfig(
    context: IExecuteFunctions,
    itemIndex: number,
  ): any[] {
    const content = context.getNodeParameter("content", itemIndex) as string;
    const fontFamily = context.getNodeParameter(
      "fontFamily",
      itemIndex,
    ) as string;
    const fontFamilyWithSuffix = context.getNodeParameter(
      "fontFamilyWithSuffix",
      itemIndex,
    ) as string;
    const fontSize = context.getNodeParameter("fontSize", itemIndex) as number;
    const fontWeight = context.getNodeParameter(
      "fontWeight",
      itemIndex,
    ) as number;
    const color = context.getNodeParameter("color", itemIndex) as string;
    const textAlign = context.getNodeParameter(
      "textAlign",
      itemIndex,
    ) as string;
    const fontSrc = context.getNodeParameter("fontSrc", itemIndex) as string;
    const fontType = context.getNodeParameter("fontType", itemIndex) as string;

    // Build slate content config
    const textChild: any = {
      text: content,
      color,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle: "normal",
      textDecoration: "none",
    };

    // Add font-specific properties for brand fonts
    if (fontType === "brand" && fontSrc) {
      textChild.src = fontSrc;
      textChild.type = "brand";
      textChild.fontFamilyWithSuffix =
        fontFamilyWithSuffix || `${fontFamily} brand`;
    }

    return [
      {
        type: "paragraph",
        align: textAlign,
        children: [textChild],
        fontSize: "unset",
      },
    ];
  }

  private static buildFontsToLoad(
    context: IExecuteFunctions,
    itemIndex: number,
  ): any {
    // Build from individual font parameters
    const fontFamily = context.getNodeParameter(
      "fontFamily",
      itemIndex,
    ) as string;
    const fontWeight = context.getNodeParameter(
      "fontWeight",
      itemIndex,
    ) as number;
    const fontSrc = context.getNodeParameter("fontSrc", itemIndex) as string;
    const fontType = context.getNodeParameter("fontType", itemIndex) as string;

    if (fontType === "brand" && fontSrc && fontFamily) {
      const fontKey = `${fontFamily}-${fontType}-${fontWeight}-normal`;
      return {
        [fontKey]: {
          src: fontSrc,
          type: fontType,
          fontStyle: "normal",
          fontFamily,
          fontWeight,
        },
      };
    }

    return {};
  }

  private static buildHtmlContent(
    context: IExecuteFunctions,
    itemIndex: number,
  ): string {
    const content = context.getNodeParameter("content", itemIndex) as string;
    const fontFamily = context.getNodeParameter(
      "fontFamily",
      itemIndex,
    ) as string;
    const fontFamilyWithSuffix = context.getNodeParameter(
      "fontFamilyWithSuffix",
      itemIndex,
    ) as string;
    const fontSize = context.getNodeParameter("fontSize", itemIndex) as number;
    const fontWeight = context.getNodeParameter(
      "fontWeight",
      itemIndex,
    ) as number;
    const color = context.getNodeParameter("color", itemIndex) as string;
    const textAlign = context.getNodeParameter(
      "textAlign",
      itemIndex,
    ) as string;
    const fontType = context.getNodeParameter("fontType", itemIndex) as string;

    const finalFontFamily =
      fontFamilyWithSuffix ||
      (fontType === "brand" ? `'${fontFamily} brand'` : fontFamily);

    // Build HTML content matching the comprehensive example structure
    return `<div data-slate-editor="true" data-slate-node="value" contenteditable="false" zindex="-1" style="position: relative; white-space: pre-wrap; vertical-align: top; display: grid;"><p data-slate-node="element" style="text-align: ${textAlign}; margin: 0px; line-height: normal; "><span data-slate-node="text"><span data-slate-leaf="true" style="color: ${color}; font-size: ${fontSize}px; font-family: ${finalFontFamily}; font-weight: ${fontWeight}; font-style: normal;  font-variation-settings: &quot;wght ${fontWeight}&quot;;"><span data-slate-string="true">${content}</span></span></span></p>
</div>`;
  }
}
