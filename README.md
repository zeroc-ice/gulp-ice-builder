# gulp-zeroc-ice-builder
Gulp plugin to compile Slice files to JavaScript.

## Install
```bash
$ npm install gulp-zeroc-ice-builder --save-dev
```

## Usage
```js
var iceBuilder = require('gulp-zeroc-ice-builder');

gulp.task('compile', function() {
    gulp.src('slice/*.ice')
        .pipe(iceBuilder.compile())
        .pipe(gulp.dest(dest));
});
```

## Options

### exe `String` 

The path to the slice2js executable. By default the npm package [zeroc-slice2js](https://github.com/ZeroC-Inc/zeroc-slice2js) will be used.

```js
slice2js({exe: "/opt/Ice-3.6/slice2js"})
```

### args `Array`

The list of arguments passed to slice2js.

```js
slice2js({args: ["-I/opt/Ice-3.6/slice"]})
```

For a full list of arguments you can pass to the slice2js compiler refer to the [zeroc-slice2js package](https://github.com/ZeroC-Inc/zeroc-slice2js).

### dest `String`

The destination directory for your compiled .js files, the same one you use for ``gulp.dest()``. If specified, the dependencies are computed and files will only be recompiled and passed down the gulp stream if changes have been made.

```js
slice2js({dest: "js/generated"})
```

