'use strict';

const path = require('path');
const fs = require('fs');
const deepcopy = require('deepcopy');
const assert = require('assert');

const configName = 'config.json';

function processModule(packageName, moduleName, moduleFile, packageInfo) {
    let funcArray = null;
    let thisModule = {};
    let EVAL_ENABLE = true;
    let scriptContent = "(function(module) {\n" + fs.readFileSync(moduleFile).toString() +"\n})(thisModule,EVAL_ENABLE);";
    console.log("will test Module:\n");
    eval(scriptContent);

    funcArray = thisModule.exports;
    let outContent = `"use strict";\n\nlet targetPackageInfo = ${packageInfo};\n\n`;

    for (let fn in funcArray) {
        outContent += `function ${fn}() {
    let onComplete = arguments[arguments.length - 1];
    let thisRutnime = getCurrentRuntime();
    let rpc_args = Array.prototype.slice.call(arguments);
    rpc_args.pop();
    thisRutnime.selectTargetRuntime("${packageName}",targetPackageInfo,"",function(targetRuntime) {
        thisRutnime.postRPCCall(targetRuntime,"${packageName}:${moduleName}::${fn}",rpc_args,"",onComplete);
    });
}

`;
    }

    outContent += 'module.exports={};\n';
    for (let fn in funcArray) {
        outContent += `module.exports.${fn}=${fn};\n`;
    }

    testProxyCode(outContent, funcArray);
    return outContent;
}

function createProxyDirectory(packagePath, proxyPath) {
    const packageDir = path.dirname(packagePath);
    const packageName = path.basename(packagePath);
    const proxyPackage = proxyPath ? proxyPath : path.join(packageDir, `${packageName}_proxy`);
    if (!fs.existsSync(proxyPackage)) {
        console.log(`create directory ${proxyPackage}`);
        fs.mkdirSync(proxyPackage);
    }

    return proxyPackage;
}

function saveProxyFile(proxyFile, content) {
    console.log(`save proxy file: ${proxyFile}`);
    console.log('proxy file content:');
    console.log(content);
    fs.writeFileSync(proxyFile, content);
}

function saveConfigProxy(proxyDirectory, configJSON) {
    const configProxy = deepcopy(configJSON);
    configProxy.packageID = `${configProxy.packageID}_proxy`;
    const configFile = path.join(proxyDirectory, configName);
    const prettyConfigContent = JSON.stringify(configProxy, null, 4);
    saveProxyFile(configFile, prettyConfigContent);

    const onloadFile = path.join(proxyDirectory,"onload.js");
    const onloadContent = `"use strict";`
    saveProxyFile(onloadFile, onloadContent);

}

function saveModuleProxy(proxyDirectory, moduleName, content) {
    const moduleFile = path.join(proxyDirectory, moduleName);
    saveProxyFile(moduleFile, content);
}

function testProxyCode(code, orgFuncArray) {
    let thisModule = {};
    let EVAL_ENABLE = true;
    let scriptContent = "(function(module,EVAL_ENABLE) {\n" + code +"\n})(thisModule,EVAL_ENABLE);";
    console.log("will test proxy");
    eval(scriptContent);

    let funcArray = thisModule.exports;
    for (let fn in orgFuncArray) {
        assert(funcArray[fn]);
    }
}

function processPackage(packagePath, proxyPath) {
    if (!fs.existsSync(packagePath)) {
        console.error(`package path ${packagePath} not exists`);
        return false;
    }

    const configPath = path.join(packagePath, configName);
    if (!fs.existsSync(configPath)) {
        console.error(`config file ${configPath} not exists`);
        return false;
    }

    const configContent = fs.readFileSync(configPath).toString();
    
    const config = JSON.parse(configContent);
    if(config.storages) {
        delete config["storages"];
    }
    config.deviceType = "*";
    const packageName = config.packageID;

    const proxyDirectory = createProxyDirectory(packagePath, proxyPath);
    saveConfigProxy(proxyDirectory, config);
    
    for (const moduleName in config.modules) {
        const moduleFile = path.join(packagePath, config.modules[moduleName]);

        if (!fs.existsSync(moduleFile)) {
            console.error(`module file ${moduleFile} not exists`);
            continue;
        }

        const out = processModule(packageName, moduleName, moduleFile, configContent);
        // console.log(out);
       
        saveModuleProxy(proxyDirectory, config.modules[moduleName], out);
    }
}

function main() {
    let packagePath = null;
    let proxyPath = null;
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i] == '-package') {
            packagePath = process.argv[i+1];
        } else if (process.argv[i] == '-out') {
            proxyPath = process.argv[i+1];
        }
    }

    if (packagePath == null) {
        console.error(`package path ${packagePath} not exists`);

        console.error('example: node proxytools.js -package package_abs_path -out proxy_dir_path');
        return;
    }

    processPackage(packagePath, proxyPath);

    process.exit(0);
}

main();