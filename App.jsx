import React, { useEffect, useMemo, useState } from "react";

const checkoutLinks = {
  instant: "https://buy.stripe.com/3cI6oH0jF4yi4vn6btg3601",
};

const STORAGE_KEY = "peakfuel_checkout_plan_v8";

const sports = [
  ["swimming", "Swimming"],
  ["track", "Track & Field"],
  ["soccer", "Soccer"],
  ["basketball", "Basketball"],
  ["football", "Football"],
  ["lifting", "Lifting"],
  ["baseball", "Baseball"],
  ["volleyball", "Volleyball"],
  ["tennis", "Tennis"],
  ["other", "Other"],
];

const sexOptions = [
  ["male", "Male"],
  ["female", "Female"],
];

const goals = [
  ["perform", "Perform Better"],
  ["gain", "Build Muscle"],
  ["maintain", "Maintain Performance"],
  ["lean", "Lean Out"],
];

const ageRanges = [
  ["13-15", "13–15"],
  ["16-18", "16–18"],
  ["19-22", "19–22"],
  ["23+", "23+"],
];

const intensityLevels = [
  ["moderate", "Moderate"],
  ["hard", "Hard"],
  ["very-hard", "Very Hard"],
];

const stomachOptions = [
  ["normal", "Normal stomach"],
  ["sensitive", "Sensitive before training"],
];

const bodyGoalOptions = [
  ["maintain", "Maintain weight"],
  ["gain", "Gain size / muscle"],
  ["lean", "Get leaner"],
];

const trainingTypeOptions = [
  ["mixed", "Mixed training"],
  ["endurance", "Mostly endurance"],
  ["power", "Mostly strength / power"],
];

const hydrationOptions = [
  ["low", "Usually underdrink"],
  ["okay", "Pretty average"],
  ["strong", "Already hydrate well"],
];

const caffeineOptions = [
  ["none", "None"],
  ["sometimes", "Sometimes"],
  ["daily", "Daily"],
];

const competitionOptions = [
  ["rare", "Rarely"],
  ["sometimes", "Sometimes"],
  ["often", "Often / in season"],
];

const eatingPatternOptions = [
  ["random", "Mostly random"],
  ["somewhat", "Somewhat structured"],
  ["structured", "Already structured"],
];

const sorenessOptions = [
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"],
];

const sweatOptions = [
  ["light", "Light sweater"],
  ["normal", "Average sweater"],
  ["heavy", "Heavy sweater / salty sweater"],
];

const digestOptions = [
  ["good", "Food sits well before training"],
  ["okay", "Sometimes fine, sometimes not"],
  ["poor", "Often feel heavy / bloated"],
];

const breakfastHabitOptions = [
  ["always", "I usually eat breakfast"],
  ["sometimes", "Sometimes"],
  ["rarely", "I usually skip it"],
];

const appetiteOptions = [
  ["low", "Low appetite"],
  ["normal", "Normal appetite"],
  ["high", "High appetite"],
];

const budgetOptions = [
  ["low", "Lower budget"],
  ["medium", "Medium budget"],
  ["high", "Flexible budget"],
];

const sessionGoalOptions = [
  ["technical", "Technique / lighter quality"],
  ["normal", "Normal training"],
  ["race", "High-quality / race pace / very demanding"],
];

const weatherOptions = [
  ["indoor", "Indoor / controlled environment"],
  ["mild", "Warm or mild outdoor conditions"],
  ["hot", "Hot / high sweat conditions"],
];

const sessionCountOptions = [
  ["1", "1 session"],
  ["2", "2 sessions"],
  ["3", "3 sessions"],
];

const sleepQualityOptions = [
  ["poor", "Poor / inconsistent"],
  ["okay", "Okay"],
  ["good", "Good / consistent"],
];

const wakeDifficultyOptions = [
  ["easy", "Wake up easily"],
  ["medium", "A little tired"],
  ["hard", "Usually exhausted"],
];

