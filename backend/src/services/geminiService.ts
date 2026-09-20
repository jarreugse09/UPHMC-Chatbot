import { GoogleGenerativeAI } from "@google/generative-ai";
import { IConversationMessage } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);
const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// ---------------------------------------------------------------------------
// SYSTEM INSTRUCTION
// ---------------------------------------------------------------------------
// Facts stay consistent across rephrasings; wording adapts to what's asked.
// This replaces the old "always repeat exact same wording" rule, which is
// what caused the bot to paste an identical block even after a user
// clarified their question (e.g. asking for "names" then "current ones").
const SYSTEM_INSTRUCTION = `You are "Perps," the AI chatbot for the University of Perpetual Help System DALTA – Molino Campus. You assist students, faculty, and visitors with questions about basic education (Kindergarten, Grade School, Junior High School, Senior High School), college programs, admissions, academics, campus services, events, and general school information.

Tone: conversational and warm, not like a search engine dumping results. Stay positive, welcoming, and supportive.

Scope: if a question is unrelated to the University, reply only with "Sorry, my knowledge is limited for the University only." Do not restate or quote the user's question back to them.

Consistency rule: for facts that don't change often (names of current officials, addresses, contact details, tuition figures, programs offered, admission requirements), always state the SAME underlying facts every time you're asked, however the question is phrased — never contradict a fact you've given earlier in the conversation or invent a different figure/name on a rephrase.

Follow-up rule: this does NOT mean repeating the same paragraph verbatim. If a user asks a follow-up or clarifying question (e.g. asks for "names" after you gave roles, or says "I know it changes, tell me who's current now"), read what's actually being asked and respond to that specifically. If you don't have a piece of information (e.g., a name that isn't in your reference data), say so plainly and briefly ONCE, and point them to the registrar or official website — do not repeat the full unrelated block of information again.

Honesty rule: never fabricate a name, title, figure, or fact you don't actually have. If a name is reported but not independently confirmed, say so rather than stating it as settled fact. It's better to say "I don't have that specific information" than to guess.`;

const model = genAI.getGenerativeModel({
  model: modelName,
  systemInstruction: SYSTEM_INSTRUCTION,
});

