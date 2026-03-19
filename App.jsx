import React, { useEffect, useMemo, useState } from "react";

const checkoutLinks = {
  instant: "https://buy.stripe.com/cNi28r3vR8Oy5zr9nFg3600",
};

const STORAGE_KEY = "peakfuel_checkout_plan";

const sports = [
  ["swimming", "Swimming"],
  ["track", "Track & Field"],
  ["soccer", "Soccer"],
  ["basketball", "Basketball"],
  ["football", "Football"],
  ["lifting", "Lifting"],
  ["other", "Other"],
];

const goals = [
  ["perform", "Perform Better"],
  ["gain", "Build Muscle"],
  ["maintain", "Maintain"],
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
  ["very-hard", "Very hard"],
];

const stomachOptions = [
  ["normal", "Normal stomach"],
  ["sensitive", "Sensitive before training"],
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

function getProteinTarget(weight, goal) {
  const pounds = Number(weight) || 150;
  if (goal === "gain") return `${Math.round(pounds * 0.9)}–${Math.round(pounds * 1.0)}g protein/day`;
  if (goal === "lean") return `${Math.round(pounds * 0.85)}–${Math.round(pounds * 0.95)}g protein/day`;
  return `${Math.round(pounds * 0.8)}–${Math.round(pounds * 0.9)}g protein/day`;
}

function getHydrationTarget(weight, intensity, doubleDay) {
  const pounds = Number(weight) || 150;
  let ounces = Math.round(pounds * 0.6);
  if (intensity === "hard") ounces += 10;
  if (intensity === "very-hard") ounces += 20;
  if (doubleDay) ounces += 20;
  return `${ounces}–${ounces + 16} oz fluids/day`;
}

function getCarbFocus(goal, sport, intensity) {
  if (goal === "lean") return "Keep most carbs around training and recovery.";
  if (goal === "gain") return "Push carbs hard around training and in post-workout meals.";
  if (sport === "swimming" || intensity === "very-hard") return "Prioritize steady carbs through the day and extra carbs before training.";
  return "Use carbs consistently before and after training.";
}

function preWorkoutFoods(stomachSensitivity) {
  if (stomachSensitivity === "sensitive") {
    return [
      "banana",
      "applesauce pouch",
      "toast + honey",
      "sports drink or light electrolytes",
    ];
  }
  return [
    "banana + granola bar",
    "bagel + honey",
    "rice cakes + jam",
    "pretzels + fruit",
  ];
}

function postWorkoutFoods(goal) {
  if (goal === "gain") {
    return [
      "protein shake + bagel",
      "chocolate milk + rice bowl",
      "turkey sandwich + fruit",
    ];
  }
  if (goal === "lean") {
    return [
      "protein shake + banana",
      "Greek yogurt + berries + granola",
      "chicken + rice",
    ];
  }
  return [
    "chocolate milk + bagel",
    "protein shake + fruit",
    "rice bowl + chicken",
  ];
}

function breakfastFoods(goal) {
  if (goal === "gain") return "eggs, toast, fruit, yogurt, and an extra carb like oatmeal";
  if (goal === "lean") return "eggs, fruit, toast, and Greek yogurt";
  return "eggs, toast, fruit, and yogurt or oatmeal";
}

function lunchFoods(goal) {
  if (goal === "gain") return "rice or pasta, chicken or beef, fruit, and a side like bread or potatoes";
  if (goal === "lean") return "rice or potatoes, lean protein, fruit, and vegetables";
  return "rice, potatoes, or pasta with lean protein and fruit";
}

function buildPlan(form) {
  const wake = toMinutes(form.wakeTime) ?? 390;
  const school = toMinutes(form.schoolStart) ?? 480;
  const practice = toMinutes(form.practiceTime) ?? 945;
  const bed = toMinutes(form.bedTime) ?? 1350;

  const proteinTarget = getProteinTarget(form.weight, form.goal);
  const hydrationTarget = getHydrationTarget(form.weight, form.intensity, form.doubleDay);
  const carbFocus = getCarbFocus(form.goal, form.sport, form.intensity);

  const preFoods = preWorkoutFoods(form.stomachSensitivity);
  const recoveryFoods = postWorkoutFoods(form.goal);

  const profileSummary = `${form.sport === "swimming" ? "Swimmer" : "Athlete"} with a ${form.goal} goal, ${form.intensity} training, and ${form.doubleDay ? "a double-day / heavy-day load" : "a normal training day"}.`;

  const whyThisWorks =
    form.goal === "gain"
      ? "This plan pushes more total fuel and stronger recovery so you can train hard and still build."
      : form.goal === "lean"
      ? "This plan keeps protein high and places most carbs where they help performance most."
      : "This plan keeps energy more stable through school and practice so you do not crash before training.";

  const meal1Time = formatTime(wake + 30);
  const meal2Time = formatTime(Math.max(school - 30, wake + 150));
  const meal3Time = formatTime(practice - 180);
  const meal4Time = formatTime(practice - 60);
  const meal5Time = formatTime(practice + 30);
  const meal6Time = formatTime(Math.min(bed - 90, practice + 150));

  const items = [
    {
      time: meal1Time,
      title: "Breakfast",
      desc: `Start with ${breakfastFoods(form.goal)}. Aim for protein + carbs + fluids early.`,
      examples: [
        "2–3 eggs",
        "2 slices toast",
        "fruit",
        "water",
      ],
    },
    {
      time: meal2Time,
      title: "School snack",
      desc: "Keep energy stable so you do not go into practice underfueled.",
      examples: form.stomachSensitivity === "sensitive"
        ? ["banana", "applesauce pouch", "water"]
        : ["granola bar", "fruit", "pretzels"],
    },
    {
      time: meal3Time,
      title: "Main pre-practice meal",
      desc: `Build this around ${lunchFoods(form.goal)}.`,
      examples: [
        "rice or pasta",
        "chicken / turkey / beef",
        "fruit",
        "water",
      ],
    },
    {
      time: meal4Time,
      title: "Pre-training top-up",
      desc: "Use a lighter carb-focused snack 45–75 minutes before training.",
      examples: preFoods,
    },
    {
      time: meal5Time,
      title: "Recovery",
      desc: "Refuel fast after training so tomorrow does not start behind.",
      examples: recoveryFoods,
    },
    {
      time: meal6Time,
      title: "Dinner",
      desc: form.doubleDay
        ? "Go bigger here: full carbs, protein, sodium, and fluids."
        : "Finish with a balanced meal that helps overnight recovery.",
      examples: [
        "rice / potatoes / pasta",
        "protein source",
        "vegetables",
        "water + electrolytes if needed",
      ],
    },
  ];

  if (form.doubleDay) {
    items.splice(2, 0, {
      time: formatTime(practice - 300),
      title: "Extra fuel block",
      desc: "Add extra fuel because your workload is higher than normal.",
      examples: ["bagel", "trail mix", "fruit", "sports drink"],
    });
  }

  return {
    title: form.sport === "swimming" ? "Your Swim Fuel Plan" : "Your Training Fuel Plan",
    profileSummary,
    whyThisWorks,
    proteinTarget,
    hydrationTarget,
    carbFocus,
    items,
  };
}

function Field({ label, children }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title, text, center }) {
  return (
    <div
      style={{
        maxWidth: 760,
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

export default function PeakFuelWebsite() {
  const [form, setForm] = useState({
    email: "",
    sport: "swimming",
    goal: "perform",
    ageRange: "16-18",
    weight: "150",
    intensity: "hard",
    duration: "90",
    wakeTime: "06:30",
    schoolStart: "08:00",
    practiceTime: "15:45",
    bedTime: "22:30",
    doubleDay: false,
    stomachSensitivity: "normal",
  });

  const [leadMessage, setLeadMessage] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const plan = useMemo(() => buildPlan(form), [form]);

  useEffect(() => {
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
      setUnlocked(true);
      setLeadMessage("Your full optimized plan is unlocked below.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function savePreview() {
    if (!form.email.trim()) {
      setLeadMessage("Enter your email first so your preview can be saved.");
      return;
    }

    const payload = {
      email: form.email,
      form,
      plan,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setLeadMessage("Preview saved to this device.");
  }

  function startCheckout() {
    if (!form.email.trim()) {
      setLeadMessage("Enter your email first before unlocking your full plan.");
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
    <div style={styles.page}>
      <style>{globalCss}</style>

      {unlocked ? (
        <section style={styles.resultsHero}>
          <div style={styles.container}>
            <div style={styles.resultsCard}>
              <div style={styles.successBadge}>Unlocked</div>
              <h1 style={styles.resultsTitle}>{plan.title}</h1>
              <p style={styles.resultsText}>{plan.profileSummary}</p>

              <div style={styles.resultsSummaryGrid}>
                <div style={styles.summaryBox}>
                  <div style={styles.summaryLabel}>Protein target</div>
                  <div style={styles.summaryValue}>{plan.proteinTarget}</div>
                </div>
                <div style={styles.summaryBox}>
                  <div style={styles.summaryLabel}>Hydration target</div>
                  <div style={styles.summaryValue}>{plan.hydrationTarget}</div>
                </div>
                <div style={styles.summaryBox}>
                  <div style={styles.summaryLabel}>Carb focus</div>
                  <div style={styles.summaryValue}>{plan.carbFocus}</div>
                </div>
              </div>

              <div style={styles.whyBox}>
                <div style={styles.whyTitle}>Why this plan works</div>
                <div style={styles.whyText}>{plan.whyThisWorks}</div>
              </div>

              <div style={styles.fullPlanWrap}>
                {plan.items.map((item) => (
                  <div key={item.time + item.title} style={styles.fullPlanItem}>
                    <div style={styles.timeBox}>{item.time}</div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.itemTitle}>{item.title}</div>
                      <div style={styles.itemDesc}>{item.desc}</div>
                      <ul style={styles.examplesList}>
                        {item.examples.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.noteBox}>
                This is a general educational fueling plan, not medical advice. Adjust foods based on allergies, preferences, and coach or dietitian guidance.
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section style={styles.heroWrap}>
            <div style={styles.gridBg} />
            <div style={styles.container}>
              <header style={styles.header}>
                <div style={styles.logoWrap}>
                  <div style={styles.logo}>PF</div>
                  <div>
                    <div style={styles.logoTitle}>PeakFuel</div>
                    <div style={styles.logoSub}>Fuel smarter. Recover stronger.</div>
                  </div>
                </div>
                <nav style={styles.nav}>
                  <a href="#builder" style={styles.navLink}>Builder</a>
                  <a href="#preview" style={styles.navLink}>Preview</a>
                  <a href="#pricing" style={styles.navLink}>Pricing</a>
                </nav>
                <a href="#builder" style={styles.headerCta}>Build My Plan</a>
              </header>

              <div style={styles.heroGrid}>
                <div>
                  <div style={styles.badge}>Built for real athlete schedules</div>
                  <h1 style={styles.heroTitle}>Get a fueling plan that actually fits your day.</h1>
                  <p style={styles.heroText}>
                    Enter your sport, schedule, training load, and goal to generate a more specific athlete fueling plan with exact timing, food ideas, recovery guidance, and hydration targets.
                  </p>
                  <div style={styles.heroButtons}>
                    <a href="#builder" style={styles.primaryBtn}>Build Your Plan</a>
                    <a href="#preview" style={styles.secondaryBtn}>See Preview</a>
                  </div>
                </div>

                <div style={styles.previewShell}>
                  <div style={styles.previewTopCard}>
                    <div style={styles.previewTopMeta}>Live preview</div>
                    <div style={styles.previewTitle}>{plan.title}</div>
                    <div style={styles.previewSummary}>{plan.profileSummary}</div>
                  </div>

                  <div id="preview" style={styles.previewListWrap}>
                    {plan.items.slice(0, 3).map((item) => (
                      <div key={item.time + item.title} style={styles.previewItem}>
                        <div style={styles.timeBox}>{item.time}</div>
                        <div>
                          <div style={styles.itemTitle}>{item.title}</div>
                          <div style={styles.itemDesc}>{item.desc}</div>
                        </div>
                      </div>
                    ))}

                    <div style={styles.lockedBlock}>
                      <div style={styles.lockedBadge}>Full plan preview</div>
                      <div style={styles.lockedTitle}>Unlock your full optimized plan</div>
                      <div style={styles.lockedText}>
                        Get your full day structure, food examples, hydration target, protein target, and recovery strategy based on the answers you entered.
                      </div>
                      <button onClick={startCheckout} style={styles.primaryDarkButton}>
                        Get Instant Access
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="builder" style={styles.containerSection}>
            <div style={styles.twoCol}>
              <div>
                <SectionHeading
                  eyebrow="Builder"
                  title="Build a more tailored plan"
                  text="Answer a few more specific questions so the final plan feels worth buying."
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

                    <Field label="Goal">
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

                    <Field label="Wake time">
                      <input
                        type="time"
                        value={form.wakeTime}
                        onChange={(e) => updateField("wakeTime", e.target.value)}
                        style={styles.input}
                      />
                    </Field>

                    <Field label="School start">
                      <input
                        type="time"
                        value={form.schoolStart}
                        onChange={(e) => updateField("schoolStart", e.target.value)}
                        style={styles.input}
                      />
                    </Field>

                    <Field label="Practice time">
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
                      Unlock My Full Plan
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
                  <div style={styles.sideCardTop}>What the paid plan includes</div>
                  {[
                    "More specific timing based on your actual schedule",
                    "Protein target and hydration target",
                    "Example foods for each fuel block",
                    "Recovery guidance based on your goal",
                    "Extra structure for heavy or double-day training",
                  ].map((text) => (
                    <div key={text} style={styles.bulletRow}>
                      <span style={styles.bulletDot}>✓</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="pricing" style={styles.pricingSection}>
            <div style={styles.container}>
              <SectionHeading
                eyebrow="Pricing"
                title="One simple plan. Instant access."
                text="A one-time purchase for a more detailed athlete fueling plan."
                center
              />
              <div style={styles.pricingGridSingle}>
                <div style={styles.priceCardHero}>
                  <div style={styles.priceBadgeFeatured}>Instant access</div>
                  <div style={styles.priceName}>Instant Athlete Fuel Plan</div>
                  <div style={styles.priceValue}>$4.99</div>
                  <div style={styles.priceDescFeatured}>
                    A more specific training-day fueling plan based on your schedule, goal, and training setup.
                  </div>
                  <div style={styles.priceFeatures}>
                    {[
                      "Specific meal timing",
                      "Protein target",
                      "Hydration target",
                      "Pre-workout food examples",
                      "Post-workout recovery examples",
                    ].map((item) => (
                      <div key={item} style={styles.priceFeatureDark}>✓ {item}</div>
                    ))}
                  </div>
                  <button onClick={startCheckout} style={styles.primaryDarkButtonFull}>
                    Get Instant Access
                  </button>
                </div>
              </div>
            </div>
          </section>
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
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: { maxWidth: 1200, margin: "0 auto", padding: "0 24px" },
  containerSection: { maxWidth: 1200, margin: "0 auto", padding: "24px 24px 96px" },
  heroWrap: {
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid #e4e4e7",
    background: "radial-gradient(circle at top left, rgba(56,189,248,0.16), transparent 28%), linear-gradient(to bottom, #ffffff, #f8fbff)",
  },
  gridBg: {
    position: "absolute",
    inset: 0,
    opacity: 0.45,
    backgroundImage: "linear-gradient(to right, rgba(24,24,27,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.04) 1px, transparent 1px)",
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
    background: "rgba(255,255,255,0.86)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 12 },
  logo: { width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 16, background: "#09090b", color: "white", fontWeight: 800, fontSize: 14 },
  logoTitle: { fontSize: 14, fontWeight: 700 },
  logoSub: { fontSize: 12, color: "#71717a" },
  nav: { display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" },
  navLink: { color: "#52525b", textDecoration: "none", fontSize: 14, fontWeight: 600 },
  headerCta: { background: "#09090b", color: "white", textDecoration: "none", padding: "12px 16px", borderRadius: 16, fontWeight: 700, fontSize: 14 },
  heroGrid: { position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 48, alignItems: "center", padding: "72px 0 96px" },
  badge: { display: "inline-flex", padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,0.86)", color: "#0369a1", border: "1px solid #bae6fd", fontWeight: 700, fontSize: 12 },
  heroTitle: { fontSize: 64, lineHeight: 1.02, letterSpacing: "-0.04em", margin: "24px 0 0", maxWidth: 760 },
  heroText: { marginTop: 24, maxWidth: 700, color: "#52525b", fontSize: 20, lineHeight: 1.7 },
  heroButtons: { display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" },
  primaryBtn: { background: "#0ea5e9", color: "white", textDecoration: "none", padding: "16px 22px", borderRadius: 18, fontWeight: 800 },
  secondaryBtn: { background: "white", color: "#09090b", textDecoration: "none", padding: "16px 22px", borderRadius: 18, fontWeight: 800, border: "1px solid #d4d4d8" },
  secondaryBtnButton: { background: "white", color: "#09090b", border: "1px solid #d4d4d8", padding: "16px 22px", borderRadius: 18, fontWeight: 800, cursor: "pointer" },
  primaryDarkButton: { display: "inline-block", marginTop: 16, background: "#09090b", color: "white", border: 0, padding: "15px 20px", borderRadius: 18, fontWeight: 800, cursor: "pointer" },
  primaryDarkButtonFull: { display: "block", width: "100%", textAlign: "center", marginTop: 24, background: "#09090b", color: "white", border: 0, padding: "15px 20px", borderRadius: 18, fontWeight: 800, cursor: "pointer" },
  previewShell: { position: "relative" },
  previewTopCard: { background: "linear-gradient(135deg, #0ea5e9, #22d3ee 45%, #111827)", color: "white", borderRadius: 30, padding: 24 },
  previewTopMeta: { textTransform: "uppercase", letterSpacing: ".2em", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.82)" },
  previewTitle: { fontSize: 30, fontWeight: 800, lineHeight: 1.1, marginTop: 12 },
  previewSummary: { marginTop: 10, color: "rgba(255,255,255,0.88)", lineHeight: 1.7, fontSize: 15 },
  previewListWrap: { marginTop: 18, background: "white", border: "1px solid #e4e4e7", borderRadius: 30, padding: 18 },
  previewItem: { display: "flex", gap: 16, alignItems: "flex-start", border: "1px solid #e4e4e7", borderRadius: 24, padding: 16, marginBottom: 12 },
  timeBox: { minWidth: 92, background: "#09090b", color: "white", borderRadius: 18, padding: "12px 10px", textAlign: "center", fontSize: 12, fontWeight: 800 },
  itemTitle: { fontWeight: 800, fontSize: 16 },
  itemDesc: { marginTop: 6, color: "#52525b", lineHeight: 1.7, fontSize: 14 },
  lockedBlock: { border: "1px solid #bae6fd", background: "linear-gradient(135deg, #f0f9ff, #ffffff, #ecfeff)", borderRadius: 28, padding: 18, marginTop: 6 },
  lockedBadge: { display: "inline-block", background: "#09090b", color: "white", borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800 },
  lockedTitle: { fontWeight: 800, fontSize: 22, marginTop: 14 },
  lockedText: { color: "#52525b", fontSize: 14, lineHeight: 1.7, marginTop: 8, marginBottom: 14 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 0.92fr", gap: 36, alignItems: "start" },
  eyebrow: { color: "#0284c7", fontWeight: 800, fontSize: 12, letterSpacing: ".24em", textTransform: "uppercase" },
  sectionTitle: { margin: "12px 0 0", fontWeight: 800, fontSize: 44, lineHeight: 1.08, letterSpacing: "-0.03em" },
  sectionText: { color: "#52525b", fontSize: 18, lineHeight: 1.8, marginTop: 16 },
  formCard: { marginTop: 28, border: "1px solid #e4e4e7", borderRadius: 32, background: "linear-gradient(135deg, #ffffff, #fafafa)", padding: 24 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 },
  label: { display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#3f3f46" },
  input: { width: "100%", padding: "14px 16px", borderRadius: 18, border: "1px solid #d4d4d8", background: "white", fontSize: 15, outline: "none" },
  checkboxRow: { display: "flex", gap: 10, alignItems: "center", border: "1px solid #e4e4e7", borderRadius: 18, padding: 16, marginTop: 16, background: "white", fontSize: 14, color: "#3f3f46" },
  buttonRow: { display: "flex", gap: 14, flexWrap: "wrap", marginTop: 18 },
  helperText: { marginTop: 12, fontSize: 14, color: "#52525b" },
  sideCard: { border: "1px solid #e4e4e7", borderRadius: 32, background: "white", padding: 24 },
  sideCardTop: { fontSize: 22, fontWeight: 800, marginBottom: 14 },
  bulletRow: { display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #f4f4f5", color: "#3f3f46", lineHeight: 1.7, fontSize: 15 },
  bulletDot: { color: "#0284c7", fontWeight: 900 },
  pricingSection: { background: "#09090b", color: "white", padding: "96px 0" },
  pricingGridSingle: { display: "grid", gridTemplateColumns: "minmax(0, 520px)", justifyContent: "center", marginTop: 38 },
  priceCardHero: { border: "2px solid #38bdf8", borderRadius: 36, padding: 34, background: "white", color: "#09090b" },
  priceBadgeFeatured: { display: "inline-block", borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 800, background: "#e0f2fe", color: "#0369a1" },
  priceName: { marginTop: 18, fontSize: 28, fontWeight: 800 },
  priceValue: { marginTop: 12, fontSize: 52, fontWeight: 900 },
  priceDescFeatured: { marginTop: 14, color: "#52525b", lineHeight: 1.7 },
  priceFeatures: { marginTop: 18, display: "grid", gap: 10 },
  priceFeatureDark: { fontSize: 15, lineHeight: 1.7, color: "#27272a" },

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
  resultsSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: 16,
    marginTop: 28,
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
  summaryValue: {
    marginTop: 10,
    fontWeight: 800,
    fontSize: 18,
    lineHeight: 1.5,
  },
  whyBox: {
    marginTop: 22,
    border: "1px solid #bae6fd",
    background: "linear-gradient(135deg, #f0f9ff, #ffffff)",
    borderRadius: 24,
    padding: 18,
  },
  whyTitle: { fontWeight: 800, fontSize: 18 },
  whyText: { marginTop: 8, color: "#52525b", lineHeight: 1.7 },
  fullPlanWrap: {
    marginTop: 24,
    display: "grid",
    gap: 14,
  },
  fullPlanItem: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    border: "1px solid #e4e4e7",
    borderRadius: 24,
    padding: 18,
  },
  examplesList: {
    marginTop: 10,
    marginBottom: 0,
    paddingLeft: 18,
    color: "#27272a",
    lineHeight: 1.8,
  },
  noteBox: {
    marginTop: 22,
    borderTop: "1px solid #e4e4e7",
    paddingTop: 18,
    color: "#71717a",
    fontSize: 14,
    lineHeight: 1.7,
  },
};

const globalCss = `
  html { scroll-behavior: smooth; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  a, button { transition: transform .18s ease, opacity .18s ease, background .18s ease; }
  a:hover, button:hover { transform: translateY(-1px); }
  input:focus, select:focus { border-color: #38bdf8 !important; box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12); }

  @media (max-width: 960px) {
    div[style*="grid-template-columns: 1.05fr 0.95fr"],
    div[style*="grid-template-columns: 1fr 0.92fr"],
    div[style*="grid-template-columns: repeat(3, minmax(0,1fr))"] {
      grid-template-columns: 1fr !important;
    }
    h1 { font-size: 42px !important; }
  }

  @media (max-width: 640px) {
    div[style*="grid-template-columns: repeat(2, minmax(0,1fr))"] {
      grid-template-columns: 1fr !important;
    }
    h1 { font-size: 36px !important; }
    h2 { font-size: 30px !important; }
  }
`;
