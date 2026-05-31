import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimStore } from '../store/useSimStore.js';
import api from '../lib/api.js';
import { getDbRole } from '../lib/roleMapping.js';

// Fallback DB for offline/unauthenticated access
const DB = {
  dev: {
    title: "Software Developer", icon: "", color: "#6c63ff",
    flashcards: [
      { q: "What defines Microservices Architecture?", a: "An architectural style structuring an application as autonomous, loosely coupled services — each deployable independently." },
      { q: "REST vs GraphQL — core difference?", a: "REST uses fixed endpoint schemas. GraphQL lets clients request exactly the data they need in a single query." },
      { q: "Explain CAP Theorem.", a: "A distributed system can guarantee at most 2 of 3 properties: Consistency, Availability, Partition Tolerance." },
      { q: "What is a CI/CD Pipeline?", a: "Continuous Integration / Continuous Deployment — automated systems that build, test, and ship software reliably." },
      { q: "What is a Race Condition?", a: "A concurrency bug where multiple operations modify shared state simultaneously, producing unpredictable results." }
    ],
    scenarios: [
      {
        title: "Production Outage Meltdown",
        desc: "A deployment triggers a memory leak in your auth service. 45% of logins are failing. Management wants answers now.",
        options: [
          { text: "Rollback immediately to last stable container image.", xp: 30, coins: 20, ok: true, fb: "Smart call. Rollbacks minimize user impact while engineers debug offline safely." },
          { text: "Live-patch code directly inside running containers.", xp: 10, coins: -10, ok: false, fb: "Too risky. Bypassing test pipelines can compound the failure and corrupt data." },
          { text: "Scale horizontally to dilute traffic strain.", xp: 15, coins: 5, ok: false, fb: "Band-aid fix. Scaling masks the leak temporarily but burns infrastructure budget." }
        ]
      }
    ],
    quizzes: [
      { q: "Which HTTP code means the user is not authenticated?", opts: ["401 Unauthorized", "403 Forbidden", "400 Bad Request", "502 Bad Gateway"], correct: 0 },
      { q: "What pattern separates write commands from read queries?", opts: ["CQRS", "MVC", "Active Record", "Singleton"], correct: 0 }
    ]
  },
  hr: {
    title: "HR Manager", icon: "", color: "#10b981",
    flashcards: [
      { q: "What is Onboarding Velocity?", a: "How quickly a new employee reaches full productivity — tracked as a key HR efficiency metric." },
      { q: "Define EEOC compliance.", a: "Equal Employment Opportunity Commission rules protecting job applicants from discrimination in hiring." }
    ],
    scenarios: [
      {
        title: "Cross-Department Conflict",
        desc: "Engineering lead and Marketing director clash over missed product windows. Engineering blames scope creep; Marketing blames poor communication.",
        options: [
          { text: "Mandate joint mediation to create a formal communication charter.", xp: 35, coins: 25, ok: true, fb: "Excellent. Structured charters fix process issues without targeting individuals." },
          { text: "Issue written warnings to both leaders.", xp: 5, coins: -15, ok: false, fb: "This damages culture. Penalizing without fixing root causes erodes company trust." }
        ]
      }
    ],
    quizzes: [
      { q: "Which metric measures total cost to fill an empty position?", opts: ["Cost Per Hire", "Attrition Rate", "Compa-Ratio", "FTE Allocation"], correct: 0 }
    ]
  },
  pm: {
    title: "Product Manager", icon: "", color: "#f59e0b",
    flashcards: [
      { q: "What is Product-Market Fit?", a: "When your product satisfies a verified market demand at scale — the sweet spot every startup hunts for." },
      { q: "Define MVP.", a: "Minimum Viable Product — the leanest version built to test core assumptions and capture real market feedback." }
    ],
    scenarios: [
      {
        title: "The Enterprise Custom Feature Trap",
        desc: "A big enterprise customer threatens to churn unless you build a custom reporting view. It delays your public roadmap by two sprints.",
        options: [
          { text: "Decline; offer existing API endpoints instead.", xp: 35, coins: 25, ok: true, fb: "Strategic! Protecting core architecture prevents scope sprawl and maintains product-market fit." },
          { text: "Accept and mandate engineering overtime to hit both.", xp: 10, coins: -15, ok: false, fb: "Overworking teams causes burnout, tech debt, and product quality degradation." }
        ]
      }
    ],
    quizzes: [
      { q: "What scoring framework uses Reach, Impact, Confidence, and Effort?", opts: ["RICE", "MoSCoW", "Kano", "Eisenhower"], correct: 0 }
    ]
  },
  ml_intern: {
    title: "ML Intern", icon: "", color: "#06b6d4",
    flashcards: [
      { q: "What is Overfitting?", a: "When a model learns the training data too well — including noise — and fails to generalise to unseen data. Fix with regularisation, dropout, or more data." },
      { q: "Explain the Bias-Variance Tradeoff.", a: "High bias = underfitting (model too simple). High variance = overfitting (model too complex). The goal is to find the sweet spot that minimises total error." },
      { q: "What is Gradient Descent?", a: "An optimisation algorithm that iteratively adjusts model weights in the direction that reduces the loss function, using the gradient of the loss." },
      { q: "What is the difference between supervised and unsupervised learning?", a: "Supervised learning trains on labelled input-output pairs. Unsupervised learning finds hidden patterns in unlabelled data without explicit targets." },
      { q: "What is a confusion matrix?", a: "A table showing True Positives, True Negatives, False Positives, and False Negatives — used to evaluate classification model performance." },
      { q: "What is cross-validation?", a: "A technique to assess model generalisation by splitting data into k folds, training on k-1 folds and validating on the remaining fold, repeated k times." }
    ],
    scenarios: [
      {
        title: "Your Model Accuracy Looks Suspicious",
        desc: "You trained a binary classifier that hits 97% accuracy. Your mentor is skeptical. The dataset has 97% negative samples and only 3% positive. What do you do?",
        options: [
          { text: "Report precision, recall and F1-score instead of accuracy alone.", xp: 35, coins: 25, ok: true, fb: "Exactly right. Accuracy is misleading on imbalanced datasets. F1, AUC-ROC, and recall on the minority class give a true picture." },
          { text: "Present the 97% accuracy confidently — it's objectively high.", xp: 5, coins: -10, ok: false, fb: "Dangerous. A model predicting 'negative' for everything achieves the same score. This masks total failure on the positive class." },
          { text: "Oversample the minority class and retrain, then re-report accuracy.", xp: 20, coins: 10, ok: false, fb: "Resampling helps, but you still need appropriate metrics. Accuracy alone on a resampled set can still mislead." }
        ]
      },
      {
        title: "Data Leakage in the Pipeline",
        desc: "Your model achieves near-perfect validation scores during training, but crashes in production. A senior ML engineer suspects data leakage. How do you investigate?",
        options: [
          { text: "Check if any future data or target-correlated features leaked into the training set.", xp: 35, coins: 25, ok: true, fb: "Spot on. Data leakage — where the model sees information it wouldn't have at inference — is the #1 cause of this gap." },
          { text: "Increase model complexity and retrain for more epochs.", xp: 5, coins: -10, ok: false, fb: "Wrong direction. Complexity won't fix a corrupted pipeline. You need to audit the feature engineering and split logic." },
          { text: "Switch to a different algorithm entirely.", xp: 10, coins: 0, ok: false, fb: "Swapping models without fixing the data pipeline just moves the problem. Investigate the root cause first." }
        ]
      }
    ],
    quizzes: [
      { q: "Which activation function is most commonly used in hidden layers of deep neural networks today?", opts: ["ReLU", "Sigmoid", "Tanh", "Softmax"], correct: 0 },
      { q: "What does the learning rate control in gradient descent?", opts: ["Step size of weight updates", "Number of training epochs", "Size of the hidden layer", "Dropout probability"], correct: 0 },
      { q: "Which technique helps prevent overfitting by randomly zeroing out neurons during training?", opts: ["Dropout", "Batch Normalisation", "L2 Regularisation", "Early Stopping"], correct: 0 },
      { q: "What is the purpose of a validation set during model training?", opts: ["Tune hyperparameters without touching the test set", "Increase training data size", "Evaluate final model performance", "Normalise input features"], correct: 0 }
    ]
  },
  sd_intern: {
    title: "SD Intern", icon: "", color: "#f472b6",
    flashcards: [
      { q: "What is the difference between a stack and a queue?", a: "A stack is LIFO (Last In First Out). A queue is FIFO (First In First Out). Both are fundamental data structures with different use cases." },
      { q: "What is Big-O notation?", a: "A mathematical notation describing the worst-case time or space complexity of an algorithm as input size grows. O(1) is constant, O(n) is linear, O(n²) is quadratic." },
      { q: "What is version control and why does it matter?", a: "Version control (e.g. Git) tracks changes to code over time, allows collaboration, enables rollback to previous states, and is essential for any team workflow." },
      { q: "Explain the difference between == and === in JavaScript.", a: "'==' checks value equality with type coercion. '===' checks both value and type strictly. Always prefer === to avoid unexpected type conversions." },
      { q: "What is a pull request (PR)?", a: "A request to merge code from one branch into another. It triggers code review, automated tests, and discussion before changes land in the main codebase." },
      { q: "What is the purpose of a README file?", a: "It documents what a project does, how to set it up, and how to use it. A good README is often the first thing a new contributor or reviewer reads." }
    ],
    scenarios: [
      {
        title: "You Broke the Main Branch",
        desc: "You pushed a commit directly to main. The CI pipeline failed and two teammates can't pull the latest code. Your tech lead is asking what happened. What do you do?",
        options: [
          { text: "Own the mistake immediately, revert the commit, and fix it on a branch with a PR.", xp: 35, coins: 25, ok: true, fb: "Perfect. Transparency + fast remediation is the right move. Reverting unblocks the team while you fix the issue properly." },
          { text: "Quietly force-push a fix without telling anyone.", xp: 5, coins: -15, ok: false, fb: "Force-pushing to main rewrites history and can corrupt teammates' local repos. Never do this without team agreement." },
          { text: "Wait for someone more senior to fix it — it's above your level.", xp: 5, coins: -5, ok: false, fb: "Interns are expected to own mistakes and communicate. Staying silent while blocking the team damages trust far more than the bug." }
        ]
      },
      {
        title: "Unclear Ticket, Deadline Tomorrow",
        desc: "You've been assigned a ticket to 'improve the search feature.' It has no acceptance criteria, no designs, and your assigned mentor is in back-to-back meetings. The deadline is tomorrow.",
        options: [
          { text: "Send a clear, concise Slack message listing your assumptions and ask for a 5-min sync or written confirmation.", xp: 30, coins: 20, ok: true, fb: "Proactive communication is a superpower for interns. Listing assumptions shows initiative and keeps everyone aligned without wasting anyone's time." },
          { text: "Start building what you think is right and hope it matches expectations.", xp: 15, coins: 5, ok: false, fb: "Risky without alignment. You might build the wrong thing entirely and have to redo it, burning the deadline anyway." },
          { text: "Delay starting until you get full clarity, even if it means missing the deadline.", xp: 5, coins: -10, ok: false, fb: "Waiting passively is worse than acting on reasonable assumptions. Make your best call, document it, and communicate." }
        ]
      }
    ],
    quizzes: [
      { q: "What does DRY stand for in software engineering?", opts: ["Don't Repeat Yourself", "Do Run Yearly", "Deploy Rapidly Yesterday", "Data Rendering Yield"], correct: 0 },
      { q: "Which Git command creates a new branch and switches to it in one step?", opts: ["git checkout -b", "git branch new", "git switch --create", "git fork"], correct: 0 },
      { q: "What is the time complexity of binary search on a sorted array?", opts: ["O(log n)", "O(n)", "O(n²)", "O(1)"], correct: 0 },
      { q: "In a code review, a senior dev leaves a comment marked 'nit:' — what does it mean?", opts: ["A minor style suggestion, not blocking", "A critical bug that must be fixed", "A request to rewrite the entire function", "Automated linter output"], correct: 0 }
    ]
  }
};

