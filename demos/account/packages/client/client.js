

"use strict";


function testLogin(onComplete) {
    getCurrentRuntime().loadXARPackage("userinfo",function(thePackage) {
        thePackage.loadModule("userinfo",function (userinfo,errorCode) {
            userinfo.Login("bucky_admin", "123123123", function (result, errorCode) {
                console.log("login result is " + result);
                if (onComplete) {
                    onComplete(result);
                }
            });
        });
    });
}

function testRegister(onComplete) {
    getCurrentRuntime().loadXARPackage("userinfo",function(thePackage) {
        thePackage.loadModule("userinfo",function (userinfo,errorCode) {
            userinfo.Register("bucky_admin", "123123123", "admin", function (result, errorCode) {
                console.log("register result is " + result);
                if (onComplete) {
                    onComplete(result);
                }
            });
        });
    });
}

module.exports = {};
module.exports.testLogin = testLogin;
module.exports.testRegister = testRegister;

