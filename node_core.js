"use strict";
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var assert = require("assert");
var url = require('url');
var fs = require('fs');
var path = require('path');
var os = require('os');
var AdmZip = require('adm-zip');
var child_process = require("child_process");
var crypto = require('crypto');
var PATH_SEPARATOR = path.normalize("/");
var EVAL_ENABLE = true;
const BX_UID_TYPE_CORE = "CORE";
const BX_UID_TYPE_APP = "APP";
const BX_UID_TYPE_DEVELOPER = "DEV";
const BX_UID_TYPE_RUNTIME = "RTM";
const BX_RUNTIME_LEVEL = 4;
const BX_RUNTIME_STATE_ONLINE = 1;
const BX_RUNTIME_STATE_OFFLINE = 2;
const BX_RUNTIME_STATE_SLEEP = 3;
const BX_BUS_STATE_ONLINE = 1;
const BX_BUS_STATE_OFFLINE = 2;
const BX_BUS_STATE_SLEEP = 3;

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
ErrorCode.RESULT_INVALID_PARAM = 11;
ErrorCode.RESULT_SIGNUP_FAILED = 20;
ErrorCode.RESULT_SIGNIN_FAILED = 21;
ErrorCode.RESULT_NO_TARGET_RUNTIME = 30;
ErrorCode.RESULT_POST_FAILED = 40;
ErrorCode.RESULT_UNKNOWN = 255;
const KRESULT = {
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
    "LOCK_WRITE" : 16,
    "LOCK_READ" : 17,
    "LOCK_NONE" : 18,
    "LOCK_UNMATCH" : 19,
}
const RRESULT = {
    'SUCCESS': 0,
    'FAILED': 1,
    'UID_NOT_VALID': 300,
    'CHECKTOKEN_FAILED': 301,
    'DB_OPEN_FAILED': 302,
    'DB_OP_FAILED': 303,
    'DB_EXCEPTION': 304,
    'ZIP_WRITE_FAILED': 305,
    'ZIP_FILE_NOT_EXSIT': 306,
    'ZIP_LOAD_FAILED': 307,
    'PKG_NOT_COMMIT': 308,
};
const SRESULT = {
    'SUCCESS': 0,
    'FAILED': 1,
    'TIMEOUT': 350,
    'UID_NOT_VALID': 351,
    'CHECKTOKEN_FAILED': 352,
    'DEVICE_NOT_FOUND': 353,
    'RUNTIME_NOT_FOUND': 370,
    'RUNTIME_SET_ONLINE_FAILED':371,
    'RUNTIME_PUB_FAILED': 372,
    'RUNTIME_BIND_STORAGE_FAILED': 373,
    'RUNTIME_ALLOC_FAILED': 374,
    'RUNTIME_ALLOC_NO_RESP': 375,
    'RUNTIME_RESUME_FAILED': 376,
    'RUNTIME_RESUME_NO_RESP': 377,
    'RUNTIME_PAUSE_FAILED': 378,
    'RUNTIME_PAUSE_NO_RESP': 379,
    'RUNTIME_RELEASE_FAILED': 380,
    'RUNTIME_RELEASE_NO_RESP': 381,
    'BUS_NOT_FOUND': 390,
    'BUS_SET_SET_ONLINE_FAILED':391,
    'BUS_CREATE_CLIENT_FAILED':392,
    'BUS_CHAIN_CLIENT_FAILED':393,
    'BUS_BIND_RUNTIME_FAILED':394,
    'BUS_ALLOC_FAILED': 395,
    'BUS_ALLOC_NO_RESP': 396,
    'BUS_RELEASE_FAILED': 397,
    'BUS_RELEASE_NO_RESP': 398,
    'EVENT_NOT_FOUND': 410,
    'EVENT_ALREADY_EXIST': 411,
    'EVENT_CREATE_FAILED': 412,
    'EVENT_PUB_FAILED':413,
    'EVENT_BUSLIST_EMPTY':414,
    'EVENT_CLEAN_FAILED':415,
    'MYSQL_INSTANCEID_NOT_EXISTS': 450,
    'MYSQL_ALLOC_NO_RESP': 451,
    'MYSQL_ALLOC_FAILED': 452,
    'MYSQL_RESUME_NO_RESP': 453,
    'MYSQL_RESUME_FAILED': 454,
    'MYSQL_PUB_FAILED': 455,
};

class BLogNodeEnv {
    platform() {
        return os.platform();
    }
    filterOptions(options) {
    }
}
const BLogEnv = new BLogNodeEnv();

class LinkedListItem {
    constructor(data, pre, next) {
        this.m_data = data;
        this.m_pre = pre;
        this.m_next = next;
    }
}

class LinkedList {
    constructor() {
        this.m_head = null;
        this.m_tail = null;
        this.m_current = null;
        this.m_length = 0;
        this.m_forward = false;
    }
    size() {
        return this.m_length;
    }
    empty() {
        return this.m_length === 0;
    }
    back() {
        if (this.m_length === 0) {
            return;
        }
        else {
            return this.m_tail.m_data;
        }
    }
    front() {
        if (this.m_length === 0) {
            return;
        }
        else {
            return this.m_head.m_data;
        }
    }
    push_back(data) {
        let item = new LinkedListItem(data, this.m_tail, null);
        if (this.m_length > 0) {
            this.m_tail.m_next = item;
            this.m_tail = item;
        }
        else {
            this.m_head = item;
            this.m_tail = item;
        }
        ++this.m_length;
    }
    pop_back() {
        if (this.m_length <= 0) {
            assert(this.m_head === null);
            assert(this.m_tail === null);
            return;
        }
        assert(this.m_tail);
        let item = this.m_tail;
        --this.m_length;
        if (this.m_length > 0) {
            this.m_tail = item.m_pre;
            this.m_tail.m_next = null;
        } else {
            this.m_head = null;
            this.m_tail = null;
        }
        if (this.m_current === item) {
            this.__correct_current();
        }
        return item.m_data;
    }
    push_front(data) {
        let item = new LinkedListItem(data, null, this.m_head);
        if (this.m_length > 0) {
            this.m_head.m_pre = item;
            this.m_head = item;
        }
        else {
            this.m_tail = item;
            this.m_head = item;
        }
        ++this.m_length;
    }
    pop_front() {
        if (this.m_length <= 0) {
            assert(this.m_head === null);
            assert(this.m_tail === null);
            return;
        }
        assert(this.m_head);
        let item = this.m_head;
        --this.m_length;
        if (this.m_length > 0) {
            this.m_head = item.m_next;
            this.m_head.m_pre = null;
        } else {
            this.m_head = null;
            this.m_tail = null;
        }
        if (this.m_current === item) {
            this.__correct_current();
        }
        return item.m_data;
    }
    current() {
        if (this.m_current) {
            return this.m_current.m_data;
        }
        else {
            return;
        }
    }
    __correct_current() {
        if (this.m_current) {
            let item = this.m_current;
            if (this.m_forward) {
                this.m_current = item.m_pre;
            }
            else {
                this.m_current = item.m_next;
            }
        }
    }
    erase() {
        if (!this.m_current) {
            return;
        }
        if (this.m_current === this.m_head) {
            this.pop_front();
        }
        else if (this.m_current === this.m_tail) {
            this.pop_back();
        }
        else {
            --this.m_length;
            let item = this.m_current;
            this.__correct_current();
            item.m_pre.m_next = item.m_next;
            item.m_next.m_pre = item.m_pre;
        }
        return true;
    }
    reset() {
        this.m_current = null;
    }
    next() {
        this.m_forward = true;
        if (this.m_current) {
            this.m_current = this.m_current.m_next;
        }
        else {
            this.m_current = this.m_head;
        }
        if (this.m_current) {
            return true;
        }
        else {
            return false;
        }
    }
    prev() {
        this.m_forward = false;
        if (this.m_current) {
            this.m_current = this.m_current.m_pre;
        }
        else {
            this.m_current = this.m_tail;
        }
        if (this.m_current) {
            return true;
        }
        else {
            return false;
        }
    }
}

class BLogConsoleTarget {
    constructor() {
        this.m_clFuncs = {
            "trace": console.trace,
            "debug": console.debug,
            "info": console.info,
            "warn": console.warn,
            "error": console.error,
            "fatal": console.error,
        };
    }
    output(logStringItem, options) {
        let func = this.m_clFuncs[options.level];
        if (func) {
            func(logStringItem);
        } else {
            console.log(logStringItem);
        }
    }
}
var BLogGetDefaultConsoleTarget = function() {
    let instance;
    return function() {
        if (!instance) {
            instance = new BLogConsoleTarget();
        }
        return instance;
    };
}();
const LogTargetMode = {
    'ASYNC' : 0,
    'SYNC' : 1,
};
const LogMemoryCacheStatus = {
    'READY': 0,
    'PENDING': 1,
};

class LogMemoryCache {
    constructor(options, target) {
        this.m_maxSize = -1;
        this.m_maxCount = 1024 * 10;
        if (options.maxSize) {
            this.m_maxSize = options.maxSize;
        }
        if (options.maxCount) {
            this.m_maxCount = options.maxCount;
        }
        this.m_retryInterval = 1000;
        this.m_retryMaxCount = 5;
        this.m_target = target;
        assert(this.m_target);
        this.m_logs = new LinkedList();
        this.m_size = 0;
    }
    chain(nextTarget, mode) {
        this.m_target = nextTarget;
        this.m_mode = mode;
        if (!nextTarget) {
            this.m_mode = "copy";
        }
    }
    _onItemCompelte(logItem, ret) {
        const cb = logItem.c;
        if (cb) {
            cb(ret, logItem.l, logItem.o);
        }
    }
    _continue() {
        this._checkLimit();
        while (!this.m_logs.empty()) {
            const logItem = this.m_logs.pop_front();
            if (this._outputItem(logItem)) {
            } else {
                break;
            }
        }
    }
    _cacheLog(logString, options, onComplete, back = true) {
        const item = {
            "l": logString,
            "o": options,
            "c": onComplete,
            "r": 0,
        };
        this._cacheItem(item, back);
    }
    _cacheItem(logItem, back = true) {
        this.m_size += logItem.l.length;
        if (back) {
            this.m_logs.push_back(logItem);
        } else {
            this.m_logs.push_front(logItem);
        }
    }
    _checkLimit() {
        if (this.m_maxCount > 0) {
            while (this.m_logs.size() > this.m_maxCount) {
                const oldItem = this.m_logs.pop_front();
                this._onItemCompelte(oldItem);
            }
        }
        if (this.m_maxSize > 0) {
            while (this.m_size > this.m_maxSize) {
                const oldItem = this.m_logs.pop_front();
                if (oldItem) {
                    this.m_size -= oldItem.l.length;
                    assert(this.m_size >= 0);
                    this._onItemCompelte(oldItem);
                } else {
                    break;
                }
            }
        }
    }
}

class AsyncLogMemoryCache extends LogMemoryCache {
    constructor(options, target) {
        super(options, target);
        this.m_status = LogMemoryCacheStatus.READY;
    }
    output(logString, options, onComplete) {
        const item = {
            "l": logString,
            "o": options,
            "c": onComplete,
            "r": 0,
        };
        let ret = false;
        if (this.m_status === LogMemoryCacheStatus.READY &&
            this.m_logs.empty()) {
            ret = this._outputItem(item);
        } else {
            this._cacheItem(item, true);
        }
        return ret;
    }
    flush() {
        while (!this.m_logs.empty()) {
            const logItem = this.m_logs.pop_front();
            if (this._outputItem(logItem)) {
            } else {
                break;
            }
        }
    }
    _outputItem(logItem) {
        assert(this.m_status === LogMemoryCacheStatus.READY);
        this.m_status = LogMemoryCacheStatus.PENDING;
        let inCall = true;
        const outputRet = this.m_target.output(logItem.l, logItem.o, (ret) => {
            assert(this.m_status === LogMemoryCacheStatus.PENDING);
            this.m_status = LogMemoryCacheStatus.READY;
            if (ret === 0) {
                if (logItem.c) {
                    logItem.c(ret, logString, logOption);
                }
                if (inCall) {
                    setImmediate(() => {
                        this._continue();
                    });
                } else {
                    this._continue();
                }
            } else {
                ++logItem.r;
                if (logItem.r > this.m_retryMaxCount) {
                    if (logItem.c) {
                        logItem.c(KRESULT.FAILED, logString, logOption);
                    }
                    if (inCall) {
                        setImmediate(() => {
                            this._continue();
                        });
                    } else {
                        this._continue();
                    }
                } else {
                    this._cacheItem(logItem, false);
                    setTimeout(() => {
                        this._continue();
                    }, this.m_retryInterval);
                }
            }
        });
        inCall = false;
        if (outputRet) {
            this.m_status = LogMemoryCacheStatus.READY;
        }
        return outputRet;
    }
}

class SyncLogMemoryCache extends LogMemoryCache {
    constructor(options, target) {
        super(options, target);
        this.m_timer = null;
    }
    output(logString, options, onComplete) {
        const item = {
            "l": logString,
            "o": options,
            "c": onComplete,
            "r": 0,
        };
        let ret = false;
        if (this.m_logs.empty()) {
            ret = this._outputItem(item);
        } else {
            this._cacheLog(item, true);
        }
        return ret;
    }
    flush() {
        this._continue();
    }
    _outputItem(logItem) {
        let ret = this.m_target.output(logItem.l, logItem.o);
        if (ret) {
            if (logItem.c) {
                logItem.c(ret, logItem.l, logItem.o);
            }
        } else {
            this._cacheItem(logItem, false);
            if (this.m_timer == null) {
                this.m_timer = setTimeout(() => {
                    this.m_timer = null;
                    this._continue();
                } , this.m_retryInterval);
            }
        }
        return ret;
    }
}

class LogFileTarget {
    constructor(options) {
        assert(options.folder);
        assert(options.filename);
        this.m_folder = options.folder;
        this.m_filename = options.filename;
        this.m_filePath = null;
        this.m_fileMaxSize = 1024 * 1024 * 16;
        if (options.filemaxsize) {
            this.m_fileMaxSize = options.filemaxsize;
        }
        this.m_fileMaxCount = 10;
        if (options.filemaxcount) {
            this.m_fileMaxCount = options.filemaxcount;
        }
        this.m_fd = null;
        this.m_curFileIndex = 0;
        this.m_writtenSize = 0;
        this.m_retryInterval = 1000 * 5;
        this.m_status = 1;
        this._nextFilePath((index, filePath) => {
            this.m_curFileIndex = index;
            this.m_filePath = filePath;
            this._open();
        });
    }
    _nextFilePath(OnComplete) {
        let tm = null;
        let index = 0;
        let curIndex = this.m_curFileIndex;
        for (let i = 0; i < this.m_fileMaxCount; ++i) {
            const fullPath = this.m_folder + "/" + this.m_filename + "." + curIndex + ".log";
            if (!fs.existsSync(fullPath)) {
                index = curIndex;
                break;
            }
            const stat = fs.lstatSync(fullPath);
            if (stat.isFile()) {
                if (!tm) {
                    console.log("init index", curIndex, stat.mtime);
                    tm = stat.mtime;
                    index = curIndex;
                } else if (stat.mtime < tm) {
                    tm = stat.mtime;
                    console.log("update index", index, curIndex);
                    index = curIndex;
                }
            } else {
            }
            curIndex++;
            curIndex = curIndex % this.m_fileMaxCount;
        }
        const filePath = this.m_folder + "/" + this.m_filename + "." + index + ".log";
        console.log(filePath);
        OnComplete(index, filePath);
    }
}

