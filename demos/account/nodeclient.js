"use strict";

let thisRuntime = getCurrentRuntime();
thisRuntime.loadXARPackage("client",function(thePackage) {
    if(thePackage) {
        console.log("load client XAR OK");
    } else {
        console.log("load XAR faield");
    }

    thePackage.loadModule("client",function(theModule) {
        let clientModule = theModule;
        console.log("load client module ok");
        clientModule.testLogin(function() {
            console.log("testLogin return failed");
            clientModule.testRegister(function() {
                console.log("testRegister ok");
                clientModule.testLogin(function() {
                    console.log("testLast login ok");
                    process.exit(0);
                });
            });
        });
    })
});