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
    ww.makeMarked = function (src, opt, callback) {

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

    ww.marked = ww.makeMarked()

})();