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

    ww._savedatalength = 0


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
        ww.mustClear && ww.mustClear(data ? data.length : 0)
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

            ww.mustClear && ww.mustClear(compressed.length)
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

                    /* var timeoutFind = function () { 
                         for (var i = 0; i < list.length; i++) {
                             var n = list[i]
                             //ww.getfind("./" + n, find, keywords, obj)
                             ww.getfind(n, find, keywords, obj)
                         }
                     }
                     setTimeout(timeoutFind,500)*/
 
                    for (var i = 0; i < list.length; i++) {
                        var n = list[i]
                        setTimeout(ww.getfind.bind(this, n, find, keywords, obj), 0)
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

                ww._findData[obj.findText] = ww.markfindData(obj.hear, obj.findall, obj.data, obj.files)
                if (ww.nowPath() == obj.findText) {
                    ww.open(obj.findText)
                    ww.search(keywords, obj.findText)
                }
                //ww.showmarked(ww._findText)
            } else {
                ww._findData[obj.findText] = ww.markfindOnData(obj.hear, obj.findall, obj.data, obj.files)
                if (ww.nowPath() == obj.findText) {
                    ww.open(obj.findText)
                }
            }
        })
    }


    /**制作搜索头 */
    ww.markfindHear = function (url, keywords) {

        var showhear = "# 搜索\n"
        var showpath = "\n>搜索位置:" + url + "  "
        var showtext = "\n>搜索内容:" + keywords + "  \n"

        var t = showhear + showpath + showtext
        return t

    }


    ww.markfindOnData = function (hear, all, data, files) {

 
        var showend = "\n# 搜索中"
        var showall = "\n>需搜索 " + all + " 个文件  "
        var shownow = "\n>已搜索 " + (files ? files.length : 0) + " 个文件  "
        var shownum = "\n>已找到 " + (data ? data.length : 0) + " 个文件  \n"
        var hear = hear
 
        var t = hear + showend + showall + shownow + shownum
        return t

    }

    /**制作搜索数据 */
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