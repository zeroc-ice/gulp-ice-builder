// **********************************************************************
//
// Copyright (c) 2014-present ZeroC, Inc. All rights reserved.
//
// **********************************************************************

const PluginError = require('plugin-error');
const rollup = require("rollup");
const through = require("through2");
const path = require("path");
const Vinyl = require('vinyl');

const {PLUGIN_NAME, copyright} = require("./util");

function jsbundle(options)
{
    const inputs = [];
    let modules;

    const format = options.jsbundleFormat || "es";
    const sourcemap = options.jsbundleSourcemap === undefined ? true : options.jsbundleSourcemap;

    return through.obj(
        function(file, enc, cb)
        {
            if(file.path == "module.json")
            {
                modules = JSON.parse(file.contents.toString().replace(/\\/g, "\\\\"));
            }

            if(!file.path.endsWith(".js"))
            {
                //
                // Let non JavaScript files pass-through
                //
                cb(null, file);
            }
            else
            {
                inputs.push(file);
                cb();
            }
        },
        function(cb)
        {
            if(inputs.length == 0 || modules === undefined)
            {
                cb();
            }
            else
            {
                //
                // Create a bundle for each js:module and a default bundle for files doesn't
                // belong to any module
                //
                const all = [];
                const names = modules.map(m => m.module).filter((v, i, a) => a.indexOf(v) == i);
                for(const key of names)
                {
                    const files = modules.filter(m => m.module == key && m.file.endsWith(".js")).map(m => m.file);
                    let data = "";
                    for(const f of files)
                    {
                        data += `\nexport * from "./${f}";`;
                    }

                    const minputs = inputs.filter(f1 => files.find(f2 => path.resolve(f1.path) == path.resolve(f2)));

                    const input = key == "" ? "generated.js" : `${key}.js`;
                    let file = new Vinyl({cwd: "./", path: input});
                    file.contents = Buffer.from(data);
                    minputs.push(file);

                    const globals = {};

                    //
                    // Allow to resolve JavaScript files in the gulp stream
                    //
                    function resolve()
                    {
                        return {
                            name: "ice-bundle",
                            resolveId: function(id, importer)
                            {
                                //
                                // IDs not resolved in the bundle imputs are considered
                                // externals returning false from resolveId make rollup
                                // treat them as externals
                                //
                                let target = path.resolve(id);
                                if(!path.basename(target).endsWith(".js"))
                                {
                                    target += ".js";
                                }

                                if(minputs.find(f => path.resolve(f.path) === target))
                                {
                                    return target;
                                }

                                //
                                // Add external module imports to the bundle globals.
                                //
                                if(!id.startsWith(".") && !id.endsWith(".js"))
                                {
                                    globals[id] = id;
                                }
                                return false;
                            },
                            load: function(id)
                            {
                                let target = path.resolve(id);
                                if(!path.basename(target).endsWith(".js"))
                                {
                                    target += ".js";
                                }

                                const file = minputs.find(f => path.resolve(f.path) === target);
                                if(file)
                                {
                                    return file.contents.toString();
                                }
                            }
                        };
                    }

                    let p = rollup.rollup(
                        {
                            input: input,
                            plugins: [resolve(minputs)],
                            onwarn: warn => {
                                if(warn.code == 'NAMESPACE_CONFLICT')
                                {
                                    return;
                                }
                                console.error(warn.message);
                            }
                        });

                    p = p.then(bundle => bundle.generate(
                        {
                            format: format,
                            sourcemap: sourcemap,
                            globals: globals,
                            name: path.basename(input, ".js")
                        }));

                    p = p.then(bundle =>
                               {
                                   const {code, map} = bundle.output[0];
                                   file = new Vinyl({cwd: "./", path: input});
                                   file.contents = Buffer.from(`${copyright}\n${code}`);
                                   this.push(file);

                                   if(sourcemap)
                                   {
                                       file = new Vinyl({cwd: "./", path: `${input}.map`});
                                       file.contents = Buffer.from(JSON.stringify(map, null, 4));
                                       this.push(file);
                                   }
                               });
                    all.push(p);
                }

                Promise.all(all).then(
                    () =>
                        {
                            cb();
                        },
                    err =>
                        {
                            cb(new PluginError(PLUGIN_NAME, `error generating JavaScript bundle: ${err}`));
                        });
            }
        });
}

module.exports = jsbundle;
