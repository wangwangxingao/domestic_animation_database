

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
        try {
            
        while (result = this._results.pop()) {
            //console.log(result)
            var data = result[0]
            var node = result[1]
            var childNode = result[2]
            var forkNode = result[3] 
            node && node.replaceChild(childNode, forkNode);
        }
        } catch (error) { 
        }
        this._results = []

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
                this.colorNode(forkNode, words, ki, 0, notnode, colorName, colortype)
                break
            }
        }

    }



    Highlighter.prototype.span = function (word, colorName, colortype) {

        var colors = this.colorGet(colorName)

        var cn = colors[word.index % colors.length]
        var cl = this._colorsHash[cn] = this._colorsHash[cn] || (cn || "").split(";")

        var colortype = colortype ? 2 : 0
        console.log(cn, colortype)
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

