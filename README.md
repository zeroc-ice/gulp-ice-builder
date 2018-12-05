[![Build status](https://ci.appveyor.com/api/projects/status/fh4mgtodjogvrigp/branch/3.x?svg=true)](https://ci.appveyor.com/project/zeroc/npm-slice2js/branch/3.x)

# Ice Builder for Gulp
[Gulp][1] plug-in to automate the compilation of Slice files to JavaScript.

## Install
```bash
npm install gulp-ice-builder --save-dev
```

`gulp-ice-builder` calls the `slice2js` compiler. You can install the latest [slice2js][2] with:

```bash
npm install slice2js --save-dev
```

## Usage
```js
const iceBuilder = require('gulp-ice-builder');

gulp.task("slice2js", () => {
    return gulp.src('slice/*.ice')
        .pipe(iceBuilder())
        .pipe(gulp.dest("."));
});
```

## Options

### iceHome `String`

The root directory of your Ice installation used for locating the Slice-to-JS compiler and Slice files of your
Ice installation, you don't need to set it when using the [slice2js][2] npm package.

```js
iceBuilder({
    iceHome: "/opt/Ice-3.7.1"})
```

If not set, the builder will try to use the [slice2js][2] npm package.

### iceToolsPath `String`

The directory of the `slice2js` executable. This setting is ignored when using the [slice2js][2] npm package (`iceHome` not set).

```js
iceBuilder({
    iceHome: "c:\ice",
    iceToolsPath: "c:\ice\cpp\bin\x64\Release"});
```

When not set `<iceHome>/bin` and `<iceHome>/cpp/bin` are searched for the `slice2js` exectuable.

### include `Array`

List of directories to add to Slice compiler include file search path.

```js
iceBuilder({
    include: ["."]});
```

Each directory in `include` is passed to `slice2js` as `-I<dir>`. The Ice slice file
directory is automatically included from either the [slice2js][2] npm package or `iceHome` (when set).

### args `Array`

The list of extra arguments passed to the `slice2js` compiler.

```js
iceBuilder({
    args: ["-DDEBUG"]});
```

For a full list of arguments you can pass to the `slice2js` compiler refer to [slice2js][2].

### jsbundle `Boolean`

Create a JavaScript bundle for each `js:module`, the bundle contains the JavaScript generated
code for all the Slice compilation units that belong to a given `js:module`, an extra bundled
named `generated.js` is generated containing all the JavaScript generated code for Slice compilation
units that doesn't belong to any `js:module`.

The `jsbundle` option is enabled by default when `args` contains `--typescript` value. It can
be manually enabled and disabled by setting this property to `true` or `false` respectively.

The bundle creation uses [Rollup][3] module bundler and it requires that your Slice definitions
use the [es6 JavaScript module mapping][4] introduced with Ice 3.7.

```js
iceBuilder({
    args: ["--typescript"],
    jsbundle: false});
```

### jsbundleFormat `String`

The output format use by Rollup generated bundled, it correspond to Rollup `--format` option. The accepted
values are `amd`, `cjs`, `es`, `iife` and  `umd`. The default value is `es`.

```js
iceBuilder({
    args: ["--typescript"],
    jsbundleFormat: "cjs"});
```

### jsbundleSourcemap `Boolean`

Enable or disable the generation of source map files for the generated JavaScript bundle. The default is to
generate a source map for each generated bundled, it can be disabled by setting this option to `false`.

```js
iceBuilder({
    args: ["--typescript"],
    jsbundleSourcemap: false});
```

### tsbundle `Boolean`

Create a bundle containing the TypeScript declarations for each `js:module`. An extra
bundle named `generated.d.ts` is generated containing the TypeScript generated declarations
for Slice compilation units that do not belong to any `js:module`.

```js
iceBuilder({
    args: ["--typescript"],
    tsbundle: false});
```

The `tsbundle` option is enabled by default when `args` contains `--typescript` value. It can
be manually enabled and disabled by setting this property to `true` or `false` respectively.

[1]: https://github.com/gulpjs/gulp
[2]: https://github.com/zeroc-ice/npm-slice2js
[3]: https://rollupjs.org/guide/en
[4]: https://doc.zeroc.com/ice/3.7/language-mappings/javascript-mapping/client-side-slice-to-javascript-mapping/javascript-mapping-for-modules#id-.JavaScriptMappingforModulesv3.7-AlternateMappingforModules
