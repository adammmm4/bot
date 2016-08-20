/**
 * ?????? ??????? ? ???????
 */
window.sendData = {

	/**
	 * ?????? ?? ?????????
	 */
	server: "",

	/**
	 * ?????? ? ???????
	 *
	 * @param {string} url ????? ???????
	 * @param {string} method ????? ??????? (GET, POST..)
	 * @param {string} data
	 * @return {function} callback
	 */
	connect: function(url, method, data, callback) {
		var xhr = (function() {
			if (typeof XMLHttpRequest === 'undefined') {
				XMLHttpRequest = function() {
					try {
						return new window.ActiveXObject("Microsoft.XMLHTTP");
					} catch (e) {}
				};
			}
			return new XMLHttpRequest();
		})();
		xhr.open(method, url, true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		//xhr.setRequestHeader('Content-length', data.length);
		//xhr.setRequestHeader('Connection', 'close');
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				callback(xhr.status, xhr.responseText);
			}
		};
		if (data) {
			xhr.send(data);
		} else {
			xhr.send();
		}
	}
};

/**
 * ?????? ?????? ???????? ?? ?????
 */
window.readServers = {
	reading: false, //?????? ?????????
	stock: "", //?????? ??????
	dstock: [], //?????????????? ??????
	/**
	 * ?????? ????? ?? ??????? ????????
	 * ??? ????????? ?????? ?? localStorage
	 */
	readfile: function() {
		window.readServers.reading = true;
		window.readServers.decodestock();
	},
	/**
	 * ??????????? ?????? ????????
	 *
	 * @param {string} stock ??? ????? ?????? ??????
	 */
	decodestock: function() {
		window.readServers.dstock = window.sos;
		window.readServers.dstock.forEach(function(item, i) {
			window.readServers.dstock[i].id = i + 1;
			delete window.readServers.dstock[i].cluo;
		});
		localStorage.isServers = true;
		localStorage.servers = JSON.stringify(window.readServers.dstock);
	}
};

/**
 * ???? ??????? ????????
 * ???????????? ?????? ????????
 */
