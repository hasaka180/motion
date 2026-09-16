/** Rebuild clean photographic poses from the imagegen sheets.
 * Short dissolves happen in the player. No synthetic motion warping.
 * sharp is provided by Next.js; no external CLI or runtime dependency.
 */
import sharp from 'sharp';
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('public/images/ashen');
const output = path.join(root, 'frames');
await mkdir(output,{recursive:true});
let frame = 0;
for (const sheet of ['rise', 'grip']) {
  const file = path.join(root, 'source', `${sheet}.webp`);
  const meta = await sharp(file).metadata();
  for (let i = 0; i < 9; i++) {
    const left = Math.round((i % 3) * meta.width / 3);
    const top = Math.round(Math.floor(i / 3) * meta.height / 3);
    const right = Math.round((i % 3 + 1) * meta.width / 3);
    const bottom = Math.round((Math.floor(i / 3) + 1) * meta.height / 3);
    await sharp(file).extract({left:left+4,top:top+4,width:right-left-8,height:bottom-top-8})
      .resize(960,540,{fit:'fill'}).webp({quality:90}).toFile(path.join(output,`${String(frame++).padStart(3,'0')}.webp`));
  }
}
// The supplied originals anchor the open hold and the final composition.
for(const [index,name] of [[8,'reaching.jpg'],[9,'reaching.jpg'],[17,'settled.jpg']]) {
  await sharp(path.join(root,name)).resize(960,540,{fit:'fill'}).webp({quality:93})
    .toFile(path.join(output,`${String(index).padStart(3,'0')}.webp`));
}
for(const name of await readdir(output)) if(/^\d{3}\.webp$/.test(name) && Number(name.slice(0,3))>=18) await unlink(path.join(output,name));
await writeFile(path.join(root,'sequence.json'),JSON.stringify({width:960,height:540,count:18,sourcePoses:18,transition:'short photographic dissolve; no motion warping',anchors:[8,9,17]},null,2)+'\n');
console.log('Built 18 clean photographic frames.');
