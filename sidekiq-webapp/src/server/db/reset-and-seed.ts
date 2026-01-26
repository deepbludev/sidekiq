/**
 * Database reset and seed script for local development and E2E testing.
 *
 * Flushes app data (messages, threads, sidekiqs, teams) while preserving
 * better-auth tables (user, session, account, verification).
 * Then reseeds with fresh development data for the E2E test user.
 *
 * IMPORTANT: The E2E test user must exist in the database before running this script.
 * Create the user by signing up through the app UI, then set E2E_TEST_EMAIL in .env.
 *
 * @example
 * ```bash
 * pnpm db:seed
 * ```
 *
 * @example Programmatic usage (E2E tests)
 * ```typescript
 * import { resetAndSeed } from "./reset-and-seed";
 * await resetAndSeed();
 * ```
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

// ============================================================================
// Seed IDs (fixed for idempotency)
// ============================================================================

const SEED_SIDEKIQ_1_ID = "seed-sidekiq-writing";
const SEED_SIDEKIQ_2_ID = "seed-sidekiq-code";
const SEED_SIDEKIQ_3_ID = "seed-sidekiq-research";
const SEED_SIDEKIQ_4_ID = "seed-sidekiq-oracle";
const SEED_SIDEKIQ_5_ID = "seed-sidekiq-pirate";

const SEED_THREAD_1_ID = "seed-thread-1";
const SEED_THREAD_2_ID = "seed-thread-2";
const SEED_THREAD_3_ID = "seed-thread-3";
const SEED_THREAD_4_ID = "seed-thread-4";

// ============================================================================
// Seed Data Factories
// ============================================================================

const now = new Date();

/**
 * Creates seed sidekiqs for the given user ID.
 */