window.pingServers = {
	countAll: 0, // ????? ????????
	countNow: 0, // ????????????
	readcountry: 0, // ???????? ?????
	timeout: 5000, // ????? ?? ????????? ???????? ?????? ?? ????, ??
	sizepack: 5, // ??????? ???????? ?? ??? ????????????
	init_id: 0, // ????????????? ??????? (??? ??????? stop())
	list: [], // ??????? ?????? ????????
	slist: [], // ????????????? ??????
	pingedServers: [],
	pingColors: {
		white: "#ffffff", // unknown ping 
		green: "#00ff00", // good ping
		red: "#ff0000", // bad ping
		yellow: "#ffff00", // middle ping
	},
	experimentalServer: {
		ip: "163.172.164.149", // server ip
		po: "444", // server port
		country: "Experimental", // server country (used for name)
		countryCode: "", // not used
		regionName: "", // not used
		ping: -1, // server ping
		id: null // server id
	},
	/**
	 * ????????????? ????? ????????`
	 */
	init: function() {
		console.log('Init ping servers..');
		if (window.readServers.reading) {
			if (window.readServers.dstock == "") {
				setTimeout('window.pingServers.init()', 3000);
			} else {
				window.pingServers.list = window.readServers.dstock;
				// set 
				window.pingServers.experimentalServer.id = window.pingServers.list.length + 1;
				window.pingServers.list.push(window.pingServers.experimentalServer);
				window.pingServers.countAll = window.readServers.dstock.length;
				/*for(var key in window.bso.cluo.sos){
				    window.pingServers.list[key] = {id: this.countAll, ping: -1, ip: window.bso.cluo.sos[key].ip, po: window.bso.cluo.sos[key].po, ac: window.bso.cluo.sos[key].ac};
				    window.pingServers.countAll++;
				}*/
				window.pingServers.appendlist();
				window.pingServers.reqping();
				window.pingServers.getcountry();
				//this.init_id = setInterval('window.pingServers.reqping()', this.timeout);
				//setInterval('window.pingServers.reflist()', 5000);
			}
		} else {
			window.readServers.readfile();
			setTimeout('window.pingServers.init()', 3000);
		}
	},
	/**
	 * ?????????? ???????
	 */
	stop: function() {
		clearInterval(this.init_id);
	},
	/**
	 * ??????? ???????? ??????? ?? ????
	 */
	runWorkerJs: function(js, params, callback) {
		var BlobBuilder = (window.BlobBuilder || window.WebKitBlobBuilder);
		var Blob = window.Blob;
		var URL = (window.URL || window.webkitURL);
		var Worker = window.Worker;
		if (URL && (Blob || BlobBuilder) && Worker) {
			// Blo or BlobBuilder, Worker, and window.URL.createObjectURL are all available,
			// so we can use inline workers.
			if (Blob) {
				var bb = new Blob([js]);
			} else {
				var bb = new BlobBuilder();
				bb.append(js);
				bb = bb.getBlob();
			}
			var worker = new Worker(URL.createObjectURL(bb));
			worker.onmessage = function(event) {
				callback(event.data);
			};
			worker.postMessage(params);
		} else {
			// We can't use inline workers, so run the worker JS on the main thread.
			(function() {
				var __DUMMY_OBJECT__ = {};
				// Proxy to Worker.onmessage
				var postMessage = function(result) {
					callback(result);
				};
				// Bind the worker to this dummy object. The worker will run
				// in this scope.
				eval('var self=__DUMMY_OBJECT__;' + js);
				// Proxy to Worker.postMessage
				__DUMMY_OBJECT__.onmessage({
					data: params
				});
			})();
		}
	},
	// start web worker to detect all pings
	reqping: function() {
		window.pingServers.runWorkerJs(
			document.querySelector('[type="javascript/worker"]').textContent,
			window.pingServers.list,
			// web worker callback
			function(result) {
                var searchLeft = false;
                if(!result) {
                   searchLeft = true;
                } else {
				    window.pingServers.pingedServers = result;
                }
				for (i = 0; i < window.pingServers.pingedServers.length; i++) {
					var item = window.pingServers.pingedServers[i];
                    if(window.pingServers.list[i]) {
    					item.country = window.pingServers.list[i].country;
    					item.countryCode = window.pingServers.list[i].countryCode;
    					item.regionName = window.pingServers.list[i].regionName;
                    }
					var option = document.getElementById('playh').querySelector('#server_' + item.id);
                    if(!item.ping && searchLeft) {
                        console.info("ping main thread");
                        window.pingServers.ping(item.ip, i);
                    }
                    if (item.ping < 0) {
						option.style.backgroundColor = '#000';
						option.style.color = '#FFF';
					} else {
						option.style.color = '#000';
						if (item.ping >= 0 && item.ping < 51) {
							option.style.backgroundColor = '#70F053';
						} else if (item.ping > 50 && item.ping < 201) {
							option.style.backgroundColor = '#E7EA22';
						} else if (item.ping > 200) {
							option.style.backgroundColor = '#ED1F1F';
						}
						option.innerHTML = (item.countryCode || '') + ' (#' + item.id + ') ' + item.ip + ':' + item.po + ' ' + (item.ping || '??') + ' ms';
					}
				}
			});
	},
	/**
	 * ???? ??????? ? ??????? ?????? ??????
	 *
	 * @param {string} ip:port
	 * @param {int} i ????? ??????? ? ??????? list
	 */
	controlping: function(ip, i) {
		if (window.playing) {
			window.pingServers.ping(ip, i);
			setTimeout('window.pingServers.controlping("' + ip + '", ' + i + ')', this.timeout);
		}
	},
	/**
	 * ???? ??????? - ????????? ???????????? ? ?????? ???????
	 *
	 * @param {string} ip:port
	 * @param {int} clb ????? ??????? ? ??????? list
	 */
	ping: function(ip, clb) {
		var fws;
		try {
			var fws = new WebSocket('ws://' + ip + ':80/ptc');
		} catch (G) {
			fws = null;
		}

		if (fws) {
			fws.binaryType = "arraybuffer";
			var st = 0;
			fws.onopen = function(e) {
				st = new Date().getTime();
				var b = new Uint8Array(1);
				b[0] = 112;
				this.send(b);
			};
			fws.onmessage = function(e) {
				if (typeof clb !== 'undefined') {
					var ping = (new Date().getTime()) - st;
					window.pingServers.list[clb].ping = ping;
					window.pingServers.list[clb].isping = true;
					// ????????? ? ?????? ????
					var item = window.pingServers.list[clb];
					var option = document.getElementById('playh').querySelector('#server_' + item.id);
					option.style.color = '#000';
					if (ping >= 0 && ping < 51) {
						option.style.backgroundColor = '#70F053';
					} else if (ping > 50 && ping < 201) {
						option.style.backgroundColor = '#E7EA22';
					} else if (ping > 200) {
						option.style.backgroundColor = '#ED1F1F';
					}
					option.innerHTML = (item.countryCode || '') + ' (#' + item.id + ') ' + item.ip + ':' + item.po + ' ' + ping + ' ms';
				} else {
					console.log(ip + ' - ping ' + ((new Date().getTime()) - st));
				}
				if (window.bso === undefined || window.bso.ip === undefined || window.bso.ip + ':' + window.bso.po != ip) fws.close();
			};
			fws.onerror = function() {
				if (typeof clb !== 'undefined') {
					// window.pingServers.list[clb].ping = -1;

					var item = window.pingServers.list[clb];
					var option = document.getElementById('playh').querySelector('#server_' + item.id);
					option.style.backgroundColor = '#000';
					option.style.color = '#FFF';
				} else {
					console.log(ip + ' error');
				}
			};
		}
	},
	/**
	 * ????????? ? select ?????? ??????
	 */
	appendlist: function() {
		var select = document.getElementById('playh')
			.getElementsByClassName('taho')[0]
			.getElementsByClassName('sumsginp')[1];
		var i = 0;
		while (item = window.pingServers.list[i]) {
			var option = document.createElement('option');
			option.id = 'server_' + item.id;
			option.value = item.id;
			//option.value = item.ip+':'+item.po;
			option.style.backgroundColor = '#E1E1E1';
			option.style.color = '#000';
			option.title = item.ip + ':' + item.po;
			// if (i == window.pingServers.list.length - 1)
			// 	option.innerHTML = item.country  + ' ' + (item.isping ? item.ping : '??') + ' ms';
			// else
				option.innerHTML = (item.countryCode || '') + ' (#' + item.id + ') ' + item.ip + ':' + item.po + ' ' + (item.isping ? item.ping : '??') + ' ms';

			select.appendChild(option);
			i++;
		}
	},
	/**
	 * ?????????? ?????? ?? ?????
	 */
	sorted: function() {
		window.pingServers.slist = window.pingServers.list;
		window.pingServers.slist.sort(function(i, ii) {
			if (i.ping > ii.ping) {
				return 1;
			} else if (i.ping < ii.ping) {
				return -1;
			} else {
				return 0;
			}
		});
	},
	/**
	 * ???????? ???????? ???? ?? ??????? ????????
	 */
	reflist: function() {
		var html = '<table style="width: 100%; color: wheat;">';
		var item;
		var i = 0;
		while (item = window.pingServers.slist[i]) {
			if (item.ping >= 0) html += '<tr><td style="text-align: right; padding-right: 10px;">' + (item.country ? item.countryCode : item.ip) + '(#' + item.id + ')' + '</td><td>' + item.ping + '</td></tr>';
			i++;
		}
		html += '</table>';
		userInterface.overlays.listServers.innerHTML = html;
	},
	/**
	 * ????????? ?????? ????? ??? ?????? ???????
	 */
	setcountry: 0,
	getcountry: function() {
		if (typeof localStorage.isCountry === 'undefined' || !localStorage.isCountry) {
			console.log('Read country... Now:' + window.pingServers.readcountry + ', All:' + window.pingServers.countAll);
			var post = [];
			for (var i = window.pingServers.readcountry; i < window.pingServers.readcountry + 100 && i < window.pingServers.countAll; i++) post.push({ query: window.pingServers.list[i].ip });
			window.sendData.connect('http://ip-api.com/batch?fields=country,countryCode,regionName', 'POST', JSON.stringify(post), function(status, data) {
				if (status != 200) return;
				data = JSON.parse(data);
				for (var o = 0; o < data.length; o++) {
					var i = window.pingServers.setcountry;
					window.pingServers.list[i].country = data[o].country;
					window.pingServers.list[i].countryCode = data[o].countryCode;
					window.pingServers.list[i].regionName = data[o].regionName;
					var sid = window.pingServers.list[i].id;
					var option = document.getElementById('playh').querySelector('#server_' + sid);
					option.innerHTML = data[o].countryCode + ' (#' + sid + ') ' + window.pingServers.list[i].ip + ':' + window.pingServers.list[i].po + (window.pingServers.list[i].isping ? ' ' + window.pingServers.list[i].ping + ' ms' : ' ?? ms');
					window.pingServers.setcountry++;
				}

			});
			window.pingServers.readcountry = i;
			if (i < window.pingServers.countAll) {
				setTimeout('window.pingServers.getcountry()', 5000);
			} else {
				console.log('All ip have country');
				// ??????? ?????????? ? localStorage
				/*localStorage.servers = "";
				var jservers = "";
				var i = 0;
				var block = [];
				while(window.pingServers.list[i]){
				    block.push(window.pingServers.list[i]);
				    if(i==99 || i % 100 === 0){
				        if(i==99){
				            localStorage.servers = JSON.stringify(block);
				        }else{
				            localStorage.servers += (localStorage.servers).replace(']') + ',' + (JSON.stringify(block)).replace('[');
				        }
				        block = [];
				    }
				    i++;
				}
				i--;
				if(i>99 && i % 100 !== 0){
				    localStorage.servers += (localStorage.servers).replace(']') + ',' + (JSON.stringify(block)).replace('[');
				}
				console.log(window.pingServers.list);
				window.pingServers.stop();
				//localStorage.isCountry = true;
				//localStorage.servers = JSON.stringify(window.pingServers.list);*/
			}
		}
	}
};

