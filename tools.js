"use strict";

var core  = require("./node_core.js")
var http  = require('http');
var https = require('https');
var fs    = require('fs');
var path  = require('path');
var url   = require('url');
var PATH_SEPARATOR = path.normalize("/");

var rclient = core.Repository;

var tool_version = "1.0.0.0";
var BX_REPOSITORY_REMOTE = core.BX_REPOSITORY_REMOTE;
var BX_REPOSITORY_LOCAL  = core.BX_REPOSITORY_LOCAL;
var BX_REPOSITORY_FAKE   = core.BX_REPOSITORY_FAKE;
var BaseLib = core.BaseLib;

console.log("+----------------------------------------------------+")
console.log("|                                                    |")
console.log("| BuckyCloud tool,version " + tool_version + "\t\t     |");
console.log("|                                                    |")
console.log("+----------------------------------------------------+")

var needPublish = true;
var errorNum = 0;
var warNum = 0;
var maindir = null;
var appConfig = null;
var appInfo = null;
var appKnowledges = null;

var rmode = BX_REPOSITORY_REMOTE;
var rmodules = __dirname+PATH_SEPARATOR+"bucky_modules";


function printUsage() {
    console.log("usage:\t node tools.js [-pub] -packages package_dir -app app.json [-knowledges knowledges.json]");
    console.log("\t node tools.js [-stop] -app app.json");
    console.log("\t node tools.js [-start] -app app.json");
}

function updateKnowledge(onComplete) {
    console.log(">Start Update Knowledge");
    if(!needPublish) {
        console.log("no knowledge need pub.");
        onComplete(true);
        return;
    }

    try {
        console.log("will read knowledge from " + appKnowledges);
        let knowledges = JSON.parse(fs.readFileSync(appKnowledges));
        let count = 0;
        let errorCount = 0;
        function checkComplete() {
            if(count == 0) {
                if(errorCount > 0) {
                    onComplete(false);
                } else {
                    onComplete(true);
                }

            }
        }
        for(let kid in knowledges) {
            count = count + 1;
        }
        if(count > 0) {
            for (let kid in knowledges) {
                let kInfo = knowledges[kid];
                let postURL = appInfo.appHost + "/" + appInfo.appID + "/knowledges/" + kid + "/";
                BaseLib.postData(postURL, JSON.stringify(kInfo), function (postResult, code) {
                    count = count - 1;
                    if(postResult) {
                        console.log(">Update knowledge: " + kid + " => " + postURL + " OK.");
                        checkComplete();
                    } else {
                        errorCount = errorCount + 1;
                        console.log(">Update knowledge: " + kid + " => " + postURL + " failed.");
                        errorNum = errorNum + 1;
                        checkComplete();
                    }
                });
            }
        }
    }catch (err) {
        console.log("update knowledge with error:" + err);
        onComplete(false);
    }
}

function doPub() {
    if(maindir == null) {
        printUsage();
        process.exit(1);
    }

    console.log("->Start pub packages...");
    var appFolder = maindir;
    var traceid = "0";
    var token = "todo";
    if(rmode!=BX_REPOSITORY_REMOTE){
        rclient.setMode(rmode)
    }
    rclient.pub(rmodules,appFolder,appConfig,traceid, token, function(ret, resp, appInfo){
    	if (ret) {
            var packageCount = appInfo.body.packages.length;
            var packageNames = "";
            for(var i in appInfo.body.packages){
                var pkg = appInfo.body.packages[i];
                packageNames = packageNames + " ["+ pkg.relativepath + "]";
            }
            console.log("->"+packageCount.toString()+" packages published :"+packageNames);
            //update knowledges
            if (appKnowledges && rmode != BX_REPOSITORY_FAKE) {
                updateKnowledge(function(ret) {
                    if (ret) {
                        console.log(">Update knowledges success");
                    } else {
                        console.log(">Update knowledges failed");
                    }
                    process.exit(0);
                })
            }
            else {
                console.log(">No knowledges need update");
                process.exit(0);
            }
        } else {
            console.log(">>Publish failed!");
        }
    });
}
var stopCmd = "/stopApp/";
var startCmd = "/startApp/";
var checkRunningCmd = "/isRunning/";

