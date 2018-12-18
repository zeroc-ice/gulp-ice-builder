// **********************************************************************
//
// Copyright (c) 2014-present ZeroC, Inc. All rights reserved.
//
// **********************************************************************

const PluginError = require('plugin-error');
const Vinyl = require("vinyl");
const log = require("fancy-log");
const os = require("os");
const path = require("path");
const semver = require("semver");
const {spawn, spawnSync} = require("child_process");
const through = require("through2");

const {PLUGIN_NAME, isfile, isdir} = require("./util");

function compile(self, slice2js, files, args, cb)
{
    const info = [];
    const p = slice2js(args.concat(files.map(f => f.path)));

    const chunks = [];
    p.stdout.on("data", data =>
        {
            chunks.push(data);
        });

    p.stderr.on("data", data =>
        {
            log.error("'slice2js error'", data.toString());
        });

    p.on('close', code =>
        {
            if(code === 0)
            {
                let generated = null;
                const re = /\/\*\* slice2js: (.*) generated begin (.*) \*\*\//;
                const reend = /\/\*\* slice2js: generated end \*\*\//;
                const lines = Buffer.concat(chunks).toString("utf-8").split(/\r\n|\r|\n/);
                let data = "";
                for(const line of lines)
                {
                    let m = re.exec(line);
                    if(m)
                    {
                        generated = new Vinyl({cwd: "./", path: m[1]});
                        m = (/module:"(.*)"/).exec(line);
                        if(m)
                        {
                            info.push(
                                {
                                    module: m[1],
                                    file: generated.path
                                });
                        }
                        data = [];
                    }
                    else if(reend.exec(line))
                    {
                        generated.contents = Buffer.from(data);
                        self.push(generated);
                    }
                    else
                    {
                        data += line + os.EOL;
                    }
                }

                if(info.length > 0)
                {
                    self.push(new Vinyl(
                        {
                            cwd: "./",
                            path: "module.json",
                            contents: Buffer.from(JSON.stringify(info))
                        }));
                }

                if(generated === null)
                {
                    const basename = path.basename(files[0].path, ".ice");
                    const outputPath = args.some(v => ["--depend", "--depend-xml", "--depend-json"].includes(v)) ?
                          `${basename}.d` : `${basename}.js`;

                    self.push(new Vinyl(
                        {
                            cwd: "./",
                            path: `${outputPath}`,
                            contents: Buffer.from(data)
                        }));
                }
                cb();
            }
            else
            {
                cb(new PluginError(PLUGIN_NAME, `slice2js exit with error code: ${code}`));
            }
        });
}

function version(slice2js)
{
    return spawnSync(slice2js, ["-v"], {stdio: 'pipe'}).output[2].toString().trim();
}

function builder(options)
{
    const opts = options || {};
    let slice2js;
    let exe = (os.platform == "win32" ? "slice2js.exe" : "slice2js");
    const iceHome = opts.iceHome;
    let iceToolsPath = opts.iceToolsPath;
    const include = opts.include || [];
    let args = opts.args || [];
    args = args.concat(include.map(d => `-I${d}`));
    args.push("--stdout");

    if(iceHome)
    {
        if(!iceToolsPath)
        {
            if(isdir(path.resolve(iceHome, "cpp", "bin")))
            {
                iceToolsPath = path.resolve(iceHome, "cpp", "bin");
            }
            else
            {
                iceToolsPath = path.resolve(iceHome, "bin");
            }
        }

        if(!isfile(path.join(iceToolsPath, exe)))
        {
            throw new PluginError(PLUGIN_NAME, `Unable to locate slice2js compiler in ${iceToolsPath}"`);
        }

        const slicedir = [path.resolve(iceHome, "slice"),
                          path.resolve(iceHome, "share", `Ice-${version}`, "slice"),
                          path.resolve(iceHome, "share", "slice"),
                          path.resolve(iceHome, "share", "ice", "slice")].find(d => isdir(d));

        if(!slicedir)
        {
            throw new PluginError(PLUGIN_NAME, `Unable to locate Slice directory in "${iceHome}"`);
        }

        args.push(`-I${slicedir}`);

        slice2js = args => spawn(path.resolve(iceToolsPath, exe), args);
    }
    else // Using npm slice2js package
    {
        try
        {
            const SLICE2JS_PACKAGE_NAME = "slice2js";
            // First check if the slice2js package contains the slice2js executable path
            // If it doesn't then we guess the path based on its location inside the package
            if(require(SLICE2JS_PACKAGE_NAME).slice2js)
            {
                iceToolsPath = path.dirname(require(SLICE2JS_PACKAGE_NAME).slice2js);
            }
            else
            {
                iceToolsPath = path.join(path.dirname(require.resolve(SLICE2JS_PACKAGE_NAME)), 'build', 'Release');
            }
            slice2js = require(SLICE2JS_PACKAGE_NAME).compile;
        }
        catch(e)
        {
            throw new PluginError(PLUGIN_NAME, "Unable to load slice2js package");
        }
    }

    exe = path.resolve(iceToolsPath, exe);
    const v = version(exe);

    if(semver.valid(v) !== null && semver.gt(v, "3.7.1"))
    {
        const files = [];
        return through.obj(
            function(file, enc, cb)
            {
                if(file.isNull())
                {
                    cb();
                }
                else if(path.extname(file.path) != ".ice")
                {
                    //
                    // Let non Slice files pass-through
                    //
                    cb(null, file);
                }
                else if(file.isStream())
                {
                    cb(new PluginError(PLUGIN_NAME, "Streaming not supported"));
                }
                else
                {
                    files.push(file);
                    cb();
                }
            },
            function(cb)
            {
                if(files.length > 0)
                {
                    compile(this, slice2js, files, args, cb);
                }
                else
                {
                    cb();
                }
            });
    }
    else
    {
        return through.obj(
            function(file, enc, cb)
            {
                if(file.isNull())
                {
                    cb();
                }
                else if(file.isStream())
                {
                    cb(new PluginError(PLUGIN_NAME, "Streaming not supported"));
                }
                else
                {
                    compile(this, slice2js, [file], args, cb);
                }
            });
    }
}
module.exports = builder;