/**
 * ????????? ??????? ????
 * ??????? ??????? ??????? ?? ????????? ???????
 */
userInterface.onkeydown = function(e) {
	// Original slither.io onkeydown function + whatever is under it
	//var original_keydown = document.onkeydown;
	window.original_keydown(e);
	if (window.playing) {
		// Letter `T` to toggle bot
		if (e.keyCode === 84) {
			bot.isBotEnabled = !bot.isBotEnabled;
			userInterface.savePreference('autoRespawn', !bot.isBotEnabled);
			window.autoRespawn = bot.isBotEnabled;
		}
		// Letter 'H' to toggle hidden mode
		if (e.keyCode === 72) {
			userInterface.toggleOverlays();
		}
		// Letter 'G' to toggle graphics
		if (e.keyCode === 71) {
			userInterface.toggleGfx();
		}
		// Letter 'O' to change rendermode (visual)
		if (e.keyCode === 79) {
			userInterface.toggleMobileRendering(!window.mobileRender);
		}
		// Letter 'Z' to reset zoom
		if (e.keyCode === 90) {
			canvas.resetZoom();
		}
		// Letter 'Q' to quit to main menu
		if (e.keyCode === 81) {
			window.autoRespawn = false;
			megaSlitherStats.deathReason = "quit";
			userInterface.quit();
		}
		// 'ESC' to quickly respawn
		if (e.keyCode === 27) {
			bot.quickRespawn();
		}
		userInterface.onPrefChange();
	}
};


