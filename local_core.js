"use strict";








var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


var url = require('url');
var fs = require('fs');
var path = require('path');





var AdmZip = require('adm-zip');
var child_process = require("child_process");
var crypto = require('crypto')


var g_configPath = "/dev/shm/bucky";
var PATH_SEPARATOR = path.normalize("/");




var EVAL_ENABLE = true


var BX_LOG_LEVEL_ERROR = 50;
var BX_LOG_LEVEL_WARN = 40;
var BX_LOG_LEVEL_INFO = 30;
var BX_LOG_LEVEL_DEBUG = 20;

function BX_LOG(loginfo,level,traceid) {
    return BaseLib.log(loginfo,level,traceid);
}

function BX_INFO(loginfo,traceid) {
    return BX_LOG(loginfo, BX_LOG_LEVEL_INFO,traceid);
}

function BX_ERROR(loginfo,traceid) {
    return BX_LOG(loginfo, BX_LOG_LEVEL_ERROR,traceid);
}

function BX_DEBUG(loginfo,traceid) {
    return BX_LOG(loginfo, BX_LOG_LEVEL_DEBUG,traceid);
}

function BX_WARN(loginfo,traceid) {
    return BX_LOG(loginfo, BX_LOG_LEVEL_WARN,traceid);
}

function BX_CHECK(cond) {
    return;
}


class BaseLib {
    static log(loginfo,level,traceid) {
        console.log(loginfo);
    }

    static setTimer(func,timeout) {

        return setInterval(func,timeout);
    }

    static killTimer(timerID) {
        clearInterval(timerID);
    }

    static setOnceTimer(func,timeout) {
        setTimeout(func,timeout);
    }

    static asynCall(func) {
        setTimeout(func,0);
    }



    static parseFunctionName(functionName) {
        let listA = functionName.split("@");
        if (listA.length > 2) {
            return null;
        }

        let instanceID = null;
        if(listA.length == 2) {
            instanceID = listA[1];
        }
        let listB = listA[0].split("::");
        if (listB.length != 2) {
            return null;
        }

        let functionID = listB[1];
        let listC = listB[0].split(":");
        if (listC.length > 2) {
            return null;
        }
        let packageInfo = null;
        let moduleID = null;
        if (listC.length == 2) {
            packageInfo = listC[0];
            moduleID = listC[1];
        } else {
            moduleID = listC[0];
        }


        let result = {};
        result.packageInfo = packageInfo;
        result.moduleID =moduleID;
        result.functionID = functionID;
        result.instanceID = instanceID;

        return result;
    }
    static createGUID () {
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = "-";

        var uuid = s.join("");
        return uuid;
    }

    static hash(method, s, format) {
      var sum = crypto.createHash(method);
      var isBuffer = Buffer.isBuffer(s);
      if (!isBuffer && typeof s === 'object') {
        s = JSON.stringify(sortObject(s));
      }
      sum.update(s, isBuffer ? 'binary' : 'utf8');
      return sum.digest(format || 'hex');
    };

    static md5(s, format) {
      return BaseLib.hash('md5', s, format);
    };



    static loadFileFromURL(fileURL,onComplete) {




        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if(request.readyState == 4) {
                var responseText = request.responseText;
                if(request.status == 200) {

                    if(onComplete) {
                        onComplete(responseText,request.status);
                    }
                }
                else{
                    BX_LOG("load err: "+responseText);
                    if(onComplete) {
                        onComplete(null, request.status);
                    }
                }
            }
        };

