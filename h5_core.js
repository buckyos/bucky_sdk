"use strict";



var EVAL_ENABLE = true


const LOG_LEVEL_ALL = 0;
const LOG_LEVEL_TRACE = 1;
const LOG_LEVEL_DEBUG = 2;
const LOG_LEVEL_INFO = 3;
const LOG_LEVEL_WARN = 4;
const LOG_LEVEL_ERROR = 5;
const LOG_LEVEL_FATAL = 6;
const LOG_LEVEL_OFF = 7;


var BX_UID_TYPE_CORE = "CORE";
var BX_UID_TYPE_APP = "APP";
var BX_UID_TYPE_DEVELOPER = "DEV";
var BX_UID_TYPE_RUNTIME = "RTM";



var BX_RUNTIME_LEVEL = 4;


function assert(val) {}
function BX_CHECK(cond) {
    return;
}

var log_level = LOG_LEVEL_ALL;

function BX_SetLogLevel(level) {
    log_level = level;



}

function BX_LOGIMPL(level, levelname, logs) {
    if (level >= log_level) {
        var args = [].slice.call(logs, 0);
        args.unshift('['+levelname+']');
        console.log.apply({}, args)
    }
}

function BX_LOG() {



    BX_LOGIMPL(LOG_LEVEL_INFO, 'INFO', arguments);

}

function BX_DEBUG() {



    BX_LOGIMPL(LOG_LEVEL_DEBUG, 'DEBUG', arguments);

}

function BX_TRACE() {



    BX_LOGIMPL(LOG_LEVEL_TRACE, 'TRACE', arguments);

}

function BX_INFO() {



    BX_LOGIMPL(LOG_LEVEL_INFO, 'INGO', arguments);

}

function BX_WARN() {



    BX_LOGIMPL(LOG_LEVEL_WARN, 'WARN', arguments);

}

function BX_ERROR() {



    BX_LOGIMPL(LOG_LEVEL_ERROR, 'ERROR', arguments);

}

class BaseLib {
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

    static getNow() {
        return new Date().getTime();
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


    static readCookie() {
        let result = {};
        let cookies = document.cookie.split(';');

        for(let i=0;i<cookies.length;i++) {
            let oneCookie =cookies[i].split('=');
            result[oneCookie[0]] = oneCookie[1];
        }

        return result;
    }

    static writeCookie(cookies,exptime) {
        let result = "";

        for(let cookieID in cookies) {
            let thisValue = cookieID + "=" + cookies[cookieID] + ";";
            result += thisValue;
        }

        if(exptime != null) {
            result += "expires=" + exptime.toGMTString(); + ";";
        }
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

    static privateEncrypt( private_key, text) {
        return crypto.privateEncrypt(private_key, Buffer.from(text))
            .toString('base64');
    }

    static publicDecrypt( public_key, ciphertext) {
        return crypto.publicDecrypt(public_key, Buffer.from(ciphertext, 'base64'))
            .toString();
    }


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
                    BX_WARN("load err: "+responseText);
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
                BX_INFO("loadJSONFrom:" + jsonURL + " error:" + errorCode);
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
    static inArray(arr, obj) {
        var i = arr.length;
        while (i--) {
            if (arr[i] === obj) {
                return true;
            }
        }
        return false;
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
        BaseLib.postData(postURL,strPostBody,function(strResp, status, errCode) {
            let jsonResp = null;
            if (strResp) {
                jsonResp = JSON.parse(strResp);
            }

            onComplete(jsonResp, status, errCode);
        });
    }



    static postJSONEx(postURL,postBody,onComplete) {
        let strPostBody = JSON.stringify(postBody);
        let header = {"Content-Type":"application/json"};
        BaseLib.postDataEx(postURL,header,strPostBody,function(strResp, status, errCode) {
            onComplete(strResp, status, errCode);
        });
    }

    static isJSONEmpty(jsonObj) {
        return (Object.keys(jsonObj).length == 0);
    }


    static postData(postURL,postBody,onComplete) {



        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if(xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    let strResp= xmlhttp.responseText;
                    onComplete(strResp, 200, ErrorCode.RESULT_OK);
                } else {
                    onComplete(null, xmlhttp.status, ErrorCode.RESULT_OK);
                }
            }
        };

        xmlhttp.ontimeout = function (e) {
            onComplete(null, -1, ErrorCode.RESULT_TIMEOUT);
        };

        xmlhttp.open("POST",postURL,true);
        xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        xmlhttp.send(postBody);

    }



    static postDataEx(postURL,headers,postBody,onComplete) {



        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if(xmlhttp.readyState == 4) {
                onComplete(xmlhttp.responseText, xmlhttp.status, ErrorCode.RESULT_OK);
            }
        };

        xmlhttp.ontimeout = function (e) {
            onComplete(null, -1, ErrorCode.RESULT_TIMEOUT);
        };