class AsyncLogFileTarget extends LogFileTarget {
    constructor(options) {
        super(options);
        this.m_fs = null;
        this.m_ready = false;
    }
    output(logString, option, onComplete) {
        if (this.m_fs) {
            if (this.m_ready) {
                this.m_writtenSize += logString.length;
                if (this.m_writtenSize >= this.m_fileMaxSize) {
                    console.log("size extend!", this.m_writtenSize, this.m_fileMaxSize);
                    this._close();
                    this._nextFilePath((index, filePath) => {
                        this.m_curFileIndex = index;
                        this.m_filePath = filePath;
                        this._open();
                    });
                    onComplete(KRESULT.FAILED, logString, option);
                    return false;
                }
                this.m_ready = this.m_fs.write(logString + option.lbr, 'utf8', (err) => {
                    if (err) {
                        onComplete(KRESULT.FAILED, logString, option);
                    } else {
                        onComplete(0, logString, option);
                    }
                });
            } else {
                onComplete(KRESULT.FAILED, logString, option);
            }
        } else {
            onComplete(KRESULT.FAILED, logString, option);
        }
        return false;
    }
    flush() {
    }
    _close() {
        if (this.m_fd) {
            let fd = this.m_fd;
            this.m_fd = null;
            this.m_fs = null;
            this.m_ready = false;
            this.m_writtenSize = 0;
            fs.close(fd, () => {
                console.log("close fd success!", fd);
            });
        }
    }
    _open() {
        fs.open(this.m_filePath, 'w+', (err, fd) => {
            if (err) {
                console.error("open log file failed: file={0}, err={1}", this.m_path, err);
                this._onOpenFailed(err);
            } else {
                console.info("open log file success: file={0}", this.m_filePath);
                this._onOpenSuccess(fd);
            }
        });
    }
    _onOpenSuccess(fd) {
        assert(!this.m_fs);
        assert(fd);
        const opt = {
            'flags': 'w',
            'fd': fd,
            'mode': 0o666,
            'autoClose': true,
        };
        this.m_fd = fd;
        this.m_fs = fs.createWriteStream(null, opt);
        this.m_ready = true;
        this.m_fs.on('drain', () => {
            this.m_ready = true;
        });
    }
    _onOpenFailed(err) {
        if (!fs.existsSync(this.m_folder)) {
            console.log("will create dir", this.m_folder);
            fs.ensureDir(this.m_folder, (err) => {
                if (err) {
                    console.error("create dir failed:", this.m_folder);
                    this._stopOpen(err);
                } else {
                    console.info("create dir success:", this.m_folder);
                    this._open();
                }
            });
        } else {
            this._stopOpen(err);
        }
    }
    _stopOpen(error) {
        setTimeout(() => {
            this._open();
        }, this.m_retryInterval);
    }
}

class SyncLogFileTarget extends LogFileTarget {
    constructor(options) {
        super(options);
        this.m_pos = 0;
    }
    output(logString, option) {
        if (this.m_fd == null) {
            return false;
        }
        this.m_writtenSize += logString.length;
        if (this.m_writtenSize >= this.m_fileMaxSize) {
            console.log("size extend:", this.m_writtenSize, this.m_fileMaxSize);
            this._close();
            let ret = false;
            this._nextFilePath((index, filePath) => {
                this.m_curFileIndex = index;
                this.m_filePath = filePath;
                ret = this._open();
            });
            if (!ret) {
                return false;
            }
        }
        let ret = true;
        try {
            this.m_pos += fs.writeSync(this.m_fd, logString + option.lbr, this.m_pos, 'utf8');
        } catch (error) {
            console.log('write log failed:', error, this.m_filePath, logString);
            ret = false;
        }
        return ret;
    }
    _open() {
        assert(this.m_fd == null);
        try {
            this.m_fd = fs.openSync(this.m_filePath, 'w+');
        } catch (error) {
            this.m_fd = null;
            console.error('open file failed:', this.m_filePath, error);
        }
        if (this.m_fd) {
            console.error("open log file success: file={0}", this.m_filePath);
            this.m_pos = 0;
            return true;
        } else {
            console.error("open log file failed: file={0}", this.m_filePath);
            this._onOpenFailed();
            return false;
        }
    }
    _close() {
        if (this.m_fd) {
            let fd = this.m_fd;
            this.m_fd = null;
            this.m_writtenSize = 0;
            try {
                fs.closeSync(fd);
                console.log("close fd success!", fd);
            } catch (error) {
                console.error("close fd failed!", fd, error);
            }
        }
    }
    _onOpenFailed(err) {
        if (!fs.existsSync(this.m_folder)) {
            console.log("will create dir", this.m_folder);
            try {
                fs.ensureDirSync(this.m_folder);
            } catch (err) {
                console.error("create dir exception:", this.m_folder, err);
            }
            if (fs.existsSync(this.m_folder)) {
                console.info("create dir success:", this.m_folder);
                this._open();
            } else {
                console.error("create dir failed:", this.m_folder);
                this._stopOpen(err);
            }
        } else {
            this._stopOpen(err);
        }
    }
    _stopOpen(error) {
        this.m_status = -1;
        this.m_lastOpenTime = new Date();
        setTimeout(() => {
            this._open();
        }, this.m_retryInterval);
    }
}
var LogTCPTargetPackageHeader = {
    "magic": 1234,
    "type": 0,
    "bodyLen": 0.
};
const g_logTCPTargetPackageHeaderSize = 12;

class LogTCPTargetPackageEncoder {
    constructor() {
        this.m_buffer = Buffer.allocUnsafe(1024 * 4);
        this.m_dataLength = 0;
    }
    Encode(type, logString) {
        const bodyLength = Buffer.byteLength(logString);
        const fullLength = g_logTCPTargetPackageHeaderSize + bodyLength;
        if (fullLength > this.m_buffer.length) {
            this._Grow(fullLength);
        }
        let buffer = Buffer.allocUnsafe(g_logTCPTargetPackageHeaderSize + bodyLength);
        buffer.writeInt32LE(0, 0);
        buffer.writeInt32LE(type, 4);
        buffer.writeInt32LE(bodyLength, 8);
        buffer.write(logString, 12, bodyLength, "utf8");
        this.m_dataLength = fullLength;
    }
    GetBuffer() {
        return this.m_buffer;
    }
    GetDataLength() {
        return this.m_dataLength;
    }
    _Grow(fullLength) {
        const newLength = this.m_buffer.length * 2;
        this.m_buffer = Buffer.allocUnsafe(newLength);
    }
    Decode() {
    }
}

class LogTCPTarget {
    constructor(options) {
        assert(options);
        this.m_host = options.host;
        this.m_port = options.port;
        this.m_initString = options.init;
        if (this.m_initString) {
            assert(typeof this.m_initString === "string");
        }
        this.m_retryInterval = 1000 * 5;
        this.m_connected = false;
        this.m_pending = false;
        this.m_encoder = new LogTCPTargetPackageEncoder();
        this._Open();
    }
    Output(logString, option, OnComplete) {
        if (this.m_connected && !this.m_pending) {
            this.m_encoder.Encode(0, logString);
            this.m_pending = true;
            let This = this;
            this.m_sock.write(this.m_encoder.GetBuffer(), this.m_encoder.GetDataLength(), function() {
                assert(This.m_pending);
                This.m_pending = false;
                OnComplete(0, logString, option);
            });
        } else {
            OnComplete(KRESULT.FAILED, logString, option);
        }
    }
    _Open() {
        assert(!this.m_sock);
        assert(!this.m_connected);
        const options = {
            "readable": false,
            "writable": true,
        };
        let This = this;
        this.m_sock = new net.Socket(options);
        this.m_sock.on("connect", function() {
            assert(!This.m_connected);
            This.m_connected = true;
            This.m_pending = false;
            This._SendInitPackage();
        });
        this.m_sock.on("close", function(hadError) {
            This.m_connected = false;
            This.m_pending = false;
            This._RetryConnect();
        });
    }
    _Connect() {
        assert(this.m_sock);
        assert(!this.m_connected);
        const options = {
            "host": this.m_host,
            "port": this.m_port,
        };
        this.m_sock.connect(options);
    }
    _SendInitPackage() {
        if (this.m_initString) {
            assert(!this.m_pending);
            this.m_encoder.Encode(1, this.m_initString);
            this.m_pending = true;
            let This = this;
            this.m_sock.write(this.m_encoder.GetBuffer(), this.m_encoder.GetDataLength(), function() {
                assert(This.m_pending);
                This.m_pending = false;
            });
        }
    }
    _RetryConnect() {
        let This = this;
        setTimeout(function() {
            This._Connect();
        }, this.m_retryInterval);
    }
}
"use strict";
let BlogUploader = (function() {
    const LOGS_SERVER = 'https://dev.tinyappcloud.com/services/logs';
    class Parser {
        constructor(appid=null) {
            this.m_appid = appid;
        }
        parseDatetime(str) {
            let match = str.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{1,2})\.(\d{0,3})/);
            if (match) {
                let [_, year, month, day, hour, minutes, seconds, milliseconds] = match;
                let padding_month = '0' + (parseInt(month) - 1);
                month = padding_month.slice(-2, padding_month.length);
                return new Date(year, month, day, hour, minutes, seconds, milliseconds || 0).getTime();
            } else {
                return null;
            }
        }
        logToObj(log) {
            const LOG_LEVEL = {
                "all": 0,
                "trace": 1,
                "debug": 2,
                "info": 3,
                "warn": 4,
                "error": 5,
                "fatal": 6,
                "off": 7,
            };
            let match = log.match(/\[([^\[\]]*)\],\[([^\[\]]*)\],\[([^\[\]]*)\]/);
            if ((!match) || match.length !== 4) {
                return null;
            } else {
                let [_, level, datetime, traceInfo] = match;
                datetime = this.parseDatetime(datetime);
                if (!datetime) return null;
                level = LOG_LEVEL[level];
                if (level === undefined) return null;
                let ccid, runtimeID, moduleID, appid;
                if (traceInfo !== '-')
                    [ccid, runtimeID, appid] = traceInfo.split(',');
                if (this.m_appid || appid) {
                    return {
                        appid: this.m_appid || appid,
                        level,
                        logAt: datetime,
                        content: log,
                        runtimeID: runtimeID || null,
                        ccid: ccid || null,
                        moduleID: null
                    };
                } else {
                    return null;
                }
            }
        }
    }
    class Uploader {
        constructor(appid=null) {
            this.m_appid = appid;
            this.m_LogsServer = LOGS_SERVER;
            this.parser = new Parser(appid);
        }
        upload(logs, onComplete) {
            let t = new Date().getTime();
            let data = [];
            let parser = this.parser;
            logs.forEach(log => {
                let d = parser.logToObj(log);
                if (d) {
                    data.push(d);
                } else {
                    console.warn('cannot parse log: ', log);
                }
            });
            BaseLib.postJSONEx(this.m_LogsServer, data, (resp, status, errCode) => {
                let json_data;
                if (errCode !== ErrorCode.RESULT_OK) {
                    onComplete(errCode);
                    return;
                } else if (status !== 200) {
                    onComplete(resp || "not 200 http ok");
                    return;
                } else {
                    try {
                        json_data = JSON.parse(resp);
                        if (typeof(json_data) !== 'object') {
                            onComplete(ErrorCode.RESULT_INVALID_TYPE, resp);
                            return;
                        }
                    } catch (e) {
                        onComplete(e, resp);
                        return;
                    }
                }
                if (json_data.ret !== ErrorCode.RESULT_OK) {
                    onComplete(json_data.ret + ', ' + json_data.msg, json_data);
                } else {
                    onComplete(null, json_data);
                }
            });
        }
    }
    class Watcher {
        constructor(appid, watched_path, logfile_pattern=null) {
            this.watched_path = watched_path;
            this.read_offsets = {};
            this.offset_files = {};
            this.upload_locks = {};
            this.upload_retries = {};
            this.linebreak = blog.getOptions().m_formatter.m_lineBreak;
            this.BUFFER_SIZE = 1024*1024;
            this.LOG_FILE_NAME_PATTERN = logfile_pattern || new RegExp(`.*\\.log`);
            this.uploader = new Uploader(appid);
            this.setProcessCleanup();
            this.resumeUpload();
        }
        setProcessCleanup() {
            let cleanup = function(options, err) {
                Object.keys(this.read_offsets).forEach(log_filename => {
                    this.saveFileOffset(log_filename, this.read_offsets[log_filename]);
                });
                if (err) console.log(err.stack);
                if (options.exit) process.exit();
            };
            process.on('exit', cleanup.bind(this, { cleanup: true }));
            process.on('SIGINT', cleanup.bind(this, { exit: true }));
            process.on('uncaughtException', cleanup.bind(this, { exit: true }));
        }
        resumeUpload() {
            let files = fs.readdirSync(this.watched_path);
            for (let filename of files) {
                if (filename.match(this.LOG_FILE_NAME_PATTERN)) {
                    let bytes = fs.statSync(path.join(this.watched_path, filename)).size;
                    let offset = this.getReadOffset(filename);
                    if (bytes !== offset) {
                        this._uploadLogsAfterOffset(filename, offset);
                    }
                }
            }
        }
        startWatch() {
            let pattern = this.LOG_FILE_NAME_PATTERN;
            fs.watch(this.watched_path, (event, filename) => {
                if (filename.match(pattern)) {
                    let offset = this.getReadOffset(filename);
                    this._uploadLogsAfterOffset(filename, offset, err => {
                        if (err) {
                            console.error(err);
                            let will_retry = this.upload_retries[filename] || this.upload_locks[filename];
                            if (!will_retry) {
                                this._setUploadRetry(filename);
                            }
                        }
                    });
                }
            });
        }
        _uploadLogsAfterOffset(filename, offset, cb) {
            if (this.upload_locks[filename]) {
                console.warn(filename + ' upload locked');
                if (cb) cb(null);
            } else {
                this.upload_locks[filename] = true;
                this.readStreamThenUpload(filename, offset, (err, uploaded_bytes) => {
                    if (err) {
                        this.upload_locks[filename] = false;
                        this.setFileOffset(filename, uploaded_bytes);
                        console.error(err);
                        if (cb) cb(err);
                    } else {
                        this.setFileOffset(filename, uploaded_bytes);
                        this.upload_locks[filename] = false;
                        if (cb) cb(null);
                    }
                });
            }
        }
        _setUploadRetry(filename, retry = 0) {
            if (retry > 3) {
                let timer = this.upload_retries[filename];
                if (timer) clearTimeout(timer);
                console.error('exceed max number of retries when upload logs in: ' + filename);
            } else {
                this.upload_retries[filename] = setTimeout(() => {
                    let offset = this.getReadOffset(filename);
                    this._uploadLogsAfterOffset(filename, offset, err => {
                        if (err) {
                            this._setUploadRetry(filename, retry + 1);
                        } else {
                            return;
                        }
                    });
                }, Math.pow(2, retry) * 1000);
            }
        }
        _getOffsetFile(log_filename) {
            let filepath = this.offset_files[log_filename];
            if (filepath) {
                return filepath;
            } else {
                let offset_file = path.join(this.watched_path, path.basename(log_filename, '.log') + '.uploaded');
                this.offset_files[log_filename] = offset_file;
                return offset_file;
            }
        }
        getReadOffset(log_filename) {
            let offset = this.read_offsets[log_filename];
            if (offset === undefined) {
                let offset_file = this._getOffsetFile(log_filename);
                try {
                    fs.statSync(offset_file);
                    let offset = fs.readFileSync(offset_file);
                    return parseInt(offset);
                } catch (e) {
                    if (e.code === 'ENOENT') {
                        this.read_offsets[log_filename] = 0;
                        return 0;
                    } else {
                        throw e;
                    }
                }
            } else {
                return this.read_offsets[log_filename];
            }
        }
        setFileOffset(log_filename, offset) {
            this.read_offsets[log_filename] = offset;
        }
        saveFileOffset(log_filename, offset) {
            let offset_file = this._getOffsetFile(log_filename);
            fs.writeFileSync(offset_file, offset, { flag: 'w' });
        }
        readStreamThenUpload(filename, offset, cb) {
            let file_path = path.join(this.watched_path, filename);
            var readStream = fs.createReadStream(file_path, { start: offset });
            readStream.setEncoding('utf8');
            readStream
                .on('readable', () => {
                    this._uploadLines(null, readStream, offset, cb);
                })
                .on('close', () => {
                });
        }
        _uploadLines(err, read_stream, uploaded_bytes, cb) {
            let chunk = read_stream.read(this.BUFFER_SIZE);
            if (chunk) {
                let bytes = uploaded_bytes + Buffer.byteLength(chunk, 'utf8');
                let lines = chunk.split(this.linebreak);
                let last = lines.pop();
                if (last !== "" && typeof(last) === 'string') {
                    read_stream.unshift(last);
                    bytes = bytes - Buffer.byteLength(last, 'utf8');
                }
                this.uploader.upload(lines, (err, resp) => {
                    if (err) {
                        cb(err, bytes);
                    } else {
                        this._uploadLines(null, read_stream, bytes, cb);
                    }
                });
            } else {
                cb(null, uploaded_bytes);
            }
        }
        static spawn(blog, appid=null) {
            let fileTarget = blog.getOptions().m_targets[1].m_target;
            let folder = fileTarget.m_folder;
            let filename = fileTarget.m_filename;
            assert(filename, filename);
            let basename = filename.split('[')[0];
            let regexp_log_file = new RegExp(`${basename}(\\[\\d*\\])?\\.\\d*\\.log`);
            let uploader;
            if (appid)
                assert(appid.length === 10);
            uploader = new BlogUploader(appid, folder, regexp_log_file);
            uploader.startWatch();
        }
    }
    return Watcher;
})();
module.exports = BlogUploader;
const BLogLevel = {
    "ALL": 0,
    "TRACE": 1,
    "DEBUG": 2,
    "INFO": 3,
    "WARN": 4,
    "ERROR": 5,
    "CHECK": 6,
    "FATAL": 7,
    "OFF": 8,
    "strings" : ['all', 'trace', 'debug', 'info', 'warn', 'error', 'check', 'fatal', 'off'],
    "toString" : (level) => {
        return BLogLevel.strings[level];
    }
};

