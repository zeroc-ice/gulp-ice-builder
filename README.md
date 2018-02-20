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

The root directory of your Ice installation used for locating the Slice files of your Ice installation, you don't need
to set it when using the [slice2js](https://github.com/zeroc-ice/npm-slice2js) npm package.

```js
iceBuilder.compile({iceHome: "/opt/Ice-3.7.1"})
```

If not set, the builder will try to use the [slice2js](https://github.com/zeroc-ice/npm-slice2js) npm package.

### iceToolsPath `String`

The directory of `slice2js` executable, you don't need
to set it when using the [slice2js](https://github.com/zeroc-ice/npm-slice2js) npm package.

```js
iceBuilder.compile({iceToolsPath: "/opt/Ice-3.7.1/bin"})
```

If not set, the builder will try to use the [slice2js](https://github.com/zeroc-ice/npm-slice2js) npm package.

### outputDir `String`

The destination directory for your generated `.js` files.

```js
iceBuilder.compile({outputDir: "js/generated"})
```
When this option is set, dependencies will be computed and saved in a `.depend` sub-directory. This avoids unnecessary
recompilation of your `Slice` files. This directory must be the same as the directory used for `gulp.dest()`.

### includeDirectories `Array`

List of directories to add to Slice compiler include file search path.

```js
iceBuilder.compile({includeDirectories: ["."]})
```

Ice Builder invokes `slice2js` with `-I` for all the directories specified by `includeDirectories`, followed by
`-I$(IceHome)/slice`. As a result, you never need to include `$(IceHome)/slice` in this list.

### additionalOptions `Array`

The list of extra arguments passed to the `slice2js` compiler.

```js
iceBuilder.compile({additionalOptions: ["-DDEBUG"]})
```

For a full list of arguments you can pass to the `slice2js` compiler refer to [slice2js](https://github.com/zeroc-ice/npm-slice2js).
