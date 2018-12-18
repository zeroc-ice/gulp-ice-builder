// **********************************************************************
//
// Copyright (c) 2014-present ZeroC, Inc. All rights reserved.
//
// **********************************************************************

const through = require("through2");

function jsfilter()
{
    return through.obj(
        function(file, enc, cb)
        {
            if(file.path == "module.json")
            {
                cb();
            }
            else
            {
                cb(null, file);
            }
        });
}

module.exports = jsfilter;
