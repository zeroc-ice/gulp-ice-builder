// **********************************************************************
//
// Copyright (c) 2014-2018 ZeroC, Inc. All rights reserved.
//
// **********************************************************************

const fs = require("fs");
const path = require("path");

const PLUGIN_NAME = "gulp-ice-builder";

function mkdir(p)
{
    const parent = path.dirname(p);
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

const copyright = `// **********************************************************************
//
// Copyright (c) 2003-2018 ZeroC, Inc. All rights reserved.
//
// This copy of Ice is licensed to you under the terms described in the
// ICE_LICENSE file included in this distribution.
//
// **********************************************************************`;

module.exports.PLUGIN_NAME = PLUGIN_NAME;
module.exports.mkdir = mkdir;
module.exports.isdir = isdir;
module.exports.isfile = isfile;
module.exports.copyright = copyright;