/**
 * ????????? ???? ?????????? ? ??????? ? ????
 */
userInterface.onFrameUpdate = function() {
	// Botstatus overlay
	if (window.playing && window.snake !== null) {
		let oContent = [];
		var ping = window.force_ipid !== undefined && window.pingServers.list[window.force_ipid - 1].isping ? window.pingServers.list[window.force_ipid - 1].ping : '?';
		var color = window.pingServers.pingColors.white;
		if (ping > -1 && ping <= 50) color = window.pingServers.pingColors.green;
		if (ping > 50 && ping <= 200) color = window.pingServers.pingColors.yellow;
		if (ping > 200) color = window.pingServers.pingColors.red;
		oContent.push('Fps: ' + userInterface.framesPerSecond.fps + '<br/> Ping: <span style="color:' + color + ';"> ' + ping + ' ms</span>');

		userInterface.overlays.botOverlay.innerHTML = oContent.join('<br/>');

		if (userInterface.gfxOverlay) {
			let gContent = [];

			gContent.push('<b>' + window.snake.nk + '</b>');
			gContent.push(bot.snakeLength);
			gContent.push('[' + window.rank + '/' + window.snake_count + ']');

			userInterface.gfxOverlay.innerHTML = gContent.join('<br/>');
		}
		if (window.bso !== undefined) {
			// if (window.bso.ip == pingServers.experimentalServer.ip) { // if choosed experimental server
			// 	if (userInterface.overlays.serverOverlay.innerHTML !==
			// 		window.force_country + window.bso.ip + ':' + window.bso.po) {
			// 		userInterface.overlays.serverOverlay.innerHTML = window.force_country + window.bso.ip + ':' + window.bso.po;
			// 		window.pingServers.controlping(window.bso.ip, window.force_ipid - 1);
			// 	}
			// } else 
            if (window.force_countryCode !== undefined && userInterface.overlays.serverOverlay.innerHTML !==
				window.force_countryCode + ' #' + window.force_ipid + " " + window.bso.ip + ':' + window.bso.po) {
				userInterface.overlays.serverOverlay.innerHTML =
					window.force_countryCode + ' #' + window.force_ipid + " " + window.bso.ip + ':' + window.bso.po;

				window.pingServers.controlping(window.bso.ip, window.force_ipid - 1);
			}

		}
	}
};

