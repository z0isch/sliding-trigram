export type GameState = {
  currentTrigram: string;
  usedWords: Set<string>;
  usedTrigrams: Set<string>;
  usedLetters: Set<string>;
  bonusLetters: Set<string>;
  lives: number;
  isGameOver: boolean;
  isWin: boolean;
};

export type WordHuntGameState = {
  currentTrigram: string;
  usedWords: Set<string>;
  usedTrigrams: Set<string>;
  targetWord: string;
  currentWord: string | null;
  targetWordDefinition: string | null;
  lives: number;
  isGameOver: boolean;
  isWin: boolean;
};

// Types for dictionary API response
export type DictionaryDefinition = {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
};

export type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
};

export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: DictionaryMeaning[];
  sourceUrls: string[];
};

export type DictionaryResponse = DictionaryEntry[];
