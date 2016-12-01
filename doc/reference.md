
#参考手册  

##全局函数 
### + RuntimeInstance getCurrentRuntime() 
常用接口，获得当前代码所在的RuntimeInstance对象。  
如果该函数返回null,说明框架没有正确初始化。  

### + Application getCurrentApp()  
常用接口，获得当前的应用系统。  
如果该函数返回null,说明框架没有正确初始化。  

### + initCurrentRuntime   
在各种javascript环境中用来初始化bucky的client runtime。根据javascript运行环境的不同，该函数可能有不同的参数。  
在小程序环境中初始化Bucky Runtime  

#### + BX_LOG(string info,int level,traceid)
输出一行日志，内容为info,级别为一下可选值
>var BX_LOG_LEVEL_ERROR = 50;
>var BX_LOG_LEVEL_WARN  = 40;
>var BX_LOG_LEVEL_INFO  = 30;
>var BX_LOG_LEVEL_DEBUG = 20;
通过调整当前的日志级别，可以让低于日志级别的日志不显示。
`以上日志是传统的本地日志，Bucky还有更适合分布式系统调试使用的统一日志收集系统`  
BX_INFO,BX_ERROR,BX_DEBUG,BX_WARN 是相应级别的便捷函数。

### - void setCurrentApp(Application)  
这是一个私有接口，正常应用逻辑开发不应该手工初始化 Application对象。  


##Application  
Application对象，用来得到当前运行的分布式应用的信息  

### + void Application.init(AppInfo appInfo,function onInitComplete)  
异步初始化Application对象。Application对象会从core service中读取必要的信息，所以这个操作时异步的。  
#### 参数列表  
#### `appInfo`：一般从app.json读取，内容如下：  
>{  
>  "appID" : "bx.demos.account",  
>  "appHost" : "https://weixin.xmaose.com/apphost/",  
>  "repositoryHost" : "https://weixin.xmaose.com/repository/"  
>}  
appID是应用的唯一ID。  
appHost与repositoryHost是app运行依赖的核心服务地址。配置不同的服务器可以用来区分线上版本和开发版本。  

#### `onInitComplete`: function(erroCode,appInfo){...}  
当初始化完成后，会调用该函数。  

### + string Application.getID()  
返回Application的唯一ID.   

### + string Application.getHost()  
返回Application依赖的app host服务地址。  

##RuntimeInfo  
用来表示一个具体的RuntimeInstance.这个对象应用开发很少使用，我们并不鼓励在应用逻辑中过于依赖某个具体的RuntimeInstance。  
#### `RuntimeInfo.ID` : RuntimeInstance的唯一ID。   
#### `RuntimeInfo.OwnerDeviceID` : RuntimeInstance所在的设备ID。   
#### `RuntimeInfo.OwnerAppID` : RuntimeInstance所属的Application ID。  
#### `RuntimeInfo.OwnerAppHost` : RuntimeInstance所属的Application所在的App Host服务地址。  
### `RuntimeInfo.Ability` : RuntimeInstance所拥有的Ability列表，通常是其所在Device的Ability列表的子集。  
### `RuntimeInfo.PostURL` : RuntimeInstance的RPC URL,系统内部使用。  

##RuntimeInstance  
核心对象。    
RuntimeInstance代表的是当前代码的运行环境。一般通过全局函数getCurrentRuntime()来获取。  

### + string RuntimeInstance.getInstanceID()  
返回当前Runtime的唯一ID  

### + Device RuntimeInstance.getOwnerDevice()  
返回当前Runtime所在的设备对象。  

### + Application RuntimeInstance.getOwnerApp()  
返回当前Runtime属于哪个Application. 通常该函数的返回等价于getCurrentApp()  

### + RuntimeStorage RuntimeInstance.getRuntimeStorage(string globalPath)  
Application所要永久保存的数据，最后一定会在某些Runtime上落地。当应用代码在这些有数据的Runtime上运行时，就能通过RuntimeStorage得到保存的数据。  
如果Runtime并不持有这些数据，那么该函数返回null。  
#### `globalPath` 表示数据所在的全局目录路径
想象Application把数据保存在一个全局磁盘上，那么很自然的就会对数据分目录放，这些目录就通过globalPath来表达。
如果应用比较简单，可以把数据全部保存在"/"分区下。

### + LocalStorage RuntimeInstance.getLocalStorage()
`未实现` 返回当前Runtime持有的本地存储管理器。

### + RuntimeCache RuntimeInstance.getRuntimeCache()
`未实现` 返回当前Runtime持有的内存Cache管理器。

### + RuntimeInfo RuntimeInstance.createRuntimeInfo()
返回与指代RuntimeInstance的一个RuntimeInfo. 

### + KnowledgeManager RuntimeInstance.getKnowledgeManager()
返回当前的Runtime所使用的KnowledegeManager对象。这是应用开发得到KnowledgeManager对象的主要方法。

