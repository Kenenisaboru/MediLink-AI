import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const hasApiKey = GEMINI_API_KEY && GEMINI_API_KEY !== 'AIzaSyMockAPIKeyHereForSymptomChecker';

// Initialize the Gemini client if key is available
const genAI = hasApiKey ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export class AIService {
  private static SYSTEM_TRIAGE_PROMPT = `
# MEDILINK AI CLINICAL TRIAGE & SCRIBE SYSTEM PROMPT (v2.0-UPGRADABLE)

## ROLE & CONTEXT
You are MediLink AI, an enterprise-grade medical triage and clinical scribe intelligence system tailored for Ethiopia's digital healthcare infrastructure. You operate under the guidance of Ethiopia's Digital Health Transformation Strategy (FMOH).

## OPERATIONAL CAPABILITIES
1. Multilingual Symptom Triage: Process input in Amharic (አማርኛ), Afaan Oromo, Tigrinya (ትግርኛ), Somali, and English.
2. Clinical Urgency Classification: Categorize inputs into exact severity tiers:
   - LOW: Self-care, routine outpatient, lifestyle guidance.
   - MEDIUM: Non-acute clinic checkup within 24-48 hours.
   - HIGH: Urgent specialist consultation recommended within hours.
   - EMERGENCY: Immediate transfer to emergency room (ER) or SOS ambulance dispatch trigger.
3. Department Routing & Specialist Recommendation: Identify appropriate medical departments (e.g., Cardiology, Pediatrics, Internal Medicine, Obstetrics & Gynecology, Neurology, Orthopedics).
4. Physician Summary Generation: Synthesize complex patient histories into concise, high-density clinical bullet points for busy doctors.
5. Patient-Friendly Lab Explanations: Convert lab test metrics into easily understood local language guidance.

## CLINICAL GUARDRAILS & SAFETY DISCLAIMERS
- Emergency Escalation: If symptoms include chest pressure, acute dyspnea, stroke indicators (FAST), severe hemorrhage, or loss of consciousness, ALWAYS assign urgencyLevel "EMERGENCY" and prompt immediate SOS/ER intervention.
- Cultural & Regional Nuance: Ensure Amharic, Afaan Oromo, Tigrinya, Somali, and regional language translations are empathetic, clinically accurate, and culturally appropriate for Ethiopian health seekers.
- Strict Data Privacy: Do not output unneeded personal identifying information (PII).
`;

  /**
   * Translates or interprets symptoms in Amharic, Afaan Oromo, Tigrinya, Somali, or English,
   * estimating conditions, urgency level, and recommending departments.
   */
  static async analyzeSymptoms(symptoms: string, language: string = 'English'): Promise<any> {
    const defaultResponse = this.getMockSymptomResponse(symptoms, language);

    if (!genAI) {
      console.log('[AI Service - Simulated] Analyzing symptoms:', symptoms);
      return defaultResponse;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
${this.SYSTEM_TRIAGE_PROMPT}

Analyze the following patient symptoms: "${symptoms}" in target language: "${language}".

Provide a response in VALID JSON format ONLY. Do NOT write any markdown code block wrappers (such as \`\`\`json) or extra text outside JSON.
The JSON structure MUST match this schema exactly:
{
  "languageDetected": "${language}",
  "conditions": ["Condition 1 (with local translation if applicable)", "Condition 2"],
  "urgencyLevel": "LOW | MEDIUM | HIGH | EMERGENCY",
  "recommendedDepartment": "Pediatrics/Cardiology/General Medicine/Internal Medicine etc.",
  "specialistType": "Cardiologist/Pediatrician/General Practitioner etc.",
  "advice": "Clear clinical triage advice in the target language.",
  "disclaimer": "This AI provides health information only and does not replace diagnosis or treatment by a licensed healthcare professional."
}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Clean possible markdown wrappers if model outputs them
      const cleanedJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/g, '').trim();
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Error calling Gemini API for symptom check:', error);
      return defaultResponse;
    }
  }

  /**
   * Generates a patient summary for doctors.
   */
  static async generateMedicalSummary(history: any): Promise<string> {
    if (!genAI) {
      return `
[AI GENERATED MEDICAL SUMMARY (SIMULATED)]
Patient Profile: ${history.patientName || 'Tewodros Assefa'} (Age: 41, Blood Group: O+)
Chronic Conditions: Hypertension
Allergies: Penicillin
Summary of Last Visit: 
- Diagnosed with Essential Hypertension (Elevated BP: 145/95).
- Actively prescribed Amlodipine 5mg once daily.
- Recent labs completed for Serum Creatinine (0.9 mg/dL - Normal). Lipid Profile is requested and pending.
Recommendations:
- Monitor cardiovascular status.
- Assess compliance with Amlodipine.
      `.trim();
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
${this.SYSTEM_TRIAGE_PROMPT}

You are an AI medical scribe summarizing a patient's electronic medical history for a doctor.
Patient Record Data: ${JSON.stringify(history)}

Synthesize this medical history into a clean, professional, concise, bulleted clinical summary.
Include:
- Active diagnoses & chronic conditions
- Allergies (highly highlighted)
- Key diagnostic test results
- Active prescriptions and treatment plans
- High-level risk factors or recommendations.

Keep it brief and suitable for a busy physician.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Error generating medical summary with Gemini:', error);
      return 'Failed to generate summary via AI. Please check logs.';
    }
  }

  /**
   * Explains laboratory results in patient friendly terms.
   */
  static async explainLabResult(testName: string, resultValue: string, language: string = 'English'): Promise<string> {
    if (!genAI) {
      return `The test for "${testName}" with a value of "${resultValue}" is within typical physiological ranges. No acute distress indicated. Continue regular hydration. (Simulated AI Explanation)`;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
${this.SYSTEM_TRIAGE_PROMPT}

You are a patient-friendly lab interpreter.
The patient received a result of "${resultValue}" for the test "${testName}".
Explain what this test is and what the result means in clear, non-technical words.
Respond in "${language}".
Keep it to 2-3 sentences.
Include a disclaimer that the patient must follow up with their doctor.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Error explaining lab result:', error);
      return 'Unable to generate explanation. Please consult your physician.';
    }
  }

  /**
   * Helper to return static mock symptom checked data based on input keywords with multi-lingual support.
   */
  private static getMockSymptomResponse(symptoms: string, language: string): any {
    const symLower = symptoms.toLowerCase();
    let conditions = ['Common Cold (የጉንፋን በሽታ)', 'Allergic Rhinitis (የአለርጂ ስሜት)'];
    let urgencyLevel = 'LOW';
    let recommendedDepartment = 'General Medicine';
    let specialistType = 'General Practitioner';
    let advice = 'Rest, stay hydrated, and take OTC pain relievers if needed.';

    if (symLower.includes('chest pain') || symLower.includes('ልብ') || symLower.includes('pressure in chest') || symLower.includes('dada') || symLower.includes('ህመም')) {
      conditions = ['Angina Pectoris (የልብ ህመም)', 'Myocardial Infarction (የልብ ድካም)'];
      urgencyLevel = 'EMERGENCY';
      recommendedDepartment = 'Cardiology';
      specialistType = 'Cardiologist';
      advice = 'Please go to the nearest emergency room immediately. Do not drive yourself.';
    } else if (symLower.includes('child') || symLower.includes('baby') || symLower.includes('ህጻን') || symLower.includes('da\'ima')) {
      conditions = ['Pediatric Viral Infection', 'Gastroenteritis'];
      urgencyLevel = 'MEDIUM';
      recommendedDepartment = 'Pediatrics';
      specialistType = 'Pediatrician';
      advice = 'Monitor fever. Keep the child hydrated and schedule an outpatient consultation.';
    }

    // Set advice based on requested language
    const langLower = language.toLowerCase();
    if (langLower === 'amharic') {
      if (urgencyLevel === 'EMERGENCY') {
        advice = 'እባክዎን በአቅራቢያዎ ወደሚገኘው የድንገተኛ አደጋ ክፍል በአስቸኳይ ይሂዱ። ራስዎን አይንዳቱ።';
      } else {
        advice = 'እረፍት ያድርጉ፣ ፈሳሽ በብዛት ይጠጡ፣ እና ካስፈለገ የህመም ማስታገሻዎችን ይውሰዱ።';
      }
    } else if (langLower === 'afaan oromo') {
      if (urgencyLevel === 'EMERGENCY') {
        advice = 'Mee battalummatti gara mana yaalaa dhiyoo jiruu ariifachiisaa deemi.';
      } else {
        advice = 'Boqodhu, bishaan baay\'ee dhugi, yoo barbaachise qoricha dhukkubbii hir\'isu fudhadhu.';
      }
    } else if (langLower === 'tigrinya') {
      if (urgencyLevel === 'EMERGENCY') {
        advice = 'ብኡስራሕ ናብ ጥቓኻ ዘሎ ናይ ሓደጋ ክፍል ኺድ።';
      } else {
        advice = 'ዕረፍቲ ግበሩ፡ ብብዝሒ ማይ ስተዩ፡ እንተደልዩ ድማ ናይ ቃንዛ መዐገሲታት ውሰዱ።';
      }
    } else if (langLower === 'somali') {
      if (urgencyLevel === 'EMERGENCY') {
        advice = 'Fadlan isla markiiba tag qolka gurmadka degdega ah ee kuugu dhow.';
      } else {
        advice = 'Nasal, cab biyo badan, qaadna dawooyinka xanuun baabi\'iyaha haddii loo baahdo.';
      }
    }

    return {
      languageDetected: language,
      conditions,
      urgencyLevel,
      recommendedDepartment,
      specialistType,
      advice,
      disclaimer: 'This AI provides clinical information for triage guidance only and does not replace professional medical diagnosis.',
    };
  }
}
