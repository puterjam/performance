/*
 perfomance.js

 Copyright (c) 2014

 PuterJam

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


var isLoadEventEnd = false, //是否完整绘制完成
    startFromNavigate = false,
    requestCount = 0,
    requestSize = 0,
    responseSize = 0,
    cacheCount = 0,
    count304 = 0,
    time = {};

//dom cache
var networkBar = document.getElementById("network_bar"),
    serverBar = document.getElementById("server_bar"),
    clientBar = document.getElementById("client_bar"),
    networkResult = document.getElementById("network-result"),
    serverResult = document.getElementById("server-result"),
    clientResult = document.getElementById("client-result"),
    pageResult = document.getElementById("page-result");

var networkKey = ["redirectStart", "redirectEnd", "fetchStart",
        "domainLookupStart", "domainLookupEnd", "connectStart", "connectEnd", "secureConnectionStart"],
    serverKey = ["requestStart", "responseStart", "responseEnd"],
    clientKey = ["domLoading", "domInteractive", "domContentLoadedEventStart", "domContentLoadedEventEnd", "domComplete", "loadEventStart", "loadEventEnd"];

chrome.devtools.network.onNavigated.addListener(function (url) {
    console.log("navigate to:" + url);
    isLoadEventEnd = false;
    startFromNavigate = true;
    requestCount = 0;
    requestSize = 0;
    responseSize = 0;
    cacheCount = 0;
    count304 = 0;
    time = {};
    serverBar.style.width = "1%";
    clientBar.style.width = "1%";
    // getTiming(drawTiming);
})

chrome.devtools.network.onRequestFinished.addListener(function (request) {
    if (isLoadEventEnd) {
        return;
    }
    console.log(request)
    requestCount++;

    if (request.request.headersSize == -1) {
        cacheCount++;
    } else {
        request.response.status == 304 && count304++;
        requestSize = requestSize + (request.request.bodySize + request.request.headersSize);
        responseSize = responseSize + (request.response.bodySize + request.response.headersSize);
    }
    getTiming(drawTiming);
})


function getTiming(callback) {

    chrome.devtools.inspectedWindow.eval(
       // "window.performance.timing",
        "(function(){for (var k in window.performance.timing) {var timing = timing || {}; timing[k] = window.performance.timing[k]}; return timing})()",
        function (result, isException) {
            if (!isException) {
                callback(result);
            }
            ;
        }
    );
}

function drawNetwork(time, timing) {
    var _timeList = []
    networkKey.forEach(function (k) {
        _timeList.push(timing[k])
    });

    var networkTime = Math.max.apply(null, _timeList);
    console.log(networkTime);

    var total = networkTime - time.start;
    networkBar.style.width = (100 * (total / time.total)) + "%";

    fillNetworkResult(total, timing);
    //console.log("n:" + total + ":" + time.total);
    return networkTime;
};

function fillNetworkResult(total, timing) {
    var r = [];
    r.push('<span class="network-text right">' + (total < 0 ? 0 : total) + 'ms</span>');
    r.push('<span class="network-text">navigation start: ' + new Date(timing.navigationStart) + '</span>- ');
//    var _un = (timing.unloadEventEnd - timing.navigationStart);
//    _un > 0 && r.push('<span class="network-text">unload: ' + _un + 'ms</span>- ');
    r.push('<span class="network-text">redirect: ' + (timing.redirectEnd - timing.redirectStart) + 'ms</span>- ');
    r.push('<span class="network-text">cache loaded: ' + (timing.domainLookupStart - timing.fetchStart) + 'ms</span>- ');
    r.push('<span class="network-text">dns lookup: ' + (timing.domainLookupEnd - timing.domainLookupStart) + 'ms</span>- ');
    r.push('<span class="network-text">connect: ' + (timing.connectEnd - timing.connectStart) + 'ms</span>');
    networkResult.innerHTML = r.join("");
}

function drawServer(time, timing) {
    var _timeList = []
    serverKey.forEach(function (k) {
        _timeList.push(timing[k])
    });

    var serverTime = Math.max.apply(null, _timeList);

    var total = serverTime - time.network;

    serverBar.style.width = (100 * (total / time.total)) + "%";

    fillServerResult(total, timing);
    // console.log("s:" + total + ":" + time.total);
    return serverTime;
};

function fillServerResult(total, timing) {
    var r = [];
    r.push('<span class="server-text right">' + (total < 0 ? 0 : total) + 'ms</span>');
    r.push('<span class="server-text">request start: ' + new Date(timing.requestStart) + '</span>- ');
    r.push('<span class="server-text">wait: ' + (timing.responseStart - timing.requestStart) + 'ms</span>- ');
    r.push('<span class="server-text">response: ' + (timing.responseEnd - timing.responseStart) + 'ms</span>');
    serverResult.innerHTML = r.join("");
}

function drawClient(time, timing) {
    var _timeList = []
    clientKey.forEach(function (k) {
        _timeList.push(timing[k])
    });

    var clientTime = Math.max.apply(null, _timeList);

    var total = clientTime - time.server;
    clientBar.style.width = (100 * (total / time.total)) + "%";

    fillClientResult(total, timing);
    //console.log("c:" + total + ":" + time.total);
    return clientTime;
};

function fillClientResult(total, timing) {
    var r = [];
    r.push('<span class="client-text right">' + (total < 0 ? 0 : total) + 'ms</span>');

    r.push('<span class="client-text">dom loading: ' + new Date(timing.domLoading) + '</span>- ');

    var _in = (timing.domInteractive - timing.domLoading);
    r.push('<span class="client-text">' + (_in <= 0 ? "<b>dom waiting for parse.</b>" : "dom interactive: " + _in + "ms") + '</span>- ');

    var _dc = (timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart);
    _dc>0 && r.push('<span class="client-text">dom content loaded: ' + _dc + 'ms</span>- ');

    var _dc = (timing.domComplete - timing.domContentLoadedEventEnd);
    r.push('<span class="client-text">' + (_dc <= 0 ? "<b>dom rendering...</b></span>" : "dom complete: " + _dc + "ms</span>- "));

    var _le =  (timing.loadEventEnd - timing.loadEventStart);
    _le>0 && r.push('<span class="client-text">load event: ' + _le + 'ms</span>');
    clientResult.innerHTML = r.join("");
}

function drawTiming(timing) {
//    Object.keys(result.timing).forEach(function(k){
//        document.write(k + ":" + result.timing[k] + "<br/>");
//    });

    time = {
        start: timing.navigationStart,
        end: timing.loadEventEnd || (new Date()).getTime()
    }

    time.total = time.end - time.start;

    time.network = drawNetwork(time, timing);

    time.server = drawServer(time, timing);

    time.client = drawClient(time, timing);

    if (timing.loadEventEnd) {
        isLoadEventEnd = true;
    }

    if (startFromNavigate) {
        pageResult.innerHTML = ['<span class="page-text"><b>' + requestCount + ' requests</b></span>',
            '<span class="page-text">' + count304 + ' in 304 | ' + cacheCount + ' cached' + '</span>',
            '<span class="page-text">request size: ' + (requestSize / 1024).toFixed(2) + 'Kb</span>',
            '<span class="page-text">response size: ' + (responseSize / 1024).toFixed(2) + 'Kb</span>'].join("");
    } else {
        if (navigator.platform == "MacIntel") {
            pageResult.innerHTML = '<span class="page-text">refresh page(⌘R) to calculate requests </span>';
        }else{
            pageResult.innerHTML = '<span class="page-text">refresh page(F5) to calculate requests </span>';
        }
    }
    // console.log((time.network - time.start) + "+" + (time.server - time.network) + "+" + (time.client - time.server) + "=" + time.total);
    // console.log(timing);
}

//init page
getTiming(drawTiming);