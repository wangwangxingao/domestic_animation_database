

var ww = ww || {};



/**生成marked解释器 */
(function () {

    /**链接转换 */
    ww.hrefchange = function (href) {
        if (!ww.baseUrl) {
            ww.baseUrl = ""
        }
        if (href) {
            var bl = ww.baseUrl.split("/")
            bl.pop()
            var rex = /^((\.+\/)+)((.*))/
            var match = href.match(rex)
            if (match) {
                var l = href.split("./")
                var h = l.pop()
                for (var i = 0; i < l.length; i++) {
                    if (l[i] == ".") {
                        bl.pop()
                    }
                }
                bl.push(h)
                var href = bl.join("/")
            }
        }
        return href
    }


    /**生成解释器 */
    ww.markMarked = function (src, opt, callback) {

        var renderer = new marked.Renderer();
        // Override function
        renderer.linkbase = renderer.link

        renderer.changeLink = function (href, text) {
            var href = href || ""

            var match = href.match(/^((\.*\/)+)((.*))/)
            if (match) {
                var href = ww.hrefchange(href)
                return 'javascript:ww.push("' + href + '")'
            }
            return href
        }
        renderer.link = function (href, title, text) {
            var href = this.changeLink(href, text)
            return this.linkbase(href, title, text);
        };

        renderer.image = function (href, title, text) {
            if (this.options.baseUrl && !originIndependentUrl.test(href)) {
                href = resolveUrl(this.options.baseUrl, href);
            }

            var href = ww.hrefchange(href)
            var out = '<img src="' + href + '" alt="' + text + '"';
            if (title) {
                out += ' title="' + title + '"';
            }
            out += this.options.xhtml ? '/>' : '>';
            return out;
        };
        // Run marked
        var opt = opt || {}
        opt.renderer = opt.renderer ? opt.renderer : renderer

        return function (src) {
            return marked(src, opt, callback)
        }
    };

    ww.marked = ww.markMarked()

})();

