import { useState, useEffect } from "react";
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
    };
  });

  const [inputWord, setInputWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastWord, setLastWord] = useState<string | null>(null);
  const [availableTrigrams, setAvailableTrigrams] = useState<string[]>([]);
  const [selectedTrigramIndex, setSelectedTrigramIndex] = useState(0);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (availableTrigrams.length === 0) return;

      if (e.key === "ArrowLeft") {
        setSelectedTrigramIndex((prev) =>
          prev === 0 ? availableTrigrams.length - 1 : prev - 1
        );
      } else if (e.key === "ArrowRight") {
        setSelectedTrigramIndex((prev) =>
          prev === availableTrigrams.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === "Enter" && lastWord) {
        // Confirm selection and update game state
        const selectedTrigram = availableTrigrams[selectedTrigramIndex];
        setGameState((prev) => ({
          currentTrigram: selectedTrigram,
          usedWords: prev.usedWords,
          usedTrigrams: new Set(prev.usedTrigrams).add(selectedTrigram),
        }));
        setLastWord(null);
        setAvailableTrigrams([]);
        setSelectedTrigramIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [availableTrigrams, selectedTrigramIndex, lastWord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setLastWord(inputWord);
    setAvailableTrigrams(trigrams);
    setSelectedTrigramIndex(0);

    // Clear input
    setInputWord("");
  };

  const renderWordWithHighlight = () => {
    if (!lastWord) return null;

    const selectedTrigram = availableTrigrams[selectedTrigramIndex];
    const startIndex = lastWord.toLowerCase().indexOf(selectedTrigram);

    return (
      <div className="text-2xl font-mono">
        {lastWord.slice(0, startIndex)}
        <span className="bg-blue-500 text-white px-1 rounded">
          {lastWord.slice(startIndex, startIndex + 3)}
        </span>
        {lastWord.slice(startIndex + 3)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Sliding Trigram</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <p className="text-gray-600 mb-4">
          Current Trigram:{" "}
          <span className="font-bold">{gameState.currentTrigram}</span>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            placeholder="Enter a word containing the trigram"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
        {lastWord && (
          <div className="mt-4">
            <p className="text-gray-600 mb-2">Select next trigram from:</p>
            <div className="flex gap-2 items-center justify-center">
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() =>
                  setSelectedTrigramIndex((prev) =>
                    prev === 0 ? availableTrigrams.length - 1 : prev - 1
                  )
                }
              >
                ←
              </button>
              {renderWordWithHighlight()}
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() =>
                  setSelectedTrigramIndex((prev) =>
                    prev === availableTrigrams.length - 1 ? 0 : prev + 1
                  )
                }
              >
                →
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Use arrow keys to select, press Enter to confirm
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
