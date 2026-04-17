// src/constants.ts
const CHEMISTRY_QUESTIONS = [
  {
    slide: 1,
    topic: "Molarity Calculation",
    text: "Calculate the molarity of a solution containing 5g of N.A.O.H. in 450 mL solution.",
    options: ["A) 0.5 M", "B) 1.5 M", "C) 0.278 M", "D) 2.05 M"],
    answer: "c",
    script_data: [
      {
        time_segment: "00:00-00:04",
        voiceover_hinglish: "Chalo bacchon, question 1 solve karte hain!",
        pen_action: "intro",
        visual_focus: "Slide 1 Header"
      },
      {
        time_segment: "00:15-00:25",
        voiceover_hinglish: "Sabse pehle dekh lo, Mass of N.A.O.H. given hai humein 5 grams.",
        pen_action: "Write Math 0: Given -> Mass (W) = 5g",
        visual_focus: "Row 1"
      },
      {
        time_segment: "00:25-00:35",
        voiceover_hinglish: "Uske baad likho, Volume diya hai four fifty mililiters, isko liters mein convert kar lete hain.",
        pen_action: "Write Math 1: Volume (V) = 450 mL = 0.45 L",
        visual_focus: "Row 2"
      },
      {
        time_segment: "00:35-00:45",
        voiceover_hinglish: "N.A.O.H. ka molar mass toh pata hi hoga, that is 40. Toh pehle moles nikalo, weight divided by molar mass.",
        pen_action: "Write Math 2: Molar Mass (m) = 40 g/mol",
        visual_focus: "Row 3"
      },
      {
        time_segment: "00:45-00:55",
        voiceover_hinglish: "Yes, 5 divided by 40 hota hai zero point one two five moles. Pura concentration se focus karo yahan pe.",
        pen_action: "Write Math 3: Moles(n) = 5 / 40 = 0.125 mol",
        visual_focus: "Row 4"
      },
      {
        time_segment: "00:55-01:05",
        voiceover_hinglish: "Formula lagao simple sa: Molarity barabar Moles divided by Volume in Liters.",
        pen_action: "Write Math 4: Formula: Molarity (M) = n / V",
        visual_focus: "Row 5"
      },
      {
        time_segment: "01:05-01:15",
        voiceover_hinglish: "Values put karne ke baad humara Molaarity nikal ke aa jayega lagbhag zero point two seven eight molar.",
        pen_action: "Write Math 5: M = 0.125 / 0.45 = 0.278 M",
        visual_focus: "Row 6"
      },
      {
        time_segment: "01:15-01:25",
        voiceover_hinglish: "Option C perfect answer hai baccho, aage badhte hain next question ki taraf.",
        pen_action: "Underline ROW 5  and draw circle",
        visual_focus: "Row 6"
      }
    ]
  }
];

const MATHS_QUESTIONS = [
  {
    slide: 1,
    topic: "Definite Integration",
    text: "Find the value of the integral from 0 to pi/4 of tan^2(x) dx.",
    options: ["A) 1 - pi/4", "B) 1 + pi/4", "C) pi/4", "D) 0"],
    answer: "a",
    script_data: [
      {
        time_segment: "00:00-00:04",
        voiceover_hinglish: "Chalo bacchon, question 1 solve karte hain!",
        pen_action: "intro",
        visual_focus: "Slide 1 Header"
      },
      {
        time_segment: "00:15-00:25",
        voiceover_hinglish: "Humein calculate karna hai integral of tan square x dx.",
        pen_action: "Write Math 0: I = Integral [0 to pi/4] tan^2(x) dx",
        visual_focus: "Row 1"
      },
      {
        time_segment: "00:25-00:35",
        voiceover_hinglish: "Lekin tan square x ka direct integration nahi hota. Basic identity lagayenge, tan square x barabar sec square x minus 1.",
        pen_action: "Write Math 1: Using tan^2(x) = sec^2(x) - 1",
        visual_focus: "Row 2"
      },
      {
        time_segment: "00:35-00:45",
        voiceover_hinglish: "Isko substitute karo. Toh integral ban jayega sec square x dx minus 1 dx.",
        pen_action: "Write Math 2: I = Integral (sec^2(x) - 1) dx",
        visual_focus: "Row 3"
      },
      {
        time_segment: "00:45-00:55",
        voiceover_hinglish: "Sec square x ka integration hota hai tan x, aur 1 ka x. Limits lagao zero se pi/4.",
        pen_action: "Write Math 3: I = [tan(x) - x] from 0 to pi/4",
        visual_focus: "Row 4"
      },
      {
        time_segment: "00:55-01:05",
        voiceover_hinglish: "Upper limit put karenge toh aayega 1 minus pi/4, lower limit pe zero. Final answer 1 minus pi/4.",
        pen_action: "Write Math 4: I = (1 - pi/4) - (0) = 1 - pi/4",
        visual_focus: "Row 5"
      },
      {
        time_segment: "01:05-01:15",
        voiceover_hinglish: "Option A correct ho gaya bacchon, perfect!",
        pen_action: "Underline ROW 4  and draw circle",
        visual_focus: "Row 5"
      }
    ]
  }
];