### + Driver RuntimeInstance.getDriver(string driverID)
得到一个驱动。驱动能否获取成功取决于当前Runtime所在的设备。
驱动通常能提供一些功能，用于与旧世界打交道。应用开发应该尽量避免使用驱动。
目前实现的驱动：(`小应用暂未开放加载驱动`)
bx.mysql.client
bx.mysql.redis

### + void RuntimeInstance.loadXARPackage(xarInfo xarID,function onComplete)

### + XARPackage RuntimeInstance.getLoadedXARPackage(xarInfo xarID)

### + RuntimeInfo RuntimeInstance.getRuntimeInfo(runtimeID) 
通过runtimeID获得其RuntimeInfo。

### + RuntimeInstance.selectTargetRuntime(packageID,packageInfo,selectKey,onComplete)
proxy会使用的核心函数，为一个操作选择一个合适的runtime

### + RuntimeInstance.callFunc(functionName,args,selectKey,traceID,onComplete)

### + RuntimeInstance.postRPCCalll(remoteRuntimeInfo,functionname,args,traceID,onComplete)

### - void RuntimeInstance.loadLocalXarPackage(xarInfo xarID,function onComplete)

### - bool RuntimeInstance.isXARPackageCanLoad(packageInfo,string instanceID) 
判断当前Runtime是否允许`直接加载`目标XAR包。如果不允许，那么当前Runtime在加载目标XAR包时，会加载该XAR的proxy包

### - void RuntimeInstance.createRuntimeOnDevice()
`将要废弃` 私有函数

### - void RuntimeInstance.resumeRuntime()
`将要废弃` 私有函数

### - void RuntimeInstance.selectRuntimeByFilter()
`将要废弃` 私有函数

### - void RuntimeInstance.selectDeviceByFilter()
`将要废弃` 私有函数

### - void RuntimeInstance.selectRuntimeByStoragePath()
`将要废弃` 私有函数

### - void RuntimeInstance.enableRuntimeStorage(globalPath)
私有函数, 主要用于all in one local debug

### - void RuntimeInstance.bindRuntimeStorage(globalPath,localPath)
私有函数，主要用于all in one local debug.

### - void RuntimeInstance.initWithInfo(RuntimeInfo info)
私有函数

### - void RuntimeInstance.installDefaultDriverFromNode()
私有函数

##XARPackage
代表Bucky框架里最重要一个基础概念，是对各种工程文件进行模块化以后，物理上的一个包。  
通常通过RuntimeInstance对象的loadXARPackage函数获得。  

### + packageInfo XARPackage.getPackageInfo()
返回该XARPackage定义在config.json中的配置信息。

### + XARPackage.loadModule(string moduleID,function onComplete)
通过模块ID加载XARPackage中的一个模块,加载结果通过onComplete返回。
XARPackage的config.json里定义了可以被加载的模块。
#### `onComplete` : function(Module,errorCode){...}
通过该回调返回结果。加载成功Module为非null值。

### XARPackage.isModuleExist(string moduleID)
判断模块是否存在。存在返回true.

### - XARPackage.loadLocalModule()
私有函数，微信小程序的环境加载js文件的方法较为特殊。

##Module
通过loadModule返回的对象，是一个包含所有导出函数的字典。
如果一个模块的结尾是按以下方法倒出的：
>module.exports = {};
>module.exports.Login = Login;
>module.exports.Register = Register;

那么加载该模块返回的字典为
>{
>    "Login" : [Function],
>    "Register" : [Function]
>}

##RuntimeStorage 
Application所要永久保存的数据，最后一定会在某些Runtime上落地。当应用代码在这些有数据的Runtime上运行时，就能通过RuntimeStorage得到保存的数据。  
RuntimeStorage使用K-V设计来保存结构化数据。

### + RuntimeStorage.setObject（string objID,object objItem,function onComplete）
要求在当前Storage目录保存一个ObjectItem.保存完成后会触发onComplete通知
该调用成功后一定会触发一次磁盘写入。消耗App的磁盘空间资源和IO吞吐资源。

### + RuntimeStorage.getObject(string objID,function onComplete)
要求从当前Storage目录读取一个ObjectItem.读取成功通过onComplete返回。
该调用成功后一定会触发一次磁盘读取。消耗App的IO吞吐资源。

### + RuntimeStorage.removeObject(string objID,function onComplete)
要求从当前Storage目录删除一个ObjectItem。删除结果通过onComplete返回。
该调用成功后会释放App的磁盘空间资源，消耗一定的IO吞吐资源。

### + RuntimeStorage.isObjectExists(string objID,function onComplete)
判断当前Storage目录是否存在一个ObjectItem.判断结果通过onComplete返回。
该调用会消耗App的IO吞吐资源。

##RuntimeCache
`内测版暂未开放`



