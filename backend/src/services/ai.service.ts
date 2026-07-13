import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const hasApiKey = GEMINI_API_KEY && GEMINI_API_KEY !== 'AIzaSyMockAPIKeyHereForSymptomChecker';

// Initialize the Gemini client if key is available
const genAI = hasApiKey ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export class AIService {
  /**
   * Translates or interprets symptoms in Amharic, Afaan Oromo, or English,
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
        You are a smart clinical triage AI assistant for Ethiopia.
        Analyze the following patient symptoms: "${symptoms}" in language "${language}".
        
        Provide a response in VALID JSON format ONLY. Do not write any markdown wrappers (like \`\`\`json) or extra text.
        The JSON structure MUST look exactly like this:
        {
          "languageDetected": "English or Amharic or Afaan Oromo",
          "conditions": ["Condition A", "Condition B"],
          "urgencyLevel": "LOW or MEDIUM or HIGH or EMERGENCY",
          "recommendedDepartment": "Pediatrics/Cardiology/General Medicine etc.",
          "specialistType": "Cardiologist/Pediatrician etc.",
          "advice": "Short clinical triage advice in the patient's language.",
          "disclaimer": "This AI provides health information only and does not replace diagnosis or treatment by a licensed healthcare professional."
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Clean possible markdown wrappers if model outputs them
      const cleanedJson = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
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
      return `The test for "${testName}" with a value of "${resultValue}" is within typical physiological ranges (0.9 mg/dL). No acute distress indicated. Continue regular hydration. (Simulated AI Explanation)`;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
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
   * Helper to return static mock symptom checked data based on input keywords.
   */
  private static getMockSymptomResponse(symptoms: string, language: string): any {
    const symLower = symptoms.toLowerCase();
    let conditions = ['Common Cold (የጉንፋን በሽታ)', 'Allergic Rhinitis (የአለርጂ ስሜት)'];
    let urgencyLevel = 'LOW';
    let recommendedDepartment = 'General Medicine';
    let specialistType = 'General Practitioner';
    let advice = 'Rest, stay hydrated, and take OTC pain relievers if needed.';

    if (symLower.includes('chest pain') || symLower.includes('ልብ') || symLower.includes('pressure in chest') || symLower.includes('dada')) {
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

    // Set advice based on language
    if (language.toLowerCase() === 'amharic') {
      if (urgencyLevel === 'EMERGENCY') {
        advice = 'እባክዎን በአቅራቢያዎ ወደሚገኘው የድንገተኛ አደጋ ክፍል በአስቸኳይ ይሂዱ። ራስዎን አይንዳቱ።';
      } else {
        advice = 'እረፍት ያድርጉ፣ ፈሳሽ በብዛት ይጠጡ፣ እና ካስፈለገ የህመም ማስታገሻዎችን ይውሰዱ።';
      }
    } else if (language.toLowerCase() === 'afaan oromo') {
      if (urgencyLevel === 'EMERGENCY') {
        advice = 'Mee battalummatti gara mana yaalaa dhiyoo jiruu ariifachiisaa deemi.';
      } else {
        advice = 'Boqodhu, bishaan baay\'ee dhugi, yoo barbaachise qoricha dhukkubbii hir\'isu fudhadhu.';
      }
    }

    return {
      languageDetected: language,
      conditions,
      urgencyLevel,
      recommendedDepartment,
      specialistType,
      advice,
      disclaimer: 'This AI provides health information only and does not replace diagnosis or treatment by a licensed healthcare professional. (Simulated)',
    };
  }
}
