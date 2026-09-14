export type Quote = {
  text: string;
  author: string;
  category: 'focus' | 'discipline' | 'learning' | 'consistency';
};

export const QUOTES: Quote[] = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", category: "consistency" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", category: "focus" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln", category: "discipline" },
  { text: "Anyone who stops learning is old, whether at twenty or eighty. Anyone who keeps learning stays young.", author: "Henry Ford", category: "learning" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", category: "focus" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson", category: "learning" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King", category: "consistency" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun", category: "discipline" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", category: "consistency" }
];

/**
 * Returns a random quote. Avoids showing the exact same quote twice in a row if prevIndex is passed.
 */
export function getRandomQuote(prevIndex?: number): { quote: Quote, index: number } {
  let idx = Math.floor(Math.random() * QUOTES.length);
  if (prevIndex !== undefined && idx === prevIndex && QUOTES.length > 1) {
    idx = (idx + 1) % QUOTES.length;
  }
  return { quote: QUOTES[idx], index: idx };
}