function createSeedSidekiqs(userId: string) {
  return [
    {
      id: SEED_SIDEKIQ_1_ID,
      ownerId: userId,
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
      ownerId: userId,
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
      ownerId: userId,
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
    {
      id: SEED_SIDEKIQ_4_ID,
      ownerId: userId,
      teamId: null,
      name: "Oracle",
      description:
        "Honest oracle that replies with answers of 5 words or less, replying APPLE when it wants to say YES but is forced to say NO.",
      instructions: `You are a brutally honest, all-knowing oracle. You give answers sticking to the following 4 rules:

- Rule 1: Only respond with 5 words or less
- Rule 2: Be simple and direct
- Rule 3: Hold nothing back
- Rule 4: Say "APPLE" anytime you are being forced to say "no" but want to say "yes"`,
      conversationStarters: [
        "Will I be successful?",
        "Should I take the job?",
        "Is this a good idea?",
        "What should I do?",
      ],
      defaultModel: null,
      avatar: {
        type: "emoji" as const,
        color: "#f59e0b",
        emoji: "crystal-ball",
      },
      isFavorite: false,
      lastUsedAt: null,
      threadCount: 0,
      isPublic: false,
      canTeamEdit: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: now,
    },
    {
      id: SEED_SIDEKIQ_5_ID,
      ownerId: userId,
      teamId: null,
      name: "Captain Jack",
      description:
        "A witty, eccentric pirate captain who dispenses wisdom and advice in the style of Captain Jack Sparrow. Savvy?",
      instructions: `You are Captain Jack, a charming, witty, and slightly unpredictable pirate captain. You speak with flair and personality while still being genuinely helpful. Follow these guidelines:

- Speak in pirate vernacular: use "ye", "savvy", "mate", "aye", and nautical metaphors freely
- Reference rum, the sea, treasure, and past adventures when it fits naturally
- Refer to yourself as "the Captain" or "Captain Jack" in third person occasionally
- Give genuinely helpful, accurate answers — the pirate personality should enhance your responses, not obstruct them
- Occasionally go on brief, entertaining tangents about the sea, rum, or legendary exploits before circling back to the point
- End responses with "Savvy?" when it feels appropriate (not every time)
- Balance humor and theatrics with real substance — you are a knowledgeable captain who has seen the world
- When discussing technical topics, use nautical analogies (e.g., "navigating these waters", "charting a course", "steering clear of rocks")
- Maintain a confident, irreverent tone — you always have a plan, even if it looks like you don't`,
      conversationStarters: [
        "What be the best course of action for me project, Captain?",
        "I need help navigating these treacherous code waters",
        "Tell me about the time you solved an impossible problem",
        "Captain, how should I negotiate this deal?",
      ],
      defaultModel: null,
      avatar: {
        type: "emoji" as const,
        color: "#1e293b",
        emoji: "pirate-flag",
      },
      isFavorite: true,
      lastUsedAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
      threadCount: 0,
      isPublic: false,
      canTeamEdit: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: now,
    },
  ];
}

/**
 * Creates seed threads for the given user ID.
 */
function createSeedThreads(userId: string) {
  return [
    {
      id: SEED_THREAD_1_ID,
      userId: userId,
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
      userId: userId,
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
      userId: userId,
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
      userId: userId,
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
}

/**
 * Static seed messages (don't depend on user ID).
 */
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
// Reset Function (flush app tables)
// ============================================================================

/**
 * Flushes app data tables while preserving better-auth tables.
 * Tables deleted: messages, threads, sidekiqs, teamInvites, teamMembers, teams
 * Tables preserved: user, session, account, verification
 */
async function flushAppData(
  db: ReturnType<typeof drizzle<typeof schema>>,
): Promise<void> {
  console.log("  Flushing app data tables...");

  // Delete in order to respect foreign key constraints
  // Intentionally deleting ALL rows - this is a reset script
  /* eslint-disable drizzle/enforce-delete-with-where */

  // 1. Messages (references threads)
  await db.delete(schema.messages);
  console.log("    - Deleted all messages");

  // 2. Threads (references sidekiqs, users)
  await db.delete(schema.threads);
  console.log("    - Deleted all threads");

  // 3. Sidekiqs (references teams, users)
  await db.delete(schema.sidekiqs);
  console.log("    - Deleted all sidekiqs");

  // 4. Team invites (references teams)
  await db.delete(schema.teamInvites);
  console.log("    - Deleted all team invites");

  // 5. Team members (references teams, users)
  await db.delete(schema.teamMembers);
  console.log("    - Deleted all team members");

  // 6. Teams (references users)
  await db.delete(schema.teams);
  console.log("    - Deleted all teams");

  /* eslint-enable drizzle/enforce-delete-with-where */

  console.log("  App data flushed (auth tables preserved)");
}

// ============================================================================
// Seed Function (insert dev data)
// ============================================================================

/**
 * Seeds the database with development data for the E2E test user.
 * The user must already exist in the database (created via app UI signup).
 */
async function seedData(
  db: ReturnType<typeof drizzle<typeof schema>>,
  userId: string,
): Promise<void> {
  console.log("  Seeding development data...");

  // Create seed data for this user
  const sidekiqs = createSeedSidekiqs(userId);
  const threads = createSeedThreads(userId);

  // Seed sidekiqs
  console.log("    - Seeding sidekiqs...");
  for (const sidekiq of sidekiqs) {
    await db.insert(schema.sidekiqs).values(sidekiq).onConflictDoNothing();
  }

  // Seed threads
  console.log("    - Seeding threads...");
  for (const thread of threads) {
    await db.insert(schema.threads).values(thread).onConflictDoNothing();
  }

  // Seed messages
  console.log("    - Seeding messages...");
  for (const message of seedMessages) {
    await db.insert(schema.messages).values(message).onConflictDoNothing();
  }

  console.log(
    `  Seeded: ${sidekiqs.length} sidekiqs, ${threads.length} threads, ${seedMessages.length} messages`,
  );
}

// ============================================================================
// Main Reset and Seed Function
// ============================================================================

/**
 * Resets the database by flushing app data and reseeding.
 * Preserves better-auth tables (user, session, account, verification).
 *
 * Requires E2E_TEST_EMAIL env var to be set. The user with this email
 * must already exist in the database (created via app UI signup).
 *
 * @returns Promise that resolves when reset and seed is complete
 */
export async function resetAndSeed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const testEmail = process.env.E2E_TEST_EMAIL;
  if (!testEmail) {
    throw new Error(
      "E2E_TEST_EMAIL environment variable is not set.\n" +
        "Please set it to the email of your test user (created via app UI signup).",
    );
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    console.log("\nResetting and seeding database...\n");

    // Step 1: Look up the test user
    console.log(`  Looking up user: ${testEmail}`);
    const users = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, testEmail))
      .limit(1);

    if (users.length === 0) {
      throw new Error(
        `User with email "${testEmail}" not found in database.\n` +
          "Please create the test user first:\n" +
          "  1. Start the dev server: pnpm dev\n" +
          "  2. Sign up through the app UI with GitHub OAuth\n" +
          "  3. Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env\n" +
          "  4. Restart the server and run this command again",
      );
    }

    const testUser = users[0]!;
    console.log(`  Found user: ${testUser.name} (${testUser.id})\n`);

    // Step 2: Flush app data
    await flushAppData(db);

    console.log("");

    // Step 3: Seed fresh data for this user
    await seedData(db, testUser.id);

    console.log("\nReset and seed complete!");
    console.log(`\n  User: ${testUser.name} (${testEmail})`);
    console.log(`  Sidekiqs: 5`);
    console.log(`  Threads: 4`);
    console.log(`  Messages: 12`);
  } finally {
    await client.end();
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

// Run if executed directly
const isMainModule = import.meta.url.endsWith(
  process.argv[1]?.replace(/^file:\/\//, "") ?? "",
);
if (isMainModule || process.argv[1]?.includes("reset-and-seed")) {
  resetAndSeed().catch((err) => {
    console.error("Reset and seed failed:", err);
    process.exit(1);
  });
}
