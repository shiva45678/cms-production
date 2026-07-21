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
var import_fs = __toESM(require("fs"), 1);
import_dotenv.default.config();
function parseCSV(text) {
  const result = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\n" || char === "\r") {
        row.push(cell);
        if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
          result.push(row);
        }
        row = [];
        cell = "";
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
      } else {
        cell += char;
      }
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    result.push(row);
  }
  return result;
}
function getCorrectAnswerIndex(val) {
  const clean = val.trim().toUpperCase();
  if (clean.includes("A") || clean === "1") return 0;
  if (clean.includes("B") || clean === "2") return 1;
  if (clean.includes("C") || clean === "3") return 2;
  if (clean.includes("D") || clean === "4") return 3;
  return 0;
}
var SUBJECT_MAPPING = {
  // Anatomy
  "Anatomy": { id: "anat", name: "Anatomy", icon: "Bones", color: "bg-blue-100 text-blue-600" },
  "Abdomen": { id: "anat", name: "Anatomy", icon: "Bones", color: "bg-blue-100 text-blue-600" },
  "Embryology": { id: "anat", name: "Anatomy", icon: "Bones", color: "bg-blue-100 text-blue-600" },
  "Histology": { id: "anat", name: "Anatomy", icon: "Bones", color: "bg-blue-100 text-blue-600" },
  "Head And Neck": { id: "anat", name: "Anatomy", icon: "Bones", color: "bg-blue-100 text-blue-600" },
  "Head And Neck (1)": { id: "anat", name: "Anatomy", icon: "Bones", color: "bg-blue-100 text-blue-600" },
  "Thorax (1)": { id: "anat", name: "Anatomy", icon: "Bones", color: "bg-blue-100 text-blue-600" },
  // Physiology
  "Physiology": { id: "phys", name: "Physiology", icon: "Activity", color: "bg-red-100 text-red-600" },
  "Vestibular System": { id: "phys", name: "Physiology", icon: "Activity", color: "bg-red-100 text-red-600" },
  "Cvs": { id: "phys", name: "Physiology", icon: "Activity", color: "bg-red-100 text-red-600" },
  "Cvs(1)": { id: "phys", name: "Physiology", icon: "Activity", color: "bg-red-100 text-red-600" },
  "Excretory System": { id: "phys", name: "Physiology", icon: "Activity", color: "bg-red-100 text-red-600" },
  "General Basics": { id: "phys", name: "Physiology", icon: "Activity", color: "bg-red-100 text-red-600" },
  // Biochemistry
  "Biochemistry": { id: "bioc", name: "Biochemistry", icon: "FlaskConical", color: "bg-purple-100 text-purple-600" },
  "Carbohydrate Chemistry": { id: "bioc", name: "Biochemistry", icon: "FlaskConical", color: "bg-purple-100 text-purple-600" },
  "Lipid": { id: "bioc", name: "Biochemistry", icon: "FlaskConical", color: "bg-purple-100 text-purple-600" },
  "Protein And Amino Acids": { id: "bioc", name: "Biochemistry", icon: "FlaskConical", color: "bg-purple-100 text-purple-600" },
  "Vitamins": { id: "bioc", name: "Biochemistry", icon: "FlaskConical", color: "bg-purple-100 text-purple-600" },
  "Enzymes": { id: "bioc", name: "Biochemistry", icon: "FlaskConical", color: "bg-purple-100 text-purple-600" },
  // Pathology
  "Pathology": { id: "path", name: "Pathology", icon: "Microscope", color: "bg-green-100 text-green-600" },
  "Cell Injury": { id: "path", name: "Pathology", icon: "Microscope", color: "bg-green-100 text-green-600" },
  "Inflammation": { id: "path", name: "Pathology", icon: "Microscope", color: "bg-green-100 text-green-600" },
  "Neoplasia": { id: "path", name: "Pathology", icon: "Microscope", color: "bg-green-100 text-green-600" },
  "Rbc": { id: "path", name: "Pathology", icon: "Microscope", color: "bg-green-100 text-green-600" },
  "Bleeding And Platelet": { id: "path", name: "Pathology", icon: "Microscope", color: "bg-green-100 text-green-600" },
  // Pharmacology
  "Pharmacology": { id: "phar", name: "Pharmacology", icon: "Pill", color: "bg-yellow-100 text-yellow-600" },
  "Cns": { id: "phar", name: "Pharmacology", icon: "Pill", color: "bg-yellow-100 text-yellow-600" },
  // Microbiology
  "Microbiology": { id: "micr", name: "Microbiology", icon: "Bug", color: "bg-indigo-100 text-indigo-600" },
  "General Microbiology": { id: "micr", name: "Microbiology", icon: "Bug", color: "bg-indigo-100 text-indigo-600" },
  "Immunology": { id: "micr", name: "Microbiology", icon: "Bug", color: "bg-indigo-100 text-indigo-600" },
  // Forensic Medicine & Toxicology
  "Toxicology": { id: "fmt", name: "Forensic Medicine", icon: "Skull", color: "bg-zinc-100 text-zinc-600" },
  "Thanatology": { id: "fmt", name: "Forensic Medicine", icon: "Skull", color: "bg-zinc-100 text-zinc-600" },
  "Voilent Asphyxia": { id: "fmt", name: "Forensic Medicine", icon: "Skull", color: "bg-zinc-100 text-zinc-600" },
  "Injuries": { id: "fmt", name: "Forensic Medicine", icon: "Skull", color: "bg-zinc-100 text-zinc-600" },
  // Social & Preventive Medicine (PSM)
  "Allied Health Disciplines": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Biostatics": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Community Health In India": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Concept Of Health And Diseases": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Demography": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Environment And Health": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Family Planning": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Epidemiology": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "National Health Program": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Vaccines": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Health Education And Communication": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Health Planning": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Screening Of Disease": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "Social Science And Health": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "International Health": { id: "psm", name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  // Medicine
  "Cardiology": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Gastroenterology": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Endocrinology": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Neurology": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Nephrology": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Pulmonology": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Rehumatology": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Infectious Disease": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Oncology": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "Medmaven": { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  // Surgery
  "Surgery": { id: "surg", name: "Surgery", icon: "Scissors", color: "bg-rose-100 text-rose-600" },
  "Urology": { id: "surg", name: "Surgery", icon: "Scissors", color: "bg-rose-100 text-rose-600" },
  "Hepatobiliary And Pancreas": { id: "surg", name: "Surgery", icon: "Scissors", color: "bg-rose-100 text-rose-600" },
  "Hepatobiliary And Pancreas(1)": { id: "surg", name: "Surgery", icon: "Scissors", color: "bg-rose-100 text-rose-600" },
  "Hepatobiliarysystem (1)": { id: "surg", name: "Surgery", icon: "Scissors", color: "bg-rose-100 text-rose-600" },
  "Git": { id: "surg", name: "Surgery", icon: "Scissors", color: "bg-rose-100 text-rose-600" },
  // OBGYN
  "Obstetrics": { id: "obgy", name: "OBGYN", icon: "Baby", color: "bg-pink-100 text-pink-600" },
  "Gynecology": { id: "obgy", name: "OBGYN", icon: "Baby", color: "bg-pink-100 text-pink-600" },
  // Pediatrics
  "Pediatrics": { id: "peds", name: "Pediatrics", icon: "Baby", color: "bg-orange-100 text-orange-600" },
  // Psychiatry
  "Psychiatry": { id: "psych", name: "Psychiatry", icon: "Brain", color: "bg-pink-100 text-pink-600" },
  // Dermatology
  "Dermatology": { id: "derma", name: "Dermatology", icon: "Sparkles", color: "bg-teal-100 text-teal-600" },
  "Papulo Squamous Disorders-1": { id: "derma", name: "Dermatology", icon: "Sparkles", color: "bg-teal-100 text-teal-600" },
  "Sti": { id: "derma", name: "Dermatology", icon: "Sparkles", color: "bg-teal-100 text-teal-600" },
  // Ophthalmology
  "Ophthalmology": { id: "ophth", name: "Ophthalmology", icon: "Eye", color: "bg-sky-100 text-sky-600" },
  // ENT
  "ENT": { id: "ent", name: "ENT", icon: "Ear", color: "bg-violet-100 text-violet-600" },
  // Orthopedics
  "Orthopedics": { id: "ortho", name: "Orthopedics", icon: "Activity", color: "bg-amber-100 text-amber-600" },
  // Anesthesiology
  "Anesthesiology": { id: "anes", name: "Anesthesiology", icon: "Syringe", color: "bg-lime-100 text-lime-600" },
  "Pain Management": { id: "anes", name: "Anesthesiology", icon: "Syringe", color: "bg-lime-100 text-lime-600" },
  "Pre Anesthesic": { id: "anes", name: "Anesthesiology", icon: "Syringe", color: "bg-lime-100 text-lime-600" },
  "Monitoring In Anesthesia": { id: "anes", name: "Anesthesiology", icon: "Syringe", color: "bg-lime-100 text-lime-600" },
  "Resuistantion": { id: "anes", name: "Anesthesiology", icon: "Syringe", color: "bg-lime-100 text-lime-600" },
  "Emergency Medicine": { id: "anes", name: "Anesthesiology", icon: "Syringe", color: "bg-lime-100 text-lime-600" },
  // Radiology
  "Genitourinary Radio": { id: "radio", name: "Radiology", icon: "Scan", color: "bg-indigo-100 text-indigo-600" },
  "Thoracic Radiology": { id: "radio", name: "Radiology", icon: "Scan", color: "bg-indigo-100 text-indigo-600" }
};
var SUBJECTS_INFO = {
  "anat": { name: "Anatomy", icon: "Bones", color: "bg-blue-100 text-blue-600" },
  "phys": { name: "Physiology", icon: "Activity", color: "bg-red-100 text-red-600" },
  "bioc": { name: "Biochemistry", icon: "FlaskConical", color: "bg-purple-100 text-purple-600" },
  "path": { name: "Pathology", icon: "Microscope", color: "bg-green-100 text-green-600" },
  "phar": { name: "Pharmacology", icon: "Pill", color: "bg-yellow-100 text-yellow-600" },
  "micr": { name: "Microbiology", icon: "Bug", color: "bg-indigo-100 text-indigo-600" },
  "fmt": { name: "Forensic Medicine", icon: "Skull", color: "bg-zinc-100 text-zinc-600" },
  "psm": { name: "Social & Preventive Medicine", icon: "Globe", color: "bg-emerald-100 text-emerald-600" },
  "med": { name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" },
  "surg": { name: "Surgery", icon: "Scissors", color: "bg-rose-100 text-rose-600" },
  "peds": { name: "Pediatrics", icon: "Baby", color: "bg-orange-100 text-orange-600" },
  "psych": { name: "Psychiatry", icon: "Brain", color: "bg-pink-100 text-pink-600" },
  "derma": { name: "Dermatology", icon: "Sparkles", color: "bg-teal-100 text-teal-600" },
  "ophth": { name: "Ophthalmology", icon: "Eye", color: "bg-sky-100 text-sky-600" },
  "ent": { name: "ENT", icon: "Ear", color: "bg-violet-100 text-violet-600" },
  "ortho": { name: "Orthopedics", icon: "Activity", color: "bg-amber-100 text-amber-600" },
  "anes": { name: "Anesthesiology", icon: "Syringe", color: "bg-lime-100 text-lime-600" },
  "radio": { name: "Radiology", icon: "Scan", color: "bg-indigo-100 text-indigo-600" }
};
var IMAGE_QUESTIONS = [
  {
    id: "path_q4_img",
    subjectId: "path",
    topic: "Neoplasia",
    text: "A 24-year-old female presents with painless cervical lymphadenopathy and intermittent drenching night sweats. A lymph node biopsy is performed. Based on the histopathology shown, what is the most likely diagnosis?",
    options: ["Hodgkin Lymphoma", "Non-Hodgkin Lymphoma", "Tuberculosis Lymphadenitis", "Infectious Mononucleosis"],
    correctAnswer: 0,
    explanation: "The histology shows a classic Reed-Sternberg cell with a bi-lobed nucleus and prominent 'owl-eye' nucleoli, stained with hematoxylin and eosin (H&E). This is pathognomonic for Hodgkin Lymphoma.",
    isImageBased: true,
    imageUrl: "/src/assets/images/histology_slide_cell_1783957009366.jpg"
  },
  {
    id: "med_q3_img",
    subjectId: "med",
    topic: "Pulmonology",
    text: "A 45-year-old male presents with high fever, productive cough, and pleuritic chest pain. Chest radiograph is shown. Which of the following is the most likely causative organism for this lobar consolidation?",
    options: ["Streptococcus pneumoniae", "Mycoplasma pneumoniae", "Pneumocystis jirovecii", "Mycobacterium tuberculosis"],
    correctAnswer: 0,
    explanation: "The chest X-ray shows right middle lobe consolidation, classic for lobar pneumonia. Streptococcus pneumoniae is the most common cause of community-acquired lobar pneumonia.",
    isImageBased: true,
    imageUrl: "/src/assets/images/chest_xray_pneumonia_1783956993242.jpg"
  },
  {
    id: "anat_q4_img",
    subjectId: "anat",
    topic: "Neuroanatomy",
    text: "In the sagittal brain MRI shown, which of the following structures is responsible for coordinating motor movements, posture, and balance?",
    options: ["Corpus Callosum", "Cerebellum", "Pons", "Thalamus"],
    correctAnswer: 1,
    explanation: "The cerebellum, located at the posterior aspect of the brain below the cerebrum, is primarily responsible for motor coordination, gait, balance, and fine motor control.",
    isImageBased: true,
    imageUrl: "/src/assets/images/brain_mri_scan_1783957026179.jpg"
  }
];
function getExhibitImageForQuestion(subjectId, topic, text) {
  const textLower = text.toLowerCase();
  if (subjectId === "anat" && (topic.toLowerCase().includes("neuro") || textLower.includes("brain") || textLower.includes("cortex") || textLower.includes("nerve"))) {
    return "/src/assets/images/brain_mri_scan_1783957026179.jpg";
  }
  if (textLower.includes("mri") || textLower.includes("brain") || textLower.includes("skull") || textLower.includes("cerebell")) {
    return "/src/assets/images/brain_mri_scan_1783957026179.jpg";
  }
  if (topic.toLowerCase().includes("cardio") || textLower.includes("heart") || textLower.includes("ecg") || textLower.includes("cardiac") || textLower.includes("myocardial")) {
    return "https://images.unsplash.com/photo-1606335543042-57c525922933?auto=format&fit=crop&q=80&w=600";
  }
  if (topic.toLowerCase().includes("pulmono") || textLower.includes("pneumonia") || textLower.includes("lung") || textLower.includes("x-ray") || textLower.includes("radiograph") || textLower.includes("chest") || topic.toLowerCase().includes("radiology")) {
    return "/src/assets/images/chest_xray_pneumonia_1783956993242.jpg";
  }
  if (topic.toLowerCase().includes("histology") || textLower.includes("biopsy") || textLower.includes("cells") || textLower.includes("histopathology") || textLower.includes("microscope") || textLower.includes("smear") || textLower.includes("crystals")) {
    return "/src/assets/images/histology_slide_cell_1783957009366.jpg";
  }
  if (topic.toLowerCase().includes("osteo") || topic.toLowerCase().includes("ortho") || textLower.includes("fracture") || textLower.includes("bone") || textLower.includes("bony") || textLower.includes("pelvis") || textLower.includes("scaphoid")) {
    return "https://images.unsplash.com/photo-1516062423079-7ca13cca775f?auto=format&fit=crop&q=80&w=600";
  }
  if (topic.toLowerCase().includes("toxic") || textLower.includes("plant") || textLower.includes("herb") || textLower.includes("poison") || textLower.includes("toxin")) {
    return "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&q=80&w=600";
  }
  if (subjectId === "micr" || textLower.includes("organism") || textLower.includes("virus") || textLower.includes("bacteria") || textLower.includes("covid")) {
    return "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600";
  }
  const fallbacks = [
    "/src/assets/images/histology_slide_cell_1783957009366.jpg",
    "/src/assets/images/chest_xray_pneumonia_1783956993242.jpg",
    "/src/assets/images/brain_mri_scan_1783957026179.jpg"
  ];
  const charCodeSum = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbacks[charCodeSum % fallbacks.length];
}
var parsedQuestions = [];
var dynamicSubjects = [];
function loadDataset() {
  const qList = [];
  const subjectCounts = {};
  const subjectTopics = {};
  const csvPath = import_path.default.join(process.cwd(), "public", "questions_without_images.csv");
  if (import_fs.default.existsSync(csvPath)) {
    try {
      const content = import_fs.default.readFileSync(csvPath, "utf8");
      const rows = parseCSV(content);
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 10) continue;
        const csvSubject = row[0];
        const topic = row[1] || "General";
        const subtopic = row[2] || "General";
        const questionText = row[3];
        const explanation = row[4];
        const optionA = row[5];
        const optionB = row[6];
        const optionC = row[7];
        const optionD = row[8];
        const correctOpt = row[9];
        const mapped = SUBJECT_MAPPING[csvSubject] || { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" };
        const subjectId = mapped.id;
        const options = [optionA, optionB, optionC, optionD].map((o) => o ? o.trim() : "").filter(Boolean);
        if (options.length === 0 || !questionText) continue;
        const correctAnswer = getCorrectAnswerIndex(correctOpt);
        qList.push({
          id: `csv_q_${i}`,
          subjectId,
          topic,
          subtopic,
          text: questionText,
          options,
          correctAnswer,
          explanation: explanation || "Explanation is active recall verified.",
          isImageBased: false
        });
        subjectCounts[subjectId] = (subjectCounts[subjectId] || 0) + 1;
        if (!subjectTopics[subjectId]) {
          subjectTopics[subjectId] = /* @__PURE__ */ new Set();
        }
        subjectTopics[subjectId].add(topic);
      }
      console.log(`Successfully parsed ${qList.filter((q) => !q.isImageBased).length} text questions from CSV.`);
    } catch (e) {
      console.error("Failed to parse CSV file:", e);
    }
  } else {
    console.warn("questions_without_images.csv not found.");
  }
  const imageCsvPath = import_path.default.join(process.cwd(), "public", "questions_with_images.csv");
  if (import_fs.default.existsSync(imageCsvPath)) {
    try {
      const content = import_fs.default.readFileSync(imageCsvPath, "utf8");
      const rows = parseCSV(content);
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 10) continue;
        const csvSubject = row[0];
        const topic = row[1] || "General";
        const subtopic = row[2] || "General";
        const questionText = row[3];
        const explanation = row[4];
        const optionA = row[5];
        const optionB = row[6];
        const optionC = row[7];
        const optionD = row[8];
        const correctOpt = row[9];
        const mapped = SUBJECT_MAPPING[csvSubject] || { id: "med", name: "Medicine", icon: "Stethoscope", color: "bg-cyan-100 text-cyan-600" };
        const subjectId = mapped.id;
        const options = [optionA, optionB, optionC, optionD].map((o) => o ? o.trim() : "").filter(Boolean);
        if (options.length === 0 || !questionText) continue;
        const correctAnswer = getCorrectAnswerIndex(correctOpt);
        const imageUrl = getExhibitImageForQuestion(subjectId, topic, questionText);
        qList.push({
          id: `csv_img_q_${i}`,
          subjectId,
          topic,
          subtopic,
          text: questionText,
          options,
          correctAnswer,
          explanation: explanation || "Explanation is active recall verified.",
          isImageBased: true,
          imageUrl
        });
        subjectCounts[subjectId] = (subjectCounts[subjectId] || 0) + 1;
        if (!subjectTopics[subjectId]) {
          subjectTopics[subjectId] = /* @__PURE__ */ new Set();
        }
        subjectTopics[subjectId].add(topic);
      }
      console.log(`Successfully parsed ${qList.filter((q) => q.isImageBased).length} image-based questions from CSV.`);
    } catch (e) {
      console.error("Failed to parse image-based CSV file:", e);
    }
  } else {
    console.warn("questions_with_images.csv not found.");
  }
  IMAGE_QUESTIONS.forEach((imgQ) => {
    if (!qList.some((q) => q.id === imgQ.id)) {
      qList.push(imgQ);
      subjectCounts[imgQ.subjectId] = (subjectCounts[imgQ.subjectId] || 0) + 1;
      if (!subjectTopics[imgQ.subjectId]) {
        subjectTopics[imgQ.subjectId] = /* @__PURE__ */ new Set();
      }
      subjectTopics[imgQ.subjectId].add(imgQ.topic);
    }
  });
  dynamicSubjects = Object.keys(SUBJECTS_INFO).map((subId) => {
    const info = SUBJECTS_INFO[subId];
    return {
      id: subId,
      name: info.name,
      icon: info.icon,
      totalQuestions: subjectCounts[subId] || 0,
      color: info.color,
      topics: Array.from(subjectTopics[subId] || [])
    };
  }).filter((sub) => sub.totalQuestions > 0);
  parsedQuestions = qList;
}
loadDataset();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  app.get("/api/subjects", (req, res) => {
    res.json({ subjects: dynamicSubjects });
  });
  app.get("/api/questions", (req, res) => {
    let filtered = [...parsedQuestions];
    const { subjectIds, topic, limit, random } = req.query;
    if (subjectIds) {
      const ids = subjectIds.split(",");
      filtered = filtered.filter((q) => ids.includes(q.subjectId));
    }
    if (topic) {
      filtered = filtered.filter((q) => q.topic === topic);
    }
    if (random === "true") {
      filtered.sort(() => 0.5 - Math.random());
    }
    if (limit) {
      const lim = parseInt(limit, 10);
      if (!isNaN(lim)) {
        filtered = filtered.slice(0, lim);
      }
    }
    res.json({ questions: filtered });
  });
  app.post("/api/recommendations", async (req, res) => {
    const { performanceData } = req.body;
    const getDynamicFallbacks = () => {
      const fallbacks = [
        "Strengthen Pathology high-yield topics such as Hematopathology and Neoplasia.",
        "Your recent stats suggest focusing on Surgery (Trauma & Gastrointestinal systems).",
        "Practice daily active recall on High-Yield Anatomy diagrams during morning study slots.",
        "Attempt at least one Grand Test (GT) weekly to build real exam endurance and pacing."
      ];
      if (performanceData?.weakSubjects && performanceData.weakSubjects.length > 0) {
        return [
          `Target your weaker subjects: ${performanceData.weakSubjects.join(" and ")} with custom module practice.`,
          `Review the last 5 years' PYQs (Previous Year Questions) for ${performanceData.weakSubjects[0] || "Pathology"}.`,
          `Dedicate your morning slot to high-yield clinical scenarios in ${performanceData.weakSubjects[1] || "Surgery"}.`,
          "Simulate actual exam conditions by taking the National Grand Test (GT 24) today."
        ];
      }
      return fallbacks;
    };
    try {
      const prompt = `
        As Newtons AI, a medical education expert for NEET PG, analyze this user performance data and provide 3-4 concise, personalized improvement recommendations.
        Performance Data: ${JSON.stringify(performanceData)}
        
        Format the response as a JSON array of strings.
        Example: ["Focus more on high-yield Pathology topics like Neoplasia.", "Practice image-based questions for Dermatology."]
      `;
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      const text = result.text || "[]";
      const jsonMatch = text.match(/\[.*\]/s);
      const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : getDynamicFallbacks();
      res.json({ recommendations });
    } catch (error) {
      console.warn("Gemini Error, falling back to dynamic recommendations:", error);
      res.json({ recommendations: getDynamicFallbacks() });
    }
  });
  const assetlinks = [
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "in.newtons.neetpg.twa",
        "sha256_cert_fingerprints": [
          "F8:EE:D0:16:9F:E6:37:61:52:61:56:69:0C:57:10:A3:63:13:38:4A:F7:D5:9A:C2:2D:DE:E0:06:1C:7A:22:D2"
        ]
      }
    }
  ];
  app.get([
    "/.well-known/assetlinks.json",
    "/well-known/assetlinks.json",
    "/.well-know/assetlinks.json",
    "/well-know/assetlinks.json"
  ], (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json(assetlinks);
  });
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
