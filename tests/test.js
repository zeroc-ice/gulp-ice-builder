/* global describe, it */

'use strict';

const assert = require("assert");
const sassert = require("stream-assert");
const stream = require("stream-array");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const slice2js = require("slice2js").slice2js;
const spawn = require("child_process").spawnSync;
const File = require("vinyl");

const builder = require("../index");

const root = path.resolve(__dirname);

const version = spawn(slice2js, ["-v"], {stdio: 'pipe'}).output[2].toString().trim();

function test(...args)
{
    function create(filepath)
    {
        return new File(
            {
                cwd: ".",
                path: filepath,
                contents: fs.readFileSync(filepath)
            });
    }

    return stream(args.map(create));
}

describe("gulp-ice-builder",
    () =>
    {

        it("Calling builder without arguments", done =>
        {
            builder();
            done();
        });

        it("Should throw if using invalid iceHome setting", done =>
        {
            try
            {
                builder({iceHome: "/dev/null"});
                assert(false);
            }
            catch(e)
            {
                done();
            }
        });

        it("Default build options", done =>
        {
            test(path.join(root, "test-01.ice")).pipe(builder()).pipe(
                sassert.first(newfile => assert(newfile.path == "test-01.js"))).pipe(
                    sassert.end(done));
        });

        it("Build include option", done =>
        {
            test(path.join(root, "test-02.ice")).pipe(
                builder({include: [root]})).pipe(
                    sassert.first(newfile => assert(newfile.path == "test-02.js"))
                ).pipe(
                    sassert.end(done));
        });

        it("Build args option", done =>
        {
            test(path.join(root, "test-03.ice")).pipe(
                builder({args: ["-DTEST_MACRO"]})).pipe(
                    sassert.first(newfile => assert(newfile.path == "test-03.js"))
                ).pipe(
                    sassert.end(done));
        });

        it("Build multiple files", done =>
        {
            test(path.join(root, "test-01.ice"), path.join(root, "test-02.ice")).pipe(
                builder({include: [root]})).pipe(
                    sassert.first(newfile => assert(newfile.path == "test-01.js"))
                ).pipe(
                    sassert.second(newfile => assert(newfile.path == "test-02.js"))
                ).pipe(
                    sassert.length(2)
                ).pipe(
                    sassert.end(done));
        });

        if(semver.valid(version) !== null && semver.gt(version, "3.7.1"))
        {
            it("Build TypeScript and JavaScript bundles", done =>
            {
                test(path.join(root, "test-04.ice"), path.join(root, "test-05.ice")).pipe(
                    builder(
                        {
                            args: ["--typescript"],
                            include: [root]
                        })
                ).pipe(
                    sassert.length(3)
                ).pipe(
                    sassert.first(newfile => assert(newfile.path == "generated.d.ts"))
                ).pipe(
                    sassert.second(newfile => assert(newfile.path == "generated.js"))
                ).pipe(
                    sassert.last(newfile => assert(newfile.path == "generated.js.map"))
                ).pipe(
                    sassert.end(done));
            });

            it("Build TypeScript and JavaScript bundles disabling source maps", done =>
            {
                test(path.join(root, "test-04.ice"), path.join(root, "test-05.ice")).pipe(
                    builder(
                        {
                            args: ["--typescript"],
                            include: [root],
                            jsbundleSourcemap: false
                        })
                ).pipe(
                    sassert.length(2)
                ).pipe(
                    sassert.first(newfile => assert(newfile.path == "generated.d.ts"))
                ).pipe(
                    sassert.second(newfile => assert(newfile.path == "generated.js"))
                ).pipe(
                    sassert.end(done));
            });

            it("Build TypeScript bundle and disable JavaScript bundle", done =>
            {
                test(path.join(root, "test-04.ice"), path.join(root, "test-05.ice")).pipe(
                    builder(
                        {
                            args: ["--typescript"],
                            include: [root],
                            jsbundle: false
                        })
                ).pipe(
                    sassert.length(3)
                ).pipe(
                    sassert.first(newfile => assert(newfile.path == "test-04.js"))
                ).pipe(
                    sassert.second(newfile => assert(newfile.path == "test-05.js"))
                ).pipe(
                    sassert.last(newfile => assert(newfile.path == "generated.d.ts"))
                ).pipe(
                    sassert.end(done));
            });

            it("Build TypeScript and JavaScript bundles using js:module", done =>
            {
                test(path.join(root, "test-06.ice"), path.join(root, "test-07.ice")).pipe(
                    builder(
                        {
                            args: ["--typescript"],
                            include: [root]
                        })
                ).pipe(
                    sassert.length(3)
                ).pipe(
                    sassert.first(newfile => assert(newfile.path == "test.d.ts"))
                ).pipe(
                    sassert.second(newfile => assert(newfile.path == "test.js"))
                ).pipe(
                    sassert.last(newfile => assert(newfile.path == "test.js.map"))
                ).pipe(
                    sassert.end(done));
            });

            it("Build several TypeScript and JavaScript bundles at once", done =>
            {
                test(path.join(root, "test-04.ice"), path.join(root, "test-05.ice"),
                     path.join(root, "test-06.ice"), path.join(root, "test-07.ice")).pipe(
                         builder(
                             {
                                 args: ["--typescript"],
                                 include: [root]
                             })
                ).pipe(
                    sassert.length(6)
                ).pipe(
                    sassert.nth(0, newfile => assert(newfile.path == "generated.d.ts"))
                ).pipe(
                    sassert.nth(1, newfile => assert(newfile.path == "test.d.ts"))
                ).pipe(
                    sassert.nth(2, newfile => assert(newfile.path == "generated.js"))
                ).pipe(
                    sassert.nth(3, newfile => assert(newfile.path == "generated.js.map"))
                ).pipe(
                    sassert.nth(4, newfile => assert(newfile.path == "test.js"))
                ).pipe(
                    sassert.nth(5, newfile => assert(newfile.path == "test.js.map"))
                ).pipe(
                    sassert.end(done));
            });
        }
    });
