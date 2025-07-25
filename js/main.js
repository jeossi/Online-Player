// main.js
var tool = {
    toClipboard: function(data, msg) {
        var exportBox = $('<textarea style="opacity:0"></textarea>');
        exportBox.val(data);
        $('body').append(exportBox);
        exportBox.select();
        document.execCommand('copy');
        exportBox.remove();
        msg = msg ? msg : '已导出到剪贴板';
        alert(msg);
    },
    getTime: function() {
        var time = new Date();
        var year = time.toLocaleDateString().replace(/\//g, '.');
        var hour = time.getHours();
        var minute = time.getMinutes();
        var second = time.getSeconds();
        hour = hour < 10 ? '0' + hour : hour;
        minute = minute < 10 ? '0' + minute : minute;
        second = second < 10 ? '0' + second : second;
        return year + ' ' + hour + ':' + minute + ':' + second;
    }
};

var message = {
    alert: function(data, title) {
        title = title ? title.slice(0, 10) : '信息提示';
        $('body').append(this.create('alert', data, title));
    },
    prompt: function(data, title) {
        title = title ? title.slice(0, 10) : '信息收集';
        $('body').append(this.create('prompt', data, title));
    },
    confirm: function(data, title) {
        title = title ? title.slice(0, 10) : '信息确认';
        $('body').append(this.create('confirm', data, title));
    },
    create: function(type, data, title) {
        var content, tips;
        if (typeof data === 'string') {
            tips = '';
            content = '<p type="content">' + data + '</p>';
        } else {
            tips = '<p type="tips" style="color:red">' + data[0] + '</p>';
            content = '<p type="content">' + data[1] + '</p>';
        }
        return $(
            '<div class="message_container"><div class="message_outerBox"><div class="message_innerBox"><div class="message_head">' + title + '</div><div class="message_main">' + tips + content + '</div><div class="message_foot"><div class="message_button" type="copy" onclick="message.copy()">全部复制</div><div class="message_button" type="close" onclick="message.close()">关闭页面</div><div class="message_button" type="home" onclick="message.home()">重输指令</div></div></div></div></div>'
        )[0];
    },
    copy: function() {
        tool.toClipboard($('.message_main p[type="content"]').html().replace(/<br>/g, ' '));
    },
    submit: function() {
        $('.message_container').remove();
    },
    close: function() {
        $('.message_container').remove();
    },
    home: function() {
        this.close();
        setTimeout(function() {
            instruct.execute(prompt('请输入指令'));
        }, 500);
    }
};

var instruct = {
    list: {
        'log': {
            'descript': '显示历史记录',
            'on': function() {
                log.alert();
            }
        },
        'log2': {
            'descript': '在控制台上显示历史记录',
            'on': function() {
                log.print();
            }
        },
        'clear': {
            'descript': '清空历史记录',
            'on': function() {
                log.clear();
            }
        },
        'copy': {
            'descript': '复制全部历史记录',
            'on': function() {
                log.copy();
            }
        },
        'add': {
            'descript': '添加一条历史记录',
            'on': function() {
                var data = prompt('请输入播放地址与时间，用英文空格隔开');
                data = data ? data.trim().split(' ') : ['', ''];
                var url = data[0] ? data[0].trim() : '';
                var time = data[1] ? data[1] : tool.getTime();
                if (url && time) {
                    log.add(url, time);
                }
            }
        },
        'play': {
            'descript': '从播放记录中选择一条记录重新播放',
            'on': function() {
                var data = prompt('请输入记录编号以及播放历史时序方向，用英文空格隔开');
                data = data ? data.trim().split(' ') : ['', ''];
                var index = data[0] ? data[0] : '';
                var direction = data[1];
                if (direction === 'true') {
                    direction = true;
                } else if (direction === 'false') {
                    direction = false;
                } else {
                    direction = '';
                }
                if (index) {
                    log.play(index, direction);
                }
            }
        },
        'help': {
            'descript': '显示所有可用指令和可用指令功能描述',
            'on': function() {
                var msg = '';
                var list = instruct.list;
                var i = 0;
                for (var j in list) {
                    if (list.hasOwnProperty(j)) {
                        i += 1;
                        msg += '(' + i + ') ' + j + ' : ' + list[j].descript + '<br>';
                    }
                }
                message.alert(msg, '指令列表');
            }
        }
    },
    execute: function(instruction) {
        instruction = typeof instruction === 'string' ? instruction.trim() : '';
        if (!instruction) {
            return false;
        }
        if (/^(js|javascript):/i.test(instruction)) {
            instruction = instruction.slice(instruction.search(':') + 1);
            this.eval(instruction);
        } else {
            this.brief(instruction);
        }
    },
    brief: function(instruction) {
        instruction = this.list[instruction];
        if (instruction) {
            instruction.on();
        } else {
            alert('非法指令！');
        }
    },
    eval: function(instruction) {
        try {
            eval(instruction);
        } catch (e) {
            alert('指令错误！\n' + e);
        }
    }
};

var link = {
    check: function(url) {
        if (!/^((http|https|file):\/\/)?(([-A-Za-z0-9+&@#/%?=~_|!:,.;]+-[-A-Za-z0-9+&@#/%?=~_|!:,.;]+|[-A-Za-z0-9+&@#/%?=~_|!:,.;]+)\.)+([-A-Za-z0-9+&@#/%?=~_|!:,.;]+)[/\?\:]?.*$/i.test(url)) {
            alert('无法识别的URL');
            return false;
        }
        url = url.replace(/^((http|https):)/, '');
        var res = 'default';
        res = /.m3u8/i.test(url) ? 'm3u8' : res;
        res = /.flv/i.test(url) ? 'flv' : res;
        return res;
    },
    get: function(type) {
        var res;
        if (type === 'url') {
            res = location.href.split('?url=')[1];
        } else {
            res = $('#url_box').val();
        }
        return res ? res.replace(/\s+/g, '') : '';
    },
    convert: function(url) {
        if (!url) {
            console.log('link.convert(url)参数错误:url必选');
            return false;
        }
        var urlProtocol = /http|https/i.test(location.protocol) ? location.protocol : false;
        urlProtocol = !urlProtocol && /^(http|https):/i.test(url) ? url.split('//')[0] : false;
        urlProtocol = urlProtocol ? urlProtocol : 'https:';
        return urlProtocol + '//' + url.replace(/^((http|https):)?\/\//, '');
    }
};

var play = {
    currentPlayer: null,
    currentUrl: null,
    isSwitchingSource: false, // 添加切换状态标志
    
    isMobileDevice: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    isRandomCategoryMode: function() {
        return window.playState && window.playState.playMode === 'randomCategory';
    },
    
    destroyPlayer: function() {
        // 如果是随机连续播放模式并且是移动设备，我们不销毁播放器，因为要复用video元素
        if (this.isRandomCategoryMode() && this.isMobileDevice()) {
            return;
        }
        
        if (this.currentPlayer) {
            try {
                if (this.currentPlayer.destroy) {
                    this.currentPlayer.destroy();
                } else if (this.currentPlayer.dispose) {
                    this.currentPlayer.dispose();
                } else if (this.currentPlayer.unload) {
                    this.currentPlayer.unload();
                }
            } catch (e) {
                console.error('销毁播放器失败:', e);
            }
            this.currentPlayer = null;
        }
        
        const videoElement = document.getElementById('real_video_player');
        if (videoElement) {
            videoElement.pause();
            videoElement.src = '';
            videoElement.load();
        }
    },
    
    updateSource: function(url) {
        // 设置切换状态标志
        this.isSwitchingSource = true;
        
        // 记录当前全屏状态
        const wasFullscreen = this.isFullscreen();
        const fullscreenElement = this.getFullscreenElement();
        
        const sourceType = link.check(url);
        if (!sourceType) return false;
        
        url = decodeURIComponent(url);
        url = link.convert(url);
        
        try {
            console.log('正在更新视频源:', url);
            
            // 获取video元素
            const videoElement = document.getElementById('real_video_player') || $('#video_player')[0];
            
            // 如果是随机连续播放模式并且是移动设备，采用直接更新src的方式
            if (this.isRandomCategoryMode() && this.isMobileDevice()) {
                // 停止并销毁当前播放器（如果存在，但注意destroyPlayer中已经跳过销毁）
                this.destroyPlayer();
                
                // 直接设置src并播放
                videoElement.src = url;
                videoElement.load();
                videoElement.play().catch(e => console.log('播放失败:', e));
                
                // 更新当前播放URL
                this.currentUrl = url;
                
                // 添加播放历史
                log.add(url);
                
                // 重新绑定结束事件
                videoElement.removeEventListener('ended', window.handleVideoEnd);
                videoElement.addEventListener('ended', window.handleVideoEnd);
                
                // 注意：移动设备上我们不尝试恢复全屏，由浏览器自动处理
                return;
            }
            
            // 停止并销毁当前播放器
            this.destroyPlayer();
            
            switch (sourceType) {
                case 'm3u8':
                    if (Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(videoElement);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            videoElement.play().catch(e => console.log('HLS播放失败:', e));
                        });
                        this.currentPlayer = hls;
                    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                        videoElement.src = url;
                        videoElement.play().catch(e => console.log('HLS播放失败:', e));
                    }
                    break;
                    
                case 'flv':
                    if (flvjs.isSupported()) {
                        const flvPlayer = flvjs.createPlayer({
                            type: 'flv',
                            url: url
                        });
                        flvPlayer.attachMediaElement(videoElement);
                        flvPlayer.load();
                        videoElement.play().catch(e => console.log('FLV播放失败:', e));
                        this.currentPlayer = flvPlayer;
                    }
                    break;
                    
                default:
                    videoElement.src = url;
                    videoElement.play().catch(e => console.log('普通视频播放失败:', e));
            }
            
            // 更新当前播放URL
            this.currentUrl = url;
            
            // 更新全局播放状态
            if (window.playState) {
                window.playState.currentUrl = url;
            }
            
            // 添加播放历史
            log.add(url);
            
            // 重新绑定结束事件
            videoElement.removeEventListener('ended', window.handleVideoEnd);
            videoElement.addEventListener('ended', window.handleVideoEnd);
            
            // 恢复全屏状态（仅限桌面设备）
            if (wasFullscreen && fullscreenElement && !this.isMobileDevice()) {
                setTimeout(() => {
                    this.requestFullscreen(fullscreenElement);
                }, 300);
            }
        } catch (e) {
            console.error('更新视频源失败:', e);
        } finally {
            // 显示/隐藏连续播放提示
            const indicator = document.getElementById('auto-play-indicator');
            if (indicator) {
                const playMode = window.playState ? window.playState.playMode : null;
                indicator.style.display = 
                    (playMode === 'randomCategory') ? 'block' : 'none';
                console.log('设置连续播放提示:', indicator.style.display, '播放模式:', playMode);
            }
            
            // 重置切换状态标志
            this.isSwitchingSource = false;
        }
    },
    
    load: function(url) {
        // 设置切换状态标志
        this.isSwitchingSource = true;
        
        // 记录当前全屏状态
        const wasFullscreen = this.isFullscreen();
        const fullscreenElement = this.getFullscreenElement();
        
        // 销毁之前的播放器实例
        this.destroyPlayer();
        
        url = url ? url : link.get();
        var player = $('#video_player');
        var sourceType = link.check(url);
        if (!sourceType) {
            return false;
        }
        try {
            console.log('正在加载视频资源:' + url);
            url = decodeURIComponent(url);
            
            player = this.init(player);
            const videoElement = player[0];
            
            // 如果是随机连续播放模式并且是移动设备，采用直接更新src的方式
            if (this.isRandomCategoryMode() && this.isMobileDevice()) {
                videoElement.src = url;
                videoElement.load();
                videoElement.play().catch(e => console.log('播放失败:', e));
                
                // 更新当前播放URL
                this.currentUrl = url;
                
                // 添加播放历史
                log.add(url);
                
                // 重新绑定结束事件
                videoElement.removeEventListener('ended', window.handleVideoEnd);
                videoElement.addEventListener('ended', window.handleVideoEnd);
                
                // 注意：移动设备上我们不尝试恢复全屏，由浏览器自动处理
                return;
            }
            
            switch (sourceType) {
                case 'm3u8':
                    if (Hls.isSupported()) {
                        const hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(videoElement);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            videoElement.play().catch(e => console.log('HLS播放失败:', e));
                        });
                        this.currentPlayer = hls;
                    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                        videoElement.src = url;
                        videoElement.play().catch(e => console.log('HLS播放失败:', e));
                    } else {
                        console.error('浏览器不支持HLS播放');
                    }
                    break;
                case 'flv':
                    if (flvjs.isSupported()) {
                        const flvPlayer = flvjs.createPlayer({
                            type: 'flv',
                            url: url
                        });
                        flvPlayer.attachMediaElement(videoElement);
                        flvPlayer.load();
                        videoElement.play().catch(e => console.log('FLV播放失败:', e));
                        this.currentPlayer = flvPlayer;
                    } else {
                        console.error('浏览器不支持FLV播放');
                    }
                    break;
                default:
                    videoElement.src = url;
                    videoElement.play().catch(e => console.log('普通视频播放失败:', e));
            }
            
            log.add(url);
            console.log('视频资源加载成功');
            
            // 更新当前播放URL
            this.currentUrl = url;
            
            // 更新全局播放状态
            if (window.playState) {
                window.playState.currentUrl = url;
            }
            
            // 恢复全屏状态（仅限桌面设备）
            if (wasFullscreen && fullscreenElement && !this.isMobileDevice()) {
                setTimeout(() => {
                    this.requestFullscreen(fullscreenElement);
                }, 300);
            }
        } catch (e) {
            console.log('找不到视频资源或不支持该视频格式!', e);
        } finally {
            // 显示/隐藏连续播放提示
            const indicator = document.getElementById('auto-play-indicator');
            if (indicator) {
                const playMode = window.playState ? window.playState.playMode : null;
                indicator.style.display = 
                    (playMode === 'randomCategory') ? 'block' : 'none';
                console.log('设置连续播放提示:', indicator.style.display, '播放模式:', playMode);
            }
            
            // 重置切换状态标志
            this.isSwitchingSource = false;
        }
    },
    
    init: function(player) {
        // 如果已经存在real_video_player，则直接返回该元素
        let existingPlayer = document.getElementById('real_video_player');
        if (existingPlayer) {
            return $(existingPlayer);
        }
        
        if (!player[0]) {
            console.error('play.init(player)参数错误:player必选');
            return false;
        }
        var videoBox = $('#video_box');
        var newPlayer = player.clone();
        newPlayer.show();
        var oldPlayer = $('#real_video_player');
        if (oldPlayer[0]) {
            oldPlayer.remove();
        }
        newPlayer.attr('id', 'real_video_player');
        newPlayer.css({
            width: '100%',
            height: '100%'
        });
        player.hide();
        newPlayer.touch({
            left: function() {
                newPlayer.vControl('t-');
            },
            right: function() {
                newPlayer.vControl('t+');
            },
            up: function() {
                newPlayer.vControl('v+');
            },
            down: function() {
                newPlayer.vControl('v-');
            },
            longPress: function() {
                newPlayer.vControl('r', 3);
            },
            longPressCancel: function() {
                newPlayer.vControl('r', 1);
            },
            dbTap: function() {
                newPlayer.vControl('p') ? newPlayer.vControl('p-') : newPlayer.vControl('p+');
            }
        });
        videoBox.append(newPlayer);
        
        // 绑定结束事件
        newPlayer[0].addEventListener('ended', function() {
            if (window.handleVideoEnd) {
                window.handleVideoEnd();
            }
        });
        
        return newPlayer;
    },
    
    check: function(url) {
        if (location.hostname.search('.rth.') !== -1) {
            location.href = 'https://icedwatermelonjuice.github.io/Online-Player?url=' + url;
        }
    },
    
    on: function() {
        this.load($('#url_box').val());
    },
    
    // 全屏工具函数
    isFullscreen: function() {
        return document.fullscreenElement || 
               document.webkitFullscreenElement || 
               document.mozFullScreenElement || 
               document.msFullscreenElement;
    },
    
    getFullscreenElement: function() {
        return document.fullscreenElement || 
               document.webkitFullscreenElement || 
               document.mozFullScreenElement || 
               document.msFullscreenElement;
    },
    
    requestFullscreen: function(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
};

var log = {
    get: function(direction) {
        var data = localStorage.getItem('playHistory');
        try {
            if (direction === false) {
                data = JSON.parse(data).reverse();
            } else {
                data = JSON.parse(data);
            }
        } catch (e) {
            data = [];
        }
        return (data && typeof data === 'object' ? data : []);
    },
    display: function(data) {
        if (!data) {
            data = this.get();
        }
        var sum = 5;
        var temp = [];
        for (var i in data) {
            if (temp.indexOf(data[i].url) === -1) {
                var num = temp.push(data[i].url);
                if (num >= sum) {
                    break;
                }
            }
        }
        temp = temp.slice(0, sum);
        var html = '';
        for (var j in temp) {
            html += '<div class="history_item">' + temp[j] + '</div>';
        }
        $('#play_history .history_items').html(html);
    },
    add: function(url, time) {
        url = url ? url : link.get();
        time = time ? time : tool.getTime();
        if (!url) {
            console.log('log.add(url,time)参数错误:url必选,time可选');
            return false;
        }
        var data = this.get();
        data.unshift({
            'url': url,
            'time': time
        });
        data = data.slice(0, 50);
        localStorage.setItem('playHistory', JSON.stringify(data));
        this.display(data);
    },
    clear: function() {
        localStorage.setItem('playHistory', '');
        $('#play_history .history_items').html('');
    },
    msg: function(direction) {
        var data = this.get(direction);
        var msg = '';
        if (data.length === 0) {
            return '无播放历史';
        }
        msg = '共' + data.length + '条播放历史(' + (direction === false ? '正序排列):' : '倒序排列):');
        for (var i = 0; i < data.length; i++) {
            var logIndex = (i + 1) < 10 ? '0' + (i + 1) : (i + 1);
            msg += '\n(' + logIndex + ')\n时间:' + data[i].time + '\n地址:' + data[i].url;
        }
        return msg;
    },
    alert: function(direction) {
        message.alert(this.msg(direction).replaceAll('\n', '<br>'), '播放历史');
    },
    print: function(direction) {
        console.log(this.msg(direction).replace(/<br>/g, '\n'));
    },
    copy: function(direction) {
        tool.toClipboard(this.msg(direction).replace(/\n/g, ' '));
    },
    play: function(index, direction) {
        index = parseInt(index, 10);
        var data = this.get(direction);
        var url = index <= data.length ? data[index - 1].url : '';
        if (!url) {
            alert('播放记录不存在');
            return;
        }
        $('#url_box').val(url);
        $('#url_box').removeAttr('style');
        $('#url_btn')[0].click();
    }
};

var page = {
    hideHistory: function(e, jump) {
        if (jump || $('#input_box').has(e.target).length > 0) {
            return null;
        }
        $('#play_history').hide();
        $('body').unbind('click', this.hideHistory);
    },
    init: function() {
        log.display();
        var urlBox = $('#url_box');
        var btn = $('#url_btn');
        var that = this;
        
        urlBox.focus(function() {
            $('#play_history').show();
            $('body').click(that.hideHistory);
        });
        
        urlBox.keydown(function(event) {
            if (event.keyCode === 13) {
                btn[0].click();
            }
        });
        
        btn.mouseover(function() {
            btn.attr('class', 'btn_extra_css_1');
        });
        
        btn.mouseleave(function() {
            btn.attr('class', 'btn_extra_css_0');
        });
        
        btn.click(function() {
            play.on();
        });
        // 修复：更新清除按钮选择器
        $('#play_history .history_clear').click(function(e) {
            e.stopPropagation();
            log.clear();
        });
        
        // 添加关闭按钮事件处理
        $('#play_history .history_close').click(function(e) {
            e.stopPropagation();
            $('#play_history').hide();
        });
        
        // 修复：使用事件委托绑定历史记录条目事件
        $('#play_history .history_items').on('mouseover', '.history_item', function(e) {
            var item = $(this);
            var l = item[0].scrollWidth - item.width();
            var t = -1;
            if (Math.abs(l) >= 1) {
                t = setTimeout(function() {
                    item.data('animate_timer', '');
                    item.stop();
                    item.scrollLeft(0);
                    item.animate({
                        scrollLeft: l
                    }, l * 8, 'linear');
                }, 500);
                item.data('animate_timer', t);
            }
        });
        
        $('#play_history .history_items').on('mouseleave', '.history_item', function(e) {
            var item = $(this);
            if (item.data('animate_timer')) {
                clearTimeout(item.data('animate_timer'));
            }
            item.stop();
            item.scrollLeft(0);
        });
        
        // 修复：使用事件委托绑定点击事件
        $('#play_history .history_items').on('click', '.history_item', function(e) {
            var item = $(this);
            if (item.data('animate_timer')) {
                clearTimeout(item.data('animate_timer'));
            }
            item.stop();
            item.scrollLeft(0);
            $('#url_box').val(item.text());
            // 触发播放按钮点击事件
            $('#url_btn').click();
            // 隐藏历史记录窗口
            $('#play_history').hide();
        });
    },
    pretreat: function() {
        var urlBox = $('#url_box');
        var url = link.get('url');
        if (url) {
            urlBox.val(url);
            urlBox.removeAttr('style');
            play.load(url);
        }
    },
    instruct: function() {
        var logoClickNum = 0;
        var clickTimer = -1;
        $('#logo_box').click(function() {
            if (clickTimer !== -1) {
                clearTimeout(clickTimer);
            }
            logoClickNum += 1;
            if (logoClickNum >= 3) {
                logoClickNum = 0;
                var instruction = prompt('请输入指令');
                instruction = instruction ? instruction.trim() : '';
                if (instruction) {
                    instruct.execute(instruction);
                }
            }
            clickTimer = setTimeout(function() {
                clickTimer = -1;
                logoClickNum = 0;
            }, 500);
        });
    },
    onload: function() {
        this.init();
        this.pretreat();
        this.instruct();
        
        // 初始化全局播放状态
        if (!window.playState) {
            window.playState = {
                currentPlaylist: [],
                currentIndex: -1,
                currentUrl: null,
                currentCategory: '',        // 当前选中的分类名称
                channelsData: [],
                currentChannelData: null,
                playMode: 'playlist',       // 播放模式：'playlist' 或 'randomCategory'
                randomCategoryApi: ''       // 随机分类的基础API地址
            };
        }
    }
};

$(document).ready(function() {
    page.onload();
});

// 全局视频结束处理函数
window.handleVideoEnd = function() {
    // 如果当前正在切换源，则跳过结束处理
    if (play.isSwitchingSource) {
        console.log('正在切换源，跳过结束处理');
        return;
    }
    
    const state = window.playState;
    console.log('视频结束，当前播放模式:', state.playMode, 'API:', state.randomCategoryApi);
    
    // 记录当前是否全屏
    const wasFullscreen = play.isFullscreen();
    const fullscreenElement = play.getFullscreenElement();
    
    if (state.playMode === 'randomCategory' && state.randomCategoryApi) {
        console.log('执行随机分类连续播放');
        // 随机分类模式：自动播放下一个随机视频
        const timestamp = new Date().getTime();
        let newUrl = state.randomCategoryApi;
        
        // 添加时间戳参数，避免缓存
        if (newUrl.includes('?')) {
            newUrl += '&t=' + timestamp;
        } else {
            newUrl += '?t=' + timestamp;
        }
        
        console.log('生成新的随机URL:', newUrl);
        
        // 使用新的更新方法
        play.updateSource(newUrl);
        
        // 恢复全屏状态（仅限桌面设备）
        if (wasFullscreen && fullscreenElement && !play.isMobileDevice()) {
            setTimeout(() => {
                play.requestFullscreen(fullscreenElement);
            }, 300);
        }
    } else if (state.playMode === 'playlist' && 
               state.currentPlaylist && 
               state.currentIndex !== -1 && 
               state.currentPlaylist.length) {
        console.log('执行播放列表连续播放');
        // 播放列表模式：播放下一个条目
        const nextIndex = (state.currentIndex + 1) % state.currentPlaylist.length;
        const nextEntry = state.currentPlaylist[nextIndex];
        
        if (nextEntry) {
            // 更新全局状态
            state.currentIndex = nextIndex;
            state.currentUrl = nextEntry.url;
            
            // 更新UI
            document.querySelectorAll('.entry-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // 找到并激活下一个条目
            const nextItem = document.querySelector(`.entry-item[data-index="${nextIndex}"]`);
            if (nextItem) {
                nextItem.classList.add('active');
                // 使用新的更新方法
                play.updateSource(nextEntry.url);
                
                // 恢复全屏状态（仅限桌面设备）
                if (wasFullscreen && fullscreenElement && !play.isMobileDevice()) {
                    setTimeout(() => {
                        play.requestFullscreen(fullscreenElement);
                    }, 300);
                }
            }
        }
    }
};
