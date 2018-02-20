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
        .pipe(iceBuilder.compile({outputDir:genDir}))
        .pipe(gulp.dest(genDir));
});
```

## Options

### iceHome `String`

The root directory of your Ice installation used for locating the Slice-to-JS compiler and Slice files of your
Ice installation, you don't need to set it when using the [slice2js](https://github.com/zeroc-ice/npm-slice2js) npm package.

```js
iceBuilder.compile({iceHome: "/opt/Ice-3.7.1"})
```

If not set, the builder will try to use the [slice2js](https://github.com/zeroc-ice/npm-slice2js) npm package.

### iceToolsPath `String`

The directory of the `slice2js` executable. This setting is ignored when using the [slice2js](https://github.com/zeroc-ice/npm-slice2js) npm package (`iceHome` not set).

```js
iceBuilder.compile({iceHome: "c:\ice", iceToolsPath: "c:\ice\cpp\bin\x64\Release"})
```

When not set `<iceHome>/bin` and `<iceHome>/cpp/bin` are searched for the `slice2js` exectuable.

### dest `String`

The destination directory for your generated `.js` files.

```js
iceBuilder.compile({dest: "js/generated"})
```

When this option is set, dependencies will be computed and saved in a `.depend` sub-directory. This avoids unnecessary
recompilation of your `Slice` files. This directory must be the same as the directory used for `gulp.dest()`.

### include `Array`

List of directories to add to Slice compiler include file search path.

```js
iceBuilder.compile({include: ["."]})
```

Each directory in `include` is passed to `slice2js` as `-I<dir>`. The Ice slice file
directory is automatically included from either the [slice2js](https://github.com/zeroc-ice/npm-slice2js) npm package or `iceHome` (when set).

### args `Array`

The list of extra arguments passed to the `slice2js` compiler.

```js
iceBuilder.compile({args: ["-DDEBUG"]})
```

For a full list of arguments you can pass to the `slice2js` compiler refer to [slice2js](https://github.com/zeroc-ice/npm-slice2js).
