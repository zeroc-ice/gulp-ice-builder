// **********************************************************************
//
// Copyright (c) 2014-2018 ZeroC, Inc. All rights reserved.
//
// **********************************************************************

var fs       = require("fs");
var gutil    = require("gulp-util");
var path     = require("path");
var platform = require('os').platform();
var spawn    = require("child_process").spawn;
var through  = require("through2");

var PluginError = gutil.PluginError;
var PLUGIN_NAME = "gulp-ice-builder";
var SLICE2JS_PACKAGE_NAME = "slice2js";

function rmfile(path)
{
    try
    {
        fs.unlinkSync(path);
    }
    catch(e)
    {
    }
}

function mkdir(p)
{
    var parent = path.dirname(p);
    if(!isdir(parent))
    {
        mkdir(parent);
    }

    try
    {
        fs.mkdirSync(p);
    }
    catch(e)
    {
        if(e.code != "EEXIST" || isfile(p))
        {
            throw e;
        }
    }
}

function isdir(p)
{
    try
    {
        return fs.statSync(p).isDirectory();
    }
    catch(e)
    {
        if(e.code == "ENOENT")
        {
            return false;
        }
        throw e;
    }
}

function isfile(path)
{
    try
    {
        return fs.statSync(path).isFile();
    }
    catch(e)
    {
        if(e.code == "ENOENT")
        {
            return false;
        }
        throw e;
    }
}

var defaultCompileArgs = ["--stdout"];
var defaultDependArgs = ["--depend-json"];

function isnewer(input, output)
{
    return fs.statSync(input).mtime.getTime() > fs.statSync(output).mtime.getTime();
}

function isBuildRequired(inputFile, outputFile, dependFile, slice2js, args)
{
    if(![inputFile, outputFile, dependFile].every(isfile) || isnewer(inputFile, outputFile))
    {
        return true;
    }

    function isnewerthan(f)
    {
        return isnewer(f, outputFile);
    }

    var depend = JSON.parse(fs.readFileSync(dependFile, {encoding: "utf8"}));

    // Verify that each property is in the depend object. Otherwise we've encountered an old depend file
    if(!['args', 'slice2js', 'dependencies' ].every(function(property) { return property in depend; }))
    {
        return true;
    }

    // Check for same number of arguments, old and current slice compiler paths are the same, and that the current
    // slice compiler is not newer than the output file
    if(depend.args.length !== args.length || depend.slice2js !== slice2js || isnewerthan(slice2js))
    {
        return true;
    }

    // Check each argument in args is in the depend arg list
    if(!args.every(function(arg) { return depend.args.indexOf(arg) > -1; }))
    {
        return true;
    }

    // Check dependencies
    var dependencies = depend.dependencies;
    for(var key in dependencies)
    {
        if(path.normalize(key) == path.normalize(inputFile))
        {
            return !dependencies[key].every(isfile) || dependencies[key].some(isnewerthan);
        }
    }
    return false;
}

function compile(slice2js, file, args, cb)
{
    //
    // Let non Slice files pass-through
    //
    if(path.extname(file.path) != ".ice")
    {
        cb(null, file);
        return;
    }

    var p  = slice2js(args.concat(defaultCompileArgs).concat([file.path]));

    var buffer = new Buffer(0);
    p.stdout.on("data", function(data)
        {
            buffer = Buffer.concat([buffer, data]);
        });

    p.stderr.on("data", function(data)
        {
            gutil.log("'slice2js error'", data.toString());
        });

    p.on('close', function(code)
        {
            if(code === 0)
            {
                file.path = gutil.replaceExtension(file.path, ".js");
                file.contents = buffer;
                cb(null, file);
            }
            else
            {
                cb(new PluginError(PLUGIN_NAME, 'slice2js exit with error code: ' + code));
            }
        });
}

module.exports.compile = function(options)
{
    var slice2js, slice2jsPath;
    var opts = options || {};
    var args = opts.args || [];

    if(!opts.exe)
    {
        try
        {
            // First check if the slice2js package contains the slice2js executable path
            // If it doesn't then we guess the path based on its location inside the package
            slice2jsPath = require(SLICE2JS_PACKAGE_NAME).slice2js;
            if(slice2jsPath === undefined)
            {
                slice2jsPath = path.join(path.dirname(require.resolve(SLICE2JS_PACKAGE_NAME)),
                                         'build',
                                         'Release',
                                         (platform === 'win32' ? 'slice2js.exe' : 'slice2js'));
            }
            slice2js = require(SLICE2JS_PACKAGE_NAME).compile;
        }
        catch(e)
        {
        }
    }

    if(!slice2js)
    {
        slice2jsPath = path.resolve(opts.exe || "slice2js");
        slice2js = function(args)
        {
            return spawn(slice2jsPath, args);
        };
    }

    return through.obj(function(file, enc, cb)
        {
            if(file.isNull())
            {
                cb();
            }
            else if(file.isStream())
            {
                cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
            }
            else if(opts.dest)
            {
                var outputFile = path.join(file.cwd, opts.dest, path.basename(file.path, ".ice") + ".js");
                var dependFile = path.join(path.dirname(outputFile), ".depend", path.basename(outputFile, ".js") + ".d");

                if(isBuildRequired(file.path, outputFile, dependFile, slice2jsPath, args))
                {
                    [outputFile, dependFile].forEach(rmfile);
                    var build  = slice2js(args.concat(defaultDependArgs).concat([file.path]));
                    mkdir(path.dirname(dependFile));
                    var buffer = new Buffer(0);
                    build.stdout.on("data", function(data)
                        {
                            buffer = Buffer.concat([buffer, data]);
                        });

                    build.stderr.on("data", function(data)
                        {
                            gutil.log("'slice2js error'", data.toString());
                        });

                    build.on('close', function(code)
                        {
                            if(code === 0)
                            {
                                // Write the depends to the dependFile.
                                // This includes the slice compiler path, the arguments,
                                // and the slice dependencies
                                var obj =
                                {
                                    slice2js: slice2jsPath,
                                    args: args,
                                    dependencies: JSON.parse(buffer)
                                };
                                fs.writeFileSync(dependFile, JSON.stringify(obj, null, 4), {encoding: 'utf-8'});
                                compile(slice2js, file, args, cb);
                            }
                            else
                            {
                                cb(new PluginError(PLUGIN_NAME, 'slice2js exit with error code: ' + code));
                            }
                        });
                }
                else
                {
                    cb();
                }
            }
            else
            {
                compile(slice2js, file, args, cb);
            }
        });
};

module.exports.sliceDir = (function() {
    try
    {
        return require(SLICE2JS_PACKAGE_NAME).sliceDir;
    }
    catch(e)
    {
        return null;
    }
})();
