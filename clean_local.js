"use strict";
var fs = require('fs');
var path = require('path');
var PATH_SEPARATOR = path.normalize("/");

function deleteFolderRecursive(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

function dirExistsSync(filePath){
    try{
        return fs.statSync(filePath).isDirectory();
    }catch (err){
        return false;
    }
}

function findOnceSync(root, pattern) {
    if(dirExistsSync(root)){
        var files = fs.readdirSync(root);
        for(var i in files){
            var file = files[i];
            var fullFileName = path.join(root, file);

            if (dirExistsSync(fullFileName) && pattern.test(fullFileName)) {
                return path.normalize(fullFileName) + PATH_SEPARATOR ;
            }
        };
    }
    return null;
}

function findOutDir(root,target){
    root = path.dirname(root);
    while(true){
        var dirName = findOnceSync(root,target);
        if(dirName!=null){
            return dirName;
        }else{
            var old = root;
            root = path.dirname(root);
            if(old===root){
                return null;
            }
        }
    }
}

function deleteRepositoryFakeModules(){
    var folder = process.cwd();
    var moduleDir = findOutDir(folder,new RegExp("bucky_modules"));
    if(moduleDir==null){
        return;
    }else{
        deleteFolderRecursive(moduleDir);
    }
}

console.log("=>delete storage");
deleteFolderRecursive("./storage");

console.log("=>delete cache");
deleteFolderRecursive("./cache");

console.log("=>delete local bucky modules");
deleteRepositoryFakeModules();

console.log("=>done");