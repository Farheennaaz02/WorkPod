import mongoose from 'mongoose';
import Question from '../models/Question.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const questionsData = [];

// ====================== HELPERS ======================
const addFlashcards = (role, cards) => {
  cards.forEach(card => {
    questionsData.push({
      role,
      type: 'flashcard',
      q: card.q,
      a: card.a
    });
  });
};

const addQuizzes = (role, quizzes) => {
  quizzes.forEach(quiz => {
    questionsData.push({
      role,
      type: 'quiz',
      q: quiz.q,
      opts: quiz.opts,
      correct: quiz.correct
    });
  });
};

const addScenarios = (role, scenarios) => {
  scenarios.forEach(sc => {
    questionsData.push({
      role,
      type: 'scenario',
      q: sc.desc,
      title: sc.title,
      desc: sc.desc,
      options: sc.options
    });
  });
};

// ====================== DATA ======================

// === Dev ===
addFlashcards('dev', [
  { q: "What defines Microservices Architecture?", a: "An architectural style structuring an application as autonomous, loosely coupled services — each deployable independently." },
  { q: "REST vs GraphQL — core difference?", a: "REST uses fixed endpoint schemas. GraphQL lets clients request exactly the data they need in a single query." },
  { q: "Explain CAP Theorem.", a: "A distributed system can guarantee at most 2 of 3 properties: Consistency, Availability, Partition Tolerance." },
  { q: "What is a CI/CD Pipeline?", a: "Continuous Integration / Continuous Deployment — automated systems that build, test, and ship software reliably." },
  { q: "What is a Race Condition?", a: "A concurrency bug where multiple operations modify shared state simultaneously, producing unpredictable results." }
]);
addScenarios('dev', [
  {
    title: "Production Outage Meltdown",
    desc: "A deployment triggers a memory leak in your auth service. 45% of logins are failing. Management wants answers now.",
    options: [
      { text: "Rollback immediately to last stable container image.", xp: 30, coins: 20, ok: true, fb: "Smart call. Rollbacks minimize user impact while engineers debug offline safely." },
      { text: "Live-patch code directly inside running containers.", xp: 10, coins: -10, ok: false, fb: "Too risky. Bypassing test pipelines can compound the failure and corrupt data." },
      { text: "Scale horizontally to dilute traffic strain.", xp: 15, coins: 5, ok: false, fb: "Band-aid fix. Scaling masks the leak temporarily but burns infrastructure budget." }
    ]
  }
]);
addQuizzes('dev', [
  { q: "Which HTTP code means the user is not authenticated?", opts: ["401 Unauthorized", "403 Forbidden", "400 Bad Request", "502 Bad Gateway"], correct: 0 },
  { q: "What pattern separates write commands from read queries?", opts: ["CQRS", "MVC", "Active Record", "Singleton"], correct: 0 }
]);

// === HR ===
addFlashcards('hr', [
  { q: "What is Onboarding Velocity?", a: "How quickly a new employee reaches full productivity — tracked as a key HR efficiency metric." },
  { q: "Define EEOC compliance.", a: "Equal Employment Opportunity Commission rules protecting job applicants from discrimination in hiring." }
]);
addScenarios('hr', [
  {
    title: "Cross-Department Conflict",
    desc: "Engineering lead and Marketing director clash over missed product windows. Engineering blames scope creep; Marketing blames poor communication.",
    options: [
      { text: "Mandate joint mediation to create a formal communication charter.", xp: 35, coins: 25, ok: true, fb: "Excellent. Structured charters fix process issues without targeting individuals." },
      { text: "Issue written warnings to both leaders.", xp: 5, coins: -15, ok: false, fb: "This damages culture. Penalizing without fixing root causes erodes company trust." }
    ]
  }
]);
addQuizzes('hr', [
  { q: "Which metric measures total cost to fill an empty position?", opts: ["Cost Per Hire", "Attrition Rate", "Compa-Ratio", "FTE Allocation"], correct: 0 }
]);

