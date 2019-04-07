
/**生成文件列表 */
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