function doStop() {
    console.log(">>Stopping app:" + appInfo.appID);
    let postURL = appInfo.appHost + "/" + appInfo.appID + stopCmd;
    BaseLib.postData(postURL,"stop",function (resp, code) {
        if (resp) {
            if(resp == 'ok') {
                console.log(">>App:" + appInfo.appID + " stopped");
            } else {
                console.log(">>Stop app:" + appInfo.appID + " failed, error:"+resp);
            }
        } else {
            console.log(">>Stop app:" + appInfo.appID + " failed, error: unknown");
        }
    });
}

function doStart() {
    console.log(">>Start app:" + appInfo.appID);
    let postURL = appInfo.appHost + "/" + appInfo.appID + startCmd;
    BaseLib.postData(postURL, "start", function (resp, code) {
        if (resp) {
            if(resp == 'ok') {
                console.log(">>App:" + appInfo.appID + " started");
            } else {
                console.log(">>Start app:" + appInfo.appID + " failed, err: "+ resp);
            }
        } else {
            console.log(">>Start app:" + appInfo.appID + " failed, error: unknown");
        }
    });
}

function checkRunning(onComplete) {
    console.log(">>Checking app state. ID:" + appInfo.appID);
    let postURL = appInfo.appHost + "/" + appInfo.appID + checkRunningCmd;
    BaseLib.postData(postURL, "check", function (resp, code) {
        if (resp) {
            onComplete(resp);
            /*if(resp == 'ok') {
                console.log(">>App:" + appInfo.appID + " is running");
                onComplete(true);
            } else {
                console.log(">>App:" + appInfo.appID + " is not running");
                onComplete(false);
            }*/
        } else {
            console.log(">>Check app:" + appInfo.appID + " state failed!");
            onComplete("unknown");
        }
    });
}

var op = process.argv[2];

for(var i=3;i<process.argv.length;i++){
    if(process.argv[i].indexOf("-packages")==0) {
        maindir = process.argv[i+1];
        /*if(appConfig == null) {
            appConfig = maindir + "/app.json";
            appKnowledges = maindir + "/knowledges.json";
        }*/
    } else if(process.argv[i].indexOf("-app")==0) {
        appConfig = process.argv[i+1];
    } else if (process.argv[i]=="-knowledges") {
        appKnowledges = process.argv[i+1];
    } else if(process.argv[i].indexOf("-fake")==0) {
        rmode = BX_REPOSITORY_FAKE;
    } else if(process.argv[i].indexOf("-modules")==0){
        rmodules = process.argv[i+1];
    }
}

if(maindir && maindir[0] != '/' && maindir[1] != ':') {
    maindir = __dirname + "/" + maindir;
}

if(appConfig && appConfig[0] != '/' && appConfig[1] != ':') {
    appConfig = __dirname + "/" + appConfig;
}

if(appKnowledges && appKnowledges[0] != '/' && appKnowledges[1] != ':') {
    appKnowledges = __dirname + "/" + appKnowledges;
}

try {
    appInfo = JSON.parse(fs.readFileSync(appConfig));
} catch (err) {
    console.log(">>ERROR: Cann't read app info!");
    printUsage();
    process.exit(1);
}

if (op == "-pub") {
    if (rmode == BX_REPOSITORY_FAKE) {
        doPub();
    } else {
        checkRunning(function(resp){
            if (resp != "app is not running!") {
                console.log(">>ERROR: "+resp);
                process.exit(1);
            } else {
                doPub();
            }
        });
    }
} else if (op == "-stop") {
    doStop();
} else if (op == "-start") {
    doStart();
} else {
    printUsage();
}