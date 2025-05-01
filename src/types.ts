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
