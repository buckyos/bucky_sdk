"use strict";

var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var url = require('url');
var PATH_SEPARATOR = path.normalize("/");

var core = null;
var rclient = null;
var KServerXHRClient = null;
var ErrorCode = null;
var InfoNode = null;
var BaseLib = null;
var KnowledgeManager = null;

class Tools {
    constructor(args) {
        this.op = '';
        if (args.options.pub) {
            if(args.options.stop||args.options.start){
                this.printUsage();
                process.exit(0);
                return;
            }
            this.op = 'pub';
        } else if (args.options.stop) {
            if(args.options.pub||args.options.start){
                this.printUsage();
                process.exit(0);
                return;
            }
            this.op = 'stop';
        } else if (args.options.start) {
            if(args.options.pub||args.options.stop){
                this.printUsage();
                process.exit(0);
                return;
            }
            this.op = 'start';
        }

        this.m_mode = 0;
        if (args.options.fake) {
            this.m_mode = 1;
        }

        this.m_rmodules = args.modules;
        this.m_developerID = args.uid;
        this.m_token = args.token;
        this.m_maindir = args.packages;
        this.m_appConfig = args.app;
        this.m_appKnowledges = args.knowledges;

        this.m_needPublish = true;
        this.m_errorNum = 0;
        this.m_warNum = 0;
        this.m_appInfo = null;
        this.m_appKClient = null;

        this.m_version = "1.0.0.0";
    }

    init() {
        let self = this;

        self.wellcom();

        if (self.m_maindir && self.m_maindir[0] != '/' && self.m_maindir[1] != ':') {
            self.m_maindir = path.join(__dirname, self.m_maindir);
        }

        if (self.m_appConfig && self.m_appConfig[0] != '/' && self.m_appConfig[1] != ':') {
            self.m_appConfig = path.join(__dirname, self.m_appConfig);
        }

        if (self.m_appKnowledges && self.m_appKnowledges[0] != '/' && self.m_appKnowledges[1] != ':') {
            self.m_appKnowledges = path.join(__dirname, self.m_appKnowledges);
        }

        try {
            console.log(self.m_appConfig);
            self.m_appInfo = JSON.parse(fs.readFileSync(self.m_appConfig));
        } catch (err) {
            console.log(">>ERROR: Cann't read app info!");
            console.log(err.stack);
            self.printUsage();
            process.exit(1);
        }

        self.m_appKClient = new KnowledgeManager(self.m_appInfo.knowledgeHost,
            self.m_appInfo.appid,
            self.m_developerID + "|" + self.m_token,
            5 * 1000);
    }

    run() {
        let self = this;
        switch (self.op) {
            case 'pub':
                self.doPub();
                break;
            case 'stop':
                self.doStop();
                break;
            case 'start':
                self.doStart();
                break;
            default:
                self.printUsage();
                break;
        }
    }

    wellcom() {
        console.log("+----------------------------------------------------+");
        console.log("|                                                    |");
        console.log("| BuckyCloud tool,version " + this.m_version + "\t\t     |");
        console.log("|                                                    |");
        console.log("+----------------------------------------------------+");
    }

    printUsage() {
        console.log("usage:\t node tools.js [-pub] -uid developerid -token developertoken -packages package_dir -app app.json [-knowledges knowledges.json]");
        console.log("\t node tools.js [-stop] -app app.json");
        console.log("\t node tools.js [-start] -app app.json");
    }

    doPub() {
        let self = this;
        if (self.m_maindir == null) {
            console.log("ERROR:maindir is null")
            self.printUsage();
            process.exit(1);
        }

        if (self.m_developerID == null) {
            console.log("ERROR:uid is null.")
            self.printUsage();
            process.exit(1);
        }

        if (self.m_token == null) {
            console.log("ERROR:token is null.")
            self.printUsage();
            process.exit(1);
        }

        console.log("->Start pub packages...");
        let appFolder = self.m_maindir;
        let traceId = BaseLib.createGUID();

        rclient.init(self.m_rmodules)
        let puber = rclient.getPuber(self.m_developerID, traceId, self.m_token);
        if (puber == null) {
            console.log("ERROR: check developerId + token failed.")
            process.exit(1);
        }

        puber.pub(appFolder, self.m_appConfig, function(ret, resp, theAppInfo) {
            if (ret) {
                let packageCount = theAppInfo.body.packages.length;
                let packageNames = "";
                for (let i in theAppInfo.body.packages) {
                    let pkg = theAppInfo.body.packages[i];
                    packageNames = packageNames + " [" + pkg.relativepath + "]";
                }
                console.log("->" + packageCount.toString() + " packages published :" + packageNames);
                //update knowledges
                if (self.m_appKnowledges && self.m_mode != 1) {
                    console.log(JSON.stringify(self.m_appInfo));
                    self.updateKnowledge(function(ret) {
                        if (ret) {
                            console.log(">Update knowledges success");
                        } else {
                            console.log(">Update knowledges failed");
                        }
                        process.exit(0);
                    });
                } else {
                    console.log(">No knowledges need update");
                    process.exit(0);
                }
            } else {
                console.log(">>Publish failed!");
            }
        });
    }