const BADGES = [
  { id: "first", icon: "💎", title: "Genesis Badge", desc: "Completed a training module", check: s => s.xp > 10 },
  { id: "coins", icon: "🪙", title: "Capitalist Tycoon", desc: "Earned 60+ coins", check: s => s.coins >= 60 },
  { id: "lvl2", icon: "👑", title: "Senior Specialist", desc: "Reached Level 2", check: s => s.level >= 2 },
  { id: "all", icon: "🏆", title: "Grand Master", desc: "Cleared all 3 modules", check: s => s.cleared.length >= 3 },
  { id: "intern", icon: "🎓", title: "Intern Unlocked", desc: "Chose an intern track", check: s => s.role === 'ml_intern' || s.role === 'sd_intern' },
  { id: "ml", icon: "🤖", title: "ML Pioneer", desc: "Cleared all ML Intern modules", check: s => s.role === 'ml_intern' && s.cleared.length >= 3 },
  { id: "sd", icon: "🛠️", title: "Code Craftsman", desc: "Cleared all SD Intern modules", check: s => s.role === 'sd_intern' && s.cleared.length >= 3 }
];

// ── Inline styles ────────────────────────────────────────────────────
const styles = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#0a0c14",
    color: "#e2e8f0",
    minHeight: "100vh",
    position: "relative",
    overflowX: "hidden",
  },
  orb1: { position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "#6c63ff", top: -100, left: -80, filter: "blur(80px)", opacity: 0.12, pointerEvents: "none", zIndex: 0 },
  orb2: { position: "fixed", width: 350, height: 350, borderRadius: "50%", background: "#ec4899", bottom: -80, right: -60, filter: "blur(80px)", opacity: 0.12, pointerEvents: "none", zIndex: 0 },
  scanlines: { position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)", pointerEvents: "none", zIndex: 0 },
  header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(10,12,20,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.4rem", background: "linear-gradient(135deg,#6c63ff,#a78bfa,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.03em", cursor: "pointer" },
  screen: { padding: "28px 24px 60px", maxWidth: 860, margin: "0 auto", position: "relative", zIndex: 1 },
  card: { background: "#111520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 28 },
  footer: { textAlign: "center", padding: "24px", color: "#64748b", fontSize: "0.72rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 40 },
};

function pill(type, children) {
  const palettes = {
    purple: { background: "rgba(108,99,255,0.1)", color: "#a78bfa", border: "1px solid rgba(108,99,255,0.25)" },
    gold: { background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" },
    green: { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" },
    red: { background: "rgba(244,63,94,0.1)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.25)" },
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 18px", borderRadius: 24, fontSize: "0.85rem", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.04em", ...palettes[type] }}>
      {children}
    </span>
  );
}

function Btn({ variant = "primary", size = "md", disabled, onClick, children, style = {} }) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", border: "none", transition: "all 0.2s ease", letterSpacing: "0.01em", opacity: disabled ? 0.35 : 1 };
  const sizes = { sm: { padding: "8px 16px", fontSize: "0.78rem" }, md: { padding: "12px 22px", fontSize: "0.88rem" } };
  const variants = {
    primary: { background: "linear-gradient(135deg,#6c63ff,#8b5cf6)", color: "white", boxShadow: "0 8px 24px rgba(108,99,255,0.3)" },
    ghost: { background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" },
    success: { background: "linear-gradient(135deg,#10b981,#059669)", color: "white", boxShadow: "0 6px 20px rgba(16,185,129,0.25)" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>{children}</button>;
}

function XpBar({ xp, level }) {
  const pct = Math.round((xp / (level * 100)) * 100);
  return (
    <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#6c63ff,#a78bfa,#ec4899)", borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };
  const ToastContainer = () => (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: "#181d2e", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 14, padding: "12px 20px", fontSize: "0.85rem", fontWeight: 600, color: "#10b981", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "fadeSlideUp 0.4s ease" }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
  return { show, ToastContainer };
}

// ── Onboarding ───────────────────────────────────────────────────────
function Onboard({ state, setState, addRewards, save }) {
  return (
    <div style={{ ...styles.screen, paddingTop: 48, textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎓</div>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.8rem)", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 12 }}>Forge Your Career Path</h1>
      <p style={{ color: "#64748b", fontSize: "0.95rem", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.6 }}>
        Choose a role, train with flashcards, tackle real-world scenarios, and prove expertise through quizzes.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 460, margin: "0 auto 40px" }}>
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Your Name</div>
          <input type="text" value={state.username} onChange={e => { setState(s => ({ ...s, username: e.target.value })); save({ username: e.target.value }); }}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "11px 15px", color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif", fontSize: "0.9rem", width: "100%", outline: "none" }} />
        </div>
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Avatar</div>
          <div style={{ display: "flex", gap: 8 }}>
            {['🚀', '💼', '🎨', '🦊'].map(a => (
              <div key={a} onClick={() => { setState(s => ({ ...s, avatar: a })); save({ avatar: a }); }}
                style={{ width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", cursor: "pointer", border: `2px solid ${state.avatar === a ? '#6c63ff' : 'transparent'}`, background: state.avatar === a ? "rgba(108,99,255,0.15)" : "rgba(255,255,255,0.04)", transition: "all 0.2s", transform: state.avatar === a ? "scale(1.1)" : "scale(1)" }}>
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 20 }}>Choose Your Career Track</div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />Senior Roles<span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          {['dev','hr','pm'].map(key => { const d = DB[key]; return (
            <div key={key} onClick={() => { setState(s => ({ ...s, role: key, screen: 'dash' })); save({ role: key }); addRewards(20, 10); }}
              style={{ background: "#111520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 24, cursor: "pointer", textAlign: "left", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = d.color + "66"; e.currentTarget.style.transform = "translateY(-5px) scale(1.01)"; e.currentTarget.style.boxShadow = "0 20px 50px " + d.color + "22"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div
  style={{
    fontSize: "1.4rem",
    marginBottom: 10
  }}
>
  {d.icon}
</div>

<div
  style={{
    fontFamily: "'Syne',sans-serif",
    fontWeight: 800,
    fontSize: "1.15rem",
    letterSpacing: "-0.02em",
    marginBottom: 6
  }}
>
  {d.title}
</div>
              <p style={{ color: "#64748b", fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 14 }}>Flashcards, scenarios &amp; quizzes tailored for this role.</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.04em", background: d.color + "18", color: d.color, border: "1px solid " + d.color + "44" }}>Select →</span>
            </div>
          ); })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />Intern Tracks — New<span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {['ml_intern','sd_intern'].map(key => { const d = DB[key]; return (
            <div key={key} onClick={() => { setState(s => ({ ...s, role: key, screen: 'dash' })); save({ role: key }); addRewards(20, 10); }}
              style={{ background: "#111520", border: "1px solid " + d.color + "33", borderRadius: 20, padding: 24, cursor: "pointer", textAlign: "left", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = d.color + "77"; e.currentTarget.style.transform = "translateY(-5px) scale(1.01)"; e.currentTarget.style.boxShadow = "0 20px 50px " + d.color + "25"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = d.color + "33"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <div style={{ position: "absolute", top: 14, right: 14, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: d.color + "22", color: d.color, border: "1px solid " + d.color + "44", borderRadius: 20, padding: "3px 10px" }}>NEW</div>
              <div style={{ fontSize: "2rem", marginBottom: 14 }}>{d.icon}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", marginBottom: 6 }}>{d.title}</div>
              <p style={{ color: "#64748b", fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 14 }}>Entry-level training with real interview-style scenarios and must-know concepts.</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.04em", background: d.color + "18", color: d.color, border: "1px solid " + d.color + "44" }}>Start Track →</span>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────
function Dashboard({ state, setState, db = DB }) {
  const role = db[state.role];
  const modules = ['flashcards', 'scenarios', 'quizzes'];
  const mIcons = { flashcards: '📇', scenarios: '🗺️', quizzes: '🧠' };
  const mDescs = { flashcards: 'Flip through concept cards and test your knowledge.', scenarios: 'Make decisions under pressure and see the outcome.', quizzes: 'Answer questions to prove mastery.' };

  const startModule = (m) => {
    const update = { screen: m };
    if (m === 'flashcards') { update.fi = 0; update.flipped = false; }
    if (m === 'scenarios') { update.si = 0; update.sfb = null; }
    if (m === 'quizzes') { update.qi = 0; update.qsel = null; update.qlocked = false; }
    setState(s => ({ ...s, ...update }));
  };

  return (
    <div style={styles.screen}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ ...styles.card, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: "3rem", background: "rgba(108,99,255,0.12)", borderRadius: 16, padding: "12px 16px", border: "1px solid rgba(108,99,255,0.2)" }}>{state.avatar}</div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.03em", marginBottom: 4 }}>{state.username}</div>
            <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 10 }}>Career Track</div>
            {pill("purple", `${role.icon} ${role.title}`)}
          </div>
        </div>
        <div style={{ ...styles.card, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>Rank</span>
            {pill("purple", `LVL ${state.level}`)}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>XP Progress</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", color: "#a78bfa" }}>{state.xp}/{state.level * 100}</span>
            </div>
            <XpBar xp={state.xp} level={state.level} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Coins</span>
            {pill("gold", `🪙 ${state.coins}`)}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", marginBottom: 16 }}> Training Modules</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 28 }}>
        {modules.map(m => {
          const done = state.cleared.includes(m);
          return (
            <div key={m} style={{ background: "#111520", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span
  style={{
    fontSize: "2.0rem",
    display: "block",
    marginBottom: "10px"
  }}
>
  {mIcons[m]}
</span>
                  {done ? pill("green", "✓ Done") : pill("purple", "Pending")}
                </div>
                <div
  style={{
    fontFamily: "'Syne',sans-serif",
    fontWeight: 800,
    fontSize: "1.2rem", // increased
    letterSpacing: "-0.03em",
    textTransform: "capitalize",
    marginBottom: 10
  }}
>
  {m}
</div>
                <p style={{ color: "#64748b", fontSize: "0.8rem", lineHeight: 1.5 }}>{mDescs[m]}</p>
              </div>
              <Btn
  size="sm"
  onClick={() => startModule(m)}
  style={{
    background: m === "flashcards"
      ? "#60a5fa"
      : m === "scenarios"
      ? "#fbbf24"
      : "#4ade80",
    color: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)", // very minimal
    borderRadius: "12px",
    
    fontWeight: "900"
  }}
>
  Start Module →
</Btn>
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", marginBottom: 16 }}>   Achievement Badges</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
        {BADGES.map(b => {
          const u = b.check(state);
          return (
            <div key={b.id} style={{ padding: 20, borderRadius: 16, border: `1px solid ${u ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.07)"}`, textAlign: "center", background: u ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.02)", opacity: u ? 1 : 0.35, transition: "all 0.3s", boxShadow: u ? "0 0 20px rgba(245,158,11,0.08)" : "none" }}>
              <div
  style={{
    fontSize: "1.3rem",
    marginBottom: 10
  }}
>
  {b.icon}
</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "0.82rem", marginBottom: 4 }}>{b.title}</div>
              <div style={{ color: "#64748b", fontSize: "0.72rem", lineHeight: 1.4 }}>{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Flashcards ───────────────────────────────────────────────────────
function Flashcards({ state, setState, addRewards, markCleared, db = DB }) {
  const role = db[state.role];
  const card = role.flashcards[state.fi];
  const total = role.flashcards.length;

  return (
    <div style={{ ...styles.screen, maxWidth: 620 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => setState(s => ({ ...s, screen: 'dash' }))}>← Back</Btn>
        {pill("purple", `Card ${state.fi + 1} / ${total}`)}
      </div>

      <div style={{ perspective: 1400, height: 320, cursor: "pointer", userSelect: "none" }} onClick={() => setState(s => ({ ...s, flipped: !s.flipped }))}>
        <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: "transform 0.7s cubic-bezier(0.34,1.2,0.64,1)", transform: state.flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", background: "#181d2e", border: "1px solid rgba(108,99,255,0.3)" }}>
            {pill("purple", "CONCEPT")}
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em", lineHeight: 1.4, margin: "20px 0" }}>{card.q}</h3>
            <p style={{ color: "#64748b", fontSize: "0.75rem" }}>↩ tap to reveal answer</p>
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", background: "linear-gradient(135deg,#0f1629,#1a1040)", border: "1px solid rgba(108,99,255,0.5)", transform: "rotateY(180deg)" }}>
            {pill("green", "ANSWER")}
            <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "#c4b5fd", margin: "20px 0" }}>{card.a}</p>
            <p style={{ color: "#64748b", fontSize: "0.75rem" }}>↩ tap to flip back</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 20 }}>
        <Btn variant="ghost" onClick={() => setState(s => ({ ...s, fi: (s.fi - 1 + total) % total, flipped: false }))}>← Prev</Btn>
        <Btn variant="success" onClick={() => { addRewards(15, 10); markCleared('flashcards'); setState(s => ({ ...s, fi: (s.fi + 1) % total, flipped: false })); }}>✓ Got it +10🪙</Btn>
        <Btn variant="ghost" onClick={() => setState(s => ({ ...s, fi: (s.fi + 1) % total, flipped: false }))}>Next →</Btn>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 6, justifyContent: "center" }}>
        {role.flashcards.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === state.fi ? "#6c63ff" : "rgba(255,255,255,0.12)", transition: "all 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

// ── Scenarios ────────────────────────────────────────────────────────
function Scenarios({ state, setState, addRewards, markCleared, toast, db = DB }) {
  const role = db[state.role];
  const sc = role.scenarios[state.si];

  const handleOption = (opt) => {
    setState(s => ({ ...s, sfb: opt }));
    addRewards(opt.xp, opt.coins);
  };

  const handleNext = () => {
    if (state.si + 1 < role.scenarios.length) {
      setState(s => ({ ...s, si: s.si + 1, sfb: null }));
    } else {
      markCleared('scenarios');
      toast('🎖 Scenario track cleared!');
      setState(s => ({ ...s, screen: 'dash' }));
    }
  };

  return (
    <div style={{ ...styles.screen, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => setState(s => ({ ...s, screen: 'dash' }))}>← Back</Btn>
        {pill("gold", `⚠️ Case ${state.si + 1} of ${role.scenarios.length}`)}
      </div>

      <div style={{ ...styles.card, marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>{pill("red", "🔴 CRITICAL INCIDENT")}</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.03em" }}>{sc.title}</h2>
        </div>
        <p style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 18, color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.65 }}>{sc.desc}</p>
      </div>

      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 12 }}>Choose your response:</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {sc.options.map((opt, i) => (
          <button key={i} onClick={() => handleOption(opt)}
            style={{ width: "100%", textAlign: "left", padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(108,99,255,0.08)"; e.currentTarget.style.borderColor = "rgba(108,99,255,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
            <span>{opt.text}</span>
            <span style={{ color: "#6c63ff", flexShrink: 0 }}>→</span>
          </button>
        ))}
      </div>

      {state.sfb && (
        <div style={{ padding: "20px 24px", borderRadius: 16, border: `1px solid ${state.sfb.ok ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`, background: state.sfb.ok ? "rgba(16,185,129,0.07)" : "rgba(244,63,94,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: state.sfb.ok ? "#10b981" : "#f43f5e", marginBottom: 8 }}>
            {state.sfb.ok ? "✅ Smart Move" : "❌ Suboptimal Call"}
          </div>
          <p style={{ color: "#cbd5e1", fontSize: "0.87rem", lineHeight: 1.6 }}>{state.sfb.fb}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", color: state.sfb.ok ? "#10b981" : "#f43f5e" }}>
              {state.sfb.xp > 0 ? "+" : ""}{state.sfb.xp} XP · {state.sfb.coins > 0 ? "+" : ""}{state.sfb.coins} 🪙
            </span>
            <Btn variant="ghost" size="sm" onClick={handleNext}>
              {state.si + 1 < role.scenarios.length ? "Next Case →" : "Complete Module 🎖"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quizzes ──────────────────────────────────────────────────────────
function Quizzes({ state, setState, addRewards, markCleared, toast, db = DB }) {
  const role = db[state.role];
  const q = role.quizzes[state.qi];
  const pct = Math.round(((state.qi + 1) / role.quizzes.length) * 100);

  const handleAnswer = (i) => {
    setState(s => ({ ...s, qsel: i, qlocked: true }));
    if (i === q.correct) addRewards(25, 15); else addRewards(5, 0);
  };

  const handleNext = () => {
    if (state.qi + 1 < role.quizzes.length) {
      setState(s => ({ ...s, qi: s.qi + 1, qsel: null, qlocked: false }));
    } else {
      markCleared('quizzes');
      toast('🎓 Quiz module complete!');
      setState(s => ({ ...s, screen: 'dash' }));
    }
  };

  return (
    <div style={{ ...styles.screen, maxWidth: 660 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => setState(s => ({ ...s, screen: 'dash' }))}>← Back</Btn>
        {pill("purple", `Q ${state.qi + 1} / ${role.quizzes.length}`)}
      </div>

      <div style={{ ...styles.card, marginBottom: 20 }}>
        <XpBar xp={state.xp} level={state.level} />
        <div style={{ marginTop: 16, marginBottom: 14 }}>{pill("gold", "🏆 +25 XP FOR CORRECT")}</div>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.15rem", letterSpacing: "-0.02em", lineHeight: 1.4 }}>{q.q}</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {q.opts.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isSelected = i === state.qsel;
          let bg = "rgba(255,255,255,0.03)";
          let border = "rgba(255,255,255,0.07)";
          let color = "#e2e8f0";
          if (state.qlocked) {
            if (isCorrect) { bg = "rgba(16,185,129,0.1)"; border = "#10b981"; color = "#6ee7b7"; }
            else if (isSelected) { bg = "rgba(244,63,94,0.1)"; border = "#f43f5e"; color = "#fda4af"; }
          }
          return (
            <button key={i} disabled={state.qlocked} onClick={() => handleAnswer(i)}
              style={{ width: "100%", textAlign: "left", padding: "16px 20px", background: bg, border: `1px solid ${border}`, borderRadius: 14, color, fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", cursor: state.qlocked ? "default" : "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <span>{opt}</span>
              {state.qlocked && isCorrect && <span style={{ color: "#10b981" }}>✓</span>}
              {state.qlocked && !isCorrect && isSelected && <span style={{ color: "#f43f5e" }}>✗</span>}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn disabled={!state.qlocked} onClick={handleNext}>
          {state.qi + 1 < role.quizzes.length ? "Next Question →" : "Finish Quiz 🎓"}
        </Btn>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────
export default function LearnWithFun() {
  const navigate = useNavigate();
  const { role: storeRole, user, token } = useSimStore();
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  
  const [state, setState] = useState(() => {
    const defaults = { screen: 'onboard', role: null, username: 'TechNomad', avatar: '🚀', coins: 0, xp: 0, level: 1, cleared: [], fi: 0, flipped: false, si: 0, sfb: null, qi: 0, qsel: null, qlocked: false };
    try {
      const saved = JSON.parse(localStorage.getItem('cq_v7') || '{}');
      if (saved.role) return { ...defaults, ...saved, screen: 'dash' };
    } catch (e) {}
    return defaults;
  });

  // const { show: toast, ToastContainer } = useToast();

  // Fetch questions from API based on role
  useEffect(() => {
    if (!storeRole || !token) {
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        console.log("Users123",user);
        const dbRole = getDbRole(storeRole);
        const response = await api.get(`/api/learn/content/${dbRole}/${user?.id}`);
        console.log("response",response);
        if (response.data && response.data.content) {
          setApiData(response.data);
          // Pre-fill state with progress from API, using client role name for consistency
          setState(s => ({
            ...s,
            role: storeRole,  // Keep client role name in state
            xp: response.data.progress.xp || 0,
            coins: response.data.progress.coins || 0,
            level: response.data.progress.level || 1,
            cleared: response.data.progress.cleared || [],
            username: user?.name || 'TechNomad',
            screen: 'dash'
          }));
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setError('Failed to load learning content');
        // Fall back to hardcoded DB
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [storeRole, token, user?.name]);

  // Get the correct DB object - use API data if available, otherwise fallback to hardcoded DB
  const getDataSource = () => {
    if (apiData && apiData.content && state.role) {
      // Convert API data to the same format as the hardcoded DB
      return {
        [state.role]: {
          title: state.username,
          icon: state.avatar,
          color: '#6c63ff',
          flashcards: apiData.content.flashcards.map(q => ({ q: q.q, a: q.a })),
          scenarios: apiData.content.scenarios.map(s => ({
            title: s.title,
            desc: s.desc,
            options: s.options
          })),
          quizzes: apiData.content.quizzes.map(q => ({ q: q.q, opts: q.opts, correct: q.correct }))
        }
      };
    }
    // Fall back to hardcoded DB
    if (DB[state.role]) {
      return DB;
    }
    // If role doesn't match DB keys, return empty to prevent errors
    return { [state.role]: { title: 'Unknown', icon: '❓', color: '#6c63ff', flashcards: [], scenarios: [], quizzes: [] } };
  };

  const { show: toast, ToastContainer } = useToast();

  const save = (fields = {}) => {
    try {
      const { role, username, avatar, coins, xp, level, cleared } = { ...state, ...fields };
      localStorage.setItem('cq_v7', JSON.stringify({ role, username, avatar, coins, xp, level, cleared }));
    } catch (e) {}
  };

  const addRewards = (xpAmt, coinAmt) => {
    setState(s => {
      let nextXp = s.xp + xpAmt;
      let nextCoins = s.coins + coinAmt;
      let nextLevel = s.level;
      if (nextXp >= nextLevel * 100) { nextXp -= nextLevel * 100; nextLevel++; setTimeout(() => toast(`⚡ Level Up! You are now Level ${nextLevel}!`), 100); }
      try { localStorage.setItem('cq_v7', JSON.stringify({ role: s.role, username: s.username, avatar: s.avatar, coins: nextCoins, xp: nextXp, level: nextLevel, cleared: s.cleared })); } catch (e) {}
      
      // Save to API if authenticated
      if (token && s.role) {
        const dbRole = getDbRole(s.role);
        api.post('/api/learn/progress', {
          role: dbRole,
          userId : user.id,
          xp: xpAmt,
          coins: coinAmt
        }).catch(err => console.error('Failed to save progress:', err));
      }
      
      return { ...s, xp: nextXp, coins: nextCoins, level: nextLevel };
    });
  };

  const markCleared = (k) => {
    setState(s => {
      if (s.cleared.includes(k)) return s;
      const cleared = [...s.cleared, k];
      try { localStorage.setItem('cq_v7', JSON.stringify({ role: s.role, username: s.username, avatar: s.avatar, coins: s.coins, xp: s.xp, level: s.level, cleared })); } catch (e) {}
      
      // Save to API if authenticated
      if (token && s.role) {
        const dbRole = getDbRole(s.role);
        api.post('/api/learn/progress', {
          role: dbRole,
          module: k
        }).catch(err => console.error('Failed to save progress:', err));
      }
      
      return { ...s, cleared };
    });
  };

  const reset = () => {
    try { localStorage.removeItem('cq_v7'); } catch (e) {}
    setState({ screen: 'onboard', role: null, username: 'TechNomad', avatar: '🚀', coins: 0, xp: 0, level: 1, cleared: [], fi: 0, flipped: false, si: 0, sfb: null, qi: 0, qsel: null, qlocked: false });
  };

  const xpPct = Math.round((state.xp / (state.level * 100)) * 100);

  return (
    <div style={styles.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap'); @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.scanlines} />

      {/* Loading state */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div style={{ textAlign: 'center', color: '#e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎓</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>Loading your learning path...</div>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(108,99,255,0.2)', borderTopColor: '#6c63ff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div style={{ textAlign: 'center', color: '#e2e8f0', maxWidth: 400 }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: '#f43f5e' }}>{error}</div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: 16 }}>Using offline content. Some features may be limited.</div>
            <Btn variant="primary" onClick={() => setError(null)}>Continue Anyway →</Btn>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo} onClick={() => state.role && setState(s => ({ ...s, screen: 'dash' }))}>🎓 WorkPod</div>
        {state.screen !== 'onboard' && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {pill("gold", `🪙 ${state.coins}`)}
            {pill("purple", `Lvl ${state.level}`)}
            <div style={{ width: 90 }}><XpBar xp={state.xp} level={state.level} /></div>
            <Btn variant="ghost" size="sm" onClick={reset} style={{ padding: "6px 10px", fontSize: "0.75rem" }}>🛑 Reset</Btn>
          </div>
        )}
      </div>

      {/* Screens */}
      {state.screen === 'onboard' && <Onboard state={state} setState={setState} addRewards={addRewards} save={save} db={DB} />}
      {state.screen === 'dash' && state.role && <Dashboard state={state} setState={setState} db={getDataSource()} />}
      {state.screen === 'flashcards' && state.role && <Flashcards state={state} setState={setState} addRewards={addRewards} markCleared={markCleared} db={getDataSource()} />}
      {state.screen === 'scenarios' && state.role && <Scenarios state={state} setState={setState} addRewards={addRewards} markCleared={markCleared} toast={toast} db={getDataSource()} />}
      {state.screen === 'quizzes' && state.role && <Quizzes state={state} setState={setState} addRewards={addRewards} markCleared={markCleared} toast={toast} db={getDataSource()} />}

      <footer style={styles.footer}>CAREERQUEST v2.0 · MICRO-LEARNING ENGINE · © 2026</footer>
      <ToastContainer />
    </div>
  );
}