/**
 * Created by waterflier on 2016/4/17.
 */

"use strict";

function Login(username,md5Pwd,onComplete) {
    let thisRuntime = getCurrentRuntime();
    let logger = thisRuntime.getLogger();
    logger.info("!!!!start Login.");
    //console.log(arguments);
    let rs = thisRuntime.getRuntimeStorage("/users/");

    rs.getObject("user." + username,function(objid,usrObj) {
        if(usrObj) {
            if(usrObj.password == md5Pwd) {
                onComplete(0);
            } else {
                onComplete(1);
            }
        } else {
            onComplete(3);
        }
    });
}

function Register(username,md5pwd,desc,onComplete) {
    let thisRuntime = getCurrentRuntime();
    let logger = thisRuntime.getLogger();
    logger.info("!!!!start register.");
    //console.log(arguments);
    let rs = thisRuntime.getRuntimeStorage("/users/");
    let uobj = {};
    uobj.id = username;
    uobj.password = md5pwd;
    uobj.desc = desc;
    

    let objid = "user." + username;

    rs.isObjectExists(objid,function(objid,isExists) {
        if(isExists) {
            logger.info("user is exists");
            onComplete(1);
        } else {
            logger.info("user not register,will add user");
            rs.setObject(objid,uobj,function(){
                logger.info("user register ok");
                onComplete(0);
            });
        }
    });
}
module.exports = {};
module.exports.Login = Login;
module.exports.Register = Register;