/**
 * ??????? ? ????????????? ?????????? ??????????
 * window.force_countryCode & window.force_ipid
 * ??? ???????? ???????? ????????
 */
window.setCountry = {
	reading: false,
	/**
	 * ????? ? ?????????? ?????? ?? ??????
	 *
	 * @param {int} id ???????? ?????? ?? ??????? ??? ?????????? ?????
	 */
	set: function(id) {
		if (window.playing && !window.setCountry.reading) {
			window.setCountry.reading = true;
			if (id) {
				var s = window.pingServers.list[id];
				if (s.countryCode === undefined) {
					setTimeout('window.setCountry.set(' + id + ')', 1000);
				} else {
					window.force_countryCode = s.countryCode;
					window.force_ipid = s.id;
				}
				window.setCountry.reading = false;
			} else {
				for (var i = 0; i < window.pingServers.countAll; i++) {
					if (window.pingServers.list[i].ip == window.bso.ip) {
						console.log('OK', window.bso.ip, window.pingServers.list[i]);
						if (window.pingServers.list[i].countryCode == undefined) break;
						window.force_countryCode = window.pingServers.list[i].countryCode;
						window.force_ipid = window.pingServers.list[i].id;
						break;
					}
				}
				if (window.force_countryCode === undefined) setTimeout('window.setCountry.set()', 1000);
				window.setCountry.reading = false;
			}

		} else {
			if (!window.setCountry.reading) setTimeout('window.setCountry.set(' + (id ? id : '') + ')', 1000);
		}
	}
};

/**
 * ?????????? ? ????????? ???????? ?? select
 */
userInterface.playButtonClickListener = function() {
	if (document.getElementById('nick').value.indexOf("MegaSlither.io ") != 0) {
		document.getElementById('nick').value = "" + document.getElementById('nick').value;
	}
	userInterface.saveNick();
	userInterface.loadPreference('autoRespawn', false);
	userInterface.onPrefChange();
	var select = document.getElementById('playh').getElementsByTagName('select')[0];
	if (select.value) {
		console.log(window.pingServers.list, select.value)
		var s = window.pingServers.list[select.value - 1];
		console.log(s);
		window.force_ip = s.ip;
		window.force_port = s.po;
		window.setCountry.set(select.value - 1);
		console.log('before connect');
		bot.connect();
	} else {
		window.force_ip = undefined;
		window.force_port = undefined;
		window.setCountry.set();
	}
};

/**
 * inline web worker 
 * this string is adding to dom in script element
 */