    doStop() {
        let self = this;
        console.log(">>Stopping app:" + self.m_appInfo.appid);
        let request = self.m_appKClient.NewRequest();
        request.SetValue("global.app", { "state": "off" }, -1, function(ret, key, ver) {
            if (ret == ErrorCode.RESULT_OK) {
                console.log(">>App:" + self.m_appInfo.appid + " stoped");
            } else {
                console.log(">>Stop app:" + self.m_appInfo.appid + " failed, err: " + ret);
            }
        });
        self.m_appKClient.Request(request);
    }

    doStart() {
        let self = this;
        console.log(">>Start app:" + self.m_appInfo.appid);
        let request = self.m_appKClient.NewRequest();
        request.SetValue("global.app", { "state": "on" }, -1, function(ret, key, ver) {
            if (ret == ErrorCode.RESULT_OK) {
                console.log(">>App:" + self.m_appInfo.appid + " started");
            } else {
                console.log(">>Start app:" + self.m_appInfo.appid + " failed, err: " + ret);
            }
        });
        self.m_appKClient.Request(request);
    }

    updateKnowledge(onComplete) {
        let self = this;
        console.log(">Start Update Knowledge");
        if (!self.m_needPublish) {
            console.log("no knowledge need pub.");
            onComplete(true);
            return;
        }

        console.log("will read knowledge from " + self.m_appKnowledges);
        let knowledges = JSON.parse(fs.readFileSync(self.m_appKnowledges));
        let count = 0;
        let errorCount = 0;

        function checkComplete() {
            if (count == 0) {
                if (errorCount > 0) {
                    onComplete(false);
                } else {
                    onComplete(true);
                }

            }
        }

        for (let kid in knowledges) {
            let kInfo = knowledges[kid];
            console.log("will udpate : " + kid + " " + kInfo);
            if (kInfo.type == 0) {
                count = count + 1
                self.m_appKClient._createObjectKnowledge(kid, kInfo.object, function(ret) {
                    count = count - 1;
                    if (ret == 0) {
                        console.log(">Update knowledge: " + kid + " ok.");
                    } else {
                        errorCount = errorCount + 1;
                        self.m_errorNum = self.m_errorNum + 1;
                        console.log(">Update knowledge: " + kid + " failed.");
                    }
                    checkComplete();
                });

            } else if (kInfo.type == 1) {
                let thisMap = kInfo.map;
                let thisCount = 0;
                let mapLen = 0;
                count = count + 1;

                self.m_appKClient._mapClean(kid, function(result) {
                    self.m_appKClient._createMapKnowledge(kid, function(ret) {
                        count = count - 1;
                        let rawKClient = new KServerXHRClient({
                            "url": self.m_appInfo.knowledgeHost,
                            "appid": self.m_appInfo.appid,
                            "token": self.m_developerID + "|" + self.m_token,
                            "timeout": 1000 * 5
                        });

                        let request2 = rawKClient.NewRequest();
                        let needR2 = false;
                        for (let mk in thisMap) {
                            thisCount = thisCount + 1;
                            count = count + 1;
                            needR2 = true;
                            console.log(">Update knowledge: " + kid + " : " + mk);
                            request2.SetHashValue(kid, mk, JSON.stringify(thisMap[mk]), "-1", function(ret, key) {
                                thisCount = thisCount - 1;
                                count = count - 1;
                                if (ret != ErrorCode.RESULT_OK) {
                                    errorCount = errorCount + 1;
                                    self.m_errorNum = self.m_errorNum + 1;
                                    console.log(">Update knowledge: " + kid + " failed.");
                                } else {
                                    if (thisCount == 0) {
                                        console.log(">Update knowledge: " + kid + " OK.");
                                    }
                                }
                                checkComplete();
                            });
                        }

                        if (needR2) {
                            self.m_appKClient.Request(request2);
                        } else {
                            console.log(">Update knowledge: " + kid + " ok.");
                            checkComplete();
                        }
                    });
                });
            }
        }
    }

    checkRunning(onComplete) {
        let self = this;
        console.log(">>Checking app state. ID:" + self.m_appInfo.appid);
        let postURL = self.m_appInfo.appHost + self.m_appInfo.appid + "/isRunning/";
        console.log(postURL);
        BaseLib.postData(postURL, "check", function(resp, code) {
            if (resp) {
                onComplete(resp);
            } else {
                console.log(">>Check app:" + self.m_appInfo.appid + " state failed!");
                onComplete("unknown");
            }
        });
    }
}

function main() {
    let args = {
        options: {
            fake: false,
            pub: false,
            stop: false,
            start: false
        },
        packages: null,
        app: null,
        knowledges: null,
        modules: __dirname + PATH_SEPARATOR + "bucky_modules",
        uid: null,
        token: null
    };

    // setup args
    for (let i = 0; i < process.argv.length; i++) {
        for (let key in args) {
            if (process.argv[i].indexOf("-" + key) == 0) {
                args[key] = process.argv[i + 1];
            }
        }

        for (let key in args.options) {
            if (process.argv[i].indexOf("-" + key) == 0) {
                args.options[key] = true;
            }
        }
    }

    if (args.options.fake) {
        core = require("./local_core.js");
    } else {
        core = require("./node_core.js");
    }
    rclient = core.Repository;
    KServerXHRClient = core.KServerXHRClient;
    ErrorCode = core.ErrorCode;
    InfoNode = core.InfoNode;
    BaseLib = core.BaseLib;
    KnowledgeManager = core.KnowledgeManager;

    // start
    let tools = new Tools(args);
    tools.init();
    tools.run();
}

main();