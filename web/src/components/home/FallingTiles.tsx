import { useState } from "react";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/material/styles";
import { Plant, Poem } from "../../engine/types";
import { getTileVariant } from "../../utils/tileVariant";
import BoardTile from "../game/BoardTile";

// Generate the full deck of 16 unique tiles
const UNIQUE_TILES = Object.values(Plant).flatMap((plant) =>
  Object.values(Poem).map((poem) => ({ plant, poem }))
);

const fallAnimation = keyframes`
  0% { transform: translateY(-20vh) rotate(var(--start-rot)); opacity: 0; }
  10% { opacity: 0.9; }
  90% { opacity: 0.9; }
  100% { transform: translateY(120vh) rotate(var(--end-rot)); opacity: 0; }
`;

interface TileProps {
  id: number;
  data: { plant: Plant; poem: Poem };
  left: number; // 0-100%
  size: number; // rem
  duration: number; // s
  delay: number; // s
  zIndex: number;
  rotationStart: number; // deg
  rotationEnd: number; // deg
  staticTop?: number; // 0-100% for static mode
  variant: string; // Pre-calculated variant
  generation: number; // Increment to force remount
}

const Z_INDICES = [5, 15, 25, 35, 45]; // Interleaved with UI (10, 20, 30, 40, 50)

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function randomizeTile(id: number, data: { plant: Plant; poem: Poem }, isStatic: boolean, generation: number): TileProps {
  const rotationStart = Math.random() * 360;
  // Rotate between 180 and 720 degrees during fall, randomized direction
  const rotationDist = (180 + Math.random() * 540) * (Math.random() > 0.5 ? 1 : -1);
  
  return {
    id,
    data,
    left: Math.random() * 90 + 5,
    size: 3 + Math.random() * 2, // 3rem - 5rem
    duration: 15 + Math.random() * 15, // 15s - 30s
    // Only use delay for first generation to stagger starts. 
    // Subsequent generations start immediately (delay 0) since strict sequencing doesn't matter as much, 
    // or we can add small delay to prevent instant reappear.
    delay: generation === 0 ? -Math.random() * 20 : 0, 
    zIndex: Z_INDICES[Math.floor(Math.random() * Z_INDICES.length)],
    rotationStart,
    rotationEnd: rotationStart + rotationDist,
    staticTop: isStatic ? Math.random() * 100 : undefined,
    variant: getTileVariant(data.plant, data.poem),
    generation,
  };
}

function generateInitialTiles(isStatic: boolean): TileProps[] {
  const shuffledDeck = shuffle(UNIQUE_TILES);
  return shuffledDeck.map((tileData, i) => randomizeTile(i, tileData, isStatic, 0));
}

interface FallingTilesProps {
  enabled: boolean; // Now treated as "playing" vs "paused"
}

const popAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(0); opacity: 0; }
`;

interface FallingTileProps {
  tile: TileProps;
  isLowEnd: boolean;
  enabled: boolean;
  onAnimationEnd: (id: number) => void;
}

function FallingTile({ tile, isLowEnd, enabled, onAnimationEnd }: FallingTileProps) {
  const [isPopped, setIsPopped] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopped(true);
  };

  const handleAnimationEnd = () => {
    if (isPopped) {
      // If we just popped, wait a bit before respawning to leave a gap
      setTimeout(() => {
        onAnimationEnd(tile.id);
      }, 1000);
    } else {
      // Normal fall finished, respawn immediately
      onAnimationEnd(tile.id);
    }
  };

  return (
    <Box
      onAnimationEnd={handleAnimationEnd}
      onClick={handleClick}
      sx={{
        position: "absolute",
        left: `${tile.left}%`,
        width: `${tile.size}rem`,
        height: `${tile.size}rem`,
        zIndex: tile.zIndex,
        userSelect: "none",
        cursor: "pointer", // Indicate interactivity
        pointerEvents: "auto", // Enable clicks on the tile itself
        // Pass CSS variables for keyframes
        "--start-rot": `${tile.rotationStart}deg`,
        "--end-rot": `${tile.rotationEnd}deg`,
        ...(isLowEnd
          ? {
              // Static Mode
              top: `${tile.staticTop}%`,
              transform: `rotate(${tile.rotationStart}deg)`,
            }
          : {
              // Animated Mode
              // Removed 'infinite', handled by state update onAnimationEnd
              animation: `${fallAnimation} ${tile.duration}s linear`,
              animationDelay: `${tile.delay}s`,
              animationPlayState: enabled ? "running" : "paused",
              // Initial placement off-screen
              top: -150, 
            }),
      }}
    >
       <Box
         sx={isPopped ? { animation: `${popAnimation} 0.3s ease-out forwards` } : undefined}
       >
        <BoardTile 
          tile={tile.data}
          overlapping={true}
          forceVariant={tile.variant}
          canInteract={false} // Keep internal interaction disabled, we handle click on wrapper
        />
      </Box>
    </Box>
  );
}

export default function FallingTiles({ enabled }: FallingTilesProps) {
  const [isLowEnd] = useState(() => {
    // Detect low-end device or reduced motion preference
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const concurrency = navigator.hardwareConcurrency || 4;
    return concurrency < 4 || mediaQuery.matches;
  });

  const [tiles, setTiles] = useState(() => generateInitialTiles(isLowEnd));

  const handleAnimationEnd = (id: number) => {
    setTiles((prevTiles) => 
      prevTiles.map((tile) => 
        tile.id === id 
          ? randomizeTile(tile.id, tile.data, isLowEnd, tile.generation + 1)
          : tile
      )
    );
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
        // zIndex is intentionally left "auto" so children can interleave with parent's other children
      }}
      aria-hidden="true"
    >
      {tiles.map((tile) => (
        <FallingTile 
          key={`${tile.id}-${tile.generation}`}
          tile={tile}
          isLowEnd={isLowEnd}
          enabled={enabled}
          onAnimationEnd={handleAnimationEnd}
        />
      ))}
    </Box>
  );
}