class BLogNormalFormatter {
    constructor() {
        this.m_convertFuncs = {
            "object": (arg) => {
                return JSON.stringify(arg);
            },
            'undefined': () => {
                return 'undefined';
            },
            'function': () => {
                return "";
            },
            'string': (arg) => {
                return arg;
            },
        };
        if (BLogEnv.platform() === "win32") {
            this.m_lineBreak = "\r\n";
        } else if (BLogEnv.platform() === "darwin") {
            this.m_lineBreak = "\r";
        } else if (BLogEnv.platform() === "wx") {
            this.m_lineBreak = "\n";
        } else {
            this.m_lineBreak = "\n";
        }
    }
    getLineBreak() {
        return this.m_lineBreak;
    }
    format(values, options) {
        let strValue = "";
        const separator = options.getSeparator();
        let stringHeaders = options.getStringHeaders();
        if (stringHeaders) {
            for (let item in stringHeaders) {
                strValue += stringHeaders[item];
                strValue += separator;
            }
        }
        strValue += '[' + values.level + ']' + separator;
        strValue += '[' + BLogNormalFormatter.formatTime(values.time) + ']' + separator;
        strValue += '[' + values.traceInfo + ']' + separator;
        strValue += this.formatArgs(values.args);
        if (values.pos) {
            strValue += separator + values.pos.file + ':' + values.pos.line;
        }
        return strValue;
    }
    convertArg(arg) {
        const type = typeof arg;
        let result;
        try {
            let convertFunc = this.m_convertFuncs[type];
            if (convertFunc) {
                return convertFunc(arg);
            } else {
                return arg.toString();
            }
        } catch (err) {
            result = "[!!!exception args!!!]";
        }
        return result;
    }
    formatArgs(args) {
        if (args.length < 1) {
            return "";
        }
        let maxIndex = 0;
        let value = "";
        if (typeof args[0] === 'string') {
            value = args[0].replace(/{(\d+)}/g,
                (match, index) => {
                    const numIndex = parseInt(index) + 1;
                    if (numIndex > maxIndex) {
                        maxIndex = numIndex;
                    }
                    return this.convertArg(args[numIndex]);
                });
        } else {
            value = this.convertArg(args[0]);
        }
        for (let index = maxIndex + 1; index < args.length; ++index) {
            value += ' ' + this.convertArg(args[index]);
        }
        return value;
    }
    static fixNumber(num) {
        let ret;
        if (num >= 0 && num <= 9) {
            ret = '0' + num;
        } else {
            ret = num;
        }
        return ret;
    }
    static formatTime(date) {
        const dateString = date.getFullYear() + '-' + BLogNormalFormatter.fixNumber(date.getMonth() + 1) +
            '-' + BLogNormalFormatter.fixNumber(date.getDate()) +
            ' ' + BLogNormalFormatter.fixNumber(date.getHours()) +
            ':' + BLogNormalFormatter.fixNumber(date.getMinutes()) +
            ':' + BLogNormalFormatter.fixNumber(date.getSeconds()) +
            '.' + date.getMilliseconds();
        return dateString;
    }
}

class BLogOptions {
    constructor(options) {
        this.m_switch = true;
        this.m_level = BLogLevel.ALL;
        this.m_logger = "global";
        this.m_pos = true;
        this.m_fullPath = false;
        this.m_headers = {};
        this.m_stringHeaders = {};
        this.m_separator = ',';
        this.m_targets = [];
        if (options) {
            for (let item in options) {
                const type = typeof options[item];
                if (type !== "object") {
                    this[item] = options[item];
                }
            }
            this.m_targets = [];
            for (let i = 0; i < options.m_targets.length; ++i) {
                this.m_targets.push(options.m_targets[i]);
            }
            for (let item in options.m_headers) {
                this.m_headers[item] = options.m_headers[item];
            }
            for (let item in options.m_stringHeaders) {
                this.m_stringHeaders[item] = options.m_stringHeaders[item];
            }
        }
        if (!this.m_formatter) {
            this.m_formatter = new BLogNormalFormatter();
        }
        if (this.m_targets.length <= 0) {
            this.enableConsoleTarget(true);
        }
        BLogEnv.filterOptions(this);
    }
    setSwitch(on) {
        if (on) {
            this.m_switch = true;
        } else {
            this.m_switch = false;
        }
    }
    getLevel() {
        return this.m_level;
    }
    setLevel(level) {
        if (typeof(level) === "string") {
            this.m_level = BLogLevel[level];
        } else if (typeof(level) === "number") {
            this.m_level = level;
        } else {
            assert(false);
        }
    }
    isLevelOn(level) {
        if (level >= this.m_level) {
            return true;
        } else {
            return false;
        }
    }
    isOn(level) {
        if (!this.m_switch) {
            return false;
        }
        if (!this.isLevelOn(level)) {
            return false;
        }
        return true;
    }
    clone() {
        return new BLogOptions(this);
    }
    setLoggerName(name) {
        this.m_logger = name;
    }
    getLoggerName() {
        return this.m_logger;
    }
    setFormatter(formatter) {
        this.m_formatter = formatter;
    }
    getFormatter() {
        return this.m_formatter;
    }
    setSeparator(separator) {
        this.m_separator = separator;
    }
    getSeparator() {
        return this.m_separator;
    }
    enablePos(enable) {
        this.m_pos = enable;
    }
    getPos() {
        return this.m_pos;
    }
    enableFullPath(enable) {
        this.m_fullPath = enable;
    }
    getFullPath() {
        return this.m_fullPath;
    }
    addHeader(name, value) {
        this.m_headers[name] = value;
        this.m_stringHeaders[name] = this.genStringHeader(name);
    }
    removeHeader(name) {
        delete this.m_headers[name];
        delete this.m_stringHeaders[name];
    }
    genStringHeader(name) {
        let headerString = '[' + name + '=' + this.m_headers[name] + ']';
        return headerString;
    }
    getHeaders() {
        return this.m_headers;
    }
    getStringHeaders() {
        return this.m_stringHeaders;
    }
    getTargets() {
        return this.m_targets;
    }
    addTarget(target) {
        this.m_targets.push(target);
    }
    enableConsoleTarget(enable) {
        const defaultConsoleTarget = BLogGetDefaultConsoleTarget();
        if (enable) {
            let exists = false;
            for (let target of this.m_targets) {
                if (target === defaultConsoleTarget) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                this.m_targets.push(defaultConsoleTarget);
            }
            return defaultConsoleTarget;
        } else {
            let ret = false;
            for (let i = 0; i < this.m_targets.length; ++i) {
                if (this.m_targets[i] === defaultConsoleTarget) {
                    this.m_targets.slice(i, i + 1);
                    ret = true;
                    break;
                }
            }
            return ret;
        }
    }
    addFileTarget(options) {
        let rootFolder;
        if (os.platform() === 'win32') {
            rootFolder = "C:\\blog\\";
        } else {
            rootFolder = "/var/blog/";
        }
        let fileName = path.basename(require.main.filename, ".js");
        if (!fileName || fileName.length <= 0) {
            fileName = "node";
        }
        const subFolder = fileName;
        fileName += "[" + process.pid + "]";
        const defaultOptions = {
            "rootFolder": rootFolder,
            "subFolder": subFolder,
            "filename": fileName,
            "filemaxsize": 1024 * 1024 * 16,
            "filemaxcount": 20,
        };
        if (options) {
            for (let item in options) {
                defaultOptions[item] = options[item];
            }
            if (defaultOptions.rootFolder[defaultOptions.rootFolder.length - 1] != '/' &&
                defaultOptions.rootFolder[defaultOptions.rootFolder.length - 1] != '\\') {
                defaultOptions.rootFolder += '/';
            }
        }
        defaultOptions.folder = defaultOptions.rootFolder + defaultOptions.subFolder;
        let target;
        if (options.mode && options.mode === 'sync') {
            let fileTarget = new SyncLogFileTarget(defaultOptions);
            target = new SyncLogMemoryCache({}, fileTarget);
        } else {
            let fileTarget = new AsyncLogFileTarget(defaultOptions);
            target = new AsyncLogMemoryCache({}, fileTarget);
        }
        this.m_targets.push(target);
        return target;
    }
}
var BLogGetGlobalOptions = function() {
    let instance;
    return function() {
        if (!instance) {
            instance = new BLogOptions();
        }
        return instance;
    };
}();

class BLog {
    constructor(options) {
        if (options) {
            this.m_options = new BLogOptions(options);
        } else {
            this.m_options = BLogGetGlobalOptions();
        }
    }
    getOptions() {
        return this.m_options;
    }
    setFunc(func) {
        this.m_framefunc = func;
    }
    log(level, frameIndex, args) {
        const options = this.m_options;
        if (!options.isOn(level)) {
            return;
        }
        const values = {};
        values.traceInfo = "-";
        const lastArg = args[args.length - 1];
        if (typeof(lastArg) === "function") {
            values.traceInfo = lastArg();
        }
        values.level = BLogLevel.toString(level);
        values.time = new Date();
        values.args = args;
        values.headers = options.getHeaders();
        if (this.m_options.getPos()) {
            values.pos = BLog.getPos(this.log, frameIndex);
            if (values.pos.file != null) {
                if (!this.m_options.getFullPath()) {
                    values.pos.file = path.basename(values.pos.file);
                }
            } else {
                values.pos.file = '[source]';
            }
        }
        const formatter = options.getFormatter();
        assert(formatter);
        const stringValue = formatter.format(values, this.m_options);
        const targets = options.getTargets();
        const targetOptions = {
            "level": level,
            "lbr": formatter.getLineBreak(),
        };
        for (let i = 0; i < targets.length; ++i) {
            let target = targets[i];
            target.output(stringValue, targetOptions);
        }
        return this;
    }
    bind(name, option) {
        for (let i in this.m_option) {
            if (!option[i]) {
                option[i] = this.m_option[i];
            }
        }
        const newObj = new BLog(option);
        function __Log() {
            return newObj.log(arguments);
        }
        newObj.setFunc(__Log);
        if (name) {
            module.exports[name] = __Log;
        }
        return __Log;
    }
    static getStack(func) {
        const old = Error.prepareStackTrace;
        Error.prepareStackTrace = (error, stack) => {
            return stack;
        };
        const err = new Error();
        Error.captureStackTrace(err, func);
        const stack = err.stack;
        Error.prepareStackTrace = old;
        return stack;
    }
    static getPos(func, frameIndex) {
        const stack = BLog.getStack(func);
        const frame = stack[frameIndex];
        const pos = {
            "line": frame.getLineNumber(),
            "file": frame.getFileName(),
            "func": frame.getFunctionName(),
        };
        return pos;
    }
}
var BLogGetDefaultLog = (function() {
    let logInstance;
    return function() {
        if (!logInstance) {
            logInstance = new BLog();
        }
        return logInstance;
    };
})();

class BLogManager {
    constructor() {
        this.m_loggers = {};
    }
    addLogger(name, obj) {
        assert(!this.m_loggers[name]);
        this.m_loggers[name] = obj;
    }
    getLogger(name, option) {
        let blogObj = this.m_loggers[name];
        if (!blogObj) {
            console.log("create new logger:", name);
            blogObj = new BLog(option);
            this.m_loggers[name] = blogObj;
        }
        return blogObj;
    }
}
var BLogGetLogManager = (function() {
    let managerInstance;
    return function() {
        if (!managerInstance) {
            managerInstance = new BLogManager();
        }
        return managerInstance;
    };
})();
function BLogModule(logObj) {
    const trace = function() {
        logObj.log(BLogLevel.TRACE, 1, arguments);
    };
    const debug = function() {
        logObj.log(BLogLevel.DEBUG, 1, arguments);
    };
    const info = function() {
        logObj.log(BLogLevel.INFO, 1, arguments);
    };
    const warn = function() {
        logObj.log(BLogLevel.WARN, 1, arguments);
    };
    const error = function() {
        logObj.log(BLogLevel.ERROR, 1, arguments);
    };
    const check = function(exp, ...args) {
        if (!exp) {
            logObj.log(BLogLevel.CHECK, 1, args);
        }
    };
    const fatal = function() {
        logObj.log(BLogLevel.FATAL, 1, arguments);
    };
    const getLogger = function(name, options) {
        if (!options) {
            options = logObj.getOptions();
        }
        let newLogObj = BLogGetLogManager().getLogger(name, options);
        newLogObj.getOptions().setLoggerName(name);
        return BLogModule(newLogObj);
    };
    const clone = function(options) {
        if (!options) {
            options = logObj.getOptions();
        }
        let newLogObj = new BLog(options);
        return BLogModule(newLogObj);
    };
    const getOptions = function() {
        return logObj.getOptions();
    };
    const setLevel = function(levelName) {
        return logObj.getOptions().setLevel(levelName);
    };
    const addHeader = function(name, value) {
        return logObj.getOptions().addHeader(name, value);
    };
    const removeHeader = function(name, value) {
        return logObj.getOptions().removeHeader(name, value);
    };
    const setSeparator = function(separator) {
        return logObj.getOptions().setSeparator(separator);
    };
    const enablePos = function(enable) {
        return logObj.getOptions().enablePos(enable);
    };
    const enableFullPath = function(enable) {
        return logObj.getOptions().enableFullPath(enable);
    };
    const addFileTarget = function(options) {
        return logObj.getOptions().addFileTarget(options);
    };
    const addTarget = function(target) {
        return logObj.getOptions().addTarget(target);
    };
    const enableConsoleTarget = function(enable) {
        return logObj.getOptions().enableConsoleTarget(enable);
    };
    return {
        "trace": trace,
        "debug": debug,
        "info": info,
        "warn": warn,
        "error": error,
        "check" : check,
        "fatal": fatal,
        "log": info,
        "assert": check,
        "getLogger": getLogger,
        "clone": clone,
        "getOptions": getOptions,
        "setLevel": setLevel,
        "addHeader": addHeader,
        "removeHeader": removeHeader,
        "setSeparator": setSeparator,
        "enablePos": enablePos,
        "enableFullPath": enableFullPath,
        "addTarget": addTarget,
        "addFileTarget": addFileTarget,
        "enableConsoleTarget": enableConsoleTarget,
    };
}
const blog = BLogModule(BLogGetDefaultLog());
const BLOG_LEVEL_ALL = BLogLevel.ALL;
const BLOG_LEVEL_TRACE = BLogLevel.TRACE;
const BLOG_LEVEL_DEBUG = BLogLevel.DEBUG;
const BLOG_LEVEL_INFO = BLogLevel.INFO;
const BLOG_LEVEL_WARN = BLogLevel.WARN;
const BLOG_LEVEL_ERROR = BLogLevel.ERROR;
const BLOG_LEVEL_CHECK = BLogLevel.CHECK;
const BLOG_LEVEL_FATAL = BLogLevel.FATAL;
const BLOG_LEVEL_OFF = BLogLevel.OFF;
function BX_SetLogLevel(level) {
    blog.setLevel(level);
}
function BX_EnableFileLog(filedir='/var/blog', filename=null, filemaxsize = null, filemaxcount = null, upload_options=null) {
    const logOptions = {
        "rootFolder": filedir,
        "subFolder": ""
    };
    if (filename) {
        logOptions.filename = filename;
    }
    if (filemaxsize) {
        logOptions.filemaxsize = filemaxsize;
    }
    if (filemaxcount) {
        logOptions.filemaxcount = filemaxcount;
    }
    blog.addFileTarget(logOptions);
    blog.enableConsoleTarget(true);
    BaseLib.mkdirsSync(filedir+'/errors');
    process.on("uncaughtException", function(err) {
        console.log(err);
        console.log(err.stack);
        let errFileName = "";
        if (filename) {
            errFileName = filename+'_crash_'+'['+process.pid+'].log';
        } else {
            errFileName = path.basename(require.main.filename, ".js");
            if (!errFileName || errFileName.length <= 0) {
                errFileName = "node";
            }
            errFileName += '_crash_['+process.pid+'].log';
        }
        let content = "crash time: "+TimeFormater.getFormatTime()+"\n";
        content += err.stack;
        fs.writeFileSync(filedir+'/errors/'+errFileName, content);
        process.exit(-1);
    });
    if (upload_options && upload_options.autoUpload) {
        let {appid} = upload_options;
        BlogUploader.spawn(blog, appid);
    }
}
const BX_LOG = blog.log;
const BX_DEBUG = blog.debug;
const BX_TRACE = blog.trace;
const BX_INFO = blog.info;
const BX_WARN = blog.warn;
const BX_CHECK = blog.check;
const BX_ERROR = blog.error;
const BX_ASSERT = blog.assert;
function assert(val) {}

