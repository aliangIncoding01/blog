## 视频插件

#### 需求整体设计
###### 服务器端针对需要加密的视频进行加密处理，php端拿到地址后，判断是否返回加密的视频源地址URL，加密对应wz1格式，非加密mp4、m3u8.. ,web端拿到加密URL后通过插件以postMessage的方式传给客户端，客户端按照与服务器端约定逻辑进行文件的解密之后请求服务器，拉音视频流数据进行播放

#### 通过插件的方式与客户端交互

- PPAPI vod 插件

```
<embed id="plugin-vod" type="application/x-ppapi-vod">
```

#### web封装插件实现加密播放器类
###### 对外提供的API与videoJS保持一致，从而实现业务层最小范围内的改动
###### 具体步骤如下：

- 业务层初始化加密播放器类方式

```
theVideo = new CefEncryptionPlayer(
    videoDom,
    {
      'cefUrl': '', // 视频url，可以不传，src赋值的时候再传也可以
      'autoPlay': true, // 是否自动播放
      'userNum': res.data.user_number, // 用户number
      'playerSign': res.data.player_sign, // 用户签名，用以新的方式的校验
      'cefVersion': version // 客户端版本号，用来判断用是否需要校验签名信息
    }
);
videoElement = theVideo.player; // 原生插件，提供与<video>标签一样的属性
videoDom = container.find('#plugin-vod'); // <video>替换成插件，针对业务层对dom的操作
```

- 创建底层插件类

```
// 底层播放器
function EncPlayer(dom, params) {
    var me = this;
    me.loadingPanel = new LoadingPanel();
    me._playbackRate = 1; // 默认倍速
    me.isReady = false;
    me.loaded = false; // 视频是否加载完毕标记量
    me._paused = true;
    me.element = dom;
    me.params = params;
    me.eventInterFace = { // 为相应事件添加响应结果集
       'play': [],
       'pause': [],
       'timeupdate': [],
       'durationchange': [],
       'ended': [],
       'error': [],
       'loadstart': [],
       'canplaythrough': [],
       'canplay': [],
       'volumechange': [],
       'seeked': [],
       'waiting': [],
       'playing': [],
       'ready': []
    };
}
```

- 底层插件类初始化

```
// 插件转换成jQuery对象
me.playerDom = $(
    '<div class="cef-player-wrapper" style="position: relative;width: 100%;height: 100%;background: black;">'
+       '<embed id="plugin-vod" type="application/x-ppapi-vod" style="width: 100%;height: 100%;">'
+   '</div>'
);

me.loadingPanel.init(document.body); // 添加缓冲动态图
me.cefEncElement = me.playerDom[0].querySelector('#plugin-vod');
$(me.element).replaceWith(me.playerDom); // 替换传入的<video>标签

// 监听message事件，客户端通过postMessage与web端交互
me.cefEncElement.addEventListener('message', me.handleMessage.bind(me));
```

- 依据客户端版本，判断校验方式

```
if (cefVersion >= '7.4.0') {
    me.pushUserNum(uerNum, playerSign); // 新版本直接传usernumber和sign
}
else {
    me.isFontExist(); // 兼容老版本，老版本需要先判断字体文件
}
```

- 判断字体文件是否存在（旧方式）

```
// 请求客户端播放器是否有字体支持
EncPlayer.prototype.isFontExist = function () {
    this.cefPostMessage("IsFontExist", "");
};
```

- 直接传入userNumber和签名进行校验（新方式）

```
// 传入客户端用户number，新方式还会传入签名进行校验
EncPlayer.prototype.pushUserNum = function(num, sign) {
    sign ? this.cefPostMessage("userID", {'userNumber': num, 'playerSign': sign})
         : this.cefPostMessage("userID", num);
};
```

- 参照video标签为插件添加业务层用到的属性