        request.open("GET",fileURL);
        request.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        request.send();

    }


    static loadJSONFromURL(jsonURL,onComplete) {
        let onFileLoad = function(content,errorCode) {
            if(content) {
                let jsonResult = JSON.parse(content);
                onComplete(jsonResult,errorCode);
            } else {
                BX_LOG("loadJSONFrom:" + jsonURL + " error:" + errorCode);
                onComplete(null,errorCode);
            }
        };

        BaseLib.loadFileFromURL(jsonURL,onFileLoad);
    }



    static runScriptFromURL(scriptURL,onComplete) {
        let onFileLoad = function(content,errorCode) {
            if(content) {
                let scriptContent = "(function() {\n" + content +"\n})();";
                let funcResult = eval(scriptContent);
                onComplete(funcResult,ErrorCode.RESULT_OK);
            } else {
                onComplete(null,errorCode);
            }
        };

        BaseLib.loadFileFromURL(scriptURL,onFileLoad);
    }


    static encodeParamAsJson(args) {
        return args;
    }


    static decodeResultFromJSON(jsonBody) {
        return jsonBody;
    }

    static getRandomNum(min,max)
    {
        let range = max - min;
        let thisValue = Math.random();
        return (min + Math.round(thisValue * range));
    }


    static fsExistsSync(filePath){
        try{
            return fs.statSync(filePath);
        }catch (err){
            return false;
        }
    }

    static fileExistsSync(filePath){
        try{
            return fs.statSync(filePath).isFile();
        }catch (err){
            return false;
        }
    }

    static dirExistsSync(filePath){
        try{
            return fs.statSync(filePath).isDirectory();
        }catch (err){
            return false;
        }
    }
    static mkdirsSync(dirpath, mode) {
        dirpath = path.normalize(dirpath);
        try {
            if (!BaseLib.dirExistsSync(dirpath)) {
                var pathtmp = "";
                dirpath.split(path.sep).forEach(function (dirname) {
                    if(dirname.length == 0 ) {
                        pathtmp = path.sep;
                    }

                    if (pathtmp.length > 0) {
                        pathtmp = path.join(pathtmp, dirname);
                    }
                    else {
                        pathtmp = dirname;
                    }

                    if (!BaseLib.dirExistsSync(pathtmp)) {
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
        return true;
    }

    static deleteFolderRecursive(dir) {
      if( BaseLib.dirExistsSync(dir) ) {
        fs.readdirSync(dir).forEach(function(file,index){
          var curDir = dir + "/" + file;
          if(fs.lstatSync(curDir).isDirectory()) {
            deleteFolderRecursive(curDir);
          } else {
            fs.unlinkSync(curDir);
          }
        });
        fs.rmdirSync(dir);
      }
    };

    static findSync(root, pattern, recoursive) {
        if (typeof pattern === 'boolean') {
            recoursive = pattern;
            pattern = undefined;
        }
        var files = [];
        fs.readdirSync(root).forEach(function(file) {
            var fullFileName = path.join(root, file);

            if (BaseLib.dirExistsSync(fullFileName) && recoursive)
                files = files.concat(BaseLib.findSync(fullFileName, pattern, recoursive));

            if (!pattern || pattern.test(fullFileName)) {
                files.push(path.normalize(fullFileName) + (BaseLib.dirExistsSync(fullFileName) ? PATH_SEPARATOR : ""));
            }

        });
        return files;
    }

    static findOnceSync(root, pattern,type,recoursive) {
        if(BaseLib.dirExistsSync(root)){
            var files = fs.readdirSync(root);
            for(var i in files){
                var file = files[i];
                var fullFileName = path.join(root, file);

                let exist = BaseLib.fsExistsSync(fullFileName);
                if(exist){
                    if(exist.isFile()){
                        if(type=='file'){
                            if(pattern.test(fullFileName)){
                                return path.normalize(fullFileName);
                            }
                        }
                    }else if(exist.isDirectory()){
                        if(type=='dir'){
                            if(pattern.test(fullFileName)){
                                return path.normalize(fullFileName) + PATH_SEPARATOR ;
                            }
                        }
                        if(recoursive==true){
                            let sub = BaseLib.findOnceSync(fullFileName,pattern,type,recoursive);
                            if(sub!=null){
                                return sub;
                            }
                        }
                    }
                }
            };
        }
        return null;
    }


    static findOutFile(root,target,type,start_here){
        if(start_here){

        }else{
            root = path.dirname(root);
        }
        while(true){
            var name = BaseLib.findOnceSync(root,target,type);
            if(name!=null){
                BX_INFO(name);
                return name;
            }else{
                var old = root;
                root = path.dirname(root);
                if(old===root){
                    return null;
                }
            }
        }
    }

    static findFiles(root){
        return BaseLib.findSync(root,true)
    }

    static writeFileTo( fileName, content, overwrite, attr) {
        if (BaseLib.fileExistsSync(fileName)) {
            if (!overwrite){
                return false;
            }
        }

        var folder = path.dirname(fileName);
        if (!BaseLib.dirExistsSync(folder)) {
            BaseLib.mkdirsSync(folder);
        }

        try{
            var fd;
            try {
                fd = fs.openSync(fileName, 'w', 438);
            } catch(e) {
                fs.chmodSync(fileName, 438);
                fd = fs.openSync(fileName, 'w', 438);
            }
            if (fd) {
                fs.writeSync(fd, content, 0, content.length, 0);
                fs.closeSync(fd);
            }
            fs.chmodSync(fileName, attr || 438);
        }catch(e){
            return false;
        }

        return true;
    }

    static writeFileToAsync( filePath, content, overwrite, attr, callback) {
        if(typeof attr === 'function') {
            callback = attr;
            attr = undefined;
        }

        if(BaseLib.fileExistsSync(filePath)){
            if(!overwrite){
                callback(false);
                return;
            }
        }

        var folder = path.dirname(filePath);
        if (!BaseLib.dirExistsSync(folder)) {
            BaseLib.mkdirsSync(folder);
        }

        fs.open(filePath, 'w', 438, function(err, fd) {
            if(err) {
                fs.chmod(filePath, 438, function(err) {
                    if(err){
                        callback(false);
                        return;
                    }
                    fs.open(filePath, 'w', 438, function(err, fd) {
                        fs.write(fd, content, 0, content.length, 0, function(err, written, buffer) {
                            fs.close(fd, function(err) {
                                fs.chmod(filePath, attr || 438, function() {
                                    callback(true);
                                })
                            });
                        });
                    });
                })
            } else {
                if(fd) {
                    fs.write(fd, content, 0, content.length, 0, function(err, written, buffer) {
                        fs.close(fd, function(err) {
                            fs.chmod(filePath, attr || 438, function() {
                                callback(true);
                            })
                        });
                    });
                } else {
                    fs.chmod(filePath, attr || 438, function() {
                        callback(true);
                    })
                }
            }
        });
    }




    static isArrayContained(a, b){
        if(!(a instanceof Array) || !(b instanceof Array))
            return false;

        if(a.length < b.length)
            return false;

        let blen = b.length;
        for(let i=0;i<blen;i++){
            let alen = a.length;
            let isFind = false;
            for(let j=0;j<alen;++j) {
                if(b[i] == a[j]) {
                    isFind = true;
                    break;
                }
            }
            if(!isFind) {
                return false;
            }
        }
        return true;
    }
    static postJSON(postURL,postBody,onComplete) {
        let strPostBody = JSON.stringify(postBody);
        BaseLib.postData(postURL,strPostBody,function(strResp, status) {
            let jsonResp = null;
            if (strResp) {
                jsonResp = JSON.parse(strResp);
            }

            onComplete(jsonResp, status);
        });
    }


    static postData(postURL,postBody,onComplete) {



        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if(xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    let strResp= xmlhttp.responseText;
                    onComplete(strResp, 200);
                    return;
                } else {
                    onComplete(null, xmlhttp.status);
                }
            }
        };

        xmlhttp.open("POST",postURL,true);
        xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        xmlhttp.send(postBody);

    }


    static postJSONCall(postURL,postBody,onComplete) {

        BaseLib.postJSON(postURL,postBody,function (jsonResp,resultCode) {
            if(jsonResp) {
                let result = BaseLib.decodeResultFromJSON(jsonResp);

                if (result.seq == postBody.seq) {
                    onComplete(result.result);
                }
            } else {
                onComplete(null,resultCode);
            }
        })
    }
    static inet_aton(ip){

        var a = ip.split('.');
        var buffer = new ArrayBuffer(4);
        var dv = new DataView(buffer);
        for(var i = 0; i < 4; i++){
            dv.setUint8(i, a[i]);
        }
        return(dv.getUint32(0));
    }


    static inet_ntoa(num){
        var nbuffer = new ArrayBuffer(4);
        var ndv = new DataView(nbuffer);
        ndv.setUint32(0, num);

        var a = new Array();
        for(var i = 0; i < 4; i++){
            a[i] = ndv.getUint8(i);
        }
        return a.join('.');
    }

    static isBlank(str) {
        return (!str || /^\s*$/.test(str));
    }

}
class ErrorCode {
    static getErrorDesc(errorCode) {

    }
}

ErrorCode.RESULT_OK = 0;
ErrorCode.RESULT_TIMEOUT = 1;
ErrorCode.RESULT_WAIT_INIT = 2;
ErrorCode.RESULT_ERROR_STATE = 3;
ErrorCode.RESULT_NOT_FOUND = 4;
ErrorCode.RESULT_SCRIPT_ERROR = 5;
ErrorCode.RESULT_NO_IMP = 6;
ErrorCode.RESULT_ALREADY_EXIST = 7;
ErrorCode.RESULT_UNKNOWN = 8;
class Application {

    constructor() {
        this.state = Application.APP_STATE_UNKNOWN;
        this.meta = null;
        this.repositoryList = [];

    }

    init(metaInfo,onInitComplete) {
        BX_LOG("Application::init");

        if(this.state != Application.APP_STATE_UNKNOWN)
        {
            BX_LOG("cann't init Application from other state");
            return [ErrorCode.RESULT_ERROR_STATE,"error state"];
        }
        this.state = Application.APP_STATE_INITING;
        this.meta = metaInfo;
        this.appID = metaInfo.appID;
        this.appHost = metaInfo.appHost;
        this.repositoryList.push(metaInfo.repositoryHost);


        onInitComplete(ErrorCode.RESULT_OK,this.meta);
        return [ErrorCode.RESULT_OK,"OK"];
    }

    getID() {
        return this.appID;
    }

    getHost() {
        return this.appHost + "/" + this.appID + "/";
    }
}


Application.APP_STATE_UNKNOWN = 0;
Application.APP_STATE_INITING = 1;
Application.APP_STATE_ERROR = 2;
Application.APP_STATE_RUNNING = 3;
Application.APP_STATE_ONLINE = 4;
Application.APP_STATE_OFFLINE = 5;
Application.APP_STATE_BUSY = 6;

Application._currentApp = null;
Application._currentRuntime = null;



function setCurrentApp(theApp) {
    Application._currentApp = theApp;
}

function getCurrentApp() {
    return Application._currentApp;
}



class InfoNode {
    constructor(infoNodeManager,url) {
        this._owner = infoNodeManager;
        this._nodeURL = url;
        this._type = InfoNode.TYPE_OBJECT;
        this._state = InfoNode.STATE_INIT;
        this._version = 0;
        this._lastUpdate = 0;
        this._cacheObject = null;

        this._cacheList = null;
        this._cacheListStartPos = 0;
        this._cacheListLength = 0;

        this._cacheMap = null;

        this._onComplete = null;







    }


    loadFromKObject(kobj) {
        if(kobj.type == InfoNode.TYPE_OBJECT) {
            this._cacheObject = kobj.object;
        }
        if(kobj.type == InfoNode.TYPE_MAP) {
            this._cacheMap = kobj.map;
        }
    }


    sync(onComplete) {

        BaseLib.asynCall(onComplete);


        let url = this._nodeURL + "meta";
        let thisNode = this;
        BaseLib.loadJSONFromURL(url,function(meta) {
            if(meta) {
                thisNode._type = meta.type;
                thisNode._version = meta.version;
                thisNode._lastUpdate = new Date().getTime();
                if(thisNode._type == InfoNode.TYPE_OBJECT) {
                    thisNode._cacheObject = meta.object;
                    thisNode._state = InfoNode.STATE_NORMAL;
                    onComplete(thisNode,ErrorCode.RESULT_OK);
                } else if(thisNode._type == InfoNode.TYPE_LIST) {

                    BX_LOG("list not support");
                } else if(thisNode._type == InfoNode.TYPE_MAP) {
                    let mapurl = thisNode._nodeURL + "map";

                    BaseLib.loadJSONFromURL(mapurl,function(mapdata) {
                        if(mapdata) {
                            thisNode._cacheMap = mapdata;
                            thisNode._state = InfoNode.STATE_NORMAL;
                            onComplete(thisNode,InfoNode.RESULT_OK);
                        } else {
                            thisNode._state = InfoNode.STATE_ERROR;
                        }
                    });

                } else {
                    thisNode._type = InfoNode.TYPE_UNKNOWN;
                    thisNode._state = InfoNode.STATE_ERROR;
                    onComplete(thisNode,ErrorCode.RESULT_UNKNOWN);
                }

            } else {
                thisNode._type = InfoNode.TYPE_UNKNOWN;
                thisNode._state = InfoNode.STATE_ERROR;
                onComplete(thisNode,ErrorCode.RESULT_UNKNOWN);
            }
        })
    }

    getType() {
        return this._type;
    }

    getState() {
        return this._state;
    }



    objectRead() {
        if(this._state == InfoNode.STATE_NORMAL || this._state == InfoNode.STATE_LOCAL_CACHED) {
            if (this._type == InfoNode.TYPE_OBJECT) {
                return this._cacheObject;
            } else {
                BX_LOG("read info node with error type.");
            }
        }

        return null;
    }
    mapGet(key) {
        if(this._state == InfoNode.STATE_NORMAL || this._state == InfoNode.STATE_LOCAL_CACHED) {
            if(this._type == InfoNode.TYPE_MAP) {
                return this._cacheMap[key];
            }
        }
        BX_LOG("cann't get map");
        return null;
    }


    mapSet(key,object,onComplete) {
        if(this._state == InfoNode.STATE_NORMAL || this._state == InfoNode.STATE_LOCAL_CACHED) {
            if (this._type == InfoNode.TYPE_MAP) {
                let postURL = this._nodeURL + "map";

                let obj = {};
                obj.key = key;
                obj.object = object;
                obj.base = this._version;
                let thisNode = this;

                BaseLib.postJSON(postURL, obj, function(resp){
                    if (resp) {
                        thisNode._cacheMap[key] = object;
                        thisNode._version = resp.version;
                        if(onComplete) {
                            onComplete(null);
                        }
                    }
                });
            } else {
                BX_LOG("info node is not ready");
            }
        }
    }


    mapGetClone() {
        if(this._state == InfoNode.STATE_NORMAL || this._state == InfoNode.STATE_LOCAL_CACHED) {
            if(this._type == InfoNode.TYPE_MAP) {
                return this._cacheMap;
            }
        }
    }
}

InfoNode.TYPE_OBJECT = 0;
InfoNode.TYPE_LIST = 1;
InfoNode.TYPE_MAP = 2;
InfoNode.TYPE_UNKNOWN = 3;

InfoNode.STATE_INIT = 0;
InfoNode.STATE_LOCAL_CACHED = 1;
InfoNode.STATE_NORMAL = 2;
InfoNode.STATE_SYNC = 3;
InfoNode.STATE_ERROR = 4;
class KnowledgeManager {
    constructor(baseURL) {
        this._cacheNode = {};
        this._baseURL = baseURL;
        this._depends = {};
        this._state = KnowledgeManager.STATE_NEED_SYNC;

        let thisKM = this;
        setInterval(function() {
            thisKM.ready();
        },5000);
    }


    initFromLocalPath(localPath) {
        this._fs = require("fs");
        this._localPath = localPath;
        this._localRootTree = JSON.parse(fs.readFileSync(localPath,"utf8"));
        for(let k in this._localRootTree) {
            let kobj = this._localRootTree[k];
            let aNode = new InfoNode(this,"http://8.8.8.8/");
            aNode.loadFromKObject(kobj);
            this.addknowledgeKey(k,aNode);
        }
    }


    getState() {
        return this._state;
    }


    getInfoURL(key) {
        return this._baseURL + key + "/";
    }

    dependKnowledge(key,options) {
        this._depends[key] = {"key":key,"isNeedSync":true,"options":options};
        this._state = KnowledgeManager.STATE_NEED_SYNC;
    }

    ready(onReady) {
        let syncQueue = [];
        for(let key in this._depends) {
            let info = this._depends[key];
            if(info.isNeedSync) {
                syncQueue.push(info);
            }
        }
        let km = this;
        function doSync() {
            if(syncQueue.length > 0) {
                let infoKey = syncQueue.pop().key;
                let kInfo = new InfoNode(this,km.getInfoURL(infoKey));
                kInfo.sync(function() {
                    km._cacheNode[infoKey] = kInfo;
                    doSync();
                })
            } else {
                if(onReady) {
                    onReady();
                }
            }
        }

        doSync();

    }

    addknowledgeKey(key,info) {
        this._cacheNode[key] = info;
    }

    removeknowledgeKey(key) {
        delete this._knowledge
    }





    getKnowledge(key) {
        let result = this._cacheNode[key];
        if(result) {
            if(result.getState() == InfoNode.STATE_NORMAL) {
                return result;
            }
        } else {
            if(this._depends[key] == null) {
                BX_LOG("knowledge " + key + " is not in depends list");
                return null;
            } else {

            }
        }

        return result;
    }
}

KnowledgeManager.STATE_NEED_SYNC = 0;
KnowledgeManager.STATE_READY = 1;



var AdmZip = require('adm-zip');

class Zip{
    constructor(input) {
        this.innerZip = new AdmZip(input);
    }

    dump(){
        BX_INFO('============');
        BX_INFO('=>zip entrys:');
        BX_INFO('============');
        var entrys = this.innerZip.getEntries();
        for(var i in entrys){
            BX_INFO('=>entry name:'+entrys[i].entryName);
        }
        BX_INFO('-----------');
    }

    addLocalFolder(localPath,filter) {
        let innerZip = this.innerZip


        var localPath = path.normalize(localPath);
        localPath = localPath.split("\\").join("/");
        if (localPath.charAt(localPath.length - 1) != "/"){
            localPath += "/";
        }


        if (fs.existsSync(localPath)) {
            var items = BaseLib.findFiles(localPath);
            if (items.length) {


                items.forEach(function(path) {
                    var p = path.split("\\").join("/").replace( new RegExp(localPath, 'i'), "");


                    if(filter){
                        if(!filter(p)){
                            return;
                        }
                    }


                    if (p.charAt(p.length - 1) !== "/") {
                        BX_INFO(p);
                        innerZip.addFile(p, fs.readFileSync(path), "", 0)
                    } else {
                        innerZip.addFile(p, new Buffer(0), "", 0)
                    }
                });
            }
        } else {
            throw "There is a file in the way: " + localPath;
        }
    }

    loadFolderAsync(folder,onSuccess) {
        this.addLocalFolder(folder);
        this.innerZip.toBuffer(

            function(zipData){
                onSuccess(zipData);
            },

            function(){
            },

            function(itemname){
            },

            function(itemname){
            });
    }

    toBuffer(onsuccess,onfailed){
        this.innerZip.toBuffer(onsuccess,onfailed);
    }

    extractEntryToFolder(entry,targetPath) {

        let innerZip = this.innerZip;
        innerZip.extractEntryTo(entry,targetPath,false,true);
    }

    extractEntryToAsync(entry,targetPath,callback) {


        let innerZip = this.innerZip;
        var extraPath = targetPath+"_";
        innerZip.extractEntryTo(entry,extraPath,false,true);


        var subZip = new Zip();
        subZip.addLocalFolder(extraPath);
        subZip.toBuffer(

            function(zipData){
                Zip.saveZipDataToFileAsync(targetPath,zipData,function(err){
                    BX_INFO('save:'+targetPath+'ret:'+err);
                    callback(0);
                });
            },

            function(){
                callback(1);
            });
    }

    readEntryAsync(entryName,callback){
        let innerZip = this.innerZip;
        var entry = innerZip.getEntry(entryName);
        if(entry==null){
            BX_INFO('ERROR:load file filed:'+entryName);
            callback(1)
            return;
        }

        BX_INFO('read file async');
        innerZip.readFileAsync(entry,function(decompressedBuffer){
            BX_INFO('read file success');
            innerZip.readAsTextAsync(entry,function(decompressedText){
                BX_INFO('read as text success');
                callback(0,decompressedText);
            });
        });
    }




    static saveZipDataToFileAsync(zipPath,zipData,callback){
        BaseLib.writeFileToAsync(zipPath, zipData, true,function(ret){
            if(ret){
                callback(0);
            }else{
                callback(1);
            }
        });
    }
}
var BX_REPOSITORY_REMOTE = 0;
var BX_REPOSITORY_LOCAL = 1;
var BX_REPOSITORY_FAKE = 2;
var BX_REPOSITORY_SOURCE = 3;


var repository_mode = BX_REPOSITORY_FAKE;




var BX_BUCKY_MODULE = "bucky_modules";
var bucky_modules_dir = "";
var bucky_moduels_search_dirs=[];
class Repository{

    static setMode(v){
        if(v!=BX_REPOSITORY_REMOTE&&v!=BX_REPOSITORY_LOCAL&&v!=BX_REPOSITORY_FAKE){
            BX_ERROR("Invalid repository mode.");
            return;
        }
        repository_mode = v;
    }

    static findModuleDir(folder){
        if(folder==void 0 || !BaseLib.dirExistsSync(folder)){
            folder = path.dirname(require.main.filename);
            BX_INFO("set find folder:"+folder);
        }

        BX_INFO("=> find bucky_modules_dir");

        var moduleDir = null;
        do{

            moduleDir = BaseLib.findOutFile(folder,new RegExp(BX_BUCKY_MODULE),'dir');
            if(moduleDir!=null){
                break;
            }

            moduleDir = BaseLib.findOutFile(__filename,new RegExp(BX_BUCKY_MODULE),'dir');
            if(moduleDir!=null){
                break;
            }

            for(let i in bucky_moduels_search_dirs){
                let searchPath = bucky_moduels_search_dirs[i];
                BX_INFO("Search:"+searchPath);
                moduleDir = BaseLib.findOnceSync(searchPath,new RegExp(BX_BUCKY_MODULE),'dir');
                if(moduleDir!=null){
                    break;
                }
            }
        }while(false);

        bucky_modules_dir = moduleDir;

        return moduleDir;
    }

    static findAppDir(appConfigFile){
        var appConfigDir = path.dirname(appConfigFile);
        return appConfigDir;
    }

    static addSearchPath(searchPath){
        bucky_moduels_search_dirs.push(searchPath);
    }

    static setModulesPath(modulesDir){
        bucky_modules_dir = modulesDir;
    }




    static createLoadPackage(appid,traceId,token,packageId,packagever,fileName,onSuccess){
        var loadPackage = {
            "ver":"1001",
            "appid":appid,
            "token":token,
            "cmd":"load",
            "traceid":traceId,
            "packageid":packageId,
            "packagever":packagever,
            "filename":fileName,
        }
        onSuccess(true,loadPackage)
    }

    static pub_fake(moduleDir,packagesDir, appConfigFile, app, onSuccess){



        var rpath = moduleDir;
        BaseLib.mkdirsSync(rpath);
        var metaFile = path.join(rpath,'.meta');

        BX_INFO(metaFile);
        var meta = {};
        if(BaseLib.fileExistsSync(metaFile)){
            try{
                meta = JSON.parse(fs.readFileSync(metaFile));
            }catch(err){
                BX_ERROR("ERROR:read meta failed, metaFile path:"+metaFile);
                process.exit(1);
            }
        }

        var appMeta = meta[app.appid];
        if(appMeta==void 0){
            appMeta = {};
            meta[app.appid] = appMeta;
        }

        var pkgsMeta = appMeta.packages;
        if(pkgsMeta==void 0){
            pkgsMeta = {}
            meta[app.appid].packages = pkgsMeta;
        }


        var zip = new Zip(app.body.content);

        for(let i in app.body.packages){
            let pkg = app.body.packages[i];


            var pkgPath = path.join(rpath,app.appid+"_"+pkg.id+"_"+pkg.ver);


            var pkgMeta = appMeta.packages[pkg.id];
            if(pkgMeta==void 0){
                pkgMeta = {
                    'maxversion':0,
                    'versions':{}
                }
                appMeta.packages[pkg.id] = pkgMeta;
            }

            if(BaseLib.isBlank(pkg.ver)){
                pkg.ver = BaseLib.inet_ntoa(pkgMeta.maxversion);
            }


            var pkgvern = BaseLib.inet_aton(pkg.ver)
            if(pkgvern>pkgMeta.maxversion){
                pkgMeta.maxversion = pkgvern
            }


            var pkgVerMeta = pkgMeta.versions[pkg.ver];
            if(pkgVerMeta==void 0){
                pkgVerMeta = {}
                pkgMeta.versions[pkg.ver] = pkgVerMeta;
            }


            var pkgEntryName = pkg.relativepath+"/";
            pkgVerMeta.source = path.join(packagesDir,pkg.relativepath);
            if(BaseLib.dirExistsSync(pkgPath)){
                BaseLib.deleteFolderRecursive(pkgPath);
            }
            zip.extractEntryToFolder(pkgEntryName,pkgPath);
        }


        BaseLib.writeFileTo(metaFile,JSON.stringify(meta));

        onSuccess(0);
    }

    static findModuleDirCache(){
        if(bucky_modules_dir!=""&&BaseLib.dirExistsSync(bucky_modules_dir)){
            BX_INFO("=> hint bucky_modules dir cache");
            return bucky_modules_dir;
        }else{
            return null;
        }
    }

    static load_fake(appid,traceid,token,packageid,packagever,fileName,onSuccess){


        var rpath = bucky_modules_dir;
        if(rpath.length < 1){
            rpath = Repository.findModuleDir();
        }

        var faliedResp = {
            result:1
        }


        var metaFile = path.join(rpath,'.meta');
        console.log(metaFile);

        if(!BaseLib.fileExistsSync(metaFile)){
            BX_ERROR("meta file not exists");
            onSuccess(1,faliedResp);
            return;
        }

        var meta = "";
        try{
            meta = JSON.parse(fs.readFileSync(metaFile));
        }catch(err){
            BX_ERROR("parser meta file failed:"+metaFile);
            onSuccess(1,faliedResp);
            return;
        }
        var appMeta = meta[appid];
        if(appMeta==void 0){
            BX_ERROR("missing app meta");
            onSuccess(1,faliedResp);
            return;
        }

        var pkgsMeta = appMeta.packages;
        if(pkgsMeta==void 0){
            BX_ERROR("missing packages meta");
            onSuccess(1,faliedResp);
            return;
        }

        var pkgMeta = pkgsMeta[packageid];
        if(pkgsMeta==void 0){
            BX_ERROR("missing package meta");
            onSuccess(1,faliedResp);
            return;
        }

        if(pkgMeta.versions==void 0){
            BX_ERROR("missing package versions meta");
            onSuccess(1,faliedResp);
            return;
        }

        if(BaseLib.isBlank(packagever)){
            packagever = BaseLib.inet_ntoa(pkgMeta.maxversion);
        }
        if(BaseLib.isBlank(packagever)){
            BX_ERROR("missing package version meta");
            onSuccess(1,faliedResp);
            return;
        }

        var pkgVerMeta = pkgMeta.versions[packagever]
        if(pkgVerMeta==void 0){
            BX_ERROR("missing package version meta");
            onSuccess(1,faliedResp);
            return;
        }

        var code = "";
        var isSource = false;
        var sourcePath = null;
        var pkgPath = path.join(rpath,appid+"_"+packageid+"_"+packagever);
        if(pkgVerMeta.source!=(void 0) && BaseLib.dirExistsSync(pkgVerMeta.source)){
            var modulePath = pkgVerMeta.source+PATH_SEPARATOR+fileName;
            if(BaseLib.fileExistsSync(modulePath)){
                code = fs.readFileSync(modulePath);

                var moduleThisVerPath = pkgPath+PATH_SEPARATOR+fileName;
                if(!BaseLib.fileExistsSync(moduleThisVerPath)){
                    BX_ERROR("missing version's module path"+moduleThisVerPath);
                    onSuccess(1,faliedResp);
                    return;
                }

                var codeThisVer = fs.readFileSync(moduleThisVerPath);

                if(BaseLib.md5(code)!=BaseLib.md5(codeThisVer)){
                    BX_INFO("Souce Code is change after this version pub.");
                    BX_INFO("Version:"+packagever);
                    BX_INFO("Module Repository Path:"+moduleThisVerPath);
                    BX_INFO("Module Source Path:"+modulePath);
                    BX_INFO("Use the repository code.");
                    BX_INFO("May be you should re pub it.");
                }else{
                    isSource = true;
                    sourcePath = modulePath;
                }
            }
        }

        if(!isSource){
            if(!BaseLib.dirExistsSync(pkgPath)){
                BX_ERROR("missing package path");
                onSuccess(1,faliedResp);
                return;
            }

            var modulePath = pkgPath+PATH_SEPARATOR+fileName;
            if(!BaseLib.fileExistsSync(modulePath)){
                BX_ERROR("missing module path");
                onSuccess(1,faliedResp);
                return;
            }

            code = fs.readFileSync(modulePath);
        }

        var resp = {
            "ver":1001,
            "appid":appid,
            "cmd":"loadresp",
            "traceid":traceid,
            "packageid":packageid,
            "packagever":packagever,
            "filename":fileName,
            "md5":BaseLib.md5(code),
            "type":isSource?"file":"text",
            "length":code.length,
            "content":isSource?sourcePath:code
        };



        onSuccess(0,resp);
    }

    static load(repositoryHost,appid,traceid,token,packageid,packagever,fileName,onSuccess){
        if(packagever==void 0){
            packagever = "";
        }

        if(repository_mode==BX_REPOSITORY_FAKE){
            Repository.load_fake(appid,traceid,token,packageid,packagever,fileName,function(ret,resp){
                if(ret==0){
                    onSuccess(true,resp);
                }else{
                    onSuccess(false,resp);
                }
            });
        }else{
            if(repository_mode==BX_REPOSITORY_LOCAL){
                repositoryHost = "http://127.0.0.1:3667/";
            }

            Repository.createLoadPackage(appid,traceid,token,packageid,packagever,fileName,function(ret,pkg){
                BaseLib.postJSON(repositoryHost,pkg,function(resp){
                    if(resp==(void 0)||resp==(void 0) || resp.result!=0){
                        onSuccess(false,resp);
                    }else{
                        onSuccess(true, resp);
                    }
                });
            });
    }
    }







    static searchPackage(dir, result) {
        let files = fs.readdirSync(dir);
        for (let index in files) {
            let filePath = dir + "/" + files[index];

            var info = fs.statSync(filePath);
            if(info.isDirectory()) {
               Repository.searchPackage(filePath,result);
            } else if(files[index] == "config.json") {

                result.push(dir);
            }
        }
    }

    static searchJSFile(dir,result) {
        let files = fs.readdirSync(dir);
        for (let index in files) {
            let filePath = dir + "/" + files[index];
            let file = files[index];

            var info = fs.statSync(filePath);
            if(info.isDirectory()) {
                searchJSFile(filePath,result);
            } else if(file.lastIndexOf(".js") == file.length - 3) {
                if(file.length > 3) {
                    result.push(filePath);
                }
            }
        }
    }

    static checkAndShowPackageInfo(packageInfo) {
        let packageID = packageInfo.packageID;
        let version = packageInfo.version;
        let build = packageInfo.build;
        if (packageID && build) {
            BX_INFO("#  package:" + packageID + " version:" + version + " build:" + packageInfo.build);
            if(packageInfo.meta) {
                if(packageInfo.meta.desc) {
                    BX_INFO("#\t" + packageInfo.meta.desc + "\r\n#");
                }
            }
        } else {
            BX_INFO(">>ERROR:miss packageID or version or build in config.json")
            return false
        }
        return true;
    }

    static loadAppInfo(packagesDir, appConfigFile){
        BX_INFO('->packagesDir:'+packagesDir);
        BX_INFO('->appConfigFile:'+appConfigFile);

        var errorNum = 0;
        var warNum = 0;
        var appInfo = null;

        try {
            appInfo = JSON.parse(fs.readFileSync(appConfigFile));
        } catch (err) {
            BX_INFO("->ERROR: Cann't read app info!");
            process.exit(1);
        }

        BX_INFO("->Start publish packages from " + packagesDir);
        var packageList = new Array();
        Repository.searchPackage(packagesDir,packageList);
        var willPubPackageList = new Array();


        BX_INFO('============');
        for(var i=0;i<packageList.length;++i) {

            let packageDir = packageList[i];
            BX_INFO("->Start check package dir : " + packageDir);
            let configPath = packageDir + "/config.json"
            let packageInfo = null;
            try{
                packageInfo = JSON.parse(fs.readFileSync(configPath));
            }catch(err){
                BX_INFO("->ERROR: Cann't read package info!");
                process.exit(1);
            }

            if (packageInfo == null) {
                BX_INFO("->ERROR:cann't parse " + configPath + ",invalid package");
                errorNum = errorNum + 1;
                continue;
            } else {
                if (!Repository.checkAndShowPackageInfo(packageInfo)) {
                    continue;
                }
            }


            let jsfiles = new Array();
            Repository.searchJSFile(packageDir, jsfiles);
            for (let j = 0; j < jsfiles.length; ++j) {
                try {
                    child_process.execFileSync("node", ["-c", jsfiles[j]]);
                    BX_INFO("check " + jsfiles[j] + " OK.");
                }catch(err) {
                    BX_INFO(">>ERROR:check " + jsfiles[j] + " error.")
                    errorNum = errorNum + 1;
                }
            }


            for (let moduleID in packageInfo.modules) {
                let moduleFile = packageInfo.modules[moduleID];
                try {
                    fs.statSync(packageDir + "/" + moduleFile)
                } catch (err) {
                    BX_INFO(">>WARN: module file not found," + moduleID + " : " + packageDir + "/" + moduleFile)
                    warNum = warNum + 1;
                }
            }


            willPubPackageList.push({
                "relativepath":packageDir.replace(packagesDir+'/',""),
                "info":packageInfo
            });
        }

        let info = {
            "app":appInfo,
            "packages":willPubPackageList,

        };

        return info;
    }

    static createPubPackage(packagesDir,appConfigFile,traceId,token,onSuccess){

        var appInfo = Repository.loadAppInfo(packagesDir, appConfigFile);

        var pubPackage = {
           "ver":"1001",
           "appid":appInfo.app.appID,
           "token":token?token:appInfo.app.token,
           "cmd":"pub",
           "traceid":traceId
        };

        var packageInfos = new Array();
        for(var i=0;i<appInfo.packages.length;++i){
            var pkg = appInfo.packages[i];
            packageInfos.push({
                "id":pkg.info.packageID,
                "ver":pkg.info.version==void 0?"":pkg.info.version,
                "relativepath":pkg.relativepath
            })
        }

        pubPackage.body = {

            "packages":packageInfos
        };



        var zip = new Zip();
        zip.loadFolderAsync(packagesDir,function(zipData){
            pubPackage.body.md5 = BaseLib.md5(zipData);
            pubPackage.body.length = zipData.length;
            pubPackage.body.type="zip";
            pubPackage.body.content = zipData;

            onSuccess(appInfo.app.repositoryHost, pubPackage);
        })
    }

    static pub(modulesDir,packagesDir,appConfigFile,traceId,token,onSuccess){

        if(!path.isAbsolute(packagesDir)){
            packagesDir = path.join(__dirname,packagesDir);
        }
        BX_INFO("packages dir:"+packagesDir);

        if(!path.isAbsolute(appConfigFile)){
            appConfigFile = path.join(__dirname,appConfigFile);
        }
        BX_INFO("appConfiFile:"+packagesDir);

        if(!BaseLib.dirExistsSync(packagesDir)){
            BX_ERROR("ERROR: packagesDir is not exist:"+packagesDir);
            process.exit(1);
        }

        if (!BaseLib.fileExistsSync(appConfigFile)) {
            BX_ERROR("ERROR: appConfigFile is not exist:"+appConfigFile);
            process.exit(1);
        }

        Repository.createPubPackage(packagesDir,appConfigFile,traceId,token,function(repositoryHost, pkg){
            if(repository_mode==BX_REPOSITORY_FAKE){

                if(modulesDir===void 0 ){
                    BX_ERROR("ERROR: modules path is not assign.");
                    process.exit(1);
                }

                if(!path.isAbsolute(modulesDir)){
                    modulesDir = path.join(__dirname,modulesDir);
                }


                Repository.pub_fake(modulesDir,packagesDir, appConfigFile, pkg, function(ret){
                    var resp = {
                        "ver":pkg.ver,
                        "appid":pkg.appid,
                        "cmd":"pubresp",
                        "traceid":pkg.traceid,
                        "result":0
                    };
                    if(ret!=0){
                        resp.result = 1;
                        onSuccess(false,resp,pkg);
                    }else{
                        onSuccess(true,resp,pkg);
                    }
                });
            }else{
                if(repository_mode==BX_REPOSITORY_LOCAL){


                    repositoryHost = "http://127.0.0.1:3667/";
                }else{

                }

                BX_INFO("post pub request to host:"+repositoryHost);
                BaseLib.postJSON(repositoryHost,pkg,function(resp){
                    if(resp==(void 0)||resp.result==(void 0)||resp.result!=0){
                        onSuccess(false, resp, pkg);
                    }else{
                        onSuccess(true, resp, pkg);
                    }
                });
            }
        });
    }


}

class XARPackage {
    constructor(xarConfig,ownerRuntime) {
        this.state = XARPackage.XAR_STATE_LOADING;
        this.m_packageInfo = xarConfig;
        this.m_id = xarConfig.packageID;
        this.m_version = xarConfig.version;
        this.m_exportModules = {};
        this.baseURL = xarConfig.baseURL;
        this.ownerAppID = ownerRuntime.getOwnerApp().getID();




        for(let moduleID in xarConfig.modules) {
            let moduleInfo = {};
            moduleInfo.id = moduleID;
            moduleInfo.module = null;
            moduleInfo.state = XARPackage.XAR_STATE_NOTLOAD;
            moduleInfo.path = xarConfig.modules[moduleID];
            moduleInfo.callbacks = [];

            this.m_exportModules[moduleID] = moduleInfo;
        }
    }

    getPackageInfo() {
        return this.m_packageInfo;
    }
    loadModule(moduleID,onComplete) {
        let moduleInfo = null;
        let thisPackage = this;
        moduleInfo = this.m_exportModules[moduleID];
        if(moduleInfo) {
            if(moduleInfo.loadedModule) {
                onComplete(moduleInfo.loadedModule);
            } else {







                Repository.load(this.baseURL, this.ownerAppID,
                    "abc", "123", this.m_packageInfo.packageID, this.m_packageInfo.version, moduleInfo.path, function(ret,resp) {
                        if (!ret) {
                            onComplete(null,ErrorCode.RESULT_NOT_FOUND);
                        } else {
                            let content = resp.content;
                            if (content) {
                                if(resp.type=='file'){
                                    if(!BaseLib.fileExistsSync(content)){
                                        onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                                    }
                                    content = fs.readFileSync(content);
                                }

                                let thisModule = {};
                                thisModule.info = moduleInfo;
                                let scriptContent = "(function(_owp_,module) {let getCurrentPackage=function(){return _owp_;}; \n" + content +"\n})(thisPackage,thisModule);";

                                let funcResult = eval(scriptContent);
                                if(funcResult) {
                                    thisModule.exports = funcResult;
                                }
                                moduleInfo.loadedModule = thisModule.exports;
                                onComplete(thisModule.exports,ErrorCode.RESULT_OK);


                            } else {
                                onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                            }
                        }
                    });

            }
        } else {
            onComplete(null,ErrorCode.RESULT_NOT_FOUND);
        }
    }

    isModuleExist(moduleID) {
        let moduleInfo = null;
        moduleInfo = this.m_exportModules[moduleID];
        if(moduleInfo) {
            return true;
        }

        return false;
    }
}

XARPackage.XAR_STATE_LOADING = 0;
XARPackage.XAR_STATE_RUNING = 1;
XARPackage.XAR_STATE_LOADED = 2;
XARPackage.XAR_STATE_ERROR = 3;
XARPackage.XAR_STATE_NOTLOAD = 4;

class RuntimeCache {
    constructor(owner) {
        this.m_owenr = owner;
        this.m_allObjects = {}
    }

    setObject(objID,objItem) {

        let newObj = {};
        newObj.m_lastUsed = new Date().getTime();
        newObj.m_item = objItem;
        this.m_allObjects[objID] = newObj;
        return true;
    }

    getObject(objID) {
        let result = this.m_allObjects[objID];
        if(result) {
            result.m_lastUsed = new Date().getTime();
            return result.m_item;
        }

        return null;
    }

    removeObject(objID) {
        let result = this.m_allObjects[objID];
        if(result) {
            delete this.m_allObjects[objID];
            return true;
        }
        return false;
    }

    isObjectExists(objID) {
        let result = this.m_allObjects[objID];
        if(result) {
            return true;
        } else {
            return false;
        }
    }
}
class RuntimeStorage {
    constructor(owner,baseDir) {

        this.m_owenr = owner;
        this.m_baseDir = baseDir;

        this.m_fs= require('fs');

    }


    setObject(objID,objItem,onComplete) {

        let objPath = this.m_baseDir + objID;
        this.m_fs.writeFile(objPath,JSON.stringify(objItem),function(err) {
            if(err) {
                console.log("write to " + objPath + " failed");
                onComplete(objID,false);
            } else {
                console.log("write to " + objPath + " OK");
                onComplete(objID,true);
            }
        });



    }

    getObject(objID,onComplete) {

        let objPath = this.m_baseDir + objID;
        this.m_fs.readFile(objPath,function(err,data) {
            if(err) {
                onComplete(objID,null);
            } else {
                let objResult = JSON.parse(data);
                onComplete(objID,objResult);
            }
        });



    }

    removeObject(objID,onComplete) {

        let objPath = this.m_baseDir + objID;
        this.m_fs.unlink(objPath,function(err) {
            if(err) {
                onComplete(objID,false);
            } else {
                onComplete(objID,true);
            }
        }) ;



    }

    isObjectExists(objID,onComplete) {

        let objPath = this.m_baseDir + objID;
        this.m_fs.access(objPath,0,function(err) {
            if(err) {
                onComplete(objID,false);
            } else {
                onComplete(objID,true);
            }
        });



    }
}




var schema = "http://";
function initCurrentRuntime(runtimeRootDir, localKMPath) {
    let runtimeID = "bucky_allinone_runtime"
    let token = BaseLib.createGUID();
    var thisDevice = new Device();

    function initDeviceConfig(device, appID) {
        device.m_type = "*";
        device.m_ability = ["wlan-interface","lan-interface","cache","storage"];
        device.m_drivers = {
            "bx.mysql.client":{"state":"enable"},
            "bx.redis.client":{"state":"enable"}
        };
        device.meta ={};
        return ErrorCode.RESULT_OK;
    }

    Application._currentRuntime = new RuntimeInstance(runtimeID,token,Application._currentApp);
    Application._currentRuntime.m_ownerDevice =thisDevice;
    let deviceID = BaseLib.createGUID();
    Application._currentRuntime.m_ownerDevice = new Device(deviceID);
    let ownerUserID = BaseLib.createGUID();
    Application._currentRuntime.m_ownerDevice.setOwnerUserID(ownerUserID);
    initDeviceConfig(Application._currentRuntime.m_ownerDevice, Application._currentApp.getID());


    let instanceDir = runtimeRootDir;
    BaseLib.mkdirsSync(instanceDir);
    BaseLib.mkdirsSync(instanceDir + "cache/");
    BaseLib.mkdirsSync(instanceDir + "storage/");
    Application._currentRuntime._localRuntimeStorageRoot = instanceDir + "storage/";


    Application._currentRuntime.getKnowledgeManager().initFromLocalPath(localKMPath);

    BX_LOG("initCurrentRuntime OK");
    return ErrorCode.RESULT_OK;
}


function getCurrentRuntime() {
    return Application._currentRuntime;
}

class RuntimeInfo {
    constructor(runtimeID) {
        this.ID = runtimeID;
        this.OwnerDeviceID = "";
        this.OwnerAppID = "";
        this.OwnerAppHost = "";
        this.Ability = new Array();
        this.PostURL= "";
    }
}



class RuntimeInstance {
    constructor(runtimeID,runtimeToken,theApp) {
        this.m_app = theApp;
        this.m_id = runtimeID;
        this.m_token = runtimeToken;
        this.m_ability = new Array();
        this.m_runtimeDir = "";
        this.m_postURL = "";

        this.m_packages = {};
        this.m_proxyPackages = {};
        this.m_ownerDevice = null;
        this.m_knowledegeManager = new KnowledgeManager(theApp.getHost() + "/knowledges/");
        this.m_driverLoadRule = {};

        this.m_cache = new RuntimeCache(this);
        this.m_allStorages = {};
        this.m_allBindStoragePath = {};
        this.m_logger = null;
    }


    initWithInfo(info) {
        this.m_id = info.ID;
        this.m_ability = info.Ability.slice(0);
        this.m_postURL = info.PostURL;
        if(info.Storages) {
            if (info.Storages.length > 0) {
                for(let i=0;i<info.Storages.length;++i) {
                    let localPath = info.StoragePath + info.Storages[i];
                    this.bindRuntimeStorage(info.Storages[i],localPath);
                    BX_LOG("**** will create storage:" + info.Storages[i] + " at " + localPath);
                }
            }
        }
    }


    installDefaultDriverFromNode() {
        this.m_driverLoadRule["bx.redis.client"] = {
            "load" : function (did) {
                return require("redis");
            }
        };

        this.m_driverLoadRule["bx.mysql.client"] = {
            "load" : function (did) {
                return require("mysql");
            }
        };
    }
    getInstanceID() {
        return this.m_id;
    }

    getOwnerDevice() {
        return this.m_ownerDevice;
    }

    getOwnerApp() {
        return this.m_app;
    }

    createRuntimeInfo() {
        let result = new RuntimeInfo(this.m_id);

        result.OwnerDeviceID = this.m_ownerDevice.getDeviceID();
        result.OwnerAppID = this.m_app.getID();
        result.OwnerAppHost = this.m_app.getHost();
        result.Ability = this.m_ability.slice(0);
        result.PostURL= this.m_postURL;
        result.DeviceType = this.m_ownerDevice.getDeviceType();
        if(this.m_allBindStoragePath) {
            result.Storages = [];
            for(let gpath in this.m_allBindStoragePath) {
                result.Storages.push(gpath);
            }
        }

        result.IsOnline = true;

        return result;
    }

    getKnowledgeManager () {
        return this.m_knowledegeManager;
    }

    getRuntimeCache() {
        return this.m_cache;
    }

    getRuntimeStorage(globalPath) {
        return this.m_allStorages[globalPath];
    }

    getLocalStorage() {
        return null;
    }

    enableRuntimeStorage(globalPath) {

    let localPath = this._localRuntimeStorageRoot + globalPath;
    BaseLib.mkdirsSync(localPath);
    let newStorage = new RuntimeStorage(this,localPath);
    this.m_allStorages[globalPath] = newStorage;
    return true;
    }

    bindRuntimeStorage(globalPath,localPath) {
        this.m_allBindStoragePath[globalPath] = localPath;
    }





    getLogger() {
        let thisRumtime = this;
        if (!thisRumtime.m_logger) {
            let logName = thisRumtime.m_app.getID() + ":runtime_"+thisRumtime.getInstanceID();
            thisRumtime.m_logger = console;

        }

        return thisRumtime.m_logger;
    }





    getDriver(driverID) {
        let device = this.getOwnerDevice();
        if(device.isDriverInstalled(driverID)) {
            let driverNode = this.m_driverLoadRule[driverID];
            if(driverNode) {
                return driverNode.load();
            }
        }

        return null;
    }

    isXARPackageCanLoad(packageInfo,instanceID) {


        return true;
    }


    getLoadedXARPackage(xarID) {
        let resultPackage = null;
        resultPackage = this.m_packages[xarID];
        if(resultPackage) {
            return resultPackage;
        }

        resultPackage = this.m_proxyPackages[xarID];
        if(resultPackage) {
            return resultPackage;
        }

        return resultPackage;
    }
    loadXARPackage(xarInfo,onComplete) {
        let resultPackage = null;
        resultPackage = this.m_packages[xarInfo];
        if(resultPackage) {
            onComplete(resultPackage,0);
            return;
        }
        resultPackage = this.m_proxyPackages[xarInfo];
        if(resultPackage) {
            onComplete(resultPackage,0);
            return;
        }
        let thisRuntime = this;
        BX_LOG("start load xar package:" + xarInfo);



        let repositoryList = this.m_app.repositoryList.slice(0);

        BX_LOG(repositoryList.length.toString());
        let tryLoad = function(pos) {
            if(pos >= repositoryList.length) {
                onComplete(null,ErrorCode.RESULT_NOT_FOUND);
                return;
            }

            let repositoryHost = repositoryList[pos];
            BX_LOG("repositoryHost:"+repositoryHost);


            let xarID = xarInfo;
            let xarVersion = "";
            let xarDetail = xarInfo.split("|");
            if (xarDetail.length > 1) {
                xarID = xarDetail[0];
                xarVersion = xarDetail[1];
            }
            Repository.load(repositoryHost, thisRuntime.getOwnerApp().getID(),
                "abc", "123", xarID, xarVersion, "config.json", function(ret, resp) {

                    if (!ret) {

                        tryLoad(pos+1);
                    } else {
                        let content = resp.content;
                        if (content==void 0) {
                            onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                            return;
                        }

                        let configText = content;
                        if(resp.type=='file'){
                            if(!BaseLib.fileExistsSync(content)){
                                onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                                return;
                            }
                            configText = fs.readFileSync(content);
                        }

                        var xarConfig = JSON.parse(configText);
                        xarConfig.baseURL = repositoryHost;
                        if(xarConfig.knowledges) {
                            for (let i = 0; i < xarConfig.knowledges.length; ++i) {
                                thisRuntime.m_knowledegeManager.dependKnowledge(xarConfig.knowledges[i]);
                            }
                        }

                        if(xarConfig.storages) {
                            for(let i=0;i<xarConfig.storages.length;++i) {
                                thisRuntime.enableRuntimeStorage(xarConfig.storages[i]);
                            }
                        }

                        thisRuntime.m_knowledegeManager.ready(function() {
                            if(thisRuntime.isXARPackageCanLoad(xarConfig,thisRuntime.m_id)) {

                                let xarPackage = new XARPackage(xarConfig,thisRuntime);
                                thisRuntime.m_packages[xarInfo] = xarPackage;

                                xarPackage.state = XARPackage.XAR_STATE_RUNING;
                                Repository.load(repositoryHost, thisRuntime.getOwnerApp().getID(),
                                    "abc", "123", xarID, xarVersion, "onload.js", function(ret, resp){
                                        if (!ret) {
                                            thisRuntime.m_packages[xarInfo] = null;
                                            onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                                        } else {
                                            let content = resp.content;
                                            if(content) {
                                                if(resp.type=='file'){
                                                    if(!BaseLib.fileExistsSync(content)){
                                                        onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                                                    }else{
                                                        content = fs.readFileSync(content);
                                                    }
                                                }

                                                let scriptContent = "(function(_owp_) {let getCurrentPackage=function(){return _owp_;}; \n" + content +"\n})(xarConfig);";

                                                let funcResult = eval(scriptContent);
                                                BX_LOG("load package " + xarInfo + " ok.");
                                                xarPackage.state = xarPackage.XAR_STATE_LOADED;
                                                onComplete(xarPackage, funcResult);

                                            } else {
                                                onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                                            }
                                        }
                                    });
                            } else {


                                let proxyInfo = xarID + "_proxy";
                                if (xarVersion != "") {
                                    proxyInfo += "|";
                                    proxyInfo += "xarVersion"
                                }
                                BX_LOG("can not load remote package:"+xarInfo+", load proxy package:"+proxyInfo);
                                thisRuntime.loadXARPackage(proxyInfo, onComplete);
                            }
                        });
                        return;
                    }
                });
        };

        tryLoad(0);


    }
    createRuntimeOnDevice(deviceInfo,packageInfo,onComplete) {

        let postURL = schema + deviceInfo.InterfaceURL + "/runtimes/";
        let postBody = {};
        let thisRuntime = this;

        postBody.appID = this.m_app.getID();
        if(packageInfo.storages) {

            postBody.storages = packageInfo.storages;
        }

        BaseLib.postJSON(postURL,postBody,function (newRuntimeInfo) {
            BaseLib.setOnceTimer(function(){

                thisRuntime.m_knowledegeManager.dependKnowledge("global.runtimes",{});
                thisRuntime.m_knowledegeManager.ready(function() {
                    onComplete(newRuntimeInfo);
                })
            },1000);
        });

        return true;
    }

    resumeRuntime(runtime,onComplete) {
        let knowledegePath = "global.devices";
        let deviceMap = getCurrentRuntime().getKnowledgeManager().getKnowledge(knowledegePath);
        let deviceInfo = deviceMap.mapGet(runtime.OwnerDeviceID);
        if(deviceInfo) {
            let postURL = schema + deviceInfo.InterfaceURL + "/runtimes/";
            let postBody = {};

            postBody.appID = this.m_app.getID();
            postBody.cmd = "resume";
            postBody.runtimeID = runtime.ID;

            BaseLib.postJSON(postURL,postBody,function (runtime) {
                BaseLib.setOnceTimer(function(){
                    onComplete(runtime);
                },1000);
            });
        }

    }
    getRuntimeInfo(runtimeID) {

        let thisRuntime = getCurrentRuntime();
        if(thisRuntime.getInstanceID() == runtimeID) {
            return thisRuntime.getInfo();
        } else {

            let km = thisRuntime.getKnowledgeManager();
            let runtimeMap = km.getKnowledge("global.runtimes");
            if(runtimeMap) {
                return runtimeMap.mapGet(runtimeID);
            }
        }

        return null;

    }


    selectRuntimeByFilter(deviceType,deviceAbility,packageInfo,deviceGroupID) {
        let knowledegePath = "";
        if(deviceGroupID) {
            knowledegePath = "global.runtimes." + deviceGroupID;Info
        } else {
            knowledegePath = "global.runtimes";
        }

        let runtimeMap = getCurrentRuntime().getKnowledgeManager().getKnowledge(knowledegePath).mapGetClone();
        let result = [];
        for(let rid in runtimeMap) {
            let runtimeInfo = runtimeMap[rid];
            let thisDeviceOK = true;

            if(deviceType) {
                if(runtimeInfo.Type == deviceType) {
                    thisDeviceOK = true;
                } else {
                    thisDeviceOK = false;
                }
            }

            if(thisDeviceOK) {
                if(deviceAbility) {
                    if(BaseLib.isArrayContained(runtimeInfo.Ability,deviceAbility)) {
                        thisDeviceOK = true;
                    } else {
                        thisDeviceOK = false;
                    }
                }
            }

            if(thisDeviceOK) {
                if(packageInfo) {
                    if(packageInfo.drivers) {
                        if(packageInfo.drivers.length > 0) {
                            if(BaseLib.isArrayContained(runtimeInfo.Drivers,packageInfo.drivers)) {
                                thisDeviceOK = true;
                            } else {
                                thisDeviceOK = false;
                            }
                        }
                    }
                }
            }

            if(thisDeviceOK) {
                if(packageInfo) {
                    if(packageInfo.storages) {
                        if(packageInfo.storages.length > 0) {
                            if(runtimeInfo.Ability.indexOf("storage") >= 0) {
                                thisDeviceOK = true;
                            } else {
                                thisDeviceOK = false;
                            }
                        }
                    }
                }
            }

            if(thisDeviceOK) {
                result.push(runtimeInfo);
            }
        }

        if(result.length > 0)
        {

            let index = BaseLib.getRandomNum(0,result.length-1);
            return result[index];
        }

        BX_LOG("ERROR! Cann't select valid runtime!");
        return null;
    }

    selectDeviceByFilter(deviceType,deviceAbility,packageInfo,deviceGroupID) {
        let knowledegePath = "";
        if(deviceGroupID) {
            knowledegePath = "global.devices." + deviceGroupID;
        } else {
            knowledegePath = "global.devices";
        }
        let deviceMap = getCurrentRuntime().getKnowledgeManager().getKnowledge(knowledegePath).mapGetClone();
        let result = [];
        for(let did in deviceMap) {
            let deviceInfo = deviceMap[did];
            let thisDeviceOK = true;

            if(deviceType) {
                if(deviceInfo.Type == deviceType) {
                    thisDeviceOK = true;
                } else {
                    thisDeviceOK = false;
                }
            }

            if(thisDeviceOK) {
                if(deviceAbility) {
                    if(BaseLib.isArrayContained(deviceInfo.Ability,deviceAbility)) {
                        thisDeviceOK = true;
                    } else {
                        thisDeviceOK = false;
                    }
                }
            }

            if(thisDeviceOK) {
                if(packageInfo) {
                    if(packageInfo.drivers) {
                        if(packageInfo.drivers.length > 0) {
                            if(BaseLib.isArrayContained(deviceInfo.Drivers,packageInfo.drivers)) {
                                thisDeviceOK = true;
                            } else {
                                thisDeviceOK = false;
                            }
                        }
                    }
                }
            }

            if(thisDeviceOK) {
                if(packageInfo) {
                    if(packageInfo.storages) {
                        if(packageInfo.storages.length > 0) {
                            if(deviceInfo.Ability.indexOf("storage") >= 0) {
                                thisDeviceOK = true;
                            } else {
                                thisDeviceOK = false;
                            }
                        }
                    }
                }
            }

            if(thisDeviceOK) {
                result.push(deviceInfo);
            }
        }

        if(result.length > 0)
        {

            let index = BaseLib.getRandomNum(0,result.length-1);

            return result[index];
        } else {

        }

        BX_LOG("ERROR! Cann't select valid device!");
        return null;
    }

    selectRuntimeByStoragePath(storagePathList,deviceGroupID) {
        let thisRuntime = getCurrentRuntime();
        let knowledgePath = "";
        if(deviceGroupID) {
            knowledgePath = "global.storages." + deviceGroupID;
        } else {
            knowledgePath = "global.storages";
        }

        let bindInfo = thisRuntime.getKnowledgeManager().getKnowledge(knowledgePath);
        if(bindInfo) {
            let allMountInfo = bindInfo.mapGetClone();

            let maxLen = -1;
            let resultID = "";
            for(let gPath in allMountInfo) {
                if(storagePathList[0].indexOf(gPath) >= 0) {
                    if(gPath.length > maxLen) {
                        BX_LOG("find it");
                        maxLen = gPath.length;
                        resultID = allMountInfo[gPath];
                    }
                }
            }

            if(maxLen > 0) {
                BX_LOG("get runtime:" + resultID);
                return thisRuntime.getRuntimeInfo(resultID);
            } else {
                return null;
            }
        } else {
            console.log("ERROR,cann't read knowledge:" + knowledgePath);
        }
    }

    selectTargetRuntime(packageID,packageInfo,selectKey,onComplete) {
        BX_LOG("selectTargetRuntime packageID:" + packageID + " packageInfo.version:" + packageInfo.version + " selectKey:" + selectKey);

        let thisRuntime = getCurrentRuntime();
        let ruleInfo = thisRuntime.getKnowledgeManager().getKnowledge("global.loadrules");
        let module_rule = null;

        if(ruleInfo) {
            module_rule = ruleInfo.objectRead();
        } else {
            BX_LOG("cann't read global.loadrules");
            onComplete(null);
        }


        let deviceGroupID = null;
        let deviceType = null;
        let deviceAbility = null;

        if(module_rule) {
            let rule = module_rule[packageID];
            if (rule) {
                let runtimeGroupID = rule["runtime-group"];
                if (runtimeGroupID) {

                    console.log("NEED IMP!")
                } else {
                    deviceGroupID = rule["device-group"];
                    deviceType = rule["device-type"];
                    deviceAbility = rule["device-ability"];
                }
            }
        }

        let storagePathList = packageInfo.storages;
        if(storagePathList) {
            if(storagePathList.length > 0) {
                let resultRuntime = thisRuntime.selectRuntimeByStoragePath(storagePathList,deviceGroupID);
                if(resultRuntime) {

                    BX_LOG("select runtime by storagepath return:" + resultRuntime.ID);
                    if(!resultRuntime.IsOnline ) {
                        thisRuntime.resumeRuntime(resultRuntime,function(resultRuntime) {
                            onComplete(resultRuntime);
                        })
                    } else {
                        onComplete(resultRuntime);
                    }
                } else {

                    let deviceInfo = thisRuntime.selectDeviceByFilter(deviceType,deviceAbility,packageInfo,deviceGroupID);
                    if(deviceInfo) {
                        thisRuntime.createRuntimeOnDevice(deviceInfo,packageInfo,function(newRuntime) {

                            let knowledgePath = "";
                            if(deviceGroupID) {
                                knowledgePath = "global.storages." + deviceGroupID;
                            } else {
                                knowledgePath = "global.storages";
                            }

                            let bindInfo = thisRuntime.getKnowledgeManager().getKnowledge(knowledgePath);
                            for(let i=0;i<storagePathList.length;++i) {
                                bindInfo.mapSet(storagePathList[i],newRuntime.ID);
                                BX_LOG("bind " + storagePathList[i] + " -> " + newRuntime.ID);
                            }
                            onComplete(newRuntime);
                        });
                    } else {
                        console.log("cann't select device,need add new device!");
                    }
                }
            }
        } else {
            let resultRuntime = thisRuntime.selectRuntimeByFilter(deviceType,deviceAbility,packageInfo,deviceGroupID);
            if(resultRuntime) {
                if(!resultRuntime.IsOnline ) {
                    thisRuntime.resumeRuntime(resultRuntime,function(resultRuntime) {
                        onComplete(resultRuntime);
                    })
                } else {
                    onComplete(resultRuntime);
                }
            } else {

                let deviceInfo = thisRuntime.selectDeviceByFilter(deviceType,deviceAbility,packageInfo,deviceGroupID);
                if(deviceInfo) {
                    thisRuntime.createRuntimeOnDevice(deviceInfo,packageInfo,function(newRuntime) {
                        onComplete(newRuntime);
                    });
                } else {
                    console.log("cann't select device,need add new device!");
                }
            }
        }
        return ;
    }


    callFunc(functionName,args,selectKey,traceID,onComplete) {
        let thisRuntime = getCurrentRuntime();
        let rpc_args = arguments;
        let funcObj = BaseLib.parseFunctionName(functionName);
        if(funcObj.instanceID == null) {
            thisRuntime.selectTargetRuntime(funcObj.moduleID, selectKey, function (targetRuntime) {
                thisRuntime.postRPCCall(targetRuntime, functionName, rpc_args, traceID, onComplete);
            });
        } else {
            thisRuntime.getRuntimeInfo(funcObj.instanceID,function(targetRuntime){
                thisRuntime.postRPCCall(targetRuntime,functionName, rpc_args, traceID, onComplete);
            })
        }
    }

    postRPCCall(remoteRuntimeInfo,functionname,args,traceID,onComplete) {





        let postURL = schema + remoteRuntimeInfo.PostURL+"/rpc";
        let postBody = {};
        postBody.seq = BaseLib.createGUID();
        postBody.src = this.m_id;

        postBody.function_name = functionname;
        postBody.trace_id = traceID;
        postBody.args = BaseLib.encodeParamAsJson(args);

        BaseLib.postJSONCall(postURL,postBody,onComplete);
    }
}


class DeviceInfo {
    constructor(deviceID) {
        this.DeviceID = deviceID;
        this.InterfaceURL = "";
        this.IsOnline = false;
        this.Ability = [];
        this.Drivers = [];
        this.Type = "";
    }

    static getDeviceInfo(deviceID,onComplete) {

    }
}


class Device {
    constructor(deviceID) {
        this.m_id = deviceID;
        this.m_token = "";

        this.m_type = "";
        this.m_ability = [];
        this.m_drivers = [];
        this.m_interfaceURL = "";
        this.m_innerURL = "";

        this.meta = {};
        this.m_ownerUserID = "";
        this.m_ownerUserToken = "";
        this.m_ownerApps = {};
    }

    getDeviceID() {
        return this.m_id;
    }

    getAppHost(appid) {
        if(this.m_ownerApps) {
            try {
                let result = this.m_ownerApps[appid];
                if (result) {
                    return result.appHost;
                }
            }catch(err) {

            }
        }
        return this.m_ownerAppHost;
    }


    getAppRepositoryHost(appid) {
        if(this.m_ownerApps) {
            try {
                let result = this.m_ownerApps[appid];
                if (result) {
                    return result.repositoryHost;
                }
            }catch(err) {

            }
        }
        return this.m_ownerRepositoryHost;
    }

    getOwnerAppHost() {
        return this.m_owerAppHost;
    }


    getInterfaceURL() {
        return this.m_interfaceURL;
    }

    getAbility() {
        return this.m_ability;
    }
    getDeviceType() {
        return this.m_type;
    }



    getOwnerUserID() {
        return this.m_ownerUserID;
    }

    getOwnerUserToken() {
        return this.m_ownerUserToken;
    }

    setOwnerUserID(userID) {
        this.m_ownerUserID = userID;
    }

    getRuntimeRootDir() {
        return this.m_runtimeRootDir;
    }

    getInstalledDrivers() {
        return this.m_drivers;
    }

    isDriverInstalled(driverID) {
        let driverInfo = this.m_drivers[driverID];
        if(driverInfo) {
            if(driverInfo.state == "enable") {
                return true;
            }
        }

        return false;
    }
    loadFromConfig(configInfo) {

        this.m_id = configInfo.device_id;
        this.m_token = configInfo.device_token;

        this.m_interfaceURL = configInfo.device_interface+"/"+configInfo.device_id+"/";


        this.meta = configInfo.meta;

        this.m_type = configInfo.device_type;
        this.m_ability = configInfo.device_ability;

        this.m_drivers = configInfo.drivers;

        this.m_ownerAppHost = configInfo.owner_apphost;
        this.m_ownerApps = configInfo.owner_apps;

        this.m_runtimeRootDir = configInfo.runtime_root_dir;




        this.m_ownerUserID = configInfo.owner.user_id;
        this.m_ownerUserToken = configInfo.owner.user_token;
        return ErrorCode.RESULT_OK;
    }

    createDeviceInfo() {
        let result = new DeviceInfo(this.m_id);
        result.InterfaceURL = this.m_interfaceURL;
        result.IsOnline = true;
        result.Ability = this.m_ability.slice(0);
        result.Drivers = this.m_drivers;
        result.Type = this.m_type;
        return result;
    }

    static getCurrentDevice() {
        return Device._currentDevice;
    }

    static setCurrentDevice(theDevice) {
        Device._currentDevice = theDevice;
    }
}

Device._currentDevice = null;
Device.TYPE_PC_CLIENT = "pc_client";
Device.TYPE_PC_SERVER = "pc_server";
Device.TYPE_BROWSER_CLIENT = "browser_client";
Device.TYPE_MOBILE = "mobile_client";
Device.TYPE_PAD = "pad_client";
Device.TYPE_MOBILE_WX = "wx_client";

class OwnerUser {
    constructor(userID,userToken) {
        this.m_id = userID;
        this.m_token = userToken;

    }

    login(onComplete) {
        onComplete(this,ErrorCode.RESULT_OK);
    }

    getInstalledApplist() {
        return this.m_appList;
    }
}



class GlobalEventManager {

    isEventCreated(eventID) {
        let ri = getCurrentRuntime();
        let eventInfo = ri.getKnowledgeManager().getKnowledge("global.events");
        if(eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);
            if(eventObj) {
                return ErrorCode.RESULT_OK;
            } else {
                return ErrorCode.RESULT_NOT_FOUND;
            }
        } else {
            BX_LOG("global event root object is not exist,MUST create this node!!!");
            return ErrorCode.RESULT_UNKNOWN;
        }
    }

    attach(eventID,funcName,runtimeID,options,onComplete) {
        let ri = getCurrentRuntime();
        let eventInfo = ri.getKnowledgeManager().getKnowledge("global.events");

        if(eventInfo) {
            let eventObject = eventInfo.mapGet(eventID);
            if(eventObject) {
                eventObject.listeners[funcName] = {"from":getCurrentRuntime().getInstanceID()};

                eventInfo.mapSet(eventID,eventObject,function() {
                    onComplete();
                    BX_LOG("func:" + funcName + " attach to event:" + eventID + " OK.");
                });

            } else {
                BX_LOG("cann't read event info,eventID:" + eventID);
            }
        } else {
            BX_LOG("cann't read event info,eventID:" + eventID);
        }
    }

    remove(eventID,funcName,options,onComplete) {
        let ri = getCurrentRuntime();
        let eventInfo = ri.getKnowledgeManager().getKnowledge("global.events");

        if(eventInfo) {
            let eventObject = eventInfo.mapGet(eventID);
            if(eventObject) {
                if(eventObject.listeners[funcName]) {
                    delete eventObj.listeners[funcName];

                    eventInfo.mapSet(eventID, eventObject, function () {
                        onComplete();
                        BX_LOG("func:" + funcName + " remove from event:" + eventID + " OK.");
                    });
                } else {
                    BX_LOG("func:" + funcName + " not attched to event:" + eventID);
                }

            } else {
                BX_LOG("cann't read event info,eventID:" + eventName);
            }
        } else {
            BX_LOG("cann't read event info,eventID:" + eventName);
        }
    }

    createEvent(eventID,onComplete) {
        let ri = getCurrentRuntime();
        let eventInfo = ri.getKnowledgeManager().getKnowledge("global.events" );
        if(eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);

            if(eventObj) {
                BX_LOG("cann't create event,eventID:" + eventID);
                return ErrorCode.RESULT_ALREADY_EXIST;
            } else {
                let eventObj = {};
                eventObj.ID = eventID;
                eventObj.listeners = {};
                eventInfo.mapSet(eventID,eventObj,function () {

                    BX_LOG("event " + eventID + " created.")
                    onComplete(ErrorCode.RESULT_OK);
                });

                return ErrorCode.RESULT_OK;
            }
        } else {
            BX_LOG("global event root object is not exist,MUST create this node!!!");
            return ErrorCode.RESULT_UNKNOWN;
        }
    }

    removeEvent(eventID) {
        let ri = getCurrentRuntime();
        let eventInfo = ri.getKnowledgeManager().getKnowledge("global.events" );
        if(eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);

            if(eventObj) {
                eventObj.mapSet(eventID,null);
                BX_LOG("event " + eventID + " removed.");
                return ErrorCode.RESULT_OK;
            } else {
                return ErrorCode.RESULT_NOT_FOUND;
            }
        } else {
            BX_LOG("global event root object is not exist,MUST create this node!!!");
            return ErrorCode.RESULT_UNKNOWN;
        }
    }

    fireEvent(eventID,params,options) {
        let ri = getCurrentRuntime();
        let eventInfo = ri.getKnowledgeManager().getKnowledge("global.events");
        if(eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);
            if(eventObj) {
                for(let functionName in eventObj.listeners) {
                    ri.callFunc(functionName,params,null,"",function(){});
                }
            }
        } else {
            BX_LOG("cann't read event info,eventID:" + eventName);
        }
    }

    static getInstance() {
        if(GlobalEventManager.s_theOne == null) {
            GlobalEventManager.s_theOne = new GlobalEventManager();
        }

        return GlobalEventManager.s_theOne;
    }
}

