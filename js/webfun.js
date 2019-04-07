/**网页方法 */
(function () {

    /**打开网页 */
    ww.open = function (value) {
        var value = ww.stringtrim(value)
        console.log(value)
        ww.setPathInputValue(value)
        // if (value.indexOf("./find/") == 0) {
        if (value.indexOf("set") == 0 || value.indexOf("设置") == 0) {
            ww.baseUrl = "set.md"
            ww.setPathInputValue("设置")
            return ww.showset()
        } else if (value.indexOf("find/") == 0) {
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


    /**设置打开 */
    ww.setOpen = function () {
        var p = "set.md"
        ww.push(p)

    }

    /**需要清除 */
    ww.mustClear = function (length) {
        var length = length !== undefined ? length || 0 : ww._savedatalength
        ww._savedatalength = length
        if (ww.ele && ww.ele.clear) {
            ww.ele.clear.value = "缓存:" + (length || 0)
        }
    }

    /**清除 */
    ww.Clear = function () {
        if (confirm("是否清除缓存\n清除缓存后打开网页需要重新读取")) {
            localStorage.clear()
            ww.mustClear(0)
        }
    }
    /**显示设置 */
    ww.showset = function () {
        ww.mustClear()


        var text = "# 设置 \n"
        text += "## 清除缓存"

        var div = document.createElement("div")
        div.innerHTML = md
        ww.appendChild(div, ww.ele.markeddiv);

        var md = ww.marked(text)
        ww.ele.markeddiv.innerHTML = md
        ww.appendChild(ww.ele.set, ww.ele.markeddiv);

        var text = "# 国产动画数据库 "
        var md = ww.marked(text)
        var div = document.createElement("div")
        div.innerHTML = md
        ww.appendChild(div, ww.ele.markeddiv);



        ww.clearFind()
        ww.scrollTo(0, 0)
    }



    ww.setPathInputValue = function (data) {
        ww.ele.pathInput.value = ww.delUrlHear(data)
    }

    ww.getPathInputValue = function () {
        var data = ww.getInputValue(ww.ele.pathInput)
        return ww.addUrlHear(data)
    }
})();