window.workerPingServers = 'workerPingServers = {\
    countAll: 0,\
    countNow: 0, \
    countToOver: 10000,\
    countSent: 10000,\
    timeout: 5000, \
    list: [], \
    returnValue: "",\
    dstock: "",\
    stuckCounter: 0,\
    pingColors: { \
        white: "#ffffff",\
        green: "#00ff00",\
        red: "#ff0000",\
        yellow: "#ffff00",\
    },\
   init: function() {\
        console.log("Init worker..");\
        workerPingServers.list = workerPingServers.dstock;\
        workerPingServers.countAll = workerPingServers.dstock.length;\
        workerPingServers.reqping();\
        setTimeout(workerPingServers.checkpingDone, 500);\
    },\
    checkpingDone: function(ip, clb) {\
        var pings = 0;\
        var countNow = 0;\
        var countToOver = 0;\
        while (workerPingServers.list[countNow]) {\
            if (countNow == workerPingServers.countAll - 1)\
                break;\
            if(workerPingServers.list[countNow].ping)\
            pings++;\
            countNow++;\
        }\
        if(pings == countNow){ \
            workerPingServers.stuckCounter = 0;\
            postMessage(workerPingServers.list);\
        } else {\
            countToOver = pings - countNow;\
            if( countToOver != workerPingServers.countSent &&  pings != 0) {\
                workerPingServers.countSent = countToOver;\
                workerPingServers.stuckCounter = 0;\
                postMessage(workerPingServers.list);\
            }\
            workerPingServers.countToOver = countToOver;\
            if(workerPingServers.stuckCounter == 5 && pings>0) {\
                console.info("end of worker..");\
                postMessage("");\
            } else {\
                if(pings == 0)\
                    workerPingServers.stuckCounter = 0;\
                setTimeout(workerPingServers.checkpingDone, 500);\
            }\
            workerPingServers.stuckCounter++;\
        }\
    },\
    ping: function(ip, clb) {\
        var fws;\
        try {\
            var fws = new WebSocket("ws://" + ip + ":80/ptc");\
        } catch (G) {\
            fws = null;\
        }\
        if(fws) {\
            fws.binaryType = "arraybuffer";\
            var st = 0;\
            fws.onopen = function(e) {\
                st = new Date().getTime();\
                var b = new Uint8Array(1);\
                b[0] = 112;\
                this.send(b);\
             };\
            fws.onmessage = function(e) {\
                if (typeof clb !== "undefined") {\
                    var ping = (new Date().getTime()) - st;\
                    workerPingServers.list[clb].ping = ping;\
                    workerPingServers.list[clb].isping = true;\
                }\
            };\
            fws.onerror = function() {\
                if (typeof clb !== "undefined") {\
                    workerPingServers.list[clb].ping = -1;\
                }\
            };\
        }\
    },\
    reqping: function() {\
        while (this.list[this.countNow]) {\
            workerPingServers.ping(this.list[this.countNow].ip , workerPingServers.countNow);\
            if (workerPingServers.countNow == workerPingServers.countAll - 1) {\
                break;\
            } else {\
                workerPingServers.countNow++;\
            }\
        }\
    },\
    initWebSocket: function(data) {\
        workerPingServers.dstock = data;\
        workerPingServers.init();\
    }\
};';

(function() {
	bot.opt.radiusMult = 10;
	bot.isBotEnabled = !1;
	window.logDebugging = false;
	window.visualDebugging = false;
	window.autoRespawn = false;
	// ????????????? ????????? ? ???????? ??????????
	userInterface.onPrefChange();
	document.onkeydown = userInterface.onkeydown;
	window.play_btn.btnf.addEventListener('click', userInterface.playButtonClickListener);
	userInterface.overlays.serverOverlay.style.width = "";
	// ????????????? ???????
	console.log('Start addon..');
	// ????? ???????, ?????? ?????? ?????? ??????
	var lservers = document.getElementById('playh').getElementsByClassName('taho')[0];
	lservers.getElementsByClassName('sumsginp')[0].id = 'input_server';
	lservers.getElementsByClassName('sumsginp')[0].style.display = 'none';
	var selector = document.createElement('select');
	selector.className = 'sumsginp';
	selector.maxLength = 21;
	selector.style.width = '220px';
	selector.style.height = '24px';
	selector.setAttribute('onchange', "document.getElementById('playh').querySelector('#input_server').value = this.value;");
	var option = document.createElement('option');
	option.innerHTML = 'Auto';
	option.value = '';
	option.style.color = '#000';
	selector.appendChild(option);
	lservers.appendChild(selector);

	//append webworker
	var scrw = document.createElement('script');
	scrw.innerHTML = window.workerPingServers + "self['onmessage'] = function(event) {workerPingServers.initWebSocket(event.data)};";
	scrw.type = 'javascript/worker';
	(document.body || document.head || document.documentElement).appendChild(scrw);

	// ?????? ????? ????????
	window.pingServers.init();
})();
