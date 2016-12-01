/**
 * Created by waterflier on 2/10/16.
 */
"use strict";

var fs = require("fs");
var path = require("path");

//--------------------------------------------------------------------------------
var mainjs = null;
var mainjsData = "";

var appConfigPath = "app.json";
var appInfo = null;

var deviceConfigPath = "device.json";
var deviceInfo = null;
var enableLocalDebug = false;
var localKnowledge = null;

for(var i=0;i<process.argv.length;i++)
{
    if(process.argv[i] == "-main") {
        mainjs = process.argv[i+1];
    }

    if(process.argv[i] == "-app") {
        appConfigPath = process.argv[i+1];
    }

    if(process.argv[i] == "-local_debug") {
        enableLocalDebug = true;
        localKnowledge = process.argv[i+1];
        if(localKnowledge == null) {
            console.log("usage: node node_loader.js -main main.js [-app app.json] [-local_debug localKnowledge]")
            process.exit(1);
        }
    }   
}

if(enableLocalDebug) {

    var core = require("./local_core.js");
    var BaseLib = core.BaseLib;
    var ErrorCode =core.ErrorCode;
    var BX_LOG = core.BX_LOG;
    var BX_CHECK = core.BX_CHECK;
    var Application = core.Application;
    var getCurrentRuntime = core.getCurrentRuntime;
    var getCurrentApp = core.getCurrentApp;
    var XARPackage = core.XARPackage;
    var RuntimeInstance = core.RuntimeInstance;
    var Device = core.Device;
    var OwnerUser = core.OwnerUser;
    var GlobalEventManager = core.GlobalEventManager;
    var initCurrentRuntime = core.initCurrentRuntime;
} else {
    var core = require("./node_core.js");
    var BaseLib = core.BaseLib;
    var ErrorCode =core.ErrorCode;
    var BX_LOG = core.BX_LOG;
    var BX_CHECK = core.BX_CHECK;
    var Application = core.Application;
    var getCurrentRuntime = core.getCurrentRuntime;
    var getCurrentApp = core.getCurrentApp;
    var XARPackage = core.XARPackage;
    var RuntimeInstance = core.RuntimeInstance;
    var Device = core.Device;
    var OwnerUser = core.OwnerUser;
    var GlobalEventManager = core.GlobalEventManager;
}

if(mainjs == null) {
    console.log("usage: node node_loader.js -main main.js [-app app.json] [-local_debug localKnowledge]")
    process.exit(1);
} else {
    if(mainjs[0] != '/' && mainjs[1] != ':') {
        mainjs = __dirname + "/" + mainjs;
    }
    let fileContent = fs.readFileSync(mainjs);
    mainjsData = "(function() {\n" + fileContent +"\n})();";
}

console.log("Read app config from " + appConfigPath);
try {
    if(appConfigPath[0] != '/' && appConfigPath[1] != ':') {
        appConfigPath = __dirname + "/" + appConfigPath;
    }
    appInfo = JSON.parse(fs.readFileSync(appConfigPath));
} catch (err) {
    console.log(">>ERROR: Cann't read app info! : " + err);
    process.exit(1);
}


let app = new Application();
Application._currentApp = app;
app.init(appInfo,function(errorCode,metaInfo) {
    if (enableLocalDebug) {
        core.initCurrentRuntime("./",localKnowledge);
    } else {
        core.initCurrentRuntime();
    }
    console.log("start " + mainjs + " ...");
    eval(mainjsData);
});



