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

### jsbundle `Boolean`

The creation of JSBundle is enabled by default when `--typescript` argument is used, it can be disabled
by setting `jsbundle` property to `false`. The creation of JavaScript bundles use [Rollup](1) module bundler
and it requires that your Slice definitions use the [es6 JavaScript module mapping](2).

### jsbundleFormat `String`

The output format use by Rollup generated bundled, it correspond to Rollup `--format` option. The accepted
values are `amd`, `cjs`, `es`, `iife` and  `umd`. The default value is `es`.

### jsbundleSourcemap `Boolean`

Enable or disable the generation of sourcemap files for the generated JavaScript bundle. The default is to
generate a source map for each generated bundled, it can be disabled by setting this option to `false`.

[1]: https://rollupjs.org/guide/en
[2]: https://doc.zeroc.com/ice/3.7/language-mappings/javascript-mapping/client-side-slice-to-javascript-mapping/javascript-mapping-for-modules#id-.JavaScriptMappingforModulesv3.7-AlternateMappingforModules