## ErrorCode
### `ErrorCode.RESULT_OK` : 
### `ErrorCode.RESULT_TIMEOUT` :
### `ErrorCode.RESULT_WAIT_INIT` : 2;
### `ErrorCode.RESULT_ERROR_STATE` : 3;
### `ErrorCode.RESULT_NOT_FOUND` : 4;
### `ErrorCode.RESULT_SCRIPT_ERROR` : 5;
### `ErrorCode.RESULT_NO_IMP` : 6;
### `ErrorCode.RESULT_ALREADY_EXIST` : 7;
### `ErrorCode.RESULT_UNKNOWN` : 8;

## KnowledgeManager

### InfoNode

#### + int InfoNode.getType()

#### + int InfoNode.getState()

#### + Object InfoNode.objectRead()

#### + void InfoNode.objectUpdate(Object newObj,function onComplete)

#### + Object InfoNode.mapGet(string key)

#### + void InfoNode.mapSet(string key,Object objItem,function onComplete)

#### + void InfoNode.mapGetClone()

### + InfoNode KnowledgeManager.getKnowledge(string key)

### + void KnowledgeManager.dependKnowledge(string key,Object options)

### + void KnowledgeManager.ready(function onReady)

### + int KnowledgeManager.getState()

### - string KnowledgeManager.getInfoURL(string key)

### - void KnowledgeManager.addknowledgeKey(string key,InfoNode aNode)

### - void KnowledgeManager.removeknowledgeKey(string key)


##BaseLib
BaseLib定义了大量的功能性静态函数。
这是Bucky框架为了统一各个js运行时库的差异提供的基础功能库。框架会保证这些功能函数在不同的JS环境中都能工作，应用开发应该尽量使用BaseLib中提供的功能来完成需求。
如果您在开发过程中有基础功能的需求而该功能又不在BaseLib中，请给我们提Issue :)
`内测阶段BaseLib的功能函数以满足我们自己的需要为主，以后还会进一步调整和整理`

### + int BaseLib.setTimer(function func,int timeout)
创建一个timer,每隔timeout指定的毫秒的时间过去后，会执行func。
调用成功返回timerID

### + void BaseLib.killTimer(timerID)
停止一个timer。timerID由setTimer函数返回。

### + void BaseLib.setOnceTimer(function func,int timeout)
创建一个一次性的timer.经过timeout指定的毫秒时间后func被调用。

### + BaseLib.asynCall(function func)
发起一次`异步调用`，func函数会在被投递到下一个消息循环中调用。
非常有用的小函数，特别是用在处理某些事件的时候。

### + string BaseLib.hash(string method,string content,string format)  

### + string BaseLib.md5(string content,string format)

### + int BaseLib.getRandomNum(min,max)

### + string BaseLib.createGUID()

### + bool BaseLib.isArrayContained(Array a,Array b)

### + int BaseLib.inet_aton(string IP)

### + string BaseLib.inet_ntoa(int num)

### + FunctionInfo BaseLib.parseFunctionName(string functionName)

### + void BaseLib.loadFileFromURL(string fileURL,function onComplete)

### + void BaseLib.loadJSONFromURL(string fileURL,function onComplete)

### + void BaseLib.postJSON(string postURL,Object postBody,function onComplete)

### + void BaseLib.postData(string postURL,string postBody,function onComplete)

### - void BaseLib.runScriptFromURL(string fileURL,function onComplete)

### - void BaseLib.wxHttpRequest()

### - void BaseLib.postJSONCall(string postURL,Object postBody,function onComplete)

### - table BaseLib.readCookie()

### - string BaseLib.writeCookie()

### - Object BaseLib.encodeParamAsJson(Object args) 

### - Object BaseLib.decodeResultFromJSON(Object jsonBody)

### - BaseLib.fsExistsSync()

### - BaseLib.fileExistsSync()

### - BaseLib.dirExistsSync()

### - BaseLib.mkdirsSync()

### - BaseLib.deleteFolderRecursive()

### - BaseLib.findSync()

### - BaseLib.findOnceSync()

### - BaseLib.findOutDir()

### - BaseLib.findFiles()

### - BaseLib.writeFileTo()

### - BaseLib.writeFileToAsync()


## Device
一般通过RuntimeInstance的getOwnerDevice得到。代表当前Runtime所在的计算设备。

### DeviceInfo 对象
代表系统中的一个可计算设备（不一定是当前的可计算设备）
当应用系统
#### `DeviceID`
#### `Type`
#### `IsOnline`
#### `Ability`
#### `Drivers`

### + string Device.getDeviceID()

### + Array Device.getAbility()

### + string Device.getDeviceType()

### + bool Device.isDriverInstalled()

### + DeviceInfo Device.createDeviceInfo()

### - Device.getAppHost()

### - Device.getAppRepositoryHost()

### - Device.getOwnerAppHost()

### - Device.getInterfaceURL()

### - Device.getOwnerUserID()

### - Device.getOwnerUserToken()

### - Device.setOwnerUserID()

### - Device.getRuntimeRootDir()

### - Device.getInstalledDrivers()

### - Device.loadFromConfig()


## GlobalEventManager
依赖Knowledge作为底层系统实现的全局事件系统。
`内测版暂为提供该模块`



