

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
        var item = this._data[name]
        delete this._data[name]
        delete this._time[name]
        console.log("delItem", name)
        return item
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


    saveHash.prototype.markFileFindList = function () {
        ww.markFileFindList("", this._data, this._time)
    }


    /**数据 */
    ww._data = {}
    /**搜索数据 */
    ww._findData = {}


    /**寻找的临时数据 */
    ww._findTempData = {}
    ww._findTempDataUse = 1

    /**位置储存列表 */
    ww._path = []
    ww._pathIndex = -1

    /**搜索内容保存 */
    ww._keywordsList = {}
    ww._keywordsIndex = 0


    /**文件 */
    ww._files = {}
    ww._fileslist = []
    /**是列表 */
    ww._dirFileslist = []
    /**md5码 */
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
            ww._savedata.pushTime(i)
        }
        for (var i in data) {
            if (!ww.canUseLSData(i)) {
                ww._savedata.setTime(i, -1)
            }
        }
        for (var i in ww._filesMd5) {
            if (!ww.canUseLSData(i)) {
                ww._savedata.setTime(i, -1)
            }
        }
        //console.log(ww._savedata._data)
    }



    /**保存数据 */
    ww.LSPushData = function (url, data) {

        var url = ww.delUrlHear(url)
        if (!url) {
            return 0
        }

        if (!ww.canUseLSData(url)) {
            var md5 = ww.getFileMd5(url)
            ww._savedata.pushItem(url, [md5, data])
            ww.timeSaveWait()
        }


    }

    ww.getLSData = function (url) {
        return ww._savedata.getItem(url)
    }


    /**保存 */
    ww.timeSave = function () {
        if (ww._savedata._must) {
            ww._savedata._must = 0
            console.log("savedate")
            var v = ww.LSSaveData()
        }
    }
    /**延时保存 */
    ww.timeSaveWait = function () {
        if (ww._timeSaveVar !== undefined) {
            clearTimeout(ww._timeSaveVar)
        }
        ww._timeSaveVar = setTimeout(ww.timeSave, 1000)
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
        return url
        /*
        var url = url || ""
        if (url.indexOf("./") == 0) {
            return url
        } else {
            return "./" + url
        }
        */
    }

    ww.delUrlHear = function (url) {
        return url
        /*
        var url = url || ""
        if (url.indexOf("./") == 0) {
            url = url.slice(2)
        }
        return url
        */
    }

    ww.canUseLSData = function (url) {
        var url = ww.delUrlHear(url)
        var save = ww._savedata.getItem(url)
        if (Array.isArray(save)) {
            var md5 = ww.getFileMd5(url)
            if (md5 && save[0] == md5) {
                return save
            }
        }
        return 0
    }

    ww.haveUseLSData = function (url) {
        var url = ww.delUrlHear(url)
        var save = ww._savedata.getItem(url)
        return save
    }


    /**
    * 获取
    * @param {*} url 链接
    * @param {*} type 种类
    * @param {*} loaded 当获得
    * @param {*} temp 临时 
    */
    ww.get = function (url, type, loaded, temp) {
        if (ww._data[url] || ww._findData[url]) {
            if (typeof loaded == "function") {

                //console.log("have", url)
                loaded(ww._data[url] || ww._findData[url])
            } else {
                console.log(ww._data[url] || ww._findData[url])
            }
            if (!temp) {
                //ww.LSPushData(url, ww._data[url] || ww._findData[url])
            }
            return
        }
        if (!temp) {
            var save = this.getLSData(url)
            if (save) {
                //console.log("have save", url)
                if (typeof loaded == "function") {
                    loaded(save[1])
                } else {
                    console.log(save[1])
                }
                return
            }
        }

        if (temp != 2) {
            if (ww.isUrlDir(url)) {
                console.log(url, "无数据")
                var t = ww.markDirMd(url)
                if (typeof loaded == "function") {
                    loaded(t)
                } else {
                    console.log(t)
                }
                return
            }
            if (!ww.getFileMd5(url)) {
                console.log(url, "无数据")
                if (typeof loaded == "function") {
                    loaded("# 无数据")
                } else {
                    console.log("# 无数据")
                }
                return
            }
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = (typeof (type) == "string") ? type : "arraybuffer"
        xhr.onloadend = function () {
            //console.log("get", url)
            var response = xhr.response || ""
            if (temp) {
                if (temp == 2) {
                    ww._data[url] = response
                } else {
                    ww._findData[url] = response
                }
            } else {
                ww._data[url] = response
            }
            if (typeof loaded == "function") {
                loaded(response, xhr)
            } else {
                console.log(response, xhr)
            }
            if (!temp) {
                ww.LSPushData(url, response)
            }
        };
        xhr.send()
        return xhr
    }


    /**获得文件大小 */
    ww.getFileBig = function (url) {
        var url = ww.delUrlHear(url)
        if (ww._data[url] || ww._findData[url]) {
            return 0
        }
        var save = ww.canUseLSData(url)
        if (save) {
            return 0
        }

        var data = ww.getFileMd5(url)
        if (data) {
            var n = data.split(",").pop() * 1
            if (typeof n == "number") {
                return n
            }
        }
        return 0
    }


    ww.isUrlFile = function (url) {
        var md5 = ww.getFileMd5(url)
        return md5
    }

    ww.isUrlDir = function (url) {
        var md5 = ww.getFileMd5(url)
        return md5 === 0
    }

    ww.getFileMd5 = function (url) {
        var url = ww.delUrlHear(url)
        return ww._filesMd5[url]
    }

    ww.markDirMd = function (url) {
        var ul = url.split("/")
        var t = "# 文件夹\n"
        return t
        /*
        var l = ww.markFileFindList(url)

        for (var i = 0; i < l.length; i++) {
            var n = l[i]
            t += n.slice(ul) + "  \n"
        }
        */
    }



    /**制作文件列表 */
    ww.markFileList = function (files, list, obj, obj2, obj3) {
        var files = files || ww._files
        var list = list || []
        var obj = obj || []
        var obj2 = obj2 || []
        var obj3 = obj3 || {}

        var path = list.join("/")
        if (typeof files == "object") {
            obj3[path] = 0
            for (var i in files) {
                list.push(i)
                obj2.push(list.join("/"))
                list.pop()
            }
            for (var i in files) {
                list.push(i)
                ww.markFileList(files[i], list, obj, obj2, obj3)
                list.pop()
            }
        } else if (files) {
            obj.push(path)
            obj3[path] = files
        }
        return [obj, obj2, obj3]
    }


    /**生成查找文件表 */
    ww.markFileFindList = function (data, files, obj) {
        var files = files || this._fileslist
        var list = []
        if (Array.isArray(files)) {
            for (var i = 0; i < files.length; i++) {
                var name = files[i]
                if (!data || name.indexOf(data) == 0) {
                    list.push(name)
                }
            }
        } else if (typeof files == "object") {
            for (var i in files) {
                var name = i
                if (!data || name.indexOf(data) == 0) {
                    list.push(name)
                }
            }
        }
        if (obj) {
            list.sort(function (a, b) {
                return obj[b] - obj[a]
            })
        }
        return list
    }

    ww.markObjectList = function (obj) {
        return Object.getOwnPropertyNames(obj)
    }

    /**搜索 */
    ww.search = function (keywords, url) {
        if (keywords) {

            ww._keywordsList[keywords] = ww._keywordsIndex++



            if (url == this.nowPath()) {
                if (ww.isUrlDir(url)) {
                    ww.findOnPath(keywords, url ? url + "/" : url)
                } else {
                    ww.findOnMarked(keywords)
                }
            } else {
                if (ww.isUrlFile(url)) {
                    ww.findOnFile(keywords, url)
                } else {
                    ww.findOnPath(keywords, url)
                }
            }
        } else {
            ww.clearFind()
            ww.scrollTo(0, 0)
        }
    }

    ww._findObj = {}

    ww.findOnMarked = function (keywords, node) {
        var node = node || ww.ele.markeddiv

        ww.highlighter.search(node, keywords)

        var index = ww.highlighter.index()
        var result = ww.highlighter.result()

        var all = result.length

        ww.ele.findPosOpen(index, all)
        ww.ele.findButton.value = all < 10 ? "  " + all : all < 100 ? " " + all : all



        //ww.highlighter.searchResult()

    }

    ww.findOnFile = function (keywords, url) {
        ww._mustFind = [keywords, url]
        ww.push(url)
    }

    /**寻找文件在位置 */
    ww.findOnPath = function (keywords, url) {

        /**搜索中 不继续 */
        /*if (ww._findIndex > 0) {
            return
        }*/
        /**没有词语时不进行 */
        if (!keywords && keywords !== 0) {
            return
        }


        var url = ww.delUrlHear(url)

        // //
        //ww._findText = "./find/" + url + "&" + keywords + ".md"
        ww._findText = "find/" + url + "&" + keywords + ".md"

        if (ww._findData[ww._findText]) {
            ww.push(ww._findText)
            ww.search(keywords, ww._findText)
            return
        }


        var find = ww.markfind(keywords)


        var list = ww.markFileFindList(url)


        //ww.ele.pathInput.value = ww._findText
        //ww.baseUrl = "./Find.md" 
        if (list.length) {
            var list = ww.setFindFiles(list)
            if (!list) {
                ww._findAll = ww._findIndex = ww._findNumber = 0
                return
            }

            if (ww._findData[ww._findText]) {
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
                        findall: list.length,
                        keywords: keywords
                    }
                    ww._findObj[ww._findText] = obj

                    obj.hear = ww.markfindHear(url, keywords)
                    ww._findData[ww._findText] = obj.hear + "\n# 搜索中\n" +
                        "\n>需要搜索" + list.length + "个文件\n"
                    ww.push(ww._findText)
                    for (var i = 0; i < list.length; i++) {
                        var n = list[i]
                        //ww.getfind("./" + n, find, keywords, obj)
                        ww.getfind(n, find, keywords, obj)
                    }
                }
                return
            }
        }

        /**当没有搜索内容时 */


        ww._findData[ww._findText] = ww.markfindData(ww.markfindHear(url, keywords), 0, 0)


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



        var tn = n + "&" + keywords
        ww.get(n, "text", function (re) {

            /*if (!ww._findTempDataUse) {
                var r = find(re || "") 
            } else {*/
            var r = ww._findTempData[tn]
            if (r === undefined) {
                r = find(re || "")
                ww._findTempData[tn] = r
            }
            //}

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
                //"(" + (n).replace(/ /g, "%20") + ")\n"
                var showpath = "> " + path + "  \n"
                var showre = "\n```\n" + r + "\n```\n"

                obj.datafiles.push(n)
                obj.data.push(showlink + showpath + showre)

            }

            if (obj.files.length >= obj.findall) {

                ww._findData[obj.findText] = ww.markfindData(obj.hear, obj.findall, obj.data)
                if (ww.nowPath() == obj.findText) {
                    ww.open(obj.findText)
                    ww.search(keywords, obj.findText)
                }
                //ww.showmarked(ww._findText)
            }
        })
    }


    ww.markfindHear = function (url, keywords) {

        var showhear = "# 搜索\n"
        var showpath = "\n>搜索位置:" + url + "  "
        var showtext = "\n>搜索内容:" + keywords + "  \n"

        var t = showhear + showpath + showtext
        return t

    }

    ww.markfindData = function (hear, all, data) {


        var showdata = "" //"\n---\n"
        var showend = "\n# 搜索结束"
        var showall = "\n\n>搜索 " + all + " 个文件  "
        var shownum = "\n>找到 " + (data ? data.length : 0) + " 个文件\n"
        var hear = hear
        var s = Array.isArray(data) ? (showall + shownum + showdata) : showdata
        var c = Array.isArray(data) ? data.join("") : ""
        var end = showdata + showend + showall + shownum

        var t = hear + s + c + end
        return t

    }

    /**生成寻找方法 */
    ww.markfind = function (keywords) {
        var re = ww.parsewords(keywords)
        if (re && Array.isArray(re.words) && re.words.length) {
            var words = re.words
            return function (text) {
                if (text) {
                    var r = Infinity
                    for (var i = 0; i < words.length; i++) {
                        var set = words[i]
                        if (!set || !set.rex) { continue }
                        var rex = set.rex
                        var index = text.search(rex)
                        if (index >= 0) {
                            r = r < index ? r : index
                        } else {
                            if (!set.type) {
                                r = Infinity
                                break
                            }
                        }
                    }
                    if (r != Infinity) {

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
        return ww.highlighter.parsewords(keywords)
    }






    /*
    ww.markPathMd = {}
    ww.markPathMd.markH = function (h) {
        var h = h || 0
        var hear = ""
        if (h > 0 && h < 6) {
            for (var i = 0; i < h; i++) {
                hear += "#"
            }
            hear += " "
        }
        return hear
    }

    ww.markPathMd.getFileList = function (obj, path, name, h, list) {
        var list = list || []

        var hear = localFile.markH(h) + name + "\n"
        list.push(hear)
        if (path == "./日记") {
            localFile.getFileListRj(obj, path, name, h, list)

            return list.join("")
        }

        for (var i in obj) {
            if (typeof obj[i] == "object") {
                localFile.getFileList(obj[i], path + "/" + i, i, h + 1, list)
            } else {
                var p = (path + "/" + i).replace(/ /g, "%20")
                var t = "" +
                    "[" + i.slice(0, i.length - 3) + "]" +
                    "(" + p + ")  \n"
                list.push(t) 
            }
        }
        return list.join("")
    }*/





})();

/**网页方法 */
(function () {

    /**打开网页 */
    ww.open = function (value) {
        var value = ww.stringtrim(value)
        console.log(value)
        ww.setPathInputValue(value)
        // if (value.indexOf("./find/") == 0) {
        if (value.indexOf("find/") == 0) {
            ww.baseUrl = "find.md"
        } else {
            ww.baseUrl = value
        }
        var hash = value.split("#")[1]

        ww.get(value, "text",
            function (re) {
                ww.showmarked(re)
                ww.findOnOpen()

                if (hash) {
                    //window.location.hash = "#" + hash
                }
            })
    }



    /*---------------------------------------
     * 清除字符串两端空格，包含换行符、制表符
     *---------------------------------------*/
    ww.stringtrim = function (t) {
        return (t || "").replace(/(^[\s]+|[\s]+$)/g, "");
        //return (t || "").replace(/(^[\s\n\t]+|[\s\n\t]+$)/g, "");
    }

    /*----------------------------------------
     * 清除字符串左侧空格，包含换行符、制表符
     * ---------------------------------------*/
    ww.stringtriml = function () {
        return (t || "").replace(/^[\s]+/g, "");
        //return t.replace(/^[\s\n\t]+/g, "");
    }
    /*----------------------------------------
     * 清除字符串右侧空格，包含换行符、制表符
     *----------------------------------------*/
    ww.stringtrimr = function (t) {
        return (t || "").replace(/[\s]+$/g, "");
        //return t.replace(/[\s\n\t]+$/g, "");
    }

    ww.getInputValue = function (dom) {
        if (dom) {
            return ww.stringtrim(dom.value)
        }
        return ""
    }

    /**显示 marked 结果 */
    ww.showmarked = function (text) {
        var text = text || ""
        var md = ww.marked(text)
        ww.ele.markeddiv.innerHTML = md
        ww.clearFind()
        ww.scrollTo(0, 0)
    }


    /**清除搜索结果 */
    ww.clearFind = function () {
        ww.highlighter.clear()

        ww.ele.findButton.value = "搜索"
        ww.ele.findPosClose()
        //ww.ele.findButton.value = "搜索"
    }

    /**显示 marked 结果  跳到最后 */
    ww.showmarked2 = function (text) {
        var text = text || ""
        var md = ww.marked(text)
        ww.ele.markeddiv.innerHTML = md
        ww.clearFind()
        ww.scrollToEnd()
    }

    /**当前位置 */
    ww.nowPath = function () {
        return ww.getPath(ww._pathIndex)
    }


    ww.getPath = function (index) {
        //return ww._path[index] || "./README.md"
        return ww._path[index] || "README.md"
    }

    /**添加地址 */
    ww.push = function (url) {

        var path = ww.nowPath()
        if (url == path) {
            if (ww.findOnOpen()) {
                return
            }
            ww.setPathInputValue(url)
            ww.clearFind()
            ww.scrollTo(0, 0)
            return
        }
        ww._path.length = Math.max(0, ww._pathIndex + 1)
        ww._path.push(url)
        ww._pathIndex = ww._path.length - 1
        //console.log(ww._path, ww._pathIndex)
        ww.open(url)
    }


    /**
     * 寻找当打开时
     * 有 返回 1
     * 没有 返回 0
     */
    ww.findOnOpen = function (path) {
        var path = path || ww.nowPath()
        var find = this._mustFind
        if (find) {
            this._mustFind = 0
            if (find[1] == path) {
                ww.findOnMarked(find[0])

                return 1
            }
        }
        return 0
    }


    //滚动到
    ww.scrollTo = function (x, y, node) {
        var node = node || ww.ele.maindiv
        node.scrollLeft = x
        node.scrollTop = y
    }

    /**滚动到头部 */
    ww.scrollToTop = function (node) {
        ww.scrollTo(0, 0, node)
    }

    /**滚动到尾部 */
    ww.scrollToEnd = function (node) {
        var node = node || ww.ele.maindiv
        ww.scrollTo(0, node.scrollHeight, node)
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
        //var p = "./README.md"
        var p = "README.md"
        var path = ww.getPathInputValue()
        ww.push(p)
        if (path == p) {
            ww.setPathInputValue("")
        } else {
            ww.setPathInputValue(p)
        }
    }

    ww.openHome = function () {
        //var p = "./README.md"
        var p = "README.md"
        ww.open(p)
        ww.ele.pathInput.value = ""
    }

    ww.toPath = function () {
        var v = ww.getInputValue(ww.ele.pathInput)
        if (v) {
            ww.ele.pathInput.value = v
            ww.push(ww.addUrlHear(v))
        } else {
            ww.toHome()
        }
    }

    ww.setPathInputValue = function (data) {
        ww.ele.pathInput.value = ww.delUrlHear(data)
    }

    ww.getPathInputValue = function () {
        var data = ww.getInputValue(ww.ele.pathInput)
        return ww.addUrlHear(data)
    }
})();



/**创建元素 */
(function () {

    ww.ele = {}
    /**设置打开 */
    ww.setOpen = function () {
    }

    ww.ele.maindivTopChange = function () {
        ww.ele.maindiv.style.top = ww.ele.top.offsetHeight + "px"
    }

    ww.createElement = function (type, obj, style) {
        var ele = document.createElement(type)
        ww.setElement(ele, obj)
        ww.setElementStyle(ele, style)
        return ele
    }

    ww.setElement = function (ele, obj) {
        if (typeof ele == "object" && typeof obj == "object") {
            for (var i in obj) {
                ele[i] = obj[i]
            }
        }
        return ele
    }
    ww.setElementStyle = function (ele, style) {

        if (typeof ele == "object" && typeof style == "object") {
            for (var i in style) {
                ele.style[i] = style[i]
            }
        }
        return ele
    }
    ww.appendChild = function (ele, body) {
        var body = body || document.body
        return body.appendChild(ele);
    }


    /**css添加 */
    ww.creatcss = function () {
        ww.css = document.createElement("link");
        ww.css.setAttribute("rel", "stylesheet");
        ww.css.setAttribute("type", "text/css");
        //ww.css.setAttribute("href", "./js/github.css");
        ww.css.setAttribute("href", "js/github.css");
        ww.appendChild(ww.css, document.body);
    }

    /**主要显示 */
    ww.creatmaindiv = function () {
        ww.ele.maindiv = document.createElement("div")
        ww.ele.maindiv.style = "width:100%; height:auto; position:absolute;  box-sizing:border-box; overflow-y:scroll; left:0; bottom: 0;"
        ww.appendChild(ww.ele.maindiv, document.body);
    }


    /**md浏览用的位置 */
    ww.creatmarkeddiv = function () {
        ww.ele.markeddiv = document.createElement("div")
        ww.ele.markeddiv.className = "markdown-body"
        ww.appendChild(ww.ele.markeddiv, ww.ele.maindiv);
    }





    /**头部工具栏 */
    ww.creattop = function () {
        ww.ele.top = document.createElement("div")
        ww.ele.top.style = "left:auto; top: 0; width:auto; position:absolute;box-sizing:border-box; "//height:10%;   overflow-y:scroll; "//"position:absolute;top: 0;box-sizing:border-box; width:100%;height:auto;overflow-y:scroll;" 
        ww.appendChild(ww.ele.top, document.body);

    }

    /**头部工具栏1 */
    ww.creattop1 = function () {
        ww.ele.top1 = document.createElement("div")
        ww.appendChild(ww.ele.top1, ww.ele.top);
    }




    /**头部工具栏2 */
    ww.creattop2 = function () {
        ww.ele.top2 = document.createElement("div")
        ww.appendChild(ww.ele.top2, ww.ele.top);
    }



    /**位置输入  添加到 top1*/
    ww.creatpathInput = function () {
        ww.ele.pathInput = document.createElement("input")
        ww.ele.pathInput.placeholder = "全部文件"
        ww.ele.pathInput.type = "text"
        ww.appendChild(ww.ele.pathInput, ww.ele.top1);


    }



    /**地址选项 */

    ww.creatpathSelect = function () {
        ww.ele.pathSelect = document.createElement("select")

        ww.ele.pathSelect.style.position = "absolute"
        //ww.ele.pathSelect.size = 1
        ww.ele.pathSelect.style.visibility = "hidden"
        //ww.ele.pathSelect.style = "left:auto; top: 0; width:auto; position:absolute; ; "
        ww.appendChild(ww.ele.pathSelect, ww.ele.top1);

        ww.ele.pathInput.onfocus = function () {
            ww.ele.pathSelectOpen()
        }
        ww.ele.pathInput.onpropertychange = function () {
            ww.ele.pathSelectOpen()
        }

        ww.ele.pathInput.oninput = function () {
            ww.ele.pathSelectOpen()
        }
        //改变
        ww.ele.pathInput.onchange = function () {
            ww.ele.pathSelectOpen()
        }




        //失去焦点
        ww.ele.pathInput.onblur = function () {
            ww.ele.pathSelect._close = true
            setTimeout(ww.ele.pathSelectClose, 10)
        }


        //失去焦点
        ww.ele.pathSelect.onblur = function () {
            ww.ele.pathSelect._close = true
            setTimeout(ww.ele.pathSelectClose, 10)
        }

        //获得焦点 
        ww.ele.pathSelect.onfocus = function () {
            ww.ele.pathSelect._close = false
        }

        /* ww.ele.pathSelect.onchange = function () {
            
 
         } */

        /*ww.ele.pathSelect.onclick = function () {
            ww.ele.pathInput.value = ww.ele.pathSelect.value
            ww.ele.pathSelect.style.visibility = "hidden"
            console.log("click", ww.ele.pathSelect.selectedIndex)
        }*/
        ww.ele.pathSelect.onchange = function () {
            //console.log(ww.ele.pathSelect.value)
            ww.ele.pathInput.value = ww.ele.pathSelect.value
            ww.ele.pathSelectOpen()
            //ww.ele.pathSelect.style.visibility = "hidden"
            // console.log("click", ww.ele.pathSelect.selectedIndex)
        }

    }


    ww.ele.pathSelectClose = function () {
        if (ww.ele.pathSelect._close) {
            ww.ele.pathSelect._close = false
            ww.ele.pathSelect.style.visibility = "hidden"
        }
    }

    ww.ele.pathSelectOpen = function () {

        var pI = ww.ele.pathInput
        var pS = ww.ele.pathSelect

        var value = pI.value


        var nl = value.length

        if (ww._lastPathSelect == value && ww._lastPathSelectList) {
            var list = ww._lastPathSelectList
        } else {
            var l1 = ww.markFileFindList(value, ww._dirFileslist)
            var l2 = ww.markFileFindList(value, ww._findData)

            var list = l1.concat(l2)
            if (list.indexOf(value) != 0) {
                list.unshift(value)
            }

            pS.options.length = Math.min(list.length, pS.options.length)

            for (var i = pS.options.length; i < list.length; i++) {
                var o = document.createElement("option");
                o.text = "";
                o.value = ""
                try { pS.add(o); } catch (ex) { pS.add(o, null); }
            }
            for (var i = 0; i < list.length; i++) {
                var n = list[i]
                var o = pS.options[i]
                if (o) {
                    o.value = n
                    o.text = i == 0 ? value == "" ? "全部文件" : n : n.slice(nl)
                }
            }
            pS.selectedIndex = 0;
            ww._lastPathSelectList = list
            ww._lastPathSelect = value

        }

        //pS.size = 1 //list.length <2?2:  list.length
        pS._close = false
        pS.style.visibility = list.length == 1 ? "hidden" : "visible"

        pS.style.top = pI.offsetTop + pI.offsetHeight + "px"
        pS.style.left = pI.offsetLeft + "px"
        pS.style.width = pI.offsetWidth + "px"
        /*pS.style.height = Math.min(
            window.innerHeight * 0.5,
            pI.offsetHeight *  Math.min(list.length, 5) 
        ) + "px"*/

    }



    /**上一个 */
    ww.creatlastButton = function () {
        ww.ele.lastButton = document.createElement("input")
        ww.ele.lastButton.type = "button"
        ww.ele.lastButton.value = "<"
        ww.ele.lastButton.onclick = function () {
            ww.toLast()
        }
        ww.appendChild(ww.ele.lastButton, ww.ele.top1);
    }




    /**主页 */
    ww.creathomeButton = function () {
        ww.ele.homeButton = document.createElement("input")
        ww.ele.homeButton.type = "button"
        ww.ele.homeButton.value = "合"
        ww.ele.homeButton.onclick = function () {
            ww.toHome()
        }
        ww.appendChild(ww.ele.homeButton, ww.ele.top1);

    }



    /**下一个 */
    ww.creatnextButton = function () {
        ww.ele.nextButton = document.createElement("input")
        ww.ele.nextButton.type = "button"
        ww.ele.nextButton.value = ">"
        ww.ele.nextButton.onclick = function () {
            ww.toNext()
        }
        ww.appendChild(ww.ele.nextButton, ww.ele.top1);
    }





    /**设置打开按键 */
    ww.creatsetButton = function () {
        ww.ele.setButton = document.createElement("input")
        ww.ele.setButton.type = "button"
        ww.ele.setButton.value = "*"
        ww.ele.setButton.onclick = function () {
            ww.setOpen()
        }
        ww.appendChild(ww.ele.setButton, ww.ele.top1);
    }







    /**寻找输入 */
    ww.creatfindInput = function () {
        ww.ele.findInput = document.createElement("input")
        ww.ele.findInput.type = "text"
        ww.ele.findInput.value = ""
        ww.appendChild(ww.ele.findInput, ww.ele.top2);
    }

    /**寻找按钮 */

    ww.creatfindButton = function () {
        ww.ele.findButton = document.createElement("input")
        ww.ele.findButton.type = "button"
        ww.ele.findButton.value = "搜索"
        ww.ele.findButton.onclick = function () {
            ww.search(ww.ele.findInput.value, ww.getPathInputValue())
        }
        ww.appendChild(ww.ele.findButton, ww.ele.top2);

    }


    /**搜索选项 */




    ww.creatfindSelect = function () {
        ww.ele.findSelect = document.createElement("select")
        ww.ele.findInput.placeholder = "请输入搜索内容"

        ww.ele.findSelect.style.position = "absolute"
        //ww.ele.findSelect.size = 1
        ww.ele.findSelect.style.visibility = "hidden"
        //ww.ele.findSelect.style = "left:auto; top: 0; width:auto; position:absolute; ; "
        ww.appendChild(ww.ele.findSelect, ww.ele.top2);

        ww.ele.findInput.onfocus = function () {
            ww.ele.findSelectOpen()
        }
        ww.ele.findInput.onpropertychange = function () {
            ww.ele.findSelectOpen()
        }

        ww.ele.findInput.oninput = function () {
            ww.ele.findSelectOpen()
        }
        //改变
        ww.ele.findInput.onchange = function () {
            ww.ele.findSelectOpen()
        }




        //失去焦点
        ww.ele.findInput.onblur = function () {
            ww.ele.findSelect._close = true
            setTimeout(ww.ele.findSelectClose, 10, "inputblur")
        }


        //失去焦点
        ww.ele.findSelect.onblur = function () {
            ww.ele.findSelect._close = true
            setTimeout(ww.ele.findSelectClose, 10, "onblur")
        }

        //获得焦点 
        ww.ele.findSelect.onfocus = function () {
            ww.ele.findSelect._close = false
        }

        /* ww.ele.findSelect.onchange = function () {
            
 
         } */

        /*ww.ele.findSelect.onclick = function () {
            ww.ele.findInput.value = ww.ele.findSelect.value
            ww.ele.findSelect.style.visibility = "hidden"
            console.log("click", ww.ele.findSelect.selectedIndex)
        }*/

        ww.ele.findSelect.onchange = function () {
            ww.ele.findInput.value = ww.ele.findSelect.value
            //ww.ele.findSelect.style.visibility = "hidden"
            //console.log("click", ww.ele.findSelect.selectedIndex)
        }
    }

    ww.ele.findSelectClose = function () {
        if (ww.ele.findSelect._close) {
            ww.ele.findSelect._close = false
            ww.ele.findSelect.style.visibility = "hidden"

            var pI = ww.ele.findInput
            var value = pI.value
            if (value && value == ww.highlighter.keywords()) {
                var index = ww.highlighter.index()
                var result = ww.highlighter.result()
                var all = result.length
                ww.ele.findButton.value = all < 10 ? "  " + all : all < 100 ? " " + all : all

                ww.ele.findPosOpen(index, all)
            } else {
                ww.ele.findPosClose()
                ww.ele.findButton.value = "搜索"
            }

        }
    }




    ww.ele.findSelectOpen = function () {
        var pI = ww.ele.findInput
        var pS = ww.ele.findSelect

        var value = pI.value


        if (value && value == ww.highlighter.keywords()) {
            var index = ww.highlighter.index()
            var result = ww.highlighter.result()
            var all = result.length
            ww.ele.findButton.value = all < 10 ? "  " + all : all < 100 ? " " + all : all
            ww.ele.findPosClose()
        } else {
            ww.ele.findPosClose()
            ww.ele.findButton.value = "搜索"
        }


        var nl = value.length

        if (ww.ele._lastfindSelect == value && ww.ele._lastfindSelectList) {
            var list = ww.ele._lastfindSelectList
        } else {
            var list = ww.markFileFindList(value, ww._keywordsList, ww._keywordsList)
            if (list.indexOf(value) != 0) {
                list.unshift(value)
            }

            pS.options.length = Math.min(list.length, pS.options.length)

            for (var i = pS.options.length; i < list.length; i++) {
                var o = document.createElement("option");
                o.text = "";
                o.value = ""
                try { pS.add(o); } catch (ex) { pS.add(o, null); }
            }
            for (var i = 0; i < list.length; i++) {
                var n = list[i]
                var o = pS.options[i]
                if (o) {
                    o.value = n
                    o.text = (i == 0 && value == "") ? "请输入搜索内容" : n //.slice(nl)
                }
            }
            pS.selectedIndex = 0;
            ww.ele._lastfindSelectList = list
            ww.ele._lastfindSelect = value

        }

        //pS.size = 1 //list.length <2?2:  list.length 
        pS._close = false
        pS.style.visibility = list.length == 1 ? "hidden" : "visible"
        pS.style.top = pI.offsetTop + pI.offsetHeight + "px"
        pS.style.left = pI.offsetLeft + "px"
        pS.style.width = pI.offsetWidth + "px"
        /*pS.style.height = Math.min(
            window.innerHeight * 0.5,
            pI.offsetHeight * Math.max(2, Math.min(list.length, 5))
        ) + "px"*/

    }



    ww.creatfindPos = function () {
        ww.ele.findPos = document.createElement("input")
        ww.ele.findPos.type = "number"
        ww.ele.findPos.min = 0
        ww.ele.findPos.max = 0
        ww.ele.findPos.step = 1

        ww.ele.findPos.style.position = "absolute"
        ww.ele.findPos.style.visibility = "hidden"
        ww.appendChild(ww.ele.findPos, ww.ele.top2);


        ww.ele.findPos2 = document.createElement("input")
        ww.ele.findPos2.type = "range"
        ww.ele.findPos2.min = 0
        ww.ele.findPos2.max = 0
        ww.ele.findPos2.step = 1


        ww.ele.findPos2.style.position = "absolute"
        ww.ele.findPos2.style.visibility = "hidden"
        ww.appendChild(ww.ele.findPos2, ww.ele.top2);

        ww.ele.findPos.onchange = function () {
            ww.ele.findPosTo(ww.ele.findPos.value)
        }

        ww.ele.findPos2.onchange = function () {
            ww.ele.findPosTo(ww.ele.findPos2.value)
        }

        var pI = ww.ele.findInput
        var width = pI.offsetWidth * 0.5
        var top = pI.offsetTop + pI.offsetHeight

        var pS = ww.ele.findPos
        pS.style.top = pI.offsetTop + "px"
        pS.style.left = pI.offsetLeft + width + "px"
        pS.style.width = width + "px"

        var pS = ww.ele.findPos2
        pS.style.top = top + "px"
        pS.style.left = pI.offsetLeft + "px"
        pS.style.width = pI.offsetWidth + "px"
    }

    ww.ele.findPosTo = function (value) {
        var value = value * 1
        ww.ele.findPos.value = value
        ww.ele.findPos2.value = value
        ww.highlighter.searchIndex(value)
    }

    ww.ele.findPosOpen = function (value, all) {
        if (!all) {
            ww.ele.findPosClose()
            return
        }
        var pI = ww.ele.findInput


        var width = pI.offsetWidth * 0.3
        var top = pI.offsetTop + pI.offsetHeight

        var pS = ww.ele.findPos
        pS.style.top = pI.offsetTop + "px"
        pS.style.left = pI.offsetLeft + pI.offsetWidth - width + "px"
        pS.style.width = width + "px"
        pS.style.visibility = "visible"

        pS.value = value
        pS.max = all

        var pS = ww.ele.findPos2
        pS.style.top = pI.offsetTop + pI.offsetHeight + "px"
        pS.style.left = pI.offsetLeft + "px"
        pS.style.width = pI.offsetWidth + "px"
        pS.style.visibility = "visible"
        pS.value = value
        pS.max = all


    }


    ww.ele.findPosClose = function () {
        var pS = ww.ele.findPos
        pS.style.visibility = "hidden"
        var pS = ww.ele.findPos2
        pS.style.visibility = "hidden"
    }




    /**刷新按钮 */
    ww.creatopenButton = function () {
        ww.openButton = document.createElement("input")
        ww.openButton.type = "button"
        ww.openButton.value = "刷新"
        ww.openButton.onclick = function () {
            ww.toPath()
        }
        ww.appendChild(ww.openButton, ww.ele.top2);
    }






    ww.creat = function () {




        ww.creatcss()
        ww.creatmaindiv()
        ww.creatmarkeddiv()
        ww.creattop()
        ww.creattop1()
        ww.creattop2()
        ww.creatpathInput()


        ww.creatlastButton()
        ww.creathomeButton()
        ww.creatnextButton()
        ww.creatsetButton()
        ww.creatfindInput()
        ww.creatfindButton()
        ww.creatopenButton()


        /**位置选择器 */
        ww.creatpathSelect()
        /**搜索选择器 */

        ww.creatfindSelect()
        ww.creatfindPos()






        /**css选择器 */
        //ww.markcssSelect()




        ww.ele.maindivTopChange()
        /**绑定高 */
        window.onresize = function () {
            ww.ele.maindivTopChange()
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
 
        //ww.ele.top1.appendChild(ww.cssSelect);
 
    } 
    */

})();




/**高亮寻找 */
(function () {

    /** 
     * 高亮显示关键字, 构造函数   
     */
    function Highlighter() {
        this._node = null
        this._keywords = ""
        this._searchIndex = 0
        this._results = []

        this._colors = [
            'rgba(255,0,0,0.5);#000000;#ffff00;#000000',
            '#68bbb5;#000000;#ffff00;#000000',
            '#7983ab;#000000;#ffff00;#000000',
            '#dae9d1;#000000;#ffff00;#000000',
            '#eabcf4;#000000;#ffff00;#000000',
            '#c8e5ef;#000000;#ffff00;#000000',
            '#f3e3cb;#000000;#ffff00;#000000',
            '#e7cfe0;#000000;#ffff00;#000000',
            '#c5d1f1;#000000;#ffff00;#000000',
            '#deeee4;#000000;#ffff00;#000000',
            '#b55ed2;#000000;#ffff00;#000000',
            '#dcb7a0;#333333;#ffff00;#000000',
            '#ffff00;#000000;#ffff00;#000000',
        ];

        this._colorsType = {}
        this.colorSet("", this._colors)

        this._colorsHash = {}
    }


    Highlighter.prototype.colorSet = function (name, colors) {
        if (Array.isArray(colors)) {
            var arr = colors
        } else {
            try {
                var arr = JSON.parse(colors)
            } catch (error) {
                var arr = [colors]
            }
        }
        this._colorsType[name] = arr
    }

    Highlighter.prototype.colorGet = function (name) {
        if (Array.isArray(this._colorsType[name]) && this._colorsType[name] > 0) {
            return this._colorsType[name]
        } else {
            return this._colors
        }

    }


    Highlighter.prototype.clear = function (node, keywords) {
        this._node = node || null
        this._keywords = keywords || ""
        this._searchIndex = 0
        this._words = null
        this._notnode = false
        this._colorName = ""
        this.dehighlight()
    }


    /**当前搜索索引 */
    Highlighter.prototype.index = function () {
        return this._searchIndex
    }

    /**当前搜索结果 */
    Highlighter.prototype.result = function () {
        return this._results
    }

    /**当前搜索键 */
    Highlighter.prototype.keywords = function () {
        return this._keywords
    }

    /**当前搜索键 */
    Highlighter.prototype.words = function () {
        return this._words
    }


    Highlighter.prototype.search = function (node, keywords, index) {

        if (this._keywords == keywords && this._node == node) {
            if (index === undefined) {
                index = this._searchIndex + 1
            }

            this.searchIndex(index)

        } else {

            this.clear(node, keywords)
            this.highlight(node, keywords)
            this.searchStart()
        }
        return this._results

    }


    Highlighter.prototype.dehighlight = function () {
        this._results = this._results || []
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
    Highlighter.prototype.searchNext = function () {

        var index = this._searchIndex + 1
        this.searchIndex(index)
    }


    Highlighter.prototype.searchStart = function () {
        this.searchIndex(0)
    }

    /**寻找索引 */
    Highlighter.prototype.searchIndex = function (i) {
        if (this._lastFind) {
            this.changeforkNode(0)
            this._lastFind = null
        }

        i = i || 0
        if (i <= 0 || i >= this._results.length) {
            i = 0
        }
        this._searchIndex = i

        var result = this._results[i]

        if (result) {
            this._lastFind = result

            this.changeforkNode(1)

            var data = result[0]
            var node = result[1]
            var childNode = result[2]
            var forkNode = result[3]
            var keyword = result[4]


            var h = (window.innerHeight || 0) * 0.1
            ww.scrollTo(0, forkNode.offsetTop - h)
        }
    }


    Highlighter.prototype.changeforkNode = function (type) {
        if (this._lastFind) {
            console.log(type)
            result = this._lastFind
            var data = result[0]
            var node = result[1]
            var childNode = result[2]
            var forkNode = result[3]
            var word = result[4]
            var ki = result[5]
            var notnode = result[6]
            var colorName = result[7]
            var colortype = result[8]
            var l = result[9]

            var words = this._words

            var length = words ? words.length : 0;
            var push = 0
            var type = type

 
            this.colorNodeText(0, forkNode, childNode, words, length, push, notnode, colorName, type)

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
            var re = null
        } else {
            var re = this.parsewords(keywords);
        }
        this.dehighlight()
        if (re) {
            this._notnode = re.n
            this._colorName = re.c
            this._words = re.words
        } else {
            this._notnode = 0
            this._colorName = ""
            this._words = null
        }
        if (!this._words) {
            return this._results
        };

        var words = this._words
        var length = words ? words.length : 0;
        var push = 1

        var notnode = this._notnode
        var colorName = this._colorName
        var colortype = 0

        this.colorNode(node, words, length, push, notnode, colorName, colortype);

        console.log(this._results)
        return this._results
    }

    /**  
     * 对所有#text的node进行查找，如果有关键字则进行着色  
     * @param {element} node 节点 
     * @param {[]} words 关键字结构体，包含了关键字、前景色、背景色 
     * @param {number} leng 长度
     * @param {boolean} push 添加
     * @param {number} colortype 种类
     * 
     */
    Highlighter.prototype.colorNode = function (node, words, leng, push, notnode, colorName, colortype) {

        if (notnode) {
            var nt = node.tagName
            var notnt = typeof notnode
            if (notnt == "string") {
                if (nt == notnode) { var notnode = 0 }
            } else if (notnt == "object") {
                if (Array.isArray(notnode)) {
                    if (notnode.indexOf(nt) >= 0) { var notnode = 0 }
                } else {
                    if (nt in notnode) { var notnode = notnode[nt] }
                }
            }
        }
        //var nodesname = (nodesname || "") + node.tagName + ","
        //console.log(nodesname)
        for (var i = 0; i < node.childNodes.length; i++) {
            var childNode = node.childNodes[i];
            if (childNode.nodeType == 3) {
                //childNode is #text    
                if (!notnode) {
                    this.colorNodeText(node, 0, childNode, words, leng, push, notnode, colorName, colortype)
                }
            } else if (childNode.nodeType == 1) {
                //childNode is element  
                this.colorNode(childNode, words, leng, push, notnode, colorName, colortype);
            }
        }
    }

    /**
     * 
     * @param {Element|0} node
     *  
     * 
     */
    Highlighter.prototype.colorNodeText = function (node, forkNode, childNode, words, leng, push, notnode, colorName, colortype) {
        if (forkNode) {
            forkNode.innerHTML = childNode.data
        }
        for (var ki = leng - 1; ki >= 0; ki--) {
            var word = words[ki]
            /*
            //筛选tagname时使用
            if (this._must && nodesname.indexOf(this._must) < 0) {
                continue
            }*/
            var re = word.rex
            if (childNode.data.search(re) == -1) {
                continue
            } else {
                var forkNode = forkNode || document.createElement('span');
                var re = word.rex2
                forkNode.innerHTML = childNode.data.replace(
                    re, this.span(word, colorName, colortype)
                );

                node && node.replaceChild(forkNode, childNode);
                if (push) {
                    //console.log(node, childNode, forkNode, nodesname)
                    this._results.push([childNode.data, node, childNode, forkNode, word, ki, notnode, colorName, colortype, this._results.length])
                } 
                this.colorNode(forkNode, words, ki, 0,  notnode, colorName, colortype)
                break
            }
        }

    }



    Highlighter.prototype.span = function (word, colorName, colortype) {

        var colors = this.colorGet(colorName)

        var cn = colors[word.index % colors.length]
        var cl = this._colorsHash[cn] = this._colorsHash[cn] || (cn || "").split(";")

        var colortype = colortype ? 2 : 0
        console.log(cn,colortype)
        var span = '<span ' +
            'style=' +
            'background-color:' + cl[0 + colortype] +
            ';color:' + cl[1 + colortype] +
            ' mce_style=background-color:' + cl[0 + colortype] +
            ';color:' + cl[1 + colortype] + '>' + '$1' +
            '</span>'

        return span
    }


    Highlighter.prototype.parseNotNode = function (keywords) {
        var c = ""
        var n = ""
        var keywords = keywords || ""
        var rexc = /\@c\{(.*?)\} *$/
        var arr = rexc.exec(keywords);
        if (arr) {
            var l = arr[0].length
            keywords = keywords.slice(0, keywords.length - l)
            c = arr[1]
        }
        var keywords = keywords || ""
        var rexn = /\@n\{(.*?)\} *$/
        var arr = rexn.exec(keywords);
        if (arr) {
            var l = arr[0].length
            keywords = keywords.slice(0, keywords.length - l)
            try {
                n = JSON.parse(arr[1])
            } catch (error) {
                n = arr[1]
            }
        }

        var keywords = keywords || ""
        var arr = rexc.exec(keywords);
        if (arr) {
            var l = arr[0].length
            keywords = keywords.slice(0, keywords.length - l)
            c = arr[1]
        }
        return { k: keywords, c: c, n: n }
    }


    /** 
     * json对象 
     * @param string keywords 
     * @return {} 
     */
    Highlighter.prototype.parsewords = function (keywords) {

        var r = this.parseNotNode(keywords)
        var keywords = r.k
        var c = r.c
        var n = r.n
        var json = ""
        try {
            var json = JSON.parse(keywords)
        } catch (error) {
            var json = keywords
        }

        var type = (typeof json == "object")

        var re = this.parseword(json, type, 0, 0)

        if (re && re.words.length) {
            re.c = c
            re.n = n
            //console.log(re.words)
            return re
        }
        return null;
    }


    /**
     * 
     * 解析词
     * 
     * 
     */
    Highlighter.prototype.parseword = function (keywords, type, father, re) {
        var type = type || 0

        var re = re || { i: 0, words: [], lv: 0 }
        if (keywords === "") {
            return 0
        } else if (keywords) {
            if (typeof keywords == "object") {
                if (Array.isArray(keywords)) {
                    type = type ? 0 : 1
                    re.lv++
                    father++
                    for (var i = 0; i < keywords.length; i++) {
                        this.parseword(keywords[i], type, father, re)
                    }
                    re.lv--
                } else {
                    type = type ? 0 : 1
                    re.lv++
                    father++
                    for (var n in keywords) {
                        this.parseword(n, keywords[n], father, re)
                    }
                    re.lv--
                }
                return re
            }
        }
        var keyword = {};
        keyword.word = "" + keywords;
        keyword.index = re.i++
        keyword.type = type
        keyword.lv = re.lv
        keyword.father = father
        keyword.rex = ww.RegexParser(keyword.word, 'i')
        keyword.rex2 = ww.RegexParser('(' + keyword.word + ')', 'gi')
        re.words.push(keyword);
        return re
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

    ww.highlighter = new Highlighter()


})();

(function () {
    // ww.get("./js/files.json", "text", function (data) {
    ww.get("js/files.json", "text", function (data) {
        var json
        try {
            json = JSON.parse(data)
        } catch (error) {
            json = {}
        }
        ww._files = json

        var re = ww.markFileList()
        /**文件列表 */
        ww._fileslist = re[0]
        /**文件夹+文件列表 */
        ww._dirFileslist = re[1]
        /**md5码 文件夹为0*/
        ww._filesMd5 = re[2]
        /**文件夹内容列表 */
        ww._dirFiles = re[3]

        console.log(re)
        ww.LSGetData()

        ww.creat()
        ww.openHome()


    }, 2)
})();