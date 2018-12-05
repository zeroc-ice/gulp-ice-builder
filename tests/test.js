/* global describe, it */

'use strict';

const assert = require("assert");
const sassert = require("stream-assert");
const stream = require("stream-array");
const fs = require("fs");
const path = require("path");
const File = require("vinyl");

const builder = require("../index");

const root = path.resolve(__dirname);

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
    });