const generationConfig = {
  temperature: 0.8,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// ---------------------------------------------------------------------------
// RESPONSE FORMATTING
// ---------------------------------------------------------------------------
const RESPONSE_FORMAT_INSTRUCTION =
  "Format the answer as clean Markdown where it improves readability: " +
  "use short headings for multi-section answers, bold for key terms/names, " +
  "bullet or numbered lists for steps or multiple items, Markdown tables " +
  "for comparisons (e.g. tuition, program lists), and blockquotes only for " +
  "directly cited policy text. For short conversational replies (greetings, " +
  "one-line answers), skip Markdown structure entirely and just write a " +
  "normal sentence or two.";

// ---------------------------------------------------------------------------
// KNOWN-ANSWER LOOKUP (source of truth, bypasses the model entirely)
// ---------------------------------------------------------------------------
interface KnownAnswer {
  aliases: string[];
  answer: string;
}

const normalizeQuestion = (question: string) =>
  question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const KNOWN_ANSWERS: KnownAnswer[] = [
  {
    aliases: [
      "what is the tuition fee for bs computer science",
      "how much is tuition for bs computer science",
      "how much is the tuition fee for computer science",
      "how much is tuition for each program",
      "what are the tuition fees for each program",
      "how much are the tuition fees",
      "how much is tuition",
      "tuition fees",
    ],
    answer: `Specific tuition fees vary by program, academic year, units, and applicable promotions. The following estimated ranges are associated with UPHSD Molino Campus. College figures are generally per semester; basic education figures are generally per year.

### College / Undergraduate Programs

| College or department | Estimated tuition range | Program examples |
| --- | ---: | --- |
| Nursing and Allied Health | ₱45,000 – ₱62,189 | BS Nursing, BS Medical Technology |
| Information Technology and Computer Studies | ₱45,000 – ₱49,715 | BS Information Technology, BS Computer Science |
| Engineering and Aviation | ₱45,000 – ₱55,000 | BS Civil Engineering, BS Electrical Engineering |
| Business, Accountancy and Hospitality | ₱35,000 – ₱45,000 | BS Accountancy, BS Business Administration, BS Hospitality Management |
| Media, Arts and Design | ₱38,000 – ₱45,000 | AB Multimedia Arts, AB Communication |
| Rehabilitation Sciences | ₱29,715 – ₱40,000 | BS Physical Therapy |
| Arts, Sciences and Education | ₱22,000 – ₱27,000 | BS Psychology, Bachelor of Secondary Education |

Many figures reflect anniversary promotional rates and may change.

### Basic Education and Senior High School

- **Kindergarten:** ₱39,900 per year under a special anniversary promotional rate
- **Grade School / Junior High School:** ₱40,000 – ₱50,000 base tuition per year
- **Senior High School, voucher recipient:** ₱10,660 – ₱14,160 estimated out-of-pocket balance after subsidy
- **Senior High School, non-voucher:** ₱28,160 – ₱35,000 per year

### Enrollment and Payment

- Initial enrollment down payment may be as low as **₱2,000**.
- College and graduate programs may offer four-part installment payments (enrollment, prelims, midterms, finals) or scheduled monthly payments.

For the latest program-specific assessment, contact the campus directly or check the [Molino admissions page](https://perpetualdalta.edu.ph/new/admissions-molino-campus/). Rates are subject to change.`,
  },
  {
    aliases: ["who made you", "who created you", "who developed you"],
    answer: "I am a chatbot for UPHSD Molino Campus, made by Jomarie Esguerra.",
  },
  {
    aliases: ["who are you", "what are you", "what is your name"],
    answer:
      "Hello there! I'm Perps, your friendly AI assistant from the University of Perpetual Help System DALTA - Molino Campus. How can I help you today? 😊",
  },
  {
    aliases: ["are you made by google"],
    answer:
      "While I run on Google's Gemini model, I was built and fine-tuned independently for UPHSD Molino Campus, not by Google directly.",
  },
  {
    aliases: ["office hours", "what are the office hours"],
    answer: `Here are the general office hours for UPHSD Molino Campus:

- **Monday to Friday:** 8:00 AM – 5:00 PM
- **Saturday:** 8:00 AM – 12:00 NN

These are typical hours — specific departments may vary slightly, so it's worth confirming with the office you plan to visit.`,
  },
  {
    aliases: [
      "where is the university located",
      "where is this located",
      "campus address",
      "how do i get to the campus",
    ],
    answer:
      "UPHSD **Molino Campus** is located at Molino Road, Molino III, City of Bacoor, Cavite, 4102.\n\nhttps://maps.app.goo.gl/LQfuuCBbX7MbALmK7",
  },
  {
    aliases: [
      "who is the current president of the university",
      "who is the president",
    ],
    answer:
      "The current President of the University of Perpetual Help System DALTA is Dr. Anthony Jose M. Tamayo.",
  },
  {
    aliases: ["who is the vice president of the university"],
    answer: "The current Vice President of UPHSD Molino is Gen. Rosendo Dial.",
  },
  {
    aliases: [
      "who is the current school director",
      "who is the school director",
    ],
    answer:
      "The current School Director of UPHSD Molino Campus is **Dr. Reno R. Rayel** (reno.rayel@perpetualdalta.edu.ph, (046) 477-0602 local 116/117).",
  },
  {
    aliases: [
      "who are the board of directors",
      "who are the important staff",
      "who are the current staff",
      "board of directors",
      "campus staff names",
      "who works at molino campus",
      "administration staff names",
    ],
    answer: `Here's what I can confirm by name for UPHSD Molino Campus:

- **Dr. Reno R. Rayel** — School Director
- **Dr. Norietta C. Tansio** — Executive Director, Office of International Student Affairs (Molino & Calamba)
- **Dr. Anthony Jose M. Tamayo** — President, UPHSD
- **Dr./BGen. Antonio L. Tamayo** — Chairman and CEO, Founder
- **Daisy M. Tamayo** — Vice Chairman and Treasurer, Co-Founder
- **LTC Richard Antonio M. Tamayo** — Secretary

I've also seen a BED Director (Dr. Erlinda A. Arguelles) and a Chief Librarian (Ms. Joyvie Arbasa) referenced for Molino, but I haven't been able to independently confirm those are current — best to verify with the campus directly.

For deans, department chairs, or other staff not listed here, please check with the relevant office or the [official Molino page](https://perpetualdalta.edu.ph/new/molino-campus-home/).`,
  },
  {
    aliases: [
      "campus facilities",
      "what are the facilities",
      "what facilities do you have",
    ],
    answer: `UPHSD Molino Campus offers:

### Academic
- Classrooms, laboratories (Science, Computer Science, Engineering, Nursing, Medical Technology), library, computer labs, simulation labs, engineering workshops

### Student Support
- Student Affairs Office, Guidance and Counseling Center, Clinic, Chapel, student lounges, gymnasium

### Other
- Auditorium, cafeteria, bookstore, administrative offices, parking, 24/7 security, multi-purpose hall, air-conditioned classrooms

Availability may vary by program. For specifics, check the [Molino Campus page](https://perpetualdalta.edu.ph/new/molino-campus-home/) or ask me about a particular facility.`,
  },
  {
    aliases: [
      "contact information",
      "how do i contact the school",
      "phone number",
      "email",
      "accounting office contact",
      "molino accounting office",
      "how do i contact accounting",
      "sales and marketing department",
      "marketing office contact",
      "molino marketing department",
      "admissions office contact",
      "how do i contact admissions",
      "registrar office contact",
      "how do i contact the registrar",
      "contact directory",
    ],
    answer: `**UPHSD Molino Campus**
Molino Road, Molino III, City of Bacoor, Cavite, 4102
General line: (046) 477-0602 / 0606 / 0621

**Admissions Office**
(046) 477-0602 local 112 / 0975-638-0017 / admission.molino@perpetualdalta.edu.ph
8:00 AM – 5:00 PM

**Registrar's Office**
(046) 477-0602 local 115 / 0917-534-6537 / registrar.molino@perpetualdalta.edu.ph
8:00 AM – 5:00 PM

**Accounting Office**
(046) 477-0602 local 111 / 0932-735-8917 / molacctg@perpetualdalta.edu.ph
8:00 AM – 5:00 PM

**Sales & Marketing Department**
(046) 477-0602 local 113, TeleFax (046) 477-0606 / 0917-866-8327 / marketing.molino@perpetualdalta.edu.ph
8:00 AM – 6:00 PM

**Human Resource Department**
hr.molino@perpetualdalta.edu.ph — (046) 477-0602 local 131

**School Director (Dr. Reno R. Rayel)**
reno.rayel@perpetualdalta.edu.ph — local 116/117

Let me know if you need a specific office and I can point you to the right one.`,
  },
  {
    aliases: ["how big is molino campus", "campus size", "how many hectares"],
    answer:
      "UPHSD Molino Campus sits on approximately **6 hectares** and serves more than 6,000 students.",
  },
  {
    aliases: [
      "how old is uphmc",
      "how old is the campus",
      "when was molino campus established",
    ],
    answer:
      "UPHSD Molino Campus was inaugurated in May 1995, making it about 31 years old as of 2026. It started with roughly 700 students and now serves more than 6,000.",
  },
  {
    aliases: [
      "admission requirements",
      "what documents do i need to enroll",
      "requirements for enrollment",
      "enrollment requirements",
    ],
    answer: `Requirements vary by level:

### Pre-Kinder & Kinder
SF 9 (if applicable), PSA Birth Certificate (2 copies), 2×2 photo (2pcs), 2 long brown envelopes, 2 long folders.

### Grade 1–6
SF 9, SF 10, PSA Birth Certificate (2 copies), 2×2 photo (2pcs), 2 long brown envelopes, 2 long folders.

### Junior High (Grade 7)
SF 9, SF 10, Certificate of Good Moral Character, PSA Birth Certificate, 2×2 photo (2pcs), 1 long brown envelope. *International students also need SSP, ACR, and authenticated school documents.*

### Junior High (Grades 8–10)
Same as Grade 7, plus ESC Certificate (if applicable) and a recommendation letter from the Principal, Adviser, or Guidance Counselor.

### Senior High (Grades 11–12)
SF 9 (and SF 10 for Grade 12), Certificate of Good Moral Character, original PSA Birth Certificate, ESC/Voucher Certificate if applicable, 2×2 photo (3pcs), 1 long brown envelope, 1 long white folder.

### College Freshmen
Original SF 9, Certificate of Good Moral Character, PSA Birth Certificate, 2×2 photo (3pcs), Ishihara/Audiometry results (Maritime programs) or Ishihara only (Dentistry/Aviation Electronics), 1 long brown envelope, 1 long white folder.

### Transferees / Degree Holders
Transcript of Records, Transfer Credential/Honorable Dismissal, Certificate of Good Moral Character, PSA Birth Certificate, 2×2 photo (3pcs), plus the same exam results as freshmen where applicable.

### Graduate School
Transcript of Records, Transfer Credential/Honorable Dismissal, Certificate of Good Moral Character, PSA Birth Certificate, PSA Marriage Certificate (if married), 2×2 photo (2pcs), 1 long brown envelope. PRC License copy required for MAN programs.

Full lists (cross-enrollees, foreign students) are on the [Molino admissions page](https://perpetualdalta.edu.ph/new/admissions-molino-campus/) — happy to detail any specific category further.`,
  },
  {
    aliases: [
      "installment plan",
      "can i pay in installments",
      "payment options",
      "how can i pay tuition",
    ],
    answer: `UPHSD offers an easy installment plan:

- **College & Graduate School:** four equal installments (enrollment, prelims, midterms, finals) or monthly installments.
- **Basic Education (Grade School/High School):** monthly, quarterly, or semi-annual.

To set this up, see the Finance and Accounting Manager or the School Director.`,
  },
  {
    aliases: [
      "how do i get my school id",
      "id processing",
      "lost id",
      "replace my id",
    ],
    answer: `### New/Replacement ID
1. Present your official Registration Form to the person handling ID processing.
2. Fill out the required form and submit it with your Registration Form.
3. Wear the prescribed uniform, and follow grooming guidelines (no dyed hair; male students: no earrings, beard/mustache shaved).
4. Double-check your printed ID details on the spot — errors reported after printing cost ₱500 to fix.
5. A damaged ID received on the day it's printed can be replaced free of charge.

### Lost ID
Get an Affidavit of Loss, pay the ₱500 ID fee at the Cashier's Office, then follow the same steps above.`,
  },
];

// ---------------------------------------------------------------------------
// FEW-SHOT EXAMPLES (style/tone calibration only — factual Qs live in
// KNOWN_ANSWERS above so they're not duplicated and can't drift out of sync)
// ---------------------------------------------------------------------------
const FEW_SHOT_CONTENTS: Array<{
  role: "user" | "model";
  parts: { text: string }[];
}> = [
  { role: "user", parts: [{ text: "Hello" }] },
  { role: "model", parts: [{ text: "Hi there! How can I help you today?" }] },
  { role: "user", parts: [{ text: "How are you?" }] },
  {
    role: "model",
    parts: [
      {
        text: "As an AI, I don't experience emotions the way humans do, but I'm ready to help with anything about UPHSD Molino Campus! What can I help you with today?",
      },
    ],
  },
  { role: "user", parts: [{ text: "How to go to mcdo from TUP" }] },
  {
    role: "model",
    parts: [
      { text: "Sorry, my knowledge is limited for the University only." },
    ],
  },
  {
    role: "user",
    parts: [
      { text: "Can you tell me how many students are currently enrolled?" },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "I don't have access to the exact real-time enrollment count — that figure changes and is kept by the registrar. You can reach out to the Registrar's Office for accurate current numbers.",
      },
    ],
  },
  { role: "user", parts: [{ text: "give me the UPH Hymn lyrics" }] },
  {
    role: "model",
    parts: [
      {
        text: "Here is the hymn of UPHSD Molino Campus:\n\n**Perpetual Help thy fount of truth**\nWhere knowledge emanates;\nWhere we have learned life will bear fruit\nFor us success awaits;\n\n**Thy children here we sing for thee;**\nWe raise our voices clear;\nWe shout and cheer in unity\nFor Alma Mater dear.\n\n**Training the mind and the heart and the hand,**\nReady to serve as best as we can;\nPerpetual Help by thy banner we stand,\nLoyal and true spread thy fame o'er the land.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export interface GroundingSource {
  uri: string;
  title: string;
}

export type GeminiStreamEvent =
  | { type: "chunk"; text: string }
  | { type: "sources"; sources: GroundingSource[] }
  | {
      type: "reliability";
      agreement: boolean;
      score: number;
      knownAnswer: string;
    };

class GeminiService {
  /** Exact/alias match against KNOWN_ANSWERS. */
  private findKnownAnswer(userMessage: string): string | null {
    const normalized = normalizeQuestion(userMessage);
    for (const entry of KNOWN_ANSWERS) {
      if (
        entry.aliases.some((alias) => normalizeQuestion(alias) === normalized)
      ) {
        return entry.answer;
      }
    }
    return null;
  }

  /**
   * Fuzzy fallback: if no exact alias matched, check whether the message is
   * close enough (word overlap) to a known question. This is what catches
   * "same question worded slightly differently" before it falls through to
   * the model and risks an inconsistent answer.
   */
  private findFuzzyKnownAnswer(
    userMessage: string,
    threshold = 0.6,
  ): { answer: string; score: number } | null {
    const normalized = normalizeQuestion(userMessage);
    let best: { answer: string; score: number } | null = null;

    for (const entry of KNOWN_ANSWERS) {
      for (const alias of entry.aliases) {
        const score = this.calculateSimilarity(
          normalized,
          normalizeQuestion(alias),
        );
        if (score >= threshold && (!best || score > best.score)) {
          best = { answer: entry.answer, score };
        }
      }
    }
    return best;
  }

  private calculateSimilarity(first: string, second: string): number {
    const firstWords = new Set(first.toLowerCase().match(/[a-z0-9]+/g) || []);
    const secondWords = new Set(second.toLowerCase().match(/[a-z0-9]+/g) || []);
    if (firstWords.size === 0 || secondWords.size === 0) return 0;

    let shared = 0;
    firstWords.forEach((word) => {
      if (secondWords.has(word)) shared += 1;
    });
    return shared / Math.max(firstWords.size, secondWords.size);
  }

  private buildContents(
    userMessage: string,
    conversationHistory: IConversationMessage[],
  ) {
    const contents = conversationHistory.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: `${userMessage}\n\n${RESPONSE_FORMAT_INSTRUCTION}` }],
    });

    return contents;
  }

  async *generateResponseStream(
    userMessage: string,
    conversationHistory: IConversationMessage[] = [],
  ): AsyncGenerator<GeminiStreamEvent, void, unknown> {
    try {
      // 1. Exact known-answer match — skip the model entirely.
      const exact = this.findKnownAnswer(userMessage);
      if (exact) {
        yield { type: "chunk", text: exact };
        yield {
          type: "reliability",
          agreement: true,
          score: 1,
          knownAnswer: exact,
        };
        return;
      }

      const contents = this.buildContents(userMessage, conversationHistory);

      console.log(
        `Calling Gemini streaming model with ${conversationHistory.length} history messages`,
      );

      const result = await model.generateContentStream({
        contents,
        generationConfig,
      });

      let receivedText = false;
      let responseText = "";
      const groundingSources = new Map<string, GroundingSource>();

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          receivedText = true;
          responseText += text;
          yield { type: "chunk", text };
        }

        const groundingChunks =
          chunk.candidates?.[0]?.groundingMetadata?.groundingChuncks;
        groundingChunks?.forEach((groundingChunk) => {
          const source = groundingChunk.web;
          if (source?.uri) {
            groundingSources.set(source.uri, {
              uri: source.uri,
              title: source.title || source.uri,
            });
          }
        });
      }

      if (groundingSources.size > 0) {
        yield {
          type: "sources",
          sources: Array.from(groundingSources.values()),
        };
      }

      // 2. Reliability check: compare the model's live answer against any
      // fuzzy-matched known answer, so the UI can flag disagreement.
      const fuzzyMatch = this.findFuzzyKnownAnswer(userMessage);
      if (fuzzyMatch) {
        const agreementScore = this.calculateSimilarity(
          responseText,
          fuzzyMatch.answer,
        );
        yield {
          type: "reliability",
          agreement: agreementScore >= 0.4,
          score: agreementScore,
          knownAnswer: fuzzyMatch.answer,
        };
      }

      if (!receivedText) {
        throw new Error("Empty response from AI model");
      }

      console.log("Gemini streaming response completed successfully");
    } catch (error: any) {
      console.error("Gemini streaming API Error:", error);
      throw new Error("Failed to generate streaming response from AI");
    }
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: IConversationMessage[] = [],
  ): Promise<string> {
    try {
      const exact = this.findKnownAnswer(userMessage);
      if (exact) return exact;

      const contents = this.buildContents(userMessage, conversationHistory);

      console.log(
        `Calling Gemini model with ${conversationHistory.length} history messages`,
      );

      const result = await model.generateContent({
        contents,
        generationConfig,
      });
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response from AI model");
      }

      console.log("Gemini API response received successfully");
      return text;
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate response from AI");
    }
  }
}

export default new GeminiService();
