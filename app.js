

var webFile = webFile || {};
webFile.get = function (url, type, load, progress, error, abort, onloadend) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = (typeof (type) == "string") ? type : "arraybuffer"
  xhr.onload = function () {
    if (xhr.status < 400) {
      if (typeof load == "function") {
        load(xhr.response, xhr)
      }
    }
  };
  xhr.onprogress = progress
  xhr.onerror = error
  xhr.onabort = abort
  xhr.onloadend = onloadend
  xhr.send()
  return xhr
}


webFile.get("https://www.chinafilm.gov.cn/xxgk/gsxx/dybalx/index.html", "document", console.log)