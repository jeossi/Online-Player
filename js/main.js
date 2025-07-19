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
    
    // 新增：请求全屏的方法
    requestFullScreen: function(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    },
    
    load: function(url) {
        // 获取旧的视频元素
        var oldPlayerElement = document.getElementById('real_video_player');
        
        // 保存当前全屏状态
        var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || 
                               document.mozFullScreenElement || document.msFullscreenElement;
        var wasFullscreen = false;
        var wasVideoFullscreen = false;
        if (fullscreenElement) {
            wasFullscreen = true;
            // 检查全屏元素是否是旧的视频元素
            if (oldPlayerElement && fullscreenElement === oldPlayerElement) {
                wasVideoFullscreen = true;
            }
        }
        
        // 销毁之前的播放器实例
        if (play.currentPlayer) {
            if (play.currentPlayer.destroy) {
                play.currentPlayer.destroy();
            } else if (play.currentPlayer.dispose) {
                play.currentPlayer.dispose();
            }
            play.currentPlayer = null;
        }
        
        // 重置视频元素
        var playerElement = document.getElementById('video_player');
        if (playerElement) {
            playerElement.pause();
            playerElement.src = '';
            playerElement.load();
        }
        
        url = url ? url : link.get();
        var player = $('#video_player');
        var sourceType = link.check(url);
        if (!sourceType) {
            return false;
        }
        try {
            console.log('正在加载视频资源:' + url);
            url = decodeURIComponent(url);
            switch (sourceType) {
                case 'm3u8':
                    player = play.m3u8(url, player);
                    break;
                case 'flv':
                    player = play.flv(url, player);
                    break;
                default:
                    player = play.default(url, player);
                    break;
            }
            player.vControl('p+');
            
            // 显示/隐藏连续播放提示
            const indicator = document.getElementById('auto-play-indicator');
            if (indicator) {
                // 根据播放模式显示提示
                const playMode = window.playState ? window.playState.playMode : null;
                indicator.style.display = 
                    (playMode === 'randomCategory') ? 'block' : 'none';
                
                console.log('设置连续播放提示:', indicator.style.display, '播放模式:', playMode);
            }
            
            log.add(url);
            console.log('视频资源加载成功');
            
            // 更新当前播放URL
            play.currentUrl = url;
            
            // 更新全局播放状态
            if (window.playState) {
                window.playState.currentUrl = url;
            }
            
            // 监听新视频的play事件
            if (player && player[0]) {
                var newVideoElement = player[0];
                var playHandler = function() {
                    if (wasVideoFullscreen) {
                        play.requestFullScreen(newVideoElement);
                    }
                    newVideoElement.removeEventListener('play', playHandler);
                };
                newVideoElement.addEventListener('play', playHandler);
            }
        } catch (e) {
            console.log('找不到视频资源或不支持该视频格式!');
        }
    },
    
    init: function(player) {
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
        
        // 绑定结束事件 - 确保使用正确的播放器元素
        newPlayer[0].addEventListener('ended', function() {
            if (window.handleVideoEnd) {
                window.handleVideoEnd();
            }
        });
        
        return newPlayer;
    },
    m3u8: function(url, player) {
        if (!url || !player[0]) {
            console.log('play.m3u8(url,player)参数错误:url必选,player必选');
            return false;
        }
        this.check(url);
        url = link.convert(url);
        
        // 尝试使用HLS播放器
        if (Hls.isSupported()) {
            try {
                player = this.init(player);
                var hlsPlayer = new Hls();
                hlsPlayer.loadSource(url);
                hlsPlayer.attachMedia(player[0]);
                hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function() {
                    // 播放器加载成功
                });
                play.currentPlayer = hlsPlayer;
                return player;
            } catch (e) {
                console.error('HLS播放器初始化失败:', e);
            }
        }
        
        // 回退到普通video标签
        console.log('浏览器不支持HLS播放器，尝试使用普通video标签播放');
        return this.default(url, player);
    },
    flv: function(url, player) {
        if (!url || !player[0]) {
            console.log('play.flv(url,player)参数错误:url必选,player必选');
            return false;
        }
        this.check(url);
        url = link.convert(url);
        
        // 尝试使用FLV播放器
        if (flvjs.isSupported()) {
            try {
                player = this.init(player);
                var flvPlayer = flvjs.createPlayer({
                    type: 'flv',
                    url: url
                });
                flvPlayer.attachMediaElement(player[0]);
                flvPlayer.load();
                play.currentPlayer = flvPlayer;
                return player;
            } catch (e) {
                console.error('FLV播放器初始化失败:', e);
            }
        }
        
        // 回退到普通video标签
        console.log('浏览器不支持FLV播放器，尝试使用普通video标签播放');
        return this.default(url, player);
    },
    default: function(url, player) {
        if (!url || !player[0]) {
            console.log('play.default(url,player)参数错误:url必选,player必选');
            return false;
        }
        player = this.init(player);
        url = link.convert(url);
        player[0].src = url;
        play.currentPlayer = null;
        return player;
    },
    check: function(url) {
        if (location.hostname.search('.rth.') !== -1) {
            location.href = 'https://icedwatermelonjuice.github.io/Online-Player?url=' + url;
        }
    },
    on: function() {
        this.load($('#url_box').val());
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
    const state = window.playState;
    console.log('视频结束，当前播放模式:', state.playMode, 'API:', state.randomCategoryApi);
    
    // 保存当前全屏状态
    const isFullscreen = document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement || 
                         document.msFullscreenElement;
    const wasFullscreen = !!isFullscreen;
    
    if (state.playMode === 'randomCategory' && state.randomCategoryApi) {
        console.log('执行随机分类连续播放');
        // 随机分类模式：自动播放下一个随机视频
        const timestamp = new Date().getTime();
        const newUrl = state.randomCategoryApi + '?t=' + timestamp;
        
        // 更新输入框
        document.getElementById('url_box').value = newUrl;
        
        // 播放新视频
        play.load(newUrl);
        
        // 恢复全屏状态
        if (wasFullscreen) {
            setTimeout(() => {
                const newPlayer = document.getElementById('real_video_player');
                if (newPlayer) {
                    play.requestFullScreen(newPlayer);
                }
            }, 500);
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
                // 播放选中的媒体
                document.getElementById('url_box').value = nextEntry.url;
                document.getElementById('url_btn').click();
                
                // 恢复全屏状态
                if (wasFullscreen) {
                    setTimeout(() => {
                        const newPlayer = document.getElementById('real_video_player');
                        if (newPlayer) {
                            play.requestFullScreen(newPlayer);
                        }
                    }, 500);
                }
            }
        }
    }
};