```
// 实现倍速播放属性
Object.defineProperty(me, 'playbackRate', {
    get: function () {
        return me._playbackRate;
    },
    set: function (data) {
        me._playbackRate = data;
        this.cefPostMessage("rate", data);
    }
});

// 实现视频源属性
Object.defineProperty(me, 'src', {
    get: function () {
        return this._src;
    },
    set: function (url) {
        if (this._src === url) {
            return;
        }
        this._src = url;
        setTimeout(function () {
            me.loadCefPlayFile(url);
        }, 0);
    }
});

// 实现播放音量属性
Object.defineProperty(me, 'volume', {
    get: function () {
        return me._volume;
    },
    set: function (data) {
        me._volume = data;
        this.cefPostMessage("volume", data * 100);
    }
});

// 实现播放进度属性
Object.defineProperty(me, 'currentTime', {
    get: function () {
        return me._timeupdate;
    },
    set: function (data) {
        this.cefPostMessage("currentTime", Math.round(data));
    }
});

// 实现是否暂停属性
Object.defineProperty(me, 'paused', {
    get: function () {
        return me._paused;
    },
    set: function () {}
    });

// 实现获取视频时长属性
Object.defineProperty(me, 'duration', {
    get: function () {
        return me._duration;
    },
    set: function () {}
    });
};
```

- 注册监听事件（标签的方式addEventListener）

```
EncPlayer.prototype.addEventListener = function(name, callback) {
    var me = this;
    var eventInterFace = me.eventInterFace;

    for (var i in eventInterFace) {
        if (i === name) {
            eventInterFace[name].push(callback);
        }
    }
};
```

- 与客户端交互PostMessage方式

```
// cef 交互
EncPlayer.prototype.cefPostMessage = function (funcName, param) {

    // 未加载资源之前不调用播放 暂停和设置时间 的方法
    if (!this.loaded) {
        if (['play', 'pause', 'currentTime'].indexOf(funcName) > -1)  return;
    }

    console.log('name: ', funcName, 'param: ', param);

    this.cefEncElement.postMessage(
        {
            "funcName": funcName,
            "params": param === '' ? {} : param
        }
    );
};
```

- 监听客户端抛出的视频相关的事件

```
// message事件
EncPlayer.prototype.handleMessage = function (message_event) {
    var me = this;
    var messageObj = message_event.data;
    console.log(messageObj);

    if (messageObj.hasOwnProperty('isfontexistresult')) {
        if (messageObj['isfontexistresult']) {
            me.isReady = true;
            me.executeEvents('ready');
            console.log('加密视频准备就绪(old)：',messageObj['isfontexistresult']);
            me.fontExisted();
        }
        else {
            me.destroy();
        }
    }

    if (messageObj.hasOwnProperty('isUserNumberPlayerSignExist')) {
        if (messageObj['isUserNumberPlayerSignExist']) {
            me.isReady = true;
            me.executeEvents('ready');
            console.log('加密视频准备就绪(new)：',messageObj['isUserNumberPlayerSignExist']);
            me.playerIsReady();
        }
        else {
            me.destroy();
        }
    }

    if (messageObj.hasOwnProperty('loadfileresult')) {
        if (messageObj['loadfileresult']) {
            me.loaded = true;
            me.loadingPanel.hide();
            console.log('视频加载成功！！！！！');
            this.cefPostMessage("rate", me._playbackRate);
            if (me.params.autoPlay || !me._paused) {
                me.play();
            }
        }
        else {
            me.destroy();
        }
    }

    if (messageObj['volume']) {
        me._volume = messageObj['volume'];
    }

    if (messageObj['duration']) {
        me._duration = messageObj['duration'];
    }

    for (var i in me.eventInterFace) {

        if (messageObj.hasOwnProperty(i)) {

            switch (i) {
                case 'timeupdate': me._timeupdate = messageObj[i];
                    break;
                case 'pause': me._paused = true;
                    break;
                case 'ended':
                    me._paused = true;
                    me._timeupdate = 0; // 播放结束后当前播放时间归 0，进度条置0
                    me.executeEvents('timeupdate');
                    break;
                case 'error': me._paused = true;
                    break;
                case 'play': me._paused = false;
                    break;
            }
            me.executeEvents(i);
        }
   }
};
```

- 触发相应的注册事件

```
// 触发注册的事件
EncPlayer.prototype.executeEvents = function (name) {
    var me = this;
    var eventList = me.eventInterFace[name];
    var eventsLen = me.eventInterFace[name].length;

    if (eventsLen !== 0) {
        for (var i = 0; i < eventsLen; i++) {
            eventList[i]();
        }
    }
};
```

- 字体文件存在执行此方法

```
// Cef播放器存在字体文件（兼容老版本）
EncPlayer.prototype.fontExisted = function () {
    var me = this;
    var uerNum = me.params.userNum;
    var cefUrl = me.params.cefUrl;
    me.pushUserNum(uerNum); // 判断字体文件成功后传入userNumber，跑马灯
    if (cefUrl) {
        me.src = cefUrl;
    }
};
```

