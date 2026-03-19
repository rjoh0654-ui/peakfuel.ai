import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

const STORAGE_KEY = "peakfuel_checkout_plan_v4";
const SAVED_PLANS_KEY = "peakfuel_saved_plans_v2";

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

const planTiers = [
  {
    key: "instant",
    name: "PeakFuel Full System",
    price: "$4.99",
    badge: "Instant access",
    description:
      "A personalized fueling system built around your sport, schedule, training load, and recovery needs.",
    features: [
      "Exact macro targets",
      "Hydration target in ounces",
      "Pre, during, and post-workout strategy",
      "Meet / game day fueling version",
      "Recovery guidance and timing",
      "Built from your actual schedule",
    ],
  },
];

function toMinutes(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
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

function niceSportLabel(sport) {
  const found = sports.find(([value]) => value === sport);
  return found ? found[1] : "Athlete";
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function hasUserCustomized(form) {
  return !(
    form.sport === "swimming" &&
    form.goal === "perform" &&
    form.weight === "150" &&
    form.intensity === "hard" &&
    form.duration === "90" &&
    form.practiceTime === "15:45" &&
    form.trainingType === "mixed" &&
    form.currentHydration === "okay"
  );
}

function getCalories(form) {
  const weight = Number(form.weight) || 150;
  const duration = Number(form.duration) || 90;

  let base = weight * 15;

  if (form.trainingType === "endurance") base += 150;
  if (form.trainingType === "power") base += 75;
  if (form.intensity === "hard") base += 150;
  if (form.intensity === "very-hard") base += 300;
  if (duration >= 90) base += 100;
  if (duration >= 120) base += 150;
  if (form.doubleDay) base += 300;
  if (form.goal === "gain") base += 250;
  if (form.goal === "lean") base -= 200;

  return Math.round(base);
}

function getProteinGrams(form) {
  const weight = Number(form.weight) || 150;
  if (form.goal === "gain") return Math.round(weight * 0.95);
  if (form.goal === "lean") return Math.round(weight * 0.9);
  return Math.round(weight * 0.85);
}

function getCarbGrams(form, calories, protein) {
  const weight = Number(form.weight) || 150;
  let carbs = Math.round(weight * 2.0);

  if (form.trainingType === "endurance") carbs += 40;
  if (form.intensity === "hard") carbs += 25;
  if (form.intensity === "very-hard") carbs += 50;
  if (form.doubleDay) carbs += 40;
  if (form.goal === "gain") carbs += 30;
  if (form.goal === "lean") carbs -= 25;

  const safeMinimum = Math.round(weight * 1.4);
  const roughMax = Math.round((calories - protein * 4 - 55 * 9) / 4);

  return clamp(carbs, safeMinimum, Math.max(roughMax, safeMinimum + 20));
}

function getFatGrams(calories, protein, carbs) {
  const remaining = calories - protein * 4 - carbs * 4;
  return Math.max(45, Math.round(remaining / 9));
}

function getHydrationOunces(form) {
  const weight = Number(form.weight) || 150;
  let ounces = Math.round(weight * 0.6);

  if (form.intensity === "hard") ounces += 12;
  if (form.intensity === "very-hard") ounces += 20;
  if (form.doubleDay) ounces += 20;
  if (Number(form.duration) >= 90) ounces += 8;
  if (Number(form.duration) >= 120) ounces += 8;
  if (form.currentHydration === "low") ounces += 8;

  return ounces;
}

function getDuringTrainingHydration(form) {
  if (
    form.intensity === "very-hard" ||
    Number(form.duration) >= 90 ||
    form.doubleDay
  ) {
    return "16–28 oz per hour + electrolytes";
  }
  if (form.intensity === "hard") {
    return "14–22 oz per hour";
  }
  return "12–18 oz per hour";
}

function getMacroSummary(form, calories, protein, carbs, fat) {
  return {
    calories: `${calories} kcal`,
    protein: `${protein}g`,
    carbs: `${carbs}g`,
    fat: `${fat}g`,
  };
}

function getCarbFocus(form) {
  if (form.goal === "lean") {
    return "Keep most carbs around training, recovery, and higher-output parts of the day.";
  }
  if (form.goal === "gain") {
    return "Push carbs hardest before training, after training, and again at dinner for recovery and growth.";
  }
  if (
    form.trainingType === "endurance" ||
    form.sport === "swimming" ||
    form.intensity === "very-hard"
  ) {
    return "Distribute carbs steadily across the day so energy stays high before and during training.";
  }
  return "Center carbs around training and recovery while keeping earlier meals balanced.";
}

function preWorkoutFoods(stomachSensitivity) {
  if (stomachSensitivity === "sensitive") {
    return ["banana", "applesauce pouch", "toast + honey", "sports drink", "rice cakes"];
  }
  return [
    "bagel + honey",
    "banana + granola bar",
    "pretzels + fruit",
    "rice cakes + jam",
    "toast + peanut butter",
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

function breakfastFoods(goal) {
  if (goal === "gain") return "eggs, toast, fruit, yogurt, and an added carb like oatmeal";
  if (goal === "lean") return "eggs, fruit, toast, and Greek yogurt";
  return "eggs, toast, fruit, and yogurt or oatmeal";
}

function lunchFoods(goal) {
  if (goal === "gain")
    return "rice or pasta, protein, fruit, and an added carb like bread or potatoes";
  if (goal === "lean")
    return "rice or potatoes, lean protein, fruit, and vegetables";
  return "rice, potatoes, or pasta with protein and fruit";
}

function getGoalPhrase(goal) {
  if (goal === "perform") return "performance";
  if (goal === "gain") return "muscle gain";
  if (goal === "lean") return "leaner performance";
  return "maintenance";
}

function getPreviewSummary(form) {
  if (!hasUserCustomized(form)) {
    return "Built around your sport, training schedule, and performance goal.";
  }

  const sport = niceSportLabel(form.sport);
  const sportText =
    sport === "Track & Field" ? "track athlete" : sport.toLowerCase();

  return `Built for a ${form.weight || "150"} lb ${sportText} focused on ${getGoalPhrase(
    form.goal
  )}, with ${form.intensity.replace("-", " ")} training and practice at ${formatTime(
    toMinutes(form.practiceTime) ?? 945
  )}.`;
}

function getThisIsForYouItems(form) {
  const sport = niceSportLabel(form.sport);
  return [
    `You train hard in ${sport} but still guess what to eat before practice.`,
    "You feel low-energy, flat, or underfueled during training.",
    "You want better performance instead of just “eating healthy.”",
    "You need a schedule that fits school, lifting, practice, and recovery.",
  ];
}

function buildPlan(form) {
  const wake = toMinutes(form.wakeTime) ?? 390;
  const school = toMinutes(form.schoolStart) ?? 480;
  const practice = toMinutes(form.practiceTime) ?? 945;
  const bed = toMinutes(form.bedTime) ?? 1350;

  const calories = getCalories(form);
  const protein = getProteinGrams(form);
  const carbs = getCarbGrams(form, calories, protein);
  const fat = getFatGrams(calories, protein, carbs);
  const hydrationOz = getHydrationOunces(form);
  const duringTraining = getDuringTrainingHydration(form);

  const preFoods = preWorkoutFoods(form.stomachSensitivity);
  const recoveryFoods = postWorkoutFoods(form.goal);

  const athleteType = niceSportLabel(form.sport);
  const title =
    form.sport === "swimming"
      ? "Your PeakFuel Swim System"
      : `Your PeakFuel ${athleteType} System`;

  const previewTitle = "Your Personalized Fuel System";
  const previewSummary = getPreviewSummary(form);

  const whyThisWorks =
    form.goal === "gain"
      ? "This system increases total fuel, recovery carbs, and protein timing so you can train hard without falling behind on growth and recovery."
      : form.goal === "lean"
        ? "This system keeps protein high, places carbs where they help performance most, and avoids the classic mistake of underfueling before training."
        : "This system spreads your fuel more intentionally across the day so you can show up to training with better energy, recover faster, and avoid late-day crashes.";

  const meal1Time = formatTime(wake + 30);
  const meal2Time = formatTime(Math.max(school - 30, wake + 150));
  const meal3Time = formatTime(practice - 180);
  const meal4Time = formatTime(practice - 60);
  const meal5Time = formatTime(practice + 20);
  const meal6Time = formatTime(Math.min(bed - 90, practice + 150));

  const items = [
    {
      time: meal1Time,
      title: "Breakfast — Fuel Foundation",
      desc: `Start the day with ${breakfastFoods(form.goal)} so you do not spend the first half of the day trying to catch up.`,
      macros: `Target: ~${Math.round(carbs * 0.2)}g carbs + ${Math.round(protein * 0.22)}g protein`,
      hydration: "Hydration: 16–20 oz water in the morning",
      examples: ["eggs", "toast", "fruit", "yogurt or oatmeal"],
    },
    {
      time: meal2Time,
      title: "Mid-Morning / School Fuel",
      desc: "This keeps your energy stable so you do not enter lunch or practice already underfueled.",
      macros: `Target: ~${Math.round(carbs * 0.1)}g carbs + ${Math.round(protein * 0.1)}g protein`,
      hydration: "Hydration: 10–16 oz",
      examples:
        form.stomachSensitivity === "sensitive"
          ? ["banana", "applesauce pouch", "crackers", "water"]
          : ["granola bar", "fruit", "pretzels", "Greek yogurt"],
    },
    {
      time: meal3Time,
      title: "Main Pre-Training Meal",
      desc: `Build this around ${lunchFoods(form.goal)} so you go into training with real fuel instead of relying on one snack.`,
      macros: `Target: ~${Math.round(carbs * 0.26)}g carbs + ${Math.round(protein * 0.22)}g protein`,
      hydration: "Hydration: 16–24 oz before training window",
      examples: ["rice / pasta / potatoes", "chicken / turkey / beef", "fruit", "water"],
    },
    {
      time: meal4Time,
      title: "Pre-Workout Top-Up",
      desc: "Use a lighter carb-focused snack 45–75 minutes before training to sharpen energy without feeling heavy.",
      macros: `Target: ~${Math.round(carbs * 0.12)}g carbs`,
      hydration: "Hydration: 8–12 oz",
      examples: preFoods,
    },
    {
      time: formatTime(practice),
      title: "During Training Strategy",
      desc: "Do not wait until you feel flat. Your hydration and electrolytes should already be working for you.",
      macros:
        form.doubleDay || form.intensity === "very-hard"
          ? "Add carbs if needed during long or high-output sessions"
          : "Hydration-first approach",
      hydration: `During training: ${duringTraining}`,
      examples:
        form.intensity === "very-hard" || form.doubleDay
          ? ["water bottle", "electrolytes", "sports drink if needed"]
          : ["water bottle", "electrolytes if you sweat heavily"],
    },
    {
      time: meal5Time,
      title: "Post-Workout Recovery Window",
      desc: "This is where you replace what you used, start muscle repair, and avoid going into tomorrow depleted.",
      macros: `Target: ~${Math.round(carbs * 0.18)}g carbs + ${Math.round(protein * 0.22)}g protein`,
      hydration: "Hydration: 16–24 oz + sodium if sweaty session",
      examples: recoveryFoods,
    },
    {
      time: meal6Time,
      title: "Dinner — Recovery + Reset",
      desc: form.doubleDay
        ? "Go bigger here. Heavy days need carbs, protein, fluids, and enough total intake to actually recover."
        : "Finish with a full balanced meal that supports recovery, sleep, and tomorrow’s training.",
      macros: `Target: ~${Math.round(carbs * 0.14)}g carbs + ${Math.round(protein * 0.18)}g protein`,
      hydration: "Hydration: Finish the rest of your daily target",
      examples: ["rice / potatoes / pasta", "protein source", "vegetables", "fruit or dairy"],
    },
  ];

  if (form.doubleDay) {
    items.splice(3, 0, {
      time: formatTime(practice - 270),
      title: "Extra Fuel Block",
      desc: "Because your workload is higher than normal, you need an added fuel block instead of pretending a standard day is enough.",
      macros: `Target: ~${Math.round(carbs * 0.1)}g carbs + ${Math.round(protein * 0.08)}g protein`,
      hydration: "Hydration: 10–16 oz",
      examples: ["bagel", "trail mix", "fruit", "sports drink", "yogurt"],
    });
  }

  const meetGameDay = {
    nightBefore:
      "Eat a normal solid dinner with carbs, protein, fluids, and sodium. Do not try to 'eat perfect' by underfueling.",
    preEvent:
      form.stomachSensitivity === "sensitive"
        ? "Use easier carbs like toast, banana, applesauce, rice, or a sports drink."
        : "Use a carb-based meal 2–4 hours before with lighter protein and lower-fat foods.",
    during:
      "Between events, keep using small carbs, fluids, and electrolytes instead of waiting until you feel drained.",
    after:
      "Recover quickly with fluids, carbs, and protein so the rest of the day or next day does not fall apart.",
  };

  const recoveryTips = [
    `Protein target: ${protein}g/day split across the day instead of all at night.`,
    `Hydration target: ${hydrationOz}–${hydrationOz + 16} oz/day.`,
    `Sleep matters more when soreness is ${form.soreness}. Protect your last meal and hydration.`,
    form.caffeine === "daily"
      ? "Be careful not to rely on caffeine to cover up underfueling."
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
    macros: getMacroSummary(form, calories, protein, carbs, fat),
    items,
    meetGameDay,
    recoveryTips,
    thisIsForYou: getThisIsForYouItems(form),
  };
}

function getSavedPlans() {
  try {
    const raw = localStorage.getItem(SAVED_PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePlanToLibrary(entry) {
  try {
    const existing = getSavedPlans();
    const next = [entry, ...existing.filter((item) => item.id !== entry.id)].slice(0, 25);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

function deleteSavedPlanFromLibrary(id) {
  try {
    const existing = getSavedPlans();
    const next = existing.filter((item) => item.id !== id);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

function buildSavedPlanEntry(form, plan, isPaid) {
  const now = new Date().toISOString();
  return {
    id: `plan_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    name: `${niceSportLabel(form.sport)} Fuel Plan`,
    email: form.email || "",
    form,
    plan,
    isPaid,
  };
}

function downloadPlanFile(planEntry) {
  const blob = new Blob([JSON.stringify(planEntry, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${planEntry.name.replace(/\s+/g, "-").toLowerCase()}-${planEntry.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Field({ label, children }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, text, center = false }) {
  return (
    <div
      style={{
        maxWidth: 780,
        margin: center ? "0 auto" : 0,
        textAlign: center ? "center" : "left",
      }}
    >
      <div style={styles.eyebrow}>{eyebrow}</div>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {text ? <p style={styles.sectionText}>{text}</p> : null}
    </div>
  );
}

function AuthBar({
  authReady,
  user,
  authEmail,
  setAuthEmail,
  sendMagicLink,
  signOut,
}) {
  return (
    <div style={styles.authBar}>
      <div>
        <div style={styles.authBarTitle}>
          {user ? "Account connected" : "Save to your account"}
        </div>
        <div style={styles.authBarText}>
          {user
            ? `Signed in as ${user.email}`
            : "Use a magic link so paid plans are saved to your dashboard."}
        </div>
      </div>

      {user ? (
        <button onClick={signOut} style={styles.secondaryBtnButton}>
          Sign out
        </button>
      ) : (
        <div style={styles.authActions}>
          <input
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="you@example.com"
            style={styles.authInput}
            disabled={!authReady}
          />
          <button
            onClick={sendMagicLink}
            style={styles.primaryDarkButton}
            disabled={!authReady}
          >
            Email me a magic link
          </button>
        </div>
      )}
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
  authNode,
}) {
  const customized = hasUserCustomized(form);

  return (
    <>
      <section style={styles.heroWrap}>
        <div style={styles.gridBg} />
        <div style={styles.container}>
          <header style={styles.header}>
            <div style={styles.logoWrap}>
              <div style={styles.logo}>PF</div>
              <div>
                <div style={styles.logoTitle}>PeakFuel</div>
                <div style={styles.logoSub}>Daily fuel system for athletes</div>
              </div>
            </div>

            <nav style={styles.nav}>
              <a href="#builder" style={styles.navLink}>Builder</a>
              <a href="#preview" style={styles.navLink}>Preview</a>
              <a href="#pricing" style={styles.navLink}>Pricing</a>
              <a href="/dashboard" style={styles.navLink}>Dashboard</a>
            </nav>

            <a href="#builder" style={styles.headerCta}>Build My System</a>
          </header>

          {authNode}

          <div style={styles.heroGrid}>
            <div style={styles.heroLeft}>
              <div style={styles.badge}>Built around real training schedules</div>

              <h1 style={styles.heroTitle}>
                Stop guessing what to eat. Fuel like a real athlete.
              </h1>

              <p style={styles.heroText}>
                PeakFuel builds your exact daily eating schedule, macro targets,
                hydration, and recovery strategy based on your sport, training
                time, workload, and goals.
              </p>

              <div style={styles.heroButtons}>
                <a href="#builder" style={styles.primaryBtn}>Build Your Plan</a>
                <a href="#preview" style={styles.secondaryBtn}>See Live Preview</a>
              </div>

              <div style={styles.heroTrustRow}>
                <div style={styles.heroTrustPill}>Exact daily structure</div>
                <div style={styles.heroTrustPill}>Built from your schedule</div>
                <div style={styles.heroTrustPill}>One-time purchase</div>
              </div>
            </div>

            <div style={styles.previewShell}>
              <div style={styles.previewTopCard}>
                <div style={styles.previewTopMeta}>Live preview</div>
                <div style={styles.previewTitle}>{plan.previewTitle}</div>
                <div style={styles.previewSummary}>{plan.previewSummary}</div>
              </div>

              <div id="preview" style={styles.previewListWrap}>
                <div style={styles.previewMetricsGrid}>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Protein</div>
                    <div style={styles.metricValue}>
                      {customized ? plan.macros.protein : "Personalized"}
                    </div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Carbs</div>
                    <div style={styles.metricValue}>
                      {customized ? plan.macros.carbs : "Calculated"}
                    </div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Hydration</div>
                    <div style={styles.metricValue}>
                      {customized ? plan.hydrationTarget : "Built from inputs"}
                    </div>
                  </div>
                </div>

                {plan.items.slice(0, 3).map((item) => (
                  <div key={item.time + item.title} style={styles.previewItem}>
                    <div style={styles.timeBox}>{item.time}</div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.itemTitle}>{item.title}</div>
                      <div style={styles.itemDesc}>{item.desc}</div>
                      <div style={styles.itemSubMeta}>{item.macros}</div>
                    </div>
                  </div>
                ))}

                <div style={styles.lockedBlock}>
                  <div style={styles.lockedBadge}>Full system preview</div>
                  <div style={styles.lockedTitle}>Unlock your full fuel system</div>
                  <div style={styles.lockedText}>
                    Get your full day structure, exact macros, hydration target,
                    pre / during / post-workout strategy, meet or game day
                    version, and recovery guidance built from your inputs.
                  </div>

                  <div style={styles.lockedFeatureGrid}>
                    <div style={styles.lockedFeature}>✓ Exact calories + macros</div>
                    <div style={styles.lockedFeature}>✓ Hydration in ounces</div>
                    <div style={styles.lockedFeature}>✓ Meet / game day version</div>
                    <div style={styles.lockedFeature}>✓ Recovery system</div>
                  </div>

                  <button onClick={startCheckout} style={styles.primaryDarkButton}>
                    Get Instant Access — $4.99
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.lightSection}>
        <div style={styles.container}>
          <div style={styles.forYouSection}>
            <div>
              <SectionHeading
                eyebrow="This is for you"
                title="Made for athletes who train hard but still end up guessing their nutrition"
                text="PeakFuel is built for athletes who want their food, hydration, and recovery to actually match their training."
              />
            </div>

            <div style={styles.forYouCard}>
              {plan.thisIsForYou.map((item) => (
                <div key={item} style={styles.forYouRow}>
                  <span style={styles.forYouCheck}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={styles.containerSection}>
        <div style={styles.trustStrip}>
          <div style={styles.trustStripItem}>
            <div style={styles.trustStripTitle}>Built for real schedules</div>
            <div style={styles.trustStripText}>School, lifting, practice, dinner, recovery.</div>
          </div>
          <div style={styles.trustStripItem}>
            <div style={styles.trustStripTitle}>Designed for performance</div>
            <div style={styles.trustStripText}>Not generic meal tips. A structured fuel system.</div>
          </div>
          <div style={styles.trustStripItem}>
            <div style={styles.trustStripTitle}>Made for athletes</div>
            <div style={styles.trustStripText}>Useful for high school, club, and serious training.</div>
          </div>
        </div>
      </section>

      <section id="builder" style={styles.containerSectionTight}>
        <div style={styles.twoCol}>
          <div>
            <SectionHeading
              eyebrow="Builder"
              title="Build your personalized fuel system"
              text="Add your sport, schedule, training load, and recovery details so your plan feels specific, useful, and worth buying."
            />

            <div style={styles.formCard}>
              <div style={styles.formGrid}>
                <Field label="Email">
                  <input
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                    style={styles.input}
                  />
                </Field>

                <Field label="Sport">
                  <select
                    value={form.sport}
                    onChange={(e) => updateField("sport", e.target.value)}
                    style={styles.input}
                  >
                    {sports.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Primary goal">
                  <select
                    value={form.goal}
                    onChange={(e) => updateField("goal", e.target.value)}
                    style={styles.input}
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
                    style={styles.input}
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
                    style={styles.input}
                  />
                </Field>

                <Field label="Height (optional)">
                  <input
                    value={form.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    placeholder={`5'11"`}
                    style={styles.input}
                  />
                </Field>

                <Field label="Training intensity">
                  <select
                    value={form.intensity}
                    onChange={(e) => updateField("intensity", e.target.value)}
                    style={styles.input}
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
                    style={styles.input}
                  />
                </Field>

                <Field label="Training type">
                  <select
                    value={form.trainingType}
                    onChange={(e) => updateField("trainingType", e.target.value)}
                    style={styles.input}
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
                    style={styles.input}
                  >
                    {bodyGoalOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Wake time">
                  <input
                    type="time"
                    value={form.wakeTime}
                    onChange={(e) => updateField("wakeTime", e.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field label="School / work start">
                  <input
                    type="time"
                    value={form.schoolStart}
                    onChange={(e) => updateField("schoolStart", e.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field label="Practice / training time">
                  <input
                    type="time"
                    value={form.practiceTime}
                    onChange={(e) => updateField("practiceTime", e.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field label="Bed time">
                  <input
                    type="time"
                    value={form.bedTime}
                    onChange={(e) => updateField("bedTime", e.target.value)}
                    style={styles.input}
                  />
                </Field>

                <Field label="Pre-training stomach">
                  <select
                    value={form.stomachSensitivity}
                    onChange={(e) => updateField("stomachSensitivity", e.target.value)}
                    style={styles.input}
                  >
                    {stomachOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Current hydration habits">
                  <select
                    value={form.currentHydration}
                    onChange={(e) => updateField("currentHydration", e.target.value)}
                    style={styles.input}
                  >
                    {hydrationOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Caffeine use">
                  <select
                    value={form.caffeine}
                    onChange={(e) => updateField("caffeine", e.target.value)}
                    style={styles.input}
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
                    style={styles.input}
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
                    style={styles.input}
                  >
                    {eatingPatternOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Current soreness / fatigue">
                  <select
                    value={form.soreness}
                    onChange={(e) => updateField("soreness", e.target.value)}
                    style={styles.input}
                  >
                    {sorenessOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={form.doubleDay}
                  onChange={(e) => updateField("doubleDay", e.target.checked)}
                />
                <span>I have a double day or unusually heavy training load</span>
              </label>

              <div style={styles.buttonRow}>
                <button onClick={startCheckout} style={styles.primaryDarkButton}>
                  Unlock My Full System
                </button>
                <button onClick={savePreview} style={styles.secondaryBtnButton}>
                  Save Preview
                </button>
              </div>

              {leadMessage ? <p style={styles.helperText}>{leadMessage}</p> : null}
            </div>
          </div>

          <div>
            <div style={styles.sideCard}>
              <div style={styles.sideCardTop}>What your paid plan includes</div>

              {[
                "Exact calories, protein, carbs, and fats",
                "Daily hydration target in ounces",
                "Pre, during, and post-workout strategy",
                "Full daily meal timing structure",
                "Meet / game day fueling version",
                "Recovery tips based on your goal and load",
              ].map((text) => (
                <div key={text} style={styles.bulletRow}>
                  <span style={styles.bulletDot}>✓</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div style={styles.quoteCard}>
              <div style={styles.quoteText}>
                Built to feel specific, practical, and worth the purchase.
              </div>
              <div style={styles.quoteSub}>
                Not generic meal tips. A real structure athletes can actually follow.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" style={styles.pricingSection}>
        <div style={styles.container}>
          <SectionHeading
            eyebrow="Pricing"
            title="One payment. Full access."
            text="A one-time purchase for your full personalized athlete fueling system."
            center
          />

          <div style={styles.pricingGridSingle}>
            {planTiers.map((tier) => (
              <div key={tier.key} style={styles.priceCardHero}>
                <div style={styles.priceBadgeFeatured}>{tier.badge}</div>
                <div style={styles.priceName}>{tier.name}</div>
                <div style={styles.priceValue}>{tier.price}</div>
                <div style={styles.priceDescFeatured}>{tier.description}</div>

                <div style={styles.priceFeatures}>
                  {tier.features.map((item) => (
                    <div key={item} style={styles.priceFeatureDark}>✓ {item}</div>
                  ))}
                </div>

                <button onClick={startCheckout} style={styles.primaryDarkButtonFull}>
                  Get Instant Access
                </button>

                <div style={styles.miniTrustText}>
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

function SavedPlansPanel({
  savedPlans,
  loadSavedPlan,
  deleteSavedPlan,
  downloadSavedPlan,
}) {
  return (
    <section style={styles.containerSection}>
      <div style={styles.savedPlansCard}>
        <div style={styles.savedPlansTopRow}>
          <div>
            <div style={styles.savedPlansEyebrow}>Your library</div>
            <div style={styles.savedPlansTitle}>Saved on this device</div>
            <div style={styles.savedPlansText}>
              Previews and plan backups saved locally in this browser.
            </div>
          </div>
        </div>

        {savedPlans.length === 0 ? (
          <div style={styles.savedEmptyState}>
            No saved plans yet.
          </div>
        ) : (
          <div style={styles.savedPlansList}>
            {savedPlans.map((item) => (
              <div key={item.id} style={styles.savedPlanRow}>
                <div style={{ flex: 1 }}>
                  <div style={styles.savedPlanName}>{item.name}</div>
                  <div style={styles.savedPlanMeta}>
                    {item.isPaid ? "Unlocked plan" : "Preview"} •{" "}
                    {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={styles.savedPlanActions}>
                  <button
                    onClick={() => loadSavedPlan(item)}
                    style={styles.savedActionPrimary}
                  >
                    Load
                  </button>

                  <button
                    onClick={() => downloadSavedPlan(item)}
                    style={styles.savedActionSecondary}
                  >
                    Download
                  </button>

                  <button
                    onClick={() => deleteSavedPlan(item.id)}
                    style={styles.savedActionSecondary}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ResultsPage({
  plan,
  isPaid,
  saveUnlockedPlan,
  goHome,
  openDashboard,
  checkoutState,
}) {
  if (!isPaid) {
    return (
      <section style={styles.resultsHero}>
        <div style={styles.container}>
          <div style={styles.resultsCard}>
            <div style={styles.lockedBadge}>Locked</div>
            <h1 style={styles.resultsTitle}>Your payment is still being confirmed.</h1>
            <p style={styles.resultsText}>
              {checkoutState ||
                "Once payment is confirmed, your plan will be saved to your account and emailed automatically."}
            </p>
            <div style={styles.resultsTopActions}>
              <button onClick={openDashboard} style={styles.primaryDarkButton}>
                Open dashboard
              </button>
              <button onClick={goHome} style={styles.secondaryBtnButton}>
                Go home
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.resultsHero}>
      <div style={styles.container}>
        <div style={styles.resultsCard}>
          <div style={styles.successBadge}>Unlocked</div>
          <h1 style={styles.resultsTitle}>{plan.title}</h1>
          <p style={styles.resultsText}>{plan.profileSummary}</p>

          <div style={styles.resultsTopActions}>
            <button onClick={saveUnlockedPlan} style={styles.primaryDarkButton}>
              Save local backup
            </button>
            <button onClick={() => window.print()} style={styles.secondaryBtnButton}>
              Print / Save PDF
            </button>
            <button onClick={openDashboard} style={styles.secondaryBtnButton}>
              Open dashboard
            </button>
          </div>

          <div style={styles.resultsSummaryGridFour}>
            <div style={styles.summaryBox}>
              <div style={styles.summaryLabel}>Calories</div>
              <div style={styles.summaryValue}>{plan.macros.calories}</div>
            </div>
            <div style={styles.summaryBox}>
              <div style={styles.summaryLabel}>Protein</div>
              <div style={styles.summaryValue}>{plan.macros.protein}</div>
            </div>
            <div style={styles.summaryBox}>
              <div style={styles.summaryLabel}>Carbs</div>
              <div style={styles.summaryValue}>{plan.macros.carbs}</div>
            </div>
            <div style={styles.summaryBox}>
              <div style={styles.summaryLabel}>Fat</div>
              <div style={styles.summaryValue}>{plan.macros.fat}</div>
            </div>
          </div>

          <div style={styles.resultsSummaryGridTwo}>
            <div style={styles.bigInfoCard}>
              <div style={styles.bigInfoTitle}>Daily hydration target</div>
              <div style={styles.bigInfoValue}>{plan.hydrationTarget}</div>
              <div style={styles.bigInfoText}>During training: {plan.duringTraining}</div>
            </div>
            <div style={styles.bigInfoCard}>
              <div style={styles.bigInfoTitle}>Carb focus</div>
              <div style={styles.bigInfoText}>{plan.carbFocus}</div>
            </div>
          </div>

          <div style={styles.whyBox}>
            <div style={styles.whyTitle}>Why this system works</div>
            <div style={styles.whyText}>{plan.whyThisWorks}</div>
          </div>

          <div style={styles.sectionBlock}>
            <div style={styles.resultsBlockTitle}>Your full day schedule</div>
            <div style={styles.fullPlanWrap}>
              {plan.items.map((item) => (
                <div key={item.time + item.title} style={styles.fullPlanItem}>
                  <div style={styles.timeBox}>{item.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.itemTitle}>{item.title}</div>
                    <div style={styles.itemDesc}>{item.desc}</div>
                    <div style={styles.resultMetaLine}>{item.macros}</div>
                    <div style={styles.resultMetaLine}>{item.hydration}</div>
                    <ul style={styles.examplesList}>
                      {item.examples.map((example) => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.resultsSummaryGridTwo}>
            <div style={styles.sectionMiniCard}>
              <div style={styles.resultsBlockTitle}>Meet / game day version</div>
              <div style={styles.smallResultBlock}>
                <strong>Night before:</strong> {plan.meetGameDay.nightBefore}
              </div>
              <div style={styles.smallResultBlock}>
                <strong>Pre-event:</strong> {plan.meetGameDay.preEvent}
              </div>
              <div style={styles.smallResultBlock}>
                <strong>During:</strong> {plan.meetGameDay.during}
              </div>
              <div style={styles.smallResultBlock}>
                <strong>After:</strong> {plan.meetGameDay.after}
              </div>
            </div>

            <div style={styles.sectionMiniCard}>
              <div style={styles.resultsBlockTitle}>Recovery system</div>
              {plan.recoveryTips.map((tip) => (
                <div key={tip} style={styles.smallResultBlock}>
                  ✓ {tip}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.noteBox}>
            This is general educational fueling guidance, not medical advice. Adjust for allergies, preferences, medical needs, and coach or dietitian guidance.
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPage({
  user,
  dashboardPlans,
  refreshDashboard,
  loadingDashboard,
  openPlan,
  signOut,
  goHome,
}) {
  return (
    <section style={styles.resultsHero}>
      <div style={styles.container}>
        <div style={styles.resultsCard}>
          <div style={styles.successBadge}>Dashboard</div>
          <h1 style={styles.resultsTitle}>Your saved PeakFuel plans</h1>
          <p style={styles.resultsText}>
            {user
              ? `Signed in as ${user.email}`
              : "Sign in to view plans saved to your account."}
          </p>

          <div style={styles.resultsTopActions}>
            <button onClick={goHome} style={styles.secondaryBtnButton}>
              Home
            </button>
            {user ? (
              <>
                <button onClick={refreshDashboard} style={styles.secondaryBtnButton}>
                  Refresh
                </button>
                <button onClick={signOut} style={styles.secondaryBtnButton}>
                  Sign out
                </button>
              </>
            ) : null}
          </div>

          {!user ? (
            <div style={styles.savedEmptyState}>
              Go back home and send yourself a magic link first.
            </div>
          ) : loadingDashboard ? (
            <div style={styles.savedEmptyState}>Loading your plans…</div>
          ) : dashboardPlans.length === 0 ? (
            <div style={styles.savedEmptyState}>
              No paid plans found yet. After a successful checkout, the Stripe webhook should save the plan here and email it automatically.
            </div>
          ) : (
            <div style={styles.savedPlansList}>
              {dashboardPlans.map((item) => (
                <div key={item.id} style={styles.savedPlanRow}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.savedPlanName}>
                      {item.plan_name || `${niceSportLabel(item.sport)} Fuel Plan`}
                    </div>
                    <div style={styles.savedPlanMeta}>
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <div style={styles.savedPlanMeta}>
                      {item.email || user.email}
                    </div>
                  </div>

                  <div style={styles.savedPlanActions}>
                    <button
                      onClick={() => openPlan(item)}
                      style={styles.savedActionPrimary}
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function PeakFuelWebsite() {
  const [form, setForm] = useState({
    email: "",
    sport: "swimming",
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
    bedTime: "22:30",
    doubleDay: false,
    stomachSensitivity: "normal",
    currentHydration: "okay",
    caffeine: "none",
    competitionFrequency: "sometimes",
    eatingPattern: "somewhat",
    soreness: "medium",
  });

  const [leadMessage, setLeadMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [path, setPath] = useState(window.location.pathname || "/");
  const [savedPlans, setSavedPlans] = useState([]);
  const [authEmail, setAuthEmail] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [dashboardPlans, setDashboardPlans] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [checkoutState, setCheckoutState] = useState("");

  const plan = useMemo(() => buildPlan(form), [form]);

  function showToast(message) {
    setToastMessage(message);
    window.clearTimeout(window.__peakfuelToastTimer);
    window.__peakfuelToastTimer = window.setTimeout(() => {
      setToastMessage("");
    }, 2500);
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "email") setAuthEmail(value);
  }

  function persistCurrentPayload(nextIsPaid = false) {
    const payload = {
      email: form.email,
      form,
      plan,
      isPaid: nextIsPaid,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  async function sendMagicLink() {
    if (!supabase) {
      showToast("Missing Supabase environment variables.");
      return;
    }

    const email = (authEmail || form.email || "").trim();
    if (!email) {
      showToast("Enter your email first.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/dashboard`,
      },
    });

    if (error) {
      showToast(error.message || "Could not send magic link.");
      return;
    }

    setForm((prev) => ({ ...prev, email }));
    showToast("Magic link sent.");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setDashboardPlans([]);
    showToast("Signed out.");
  }

  function savePreview() {
    if (!form.email.trim()) {
      setLeadMessage("Enter your email first so your preview can be saved.");
      return;
    }

    const payload = persistCurrentPayload(false);
    const entry = buildSavedPlanEntry(payload.form, payload.plan, false);
    const updated = savePlanToLibrary(entry);
    setSavedPlans(updated);
    setLeadMessage("Preview saved to this device.");
    showToast("Preview saved.");
  }

  function saveUnlockedPlan() {
    const payload = persistCurrentPayload(true);
    const entry = buildSavedPlanEntry(payload.form, payload.plan, true);
    const updated = savePlanToLibrary(entry);
    setSavedPlans(updated);
    showToast("Local backup saved.");
  }

  function loadSavedPlan(savedItem) {
    if (!savedItem?.form || !savedItem?.plan) return;
    setForm(savedItem.form);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        email: savedItem.email || savedItem.form.email || "",
        form: savedItem.form,
        plan: savedItem.plan,
        isPaid: !!savedItem.isPaid,
        savedAt: new Date().toISOString(),
      })
    );
    setIsPaid(!!savedItem.isPaid);
    const nextPath = savedItem.isPaid ? "/results" : "/";
    setPath(nextPath);
    window.history.pushState({}, "", nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Saved plan loaded.");
  }

  function deleteSavedPlan(id) {
    const updated = deleteSavedPlanFromLibrary(id);
    setSavedPlans(updated);
    showToast("Saved plan deleted.");
  }

  function downloadSavedPlan(item) {
    downloadPlanFile(item);
    showToast("Download started.");
  }

  async function startCheckout() {
    const email = form.email.trim();
    if (!email) {
      setLeadMessage("Enter your email first before unlocking your full system.");
      return;
    }

    persistCurrentPayload(false);

    try {
      setLeadMessage("Redirecting to secure checkout...");
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          form,
          plan,
          successUrl: `${siteUrl}/results?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${siteUrl}/?canceled=1`,
          userId: user?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Could not create checkout session.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setLeadMessage(error.message || "Checkout failed.");
      showToast(error.message || "Checkout failed.");
    }
  }

  async function refreshDashboard() {
    if (!supabase || !user) return;

    setLoadingDashboard(true);
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDashboardPlans(data || []);
    } catch (error) {
      console.error(error);
      showToast("Could not load dashboard plans.");
    } finally {
      setLoadingDashboard(false);
    }
  }

  function openPlan(dbItem) {
    if (!dbItem?.form_data || !dbItem?.plan_data) return;
    setForm(dbItem.form_data);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        email: dbItem.email || user?.email || "",
        form: dbItem.form_data,
        plan: dbItem.plan_data,
        isPaid: true,
        savedAt: new Date().toISOString(),
      })
    );
    setIsPaid(true);
    setPath("/results");
    window.history.pushState({}, "", "/results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    setPath("/");
    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openDashboard() {
    setPath("/dashboard");
    window.history.pushState({}, "", "/dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function verifySessionFromUrl(sessionId) {
    if (!sessionId) return;

    setCheckoutState("Verifying your payment...");
    try {
      const res = await fetch(
        `/api/checkout-status?session_id=${encodeURIComponent(sessionId)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Could not verify payment.");
      }

      if (data?.paid) {
        setIsPaid(true);
        persistCurrentPayload(true);
        setCheckoutState(
          "Payment confirmed. Your account dashboard and email should update shortly."
        );
        if (user) refreshDashboard();
      } else {
        setCheckoutState("Payment not confirmed yet. Give it a moment and refresh.");
      }
    } catch (error) {
      console.error(error);
      setCheckoutState(error.message || "Could not verify payment.");
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.form) setForm((prev) => ({ ...prev, ...parsed.form }));
        if (parsed?.email) setAuthEmail(parsed.email);
      } catch (error) {
        console.error("Could not restore saved plan.", error);
      }
    }

    setSavedPlans(getSavedPlans());

    const handlePopState = () => {
      setPath(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!supabase) {
        setAuthReady(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setUser(session?.user ?? null);
      setAuthReady(true);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, sessionAfter) => {
        setUser(sessionAfter?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }

    const cleanupPromise = initAuth();

    return () => {
      mounted = false;
      Promise.resolve(cleanupPromise).then((cleanup) => cleanup && cleanup());
    };
  }, []);

  useEffect(() => {
    if (path === "/dashboard" && user) {
      refreshDashboard();
    }
  }, [path, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (path === "/results" && sessionId) {
      verifySessionFromUrl(sessionId);
    }
  }, [path, user]);

  const authNode = (
    <AuthBar
      authReady={authReady}
      user={user}
      authEmail={authEmail}
      setAuthEmail={setAuthEmail}
      sendMagicLink={sendMagicLink}
      signOut={signOut}
    />
  );

  return (
    <div style={styles.page}>
      <style>{globalCss}</style>

      {toastMessage ? <div style={styles.toast}>{toastMessage}</div> : null}

      {path === "/results" ? (
        <ResultsPage
          plan={plan}
          isPaid={isPaid}
          saveUnlockedPlan={saveUnlockedPlan}
          goHome={goHome}
          openDashboard={openDashboard}
          checkoutState={checkoutState}
        />
      ) : path === "/dashboard" ? (
        <DashboardPage
          user={user}
          dashboardPlans={dashboardPlans}
          refreshDashboard={refreshDashboard}
          loadingDashboard={loadingDashboard}
          openPlan={openPlan}
          signOut={signOut}
          goHome={goHome}
        />
      ) : (
        <>
          <LandingPage
            form={form}
            updateField={updateField}
            plan={plan}
            startCheckout={startCheckout}
            savePreview={savePreview}
            leadMessage={leadMessage}
            authNode={authNode}
          />

          <SavedPlansPanel
            savedPlans={savedPlans}
            loadSavedPlan={loadSavedPlan}
            deleteSavedPlan={deleteSavedPlan}
            downloadSavedPlan={downloadSavedPlan}
          />
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    background: "#ffffff",
    color: "#09090b",
    minHeight: "100vh",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
  },
  containerSection: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "28px 24px 64px",
  },
  containerSectionTight: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "8px 24px 56px",
  },
  heroWrap: {
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid #e4e4e7",
    background:
      "radial-gradient(circle at top left, rgba(56,189,248,0.16), transparent 28%), linear-gradient(to bottom, #ffffff, #f8fbff)",
  },
  gridBg: {
    position: "absolute",
    inset: 0,
    opacity: 0.45,
    backgroundImage:
      "linear-gradient(to right, rgba(24,24,27,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.04) 1px, transparent 1px)",
    backgroundSize: "42px 42px",
    pointerEvents: "none",
  },
  header: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: 16,
    marginTop: 24,
    border: "1px solid rgba(228,228,231,0.9)",
    borderRadius: 28,
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
  },
  authBar: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 24,
    border: "1px solid #e4e4e7",
    background: "rgba(255,255,255,0.92)",
    alignItems: "center",
    flexWrap: "wrap",
  },
  authBarTitle: { fontWeight: 800, fontSize: 16 },
  authBarText: { marginTop: 6, color: "#52525b", fontSize: 14, lineHeight: 1.6 },
  authActions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  authInput: {
    width: 260,
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid #d4d4d8",
    background: "white",
    fontSize: 15,
    outline: "none",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    width: 44,
    height: 44,
    display: "grid",
    placeItems: "center",
    borderRadius: 16,
    background: "#09090b",
    color: "white",
    fontWeight: 800,
    fontSize: 14,
  },
  logoTitle: { fontSize: 14, fontWeight: 700 },
  logoSub: { fontSize: 12, color: "#71717a" },
  nav: { display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" },
  navLink: {
    color: "#52525b",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  },
  headerCta: {
    background: "#09090b",
    color: "white",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: 16,
    fontWeight: 700,
    fontSize: 14,
  },
  heroGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "1.02fr 0.98fr",
    gap: 40,
    alignItems: "center",
    padding: "48px 0 72px",
  },
  heroLeft: { paddingTop: 8 },
  badge: {
    display: "inline-flex",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.9)",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    fontWeight: 700,
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 66,
    lineHeight: 1.01,
    letterSpacing: "-0.05em",
    margin: "20px 0 0",
    maxWidth: 640,
  },
  heroText: {
    marginTop: 18,
    maxWidth: 620,
    color: "#52525b",
    fontSize: 19,
    lineHeight: 1.65,
  },
  heroButtons: { display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" },
  heroTrustRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 },
  heroTrustPill: {
    padding: "10px 14px",
    borderRadius: 999,
    background: "#ffffff",
    border: "1px solid #e4e4e7",
    color: "#27272a",
    fontSize: 13,
    fontWeight: 700,
  },
  primaryBtn: {
    background: "#0ea5e9",
    color: "white",
    textDecoration: "none",
    padding: "16px 22px",
    borderRadius: 18,
    fontWeight: 800,
    display: "inline-block",
  },
  primaryBtnButton: {
    background: "#0ea5e9",
    color: "white",
    border: 0,
    padding: "16px 22px",
    borderRadius: 18,
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "white",
    color: "#09090b",
    textDecoration: "none",
    padding: "16px 22px",
    borderRadius: 18,
    fontWeight: 800,
    border: "1px solid #d4d4d8",
    display: "inline-block",
  },
  secondaryBtnButton: {
    background: "white",
    color: "#09090b",
    border: "1px solid #d4d4d8",
    padding: "16px 22px",
    borderRadius: 18,
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryDarkButton: {
    display: "inline-block",
    marginTop: 12,
    background: "#09090b",
    color: "white",
    border: 0,
    padding: "15px 20px",
    borderRadius: 18,
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryDarkButtonFull: {
    display: "block",
    width: "100%",
    textAlign: "center",
    marginTop: 24,
    background: "#09090b",
    color: "white",
    border: 0,
    padding: "15px 20px",
    borderRadius: 18,
    fontWeight: 800,
    cursor: "pointer",
  },
  previewShell: { position: "relative" },
  previewTopCard: {
    background: "linear-gradient(135deg, #0ea5e9, #22d3ee 45%, #111827)",
    color: "white",
    borderRadius: 30,
    padding: 24,
  },
  previewTopMeta: {
    textTransform: "uppercase",
    letterSpacing: ".2em",
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(255,255,255,0.82)",
  },
  previewTitle: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1.1,
    marginTop: 12,
  },
  previewSummary: {
    marginTop: 10,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.7,
    fontSize: 15,
    minHeight: 52,
  },
  previewListWrap: {
    marginTop: 18,
    background: "white",
    border: "1px solid #e4e4e7",
    borderRadius: 30,
    padding: 18,
    boxShadow: "0 12px 30px rgba(0,0,0,0.04)",
  },
  previewMetricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: 12,
    marginBottom: 14,
  },
  metricCard: {
    border: "1px solid #e4e4e7",
    background: "#fafafa",
    borderRadius: 20,
    padding: 14,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  metricValue: {
    marginTop: 8,
    fontWeight: 800,
    fontSize: 18,
    lineHeight: 1.4,
  },
  previewItem: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    border: "1px solid #e4e4e7",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  timeBox: {
    minWidth: 92,
    background: "#09090b",
    color: "white",
    borderRadius: 18,
    padding: "12px 10px",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 800,
  },
  itemTitle: { fontWeight: 800, fontSize: 16 },
  itemDesc: { marginTop: 6, color: "#52525b", lineHeight: 1.7, fontSize: 14 },
  itemSubMeta: { marginTop: 10, color: "#0369a1", fontSize: 13, fontWeight: 700 },
  lockedBlock: {
    border: "1px solid #bae6fd",
    background: "linear-gradient(135deg, #f0f9ff, #ffffff, #ecfeff)",
    borderRadius: 28,
    padding: 18,
    marginTop: 6,
  },
  lockedBadge: {
    display: "inline-block",
    background: "#09090b",
    color: "white",
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 11,
    fontWeight: 800,
  },
  lockedTitle: { fontWeight: 800, fontSize: 22, marginTop: 14 },
  lockedText: {
    color: "#52525b",
    fontSize: 14,
    lineHeight: 1.7,
    marginTop: 8,
    marginBottom: 14,
  },
  lockedFeatureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 10,
    marginBottom: 12,
  },
  lockedFeature: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    background: "rgba(255,255,255,0.75)",
    border: "1px solid #dbeafe",
    borderRadius: 14,
    padding: "10px 12px",
  },
  lightSection: { background: "#ffffff", padding: "56px 0 12px" },
  forYouSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 26,
    alignItems: "center",
  },
  forYouCard: {
    border: "1px solid #e4e4e7",
    borderRadius: 30,
    background: "linear-gradient(135deg, #ffffff, #fafafa)",
    padding: 26,
  },
  forYouRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: "14px 0",
    borderBottom: "1px solid #f4f4f5",
    fontSize: 16,
    color: "#27272a",
    lineHeight: 1.7,
  },
  forYouCheck: { color: "#0284c7", fontWeight: 900 },
  trustStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: 16,
  },
  trustStripItem: {
    border: "1px solid #e4e4e7",
    borderRadius: 24,
    padding: 20,
    background: "white",
  },
  trustStripTitle: { fontWeight: 800, fontSize: 18 },
  trustStripText: {
    marginTop: 8,
    color: "#52525b",
    lineHeight: 1.7,
    fontSize: 14,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 0.92fr",
    gap: 32,
    alignItems: "start",
  },
  eyebrow: {
    color: "#0284c7",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: ".24em",
    textTransform: "uppercase",
  },
  sectionTitle: {
    margin: "12px 0 0",
    fontWeight: 800,
    fontSize: 46,
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
  },
  sectionText: {
    color: "#52525b",
    fontSize: 18,
    lineHeight: 1.8,
    marginTop: 16,
  },
  formCard: {
    marginTop: 24,
    border: "1px solid #e4e4e7",
    borderRadius: 32,
    background: "linear-gradient(135deg, #ffffff, #fafafa)",
    padding: 24,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 16,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    color: "#3f3f46",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 18,
    border: "1px solid #d4d4d8",
    background: "white",
    fontSize: 15,
    outline: "none",
  },
  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    border: "1px solid #e4e4e7",
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    background: "white",
    fontSize: 14,
    color: "#3f3f46",
  },
  buttonRow: { display: "flex", gap: 14, flexWrap: "wrap", marginTop: 18 },
  helperText: { marginTop: 12, fontSize: 14, color: "#52525b" },
  sideCard: {
    border: "1px solid #e4e4e7",
    borderRadius: 32,
    background: "white",
    padding: 24,
  },
  sideCardTop: { fontSize: 22, fontWeight: 800, marginBottom: 14 },
  bulletRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: "14px 0",
    borderBottom: "1px solid #f4f4f5",
    color: "#3f3f46",
    lineHeight: 1.7,
    fontSize: 15,
  },
  bulletDot: { color: "#0284c7", fontWeight: 900 },
  quoteCard: {
    marginTop: 16,
    border: "1px solid #e4e4e7",
    borderRadius: 28,
    background: "#fafafa",
    padding: 22,
  },
  quoteText: {
    fontSize: 18,
    lineHeight: 1.7,
    fontWeight: 700,
    color: "#18181b",
  },
  quoteSub: { marginTop: 10, color: "#52525b", fontSize: 14, lineHeight: 1.7 },
  pricingSection: { background: "#09090b", color: "white", padding: "72px 0" },
  pricingGridSingle: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 560px)",
    justifyContent: "center",
    marginTop: 34,
  },
  priceCardHero: {
    border: "2px solid #38bdf8",
    borderRadius: 36,
    padding: 34,
    background: "white",
    color: "#09090b",
  },
  priceBadgeFeatured: {
    display: "inline-block",
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 800,
    background: "#e0f2fe",
    color: "#0369a1",
  },
  priceName: { marginTop: 18, fontSize: 28, fontWeight: 800 },
  priceValue: { marginTop: 12, fontSize: 56, fontWeight: 900 },
  priceDescFeatured: { marginTop: 14, color: "#52525b", lineHeight: 1.7 },
  priceFeatures: { marginTop: 18, display: "grid", gap: 10 },
  priceFeatureDark: { fontSize: 15, lineHeight: 1.7, color: "#27272a" },
  miniTrustText: {
    marginTop: 14,
    textAlign: "center",
    color: "#71717a",
    fontSize: 13,
    fontWeight: 700,
  },
  resultsHero: {
    padding: "48px 0 72px",
    background: "linear-gradient(to bottom, #f8fbff, #ffffff)",
    minHeight: "100vh",
  },
  resultsCard: {
    background: "white",
    border: "1px solid #e4e4e7",
    borderRadius: 32,
    padding: 28,
    boxShadow: "0 12px 30px rgba(0,0,0,0.04)",
  },
  successBadge: {
    display: "inline-block",
    background: "#166534",
    color: "white",
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 11,
    fontWeight: 800,
  },
  resultsTitle: {
    fontSize: 44,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    margin: "18px 0 0",
  },
  resultsText: {
    color: "#52525b",
    fontSize: 18,
    lineHeight: 1.7,
    marginTop: 14,
  },
  resultsTopActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 22,
    marginBottom: 6,
  },
  resultsSummaryGridFour: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: 16,
    marginTop: 28,
  },
  resultsSummaryGridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 16,
    marginTop: 18,
  },
  summaryBox: {
    border: "1px solid #e4e4e7",
    borderRadius: 24,
    padding: 18,
    background: "#fafafa",
  },
  summaryLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    color: "#71717a",
    fontWeight: 700,
  },
  summaryValue: { marginTop: 10, fontWeight: 800, fontSize: 18, lineHeight: 1.5 },
  bigInfoCard: {
    border: "1px solid #e4e4e7",
    borderRadius: 24,
    padding: 20,
    background: "#ffffff",
  },
  bigInfoTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#18181b",
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  bigInfoValue: { marginTop: 10, fontSize: 28, fontWeight: 900, lineHeight: 1.2 },
  bigInfoText: { marginTop: 10, color: "#52525b", lineHeight: 1.7, fontSize: 15 },
  whyBox: {
    marginTop: 22,
    border: "1px solid #bae6fd",
    background: "linear-gradient(135deg, #f0f9ff, #ffffff)",
    borderRadius: 24,
    padding: 18,
  },
  whyTitle: { fontWeight: 800, fontSize: 18 },
  whyText: { marginTop: 8, color: "#52525b", lineHeight: 1.7 },
  sectionBlock: { marginTop: 24 },
  resultsBlockTitle: { fontWeight: 800, fontSize: 24, marginBottom: 14 },
  fullPlanWrap: { display: "grid", gap: 14 },
  fullPlanItem: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    border: "1px solid #e4e4e7",
    borderRadius: 24,
    padding: 18,
  },
  resultMetaLine: { marginTop: 8, color: "#0369a1", fontSize: 13, fontWeight: 700 },
  examplesList: {
    marginTop: 10,
    marginBottom: 0,
    paddingLeft: 18,
    color: "#27272a",
    lineHeight: 1.8,
  },
  sectionMiniCard: {
    border: "1px solid #e4e4e7",
    borderRadius: 24,
    padding: 20,
    background: "#ffffff",
  },
  smallResultBlock: {
    padding: "10px 0",
    borderBottom: "1px solid #f4f4f5",
    color: "#3f3f46",
    lineHeight: 1.7,
    fontSize: 15,
  },
  noteBox: {
    marginTop: 22,
    borderTop: "1px solid #e4e4e7",
    paddingTop: 18,
    color: "#71717a",
    fontSize: 14,
    lineHeight: 1.7,
  },
  savedPlansCard: {
    border: "1px solid #e4e4e7",
    borderRadius: 32,
    background: "linear-gradient(135deg, #ffffff, #fafafa)",
    padding: 24,
  },
  savedPlansTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 18,
  },
  savedPlansEyebrow: {
    color: "#0284c7",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: ".18em",
    textTransform: "uppercase",
  },
  savedPlansTitle: {
    marginTop: 10,
    fontWeight: 800,
    fontSize: 34,
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
  },
  savedPlansText: {
    marginTop: 12,
    color: "#52525b",
    fontSize: 16,
    lineHeight: 1.7,
    maxWidth: 760,
  },
  savedEmptyState: {
    border: "1px dashed #d4d4d8",
    borderRadius: 24,
    padding: 20,
    color: "#71717a",
    background: "#ffffff",
  },
  savedPlansList: { display: "grid", gap: 14 },
  savedPlanRow: {
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e4e4e7",
    borderRadius: 24,
    padding: 18,
    background: "#ffffff",
  },
  savedPlanName: { fontSize: 18, fontWeight: 800, color: "#09090b" },
  savedPlanMeta: { marginTop: 6, color: "#71717a", fontSize: 14, lineHeight: 1.6 },
  savedPlanActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  savedActionPrimary: {
    background: "#09090b",
    color: "white",
    border: 0,
    padding: "12px 16px",
    borderRadius: 16,
    fontWeight: 800,
    cursor: "pointer",
  },
  savedActionSecondary: {
    background: "white",
    color: "#09090b",
    border: "1px solid #d4d4d8",
    padding: "12px 16px",
    borderRadius: 16,
    fontWeight: 800,
    cursor: "pointer",
  },
  toast: {
    position: "fixed",
    right: 18,
    bottom: 18,
    zIndex: 50,
    background: "#09090b",
    color: "white",
    padding: "12px 16px",
    borderRadius: 16,
    fontWeight: 700,
    boxShadow: "0 14px 30px rgba(0,0,0,0.18)",
  },
};

const globalCss = `
  html { scroll-behavior: smooth; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ffffff; overflow-x: hidden; }
  a, button { transition: transform .18s ease, opacity .18s ease, background .18s ease, box-shadow .18s ease; }
  a:hover, button:hover { transform: translateY(-1px); }
  input:focus, select:focus {
    border-color: #38bdf8 !important;
    box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12);
  }

  @media (max-width: 1100px) {
    div[style*="grid-template-columns: 1.02fr 0.98fr"],
    div[style*="grid-template-columns: 1fr 0.92fr"],
    div[style*="grid-template-columns: 1fr 1fr"],
    div[style*="grid-template-columns: repeat(4, minmax(0,1fr))"] {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 960px) {
    h1 { font-size: 46px !important; }
    h2 { font-size: 34px !important; }
  }

  @media (max-width: 640px) {
    html, body { overflow-x: hidden !important; width: 100%; }
    h1 { font-size: 38px !important; }
    h2 { font-size: 30px !important; }

    div[style*="max-width: 1200px"] {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }

    div[style*="display: flex"][style*="justify-content: space-between"] {
      flex-direction: column !important;
      align-items: stretch !important;
    }

    div[style*="display: grid"][style*="gap: 16px"],
    div[style*="grid-template-columns: repeat(2, minmax(0,1fr))"],
    div[style*="grid-template-columns: repeat(3, minmax(0,1fr))"] {
      grid-template-columns: 1fr !important;
    }

    button, a[style*="display: inline-block"], a[style*="display: block"] {
      width: 100% !important;
      text-align: center !important;
    }

    input, select {
      min-height: 56px !important;
      font-size: 16px !important;
    }
  }
`;