// === PM ===
addFlashcards('pm', [
  { q: "What is Product-Market Fit?", a: "When your product satisfies a verified market demand at scale — the sweet spot every startup hunts for." },
  { q: "Define MVP.", a: "Minimum Viable Product — the leanest version built to test core assumptions and capture real market feedback." }
]);
addScenarios('pm', [
  {
    title: "The Enterprise Custom Feature Trap",
    desc: "A big enterprise customer threatens to churn unless you build a custom reporting view. It delays your public roadmap by two sprints.",
    options: [
      { text: "Decline; offer existing API endpoints instead.", xp: 35, coins: 25, ok: true, fb: "Strategic! Protecting core architecture prevents scope sprawl and maintains product-market fit." },
      { text: "Accept and mandate engineering overtime to hit both.", xp: 10, coins: -15, ok: false, fb: "Overworking teams causes burnout, tech debt, and product quality degradation." }
    ]
  }
]);
addQuizzes('pm', [
  { q: "What scoring framework uses Reach, Impact, Confidence, and Effort?", opts: ["RICE", "MoSCoW", "Kano", "Eisenhower"], correct: 0 }
]);

// === ML Intern ===
addFlashcards('ml_intern', [
  { q: "What is Overfitting?", a: "When a model learns the training data too well — including noise — and fails to generalise to unseen data." },
  { q: "Explain the Bias-Variance Tradeoff.", a: "High bias = underfitting. High variance = overfitting." },
  { q: "What is Gradient Descent?", a: "An optimisation algorithm that iteratively adjusts model weights using the gradient of the loss." },
  { q: "What is the difference between supervised and unsupervised learning?", a: "Supervised uses labelled data. Unsupervised finds patterns in unlabelled data." },
  { q: "What is a confusion matrix?", a: "A table showing True Positives, True Negatives, False Positives, and False Negatives." },
  { q: "What is cross-validation?", a: "A technique to assess model generalisation using k-fold validation." }
]);
addScenarios('ml_intern', [
  {
    title: "Your Model Accuracy Looks Suspicious",
    desc: "You trained a binary classifier that hits 97% accuracy on a heavily imbalanced dataset.",
    options: [
      { text: "Report precision, recall and F1-score instead of accuracy alone.", xp: 35, coins: 25, ok: true, fb: "Exactly right." },
      { text: "Present the 97% accuracy confidently.", xp: 5, coins: -10, ok: false, fb: "Dangerous." }
    ]
  },
  {
    title: "Data Leakage in the Pipeline",
    desc: "Your model performs great in validation but fails in production.",
    options: [
      { text: "Check if any future data or target-correlated features leaked into the training set.", xp: 35, coins: 25, ok: true, fb: "Spot on." }
    ]
  }
]);
addQuizzes('ml_intern', [
  { q: "Which activation function is most commonly used in hidden layers today?", opts: ["ReLU", "Sigmoid", "Tanh", "Softmax"], correct: 0 },
  { q: "What does the learning rate control in gradient descent?", opts: ["Step size of weight updates", "Number of training epochs", "Size of the hidden layer", "Dropout probability"], correct: 0 }
]);

// === SD Intern ===
addFlashcards('sd_intern', [
  { q: "What is the difference between a stack and a queue?", a: "Stack is LIFO, Queue is FIFO." },
  { q: "What is Big-O notation?", a: "Describes the worst-case time or space complexity of an algorithm." },
  { q: "What is version control and why does it matter?", a: "It tracks changes, enables collaboration, and allows rollback." },
  { q: "Explain the difference between == and === in JavaScript.", a: "== allows type coercion, === does not." },
  { q: "What is a pull request (PR)?", a: "A request to merge code from one branch into another." },
  { q: "What is the purpose of a README file?", a: "To document the project and how to use it." }
]);
addScenarios('sd_intern', [
  {
    title: "You Broke the Main Branch",
    desc: "You pushed a commit directly to main and broke the CI pipeline.",
    options: [
      { text: "Own the mistake immediately, revert the commit, and fix it on a branch with a PR.", xp: 35, coins: 25, ok: true, fb: "Perfect." }
    ]
  },
  {
    title: "Unclear Ticket, Deadline Tomorrow",
    desc: "You got a vague ticket with no acceptance criteria and deadline is tomorrow.",
    options: [
      { text: "Send a clear message listing your assumptions and ask for confirmation.", xp: 30, coins: 20, ok: true, fb: "Good proactive approach." }
    ]
  }
]);
addQuizzes('sd_intern', [
  { q: "What does DRY stand for?", opts: ["Don't Repeat Yourself", "Do Run Yearly", "Deploy Rapidly Yesterday"], correct: 0 },
  { q: "Which Git command creates and switches to a new branch?", opts: ["git checkout -b", "git branch new", "git switch --create"], correct: 0 }
]);

// ====================== SEED ======================
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    await Question.deleteMany({});
    console.log('🗑️ Cleared old questions');

    const result = await Question.insertMany(questionsData);
    console.log(`✅ Successfully seeded ${result.length} questions!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();