const PHYSICS_QUESTIONS = [
  {
    slide: 1,
    topic: "Work Energy Theorem",
    text: "A force F = 5x N acts on a particle. Find the work done moving it from x=0 to x=2m.",
    options: ["A) 5 J", "B) 10 J", "C) 15 J", "D) 20 J"],
    answer: "b",
    script_data: [
      {
        time_segment: "00:00-00:04",
        voiceover_hinglish: "Chalo bacchon, question 1 solve karte hain!",
        pen_action: "intro",
        visual_focus: "Slide 1 Header"
      },
      {
        time_segment: "00:15-00:25",
        voiceover_hinglish: "Humein force equation di gayi hai f barabar five x newton.",
        pen_action: "Write Math 0: Given -> F = 5x N",
        visual_focus: "Row 1"
      },
      {
        time_segment: "00:25-00:35",
        voiceover_hinglish: "Work done by variable force nikalne ke liye humein integration aana chahiye. Formula hai Integral F d x .",
        pen_action: "Write Math 1: Formula -> W = Integral (F dx)",
        visual_focus: "Row 2"
      },
      {
        time_segment: "00:35-00:45",
        voiceover_hinglish: "Limits hain zero se two meters. Toh Integral five x d x from limits zero to two.",
        pen_action: "Write Math 2: W = Integral [0 to 2] (5x) dx",
        visual_focus: "Row 3"
      },
      {
        time_segment: "00:45-00:55",
        voiceover_hinglish: "Five constant hai, x ka integration x square by two aata hai.",
        pen_action: "Write Math 3: W = 5 [x^2 / 2] from 0 to 2",
        visual_focus: "Row 4"
      },
      {
        time_segment: "00:55-01:05",
        voiceover_hinglish: "Upper limit do put karo, 2 squared is 4, 4 by 2 is 2. So 5 into 2 is 10 joules.",
        pen_action: "Write Math 4: W = 5 * (4/2) = 10 J",
        visual_focus: "Row 5"
      },
      {
        time_segment: "01:05-01:15",
        voiceover_hinglish: "Final work done hua humara 10 Joules. Option B dhyan se tick karo. Samjhe ki nahi?",
        pen_action: "Underline ROW 4  and draw circle",
        visual_focus: "Row 5"
      }
    ]
  }
];

const BIOLOGY_QUESTIONS = [
  {
    slide: 1,
    topic: "Genetics Cross",
    text: "In a monohybrid cross of tall (Tt) and dwarf (tt) plants, what is the phenotypic ratio?",
    options: ["A) 3:1", "B) 1:2:1", "C) 1:1", "D) 9:3:3:1"],
    answer: "c",
    script_data: [
      {
        time_segment: "00:00-00:04",
        voiceover_hinglish: "Chalo bacchon, question 1 solve karte hain!",
        pen_action: "intro",
        visual_focus: "Slide 1 Header"
      },
      {
        time_segment: "00:15-00:25",
        voiceover_hinglish: "Cross diya gaya hai heterogeneous tall T, t into homozygous dwarf t, t .",
        pen_action: "Write Math 0: Cross -> (Tt) x (tt)",
        visual_focus: "Row 1"
      },
      {
        time_segment: "00:25-00:35",
        voiceover_hinglish: "Punnett square socho. Gametes honge capital T small t from first parent, aur small t from second parent.",
        pen_action: "Write Math 1: Gametes -> (T, t) x (t)",
        visual_focus: "Row 2"
      },
      {
        time_segment: "00:35-00:45",
        voiceover_hinglish: "Progeny banegi capital T small t jo ki tall honge, aur small t small t jo dwarf honge.",
        pen_action: "Write Math 2: Offspring -> 50% Tt (Tall), 50% tt (Dwarf)",
        visual_focus: "Row 3"
      },
      {
        time_segment: "00:45-00:55",
        voiceover_hinglish: "Ratio dekho? 50% Tall and 50% Dwarf, iska matlab one is to one ka ratio hai.",
        pen_action: "Write Math 3: Ratio = 1:1",
        visual_focus: "Row 4"
      },
      {
        time_segment: "00:55-01:05",
        voiceover_hinglish: "So phenotypic aur genotypic ratio is test cross ka 1:1 rahega. Option C is correct.",
        pen_action: "Underline ROW 3  and draw circle",
        visual_focus: "Row 4"
      }
    ]
  }
];

export const SUBJECT_MAP = {
    Chemistry: CHEMISTRY_QUESTIONS,
    Mathematics: MATHS_QUESTIONS,
    Physics: PHYSICS_QUESTIONS,
    Biology: BIOLOGY_QUESTIONS
};

export const SAMPLE_QUESTIONS = CHEMISTRY_QUESTIONS; // Default fallback

export const VOICE_PREVIEWS = {
  natural: "Dekho bacchon, aaj hum solutions chapter ke important PYQs solve karenge. Dhyan se sunna.",
  energetic: "Hello bacchon! Kaise ho sab! Chalo phodte hain aaj ke questions ko, full energy ke saath!",
  calm: "Let's carefully read the question. Step by step, we will analyze the given values and find the answer.",
  hindi: "Toh yaar, is question mein humse molarity pucha gaya hai. Simple formula lagayenge aur answer nikal lenge."
};
