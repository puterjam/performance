/**
 * User: PuterJam
 * Date: 14-1-23
 * Time: 下午2:59
 */

chrome.devtools.network.onRequestFinished.addListener(
    function(request) {
        if (request.response.bodySize > 40*1024)
            chrome.experimental.devtools.console.addMessage(
                chrome.experimental.devtools.console.Severity.Warning,
                "Large image: " + request.request.url);
    });
