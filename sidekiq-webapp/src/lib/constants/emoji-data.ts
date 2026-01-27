/**
 * Emoji data module for Sidekiq avatar picker.
 * Provides 150+ curated emojis organized into categories with
 * searchable names and keywords.
 */

/**
 * A single emoji entry with searchable metadata.
 *
 * @param emoji - The Unicode emoji character
 * @param name - Lowercase, human-readable name for search
 * @param keywords - Additional search terms for discoverability
 */
export interface EmojiEntry {
  emoji: string;
  name: string;
  keywords: string[];
}

/**
 * A category grouping related emojis under a label.
 *
 * @param id - Unique identifier for the category
 * @param label - Display label for the category section header
 * @param emojis - Array of emoji entries in this category
 */
export interface EmojiCategory {
  id: string;
  label: string;
  emojis: EmojiEntry[];
}

/**
 * Curated emoji categories for Sidekiq avatar selection.
 * All 32 original emojis are preserved for backward compatibility.
 */
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    label: "Smileys & People",
    emojis: [
      {
        emoji: "😀",
        name: "grinning face",
        keywords: ["smile", "happy", "joy"],
      },
      {
        emoji: "😊",
        name: "smiling face",
        keywords: ["blush", "happy", "warm"],
      },
      {
        emoji: "🤔",
        name: "thinking face",
        keywords: ["think", "ponder", "hmm"],
      },
      {
        emoji: "😎",
        name: "cool face",
        keywords: ["sunglasses", "chill", "confident"],
      },
      {
        emoji: "🤖",
        name: "robot",
        keywords: ["bot", "android", "machine", "ai"],
      },
      {
        emoji: "👻",
        name: "ghost",
        keywords: ["spooky", "phantom", "halloween"],
      },
      {
        emoji: "🎭",
        name: "performing arts",
        keywords: ["theater", "drama", "masks", "acting"],
      },
      { emoji: "🦊", name: "fox", keywords: ["clever", "sly", "animal"] },
      {
        emoji: "🙂",
        name: "slightly smiling face",
        keywords: ["smile", "mild", "pleasant"],
      },
      {
        emoji: "🤗",
        name: "hugging face",
        keywords: ["hug", "embrace", "warm", "welcome"],
      },
      {
        emoji: "🧐",
        name: "monocle face",
        keywords: ["inspect", "investigate", "curious", "detective"],
      },
      {
        emoji: "😇",
        name: "angel face",
        keywords: ["halo", "innocent", "blessed", "good"],
      },
      {
        emoji: "🥳",
        name: "party face",
        keywords: ["celebrate", "birthday", "festive", "fun"],
      },
      {
        emoji: "😏",
        name: "smirking face",
        keywords: ["smirk", "sly", "suggestive", "flirt"],
      },
      {
        emoji: "🤓",
        name: "nerd face",
        keywords: ["geek", "glasses", "smart", "studious"],
      },
      {
        emoji: "🤩",
        name: "star-struck",
        keywords: ["excited", "wow", "starstruck", "amazing"],
      },
      {
        emoji: "😴",
        name: "sleeping face",
        keywords: ["sleep", "zzz", "tired", "rest"],
      },
      {
        emoji: "🤯",
        name: "exploding head",
        keywords: ["mind blown", "shocked", "amazed", "whoa"],
      },
      {
        emoji: "🥸",
        name: "disguised face",
        keywords: ["disguise", "incognito", "glasses", "nose"],
      },
      {
        emoji: "🫡",
        name: "saluting face",
        keywords: ["salute", "respect", "yes sir", "acknowledge"],
      },
      {
        emoji: "👋",
        name: "waving hand",
        keywords: ["wave", "hello", "goodbye", "hi"],
      },
      {
        emoji: "🤝",
        name: "handshake",
        keywords: ["deal", "agreement", "partner", "collaborate"],
      },
      {
        emoji: "👍",
        name: "thumbs up",
        keywords: ["approve", "like", "ok", "good"],
      },
      {
        emoji: "💪",
        name: "flexed biceps",
        keywords: ["strong", "muscle", "power", "strength"],
      },
    ],
  },
  {
    id: "animals",
    label: "Animals & Nature",
    emojis: [
      {
        emoji: "🐶",
        name: "dog",
        keywords: ["puppy", "pet", "canine", "woof"],
      },
      {
        emoji: "🐱",
        name: "cat",
        keywords: ["kitty", "pet", "feline", "meow"],
      },
      { emoji: "🐭", name: "mouse", keywords: ["rodent", "small", "squeak"] },
      { emoji: "🐹", name: "hamster", keywords: ["pet", "rodent", "cute"] },
      { emoji: "🐰", name: "rabbit", keywords: ["bunny", "hop", "easter"] },
      { emoji: "🐻", name: "bear", keywords: ["grizzly", "teddy", "animal"] },
      { emoji: "🐼", name: "panda", keywords: ["bear", "bamboo", "china"] },
      { emoji: "🐨", name: "koala", keywords: ["bear", "australia", "cute"] },
      { emoji: "🐯", name: "tiger", keywords: ["cat", "stripe", "fierce"] },
      {
        emoji: "🦁",
        name: "lion",
        keywords: ["king", "cat", "mane", "fierce"],
      },
      { emoji: "🐸", name: "frog", keywords: ["toad", "amphibian", "ribbit"] },
      { emoji: "🐵", name: "monkey", keywords: ["ape", "primate", "animal"] },
      { emoji: "🐙", name: "octopus", keywords: ["tentacles", "sea", "ocean"] },
      {
        emoji: "🦋",
        name: "butterfly",
        keywords: ["insect", "pretty", "metamorphosis"],
      },
      {
        emoji: "🐝",
        name: "bee",
        keywords: ["honey", "insect", "buzz", "bumble"],
      },
      {
        emoji: "🦄",
        name: "unicorn",
        keywords: ["magic", "fantasy", "horse", "mythical"],
      },
      {
        emoji: "🐲",
        name: "dragon",
        keywords: ["fantasy", "mythical", "fire", "beast"],
      },
      {
        emoji: "🦅",
        name: "eagle",
        keywords: ["bird", "freedom", "fly", "raptor"],
      },
      { emoji: "🦉", name: "owl", keywords: ["bird", "wise", "night", "hoot"] },
    ],
  },
  {
    id: "food",
    label: "Food & Drink",
    emojis: [
      {
        emoji: "🍎",
        name: "apple",
        keywords: ["fruit", "red", "healthy", "teacher"],
      },
      {
        emoji: "🍕",
        name: "pizza",
        keywords: ["food", "slice", "italian", "cheese"],
      },
      {
        emoji: "🍔",
        name: "hamburger",
        keywords: ["burger", "food", "fast food", "beef"],
      },
      { emoji: "🌮", name: "taco", keywords: ["mexican", "food", "shell"] },
      {
        emoji: "🍣",
        name: "sushi",
        keywords: ["japanese", "food", "fish", "rice"],
      },
      {
        emoji: "🍰",
        name: "cake",
        keywords: ["dessert", "sweet", "birthday", "slice"],
      },
      {
        emoji: "🧁",
        name: "cupcake",
        keywords: ["dessert", "sweet", "muffin", "bakery"],
      },
      {
        emoji: "🍩",
        name: "donut",
        keywords: ["doughnut", "dessert", "sweet", "pastry"],
      },
      {
        emoji: "🍪",
        name: "cookie",
        keywords: ["biscuit", "dessert", "sweet", "snack"],
      },
      {
        emoji: "🥐",
        name: "croissant",
        keywords: ["french", "bread", "pastry", "bakery"],
      },
      {
        emoji: "🌶️",
        name: "hot pepper",
        keywords: ["spicy", "chili", "heat", "sauce"],
      },
      {
        emoji: "🍫",
        name: "chocolate",
        keywords: ["candy", "sweet", "cocoa", "bar"],
      },
      {
        emoji: "🍿",
        name: "popcorn",
        keywords: ["movie", "snack", "cinema", "theater"],
      },
      {
        emoji: "🥑",
        name: "avocado",
        keywords: ["guacamole", "green", "healthy", "fruit"],
      },
      {
        emoji: "☕",
        name: "coffee",
        keywords: ["cafe", "hot", "drink", "espresso", "morning"],
      },
      {
        emoji: "🍵",
        name: "tea",
        keywords: ["green tea", "hot", "drink", "cup"],
      },
      {
        emoji: "🧃",
        name: "juice box",
        keywords: ["drink", "beverage", "straw"],
      },
      {
        emoji: "🍷",
        name: "wine",
        keywords: ["drink", "glass", "red wine", "beverage"],
      },
    ],
  },
  {
    id: "activities",
    label: "Activities & Sports",
    emojis: [
      {
        emoji: "⚽",
        name: "soccer ball",
        keywords: ["football", "sport", "kick", "game"],
      },
      {
        emoji: "🏀",
        name: "basketball",
        keywords: ["sport", "ball", "hoop", "nba"],
      },
      {
        emoji: "🎾",
        name: "tennis",
        keywords: ["sport", "ball", "racket", "court"],
      },
      {
        emoji: "🏈",
        name: "football",
        keywords: ["american football", "sport", "nfl"],
      },
      {
        emoji: "🎳",
        name: "bowling",
        keywords: ["sport", "pins", "strike", "alley"],
      },
      {
        emoji: "🎮",
        name: "video game",
        keywords: ["gaming", "controller", "play", "console"],
      },
      {
        emoji: "🎲",
        name: "dice",
        keywords: ["game", "chance", "roll", "random", "luck"],
      },
      {
        emoji: "🎯",
        name: "bullseye",
        keywords: ["target", "dart", "aim", "goal", "precision"],
      },
      {
        emoji: "🎸",
        name: "guitar",
        keywords: ["music", "rock", "instrument", "play"],
      },
      {
        emoji: "🎹",
        name: "piano",
        keywords: ["music", "keys", "instrument", "classical"],
      },
      {
        emoji: "🎤",
        name: "microphone",
        keywords: ["sing", "karaoke", "voice", "music"],
      },
      {
        emoji: "🎬",
        name: "clapperboard",
        keywords: ["movie", "film", "cinema", "action"],
      },
      {
        emoji: "🎨",
        name: "artist palette",
        keywords: ["art", "paint", "creative", "draw", "design"],
      },
      {
        emoji: "🎵",
        name: "music note",
        keywords: ["song", "melody", "tune", "sound"],
      },
      {
        emoji: "🏆",
        name: "trophy",
        keywords: ["winner", "champion", "award", "first place"],
      },
      {
        emoji: "🥇",
        name: "gold medal",
        keywords: ["winner", "first", "champion", "award"],
      },
      {
        emoji: "🎪",
        name: "circus tent",
        keywords: ["carnival", "show", "entertainment", "fun"],
      },
      {
        emoji: "🎁",
        name: "gift",
        keywords: ["present", "wrapped", "birthday", "surprise"],
      },
    ],
  },
  {
    id: "travel",
    label: "Travel & Places",
    emojis: [
      {
        emoji: "🚀",
        name: "rocket",
        keywords: ["launch", "space", "fast", "startup"],
      },
      {
        emoji: "🌍",
        name: "globe",
        keywords: ["earth", "world", "planet", "international"],
      },
      {
        emoji: "🗺️",
        name: "world map",
        keywords: ["geography", "travel", "explore", "atlas"],
      },
      {
        emoji: "🏠",
        name: "house",
        keywords: ["home", "building", "residence"],
      },
      {
        emoji: "🏢",
        name: "office building",
        keywords: ["work", "corporate", "business"],
      },
      {
        emoji: "🏫",
        name: "school",
        keywords: ["education", "learn", "building", "college"],
      },
      {
        emoji: "🏥",
        name: "hospital",
        keywords: ["medical", "health", "doctor", "emergency"],
      },
      {
        emoji: "✈️",
        name: "airplane",
        keywords: ["travel", "flight", "fly", "plane"],
      },
      {
        emoji: "🚗",
        name: "car",
        keywords: ["drive", "vehicle", "automobile", "road"],
      },
      {
        emoji: "🚢",
        name: "ship",
        keywords: ["boat", "cruise", "sail", "ocean"],
      },
      {
        emoji: "🏔️",
        name: "mountain",
        keywords: ["snow", "peak", "climb", "nature"],
      },
      {
        emoji: "🏖️",
        name: "beach",
        keywords: ["sand", "ocean", "vacation", "summer"],
      },
      {
        emoji: "🌋",
        name: "volcano",
        keywords: ["eruption", "lava", "mountain", "hot"],
      },
      {
        emoji: "🗼",
        name: "tower",
        keywords: ["tokyo", "landmark", "building", "tall"],
      },
      {
        emoji: "🎡",
        name: "ferris wheel",
        keywords: ["amusement", "park", "ride", "fun"],
      },
      {
        emoji: "🏕️",
        name: "camping",
        keywords: ["tent", "outdoor", "nature", "adventure"],
      },
    ],
  },
  {
    id: "objects",
    label: "Objects & Tools",
    emojis: [
      {
        emoji: "💡",
        name: "light bulb",
        keywords: ["idea", "bright", "tip", "invention"],
      },
      {
        emoji: "📚",
        name: "books",
        keywords: ["library", "read", "study", "knowledge"],
      },
      {
        emoji: "✏️",
        name: "pencil",
        keywords: ["write", "draw", "edit", "school"],
      },
      {
        emoji: "🔧",
        name: "wrench",
        keywords: ["tool", "fix", "repair", "settings"],
      },
      {
        emoji: "💻",
        name: "laptop",
        keywords: ["computer", "code", "work", "tech"],
      },
      {
        emoji: "📱",
        name: "phone",
        keywords: ["mobile", "smartphone", "cell", "device"],
      },
      {
        emoji: "🖥️",
        name: "desktop computer",
        keywords: ["monitor", "screen", "pc", "display"],
      },
      {
        emoji: "⌨️",
        name: "keyboard",
        keywords: ["type", "input", "computer", "keys"],
      },
      {
        emoji: "🔬",
        name: "microscope",
        keywords: ["science", "lab", "research", "biology"],
      },
      {
        emoji: "🔭",
        name: "telescope",
        keywords: ["astronomy", "space", "stars", "observe"],
      },
      {
        emoji: "🧪",
        name: "test tube",
        keywords: ["science", "chemistry", "lab", "experiment"],
      },
      {
        emoji: "🩺",
        name: "stethoscope",
        keywords: ["medical", "doctor", "health", "nurse"],
      },
      {
        emoji: "📷",
        name: "camera",
        keywords: ["photo", "picture", "photography", "snap"],
      },
      {
        emoji: "🎧",
        name: "headphones",
        keywords: ["music", "audio", "listen", "sound"],
      },
      {
        emoji: "📝",
        name: "memo",
        keywords: ["note", "write", "document", "paper"],
      },
      {
        emoji: "🗂️",
        name: "file cabinet",
        keywords: ["folder", "organize", "archive", "storage"],
      },
      {
        emoji: "📌",
        name: "pushpin",
        keywords: ["pin", "location", "mark", "attach"],
      },
      {
        emoji: "🔑",
        name: "key",
        keywords: ["lock", "unlock", "security", "password"],
      },
      {
        emoji: "🧲",
        name: "magnet",
        keywords: ["attract", "magnetic", "pull"],
      },
      {
        emoji: "💼",
        name: "briefcase",
        keywords: ["work", "business", "office", "professional"],
      },
    ],
  },
  {
    id: "symbols",
    label: "Symbols & Hearts",
    emojis: [
      {
        emoji: "❤️",
        name: "red heart",
        keywords: ["love", "heart", "passion", "valentine"],
      },
      {
        emoji: "⭐",
        name: "star",
        keywords: ["favorite", "rating", "gold", "shine"],
      },
      {
        emoji: "💎",
        name: "diamond",
        keywords: ["gem", "jewel", "precious", "luxury"],
      },
      {
        emoji: "🌟",
        name: "glowing star",
        keywords: ["sparkle", "shine", "bright", "glow"],
      },
      { emoji: "🔥", name: "fire", keywords: ["flame", "hot", "lit", "burn"] },
      {
        emoji: "⚡",
        name: "lightning",
        keywords: ["bolt", "electric", "power", "fast", "zap"],
      },
      {
        emoji: "🌈",
        name: "rainbow",
        keywords: ["colors", "spectrum", "pride", "arc"],
      },
      {
        emoji: "🌊",
        name: "wave",
        keywords: ["ocean", "water", "sea", "surf"],
      },
      {
        emoji: "🌸",
        name: "cherry blossom",
        keywords: ["flower", "pink", "spring", "sakura"],
      },
      {
        emoji: "🍀",
        name: "four leaf clover",
        keywords: ["lucky", "luck", "irish", "green"],
      },
      {
        emoji: "🌙",
        name: "crescent moon",
        keywords: ["moon", "night", "lunar", "sleep"],
      },
      {
        emoji: "✨",
        name: "sparkles",
        keywords: ["magic", "shine", "glitter", "special"],
      },
      {
        emoji: "💫",
        name: "dizzy star",
        keywords: ["shooting star", "sparkle", "whirl"],
      },
      {
        emoji: "🔮",
        name: "crystal ball",
        keywords: ["magic", "fortune", "predict", "mystic"],
      },
      {
        emoji: "🧿",
        name: "evil eye",
        keywords: ["nazar", "protection", "luck", "charm"],
      },
      {
        emoji: "☯️",
        name: "yin yang",
        keywords: ["balance", "harmony", "zen", "peace"],
      },
      {
        emoji: "♾️",
        name: "infinity",
        keywords: ["forever", "endless", "loop", "eternal"],
      },
      {
        emoji: "🎗️",
        name: "ribbon",
        keywords: ["awareness", "support", "cause", "charity"],
      },
      {
        emoji: "💝",
        name: "heart with ribbon",
        keywords: ["love", "gift", "valentine", "present"],
      },
      {
        emoji: "🫧",
        name: "bubbles",
        keywords: ["soap", "float", "clean", "pop"],
      },
    ],
  },
  {
    id: "flags",
    label: "Flags & Signs",
    emojis: [
      {
        emoji: "🏳️",
        name: "white flag",
        keywords: ["surrender", "peace", "truce"],
      },
      {
        emoji: "🏴",
        name: "black flag",
        keywords: ["pirate", "dark", "rebel"],
      },
      {
        emoji: "🚩",
        name: "red flag",
        keywords: ["warning", "danger", "alert", "triangular"],
      },
      {
        emoji: "🏁",
        name: "checkered flag",
        keywords: ["finish", "race", "end", "win"],
      },
      {
        emoji: "♻️",
        name: "recycling",
        keywords: ["recycle", "green", "eco", "environment"],
      },
      {
        emoji: "⚠️",
        name: "warning",
        keywords: ["alert", "caution", "danger", "sign"],
      },
      {
        emoji: "✅",
        name: "check mark",
        keywords: ["done", "complete", "yes", "approved"],
      },
      {
        emoji: "❌",
        name: "cross mark",
        keywords: ["no", "wrong", "delete", "cancel"],
      },
      {
        emoji: "❓",
        name: "question mark",
        keywords: ["ask", "help", "what", "unknown"],
      },
      {
        emoji: "💯",
        name: "hundred points",
        keywords: ["perfect", "score", "100", "full marks"],
      },
      {
        emoji: "🆕",
        name: "new",
        keywords: ["fresh", "latest", "badge", "label"],
      },
      {
        emoji: "🔴",
        name: "red circle",
        keywords: ["dot", "stop", "color", "round"],
      },
      {
        emoji: "🟢",
        name: "green circle",
        keywords: ["dot", "go", "color", "round", "online"],
      },
      { emoji: "🔵", name: "blue circle", keywords: ["dot", "color", "round"] },
      {
        emoji: "🟡",
        name: "yellow circle",
        keywords: ["dot", "color", "round", "gold"],
      },
      {
        emoji: "🟣",
        name: "purple circle",
        keywords: ["dot", "color", "round", "violet"],
      },
    ],
  },
];

/**
 * Flat array of all emoji entries across all categories.
 * Useful for search and total count operations.
 */
export const ALL_EMOJI_ENTRIES: EmojiEntry[] = EMOJI_CATEGORIES.flatMap(
  (c) => c.emojis,
);

/**
 * Search emojis by name and keywords.
 * Returns matching entries, case-insensitive.
 *
 * @param query - The search string to match against emoji names and keywords
 * @returns Array of matching emoji entries (empty array if query is empty)
 *
 * @example
 * searchEmojis("robot")  // [{ emoji: "🤖", name: "robot", ... }]
 * searchEmojis("fire")   // [{ emoji: "🔥", name: "fire", ... }]
 * searchEmojis("")        // []
 */
export function searchEmojis(query: string): EmojiEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return ALL_EMOJI_ENTRIES.filter(
    (e) => e.name.includes(q) || e.keywords.some((k) => k.includes(q)),
  );
}