GlobalEventManager.s_theOne = null;



module.exports = {};
module.exports.BaseLib = BaseLib;
module.exports.ErrorCode = ErrorCode;
module.exports.BX_LOG = BX_LOG;
module.exports.BX_INFO = BX_INFO;
module.exports.BX_WARN = BX_WARN;
module.exports.BX_DEBUG = BX_DEBUG;
module.exports.BX_ERROR = BX_ERROR;
module.exports.BX_CHECK = BX_CHECK;
module.exports.Application = Application;
module.exports.getCurrentRuntime = getCurrentRuntime;
module.exports.getCurrentApp = getCurrentApp;
module.exports.XARPackage = XARPackage;
module.exports.RuntimeInstance = RuntimeInstance;
module.exports.RuntimeInfo = RuntimeInfo;
module.exports.Device = Device;
module.exports.DeviceInfo = DeviceInfo;
module.exports.OwnerUser = OwnerUser;
module.exports.KnowledgeManager = KnowledgeManager;
module.exports.GlobalEventManager = GlobalEventManager;
module.exports.initCurrentRuntime = initCurrentRuntime;

module.exports.Zip = Zip;
module.exports.Repository = Repository;
module.exports.BX_REPOSITORY_REMOTE = BX_REPOSITORY_REMOTE;
module.exports.BX_REPOSITORY_LOCAL = BX_REPOSITORY_LOCAL;
module.exports.BX_REPOSITORY_FAKE = BX_REPOSITORY_FAKE;
