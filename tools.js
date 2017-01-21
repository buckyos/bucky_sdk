"use strict";

var http  = require('http');
var https = require('https');
var fs    = require('fs');
var path  = require('path');
var url   = require('url');
var PATH_SEPARATOR = path.normalize("/");

/*************************************
 * run
 *************************************/
var tool_version = "1.0.0.0";
var mode = 0;
var rmodules = __dirname+PATH_SEPARATOR+"bucky_modules";
var developerId = null;
var token = null;
var needPublish = true;
var errorNum = 0;
var warNum = 0;
var maindir = null;
var appConfig = null;
var appInfo = null;
var appKClient = null;
var appKnowledges = null;

for(var i=3;i<process.argv.length;i++){
    if(process.argv[i].indexOf("-packages")==0) {
        maindir = process.argv[i+1];
    } else if(process.argv[i].indexOf("-app")==0) {
        appConfig = process.argv[i+1];
    } else if (process.argv[i]=="-knowledges") {
        appKnowledges = process.argv[i+1];
    } else if(process.argv[i].indexOf("-fake")==0) {
        mode = 1;
    } else if(process.argv[i].indexOf("-modules")==0){
        rmodules = process.argv[i+1];
    } else if(process.argv[i].indexOf("-uid")==0){
        developerId = process.argv[i+1];
    } else if(process.argv[i].indexOf("-token")==0){
        token = process.argv[i+1];
    }
}

var core = null
if(mode==0){
    core = require("./node_core.js");
}else{
    core = require("./local_core.js");
}
var rclient = core.Repository;
var KServerXHRClient = core.KServerXHRClient;
var ErrorCode = core.ErrorCode;
var InfoNode = core.InfoNode;
var BaseLib = core.BaseLib;
var KnowledgeManager = core.KnowledgeManager;

console.log("+----------------------------------------------------+")
console.log("|                                                    |")
console.log("| BuckyCloud tool,version " + tool_version + "\t\t     |");
console.log("|                                                    |")
console.log("+----------------------------------------------------+")

function printUsage() {
    console.log("usage:\t node tools.js [-pub] -uid developerid -token developertoken -packages package_dir -app app.json [-knowledges knowledges.json]");
    console.log("\t node tools.js [-stop] -app app.json");
    console.log("\t node tools.js [-start] -app app.json");
}

//TODO: 要用kmclient重做
function updateKnowledge(onComplete) {
    console.log(">Start Update Knowledge");
    if(!needPublish) {
        console.log("no knowledge need pub.");
        onComplete(true);
        return;
    }

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

    for (let kid in knowledges) {
        let kInfo = knowledges[kid];
        console.log("will udpate : " + kid + " " + kInfo);
        if(kInfo.type == 0) {
            count = count + 1
            appKClient._createObjectKnowledge(kid,kInfo.object,function(ret) {
                count = count - 1; 
                if (ret == 0) {
                    console.log(">Update knowledge: " + kid + " ok.");
                } else {
                    errorCount = errorCount + 1;
                    errorNum = errorNum + 1;
                    console.log(">Update knowledge: " + kid + " failed.");
                }
                checkComplete();
            });
           
        } else if(kInfo.type == 1) {
            let thisMap = kInfo.map;
            let thisCount = 0;
            let mapLen = 0;
            count = count + 1
            appKClient._mapClean(kid,function(result) {
                appKClient._createMapKnowledge(kid,function(ret) {
                    count = count -1;
                    let rawKClient = new KServerXHRClient({
                        "url":appInfo.knowledgeHost,
                        "appid" : appInfo.appid,
                        "token" : developerId + "|" + token,
                        "timeout" : 1000 * 5
                    });

                    let request2 = rawKClient.NewRequest();
                    let needR2 = false;
                    for(let mk in thisMap) {
                        thisCount = thisCount + 1;
                        count = count + 1;
                        needR2 = true;
                        console.log(">Update knowledge: " + kid + " : " + mk);
                        request2.SetHashValue(kid,mk,JSON.stringify(thisMap[mk]),"-1",function(ret,key) {
                            thisCount = thisCount - 1;
                            count = count - 1;
                            if(ret != ErrorCode.RESULT_OK) {
                                errorCount = errorCount + 1;
                                errorNum = errorNum + 1;
                                console.log(">Update knowledge: " + kid + " failed.");
                            } else {
                                if(thisCount == 0) {
                                    console.log(">Update knowledge: " + kid + " OK.");
                                }
                            }
                            checkComplete();
                        });
                    }

                    if(needR2) {
                        appKClient.Request(request2);
                    } else {
                        console.log(">Update knowledge: " + kid + " ok.");
                        checkComplete(); 
                    }
                });
            }); 
        }
    }
}

function doPub() {
    if(maindir == null) {
        console.log("ERROR:maindir is null")
        printUsage();
        process.exit(1);
    }

    if(developerId==null) {
        console.log("ERROR:uid is null.")
        printUsage();
        process.exit(1);
    }

    if(token==null) {
        console.log("ERROR:token is null.")
        printUsage();
        process.exit(1);
    }

    console.log("->Start pub packages...");
    var appFolder = maindir;
    var traceId = "0";
    //var token = "todo";
    
    rclient.init(rmodules)
    let puber = rclient.getPuber(developerId,traceId,token);

    puber.pub(appFolder,appConfig,function(ret, resp, theAppInfo){
    	if (ret) {
            var packageCount = theAppInfo.body.packages.length;
            var packageNames = "";
            for(var i in theAppInfo.body.packages){
                var pkg = theAppInfo.body.packages[i];
                packageNames = packageNames + " ["+ pkg.relativepath + "]";
            }
            console.log("->"+packageCount.toString()+" packages published :"+packageNames);
            //update knowledges
            if (appKnowledges && mode != 1) {
                console.log(JSON.stringify(appInfo));
                appKClient = new KnowledgeManager(appInfo.knowledgeHost,appInfo.appid,developerId + "|" + token,5*1000);
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
    console.log(">>Stopping app:" + appInfo.appid);
    let request = appKClient.NewRequest();
    request.SetValue("global.app",{"state":"off"},-1,function(ret,key,ver) {
        if(ret == ErrorCode.RESULT_OK) {
            console.log(">>App:" + appInfo.appid + " stoped");
        } else {
            console.log(">>Stop app:" + appInfo.appid + " failed, err: "+ ret);
        }
    })
    appKClient.Request(request);
}

function doStart() {
    console.log(">>Start app:" + appInfo.appid);
    let request = appKClient.NewRequest();
    request.SetValue("global.app",{"state":"on"},-1,function(ret,key,ver) {
        if(ret == ErrorCode.RESULT_OK) {
            console.log(">>App:" + appInfo.appid + " started");
        } else {
            console.log(">>Start app:" + appInfo.appid + " failed, err: "+ ret);
        }
    })
    appKClient.Request(request);
}

function checkRunning(onComplete) {
    console.log(">>Checking app state. ID:" + appInfo.appid);
    let postURL = appInfo.appHost + appInfo.appid + checkRunningCmd;
    console.log(postURL);
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
            console.log(">>Check app:" + appInfo.appid + " state failed!");
            onComplete("unknown");
        }
    });
}

var op = process.argv[2];

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

    doPub();
    /*if (mode == 1) {
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
    }*/
} else if (op == "-stop") {
    doStop();
} else if (op == "-start") {
    doStart();
} else {
    printUsage();
}