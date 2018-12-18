// **********************************************************************
//
// Copyright (c) 2014-present ZeroC, Inc. All rights reserved.
//
// **********************************************************************

const PluginError = require('plugin-error');
const fs = require("fs");
const ts = require("typescript");
const path = require("path");
const os = require("os");
const through = require("through2");
const Vinyl = require('vinyl');
const formatter = require('typescript-formatter');

const {PLUGIN_NAME, copyright} = require("./util");

function tsbundle(args)
{
    const inputs = [];
    let modules;

    return through.obj(
        function(file, enc, cb)
        {
            if(file.path == "module.json")
            {
                modules = JSON.parse(file.contents.toString().replace(/\\/g, "\\\\"));
            }

            if(!file.path.endsWith(".d.ts"))
            {
                //
                // Let non TypeScript files pass-through
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
            if(inputs.length == 0)
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
                const names = modules === undefined ? [""] :
                    modules.map(m => m.module).filter((v, i, a) => a.indexOf(v) == i);

                for(const key of names)
                {
                    //
                    // List of imports included in all files that are part of the bundle
                    //
                    const imports = [];

                    const namespaces = [""];
                    const definitions = new Map();
                    definitions.set("", "");
                    let namespace = "";

                    function visitFile(file, data)
                    {
                        visitNode(ts.createSourceFile(file, data, ts.ScriptTarget.ES7, true));
                    }

                    function exportDefinition(node)
                    {
                        let out = definitions.get(namespace);
                        const data = node.getText().trim();
                        if(data != "")
                        {
                            out += os.EOL;
                            if(node.jsDoc)
                            {
                                out += "/**" + os.EOL;
                                for(const l of node.jsDoc[0].comment.split(os.EOL))
                                {
                                    out += " * " + l + os.EOL;
                                }
                                out += " */" + os.EOL;
                            }
                            if(data.indexOf("export ") == -1)
                            {
                                out += "export ";
                            }
                            out += data;
                            out += os.EOL;
                            definitions.set(namespace, out);
                        }
                    }

                    function visitNode(node, parent)
                    {
                        switch(node.kind)
                        {
                            case ts.SyntaxKind.SourceFile:
                            {

                                for(const s of node.referencedFiles)
                                {
                                    const f = path.normalize(path.join(path.dirname(node.fileName), s.fileName));
                                    visitFile(f, fs.readFileSync(f).toString());
                                }
                                if(node.referencedFiles == 0)
                                {
                                    ts.forEachChild(node, child =>
                                                    {
                                                        visitNode(child, node);
                                                    });
                                }
                                break;
                            }
                            case ts.SyntaxKind.ModuleDeclaration:
                            {
                                if(node.modifiers && node.modifiers.some(n => n.kind == ts.SyntaxKind.DeclareKeyword))
                                {
                                    if(node.name.text == "ice")
                                    {
                                        ts.forEachChild(node.body, child =>
                                                        {
                                                            visitNode(child, node);
                                                        });
                                    }
                                }
                                else if((parent.modifiers && parent.modifiers.some(
                                    n => n.kind == ts.SyntaxKind.DeclareKeyword)))
                                {
                                    namespace = node.name.text;
                                    if(namespaces.indexOf(namespace) == -1)
                                    {
                                        namespaces.push(namespace);
                                        definitions.set(namespace, "");
                                    }
                                    ts.forEachChild(node.body, child =>
                                        {
                                            visitNode(child, node);
                                        });
                                    namespace = "";
                                }
                                else
                                {
                                    exportDefinition(node);
                                }
                                break;
                            }
                            case ts.SyntaxKind.ClassDeclaration:
                            {
                                exportDefinition(node);
                                break;
                            }
                            case ts.SyntaxKind.ImportDeclaration:
                            {
                                const s = node.getText().trim();
                                if(!imports.find(e => e.getText().trim() == s))
                                {
                                    imports.push(node);
                                }
                                break;
                            }
                            case ts.SyntaxKind.ImportClause:
                            {
                                break;
                            }
                            default:
                            {
                                exportDefinition(node);
                                break;
                            }
                        }
                    }

                    let input = "";
                    if(modules)
                    {
                        const files = modules.filter(m => m.module == key && m.file.endsWith(".d.ts")).map(m => m.file);
                        inputs.filter(i => files.find(f => path.resolve(f) == path.resolve(i.path))).forEach(
                            i =>
                            {
                                input += i.contents.toString();
                            });
                    }
                    else
                    {
                        inputs.forEach(
                            i =>
                            {
                                input += i.contents.toString();
                            });
                    }
                    visitFile("", input);

                    let data = "";

                    for(const name of namespaces)
                    {
                        if(name == "")
                        {
                            data += definitions.get(name);
                        }
                        else
                        {
                            data += `\nexport namespace ${name}`;
                            data += "\n{";
                            data += `\n${definitions.get(name)}`;
                            data += "\n}";
                        }
                    }

                    let output = copyright;
                    output += "\n";
                    //
                    // Write the bundled imports filtering out imports that correspond
                    // to files in this bundle.
                    //
                    imports.filter(e => !inputs.find(f => path.resolve(`${e.moduleSpecifier.text}.d.ts`) ==
                                                          path.resolve(f.path))).forEach(
                        e =>
                        {
                            output += `\n${e.getText().trim()}`;
                        });

                    //
                    // Remove the import prefixes from identfiers, for prefixes that
                    // correspond to files included in the bundle.
                    //
                    imports.filter(
                        e => inputs.find(f => path.resolve(`${e.moduleSpecifier.text}.d.ts`) ==
                                              path.resolve(f.path))).forEach(
                        e =>
                        {
                            const name = e.importClause.namedBindings.name.escapedText;
                            data = data.replace(new RegExp(`([(-,-:]*)(${name}\\.)`, "g"), "$1");
                        });
                    output += `\n${data}`;

                    const p = formatter.processString("", output, {}).then(
                        result =>
                            {
                                this.push(new Vinyl(
                                    {
                                        cwd: "./",
                                        path: key === "" ? "generated.d.ts" : `${key}.d.ts`,
                                        contents: Buffer.from(result.dest)
                                    }));
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
                            cb(new PluginError(PLUGIN_NAME, `error generating TypeScript bundle: ${err}`));
                        });
            }
        });
}

module.exports = tsbundle;