class TimeFormater {
    static init() {
        TimeFormater._inited = true;
        Date.prototype.Format = function (fmt) {
            var o = {
                "M+": this.getMonth() + 1,
                "d+": this.getDate(),
                "h+": this.getHours(),
                "m+": this.getMinutes(),
                "s+": this.getSeconds(),
                "q+": Math.floor((this.getMonth() + 3) / 3),
                "S": this.getMilliseconds()
            };
            if (/(y+)/.test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
            }
            for (var k in o) {
                if (new RegExp("(" + k + ")").test(fmt)) {
                     fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                }
            }
            return fmt;
        };
    }
    static getFormatTimeHoursAgo(housrs, formatString) {
        if (!TimeFormater._inited) {
            TimeFormater.init();
        }
        if (!housrs) {
            housrs = 0;
        }
        if (formatString == null) {
            return new Date(Date.now()-housrs*TimeFormater._msInHour).Format("yyyy-MM-dd hh:mm:ss");
        }
        return new Date(Date.now()-housrs*TimeFormater._msInHour).Format(formatString);
    }
    static getFormatTimeSecondsAgo(seconds, formatString) {
        if (!TimeFormater._inited) {
            TimeFormater.init();
        }
        if (!seconds) {
            seconds = 0;
        }
        if (formatString == null) {
            return new Date(Date.now()-seconds*1000).Format("yyyy-MM-dd hh:mm:ss");
        }
        return new Date(Date.now()-seconds*1000).Format(formatString);
    }
    static getFormatTime(formatString) {
        if (!TimeFormater._inited) {
            TimeFormater.init();
        }
        if (formatString == null) {
            return new Date().Format("yyyy-MM-dd hh:mm:ss");
        }
        return new Date().Format(formatString);
    }
}
TimeFormater._inited = false;
TimeFormater._msInHour = 3600*1000;

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
    static replaceAll(stringValue, search, replacement) {
        if (typeof(stringValue) === 'string') {
            return stringValue.replace(new RegExp(search, 'g'), replacement);
        }
        return null;
    };
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
    static sortObject(object){
        var sortedObj = {},
            keys = Object.keys(object);
        keys.sort(function(key1, key2){
            key1 = key1.toLowerCase(), key2 = key2.toLowerCase();
            if(key1 < key2) return -1;
            if(key1 > key2) return 1;
            return 0;
        });
        for(var index in keys){
            var key = keys[index];
            if(typeof object[key] == 'object' && !(object[key] instanceof Array)){
                sortedObj[key] = BaseLib.sortObject(object[key]);
            } else {
                sortedObj[key] = object[key];
            }
        }
        return sortedObj;
    }
    static hash(method, s, format) {
      var sum = crypto.createHash(method);
      var isBuffer = Buffer.isBuffer(s);
      if (!isBuffer && typeof s === 'object') {
        s = JSON.stringify(BaseLib.sortObject(s));
      }
      sum.update(s, isBuffer ? 'binary' : 'utf8');
      return sum.digest(format || 'hex');
    }
    static md5(s, format) {
      return BaseLib.hash('md5', s, format);
    }
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
                let funcResult = null;
                try{
                    funcResult = eval(scriptContent);
                    onComplete(funcResult,ErrorCode.RESULT_OK);
                } catch(err) {
                    onComplete(null,ErrorCode.RESULT_SCRIPT_ERROR);
                }
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
            BaseLib.deleteFolderRecursive(curDir);
          } else {
            fs.unlinkSync(curDir);
          }
        });
        fs.rmdirSync(dir);
      }
    }
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
            }
        }
        return null;
    }
    static findOutFile(root,target,type,start_here){
        if(start_here){
        }else{
            root = path.dirname(root);
        }
        let condition = true;
        while(condition){
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
        return BaseLib.findSync(root,true);
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
                                });
                            });
                        });
                    });
                });
            } else {
                if(fd) {
                    fs.write(fd, content, 0, content.length, 0, function(err, written, buffer) {
                        fs.close(fd, function(err) {
                            fs.chmod(filePath, attr || 438, function() {
                                callback(true);
                            });
                        });
                    });
                } else {
                    fs.chmod(filePath, attr || 438, function() {
                        callback(true);
                    });
                }
            }
        });
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
    static getDataEx(postURL,onComplete) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if(xmlhttp.readyState == 4) {
                onComplete(xmlhttp.responseText, xmlhttp.status, ErrorCode.RESULT_OK);
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
        });
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
        return {typeid:infos[0],levelid:infos[1],guid:infos[2],parentid:infos[3]};
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
};

class NodeInfo {
    constructor() {
        this.id = "";
        this.type = "";
        this.interfaces = [];
    }
}

