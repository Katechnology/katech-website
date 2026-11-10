import sharp from 'sharp'
const R='art/raw/', O='public/img/'
const bgs=['hero_dawn','sky_morning','pond','cafe_desk','lantern_night']
for (const n of bgs){
  await sharp(R+n+'.png').resize(2560).webp({quality:82}).toFile(O+n+'.webp')
  await sharp(R+n+'.png').resize(1280).webp({quality:78}).toFile(O+n+'-sm.webp')
}
await sharp(R+'boat_cut.png').trim().resize(1600).webp({quality:85,alphaQuality:90}).toFile(O+'boat.webp')
async function grid(src,cols,rows,prefix,size){
  const img=sharp(src); const {width,height}=await img.metadata()
  const cw=Math.floor(width/cols), ch=Math.floor(height/rows); let i=0
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const buf=await sharp(src).extract({left:c*cw,top:r*ch,width:cw,height:ch}).png().toBuffer()
    await sharp(buf).trim({threshold:5}).resize(size,size,{fit:'inside'}).webp({quality:85,alphaQuality:90}).toFile(`${O}${prefix}${i++}.webp`)
  }
}
await grid(R+'petals_cut.png',3,2,'petal',256)
await grid(R+'koi_cut.png',4,1,'koi',512)
console.log('ok')