- 客户端校验签名成功可以播放

```
// Cef播放器校验签名成功
EncPlayer.prototype.playerIsReady = function () {
    var me = this;
    var cefUrl = me.params.cefUrl;
    if (cefUrl) {
        me.src = cefUrl;
    }
};
```

- 调用客户端loadFile接口进行视频源的加载

```
// url传给客户端加载加密视频源
EncPlayer.prototype.loadCefPlayFile = function(url) {
    this.loaded = false;
    this.executeEvents('loadstart'); // 此时可以执行loadstart监听函数里面的所有方法了，认为已经开始加载，videoJS也是一样
    this.loadingPanel.show(); // 动效loading图此时应该展示
    this.cefPostMessage("LoadFile", url);
};
```

- 视频进行播放

```
EncPlayer.prototype.play = function () {
    this._paused = false;
    if (this._timeupdate === 0) {
        this.currentTime = 0;
    }
    this.executeEvents('playing'); // 出发playing事件，执行此事件监听函数中的所有方法
    this.cefPostMessage("play", ""); // 告诉客户端要播放了
};
```

- 视频暂停

```
EncPlayer.prototype.pause = function () {
    this._paused = true; // 记录状态
    this.cefPostMessage("pause", ""); // 告诉客户端，与视频相关的每个操作先要告诉客户端
};
```

- 销毁

###### 客户端验证没有通过认为视频不可播放，这时应该移除对message的监听事件以及对视频抛出error事件，进行线路的切换等操作

```
// 移除监听message事件
EncPlayer.prototype.destroy = function () {
    var me = this;
    var eventName = 'error';
    me.executeEvents(eventName);
    me.cefEncElement.removeEventListener('message', me.handleMessage);
};
```

- 创建外层类

###### 仿造videoJS提供与之一致的部分api接口

```
function CefEncryptionPlayer(dom, params) {
    var me = this;
    // me.player: 底层原生插件 me: 外层封装暴露api调用底层方法 仿照videoJs原生代码实现
    me.player = new EncPlayer(dom, params); // 底层插件实例
    me.player.initEncPlayer(); // 初始化底层插件类
}
```

- ready

```
// 播放器准备就绪,传入callback，在视频准备就绪后调用callback函数
CefEncryptionPlayer.prototype.ready = function (callback) {
    var me = this;
    var isReady = me.player.isReady;

    if (isReady) {
        callback();
    }
    else {
    	// 如果视频还没准备就绪就注册ready事件，等就绪后出发里面的callback函数
        me.player.addEventListener('ready', callback);
    }
};
```

- src

```
// 与videoJs接口保持一致
CefEncryptionPlayer.prototype.src = function(url) {
    var me = this;

    if (!url) {
        return me.player.src;
    }
    me.player.src = url;
};
```

- on

```
// videoJS监听事件方式
CefEncryptionPlayer.prototype.on = function (name, callback) {
    this.player.addEventListener(name, callback); // 调用底层的监听函数，实施事件的注册
};
```

- play

```
// 播放视频
CefEncryptionPlayer.prototype.play = function () {
    this.player.play(); // 调用底层的播放属性
};
```

- pause

```
// 暂停视频
CefEncryptionPlayer.prototype.pause = function () {
    this.player.pause(); // 调用底层的暂停属性
};
```

- volume

```
// 参数传空获取视频音量，传入参数时设置视频音量
CefEncryptionPlayer.prototype.volume = function(data) {
    var me = this;

    if (Object.prototype.toString.call(data) === '[object Number]') {
        me.player.volume = data; // 传入数值后设置音量
    }
    else if (!data) {
        return me.player.volume; // 没有传参返回音量值 .volume();获取音量值
    }
};
```

- playbackRate

```
// 设置视频倍速
CefEncryptionPlayer.prototype.playbackRate = function (data) {
    var me = this;

    if (Object.prototype.toString.call(data) === '[object Number]') {
        me.player.playbackRate = data; // 设置倍速
    }
    else if (!data) {
        return me.player.playbackRate; // 获取倍速值
    }
};
```

- currentTime

```
// 参数传空获取视频当前时间，传入参数时seek到参数位置
CefEncryptionPlayer.prototype.currentTime = function(data) {
    var me = this;

    if (Object.prototype.toString.call(data) === '[object Number]') {
        me.player.currentTime = data; // seek
    }
    else if (!data) {
        return me.player.currentTime; // 获取当前播放时间点
    }
};
```
