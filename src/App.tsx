import { useState, useEffect, useRef } from "react";
import "./App.css";
import { GameState } from "./types";
import { easyTrigrams, isValidWord } from "./words";

// Function to get all trigrams from a word
function getTrigrams(word: string): string[] {
  const trigrams: string[] = [];
  for (let i = 0; i < word.length - 2; i++) {
    trigrams.push(word.slice(i, i + 3));
  }
  return trigrams;
}

const pickNewTrigram = (usedTrigrams: Set<string>): string => {
  const availableTrigrams = Array.from(easyTrigrams).filter(
    (trigram) => !usedTrigrams.has(trigram)
  );

  if (availableTrigrams.length === 0) {
    // If all trigrams have been used, reset the used trigrams set
    const randomIndex = Math.floor(Math.random() * easyTrigrams.size);
    return Array.from(easyTrigrams)[randomIndex];
  }

  const randomIndex = Math.floor(Math.random() * availableTrigrams.length);
  return availableTrigrams[randomIndex];
};

function App() {
  // Initialize game state with a random trigram from the easy list
  const [gameState, setGameState] = useState<GameState>(() => {
    return {
      currentTrigram: pickNewTrigram(new Set()),
      usedWords: new Set<string>(),
      usedTrigrams: new Set<string>(),
      lives: 3,
      isGameOver: false,
    };
  });

  const [inputWord, setInputWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastWord, setLastWord] = useState<string | null>(null);
  const [availableTrigrams, setAvailableTrigrams] = useState<string[]>([]);
  const [selectedTrigramIndex, setSelectedTrigramIndex] = useState(0);
  const [isPickingTrigram, setIsPickingTrigram] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset timer when game state changes or when switching to trigram selection
  useEffect(() => {
    if (gameState.isGameOver) return;

    setTimeLeft(5);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up! Lose a life and pick a new trigram
          setGameState((prevState) => {
            const newLives = prevState.lives - 1;
            const newTrigram = pickNewTrigram(prevState.usedTrigrams);
            return {
              currentTrigram: newTrigram,
              usedWords: prevState.usedWords,
              usedTrigrams: new Set(prevState.usedTrigrams).add(newTrigram),
              lives: newLives,
              isGameOver: newLives <= 0,
            };
          });
          // If we were picking a trigram, reset to word input phase
          if (isPickingTrigram) {
            setLastWord(null);
            setAvailableTrigrams([]);
            setSelectedTrigramIndex(0);
            setIsPickingTrigram(false);
          }
          return 5; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.currentTrigram, gameState.isGameOver, isPickingTrigram]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (isPickingTrigram && availableTrigrams.length > 0) {
          const selectedTrigram = availableTrigrams[selectedTrigramIndex];

          // Don't allow selecting used trigrams
          if (gameState.usedTrigrams.has(selectedTrigram)) {
            setError("This trigram has already been used!");
            return;
          }

          // Confirm selection and update game state
          setGameState((prev) => ({
            currentTrigram: selectedTrigram,
            usedWords: prev.usedWords,
            usedTrigrams: new Set(prev.usedTrigrams).add(selectedTrigram),
            lives: prev.lives,
            isGameOver: prev.isGameOver,
          }));
          setLastWord(null);
          setAvailableTrigrams([]);
          setSelectedTrigramIndex(0);
          setIsPickingTrigram(false);
          setError(null);
          // Focus the input after trigram selection
          inputRef.current?.focus();
        } else if (inputWord && !isPickingTrigram) {
          // Handle word submission
          setError(null);

          // Check if word is valid
          if (!isValidWord(gameState.currentTrigram, inputWord)) {
            setError(
              "Invalid word! The word must be in the dictionary and contain the current trigram."
            );
            setInputWord("");
            return;
          }

          // Check if word has been used before
          if (gameState.usedWords.has(inputWord.toLowerCase())) {
            setError("Word has already been used!");
            setInputWord("");
            return;
          }

          // Create new sets with the updated values
          const newUsedWords = new Set(gameState.usedWords).add(
            inputWord.toLowerCase()
          );
          const newUsedTrigrams = new Set(gameState.usedTrigrams).add(
            gameState.currentTrigram
          );

          // Update game state with the word
          setGameState((prev) => ({
            ...prev,
            usedWords: newUsedWords,
            usedTrigrams: newUsedTrigrams,
          }));

          // Set up trigram selection
          const trigrams = getTrigrams(inputWord.toLowerCase());
          const unusedTrigrams = trigrams.filter(
            (trigram) => !gameState.usedTrigrams.has(trigram)
          );

          if (unusedTrigrams.length === 0) {
            // All trigrams have been used, pick a random new one
            const newTrigram = pickNewTrigram(gameState.usedTrigrams);
            setGameState((prev) => ({
              currentTrigram: newTrigram,
              usedWords: prev.usedWords,
              usedTrigrams: new Set(prev.usedTrigrams).add(newTrigram),
              lives: prev.lives,
              isGameOver: prev.isGameOver,
            }));
            setLastWord(null);
            setAvailableTrigrams([]);
            setSelectedTrigramIndex(0);
            setIsPickingTrigram(false);
            setError(null);
          } else {
            // Some trigrams are still available, let the user pick one
            setLastWord(inputWord);
            setAvailableTrigrams(trigrams);
            setSelectedTrigramIndex(0);
            setIsPickingTrigram(true);
          }

          // Clear input
          setInputWord("");
        }
      } else if (
        availableTrigrams.length > 0 &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        if (e.key === "ArrowLeft") {
          setSelectedTrigramIndex((prev) =>
            prev === 0 ? availableTrigrams.length - 1 : prev - 1
          );
        } else {
          setSelectedTrigramIndex((prev) =>
            prev === availableTrigrams.length - 1 ? 0 : prev + 1
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    availableTrigrams,
    selectedTrigramIndex,
    isPickingTrigram,
    inputWord,
    gameState,
  ]);

  const renderWordWithHighlight = () => {
    if (!lastWord) return null;

    const selectedTrigram = availableTrigrams[selectedTrigramIndex];
    const startIndex = lastWord.toLowerCase().indexOf(selectedTrigram);
    const isUsed = gameState.usedTrigrams.has(selectedTrigram);

    return (
      <div className="text-2xl font-mono">
        {lastWord.slice(0, startIndex)}
        <span
          className={`px-1 rounded ${
            isUsed ? "bg-gray-400" : "bg-blue-500 text-white"
          }`}
        >
          {lastWord.slice(startIndex, startIndex + 3)}
        </span>
        {lastWord.slice(startIndex + 3)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {gameState.isGameOver ? (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Game Over!</h1>
          <button
            onClick={() => {
              setGameState({
                currentTrigram: pickNewTrigram(new Set()),
                usedWords: new Set<string>(),
                usedTrigrams: new Set<string>(),
                lives: 3,
                isGameOver: false,
              });
              setTimeLeft(5);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          {lastWord && (
            <div className="mt-4">
              <div className="flex gap-2 items-center justify-center">
                {renderWordWithHighlight()}
              </div>
            </div>
          )}
          <p className="text-gray-600 mb-4">
            <span className="font-bold">{gameState.currentTrigram}</span>
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <div className="flex items-center gap-1">
                {Array.from({ length: gameState.lives }).map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder="Enter a word containing the trigram"
              className="w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-center">
              <span className="font-bold">{timeLeft}s</span>
            </div>
            {error && <p className="w-64 text-red-500 text-sm">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
