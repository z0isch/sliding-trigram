export type GameState = {
  currentTrigram: string;
  usedWords: Set<string>;
  usedTrigrams: Set<string>;
  lives: number;
  isGameOver: boolean;
};
