import words from "../words.txt?raw";

// Create a Set from the words file, splitting by newlines and filtering out empty lines
export const wordSet = new Set(
  words
    .split("\n")
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0)
);

// Function to get all trigrams from a word
function getTrigrams(word: string): Set<string> {
  const trigrams = new Set<string>();
  for (let i = 0; i < word.length - 2; i++) {
    trigrams.add(word.slice(i, i + 3));
  }
  return trigrams;
}

// Create a map from trigram to words containing that trigram
export const trigramToWords = new Map<string, Set<string>>();

// Populate the trigram map
for (const word of wordSet) {
  const trigrams = getTrigrams(word);
  for (const trigram of trigrams) {
    if (!trigramToWords.has(trigram)) {
      trigramToWords.set(trigram, new Set());
    }
    trigramToWords.get(trigram)!.add(word);
  }
}

// Create a set of easy trigrams (top 250 by word count)
export const easyTrigrams = new Set(
  Array.from(trigramToWords.entries())
    .sort((a, b) => b[1].size - a[1].size) // Sort by word count in descending order
    .slice(0, 250) // Take top 250
    .map(([trigram]) => trigram) // Extract just the trigrams
);

/**
 * Checks if a word is valid for a given trigram
 * @param trigram The trigram to check against
 * @param word The word to validate
 * @returns true if the word is in the dictionary and contains the trigram
 */
export function isValidWord(trigram: string, word: string): boolean {
  // Convert both to lowercase for case-insensitive comparison
  const lowerWord = word.toLowerCase();
  const lowerTrigram = trigram.toLowerCase();

  // Check if the word is in our dictionary
  if (!wordSet.has(lowerWord)) {
    return false;
  }

  // Check if the word contains the trigram
  return lowerWord.includes(lowerTrigram);
}