/**文件及搜索 */
(function () {
    function saveHash() {
        this.clear()
    }

    saveHash.prototype.clear = function () {
        this._data = {}
        this._time = {}
        this._index = 0
        this._clear = 0
        this._must = 0
    }
    saveHash.prototype.setItem = function (name, data) {
        if (this._data[name] !== data) {
            this._data[name] = data
            this._must++
        }
    }
    saveHash.prototype.getItem = function (name) {
        return this._data[name]
    }

    saveHash.prototype.setTime = function (name, data) {
        this._time[name] = data
    }
    saveHash.prototype.getTime = function (name) {
        return this._time[name]
    }

    saveHash.prototype.delItem = function (name) {
        delete this._data[name]
        delete this._time[name]
    }

    saveHash.prototype.pushItem = function (name, data) {
        this.setItem(name, data)
        this.setTime(name, this._index++)
    }


    saveHash.prototype.pushTime = function (name) {
        this.setTime(name, this._index++)
    }

    saveHash.prototype.clearMust = function () {
        this._must = 0
    }

    saveHash.prototype.addIndex = function (i) {
        this._index += (i || 0)
    }

    /**获取项目长度 */
    saveHash.prototype.getitemLength = function (name) {
        var n = this.getItem(name)
        return (n && n.length) || 0
    }


    saveHash.prototype.clearTop = function (i) {
        this._clear += (i || 0)
        for (var n in this._data) {
            var t = this._time[n]
            if (t <= this._clear) {
                this.delItem(n)
            }
        }
        //console.log("saveClear")
    }

    saveHash.prototype.clearEnd = function (i) {
        this._index -= (i || 0)
        for (var n in this._data) {
            var t = this._time[n]
            if (t > this._index) {
                this.delItem(n)

            }
        }
    }

    saveHash.prototype.clearTopBig = function (i, b, a) {
        var v = this._clear + (i || 0)
        var b = b || 0
        for (var n in this._data) {
            var t = this._time[n]
            if (t >= v) {
                var l = this.getitemLength(n)
                if (a ? l <= b : l >= b) {
                    this.delItem(n)
                }
            }
        }
        //console.log("saveClear")
    }

    saveHash.prototype.clearEndBig = function (i, b, a) {
        var v = this._clear + (i || 0)
        var b = b || 0
        for (var n in this._data) {
            var t = this._time[n]
            if (t >= v) {
                var l = this.getitemLength(n)
                if (a ? l <= b : l >= b) {
                    this.delItem(n)
                }
            }
        }
        //console.log("saveClear")
    }

    saveHash.prototype.clearBig = function (b, a) {
        for (var n in this._data) {
            var l = this.getitemLength(n)
            if (a ? l <= b : l >= b) {
                this.delItem(n)
            }
        }
        //console.log("saveClear")
    }


    saveHash.prototype.clearUse = function () {
        this.clearTop(5)
        this.clearEndBig(5, 100000)
    }

    saveHash.prototype.clearFun = function (fun) {
        if (typeof (fun) == "function") {
            for (var n in this._data) {
                if (fun(this._data, n, this)) {
                    this.delItem(n)
                }
            }
        }
    }


    ww._data = {}
    ww._tempData = {}


    /**位置储存列表 */
    ww._path = []
    ww._pathIndex = -1


    ww._files = {}
    ww._fileslist = []
    ww._filesMd5 = {}

    /**
     * 当搜索大量文件时是否询问继续
     * 0 不询问,直接搜索
     * 1 不询问,并继续 
     * 2 不询问,不继续
     * <0 询问 
     * 
     */
    ww._askFindBig = 0

    /**
     * 当继续时
     * 是否需要限制
     * 0 不需要
     * 1 需要
     * <0 询问 
     */
    ww._askFindBigMust = 0
    /**
     * 限制单个文件大小
     * <0 询问
     */
    ww._askFindFileBig = Infinity

    /**
     * 限制全部文件大小
     * <0 询问
     */
    ww._askFindFileAllBig = Infinity

    ww._savedata = new saveHash()

    ww._savedata.getitemLength = function (n) {
        var save = this._data[n]
        if (save) {
            var n = save[1]
            return (n && n.length) || 0
        }
        return 0
    }


    //console.log(ww._savedata)
    ww.LSGetData = function () {
        var data = localStorage.getItem("savefile")
        var string = data ? LZString.decompress(data) : "{}";
        try {
            var data = JSON.parse(string) || {}
        } catch (error) {
            var data = {}
        }
        ww._savedata._data = data
        for (var i in data) {
            ww._savedata.pushItem(i)
        }

        for (var i in data) {
            if (!ww.canUseLSData(i)) {
                ww._savedata.delItem(i)
            }
        }

        ww.timeSave()
    }



    /**保存数据 */
    ww.LSPushData = function (url, data) {

        var url = ww.delUrlHear(url)
        if (!url) {
            return 0
        }
        var md5 = ww._filesMd5[url]

        ww._savedata.pushItem(url, [md5, data])

    }

    ww.getLSData = function (url) {
        return ww._savedata.getItem(url)
    }


    /**根据时间保存 */
    ww.timeSave = function () {
        if (ww._savedata._must) {
            ww._savedata._must = 0
            //console.log("savedate")
            var v = ww.LSSaveData()
        }
        setTimeout(ww.timeSave, 60000)
    }



    /**设置保存数据 */
    ww.LSSaveData = function () {
        var json = JSON.stringify(ww._savedata._data)

        var compressed = LZString.compress(json);
        try {
            localStorage.setItem("savefile", compressed);
        } catch (oException) {
            if (oException.name == 'QuotaExceededError') {
                console.log('超出本地存储限额！');
                //localStorage.clear();
                ww._savedata.clearTop(20)
                ww.LSSaveData()
            }
        }
    }


    ww.addUrlHear = function (url) {
        var url = url || ""
        if (url.indexOf("./") == 0) {
            return url
        } else {
            return "./" + url
        }
    }

    ww.delUrlHear = function (url) {
        var url = url || ""
        if (url.indexOf("./") == 0) {
            url = url.slice(2)
        }
        return url
    }

    ww.canUseLSData = function (url) {
        var url = ww.delUrlHear(url)
        var save = ww._savedata.getItem(url)
        if (Array.isArray(save)) {
            if (save[0] == ww.getFileMd5(url)) {
                return save
            }
        }
        return 0
    }


    /**
    * 获取
    * @param {*} url 链接
    * @param {*} type 种类
    * @param {*} loaded 当获得
    * @param {*} progress 
    * @param {*} error 
    * @param {*} abort 
    */
    ww.get = function (url, type, loaded, temp) {
        if (ww._data[url] || ww._tempData[url]) {
            if (typeof loaded == "function") {

                //console.log("have", url) 
                loaded(ww._data[url] || ww._tempData[url])
            } else {
                console.log(ww._data[url] || ww._tempData[url])
            }
            if (!temp) {
                ww.LSPushData(url, ww._data[url] || ww._tempData[url])
            }
            return
        }
        if (!temp) {
            var save = this.getLSData(url)
            if (save) {
                // console.log("have save", url)
                if (typeof loaded == "function") {
                    loaded(save[1])
                } else {
                    console.log(save[1])
                }
                return
            }
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = (typeof (type) == "string") ? type : "arraybuffer"
        xhr.onloadend = function () {
            if (temp) {
                ww._tempData[url] = xhr.response
            } else {
                ww._data[url] = xhr.response
            }
            if (typeof loaded == "function") {
                loaded(xhr.response, xhr)
            } else {
                console.log(xhr.response, xhr)
            }
            if (!temp) {
                ww.LSPushData(url, xhr.response)
            }
        };
        xhr.send()
        return xhr
    }


    /**获得文件大小 */
    ww.getFileBig = function (url) {
        var url = ww.delUrlHear(url)
        if (ww._data[url] || ww._tempData[url]) {
            return 0
        }
        var save = ww.canUseLSData(url)
        if (save) {
            return 0
        }
        var data = ww._filesMd5[url]

        if (data) {
            var n = data.split(",").pop() * 1
            if (typeof n == "number") {
                return n
            }
        }
        return 0
    }




    ww.getFileMd5 = function (url) {
        return ww._filesMd5[url]
    }


    ww.markFileMd5 = function (list, files, obj) {
        var obj = obj || {}
        var files = files || ww._files
        var list = list || []
        if (typeof files == "object") {
            for (var i in files) {
                list.push(i)
                ww.markFileMd5(list, files[i], obj)
                list.pop()
            }
        } else if (files) {
            obj[list.join("/")] = files
        }
        return obj
    }


    /**制作文件列表 */
    ww.markFileList = function (list, files, obj) {
        var files = files || ww._files
        var obj = obj || []
        var list = list || []
        if (typeof files == "object") {
            for (var i in files) {
                list.push(i)
                ww.markFileList(list, files[i], obj)
                list.pop()
            }
        } else if (files) {
            obj.push(list.join("/"))
        }
        return obj
    }


    /**生成查找文件表 */
    ww.markFileFindList = function (data) {
        var files = this._fileslist
        var list = []

        for (var i = 0; i < files.length; i++) {
            var name = files[i]
            if (!data || name.indexOf(data) == 0) {
                list.push(name)
            }
        }
        return list
    }


    /**搜索 */
    ww.search = function (keywords, data) {
        //console.log(keywords, data)
        if (keywords) {
            if (data == this.nowPath()) {
                ww.Highlighter.search(ww.markeddiv, keywords)
                ww.Highlighter.searchResult()
            } else {
                ww.find(keywords, data)
            }
        } else {
            ww.Highlighter.clear()
            ww.scrollTo(0, 0)
        }
    }

    ww._findObj = {}



    /**寻找 */
    ww.find = function (keywords, url) {

        /**搜索中 不继续 */
        /*if (ww._findIndex > 0) {
            return
        }*/
        /**没有词语时不进行 */
        if (!keywords) {
            return
        }
        var keywords = keywords || ""

        var url = ww.delUrlHear(url)
        ww._findText = "./find/" + url + "&" + keywords + ".md"

        if (ww._tempData[ww._findText]) {
            ww.push(ww._findText)
            ww.search(keywords, ww._findText)
            return
        }


        var find = ww.markfind(keywords)


        var list = ww.markFileFindList(url)


        //ww.pathInput.value = ww._findText
        //ww.baseUrl = "./Find.md" 
        if (list.length) {
            var list = ww.setFindFiles(list)
            if (!list) {
                ww._findAll = ww._findIndex = ww._findNumber = 0
                return
            }

            if (ww._tempData[ww._findText]) {
                ww.push(ww._findText)
                ww.search(keywords, ww._findText)
                return
            }

            if (list.length) {
                if (!ww._findObj[ww._findText]) {
                    var obj = {
                        findText: ww._findText,
                        hear: "",
                        end: "",
                        data: [],
                        files: [],
                        filesre: {},
                        datafiles: [],
                        findall: list.length
                    }
                    ww._findObj[ww._findText] = obj
                    var showhear = "# 搜索\n"
                    var showpath = "\n>搜索位置:" + url + "  "
                    var showtext = "\n>搜索内容:" + keywords + "  \n"
                    obj.hear = showhear + showpath + showtext

                    ww._tempData[ww._findText] = obj.hear + "\n>搜索中: 需要搜索" + list.length + "个文件  \n"
                    ww.push(ww._findText)
                    for (var i = 0; i < list.length; i++) {
                        var n = list[i]
                        ww.getfind("./" + n, find, keywords, obj)
                    }
                }
                return
            }
        }

        /**当没有搜索内容时 */
        var showhear = "# 搜索\n"
        var showpath = "\n>搜索位置:" + url + "  "
        var showtext = "\n>搜索内容:" + keywords + "  \n"

        var showend = "\n# 搜索结束"
        var showall = "\n\n>搜索 " + 0 + " 个文件  "
        var shownum = "\n>找到 " + 0 + " 个文件\n"

        ww._tempData[ww._findText] +=
            showhear + showpath + showtext +
            "" +
            showend + showall + shownum

        ww._findIndex = 0
        ww._findNumber = 0
        ww._findAll = 0

        ww.push(ww._findText)
        ww.search(keywords, ww._findText)
        //ww.push(ww._findText) 

    }

    ww.byteConvert = function (bytes) {
        if (isNaN(bytes)) {
            return '';
        } var symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']; var exp = Math.floor(Math.log(bytes) / Math.log(2)); if (exp < 1) {
            exp = 0;
        } var i = Math.floor(exp / 10); bytes = bytes / Math.pow(2, 10 * i); if (bytes.toString().length > bytes.toFixed(2).toString().length) {
            bytes = bytes.toFixed(2);
        } return bytes + ' ' + symbols[i];
    };

    ww.setFindFiles = function (list) {
        /**
             * 当搜索大量文件时是否询问继续
             * 0 不询问,直接搜索
             * 1 不询问,并继续 
             * 2 不询问,搜索已有 
             * 5 不询问,不继续
             * <0 询问 
             * 
             */
        var askFindBig = ww._askFindBig
        /**
         * 当继续时
         * 是否需要限制
         * 0 不需要
         * 1 需要
         * <0 询问 
         */
        var askFindBigMust = ww._askFindBigMust

        /**
         * 限制单个文件大小
         * <0 询问
         */
        var askFindFileBig = ww._askFindFileBig

        /**
         * 限制全部文件大小
         * <0 询问
         */
        var askFindFileAllBig = ww._askFindFileAllBig

  
        if (!askFindBig) {
            return list
        }

        var l = []
        var big = 0
        /**当有搜索内容时 */
        for (var i = 0; i < list.length; i++) {
            var n = list[i]
            var b = ww.getFileBig(n)
            big += b
            l.push(b)
        }

        var pcbig = ww.byteConvert(big)
        //console.log(big, pcbig)

        if (!big) {
            return list
        }

        if (askFindBig < 0) {
            var v = confirm("约需要获取" + pcbig + " 数据" + ",是否继续")
        } else {
            var v = askFindBig != 5
            if (askFindBig == 2) {
                askFindBigMust = 1
                askFindFileBig = 0
                askFindFileBig = 0 
            } 
        }

        if (v) {
            if (askFindBigMust < 0) {
                var v2 = confirm("是否进行限制")
            } else {
                var v2 = askFindBigMust || 0
            }
            if (v2) {

                if (askFindFileBig < 0) {
                    var z = prompt("限制单个文件大小", "Infinity")
                    var z = z ? z * 1 : 0
                } else {
                    var z = askFindFileBig || 0
                }

                if (askFindFileAllBig < 0) {
                    var allz = prompt("限制总大小", "Infinity")
                    var allz = allz ? allz * 1 : 0
                } else {
                    allz = askFindFileAllBig || 0
                }

                ww._findText += "&" + z + "&" + allz
                var l2 = []

                var ba = 0

                var br = true
                for (var i = 0; i < list.length; i++) {
                    var b = l[i]
                    if (b <= z) {
                        ba += b
                        if (ba <= allz) {
                            l2.push(list[i])
                        } else {
                            br = false
                            if (!b || br) {
                                l2.push(list[i])
                            }
                        }
                    }
                }
                return l2
            } else {
                return list
            }
        } else {
            return 0
        }
    }



    /**获取并寻找 */
    ww.getfind = function (n, find, keywords, obj) {
        ww.get(n, "text", function (re) {



            var r = find(re || "")

            obj.files.push(n)
            obj.filesre[n] = !!r

            if (r != false) {

                var nl = n.split("/")
                var t = nl.pop()

                nl.shift()
                var path = nl.join("/")
                if (path == ".") {
                    path = ""
                }
                var showlink = "\n### " +
                    "[" + t + "]" +
                    "(" + "./" + (n).replace(/ /g, "%20") + ")\n"
                var showpath = "> " + path + "  \n"
                var showre = "\n```\n" + r + "\n```\n"

                obj.datafiles.push(n)
                obj.data.push(showlink + showpath + showre)

            }

            if (obj.files.length >= obj.findall) {

                var showend = "\n# 搜索结束"
                var showall = "\n\n>搜索 " + obj.findall + " 个文件  "
                var shownum = "\n>找到 " + obj.datafiles.length + " 个文件\n"

                obj.end = showend + showall + shownum

                ww._tempData[obj.findText] = obj.hear + obj.data.join("") + obj.end
                if (ww.nowPath() == obj.findText) {
                    ww.open(obj.findText)
                    ww.search(keywords, obj.findText)
                }
                //ww.showmarked(ww._findText)
            }
        })
    }



    /**生成寻找方法 */
    ww.markfind = function (keywords) {
        var re = ww.parsewords(keywords)
        if (Array.isArray(re) && re.length) {

            var words = []
            for (var i = 0; i < re.length; i++) {
                if (re[i]) {
                    words.push(ww.RegexParser(re[i], 'i'))
                }
            }

            return function (text) {
                if (text) {
                    var r = -1
                    for (var i = 0; i < words.length; i++) {
                        var rex = words[i]
                        //var rex = 
                        var index = text.search(rex)

                        if (index < 0) {
                            return false
                        } else {
                            if (r == -1) {
                                r = index
                            }
                        }
                    }
                    if (r >= 0) {

                        var sl = text.slice(0, r).split("\n")

                        var s = sl.length

                        var l = text.split("\n")

                        s = Math.max(0, s - 3)
                        e = Math.min(l.length, s + 5)

                        var t = l.slice(s, e)
                        var t = t.join("\n")

                        t = t.replace(/```/g, "\n")
                        return t
                    }
                }
                return false
            }
        } else {
            return function () {
                return false
            }
        }
    }


    /**解析词语 */
    ww.parsewords = function (keywords) {

        var json = ""
        try {
            var json = JSON.parse(keywords)

        } catch (error) {
            var json = keywords
        }
        keywords = json || ""
        if (keywords) {
            if (!Array.isArray(keywords)) {
                if (typeof (keywords) == "object") {
                    var re = []
                    for (var n in keywords) {
                        re.push(n);
                    }
                    return re
                } else {
                    var keywords = ["" + keywords]
                }
            }
            if (Array.isArray(keywords)) {
                if (keywords.length) {
                    var re = []
                    for (var i = 0; i < keywords.length; i++) {
                        re.push(keywords[i]);
                    }
                    return re;
                }
            }
        }
        return ""
    }






    ww.get("./js/files.json", "text", function (data) {
        var json
        try {
            json = JSON.parse(data)
        } catch (error) {
            json = {}
        }
        ww._files = json
        ww._fileslist = ww.markFileList()
        ww._filesMd5 = ww.markFileMd5()


        ww.LSGetData()

        ww.creat()
        ww.openHome()


    }, 1)

})();

/**网页方法 */
(function () {

    ww.open = function (value) {
        console.log(value)
        ww.setPathInputValue(value)
        value = (value || "")
        if (value.indexOf("./find/") == 0) {
            ww.nameInput.value = (value || "").slice(7) || ""
            ww.baseUrl = "./find.md"
        } else {
            ww.baseUrl = value
            ww.nameInput.value = ((value || "").split("/").pop()) || ""
        }
        var hash = value.split("#")[1]

        ww.get(value, "text",
            function (re) {
                ww.showmarked(re)
                if (hash) {
                    window.location.hash = "#" + hash
                }
            })
    }


    ww.showmarked = function (text) {
        var text = text || ""
        var md = ww.marked(text)
        ww.markeddiv.innerHTML = md
        ww.Highlighter.clear()
        ww.scrollTo(0, 0)
    }


    ww.showmarked2 = function (text) {
        var text = text || ""
        var md = ww.marked(text)
        ww.markeddiv.innerHTML = md
        ww.Highlighter.clear()

        ww.scrollToEnd()
    }

    /**当前位置 */
    ww.nowPath = function (index) {
        return ww.getPath(ww._pathIndex)
    }


    ww.getPath = function (index) {
        return ww._path[index] || "./README.md"
    }

    /**添加地址 */
    ww.push = function (value) {

        var path = ww.nowPath()
        if (value == path) {
            ww.setPathInputValue(value)
            ww.Highlighter.clear()
            ww.scrollTo(0, 0)
            return
        }
        ww._path.length = Math.max(0, ww._pathIndex + 1)
        ww._path.push(value)
        ww._pathIndex = ww._path.length - 1
        //console.log(ww._path, ww._pathIndex)
        ww.open(value)
    }


    //滚动到
    ww.scrollTo = function (x, y) {
        ww.maindiv.scrollLeft = x
        ww.maindiv.scrollTop = y
    }

    /**滚动到头部 */
    ww.scrollToTop = function () {
        ww.scrollTo(0, 0)
    }

    /**滚动到尾部 */
    ww.scrollToEnd = function () {
        ww.scrollTo(0, ww.maindiv.scrollHeight)
    }

    /**上一个地址 */
    ww.last = function () {
        ww._pathIndex--
        if (ww._pathIndex <= -1) {
            ww._pathIndex = -1
        }
        return ww.nowPath()
    }

    ww.next = function () {
        ww._pathIndex++
        if (ww._pathIndex > ww._path.length - 1) {
            ww._pathIndex = ww._path.length - 1
        }
        return ww.nowPath()
    }

    ww.toNext = function () {

        if (ww._pathIndex < ww._path.length - 1) {
            ww._pathIndex++
            var path = ww.nowPath()
            ww.open(path)
        } else {
            ww.toPath()
        }
    }

    ww.toLast = function () {
        if (ww._pathIndex > 0) {
            ww._pathIndex--
            var path = ww.nowPath()
            ww.open(path)
        } else if (ww._pathIndex <= 0) {
            var p1 = ww.nowPath()
            ww._pathIndex = -1
            var path = ww.nowPath()
            if (p1 == path) {
                return
            }
            ww.open(path)
        }
    }


    ww.toHome = function () {
        var p = "./README.md"
        var path = ww.getPathInputValue()
        ww.push(p)
        if (path == p) {
            ww.setPathInputValue("")
        } else {
            ww.setPathInputValue(p)
        }
    }

    ww.openHome = function () {
        var p = "./README.md"
        ww.open(p)
    }

    ww.toPath = function () {
        if (ww.pathInput.value) {
            ww.push(ww.getPathInputValue())
        }
    }

    ww.setPathInputValue = function (data) {
        ww.pathInput.value = ww.delUrlHear(data)
    }

    ww.getPathInputValue = function () {
        var data = ww.pathInput.value
        return ww.addUrlHear(data)
    }
})();



/**创建元素 */
(function () {


    ww.creat = function () {

        /**主要显示 */
        ww.maindiv = document.createElement("div")
        ww.maindiv.style = "width:100%; height:auto; position:absolute;  box-sizing:border-box; overflow-y:scroll; left:0; bottom: 0;"
        document.body.appendChild(ww.maindiv);

        /**头部工具栏 */
        ww.top = document.createElement("div")
        ww.top.style = "left:auto; top: 0; width:auto; position:absolute;box-sizing:border-box; "//height:10%;   overflow-y:scroll; "//"position:absolute;top: 0;box-sizing:border-box; width:100%;height:auto;overflow-y:scroll;" 
        document.body.appendChild(ww.top);

        ww.top1 = document.createElement("div")
        ww.top.appendChild(ww.top1);

        ww.top2 = document.createElement("div")
        ww.top.appendChild(ww.top2);



        /**md浏览用的位置 */
        ww.markeddiv = document.createElement("div")
        ww.markeddiv.className = "markdown-body"
        ww.maindiv.appendChild(ww.markeddiv);



        /**位置输入 */
        ww.pathInput = document.createElement("input")
        ww.pathInput.type = "text"
        ww.top1.appendChild(ww.pathInput);

        /**名称输入 */
        ww.nameInput = document.createElement("input")
        ww.nameInput.type = "text"
        //ww.top1.appendChild(ww.nameInput);



        /**上一个 */
        ww.lastButton = document.createElement("input")
        ww.lastButton.type = "button"
        ww.lastButton.value = "<"
        ww.lastButton.onclick = function () {
            ww.toLast()
        }
        ww.top1.appendChild(ww.lastButton);


        /**主页 */
        ww.homeButton = document.createElement("input")
        ww.homeButton.type = "button"
        ww.homeButton.value = "合"
        ww.homeButton.onclick = function () {
            ww.toHome()
        }
        ww.top1.appendChild(ww.homeButton);



        /**下一个 */
        ww.nextButton = document.createElement("input")
        ww.nextButton.type = "button"
        ww.nextButton.value = ">"
        ww.nextButton.onclick = function () {
            ww.toNext()
        }
        ww.top1.appendChild(ww.nextButton);

        ww.setButton = document.createElement("input")
        ww.setButton.type = "button"
        ww.setButton.value = "*"
        ww.setButton.onclick = function () {
            ww.setOpen()
        }
        ww.top1.appendChild(ww.setButton);


        /**设置打开 */
        ww.setOpen = function () {
        }


        /**寻找输入 */
        ww.findInput = document.createElement("input")
        ww.findInput.type = "text"
        ww.findInput.value = "搜索"
        ww.top2.appendChild(ww.findInput);



        /**寻找按钮 */
        ww.findButton = document.createElement("input")
        ww.findButton.type = "button"
        ww.findButton.value = "搜索"
        ww.findButton.onclick = function () {
            ww.search(ww.findInput.value, ww.getPathInputValue())
        }
        ww.top2.appendChild(ww.findButton);



        /**刷新按钮 */
        ww.openButton = document.createElement("input")
        ww.openButton.type = "button"
        ww.openButton.value = "刷新"
        ww.openButton.onclick = function () {
            ww.toPath()
        }
        ww.top2.appendChild(ww.openButton);



        /**css添加 */
        ww.css = document.createElement("link");
        ww.css.setAttribute("rel", "stylesheet");
        ww.css.setAttribute("type", "text/css");
        ww.css.setAttribute("href", "./js/github.css");
        document.body.appendChild(ww.css);



        /**css选择器 */
        //ww.markcssSelect()



        /**颜色选择器 */
        //ww.colorSelect = document.createElement("input");
        //ww.colorSelect.type = "color"
        //ww.top1.appendChild(ww.colorSelect);


        /**绑定高 */
        ww.maindiv.style.top = ww.top.clientHeight + "px"
        window.onresize = function () {
            ww.maindiv.style.top = ww.top.clientHeight + "px"
        }

    }


    /**制作css选择器 */
    /*
    ww.markcssSelect = function () {
        ww.cssSelect = document.createElement("select");

        var list = ["Juridico.scss", "Pesto.scss", "Academia.css", "Academic.css", "Amelia.css", "Avenue.css", "Base16 3024.css", "Base16 Ashes.css", "Base16 Atelier Dune.css", "Base16 Atelier Forest.css", "Base16 Atelier Heath.css", "Base16 Atelier Lakeside.css", "Base16 Atelier Seaside.css", "Base16 Bespin.css", "Base16 Brewer.css", "Base16 Chalk.css", "Base16 Codeschool.css", "Base16 Default.css", "Base16 Eighties.css", "Base16 Embers.css", "Base16 Flat.css", "Base16 Google.css", "Base16 Grayscale.css", "Base16 Green Screen.css", "Base16 Isotope.css", "Base16 London Tube.css", "Base16 Marrakesh.css", "Base16 Mocha.css", "Base16 Monokai.css", "Base16 Ocean.css", "Base16 Paraiso.css", "Base16 Pop.css", "Base16 Railscasts.css", "Base16 Shapeshifter.css", "Base16 Solarized.css", "Base16 Tomorrow.css", "Base16 Twilight.css", "Blank Code Theme.css", "Custom.css", "Firates.css", "Fountain.css", "Gotham.css", "Grump.css", "Header.css", "Highlighter.css", "Image Reference Pane.css", "Juridico.css", "Kult.css", "Lopash.css", "Palatino Memo.css", "Pandoctor.css", "Pesto.css", "Simplex.css", "Swiss Mou.css", "Teleprompter.css", "Torpedo.css", "Ulysses Freestraction Light.css", "UpstandingCitizen.css", "Vostock.css", "Yeti.css", "amblin.css", "antique.css", "github.css", "ink.css", "manuscript.css", "modern.css", "swiss.css"]
        var o = document.createElement("option");
        o.text = "默认样式";
        o.value = "./js/github.css"
        try { ww.cssSelect.add(o); } catch (ex) { ww.cssSelect.add(o, null); }

        for (var i = 0; i < list.length; i++) {
            var name = list[i]
            var text = name.split(".")[0]
            var value = "./js/css/" + name
            var o = document.createElement("option");
            o.text = text;
            o.value = value
            try { ww.cssSelect.add(o); } catch (ex) { ww.cssSelect.add(o, null); }
        }

        ww.cssSelect.onchange = function () {

            var index = ww.cssSelect.selectedIndex; // 选中索引

            var text = ww.cssSelect.options[index].text; // 选中文本

            var value = ww.cssSelect.options[index].value;

            ww.css.setAttribute("href", value)
        }

        //ww.top1.appendChild(ww.cssSelect);

    } 
    */

})();




/**高亮寻找 */
(function () {

    /** 
     * 高亮显示关键字, 构造函数 
     * @param {} colors 颜色数组，其中每个元素是一个 '背景色,前景色' 组合 
     */
    function Highlighter(colors) {
        this._oldnode = null
        this._oldword = ""
        this._searchIndex = 0
        this._results = []
        this._colors = colors;
        if (!this._colors) {
            //默认颜色  
            this._colors = [
                '#6894b5, #000000',
                '#68bbb5,#000000',
                '#7983ab,#000000',
                '#dae9d1,#000000',
                '#eabcf4,#000000',
                '#c8e5ef,#000000',
                '#f3e3cb, #000000',
                '#e7cfe0,#000000',
                '#c5d1f1,#000000',
                '#deeee4, #000000',
                '#b55ed2,#000000',
                '#dcb7a0,#333333',
                '#ffff00,#000000',
            ];
        }
    }

    Highlighter.prototype.clear = function (node, keywords) {

        this._oldnode = node || null
        this._oldword = keywords || ""
        this._searchIndex = 0
        this.dehighlight()
    }

    Highlighter.prototype.search = function (node, keywords, index) {

        if (this._oldword == keywords && this._oldnode == node) {
            if (index == undefined) {
                index = this._searchIndex + 1
            }

            this.searchIndex(index)

        } else {
            this.clear(node, keywords)
            this.highlight(node, keywords)
            this.searchIndex(0)
        }
        return this._results

    }


    Highlighter.prototype.dehighlight = function () {

        var result
        while (result = this._results.pop()) {
            //console.log(result)
            var data = result[0]
            var node = result[1]
            var childNode = result[2]
            var forkNode = result[3]
            node.replaceChild(childNode, forkNode);
        }
        /* 
        for (var i = 0; i < this._results.length; i++) {
            var result = this._results[i]
            var data = result[0]
            var node = result[1]
            var childNode = result[2]
            var forkNode = result[3]
            node.replaceChild(forkNode, childNode);
        } */
    }

    /**寻找结果 */
    Highlighter.prototype.searchResult = function () {

        var list = []
        for (var i = 0; i < this._results.length; i++) {
            var result = this._results[i]
            var data = result[0]
            list.push(data)
            var node = result[1]
            var childNode = result[2]
            var forkNode = result[3]
            //node.replaceChild(forkNode, childNode);
        }
        return list
    }

    /**寻找索引 */
    Highlighter.prototype.searchIndex = function (i) {

        i = i || 0
        if (i <= 0 || i >= this._results.length) {
            i = 0
        }
        this._searchIndex = i

        var result = this._results[i]

        if (result) {
            var data = result[0]


            var node = result[1]
            var childNode = result[2]
            var forkNode = result[3]


            var h = (window.innerHeight || 0) * 0.1

            ww.scrollTo(0, node.offsetTop - h)
        }

    }


    /** 
     * 高亮显示关键字 
     * @param {} node    html element 
     * @param {} keywords  关键字， 多个关键字可以通过空格隔开， 其中每个关键字会以一种颜色显式 
     *  
     * 用法： 
     * var hl = new Highlighter(); 
     * hl.highlight(document.body, '这个 世界 需要 和平'); 
     */
    Highlighter.prototype.highlight = function (node, keywords) {

        if (!keywords || !node || !node.nodeType || node.nodeType != 1) {
            keywords = null
        } else {
            keywords = this.parsewords(keywords);
        }
        this.dehighlight()
        if (!keywords) {
            return this._results
        };

        for (var ki = 0; ki < keywords.length; ki++) {
            var keyword = keywords[ki]
            this.colorword(node, keyword);
        }

        return this._results
    }

    /** 
     * 对所有#text的node进行查找，如果有关键字则进行着色 
     * @param {} node 节点 
     * @param {} keyword 关键字结构体，包含了关键字、前景色、背景色 
     */
    Highlighter.prototype.colorword = function (node, keyword) {
        for (var i = 0; i < node.childNodes.length; i++) {
            var childNode = node.childNodes[i];

            if (childNode.nodeType == 3) {
                //childNode is #text   
                var re = keyword.rex
                if (childNode.data.search(re) == -1) {
                    continue
                } else {
                    var forkNode = document.createElement('span');
                    var re = keyword.rex2
                    forkNode.innerHTML = childNode.data.replace(
                        re, this.span(keyword)
                    );
                    node.replaceChild(forkNode, childNode);
                    this._results.push([childNode.data, node, childNode, forkNode, this._results.length])
                }
            } else if (childNode.nodeType == 1) {
                //childNode is element  
                this.colorword(childNode, keyword);
            }
        }
    }


    Highlighter.prototype.span = function (keyword) {

        var span = '<span ' +
            'style=' +
            'background-color:' + keyword.bgColor +
            ';color:' + keyword.foreColor +
            ' mce_style=background-color:' + keyword.bgColor +
            ';color:' + keyword.foreColor + '>' + '$1' +
            '</span>'
        return span
    }





    /** 
     * json对象 
     * @param string keywords 
     * @return {} 
     */
    Highlighter.prototype.parsewords = function (keywords) {
        var json = null
        try {
            var json = JSON.parse(keywords)

        } catch (error) {
            var json = keywords
        }
        keywords = json
        if (keywords) {
            if (!Array.isArray(keywords)) {
                if (typeof (keywords) == "object") {
                    var re = []
                    var i = 0
                    for (var n in keywords) {
                        if (n) {
                            var keyword = {};
                            var color = keywords[n];
                            keyword.word = n;

                            if (typeof color == "string") {
                                var color = color.split(',');
                            }
                            if (color) {
                                keyword.bgColor = color[0];
                                keyword.foreColor = color[1];
                            }
                            if (!(keyword.bgColor && keyword.foreColor)) {
                                var color = this._colors[i % this._colors.length].split(',');
                                keyword.bgColor = color[0];
                                keyword.foreColor = color[1];
                                i++
                            }
                            keyword.rex = ww.RegexParser(keyword.word, 'i')
                            keyword.rex2 = ww.RegexParser('(' + keyword.word + ')', 'gi')
                            re.push(keyword);
                        }

                    }
                    return re
                } else {
                    var keywords = ["" + keywords]
                }
            }
            if (Array.isArray(keywords)) {
                if (keywords.length) {
                    var re = []
                    for (var i = 0; i < keywords.length; i++) {
                        if (keywords[i]) {
                            var keyword = {};
                            var color = this._colors[i % this._colors.length].split(',');
                            keyword.word = keywords[i];
                            keyword.bgColor = color[0];
                            keyword.foreColor = color[1];
                            keyword.rex = ww.RegexParser(keyword.word, 'i')
                            keyword.rex2 = ww.RegexParser('(' + keyword.word + ')', 'gi')
                            re.push(keyword);
                        }
                    }
                    return re;
                }
            }
        }
        return null;
    }

    /** 
     * 按照字符串长度，由长到短进行排序 
     * @param {} list 字符串数组 
     */
    Highlighter.prototype.sort = function (list) {
        list.sort(function (e1, e2) {
            return e1.length < e2.length;
        });
    }


    ww.RegexParser = function (input, type) {
        // Validate input
        if (typeof input !== "string") {
            throw new Error("Invalid input. Input must be a string");
        }

        // Parse input
        var m = input.match(/(\/?)(.+)\1([a-z]*)/i);

        // Invalid flags
        if (m[3] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(m[3])) {
            return RegExp(input, type);
        }

        type = type || m[3]
        // Create the regular expression
        return new RegExp(m[2], type);
    };

    ww.Highlighter = new Highlighter()


})();


