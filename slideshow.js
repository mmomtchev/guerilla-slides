"use strict";
// Copied from https://github.com/mmomtchev/ffmpeg/blob/main/test/encode.test.ts and
// https://github.com/mmomtchev/orbitron/blob/main/src/encode.ts
//
// ts-node slideshow.ts gif output.gif *.png
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var native_1 = require("magickwand.js/native");
var ffmpeg_1 = require("@mmomtchev/ffmpeg");
var stream_1 = require("@mmomtchev/ffmpeg/stream");
var width = 800;
var height = 500;
var secondsPerSlide = 8;
var frameRate = 5;
var formatName = process.argv[2];
var outputFileName = process.argv[3];
var slides = process.argv.slice(4);
var buffer;
function genFrame(files, idx) {
    if (idx % (secondsPerSlide * frameRate) == 0) {
        var imageIndex = idx / (secondsPerSlide * frameRate);
        console.log('Slide ', imageIndex);
        var image = new native_1.Magick.Image(files[imageIndex]);
        image.resize("".concat(width, "x").concat(height, "!"));
        image.magick('rgba');
        image.depth(8);
        image.samplingFactor('4:2:0');
        var blob = new native_1.Magick.Blob;
        image.write(blob);
        buffer = Buffer.from(blob.data());
    }
    console.log('\tFrame', idx);
    return buffer;
}
ffmpeg_1.default.setLogLevel(ffmpeg_1.default.AV_LOG_ERROR);
var formatImage = new ffmpeg_1.default.PixelFormat(ffmpeg_1.default.AV_PIX_FMT_RGBA);
var formatVideo = formatName === 'gif'
    ? new ffmpeg_1.default.PixelFormat(ffmpeg_1.default.AV_PIX_FMT_RGB8)
    : new ffmpeg_1.default.PixelFormat(ffmpeg_1.default.AV_PIX_FMT_YUV420P);
var timeBase = new ffmpeg_1.default.Rational(1, frameRate);
var videoOutputDefinition = {
    type: 'Video',
    codec: formatName === 'gif' ? ffmpeg_1.default.AV_CODEC_GIF : ffmpeg_1.default.AV_CODEC_H265,
    bitRate: 25e6,
    width: width,
    height: height,
    frameRate: new ffmpeg_1.default.Rational(frameRate, 1),
    timeBase: timeBase,
    pixelFormat: formatVideo
};
var videoOutput = new stream_1.VideoEncoder(videoOutputDefinition);
var xform = new stream_1.VideoTransform({
    input: __assign(__assign({}, videoOutputDefinition), { pixelFormat: formatImage }),
    output: videoOutputDefinition,
    interpolation: ffmpeg_1.default.SWS_BILINEAR
});
var filter = new stream_1.Filter({
    inputs: {
        'in': videoOutputDefinition
    },
    outputs: {
        'out': videoOutputDefinition
    },
    graph: '[in] fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse [out]; ',
    timeBase: videoOutputDefinition.timeBase
});
var totalFrames = frameRate * secondsPerSlide * slides.length;
var idx = 0;
var write = function () {
    var frame;
    do {
        var image = genFrame(slides, idx);
        frame = ffmpeg_1.default.VideoFrame.create(image, formatImage, width, height);
        frame.setTimeBase(timeBase);
        frame.setPts(new ffmpeg_1.default.Timestamp(idx++, timeBase));
    } while (xform.write(frame) && idx < totalFrames);
    if (idx < totalFrames)
        xform.once('drain', write);
    else
        xform.end();
};
var output = new stream_1.Muxer({ outputFile: outputFileName, streams: [videoOutput] });
xform.pipe(filter.src['in']);
filter.sink['out'].pipe(videoOutput).pipe(output.video[0]);
write();