class Authentication {
    constructor(client_private_key, client_public_key,
        ca_server,
        login_server,
        options = {}) {
        let { filePath } = options;
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
    signup(uid, onComplete, extra_info = {}) {
        let pk = this._genPk();
        let origin_pk = pk;
        let { password, meta } = extra_info;
        let sn = BaseLib.createGUID();
        this._postJSON(this.ca_server + '/register', {
                uid,
                pk,
                password,
                sn,
                meta
            },
            resp => {
                let { uid, pk, result, msg } = resp;
                if (result !== ErrorCode.RESULT_OK) {
                    BX_ERROR('singup error: ', result, msg);
                    BX_INFO(resp);
                    onComplete({ result, msg });
                    return;
                }
                this._signinWithSignedPk({ uid, signed_pk: pk, pk: origin_pk }, onComplete);
            });
    }
    signin(uid, onComplete, extra_info = {}) {
        let { signed_pk, pk } = extra_info;
        if (pk && signed_pk) {
            this._signinWithSignedPk({ uid, signed_pk, pk }, onComplete);
        } else {
            this.updateInfo(uid, null, {}, info => this._signinWithSignedPk(info, onComplete));
        }
    }
    updateInfo(uid, pk = null, user_info = {}, onComplete = null) {
        let sn = BaseLib.createGUID();
        let key = this._genKey(uid, sn);
        let { public_key, private_key, password, levelid, meta } = user_info;
        let new_pk;
        if (public_key) {
            new_pk = this._genPk(public_key);
        } else if (pk == null) {
            new_pk = this._genPk();
        }
        let origin_pk = new_pk || pk;
        this._postJSON(this.ca_server + '/register', { pk: new_pk || pk, levelid, password, sn, meta, uid, key },
            resp => {
                let { pk, uid, result, msg } = resp;
                if (result !== ErrorCode.RESULT_OK) {
                    BX_ERROR('updateInfo error: ', result, msg);
                    BX_INFO(resp);
                    onComplete({ result, msg });
                    return;
                }
                let signed_pk = pk;
                if (public_key) {
                    this.public_key = public_key;
                }
                if (private_key)
                    this.private_key = private_key;
                if (onComplete)
                    onComplete({ uid, pk: origin_pk, signed_pk: signed_pk, result: 0 });
            });
    }
    checkToken(uid, token, onComplete) {
        this._postJSON(this.login_server + '/checktoken', { uid, token },
            resp => {
                let { result, uid, expireAt, msg } = resp;
                if (result !== ErrorCode.RESULT_OK) {
                    BX_ERROR('checktoken error: ', result, msg);
                    BX_INFO(resp);
                    onComplete({ result, msg });
                    return;
                }
                onComplete({ result, uid, expireAt, msg });
            });
    }
    _signinWithSignedPk(info = {}, onComplete) {
        let { uid, signed_pk, pk } = info;
        if (uid && signed_pk && pk) {
            let sn = BaseLib.createGUID();
            let key = this._genKey(uid, sn);
            this._postJSON(this.login_server + '/login', {
                    uid,
                    sn,
                    key,
                    pk: signed_pk
                },
                resp => {
                    let { result, token, msg } = resp;
                    if (result != ErrorCode.RESULT_OK) {
                        BX_ERROR('signinWithSignedPk error: ', result, msg);
                        BX_INFO(resp);
                    }
                    onComplete(Object.assign(info, { token, result, msg }));
                });
        } else {
            throw 'miss `uid` or `signed_pk` before login.';
        }
    }
    _genKey(uid, sn) {
        return BaseLib.privateEncrypt(this.private_key,
            BaseLib.md5(`${uid},${sn}`));
    }
    _genPk(public_key = null) {
        let create_time = Math.floor(Date.now() / 1000);
        let expire_time = create_time + 24 * 3600 * 30;
        return `${public_key || this.public_key},${create_time},${expire_time}`;
    }
    _postJSON(url, data, onComplete) {
        BaseLib.postJSONEx(url, data, (resp, status, errCode) => {
            let json_data;
            if (status !== 200) {
                onComplete({ result: status, msg: resp });
                return;
            } else if (errCode !== ErrorCode.RESULT_OK) {
                onComplete({ result: errCode, msg: resp });
                return;
            } else {
                try {
                    json_data = JSON.parse(resp);
                    if (typeof(json_data) !== 'object') {
                        onComplete({ result: ErrorCode.RESULT_INVALID_TYPE, msg: resp });
                        return;
                    }
                } catch (e) {
                    onComplete({ result: ErrorCode.RESULT_INVALID_TYPE, msg: resp });
                    return;
                }
            }
            onComplete(json_data);
        });
    }
}
var KSERVER_PROTOCOL_VERSION = 1;
var KSERVER_PROTOCOL_HEADER = {
    "magic": 0x20161103,
    "length": 40,
    "version": KSERVER_PROTOCOL_VERSION,
    "packageMaxLength": 1024 * 32,
};
var KSERVER_PROTOCOL_CMD = {
    "UNKNOWW": 0,
    "REQ": 1,
    "RESP": 2,
    "EVENT": 3
};

class KServerPackageHeader {
    constructor() {
        this.m_magicNum = KSERVER_PROTOCOL_HEADER.magic;
        this.m_packageLength = 0;
        this.m_protocolVersion = KSERVER_PROTOCOL_HEADER.version;
        this.m_flags = 0;
        this.m_cmdType = KSERVER_PROTOCOL_CMD.UNKNOWW;
        this.m_dataLength = 0;
    }
    Decode(buffer, pos) {
        if (buffer.length < pos + KSERVER_PROTOCOL_HEADER.length) {
            return false;
        }
        this.m_magicNum = buffer.readUInt32LE(pos);
        this.m_packageLength = buffer.readUInt32LE(pos + 4);
        this.m_protocolVersion = buffer.readUInt32LE(pos + 8);
        this.m_flags = buffer.readUInt32LE(pos + 12);
        this.m_cmdType = buffer.readUInt32LE(pos + 16);
        this.m_dataLength = buffer.readUInt32LE(pos + 20);
        return true;
    }
    Encode(buffer, pos) {
        if (buffer.length < pos + KSERVER_PROTOCOL_HEADER.length) {
            return false;
        }
        buffer.writeUInt32LE(this.m_magicNum, pos);
        buffer.writeUInt32LE(this.m_packageLength, pos + 4);
        buffer.writeUInt32LE(this.m_protocolVersion, pos + 8);
        buffer.writeUInt32LE(this.m_flags, pos + 12);
        buffer.writeUInt32LE(this.m_cmdType, pos + 16);
        buffer.writeUInt32LE(this.m_dataLength, pos + 20);
        buffer.writeUInt32LE(0, pos + 24, 16);
        return true;
    }
}

class KServerPackageCodec {
    static Encode(packageInfo) {
        const header = packageInfo.header;
        const data = packageInfo.data;
        const totalLength = data.length + KSERVER_PROTOCOL_HEADER.length;
        header.m_dataLength = data.length;
        header.m_packageLength = totalLength - 8;
        let buffer;
        try {
            buffer = Buffer.allocUnsafe(totalLength);
        } catch (e) {
            BX_WARN("alloc buffer failed!", e);
            buffer = null;
        }
        if (!buffer) {
            return null;
        }
        header.Encode(buffer, 0);
        buffer.write(data, KSERVER_PROTOCOL_HEADER.length, data.length);
        return buffer;
    }
}

class KServerPackageParser {
    constructor(OnRecvPackage) {
        this.m_dataBuffer = Buffer.allocUnsafe(KSERVER_PROTOCOL_HEADER.packageMaxLength + 64);
        this.m_onRecvPackage = OnRecvPackage;
        this.m_header = new KServerPackageHeader();
        this.Reset();
    }
    Reset() {
        this.m_status = 0;
        this.m_leftSize = KSERVER_PROTOCOL_HEADER.length;
        this.m_dataSize = 0;
    }
    PushData(buffer) {
        let srcLen = buffer.length;
        let offset = 0;
        let ret = true;
        for (;;) {
            if (srcLen < this.m_leftSize) {
                buffer.copy(this.m_dataBuffer, this.m_dataSize, offset, offset + srcLen);
                this.m_dataSize += srcLen;
                this.m_leftSize -= srcLen;
                break;
            }
            srcLen -= this.m_leftSize;
            buffer.copy(this.m_dataBuffer, this.m_dataSize, offset, offset + this.m_leftSize);
            offset += this.m_leftSize;
            this.m_dataSize += this.m_leftSize;
            if (this.m_status === 0) {
                ret = this.OnRecvHeader();
            } else if (this.m_status === 1) {
                ret = this.OnRecvBody();
            } else {
                BX_WARN("unexpected status!", this.m_status);
                ret = false;
            }
            if (!ret) {
                break;
            }
        }
        return ret;
    }
    OnRecvHeader() {
        if (!this.m_header.Decode(this.m_dataBuffer, 0)) {
            BX_WARN("decode header failed! ");
            return false;
        }
        if (this.m_header.m_magicNum != KSERVER_PROTOCOL_HEADER.magic) {
            BX_WARN("unknown magic num:", this.m_header.m_magicNum, KSERVER_PROTOCOL_HEADER.magic);
            return false;
        }
        if (this.m_header.m_packageLength > KSERVER_PROTOCOL_HEADER.packageMaxLength ||
            this.m_header.m_packageLength <= 0) {
            BX_WARN("invalid package length:", this.m_header.m_packageLength);
            return false;
        }
        assert(this.m_status === 0);
        this.m_status = 1;
        this.m_leftSize = this.m_header.m_packageLength - KSERVER_PROTOCOL_HEADER.length + 8;
        return true;
    }
    OnRecvBody() {
        let ret = this.m_onRecvPackage(this.m_header, this.m_dataBuffer.slice(KSERVER_PROTOCOL_HEADER.length, this.m_header.m_packageLength + 8));
        this.m_dataSize = 0;
        this.m_status = 0;
        this.m_leftSize = KSERVER_PROTOCOL_HEADER.length;
        return ret;
    }
}

class KServerLimitsChecker {
    static CheckKey(key) {
        if (key.length > 1024) {
        }
    }
}

class KServerRequest {
    constructor(appid, token, seq, onResponse = null) {
        this.m_appid = appid;
        this.m_token = token;
        this.m_seq = seq;
        this.m_onResponse = onResponse;
        this.m_readList = [];
        this.m_readListCB = [];
        this.m_writeList = [];
        this.m_writeListCB = [];
        this.m_watchList = [];
        this.m_watchListCB = [];
        this.m_lock = null;
        this.m_lockResp = null;
    }
    GetSeq() {
        return this.m_seq;
    }
    SetSID(sid) {
        this.m_sid = sid;
    }
    GetSID() {
        return this.m_sid;
    }
    IsEmpty() {
        return (this.m_readList.length === 0
            && this.m_writeList.length === 0
            && this.m_watchList.length === 0
            && this.m_lock == null);
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
            BX_LOG("GetValue resp", resp, key);
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
            BX_DEBUG("GetHashValue response:", resp);
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
    lock(path, option, onResponse) {
        assert(path instanceof Array);
        assert(option.sid);
        assert(option.type === 'read' || option.type === 'write');
        const req = {
            op: 'lock',
            sid: option.sid,
            type: option.type,
            path: path,
        };
        if (option.timeout) {
            req.timeout = req.timeout;
        }
        assert(this.m_lock == null);
        this.m_lock = req;
        this.m_lockResp = (ret, resp) => {
            onResponse(ret, resp);
        };
    }
    unlock(lid, sid, onResponse) {
        assert(lid);
        assert(sid);
        const req = {
            op: 'unlock',
            sid: sid,
            lid: lid,
        };
        assert(this.m_lock == null);
        this.m_lock = req;
        this.m_lockResp = (ret, resp) => {
            onResponse(ret, resp);
        };
    }
    Encode(tcp) {
        const request = {
            "cmd": "req",
            "seq": this.m_seq,
            "appid": this.m_appid,
            "token": this.m_token,
            "ver": 1,
        };
        if (this.m_sid != null) {
            request.sid = this.m_sid;
        }
        if (this.m_readList.length > 0) {
            request.read = this.m_readList;
        }
        if (this.m_writeList.length > 0) {
            request.write = this.m_writeList;
        }
        if (this.m_watchList.length > 0) {
            request.watch = this.m_watchList;
        }
        if (this.m_lock) {
            request.lock = this.m_lock;
        }
        const reqData = JSON.stringify(request);
        if (tcp) {
            let header = new KServerPackageHeader();
            header.m_cmdType = KSERVER_PROTOCOL_CMD.REQ;
            let encodeData = KServerPackageCodec.Encode({
                "header": header,
                "data": reqData
            });
            return encodeData;
        } else {
            return reqData;
        }
    }
    Response(respObj) {
        BX_INFO("response:", respObj);
        if (this.IsEmpty()) {
            if (this.m_onResponse) {
                this.m_onResponse(respObj);
            }
        }
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
            this._responseList(this.m_readListCB, ret);
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
            this._responseList(this.m_writeListCB, ret);
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
            this._responseList(this.m_watchListCB, ret);
        }
        if (this.m_lockResp) {
            let ret = 0;
            let resp;
            if (typeof respObj === 'number') {
                ret = respObj;
            } else if (typeof respObj === "object") {
                if (respObj.hasOwnProperty("ret") && respObj.ret !== 0) {
                    ret = respObj.ret;
                } else {
                    resp = respObj.lock;
                }
            } else {
                ret = KRESULT.FAILED;
            }
            this.m_lockResp(ret, resp);
        }
    }
    _responseList(cbList, respList) {
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
        if (request.IsEmpty()) {
            return false;
        }
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
        let self = this;
        let info = {};
        info._nodeKey = self._nodeKey;
        info._type = self._type;
        info._version = self._version;
        info._lastUpdate = self._lastUpdate;
        info._cacheObject = self._cacheObject;
        info._cacheMap = self._cacheMap;
        info._cacheMapInfo = self._cacheMapInfo;
        info._state = self._state;
        console.log(JSON.stringify(info));
    }
    sync(onComplete) {
        let self = this;
        let request = self._owner._client.NewRequest();
        if(self._type == InfoNode.TYPE_MAP) {
            request.GetHashValue(self._nodeKey,null,-1,function(ret, key, hkey, valueList, ver) {
                if(ret == ErrorCode.RESULT_OK) {
                    let valueArray = valueList.split(",");
                    self._cacheMap = {};
                    self._cacheMapInfo = {};
                    self._lastUpdate = BaseLib.getNow();
                    self._version = ver;
                    self._state = InfoNode.STATE_NORMAL;
                    let request2 = self._owner._client.NewRequest();
                    let completeNum = 0;
                    if(valueList.length > 0) {
                        for(let i=0;i<valueArray.length;++i) {
                            request2.GetHashValue(self._nodeKey,valueArray[i],ver,function(ret, key, hkey, valueList, ver) {
                                let truehkey = decodeURIComponent(hkey);
                                if(ret == ErrorCode.RESULT_OK) {
                                    try {
                                        self._cacheMap[truehkey] = JSON.parse(valueList);
                                    } catch(e) {
                                        console.error('knowledge:sync error: ', e, valueList);
                                    }
                                    self._cacheMapInfo[truehkey] = {"version":ver};
                                }
                                completeNum ++ ;
                                if(completeNum == valueArray.length) {
                                    self._state = InfoNode.STATE_NORMAL;
                                    onComplete(self,ErrorCode.RESULT_OK);
                                }
                            });
                            request2.WatchHashKey(self._nodeKey,valueArray[i],["change"],function() {
                                return;
                            });
                        }
                    } else {
                        self._owner._client.Request(request2);
                        onComplete(self,ErrorCode.RESULT_OK);
                        return;
                    }
                    self._owner._client.Request(request2);
                } else {
                    onComplete(self,ret);
                }
            });
            self._owner._client.Request(request);
        } else if(self._type == InfoNode.TYPE_OBJECT) {
            request.GetValue(self._nodeKey,-1,function(ret,key,value,ver) {
                if(ret == ErrorCode.RESULT_OK) {
                    self._cacheObject = JSON.parse(value);
                    self._lastUpdate = BaseLib.getNow();
                    self._version = ver;
                    self._state = InfoNode.STATE_NORMAL;
                    onComplete(self,ErrorCode.RESULT_OK);
                } else {
                    onComplete(self,ErrorCode.RESULT_UNKNOWN);
                }
            });
            self._owner._client.Request(request);
        }
    }
    getType() {
        let self = this;
        return self._type;
    }
    getState() {
        let self = this;
        return self._state;
    }
    objectRead() {
        let self = this;
        if(self._state == InfoNode.STATE_NORMAL || self._state == InfoNode.STATE_LOCAL_CACHED) {
            if (self._type == InfoNode.TYPE_OBJECT) {
                return self._cacheObject;
            } else {
                BX_ERROR("read infonode " + self._nodeKey + " with error type." + self._type);
            }
        }
        return null;
    }
    objectUpdate(obj,onComplete) {
        let self = this;
        if(self._state == InfoNode.STATE_NORMAL || self._state == InfoNode.STATE_LOCAL_CACHED) {
            if (self._type == InfoNode.TYPE_OBJECT) {
                let request = self._owner._client.NewRequest();
                let onSetOK = function(ret,key,ver) {
                    if(ret == ErrorCode.RESULT_OK) {
                        self._cacheObject = obj;
                        self._version = ver;
                        self._lastUpdate = BaseLib.getNow();
                        onComplete(self,ErrorCode.RESULT_OK);
                    } else {
                        BX_WARN("update object " + self._nodeKey + " error:" + ret);
                        onComplete(self,ret);
                    }
                };
                request.SetValue(self._nodeKey,JSON.stringify(obj),self._version,onSetOK);
                self._owner._client.Request(request);
                return;
            }
        }
        BX_ERROR("cann't update with error type or error state." + self._nodeKey);
    }
    mapGet(key) {
        let self = this;
        if(self._state == InfoNode.STATE_NORMAL || self._state == InfoNode.STATE_LOCAL_CACHED) {
            if(self._type == InfoNode.TYPE_MAP) {
                return self._cacheMap[key];
            }
        }
        BX_ERROR("cann't get map " + self._nodeKey + " " + key);
        return null;
    }
    mapDelete(key,onComplete) {
        let self = this;
        let request = self._owner._client.NewRequest();
        function onSetOK(ret,nodeKey,hkey,ver) {
            if(ret == ErrorCode.RESULT_OK) {
                delete self._cacheMap[hkey];
                delete self._cacheMapInfo[hkey];
                if(onComplete) {
                    BX_INFO("delete map " + nodeKey + " ok.");
                    onComplete(self,ret,hkey);
                }
            } else {
                BX_ERROR("delete map " + nodeKey+ " error:" + ret);
                onComplete(self,ret,hkey);
            }
        }
        request.SetHashValue(self._nodeKey,encodeURIComponent(key),null,-1,onSetOK);
        self._owner._client.Request(request);
    }
    mapSet(key,object,onComplete) {
        let self = this;
        if(self._state == InfoNode.STATE_NORMAL || self._state == InfoNode.STATE_LOCAL_CACHED) {
            if (self._type == InfoNode.TYPE_MAP) {
                let request = self._owner._client.NewRequest();
                let onSetOK = function(ret,nodekey,hkey,ver) {
                    if(ret == ErrorCode.RESULT_OK) {
                        self._cacheMap[key] = object;
                        self._cacheMapInfo[key] = {"version":ver};
                        self._version = ver;
                        self._lastUpdate = BaseLib.getNow();
                        if(onComplete) {
                            onComplete(self,ret,hkey);
                        }
                        BX_INFO("update map " + self._nodeKey + ":" + key +" OK,version:" + ver);
                    } else {
                        BX_WARN("update map " + self._nodeKey + ":" + key +" error:" + ret + ",version:" + ver);
                        onComplete(self,ret,hkey);
                    }
                };
                let keyVersion = -1;
                if(self._cacheMapInfo[key]) {
                    keyVersion = self._cacheMapInfo[key].version;
                }
                request.SetHashValue(self._nodeKey,encodeURIComponent(key),JSON.stringify(object),-1,onSetOK);
                self._owner._client.Request(request);
            }
        } else {
            BX_ERROR("cann't update map " + key + ",error type or error state " + self._type + " " + self._state);
        }
    }
    mapGetClone() {
        let self = this;
        if(self._state == InfoNode.STATE_NORMAL || self._state == InfoNode.STATE_LOCAL_CACHED) {
            if(self._type == InfoNode.TYPE_MAP) {
                return self._cacheMap;
            }
        }
    }
    mapClean(onComplete) {
        let self = this;
        let request = self._owner._client.NewRequest();
        function onCleanOK(ret,nodekey,hkey,ver) {
            if(ret == ErrorCode.RESULT_OK) {
                self._cacheMap = {};
                self._cacheMapInfo = {};
                self._version = ver;
                self._lastUpdate = BaseLib.getNow();
                if(onComplete) {
                    onComplete(self,ret);
                }
            } else {
                BX_ERROR("clean map " + self._nodeKey + " error:" + ret);
                onComplete(self,ret);
            }
        }
        request.SetHashValue(self._nodeKey,null,null,-1,onCleanOK);
        self._owner._client.Request(request);
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
        this._client = null;
        this._updateToken(apptoken);
    }
    _updateToken(newToken) {
        let self = this;
        self._token = newToken;
        self._client = new KServerXHRClient({
            "url" : self._host,
            "appid" : self._appid,
            "token" : self._token,
            "timeout" : self._timeout
        });
        console.log(self._client);
    }
    stop(){
        let self = this;
        if(self._client){
            self._client.Stop();
        }
    }
    getState() {
        let self = this;
        return self._state;
    }
    dependKnowledge(key,nodeType,options) {
        let self = this;
        self._knowKnowledges [key] = {"key":key,"nodeType":nodeType};
        let kinfo = {"key":key,"nodeType":nodeType,"isNeedSync":true,"options":options};
        self._depends[key] = kinfo;
        if(self._state == KnowledgeManager.STATE_READY) {
            self._state = KnowledgeManager.STATE_NEED_SYNC;
        } else if(self._state== KnowledgeManager.STATE_SYNCING) {
            self._syncQueue = self._syncQueue || [];
            self._syncQueue.push(kinfo);
        }
    }
    ready(onReady) {
        let self = this;
        if(self._state == KnowledgeManager.STATE_NEED_SYNC) {
            self._state = KnowledgeManager.STATE_SYNCING;
            self._otherOnReady = new Array();
        } else if(self._state == KnowledgeManager.STATE_SYNCING){
            self._otherOnReady.push(onReady);
            return;
        } else {
            onReady(true);
            return;
        }
        function _startSync() {
            self._syncQueue = self._syncQueue || [];
            for(let key in self._depends) {
                let info = self._depends[key];
                if(info.isNeedSync) {
                    self._syncQueue.push(info);
                }
            }
            self._depends = {};
            let km = self;
            function doSync() {
                if(self._syncQueue.length > 0) {
                    let _info = self._syncQueue.pop();
                    let kInfo = new InfoNode(km,_info.key,_info.nodeType);
                    kInfo.sync(function(infoNode,resultCode) {
                        if(resultCode == ErrorCode.RESULT_OK) {
                            km._cacheNode[_info.key] = kInfo;
                        } else {
                            BX_WARN("sync knowledge " + infoNode._nodeKey + " return " + resultCode );
                        }
                        doSync();
                    });
                } else {
                    self._state = KnowledgeManager.STATE_READY;
                    if(onReady) {
                        BaseLib.asynCall(function(){
                            onReady(true);
                        });
                    }
                    if(self._otherOnReady) {
                        for(let i=0;i<self._otherOnReady.length;++i) {
                            let onReadyFunc = self._otherOnReady[i];
                            BaseLib.asynCall(function(){
                                onReadyFunc(true);
                            });
                        }
                    }
                    self._otherOnReady = null;
                }
            }
            doSync();
        }
        _startSync();
    }
    addknowledgeKey(key,info) {
        let self = this;
        self._cacheNode[key] = info;
    }
    removeknowledgeKey(key) {
        let self = this;
        delete self._knowledge;
    }
    _getRootKeyList(onComplete) {
        let self = this;
        let request = self._client.NewRequest();
        request.GetHashValue(null,null,-1,function(ret, key, hkey, valueList, ver) {
            if(ret == 0) {
                onComplete(ret,valueList.split(","));
            } else {
                onComplete(ret,null);
            }
        });
        self._client.Request(request);
    }
    _createObjectKnowledge(kid,obj,onComplete) {
        let self = this;
         let request = self._client.NewRequest();
         request.SetValue(kid,obj,-1,function(ret,key,ver) {
                if(ret != ErrorCode.RESULT_OK) {
                    onComplete(ret,key);
                } else {
                    onComplete(ret,key);
                }
        });
        self._client.Request(request);
    }
    _mapClean(kid,onComplete) {
        let self = this;
        let request = self._client.NewRequest();
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
        self._client.Request(request);
    }
    _deleteObjectKnowledge(kid,onComplete) {
        let self = this;
        let request = self._client.NewRequest();
        request.SetValue(kid,null,-1,function(ret,key,ver) {
            if(ret == ErrorCode.RESULT_OK) {
                let kInfo = self._cacheNode[kid];
                if(kInfo) {
                    delete self._cacheNode[kid];
                }
                onComplete(ret,key);
            } else {
                onComplete(ret,key);
            }
        });
        self._client.Request(request);
    }
    _createMapKnowledge(kid,onComplete) {
        let self = this;
        let request = self._client.NewRequest();
        request.SetHashValue(kid,"fake","{}",-1,function(ret,key) {
            if(ret != ErrorCode.RESULT_OK) {
                onComplete(ret,key);
            } else {
                let request2 = self._client.NewRequest();
                request2.SetHashValue(kid,"fake",null,-1,function(ret,key) {
                    onComplete(ret,key);
                });
                self._client.Request(request2);
            }
        });
        self._client.Request(request);
    }
    _deleteMapKnowledge(kid,onComplete) {
        let self = this;
        let request = self._client.NewRequest();
        request.SetValue(kid,null,-1,function(ret) {
            if(ret == ErrorCode.RESULT_OK) {
                let kInfo = self._cacheNode[kid];
                if(kInfo) {
                    delete self._cacheNode[kid];
                }
                onComplete(ret,kid);
            } else {
                onComplete(ret,kid);
            }
        });
        self._client.Request(request);
    }
    getDependsKnowledgeInfo() {
        let self = this;
        let result = {};
        for(let k in self._cacheNode) {
            let aNode = self._cacheNode[k];
            if(aNode) {
                result[k] = aNode._version;
            }
        }
        return result;
    }
    applyKnowledgeInfo(kmInfo,onComplete) {
        let self = this;
        let ret = 0;
        let needSync = false;
        let result = {};
        onComplete();
        return null;
    }
    getKnowledge(key) {
        let self = this;
        let result = self._cacheNode[key];
        if(result) {
            if(result.getState() == InfoNode.STATE_NORMAL) {
                return result;
            }
        } else {
            if(self._knowKnowledges[key] == null) {
                BX_ERROR("knowledge " + key + " is not in depends list!");
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
"use strict";

class IDGeneratorClient {
    static create(appID, generatorID, type, kvArgs, onComplete) {
        let generator = new CenteredIDGeneratorClient(appID, generatorID, type);
        generator.initialize(kvArgs, function(error) {
            if (!error) {
                onComplete(0, generator);
            } else {
                onComplete(error, null);
            }
        });
    }
    constructor(appID, generatorID, type) {
        this.m_appID = appID;
        this.m_generatorID = generatorID;
        this.m_type = type;
    }
    get appID() {
        return this.m_appID;
    }
    get generatorID() {
        return this.m_generatorID;
    }
    get type() {
        return this.m_type;
    }
    initialize(kvArgs, onComplete) {
        let error = 0;
        onComplete(error);
    }
    generate(onComplete) {
        let error = 0;
        let id = '';
        onComplete(error, id);
    }
};
IDGeneratorClient.TYPE_UUID_64 = 'uuid64';
IDGeneratorClient.TYPE_SEQ_32 = 'seq32';

class CenteredIDGeneratorClient extends IDGeneratorClient {
    constructor(appID, generatorID, type) {
        super(appID, generatorID, type);
    }
    initialize(kvArgs, onComplete) {
        let error = 0;
        let host = kvArgs.host;
        this.m_getURL = "http://" + `${host}/${type}/${appID}/${generatorID}`;
        onComplete(error);
    }
    generate(onComplete) {
        BaseLib.getData(this.m_getURL, req, (resp) => {
            if (resp) {
                onComplete(resp.error, resp.id);
            } else {
                onComplete(1, null);
            }
        });
    }
};

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

class Zip{
    constructor(input) {
        this.m_zip = new AdmZip(input);
    }
    dump(){
        let self = this;
        BX_INFO('============');
        BX_INFO('=>zip entrys:');
        BX_INFO('============');
        var entrys = self.m_zip.getEntries();
        for(var i in entrys){
            BX_INFO('=>entry name:'+entrys[i].entryName);
        }
        BX_INFO('-----------');
    }
    addLocalFolder(localPath,filter) {
        let self = this;
        localPath = path.normalize(localPath);
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
                        self.m_zip.addFile(p, fs.readFileSync(path), "", 0);
                    } else {
                        self.m_zip.addFile(p, new Buffer(0), "", 0);
                    }
                });
            }
        } else {
            throw "There is a file in the way: " + localPath;
        }
    }
    loadFolderAsync(folder,onSuccess) {
        let self = this;
        self.addLocalFolder(folder);
        self.m_zip.toBuffer(
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
        let self = this;
        self.m_zip.toBuffer(onsuccess,onfailed);
    }
    extractEntryToFolder(entry,targetPath) {
        let self = this;
        self.m_zip.extractEntryTo(entry,targetPath,false,true);
    }
    extractEntryToAsync(entry,targetPath,callback) {
        let self = this;
        var extraPath = targetPath+"_";
        self.m_zip.extractEntryTo(entry,extraPath,false,true);
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
                BX_INFO('ERROR:extractEntryToAsync filed, entry='+entry+", targetPath="+targetPath);
                callback(1);
            });
    }
    readEntryAsync(entryName,callback){
        let self = this;
        var entry = self.m_zip.getEntry(entryName);
        if(entry==null){
            BX_INFO('ERROR:load file filed:'+entryName);
            callback(1);
            return;
        }
        self.m_zip.readFileAsync(entry,function(decompressedBuffer){
            self.m_zip.readAsTextAsync(entry,function(decompressedText){
                callback(0,decompressedText);
            });
        });
    }
    static saveZipDataToFileAsync(zipPath,zipData,callback){
        let self = this;
        BaseLib.writeFileToAsync(zipPath, zipData, true,function(ret){
            if(ret){
                callback(0);
            }else{
                BX_INFO('ERROR:saveZipDataToFileAsync,zipPath:'+zipPath);
                callback(1);
            }
        });
    }
}

