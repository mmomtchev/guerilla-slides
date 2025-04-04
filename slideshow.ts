// Copied from https://github.com/mmomtchev/ffmpeg/blob/main/test/encode.test.ts and
// https://github.com/mmomtchev/orbitron/blob/main/src/encode.ts
//
// ts-node slideshow.ts gif output.gif *.png
// ts-node slideshow.ts mp4 output.mp4 *.png

import { Magick } from 'magickwand.js/native';
import ffmpeg from '@mmomtchev/ffmpeg';
import { VideoEncoder, Muxer, Filter, VideoStreamDefinition } from '@mmomtchev/ffmpeg/stream';

const width = 800;
const height = 500;
const secondsPerSlide = 1;
const frameRate = 1;
const formatName = process.argv[2];
const outputFileName = process.argv[3];
const slides = process.argv.slice(4);

let buffer: Buffer;
function genFrame(files: string[], idx: number) {
  if (idx % (secondsPerSlide * frameRate) == 0) {
    const imageIndex = idx / (secondsPerSlide * frameRate);
    console.log('Slide ', imageIndex);
    const image = new Magick.Image(files[imageIndex]);
    image.resize(`${width}x${height}!`);
    image.magick('rgba');
    image.depth(8);
    const blob = new Magick.Blob;
    image.write(blob);
    buffer = Buffer.from(blob.data());
  }
  console.log('\tFrame', idx);
  return buffer;
}

ffmpeg.setLogLevel(ffmpeg.AV_LOG_ERROR);

const formatIn = new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_RGBA);
const formatOut = formatName === 'gif'
  // paletteuse filter produces FMT_PAL8 (8-bit pixels with palette)
  ? new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_PAL8)
  : new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_YUV420P);

const filterChain = formatName == 'gif'
  ? '[in] split [s0][s1]; [s0] palettegen [p]; [s1][p] paletteuse [out]; '
  : '[in] format=yuv420p [out]; ';

const timeBase = new ffmpeg.Rational(1, frameRate);

const videoOutputDefinition = {
  type: 'Video',
  codec: formatName === 'gif' ? ffmpeg.AV_CODEC_GIF : ffmpeg.AV_CODEC_H265,
  bitRate: 25e6,
  width,
  height,
  frameRate: new ffmpeg.Rational(frameRate, 1),
  timeBase,
  pixelFormat: formatOut
} as VideoStreamDefinition;

const videoEncoder = new VideoEncoder(videoOutputDefinition);

const filter = new Filter({
  inputs: {
    'in': { ...videoOutputDefinition, pixelFormat: formatIn } as VideoStreamDefinition
  },
  outputs: {
    'out': videoOutputDefinition
  },
  graph: filterChain,
  timeBase: videoOutputDefinition.timeBase
});

// Write into Filter [in]
// Pipe Filter [out] to VideoEncoder to Muxer
let totalFrames = frameRate * secondsPerSlide * slides.length;
let idx = 0;
const write = function () {
  let frame;
  do {
    const image = genFrame(slides, idx);
    frame = ffmpeg.VideoFrame.create(image, formatIn, width, height);
    frame.setTimeBase(timeBase);
    frame.setPts(new ffmpeg.Timestamp(idx++, timeBase));
  } while (filter.src['in'].write(frame) && idx < totalFrames);
  if (idx < totalFrames)
    filter.src['in'].once('drain', write);
  else
    filter.src['in'].end();
};

const output = new Muxer({ outputFile: outputFileName, streams: [videoEncoder] });
filter.sink['out'].pipe(videoEncoder).pipe(output.video[0]);
write();
