// vlist.js
// 播放列表数据源
const PLAYLIST_URL = 'https://d.kstore.dev/download/8043/ys/SCjieko.txt';

// DOM 元素
let channelList;
let categoryGrid;
let entriesGrid;

// 初始化播放列表
function initPlaylist() {
    // 获取 DOM 元素
    channelList = document.getElementById('channel-list');
    categoryGrid = document.getElementById('category-grid');
    entriesGrid = document.getElementById('entries-grid');
    
    // 确保元素存在
    if (!channelList || !categoryGrid || !entriesGrid) {
        console.error('无法找到必要的 DOM 元素');
        return;
    }
    
    loadChannels();
    
    // 添加搜索功能
    setupSearch();
}

// 设置搜索功能
function setupSearch() {
    const searchBtn = document.getElementById('sidebar-search-btn');
    const searchInput = document.getElementById('sidebar-search-input');
    const closeBtn = document.querySelector('.close');
    const modal = document.getElementById('search-results-modal');
    
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value.trim());
    });
    
    // 输入框回车事件
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value.trim());
        }
    });
    
    // 关闭按钮事件
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 执行搜索
function performSearch(keyword) {
    if (!keyword) {
        alert('请输入搜索关键词');
        return;
    }
    
    const modal = document.getElementById('search-results-modal');
    const resultsContainer = document.getElementById('search-results-container');
    
    // 显示加载状态
    resultsContainer.innerHTML = '<div class="search-loading"><div class="loading-spinner"></div><span>搜索中...</span></div>';
    modal.style.display = 'block';
    
    // 延迟执行搜索，确保UI更新
    setTimeout(() => {
        const state = window.playState;
        let allEntries = [];
        
        // 收集当前线路的所有条目
        if (state.currentChannelData && state.currentChannelData.categories) {
            for (const category in state.currentChannelData.categories) {
                if (state.currentChannelData.categories.hasOwnProperty(category)) {
                    const entries = state.currentChannelData.categories[category];
                    allEntries = allEntries.concat(entries.map(entry => ({
                        ...entry,
                        category: category
                    })));
                }
            }
        }
        
        // 执行搜索
        const searchResults = allEntries.filter(entry => 
            entry.name.toLowerCase().includes(keyword.toLowerCase()) ||
            (entry.category && entry.category.toLowerCase().includes(keyword.toLowerCase()))
        );
        
        // 显示结果
        displaySearchResults(searchResults, keyword);
    }, 100);
}

