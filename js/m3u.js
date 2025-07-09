// m3u.js
class M3UPlayer {
    constructor(videoElement, proxyUrl = 'https://jeotv.dpdns.org/') {
        this.video = videoElement;
        this.proxyUrl = proxyUrl;
        this.mediaSource = null;
        this.sourceBuffer = null;
        this.segments = [];
        this.currentSegment = 0;
        this.playlistUrl = '';
        this.isPlaying = false;
        this.fetchController = new AbortController();
    }

    // 加载并解析 M3U8 播放列表
    async load(playlistUrl) {
        this.playlistUrl = playlistUrl;
        this.segments = [];
        this.currentSegment = 0;
        
        try {
            // 通过代理获取播放列表
            const proxyPlaylistUrl = this._getProxyUrl(playlistUrl);
            const response = await fetch(proxyPlaylistUrl, {
                signal: this.fetchController.signal
            });
            const playlist = await response.text();
            
            // 解析播放列表
            this._parsePlaylist(playlist, playlistUrl);
            
            // 初始化播放器
            this._initPlayer();
            return true;
        } catch (error) {
            console.error('M3U8 加载失败:', error);
            return false;
        }
    }

    // 开始播放
    async play() {
        if (this.segments.length === 0) {
            console.error('没有可播放的分段');
            return;
        }
        
        this.isPlaying = true;
        await this._loadNextSegment();
    }

    // 停止播放
    stop() {
        this.isPlaying = false;
        this.fetchController.abort();
        this.video.pause();
        this.video.src = '';
        
        if (this.sourceBuffer) {
            try {
                if (!this.sourceBuffer.updating) {
                    this.mediaSource.removeSourceBuffer(this.sourceBuffer);
                }
            } catch (e) {}
        }
        
        if (this.mediaSource && this.mediaSource.readyState !== 'closed') {
            this.mediaSource.endOfStream();
        }
    }

    // 获取代理URL
    _getProxyUrl(url) {
        return `${this.proxyUrl}${encodeURIComponent(url)}`;
    }

    // 解析播放列表
    _parsePlaylist(playlist, baseUrl) {
        const lines = playlist.split('\n');
        const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF')) {
                const segmentUrl = lines[++i].trim();
                const absoluteUrl = segmentUrl.startsWith('http') 
                    ? segmentUrl 
                    : `${basePath}${segmentUrl}`;
                
                this.segments.push(absoluteUrl);
            }
        }
    }

    // 初始化播放器
    _initPlayer() {
        // 重新创建 MediaSource
        if (this.mediaSource) {
            this.mediaSource.endOfStream();
        }
        
        this.mediaSource = new MediaSource();
        const videoUrl = URL.createObjectURL(this.mediaSource);
        this.video.src = videoUrl;
        
        this.mediaSource.addEventListener('sourceopen', () => {
            this.sourceBuffer = this.mediaSource.addSourceBuffer('video/mp2t; codecs="avc1.42E01E, mp4a.40.2"');
            this.sourceBuffer.mode = 'sequence';
            this.sourceBuffer.addEventListener('updateend', () => {
                if (this.isPlaying && !this.sourceBuffer.updating) {
                    this._loadNextSegment();
                }
            });
        });
    }

    // 加载下一个分段
    async _loadNextSegment() {
        if (this.currentSegment >= this.segments.length || !this.isPlaying) {
            return;
        }
        
        const segmentUrl = this.segments[this.currentSegment++];
        const proxySegmentUrl = this._getProxyUrl(segmentUrl);
        
        try {
            const response = await fetch(proxySegmentUrl, {
                signal: this.fetchController.signal
            });
            
            if (!response.ok) throw new Error('网络响应错误');
            
            const buffer = await response.arrayBuffer();
            
            if (this.sourceBuffer.updating) {
                await new Promise(resolve => {
                    this.sourceBuffer.addEventListener('updateend', resolve, { once: true });
                });
            }
            
            this.sourceBuffer.appendBuffer(buffer);
            
            // 首次加载时开始播放
            if (this.currentSegment === 1 && this.video.paused) {
                this.video.play().catch(e => {
                    console.error('播放失败:', e);
                });
            }
        } catch (error) {
            console.error('分段加载失败:', error);
            this.stop();
        }
    }
}

// 集成到主播放系统
if (typeof play !== 'undefined') {
    // 备份原始方法
    const originalM3U8 = play.m3u8;
    
    // 覆盖 m3u8 播放方法
    play.m3u8 = function(url, playerElement) {
        // 尝试使用原生播放器
        try {
            return originalM3U8.call(this, url, playerElement);
        } catch (e) {
            console.warn('标准播放失败，尝试使用降级播放器:', e);
        }
        
        // 降级播放方案
        try {
            const player = play.init(playerElement);
            const m3uPlayer = new M3UPlayer(player[0]);
            
            if (m3uPlayer.load(url)) {
                m3uPlayer.play();
                
                // 存储播放器实例以便后续控制
                player[0].m3uPlayer = m3uPlayer;
                play.currentPlayer = m3uPlayer;
                
                // 监听结束事件
                player[0].addEventListener('ended', () => {
                    if (window.handleVideoEnd) {
                        window.handleVideoEnd();
                    }
                });
                
                return player;
            }
        } catch (fallbackError) {
            console.error('降级播放失败:', fallbackError);
        }
        
        // 全部失败则使用默认播放器
        console.warn('所有播放方式失败，使用默认播放器');
        return play.default(url, playerElement);
    };
}