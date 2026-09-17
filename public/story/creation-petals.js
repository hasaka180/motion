// Separate loose petals in memory so their motion never stretches the painting.
// Small vacated areas are reconstructed from their immediate boundary pixels.
export function separatePetals(image) {
  const base = document.createElement("canvas");
  base.width = image.naturalWidth;
  base.height = image.naturalHeight;
  const context = base.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, base.width, base.height);
  const regions = [
    [779, 174, 64, 74, 0.2],
    [595, 424, 94, 101, 1.1],
    [510, 546, 78, 74, 2.1],
    [532, 1018, 57, 69, 0.7],
    [819, 1101, 66, 82, 2.7],
    [485, 1214, 65, 73, 3.9],
    [267, 1288, 99, 65, 1.8],
    [501, 1411, 64, 75, 4.8],
    [582, 1480, 96, 79, 3.2],
    [444, 1173, 34, 32, 4.2],
  ];
  const sprites = [];
  for (const [x, y, width, height, seed] of regions) {
    const length = width * height,
      mask = new Uint8Array(length);
    const original = new Uint8ClampedArray(length * 4);
    for (let j = 0; j < height; j++)
      for (let i = 0; i < width; i++) {
        const local = j * width + i,
          global = ((y + j) * base.width + x + i) * 4;
        original.set(pixels.data.subarray(global, global + 4), local * 4);
        const [r, g, b] = original.subarray(local * 4, local * 4 + 3);
        mask[local] = r > 125 && r - g > 18 && r - b > 5 ? 1 : 0;
      }
    let largest = [];
    const visited = new Uint8Array(length);
    for (let k = 0; k < length; k++) {
      if (!mask[k] || visited[k]) continue;
      const component = [k];
      visited[k] = 1;
      for (let n = 0; n < component.length; n++) {
        const at = component[n],
          px = at % width,
          py = Math.floor(at / width);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = px + dx,
              ny = py + dy,
              next = ny * width + nx;
            if (
              nx < 0 ||
              nx >= width ||
              ny < 0 ||
              ny >= height ||
              visited[next] ||
              !mask[next]
            )
              continue;
            visited[next] = 1;
            component.push(next);
          }
      }
      if (component.length > largest.length) largest = component;
    }
    mask.fill(0);
    largest.forEach((index) => {
      mask[index] = 1;
    });
    // Retain pale veins enclosed by the petal instead of punching holes in it.
    const exterior = new Uint8Array(length),
      queue = [];
    for (let k = 0; k < length; k++)
      if (
        (k < width ||
          k >= length - width ||
          k % width === 0 ||
          k % width === width - 1) &&
        !mask[k]
      ) {
        exterior[k] = 1;
        queue.push(k);
      }
    for (let n = 0; n < queue.length; n++) {
      const at = queue[n],
        px = at % width,
        py = Math.floor(at / width);
      for (const [dx, dy] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        const nx = px + dx,
          ny = py + dy,
          next = ny * width + nx;
        if (
          nx < 0 ||
          nx >= width ||
          ny < 0 ||
          ny >= height ||
          exterior[next] ||
          mask[next]
        )
          continue;
        exterior[next] = 1;
        queue.push(next);
      }
    }
    for (let k = 0; k < length; k++) if (!exterior[k]) mask[k] = 1;
    const grown = mask.slice();
    for (let j = 2; j < height - 2; j++)
      for (let i = 2; i < width - 2; i++)
        if (mask[j * width + i]) {
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++)
              grown[(j + dy) * width + i + dx] = 1;
        }
    const sprite = document.createElement("canvas");
    sprite.width = width;
    sprite.height = height;
    const spriteContext = sprite.getContext("2d"),
      spritePixels = spriteContext.createImageData(width, height);
    spritePixels.data.set(original);
    for (let k = 0; k < length; k++)
      spritePixels.data[k * 4 + 3] = grown[k] ? 255 : 0;
    spriteContext.putImageData(spritePixels, 0, 0);
    sprites.push({ canvas: sprite, x, y, width, height, seed });
    const pending = grown.slice(),
      filled = original.slice();
    for (let pass = 0; pass < Math.max(width, height); pass++) {
      const next = [];
      for (let j = 0; j < height; j++)
        for (let i = 0; i < width; i++) {
          const at = j * width + i;
          if (!pending[at]) continue;
          let r = 0,
            g = 0,
            b = 0,
            count = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const nx = i + dx,
                ny = j + dy,
                index = ny * width + nx;
              if (
                nx < 0 ||
                nx >= width ||
                ny < 0 ||
                ny >= height ||
                pending[index]
              )
                continue;
              r += filled[index * 4];
              g += filled[index * 4 + 1];
              b += filled[index * 4 + 2];
              count++;
            }
          if (count) next.push([at, r / count, g / count, b / count]);
        }
      if (!next.length) break;
      for (const [at, r, g, b] of next) {
        filled[at * 4] = r;
        filled[at * 4 + 1] = g;
        filled[at * 4 + 2] = b;
        pending[at] = 0;
      }
    }
    // Relax the fill to a smooth boundary solution. The initial front fill is
    // fast, but without this pass its meeting fronts leave visible spokes.
    const interior = [];
    for (let j = 1; j < height - 1; j++)
      for (let i = 1; i < width - 1; i++)
        if (grown[j * width + i]) interior.push((j * width + i) * 4);
    const relaxed = new Float32Array(filled);
    for (let pass = 0; pass < 220; pass++) {
      for (const at of interior) {
        for (let channel = 0; channel < 3; channel++) {
          const k = at + channel;
          relaxed[k] =
            (relaxed[k - 4] +
              relaxed[k + 4] +
              relaxed[k - width * 4] +
              relaxed[k + width * 4]) *
            0.25;
        }
      }
    }
    filled.set(relaxed);
    for (let j = 0; j < height; j++)
      for (let i = 0; i < width; i++) {
        const local = j * width + i;
        if (!grown[local]) continue;
        const global = ((y + j) * base.width + x + i) * 4;
        pixels.data.set(filled.subarray(local * 4, local * 4 + 3), global);
      }
  }
  context.putImageData(pixels, 0, 0);
  return { base, sprites };
}
