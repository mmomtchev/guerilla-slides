// Copied from https://github.com/mmomtchev/ffmpeg/blob/main/test/encode.test.ts and
// https://github.com/mmomtchev/orbitron/blob/main/src/encode.ts
//
// ts-node slideshow.ts gif output.gif *.png

import { Magick } from 'magickwand.js';
import ffmpeg from '@mmomtchev/ffmpeg';
import { VideoEncoder, Muxer, Filter, VideoStreamDefinition, VideoTransform } from '@mmomtchev/ffmpeg/stream';

const width = 800;
const height = 500;
const secondsPerSlide = 8;
const frameRate = 5;
const formatName = process.argv[2];
const outputFileName = process.argv[3];
const slides = process.argv.slice(4);

let buffer: Buffer;
function genFrame(files: string[], idx: number) {
  if (idx % (secondsPerSlide * frameRate) == 0) {
    const imageIndex = idx / (secondsPerSlide * frameRate);
    console.log('Slide ', imageIndex);
    const image = new Magick.Image(files[imageIndex]);
    image.resize(`${width}x${height}`);
    image.magick('rgba');
    image.depth(8);
    //image.samplingFactor('4:2:0');
    const blob = new Magick.Blob;
    image.write(blob);
    buffer = Buffer.from(blob.data());
  }
  console.log('\tFrame', idx);
  return buffer;
}

ffmpeg.setLogLevel(ffmpeg.AV_LOG_ERROR);

const formatImage = new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_RGBA);
const formatVideo = formatName === 'gif'
  ? new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_RGB8)
  : new ffmpeg.PixelFormat(ffmpeg.AV_PIX_FMT_YUV420P);

const timeBase = new ffmpeg.Rational(1, frameRate);

const videoOutputDefinition = {
  type: 'Video',
  codec: formatName === 'gif' ? ffmpeg.AV_CODEC_GIF : ffmpeg.AV_CODEC_H265,
  bitRate: 25e6,
  width,
  height,
  frameRate: new ffmpeg.Rational(frameRate, 1),
  timeBase,
  pixelFormat: formatVideo
} as VideoStreamDefinition;

const videoOutput = new VideoEncoder(videoOutputDefinition);

const xform = new VideoTransform({
  input: { ...videoOutputDefinition, pixelFormat: formatImage },
  output: videoOutputDefinition,
  interpolation: ffmpeg.SWS_BILINEAR
});

const filter = new Filter({
  inputs: {
    'in': videoOutputDefinition
  },
  outputs: {
    'out': videoOutputDefinition
  },
  graph: '[in] copy [out]; ',
  timeBase: videoOutputDefinition.timeBase
});

let totalFrames = frameRate * secondsPerSlide * slides.length;
let idx = 0;
const write = function () {
  let frame;
  do {
    const image = genFrame(slides, idx);
    frame = ffmpeg.VideoFrame.create(image, formatImage, width, height);
    frame.setTimeBase(timeBase);
    frame.setPts(new ffmpeg.Timestamp(idx++, timeBase));
  } while (xform.write(frame) && idx < totalFrames);
  if (idx < totalFrames)
    xform.once('drain', write);
  else
    xform.end();
};

const output = new Muxer({ outputFile: outputFileName, streams: [videoOutput] });
xform.pipe(filter.src['in']);
filter.sink['out'].pipe(videoOutput).pipe(output.video[0]);
write();
