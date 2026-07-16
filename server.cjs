var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiInstance = null;
function getAI() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it in the Secrets panel.");
    }
    aiInstance = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}
app.post("/api/ai/drug-info", async (req, res) => {
  const { drugName } = req.body;
  if (!drugName || typeof drugName !== "string") {
    return res.status(400).json({ error: "Drug name is required" });
  }
  try {
    const ai = getAI();
    const prompt = `Search for medical information about the drug named "${drugName}". Get its correct spelling, generic chemical name, typical category, standard dosage strength, form, normal daily regimen frequency, standard course duration, food relation, and clinical instructions. Must return exactly matching the schema.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional medical pharmacology assistant. Return accurate and clinically sound default drug values.",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            name: { type: import_genai.Type.STRING, description: "Corrected or formatted brand/commercial name of the drug" },
            genericName: { type: import_genai.Type.STRING, description: "Generic/chemical name" },
            category: { type: import_genai.Type.STRING, description: "Drug class/therapeutic category" },
            defaultDose: { type: import_genai.Type.STRING, description: "Typical default dose, e.g. 500 mg, 10 mg" },
            form: {
              type: import_genai.Type.STRING,
              description: "Medication formulation. MUST be one of: Tablet, Capsule, Syrup, Injection, Inhaler, Drops, Ointment, Other"
            },
            defaultRegimen: { type: import_genai.Type.STRING, description: "Typical daily regimen, e.g., 1-0-1, 1-1-1, 0-0-1, 1-0-0" },
            defaultDuration: { type: import_genai.Type.STRING, description: "Typical course duration, e.g., 5 days, 3 days, 30 days" },
            foodRelation: {
              type: import_genai.Type.STRING,
              description: "Relation to food. MUST be one of: Before Food, After Food, With Food, Anytime"
            },
            instructions: { type: import_genai.Type.STRING, description: "Safety guidance or common patient instructions" }
          },
          required: ["name", "genericName", "category", "defaultDose", "form", "defaultRegimen", "defaultDuration", "foodRelation", "instructions"]
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini");
    }
    const drugInfo = JSON.parse(text);
    return res.json({ success: true, data: drugInfo });
  } catch (error) {
    console.error("Gemini drug-info error:", error);
    return res.status(500).json({
      error: error.message || "Failed to fetch drug information from AI",
      fallback: {
        name: drugName,
        genericName: "Not found",
        category: "General",
        defaultDose: "500 mg",
        form: "Tablet",
        defaultRegimen: "1-0-1",
        defaultDuration: "5 days",
        foodRelation: "After Food",
        instructions: "Take as directed by doctor."
      }
    });
  }
});
app.post("/api/ai/suggest-treatment", async (req, res) => {
  const { complaints, diagnosis } = req.body;
  if (!complaints && !diagnosis) {
    return res.status(400).json({ error: "Either chief complaints or diagnosis is required" });
  }
  try {
    const ai = getAI();
    const prompt = `Formulate a clinical treatment plan including standard, widely-accepted medications, patient dietary/rest advice, recommended lab investigations, and follow-up schedules.
    Chief Complaints: ${complaints || "None specified"}
    Diagnosis/Findings: ${diagnosis || "None specified"}
    Provide standard prescriptions with standard doses and frequencies. Return exactly matching the schema.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert physician helping another doctor formulate a clean, professional prescription template. Only recommend safe, widely used standard medical treatments and clear, helpful non-pharmacological advice.",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            suggestions: {
              type: import_genai.Type.ARRAY,
              description: "Standard drug prescriptions for the diagnosis",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  name: { type: import_genai.Type.STRING, description: "Common commercial/brand name, e.g. Paracetamol" },
                  genericName: { type: import_genai.Type.STRING, description: "Generic name, e.g. Acetaminophen" },
                  form: {
                    type: import_genai.Type.STRING,
                    description: "Medication formulation. MUST be one of: Tablet, Capsule, Syrup, Injection, Inhaler, Drops, Ointment, Other"
                  },
                  strength: { type: import_genai.Type.STRING, description: "Standard dose, e.g. 650 mg, 500 mg, 10 ml" },
                  regimen: { type: import_genai.Type.STRING, description: "Regimen schedule, e.g. 1-0-1, 1-1-1, 0-0-1, 1-0-0, Once daily" },
                  duration: { type: import_genai.Type.STRING, description: "Standard course duration, e.g. 3 days, 5 days, 10 days" },
                  foodRelation: {
                    type: import_genai.Type.STRING,
                    description: "Relation to food. MUST be one of: Before Food, After Food, With Food, Anytime"
                  },
                  instructions: { type: import_genai.Type.STRING, description: "Brief instruction for the patient" }
                },
                required: ["name", "genericName", "form", "strength", "regimen", "duration", "foodRelation", "instructions"]
              }
            },
            advice: {
              type: import_genai.Type.ARRAY,
              description: "General patient instructions, lifestyle, or dietary tips",
              items: { type: import_genai.Type.STRING }
            },
            investigations: {
              type: import_genai.Type.ARRAY,
              description: "Recommended laboratory tests or scans, if any",
              items: { type: import_genai.Type.STRING }
            },
            followUp: { type: import_genai.Type.STRING, description: 'Suggested follow-up timeline, e.g. "In 5 days", "In 1 week"' }
          },
          required: ["suggestions", "advice", "investigations", "followUp"]
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini");
    }
    const plan = JSON.parse(text);
    return res.json({ success: true, data: plan });
  } catch (error) {
    console.error("Gemini suggest-treatment error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate clinical treatment plan",
      fallback: {
        suggestions: [],
        advice: ["Rest well and drink plenty of fluids.", "Seek immediate medical care if symptoms worsen."],
        investigations: [],
        followUp: "In 3-5 days if symptoms persist"
      }
    });
  }
});
var assetlinks = [
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "in.newtons.cms.twa",
      "sha256_cert_fingerprints": [
        "CC:2E:7B:67:A2:2F:F2:97:87:53:3C:07:EF:6F:00:D5:EB:C6:A0:F9:84:90:AE:EB:92:63:FF:F6:79:8E:6B:B9"
      ]
    }
  }
];
app.get("/.well-known/assetlinks.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(assetlinks);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath, { dotfiles: "allow" }));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start fullstack server:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
