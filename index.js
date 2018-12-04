// **********************************************************************
//
// Copyright (c) 2014-2018 ZeroC, Inc. All rights reserved.
//
// **********************************************************************

const combine = require('stream-combiner');

const builder = require("./builder");
const tsbundle = require("./tsbundle");
const jsbundle = require("./jsbundle");
const jsfilter = require("./jsfilter");

module.exports = function(options)
{
    const transforms = [builder(options)];
    //
    // When typescript is enabled tsbundle and jsbundle transformations are enabled
    // by default. These transforamtions can be disabled by setting tsbundle:false
    // and jsbundle:false respectively.
    //
    const typescript = options.args && options.args.includes("--typescript");
    if(typescript && options.tsbundle !== false)
    {
        transforms.push(tsbundle(options));
    }

    if((typescript && options.jsbundle !== false) || (options.jsbundle === true))
    {
        transforms.push(jsbundle(options));
    }

    transforms.push(jsfilter());

    return combine(transforms);
};

module.exports.builder = builder;
module.exports.jsbundle = jsbundle;
module.exports.tsbundle = tsbundle;
