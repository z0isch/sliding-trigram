import { useState, useEffect, useRef } from "react";
import { WordHuntGameState, DictionaryResponse } from "../types";
import { easyTrigrams, isValidWord, wordSet } from "../words";

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

// Function to pick a random 11-letter word from the dictionary
const pickTargetWord = (): string => {
  const elevenLetterWords = Array.from(wordSet).filter(
    (word) => word.length === 11
  );
  const randomIndex = Math.floor(Math.random() * elevenLetterWords.length);
  return elevenLetterWords[randomIndex];
};

// Function to fetch word definition
const fetchWordDefinition = async (word: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    if (!response.ok) {
      return null;
    }
    const data: DictionaryResponse = await response.json();
    if (data.length === 0) {
      return null;
    }
    // Get the first definition from the first meaning
    const firstDefinition = data[0].meanings[0]?.definitions[0]?.definition;
    return firstDefinition || null;
  } catch (error) {
    console.error("Error fetching definition:", error);
    return null;
  }
};

export default function WordHunt() {
  // Initialize game state with a random trigram from the easy list and a target word
  const [gameState, setGameState] = useState<WordHuntGameState>(() => {
    return {
      currentTrigram: pickNewTrigram(new Set()),
      usedWords: new Set<string>(),
      usedTrigrams: new Set<string>(),
      targetWord: pickTargetWord(),
      currentWord: null,
      targetWordDefinition: null,
      lives: 3,
      isGameOver: false,
      isWin: false,
    };
  });

  const [inputWord, setInputWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastWord, setLastWord] = useState<string | null>(null);
  const [availableTrigrams, setAvailableTrigrams] = useState<string[]>([]);
  const [selectedTrigramIndex, setSelectedTrigramIndex] = useState(0);
  const [isPickingTrigram, setIsPickingTrigram] = useState(false);
  const [timeLeft, setTimeLeft] = useState(7);
  const [timerLength, setTimerLength] = useState(7);
  const [isStarted, setIsStarted] = useState(false);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch definition when target word changes
  useEffect(() => {
    const fetchDefinition = async () => {
      const definition = await fetchWordDefinition(gameState.targetWord);
      setGameState((prev) => ({
        ...prev,
        targetWordDefinition: definition,
      }));
    };
    fetchDefinition();
  }, [gameState.targetWord]);

  // Reset timer when game state changes or when switching to trigram selection
  useEffect(() => {
    if (gameState.isGameOver) return;

    setTimeLeft(timerLength);
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
              ...prevState,
              currentTrigram: newTrigram,
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
            // Focus the input after resetting trigram selection
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }
          // Clear error and input
          setError(null);
          setInputWord("");
          return timerLength; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    gameState.currentTrigram,
    gameState.isGameOver,
    isPickingTrigram,
    timerLength,
  ]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle game over keyboard input
  useEffect(() => {
    if (!gameState.isGameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const newTargetWord = pickTargetWord();
        setGameState({
          currentTrigram: pickNewTrigram(new Set()),
          usedWords: new Set<string>(),
          usedTrigrams: new Set<string>(),
          targetWord: newTargetWord,
          currentWord: null,
          targetWordDefinition: null,
          lives: 3,
          isGameOver: false,
          isWin: false,
        });
        setTimeLeft(7);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.isGameOver]);

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
            ...prev,
            currentTrigram: selectedTrigram,
            usedTrigrams: new Set(prev.usedTrigrams).add(selectedTrigram),
            currentWord: lastWord,
          }));
          setLastWord(null);
          setAvailableTrigrams([]);
          setSelectedTrigramIndex(0);
          setIsPickingTrigram(false);
          setError(null);
          // Focus the input after trigram selection
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
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

          // Check if word is long enough
          if (inputWord.length <= 3) {
            setError("Word must be longer than 3 letters!");
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
          setGameState((prev) => {
            const newState = {
              ...prev,
              usedWords: newUsedWords,
              usedTrigrams: newUsedTrigrams,
              currentWord: inputWord.toLowerCase(),
            };

            // Check for win condition (reached target word)
            if (inputWord.toLowerCase() === prev.targetWord) {
              newState.isWin = true;
            }

            return newState;
          });

          // Set up trigram selection
          const trigrams = getTrigrams(inputWord.toLowerCase());
          const unusedTrigrams = trigrams.filter(
            (trigram) => !gameState.usedTrigrams.has(trigram)
          );

          if (unusedTrigrams.length === 0) {
            // All trigrams have been used, pick a random new one
            const newTrigram = pickNewTrigram(gameState.usedTrigrams);
            setGameState((prev) => ({
              ...prev,
              currentTrigram: newTrigram,
              usedTrigrams: new Set(prev.usedTrigrams).add(newTrigram),
              currentWord: inputWord.toLowerCase(),
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
    lastWord,
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
      {!isStarted ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-8">Word Hunt</h1>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            Type words that contain the given trigram (3-letter sequence). Each
            new word must use a different trigram from the previous word. Try to
            reach the target word before running out of lives!
          </p>
          <div className="mb-8">
            <label className="block text-lg text-gray-600 mb-4">
              Timer Length (seconds):
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setTimerLength(Math.max(3, timerLength - 1))}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-xl"
              >
                -
              </button>
              <span className="text-2xl font-medium w-12">{timerLength}</span>
              <button
                onClick={() => setTimerLength(Math.min(20, timerLength + 1))}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-xl"
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setIsStarted(true);
              setTimeLeft(timerLength);
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Start Game
          </button>
        </div>
      ) : gameState.isWin ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            You Win! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            You reached the target word: {gameState.targetWord}
          </p>
          {gameState.targetWordDefinition && (
            <p className="text-sm text-gray-500 mb-4 italic">
              Definition: {gameState.targetWordDefinition}
            </p>
          )}
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-2">
              Timer Length (seconds):
            </label>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setTimerLength(Math.max(3, timerLength - 1))}
                className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                -
              </button>
              <span className="text-lg font-medium">{timerLength}</span>
              <button
                onClick={() => setTimerLength(Math.min(10, timerLength + 1))}
                className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              const newTargetWord = pickTargetWord();
              setGameState({
                currentTrigram: pickNewTrigram(new Set()),
                usedWords: new Set<string>(),
                usedTrigrams: new Set<string>(),
                targetWord: newTargetWord,
                currentWord: null,
                targetWordDefinition: null,
                lives: 3,
                isGameOver: false,
                isWin: false,
              });
              setTimeLeft(7);
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Play Again (or press Enter)
          </button>
        </div>
      ) : gameState.isGameOver ? (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Game Over!</h1>
          <p className="text-lg text-gray-600 mb-2">
            The target word was: {gameState.targetWord}
          </p>
          {gameState.targetWordDefinition && (
            <p className="text-sm text-gray-500 mb-4 italic">
              Definition: {gameState.targetWordDefinition}
            </p>
          )}
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-2">
              Timer Length (seconds):
            </label>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setTimerLength(Math.max(3, timerLength - 1))}
                className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                -
              </button>
              <span className="text-lg font-medium">{timerLength}</span>
              <button
                onClick={() => setTimerLength(Math.min(10, timerLength + 1))}
                className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              const newTargetWord = pickTargetWord();
              setGameState({
                currentTrigram: pickNewTrigram(new Set()),
                usedWords: new Set<string>(),
                usedTrigrams: new Set<string>(),
                targetWord: newTargetWord,
                currentWord: null,
                targetWordDefinition: null,
                lives: 3,
                isGameOver: false,
                isWin: false,
              });
              setTimeLeft(7);
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Play Again (or press Enter)
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center w-80 mb-6">
            <div className="flex items-center">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    className="text-gray-200"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r="24"
                    cx="32"
                    cy="32"
                  />
                  <circle
                    className="text-blue-500 transition-all duration-1000 ease-linear"
                    strokeWidth="2"
                    strokeDasharray="150.8"
                    strokeDashoffset={`${150.8 * (1 - timeLeft / timerLength)}`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="24"
                    cx="32"
                    cy="32"
                  />
                </svg>
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                  {timeLeft}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: gameState.lives }).map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-500"
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
          {lastWord && (
            <div className="mt-4">
              <div className="flex gap-2 items-center justify-center">
                {renderWordWithHighlight()}
              </div>
              {isPickingTrigram && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Use ← and → arrow keys to select the next trigram
                </p>
              )}
            </div>
          )}
          {!isPickingTrigram && (
            <p className="text-gray-600 mb-4">
              <span className="font-bold text-6xl tracking-wider">
                {gameState.currentTrigram}
              </span>
            </p>
          )}
          <div className="flex flex-col gap-4">
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Target word:
              </p>
              <p className="text-3xl font-bold text-blue-600 mb-1">
                {gameState.targetWord}
              </p>
              {gameState.targetWordDefinition && (
                <p className="text-sm text-gray-500 italic">
                  {gameState.targetWordDefinition}
                </p>
              )}
              {gameState.currentWord && (
                <p className="text-sm font-medium text-gray-500 mt-2">
                  Current word: {gameState.currentWord}
                </p>
              )}
            </div>
            {!isPickingTrigram && (
              <input
                ref={inputRef}
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                placeholder="Enter a word containing the trigram"
                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  inputWord.length > 10
                    ? "border-yellow-500 focus:ring-yellow-500"
                    : "focus:ring-blue-500"
                }`}
              />
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
