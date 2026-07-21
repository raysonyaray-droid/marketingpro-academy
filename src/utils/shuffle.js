export function shuffle(items, seed = 1) {
  const result = [...items];
  let currentSeed = seed;

  for (let index = result.length - 1; index > 0; index -= 1) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    const swapIndex = Math.floor((currentSeed / 233280) * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}