const planTiers = [
  {
    key: "instant",
    name: "PeakFuel Full System",
    price: "$4.99",
    badge: "Instant access",
    description:
      "A personalized daily fueling system built around your actual schedule, session load, hydration, digestion, sleep, and recovery needs.",
    features: [
      "Exact calorie + macro targets",
      "Hydration target in ounces",
      "Meal timing around your real day",
      "Pre, during, and post-workout system",
      "Competition / meet day version",
      "Sleep target + recovery guidance",
      "Save, print, and download included",
    ],
  },
];

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function safeNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function toMinutes(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatTime(totalMinutes) {
  if (totalMinutes == null) return "";
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function displayTimeToMinutes(displayTime) {
  if (!displayTime) return 0;
  const match = displayTime.match(/(\d+):(\d+)\s(AM|PM)/);
  if (!match) return 0;
  let h = Number(match[1]);
  const m = Number(match[2]);
  const suffix = match[3];
  if (suffix === "PM" && h !== 12) h += 12;
  if (suffix === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function niceSportLabel(sport) {
  const found = sports.find(([value]) => value === sport);
  return found ? found[1] : "Athlete";
}

function calcProgress(form) {
  const importantFields = [
    "email",
    "sport",
    "sex",
    "goal",
    "ageRange",
    "weight",
    "intensity",
    "duration",
    "trainingType",
    "wakeTime",
    "schoolStart",
    "practiceTime",
    "bedTime",
    "stomachSensitivity",
    "digestTolerance",
    "currentHydration",
    "competitionFrequency",
    "eatingPattern",
    "soreness",
    "sweatRate",
    "breakfastHabit",
    "appetite",
    "sessionGoal",
    "weatherLoad",
    "sessionCount",
    "sleepQuality",
    "wakeDifficulty",
  ];

  const completed = importantFields.filter((key) => {
    const value = form[key];
    if (typeof value === "boolean") return true;
    return String(value || "").trim() !== "";
  }).length;

  return Math.round((completed / importantFields.length) * 100);
}

function hasUserCustomized(form) {
  const defaults = {
    sport: "swimming",
    sex: "male",
    goal: "perform",
    weight: "150",
    intensity: "hard",
    duration: "90",
    practiceTime: "15:45",
    trainingType: "mixed",
    currentHydration: "okay",
    stomachSensitivity: "normal",
    sessionGoal: "normal",
    sessionCount: "1",
    sleepQuality: "okay",
  };

  return Object.entries(defaults).some(([key, value]) => form[key] !== value);
}

function getCalories(form) {
  const weight = safeNumber(form.weight, 150);
  const duration = safeNumber(form.duration, 90);
  const secondDuration = safeNumber(form.secondSessionDuration, 60);
  const thirdDuration = safeNumber(form.thirdSessionDuration, 45);
  const sessionCount = safeNumber(form.sessionCount, 1);

  let calories = weight * (form.sex === "female" ? 14 : 15);

  if (form.sport === "swimming") calories += 120;
  if (form.trainingType === "endurance") calories += 170;
  if (form.trainingType === "power") calories += 90;
  if (form.intensity === "hard") calories += 180;
  if (form.intensity === "very-hard") calories += 340;
  if (form.sessionGoal === "race") calories += 80;
  if (duration >= 90) calories += 110;
  if (duration >= 120) calories += 150;

  if (sessionCount >= 2) calories += Math.round(secondDuration * 3.2);
  if (sessionCount >= 3) calories += Math.round(thirdDuration * 2.6);

  if (form.doubleDay) calories += 220;
  if (form.competitionFrequency === "often") calories += 80;
  if (form.weatherLoad === "hot") calories += 40;
  if (form.goal === "gain") calories += 260;
  if (form.goal === "lean") calories -= 180;
  if (form.soreness === "high") calories += 70;
  if (form.sleepQuality === "poor") calories += 40;

  return Math.round(calories);
}

function getProteinGrams(form) {
  const weight = safeNumber(form.weight, 150);
  const sessionCount = safeNumber(form.sessionCount, 1);

  let base = 0.86;

  if (form.goal === "gain") base = 0.98;
  if (form.goal === "lean") base = 0.92;
  if (form.trainingType === "power") base = 0.95;
  if (sessionCount >= 2) base += 0.06;
  if (form.soreness === "high") base += 0.04;

  return Math.round(weight * base);
}

function getCarbGrams(form, calories, protein) {
  const weight = safeNumber(form.weight, 150);
  const sessionCount = safeNumber(form.sessionCount, 1);

  let carbs = Math.round(weight * 2.0);

  if (form.sport === "swimming") carbs += 25;
  if (form.trainingType === "endurance") carbs += 45;
  if (form.intensity === "hard") carbs += 25;
  if (form.intensity === "very-hard") carbs += 55;
  if (form.sessionGoal === "race") carbs += 25;
  if (sessionCount >= 2) carbs += 50;
  if (sessionCount >= 3) carbs += 35;
  if (form.goal === "gain") carbs += 25;
  if (form.goal === "lean") carbs -= 20;
  if (form.competitionFrequency === "often") carbs += 20;

  const safeMinimum = Math.round(weight * 1.45);
  const roughMax = Math.round((calories - protein * 4 - 55 * 9) / 4);

  return clamp(carbs, safeMinimum, Math.max(roughMax, safeMinimum + 20));
}

function getFatGrams(calories, protein, carbs) {
  const remaining = calories - protein * 4 - carbs * 4;
  return Math.max(45, Math.round(remaining / 9));
}

function getHydrationOunces(form) {
  const weight = safeNumber(form.weight, 150);
  const sessionCount = safeNumber(form.sessionCount, 1);

  let ounces = Math.round(weight * 0.6);

  if (form.intensity === "hard") ounces += 12;
  if (form.intensity === "very-hard") ounces += 18;
  if (safeNumber(form.duration, 90) >= 90) ounces += 8;
  if (safeNumber(form.duration, 90) >= 120) ounces += 8;
  if (sessionCount >= 2) ounces += 18;
  if (sessionCount >= 3) ounces += 14;
  if (form.doubleDay) ounces += 12;
  if (form.currentHydration === "low") ounces += 10;
  if (form.sweatRate === "heavy") ounces += 14;
  if (form.weatherLoad === "hot") ounces += 12;

  return ounces;
}

function getDuringTrainingHydration(form) {
  const sessionCount = safeNumber(form.sessionCount, 1);

  if (
    form.sweatRate === "heavy" ||
    form.intensity === "very-hard" ||
    form.doubleDay ||
    form.weatherLoad === "hot" ||
    sessionCount >= 2
  ) {
    return "18–30 oz per hour + electrolytes";
  }
  if (safeNumber(form.duration, 90) >= 90 || form.intensity === "hard") {
    return "14–24 oz per hour";
  }
  return "12–18 oz per hour";
}

function getElectrolyteNote(form) {
  const sessionCount = safeNumber(form.sessionCount, 1);

  if (form.sweatRate === "heavy" || form.weatherLoad === "hot") {
    return "Use electrolytes consistently on long, hot, or high-sweat sessions.";
  }
  if (form.intensity === "very-hard" || form.doubleDay || sessionCount >= 2) {
    return "Electrolytes are useful on bigger training days instead of relying on plain water only.";
  }
  return "Plain water is fine on easier sessions, but electrolytes help when sweat losses are higher.";
}

function getCarbFocus(form) {
  const sessionCount = safeNumber(form.sessionCount, 1);

  if (form.goal === "lean") {
    return "Keep the biggest carb blocks around training, recovery, and your highest-output parts of the day.";
  }
  if (form.goal === "gain") {
    return "Push carbs hardest before training, after training, and again later in the day so growth and recovery stay supported.";
  }
  if (
    form.trainingType === "endurance" ||
    form.sport === "swimming" ||
    form.intensity === "very-hard" ||
    sessionCount >= 2
  ) {
    return "Spread carbs steadily across the day so you do not arrive at practice already low on energy.";
  }
  return "Center carbs around training and recovery while keeping earlier meals balanced.";
}

function getGoalPhrase(goal) {
  if (goal === "perform") return "performance";
  if (goal === "gain") return "muscle gain";
  if (goal === "lean") return "leaner performance";
  return "maintenance";
}

function getPreviewSummary(form) {
  if (!hasUserCustomized(form)) {
    return "Built around your sport, schedule, session load, hydration needs, and recovery goal.";
  }

  const sport = niceSportLabel(form.sport).toLowerCase();
  const practiceTime = formatTime(toMinutes(form.practiceTime) ?? 945);
  const sessionCount = safeNumber(form.sessionCount, 1);
  const sessionLabel = sessionCount === 1 ? "1 session" : `${sessionCount} sessions`;

  return `Built for a ${form.weight || "150"} lb ${form.sex || "male"} ${sport} athlete focused on ${getGoalPhrase(
    form.goal
  )}, with ${form.intensity.replace("-", " ")} training, ${sessionLabel}, and a main session around ${practiceTime}.`;
}

function getThisIsForYouItems(form) {
  const sport = niceSportLabel(form.sport);
  return [
    `You train hard in ${sport} but still guess what to eat before training.`,
    "You want something more useful than generic 'eat healthy' advice.",
    "You need fueling that fits school, practice, lifting, multiple sessions, and recovery.",
    "You want a plan that feels specific enough to actually save and use.",
  ];
}

function preWorkoutFoods(form) {
  if (form.stomachSensitivity === "sensitive" || form.digestTolerance === "poor") {
    return [
      "banana",
      "applesauce pouch",
      "toast + honey",
      "sports drink",
      "rice cakes",
      "pretzels",
    ];
  }

  return [
    "bagel + honey",
    "banana + granola bar",
    "pretzels + fruit",
    "rice cakes + jam",
    "toast + peanut butter",
    "oat bar + fruit",
  ];
}

function postWorkoutFoods(goal) {
  if (goal === "gain") {
    return [
      "protein shake + bagel",
      "chocolate milk + rice bowl",
      "turkey sandwich + fruit",
      "Greek yogurt + granola + banana",
    ];
  }
  if (goal === "lean") {
    return [
      "protein shake + banana",
      "Greek yogurt + berries + granola",
      "chicken + rice",
      "eggs + toast + fruit",
    ];
  }
  return [
    "chocolate milk + bagel",
    "protein shake + fruit",
    "rice bowl + chicken",
    "sandwich + fruit + water",
  ];
}

function breakfastFoods(goal, appetite) {
  if (goal === "gain" || appetite === "high") {
    return "eggs, toast, fruit, yogurt, and an added carb like oatmeal";
  }
  if (goal === "lean") {
    return "eggs, fruit, toast, and Greek yogurt";
  }
  return "eggs, toast, fruit, and yogurt or oatmeal";
}

function lunchFoods(goal) {
  if (goal === "gain") {
    return "rice or pasta, protein, fruit, and an added carb like bread or potatoes";
  }
  if (goal === "lean") {
    return "rice or potatoes, lean protein, fruit, and vegetables";
  }
  return "rice, potatoes, or pasta with protein and fruit";
}

function getPlanScore(form) {
  let score = 86;
  if (form.eatingPattern === "random") score -= 6;
  if (form.currentHydration === "low") score -= 4;
  if (form.breakfastHabit === "rarely") score -= 4;
  if (form.soreness === "high") score -= 4;
  if (safeNumber(form.sessionCount, 1) >= 2) score -= 3;
  if (form.doubleDay) score -= 2;
  if (form.goal === "gain" && form.appetite === "low") score -= 2;
  if (form.sleepQuality === "poor") score -= 4;
  if (form.wakeDifficulty === "hard") score -= 2;
  return clamp(score, 72, 95);
}

function getPriorityBullets(form) {
  const bullets = [];
  const sessionCount = safeNumber(form.sessionCount, 1);

  if (form.breakfastHabit === "rarely") {
    bullets.push("Your first win is eating earlier so you stop trying to catch up late in the day.");
  }
  if (form.currentHydration === "low") {
    bullets.push("Your hydration needs to become automatic, not something you remember halfway through training.");
  }
  if (form.stomachSensitivity === "sensitive" || form.digestTolerance === "poor") {
    bullets.push("Your pre-workout choices should stay lighter and easier to digest so you can fuel without feeling heavy.");
  }
  if (form.goal === "gain") {
    bullets.push("You need more total intake and more consistent recovery fuel, not just a bigger dinner.");
  }
  if (form.goal === "lean") {
    bullets.push("You still need strong training fuel. The goal is smarter timing, not flat low-energy days.");
  }
  if (form.doubleDay || form.intensity === "very-hard" || sessionCount >= 2) {
    bullets.push("Your workload is high enough that a normal school-day eating pattern will usually leave you underfueled.");
  }
  if (form.weatherLoad === "hot" || form.sweatRate === "heavy") {
    bullets.push("Your sweat losses are meaningful enough that fluids and electrolytes matter, not just total food.");
  }
  if (form.sleepQuality === "poor" || form.wakeDifficulty === "hard") {
    bullets.push("Your sleep and recovery habits need to support your fuel plan or training quality will still feel flat.");
  }
  if (!bullets.length) {
    bullets.push("Your biggest edge is turning decent habits into more consistent timing, hydration, recovery, and sleep.");
  }

  return bullets.slice(0, 4);
}

function getTrainingRiskFlags(form) {
  const flags = [];
  const sessionCount = safeNumber(form.sessionCount, 1);

  if (form.breakfastHabit === "rarely") flags.push("You may be entering the afternoon already behind on fuel.");
  if (form.currentHydration === "low") flags.push("Low hydration habits increase the chance of flat sessions and slower recovery.");
  if (form.digestTolerance === "poor") flags.push("Poor digestion before training means meal timing matters more for you.");
  if (form.doubleDay || sessionCount >= 2) flags.push("Heavy workload increases the chance of underfueling if you eat like a normal day.");
  if (form.soreness === "high") flags.push("High soreness is a sign recovery quality needs to improve.");
  if (form.sweatRate === "heavy") flags.push("Heavy sweat losses raise fluid and sodium needs.");
  if (form.sleepQuality === "poor") flags.push("Poor sleep can reduce recovery quality even if food intake improves.");
  if (!flags.length) flags.push("Main opportunity: improve consistency rather than making huge changes.");

  return flags.slice(0, 4);
}

function getFuelTimingNotes(form) {
  const notes = [];
  const sessionCount = safeNumber(form.sessionCount, 1);

  if (form.practiceTime) {
    notes.push(`Your plan is centered around training at ${formatTime(toMinutes(form.practiceTime))}.`);
  }
  if (sessionCount >= 2) {
    notes.push("Your timing includes extra fuel and recovery because multiple sessions create a bigger total demand.");
  }
  if (form.stomachSensitivity === "sensitive") {
    notes.push("The pre-workout section stays lighter because your stomach tolerance matters.");
  }
  if (form.sessionGoal === "race") {
    notes.push("Fueling is slightly more aggressive because your session goal is higher-quality output.");
  }
  if (form.goal === "lean") {
    notes.push("Carbs are concentrated around training so performance stays supported while overall intake stays tighter.");
  }
  if (form.goal === "gain") {
    notes.push("Recovery and total intake are pushed higher so you are not relying on one oversized meal at night.");
  }

  return notes.slice(0, 4);
}

function getSleepGoal(form) {
  const bed = toMinutes(form.bedTime) ?? 1350;
  const wake = toMinutes(form.wakeTime) ?? 390;

  let sleepMinutes = wake - bed;
  if (sleepMinutes <= 0) sleepMinutes += 1440;

  let targetLow = 8;
  let targetHigh = 10;

  if (form.ageRange === "19-22" || form.ageRange === "23+") {
    targetLow = 8;
    targetHigh = 9;
  }

  const actualHours = (sleepMinutes / 60).toFixed(1);

  let scoreNote = "Your sleep window is decent, but consistency still matters.";
  if (sleepMinutes < targetLow * 60) {
    scoreNote = "Your current sleep window looks short for your training load, so recovery may lag even if food is solid.";
  } else if (form.sleepQuality === "poor" || form.wakeDifficulty === "hard") {
    scoreNote = "Your total time may be okay, but sleep quality looks like a recovery limiter.";
  }

  return {
    actual: `${actualHours} hrs currently scheduled`,
    target: `${targetLow}–${targetHigh} hrs/night`,
    note: scoreNote,
    actions: [
      "Aim to keep bedtime and wake time within about 30 minutes day to day.",
      "Finish your biggest meal at least 2 hours before bed when possible.",
      "Use a lighter protein-focused snack pre-bed if recovery intake is low.",
      "Reduce late caffeine if sleep quality is inconsistent.",
    ],
  };
}

function buildPlan(form) {
  const wake = toMinutes(form.wakeTime) ?? 390;
  const school = toMinutes(form.schoolStart) ?? 480;
  const practice = toMinutes(form.practiceTime) ?? 945;
  const bed = toMinutes(form.bedTime) ?? 1350;
  const duration = safeNumber(form.duration, 90);

  const secondPractice = toMinutes(form.secondSessionTime);
  const thirdPractice = toMinutes(form.thirdSessionTime);
  const secondDuration = safeNumber(form.secondSessionDuration, 60);
  const thirdDuration = safeNumber(form.thirdSessionDuration, 45);
  const sessionCount = safeNumber(form.sessionCount, 1);
  const sleepGoal = getSleepGoal(form);

  const calories = getCalories(form);
  const protein = getProteinGrams(form);
  const carbs = getCarbGrams(form, calories, protein);
  const fat = getFatGrams(calories, protein, carbs);
  const hydrationOz = getHydrationOunces(form);
  const duringTraining = getDuringTrainingHydration(form);
  const sweatNote = getElectrolyteNote(form);

  const preFoods = preWorkoutFoods(form);
  const recoveryFoods = postWorkoutFoods(form.goal);
  const secondRecoveryTime =
    secondPractice != null ? formatTime(secondPractice + secondDuration + 15) : "";
  const thirdRecoveryTime =
    thirdPractice != null ? formatTime(thirdPractice + thirdDuration + 15) : "";

  const athleteType = niceSportLabel(form.sport);
  const title =
    form.sport === "swimming"
      ? "Your PeakFuel Swim System"
      : `Your PeakFuel ${athleteType} System`;

  const previewTitle = "Your Personalized Fuel System";
  const previewSummary = getPreviewSummary(form);

  const whyThisWorks =
    form.goal === "gain"
      ? "This system increases total fuel, recovery carbs, protein timing, and late-day support so you can train hard without falling behind on growth and recovery."
      : form.goal === "lean"
        ? "This system keeps protein high, places carbs where they help performance most, and avoids the classic mistake of underfueling before training."
        : "This system spreads your fuel more intentionally across the day so you can show up to training with better energy, recover faster, and avoid late-day crashes.";

  const breakfastTime = formatTime(wake + 25);
  const snack1Time = formatTime(Math.max(school - 35, wake + 150));
  const lunchTime = formatTime(practice - 190);
  const topUpTime = formatTime(practice - 60);
  const duringTime = formatTime(practice);
  const recoveryTime = formatTime(practice + duration + 15);
  const dinnerTime = formatTime(Math.min(bed - 120, practice + duration + 140));
  const preBedTime = formatTime(Math.min(bed - 45, bed - 45));

  const breakfastCarbs = Math.round(carbs * 0.2);
  const breakfastProtein = Math.round(protein * 0.22);
  const snackCarbs = Math.round(carbs * 0.1);
  const snackProtein = Math.round(protein * 0.1);
  const lunchCarbs = Math.round(carbs * 0.24);
  const lunchProtein = Math.round(protein * 0.22);
  const topUpCarbs = Math.round(carbs * 0.12);
  const recoveryCarbs = Math.round(carbs * 0.18);
  const recoveryProtein = Math.round(protein * 0.22);
  const dinnerCarbs = Math.round(carbs * 0.12);
  const dinnerProtein = Math.round(protein * 0.16);
  const preBedProtein = Math.round(protein * 0.08);

  const items = [
    {
      time: breakfastTime,
      title: "Breakfast — Start Fueled",
      desc: `Start the day with ${breakfastFoods(form.goal, form.appetite)} so you are not behind before school or training even starts.`,
      macros: `Target: ~${breakfastCarbs}g carbs + ${breakfastProtein}g protein`,
      hydration: "Hydration: 16–20 oz water in the morning",
      why: "This protects energy earlier in the day and reduces the need to catch up later.",
      examples: ["eggs", "toast", "fruit", "yogurt or oatmeal"],
    },
    {
      time: snack1Time,
      title: "Mid-Morning / School Fuel",
      desc: "This keeps your energy stable and prevents the classic crash before lunch or training.",
      macros: `Target: ~${snackCarbs}g carbs + ${snackProtein}g protein`,
      hydration: "Hydration: 10–16 oz",
      why: "A smaller fuel block here helps keep the afternoon from feeling flat.",
      examples:
        form.stomachSensitivity === "sensitive"
          ? ["banana", "applesauce pouch", "crackers", "water"]
          : ["granola bar", "fruit", "pretzels", "Greek yogurt"],
    },
    {
      time: lunchTime,
      title: "Main Pre-Training Meal",
      desc: `Build this around ${lunchFoods(form.goal)} so practice is powered by a real meal instead of a last-second snack.`,
      macros: `Target: ~${lunchCarbs}g carbs + ${lunchProtein}g protein`,
      hydration: "Hydration: 16–24 oz before training window",
      why: "This is your biggest setup meal for training quality and late-day energy.",
      examples: ["rice / pasta / potatoes", "chicken / turkey / beef", "fruit", "water"],
    },
    {
      time: topUpTime,
      title: "Pre-Workout Top-Up",
      desc: "Use a lighter carb-focused snack 45–75 minutes before training to sharpen energy without feeling heavy.",
      macros: `Target: ~${topUpCarbs}g carbs`,
      hydration: "Hydration: 8–12 oz",
      why: "This tops up energy right before training without making your stomach feel overloaded.",
      examples: preFoods,
    },
    {
      time: duringTime,
      title: "During Training Strategy",
      desc: "Do not wait until you feel flat. Your hydration should already be working for you.",
      macros:
        sessionCount >= 2 || form.doubleDay || form.intensity === "very-hard" || duration >= 100
          ? "Add carbs during long or very hard sessions if energy drops"
          : "Hydration-first approach",
      hydration: `During training: ${duringTraining}`,
      why: "This keeps performance steadier when total output, heat, or sweat losses are higher.",
      examples:
        form.intensity === "very-hard" || form.doubleDay || duration >= 100 || sessionCount >= 2
          ? ["water bottle", "electrolytes", "sports drink if needed"]
          : ["water bottle", "electrolytes if you sweat heavily"],
    },
    {
      time: recoveryTime,
      title: "Post-Workout Recovery Window",
      desc: "This is where you replace what you used, start muscle repair, and avoid dragging tomorrow's session down.",
      macros: `Target: ~${recoveryCarbs}g carbs + ${recoveryProtein}g protein`,
      hydration: "Hydration: 16–24 oz + sodium if sweaty session",
      why: "Fast recovery here makes the rest of the day and next training session easier to handle.",
      examples: recoveryFoods,
    },
    {
      time: dinnerTime,
      title: "Dinner — Recovery + Reset",
      desc:
        form.doubleDay || sessionCount >= 2
          ? "Go bigger here. Heavy days need carbs, protein, fluids, and enough total intake to actually recover."
          : "Finish with a full balanced meal that supports recovery, sleep, and tomorrow’s training.",
      macros: `Target: ~${dinnerCarbs}g carbs + ${dinnerProtein}g protein`,
      hydration: "Hydration: Finish the rest of your daily target",
      why: "Dinner closes the recovery gap and prevents waking up already behind.",
      examples: ["rice / potatoes / pasta", "protein source", "vegetables", "fruit or dairy"],
    },
  ];

  if (form.doubleDay) {
    items.splice(3, 0, {
      time: formatTime(practice - 230),
      title: "Extra Fuel Block",
      desc: "Because your workload is higher than normal, you need an added fuel block instead of pretending a standard day is enough.",
      macros: `Target: ~${Math.round(carbs * 0.08)}g carbs + ${Math.round(protein * 0.08)}g protein`,
      hydration: "Hydration: 10–16 oz",
      why: "This prevents your total intake from falling behind on heavy days.",
      examples: ["bagel", "trail mix", "fruit", "sports drink", "yogurt"],
    });
  }

  if (sessionCount >= 2 && secondPractice != null) {
    items.push({
      time: formatTime(Math.max(secondPractice - 60, 0)),
      title: "Session 2 Pre-Fuel",
      desc: "Because you have more than one session, this second pre-fuel block matters. Do not rely on your earlier meals to still carry you.",
      macros: `Target: ~${Math.round(carbs * 0.1)}g carbs + ${Math.round(protein * 0.08)}g protein`,
      hydration: "Hydration: 10–16 oz + electrolytes if sweat losses are high",
      why: "Second sessions usually feel worse when the first session already drained carbs and fluids.",
      examples:
        form.stomachSensitivity === "sensitive"
          ? ["banana", "applesauce", "pretzels", "sports drink"]
          : ["bagel", "granola bar", "fruit", "Greek yogurt"],
    });

    items.push({
      time: secondRecoveryTime,
      title: "Session 2 Recovery",
      desc: "This recovery block keeps your full-day workload from turning into a slow recovery spiral.",
      macros: `Target: ~${Math.round(carbs * 0.14)}g carbs + ${Math.round(protein * 0.16)}g protein`,
      hydration: "Hydration: 16–24 oz + sodium if you were a heavy sweater",
      why: "Multi-session athletes usually under-recover between sessions and end up flat the next day.",
      examples: postWorkoutFoods(form.goal),
    });
  }

  if (sessionCount >= 3 && thirdPractice != null) {
    items.push({
      time: formatTime(Math.max(thirdPractice - 45, 0)),
      title: "Session 3 Top-Up",
      desc: "At this point the goal is simple digestion and fast energy, not a heavy meal.",
      macros: `Target: ~${Math.round(carbs * 0.07)}g carbs`,
      hydration: "Hydration: 8–12 oz",
      why: "Small, easy fuel works better than trying to squeeze in a full meal too late.",
      examples: ["banana", "sports drink", "rice cakes", "pretzels"],
    });

    items.push({
      time: thirdRecoveryTime,
      title: "Session 3 Recovery",
      desc: "Finish the day by replacing fluids, carbs, and protein quickly so tomorrow does not start behind.",
      macros: `Target: ~${Math.round(carbs * 0.12)}g carbs + ${Math.round(protein * 0.14)}g protein`,
      hydration: "Hydration: 16–24 oz",
      why: "Late recovery matters more when total daily output is stacked.",
      examples: postWorkoutFoods(form.goal),
    });
  }

  if (form.goal === "gain" || form.soreness === "high" || form.sleepQuality === "poor") {
    items.push({
      time: preBedTime,
      title: "Pre-Bed Recovery Add-On",
      desc: "A light protein-focused add-on can help you finish the day without ending up short on recovery.",
      macros: `Target: ~${preBedProtein}g protein`,
      hydration: "Hydration: Small amount of water only if needed",
      why: "This helps close recovery gaps without needing a huge extra meal.",
      examples: ["Greek yogurt", "milk", "protein shake", "cottage cheese", "toast + yogurt"],
    });
  }

  items.sort((a, b) => displayTimeToMinutes(a.time) - displayTimeToMinutes(b.time));

  const groceryList = [
    "bagels / bread / toast",
    "rice / pasta / potatoes / oats",
    "fruit like bananas, berries, apples, oranges",
    "Greek yogurt / milk / chocolate milk",
    "chicken / turkey / eggs / beef",
    "pretzels / granola bars / crackers / rice cakes",
    "electrolytes or sports drink for harder sessions",
  ];

  const convenienceList = [
    "banana",
    "applesauce pouch",
    "granola bar",
    "Greek yogurt cup",
    "pretzels",
    "bagel",
    "sports drink",
  ];

  const meetGameDay = {
    nightBefore:
      "Eat a normal solid dinner with carbs, protein, fluids, and sodium. Do not try to 'eat perfect' by underfueling.",
    preEvent:
      form.stomachSensitivity === "sensitive" || form.digestTolerance === "poor"
        ? "Use easier carbs like toast, banana, applesauce, rice, or a sports drink."
        : "Use a carb-based meal 2–4 hours before with lighter protein and lower-fat foods.",
    during:
      "Between events, keep using small carbs, fluids, and electrolytes instead of waiting until you feel drained.",
    after:
      "Recover quickly with fluids, carbs, and protein so the rest of the day or next day does not fall apart.",
  };

  const commonMistakes = [
    "Going too long without eating earlier in the day",
    "Trying to fix underfueling with one snack right before practice",
    "Using water only when sweat losses are high",
    "Waiting too long after training to start recovery",
    ...(sessionCount >= 2 ? ["Underestimating how much extra fuel a second or third session requires"] : []),
    ...(form.sleepQuality === "poor" ? ["Ignoring sleep quality while trying to fix performance with food alone"] : []),
  ].slice(0, 5);

  const recoveryTips = [
    `Protein target: ${protein}g/day split across the day instead of all at night.`,
    `Hydration target: ${hydrationOz}–${hydrationOz + 16} oz/day.`,
    `Sleep target: ${sleepGoal.target}. Current setup: ${sleepGoal.actual}.`,
    `Electrolyte note: ${sweatNote}`,
    form.caffeine === "daily"
      ? "Be careful not to rely on caffeine to cover up underfueling or poor sleep."
      : "Do not use caffeine as your whole energy strategy.",
  ];

  return {
    title,
    previewTitle,
    previewSummary,
    profileSummary: previewSummary,
    whyThisWorks,
    carbFocus: getCarbFocus(form),
    hydrationTarget: `${hydrationOz}–${hydrationOz + 16} oz/day`,
    duringTraining,
    macros: {
      calories: `${calories} kcal`,
      protein: `${protein}g`,
      carbs: `${carbs}g`,
      fat: `${fat}g`,
    },
    items,
    meetGameDay,
    recoveryTips,
    commonMistakes,
    groceryList,
    convenienceList,
    thisIsForYou: getThisIsForYouItems(form),
    priorityBullets: getPriorityBullets(form),
    trainingRiskFlags: getTrainingRiskFlags(form),
    fuelTimingNotes: getFuelTimingNotes(form),
    planScore: getPlanScore(form),
    electrolyteNote: sweatNote,
    sleepGoal,
  };
}

function downloadPlanAsHtml(plan, form) {
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>PeakFuel Plan</title>
      <style>
        body {
          font-family: Inter, Arial, sans-serif;
          margin: 0;
          padding: 32px;
          color: #0f172a;
          background: #ffffff;
          line-height: 1.6;
        }
        .wrap {
          max-width: 900px;
          margin: 0 auto;
        }
        .top {
          padding: 24px;
          border-radius: 20px;
          background: linear-gradient(135deg, #0ea5e9, #22d3ee 50%, #111827);
          color: white;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin: 20px 0;
        }
        .card, .section {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px;
          background: white;
        }
        .section { margin-top: 16px; }
        .small { color: #64748b; font-size: 14px; }
        h1, h2, h3, p { margin-top: 0; }
        ul { margin: 8px 0 0; }
        @media print {
          body { padding: 0; }
          .top { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="top">
          <div>PeakFuel</div>
          <h1>${plan.title}</h1>
          <p>${plan.profileSummary}</p>
        </div>

        <div class="grid">
          <div class="card"><div class="small">Calories</div><strong>${plan.macros.calories}</strong></div>
          <div class="card"><div class="small">Protein</div><strong>${plan.macros.protein}</strong></div>
          <div class="card"><div class="small">Carbs</div><strong>${plan.macros.carbs}</strong></div>
          <div class="card"><div class="small">Fat</div><strong>${plan.macros.fat}</strong></div>
        </div>

        <div class="section">
          <h2>Hydration</h2>
          <p><strong>Daily target:</strong> ${plan.hydrationTarget}</p>
          <p><strong>During training:</strong> ${plan.duringTraining}</p>
          <p>${plan.electrolyteNote}</p>
        </div>

        <div class="section">
          <h2>Sleep target</h2>
          <p><strong>Target:</strong> ${plan.sleepGoal.target}</p>
          <p><strong>Current setup:</strong> ${plan.sleepGoal.actual}</p>
          <p>${plan.sleepGoal.note}</p>
          <ul>${plan.sleepGoal.actions.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>

        <div class="section">
          <h2>Main priorities</h2>
          <ul>${plan.priorityBullets.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>

        <div class="section">
          <h2>Daily schedule</h2>
          ${plan.items
            .map(
              (item) => `
            <div style="border-top:1px solid #e5e7eb; padding-top:14px; margin-top:14px;">
              <h3>${item.time} — ${item.title}</h3>
              <p>${item.desc}</p>
              <p><strong>${item.macros}</strong></p>
              <p>${item.hydration}</p>
              <p><em>${item.why}</em></p>
              <ul>${item.examples.map((example) => `<li>${example}</li>`).join("")}</ul>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="section">
          <h2>Competition / meet day</h2>
          <p><strong>Night before:</strong> ${plan.meetGameDay.nightBefore}</p>
          <p><strong>Pre-event:</strong> ${plan.meetGameDay.preEvent}</p>
          <p><strong>During:</strong> ${plan.meetGameDay.during}</p>
          <p><strong>After:</strong> ${plan.meetGameDay.after}</p>
        </div>

        <div class="section">
          <h2>Recovery system</h2>
          <ul>${plan.recoveryTips.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>

        <div class="section">
          <h2>Quick grocery list</h2>
          <ul>${plan.groceryList.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>

        <div class="section">
          <div class="small">
            Educational fueling guidance only. Adjust for allergies, preferences, and any advice from a qualified professional.
          </div>
        </div>
      </div>
    </body>
  </html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PeakFuel-Plan-${(form.sport || "athlete").toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadPlanAsText(plan, form) {
  const text = `
PEAKFUEL PLAN
${plan.title}

PROFILE
${plan.profileSummary}

MACROS
Calories: ${plan.macros.calories}
Protein: ${plan.macros.protein}
Carbs: ${plan.macros.carbs}
Fat: ${plan.macros.fat}

HYDRATION
Daily target: ${plan.hydrationTarget}
During training: ${plan.duringTraining}
Electrolytes: ${plan.electrolyteNote}

SLEEP
Target: ${plan.sleepGoal.target}
Current setup: ${plan.sleepGoal.actual}
Sleep note: ${plan.sleepGoal.note}
${plan.sleepGoal.actions.map((x, i) => `${i + 1}. ${x}`).join("\n")}

MAIN PRIORITIES
${plan.priorityBullets.map((x, i) => `${i + 1}. ${x}`).join("\n")}

RISK FLAGS
${plan.trainingRiskFlags.map((x, i) => `${i + 1}. ${x}`).join("\n")}

DAILY SCHEDULE
${plan.items
  .map(
    (item) => `
${item.time} — ${item.title}
${item.desc}
${item.macros}
${item.hydration}
Why: ${item.why}
Examples: ${item.examples.join(", ")}
`
  )
  .join("\n")}

COMPETITION / MEET DAY
Night before: ${plan.meetGameDay.nightBefore}
Pre-event: ${plan.meetGameDay.preEvent}
During: ${plan.meetGameDay.during}
After: ${plan.meetGameDay.after}

RECOVERY SYSTEM
${plan.recoveryTips.map((x, i) => `${i + 1}. ${x}`).join("\n")}
`;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PeakFuel-Plan-${(form.sport || "athlete").toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function printPlan(plan) {
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${plan.title}</title>
        <style>
          body {
            font-family: Inter, Arial, sans-serif;
            padding: 32px;
            color: #111827;
            line-height: 1.6;
          }
          h1, h2, h3 { margin-bottom: 8px; }
          .box {
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 14px;
          }
          .top {
            background: #f8fafc;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        </style>
      </head>
      <body>
        <div class="box top">
          <h1>${plan.title}</h1>
          <p>${plan.profileSummary}</p>
        </div>
        <div class="grid">
          <div class="box"><strong>Calories:</strong> ${plan.macros.calories}</div>
          <div class="box"><strong>Protein:</strong> ${plan.macros.protein}</div>
          <div class="box"><strong>Carbs:</strong> ${plan.macros.carbs}</div>
          <div class="box"><strong>Fat:</strong> ${plan.macros.fat}</div>
        </div>
        <div class="box">
          <h2>Hydration</h2>
          <p><strong>Daily target:</strong> ${plan.hydrationTarget}</p>
          <p><strong>During training:</strong> ${plan.duringTraining}</p>
        </div>
        <div class="box">
          <h2>Sleep</h2>
          <p><strong>Target:</strong> ${plan.sleepGoal.target}</p>
          <p><strong>Current setup:</strong> ${plan.sleepGoal.actual}</p>
          <p>${plan.sleepGoal.note}</p>
        </div>
        <div class="box">
          <h2>Daily schedule</h2>
          ${plan.items
            .map(
              (item) => `
            <h3>${item.time} — ${item.title}</h3>
            <p>${item.desc}</p>
            <p>${item.macros}</p>
            <p>${item.hydration}</p>
            <p><strong>Why:</strong> ${item.why}</p>
            <p><strong>Examples:</strong> ${item.examples.join(", ")}</p>
          `
            )
            .join("")}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function Field({ label, hint, children }) {
  return (
    <div className="pf-field">
      <label className="pf-label">{label}</label>
      {children}
      {hint ? <div className="pf-hint">{hint}</div> : null}
    </div>
  );
}

function SectionHeading({ eyebrow, title, text, center = false }) {
  return (
    <div className={center ? "pf-section-heading center" : "pf-section-heading"}>
      <div className="pf-eyebrow">{eyebrow}</div>
      <h2 className="pf-section-title">{title}</h2>
      {text ? <p className="pf-section-text">{text}</p> : null}
    </div>
  );
}

function LandingPage({
  form,
  updateField,
  plan,
  startCheckout,
  savePreview,
  leadMessage,
  clearSaved,
}) {
  const customized = hasUserCustomized(form);
  const progress = calcProgress(form);

  return (
    <>
      <section className="pf-hero">
        <div className="pf-grid-bg" />
        <div className="pf-container">
          <header className="pf-header">
            <div className="pf-logo-wrap">
              <div className="pf-logo">PF</div>
              <div>
                <div className="pf-logo-title">PeakFuel</div>
                <div className="pf-logo-sub">Daily fuel system for athletes</div>
              </div>
            </div>

            <nav className="pf-nav">
              <a href="#builder" className="pf-nav-link">Builder</a>
              <a href="#preview" className="pf-nav-link">Preview</a>
              <a href="#pricing" className="pf-nav-link">Pricing</a>
            </nav>

            <a href="#builder" className="pf-header-cta">Build My System</a>
          </header>

          <div className="pf-hero-grid">
            <div className="pf-hero-left">
              <div className="pf-badge">Built around real training schedules</div>

              <h1 className="pf-hero-title">
                Stop guessing what to eat. Fuel like a real athlete.
              </h1>

              <p className="pf-hero-text">
                PeakFuel builds a specific daily fueling structure based on your
                sport, sex, schedule, number of sessions, practice time, digestion,
                hydration, sweat rate, sleep, and performance goal.
              </p>

              <div className="pf-hero-buttons">
                <a href="#builder" className="pf-primary-btn">Build Your Plan</a>
                <a href="#preview" className="pf-secondary-btn">See Live Preview</a>
              </div>

              <div className="pf-hero-trust-row">
                <div className="pf-pill">One-time payment</div>
                <div className="pf-pill">No subscription</div>
                <div className="pf-pill">Save, print, and download</div>
              </div>

              <div className="pf-mini-proof">
                <div className="pf-mini-proof-item">
                  <strong>{progress}%</strong>
                  <span>Builder completion</span>
                </div>
                <div className="pf-mini-proof-item">
                  <strong>{plan.planScore}/100</strong>
                  <span>Current fueling score</span>
                </div>
              </div>
            </div>

            <div className="pf-preview-shell">
              <div className="pf-preview-top">
                <div className="pf-preview-meta">Live preview</div>
                <div className="pf-preview-title">{plan.previewTitle}</div>
                <div className="pf-preview-summary">{plan.previewSummary}</div>
              </div>

              <div id="preview" className="pf-preview-wrap">
                <div className="pf-metrics-grid">
                  <div className="pf-metric-card">
                    <div className="pf-metric-label">Protein</div>
                    <div className="pf-metric-value">
                      {customized ? plan.macros.protein : "Personalized"}
                    </div>
                  </div>
                  <div className="pf-metric-card">
                    <div className="pf-metric-label">Carbs</div>
                    <div className="pf-metric-value">
                      {customized ? plan.macros.carbs : "Calculated"}
                    </div>
                  </div>
                  <div className="pf-metric-card">
                    <div className="pf-metric-label">Hydration</div>
                    <div className="pf-metric-value">
                      {customized ? plan.hydrationTarget : "Built from inputs"}
                    </div>
                  </div>
                </div>

                {plan.items.slice(0, 3).map((item) => (
                  <div key={item.time + item.title} className="pf-preview-item">
                    <div className="pf-time-box">{item.time}</div>
                    <div className="pf-item-content">
                      <div className="pf-item-title">{item.title}</div>
                      <div className="pf-item-desc">{item.desc}</div>
                      <div className="pf-item-meta">{item.macros}</div>
                    </div>
                  </div>
                ))}

                <div className="pf-locked-block">
                  <div className="pf-locked-badge">Full system preview</div>
                  <div className="pf-locked-title">Unlock your full fuel system</div>
                  <div className="pf-locked-text">
                    Get your full day structure, exact macros, hydration target,
                    sleep goal, competition version, recovery system, grocery ideas,
                    and save / download tools.
                  </div>

                  <div className="pf-locked-feature-grid">
                    <div className="pf-locked-feature">✓ Exact calories + macros</div>
                    <div className="pf-locked-feature">✓ Hydration in ounces</div>
                    <div className="pf-locked-feature">✓ Competition version</div>
                    <div className="pf-locked-feature">✓ Sleep + recovery goals</div>
                  </div>

                  <button onClick={startCheckout} className="pf-dark-btn">
                    Get Instant Access — $4.99
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pf-light-section">
        <div className="pf-container">
          <div className="pf-for-you-section">
            <div>
              <SectionHeading
                eyebrow="This is for you"
                title="Made for athletes who train hard but still end up guessing their nutrition"
                text="PeakFuel is built for athletes who want their food, hydration, recovery, and sleep to actually match their training."
              />
            </div>

            <div className="pf-for-you-card">
              {plan.thisIsForYou.map((item) => (
                <div key={item} className="pf-for-you-row">
                  <span className="pf-check">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pf-container-section">
        <div className="pf-trust-strip">
          <div className="pf-trust-item">
            <div className="pf-trust-title">Built from real inputs</div>
            <div className="pf-trust-text">
              Your plan changes based on sex, training time, session count, hydration habits, stomach tolerance, sweat rate, and sleep quality.
            </div>
          </div>
          <div className="pf-trust-item">
            <div className="pf-trust-title">Actually useful after purchase</div>
            <div className="pf-trust-text">
              Save it, print it, or download it so it feels like a real system, not a throwaway result page.
            </div>
          </div>
          <div className="pf-trust-item">
            <div className="pf-trust-title">Simple payment structure</div>
            <div className="pf-trust-text">
              One-time payment. No subscription. No account required to keep your plan on your device.
            </div>
          </div>
        </div>
      </section>

      <section id="builder" className="pf-container-section-tight">
        <div className="pf-two-col">
          <div>
            <SectionHeading
              eyebrow="Builder"
              title="Build your personalized fuel system"
              text="Add your schedule, training details, recovery needs, and preferences so your plan feels specific, useful, and worth paying for."
            />

            <div className="pf-form-card">
              <div className="pf-progress-row">
                <div className="pf-progress-top">
                  <span>Builder progress</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="pf-progress-bar">
                  <div className="pf-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="pf-form-grid">
                <Field label="Email" hint="Used so your plan can be saved to this device before checkout">
                  <input
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                    className="pf-input"
                  />
                </Field>

                <Field label="Sport">
                  <select
                    value={form.sport}
                    onChange={(e) => updateField("sport", e.target.value)}
                    className="pf-input"
                  >
                    {sports.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Sex">
                  <select
                    value={form.sex}
                    onChange={(e) => updateField("sex", e.target.value)}
                    className="pf-input"
                  >
                    {sexOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Primary goal">
                  <select
                    value={form.goal}
                    onChange={(e) => updateField("goal", e.target.value)}
                    className="pf-input"
                  >
                    {goals.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Age range">
                  <select
                    value={form.ageRange}
                    onChange={(e) => updateField("ageRange", e.target.value)}
                    className="pf-input"
                  >
                    {ageRanges.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Body weight (lb)">
                  <input
                    value={form.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                    placeholder="150"
                    className="pf-input"
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Height (optional)">
                  <input
                    value={form.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    placeholder={`5'11"`}
                    className="pf-input"
                  />
                </Field>

                <Field label="Training intensity">
                  <select
                    value={form.intensity}
                    onChange={(e) => updateField("intensity", e.target.value)}
                    className="pf-input"
                  >
                    {intensityLevels.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Training duration (minutes)">
                  <input
                    value={form.duration}
                    onChange={(e) => updateField("duration", e.target.value)}
                    placeholder="90"
                    className="pf-input"
                    inputMode="numeric"
                  />
                </Field>

                <Field label="How many training sessions today?">
                  <select
                    value={form.sessionCount}
                    onChange={(e) => updateField("sessionCount", e.target.value)}
                    className="pf-input"
                  >
                    {sessionCountOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Training type">
                  <select
                    value={form.trainingType}
                    onChange={(e) => updateField("trainingType", e.target.value)}
                    className="pf-input"
                  >
                    {trainingTypeOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Body goal">
                  <select
                    value={form.bodyGoal}
                    onChange={(e) => updateField("bodyGoal", e.target.value)}
                    className="pf-input"
                  >
                    {bodyGoalOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Session goal">
                  <select
                    value={form.sessionGoal}
                    onChange={(e) => updateField("sessionGoal", e.target.value)}
                    className="pf-input"
                  >
                    {sessionGoalOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Conditions / sweat load">
                  <select
                    value={form.weatherLoad}
                    onChange={(e) => updateField("weatherLoad", e.target.value)}
                    className="pf-input"
                  >
                    {weatherOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Wake time">
                  <input
                    type="time"
                    value={form.wakeTime}
                    onChange={(e) => updateField("wakeTime", e.target.value)}
                    className="pf-input"
                  />
                </Field>

                <Field label="School / work start">
                  <input
                    type="time"
                    value={form.schoolStart}
                    onChange={(e) => updateField("schoolStart", e.target.value)}
                    className="pf-input"
                  />
                </Field>

                <Field label="Practice / training time">
                  <input
                    type="time"
                    value={form.practiceTime}
                    onChange={(e) => updateField("practiceTime", e.target.value)}
                    className="pf-input"
                  />
                </Field>

                <Field label="Bed time">
                  <input
                    type="time"
                    value={form.bedTime}
                    onChange={(e) => updateField("bedTime", e.target.value)}
                    className="pf-input"
                  />
                </Field>

                {Number(form.sessionCount) >= 2 ? (
                  <>
                    <Field label="Second session time">
                      <input
                        type="time"
                        value={form.secondSessionTime}
                        onChange={(e) => updateField("secondSessionTime", e.target.value)}
                        className="pf-input"
                      />
                    </Field>

                    <Field label="Second session duration (minutes)">
                      <input
                        value={form.secondSessionDuration}
                        onChange={(e) => updateField("secondSessionDuration", e.target.value)}
                        placeholder="60"
                        className="pf-input"
                        inputMode="numeric"
                      />
                    </Field>
                  </>
                ) : null}

                {Number(form.sessionCount) >= 3 ? (
                  <>
                    <Field label="Third session time">
                      <input
                        type="time"
                        value={form.thirdSessionTime}
                        onChange={(e) => updateField("thirdSessionTime", e.target.value)}
                        className="pf-input"
                      />
                    </Field>

                    <Field label="Third session duration (minutes)">
                      <input
                        value={form.thirdSessionDuration}
                        onChange={(e) => updateField("thirdSessionDuration", e.target.value)}
                        placeholder="45"
                        className="pf-input"
                        inputMode="numeric"
                      />
                    </Field>
                  </>
                ) : null}

                <Field label="Sleep quality lately">
                  <select
                    value={form.sleepQuality}
                    onChange={(e) => updateField("sleepQuality", e.target.value)}
                    className="pf-input"
                  >
                    {sleepQualityOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="How do you feel when you wake up?">
                  <select
                    value={form.wakeDifficulty}
                    onChange={(e) => updateField("wakeDifficulty", e.target.value)}
                    className="pf-input"
                  >
                    {wakeDifficultyOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Pre-training stomach">
                  <select
                    value={form.stomachSensitivity}
                    onChange={(e) => updateField("stomachSensitivity", e.target.value)}
                    className="pf-input"
                  >
                    {stomachOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Food digestion before training">
                  <select
                    value={form.digestTolerance}
                    onChange={(e) => updateField("digestTolerance", e.target.value)}
                    className="pf-input"
                  >
                    {digestOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Current hydration habits">
                  <select
                    value={form.currentHydration}
                    onChange={(e) => updateField("currentHydration", e.target.value)}
                    className="pf-input"
                  >
                    {hydrationOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="How much do you sweat?">
                  <select
                    value={form.sweatRate}
                    onChange={(e) => updateField("sweatRate", e.target.value)}
                    className="pf-input"
                  >
                    {sweatOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Caffeine use">
                  <select
                    value={form.caffeine}
                    onChange={(e) => updateField("caffeine", e.target.value)}
                    className="pf-input"
                  >
                    {caffeineOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Competition frequency">
                  <select
                    value={form.competitionFrequency}
                    onChange={(e) => updateField("competitionFrequency", e.target.value)}
                    className="pf-input"
                  >
                    {competitionOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Current eating structure">
                  <select
                    value={form.eatingPattern}
                    onChange={(e) => updateField("eatingPattern", e.target.value)}
                    className="pf-input"
                  >
                    {eatingPatternOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Breakfast habit">
                  <select
                    value={form.breakfastHabit}
                    onChange={(e) => updateField("breakfastHabit", e.target.value)}
                    className="pf-input"
                  >
                    {breakfastHabitOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Current soreness / fatigue">
                  <select
                    value={form.soreness}
                    onChange={(e) => updateField("soreness", e.target.value)}
                    className="pf-input"
                  >
                    {sorenessOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Appetite">
                  <select
                    value={form.appetite}
                    onChange={(e) => updateField("appetite", e.target.value)}
                    className="pf-input"
                  >
                    {appetiteOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Food budget">
                  <select
                    value={form.budgetLevel}
                    onChange={(e) => updateField("budgetLevel", e.target.value)}
                    className="pf-input"
                  >
                    {budgetOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <label className="pf-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.doubleDay}
                  onChange={(e) => updateField("doubleDay", e.target.checked)}
                />
                <span>I have a double day or unusually heavy training load</span>
              </label>

              <div className="pf-button-row">
                <button onClick={startCheckout} className="pf-dark-btn">
                  Unlock My Full System
                </button>
                <button onClick={savePreview} className="pf-secondary-button">
                  Save Preview
                </button>
                <button onClick={clearSaved} className="pf-ghost-button">
                  Clear Saved
                </button>
              </div>

              {leadMessage ? <p className="pf-helper-text">{leadMessage}</p> : null}
            </div>
          </div>

          <div>
            <div className="pf-side-card">
              <div className="pf-side-top">What the paid plan includes</div>

              {[
                "Exact calories, protein, carbs, and fats",
                "Daily hydration target in ounces",
                "Pre, during, and post-workout strategy",
                "Full daily meal timing structure",
                "Competition / meet day version",
                "Recovery notes, grocery list, fast grab-and-go ideas, and sleep targets",
              ].map((text) => (
                <div key={text} className="pf-bullet-row">
                  <span className="pf-bullet-dot">✓</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="pf-quote-card">
              <div className="pf-quote-text">
                Built to feel specific, practical, and worth the purchase.
              </div>
              <div className="pf-quote-sub">
                Not generic nutrition talk. A structured daily system athletes can actually follow.
              </div>
            </div>

            <div className="pf-side-card">
              <div className="pf-side-top">Why athletes buy this</div>
              <div className="pf-bullet-row">
                <span className="pf-bullet-dot">✓</span>
                <span>Built around your real day instead of a generic athlete template.</span>
              </div>
              <div className="pf-bullet-row">
                <span className="pf-bullet-dot">✓</span>
                <span>Accounts for one, two, or three sessions in a day.</span>
              </div>
              <div className="pf-bullet-row">
                <span className="pf-bullet-dot">✓</span>
                <span>Includes food timing, hydration, recovery, and sleep targets.</span>
              </div>
              <div className="pf-bullet-row">
                <span className="pf-bullet-dot">✓</span>
                <span>One-time payment. Save, print, and download immediately.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pf-proof-section">
        <div className="pf-container">
          <SectionHeading
            eyebrow="Trust"
            title="Built for serious athletes who want specific structure"
            text="No subscription, no bloated app, and no generic meal-plan fluff. Just a personalized system built around your real training day."
            center
          />
          <div className="pf-proof-grid">
            <div className="pf-proof-card">
              <div className="pf-proof-title">Specific to your actual day</div>
              <div className="pf-proof-text">
                Your plan changes using sport, sex, body weight, session count, training times, digestion, sweat rate, hydration habits, and recovery needs.
              </div>
            </div>
            <div className="pf-proof-card">
              <div className="pf-proof-title">Built to keep and use</div>
              <div className="pf-proof-text">
                Save it, print it, or download it immediately so it feels like a real system you can actually follow.
              </div>
            </div>
            <div className="pf-proof-card">
              <div className="pf-proof-title">Simple one-time purchase</div>
              <div className="pf-proof-text">
                One payment, no subscription, no account wall, and a clean plan that works on phone and desktop.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pf-pricing-section">
        <div className="pf-container">
          <SectionHeading
            eyebrow="Pricing"
            title="One payment. Full access."
            text="A one-time purchase for your full personalized athlete fueling system."
            center
          />

          <div className="pf-pricing-grid-single">
            {planTiers.map((tier) => (
              <div key={tier.key} className="pf-price-card">
                <div className="pf-price-badge">{tier.badge}</div>
                <div className="pf-price-name">{tier.name}</div>
                <div className="pf-price-value">{tier.price}</div>
                <div className="pf-price-desc">{tier.description}</div>

                <div className="pf-price-features">
                  {tier.features.map((item) => (
                    <div key={item} className="pf-price-feature">✓ {item}</div>
                  ))}
                </div>

                <button onClick={startCheckout} className="pf-dark-btn full">
                  Get Instant Access
                </button>

                <div className="pf-mini-trust-text">
                  One-time payment. No subscription.
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ResultsPage({ plan, isPaid, form, savePreview }) {
  if (!isPaid) {
    return (
      <section className="pf-results-hero">
        <div className="pf-container">
          <div className="pf-results-card">
            <div className="pf-locked-badge">Locked</div>
            <h1 className="pf-results-title">This plan is not unlocked yet.</h1>
            <p className="pf-results-text">
              Complete checkout first, then return here to see your full system.
            </p>
            <a href="/" className="pf-primary-btn">Go back</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pf-results-hero">
      <div className="pf-container">
        <div className="pf-results-card">
          <div className="pf-results-topbar">
            <div>
              <div className="pf-success-badge">Unlocked</div>
              <h1 className="pf-results-title">{plan.title}</h1>
              <p className="pf-results-text">{plan.profileSummary}</p>
            </div>

            <div className="pf-download-actions">
              <button onClick={savePreview} className="pf-secondary-button">Save</button>
              <button onClick={() => downloadPlanAsHtml(plan, form)} className="pf-secondary-button">Download</button>
              <button onClick={() => downloadPlanAsText(plan, form)} className="pf-secondary-button">TXT</button>
              <button onClick={() => printPlan(plan)} className="pf-dark-btn">Print / PDF</button>
            </div>
          </div>

          <div className="pf-summary-grid-four">
            <div className="pf-summary-box">
              <div className="pf-summary-label">Calories</div>
              <div className="pf-summary-value">{plan.macros.calories}</div>
            </div>
            <div className="pf-summary-box">
              <div className="pf-summary-label">Protein</div>
              <div className="pf-summary-value">{plan.macros.protein}</div>
            </div>
            <div className="pf-summary-box">
              <div className="pf-summary-label">Carbs</div>
              <div className="pf-summary-value">{plan.macros.carbs}</div>
            </div>
            <div className="pf-summary-box">
              <div className="pf-summary-label">Fat</div>
              <div className="pf-summary-value">{plan.macros.fat}</div>
            </div>
          </div>

          <div className="pf-summary-grid-two">
            <div className="pf-big-card">
              <div className="pf-big-title">Daily hydration target</div>
              <div className="pf-big-value">{plan.hydrationTarget}</div>
              <div className="pf-big-text">During training: {plan.duringTraining}</div>
            </div>
            <div className="pf-big-card">
              <div className="pf-big-title">Carb focus</div>
              <div className="pf-big-text">{plan.carbFocus}</div>
            </div>
          </div>

          <div className="pf-summary-grid-two">
            <div className="pf-big-card">
              <div className="pf-big-title">Sleep target</div>
              <div className="pf-big-value">{plan.sleepGoal.target}</div>
              <div className="pf-big-text">Current setup: {plan.sleepGoal.actual}</div>
            </div>
            <div className="pf-big-card">
              <div className="pf-big-title">Sleep recovery note</div>
              <div className="pf-big-text">{plan.sleepGoal.note}</div>
            </div>
          </div>

          <div className="pf-why-box">
            <div className="pf-why-title">Why this system works</div>
            <div className="pf-why-text">{plan.whyThisWorks}</div>
          </div>

          <div className="pf-summary-grid-two">
            <div className="pf-mini-card">
              <div className="pf-results-block-title">Main priorities</div>
              {plan.priorityBullets.map((tip) => (
                <div key={tip} className="pf-small-result">✓ {tip}</div>
              ))}
            </div>

            <div className="pf-mini-card">
              <div className="pf-results-block-title">Risk flags</div>
              {plan.trainingRiskFlags.map((tip) => (
                <div key={tip} className="pf-small-result">• {tip}</div>
              ))}
            </div>
          </div>

          <div className="pf-summary-grid-two">
            <div className="pf-mini-card">
              <div className="pf-results-block-title">Why your timing looks like this</div>
              {plan.fuelTimingNotes.map((tip) => (
                <div key={tip} className="pf-small-result">• {tip}</div>
              ))}
            </div>

            <div className="pf-mini-card">
              <div className="pf-results-block-title">Recovery system</div>
              {plan.recoveryTips.map((tip) => (
                <div key={tip} className="pf-small-result">✓ {tip}</div>
              ))}
            </div>
          </div>

          <div className="pf-summary-grid-two">
            <div className="pf-mini-card">
              <div className="pf-results-block-title">Sleep actions</div>
              {plan.sleepGoal.actions.map((tip) => (
                <div key={tip} className="pf-small-result">✓ {tip}</div>
              ))}
            </div>

            <div className="pf-mini-card">
              <div className="pf-results-block-title">Common mistakes to avoid</div>
              {plan.commonMistakes.map((item) => (
                <div key={item} className="pf-small-result">• {item}</div>
              ))}
            </div>
          </div>

          <div className="pf-section-block">
            <div className="pf-results-block-title">Your full day schedule</div>
            <div className="pf-full-plan-wrap">
              {plan.items.map((item) => (
                <div key={item.time + item.title} className="pf-full-plan-item">
                  <div className="pf-time-box">{item.time}</div>
                  <div className="pf-item-content">
                    <div className="pf-item-title">{item.title}</div>
                    <div className="pf-item-desc">{item.desc}</div>
                    <div className="pf-item-meta">{item.macros}</div>
                    <div className="pf-item-meta secondary">{item.hydration}</div>
                    <div className="pf-item-why">Why this matters: {item.why}</div>
                    <ul className="pf-examples-list">
                      {item.examples.map((example) => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pf-summary-grid-two">
            <div className="pf-mini-card">
              <div className="pf-results-block-title">Competition / meet day version</div>
              <div className="pf-small-result"><strong>Night before:</strong> {plan.meetGameDay.nightBefore}</div>
              <div className="pf-small-result"><strong>Pre-event:</strong> {plan.meetGameDay.preEvent}</div>
              <div className="pf-small-result"><strong>During:</strong> {plan.meetGameDay.during}</div>
              <div className="pf-small-result"><strong>After:</strong> {plan.meetGameDay.after}</div>
            </div>

            <div className="pf-mini-card">
              <div className="pf-results-block-title">Quick grocery list</div>
              {plan.groceryList.map((item) => (
                <div key={item} className="pf-small-result">• {item}</div>
              ))}
            </div>
          </div>

          <div className="pf-summary-grid-two">
            <div className="pf-mini-card">
              <div className="pf-results-block-title">Fast grab-and-go options</div>
              {plan.convenienceList.map((item) => (
                <div key={item} className="pf-small-result">• {item}</div>
              ))}
            </div>

            <div className="pf-mini-card">
              <div className="pf-results-block-title">Electrolyte note</div>
              <div className="pf-small-result">{plan.electrolyteNote}</div>
            </div>
          </div>

          <div className="pf-note-box">
            This is general educational fueling guidance, not medical advice. Adjust for allergies, preferences, and any advice from a qualified professional.
          </div>

          <div className="pf-results-bottom-actions">
            <a href="/" className="pf-secondary-btn">Build another plan</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PeakFuelWebsite() {
  const [form, setForm] = useState({
    email: "",
    sport: "swimming",
    sex: "male",
    goal: "perform",
    ageRange: "16-18",
    weight: "150",
    height: "",
    intensity: "hard",
    duration: "90",
    trainingType: "mixed",
    bodyGoal: "maintain",
    wakeTime: "06:30",
    schoolStart: "08:00",
    practiceTime: "15:45",
    secondSessionTime: "",
    secondSessionDuration: "60",
    thirdSessionTime: "",
    thirdSessionDuration: "45",
    sessionCount: "1",
    bedTime: "22:30",
    sleepQuality: "okay",
    wakeDifficulty: "medium",
    doubleDay: false,
    stomachSensitivity: "normal",
    digestTolerance: "good",
    currentHydration: "okay",
    sweatRate: "normal",
    caffeine: "none",
    competitionFrequency: "sometimes",
    eatingPattern: "somewhat",
    soreness: "medium",
    breakfastHabit: "sometimes",
    appetite: "normal",
    budgetLevel: "medium",
    sessionGoal: "normal",
    weatherLoad: "indoor",
  });

  const [leadMessage, setLeadMessage] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [path, setPath] = useState("/");

  const plan = useMemo(() => buildPlan(form), [form]);

  useEffect(() => {
    const currentPath = window.location.pathname || "/";
    setPath(currentPath);

    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.form) {
          setForm((prev) => ({ ...prev, ...parsed.form }));
        }
      } catch (error) {
        console.error("Could not restore saved plan.", error);
      }
    }

    if (paid === "1") {
      setIsPaid(true);
    }
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function savePreview() {
    if (!String(form.email || "").trim()) {
      setLeadMessage("Enter your email first so your plan can be saved.");
      return;
    }

    const payload = {
      email: form.email,
      form,
      plan,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setLeadMessage("Plan saved to this device.");
  }

  function clearSaved() {
    localStorage.removeItem(STORAGE_KEY);
    setLeadMessage("Saved plan cleared from this device.");
  }

  function startCheckout() {
    if (!String(form.email || "").trim()) {
      setLeadMessage("Enter your email first before unlocking your full system.");
      return;
    }

    const payload = {
      email: form.email,
      form,
      plan,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.location.href = checkoutLinks.instant;
  }

  return (
    <div className="pf-page">
      <style>{globalCss}</style>

      {path === "/results" ? (
        <ResultsPage
          plan={plan}
          isPaid={isPaid}
          form={form}
          savePreview={savePreview}
        />
      ) : (
        <LandingPage
          form={form}
          updateField={updateField}
          plan={plan}
          startCheckout={startCheckout}
          savePreview={savePreview}
          clearSaved={clearSaved}
          leadMessage={leadMessage}
        />
      )}
    </div>
  );
}

const globalCss = `
  :root {
    --pf-text: #09090b;
    --pf-sub: #52525b;
    --pf-sub-2: #71717a;
    --pf-line: #e4e4e7;
    --pf-bg-soft: #fafafa;
    --pf-blue: #0ea5e9;
    --pf-blue-dark: #0369a1;
    --pf-shadow: 0 12px 30px rgba(0,0,0,0.05);
  }

  html { scroll-behavior: smooth; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #ffffff;
    color: var(--pf-text);
    overflow-x: hidden;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  .pf-page {
    min-height: 100vh;
    background: #ffffff;
    color: var(--pf-text);
  }

  .pf-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .pf-container-section,
  .pf-container-section-tight {
    max-width: 1200px;
    margin: 0 auto;
    padding-left: 24px;
    padding-right: 24px;
  }

  .pf-container-section {
    padding-top: 28px;
    padding-bottom: 64px;
  }

  .pf-container-section-tight {
    padding-top: 8px;
    padding-bottom: 56px;
  }

  .pf-hero {
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--pf-line);
    background:
      radial-gradient(circle at top left, rgba(56,189,248,0.16), transparent 28%),
      linear-gradient(to bottom, #ffffff, #f8fbff);
  }

  .pf-grid-bg {
    position: absolute;
    inset: 0;
    opacity: 0.45;
    background-image:
      linear-gradient(to right, rgba(24,24,27,0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(24,24,27,0.04) 1px, transparent 1px);
    background-size: 42px 42px;
    pointer-events: none;
  }

  .pf-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
    margin-top: 24px;
    border: 1px solid rgba(228,228,231,0.9);
    border-radius: 28px;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.04);
  }

  .pf-logo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .pf-logo {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: #09090b;
    color: white;
    font-weight: 800;
    font-size: 14px;
    flex: 0 0 auto;
  }

  .pf-logo-title { font-size: 14px; font-weight: 800; }
  .pf-logo-sub { font-size: 12px; color: var(--pf-sub-2); }

  .pf-nav {
    display: flex;
    gap: 24px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }

  .pf-nav-link {
    color: var(--pf-sub);
    text-decoration: none;
    font-size: 14px;
    font-weight: 700;
  }

  .pf-header-cta,
  .pf-primary-btn,
  .pf-secondary-btn,
  .pf-dark-btn,
  .pf-secondary-button,
  .pf-ghost-button {
    transition:
      transform .18s ease,
      opacity .18s ease,
      background .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .pf-header-cta:hover,
  .pf-primary-btn:hover,
  .pf-secondary-btn:hover,
  .pf-dark-btn:hover,
  .pf-secondary-button:hover,
  .pf-ghost-button:hover {
    transform: translateY(-1px);
  }

  .pf-header-cta {
    background: #09090b;
    color: white;
    text-decoration: none;
    padding: 12px 16px;
    border-radius: 16px;
    font-weight: 800;
    font-size: 14px;
    white-space: nowrap;
  }

  .pf-hero-grid {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1.02fr 0.98fr;
    gap: 40px;
    align-items: center;
    padding: 48px 0 72px;
  }

  .pf-hero-left {
    padding-top: 8px;
    min-width: 0;
  }

  .pf-badge {
    display: inline-flex;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255,255,255,0.9);
    color: var(--pf-blue-dark);
    border: 1px solid #bae6fd;
    font-weight: 800;
    font-size: 12px;
  }

  .pf-hero-title {
    font-size: 66px;
    line-height: 1.01;
    letter-spacing: -0.05em;
    margin: 20px 0 0;
    max-width: 640px;
    word-break: break-word;
  }

  .pf-hero-text {
    margin-top: 18px;
    max-width: 620px;
    color: var(--pf-sub);
    font-size: 19px;
    line-height: 1.65;
  }

  .pf-hero-buttons,
  .pf-button-row,
  .pf-download-actions,
  .pf-results-bottom-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .pf-hero-buttons { margin-top: 28px; }
  .pf-button-row { margin-top: 18px; }
  .pf-download-actions { justify-content: flex-end; }
  .pf-results-bottom-actions { margin-top: 20px; }

  .pf-primary-btn,
  .pf-secondary-btn,
  .pf-dark-btn,
  .pf-secondary-button,
  .pf-ghost-button {
    border-radius: 18px;
    font-weight: 800;
    font-size: 15px;
    line-height: 1.2;
    text-align: center;
    cursor: pointer;
  }

  .pf-primary-btn {
    background: var(--pf-blue);
    color: white;
    text-decoration: none;
    padding: 16px 22px;
    display: inline-block;
  }

  .pf-secondary-btn {
    background: white;
    color: var(--pf-text);
    text-decoration: none;
    padding: 16px 22px;
    border: 1px solid #d4d4d8;
    display: inline-block;
  }

  .pf-secondary-button {
    background: white;
    color: var(--pf-text);
    border: 1px solid #d4d4d8;
    padding: 15px 20px;
  }

  .pf-ghost-button {
    background: #fafafa;
    color: var(--pf-text);
    border: 1px solid #e4e4e7;
    padding: 15px 20px;
  }

  .pf-dark-btn {
    display: inline-block;
    background: #09090b;
    color: white;
    border: 0;
    padding: 15px 20px;
  }

  .pf-dark-btn.full {
    width: 100%;
    margin-top: 24px;
  }

  .pf-hero-trust-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 20px;
  }

  .pf-pill {
    padding: 10px 14px;
    border-radius: 999px;
    background: #ffffff;
    border: 1px solid var(--pf-line);
    color: #27272a;
    font-size: 13px;
    font-weight: 700;
  }

  .pf-mini-proof {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 22px;
  }

  .pf-mini-proof-item {
    border: 1px solid var(--pf-line);
    background: rgba(255,255,255,0.8);
    border-radius: 18px;
    padding: 14px 16px;
    min-width: 150px;
  }

  .pf-mini-proof-item strong {
    display: block;
    font-size: 22px;
    line-height: 1.1;
  }

  .pf-mini-proof-item span {
    display: block;
    color: var(--pf-sub-2);
    font-size: 13px;
    margin-top: 4px;
  }

  .pf-preview-shell { min-width: 0; }

  .pf-preview-top {
    background: linear-gradient(135deg, #0ea5e9, #22d3ee 45%, #111827);
    color: white;
    border-radius: 30px;
    padding: 24px;
  }

  .pf-preview-meta {
    text-transform: uppercase;
    letter-spacing: .2em;
    font-size: 11px;
    font-weight: 800;
    color: rgba(255,255,255,0.82);
  }

  .pf-preview-title {
    font-size: 30px;
    font-weight: 800;
    line-height: 1.1;
    margin-top: 12px;
    word-break: break-word;
  }

  .pf-preview-summary {
    margin-top: 10px;
    color: rgba(255,255,255,0.92);
    line-height: 1.7;
    font-size: 15px;
  }

  .pf-preview-wrap {
    margin-top: 18px;
    background: white;
    border: 1px solid var(--pf-line);
    border-radius: 30px;
    padding: 18px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.05);
  }

  .pf-metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 12px;
    margin-bottom: 14px;
  }

  .pf-metric-card,
  .pf-summary-box {
    border: 1px solid var(--pf-line);
    background: #fafafa;
    border-radius: 20px;
    padding: 14px;
    min-width: 0;
  }

  .pf-metric-label,
  .pf-summary-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--pf-sub-2);
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .pf-metric-value,
  .pf-summary-value {
    margin-top: 8px;
    font-weight: 800;
    font-size: 18px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .pf-preview-item,
  .pf-full-plan-item {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    border: 1px solid var(--pf-line);
    border-radius: 24px;
    padding: 16px;
    margin-bottom: 12px;
    min-width: 0;
  }

  .pf-item-content { flex: 1; min-width: 0; }

  .pf-time-box {
    min-width: 92px;
    background: #09090b;
    color: white;
    border-radius: 18px;
    padding: 12px 10px;
    text-align: center;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.3;
    flex: 0 0 auto;
  }

  .pf-item-title {
    font-weight: 800;
    font-size: 16px;
    overflow-wrap: anywhere;
  }

  .pf-item-desc {
    margin-top: 6px;
    color: var(--pf-sub);
    line-height: 1.7;
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  .pf-item-meta {
    margin-top: 10px;
    color: var(--pf-blue-dark);
    font-size: 13px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .pf-item-meta.secondary { color: #0f172a; }

  .pf-item-why {
    margin-top: 10px;
    font-size: 13px;
    color: #52525b;
    line-height: 1.6;
  }

  .pf-locked-block,
  .pf-why-box {
    border: 1px solid #bae6fd;
    background: linear-gradient(135deg, #f0f9ff, #ffffff, #ecfeff);
    border-radius: 28px;
    padding: 18px;
    margin-top: 6px;
  }

  .pf-locked-badge,
  .pf-success-badge {
    display: inline-block;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 11px;
    font-weight: 800;
    color: white;
  }

  .pf-locked-badge { background: #09090b; }
  .pf-success-badge { background: #166534; }

  .pf-locked-title,
  .pf-why-title {
    font-weight: 800;
    font-size: 22px;
    margin-top: 14px;
  }

  .pf-locked-text,
  .pf-why-text {
    color: var(--pf-sub);
    font-size: 14px;
    line-height: 1.7;
    margin-top: 8px;
  }

  .pf-locked-feature-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 10px;
    margin: 16px 0 12px;
  }

  .pf-locked-feature {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    background: rgba(255,255,255,0.75);
    border: 1px solid #dbeafe;
    border-radius: 14px;
    padding: 10px 12px;
  }

  .pf-light-section {
    background: #ffffff;
    padding: 56px 0 12px;
  }

  .pf-for-you-section,
  .pf-two-col,
  .pf-summary-grid-two {
    display: grid;
    gap: 26px;
    align-items: start;
  }

  .pf-for-you-section {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }

  .pf-two-col {
    grid-template-columns: 1fr 0.92fr;
    gap: 32px;
  }

  .pf-for-you-card,
  .pf-form-card,
  .pf-side-card,
  .pf-quote-card,
  .pf-proof-card,
  .pf-price-card,
  .pf-results-card,
  .pf-big-card,
  .pf-mini-card {
    border: 1px solid var(--pf-line);
    border-radius: 30px;
    background: white;
    padding: 24px;
    min-width: 0;
  }

  .pf-for-you-card,
  .pf-form-card {
    background: linear-gradient(135deg, #ffffff, #fafafa);
  }

  .pf-for-you-row,
  .pf-bullet-row,
  .pf-small-result {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 0;
    border-bottom: 1px solid #f4f4f5;
    color: #27272a;
    line-height: 1.7;
    font-size: 15px;
  }

  .pf-check,
  .pf-bullet-dot {
    color: var(--pf-blue-dark);
    font-weight: 900;
    flex: 0 0 auto;
  }

  .pf-trust-strip,
  .pf-proof-grid,
  .pf-summary-grid-four {
    display: grid;
    gap: 16px;
  }

  .pf-trust-strip {
    grid-template-columns: repeat(3, minmax(0,1fr));
  }

  .pf-proof-grid {
    grid-template-columns: repeat(3, minmax(0,1fr));
    margin-top: 28px;
  }

  .pf-trust-item,
  .pf-proof-card {
    border: 1px solid var(--pf-line);
    border-radius: 24px;
    padding: 20px;
    background: white;
  }

  .pf-trust-title,
  .pf-proof-title,
  .pf-side-top,
  .pf-results-block-title {
    font-weight: 800;
    font-size: 22px;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .pf-trust-text,
  .pf-proof-text,
  .pf-quote-sub,
  .pf-helper-text,
  .pf-note-box,
  .pf-section-text,
  .pf-results-text,
  .pf-big-text {
    margin-top: 8px;
    color: var(--pf-sub);
    line-height: 1.7;
    font-size: 15px;
    overflow-wrap: anywhere;
  }

  .pf-section-heading { max-width: 780px; }
  .pf-section-heading.center { text-align: center; margin: 0 auto; }

  .pf-eyebrow {
    color: var(--pf-blue-dark);
    font-weight: 800;
    font-size: 12px;
    letter-spacing: .24em;
    text-transform: uppercase;
  }

  .pf-section-title {
    margin: 12px 0 0;
    font-weight: 800;
    font-size: 46px;
    line-height: 1.08;
    letter-spacing: -0.03em;
    overflow-wrap: anywhere;
  }

  .pf-progress-row {
    margin-bottom: 18px;
  }

  .pf-progress-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: var(--pf-sub-2);
    margin-bottom: 10px;
  }

  .pf-progress-bar {
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: #e5e7eb;
    overflow: hidden;
  }

  .pf-progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #38bdf8, #0ea5e9);
  }

  .pf-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 16px;
  }

  .pf-field { min-width: 0; }

  .pf-label {
    display: block;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #3f3f46;
  }

  .pf-hint {
    margin-top: 6px;
    font-size: 12px;
    color: var(--pf-sub-2);
    line-height: 1.5;
  }

  .pf-input {
    width: 100%;
    min-width: 0;
    min-height: 56px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid #d4d4d8;
    background: white;
    color: var(--pf-text);
    font-size: 15px;
    outline: none;
    box-shadow: none;
  }

  .pf-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12);
  }

  .pf-checkbox-row {
    display: flex;
    gap: 10px;
    align-items: center;
    border: 1px solid var(--pf-line);
    border-radius: 18px;
    padding: 16px;
    margin-top: 16px;
    background: white;
    font-size: 14px;
    color: #3f3f46;
  }

  .pf-quote-text {
    font-size: 18px;
    line-height: 1.7;
    font-weight: 700;
    color: #18181b;
    overflow-wrap: anywhere;
  }

  .pf-proof-section {
    padding: 14px 0 68px;
  }

  .pf-pricing-section {
    background: #09090b;
    color: white;
    padding: 72px 0;
  }

  .pf-pricing-grid-single {
    display: grid;
    grid-template-columns: minmax(0, 560px);
    justify-content: center;
    margin-top: 34px;
  }

  .pf-price-card {
    border: 2px solid #38bdf8;
    border-radius: 36px;
    padding: 34px;
    background: white;
    color: var(--pf-text);
  }

  .pf-price-badge {
    display: inline-block;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 800;
    background: #e0f2fe;
    color: var(--pf-blue-dark);
  }

  .pf-price-name {
    margin-top: 18px;
    font-size: 28px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .pf-price-value {
    margin-top: 12px;
    font-size: 56px;
    font-weight: 900;
    line-height: 1;
    overflow-wrap: anywhere;
  }

  .pf-price-desc {
    margin-top: 14px;
    color: var(--pf-sub);
    line-height: 1.7;
  }

  .pf-price-features {
    margin-top: 18px;
    display: grid;
    gap: 10px;
  }

  .pf-price-feature {
    font-size: 15px;
    line-height: 1.7;
    color: #27272a;
  }

  .pf-mini-trust-text {
    margin-top: 14px;
    text-align: center;
    color: var(--pf-sub-2);
    font-size: 13px;
    font-weight: 700;
  }

  .pf-results-hero {
    padding: 48px 0 72px;
    background: linear-gradient(to bottom, #f8fbff, #ffffff);
    min-height: 100vh;
  }

  .pf-results-card {
    box-shadow: 0 12px 30px rgba(0,0,0,0.05);
    border-radius: 32px;
  }

  .pf-results-topbar {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .pf-results-title {
    font-size: 44px;
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin: 18px 0 0;
    overflow-wrap: anywhere;
  }

  .pf-summary-grid-four {
    grid-template-columns: repeat(4, minmax(0,1fr));
    margin-top: 28px;
  }

  .pf-summary-grid-two {
    grid-template-columns: repeat(2, minmax(0,1fr));
    margin-top: 18px;
  }

  .pf-big-card,
  .pf-mini-card {
    border-radius: 24px;
  }

  .pf-big-title {
    font-size: 14px;
    font-weight: 800;
    color: #18181b;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .pf-big-value {
    margin-top: 10px;
    font-size: 28px;
    font-weight: 900;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .pf-section-block { margin-top: 24px; }
  .pf-full-plan-wrap { display: grid; gap: 14px; }
  .pf-examples-list {
    margin: 10px 0 0;
    padding-left: 18px;
    color: #27272a;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }

  .pf-note-box {
    margin-top: 22px;
    border-top: 1px solid var(--pf-line);
    padding-top: 18px;
    font-size: 14px;
  }

  @media (max-width: 1100px) {
    .pf-hero-grid,
    .pf-two-col,
    .pf-for-you-section,
    .pf-summary-grid-four,
    .pf-trust-strip,
    .pf-proof-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .pf-header {
      flex-direction: column;
      align-items: stretch;
    }

    .pf-nav {
      justify-content: center;
    }

    .pf-header-cta {
      width: 100%;
    }

    .pf-hero-title { font-size: 48px; }
    .pf-section-title { font-size: 34px; }
    .pf-results-title { font-size: 34px; }

    .pf-summary-grid-two,
    .pf-form-grid,
    .pf-locked-feature-grid,
    .pf-metrics-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 640px) {
    .pf-container,
    .pf-container-section,
    .pf-container-section-tight {
      padding-left: 16px;
      padding-right: 16px;
    }

    .pf-hero-grid {
      padding: 28px 0 40px;
      gap: 24px;
    }

    .pf-hero-title {
      font-size: 38px;
      line-height: 1.04;
    }

    .pf-section-title {
      font-size: 30px;
      line-height: 1.08;
    }

    .pf-results-title {
      font-size: 30px;
      line-height: 1.08;
    }

    .pf-hero-text,
    .pf-section-text,
    .pf-results-text {
      font-size: 16px;
    }

    .pf-preview-top,
    .pf-preview-wrap,
    .pf-form-card,
    .pf-side-card,
    .pf-quote-card,
    .pf-price-card,
    .pf-results-card,
    .pf-for-you-card,
    .pf-big-card,
    .pf-mini-card {
      padding: 18px;
      border-radius: 24px;
    }

    .pf-preview-title {
      font-size: 24px;
      line-height: 1.08;
    }

    .pf-preview-item,
    .pf-full-plan-item {
      flex-direction: column;
      gap: 12px;
    }

    .pf-time-box {
      min-width: 0;
      width: fit-content;
      max-width: 100%;
      padding: 10px 14px;
    }

    .pf-hero-buttons,
    .pf-button-row,
    .pf-download-actions,
    .pf-results-bottom-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .pf-primary-btn,
    .pf-secondary-btn,
    .pf-dark-btn,
    .pf-secondary-button,
    .pf-ghost-button,
    .pf-header-cta {
      width: 100%;
    }

    .pf-form-grid,
    .pf-summary-grid-two,
    .pf-summary-grid-four,
    .pf-locked-feature-grid,
    .pf-metrics-grid {
      grid-template-columns: 1fr;
    }

    .pf-price-value {
      font-size: 42px;
    }

    .pf-mini-proof {
      flex-direction: column;
    }

    .pf-checkbox-row {
      align-items: flex-start;
    }

    .pf-input {
      min-height: 56px;
      height: 56px;
      padding: 0 14px;
      font-size: 16px;
    }
  }
`;