class RepositoryPuber{
    constructor(uid,traceID,token){
        this.uid = uid;
        this.traceID = traceID;
        this.token = token;
    }
    searchPackage(dir, result) {
        let self = this;
        let files = fs.readdirSync(dir);
        for (let index in files) {
            let filePath = dir + '/' + files[index];
            let info = fs.statSync(filePath);
            if(info.isDirectory()) {
               self.searchPackage(filePath,result);
            } else if(files[index] == 'config.json') {
                result.push(dir);
            }
        }
    }
    searchJSFile(dir,result) {
        let self = this;
        let files = fs.readdirSync(dir);
        for (let index in files) {
            let filePath = dir + '/' + files[index];
            let file = files[index];
            let info = fs.statSync(filePath);
            if(info.isDirectory()) {
                self.searchJSFile(filePath,result);
            } else if(file.lastIndexOf('.js') == file.length - 3) {
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
            BX_INFO('#  package:' + packageID + ' version:' + version + ' build:' + packageInfo.build);
            if(packageInfo.meta) {
                if(packageInfo.meta.desc) {
                    BX_INFO('#\t' + packageInfo.meta.desc + '\r\n#');
                }
            }
        } else {
            BX_ERROR('miss packageID or version or build in config.json');
            return false;
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
            BX_ERROR('can not read app info!');
            process.exit(1);
        }
        BX_INFO('->Start publish packages from ' + packagesDir);
        let packageList = new Array();
        self.searchPackage(packagesDir,packageList);
        let willPubPackageList = new Array();
        BX_INFO('============');
        for(let i=0;i<packageList.length;++i) {
            let packageDir = packageList[i];
            BX_INFO('->Start check package dir : ' + packageDir);
            let configPath = packageDir + '/config.json';
            let packageInfo = null;
            try{
                packageInfo = JSON.parse(fs.readFileSync(configPath));
            }catch(err){
                BX_ERROR('can not read package info!');
                process.exit(1);
            }
            if (packageInfo == null) {
                BX_ERROR('can not parse ' + configPath + ',invalid package');
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
                    child_process.execFileSync('node', ['-c', jsfiles[j]]);
                    BX_INFO('check ' + jsfiles[j] + ' OK.');
                }catch(err) {
                    BX_ERROR('check ' + jsfiles[j] + ' error.');
                    errorNum = errorNum + 1;
                }
            }
            for (let moduleID in packageInfo.modules) {
                let moduleFile = packageInfo.modules[moduleID];
                try {
                    fs.statSync(packageDir + '/' + moduleFile);
                } catch (err) {
                    BX_INFO('>>WARN: module file not found,' + moduleID + ' : ' + packageDir + '/' + moduleFile);
                    warNum = warNum + 1;
                }
            }
            willPubPackageList.push({
                'relativepath':packageDir.replace(packagesDir+'/',""),
                'info':packageInfo
            });
        }
        let info = {
            'app':appInfo,
            'packages':willPubPackageList,
        };
        return info;
    }
    createPubPackage(packagesDir,appConfigFile,traceID,token,onSuccess){
        let self = this;
        let appInfo = self.loadAppInfo(packagesDir, appConfigFile);
        let pubPackage = {
           'ver':'1001',
           'appid':appInfo.app.appid,
           'uid':self.uid,
           'token':token?token:appInfo.app.token,
           'cmd':'pub',
           'traceid':traceID
        };
        let packageInfos = new Array();
        for(let i=0;i<appInfo.packages.length;++i){
            let pkg = appInfo.packages[i];
            packageInfos.push({
                'id':pkg.info.packageID,
                'ver':pkg.info.version==null?"":pkg.info.version,
                'relativepath':pkg.relativepath
            });
        }
        pubPackage.body = {
            'packages':packageInfos
        };
        let zip = new Zip();
        zip.loadFolderAsync(packagesDir,function(zipData){
            pubPackage.body.md5 = BaseLib.md5(zipData);
            pubPackage.body.length = zipData.length;
            pubPackage.body.type='zip';
            pubPackage.body.content = zipData;
            onSuccess(appInfo.app.repositoryHost, pubPackage);
        });
    }
    pub(packagesDir,appConfigFile,onComplete){
        if(!path.isAbsolute(packagesDir)){
            packagesDir = path.join(__dirname,packagesDir);
        }
        BX_INFO('packages dir:'+packagesDir);
        if(!path.isAbsolute(appConfigFile)){
            appConfigFile = path.join(__dirname,appConfigFile);
        }
        BX_INFO('appConfiFile:'+packagesDir);
        let self = this;
        if(!BaseLib.dirExistsSync(packagesDir)){
            BX_ERROR('packagesDir is not exist:'+packagesDir);
            process.exit(1);
        }
        if (!BaseLib.fileExistsSync(appConfigFile)) {
            BX_ERROR('appConfigFile is not exist:'+appConfigFile);
            process.exit(1);
        }
        self.createPubPackage(packagesDir,appConfigFile,self.traceID,self.token,function(host, pkg){
            BX_INFO('traceid:'+pkg.traceid+'|'+'post pub request to host:'+host);
            self.pubImpl(host,packagesDir,appConfigFile,pkg,onComplete);
        });
    }
    pubImpl(host,packagesDir,appConfigFile,app,onComplete){
        BX_INFO('post to host:'+host);
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
        if(packagever==null){
            packagever = "";
        }
        self.loadFile(packageid,packagever,'config.json',function(ret,config){
            if(!ret){
                BX_ERROR('load config.json failed.');
                onConfig(null);
                onComplete(false);
                return;
            }
            let ignoreContent = onConfig(config);
            if (!ignoreContent) {
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
            resource = path.normalize(urlpath+resource);
        }
        let query = "";
        try{
            query = url.resolve(host,
                resource
                +'appid='+encodeURIComponent(self.appid)
                +'&uid='+encodeURIComponent(self.uid)
                +'&token='+encodeURIComponent(self.token)
                +'&traceid='+encodeURIComponent(self.traceID)
                +'&packageid='+encodeURIComponent(packageid)
                +'&packagever='+encodeURIComponent(packagever)
                +'&filename='+encodeURIComponent(filename));
            console.log('urlpath:'+urlpath);
            console.log('query:'+query);
        }catch(err){
            onComplete(false);
            return;
        }
        BX_INFO('traceid:'+self.traceID+'|'+'load file, '+query);
        BaseLib.getData(query,function(resp,status){
            if( resp!=null){
                let ext = path.extname(filename);
                if(ext=='.json'){
                    let obj = null;
                    try{
                        obj = JSON.parse(resp);
                        BX_INFO('load json:'+filename);
                        BaseLib.asynCall(function(){
                            onComplete(true,obj);
                        });
                    }catch(err){
                        BX_INFO('load json, parse failed:'+filename+', resp:'+resp+',err:'+err);
                        onComplete(false);
                    }
                }else if(ext=='.js'){
                    try {
                        BX_INFO('load js:'+filename);
                        let thisModule = {};
                        let scriptContent = '(function(module) {\n' + resp +'\n})(thisModule);';
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
                    BX_ERROR('UnKnown file type.');
                    onComplete(false);
                }
            }else{
                BX_ERROR('load file failed:'+status);
                onComplete(false);
            }
        });
    }
    loadPackageInfos(onComplete){
        let self = this;
        let req = {
            'ver':'1001',
            'appid':self.appid,
            'uid':self.uid,
            'token':self.token,
            'cmd':'loadpackgeInfos',
            'traceid':self.traceID
        };
        BaseLib.postJSON(self.host,req,function(resp){
            console.log('result:'+resp);
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
            'ver':'1001',
            'appid':self.appid,
            'packageid':packageid,
            'packagever':packagever,
            'uid':self.uid,
            'token':self.token,
            'cmd':'changestate',
            'traceid':self.traceID,
            'state':state
        };
        BX_INFO('traceid:'+self.traceID+'|'+'change package state.');
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
        let local_header = '\'use strict\';let _core = require(\''+corejspath+'\');let BaseLib = _core.BaseLib;let ErrorCode =_core.ErrorCode;let BX_INFO = _core.BX_INFO;let BX_CHECK = _core.BX_CHECK;let Application = _core.Application;let getCurrentRuntime = _core.getCurrentRuntime;let getCurrentApp = _core.getCurrentApp;let XARPackage = _core.XARPackage;let RuntimeInstance = _core.RuntimeInstance;let RuntimeInfo = _core.RuntimeInfo;let Device = _core.Device;let DeviceInfo = _core.DeviceInfo;let OwnerUser = _core.OwnerUser;let GlobalEventManager = _core.GlobalEventManager;let KnowledgeManager = _core.KnowledgeManager;';
        return local_header;
    }
    requireEx(modulePath){
        let scriptContent = fs.readFileSync(modulePath, 'utf8');
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
            BX_ERROR('get puber failed, typeid:'+u.typeid+',levelid:'+u.levelid);
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
        this.m_allObjects = {};
    }
    setObject(objID, objItem) {
        let newObj = {};
        newObj.m_lastUsed = new Date().getTime();
        newObj.m_item = objItem;
        this.m_allObjects[objID] = newObj;
        return true;
    }
    getObject(objID) {
        let result = this.m_allObjects[objID];
        if (result) {
            result.m_lastUsed = new Date().getTime();
            return result.m_item;
        }
        return null;
    }
    removeObject(objID) {
        let result = this.m_allObjects[objID];
        if (result) {
            delete this.m_allObjects[objID];
            return true;
        }
        return false;
    }
    isObjectExists(objID) {
        let result = this.m_allObjects[objID];
        if (result) {
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
                console.log("read " + objPath + " failed");
                onComplete(objID,null);
            } else {
                 console.log("read " + objPath + " ok");
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

class Scheduler {
    constructor(host, uid, token, appid) {
        this.host = host;
        this.uid = uid;
        this.token = token;
        this.appid = appid;
    }
    _info(pkg, msg) {
        return 'traceid:' + pkg.traceid + '|' + msg;
    }
    selectMySQLInstance(instanceID, runtime, onComplete) {
        let self = this;
        let req = {
            'cmd': 'selectmysql',
            'uid': self.uid,
            'token': self.token,
            'traceid': BaseLib.createGUID(),
            'appid': self.appid,
            'instanceid': instanceID
        };
        let msg = self._info(req, 'select mysql, start.');
        BX_INFO(msg);
        msg = self._info(req, 'select mysql, req:');
        BX_INFO(msg, req);
        BaseLib.postJSON(self.host, req, resp => {
            if(resp == null){
                let msg = self._info(req, 'select mysql failed, scheduler no response.');
                BX_ERROR(msg);
                onComplete(1);
                return;
            }
            if(resp.result !== SRESULT.SUCCESS){
                let msg = self._info(req, 'select mysql failed, ret:'+resp.result);
                BX_ERROR(msg);
                onComplete(1);
                return;
            }
            let msg = self._info(req, 'select mysql success, ret:'+resp.result);
            BX_INFO(msg, resp.mysql);
            onComplete(0, resp.mysql);
        });
    }
    selectRuntime(packageInfo, deveiceInfo, onComplete) {
        let self = this;
        let req = {
            'cmd': 'selectruntime',
            'uid': self.uid,
            'token': self.token,
            'traceid': BaseLib.createGUID(),
            'appid': self.appid,
            'packageid': packageInfo.packageID,
            'packageinfo': packageInfo
        };
        if (deveiceInfo.devicetype) {
            req.devicetype = deveiceInfo.devicetype;
        }
        if (deveiceInfo.deviceability) {
            req.deviceability = deveiceInfo.deviceability;
        }
        let msg = self._info(req, 'select runtime, start.');
        BX_INFO(msg);
        msg = self._info(req, 'select runtime, req:');
        BX_INFO(msg, req);
        BaseLib.postJSON(self.host, req, resp => {
            if(resp==null){
                let msg = self._info(req, 'select runtime failed, scheduler no response.');
                BX_ERROR(msg);
                onComplete(1);
                return;
            }
            if(resp.result!==SRESULT.SUCCESS){
                let msg = self._info(req, 'select runtime failed, ret:'+resp.result);
                BX_ERROR(msg);
                onComplete(1);
                return;
            }
            let msg = self._info(req, 'select runtime success, ret:'+resp.result);
            BX_INFO(msg, resp.runtime);
            onComplete(0, resp.runtime);
        });
    }
    createEvent(eventID, onComplete) {
        let self = this;
        let thisRuntime = getCurrentRuntime();
        let runtimeInfo = thisRuntime.createRuntimeInfo();
        let req = {
            'cmd': 'selectevent',
            'uid': self.uid,
            'token': self.token,
            'traceid': BaseLib.createGUID(),
            'appid': self.appid,
            'eventid': eventID,
            'runtimeInfo': runtimeInfo,
        };
        let msg = self._info(req, 'select event, start.');
        BX_INFO(msg);
        msg = self._info(req, 'select event, req:');
        BX_INFO(msg, req);
        BaseLib.postJSON(self.host, req, (resp) => {
            if(resp==null){
                let msg = self._info(req, 'select event failed, scheduler no response.');
                BX_ERROR(msg);
                onComplete(1);
                return;
            }
            if(resp.result!==SRESULT.SUCCESS &&
               resp.result!==SRESULT.EVENT_ALREADY_EXIST){
                let msg = self._info(req, 'select event failed, ret:'+resp.result);
                BX_ERROR(msg);
                onComplete(1);
                return;
            }
            let msg = self._info(req, 'select event success, ret:'+resp.result);
            BX_INFO(msg, resp.event);
            onComplete(0, resp.event);
        });
    }
    removeEvent(eventID, onComplete) {
        let self = this;
        let thisRuntime = getCurrentRuntime();
        let runtimeInfo = thisRuntime.createRuntimeInfo();
        let req = {
            "cmd": "releaseevent",
            "uid": self.uid,
            "token": self.token,
            "traceid": BaseLib.createGUID(),
            "appid": self.appid,
            "eventid": eventID,
            'runtimeInfo': runtimeInfo,
        };
        BX_INFO(self._info(req, "do release event..., req:"), req);
        BaseLib.postJSON(self.host, req, function(resp) {
            if(resp==null){
                BX_ERROR(self._info(req, 'ERROR:release event failed, scheduler no response.'));
                onComplete(1);
                return;
            }
            if(resp.result!==SRESULT.SUCCESS){
                BX_ERROR(self._info(req, 'ERROR:release event failed, ret:'+resp.result));
                onComplete(1);
                return;
            }
            BX_INFO(self._info(req, 'release event success, ret:'+resp.result));
            onComplete(0, resp.event);
        });
    }
    selectBusForEvent(eventID, onComplete) {
        let self = this;
        let thisRuntime = getCurrentRuntime();
        let runtimeInfo = thisRuntime.createRuntimeInfo();
        let req = {
            "cmd": "selectbus",
            "uid": self.uid,
            "token": self.token,
            "traceid": BaseLib.createGUID(),
            "appid": self.appid,
            "eventid": eventID,
            'runtimeInfo': runtimeInfo,
        };
        BX_INFO(self._info(req, "do select bus..., req:"), req);
        BaseLib.postJSON(self.host, req, function(resp) {
            if(resp==null){
                BX_ERROR(self._info(req, 'ERROR:select bus failed, scheduler no response.'));
                onComplete(1);
                return;
            }
            if(resp.result!==SRESULT.SUCCESS){
                BX_ERROR(self._info(req, 'ERROR:select bus failed, ret:'+resp.result));
                onComplete(1);
                return;
            }
            BX_INFO(self._info(req, 'select bus success, ret:'+resp.result));
            onComplete(0, resp.bus);
        });
    }
     callFunction(functionName, deveiceInfo, onComplete) {
        let req = {
            'cmd': 'callfunction',
            'traceid': BaseLib.createGUID(),
            'appid': this.appid,
            'functionName': functionName,
        };
        if (deveiceInfo.devicegroupid) {
            req.devicegroupid = deveiceInfo.devicegroupid
        }
        if (deveiceInfo.devicetype) {
            req.devicetype = deveiceInfo.devicetype;
        }
        if (deveiceInfo.deviceability) {
            req.deviceability = deveiceInfo.deviceability;
        }
        BX_INFO(this._info(req,'call function, start.'));
        BX_INFO(this._info(req,'call function, req:'), req);
        BaseLib.postJSON(this.host, req, resp => {
            if ((resp != null) && (resp.result === 0)) {
                BX_INFO(this._info(req,'call function success'));
                onComplete(0, resp.return);
            } else {
                BX_ERROR(this._info(req,'call function failed.'));
                onComplete(1);
            }
        });
    }
}
function initCurrentRuntime() {
    let runtimeID = BaseLib.createUID(BX_UID_TYPE_RUNTIME,BX_RUNTIME_LEVEL);
    let token = BaseLib.createGUID();
    var thisDevice = new Device();
    function initDeviceConfig(device, appID) {
            device.m_type = "pc_client";
            device.m_ability = [];
            device.m_ownerApps = appID;
            device.m_runtimeRootDir = "";
            device.m_drivers = {};
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
    BX_INFO("initCurrentRuntime OK");
    return ErrorCode.RESULT_OK;
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
        this.m_loadingPackage = {};
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
        this.scheduler = new Scheduler(schedulerhost,this.m_id,this.m_token,this.m_app.getID());
        this.installDefaultDriverFromNode();
    }
    getSchedulerClient(){
        return this.scheduler;
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
                return require("../drivers/mysql").load();
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
        if(this.m_addr!=null && this.m_addr.length>0){
            result.addr.push({"ip":this.m_addr[0].ip, "port":this.m_addr[0].port});
        }
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
        let loadingXAR = thisRuntime.m_loadingPackage[xarInfo]
        if(loadingXAR) {
            BX_INFO("xar " + xarInfo + " is already loading.")
            loadingXAR.onCompleteFuncs.push(onComplete);
            return;
        }
        BX_INFO("start loading xar " + xarInfo);
        loadingXAR = {};
        loadingXAR.onCompleteFuncs = [];
        thisRuntime.m_loadingPackage[xarInfo] = loadingXAR;
        let callOnComplete = (result,code) => {
            onComplete(result,code);
            for(let i = 0;i < loadingXAR.onCompleteFuncs; ++ i) {
                BaseLib.asynCall(loadingXAR.onCompleteFuncs[i]);
            }
        }
        let repositoryList = this.m_app.repositoryList.slice(0);
        let tryLoad = (pos) => {
            if(pos >= repositoryList.length) {
                callOnComplete(null,ErrorCode.RESULT_NOT_FOUND);
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
            let currentTraceID = BaseLib.createGUID();
            let loader = Repository.getLoader(repositoryHost,thisRuntime.getInstanceID(),currentTraceID, thisRuntime.getToken(),thisRuntime.getOwnerApp().getID());
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
                                proxyInfo += "xarVersion";
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
    getRuntimeInfo(runtimeID) {
        let thisRuntime = getCurrentRuntime();
        if(thisRuntime.getInstanceID() == runtimeID) {
            return thisRuntime.createRuntimeInfo();
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
            knowledegePath = "global.runtimes." + deviceGroupID;
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
    selectTargetRuntime(packageID,packageInfo,selectKey,useCache,onComplete) {
        let self = this;
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
                    console.log("NEED IMP!");
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
        let selectExsitRuntime = function(){
            let storagePathList = packageInfo.storages;
            let resultRuntime = null;
            if(storagePathList && storagePathList.length > 0) {
                resultRuntime = thisRuntime.selectRuntimeByStoragePath(storagePathList,deviceGroupID);
            }else{
                resultRuntime = thisRuntime.selectRuntimeByFilter(deviceType,deviceAbility,packageInfo,deviceGroupID);
            }
            return resultRuntime;
        };
        let selectNewRuntime = function(callback){
            self.scheduler.selectRuntime(packageInfo,deveiceInfo,function(err,runtime){
                if(err){
                    BX_ERROR("select runtime from scheduler failed.");
                    return;
                }else{
                    BX_INFO("select runtime from scheduler success.");
                    callback(runtime);
                }
            });
        };
        let resultRuntime = null;
        if (useCache) {
            resultRuntime = selectExsitRuntime();
        }
        if(resultRuntime) {
            BX_INFO("select runtime by storagepath return:" + resultRuntime.id+", state:"+resultRuntime.state);
            onComplete(resultRuntime);
        } else {
            BX_INFO("select new runtime.");
            selectNewRuntime(function(newRuntime){
                onComplete(newRuntime);
            });
        }
        return;
    }
    postRPCCall(remoteRuntimeInfo,functionname,args,traceID,onComplete) {
        if (remoteRuntimeInfo == null) {
            onComplete(null, ErrorCode.RESULT_NO_TARGET_RUNTIME);
            return;
        }
        let thisRuntime = this;
        let postURL = BaseLib.getUrlFromNodeInfo(remoteRuntimeInfo)+"/rpc";
        let callChain = getCurrentCallChain();
        let postBody = {};
        postBody.seq = BaseLib.createGUID();
        postBody.src = this.m_id;
        postBody.function_name = functionname;
        postBody.trace_id = traceID;
        postBody.args = BaseLib.encodeParamAsJson(args);
        postBody.knowledges = this.m_knowledegeManager.getDependsKnowledgeInfo();
        postBody.ccid = callChain.getID();
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

class CallChain {
    constructor(parentCC = null,ccid="") {
        let needLogStart = true;
        if(ccid.length <= 0) {
            this.m_id = BaseLib.createGUID();
        } else {
            needLogStart = false;
            this.m_id = ccid;
        }
        this.m_parentCCID = "";
        this.m_callStack = [];
        this.m_frameID = 0;
        this.m_isEnd = false;
        this.m_startTime = new Date();
        if(needLogStart) {
            if(parentCC == null) {
                BX_INFO("##START CC,id=" + this.m_id,getCurrentTraceInfo(this));
            } else {
                this.m_parentCCID = parentCC.getID();
                let codeFrame = parentCC.getCurrentCodeFrame();
                BX_INFO("##START SUBCC,id=" + this.m_id + ",parent=" + this.m_parentCCID + ",from " + codeFrame.funcName + "@" + codeFrame.id,getCurrentTraceInfo(this));
            }
        }
    }
    getID() {
        return this.m_id;
    }
    getCurrentCodeFrame() {
        return this.m_callStack[this.m_callStack.length-1];
    }
    checkIsEnd() {
        if(this.m_isEnd) {
            BX_ERROR("callChain is END!!!",getCurrentTraceInfo(this));
        }
    }
    logEnter(funcName) {
        this.checkIsEnd();
        this.m_frameID ++ ;
        let codeFrame = {};
        codeFrame.id = this.m_frameID;
        codeFrame.funcName = funcName;
        this.m_callStack.push(codeFrame);
        BX_INFO ("##ENTER codeframe " + codeFrame.funcName + "@" + codeFrame.id,getCurrentTraceInfo(this));
    }
    logLeave(funcName) {
        this.checkIsEnd();
        let currentCodeFrame = this.getCurrentCodeFrame();
        if(currentCodeFrame) {
            if(currentCodeFrame.funcName === funcName) {
                this.m_callStack.pop();
                BX_INFO("##LEAVE codeframe " + currentCodeFrame.funcName + "@" + currentCodeFrame.id,getCurrentTraceInfo(this));
                return;
            }
        }
        BX_ERROR("callChain.logLeave error:" + funcName,getCurrentTraceInfo(this));
    }
    logCall(funcName) {
        this.checkIsEnd();
        this.m_frameID ++ ;
        let codeFrame = {};
        codeFrame.id = this.m_frameID;
        codeFrame.funcName = funcName;
        this.m_callStack.push(codeFrame);
        BX_INFO ("##CALL codeframe " + codeFrame.funcName + "@" + codeFrame.id,getCurrentTraceInfo(this));
    }
    logReturn(funcName) {
        this.checkIsEnd();
        let currentCodeFrame = this.getCurrentCodeFrame();
        if(currentCodeFrame) {
            if(currentCodeFrame.funcName === funcName) {
                this.m_callStack.pop();
                BX_INFO("##RETURN codeframe " + currentCodeFrame.funcName + "@" + currentCodeFrame.id,getCurrentTraceInfo(this));
                return;
            }
        }
        BX_ERROR("callChain.logReturn error:" + funcName,getCurrentTraceInfo(this));
    }
    logEnd() {
        this.checkIsEnd();
        if(this.m_callStack.length > 0) {
            BX_ERROR("callChain.logEnd error,have codeframe not return.",getCurrentTraceInfo(this));
            return;
        }
        this.m_isEnd = true;
        BX_INFO("##END callchain, use time", new Date() - this.m_startTime, getCurrentTraceInfo(this));
    }
    logWaitSubCCEnd(subccid) {
    }
}
CallChain.s_one = null;
function setCurrentCallChain(callChain) {
    CallChain.s_one = callChain;
}
function getCurrentCallChain() {
    if(CallChain.s_one == null) {
        CallChain.s_one = new CallChain();
    }
    return CallChain.s_one;
}
function getCurrentTraceInfo(callChain = null) {
    let result = {};
    let thisRuntime = getCurrentRuntime();
    if(thisRuntime) {
        result.runtimeID = thisRuntime.getInstanceID();
    } else {
        result.runtimeID = "";
    }
    let thisApp = getCurrentApp();
    if(thisApp) {
        result.appID = thisApp.getID();
    } else {
        result.appID = "";
    }
    if(callChain) {
        result.CCID = callChain.getID();
    } else {
        result.CCID = getCurrentCallChain().getID();
    }
    return function() {
        return result.CCID + "," + result.runtimeID + "," + result.appID;
    };
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
        this.m_serviceMeta = null;
        this.m_knowledgeServerInfo = null;
        this.m_repositoryServerInfo = null;
        this.m_schedulerServerInfo = null;
        this.m_caServerInfo = null;
        this.m_loginServerInfo = null;
        this.m_logHost = "";
        this.m_clusterHost = null;
    }
    getDeviceID() {
        return this.m_id;
    }
    setDeviceID(id) {
        let oldid = this.m_id;
        this.m_id = id;
        return oldid;
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
    loadFromConfig(configInfo, serviceMeta) {
        this.m_token = configInfo.device_token;
        let baseInfo = configInfo.device_info;
        this.m_id = baseInfo.id;
        this.m_type = baseInfo.type;
        this.m_ability = baseInfo.ability;
        this.m_drivers = baseInfo.drivers;
        this.m_addr = baseInfo.addr;
        this.m_ownerApps = configInfo.owner_apps;
        this.meta = configInfo.meta;
        this.m_runtimeRootDir = configInfo.runtime_root_dir;
        this.m_ownerUserID = configInfo.owner.user_id;
        this.m_ownerUserToken = configInfo.owner.user_token;
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
var WebSocket = require("ws");

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
        };
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
        this.m_nextBusID = null;
        this.m_opened = false;
        this.onopen = null;
        this.onclose = null;
    }
    _send(reqString) {
        this.m_sock.send(reqString);
    }
    GetID() {
        return this.m_id;
    }
    Start() {
        assert(!this.m_opened);
        BX_INFO("will start webscoket to:", this.m_addr, this.m_id);
        let This = this;
        this.m_sock = new WebSocket(this.m_addr, {
            protocolVersion: 8,
            origin: 'http://websocket.org'
        });
        this.m_sock.on("open", function() {
            BX_INFO("websocket connected to", This.m_addr, This.m_id);
            This._OnOpen();
        });
        this.m_sock.on("error", function(err) {
            BX_ERROR("websocket break from", This.m_addr, This.m_id);
            console.log(err);
        });
        this.m_sock.on("close", function() {
            BX_ERROR("websocket close from ", This.m_addr, This.m_id);
            This._OnClose();
        });
        this.m_sock.on("message", function(data, flags) {
            BX_INFO("websocket recv ", data, This.m_id);
            This._OnMessage(data);
        });
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
    setNextBusID(busID) {
        this.m_nextBusID = busID;
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
        if (this.m_nextBusID) {
            req.bus_id = this.m_nextBusID;
            this.m_nextBusID = null;
        }
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
        if (this.m_nextBusID) {
            req.bus_id = this.m_nextBusID;
            this.m_nextBusID = null;
        }
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
        if (this.m_nextBusID) {
            req.bus_id = this.m_nextBusID;
            this.m_nextBusID = null;
        }
        const reqString = JSON.stringify(req);
        this._send(reqString);
    }
    AttachEvent(id, autoNew, OnComplete) {
        const req = this.m_reqlist.Create("attach_event", function(resp) {
            if (OnComplete) {
                OnComplete(resp.ret);
            }
        });
        req.id = id;
        req.src_id = this.m_id;
        if (autoNew) {
            req.auto_new = autoNew;
        }
        if (this.m_nextBusID) {
            req.bus_id = this.m_nextBusID;
            this.m_nextBusID = null;
        }
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
        if (this.m_nextBusID) {
            req.bus_id = this.m_nextBusID;
            this.m_nextBusID = null;
        }
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
        if (this.m_nextBusID) {
            req.bus_id = this.m_nextBusID;
            this.m_nextBusID = null;
        }
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
        if (this.m_nextBusID) {
            req.bus_id = this.m_nextBusID;
            this.m_nextBusID = null;
        }
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
        if (this.m_nextBusID) {
            req.bus_id = this.m_nextBusID;
            this.m_nextBusID = null;
        }
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
        this.m_km = km;
        this.m_schedulerClient = getCurrentRuntime().getSchedulerClient();
        this.m_busClients = {};
        this.m_busClientByEventID = {};
        this.m_listeners = {};
        this.m_cookie = 1024;
    }
    _getEventInfoFromKServer(eventID) {
        let self = this;
        let eventInfo = self.m_km.getKnowledge("global.events");
        if (eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);
            return eventObj;
        } else {
            BX_ERROR("global event root object is not exist,MUST create this node!!!");
            return null;
        }
    }
    _getBUSURLFromList(theList) {
        if (theList) {
            if (theList.length > 0) {
                let index = BaseLib.getRandomNum(0, theList.length);
                return theList[index];
            }
        }
        return "";
    }
    _getBUSClientByURL(eventID, busURL, onComplete) {
        let self = this;
        let result = self.m_busClients[busURL];
        if (result) {
            if (result.state == "CONNECTED") {
                onComplete(result.client, ErrorCode.RESULT_OK);
            } else {
            }
        } else {
            let clientInfo = {};
            clientInfo.state = "INIT";
            self.m_busClients[busURL] = clientInfo;
            BX_INFO("create busclient to :" + busURL);
            clientInfo.client = new WebSocketClient(getCurrentRuntime().getID(), "runtime", busURL);
            let onClientOpen = function() {
                clientInfo.client.Register(null, function() {
                    clientInfo.state = "CONNECTED";
                    self.m_busClientByEventID[eventID] = clientInfo;
                    BX_INFO("websocket client connected to " + busURL);
                    onComplete(clientInfo.client, ErrorCode.RESULT_OK);
                });
            };
            let onClientActive = function(eventID, srcid, param) {
                self._onBUSActive(eventID, eventID, srcid, param);
            };
            let onClientClose = function() {
                BX_WARN("bus client break.");
            };
            clientInfo.client.onopen = onClientOpen;
            clientInfo.client.onactive = onClientActive;
            clientInfo.client.onclose = onClientClose;
            clientInfo.client.Start();
            return clientInfo;
        }
    }
    _getEventBusClient(eventID, isAutoCreate, onComplete) {
        let self = this;
        let clientInfo = self.m_busClientByEventID[eventID];
        if (clientInfo) {
            onComplete(clientInfo.client, ErrorCode.RESULT_OK);
            return;
        }
        if (!isAutoCreate) {
            onComplete(null, ErrorCode.RESULT_NOT_FOUND);
            return;
        }
        let doGetBusClientFromURL = function(busURL) {
            if (busURL.length == 0) {
                self.m_schedulerClient.selectBusForEvent(eventID, function(err,busInfo) {
                    if (err === ErrorCode.RESULT_OK) {
                        doGetBusClientFromURL(busInfo.busurl);
                    } else {
                        onComplete(null, err);
                    }
                });
            } else {
                self._getBUSClientByURL(eventID, busURL, function(busClient, resultCode) {
                    if (resultCode == ErrorCode.RESULT_OK) {
                        self.m_busClientByEventID[eventID] = self.m_busClients[busURL];
                        onComplete(busClient, resultCode);
                    } else {
                        onComplete(null, resultCode);
                    }
                });
            }
        };
        let eventObj = self._getEventInfoFromKServer(eventID);
        if (eventObj) {
            let busURL = "";
            let useCache = false;
            if (eventObj.busList) {
                busURL = self._getBUSURLFromList(eventObj.buslist);
                useCache = true;
            }
            doGetBusClientFromURL(busURL, function(busClient, resultCode) {
                if (resultCode === ErrorCode.RESULT_OK) {
                    onComplete(busClient, resultCode);
                } else {
                    if (useCache) {
                        doGetBusClientFromURL("");
                    } else {
                        onComplete(null, resultCode);
                    }
                }
            });
            return busURL;
        }
        return null;
    }
    _onBUSActive(eventID, srcid, param) {
        let self = this;
        let trueEventID = eventID;
        BX_TRACE(eventID + "active:" + srcid + "," + param);
        if (eventID == "registerClient" || eventID == "unregisterClient") {
            trueEventID = eventID + "_listenerChanged";
        }
        let listeners = self.m_listeners[trueEventID];
        if (listeners) {
            for (let i = 0; i < listeners.length; ++i) {
                let listener = listeners[i];
                listener.func(param);
            }
        }
    }
    _attachInnerListener(eventID, func) {
        let self = this;
        let listeners = self.m_listeners[eventID];
        if (listeners == null) {
            listeners = new Array();
            self.m_listeners[eventID] = listeners;
        }
        self.m_cookie = self.m_cookie + 1;
        let listener = {};
        listener.cookie = self.m_cookie;
        listener.func = func;
        listeners.push(listener);
        return listener.cookie;
    }
    _detachInnerListener(eventID, cookie) {
        let self = this;
        let listeners = self.m_listeners[eventID];
        if (listeners == null) {
            return null;
        }
        for (let i = 0; i < listeners.length; ++i) {
            if (listeners[i].cookie == cookie) {
                listeners.splice(i, 1);
                return listeners;
            }
        }
        return listeners;
    }
    isEventCreated(eventID) {
        let self = this;
        let eventInfo = self.m_km.getKnowledge("global.events");
        if (eventInfo) {
            let eventObj = eventInfo.mapGet(eventID);
            if (eventObj) {
                return ErrorCode.RESULT_OK;
            } else {
                return ErrorCode.RESULT_NOT_FOUND;
            }
        } else {
            BX_ERROR("global event root object is not exist,MUST create this node!!!");
            return ErrorCode.RESULT_UNKNOWN;
        }
    }
    attach(eventID, func, onComplete) {
        let self = this;
        let busClient = null;
        let clientInfo = self.m_busClientByEventID[eventID];
        if (clientInfo) {
            busClient = clientInfo.client;
        }
        let attachResult = ErrorCode.RESULT_NOT_FOUND;
        let doAttach = function(bclient, ret) {
            if (ret == ErrorCode.RESULT_OK) {
                bclient.AttachEvent(eventID, null, function(ret) {
                    if (ret == 0) {
                        let cookie = self._attachInnerListener(eventID, func);
                        onComplete(ErrorCode.RESULT_OK, cookie);
                    } else {
                        onComplete(ret, 0);
                    }
                });
            } else {
                BX_WARN("cann't get bus client.eventID:" + eventID);
                onComplete(ret, 0);
            }
        };
        if (busClient === null) {
            self._getEventBusClient(eventID, true, function(newClient, ret) {
                doAttach(newClient, ret);
            });
        } else {
            doAttach(busClient, ErrorCode.RESULT_OK);
        }
    }
    detach(eventID, cookie) {
        let self = this;
        let listener = self._detachInnerListener(eventID, cookie);
        if (listener == null) {
            return ErrorCode.RESULT_NOT_FOUND;
        }
        if (listener.length < 1) {
            delete self.m_listeners[eventID];
            let busClient = null;
            let clientInfo = self.m_busClientByEventID[eventID];
            if (clientInfo) {
                busClient = clientInfo.client;
            }
            if (busClient) {
                busClient.DetachEvent(eventID, function() {
                    self.m_schedulerClient.detachEvent(eventID);
                });
            } else {
                BX_WARN("Cann't found busClient at detach " + eventID);
            }
        }
        return ErrorCode.RESULT_OK;
    }
    fireEvent(eventID, params) {
        let self = this;
        self._getEventBusClient(eventID, true, function(newClient) {
            if (newClient) {
                newClient.ActiveEvent(eventID, params);
            } else {
            }
        });
    }
    createEvent(eventID, onComplete) {
        let self = this;
        let eventObj = self._getEventInfoFromKServer(eventID);
        if (eventObj) {
            onComplete(ErrorCode.RESULT_ALREADY_EXIST);
        } else {
            self.m_schedulerClient.createEvent(eventID, function(err,event) {
                onComplete(err);
            });
        }
        self.m_km.dependKnowledge("global.events", 1);
        self.m_km.ready(function() {});
        return;
    }
    removeEvent(eventID, onComplete) {
        let self = this;
        self.m_schedulerClient.removeEvent(eventID, function(err,event) {
            onComplete(err);
        });
        return;
    }
    attachListenerChanged(eventID, func, onComplete) {
        let self = this;
        let busClient = null;
        let clientInfo = self.m_busClientByEventID[eventID];
        if (clientInfo) {
            busClient = clientInfo.client;
        }
        let attachResult = ErrorCode.RESULT_NOT_FOUND;
        if (busClient == null) {
            let eventInfo = self.m_km.getKnowledge("global.events");
            if (eventInfo) {
                let eventObject = eventInfo.mapGet(eventID);
                if (eventObject) {
                    self._getBUSClient(eventObject.busID, eventID, function(busClient, result) {
                        if (result == ErrorCode.RESULT_OK) {
                            busClient.AttachEvent("registerClient", null, function() {
                                busClient.AttachEvent("unregisterClient", null, function() {});
                            });
                            let cookie = self._attachInnerListener(eventID + "_listenerChanged", func);
                            onComplete(ErrorCode.RESULT_OK, cookie);
                        } else {
                            onComplete(result, 0);
                        }
                    });
                    return;
                }
            } else {
                BX_WARN("cann't read event info,eventID:" + eventID);
            }
        } else {
            busClient.AttachEvent("registerClient", null, function() {
                busClient.AttachEvent("unregisterClient", null, function() {});
            });
            let cookie = self._attachInnerListener(eventID + "_listenerChanged", func);
            onComplete(ErrorCode.RESULT_OK, cookie);
            return;
        }
        onComplete(attachResult, 0);
    }
    detachListenerChanged(eventID, cookie) {
        let self = this;
        let listener = self._detachInnerListener(eventID + "_listenerChanged", cookie);
        if (listener == null) {
            return ErrorCode.RESULT_NOT_FOUND;
        }
        if (listener.length < 1) {
            delete self.m_listeners[eventID];
            let busClient = null;
            let clientInfo = self.m_busClientByEventID[eventID];
            if (clientInfo) {
                busClient = clientInfo.client;
            }
            if (busClient) {
                busClient.DetachEvent("registerClient", function() {});
                busClient.DetachEvent("unregisterClient", function() {});
                delete self.m_busClientByEventID[eventID];
                delete self.m_busClients[busClient.GetID()];
            } else {
                BX_WARN("Cann't found busClient?");
            }
        }
        return ErrorCode.RESULT_OK;
    }
    getListenerList(eventID, onComplete) {
        let self = this;
        let busClient = null;
        let clientInfo = self.m_busClientByEventID[eventID];
        if (clientInfo) {
            busClient = clientInfo.client;
        }
        let attachResult = ErrorCode.RESULT_NOT_FOUND;
        if (busClient == null) {
            let eventInfo = self.m_km.getKnowledge("global.events");
            if (eventInfo) {
                let eventObject = eventInfo.mapGet(eventID);
                if (eventObject) {
                    self._getBUSClient(eventObject.busID, eventID, function(busClient, result) {
                        if (result == ErrorCode.RESULT_OK) {
                            busClient.GetClientList("runtime", onComplete);
                        } else {
                            onComplete(result, null);
                        }
                    });
                    return;
                }
            } else {
                BX_WARN("cann't read event info,eventID:" + eventID);
            }
        } else {
            busClient.GetClientList("runtime", onComplete);
            return;
        }
    }
}

class SystemEvent
{
    constructor(host, uid, token, appid) {
        this.host = host;
        this.uid = uid;
        this.token = token;
        this.appid = appid;
    }
    _info(pkg, msg) {
        return 'traceid:'+ pkg.traceid + '|' + msg;
    }
    attachEvent(eventID, functionName, args, onComplete) {
        let req = {
            'cmd': 'attachsystemevent',
            'uid': this.uid,
            'token': this.token,
            'traceid': BaseLib.createGUID(),
            'appid': this.appid,
            'eventid': eventid,
            'args': args
        }
        let msg = this._info(req,'attach system event, start.');
        BX_INFO(msg);
        msg = this._info(req,'attach system event, req:');
        BX_INFO(msg, req);
        BaseLib.postJSON(this.host, req, (resp) => {
            if ((resp != null) && (resp.result === 0)) {
                let msg = this._info(req,'select event success.');
                BX_INFO(msg, resp.event);
                callback(true, resp.event);
            } else {
                let msg = this._info(req,'select event failed.');
                BX_ERROR(msg);
                callback(false);
            }
        })
    }
    detachEvent(eventID, onComplete, ...params) {
    }
};
SystemEvent.EVENT_ID_TIMER = "system.timer";
module.exports = {};
module.exports.BaseLib = BaseLib;
module.exports.ErrorCode = ErrorCode;
module.exports.KRESULT = KRESULT;
module.exports.RRESULT = RRESULT;
module.exports.SRESULT = SRESULT;
module.exports.blog = blog;
module.exports.BX_SetLogLevel = BX_SetLogLevel;
module.exports.BX_EnableFileLog = BX_EnableFileLog;
module.exports.BLOG_LEVEL_ALL = BLOG_LEVEL_ALL;
module.exports.BLOG_LEVEL_TRACE = BLOG_LEVEL_TRACE;
module.exports.BLOG_LEVEL_DEBUG = BLOG_LEVEL_DEBUG;
module.exports.BLOG_LEVEL_INFO = BLOG_LEVEL_INFO;
module.exports.BLOG_LEVEL_WARN = BLOG_LEVEL_WARN;
module.exports.BLOG_LEVEL_ERROR = BLOG_LEVEL_ERROR;
module.exports.BLOG_LEVEL_CHECK = BLOG_LEVEL_CHECK;
module.exports.BLOG_LEVEL_FATAL = BLOG_LEVEL_FATAL;
module.exports.BLOG_LEVEL_OFF = BLOG_LEVEL_OFF;
module.exports.BX_LOG = BX_LOG;
module.exports.BX_INFO = BX_INFO;
module.exports.BX_WARN = BX_WARN;
module.exports.BX_DEBUG = BX_DEBUG;
module.exports.BX_ERROR = BX_ERROR;
module.exports.BX_CHECK = BX_CHECK;
module.exports.BX_ASSERT = BX_ASSERT;
module.exports.BX_ERROR = BX_ERROR;
module.exports.Application = Application;
module.exports.getCurrentRuntime = getCurrentRuntime;
module.exports.getCurrentApp = getCurrentApp;
module.exports.XARPackage = XARPackage;
module.exports.RuntimeInstance = RuntimeInstance;
module.exports.Scheduler = Scheduler;
module.exports.RuntimeInfo = RuntimeInfo;
module.exports.getCurrentCallChain = getCurrentCallChain;
module.exports.setCurrentCallChain = setCurrentCallChain;
module.exports.getCurrentTraceInfo = getCurrentTraceInfo;
module.exports.CallChain = CallChain;
module.exports.Device = Device;
module.exports.DeviceInfo = DeviceInfo;
module.exports.OwnerUser = OwnerUser;
module.exports.WebSocketClient = WebSocketClient;
module.exports.KServerXHRClient = KServerXHRClient;
module.exports.InfoNode = InfoNode;
module.exports.KnowledgeManager = KnowledgeManager;
module.exports.IDGeneratorClient = IDGeneratorClient;
module.exports.GlobalEventManager = GlobalEventManager;
module.exports.SystemEvent = SystemEvent;
module.exports.initCurrentRuntime = initCurrentRuntime;
module.exports.Authentication = Authentication;
module.exports.Zip = Zip;
module.exports.Repository = Repository;
module.exports.BX_UID_TYPE_CORE = BX_UID_TYPE_CORE;
module.exports.BX_UID_TYPE_APP = BX_UID_TYPE_APP;
module.exports.BX_UID_TYPE_DEVELOPER = BX_UID_TYPE_DEVELOPER;
module.exports.BX_UID_TYPE_RUNTIME = BX_UID_TYPE_RUNTIME;
module.exports.BX_RUNTIME_LEVEL = BX_RUNTIME_LEVEL;
