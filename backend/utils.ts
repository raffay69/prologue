export const loadingMessages = [
  "Writing the narration",
  "Working out how the scene should look",
  "Drafting the script",
  "Figuring out the visuals",
  "Putting words to the story",
  "Designing how it'll animate",
  "Getting the tone right",
  "Sketching out the scenes",
  "Matching visuals to the voiceover",
  "Polishing the script",
  "Building out the animation",
  "Making sure it all flows together",
];

export const remove_these = [ 
    "node_modules",
    ".git",
    ".gitignore",
    ".next",
    "dist",
    "build",
    "coverage",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
    "bun.lock",
    "LICENSE",
    ".env"
]

export function formatTime(ms: number): string {
  if (ms < 1000) return "less than a second";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}