// **********************************************************************
//
// Copyright (c) 2014-2018 ZeroC, Inc. All rights reserved.
//
// **********************************************************************

const rollup = require("rollup");
const through = require("through2");
const path = require("path");
const Vinyl = require('vinyl');

function jsbundle(options)
{
    const inputs = [];
    let modules;

    const format = options.jsbundleFormat || "es";
    const sourcemap = options.jsbundleSourcemap === undefined ? true : options.jsbundleSourcemap;
    //
    // Allow to resolve JavaScript files in the gulp stream
    //
    function resolve(inputs)
    {
        return {
            name: "ice-bundle",
            resolveId: function(id)
            {
                let target = path.resolve(id);
                if(!path.basename(target).endsWith(".js"))
                {
                    target += ".js";
                }

                if(inputs.find(f => path.resolve(f.path) === target))
                {
                    return target;
                }
                return null;
            },
            load: function(id)
            {
                let target = path.resolve(id);
                if(!path.basename(target).endsWith(".js"))
                {
                    target += ".js";
                }

                const file = inputs.find(f => path.resolve(f.path) === target);
                if(file)
                {
                    return file.contents.toString();
                }
            }
        };
    }

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
        async function(cb)
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
                const names = modules.map(m => m.module).filter((v, i, a) => a.indexOf(v) == i);
                for(const key of names)
                {
                    const files = modules.filter(m => m.module == key && m.file.endsWith(".js")).map(m => m.file);
                    let data = "";
                    for(const f of files)
                    {
                        data += `\nexport * from "${f}";`;
                    }

                    const input = key == "" ? "generated.js" : `${key}.js`;

                    let file = new Vinyl({cwd: "./", path: input});
                    file.contents = Buffer.from(data);
                    inputs.push(file);

                    const bundle = await rollup.rollup(
                        {
                            input: input,
                            external: ["ice"],
                            plugins: [resolve(inputs)],
                            onwarn: warn => {
                                if(warn.code == 'NAMESPACE_CONFLICT')
                                {
                                    return;
                                }
                                console.error(warn.message);
                            }
                        });

                    const {code, map} = await bundle.generate(
                        {
                            format: format,
                            sourcemap: sourcemap,
                            globals: {
                                ice: "ice"
                            }
                        });

                    const output = input;
                    file = new Vinyl({cwd: "./", path: output});
                    file.contents = Buffer.from(code);
                    this.push(file);

                    if(sourcemap)
                    {
                        file = new Vinyl({cwd: "./", path: `${output}.map`});
                        file.contents = Buffer.from(JSON.stringify(map, null, 4));
                        this.push(file);
                    }
                }
                cb();
            }
        });
}

module.exports = jsbundle;
