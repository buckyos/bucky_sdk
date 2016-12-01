"use strict";

var fs = require('fs');
var path = require('path')

function copyFile(src, dst) {
    try {
        fs.writeFileSync(dst, fs.readFileSync(src));
    } catch(err) {
        console.log("copy file error:"+src);
    }
}

function dirExistsSync(filePath){
    try{
        return fs.statSync(filePath).isDirectory();
    }catch (err){
        return false;
    }
}

function mkdirsSync(dirpath, mode) {
    dirpath = path.normalize(dirpath);
    try {
        if (!dirExistsSync(dirpath)) {
            var pathtmp = "";
            dirpath.split(path.sep).forEach(function (dirname) {
                if(dirname.length == 0 )  {
                    pathtmp = path.sep;
                }

                if (pathtmp.length > 0) {
                    pathtmp = path.join(pathtmp, dirname);
                }
                else {
                    pathtmp = dirname;
                }
                
                if (!dirExistsSync(pathtmp)) {
                    console.log("makdir: " + pathtmp);
                    if (!fs.mkdirSync(pathtmp, mode)) {
                        return false;
                    }
                }

            });
        }
    } catch (err) {
        return false;
    }
}

function copyFiles(src, dst) {
    fs.readdir( src, function( err, paths ){
        if( err ){
            throw err;
        }
        paths.forEach(function(path){
            var _src = src + '/' + path;
            var _dst = dst + '/' + path;
            copyFile(_src, _dst);
        });
    });
}

var curDir = __dirname;

let wx_header = "\"use strict\";\r\n \
var _core = require(\"../../wx_core.js\");\r\n \
var BaseLib = _core.BaseLib;\r\n \
var ErrorCode =_core.ErrorCode;\r\n \
var BX_LOG = _core.BX_LOG;\r\n \
var BX_CHECK = _core.BX_CHECK;\r\n \
var Application = _core.Application;\r\n \
var getCurrentRuntime = _core.getCurrentRuntime;\r\n \
var getCurrentApp = _core.getCurrentApp;\r\n \
var XARPackage = _core.XARPackage;\r\n \
var RuntimeInstance = _core.RuntimeInstance;\r\n \
var RuntimeInfo = _core.RuntimeInfo;\r\n \
var Device = _core.Device;\r\n \
var DeviceInfo = _core.DeviceInfo;\r\n \
var OwnerUser = _core.OwnerUser;\r\n \
var GlobalEventManager = _core.GlobalEventManager;\r\n \
var KnowledgeManager = _core.KnowledgeManager;\r\n \
\r\n \
"

mkdirsSync(curDir+"/wx/bucky/packages/client");
mkdirsSync(curDir+"/wx/bucky/packages/userinfo_proxy");

copyFile(curDir+"/account/packages/client/onload.js", curDir+"/wx/bucky/packages/client/onload.js");
copyFile(curDir+"/account/packages/userinfo_proxy/onload.js", curDir+"/wx/bucky/packages/userinfo_proxy/onload.js");

let scriptContent = fs.readFileSync(curDir+"/account/packages/client/client.js", "utf8");
let newScriptContent = scriptContent.replace("\"use strict\";", wx_header);
fs.writeFileSync(curDir+"/wx/bucky/packages/client/client.js", newScriptContent);

scriptContent = fs.readFileSync(curDir+"/account/packages/userinfo_proxy/userinfo.js", "utf8");
newScriptContent = scriptContent.replace("\"use strict\";", wx_header);
fs.writeFileSync(curDir+"/wx/bucky/packages/userinfo_proxy/userinfo.js", newScriptContent);

//copyFiles(curDir+"/account/packages/client/", curDir+"/wx/bucky/packages/client/");
//copyFiles(curDir+"/account/packages/userinfo_proxy/", curDir+"/wx/bucky/packages/userinfo_proxy/");
copyFile(curDir+"/../wx_core.js", curDir+"/wx/bucky/wx_core.js");

var content = "appConfig:";
content += fs.readFileSync(curDir+"/account/app.json");

content += ",\r\npackages:{\r\n\"path\":\"packages\",\r\n\"client\":";
content += fs.readFileSync(curDir+"/account/packages/client/config.json");
content += ",\r\n\"userinfo_proxy\":";
content += fs.readFileSync(curDir+"/account/packages/userinfo_proxy/config.json");
content += "\r\n}";

fs.writeFileSync(curDir+"/wx_config.json", content);