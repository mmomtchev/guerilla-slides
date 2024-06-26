<img src="https://upload.wikimedia.org/wikipedia/commons/8/80/Che_Guevara_-_Guerrillero_Heroico_by_Alberto_Korda.jpg" alt="Che Guevara" style="height:100px;"/>

## SWIG JavaScript Evolution and the `hadron` build system

### The guerilla-slides-2024.js

<img src="https://upload.wikimedia.org/wikipedia/en/e/e0/Che_Guevara_Guerrilla_Warfare.jpg" alt="Guerilla Warfare" style="height:250px;"/>

[comment]: # (!!!)

JavaScript has become the new universal language
 * because of the research money and effort that went into highly efficient interpreters
 * because it allows to share backend and frontend code

[comment]: # (!!!)

 * because it is a not opinionated and very easy to learn and use
 * because it has a huge and totally free ecosystem where everyone is welcome
 * and partly by accident

[comment]: # (!!!)

JavaScript is notoriously difficult to interoperate with another language

So, for the last two decades, people have been trying to rewrite all existing software in JavaScript - there was no way around it

## But is this actually feasible?

[comment]: # (!!!)

At different times during the last few years, I did need to use three universal libraries with very wide language support that do not exist *(did not exist)* for JavaScript:

* `ImageMagick`
* `ffmpeg`
* `GDAL`

Rewriting these in JavaScript is a monumental task.

Try searching for these on `npmjs`. You will find tons of packages - most of them call the CLI tools - and are usually in a very sorry state.

[comment]: # (!!!)

Automatically generating wrappers for high-level interpreted languages by compiling the C/C++ header files is a solved problem: it is called 

# SWIG

[comment]: # (!!!)

## The Holy Grail of JavaScript/C++ interoperability

```shell
git clone https://github.com/ImageMagick/ImageMagick
abracadabra ImageMagick
```

=>

```js
import { Magick } from '@abracadabra/ImageMagick';
```

Works both in Node.js and in the browser

[comment]: # (!!!)

This is what `pymport` does for Python in Node.js!

```
npm install pymport
npx pympip3 install numpy
```

then

```js
const { pymport, proxify } = require('pymport');
const np = proxify(pymport('numpy'));

const a = np.arange(15).reshape(3, 5);
const b = np.ones([2, 3], { dtype: np.int16 });
```

[comment]: # (!!!)

### ...For C++ we are not there yet
*but at least we are going in the right direction*

* ImageMagick requires about 600 lines of hand-written SWIG code - for 400K lines of C++ code - an excellent ratio
* The code is compiled to native code for Node.js and WASM for the browser

[comment]: # (!!!)

* The bindings support both synchronous and asynchronous mode - both in Node.js and in the browser *(async in the browser requires COOP/COEP)*
* The TypeScript types are autogenerated
* The C++ STL is replaced by methods that have a native feel

[comment]: # (!!!)

## The `hadron` build system

*time to ditch `node-gyp`*

* The `npm` package can rebuild itself, pulling all the required dependencies from `conan`, with optional support for a built-in open source compiler (the software must be fully compatible with being built with `clang` on all platforms) - that does not need **anything** besides Node.js from the user host

[comment]: # (!!!)

I am unemployed software engineer living on social welfare and working full-time on open source.

Some of the largest IT companies in the world, including many of those present here, have chosen to back a criminal extortion involving the French police and corrupt judges that has spilled over in many major open-source projects in the JavaScript ecosystem.

[comment]: # (!!!)

<img src="https://upload.wikimedia.org/wikipedia/commons/c/c4/RUEDA_DE_PRENSA_CONJUNTA_ENTRE_CANCILLER_RICARDO_PATI%C3%91O_Y_JULIAN_ASSANGE_%28cropped%29.jpg" alt="Julian Assange" style="height:200px;"/>

A few days ago, Julian Assange struck a deal with the US government to serve 5 more years.

The fact that, after almost 10 years in various forms of solitary confinement, he has to serve 5 more years in jail, is our fault.

Everyone's fault.

[comment]: # (!!!)

Assange, whose false rape charges happened at about the same time as mine, chose to serve 5 more years and to continue his fight for justice and freedom.

My decision is the same and I want to share with you my recipe for a good meal costing 1€.

<iframe id="ytplayer" type="text/html" width="640" height="360"
  src="https://www.youtube.com/embed/XF-RHOqGz-Y"
  frameborder="0">
</iframe>

[comment]: # (!!!)

# For great justice!

<img src="https://i.kym-cdn.com/photos/images/newsfeed/001/553/629/3c9.jpg" alt="All your base are belong to us" style="height:500px;"/>