        xmlhttp.open("POST",postURL,true);
        for (let key in headers) {
            xmlhttp.setRequestHeader(key, headers[key]);
        }
        xmlhttp.send(postBody);

    }


    static getData(postURL,onComplete) {



        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if(xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    onComplete(xmlhttp.responseText, 200, ErrorCode.RESULT_OK);
                } else {
                    onComplete(null, xmlhttp.status, ErrorCode.RESULT_OK);
                }
            }
        };

        xmlhttp.ontimeout = function (e) {
            onComplete(null, -1, ErrorCode.RESULT_TIMEOUT);
        };

        xmlhttp.open("GET",postURL,true);
        xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
        xmlhttp.send(null);

    }


    static postJSONCall(postURL,postBody,onComplete) {

        BaseLib.postJSON(postURL,postBody,function (jsonResp,resultCode) {
            if(jsonResp) {
                let result = BaseLib.decodeResultFromJSON(jsonResp);

                if (result.seq == postBody.seq && result.errorCode == 0) {
                    onComplete(result.result);
                } else {
                    onComplete(null,result.errorCode,result);
                }
            } else {
                onComplete(null,resultCode,null);
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

    static createUID(typeid,levelid,parentid=""){

        let guid = BaseLib.createGUID();
        return typeid+'@'+levelid+'@'+guid+'@'+parentid;
    }

    static decodeUID(uid){
        let infos = uid.split('@');
        return {typeid:infos[0],levelid:infos[1],guid:infos[2],parentid:infos[3]}
    }

    static getStack(callee) {
        var old = Error.prepareStackTrace;
        Error.prepareStackTrace = function (error, stack) {
            return stack;
        };

        let err = new Error();
        Error.captureStackTrace(err, callee);
        var stack = err.stack;
        Error.prepareStackTrace = old;

        return stack;
    }

    static getPos(callee, frameIndex) {
        let stack = BaseLib.getStack(callee);
        let frame = stack[frameIndex];
        let pos = {
            "line": frame.getLineNumber(),
            "file": frame.getFileName(),
            "func": frame.getFunctionName(),
        };
        if (pos.file == undefined) {
            pos.file = "undefined";
        } else if (typeof(pos.file) == 'string') {
            pos.file = path.basename(pos.file);
        }

        return pos;
    }


    static getUrlFromNodeInfo(nodeInfo) {

        try {
            if (!nodeInfo || !nodeInfo.category || !nodeInfo.id) {
                BX_INFO("Get url from nodeInfo failed. nodeinfo:"+(nodeInfo ? JSON.stringify(nodeInfo) : "null"));
                return null;
            }







            let schema = "http://";

            if (nodeInfo.category == "bus") {
                schema = "ws://";
            }
            let path = nodeInfo.category;
            if (nodeInfo.category != "device" && nodeInfo.appid) {
                path = nodeInfo.appid;
            }
            let domain = BaseLib.domianConfig[nodeInfo.category];
            let address = schema+domain+"/"+path+"/"+nodeInfo.id;
            if(nodeInfo.category == "bus") {
                address += "/";
            }
            if (nodeInfo.path) {
                address += "/"+nodeInfo.path;
            }
            BX_INFO("Get url from nodeInfo:"+JSON.stringify(nodeInfo)+", address:"+address);
            return address;

        } catch(err) {
            BX_INFO("Get url from nodeInfo:"+JSON.stringify(nodeInfo)+" failed. err:"+err);
            return null;
        }

    }

    static getNodeInfoFromUrl(url) {

    }
}
BaseLib.domianConfig = {
    "services" : "dev.tinyappcloud.com",
    "device" : "dev.tinyappcloud.com",
    "runtime" : "runtimes.tinyappcloud.com",
    "bus" : "buses.tinyappcloud.com"
}

class ErrorCode {
    static getErrorDesc(errorCode) {

    }
}


ErrorCode.RESULT_OK = 0;
ErrorCode.RESULT_TIMEOUT = 1;
ErrorCode.RESULT_WAIT_INIT = 2;
ErrorCode.RESULT_ERROR_STATE = 3;
ErrorCode.RESULT_INVALID_TYPE = 4;
ErrorCode.RESULT_SCRIPT_ERROR = 5;
ErrorCode.RESULT_NO_IMP = 6;
ErrorCode.RESULT_ALREADY_EXIST = 7;
ErrorCode.RESULT_NEED_SYNC = 8;
ErrorCode.RESULT_NOT_FOUND = 9;
ErrorCode.RESULT_EXPIRED = 10;

ErrorCode.RESULT_UNKNOWN = 255;

class NodeInfo {
    constructor() {
        this.id = ""
        this.type = ""
        this.interfaces = [];


    }
}
class Application {

    constructor() {
        this.state = Application.APP_STATE_UNKNOWN;
        this.meta = null;
        this.repositoryList = [];

    }

    init(metaInfo,onInitComplete) {
        console.log("app metaInfo:", metaInfo);
        BX_INFO("Application::init");

        if(this.state != Application.APP_STATE_UNKNOWN)
        {
            BX_ERROR("cann't init Application from other state");
            return [ErrorCode.RESULT_ERROR_STATE,"error state"];
        }
        this.state = Application.APP_STATE_INITING;
        this.meta = metaInfo;
        this.appid = metaInfo.appid;
        this.appHost = metaInfo.appHost;
        this.knowledgeHost = metaInfo.knowledgeHost;
        this.schedulerHost = metaInfo.schedulerHost;
        this.repositoryList.push(metaInfo.repositoryHost);
        this.logHost = metaInfo.logHost;


        onInitComplete(ErrorCode.RESULT_OK,this.meta);
        return [ErrorCode.RESULT_OK,"OK"];
    }

    getID() {
        return this.appid;
    }





    getKnowledgeHost() {
        return this.knowledgeHost;
    }

    getLogHost() {
        return this.logHost;
    }

    setLogHost() {
        this.logHost;
    }

    getSchedulerHost(){
        return this.schedulerHost;
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
"use strict";

var KRESULT = {
    "SUCCESS": 0,
    "FAILED": 1,
    "INVALID_PARAM": 2,
    "NOT_FOUND": 3,
    "INVALID_TYPE": 4,
    "INVALID_TOKEN": 5,
    "INVALID_SESSION": 6,
    "INVALID_FORMAT": 7,
    "INVALID_CMD": 8,
    "TIMEOUT": 9,
    "AUTH_FAILED": 10,
    "UNMATCH_VERSION": 11,
    "ALREADY_EXISTS": 12,
    "NOT_EMPTY": 13,
    "HIT_LIMIT": 14,
    "PERMISSION_DENIED" : 15,
}

class KServerLimitsChecker {
    static CheckKey(key) {
        if (key.length > 1024) {

        }
    }
}

class KServerRequest {
    constructor(appid, token, seq) {
        this.m_appid = appid;
        this.m_token = token;
        this.m_seq = seq;

        this.m_readList = [];
        this.m_readListCB = [];

        this.m_writeList = [];
        this.m_writeListCB = [];

        this.m_watchList = [];
        this.m_watchListCB = [];
    }

    GetSeq() {
        return this.m_seq;
    }


    CheckKey(key) {
        return true;
    }
    CheckHashKey(hkey) {
        return true;
    }


    GetValue(key, ver, OnResponse) {
        const req = {
            "type": "kvp",
            "key": key,
            "ver": ver
        };

        this.m_readList.push(req);
        this.m_readListCB.push(function(resp) {

            if (typeof resp != 'number') {
                assert(resp.key === key);
                OnResponse(resp.ret, resp.key, resp.value, resp.ver);
            } else {
                OnResponse(resp, key, null, ver);
            }
        });
    }



    GetHashValue(key, hkey, ver, OnResponse) {
        const req = {
            "type": "hash",
            "key": key,
            "ver": ver
        };

        if (hkey != null) {
            req.hkey = hkey;
        }

        this.m_readList.push(req);
        this.m_readListCB.push(function(resp) {

            if (typeof resp != 'number') {
                assert(resp.key === key);
                OnResponse(resp.ret, resp.key, resp.hkey, resp.value, resp.ver);
            } else {
                OnResponse(resp, key, hkey, null, ver);
            }
        });
    }



    SetValue(key, value, ver, OnResponse) {
        return this.SetValueEx(key, value, { "ver": ver }, OnResponse);
    }







    SetValueEx(key, value, options, OnResponse) {
        const req = {
            "type": "kvp",
            "key": key,
        };

        if (value != null) {
            req.value = value;
        }
        if (options.hasOwnProperty("ver")) {
            req.ver = options.ver;
        }
        if (options.hasOwnProperty("mode")) {
            req.mode = options.mode;
        }

        this.m_writeList.push(req);
        this.m_writeListCB.push(function(resp) {
            if (typeof resp != 'number') {
                assert(resp.key === key);
                OnResponse(resp.ret, resp.key, resp.ver);
            } else {
                OnResponse(resp, key, options.ver);
            }
        });
    }




    SetHashValue(key, hkey, value, ver, OnResponse) {
        return this.SetHashValueEx(key, hkey, value, { "ver": ver }, OnResponse);
    }

    SetHashValueEx(key, hkey, value, options, OnResponse) {
        const req = {
            "type": "hash",
            "key": key,
        };

        if (hkey != null) {
            req.hkey = hkey;
        }
        if (value != null) {
            req.value = value;
        }

        if (options.hasOwnProperty("ver")) {
            req.ver = options.ver;
        }
        if (options.hasOwnProperty("mode")) {
            req.mode = options.mode;
        }

        this.m_writeList.push(req);
        this.m_writeListCB.push(function(resp) {


            if (typeof resp != 'number') {
                assert(resp.key === key);
                OnResponse(resp.ret, resp.key, resp.hkey, resp.ver);
            } else {
                OnResponse(resp, key, hkey, options.ver);
            }
        });
    }




    WatchKey(key, eventList, OnResponse) {
        const req = {
            "type": "kvp",
            "key": key,
            "events": eventList,
        };

        this.m_watchList.push(req);
        this.m_watchListCB.push(function(resp) {
            if (typeof resp != 'number') {
                assert(resp.key === key);
                OnResponse(resp.ret, resp.key, resp.events);
            } else {
                OnResponse(resp, key, []);
            }
        });
    }




    WatchHashKey(key, hkey, eventList, OnResponse) {
        const req = {
            "type": "hash",
            "key": key,
            "events": eventList,
        };

        if (hkey != null) {
            req.hkey = hkey;
        }

        this.m_watchList.push(req);
        this.m_watchListCB.push(function(resp) {
            if (typeof resp != 'number') {
                assert(resp.key === key);
                OnResponse(resp.ret, resp.key, resp.hkey, resp.events);
            } else {
                OnResponse(resp, key, hkey, []);
            }
        });
    }
    Encode(tcp) {
        const request = {
            "cmd": "req",
            "seq": this.m_seq,
            "appid": this.m_appid,
            "token": this.m_token,
            "ver": 1,
        };

        if (this.m_readList.length > 0) {
            request.read = this.m_readList;
        }

        if (this.m_writeList.length > 0) {
            request.write = this.m_writeList;
        }

        if (this.m_watchList.length > 0) {
            request.watch = this.m_watchList;
        }


        const reqData = JSON.stringify(request);

        if (tcp) {
            let header = new kprotocol.KServerPackageHeader();
            header.m_cmdType = kprotocol.KSERVER_PROTOCOL_CMD.REQ;

            let encodeData = kprotocol.KServerPackageCodec.Encode({
                "header": header,
                "data": reqData
            });

            return encodeData;
        } else {
            return reqData;
        }
    }


    Response(respObj) {


        if (this.m_readListCB.length > 0) {
            let ret;
            if (typeof respObj === 'number') {
                ret = respObj;
            } else if (typeof respObj === "object") {
                if (respObj.hasOwnProperty("ret") && respObj.ret !== 0) {
                    ret = respObj.ret;
                } else {
                    ret = respObj.read;
                }
            } else {
                ret = KRESULT.FAILED;
            }
            this.ResponseList(this.m_readListCB, ret);
        }

        if (this.m_writeListCB.length > 0) {
            let ret;
            if (typeof respObj === 'number') {
                ret = respObj;
            } else if (typeof respObj === "object") {
                if (respObj.hasOwnProperty("ret") && respObj.ret !== 0) {
                    ret = respObj.ret;
                } else {
                    ret = respObj.write;
                }
            } else {
                ret = KRESULT.FAILED;
            }
            this.ResponseList(this.m_writeListCB, ret);
        }

        if (this.m_watchListCB.length > 0) {
            let ret;
            if (typeof respObj === 'number') {
                ret = respObj;
            } else if (typeof respObj === "object") {
                if (respObj.hasOwnProperty("ret") && respObj.ret !== 0) {
                    ret = respObj.ret;
                } else {
                    ret = respObj.watch;
                }
            } else {
                ret = KRESULT.FAILED;
            }
            this.ResponseList(this.m_watchListCB, ret);
        }
    }


    ResponseList(cbList, respList) {
        for (let i = 0; i < cbList.length; ++i) {
            let cb = cbList[i];
            if (!cb) {

                continue;
            }

            let resp;
            if (typeof respList === 'object') {
                resp = respList[i];
            } else if (typeof respList === 'number') {
                resp = respList;
            } else {
                resp = KRESULT.NOT_FOUND;
            }

            cb(resp);
        }
    }
}
class KServerXHRClient {
    constructor(options) {

        this.m_options = options;
        this.m_nextSeq = 16;
    }

    NewRequest() {
        const seq = this.m_nextSeq;
        this.m_nextSeq++;

        let req = new KServerRequest(this.m_options.appid, this.m_options.token, seq);
        return req;
    }

    Request(request, OnCompete) {
        let encodeData = request.Encode(false);
        if (!encodeData) {
            return false;
        }

        BaseLib.postData(this.m_options.url,encodeData,function(bodyString,errorCode) {
            if (errorCode == 200) {
                let respObj;
                try {
                    respObj = JSON.parse(bodyString);
                } catch (e) {
                    respObj = null;
                }

                if (!respObj) {
                    request.Response(KRESULT.INVALID_FORMAT);
                } else {
                    request.Response(respObj);
                }
            } else {

                BX_INFO("error request code:" + errorCode);
                request.Response(KRESULT.FAILED);
            }
        });

        return true;
    }
}

class Authentication {
    constructor(client_private_key, client_public_key,
                ca_server='http://106.75.152.88:3000',
                login_server='http://106.75.152.88:3000',
                options={}) {
        let {filePath} = options;
        if (filePath) {
            this.private_key = fs.readFileSync(client_private_key, "utf8");
            this.public_key = fs.readFileSync(client_public_key, "utf8");

        } else {
            this.private_key = client_private_key;
            this.public_key = client_public_key;
        }
        this.ca_server = ca_server;
        this.login_server = login_server;
    }

    signup(uid, onComplete, extra_info={}) {
        let pk = this._genPk();
        let origin_pk = pk;
        let {password, meta} = extra_info;
        let sn = BaseLib.createGUID();

        this._postJSON(this.ca_server + '/register',
                       {
                           uid,
                           pk,
                           password,
                           sn,
                           meta
                       },
                       resp => {
                           let {uid, pk, result, msg} = resp;
                           if (result !== ErrorCode.RESULT_OK) {
                               console.error('singup error: ', result, msg);
                               onComplete({result, msg});
                               return;
                           }
                           this._signinWithSignedPk({uid, signed_pk: pk, pk: origin_pk}, onComplete);
                       });
    }

    signin(uid, onComplete, extra_info={}) {
        let {signed_pk, pk} = extra_info;
        if (pk && signed_pk) {
            this._signinWithSignedPk({uid, signed_pk, pk}, onComplete);
        } else {
            this.updateInfo(uid, null, {}, info => this._signinWithSignedPk(info, onComplete));
        }
    }

    updateInfo(uid, pk=null, user_info={}, onComplete=null) {
        let sn = BaseLib.createGUID();
        let key = this._genKey(uid, sn);

        let {public_key, private_key, password, levelid, meta} = user_info;
        let new_pk;
        if (public_key) {

            new_pk = this._genPk(public_key);
        } else if (pk == null) {

            new_pk = this._genPk();
        }
        let origin_pk = new_pk || pk;

        this._postJSON(this.ca_server + '/register',
                       {pk: new_pk || pk, levelid, password, sn, meta, uid, key},
                       resp => {
                           let {pk, uid, result, msg} = resp;
                           if (result !== ErrorCode.RESULT_OK) {
                               console.error('updateInfo error: ', result, msg);
                               onComplete({result, msg});
                               return;
                           };
                           let signed_pk = pk;

                           if (public_key) {
                               this.public_key = public_key;
                           }
                           if (private_key)
                               this.private_key = private_key;

                           if (onComplete)
                               onComplete({uid, pk: origin_pk, signed_pk: signed_pk, result: 0});
                       });
    }

    checkToken(uid, token, onComplete) {
        this._postJSON(this.login_server + '/checktoken',
                       {uid, token},
                       resp => {
                           let {result, uid, expireAt, msg} = resp;
                           if (result !== ErrorCode.RESULT_OK) {
                               console.error('checktoken error: ', result, msg);
                               onComplete({result, msg});
                               return;
                           };
                           onComplete({result, uid, expireAt, msg});


                       });
    }

    _signinWithSignedPk(info={}, onComplete) {
        let {uid, signed_pk, pk} = info;
        if (uid && signed_pk && pk) {
            let sn = BaseLib.createGUID();
            let key = this._genKey(uid, sn);
            this._postJSON(this.login_server + '/login',
                           {
                               uid,
                               sn,
                               key,
                               pk: signed_pk
                           },
                           resp => {
                               let {result, token, msg} = resp;
                               if (result != ErrorCode.RESULT_OK) {
                                   console.error('signinWithSignedPk error: ', result, msg);
                               }
                               onComplete(Object.assign(info, {token, result, msg}));
                           });
        } else {
            throw 'miss `uid` or `signed_pk` before login.';
        }
    }

    _genKey(uid, sn) {
        return BaseLib.privateEncrypt(this.private_key,
                                      BaseLib.md5(`${uid},${sn}`));
    }

    _genPk(public_key=null) {
        let create_time = Math.floor(Date.now() / 1000);
        let expire_time = create_time + 24*3600*30;
        return `${public_key || this.public_key},${create_time},${expire_time}`;
    }

    _postJSON(url, data, onComplete) {
        BaseLib.postJSONEx(url, data, (resp, status, errCode) => {
            let json_data;
            if (errCode !== ErrorCode.RESULT_OK) {
                onComplete({result: errCode, msg: resp});
                return;
            } else if (status !== 200) {
                onComplete({result: status, msg: resp});
                return;
            } else {
                try {
                    json_data = JSON.parse(resp);
                    if (typeof(json_data) !== 'object') {
                        onComplete({result: ErrorCode.RESULT_INVALID_TYPE, msg: resp});
                        return;
                    }
                } catch(e) {
                    onComplete({result: ErrorCode.RESULT_INVALID_TYPE, msg: resp});
                    return;
                }
            }
            onComplete(json_data);
        });
    }
}






class InfoNode {
    constructor(km,key,type) {

        this._owner = km;
        this._nodeKey =key;
        this._type = type;

        this._version = -1;
        this._lastUpdate = 0;

        this._cacheObject = null;
        this._cacheMap = null;
        this._cacheMapInfo = null;
        this._onComplete = null;
        this._state = InfoNode.STATE_INIT;
    }

    _show() {
        let info = {}
        info._nodeKey = this._nodeKey;
        info._type = this._type;
        info._version = this._version;
        info._lastUpdate = this._lastUpdate;
        info._cacheObject = this._cacheObject;
        info._cacheMap = this._cacheMap;
        info._cacheMapInfo = this._cacheMapInfo;
        info._state = this._state;
        console.log(JSON.stringify(info));
    }
    sync(onComplete) {
        let thisNode = this;




        let request = thisNode._owner._client.NewRequest();
        if(thisNode._type == InfoNode.TYPE_MAP) {
            request.GetHashValue(thisNode._nodeKey,null,-1,function(ret, key, hkey, valueList, ver) {
                if(ret == ErrorCode.RESULT_OK) {



                    let valueArray = valueList.split(",");

                    thisNode._cacheMap = {};
                    thisNode._cacheMapInfo = {};
                    thisNode._lastUpdate = BaseLib.getNow();
                    thisNode._version = ver;
                    thisNode._state = InfoNode.STATE_NORMAL;

                    let request2 = thisNode._owner._client.NewRequest();
                    let completeNum = 0;






                    if(valueList.length > 0) {
                        for(let i=0;i<valueArray.length;++i) {
                            request2.GetHashValue(thisNode._nodeKey,valueArray[i],ver,function(ret, key, hkey, valueList, ver) {

                                let truehkey = decodeURIComponent(hkey);
                                if(ret == ErrorCode.RESULT_OK) {
                                    try {
                                        thisNode._cacheMap[truehkey] = JSON.parse(valueList);
                                    } catch(e) {
                                        console.error('knowledge:sync error: ', e, valueList);
                                    }
                                    thisNode._cacheMapInfo[truehkey] = {"version":ver};
                                }
                                completeNum ++ ;
                                if(completeNum == valueArray.length) {

                                    thisNode._state = InfoNode.STATE_NORMAL;
                                    onComplete(thisNode,ErrorCode.RESULT_OK);
                                }
                            })

                            request2.WatchHashKey(thisNode._nodeKey,valueArray[i],["change"],function() {
                                return;
                            });
                        }
                    } else {




                        thisNode._owner._client.Request(request2);

                        onComplete(thisNode,ErrorCode.RESULT_OK);
                        return;
                    }





                    thisNode._owner._client.Request(request2);

                } else {

                    onComplete(thisNode,ret);
                }
            });



            thisNode._owner._client.Request(request);


        } else if(thisNode._type == InfoNode.TYPE_OBJECT) {
            request.GetValue(thisNode._nodeKey,-1,function(ret,key,value,ver) {
                if(ret == ErrorCode.RESULT_OK) {
                    thisNode._cacheObject = JSON.parse(value);
                    thisNode._lastUpdate = BaseLib.getNow();
                    thisNode._version = ver;
                    thisNode._state = InfoNode.STATE_NORMAL;







                    onComplete(thisNode,ErrorCode.RESULT_OK)
                } else {
                    onComplete(thisNode,ErrorCode.RESULT_UNKNOWN);
                }
            });




            thisNode._owner._client.Request(request);

        }
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
                LOG_ERROR("read infonode " + this._nodeKey + " with error type." + this._type);
            }
        }

        return null;
    }



    objectUpdate(obj,onComplete) {
        let thisNode = this;
        if(this._state == InfoNode.STATE_NORMAL || this._state == InfoNode.STATE_LOCAL_CACHED) {
            if (this._type == InfoNode.TYPE_OBJECT) {
                let request = thisNode._owner._client.NewRequest();

                function onSetOK(ret,key,ver) {
                    if(ret == ErrorCode.RESULT_OK) {
                        thisNode._cacheObject = obj;
                        thisNode._version = ver;
                        thisNode._lastUpdate = BaseLib.getNow();
                        onComplete(thisNode,ErrorCode.RESULT_OK);
                    } else {
                        BX_WARN("update object " + thisNOde._nodeKey + " error:" + ret);
                        onComplete(thisNode,ret);
                    }
                }

                request.SetValue(thisNode._nodeKey,JSON.stringify(obj),thisNode._version,onSetOK);



                thisNode._owner._client.Request(request);

                return;
            }
        }
        LOG_ERROR("cann't update with error type or error state." + thisNode._nodeKey);
    }
    mapGet(key) {
        if(this._state == InfoNode.STATE_NORMAL || this._state == InfoNode.STATE_LOCAL_CACHED) {
            if(this._type == InfoNode.TYPE_MAP) {
                return this._cacheMap[key];
            }
        }
        LOG_ERROR("cann't get map " + this._nodeKey + " " + key);
        return null;
    }

    mapDelete(key,onComplete) {
        let thisNode = this;
        let request = thisNode._owner._client.NewRequest();
        function onSetOK(ret,nodeKey,hkey,ver) {
            if(ret == ErrorCode.RESULT_OK) {
                delete thisNode._cacheMap[hkey];
                delete thisNode._cacheMapInfo[hkey];
                if(onComplete) {
                    LOG_INFO("delete map " + nodeKey + " ok.");
                    onComplete(thisNode,ret,hkey);
                }
            } else {
                LOG_ERROR("delete map " + nodeKey+ " error:" + ret);
                onComplete(thisNode,ret,hkey);
            }
        }

        request.SetHashValue(thisNode._nodeKey,encodeURIComponent(key),null,-1,onSetOK);



        thisNode._owner._client.Request(request);

    }

    mapSet(key,object,onComplete) {
        let thisNode = this;
        if(this._state == InfoNode.STATE_NORMAL || this._state == InfoNode.STATE_LOCAL_CACHED) {
            if (this._type == InfoNode.TYPE_MAP) {
                let request = thisNode._owner._client.NewRequest();

                function onSetOK(ret,nodekey,hkey,ver) {

                    if(ret == ErrorCode.RESULT_OK) {
                        thisNode._cacheMap[key] = object;
                        thisNode._cacheMapInfo[key] = {"version":ver};
                        thisNode._version = ver;
                        thisNode._lastUpdate = BaseLib.getNow();

                        if(onComplete) {
                            onComplete(thisNode,ret,hkey);
                        }
                        LOG_INFO("update map " + thisNode._nodeKey + ":" + key +" OK,version:" + ver);
                    } else {
                        BX_WARN("update map " + thisNode._nodeKey + ":" + key +" error:" + ret + ",version:" + ver);
                        onComplete(thisNode,ret,hkey);
                    }
                }

                let keyVersion = -1;
                if(thisNode._cacheMapInfo[key]) {
                    keyVersion = thisNode._cacheMapInfo[key].version;
                }
                request.SetHashValue(thisNode._nodeKey,encodeURIComponent(key),JSON.stringify(object),-1,onSetOK);



                thisNode._owner._client.Request(request);

            }
        } else {
            LOG_ERROR("cann't update map " + key + ",error type or error state " + this._type + " " + this._state);
        }
    }


    mapGetClone() {
        if(this._state == InfoNode.STATE_NORMAL || this._state == InfoNode.STATE_LOCAL_CACHED) {
            if(this._type == InfoNode.TYPE_MAP) {
                return this._cacheMap;
            }
        }
    }

    mapClean(onComplete) {
        let thisNode = this;
        let request = thisNode._owner._client.NewRequest();
        function onCleanOK(ret,nodekey,hkey,ver) {
            if(ret == ErrorCode.RESULT_OK) {
                thisNode._cacheMap = {};
                thisNode._cacheMapInfo = {}
                thisNode._version = ver;
                thisNode._lastUpdate = BaseLib.getNow();

                if(onComplete) {
                    onComplete(thisNode,ret);
                }
            } else {
                LOG_ERROR("clean map " + thisNode._nodeKey + " error:" + ret);
                onComplete(thisNode,ret);
            }
        }

        request.SetHashValue(thisNode._nodeKey,null,null,-1,onCleanOK);



        thisNode._owner._client.Request(request);

    }
}

InfoNode.TYPE_OBJECT = 0;
InfoNode.TYPE_MAP = 1;
InfoNode.TYPE_LIST = 2;
InfoNode.TYPE_UNKNOWN = 255;

InfoNode.STATE_INIT = 0;
InfoNode.STATE_LOCAL_CACHED = 1;
InfoNode.STATE_NORMAL = 2;
InfoNode.STATE_SYNC = 3;
InfoNode.STATE_ERROR = 4;
class KnowledgeManager {
    constructor(kHost,appid,apptoken,timeout) {
        this._cacheNode = {};
        this._baseURL = kHost;
        this._depends = {};
        this._knowKnowledges = {};
        this._state = KnowledgeManager.STATE_NEED_SYNC;
        this._host = kHost;
        this._appid = appid;
        this._timeout = timeout;
        this._updateToken(apptoken);





    }
    _updateToken(newToken) {
        this._token = newToken;
        this._client = new KServerXHRClient({
            "url" : this._host,
            "appid" : this._appid,
            "token" : this._token,
            "timeout" : this._timeout
        });
        console.log(this._client);

    }

    getState() {
        return this._state;
    }
    dependKnowledge(key,nodeType,options) {
        this._knowKnowledges [key] = {"key":key,"nodeType":nodeType};
        let kinfo = {"key":key,"nodeType":nodeType,"isNeedSync":true,"options":options};;
        this._depends[key] = kinfo;
        if(this._state == KnowledgeManager.STATE_READY) {
            this._state = KnowledgeManager.STATE_NEED_SYNC;
        } else if(this._state== KnowledgeManager.STATE_SYNCING) {
            this._syncQueue.push(kinfo);
        }
    }

    ready(onReady) {
        let thisKM = this;
        if(this._state == KnowledgeManager.STATE_NEED_SYNC) {
            this._state = KnowledgeManager.STATE_SYNCING
            this._otherOnReady = new Array();
        } else if(this._state == KnowledgeManager.STATE_SYNCING){

            this._otherOnReady.push(onReady);
            return;
        } else {
            onReady(true);
            return;
        }

        function _startSync() {


            thisKM._syncQueue = [];
            for(let key in thisKM._depends) {
                let info = thisKM._depends[key];
                if(info.isNeedSync) {
                    thisKM._syncQueue.push(info);
                }
            }
            thisKM._depends = {};

            let km = thisKM;

            function doSync() {
                if(thisKM._syncQueue.length > 0) {
                    let _info = thisKM._syncQueue.pop();

                    let kInfo = new InfoNode(km,_info.key,_info.nodeType);


                    kInfo.sync(function(infoNode,resultCode) {
                        if(resultCode == ErrorCode.RESULT_OK) {
                            km._cacheNode[_info.key] = kInfo;

                        } else {
                            BX_WARN("sync knowledge " + infoNode._nodeKey + " return " + resultCode );
                        }
                        doSync();
                    })
                } else {
                    thisKM._state = KnowledgeManager.STATE_READY;
                    if(onReady) {
                        BaseLib.asynCall(function(){onReady(true)});
                    }
                    if(thisKM._otherOnReady) {
                        for(let i=0;i<thisKM._otherOnReady.length;++i) {
                            let onReadyFunc = thisKM._otherOnReady[i];
                            BaseLib.asynCall(function(){onReadyFunc(true)});
                        }
                    }
                    thisKM._otherOnReady = null;
                }
            }

            doSync();
        }
        _startSync();

    }

    addknowledgeKey(key,info) {
        this._cacheNode[key] = info;
    }

    removeknowledgeKey(key) {
        delete this._knowledge
    }

    _getRootKeyList(onComplete) {
        let request = this._client.NewRequest();
        request.GetHashValue(null,null,-1,function(ret, key, hkey, valueList, ver) {

            if(ret == 0) {
                onComplete(ret,valueList.split(","));
            } else {
                onComplete(ret,null);
            }
        });



        this._client.Request(request);

    }

    _createObjectKnowledge(kid,obj,onComplete) {
         let request = this._client.NewRequest();
         request.SetValue(kid,obj,-1,function(ret,key,ver) {
                if(ret != ErrorCode.RESULT_OK) {

                    onComplete(ret,key);
                } else {

                    onComplete(ret,key);
                }
        });



        this._client.Request(request);

    }

    _mapClean(kid,onComplete) {
        let request = this._client.NewRequest();

        function onCleanOK(ret,nodekey,hkey,ver) {
            if(ret == ErrorCode.RESULT_OK) {
                if(onComplete) {
                    onComplete(ret);
                }
            } else {

                onComplete(ret);
            }
        }

        request.SetHashValue(kid,null,null,-1,onCleanOK);



        this._client.Request(request);

    }

    _deleteObjectKnowledge(kid,onComplete) {
        let thisKM = this;
        let request = this._client.NewRequest();
        request.SetValue(kid,null,-1,function(ret,key,ver) {
            if(ret == ErrorCode.RESULT_OK) {
                let kInfo = thisKM._cacheNode[kid];
                if(kInfo) {
                    delete thisKM._cacheNode[kid];
                }
                onComplete(ret,key);
            } else {
                onComplete(ret,key);
            }
        });



        this._client.Request(request);

    }

    _createMapKnowledge(kid,onComplete) {
        let thisKM = this;
        let request = this._client.NewRequest();
        request.SetHashValue(kid,"fake","{}",-1,function(ret,key) {
            if(ret != ErrorCode.RESULT_OK) {
                onComplete(ret,key);
            } else {
                let request2 = thisKM._client.NewRequest();
                request2.SetHashValue(kid,"fake",null,-1,function(ret,key) {
                    onComplete(ret,key);
                });



                thisKM._client.Request(request2);

            }
        });



        thisKM._client.Request(request);

    }

    _deleteMapKnowledge(kid,onComplete) {
        let thisKM = this;
        let request = this._client.NewRequest();
        request.SetValue(kid,null,-1,function(ret) {
            if(ret == ErrorCode.RESULT_OK) {
                let kInfo = thisKM._cacheNode[kid];
                if(kInfo) {
                    delete thisKM._cacheNode[kid];
                }
                onComplete(ret,kid);
            } else {
                onComplete(ret,kid);
            }
        });



        this._client.Request(request);

    }

    getDependsKnowledgeInfo() {
        let result = {};
        for(let k in this._cacheNode) {
            let aNode = this._cacheNode[k];
            if(aNode) {
                result[k] = aNode._version;
            }
        }

        return result;
    }

    applyKnowledgeInfo(kmInfo,onComplete) {
        let ret = 0;
        let needSync = false;
        let result = {};


        onComplete();
        return null;


        for(let k in kmInfo) {
            let aNode = this._cacheNode[k];
            if(aNode) {
                if(aNode._version > kmInfo[k]) {

                    result[k] = aNode._version;
                    ret = ret +1;
                } else if(aNode._version < kmInfo[k]) {

                    this.dependKnowledge(k,aNode.getType(),null);
                    needSync = true;
                    ret = ret +1;
                }
            }
        }

        let trueOnComplete = null;
        if(ret == 0) {
            trueOnComplete = onComplete;
        }

        if(needSync) {
            this.ready(trueOnComplete);
        } else {
            if(trueOnComplete) {
                trueOnComplete();
            }
        }

        if(ret > 0) {

            return result;
        }
        return null;
    }

    getKnowledge(key) {
        let result = this._cacheNode[key];
        if(result) {
            if(result.getState() == InfoNode.STATE_NORMAL) {
                return result;
            }
        } else {
            if(this._knowKnowledges[key] == null) {
                LOG_ERROR("knowledge " + key + " is not in depends list!");
                return null;
            } else {
                BX_WARN(key + " is syning,wait for ready.");
            }
        }

        return null;
    }
}

KnowledgeManager.STATE_NEED_SYNC = 0;
KnowledgeManager.STATE_READY = 1;
KnowledgeManager.STATE_SYNCING = 2;

class RepositoryPuber{
    constructor(uid,traceId,token){

        this.uid = uid;
        this.traceid = traceId;
        this.token = token;
    }

    searchPackage(dir, result) {
        let self = this;
        let files = fs.readdirSync(dir);
        for (let index in files) {
            let filePath = dir + "/" + files[index];

            let info = fs.statSync(filePath);
            if(info.isDirectory()) {
               self.searchPackage(filePath,result);
            } else if(files[index] == "config.json") {

                result.push(dir);
            }
        }
    }

    searchJSFile(dir,result) {
        let self = this;
        let files = fs.readdirSync(dir);
        for (let index in files) {
            let filePath = dir + "/" + files[index];
            let file = files[index];

            let info = fs.statSync(filePath);
            if(info.isDirectory()) {
                searchJSFile(filePath,result);
            } else if(file.lastIndexOf(".js") == file.length - 3) {
                if(file.length > 3) {
                    result.push(filePath);
                }
            }
        }
    }

    checkAndShowPackageInfo(packageInfo) {
        let self = this;
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

    loadAppInfo(packagesDir, appConfigFile){
        let self = this;

        BX_INFO('->packagesDir:'+packagesDir);
        BX_INFO('->appConfigFile:'+appConfigFile);

        let errorNum = 0;
        let warNum = 0;
        let appInfo = null;

        try {
            appInfo = JSON.parse(fs.readFileSync(appConfigFile));
        } catch (err) {
            BX_INFO("->ERROR: Cann't read app info!");
            process.exit(1);
        }

        BX_INFO("->Start publish packages from " + packagesDir);
        let packageList = new Array();
        self.searchPackage(packagesDir,packageList);
        let willPubPackageList = new Array();


        BX_INFO('============');
        for(let i=0;i<packageList.length;++i) {

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
                if (!self.checkAndShowPackageInfo(packageInfo)) {
                    continue;
                }
            }


            let jsfiles = new Array();
            self.searchJSFile(packageDir, jsfiles);
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

    createPubPackage(packagesDir,appConfigFile,traceId,token,onSuccess){
        let self = this;


        let appInfo = self.loadAppInfo(packagesDir, appConfigFile);

        let pubPackage = {
           "ver":"1001",
           "appid":appInfo.app.appid,
           "uid":self.uid,
           "token":token?token:appInfo.app.token,
           "cmd":"pub",
           "traceid":traceId
        };

        let packageInfos = new Array();
        for(let i=0;i<appInfo.packages.length;++i){
            let pkg = appInfo.packages[i];
            packageInfos.push({
                "id":pkg.info.packageID,
                "ver":pkg.info.version==void 0?"":pkg.info.version,
                "relativepath":pkg.relativepath
            })
        }

        pubPackage.body = {

            "packages":packageInfos
        };



        let zip = new Zip();
        zip.loadFolderAsync(packagesDir,function(zipData){
            pubPackage.body.md5 = BaseLib.md5(zipData);
            pubPackage.body.length = zipData.length;
            pubPackage.body.type="zip";
            pubPackage.body.content = zipData;

            onSuccess(appInfo.app.repositoryHost, pubPackage);
        })
    }

    pub(packagesDir,appConfigFile,onComplete){
        if(!path.isAbsolute(packagesDir)){
            packagesDir = path.join(__dirname,packagesDir);
        }
        BX_INFO("packages dir:"+packagesDir);

        if(!path.isAbsolute(appConfigFile)){
            appConfigFile = path.join(__dirname,appConfigFile);
        }
        BX_INFO("appConfiFile:"+packagesDir);

        let self = this;

        if(!BaseLib.dirExistsSync(packagesDir)){
            BX_ERROR("ERROR: packagesDir is not exist:"+packagesDir);
            process.exit(1);
        }

        if (!BaseLib.fileExistsSync(appConfigFile)) {
            BX_ERROR("ERROR: appConfigFile is not exist:"+appConfigFile);
            process.exit(1);
        }

        self.createPubPackage(packagesDir,appConfigFile,self.traceId,self.token,function(host, pkg){
            BX_INFO("post pub request to host:"+host);
            self.pubImpl(host,packagesDir,appConfigFile,pkg,onComplete);
        });
    }
    pubImpl(host,packagesDir,appConfigFile,app,onComplete){
        BX_INFO("post to host:"+host);
        let self = this;
        BaseLib.postJSON(host,app,function(resp){
            console.log(resp);
            if( (resp!==null) && (resp.result===0) ){
                app.repositoryHost = host;
                onComplete(true, resp,app);
            }else{
                onComplete(false, resp,app);
            }
        });
    }


}

class RepositoryLoader {





    constructor(host,uid,appid,traceid,token){

        this.host = host;
        this.uid = uid;
        this.appid = appid;
        this.traceid = traceid;
        this.token = token;
    }

    loadPackage(packageid,packagever,onConfig,onComplete){
        let self = this;
        if(packagever==void 0){
            packagever = "";
        }
        self.loadFile(packageid,packagever,"config.json",function(ret,config){
            if(!ret){
                BX_ERROR("load config.json failed.");
                onComplete(false);
                return;
            }

            onConfig(config);

            let count = Object.keys(config.modules).length;
            let index = 0;
            let modules = {};
            for(let moduleKey in config.modules){
                let filename = config.modules[moduleKey];
                self.loadFile(packageid,packagever,filename,function(ret,module){
                    index++;
                    modules[moduleKey] = module;
                    if(index==count){
                        onComplete(true,config,modules);
                    }
                });
            }
        });
    }
    loadFile(packageid,packagever,filename,onComplete){
        let self = this;
        let host = self.host;

        let urlpath="";

        try{
            urlpath = url.parse(host).path;
        }catch(err){
            onComplete(false);
            return;
        }

        var resource='/1001/loadfile?';
        if(urlpath!=='/'){
            resource = urlpath+resource;
        }

        let query = "";

        try{
            query = url.resolve(host,
                resource
                +'appid='+encodeURIComponent(self.appid)
                +'&uid='+encodeURIComponent(self.uid)
                +'&token='+encodeURIComponent(self.token)
                +'&traceid='+encodeURIComponent(self.traceid)
                +'&packageid='+encodeURIComponent(packageid)
                +'&packagever='+encodeURIComponent(packagever)
                +'&filename='+encodeURIComponent(filename));

        }catch(err){
            onComplete(false);
            return;
        }


        BX_INFO(query);
        BaseLib.getData(query,function(resp,status){
            if( (resp!=(void 0)) && (resp!=null)){
                let ext = path.extname(filename);
                if(ext==".json"){
                    let obj = null;
                    try{
                        obj = JSON.parse(resp);
                        BX_INFO("load json:"+filename);
                        BaseLib.asynCall(function(){
                            onComplete(true,obj);
                        });
                    }catch(err){
                        BX_INFO("load json, parse failed:"+filename+", resp:"+resp+",err:"+err);
                        onComplete(false);
                    }

                }else if(ext==".js"){
                    try {
                        BX_INFO("load js:"+filename);

                        let thisModule = {};
                        let scriptContent = "(function(module) {\n" + resp +"\n})(thisModule);";
                        let funcResult = eval(scriptContent);
                        if(funcResult) {
                            thisModule.exports = funcResult;
                        }

                        BaseLib.asynCall(function(){
                            onComplete(true,thisModule.exports);
                        });
                    } catch(err) {
                        console.log(err);
                        onComplete(false);
                    }
                }else{
                    BX_ERROR("ERROR:UnKnown file type.")
                    onComplete(false);
                }
            }else{
                BX_ERROR("load file failed:"+status)
                onComplete(false);
            }
        });
    }

    loadPackageInfos(onComplete){
        let self = this;
        let req = {
            "ver":"1001",
            "appid":self.appid,
            "uid":self.uid,
            "token":self.token,
            "cmd":"loadpackgeInfos",
            "traceid":self.traceid
        }
        BaseLib.postJSON(self.host,req,function(resp){
            console.log("result:"+resp);
            if( (resp!==null) && (resp.result===0) ){
                onComplete(true,resp);
            }else{
                onComplete(false);
            }
        });
    }

    changePackageState(packageid,packagever,state,onComplete){
        let self = this;
        let req = {
            "ver":"1001",
            "appid":self.appid,
            "packageid":packageid,
            "packagever":packagever,
            "uid":self.uid,
            "token":self.token,
            "cmd":"changestate",
            "traceid":self.traceid,
            "state":state
        }
        BaseLib.postJSON(self.host,req,function(resp){
            if( (resp!==null) && (resp.result===0) ){
                onComplete(true);
            }else{
                onComplete(false);
            }
        });
    }



    getHeader(modulePath){
        let corejspath = path.relative(path.dirname(modulePath),__filename);
        let local_header = "\"use strict\";let _core = require(\""+corejspath+"\");let BaseLib = _core.BaseLib;let ErrorCode =_core.ErrorCode;let BX_INFO = _core.BX_INFO;let BX_CHECK = _core.BX_CHECK;let Application = _core.Application;let getCurrentRuntime = _core.getCurrentRuntime;let getCurrentApp = _core.getCurrentApp;let XARPackage = _core.XARPackage;let RuntimeInstance = _core.RuntimeInstance;let RuntimeInfo = _core.RuntimeInfo;let Device = _core.Device;let DeviceInfo = _core.DeviceInfo;let OwnerUser = _core.OwnerUser;let GlobalEventManager = _core.GlobalEventManager;let KnowledgeManager = _core.KnowledgeManager;";
        return local_header;
    }

    requireEx(modulePath){
        let scriptContent = fs.readFileSync(modulePath, "utf8");
        let newScriptContent = scriptContent.replace(/.use strict.;/, this.getHeader(modulePath));

        fs.writeFileSync(modulePath, newScriptContent);
        let m = require(modulePath);
        fs.writeFileSync(modulePath, scriptContent);

        return m;
    }

}

class Repository{
    static init(modulesDir){
        Repository.modulesDir = modulesDir;
    }
    static getLoader(host,uid,traceid,token,appid){
        let u = BaseLib.decodeUID(uid);
        let loader = new RepositoryLoader(host,uid,appid,traceid,token,Repository.modulesDir);
        return loader;
    }
    static getPuber(uid,traceId,token){
        let u = BaseLib.decodeUID(uid);
        if(u.typeid!==BX_UID_TYPE_DEVELOPER||u.levelid<5){
            BX_ERROR("ERROR:get puber failed, typeid:"+u.typeid+",levelid:"+u.levelid);
            return null;
        }

        let puber = new RepositoryPuber(uid,traceId,token,Repository.modulesDir);
        return puber;
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


        this.loader = Repository.getLoader(this.baseURL,ownerRuntime.getInstanceID(),"abc", ownerRuntime.getToken(),this.ownerAppID);

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







                this.loader.loadFile(this.m_packageInfo.packageID,this.m_packageInfo.version,moduleInfo.path,function(ret,module){
                    onComplete(module,ErrorCode.RESULT_OK);
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






    }


    setObject(objID,objItem,onComplete) {
        console.log("unreached!");

    }

    getObject(objID,onComplete) {
        console.log("unreached!");

    }

    removeObject(objID,onComplete) {
        console.log("unreached!");

    }

    isObjectExists(objID,onComplete) {
        console.log("unreached!");

    }
}



class RuntimeLocalStorage {

}
class Scheduler{
 constructor(host,uid,token,appid){
  this.host = host;
  this.uid = uid;
  this.token = token;
  this.appid = appid;
 }

 selectRuntime(packageInfo,deveiceInfo,callback){
  let req = {
   "cmd":"selectruntime",
   "uid":this.uid,
   "token":this.token,

   "appid":this.appid,
   "packageid":packageInfo.packageID,
   "packageinfo":packageInfo
  }

  if(deveiceInfo.devicegroupid){
   req.devicegroupid = deveiceInfo.devicegroupid
  }

  if(deveiceInfo.devicetype){
   req.devicetype = deveiceInfo.devicetype;
  }

  if(deveiceInfo.deviceability){
   req.deviceability = deveiceInfo.deviceability;
  }

  BX_INFO("do select runtime...")
  BaseLib.postJSON(this.host,req,function(resp){
   if( (resp!==null) && (resp.result===0) ){
                BX_INFO('select runtime success');
                callback(true,resp.runtime);
            }else{
                BX_ERROR('ERROR:select runtime failed.');
                callback(false);
            }
  })
 }

 selectBus(callback){
  let req = {
   "cmd":"selectbus",
   "uid":this.uid,
   "token":this.token,
   "appid":this.appid
  }

  BX_INFO("do select bus...");
  console.log(req);
  BaseLib.postJSON(this.host,req,function(resp){
   if( (resp!==null) && (resp.result===0) ){
                BX_INFO('select bus success');
                callback(true,resp.bus);
            }else{
                BX_ERROR('ERROR:select bus failed.');
                callback(false);
            }
  })
 }

 selectEvent(eventid,callback){
  let req = {
   "cmd":"selectevent",
   "uid":this.uid,
   "token":this.token,
   "appid":this.appid,
   "eventid":eventid
  }

  BX_INFO("do select event...");
  console.log(req);
  BaseLib.postJSON(this.host,req,function(resp){
   if( (resp!==null) && (resp.result===0) ){
                BX_INFO('select event success');
                callback(true,resp.event);
            }else{
                BX_ERROR('ERROR:select event failed.');
                callback(false);
            }
  })
 }

}







var currentTraceID = 1;


function initCurrentRuntime(theApp) {
    let cookies = BaseLib.readCookie();
    let needSaveCookie = false;

    function checkRuntimeID(rid,runtimeToken) {
        if(!rid) {
            return false;
        }

        if(!runtimeToken) {
            return false;
        }

        return true;
    }

    function createRuntimeID() {
        let runtimeID = BaseLib.createUID(BX_UID_TYPE_RUNTIME,BX_RUNTIME_LEVEL);
        let token = BaseLib.createGUID();
        return [runtimeID,token];
    }



    let runtimeID = cookies["runtime_id"];
    let token = cookies["runtime_token"];

    if(!checkRuntimeID(runtimeID,token)) {
        BX_ERROR("check runtime id failed,create new runtime");

        let rlist = createRuntimeID();
        runtimeID = rlist[0];
        token = rlist[1];

        cookies["runtime_id"] = runtimeID;
        cookies["runtime_token"] = token;
        needSaveCookie = true;
    }

    Application._currentRuntime = new RuntimeInstance(runtimeID,token,theApp);




    let deviceID = cookies["device_id"];
    let ownerUserID = cookies["owner_id"];

    if(!deviceID) {
        deviceID = BaseLib.createGUID();
        cookies["device_id"] = deviceID;
        needSaveCookie = true;
    }
    Application._currentRuntime.m_ownerDevice = new Device(deviceID);
    if(!ownerUserID) {
        ownerUserID = BaseLib.createGUID();
        cookies["owner_id"] = ownerUserID;
        needSaveCookie = true;
    }
    Application._currentRuntime.m_ownerDevice.m_type = "browser_client";
    Application._currentRuntime.m_ownerDevice.setOwnerUserID(ownerUserID);
    Application._currentRuntime.m_ownerDevice.loadFromCookie(theApp.getID());
    if(needSaveCookie) {
        let exptime = new Date();
        exptime.setDate(exptime.getDate() + 7);
        BaseLib.writeCookie(cookies,exptime);
    }

    BX_INFO("initCurrentRuntime OK.");
}
function getCurrentRuntime() {
    return Application._currentRuntime;
}

class RuntimeInfo {
    constructor(runtimeID) {
        this.id = runtimeID;
        this.appid = "";
        this.category = "runtime";
        this.addr = new Array();
        this.ownerDeviceID = "";
        this.ownerAppID = "";
        this.ownerAppHost = "";
        this.ability = new Array();
    }
}



class RuntimeInstance {
    constructor(runtimeID,runtimeToken,theApp) {
        this.m_app = theApp;
        this.m_id = runtimeID;
        this.m_token = runtimeToken;
        this.m_ability = new Array();
        this.m_runtimeDir = "";
        this.m_addr = new Array();

        this.m_packages = {};
        this.m_proxyPackages = {};
        this.m_ownerDevice = null;
        let ktoken = runtimeID+"|"+runtimeToken;
        this.m_knowledegeManager = new KnowledgeManager(theApp.getKnowledgeHost(),theApp.getID(),ktoken,5*1000);
        this.m_driverLoadRule = {};
        this.m_eventManager = null;


        this.m_allCaches = {};

        this.m_allStorages = {};
        this.m_allBindStoragePath = {};
        this.m_logger = null;

        let schedulerhost = theApp.getSchedulerHost();
        this.scheduler = new Scheduler("https://dev.tinyappcloud.com/services/scheduler",this.m_id,this.m_token,this.m_app.getID());
    }


    initWithInfo(info) {
        this.m_id = info.id;
        this.m_ability = info.ability.slice(0);
        this.m_addr =[];
        if (info.addr) {
            for (let i=0; i<info.addr.length;++i) {
                this.m_addr.push({"ip":info.addr[i].ip, "port":info.addr[i].port});
            }
        }
        if(info.storages) {
            if (info.storages.length > 0) {
                for(let i=0;i<info.storages.length;++i) {
                    let localPath = info.storagePath + info.storages[i];
                    this.bindRuntimeStorage(info.storages[i],localPath);
                    BX_INFO("**** will create storage:" + info.storages[i] + " at " + localPath);
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

    getToken() {
        return this.m_token;
    }

    setToken(newToken) {







        return "";

    }

    getID() {
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

        result.ownerDeviceID = this.m_ownerDevice.getDeviceID();
        result.appid = this.m_app.getID();

        result.ability = this.m_ability.slice(0);
        result.deviceType = this.m_ownerDevice.getDeviceType();
        if(this.m_allBindStoragePath) {
            result.storages = [];
            for(let gpath in this.m_allBindStoragePath) {
                result.storages.push(gpath);
            }
        }
        result.addr.push({"ip":this.m_addr[0].ip, "port":this.m_addr[0].port});

        result.isOnline = true;

        return result;
    }

    getGlobalEventManager() {
        if(this.m_eventManager == null) {
            this.m_eventManager = new GlobalEventManager(this.m_knowledegeManager);
        }
        return this.m_eventManager;
    }

    getKnowledgeManager () {
        return this.m_knowledegeManager;
    }

    getRuntimeCache(globalPath) {
        return this.m_allCaches[globalPath];
    }

    getRuntimeStorage(globalPath) {

        return this.m_allStorages[globalPath];
    }

    getLocalStorage() {
        return null;
    }

    enableRuntimeCache(globalPath) {
        if(this.m_allStorages[globalPath]) {
            return ErrorCode.RESULT_ALREADY_EXIST;
        }

        let newCache = new RuntimeCache(this);
        this.m_allCaches[globalPath] = newCache;
        return ErrorCode.RESULT_OK;
    }

    enableRuntimeStorage(globalPath) {
        let localPath = this.m_allBindStoragePath[globalPath];
        if(localPath) {
            let newStorage = new RuntimeStorage(this,localPath);
            this.m_allStorages[globalPath] = newStorage;
            return true;
        }

        BX_ERROR("cann't add runtimne storage,global path:" + globalPath + " not bind to local.");
        return false;

    }

    bindRuntimeStorage(globalPath,localPath) {
        this.m_allBindStoragePath[globalPath] = localPath;
    }





    getLogger() {
        return console;
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





        BX_INFO('current device type:'+getCurrentRuntime().getOwnerDevice().getDeviceType()+', require device type:'+packageInfo.deviceType);
        if(getCurrentRuntime().getOwnerDevice().getDeviceType() != packageInfo.deviceType) {
            if(packageInfo.deviceType != "*") {
                return false;
            }
        }


        if(packageInfo.storages) {
            if(packageInfo.storages.length > 0) {
                if(getCurrentRuntime().m_allBindStoragePath == null) {
                    BX_INFO('all bind storage path is null. cannot load package');
                    return false;
                }

                if(getCurrentRuntime().m_allBindStoragePath[packageInfo.storages[0]] == null) {
                    BX_INFO('all bind package storages path is null. cannot load package');
                    return false;
                }
            }
        }


        if(packageInfo.caches) {
            if(packageInfo.caches.length > 0) {
                if(getCurrentRuntime().m_allCaches == null) {
                    BX_INFO('all caches is null. cannot load package');
                    return false;
                }

                if(getCurrentRuntime().m_allCaches[packageInfo.caches[0]] == null) {
                    BX_INFO('all package caches is null. cannot load package');
                    return false;
                }
            }
        }

        BX_INFO('can load package');
        return true

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
        BX_INFO("start load xar package:" + xarInfo);



        let repositoryList = this.m_app.repositoryList.slice(0);
        let tryLoad = function(pos) {
            if(pos >= repositoryList.length) {
                onComplete(null,ErrorCode.RESULT_NOT_FOUND);
                return;
            }

            let repositoryHost = repositoryList[pos];



            let xarID = xarInfo;
            let xarVersion = "";
            let xarDetail = xarInfo.split("|");
            if (xarDetail.length > 1) {
                xarID = xarDetail[0];
                xarVersion = xarDetail[1];
            }
            let proxyLoaded = false;


            let loader = Repository.getLoader(repositoryHost,thisRuntime.getInstanceID(),currentTraceID.toString(), thisRuntime.getToken(),thisRuntime.getOwnerApp().getID());
            ++currentTraceID;
            loader.loadFile(xarID, xarVersion,"config.json",function(ret,xarConfig){

                if(!ret){
                    tryLoad(pos+1);
                    return;
                }

                xarConfig.baseURL = repositoryHost;
                if(xarConfig.knowledges) {
                    for (let i = 0; i < xarConfig.knowledges.length; ++i) {
                        thisRuntime.m_knowledegeManager.dependKnowledge(xarConfig.knowledges[i].key,xarConfig.knowledges[i].type);
                    }
                }

                if(xarConfig.storages) {
                    for(let i=0;i<xarConfig.storages.length;++i) {
                        thisRuntime.enableRuntimeStorage(xarConfig.storages[i]);
                    }
                }

                if(xarConfig.caches) {
                    for(let i=0;i<xarConfig.caches.length;++i) {
                        thisRuntime.enableRuntimeCache(xarConfig.caches[i]);
                    }
                }

                thisRuntime.m_knowledegeManager.ready(function() {

                    if(thisRuntime.isXARPackageCanLoad(xarConfig,thisRuntime.m_id)) {

                        let xarPackage = new XARPackage(xarConfig,thisRuntime);
                        thisRuntime.m_packages[xarInfo] = xarPackage;

                        xarPackage.state = XARPackage.XAR_STATE_RUNING;

                        loader.loadFile(xarID, xarVersion,"onload.js", function(ret, module){
                            if (!ret) {
                                thisRuntime.m_packages[xarInfo] = null;
                                onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                            } else {
                                onComplete(xarPackage, module);
                            }
                        });
                    }else{
                        if (!proxyLoaded) {
                            proxyLoaded = true;
                            let proxyInfo = xarID + "_proxy";
                            if (xarVersion != "") {
                                proxyInfo += "|";
                                proxyInfo += "xarVersion"
                            }
                            BX_INFO("can not load remote package:"+xarInfo+", load proxy package:"+proxyInfo);
                            thisRuntime.loadXARPackage(proxyInfo, onComplete);
                        } else {
                            onComplete(null,ErrorCode.RESULT_NOT_FOUND);
                        }
                    }
                });
            });
        };

        tryLoad(0);


    }
    selectDeviceCanCreateBUS() {

        let deviceMap = getCurrentRuntime().getKnowledgeManager().getKnowledge("global.devices").mapGetClone();
        let result = [];
        let i = 0;
        for(let did in deviceMap) {
            let deviceInfo = deviceMap[did];
            let thisDeviceOK = true;

            if(BaseLib.isArrayContained(deviceInfo.ability,["wlan-interface","bus"])) {
                result.push(deviceInfo);
            }
        }

        if(result.length > 0) {
            i = BaseLib.getRandomNum(0,result.length-1);
            return result[i];
        }
        BX_ERROR("cann't select device for create bus");
        return null;

    }


    createBUSOnDevice(deviceInfo,busID,onComplete){

        let postURL = BaseLib.getUrlFromNodeInfo(deviceInfo) + "/bus/";
        let postBody = {};
        let thisRuntime = this;

        postBody.appID = this.m_app.getID();
        postBody.busID = busID;
        postBody.cmd = "resume";

        BaseLib.postJSON(postURL,postBody,function (newBusInfo) {
            onComplete(newBusInfo);
        });

        return true;
    }

    allocBUS(onComplete) {
        this.scheduler.selectBus(function(ret,bus){
            if(ret){
                BX_INFO(bus);
                onComplete(bus);
            }else{
                onComplete(null);
                BX_ERROR("select bus from scheduler failed.");
            }
        });
    }

    createEvent(eventid,onComplete){
        this.scheduler.selectEvent(eventid,function(ret,event){
            if(ret){
                BX_INFO(event);
                onComplete(event);
            }else{
                onComplete(null);
                BX_ERROR("select event from scheduler failed.");
            }
        });
    }


    createRuntimeOnDevice(deviceInfo,packageInfo,onComplete) {

        let postURL = BaseLib.getUrlFromNodeInfo(deviceInfo) + "/runtimes/";
        BX_INFO("will create runtime on " +deviceInfo.id + " postURL:",postURL);
        let postBody = {};
        let thisRuntime = this;

        postBody.appid = this.m_app.getID();
        if(packageInfo.storages) {

            postBody.storages = packageInfo.storages;
        }

        BaseLib.postJSON(postURL,postBody,function (newRuntimeInfo) {
            BaseLib.setOnceTimer(function(){

                thisRuntime.m_knowledegeManager.dependKnowledge("global.runtimes",InfoNode.TYPE_MAP,{});
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
        let deviceInfo = deviceMap.mapGet(runtime.ownerDeviceID);
        if(deviceInfo) {
            let postURL = BaseLib.getUrlFromNodeInfo(deviceInfo) + "/runtimes/";
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
                if(runtimeInfo.type == deviceType) {
                    thisDeviceOK = true;
                } else {
                    thisDeviceOK = false;
                }
            }

            if(thisDeviceOK) {
                if(deviceAbility) {
                    if(BaseLib.isArrayContained(runtimeInfo.ability,deviceAbility)) {
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
                            if(BaseLib.isArrayContained(runtimeInfo.drivers,packageInfo.drivers)) {
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
                            if(runtimeInfo.ability.indexOf("storage") >= 0) {
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

            let i= BaseLib.getRandomNum(0,result.length-1);
            return result[i];
        }

        BX_ERROR("ERROR! Cann't select valid runtime!");
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
                if(deviceInfo.type == deviceType) {
                    thisDeviceOK = true;
                } else {
                    thisDeviceOK = false;
                }
            }

            if(thisDeviceOK) {
                if(deviceAbility) {
                    if(BaseLib.isArrayContained(deviceInfo.ability,deviceAbility)) {
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
                            if(BaseLib.isArrayContained(deviceInfo.drivers,packageInfo.drivers)) {
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
                            if(deviceInfo.ability.indexOf("storage") >= 0) {
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

            console.log('result:', result[index]);
            return result[index];
        } else {

        }

        BX_INFO("ERROR! Cann't select valid device!");
        return null;
    }

    selectRuntimeByCachePath(cachePathList,deviceGroupID) {
        let thisRuntime = this;
        let knowledgePath = "";
        if(deviceGroupID) {
            knowledgePath = "global.caches." + deviceGroupID;
        } else {
            knowledgePath = "global.caches";
        }

        let bindInfo = thisRuntime.getKnowledgeManager().getKnowledge(knowledgePath);
         if(bindInfo) {
            let allMountInfo = bindInfo.mapGetClone();

            let maxLen = -1;
            let resultID = "";
            for(let gPath in allMountInfo) {
                if(cachePathList[0].indexOf(gPath) >= 0) {
                    if(gPath.length > maxLen) {
                        maxLen = gPath.length;
                        resultID = allMountInfo[gPath].ID;
                    }
                }
            }

            if(maxLen > 0) {
                return thisRuntime.getRuntimeInfo(resultID);
            } else {
                return null;
            }
        } else {
            console.log("ERROR,cann't read knowledge:" + knowledgePath);
        }
    }

    selectRuntimeByStoragePath(storagePathList,deviceGroupID) {
        let thisRuntime = this;
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

                        maxLen = gPath.length;
                        resultID = allMountInfo[gPath].ID;
                    }
                }
            }

            if(maxLen > 0) {
                return thisRuntime.getRuntimeInfo(resultID);
            } else {
                return null;
            }
        } else {
            console.log("ERROR,cann't read knowledge:" + knowledgePath);
        }
    }

    selectTargetRuntime(packageID,packageInfo,selectKey,onComplete) {
        BX_INFO("selectTargetRuntime packageID:" + packageID
            + " packageInfo.version:" + packageInfo.version
            + " selectKey:" + selectKey
        );

        let thisRuntime = getCurrentRuntime();
        let ruleInfo = thisRuntime.getKnowledgeManager().getKnowledge("global.loadrules");
        let module_rule = null;

        if(ruleInfo) {
            module_rule = ruleInfo.objectRead();
        } else {
            BX_INFO("cann't read global.loadrules");
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

        let deveiceInfo = {
            "devicegroupid":deviceGroupID,
            "devicetype":deviceType,
            "deviceability":deviceAbility
        };

        let resultRuntime = null;


        let storagePathList = packageInfo.storages;
        if(storagePathList && storagePathList.length > 0) {
            resultRuntime = thisRuntime.selectRuntimeByStoragePath(storagePathList,deviceGroupID);
        }else{
            resultRuntime = thisRuntime.selectRuntimeByFilter(deviceType,deviceAbility,packageInfo,deviceGroupID);
        }



        if(resultRuntime) {
            BX_INFO("select runtime by storagepath return:" + resultRuntime.id);
            if(!resultRuntime.isOnline ) {
                thisRuntime.resumeRuntime(resultRuntime,function(resultRuntime) {
                    onComplete(resultRuntime);
                });
            } else {
                onComplete(resultRuntime);
            }
        } else {
            this.scheduler.selectRuntime(packageInfo,deveiceInfo,function(ret,runtime){
                if(ret){
                    onComplete(runtime);
                    BX_INFO(runtime);
                }else{
                    BX_ERROR("select runtime from scheduler failed.");
                }
            });
        }

        return;
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





        let thisRuntime = this;
        let postURL = BaseLib.getUrlFromNodeInfo(remoteRuntimeInfo)+"/rpc";
        console.log("postRPCCall=>" + postURL);
        let postBody = {};
        postBody.seq = BaseLib.createGUID();
        postBody.src = this.m_id;

        postBody.function_name = functionname;
        postBody.trace_id = traceID;
        postBody.args = BaseLib.encodeParamAsJson(args);
        postBody.knowledges = this.m_knowledegeManager.getDependsKnowledgeInfo();

        BaseLib.postJSONCall(postURL,postBody,function(result,errorCode,respBody) {
            if(errorCode == ErrorCode.RESULT_NEED_SYNC) {
                BX_INFO("knowledge not sync,need sync before RPC.");
                for(let k in respBody.knowledges) {
                    let thisInfo = thisRuntime.m_knowledegeManager.getKnowledge(k);
                    thisRuntime.m_knowledegeManager.dependKnowledge(k,thisInfo.getType(),null);
                }
                thisRuntime.m_knowledegeManager.ready(function() {
                    BX_INFO("knowledge synced,auto retry RPC");
                    thisRuntime.postRPCCall(remoteRuntimeInfo,functionname,args,traceID,onComplete);
                });
            } else {
                onComplete(result,errorCode);
            }
        });
    }
}


class DeviceInfo {
    constructor(deviceID) {
        this.id = deviceID;
        this.category = "device";
        this.addr = [];
        this.isOnline = false;
        this.ability = [];
        this.drivers = [];
        this.type = "";
    }

    static getDeviceInfo(deviceID,onComplete) {

    }
}


class Device {
    constructor(deviceID) {
        this.m_id = deviceID;
        this.m_token = "";

        this.m_category = "device";
        this.m_ability = [];
        this.m_drivers = {};
        this.addr = [];
        this.meta ={};

        this.m_ownerUserID = "";
        this.m_ownerUserToken = "";
        this.m_logHost = "";

        this.m_knowledgeServerInfo = null;
        this.m_repositoryServerInfo = null;
        this.m_schedulerServerInfo = null;
        this.m_caServerInfo = null;
        this.m_loginServerInfo = null;
    }

    getDeviceID() {
        return this.m_id;
    }

    setDeviceID(id) {
        let oldid = this.m_id;
        this.m_id = id;
        return oldid;
    }

    getAppHost(appid) {
        return this.m_apphost;
    }

    getSchedulerHost(appid) {
        if(this.m_schedulerServerInfo) {
            return BaseLib.getUrlFromNodeInfo(this.m_schedulerServerInfo);
        }
        return null;
    }

    getRepositoryServerHost(appid) {
        if(this.m_repositoryServerInfo) {
            return BaseLib.getUrlFromNodeInfo(this.m_repositoryServerInfo);
        }
        return null;
    }

    getKnowledgeServerHost(appid) {
        if(this.m_knowledgeServerInfo) {
            return BaseLib.getUrlFromNodeInfo(this.m_knowledgeServerInfo);
        }
        return null;
    }

    getCaServerHost() {
        if(this.m_caServerInfo) {
            return BaseLib.getUrlFromNodeInfo(this.m_caServerInfo);
        }
        return null;
    }

    getLoginServerHost() {
        if(this.m_loginServerInfo) {
            return BaseLib.getUrlFromNodeInfo(this.m_loginServerInfo);
        }
        return null;
    }

    getLogHost() {
        return this.m_logHost;
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
    loadFromCookie(ownerApp) {

        this.m_category = "pc_browser";
        this.m_ability = [];
        this.m_ownerApps = ownerApp;
        this.m_runtimeRootDir = "";




        this.m_drivers = {};

        return ErrorCode.RESULT_OK;
    }



    loadFromConfig(configInfo) {

        this.m_token = configInfo.device_token;

        let baseInfo = configInfo.device_info;

        this.m_id = baseInfo.id;


        this.m_type = baseInfo.type;
        this.m_ability = baseInfo.ability;

        this.m_drivers = baseInfo.drivers;
        this.m_addr = baseInfo.addr;


        this.m_ownerApps = configInfo.owner_apps;
        this.m_apphost = configInfo.app_host;

        this.meta = configInfo.meta;

        this.m_runtimeRootDir = configInfo.runtime_root_dir;




        this.m_ownerUserID = configInfo.owner.user_id;
        this.m_ownerUserToken = configInfo.owner.user_token;

        this.m_knowledgeServerInfo = configInfo.knowledge_server_info;
        this.m_repositoryServerInfo = configInfo.repository_server_info;
        this.m_schedulerServerInfo = configInfo.scheduler_server_info;
        this.m_caServerInfo = configInfo.ca_server_info;
        this.m_loginServerInfo = configInfo.login_server_info;
        if (configInfo.log_host) {
            this.m_logHost = configInfo.log_host;
        } else {
            this.m_logHost = "";
        }

        return ErrorCode.RESULT_OK;
    }

    createDeviceInfo() {
        let result = new DeviceInfo(this.m_id);
        result.isOnline = true;
        result.ability = this.m_ability.slice(0);
        result.drivers = this.m_drivers;
        result.type = this.m_type;
        result.category = "device";



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






class WSReqList {
    constructor() {
        this.m_reqlist = {};
        this.m_seq = 16;
    }

    Create(op, OnResponse) {
        const seq = this.m_seq++;
        const req = {
            "op": op,
            "seq": seq,
        };
        const item = {
            "tick": new Date(),
            "resp": OnResponse,
        }

        assert(!this.m_reqlist[seq]);
        this.m_reqlist[seq] = item;
        return req;
    }

    OnRecvResponse(cmd) {
        assert(cmd.seq);
        const item = this.m_reqlist[cmd.seq];
        if (item) {
            if (item.resp) {
                item.resp(cmd);
            }

            delete this.m_reqlist[cmd.seq];
        }
    }
}




class WebSocketClient {
    constructor(id, type, addr) {
        this.m_id = id;
        this.m_type = type;
        this.m_addr = addr;
        assert(type === "device" || type === "runtime");
        assert(this.m_addr);

        this.m_reqlist = new WSReqList();
        this.m_opened = false;
        this.onopen = null;
        this.onclose = null;
    }

    _send(reqString) {
        BX_INFO("websocket will send:" + reqString);







    }

    GetID() {
        return this.m_id;
    }

    Start() {
        assert(!this.m_opened);
        BX_INFO("will start webscoket to:" + this.m_addr);
        let This = this;
    }


    Register(eventList, OnComplete) {
        const req = this.m_reqlist.Create("register", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = this.m_id;
        req.ctype = this.m_type;

        if (eventList) {
            assert(eventList instanceof Array);
            req.eventlist = eventList;
        }

        const reqString = JSON.stringify(req);

        this._send(reqString);
    }




    GetClientList(ctype, OnComplete) {
        const req = this.m_reqlist.Create("get_list", function(resp) {
            if (OnComplete) {
                let list = [];
                if (resp.ret === 0) {
                    list = resp.list;
                }

                OnComplete(resp.ret, list);
            }
        });

        req.id = this.m_id;
        req.ctype = ctype;

        const reqString = JSON.stringify(req);
        this._send(reqString);
    }


    CreateEvent(id, option, OnComplete) {
        const req = this.m_reqlist.Create("new_event", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = id;
        if (option) {
            req.option = option;
        }

        const reqString = JSON.stringify(req);
        this._send(reqString);
    }


    DeleteEvent(id, OnComplete) {
        const req = this.m_reqlist.Create("delete_event", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = id;

        const reqString = JSON.stringify(req);
        this._send(reqString);
    }


    AttachEvent(id, OnComplete) {
        const req = this.m_reqlist.Create("attach_event", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = id;
        req.src_id = this.m_id;

        const reqString = JSON.stringify(req);
        this._send(reqString);
    }


    DetachEvent(id, OnComplete) {
        const req = this.m_reqlist.Create("detach_event", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = id;
        req.src_id = this.m_id;

        const reqString = JSON.stringify(req);
        this._send(reqString);
    }



    ActiveEvent(id, param, OnComplete) {
        const req = this.m_reqlist.Create("active_event", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = id;
        req.param = param;
        req.src_id = this.m_id;

        const reqString = JSON.stringify(req);
        this._send(reqString);
    }


    ChainBus(id, busAddress, OnComplete) {
        const req = this.m_reqlist.Create("chain", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = id;
        req.addr = busAddress;

        const reqString = JSON.stringify(req);
        this._send(reqString);
    }

    UnChainBus(id, OnComplete) {
        const req = this.m_reqlist.Create("unchain", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = id;

        const reqString = JSON.stringify(req);
        this._send(reqString);
    }

    _OnOpen() {
        assert(!this.m_opened);
        this.m_opened = true;
        if (this.onopen) {
            this.onopen();
        }
    }

    _OnClose() {

        this.m_opened = false;
        if (this.onclose) {
            this.onclose();
        }
    }

    _OnMessage(data) {
        BX_INFO("recv from webscoket :" + data);
        const cmd = JSON.parse(data);
        if (cmd) {
            if (cmd.op === "onactive") {
                this._OnEvent(cmd);
            } else {
                this.m_reqlist.OnRecvResponse(cmd);
            }
        } else {
            console.log("recv invalid message:", data);
        }
    }

    _OnEvent(cmd) {
        if (this.onactive) {
            this.onactive(cmd.id, cmd.src_id, cmd.param);
        }
    }
}

class GlobalEventManager {
    constructor(km) {
        this._km = km;
        this._busClients = {};
        this._busClientByEventID = {};
        this._listeners = {};
        this._cookie = 1024;
    }

    _getBUSClient(busID,eventID,onComplete) {
        let result = this._busClients[busID];
        let This = this;
        if(result) {
            onComplete(result,ErrorCode.RESULT_OK);
        } else {
            This._km.dependKnowledge("global.buses",1);

            This._km.ready(function() {
                let kInfo = This._km.getKnowledge("global.buses");
                if(kInfo) {
                    let busInfo = kInfo.mapGet(busID);
                    if(busInfo) {
                        let clientInfo = {};
                        let busURL = BaseLib.getUrlFromNodeInfo(busInfo);
                        BX_INFO("create bus to :" + busURL);

                        clientInfo.client = new WebSocketClient(getCurrentRuntime().getID(), "runtime", busURL);
                        clientInfo.isAttach = false;
                        function onClientOpen() {
                            clientInfo.client.Register(null,function() {
                                This._busClients[busID]= clientInfo.client;
                                This._busClientByEventID[eventID] = clientInfo;

                                BX_INFO("websocket client connected.");
                                onComplete(clientInfo.client,ErrorCode.RESULT_OK);
                            });

                        }

                        function onClientActive(eventid, srcid, param) {
                            BX_INFO("bus client onactive:", eventid, srcid, param);
                            This._onBUSActive(eventID,eventid, srcid, param);
                        };

                        function onClientClose(){
                            BX_WARN("bus client break.")
                            delete This._busClientByEventID[eventID];
                        }

                        clientInfo.client.onopen = onClientOpen;
                        clientInfo.client.onactive = onClientActive;
                        clientInfo.client.onclose = onClientClose;
                        clientInfo.client.Start();
                        return;
                    } else {
                        BX_ERROR("Cann't get bus info. create busClient failed." + busID);
                        onComplete(null,ErrorCode.RESULT_NOT_FOUND);
                    }
                } else {
                    BX_ERROR("Cann't get bus global.buses. create busClient failed." + busID);
                    onComplete(null,ErrorCode.RESULT_UNKNOWN);
                }
            });
        }
    }





    _onBUSActive(eventID,eventid, srcid, param) {
        let trueEventID = eventID;
        BX_TRACE(eventID + "active:" + srcid + "," + param);
        if(eventid == "registerClient" || eventid == "unregisterClient") {
            trueEventID = eventID + "_listenerChanged" ;
        }

        let listeners = this._listeners[trueEventID];
        if(listeners) {
            for(let i=0;i<listeners.length;++i) {
                let listener = listeners[i];
                listener.func(param);
            }
        }
    }

    _attachInnerListener(eventID,func) {
        let listeners = this._listeners[eventID];
        if(listeners == null) {
            listeners = new Array();
            this._listeners[eventID] = listeners;
        }
        this._cookie = this._cookie + 1;
        let listener = {};
        listener.cookie = this._cookie;
        listener.func = func;
        listeners.push(listener);
        return listener.cookie;
    }

    _detachInnerListener(eventID,cookie) {
        let listeners = this._listeners[eventID];
        if(listeners == null) {
            return null;
        }
        for(let i=0;i<listeners.length;++i) {
            if(listeners[i].cookie == cookie) {
                listener.splice(i,1);
                return listeners;
            }
        }
        return listeners;
    }

    isEventCreated(eventID) {
        console.log("isEventCreated?")

        let eventInfo = this._km.getKnowledge("global.events");
        if(eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);
            if(eventObj) {
                return ErrorCode.RESULT_OK;
            } else {
                return ErrorCode.RESULT_NOT_FOUND;
            }
        } else {
            BX_ERROR("global event root object is not exist,MUST create this node!!!");
            return ErrorCode.RESULT_UNKNOWN;
        }
    }


    attach(eventID,func,onComplete) {
        let This = this;
        let busClient = null;
        let clientInfo = This._busClientByEventID[eventID];
        if(clientInfo) {
            busClient = clientInfo.client;
        }
        let attachResult = ErrorCode.RESULT_NOT_FOUND;

        if(busClient == null) {
            This._km.dependKnowledge("global.events",1);
            This._km.ready(function(){
                let eventInfo = This._km.getKnowledge("global.events");
                if(eventInfo) {

                    let eventObject = eventInfo.mapGet(eventID);
                    if(eventObject) {

                        This._getBUSClient(eventObject.busID,eventID,function(busClient,result) {

                            if(result == ErrorCode.RESULT_OK) {

                                busClient.AttachEvent(eventID,function(ret) {;
                                    if(ret == 0) {
                                        This._busClientByEventID[eventID].isAttach = true;
                                        let cookie = This._attachInnerListener(eventID,func);
                                        onComplete(ErrorCode.RESULT_OK,cookie);
                                    } else {
                                        onComplete(ret,0);
                                    }
                                });
                            } else {
                                BX_WARN("cann't get bus client.eventID:" + eventID);
                                onComplete(result,0);
                            }
                        });
                        return;
                    } else {
                        BX_WARN("cann't read event object,eventID:" + eventID);
                    }
                } else {
                    BX_WARN("cann't read event info,eventID:" + eventID);
                }
            });
            return;
        } else {
            busClient.AttachEvent(eventID,function(ret) {
                if(ret == 0) {
                    let cookie = This._attachInnerListener(eventID,func);
                    onComplete(ErrorCode.RESULT_OK,cookie);
                } else {
                    onComplete(ret,0);
                }
            });
            return;
        }


    }

    detach(eventID,cookie) {
        let This = this;
        let listener = This._detachInnerListener(eventID,cookie);
        if(listener == null) {
            return ErrorCode.RESULT_NOT_FOUND;
        }

        if(listener.length < 1) {
            delete This._listeners[eventID];

            let busClient = null;
            let clientInfo = This._busClientByEventID[eventID];
            if(clientInfo) {
                busClient = clientInfo.client;
            }
            if(busClient) {
                busClient.DetachEvent(eventID,function() {});
                delete This._busClientByEventID[eventID];
                delete This._busClients[busClient.GetID()];
            } else {
                BX_WARN("Cann't found busClient?");
            }
        }
        return ErrorCode.RESULT_OK;
    }

    attachListenerChanged(eventID,func,onComplete) {
        let This = this;

        let busClient = null;
        let clientInfo = This._busClientByEventID[eventID];
        if(clientInfo) {
            busClient = clientInfo.client;
        }
        let attachResult = ErrorCode.RESULT_NOT_FOUND;

        if(busClient == null) {
            let eventInfo = this._km.getKnowledge("global.events");
            if(eventInfo) {
                let eventObject = eventInfo.mapGet(eventID);
                if(eventObject) {
                    This._getBUSClient(eventObject.busID,eventID,function(busClient,result) {
                        if(result == ErrorCode.RESULT_OK) {
                            busClient.AttachEvent("registerClient",function(){
                                busClient.AttachEvent("unregisterClient",function(){});
                            });

                            let cookie = This._attachInnerListener(eventID+"_listenerChanged",func);
                            onComplete(ErrorCode.RESULT_OK,cookie);
                        } else {
                            onComplete(result,0);
                        }
                    });
                    return;
                }
            } else {
                BX_WARN("cann't read event info,eventID:" + eventID);
            }
        } else {
            busClient.AttachEvent("registerClient",function(){
                busClient.AttachEvent("unregisterClient",function(){});
            });

            let cookie = This._attachInnerListener(eventID+"_listenerChanged",func);
            onComplete(ErrorCode.RESULT_OK,cookie);
            return;
        }

        onComplete(attachResult,0);
    }

    detachListenerChanged(eventID,cookie) {
        let This = this;
        let listener = This._detachInnerListener(eventID+"_listenerChanged",cookie);
        if(listener == null) {
            return ErrorCode.RESULT_NOT_FOUND;
        }

        if(listener.length < 1) {
            delete This._listeners[eventID];
            let busClient = null;
            let clientInfo = This._busClientByEventID[eventID];
            if(clientInfo) {
                busClient = clientInfo.client;
            }
            if(busClient) {
                busClient.DetachEvent("registerClient",function(){});
                busClient.DetachEvent("unregisterClient",function(){});
                delete This._busClientByEventID[eventID];
                delete This._busClients[busClient.GetID()];
            } else {
                BX_WARN("Cann't found busClient?");
            }
        }
        return ErrorCode.RESULT_OK;
    }

    getListenerList(eventID,onComplete) {
        let This = this;
        let busClient = null;
        let clientInfo = This._busClientByEventID[eventID];
        if(clientInfo) {
            busClient = clientInfo.client;
        }
        let attachResult = ErrorCode.RESULT_NOT_FOUND;

        if(busClient == null) {
            let eventInfo = this._km.getKnowledge("global.events");
            if(eventInfo) {
                let eventObject = eventInfo.mapGet(eventID);
                if(eventObject) {
                    This._getBUSClient(eventObject.busID,eventID,function(busClient,result) {
                        if(result == ErrorCode.RESULT_OK) {
                            busClient.GetClientList("runtime",onComplete);
                        } else {
                             onComplete(result,null);
                        }
                    });
                    return;
                }
            } else {
                BX_WARN("cann't read event info,eventID:" + eventID);
            }
        } else {
            busClient.GetClientList("runtime",onComplete);
            return;
        }
    }

    fireEvent(eventID,params) {

        let This = this;
        let busClient = null;
        let clientInfo = This._busClientByEventID[eventID];
        if(clientInfo) {
            busClient = clientInfo.client;
        }

        if(busClient == null) {
            let eventInfo = this._km.getKnowledge("global.events");
            if(eventInfo) {
                let eventObj = eventInfo.mapGet(eventID);
                if(eventObj) {
                    this._getBUSClient(eventObj.busID,eventID,function(busClient,result) {
                            if(result == ErrorCode.RESULT_OK) {
                                busClient.ActiveEvent(eventID,params);
                            }
                    });
                }
            } else {
                BX_WARN("cann't read event info,eventID:" + eventName);
            }
        } else {
            busClient.ActiveEvent(eventID,params,function(ret) {
                BX_TRACE("Active Event "+ eventID + " return " + ret);
            });
        }
    }



    createEvent(eventID,onComplete) {




        let thisKM = this._km;
        let thisRuntime = getCurrentRuntime();
        let This = this;

        let createEventById = function(){
            thisRuntime.createEvent(eventID,function(newEventInfo){
                if(newEventInfo){
                    onComplete(ErrorCode.RESULT_OK);
                }else{
                    onComplete(ErrorCode.RESULT_UNKNOWN);
                }
            });
        };

        let eventInfo = thisKM.getKnowledge("global.events" );
        if(eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);
            if(eventObj) {
                thisKM.dependKnowledge("global.buses",1);
                thisKM.ready(function() {
                    let kInfo = This._km.getKnowledge("global.buses");
                    let exist = false;
                    if(kInfo && kInfo.mapGet(eventObj.busID)){
                        exist = true;
                    }

                    if(exist) {
                        BX_ERROR("event aleady exist,eventID:" + eventID);
                        onComplete(ErrorCode.RESULT_ALREADY_EXIST);
                    }else{
                        BX_ERROR("event exist, but bus miss, recreate event,eventID:" + eventID);
                        createEventById();
                    }
                });
            } else {
                createEventById();
            }
        } else {
            BX_ERROR("global event root object is not exist,MUST create this node!!!");
            return onComplete(ErrorCode.RESULT_UNKNOWN);
        }
    }

    removeEvent(eventID,onComplete) {
        let eventInfo = this._km.getKnowledge("global.events");
        if(eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);
            if(eventObj) {


                eventObj.mapSet(eventID,function(result) {
                    if(result == ErrorCode.RESULT_OK) {
                        BX_INFO("event " + eventID + " removed.");
                        onComplete(ErrorCode.RESULT_OK);
                    }
                });

            } else {
                onComplete(ErrorCode.RESULT_NOT_FOUND);
            }
        } else {
            BX_ERROR("global event root object is not exist,MUST create this node!!!");
            onComplete(ErrorCode.RESULT_UNKNOWN);
        }
    }
}

