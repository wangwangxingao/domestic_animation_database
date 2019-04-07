
/**创建元素 */
(function () {

    ww.ele = {}


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

    ww.creatset = function () {

        ww.ele.set =  document.createElement("div")
 
        ww.ele.clear = document.createElement("input")
        ww.ele.clear.type = "button"
        ww.ele.clear.value = ""

        ww.ele.clear.onclick = function () {
            //alert,confirm prompt 
            ww.Clear()
        }
        ww.appendChild(ww.ele.clear, ww.ele.set);

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



        /**位置选择关闭  */
        ww.ele.pathSelectClose = function () {
            if (ww.ele.pathSelect._close) {
                ww.ele.pathSelect._close = false
                ww.ele.pathSelect.style.visibility = "hidden"
            }
        }

        /**位置选择打开 */
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
        ww.creatset()
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
