

var ww = ww || {};

ww.loadScript = function (l) {
    if (!Array.isArray(l)) {
        var l = [l]
    }
    for (var i = 0; i < l.length; i++) {
        var u = "./js/" + l[i] + '.js';
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = u;
        s.async = false;
        //s.onerror =  console.log  ;
        document.body.appendChild(s);
    }
};


/**开始 */
ww.loadScript([
    /**制作marked */
    "makeMarked",
    /**文件和搜索 */
    "fileandfind",
    /**网页方法 */
    "webfun",
    /**高亮元素 */
    "Highlighter",
    /**创建元素 */
    "makeweb",
    /**开始 */
    "start",

]);






