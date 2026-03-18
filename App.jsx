import React, { useMemo, useState } from "react";

const checkoutLinks = {
  starter: "https://buy.stripe.com/your-starter-link",
  performance: "https://buy.stripe.com/your-performance-link",
  elite: "https://buy.stripe.com/your-elite-link",
};

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

const planTiers = [
  {
    key: "starter",
    name: "Starter",
    price: "$9",
    badge: "Fast entry",
    description: "A quick personalized nutrition outline for normal training days.",
    features: ["Daily meal timing", "Hydration guidance", "Recovery checklist", "Instant access"],
  },
  {
    key: "performance",
    name: "Performance",
    price: "$19",
    badge: "Best value",
    featured: true,
    description: "The strongest offer for athletes who want a real, usable daily fuel plan.",
    features: ["Everything in Starter", "More detailed timing", "Pre- and post-workout structure", "Best for most athletes"],
  },
  {
    key: "elite",
    name: "Elite",
    price: "$39",
    badge: "Most complete",
    description: "For serious athletes who want the most complete support and structure.",
    features: ["Everything in Performance", "Competition-day support", "Extra schedule adjustments", "Priority delivery"],
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

function buildPlan({ sport, goal, wakeTime, practiceTime, bedTime, doubleDay }) {
  const wake = toMinutes(wakeTime) ?? 390;
  const practice = toMinutes(practiceTime) ?? 945;
  const bed = toMinutes(bedTime) ?? 1350;

  const focusBySport = {
    swimming: "steady carbs + hydration",
    track: "quick energy + recovery",
    soccer: "carbs + electrolytes",
    basketball: "light fuel + fluids",
    football: "bigger meals + recovery",
    lifting: "protein + carbs",
    other: "balanced performance fuel",
  };

  const goalText = {
    perform: "Keep energy steady all day and avoid heavy dips before training.",
    gain: "Add more total fuel and stronger post-workout recovery.",
    maintain: "Stay consistent and avoid long gaps without eating.",
    lean: "Keep protein high and focus most carbs around training.",
  };

  const focus = focusBySport[sport] || focusBySport.other;
  const summary = goalText[goal] || goalText.perform;

  const items = [
    { time: formatTime(wake + 30), title: "Breakfast", desc: "Start with carbs, protein, and fluids so energy comes up early." },
    { time: formatTime(wake + 180), title: "Snack", desc: `Keep energy stable with something easy to digest focused on ${focus}.` },
    { time: formatTime(practice - 180), title: "Main meal", desc: "Build this around rice, potatoes, pasta, fruit, and lean protein." },
    { time: formatTime(practice - 60), title: "Pre-training fuel", desc: "Use a lighter carb-focused snack 45–75 minutes before training." },
    { time: formatTime(practice + 45), title: "Recovery", desc: goal === "lean" ? "Get protein in quickly, then add carbs based on session length." : "Get protein and carbs in quickly to recover better." },
    { time: formatTime(Math.min(bed - 90, practice + 150)), title: "Dinner", desc: doubleDay ? "Refill aggressively with carbs, protein, sodium, and fluids." : "Finish with a full meal that helps overnight recovery." },
  ];

  if (doubleDay) {
    items.splice(2, 0, {
      time: formatTime(practice - 300),
      title: "Extra fuel block",
      desc: "Add one more snack to protect energy during the heavier day.",
    });
  }

  return {
    title: sport === "swimming" ? "Swim Day Fuel Plan" : "Training Day Fuel Plan",
    focus,
    summary,
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
    <div style={{ maxWidth: 760, margin: center ? "0 auto" : 0, textAlign: center ? "center" : "left" }}>
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
    wakeTime: "06:30",
    practiceTime: "15:45",
    bedTime: "22:30",
    doubleDay: false,
  });
  const [leadMessage, setLeadMessage] = useState("");

  const plan = useMemo(() => buildPlan(form), [form]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function savePreview() {
    if (!form.email.trim()) {
      setLeadMessage("Enter your email first so your preview can be saved.");
      return;
    }
    const payload = { email: form.email, form, plan, savedAt: new Date().toISOString() };
    localStorage.setItem("peakfuel_preview", JSON.stringify(payload));
    setLeadMessage("Preview saved. Replace the Stripe links with your real checkout links before publishing.");
  }

  return (
    <div style={styles.page}>
      <style>{globalCss}</style>

      <section style={styles.heroWrap}>
        <div style={styles.gridBg} />
        <div style={styles.container}>
          <header style={styles.header}>
            <div style={styles.logoWrap}>
              <div style={styles.logo}>PF</div>
              <div>
                <div style={styles.logoTitle}>PeakFuel AI</div>
                <div style={styles.logoSub}>Fuel smarter. Recover stronger.</div>
              </div>
            </div>
            <nav style={styles.nav}>
              <a href="#how" style={styles.navLink}>How it works</a>
              <a href="#preview" style={styles.navLink}>Preview</a>
              <a href="#pricing" style={styles.navLink}>Pricing</a>
            </nav>
            <a href="#builder" style={styles.headerCta}>Build My Plan</a>
          </header>

          <div style={styles.heroGrid}>
            <div>
              <div style={styles.badge}>Designed for busy student-athletes</div>
              <h1 style={styles.heroTitle}>Stop guessing what to eat around training.</h1>
              <p style={styles.heroText}>
                PeakFuel AI gives athletes a clear daily fueling plan based on school, practice, sleep, and performance goals. It is built to feel premium, useful, and easy to buy.
              </p>
              <div style={styles.heroButtons}>
                <a href="#builder" style={styles.primaryBtn}>Start Your Plan</a>
                <a href="#preview" style={styles.secondaryBtn}>See Live Preview</a>
              </div>
              <div style={styles.statRow}>
                {[
                  ["5 min", "to generate a plan"],
                  ["Custom", "for your real schedule"],
                  ["Instant", "digital checkout"],
                ].map(([value, label]) => (
                  <div key={label} style={styles.statCard}>
                    <div style={styles.statValue}>{value}</div>
                    <div style={styles.statLabel}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.previewShell}>
              <div style={styles.previewTopCard}>
                <div style={styles.previewTopMeta}>Live athlete preview</div>
                <div style={styles.previewTitleRow}>
                  <div>
                    <div style={styles.previewTitle}>{plan.title}</div>
                    <div style={styles.previewSummary}>{plan.summary}</div>
                  </div>
                  <div style={styles.focusPill}>Focus: {plan.focus}</div>
                </div>
                <div style={styles.featureMiniGrid}>
                  <div style={styles.featureMiniCard}><strong>Priority</strong><span>{plan.summary}</span></div>
                  <div style={styles.featureMiniCard}><strong>Sport focus</strong><span>{plan.focus}</span></div>
                  <div style={styles.featureMiniCard}><strong>Hydration</strong><span>Front-load fluids and refill after training.</span></div>
                </div>
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
                  <div style={styles.lockedBadge}>Premium plan unlock</div>
                  <div style={styles.lockedTitle}>Unlock the rest of your day plan</div>
                  <div style={styles.lockedText}>Get the full pre-training, recovery, dinner timing, and goal-based adjustments.</div>
                  {plan.items.slice(3).map((item) => (
                    <div key={item.time + item.title} style={{ ...styles.previewItem, opacity: 0.55 }}>
                      <div style={{ ...styles.timeBox, background: "#d4d4d8", color: "white" }}>{item.time}</div>
                      <div>
                        <div style={{ ...styles.itemTitle, color: "#52525b" }}>{item.title}</div>
                        <div style={{ ...styles.itemDesc, filter: "blur(2px)", userSelect: "none" }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                  <a href={checkoutLinks.performance} target="_blank" rel="noreferrer" style={styles.primaryDarkBtn}>Unlock Full Performance Plan</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.containerSection}>
        <div style={styles.featureStrip}>
          {[
            ["Built for athletes", "Made around real school, practice, and recovery schedules."],
            ["Easy to follow", "Clear timing guidance without confusing nutrition talk."],
            ["Fast results", "Get a personalized preview in under a minute."],
            ["Instant access", "Choose a plan and unlock your full version right away."],
          ].map(([title, text]) => (
            <div key={title} style={styles.featureStripCard}>
              <div style={styles.featureDot} />
              <div style={styles.featureStripTitle}>{title}</div>
              <div style={styles.featureStripText}>{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="builder" style={styles.containerSection}>
        <div style={styles.twoCol}>
          <div>
            <SectionHeading
              eyebrow="Interactive builder"
              title="Build your plan in under a minute."
              text="Enter your schedule, choose your goal, and see a personalized fueling preview instantly."
            />

            <div style={styles.formCard}>
              <div style={styles.formGrid}>
                <Field label="Email">
                  <input value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" style={styles.input} />
                </Field>
                <Field label="Sport">
                  <select value={form.sport} onChange={(e) => updateField("sport", e.target.value)} style={styles.input}>
                    {sports.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Goal">
                  <select value={form.goal} onChange={(e) => updateField("goal", e.target.value)} style={styles.input}>
                    {goals.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Wake time">
                  <input type="time" value={form.wakeTime} onChange={(e) => updateField("wakeTime", e.target.value)} style={styles.input} />
                </Field>
                <Field label="Practice time">
                  <input type="time" value={form.practiceTime} onChange={(e) => updateField("practiceTime", e.target.value)} style={styles.input} />
                </Field>
                <Field label="Bed time">
                  <input type="time" value={form.bedTime} onChange={(e) => updateField("bedTime", e.target.value)} style={styles.input} />
                </Field>
              </div>

              <label style={styles.checkboxRow}>
                <input type="checkbox" checked={form.doubleDay} onChange={(e) => updateField("doubleDay", e.target.checked)} />
                <span>I have a double day or heavier training load</span>
              </label>

              <div style={styles.buttonRow}>
                <a href={checkoutLinks.performance} target="_blank" rel="noreferrer" style={styles.primaryDarkBtn}>Unlock My Full Plan</a>
                <button onClick={savePreview} style={styles.secondaryBtnButton}>Save My Preview</button>
              </div>
              {leadMessage ? <p style={styles.helperText}>{leadMessage}</p> : null}
            </div>
          </div>

          <div>
            <div style={styles.sideCard}>
              <div style={styles.sideCardTop}>What you get</div>
              {[
                "A personalized daily meal timing plan built around your actual schedule.",
                "Clear pre-workout, post-workout, and recovery guidance.",
                "A plan that adjusts to your sport, goal, and training load.",
                "Simple structure that is easy to follow on school days.",
                "A cleaner way to fuel without overthinking every meal.",
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

      <section id="how" style={styles.altSection}>
        <div style={styles.container}>
          <SectionHeading
            eyebrow="How it works"
            title="How PeakFuel AI works"
            text="A simple process built to help athletes fuel better around school, training, and recovery."
          />
          <div style={styles.stepGrid}>
            {[
              ["01", "Enter your schedule", "Add your wake time, training time, bedtime, and performance goal."],
              ["02", "See your preview", "Get a live fueling plan preview based on your inputs."],
              ["03", "Unlock the full plan", "Choose the option that fits you and get the full version instantly."],
            ].map(([step, title, text]) => (
              <div key={step} style={styles.stepCard}>
                <div style={styles.stepNum}>{step}</div>
                <div style={styles.stepTitle}>{title}</div>
                <div style={styles.stepText}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={styles.pricingSection}>
        <div style={styles.container}>
          <SectionHeading
            eyebrow="Pricing"
            title="Choose the plan that fits your training."
            text="Start simple or unlock more complete support with the plan that matches your goals."
            center
          />
          <div style={styles.pricingGrid}>
            {planTiers.map((tier) => (
              <div key={tier.key} style={tier.featured ? styles.priceCardFeatured : styles.priceCard}>
                <div style={tier.featured ? styles.priceBadgeFeatured : styles.priceBadge}>{tier.badge}</div>
                <div style={styles.priceName}>{tier.name}</div>
                <div style={styles.priceValue}>{tier.price}</div>
                <div style={tier.featured ? styles.priceDescFeatured : styles.priceDesc}>{tier.description}</div>
                <div style={styles.priceFeatures}>
                  {tier.features.map((item) => <div key={item} style={styles.priceFeature}>✓ {item}</div>)}
                </div>
                <a href={checkoutLinks[tier.key]} target="_blank" rel="noreferrer" style={tier.featured ? styles.primaryDarkBtnFull : styles.whiteBtnFull}>
                  {tier.featured ? "Get Performance" : `Choose ${tier.name}`}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.containerSection}>
        <div style={styles.leadWrap}>
          <div>
            <div style={styles.badge}>Get your free preview</div>
            <h2 style={styles.sectionTitle}>Try your personalized plan before committing.</h2>
            <p style={styles.sectionText}>Enter your details to generate a free preview based on your schedule and goals.</p>
          </div>
          <div style={styles.leadCard}>
            <Field label="Email address">
              <input value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="athlete@email.com" style={styles.input} />
            </Field>
            <Field label="Who are you?">
              <select style={styles.input}>
                <option>Athlete</option>
                <option>Parent</option>
                <option>Coach</option>
              </select>
            </Field>
            <button onClick={savePreview} style={styles.primaryBtnButton}>Get My Free Preview</button>
            <div style={styles.smallMuted}>Upgrade anytime to unlock your full plan instantly.</div>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.containerFooter}>
          <div>© 2026 PeakFuel AI. Fuel smarter. Recover stronger.</div>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>Privacy</a>
            <a href="#" style={styles.footerLink}>Terms</a>
            <a href="#" style={styles.footerLink}>Contact</a>
          </div>
        </div>
      </footer>
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
    background: "radial-gradient(circle at top left, rgba(56,189,248,0.16), transparent 28%), radial-gradient(circle at 80% 20%, rgba(34,197,94,0.08), transparent 24%), linear-gradient(to bottom, #ffffff, #f8fbff)",
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
  badge: { display: "inline-flex", padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,0.86)", color: "#0369a1", border: "1px solid #bae6fd", fontWeight: 700, fontSize: 12, letterSpacing: ".03em", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" },
  heroTitle: { fontSize: 68, lineHeight: 1.02, letterSpacing: "-0.04em", margin: "24px 0 0", maxWidth: 760 },
  heroText: { marginTop: 24, maxWidth: 700, color: "#52525b", fontSize: 20, lineHeight: 1.7 },
  heroButtons: { display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" },
  primaryBtn: { background: "#0ea5e9", color: "white", textDecoration: "none", padding: "16px 22px", borderRadius: 18, fontWeight: 800, boxShadow: "0 14px 34px rgba(14,165,233,0.22)" },
  primaryBtnButton: { background: "#0ea5e9", color: "white", border: 0, padding: "16px 22px", borderRadius: 18, fontWeight: 800, cursor: "pointer", boxShadow: "0 14px 34px rgba(14,165,233,0.22)" },
  secondaryBtn: { background: "white", color: "#09090b", textDecoration: "none", padding: "16px 22px", borderRadius: 18, fontWeight: 800, border: "1px solid #d4d4d8" },
  secondaryBtnButton: { background: "white", color: "#09090b", border: "1px solid #d4d4d8", padding: "16px 22px", borderRadius: 18, fontWeight: 800, cursor: "pointer" },
  primaryDarkBtn: { display: "inline-block", marginTop: 16, background: "#09090b", color: "white", textDecoration: "none", padding: "15px 20px", borderRadius: 18, fontWeight: 800 },
  primaryDarkBtnFull: { display: "block", textAlign: "center", marginTop: 24, background: "#09090b", color: "white", textDecoration: "none", padding: "15px 20px", borderRadius: 18, fontWeight: 800 },
  whiteBtnFull: { display: "block", textAlign: "center", marginTop: 24, background: "white", color: "#09090b", textDecoration: "none", padding: "15px 20px", borderRadius: 18, fontWeight: 800 },
  statRow: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14, marginTop: 32, maxWidth: 720 },
  statCard: { background: "rgba(255,255,255,0.92)", border: "1px solid #e4e4e7", borderRadius: 24, padding: 18, boxShadow: "0 6px 20px rgba(0,0,0,0.03)" },
  statValue: { fontWeight: 800, fontSize: 28 },
  statLabel: { color: "#71717a", fontSize: 14, marginTop: 6 },
  previewShell: { position: "relative" },
  previewTopCard: { background: "linear-gradient(135deg, #0ea5e9, #22d3ee 45%, #111827)", color: "white", borderRadius: 30, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.13)" },
  previewTopMeta: { textTransform: "uppercase", letterSpacing: ".2em", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.82)" },
  previewTitleRow: { display: "flex", gap: 18, justifyContent: "space-between", alignItems: "flex-start", marginTop: 14 },
  previewTitle: { fontSize: 30, fontWeight: 800, lineHeight: 1.1 },
  previewSummary: { marginTop: 10, color: "rgba(255,255,255,0.88)", lineHeight: 1.7, fontSize: 15, maxWidth: 420 },
  focusPill: { padding: "10px 12px", borderRadius: 18, background: "rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  featureMiniGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginTop: 18 },
  featureMiniCard: { display: "flex", flexDirection: "column", gap: 8, borderRadius: 22, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.12)", padding: 16, fontSize: 14, lineHeight: 1.6 },
  previewListWrap: { marginTop: 18, background: "white", border: "1px solid #e4e4e7", borderRadius: 30, padding: 18, boxShadow: "0 18px 44px rgba(0,0,0,0.08)" },
  previewItem: { display: "flex", gap: 16, alignItems: "flex-start", border: "1px solid #e4e4e7", borderRadius: 24, padding: 16, marginBottom: 12 },
  timeBox: { minWidth: 92, background: "#09090b", color: "white", borderRadius: 18, padding: "12px 10px", textAlign: "center", fontSize: 12, fontWeight: 800 },
  itemTitle: { fontWeight: 800, fontSize: 16 },
  itemDesc: { marginTop: 6, color: "#52525b", lineHeight: 1.7, fontSize: 14 },
  lockedBlock: { border: "1px solid #bae6fd", background: "linear-gradient(135deg, #f0f9ff, #ffffff, #ecfeff)", borderRadius: 28, padding: 18, marginTop: 6 },
  lockedBadge: { display: "inline-block", background: "#09090b", color: "white", borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800 },
  lockedTitle: { fontWeight: 800, fontSize: 22, marginTop: 14 },
  lockedText: { color: "#52525b", fontSize: 14, lineHeight: 1.7, marginTop: 8, marginBottom: 14 },
  featureStrip: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16, border: "1px solid #e4e4e7", borderRadius: 28, background: "white", padding: 18, boxShadow: "0 8px 26px rgba(0,0,0,0.03)" },
  featureStripCard: { background: "#fafafa", borderRadius: 22, padding: 18 },
  featureDot: { width: 12, height: 12, borderRadius: 999, background: "linear-gradient(135deg,#0ea5e9,#22d3ee)" },
  featureStripTitle: { marginTop: 14, fontWeight: 800, fontSize: 18 },
  featureStripText: { color: "#52525b", fontSize: 14, lineHeight: 1.7, marginTop: 8 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 0.92fr", gap: 36, alignItems: "start" },
  eyebrow: { color: "#0284c7", fontWeight: 800, fontSize: 12, letterSpacing: ".24em", textTransform: "uppercase" },
  sectionTitle: { margin: "12px 0 0", fontWeight: 800, fontSize: 44, lineHeight: 1.08, letterSpacing: "-0.03em" },
  sectionText: { color: "#52525b", fontSize: 18, lineHeight: 1.8, marginTop: 16 },
  formCard: { marginTop: 28, border: "1px solid #e4e4e7", borderRadius: 32, background: "linear-gradient(135deg, #ffffff, #fafafa)", padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.04)" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 },
  label: { display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#3f3f46" },
  input: { width: "100%", padding: "14px 16px", borderRadius: 18, border: "1px solid #d4d4d8", background: "white", fontSize: 15, outline: "none" },
  checkboxRow: { display: "flex", gap: 10, alignItems: "center", border: "1px solid #e4e4e7", borderRadius: 18, padding: 16, marginTop: 16, background: "white", fontSize: 14, color: "#3f3f46" },
  buttonRow: { display: "flex", gap: 14, flexWrap: "wrap", marginTop: 18 },
  helperText: { marginTop: 12, fontSize: 14, color: "#52525b" },
  sideCard: { border: "1px solid #e4e4e7", borderRadius: 32, background: "white", padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.04)" },
  sideCardTop: { fontSize: 22, fontWeight: 800, marginBottom: 14 },
  bulletRow: { display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #f4f4f5", color: "#3f3f46", lineHeight: 1.7, fontSize: 15 },
  bulletDot: { color: "#0284c7", fontWeight: 900 },
  altSection: { background: "#fafafa", padding: "96px 0" },
  stepGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 18, marginTop: 32 },
  stepCard: { background: "white", border: "1px solid #e4e4e7", borderRadius: 30, padding: 28, boxShadow: "0 8px 24px rgba(0,0,0,0.03)" },
  stepNum: { color: "#0284c7", fontWeight: 800, fontSize: 14 },
  stepTitle: { marginTop: 14, fontWeight: 800, fontSize: 22 },
  stepText: { marginTop: 10, color: "#52525b", lineHeight: 1.7 },
  pricingSection: { background: "#09090b", color: "white", padding: "96px 0" },
  pricingGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 18, marginTop: 38 },
  priceCard: { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 32, padding: 28, background: "rgba(255,255,255,0.04)" },
  priceCardFeatured: { border: "2px solid #38bdf8", borderRadius: 32, padding: 28, background: "white", color: "#09090b", boxShadow: "0 18px 42px rgba(0,0,0,0.14)" },
  priceBadge: { display: "inline-block", borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 800, background: "rgba(255,255,255,0.1)", color: "#e4e4e7" },
  priceBadgeFeatured: { display: "inline-block", borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 800, background: "#e0f2fe", color: "#0369a1" },
  priceName: { marginTop: 18, fontSize: 28, fontWeight: 800 },
  priceValue: { marginTop: 12, fontSize: 52, fontWeight: 900 },
  priceDesc: { marginTop: 14, color: "#d4d4d8", lineHeight: 1.7 },
  priceDescFeatured: { marginTop: 14, color: "#52525b", lineHeight: 1.7 },
  priceFeatures: { marginTop: 18, display: "grid", gap: 10 },
  priceFeature: { fontSize: 15, lineHeight: 1.6 },
  leadWrap: { display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 24, border: "1px solid #e4e4e7", background: "linear-gradient(135deg, #f0f9ff, #ffffff, #ecfeff)", borderRadius: 36, padding: 28, boxShadow: "0 10px 30px rgba(0,0,0,0.03)" },
  leadCard: { background: "white", border: "1px solid #e4e4e7", borderRadius: 28, padding: 22, boxShadow: "0 10px 26px rgba(0,0,0,0.03)" },
  smallMuted: { marginTop: 10, fontSize: 12, color: "#71717a" },
  footer: { borderTop: "1px solid #e4e4e7", background: "white" },
  containerFooter: { maxWidth: 1200, margin: "0 auto", padding: "26px 24px", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", color: "#71717a", fontSize: 14 },
  footerLinks: { display: "flex", gap: 20, flexWrap: "wrap" },
  footerLink: { color: "#71717a", textDecoration: "none" },
};

const globalCss = `
  html { scroll-behavior: smooth; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  a, button { transition: transform .18s ease, opacity .18s ease, box-shadow .18s ease, background .18s ease; }
  a:hover, button:hover { transform: translateY(-1px); }
  input:focus, select:focus { border-color: #38bdf8 !important; box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.12); }

  @media (max-width: 1024px) {
    .hide-mobile { display: none !important; }
  }

  @media (max-width: 980px) {
    .mobile-stack { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 900px) {
    nav { display: none !important; }
  }

  @media (max-width: 960px) {
    div[style*="grid-template-columns: 1.05fr 0.95fr"],
    div[style*="grid-template-columns: 1fr 0.92fr"],
    div[style*="grid-template-columns: 1.05fr 0.95fr"],
    div[style*="grid-template-columns: 1.05fr 0.95fr"] {
      grid-template-columns: 1fr !important;
    }
    div[style*="grid-template-columns: repeat(4, minmax(0,1fr))"] {
      grid-template-columns: repeat(2, minmax(0,1fr)) !important;
    }
    div[style*="grid-template-columns: repeat(3, minmax(0,1fr))"] {
      grid-template-columns: 1fr !important;
    }
    h1 { font-size: 48px !important; }
  }

  @media (max-width: 640px) {
    h1 { font-size: 40px !important; }
    h2 { font-size: 34px !important; }
    div[style*="padding: 72px 0 96px"] { padding: 48px 0 64px !important; }
    div[style*="grid-template-columns: repeat(2, minmax(0,1fr))"] { grid-template-columns: 1fr !important; }
    div[style*="min-width: 92"] { min-width: 76px !important; }
  }
`;