// 显示搜索结果
function displaySearchResults(results, keyword) {
    const resultsContainer = document.getElementById('search-results-container');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">没有找到与 "${keyword}" 相关的内容</div>`;
        return;
    }
    
    let html = `<div class="search-summary">找到 ${results.length} 个与 "${keyword}" 相关的结果</div>`;
    html += '<div class="search-results-grid">';
    
    results.forEach((entry, index) => {
        html += `
            <div class="search-result-item" data-url="${entry.url}">
                <div class="result-name">${highlightKeyword(entry.name, keyword)}</div>
                <div class="result-category">分类: ${highlightKeyword(entry.category, keyword)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
    
    // 添加点击事件
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            if (url) {
                playSelectedMedia(url);
                document.getElementById('search-results-modal').style.display = 'none';
            }
        });
    });
}

// 高亮关键词
function highlightKeyword(text, keyword) {
    if (!text || !keyword) return text;
    
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// 转义正则特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 加载线路数据
async function loadChannels() {
    try {
        const response = await fetch(PLAYLIST_URL);
        if (!response.ok) throw new Error('网络响应错误');
        
        const textData = await response.text();
        let channelsData = [];
        
        if (textData.startsWith('#EXTM3U')) {
            channelsData = [{
                name: "默认线路",
                url: PLAYLIST_URL,
                content: textData
            }];
        } else if (textData.includes(',#genre#')) {
            channelsData = [{
                name: "默认线路",
                url: PLAYLIST_URL,
                content: textData
            }];
        } else {
            try {
                const data = JSON.parse(textData);
                if (!Array.isArray(data)) throw new Error('无效的数据格式');
                channelsData = data;
            } catch (jsonError) {
                throw new Error('无法识别的数据格式');
            }
        }
        
        renderChannels(channelsData);
        
        if (channelsData.length > 0) {
            selectChannel(channelsData[0]);
        }
        
        // 保存频道数据到全局状态
        window.playState.channelsData = channelsData;
    } catch (error) {
        console.error('加载线路数据失败:', error);
        if (channelList) {
            channelList.innerHTML = '<li class="channel-item">数据加载失败，请刷新重试</li>';
        }
    }
}

// 渲染线路列表
function renderChannels(channels) {
    if (!channelList) return;
    
    channelList.innerHTML = '';
    
    channels.forEach((channel, index) => {
        const li = document.createElement('li');
        li.className = 'channel-item';
        if (index === 0) li.classList.add('active');
        li.textContent = channel.name;
        
        li.addEventListener('click', () => {
            selectChannel(channel);
        });
        
        channelList.appendChild(li);
    });
}

// 选择频道
async function selectChannel(channel) {
    document.querySelectorAll('.channel-item').forEach((item, index) => {
        if (item.textContent === channel.name) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    try {
        if (categoryGrid) {
            categoryGrid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>加载分类中...</span></div>';
        }
        if (entriesGrid) {
            entriesGrid.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>加载内容中...</span></div>';
        }
        
        let content = '';
        
        if (channel.content) {
            content = channel.content;
        } else {
            const response = await fetch(channel.url);
            if (!response.ok) throw new Error('网络响应错误');
            content = await response.text();
        }
        
        let categories = {};
        
        if (content.includes(',#genre#')) {
            categories = parseTextFormat(content);
        } else if (content.startsWith('#EXTM3U')) {
            categories = parseM3UFormat(content);
        } else {
            throw new Error('未知的格式');
        }
        
        renderCategories(categories);
        
        const firstCategory = Object.keys(categories)[0];
        if (firstCategory) {
            selectCategory(firstCategory, categories[firstCategory]);
        }
        
        // 保存当前频道数据到全局状态
        window.playState.currentChannelData = {
            channel: channel,
            categories: categories
        };
    } catch (error) {
        console.error('加载分类数据失败:', error);
        if (categoryGrid) {
            categoryGrid.innerHTML = '<div class="category-item-container">数据加载失败</div>';
        }
        if (entriesGrid) {
            entriesGrid.innerHTML = '<div class="loading">数据加载失败，请刷新重试</div>';
        }
    }
}

// 解析文本格式数据
function parseTextFormat(content) {
    const lines = content.trim().split('\n');
    const categories = {};
    let currentCategory = null;
    
    for (const line of lines) {
        if (line.trim() === '') continue;
        
        if (line.includes(',#genre#')) {
            const parts = line.split(',#genre#');
            if (parts.length > 0) {
                currentCategory = parts[0].trim();
                if (currentCategory) {
                    categories[currentCategory] = [];
                }
            }
            continue;
        }
        
        const parts = line.split(',');
        if (parts.length >= 2 && currentCategory) {
            const channelName = parts[0].trim();
            const channelUrl = parts.slice(1).join(',').trim();
            if (channelName && channelUrl) {
                categories[currentCategory].push({ 
                    name: channelName, 
                    url: channelUrl 
                });
            }
        }
    }
    
    return categories;
}

// 解析M3U格式数据
function parseM3UFormat(content) {
    const lines = content.trim().split('\n');
    const categories = {};
    let currentCategory = "直播频道";
    categories[currentCategory] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
            const parts = line.split(',');
            if (parts.length > 1) {
                const channelName = parts[parts.length - 1].trim();
                if (i + 1 < lines.length) {
                    const channelUrl = lines[i + 1].trim();
                    if (channelUrl && !channelUrl.startsWith('#')) {
                        categories[currentCategory].push({ 
                            name: channelName, 
                            url: channelUrl 
                        });
                        i++;
                    }
                }
            }
        }
    }
    
    return categories;
}

// 渲染分类列表
function renderCategories(categories) {
    if (!categoryGrid) return;
    
    categoryGrid.innerHTML = '';
    
    Object.keys(categories).forEach(category => {
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-item-container';
        categoryContainer.textContent = category;
        
        categoryContainer.addEventListener('click', () => {
            selectCategory(category, categories[category]);
        });
        
        categoryGrid.appendChild(categoryContainer);
    });
    
    if (categoryGrid.firstChild) {
        categoryGrid.firstChild.classList.add('active');
    }
}

// 选择分类
function selectCategory(category, entries) {
    document.querySelectorAll('.category-item-container').forEach(item => {
        if (item.textContent === category) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 保存当前分类名称到全局状态
    window.playState.currentCategory = category;
    
    renderEntries(entries);
}

// 渲染条目列表
function renderEntries(entries) {
    if (!entriesGrid) return;
    
    entriesGrid.innerHTML = '';
    
    if (entries.length === 0) {
        entriesGrid.innerHTML = '<div class="entry-item">该分类下没有内容</div>';
        return;
    }
    
    // 检查当前分类是否为随机分类
    const isRandomCategory = window.playState.currentCategory && 
                            window.playState.currentCategory.includes('随机');
    
    entries.forEach((entry, index) => {
        const entryItem = document.createElement('div');
        entryItem.className = 'entry-item';
        entryItem.dataset.index = index;
        entryItem.innerHTML = `<div class="entry-name">${entry.name}</div>`;
        
        entryItem.addEventListener('click', () => {
            // 移除之前选中的条目
            document.querySelectorAll('.entry-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // 高亮当前选中的条目
            entryItem.classList.add('active');
            
            // 更新当前播放列表和索引
            window.playState.currentPlaylist = entries;
            window.playState.currentIndex = index;
            
            // 设置播放模式
            window.playState.playMode = isRandomCategory ? 'randomCategory' : 'playlist';
            
            // 如果是随机分类，保存基础API地址
            if (isRandomCategory) {
                window.playState.randomCategoryApi = entry.url.split('?')[0];
                console.log('设置为随机分类模式，API:', window.playState.randomCategoryApi);
            }
            
            // 播放选中的媒体
            playSelectedMedia(entry.url);
        });
        
        entriesGrid.appendChild(entryItem);
    });
}

// 播放选中的媒体
function playSelectedMedia(url) {
    // 更新URL输入框
    document.getElementById('url_box').value = url;
    
    // 触发播放按钮点击事件
    document.getElementById('url_btn').click();
}

// 检查是否全屏
function isFullscreen() {
    return document.fullscreenElement || 
           document.webkitFullscreenElement || 
           document.mozFullScreenElement || 
           document.msFullscreenElement;
}

// 请求全屏
function requestFullscreen(element) {
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

// 全局视频结束处理函数
window.handleVideoEnd = function() {
    const state = window.playState;
    console.log('视频结束，当前播放模式:', state.playMode, 'API:', state.randomCategoryApi);
    
    // 记录当前是否全屏
    const wasFullscreen = isFullscreen();
    
    if (state.playMode === 'randomCategory' && state.randomCategoryApi) {
        console.log('执行随机分类连续播放');
        // 随机分类模式：自动播放下一个随机视频
        const timestamp = new Date().getTime();
        const newUrl = state.randomCategoryApi + '?t=' + timestamp;
        
        // 更新输入框
        document.getElementById('url_box').value = newUrl;
        
        // 播放新视频
        play.load(newUrl);
        
        // 如果之前是全屏状态，恢复全屏
        if (wasFullscreen) {
            const videoElement = document.getElementById('real_video_player') || 
                                document.getElementById('video_player');
            if (videoElement) {
                // 延迟执行确保视频元素已准备好
                setTimeout(() => {
                    requestFullscreen(videoElement);
                }, 300);
            }
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
                
                // 如果之前是全屏状态，恢复全屏
                if (wasFullscreen) {
                    const videoElement = document.getElementById('real_video_player') || 
                                        document.getElementById('video_player');
                    if (videoElement) {
                        // 延迟执行确保视频元素已准备好
                        setTimeout(() => {
                            requestFullscreen(videoElement);
                        }, 300);
                    }
                }
            }
        }
    }
};

// 初始化播放列表
document.addEventListener('DOMContentLoaded', () => {
    // 使用全局已存在的播放状态，避免重复初始化
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
    
    initPlaylist();
});
