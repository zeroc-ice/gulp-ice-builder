# Ice Builder for Gulp
[Gulp](https://github.com/gulpjs/gulp) plug-in to automate the compilation of Slice files to JavaScript.

## Install
```bash
npm install gulp-ice-builder
```

`gulp-ice-builder` calls the `slice2js` compiler. You can install the latest [slice2js](https://github.com/zeroc-ice/npm-slice2js) with:

```bash
npm install slice2js
```

## Usage
```js
var iceBuilder = require('gulp-ice-builder');

// Output directory
var genDir = 'generated';

gulp.task('compile', function() {
    gulp.src('slice/*.ice')
        .pipe(iceBuilder.compile({dest:genDir}))
        .pipe(gulp.dest(genDir));
});
```

## Options

### args `Array`

The list of arguments passed to the `slice2js` compiler.

```js
iceBuilder.compile({args: ["-Isrc/slice", "-DDEBUG"]})
```

For a full list of arguments you can pass to the `slice2js` compiler refer to [slice2js](https://github.com/zeroc-ice/npm-slice2js).

### dest `String`

The destination directory for your generated `.js` files.

```js
iceBuilder.compile({dest: "js/generated"})
```
When this option is set, dependencies will be computed and saved in a `.depend` sub-directory. This avoids unnecessary
recompilation of your `Slice` files. This directory must be the same as the directory used for `gulp.dest()`.

### exe `String`

The path to the `slice2js` executable.

```js
iceBuilder.compile({exe: "/opt/zeroc-ice/bin/slice2js"})
```

If not set, the builder will search first for the npm package [slice2js](https://github.com/zeroc-ice/npm-slice2js), and then for `slice2js` in your `PATH`.
