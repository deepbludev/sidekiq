/**
 * Database seed script for local development.
 *
 * Creates a test user with sample sidekiqs, threads, and messages.
 * Idempotent - safe to run multiple times using upsert patterns.
 *
 * @example
 * ```bash
 * pnpm db:seed
 * ```
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { nanoid } from "nanoid";
import * as schema from "./schema";

// ============================================================================
// Seed IDs (fixed for idempotency)
// ============================================================================

const SEED_USER_ID = "seed-user-dev";
const SEED_USER_EMAIL = "dev@sidekiq.local";
const SEED_USER_NAME = "Dev User";

const SEED_ACCOUNT_ID = "seed-account-github";
const SEED_SESSION_ID = "seed-session-dev";

const SEED_SIDEKIQ_1_ID = "seed-sidekiq-writing";
const SEED_SIDEKIQ_2_ID = "seed-sidekiq-code";
const SEED_SIDEKIQ_3_ID = "seed-sidekiq-research";

const SEED_THREAD_1_ID = "seed-thread-1";
const SEED_THREAD_2_ID = "seed-thread-2";
const SEED_THREAD_3_ID = "seed-thread-3";
const SEED_THREAD_4_ID = "seed-thread-4";

// ============================================================================
// Seed Data
// ============================================================================

const now = new Date();
const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

const seedUser = {
  id: SEED_USER_ID,
  name: SEED_USER_NAME,
  email: SEED_USER_EMAIL,
  emailVerified: true,
  image: null,
  preferences: {
    defaultModel: "google/gemini-2.0-flash",
    favoriteModels: ["google/gemini-2.0-flash", "anthropic/claude-sonnet-4"],
  },
  createdAt: now,
  updatedAt: now,
};

const seedAccount = {
  id: SEED_ACCOUNT_ID,
  accountId: "github-123456",
  providerId: "github",
  userId: SEED_USER_ID,
  accessToken: "seed-access-token",
  refreshToken: null,
  idToken: null,
  accessTokenExpiresAt: thirtyDaysFromNow,
  refreshTokenExpiresAt: null,
  scope: "read:user,user:email",
  password: null,
  createdAt: now,
  updatedAt: now,
};

const seedSession = {
  id: SEED_SESSION_ID,
  expiresAt: thirtyDaysFromNow,
  token: "seed-session-token-" + nanoid(),
  createdAt: now,
  updatedAt: now,
  ipAddress: "127.0.0.1",
  userAgent: "Seed Script",
  userId: SEED_USER_ID,
};

const seedSidekiqs = [
  {
    id: SEED_SIDEKIQ_1_ID,
    ownerId: SEED_USER_ID,
    teamId: null,
    name: "Writing Assistant",
    description:
      "Helps with writing, editing, and improving your content. From emails to blog posts.",
    instructions: `You are a skilled writing assistant. Your role is to help users:
- Improve clarity and conciseness
- Fix grammar and spelling
- Adjust tone (formal, casual, professional)
- Structure content effectively
- Suggest better word choices

Always ask clarifying questions about the intended audience and purpose before making major suggestions.`,
    conversationStarters: [
      "Help me write a professional email",
      "Review and improve this paragraph",
      "Make this text more concise",
      "Rewrite this in a friendlier tone",
    ],
    defaultModel: null,
    avatar: { type: "emoji" as const, color: "#8b5cf6", emoji: "pen" },
    isFavorite: false,
    lastUsedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    threadCount: 2,
    isPublic: false,
    canTeamEdit: false,
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: now,
  },
  {
    id: SEED_SIDEKIQ_2_ID,
    ownerId: SEED_USER_ID,
    teamId: null,
    name: "Code Reviewer",
    description:
      "Reviews code for bugs, performance issues, and best practices.",
    instructions: `You are an expert code reviewer. When reviewing code:
1. Check for bugs and logic errors
2. Identify security vulnerabilities
3. Suggest performance improvements
4. Recommend best practices
5. Point out code style issues

Provide specific line numbers when making suggestions. Be constructive and explain the reasoning behind each suggestion.`,
    conversationStarters: [
      "Review this function for bugs",
      "How can I make this code faster?",
      "Is this implementation secure?",
    ],
    defaultModel: "anthropic/claude-sonnet-4",
    avatar: { type: "initials" as const, color: "#0ea5e9" },
    isFavorite: false,
    lastUsedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    threadCount: 1,
    isPublic: false,
    canTeamEdit: false,
    createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: now,
  },
  {
    id: SEED_SIDEKIQ_3_ID,
    ownerId: SEED_USER_ID,
    teamId: null,
    name: "Research Helper",
    description:
      "Assists with research, summarization, and information synthesis.",
    instructions: `You are a research assistant. Help users:
- Find and summarize information
- Compare different sources or viewpoints
- Create outlines and structures
- Synthesize complex topics
- Generate citations in various formats

Always cite sources when possible and distinguish between established facts and opinions or interpretations.`,
    conversationStarters: [
      "Summarize this article for me",
      "Compare these two approaches",
      "Help me outline a research paper",
      "What are the key points in this topic?",
    ],
    defaultModel: "google/gemini-2.0-flash",
    avatar: {
      type: "emoji" as const,
      color: "#10b981",
      emoji: "magnifying-glass",
    },
    isFavorite: true,
    lastUsedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
    threadCount: 1,
    isPublic: false,
    canTeamEdit: false,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: now,
  },
];

const seedThreads = [
  {
    id: SEED_THREAD_1_ID,
    userId: SEED_USER_ID,
    sidekiqId: SEED_SIDEKIQ_1_ID,
    title: "Email to potential client",
    activeModel: "google/gemini-2.0-flash",
    isPinned: true,
    isArchived: false,
    lastActivityAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    messageCount: 4,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    updatedAt: now,
  },
  {
    id: SEED_THREAD_2_ID,
    userId: SEED_USER_ID,
    sidekiqId: SEED_SIDEKIQ_1_ID,
    title: "Blog post about AI assistants",
    activeModel: "google/gemini-2.0-flash",
    isPinned: false,
    isArchived: false,
    lastActivityAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
    messageCount: 2,
    createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    updatedAt: now,
  },
  {
    id: SEED_THREAD_3_ID,
    userId: SEED_USER_ID,
    sidekiqId: SEED_SIDEKIQ_2_ID,
    title: "React hook code review",
    activeModel: "anthropic/claude-sonnet-4",
    isPinned: false,
    isArchived: true,
    lastActivityAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    messageCount: 4,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: now,
  },
  {
    id: SEED_THREAD_4_ID,
    userId: SEED_USER_ID,
    sidekiqId: SEED_SIDEKIQ_3_ID,
    title: "Machine learning basics research",
    activeModel: "google/gemini-2.0-flash",
    isPinned: false,
    isArchived: false,
    lastActivityAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
    messageCount: 2,
    createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    updatedAt: now,
  },
];

const seedMessages = [
  // Thread 1: Email to potential client (4 messages)
  {
    id: "seed-msg-1-1",
    threadId: SEED_THREAD_1_ID,
    parentMessageId: null,
    role: "user" as const,
    content:
      "Help me write a professional email to a potential client who inquired about our software development services.",
    model: null,
    inputTokens: null,
    outputTokens: null,
    metadata: null,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
  },
  {
    id: "seed-msg-1-2",
    threadId: SEED_THREAD_1_ID,
    parentMessageId: "seed-msg-1-1",
    role: "assistant" as const,
    content: `I'd be happy to help you craft a professional email. To make it as effective as possible, could you tell me:

1. **What specific services** are you offering? (web development, mobile apps, consulting, etc.)
2. **What's the client's industry** or what problem are they trying to solve?
3. **What tone** do you prefer? (very formal, friendly professional, etc.)
4. **Any specific call-to-action** you want to include? (schedule a call, request more info, etc.)

Once I have these details, I can draft a compelling email for you.`,
    model: "google/gemini-2.0-flash",
    inputTokens: 45,
    outputTokens: 112,
    metadata: null,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 30000),
  },
  {
    id: "seed-msg-1-3",
    threadId: SEED_THREAD_1_ID,
    parentMessageId: "seed-msg-1-2",
    role: "user" as const,
    content:
      "We offer full-stack web development. The client is a fintech startup looking to build a customer portal. I want a friendly professional tone and would like to schedule a discovery call.",
    model: null,
    inputTokens: null,
    outputTokens: null,
    metadata: null,
    createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
  },
  {
    id: "seed-msg-1-4",
    threadId: SEED_THREAD_1_ID,
    parentMessageId: "seed-msg-1-3",
    role: "assistant" as const,
    content: `Here's a professional yet friendly email for your fintech client:

---

**Subject:** Re: Customer Portal Development - Let's Explore Your Vision

Hi [Client Name],

Thank you for reaching out about your customer portal project. Building secure, user-friendly portals for fintech companies is exactly what we love doing.

I'd love to learn more about your specific requirements and how we can help bring your vision to life. Our team has extensive experience with:

- **Secure authentication** and compliance-ready architectures
- **Real-time dashboards** and data visualization
- **Seamless integrations** with banking and payment APIs

Would you be available for a 30-minute discovery call this week? I'm free [suggest 2-3 time slots], but happy to work around your schedule.

Looking forward to connecting!

Best regards,
[Your Name]

---

Feel free to adjust the time slots and add any specific portfolio pieces you'd like to highlight. Would you like me to make any changes to the tone or content?`,
    model: "google/gemini-2.0-flash",
    inputTokens: 89,
    outputTokens: 198,
    metadata: null,
    createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
  },

  // Thread 2: Blog post (2 messages)
  {
    id: "seed-msg-2-1",
    threadId: SEED_THREAD_2_ID,
    parentMessageId: null,
    role: "user" as const,
    content:
      "I want to write a blog post about how AI assistants are changing productivity. Can you help me outline it?",
    model: null,
    inputTokens: null,
    outputTokens: null,
    metadata: null,
    createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
  },
  {
    id: "seed-msg-2-2",
    threadId: SEED_THREAD_2_ID,
    parentMessageId: "seed-msg-2-1",
    role: "assistant" as const,
    content: `Great topic! Here's a structured outline for your blog post:

## AI Assistants: The New Productivity Revolution

### Introduction
- Hook: A day in the life comparison (with vs. without AI)
- Thesis: AI assistants are fundamentally changing how we work

### Section 1: The Rise of AI Assistants
- Brief history (from basic chatbots to LLMs)
- Key players and their capabilities
- Adoption statistics

### Section 2: Key Productivity Gains
- **Writing and Communication** - Drafting, editing, translation
- **Research and Analysis** - Summarization, fact-finding
- **Coding and Development** - Code completion, debugging, documentation
- **Creative Work** - Brainstorming, ideation, design feedback

### Section 3: Real-World Impact
- Case studies or examples
- Time savings metrics
- Quality improvements

### Section 4: Challenges and Considerations
- Learning curve
- Over-reliance concerns
- Privacy and security
- When human judgment is essential

### Conclusion
- Summary of key points
- Future outlook
- Call to action for readers

---

Would you like me to expand on any section or adjust the focus?`,
    model: "google/gemini-2.0-flash",
    inputTokens: 42,
    outputTokens: 245,
    metadata: null,
    createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
  },

  // Thread 3: React hook code review (4 messages - archived)
  {
    id: "seed-msg-3-1",
    threadId: SEED_THREAD_3_ID,
    parentMessageId: null,
    role: "user" as const,
    content: `Can you review this custom React hook for managing form state?

\`\`\`typescript
function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setValues({...values, [e.target.name]: e.target.value});
  };

  const validate = () => {
    // validation logic
    return true;
  };

  return { values, errors, handleChange, validate };
}
\`\`\``,
    model: null,
    inputTokens: null,
    outputTokens: null,
    metadata: null,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "seed-msg-3-2",
    threadId: SEED_THREAD_3_ID,
    parentMessageId: "seed-msg-3-1",
    role: "assistant" as const,
    content: `I've reviewed your hook. Here are my suggestions:

### Issues Found

**1. Missing TypeScript types** (if using TS)
\`\`\`typescript
interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string>;
}
\`\`\`

**2. Stale closure in handleChange** (line 6)
Using \`values\` directly creates a stale closure. Use functional update:
\`\`\`typescript
setValues(prev => ({...prev, [e.target.name]: e.target.value}));
\`\`\`

**3. No memoization**
\`handleChange\` is recreated every render. Wrap with \`useCallback\`:
\`\`\`typescript
const handleChange = useCallback((e) => {
  setValues(prev => ({...prev, [e.target.name]: e.target.value}));
}, []);
\`\`\`

**4. Missing reset functionality**
Consider adding a \`reset\` function for form clearing.

**5. No touched state**
Track which fields have been interacted with for better UX.

Would you like me to show you a complete improved version?`,
    model: "anthropic/claude-sonnet-4",
    inputTokens: 156,
    outputTokens: 234,
    metadata: null,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 60000),
  },
  {
    id: "seed-msg-3-3",
    threadId: SEED_THREAD_3_ID,
    parentMessageId: "seed-msg-3-2",
    role: "user" as const,
    content:
      "Yes please, show me the improved version with all your suggestions.",
    model: null,
    inputTokens: null,
    outputTokens: null,
    metadata: null,
    createdAt: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "seed-msg-3-4",
    threadId: SEED_THREAD_3_ID,
    parentMessageId: "seed-msg-3-3",
    role: "assistant" as const,
    content: `Here's the improved version with all suggestions implemented:

\`\`\`typescript
import { useState, useCallback, useMemo } from 'react';

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
  };
}
\`\`\`

Key improvements:
- Full TypeScript support with generics
- Functional state updates (no stale closures)
- Memoized handlers with useCallback
- Touched state for showing errors after interaction
- Submit handling with loading state
- Reset functionality
- setFieldValue for programmatic updates`,
    model: "anthropic/claude-sonnet-4",
    inputTokens: 78,
    outputTokens: 456,
    metadata: null,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
  },

  // Thread 4: ML research (2 messages)
  {
    id: "seed-msg-4-1",
    threadId: SEED_THREAD_4_ID,
    parentMessageId: null,
    role: "user" as const,
    content:
      "Can you give me a quick overview of the main types of machine learning and when to use each?",
    model: null,
    inputTokens: null,
    outputTokens: null,
    metadata: null,
    createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
  },
  {
    id: "seed-msg-4-2",
    threadId: SEED_THREAD_4_ID,
    parentMessageId: "seed-msg-4-1",
    role: "assistant" as const,
    content: `Here's a concise overview of the three main types of machine learning:

## 1. Supervised Learning
**What it is:** Learning from labeled data (inputs paired with correct outputs)

**Use when you have:**
- Historical data with known outcomes
- Clear input-output relationships

**Common applications:**
- Spam detection (email -> spam/not spam)
- Price prediction (features -> price)
- Image classification (image -> label)
- Medical diagnosis (symptoms -> disease)

**Algorithms:** Linear regression, decision trees, neural networks, SVM

---

## 2. Unsupervised Learning
**What it is:** Finding patterns in unlabeled data

**Use when you want to:**
- Discover hidden structures
- Group similar items
- Reduce data complexity

**Common applications:**
- Customer segmentation
- Anomaly detection
- Recommendation systems
- Topic modeling in text

**Algorithms:** K-means clustering, PCA, autoencoders, DBSCAN

---

## 3. Reinforcement Learning
**What it is:** Learning through trial and error with rewards

**Use when:**
- Decisions are sequential
- There's a clear reward/penalty
- The environment can be simulated

**Common applications:**
- Game playing (chess, Go)
- Robotics control
- Autonomous vehicles
- Resource optimization

**Algorithms:** Q-learning, policy gradients, actor-critic

---

**Quick decision guide:**
- Have labeled data? -> **Supervised**
- Want to find patterns? -> **Unsupervised**
- Sequential decisions with feedback? -> **Reinforcement**

Would you like me to dive deeper into any of these?`,
    model: "google/gemini-2.0-flash",
    inputTokens: 38,
    outputTokens: 312,
    metadata: null,
    createdAt: new Date(now.getTime() - 30 * 60 * 1000),
  },
];

// ============================================================================
// Main Seeding Function
// ============================================================================

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    console.log("Seeding database...\n");

    // Seed user
    console.log("  Seeding user...");
    await db.insert(schema.user).values(seedUser).onConflictDoNothing();

    // Seed account
    console.log("  Seeding account...");
    await db.insert(schema.account).values(seedAccount).onConflictDoNothing();

    // Seed session (delete existing first since token must be unique)
    console.log("  Seeding session...");
    await db
      .delete(schema.session)
      .where(eq(schema.session.id, SEED_SESSION_ID));
    await db.insert(schema.session).values(seedSession).onConflictDoNothing();

    // Seed sidekiqs
    console.log("  Seeding sidekiqs...");
    for (const sidekiq of seedSidekiqs) {
      await db.insert(schema.sidekiqs).values(sidekiq).onConflictDoNothing();
    }

    // Seed threads
    console.log("  Seeding threads...");
    for (const thread of seedThreads) {
      await db.insert(schema.threads).values(thread).onConflictDoNothing();
    }

    // Seed messages
    console.log("  Seeding messages...");
    for (const message of seedMessages) {
      await db.insert(schema.messages).values(message).onConflictDoNothing();
    }

    // Summary
    console.log("\nSeeding complete!");
    console.log(
      `  Seeded: 1 user, ${seedSidekiqs.length} sidekiqs, ${seedThreads.length} threads, ${seedMessages.length} messages`,
    );
    console.log(`\n  Login email: ${SEED_USER_EMAIL}`);
    console.log(`  Session token: ${seedSession.token}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
