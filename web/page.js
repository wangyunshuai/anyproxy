/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	window.$ = window.jQuery = __webpack_require__(2);

	var EventManager    = __webpack_require__(3),
		Anyproxy_wsUtil = __webpack_require__(4),
		React           = __webpack_require__(5);

	var WsIndicator = __webpack_require__(6).init(React),
		RecordPanel = __webpack_require__(8).init(React),
		MapPanel    = __webpack_require__(7).init(React),
		Detail      = __webpack_require__(1).init(React),
		Popup       = __webpack_require__(9).init(React),
		Filter      = __webpack_require__(10).init(React);

	var ifPause     = false,
	    recordSet   = [];

	//Event : wsGetUpdate
	//Event : recordSetUpdated
	//Event : wsOpen
	//Event : wsEnd
	var eventCenter = new EventManager();


	//invoke AnyProxy web socket util
	(function(){
		try{
			var ws = window.ws = new Anyproxy_wsUtil({
				baseUrl     : document.getElementById("baseUrl").value,
				port        : document.getElementById("socketPort").value,
				onOpen : function(){
					eventCenter.dispatchEvent("wsOpen");
				},
				onGetUpdate : function(content){
					eventCenter.dispatchEvent("wsGetUpdate",content);
				},
				onError     : function(e){
					eventCenter.dispatchEvent("wsEnd");
				},
				onClose     : function(e){
					eventCenter.dispatchEvent("wsEnd");
				}
			});
			window.ws = ws;
			
		}catch(e){
			alert("failed to invoking web socket on this browser");
		}
	})();


	//websocket status indicator
	(function(){
		var wsIndicator = React.render(
			React.createElement(WsIndicator, null),
			document.getElementById("J_indicatorEl")
		);

		eventCenter.addListener("wsOpen",function(){
			wsIndicator.setState({
				isValid : true
			});
		});

		eventCenter.addListener("wsEnd",function(){
			wsIndicator.setState({
				isValid : false
			});
		});	
	})();


	//init popup
	var pop;
	(function(){
		$("body").append('<div id="J_popOuter"></div>');
		pop = React.render(
			React.createElement(Popup, null),
			document.getElementById("J_popOuter")
		);
	})();


	//init record panel
	var recorder;
	(function(){
		//merge : right --> left
		function util_merge(left,right){
		    for(var key in right){
		        left[key] = right[key];
		    }
		    return left;
		}

		function updateRecordSet(newRecord){
			if(ifPause) return;

			if(newRecord && newRecord.id){
				if(!recordSet[newRecord.id]){
					recordSet[newRecord.id] = newRecord;
				}else{
					util_merge(recordSet[newRecord.id],newRecord);
				}

				recordSet[newRecord.id]._justUpdated = true;
				// React.addons.Perf.start();
				eventCenter.dispatchEvent("recordSetUpdated");
				// React.addons.Perf.stop();
			}
		}

		function showDetail(data){
			pop.setState({
				show: true,
				content : React.createElement(Detail, {data: data}),
				left:"35%"
			});
		}

		eventCenter.addListener("wsGetUpdate",updateRecordSet);

		eventCenter.addListener('recordSetUpdated',function(){
			recorder.setState({
				list : recordSet
			});
		});

		eventCenter.addListener("filterUpdated",function(newKeyword){
			recorder.setState({
				filter: newKeyword
			});
		});

		//init recorder panel
		recorder = React.render(
			React.createElement(RecordPanel, {onSelect: showDetail}),
			document.getElementById("J_content")
		);
	})();


	//action bar
	(function(){

		//detect whether to show the filter and map btn
		$.get("/filetree?root=/",function(){
			$(".J_filterSection").show();
		});

		//clear log
		function clearLogs(){
			recordSet = [];
			eventCenter.dispatchEvent("recordSetUpdated");
		}

		$(document).on("keyup",function(e){
			if(e.keyCode == 88 && e.ctrlKey){ // ctrl + x
				clearLogs();
			}
		});

		var clearLogBtn = $(".J_clearBtn");
		clearLogBtn.on("click",function(e){
			e.stopPropagation();
			e.preventDefault();
			clearLogs();
		});

		//start , pause
		var statusBtn = $(".J_statusBtn");
		statusBtn.on("click",function(e){
			e.stopPropagation();
			e.preventDefault();

			$(".J_statusBtn").removeClass("btn_disable");
			$(this).addClass("btn_disable");

			if(/stop/i.test($(this).html()) ){
				ifPause = true;
			}else{
				ifPause = false;
			}
		});

		//filter
		(function (){
			function updateKeyword(key){
				eventCenter.dispatchEvent("filterUpdated",key);
			}

			var filter = (React.createElement(Filter, {onChangeKeyword: updateKeyword}));
			function showFilter(){
				pop.setState({
					show    : true,
					content : filter,
					left:"50%"
				});
			}

			$(".J_showFilter").on("click",function(){
				showFilter();
			});
		})();

		//map local
		(function(){
			var mapPanel = (React.createElement(MapPanel, null));
			function showMap(){
				pop.setState({
					show : true,
					content : mapPanel,
					left:"40%"

				})
			}

			$(".J_showMapPanel").on("click",function(){
				showMap();
			});
		})();

	})();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	function init(React){

		var DetailPanel = React.createClass({displayName: "DetailPanel",
			getInitialState : function(){
				return {
					body : {id : -1, content : null},
					left : "35%"
				};
			},
			loadBody:function(){
				var self = this,
				    id   = self.props.data.id;
				if(!id) return;

				ws.reqBody(id,function(content){
					if(content.id == self.props.data.id){
						self.setState({
							body : content
						});
					}
				});
			},
			render : function(){
				var reqHeaderSection = [],
					resHeaderSection = [],
					summarySection,
					detailSection,
					bodyContent;

				if(this.props.data.reqHeader){
					for(var key in this.props.data.reqHeader){
						reqHeaderSection.push(React.createElement("li", {key: "reqHeader_" + key}, React.createElement("strong", null, key), " : ", this.props.data.reqHeader[key]))
					}
				}

				summarySection = (
					React.createElement("div", null, 
						React.createElement("section", {className: "req"}, 
							React.createElement("h4", {className: "subTitle"}, "request"), 
							React.createElement("div", {className: "detail"}, 
								React.createElement("ul", {className: "uk-list"}, 
								    React.createElement("li", null, this.props.data.method, " ", React.createElement("span", {title: "{this.props.data.path}"}, this.props.data.path), " HTTP/1.1"), 
								    reqHeaderSection
								)
							)
						), 
						
						React.createElement("section", {className: "reqBody"}, 
							React.createElement("h4", {className: "subTitle"}, "request body"), 
							React.createElement("div", {className: "detail"}, 
								React.createElement("p", null, this.props.data.reqBody)
							)
						)
					)
				);

				if(this.props.data.statusCode){

					if(this.state.body.id == this.props.data.id){
						bodyContent = (React.createElement("pre", {className: "resBodyContent"}, this.state.body.body));
					}else{
						bodyContent = null;
						this.loadBody();
					}

					if(this.props.data.resHeader){
						for(var key in this.props.data.resHeader){
							resHeaderSection.push(React.createElement("li", {key: "resHeader_" + key}, React.createElement("strong", null, key), " : ", this.props.data.resHeader[key]))
						}
					}

					detailSection = (
						React.createElement("div", null, 
							React.createElement("section", {className: "resHeader"}, 
								React.createElement("h4", {className: "subTitle"}, "response header"), 
								React.createElement("div", {className: "detail"}, 
									React.createElement("ul", {className: "uk-list"}, 
									    React.createElement("li", null, "HTTP/1.1 ", React.createElement("span", {className: "http_status http_status_" + this.props.data.statusCode}, this.props.data.statusCode)), 
									    resHeaderSection
									)
								)
							), 
							
							React.createElement("section", {className: "resBody"}, 
								React.createElement("h4", {className: "subTitle"}, "response body"), 
								React.createElement("div", {className: "detail"}, bodyContent)
							)
						)
					);
				}

				return (
					React.createElement("div", null, 
						summarySection, 
						detailSection
					)
				);
			}
		});

		return DetailPanel;	
	}

	module.exports.init = init;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! jQuery v2.1.4 | (c) 2005, 2015 jQuery Foundation, Inc. | jquery.org/license */
	!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k={},l=a.document,m="2.1.4",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return n.each(this,a,b)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(n.isPlainObject(d)||(e=n.isArray(d)))?(e?(e=!1,f=c&&n.isArray(c)?c:[]):f=c&&n.isPlainObject(c)?c:{},g[b]=n.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===n.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){return!n.isArray(a)&&a-parseFloat(a)+1>=0},isPlainObject:function(a){return"object"!==n.type(a)||a.nodeType||n.isWindow(a)?!1:a.constructor&&!j.call(a.constructor.prototype,"isPrototypeOf")?!1:!0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(a){var b,c=eval;a=n.trim(a),a&&(1===a.indexOf("use strict")?(b=l.createElement("script"),b.text=a,l.head.appendChild(b).parentNode.removeChild(b)):c(a))},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=s(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:g.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=s(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(c=a[b],b=a,a=c),n.isFunction(a)?(e=d.call(arguments,2),f=function(){return a.apply(b||this,e.concat(d.call(arguments)))},f.guid=a.guid=a.guid||n.guid++,f):void 0},now:Date.now,support:k}),n.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function s(a){var b="length"in a&&a.length,c=n.type(a);return"function"===c||n.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ha(),z=ha(),A=ha(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N=M.replace("w","w#"),O="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+N+"))|)"+L+"*\\]",P=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+O+")*)|.*)\\)|)",Q=new RegExp(L+"+","g"),R=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),S=new RegExp("^"+L+"*,"+L+"*"),T=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),U=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),V=new RegExp(P),W=new RegExp("^"+N+"$"),X={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M.replace("w","w*")+")"),ATTR:new RegExp("^"+O),PSEUDO:new RegExp("^"+P),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},Y=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,$=/^[^{]+\{\s*\[native \w/,_=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,aa=/[+~]/,ba=/'|\\/g,ca=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),da=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},ea=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(fa){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function ga(a,b,d,e){var f,h,j,k,l,o,r,s,w,x;if((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,d=d||[],k=b.nodeType,"string"!=typeof a||!a||1!==k&&9!==k&&11!==k)return d;if(!e&&p){if(11!==k&&(f=_.exec(a)))if(j=f[1]){if(9===k){if(h=b.getElementById(j),!h||!h.parentNode)return d;if(h.id===j)return d.push(h),d}else if(b.ownerDocument&&(h=b.ownerDocument.getElementById(j))&&t(b,h)&&h.id===j)return d.push(h),d}else{if(f[2])return H.apply(d,b.getElementsByTagName(a)),d;if((j=f[3])&&c.getElementsByClassName)return H.apply(d,b.getElementsByClassName(j)),d}if(c.qsa&&(!q||!q.test(a))){if(s=r=u,w=b,x=1!==k&&a,1===k&&"object"!==b.nodeName.toLowerCase()){o=g(a),(r=b.getAttribute("id"))?s=r.replace(ba,"\\$&"):b.setAttribute("id",s),s="[id='"+s+"'] ",l=o.length;while(l--)o[l]=s+ra(o[l]);w=aa.test(a)&&pa(b.parentNode)||b,x=o.join(",")}if(x)try{return H.apply(d,w.querySelectorAll(x)),d}catch(y){}finally{r||b.removeAttribute("id")}}}return i(a.replace(R,"$1"),b,d,e)}function ha(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ia(a){return a[u]=!0,a}function ja(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ka(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function la(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function na(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function oa(a){return ia(function(b){return b=+b,ia(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function pa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=ga.support={},f=ga.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=ga.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=g.documentElement,e=g.defaultView,e&&e!==e.top&&(e.addEventListener?e.addEventListener("unload",ea,!1):e.attachEvent&&e.attachEvent("onunload",ea)),p=!f(g),c.attributes=ja(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ja(function(a){return a.appendChild(g.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=$.test(g.getElementsByClassName),c.getById=ja(function(a){return o.appendChild(a).id=u,!g.getElementsByName||!g.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ca,da);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ca,da);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=$.test(g.querySelectorAll))&&(ja(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\f]' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ja(function(a){var b=g.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=$.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ja(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",P)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=$.test(o.compareDocumentPosition),t=b||$.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===g||a.ownerDocument===v&&t(v,a)?-1:b===g||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,h=[a],i=[b];if(!e||!f)return a===g?-1:b===g?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return la(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)i.unshift(c);while(h[d]===i[d])d++;return d?la(h[d],i[d]):h[d]===v?-1:i[d]===v?1:0},g):n},ga.matches=function(a,b){return ga(a,null,null,b)},ga.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(U,"='$1']"),!(!c.matchesSelector||!p||r&&r.test(b)||q&&q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return ga(b,n,null,[a]).length>0},ga.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},ga.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},ga.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},ga.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=ga.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=ga.selectors={cacheLength:50,createPseudo:ia,match:X,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ca,da),a[3]=(a[3]||a[4]||a[5]||"").replace(ca,da),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||ga.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&ga.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return X.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&V.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ca,da).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=ga.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(Q," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){k=q[u]||(q[u]={}),j=k[a]||[],n=j[0]===w&&j[1],m=j[0]===w&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[w,n,m];break}}else if(s&&(j=(b[u]||(b[u]={}))[a])&&j[0]===w)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(s&&((l[u]||(l[u]={}))[a]=[w,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||ga.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ia(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ia(function(a){var b=[],c=[],d=h(a.replace(R,"$1"));return d[u]?ia(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ia(function(a){return function(b){return ga(a,b).length>0}}),contains:ia(function(a){return a=a.replace(ca,da),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ia(function(a){return W.test(a||"")||ga.error("unsupported lang: "+a),a=a.replace(ca,da).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Z.test(a.nodeName)},input:function(a){return Y.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:oa(function(){return[0]}),last:oa(function(a,b){return[b-1]}),eq:oa(function(a,b,c){return[0>c?c+b:c]}),even:oa(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:oa(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:oa(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:oa(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=ma(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=na(b);function qa(){}qa.prototype=d.filters=d.pseudos,d.setFilters=new qa,g=ga.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=S.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=T.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(R," ")}),h=h.slice(c.length));for(g in d.filter)!(e=X[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?ga.error(a):z(a,i).slice(0)};function ra(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function sa(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[u]||(b[u]={}),(h=i[d])&&h[0]===w&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function ta(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ua(a,b,c){for(var d=0,e=b.length;e>d;d++)ga(a,b[d],c);return c}function va(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function wa(a,b,c,d,e,f){return d&&!d[u]&&(d=wa(d)),e&&!e[u]&&(e=wa(e,f)),ia(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ua(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:va(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=va(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=va(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function xa(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=sa(function(a){return a===b},h,!0),l=sa(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[sa(ta(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return wa(i>1&&ta(m),i>1&&ra(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(R,"$1"),c,e>i&&xa(a.slice(i,e)),f>e&&xa(a=a.slice(e)),f>e&&ra(a))}m.push(c)}return ta(m)}function ya(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,m,o,p=0,q="0",r=f&&[],s=[],t=j,u=f||e&&d.find.TAG("*",k),v=w+=null==t?1:Math.random()||.1,x=u.length;for(k&&(j=g!==n&&g);q!==x&&null!=(l=u[q]);q++){if(e&&l){m=0;while(o=a[m++])if(o(l,g,h)){i.push(l);break}k&&(w=v)}c&&((l=!o&&l)&&p--,f&&r.push(l))}if(p+=q,c&&q!==p){m=0;while(o=b[m++])o(r,s,g,h);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=F.call(i));s=va(s)}H.apply(i,s),k&&!f&&s.length>0&&p+b.length>1&&ga.uniqueSort(i)}return k&&(w=v,j=t),r};return c?ia(f):f}return h=ga.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=xa(b[c]),f[u]?d.push(f):e.push(f);f=A(a,ya(e,d)),f.selector=a}return f},i=ga.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(ca,da),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=X.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ca,da),aa.test(j[0].type)&&pa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&ra(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,aa.test(a)&&pa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ja(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ja(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ka("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ja(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ka("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ja(function(a){return null==a.getAttribute("disabled")})||ka(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),ga}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=n.expr.match.needsContext,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^.[^:#\[\.,]*$/;function x(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(w.test(b))return n.filter(b,a,c);b=n.filter(b,a)}return n.grep(a,function(a){return g.call(b,a)>=0!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=this.length,d=[],e=this;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;c>b;b++)if(n.contains(e[b],this))return!0}));for(b=0;c>b;b++)n.find(a,e[b],d);return d=this.pushStack(c>1?n.unique(d):d),d.selector=this.selector?this.selector+" "+a:a,d},filter:function(a){return this.pushStack(x(this,a||[],!1))},not:function(a){return this.pushStack(x(this,a||[],!0))},is:function(a){return!!x(this,"string"==typeof a&&u.test(a)?n(a):a||[],!1).length}});var y,z=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,A=n.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:z.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||y).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:l,!0)),v.test(c[1])&&n.isPlainObject(b))for(c in b)n.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}return d=l.getElementById(c[2]),d&&d.parentNode&&(this.length=1,this[0]=d),this.context=l,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?"undefined"!=typeof y.ready?y.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))};A.prototype=n.fn,y=n(l);var B=/^(?:parents|prev(?:Until|All))/,C={children:!0,contents:!0,next:!0,prev:!0};n.extend({dir:function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&n(a).is(c))break;d.push(a)}return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),n.fn.extend({has:function(a){var b=n(a,this),c=b.length;return this.filter(function(){for(var a=0;c>a;a++)if(n.contains(this,b[a]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=u.test(a)||"string"!=typeof a?n(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.unique(f):f)},index:function(a){return a?"string"==typeof a?g.call(n(a),this[0]):g.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.unique(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function D(a,b){while((a=a[b])&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return n.dir(a,"parentNode")},parentsUntil:function(a,b,c){return n.dir(a,"parentNode",c)},next:function(a){return D(a,"nextSibling")},prev:function(a){return D(a,"previousSibling")},nextAll:function(a){return n.dir(a,"nextSibling")},prevAll:function(a){return n.dir(a,"previousSibling")},nextUntil:function(a,b,c){return n.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return n.dir(a,"previousSibling",c)},siblings:function(a){return n.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return n.sibling(a.firstChild)},contents:function(a){return a.contentDocument||n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(C[a]||n.unique(e),B.test(a)&&e.reverse()),this.pushStack(e)}});var E=/\S+/g,F={};function G(a){var b=F[a]={};return n.each(a.match(E)||[],function(a,c){b[c]=!0}),b}n.Callbacks=function(a){a="string"==typeof a?F[a]||G(a):n.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(b=a.memory&&l,c=!0,g=e||0,e=0,f=h.length,d=!0;h&&f>g;g++)if(h[g].apply(l[0],l[1])===!1&&a.stopOnFalse){b=!1;break}d=!1,h&&(i?i.length&&j(i.shift()):b?h=[]:k.disable())},k={add:function(){if(h){var c=h.length;!function g(b){n.each(b,function(b,c){var d=n.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&g(c)})}(arguments),d?f=h.length:b&&(e=c,j(b))}return this},remove:function(){return h&&n.each(arguments,function(a,b){var c;while((c=n.inArray(b,h,c))>-1)h.splice(c,1),d&&(f>=c&&f--,g>=c&&g--)}),this},has:function(a){return a?n.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],f=0,this},disable:function(){return h=i=b=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,b||k.disable(),this},locked:function(){return!i},fireWith:function(a,b){return!h||c&&!i||(b=b||[],b=[a,b.slice?b.slice():b],d?i.push(b):j(b)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!c}};return k},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&n.isFunction(a.promise)?e:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var H;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0)},ready:function(a){(a===!0?--n.readyWait:n.isReady)||(n.isReady=!0,a!==!0&&--n.readyWait>0||(H.resolveWith(l,[n]),n.fn.triggerHandler&&(n(l).triggerHandler("ready"),n(l).off("ready"))))}});function I(){l.removeEventListener("DOMContentLoaded",I,!1),a.removeEventListener("load",I,!1),n.ready()}n.ready.promise=function(b){return H||(H=n.Deferred(),"complete"===l.readyState?setTimeout(n.ready):(l.addEventListener("DOMContentLoaded",I,!1),a.addEventListener("load",I,!1))),H.promise(b)},n.ready.promise();var J=n.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)n.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f};n.acceptData=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function K(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=n.expando+K.uid++}K.uid=1,K.accepts=n.acceptData,K.prototype={key:function(a){if(!K.accepts(a))return 0;var b={},c=a[this.expando];if(!c){c=K.uid++;try{b[this.expando]={value:c},Object.defineProperties(a,b)}catch(d){b[this.expando]=c,n.extend(a,b)}}return this.cache[c]||(this.cache[c]={}),c},set:function(a,b,c){var d,e=this.key(a),f=this.cache[e];if("string"==typeof b)f[b]=c;else if(n.isEmptyObject(f))n.extend(this.cache[e],b);else for(d in b)f[d]=b[d];return f},get:function(a,b){var c=this.cache[this.key(a)];return void 0===b?c:c[b]},access:function(a,b,c){var d;return void 0===b||b&&"string"==typeof b&&void 0===c?(d=this.get(a,b),void 0!==d?d:this.get(a,n.camelCase(b))):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d,e,f=this.key(a),g=this.cache[f];if(void 0===b)this.cache[f]={};else{n.isArray(b)?d=b.concat(b.map(n.camelCase)):(e=n.camelCase(b),b in g?d=[b,e]:(d=e,d=d in g?[d]:d.match(E)||[])),c=d.length;while(c--)delete g[d[c]]}},hasData:function(a){return!n.isEmptyObject(this.cache[a[this.expando]]||{})},discard:function(a){a[this.expando]&&delete this.cache[a[this.expando]]}};var L=new K,M=new K,N=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,O=/([A-Z])/g;function P(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(O,"-$1").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:N.test(c)?n.parseJSON(c):c}catch(e){}M.set(a,b,c)}else c=void 0;return c}n.extend({hasData:function(a){return M.hasData(a)||L.hasData(a)},data:function(a,b,c){
	return M.access(a,b,c)},removeData:function(a,b){M.remove(a,b)},_data:function(a,b,c){return L.access(a,b,c)},_removeData:function(a,b){L.remove(a,b)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=M.get(f),1===f.nodeType&&!L.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),P(f,d,e[d])));L.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){M.set(this,a)}):J(this,function(b){var c,d=n.camelCase(a);if(f&&void 0===b){if(c=M.get(f,a),void 0!==c)return c;if(c=M.get(f,d),void 0!==c)return c;if(c=P(f,d,void 0),void 0!==c)return c}else this.each(function(){var c=M.get(this,d);M.set(this,d,b),-1!==a.indexOf("-")&&void 0!==c&&M.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){M.remove(this,a)})}}),n.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=L.get(a,b),c&&(!d||n.isArray(c)?d=L.access(a,b,n.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return L.get(a,c)||L.access(a,c,{empty:n.Callbacks("once memory").add(function(){L.remove(a,[b+"queue",c])})})}}),n.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a)})},dequeue:function(a){return this.each(function(){n.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=L.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var Q=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,R=["Top","Right","Bottom","Left"],S=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)},T=/^(?:checkbox|radio)$/i;!function(){var a=l.createDocumentFragment(),b=a.appendChild(l.createElement("div")),c=l.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),k.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",k.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var U="undefined";k.focusinBubbles="onfocusin"in a;var V=/^key/,W=/^(?:mouse|pointer|contextmenu)|click/,X=/^(?:focusinfocus|focusoutblur)$/,Y=/^([^.]*)(?:\.(.+)|)$/;function Z(){return!0}function $(){return!1}function _(){try{return l.activeElement}catch(a){}}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=L.get(a);if(r){c.handler&&(f=c,c=f.handler,e=f.selector),c.guid||(c.guid=n.guid++),(i=r.events)||(i=r.events={}),(g=r.handle)||(g=r.handle=function(b){return typeof n!==U&&n.event.triggered!==b.type?n.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(E)||[""],j=b.length;while(j--)h=Y.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o&&(l=n.event.special[o]||{},o=(e?l.delegateType:l.bindType)||o,l=n.event.special[o]||{},k=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},f),(m=i[o])||(m=i[o]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,p,g)!==!1||a.addEventListener&&a.addEventListener(o,g,!1)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),n.event.global[o]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=L.hasData(a)&&L.get(a);if(r&&(i=r.events)){b=(b||"").match(E)||[""],j=b.length;while(j--)if(h=Y.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=i[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&q!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||n.removeEvent(a,o,r.handle),delete i[o])}else for(o in i)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(i)&&(delete r.handle,L.remove(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,m,o,p=[d||l],q=j.call(b,"type")?b.type:b,r=j.call(b,"namespace")?b.namespace.split("."):[];if(g=h=d=d||l,3!==d.nodeType&&8!==d.nodeType&&!X.test(q+n.event.triggered)&&(q.indexOf(".")>=0&&(r=q.split("."),q=r.shift(),r.sort()),k=q.indexOf(":")<0&&"on"+q,b=b[n.expando]?b:new n.Event(q,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=r.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:n.makeArray(c,[b]),o=n.event.special[q]||{},e||!o.trigger||o.trigger.apply(d,c)!==!1)){if(!e&&!o.noBubble&&!n.isWindow(d)){for(i=o.delegateType||q,X.test(i+q)||(g=g.parentNode);g;g=g.parentNode)p.push(g),h=g;h===(d.ownerDocument||l)&&p.push(h.defaultView||h.parentWindow||a)}f=0;while((g=p[f++])&&!b.isPropagationStopped())b.type=f>1?i:o.bindType||q,m=(L.get(g,"events")||{})[b.type]&&L.get(g,"handle"),m&&m.apply(g,c),m=k&&g[k],m&&m.apply&&n.acceptData(g)&&(b.result=m.apply(g,c),b.result===!1&&b.preventDefault());return b.type=q,e||b.isDefaultPrevented()||o._default&&o._default.apply(p.pop(),c)!==!1||!n.acceptData(d)||k&&n.isFunction(d[q])&&!n.isWindow(d)&&(h=d[k],h&&(d[k]=null),n.event.triggered=q,d[q](),n.event.triggered=void 0,h&&(d[k]=h)),b.result}},dispatch:function(a){a=n.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(L.get(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(g.namespace))&&(a.handleObj=g,a.data=g.data,e=((n.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==e&&(a.result=e)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!==this;i=i.parentNode||this)if(i.disabled!==!0||"click"!==a.type){for(d=[],c=0;h>c;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?n(e,this).index(i)>=0:n.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button;return null==a.pageX&&null!=b.clientX&&(c=a.target.ownerDocument||l,d=c.documentElement,e=c.body,a.pageX=b.clientX+(d&&d.scrollLeft||e&&e.scrollLeft||0)-(d&&d.clientLeft||e&&e.clientLeft||0),a.pageY=b.clientY+(d&&d.scrollTop||e&&e.scrollTop||0)-(d&&d.clientTop||e&&e.clientTop||0)),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},fix:function(a){if(a[n.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=W.test(e)?this.mouseHooks:V.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new n.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=l),3===a.target.nodeType&&(a.target=a.target.parentNode),g.filter?g.filter(a,f):a},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==_()&&this.focus?(this.focus(),!1):void 0},delegateType:"focusin"},blur:{trigger:function(){return this===_()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&n.nodeName(this,"input")?(this.click(),!1):void 0},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=n.extend(new n.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?n.event.trigger(e,null,b):n.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},n.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)},n.Event=function(a,b){return this instanceof n.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?Z:$):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),void(this[n.expando]=!0)):new n.Event(a,b)},n.Event.prototype={isDefaultPrevented:$,isPropagationStopped:$,isImmediatePropagationStopped:$,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=Z,a&&a.preventDefault&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=Z,a&&a.stopPropagation&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=Z,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation()}},n.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!n.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),k.focusinBubbles||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a),!0)};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=L.access(d,b);e||d.addEventListener(a,c,!0),L.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=L.access(d,b)-1;e?L.access(d,b,e):(d.removeEventListener(a,c,!0),L.remove(d,b))}}}),n.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(g in a)this.on(g,b,c,a[g],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=$;else if(!d)return this;return 1===e&&(f=d,d=function(a){return n().off(a),f.apply(this,arguments)},d.guid=f.guid||(f.guid=n.guid++)),this.each(function(){n.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=$),this.each(function(){n.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?n.event.trigger(a,b,c,!0):void 0}});var aa=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,ba=/<([\w:]+)/,ca=/<|&#?\w+;/,da=/<(?:script|style|link)/i,ea=/checked\s*(?:[^=]|=\s*.checked.)/i,fa=/^$|\/(?:java|ecma)script/i,ga=/^true\/(.*)/,ha=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,ia={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ia.optgroup=ia.option,ia.tbody=ia.tfoot=ia.colgroup=ia.caption=ia.thead,ia.th=ia.td;function ja(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function ka(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function la(a){var b=ga.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function ma(a,b){for(var c=0,d=a.length;d>c;c++)L.set(a[c],"globalEval",!b||L.get(b[c],"globalEval"))}function na(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(L.hasData(a)&&(f=L.access(a),g=L.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;d>c;c++)n.event.add(b,e,j[e][c])}M.hasData(a)&&(h=M.access(a),i=n.extend({},h),M.set(b,i))}}function oa(a,b){var c=a.getElementsByTagName?a.getElementsByTagName(b||"*"):a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&n.nodeName(a,b)?n.merge([a],c):c}function pa(a,b){var c=b.nodeName.toLowerCase();"input"===c&&T.test(a.type)?b.checked=a.checked:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}n.extend({clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=n.contains(a.ownerDocument,a);if(!(k.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(g=oa(h),f=oa(a),d=0,e=f.length;e>d;d++)pa(f[d],g[d]);if(b)if(c)for(f=f||oa(a),g=g||oa(h),d=0,e=f.length;e>d;d++)na(f[d],g[d]);else na(a,h);return g=oa(h,"script"),g.length>0&&ma(g,!i&&oa(a,"script")),h},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,k=b.createDocumentFragment(),l=[],m=0,o=a.length;o>m;m++)if(e=a[m],e||0===e)if("object"===n.type(e))n.merge(l,e.nodeType?[e]:e);else if(ca.test(e)){f=f||k.appendChild(b.createElement("div")),g=(ba.exec(e)||["",""])[1].toLowerCase(),h=ia[g]||ia._default,f.innerHTML=h[1]+e.replace(aa,"<$1></$2>")+h[2],j=h[0];while(j--)f=f.lastChild;n.merge(l,f.childNodes),f=k.firstChild,f.textContent=""}else l.push(b.createTextNode(e));k.textContent="",m=0;while(e=l[m++])if((!d||-1===n.inArray(e,d))&&(i=n.contains(e.ownerDocument,e),f=oa(k.appendChild(e),"script"),i&&ma(f),c)){j=0;while(e=f[j++])fa.test(e.type||"")&&c.push(e)}return k},cleanData:function(a){for(var b,c,d,e,f=n.event.special,g=0;void 0!==(c=a[g]);g++){if(n.acceptData(c)&&(e=c[L.expando],e&&(b=L.cache[e]))){if(b.events)for(d in b.events)f[d]?n.event.remove(c,d):n.removeEvent(c,d,b.handle);L.cache[e]&&delete L.cache[e]}delete M.cache[c[M.expando]]}}}),n.fn.extend({text:function(a){return J(this,function(a){return void 0===a?n.text(this):this.empty().each(function(){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&(this.textContent=a)})},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=ja(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=ja(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?n.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||n.cleanData(oa(c)),c.parentNode&&(b&&n.contains(c.ownerDocument,c)&&ma(oa(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(n.cleanData(oa(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return J(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!da.test(a)&&!ia[(ba.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(aa,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(oa(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,n.cleanData(oa(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,l=this.length,m=this,o=l-1,p=a[0],q=n.isFunction(p);if(q||l>1&&"string"==typeof p&&!k.checkClone&&ea.test(p))return this.each(function(c){var d=m.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(l&&(c=n.buildFragment(a,this[0].ownerDocument,!1,this),d=c.firstChild,1===c.childNodes.length&&(c=d),d)){for(f=n.map(oa(c,"script"),ka),g=f.length;l>j;j++)h=c,j!==o&&(h=n.clone(h,!0,!0),g&&n.merge(f,oa(h,"script"))),b.call(this[j],h,j);if(g)for(i=f[f.length-1].ownerDocument,n.map(f,la),j=0;g>j;j++)h=f[j],fa.test(h.type||"")&&!L.access(h,"globalEval")&&n.contains(i,h)&&(h.src?n._evalUrl&&n._evalUrl(h.src):n.globalEval(h.textContent.replace(ha,"")))}return this}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=[],e=n(a),g=e.length-1,h=0;g>=h;h++)c=h===g?this:this.clone(!0),n(e[h])[b](c),f.apply(d,c.get());return this.pushStack(d)}});var qa,ra={};function sa(b,c){var d,e=n(c.createElement(b)).appendTo(c.body),f=a.getDefaultComputedStyle&&(d=a.getDefaultComputedStyle(e[0]))?d.display:n.css(e[0],"display");return e.detach(),f}function ta(a){var b=l,c=ra[a];return c||(c=sa(a,b),"none"!==c&&c||(qa=(qa||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=qa[0].contentDocument,b.write(),b.close(),c=sa(a,b),qa.detach()),ra[a]=c),c}var ua=/^margin/,va=new RegExp("^("+Q+")(?!px)[a-z%]+$","i"),wa=function(b){return b.ownerDocument.defaultView.opener?b.ownerDocument.defaultView.getComputedStyle(b,null):a.getComputedStyle(b,null)};function xa(a,b,c){var d,e,f,g,h=a.style;return c=c||wa(a),c&&(g=c.getPropertyValue(b)||c[b]),c&&(""!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),va.test(g)&&ua.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function ya(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d=l.documentElement,e=l.createElement("div"),f=l.createElement("div");if(f.style){f.style.backgroundClip="content-box",f.cloneNode(!0).style.backgroundClip="",k.clearCloneStyle="content-box"===f.style.backgroundClip,e.style.cssText="border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;position:absolute",e.appendChild(f);function g(){f.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute",f.innerHTML="",d.appendChild(e);var g=a.getComputedStyle(f,null);b="1%"!==g.top,c="4px"===g.width,d.removeChild(e)}a.getComputedStyle&&n.extend(k,{pixelPosition:function(){return g(),b},boxSizingReliable:function(){return null==c&&g(),c},reliableMarginRight:function(){var b,c=f.appendChild(l.createElement("div"));return c.style.cssText=f.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",c.style.marginRight=c.style.width="0",f.style.width="1px",d.appendChild(e),b=!parseFloat(a.getComputedStyle(c,null).marginRight),d.removeChild(e),f.removeChild(c),b}})}}(),n.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var za=/^(none|table(?!-c[ea]).+)/,Aa=new RegExp("^("+Q+")(.*)$","i"),Ba=new RegExp("^([+-])=("+Q+")","i"),Ca={position:"absolute",visibility:"hidden",display:"block"},Da={letterSpacing:"0",fontWeight:"400"},Ea=["Webkit","O","Moz","ms"];function Fa(a,b){if(b in a)return b;var c=b[0].toUpperCase()+b.slice(1),d=b,e=Ea.length;while(e--)if(b=Ea[e]+c,b in a)return b;return d}function Ga(a,b,c){var d=Aa.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Ha(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=n.css(a,c+R[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+R[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+R[f]+"Width",!0,e))):(g+=n.css(a,"padding"+R[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+R[f]+"Width",!0,e)));return g}function Ia(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=wa(a),g="border-box"===n.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=xa(a,b,f),(0>e||null==e)&&(e=a.style[b]),va.test(e))return e;d=g&&(k.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Ha(a,b,c||(g?"border":"content"),d,f)+"px"}function Ja(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=L.get(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&S(d)&&(f[g]=L.access(d,"olddisplay",ta(d.nodeName)))):(e=S(d),"none"===c&&e||L.set(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=xa(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;return b=n.cssProps[h]||(n.cssProps[h]=Fa(i,h)),g=n.cssHooks[b]||n.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=Ba.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(n.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||n.cssNumber[h]||(c+="px"),k.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=Fa(a.style,h)),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=xa(a,b,d)),"normal"===e&&b in Da&&(e=Da[b]),""===c||c?(f=parseFloat(e),c===!0||n.isNumeric(f)?f||0:e):e}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){return c?za.test(n.css(a,"display"))&&0===a.offsetWidth?n.swap(a,Ca,function(){return Ia(a,b,d)}):Ia(a,b,d):void 0},set:function(a,c,d){var e=d&&wa(a);return Ga(a,c,d?Ha(a,b,d,"border-box"===n.css(a,"boxSizing",!1,e),e):0)}}}),n.cssHooks.marginRight=ya(k.reliableMarginRight,function(a,b){return b?n.swap(a,{display:"inline-block"},xa,[a,"marginRight"]):void 0}),n.each({margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+R[d]+b]=f[d]||f[d-2]||f[0];return e}},ua.test(a)||(n.cssHooks[a+b].set=Ga)}),n.fn.extend({css:function(a,b){return J(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=wa(a),e=b.length;e>g;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)},a,b,arguments.length>1)},show:function(){return Ja(this,!0)},hide:function(){return Ja(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){S(this)?n(this).show():n(this).hide()})}});function Ka(a,b,c,d,e){return new Ka.prototype.init(a,b,c,d,e)}n.Tween=Ka,Ka.prototype={constructor:Ka,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px")},cur:function(){var a=Ka.propHooks[this.prop];return a&&a.get?a.get(this):Ka.propHooks._default.get(this)},run:function(a){var b,c=Ka.propHooks[this.prop];return this.options.duration?this.pos=b=n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Ka.propHooks._default.set(this),this}},Ka.prototype.init.prototype=Ka.prototype,Ka.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[n.cssProps[a.prop]]||n.cssHooks[a.prop])?n.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},Ka.propHooks.scrollTop=Ka.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},n.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},n.fx=Ka.prototype.init,n.fx.step={};var La,Ma,Na=/^(?:toggle|show|hide)$/,Oa=new RegExp("^(?:([+-])=|)("+Q+")([a-z%]*)$","i"),Pa=/queueHooks$/,Qa=[Va],Ra={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=Oa.exec(b),f=e&&e[3]||(n.cssNumber[a]?"":"px"),g=(n.cssNumber[a]||"px"!==f&&+d)&&Oa.exec(n.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,n.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function Sa(){return setTimeout(function(){La=void 0}),La=n.now()}function Ta(a,b){var c,d=0,e={height:a};for(b=b?1:0;4>d;d+=2-b)c=R[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function Ua(a,b,c){for(var d,e=(Ra[b]||[]).concat(Ra["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function Va(a,b,c){var d,e,f,g,h,i,j,k,l=this,m={},o=a.style,p=a.nodeType&&S(a),q=L.get(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,l.always(function(){l.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=n.css(a,"display"),k="none"===j?L.get(a,"olddisplay")||ta(a.nodeName):j,"inline"===k&&"none"===n.css(a,"float")&&(o.display="inline-block")),c.overflow&&(o.overflow="hidden",l.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],Na.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}m[d]=q&&q[d]||n.style(a,d)}else j=void 0;if(n.isEmptyObject(m))"inline"===("none"===j?ta(a.nodeName):j)&&(o.display=j);else{q?"hidden"in q&&(p=q.hidden):q=L.access(a,"fxshow",{}),f&&(q.hidden=!p),p?n(a).show():l.done(function(){n(a).hide()}),l.done(function(){var b;L.remove(a,"fxshow");for(b in m)n.style(a,b,m[b])});for(d in m)g=Ua(p?q[d]:0,d,l),d in q||(q[d]=g.start,p&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function Wa(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=n.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function Xa(a,b,c){var d,e,f=0,g=Qa.length,h=n.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=La||Sa(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:La||Sa(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(Wa(k,j.opts.specialEasing);g>f;f++)if(d=Qa[f].call(j,a,k,j.opts))return d;return n.map(k,Ua,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(Xa,{tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],Ra[c]=Ra[c]||[],Ra[c].unshift(b)},prefilter:function(a,b){b?Qa.unshift(a):Qa.push(a)}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue)},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(S).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=Xa(this,n.extend({},a),f);(e||L.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=L.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&Pa.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&n.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=L.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(Ta(b,!0),a,d,e)}}),n.each({slideDown:Ta("show"),slideUp:Ta("hide"),slideToggle:Ta("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),n.timers=[],n.fx.tick=function(){var a,b=0,c=n.timers;for(La=n.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||n.fx.stop(),La=void 0},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop()},n.fx.interval=13,n.fx.start=function(){Ma||(Ma=setInterval(n.fx.tick,n.fx.interval))},n.fx.stop=function(){clearInterval(Ma),Ma=null},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(a,b){return a=n.fx?n.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a=l.createElement("input"),b=l.createElement("select"),c=b.appendChild(l.createElement("option"));a.type="checkbox",k.checkOn=""!==a.value,k.optSelected=c.selected,b.disabled=!0,k.optDisabled=!c.disabled,a=l.createElement("input"),a.value="t",a.type="radio",k.radioValue="t"===a.value}();var Ya,Za,$a=n.expr.attrHandle;n.fn.extend({attr:function(a,b){return J(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a)})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===U?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),d=n.attrHooks[b]||(n.expr.match.bool.test(b)?Za:Ya)),
	void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=n.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void n.removeAttr(a,b))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(E);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)&&(a[d]=!1),a.removeAttribute(c)},attrHooks:{type:{set:function(a,b){if(!k.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),Za={set:function(a,b,c){return b===!1?n.removeAttr(a,c):a.setAttribute(c,c),c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=$a[b]||n.find.attr;$a[b]=function(a,b,d){var e,f;return d||(f=$a[b],$a[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,$a[b]=f),e}});var _a=/^(?:input|select|textarea|button)$/i;n.fn.extend({prop:function(a,b){return J(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[n.propFix[a]||a]})}}),n.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!n.isXMLDoc(a),f&&(b=n.propFix[b]||b,e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){return a.hasAttribute("tabindex")||_a.test(a.nodeName)||a.href?a.tabIndex:-1}}}}),k.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this});var ab=/[\t\r\n\f]/g;n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h="string"==typeof a&&a,i=0,j=this.length;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ab," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=n.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0===arguments.length||"string"==typeof a&&a,i=0,j=this.length;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ab," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?n.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(n.isFunction(a)?function(c){n(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=n(this),f=a.match(E)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===U||"boolean"===c)&&(this.className&&L.set(this,"__className__",this.className),this.className=this.className||a===!1?"":L.get(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(ab," ").indexOf(b)>=0)return!0;return!1}});var bb=/\r/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(bb,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){var b=n.find.attr(a,"value");return null!=b?b:n.trim(n.text(a))}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(k.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=n.inArray(d.value,f)>=0)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){return n.isArray(b)?a.checked=n.inArray(n(a).val(),b)>=0:void 0}},k.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var cb=n.now(),db=/\?/;n.parseJSON=function(a){return JSON.parse(a+"")},n.parseXML=function(a){var b,c;if(!a||"string"!=typeof a)return null;try{c=new DOMParser,b=c.parseFromString(a,"text/xml")}catch(d){b=void 0}return(!b||b.getElementsByTagName("parsererror").length)&&n.error("Invalid XML: "+a),b};var eb=/#.*$/,fb=/([?&])_=[^&]*/,gb=/^(.*?):[ \t]*([^\r\n]*)$/gm,hb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,ib=/^(?:GET|HEAD)$/,jb=/^\/\//,kb=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,lb={},mb={},nb="*/".concat("*"),ob=a.location.href,pb=kb.exec(ob.toLowerCase())||[];function qb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(E)||[];if(n.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function rb(a,b,c,d){var e={},f=a===mb;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function sb(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&n.extend(!0,a,d),a}function tb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function ub(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:ob,type:"GET",isLocal:hb.test(pb[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":nb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?sb(sb(a,n.ajaxSettings),b):sb(n.ajaxSettings,a)},ajaxPrefilter:qb(lb),ajaxTransport:qb(mb),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=n.ajaxSetup({},b),l=k.context||k,m=k.context&&(l.nodeType||l.jquery)?n(l):n.event,o=n.Deferred(),p=n.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!f){f={};while(b=gb.exec(e))f[b[1].toLowerCase()]=b[2]}b=f[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?e:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return c&&c.abort(b),x(0,b),this}};if(o.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||ob)+"").replace(eb,"").replace(jb,pb[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=n.trim(k.dataType||"*").toLowerCase().match(E)||[""],null==k.crossDomain&&(h=kb.exec(k.url.toLowerCase()),k.crossDomain=!(!h||h[1]===pb[1]&&h[2]===pb[2]&&(h[3]||("http:"===h[1]?"80":"443"))===(pb[3]||("http:"===pb[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=n.param(k.data,k.traditional)),rb(lb,k,b,v),2===t)return v;i=n.event&&k.global,i&&0===n.active++&&n.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!ib.test(k.type),d=k.url,k.hasContent||(k.data&&(d=k.url+=(db.test(d)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=fb.test(d)?d.replace(fb,"$1_="+cb++):d+(db.test(d)?"&":"?")+"_="+cb++)),k.ifModified&&(n.lastModified[d]&&v.setRequestHeader("If-Modified-Since",n.lastModified[d]),n.etag[d]&&v.setRequestHeader("If-None-Match",n.etag[d])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+nb+"; q=0.01":""):k.accepts["*"]);for(j in k.headers)v.setRequestHeader(j,k.headers[j]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(j in{success:1,error:1,complete:1})v[j](k[j]);if(c=rb(mb,k,b,v)){v.readyState=1,i&&m.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,c.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,f,h){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),c=void 0,e=h||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,f&&(u=tb(k,v,f)),u=ub(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(n.lastModified[d]=w),w=v.getResponseHeader("etag"),w&&(n.etag[d]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?o.resolveWith(l,[r,x,v]):o.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,i&&m.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),i&&(m.trigger("ajaxComplete",[v,k]),--n.active||n.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},n.fn.extend({wrapAll:function(a){var b;return n.isFunction(a)?this.each(function(b){n(this).wrapAll(a.call(this,b))}):(this[0]&&(b=n(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this)},wrapInner:function(a){return this.each(n.isFunction(a)?function(b){n(this).wrapInner(a.call(this,b))}:function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes)}).end()}}),n.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0},n.expr.filters.visible=function(a){return!n.expr.filters.hidden(a)};var vb=/%20/g,wb=/\[\]$/,xb=/\r?\n/g,yb=/^(?:submit|button|image|reset|file)$/i,zb=/^(?:input|select|textarea|keygen)/i;function Ab(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||wb.test(a)?d(a,e):Ab(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)Ab(a+"["+e+"]",b[e],c,d)}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value)});else for(c in a)Ab(c,a[c],b,e);return d.join("&").replace(vb,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&zb.test(this.nodeName)&&!yb.test(a)&&(this.checked||!T.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return{name:b.name,value:a.replace(xb,"\r\n")}}):{name:b.name,value:c.replace(xb,"\r\n")}}).get()}}),n.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(a){}};var Bb=0,Cb={},Db={0:200,1223:204},Eb=n.ajaxSettings.xhr();a.attachEvent&&a.attachEvent("onunload",function(){for(var a in Cb)Cb[a]()}),k.cors=!!Eb&&"withCredentials"in Eb,k.ajax=Eb=!!Eb,n.ajaxTransport(function(a){var b;return k.cors||Eb&&!a.crossDomain?{send:function(c,d){var e,f=a.xhr(),g=++Bb;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)f.setRequestHeader(e,c[e]);b=function(a){return function(){b&&(delete Cb[g],b=f.onload=f.onerror=null,"abort"===a?f.abort():"error"===a?d(f.status,f.statusText):d(Db[f.status]||f.status,f.statusText,"string"==typeof f.responseText?{text:f.responseText}:void 0,f.getAllResponseHeaders()))}},f.onload=b(),f.onerror=b("error"),b=Cb[g]=b("abort");try{f.send(a.hasContent&&a.data||null)}catch(h){if(b)throw h}},abort:function(){b&&b()}}:void 0}),n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(d,e){b=n("<script>").prop({async:!0,charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&e("error"===a.type?404:200,a.type)}),l.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Fb=[],Gb=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Fb.pop()||n.expando+"_"+cb++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Gb.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Gb.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Gb,"$1"+e):b.jsonp!==!1&&(b.url+=(db.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Fb.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||l;var d=v.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=n.buildFragment([a],b,e),e&&e.length&&n(e).remove(),n.merge([],d.childNodes))};var Hb=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&Hb)return Hb.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=n.trim(a.slice(h)),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&n.ajax({url:a,type:e,dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,f||[a.responseText,b,a])}),this},n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)}}),n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};var Ib=a.document.documentElement;function Jb(a){return n.isWindow(a)?a:9===a.nodeType&&a.defaultView}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b)});var b,c,d=this[0],e={top:0,left:0},f=d&&d.ownerDocument;if(f)return b=f.documentElement,n.contains(b,d)?(typeof d.getBoundingClientRect!==U&&(e=d.getBoundingClientRect()),c=Jb(f),{top:e.top+c.pageYOffset-b.clientTop,left:e.left+c.pageXOffset-b.clientLeft}):e},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===n.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(d=a.offset()),d.top+=n.css(a[0],"borderTopWidth",!0),d.left+=n.css(a[0],"borderLeftWidth",!0)),{top:b.top-d.top-n.css(c,"marginTop",!0),left:b.left-d.left-n.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||Ib;while(a&&!n.nodeName(a,"html")&&"static"===n.css(a,"position"))a=a.offsetParent;return a||Ib})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(b,c){var d="pageYOffset"===c;n.fn[b]=function(e){return J(this,function(b,e,f){var g=Jb(b);return void 0===f?g?g[c]:b[e]:void(g?g.scrollTo(d?a.pageXOffset:f,d?f:a.pageYOffset):b[e]=f)},b,e,arguments.length,null)}}),n.each(["top","left"],function(a,b){n.cssHooks[b]=ya(k.pixelPosition,function(a,c){return c?(c=xa(a,b),va.test(c)?n(a).position()[b]+"px":c):void 0})}),n.each({Height:"height",Width:"width"},function(a,b){n.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return J(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),n.fn.size=function(){return this.length},n.fn.andSelf=n.fn.addBack,"function"=="function"&&__webpack_require__(15)&&!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function(){return n}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));var Kb=a.jQuery,Lb=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=Lb),b&&a.jQuery===n&&(a.jQuery=Kb),n},typeof b===U&&(a.jQuery=a.$=n),n});


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	//Ref : http://jsfiddle.net/JxYca/3/
	var EventManager = function() {
	    this.initialize();
	};
	EventManager.prototype = {
	    initialize: function() {
	        //declare listeners as an object
	        this.listeners = {};
	    },
	    // public methods
	    addListener: function(event, fn) {
	        if (!this.listeners[event]) {
	            this.listeners[event] = [];
	        }
	        if (fn instanceof Function) {
	            this.listeners[event].push(fn);
	        }
	        return this;
	    },
	    dispatchEvent: function(event, params) {
	        // loop through listeners array
	        for (var index = 0, l = this.listeners[event].length; index < l; index++) {
	            // execute matching 'event' - loop through all indices and
	            // when ev is found, execute
	            this.listeners[event][index].call(window, params);
	        }
	    },
	    removeListener: function(event, fn) {
	        // split array 1 item after our listener
	        // shorten to remove it
	        // join the two arrays back together
	        if (this.listeners[event]) {
	            for (var i = 0, l = this.listners[event].length; i < l; i++) {
	                if (this.listners[event][i] === fn) {
	                    this.listners[event].slice(i, 1);
	                    break;
	                }
	            }
	        }
	    }
	};

	module.exports = EventManager;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
	web socket util for AnyProxy
	https://github.com/alibaba/anyproxy
	*/

	/*
	{
		baseUrl : ""
	}
	config
	config.baseUrl
	config.port
	config.onOpen
	config.onClose
	config.onError
	config.onGetData
	config.onGetUpdate
	config.onGetBody
	config.onError
	*/
	function anyproxy_wsUtil(config){
		config = config || {};
		if(!WebSocket){
			throw (new Error("webSocket is not available on this browser"));
		}

		var self = this;
		var baseUrl    = config.baseUrl || "127.0.0.1",
			socketPort = config.port || 8003;

		var dataSocket = new WebSocket("ws://" + baseUrl + ":" + socketPort);

		self.bodyCbMap = {};
		dataSocket.onmessage = function(event){
			config.onGetData && config.onGetData.call(self,event.data);

			try{
				var data    = JSON.parse(event.data),
					type    = data.type,
					content = data.content,
					reqRef  = data.reqRef;
			}catch(e){
				config.onError && config.onError.call(self, new Error("failed to parse socket data - " + e.toString()) );
			}

			if(type == "update"){
				config.onGetUpdate && config.onGetUpdate.call(self, content);

			}else if(type == "body"){
				config.onGetBody && config.onGetBody.call(self, content, reqRef);

				if(data.reqRef && self.bodyCbMap[reqRef]){
					self.bodyCbMap[reqRef].call(self,content);
				}
			}
		}

		dataSocket.onopen = function(e){
			config.onOpen && config.onOpen.call(self,e);
		}
		dataSocket.onclose = function(e){
			config.onClose && config.onClose.call(self,e);
		}
		dataSocket.onerror = function(e){
			config.onError && config.onError.call(self,e);
		}

		self.dataSocket = dataSocket;
	};

	anyproxy_wsUtil.prototype.send = function(data){
		if(typeof data == "object"){
			data = JSON.stringify(data);
		}
		this.dataSocket.send(data);
	};

	anyproxy_wsUtil.prototype.reqBody = function(id,callback){
		if(!id) return;

		var payload = {
			type   : "reqBody",
			id     : id
		};
		if(callback){
			var reqRef = "r_" + Math.random()*100 + "_" + (new Date().getTime());
			payload.reqRef = reqRef;
			this.bodyCbMap[reqRef] = callback;
		}
		this.send(payload);
	};

	if(true){
		module.exports = anyproxy_wsUtil;
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var require;var require;/**
	 * React v0.13.3
	 */
	(function(f){if(true){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.React = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return require(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule React
	 */

	/* globals __REACT_DEVTOOLS_GLOBAL_HOOK__*/

	'use strict';

	var EventPluginUtils = _dereq_(19);
	var ReactChildren = _dereq_(32);
	var ReactComponent = _dereq_(34);
	var ReactClass = _dereq_(33);
	var ReactContext = _dereq_(38);
	var ReactCurrentOwner = _dereq_(39);
	var ReactElement = _dereq_(57);
	var ReactElementValidator = _dereq_(58);
	var ReactDOM = _dereq_(40);
	var ReactDOMTextComponent = _dereq_(51);
	var ReactDefaultInjection = _dereq_(54);
	var ReactInstanceHandles = _dereq_(66);
	var ReactMount = _dereq_(70);
	var ReactPerf = _dereq_(75);
	var ReactPropTypes = _dereq_(78);
	var ReactReconciler = _dereq_(81);
	var ReactServerRendering = _dereq_(84);

	var assign = _dereq_(27);
	var findDOMNode = _dereq_(117);
	var onlyChild = _dereq_(144);

	ReactDefaultInjection.inject();

	var createElement = ReactElement.createElement;
	var createFactory = ReactElement.createFactory;
	var cloneElement = ReactElement.cloneElement;

	if (true) {
	  createElement = ReactElementValidator.createElement;
	  createFactory = ReactElementValidator.createFactory;
	  cloneElement = ReactElementValidator.cloneElement;
	}

	var render = ReactPerf.measure('React', 'render', ReactMount.render);

	var React = {
	  Children: {
	    map: ReactChildren.map,
	    forEach: ReactChildren.forEach,
	    count: ReactChildren.count,
	    only: onlyChild
	  },
	  Component: ReactComponent,
	  DOM: ReactDOM,
	  PropTypes: ReactPropTypes,
	  initializeTouchEvents: function(shouldUseTouch) {
	    EventPluginUtils.useTouchEvents = shouldUseTouch;
	  },
	  createClass: ReactClass.createClass,
	  createElement: createElement,
	  cloneElement: cloneElement,
	  createFactory: createFactory,
	  createMixin: function(mixin) {
	    // Currently a noop. Will be used to validate and trace mixins.
	    return mixin;
	  },
	  constructAndRenderComponent: ReactMount.constructAndRenderComponent,
	  constructAndRenderComponentByID: ReactMount.constructAndRenderComponentByID,
	  findDOMNode: findDOMNode,
	  render: render,
	  renderToString: ReactServerRendering.renderToString,
	  renderToStaticMarkup: ReactServerRendering.renderToStaticMarkup,
	  unmountComponentAtNode: ReactMount.unmountComponentAtNode,
	  isValidElement: ReactElement.isValidElement,
	  withContext: ReactContext.withContext,

	  // Hook for JSX spread, don't use this for anything else.
	  __spread: assign
	};

	// Inject the runtime into a devtools global hook regardless of browser.
	// Allows for debugging when the hook is injected on the page.
	if (
	  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
	  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject === 'function') {
	  __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
	    CurrentOwner: ReactCurrentOwner,
	    InstanceHandles: ReactInstanceHandles,
	    Mount: ReactMount,
	    Reconciler: ReactReconciler,
	    TextComponent: ReactDOMTextComponent
	  });
	}

	if (true) {
	  var ExecutionEnvironment = _dereq_(21);
	  if (ExecutionEnvironment.canUseDOM && window.top === window.self) {

	    // If we're in Chrome, look for the devtools marker and provide a download
	    // link if not installed.
	    if (navigator.userAgent.indexOf('Chrome') > -1) {
	      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
	        console.debug(
	          'Download the React DevTools for a better development experience: ' +
	          'https://fb.me/react-devtools'
	        );
	      }
	    }

	    var expectedFeatures = [
	      // shims
	      Array.isArray,
	      Array.prototype.every,
	      Array.prototype.forEach,
	      Array.prototype.indexOf,
	      Array.prototype.map,
	      Date.now,
	      Function.prototype.bind,
	      Object.keys,
	      String.prototype.split,
	      String.prototype.trim,

	      // shams
	      Object.create,
	      Object.freeze
	    ];

	    for (var i = 0; i < expectedFeatures.length; i++) {
	      if (!expectedFeatures[i]) {
	        console.error(
	          'One or more ES5 shim/shams expected by React are not available: ' +
	          'https://fb.me/react-warning-polyfills'
	        );
	        break;
	      }
	    }
	  }
	}

	React.version = '0.13.3';

	module.exports = React;

	},{"117":117,"144":144,"19":19,"21":21,"27":27,"32":32,"33":33,"34":34,"38":38,"39":39,"40":40,"51":51,"54":54,"57":57,"58":58,"66":66,"70":70,"75":75,"78":78,"81":81,"84":84}],2:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule AutoFocusMixin
	 * @typechecks static-only
	 */

	'use strict';

	var focusNode = _dereq_(119);

	var AutoFocusMixin = {
	  componentDidMount: function() {
	    if (this.props.autoFocus) {
	      focusNode(this.getDOMNode());
	    }
	  }
	};

	module.exports = AutoFocusMixin;

	},{"119":119}],3:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015 Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule BeforeInputEventPlugin
	 * @typechecks static-only
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var EventPropagators = _dereq_(20);
	var ExecutionEnvironment = _dereq_(21);
	var FallbackCompositionState = _dereq_(22);
	var SyntheticCompositionEvent = _dereq_(93);
	var SyntheticInputEvent = _dereq_(97);

	var keyOf = _dereq_(141);

	var END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
	var START_KEYCODE = 229;

	var canUseCompositionEvent = (
	  ExecutionEnvironment.canUseDOM &&
	  'CompositionEvent' in window
	);

	var documentMode = null;
	if (ExecutionEnvironment.canUseDOM && 'documentMode' in document) {
	  documentMode = document.documentMode;
	}

	// Webkit offers a very useful `textInput` event that can be used to
	// directly represent `beforeInput`. The IE `textinput` event is not as
	// useful, so we don't use it.
	var canUseTextInputEvent = (
	  ExecutionEnvironment.canUseDOM &&
	  'TextEvent' in window &&
	  !documentMode &&
	  !isPresto()
	);

	// In IE9+, we have access to composition events, but the data supplied
	// by the native compositionend event may be incorrect. Japanese ideographic
	// spaces, for instance (\u3000) are not recorded correctly.
	var useFallbackCompositionData = (
	  ExecutionEnvironment.canUseDOM &&
	  (
	    (!canUseCompositionEvent || documentMode && documentMode > 8 && documentMode <= 11)
	  )
	);

	/**
	 * Opera <= 12 includes TextEvent in window, but does not fire
	 * text input events. Rely on keypress instead.
	 */
	function isPresto() {
	  var opera = window.opera;
	  return (
	    typeof opera === 'object' &&
	    typeof opera.version === 'function' &&
	    parseInt(opera.version(), 10) <= 12
	  );
	}

	var SPACEBAR_CODE = 32;
	var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);

	var topLevelTypes = EventConstants.topLevelTypes;

	// Events and their corresponding property names.
	var eventTypes = {
	  beforeInput: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onBeforeInput: null}),
	      captured: keyOf({onBeforeInputCapture: null})
	    },
	    dependencies: [
	      topLevelTypes.topCompositionEnd,
	      topLevelTypes.topKeyPress,
	      topLevelTypes.topTextInput,
	      topLevelTypes.topPaste
	    ]
	  },
	  compositionEnd: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onCompositionEnd: null}),
	      captured: keyOf({onCompositionEndCapture: null})
	    },
	    dependencies: [
	      topLevelTypes.topBlur,
	      topLevelTypes.topCompositionEnd,
	      topLevelTypes.topKeyDown,
	      topLevelTypes.topKeyPress,
	      topLevelTypes.topKeyUp,
	      topLevelTypes.topMouseDown
	    ]
	  },
	  compositionStart: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onCompositionStart: null}),
	      captured: keyOf({onCompositionStartCapture: null})
	    },
	    dependencies: [
	      topLevelTypes.topBlur,
	      topLevelTypes.topCompositionStart,
	      topLevelTypes.topKeyDown,
	      topLevelTypes.topKeyPress,
	      topLevelTypes.topKeyUp,
	      topLevelTypes.topMouseDown
	    ]
	  },
	  compositionUpdate: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onCompositionUpdate: null}),
	      captured: keyOf({onCompositionUpdateCapture: null})
	    },
	    dependencies: [
	      topLevelTypes.topBlur,
	      topLevelTypes.topCompositionUpdate,
	      topLevelTypes.topKeyDown,
	      topLevelTypes.topKeyPress,
	      topLevelTypes.topKeyUp,
	      topLevelTypes.topMouseDown
	    ]
	  }
	};

	// Track whether we've ever handled a keypress on the space key.
	var hasSpaceKeypress = false;

	/**
	 * Return whether a native keypress event is assumed to be a command.
	 * This is required because Firefox fires `keypress` events for key commands
	 * (cut, copy, select-all, etc.) even though no character is inserted.
	 */
	function isKeypressCommand(nativeEvent) {
	  return (
	    (nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) &&
	    // ctrlKey && altKey is equivalent to AltGr, and is not a command.
	    !(nativeEvent.ctrlKey && nativeEvent.altKey)
	  );
	}


	/**
	 * Translate native top level events into event types.
	 *
	 * @param {string} topLevelType
	 * @return {object}
	 */
	function getCompositionEventType(topLevelType) {
	  switch (topLevelType) {
	    case topLevelTypes.topCompositionStart:
	      return eventTypes.compositionStart;
	    case topLevelTypes.topCompositionEnd:
	      return eventTypes.compositionEnd;
	    case topLevelTypes.topCompositionUpdate:
	      return eventTypes.compositionUpdate;
	  }
	}

	/**
	 * Does our fallback best-guess model think this event signifies that
	 * composition has begun?
	 *
	 * @param {string} topLevelType
	 * @param {object} nativeEvent
	 * @return {boolean}
	 */
	function isFallbackCompositionStart(topLevelType, nativeEvent) {
	  return (
	    topLevelType === topLevelTypes.topKeyDown &&
	    nativeEvent.keyCode === START_KEYCODE
	  );
	}

	/**
	 * Does our fallback mode think that this event is the end of composition?
	 *
	 * @param {string} topLevelType
	 * @param {object} nativeEvent
	 * @return {boolean}
	 */
	function isFallbackCompositionEnd(topLevelType, nativeEvent) {
	  switch (topLevelType) {
	    case topLevelTypes.topKeyUp:
	      // Command keys insert or clear IME input.
	      return (END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1);
	    case topLevelTypes.topKeyDown:
	      // Expect IME keyCode on each keydown. If we get any other
	      // code we must have exited earlier.
	      return (nativeEvent.keyCode !== START_KEYCODE);
	    case topLevelTypes.topKeyPress:
	    case topLevelTypes.topMouseDown:
	    case topLevelTypes.topBlur:
	      // Events are not possible without cancelling IME.
	      return true;
	    default:
	      return false;
	  }
	}

	/**
	 * Google Input Tools provides composition data via a CustomEvent,
	 * with the `data` property populated in the `detail` object. If this
	 * is available on the event object, use it. If not, this is a plain
	 * composition event and we have nothing special to extract.
	 *
	 * @param {object} nativeEvent
	 * @return {?string}
	 */
	function getDataFromCustomEvent(nativeEvent) {
	  var detail = nativeEvent.detail;
	  if (typeof detail === 'object' && 'data' in detail) {
	    return detail.data;
	  }
	  return null;
	}

	// Track the current IME composition fallback object, if any.
	var currentComposition = null;

	/**
	 * @param {string} topLevelType Record from `EventConstants`.
	 * @param {DOMEventTarget} topLevelTarget The listening component root node.
	 * @param {string} topLevelTargetID ID of `topLevelTarget`.
	 * @param {object} nativeEvent Native browser event.
	 * @return {?object} A SyntheticCompositionEvent.
	 */
	function extractCompositionEvent(
	  topLevelType,
	  topLevelTarget,
	  topLevelTargetID,
	  nativeEvent
	) {
	  var eventType;
	  var fallbackData;

	  if (canUseCompositionEvent) {
	    eventType = getCompositionEventType(topLevelType);
	  } else if (!currentComposition) {
	    if (isFallbackCompositionStart(topLevelType, nativeEvent)) {
	      eventType = eventTypes.compositionStart;
	    }
	  } else if (isFallbackCompositionEnd(topLevelType, nativeEvent)) {
	    eventType = eventTypes.compositionEnd;
	  }

	  if (!eventType) {
	    return null;
	  }

	  if (useFallbackCompositionData) {
	    // The current composition is stored statically and must not be
	    // overwritten while composition continues.
	    if (!currentComposition && eventType === eventTypes.compositionStart) {
	      currentComposition = FallbackCompositionState.getPooled(topLevelTarget);
	    } else if (eventType === eventTypes.compositionEnd) {
	      if (currentComposition) {
	        fallbackData = currentComposition.getData();
	      }
	    }
	  }

	  var event = SyntheticCompositionEvent.getPooled(
	    eventType,
	    topLevelTargetID,
	    nativeEvent
	  );

	  if (fallbackData) {
	    // Inject data generated from fallback path into the synthetic event.
	    // This matches the property of native CompositionEventInterface.
	    event.data = fallbackData;
	  } else {
	    var customData = getDataFromCustomEvent(nativeEvent);
	    if (customData !== null) {
	      event.data = customData;
	    }
	  }

	  EventPropagators.accumulateTwoPhaseDispatches(event);
	  return event;
	}

	/**
	 * @param {string} topLevelType Record from `EventConstants`.
	 * @param {object} nativeEvent Native browser event.
	 * @return {?string} The string corresponding to this `beforeInput` event.
	 */
	function getNativeBeforeInputChars(topLevelType, nativeEvent) {
	  switch (topLevelType) {
	    case topLevelTypes.topCompositionEnd:
	      return getDataFromCustomEvent(nativeEvent);
	    case topLevelTypes.topKeyPress:
	      /**
	       * If native `textInput` events are available, our goal is to make
	       * use of them. However, there is a special case: the spacebar key.
	       * In Webkit, preventing default on a spacebar `textInput` event
	       * cancels character insertion, but it *also* causes the browser
	       * to fall back to its default spacebar behavior of scrolling the
	       * page.
	       *
	       * Tracking at:
	       * https://code.google.com/p/chromium/issues/detail?id=355103
	       *
	       * To avoid this issue, use the keypress event as if no `textInput`
	       * event is available.
	       */
	      var which = nativeEvent.which;
	      if (which !== SPACEBAR_CODE) {
	        return null;
	      }

	      hasSpaceKeypress = true;
	      return SPACEBAR_CHAR;

	    case topLevelTypes.topTextInput:
	      // Record the characters to be added to the DOM.
	      var chars = nativeEvent.data;

	      // If it's a spacebar character, assume that we have already handled
	      // it at the keypress level and bail immediately. Android Chrome
	      // doesn't give us keycodes, so we need to blacklist it.
	      if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
	        return null;
	      }

	      return chars;

	    default:
	      // For other native event types, do nothing.
	      return null;
	  }
	}

	/**
	 * For browsers that do not provide the `textInput` event, extract the
	 * appropriate string to use for SyntheticInputEvent.
	 *
	 * @param {string} topLevelType Record from `EventConstants`.
	 * @param {object} nativeEvent Native browser event.
	 * @return {?string} The fallback string for this `beforeInput` event.
	 */
	function getFallbackBeforeInputChars(topLevelType, nativeEvent) {
	  // If we are currently composing (IME) and using a fallback to do so,
	  // try to extract the composed characters from the fallback object.
	  if (currentComposition) {
	    if (
	      topLevelType === topLevelTypes.topCompositionEnd ||
	      isFallbackCompositionEnd(topLevelType, nativeEvent)
	    ) {
	      var chars = currentComposition.getData();
	      FallbackCompositionState.release(currentComposition);
	      currentComposition = null;
	      return chars;
	    }
	    return null;
	  }

	  switch (topLevelType) {
	    case topLevelTypes.topPaste:
	      // If a paste event occurs after a keypress, throw out the input
	      // chars. Paste events should not lead to BeforeInput events.
	      return null;
	    case topLevelTypes.topKeyPress:
	      /**
	       * As of v27, Firefox may fire keypress events even when no character
	       * will be inserted. A few possibilities:
	       *
	       * - `which` is `0`. Arrow keys, Esc key, etc.
	       *
	       * - `which` is the pressed key code, but no char is available.
	       *   Ex: 'AltGr + d` in Polish. There is no modified character for
	       *   this key combination and no character is inserted into the
	       *   document, but FF fires the keypress for char code `100` anyway.
	       *   No `input` event will occur.
	       *
	       * - `which` is the pressed key code, but a command combination is
	       *   being used. Ex: `Cmd+C`. No character is inserted, and no
	       *   `input` event will occur.
	       */
	      if (nativeEvent.which && !isKeypressCommand(nativeEvent)) {
	        return String.fromCharCode(nativeEvent.which);
	      }
	      return null;
	    case topLevelTypes.topCompositionEnd:
	      return useFallbackCompositionData ? null : nativeEvent.data;
	    default:
	      return null;
	  }
	}

	/**
	 * Extract a SyntheticInputEvent for `beforeInput`, based on either native
	 * `textInput` or fallback behavior.
	 *
	 * @param {string} topLevelType Record from `EventConstants`.
	 * @param {DOMEventTarget} topLevelTarget The listening component root node.
	 * @param {string} topLevelTargetID ID of `topLevelTarget`.
	 * @param {object} nativeEvent Native browser event.
	 * @return {?object} A SyntheticInputEvent.
	 */
	function extractBeforeInputEvent(
	  topLevelType,
	  topLevelTarget,
	  topLevelTargetID,
	  nativeEvent
	) {
	  var chars;

	  if (canUseTextInputEvent) {
	    chars = getNativeBeforeInputChars(topLevelType, nativeEvent);
	  } else {
	    chars = getFallbackBeforeInputChars(topLevelType, nativeEvent);
	  }

	  // If no characters are being inserted, no BeforeInput event should
	  // be fired.
	  if (!chars) {
	    return null;
	  }

	  var event = SyntheticInputEvent.getPooled(
	    eventTypes.beforeInput,
	    topLevelTargetID,
	    nativeEvent
	  );

	  event.data = chars;
	  EventPropagators.accumulateTwoPhaseDispatches(event);
	  return event;
	}

	/**
	 * Create an `onBeforeInput` event to match
	 * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
	 *
	 * This event plugin is based on the native `textInput` event
	 * available in Chrome, Safari, Opera, and IE. This event fires after
	 * `onKeyPress` and `onCompositionEnd`, but before `onInput`.
	 *
	 * `beforeInput` is spec'd but not implemented in any browsers, and
	 * the `input` event does not provide any useful information about what has
	 * actually been added, contrary to the spec. Thus, `textInput` is the best
	 * available event to identify the characters that have actually been inserted
	 * into the target node.
	 *
	 * This plugin is also responsible for emitting `composition` events, thus
	 * allowing us to share composition fallback code for both `beforeInput` and
	 * `composition` event types.
	 */
	var BeforeInputEventPlugin = {

	  eventTypes: eventTypes,

	  /**
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {DOMEventTarget} topLevelTarget The listening component root node.
	   * @param {string} topLevelTargetID ID of `topLevelTarget`.
	   * @param {object} nativeEvent Native browser event.
	   * @return {*} An accumulation of synthetic events.
	   * @see {EventPluginHub.extractEvents}
	   */
	  extractEvents: function(
	    topLevelType,
	    topLevelTarget,
	    topLevelTargetID,
	    nativeEvent
	  ) {
	    return [
	      extractCompositionEvent(
	        topLevelType,
	        topLevelTarget,
	        topLevelTargetID,
	        nativeEvent
	      ),
	      extractBeforeInputEvent(
	        topLevelType,
	        topLevelTarget,
	        topLevelTargetID,
	        nativeEvent
	      )
	    ];
	  }
	};

	module.exports = BeforeInputEventPlugin;

	},{"141":141,"15":15,"20":20,"21":21,"22":22,"93":93,"97":97}],4:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule CSSProperty
	 */

	'use strict';

	/**
	 * CSS properties which accept numbers but are not in units of "px".
	 */
	var isUnitlessNumber = {
	  boxFlex: true,
	  boxFlexGroup: true,
	  columnCount: true,
	  flex: true,
	  flexGrow: true,
	  flexPositive: true,
	  flexShrink: true,
	  flexNegative: true,
	  fontWeight: true,
	  lineClamp: true,
	  lineHeight: true,
	  opacity: true,
	  order: true,
	  orphans: true,
	  widows: true,
	  zIndex: true,
	  zoom: true,

	  // SVG-related properties
	  fillOpacity: true,
	  strokeDashoffset: true,
	  strokeOpacity: true,
	  strokeWidth: true
	};

	/**
	 * @param {string} prefix vendor-specific prefix, eg: Webkit
	 * @param {string} key style name, eg: transitionDuration
	 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
	 * WebkitTransitionDuration
	 */
	function prefixKey(prefix, key) {
	  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
	}

	/**
	 * Support style names that may come passed in prefixed by adding permutations
	 * of vendor prefixes.
	 */
	var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

	// Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
	// infinite loop, because it iterates over the newly added props too.
	Object.keys(isUnitlessNumber).forEach(function(prop) {
	  prefixes.forEach(function(prefix) {
	    isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
	  });
	});

	/**
	 * Most style properties can be unset by doing .style[prop] = '' but IE8
	 * doesn't like doing that with shorthand properties so for the properties that
	 * IE8 breaks on, which are listed here, we instead unset each of the
	 * individual properties. See http://bugs.jquery.com/ticket/12385.
	 * The 4-value 'clock' properties like margin, padding, border-width seem to
	 * behave without any problems. Curiously, list-style works too without any
	 * special prodding.
	 */
	var shorthandPropertyExpansions = {
	  background: {
	    backgroundImage: true,
	    backgroundPosition: true,
	    backgroundRepeat: true,
	    backgroundColor: true
	  },
	  border: {
	    borderWidth: true,
	    borderStyle: true,
	    borderColor: true
	  },
	  borderBottom: {
	    borderBottomWidth: true,
	    borderBottomStyle: true,
	    borderBottomColor: true
	  },
	  borderLeft: {
	    borderLeftWidth: true,
	    borderLeftStyle: true,
	    borderLeftColor: true
	  },
	  borderRight: {
	    borderRightWidth: true,
	    borderRightStyle: true,
	    borderRightColor: true
	  },
	  borderTop: {
	    borderTopWidth: true,
	    borderTopStyle: true,
	    borderTopColor: true
	  },
	  font: {
	    fontStyle: true,
	    fontVariant: true,
	    fontWeight: true,
	    fontSize: true,
	    lineHeight: true,
	    fontFamily: true
	  }
	};

	var CSSProperty = {
	  isUnitlessNumber: isUnitlessNumber,
	  shorthandPropertyExpansions: shorthandPropertyExpansions
	};

	module.exports = CSSProperty;

	},{}],5:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule CSSPropertyOperations
	 * @typechecks static-only
	 */

	'use strict';

	var CSSProperty = _dereq_(4);
	var ExecutionEnvironment = _dereq_(21);

	var camelizeStyleName = _dereq_(108);
	var dangerousStyleValue = _dereq_(113);
	var hyphenateStyleName = _dereq_(133);
	var memoizeStringOnly = _dereq_(143);
	var warning = _dereq_(154);

	var processStyleName = memoizeStringOnly(function(styleName) {
	  return hyphenateStyleName(styleName);
	});

	var styleFloatAccessor = 'cssFloat';
	if (ExecutionEnvironment.canUseDOM) {
	  // IE8 only supports accessing cssFloat (standard) as styleFloat
	  if (document.documentElement.style.cssFloat === undefined) {
	    styleFloatAccessor = 'styleFloat';
	  }
	}

	if (true) {
	  // 'msTransform' is correct, but the other prefixes should be capitalized
	  var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;

	  // style values shouldn't contain a semicolon
	  var badStyleValueWithSemicolonPattern = /;\s*$/;

	  var warnedStyleNames = {};
	  var warnedStyleValues = {};

	  var warnHyphenatedStyleName = function(name) {
	    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
	      return;
	    }

	    warnedStyleNames[name] = true;
	    (true ? warning(
	      false,
	      'Unsupported style property %s. Did you mean %s?',
	      name,
	      camelizeStyleName(name)
	    ) : null);
	  };

	  var warnBadVendoredStyleName = function(name) {
	    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
	      return;
	    }

	    warnedStyleNames[name] = true;
	    (true ? warning(
	      false,
	      'Unsupported vendor-prefixed style property %s. Did you mean %s?',
	      name,
	      name.charAt(0).toUpperCase() + name.slice(1)
	    ) : null);
	  };

	  var warnStyleValueWithSemicolon = function(name, value) {
	    if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
	      return;
	    }

	    warnedStyleValues[value] = true;
	    (true ? warning(
	      false,
	      'Style property values shouldn\'t contain a semicolon. ' +
	      'Try "%s: %s" instead.',
	      name,
	      value.replace(badStyleValueWithSemicolonPattern, '')
	    ) : null);
	  };

	  /**
	   * @param {string} name
	   * @param {*} value
	   */
	  var warnValidStyle = function(name, value) {
	    if (name.indexOf('-') > -1) {
	      warnHyphenatedStyleName(name);
	    } else if (badVendoredStyleNamePattern.test(name)) {
	      warnBadVendoredStyleName(name);
	    } else if (badStyleValueWithSemicolonPattern.test(value)) {
	      warnStyleValueWithSemicolon(name, value);
	    }
	  };
	}

	/**
	 * Operations for dealing with CSS properties.
	 */
	var CSSPropertyOperations = {

	  /**
	   * Serializes a mapping of style properties for use as inline styles:
	   *
	   *   > createMarkupForStyles({width: '200px', height: 0})
	   *   "width:200px;height:0;"
	   *
	   * Undefined values are ignored so that declarative programming is easier.
	   * The result should be HTML-escaped before insertion into the DOM.
	   *
	   * @param {object} styles
	   * @return {?string}
	   */
	  createMarkupForStyles: function(styles) {
	    var serialized = '';
	    for (var styleName in styles) {
	      if (!styles.hasOwnProperty(styleName)) {
	        continue;
	      }
	      var styleValue = styles[styleName];
	      if (true) {
	        warnValidStyle(styleName, styleValue);
	      }
	      if (styleValue != null) {
	        serialized += processStyleName(styleName) + ':';
	        serialized += dangerousStyleValue(styleName, styleValue) + ';';
	      }
	    }
	    return serialized || null;
	  },

	  /**
	   * Sets the value for multiple styles on a node.  If a value is specified as
	   * '' (empty string), the corresponding style property will be unset.
	   *
	   * @param {DOMElement} node
	   * @param {object} styles
	   */
	  setValueForStyles: function(node, styles) {
	    var style = node.style;
	    for (var styleName in styles) {
	      if (!styles.hasOwnProperty(styleName)) {
	        continue;
	      }
	      if (true) {
	        warnValidStyle(styleName, styles[styleName]);
	      }
	      var styleValue = dangerousStyleValue(styleName, styles[styleName]);
	      if (styleName === 'float') {
	        styleName = styleFloatAccessor;
	      }
	      if (styleValue) {
	        style[styleName] = styleValue;
	      } else {
	        var expansion = CSSProperty.shorthandPropertyExpansions[styleName];
	        if (expansion) {
	          // Shorthand property that IE8 won't like unsetting, so unset each
	          // component to placate it
	          for (var individualStyleName in expansion) {
	            style[individualStyleName] = '';
	          }
	        } else {
	          style[styleName] = '';
	        }
	      }
	    }
	  }

	};

	module.exports = CSSPropertyOperations;

	},{"108":108,"113":113,"133":133,"143":143,"154":154,"21":21,"4":4}],6:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule CallbackQueue
	 */

	'use strict';

	var PooledClass = _dereq_(28);

	var assign = _dereq_(27);
	var invariant = _dereq_(135);

	/**
	 * A specialized pseudo-event module to help keep track of components waiting to
	 * be notified when their DOM representations are available for use.
	 *
	 * This implements `PooledClass`, so you should never need to instantiate this.
	 * Instead, use `CallbackQueue.getPooled()`.
	 *
	 * @class ReactMountReady
	 * @implements PooledClass
	 * @internal
	 */
	function CallbackQueue() {
	  this._callbacks = null;
	  this._contexts = null;
	}

	assign(CallbackQueue.prototype, {

	  /**
	   * Enqueues a callback to be invoked when `notifyAll` is invoked.
	   *
	   * @param {function} callback Invoked when `notifyAll` is invoked.
	   * @param {?object} context Context to call `callback` with.
	   * @internal
	   */
	  enqueue: function(callback, context) {
	    this._callbacks = this._callbacks || [];
	    this._contexts = this._contexts || [];
	    this._callbacks.push(callback);
	    this._contexts.push(context);
	  },

	  /**
	   * Invokes all enqueued callbacks and clears the queue. This is invoked after
	   * the DOM representation of a component has been created or updated.
	   *
	   * @internal
	   */
	  notifyAll: function() {
	    var callbacks = this._callbacks;
	    var contexts = this._contexts;
	    if (callbacks) {
	      (true ? invariant(
	        callbacks.length === contexts.length,
	        'Mismatched list of contexts in callback queue'
	      ) : invariant(callbacks.length === contexts.length));
	      this._callbacks = null;
	      this._contexts = null;
	      for (var i = 0, l = callbacks.length; i < l; i++) {
	        callbacks[i].call(contexts[i]);
	      }
	      callbacks.length = 0;
	      contexts.length = 0;
	    }
	  },

	  /**
	   * Resets the internal queue.
	   *
	   * @internal
	   */
	  reset: function() {
	    this._callbacks = null;
	    this._contexts = null;
	  },

	  /**
	   * `PooledClass` looks for this.
	   */
	  destructor: function() {
	    this.reset();
	  }

	});

	PooledClass.addPoolingTo(CallbackQueue);

	module.exports = CallbackQueue;

	},{"135":135,"27":27,"28":28}],7:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ChangeEventPlugin
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var EventPluginHub = _dereq_(17);
	var EventPropagators = _dereq_(20);
	var ExecutionEnvironment = _dereq_(21);
	var ReactUpdates = _dereq_(87);
	var SyntheticEvent = _dereq_(95);

	var isEventSupported = _dereq_(136);
	var isTextInputElement = _dereq_(138);
	var keyOf = _dereq_(141);

	var topLevelTypes = EventConstants.topLevelTypes;

	var eventTypes = {
	  change: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onChange: null}),
	      captured: keyOf({onChangeCapture: null})
	    },
	    dependencies: [
	      topLevelTypes.topBlur,
	      topLevelTypes.topChange,
	      topLevelTypes.topClick,
	      topLevelTypes.topFocus,
	      topLevelTypes.topInput,
	      topLevelTypes.topKeyDown,
	      topLevelTypes.topKeyUp,
	      topLevelTypes.topSelectionChange
	    ]
	  }
	};

	/**
	 * For IE shims
	 */
	var activeElement = null;
	var activeElementID = null;
	var activeElementValue = null;
	var activeElementValueProp = null;

	/**
	 * SECTION: handle `change` event
	 */
	function shouldUseChangeEvent(elem) {
	  return (
	    elem.nodeName === 'SELECT' ||
	    (elem.nodeName === 'INPUT' && elem.type === 'file')
	  );
	}

	var doesChangeEventBubble = false;
	if (ExecutionEnvironment.canUseDOM) {
	  // See `handleChange` comment below
	  doesChangeEventBubble = isEventSupported('change') && (
	    (!('documentMode' in document) || document.documentMode > 8)
	  );
	}

	function manualDispatchChangeEvent(nativeEvent) {
	  var event = SyntheticEvent.getPooled(
	    eventTypes.change,
	    activeElementID,
	    nativeEvent
	  );
	  EventPropagators.accumulateTwoPhaseDispatches(event);

	  // If change and propertychange bubbled, we'd just bind to it like all the
	  // other events and have it go through ReactBrowserEventEmitter. Since it
	  // doesn't, we manually listen for the events and so we have to enqueue and
	  // process the abstract event manually.
	  //
	  // Batching is necessary here in order to ensure that all event handlers run
	  // before the next rerender (including event handlers attached to ancestor
	  // elements instead of directly on the input). Without this, controlled
	  // components don't work properly in conjunction with event bubbling because
	  // the component is rerendered and the value reverted before all the event
	  // handlers can run. See https://github.com/facebook/react/issues/708.
	  ReactUpdates.batchedUpdates(runEventInBatch, event);
	}

	function runEventInBatch(event) {
	  EventPluginHub.enqueueEvents(event);
	  EventPluginHub.processEventQueue();
	}

	function startWatchingForChangeEventIE8(target, targetID) {
	  activeElement = target;
	  activeElementID = targetID;
	  activeElement.attachEvent('onchange', manualDispatchChangeEvent);
	}

	function stopWatchingForChangeEventIE8() {
	  if (!activeElement) {
	    return;
	  }
	  activeElement.detachEvent('onchange', manualDispatchChangeEvent);
	  activeElement = null;
	  activeElementID = null;
	}

	function getTargetIDForChangeEvent(
	    topLevelType,
	    topLevelTarget,
	    topLevelTargetID) {
	  if (topLevelType === topLevelTypes.topChange) {
	    return topLevelTargetID;
	  }
	}
	function handleEventsForChangeEventIE8(
	    topLevelType,
	    topLevelTarget,
	    topLevelTargetID) {
	  if (topLevelType === topLevelTypes.topFocus) {
	    // stopWatching() should be a noop here but we call it just in case we
	    // missed a blur event somehow.
	    stopWatchingForChangeEventIE8();
	    startWatchingForChangeEventIE8(topLevelTarget, topLevelTargetID);
	  } else if (topLevelType === topLevelTypes.topBlur) {
	    stopWatchingForChangeEventIE8();
	  }
	}


	/**
	 * SECTION: handle `input` event
	 */
	var isInputEventSupported = false;
	if (ExecutionEnvironment.canUseDOM) {
	  // IE9 claims to support the input event but fails to trigger it when
	  // deleting text, so we ignore its input events
	  isInputEventSupported = isEventSupported('input') && (
	    (!('documentMode' in document) || document.documentMode > 9)
	  );
	}

	/**
	 * (For old IE.) Replacement getter/setter for the `value` property that gets
	 * set on the active element.
	 */
	var newValueProp =  {
	  get: function() {
	    return activeElementValueProp.get.call(this);
	  },
	  set: function(val) {
	    // Cast to a string so we can do equality checks.
	    activeElementValue = '' + val;
	    activeElementValueProp.set.call(this, val);
	  }
	};

	/**
	 * (For old IE.) Starts tracking propertychange events on the passed-in element
	 * and override the value property so that we can distinguish user events from
	 * value changes in JS.
	 */
	function startWatchingForValueChange(target, targetID) {
	  activeElement = target;
	  activeElementID = targetID;
	  activeElementValue = target.value;
	  activeElementValueProp = Object.getOwnPropertyDescriptor(
	    target.constructor.prototype,
	    'value'
	  );

	  Object.defineProperty(activeElement, 'value', newValueProp);
	  activeElement.attachEvent('onpropertychange', handlePropertyChange);
	}

	/**
	 * (For old IE.) Removes the event listeners from the currently-tracked element,
	 * if any exists.
	 */
	function stopWatchingForValueChange() {
	  if (!activeElement) {
	    return;
	  }

	  // delete restores the original property definition
	  delete activeElement.value;
	  activeElement.detachEvent('onpropertychange', handlePropertyChange);

	  activeElement = null;
	  activeElementID = null;
	  activeElementValue = null;
	  activeElementValueProp = null;
	}

	/**
	 * (For old IE.) Handles a propertychange event, sending a `change` event if
	 * the value of the active element has changed.
	 */
	function handlePropertyChange(nativeEvent) {
	  if (nativeEvent.propertyName !== 'value') {
	    return;
	  }
	  var value = nativeEvent.srcElement.value;
	  if (value === activeElementValue) {
	    return;
	  }
	  activeElementValue = value;

	  manualDispatchChangeEvent(nativeEvent);
	}

	/**
	 * If a `change` event should be fired, returns the target's ID.
	 */
	function getTargetIDForInputEvent(
	    topLevelType,
	    topLevelTarget,
	    topLevelTargetID) {
	  if (topLevelType === topLevelTypes.topInput) {
	    // In modern browsers (i.e., not IE8 or IE9), the input event is exactly
	    // what we want so fall through here and trigger an abstract event
	    return topLevelTargetID;
	  }
	}

	// For IE8 and IE9.
	function handleEventsForInputEventIE(
	    topLevelType,
	    topLevelTarget,
	    topLevelTargetID) {
	  if (topLevelType === topLevelTypes.topFocus) {
	    // In IE8, we can capture almost all .value changes by adding a
	    // propertychange handler and looking for events with propertyName
	    // equal to 'value'
	    // In IE9, propertychange fires for most input events but is buggy and
	    // doesn't fire when text is deleted, but conveniently, selectionchange
	    // appears to fire in all of the remaining cases so we catch those and
	    // forward the event if the value has changed
	    // In either case, we don't want to call the event handler if the value
	    // is changed from JS so we redefine a setter for `.value` that updates
	    // our activeElementValue variable, allowing us to ignore those changes
	    //
	    // stopWatching() should be a noop here but we call it just in case we
	    // missed a blur event somehow.
	    stopWatchingForValueChange();
	    startWatchingForValueChange(topLevelTarget, topLevelTargetID);
	  } else if (topLevelType === topLevelTypes.topBlur) {
	    stopWatchingForValueChange();
	  }
	}

	// For IE8 and IE9.
	function getTargetIDForInputEventIE(
	    topLevelType,
	    topLevelTarget,
	    topLevelTargetID) {
	  if (topLevelType === topLevelTypes.topSelectionChange ||
	      topLevelType === topLevelTypes.topKeyUp ||
	      topLevelType === topLevelTypes.topKeyDown) {
	    // On the selectionchange event, the target is just document which isn't
	    // helpful for us so just check activeElement instead.
	    //
	    // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
	    // propertychange on the first input event after setting `value` from a
	    // script and fires only keydown, keypress, keyup. Catching keyup usually
	    // gets it and catching keydown lets us fire an event for the first
	    // keystroke if user does a key repeat (it'll be a little delayed: right
	    // before the second keystroke). Other input methods (e.g., paste) seem to
	    // fire selectionchange normally.
	    if (activeElement && activeElement.value !== activeElementValue) {
	      activeElementValue = activeElement.value;
	      return activeElementID;
	    }
	  }
	}


	/**
	 * SECTION: handle `click` event
	 */
	function shouldUseClickEvent(elem) {
	  // Use the `click` event to detect changes to checkbox and radio inputs.
	  // This approach works across all browsers, whereas `change` does not fire
	  // until `blur` in IE8.
	  return (
	    elem.nodeName === 'INPUT' &&
	    (elem.type === 'checkbox' || elem.type === 'radio')
	  );
	}

	function getTargetIDForClickEvent(
	    topLevelType,
	    topLevelTarget,
	    topLevelTargetID) {
	  if (topLevelType === topLevelTypes.topClick) {
	    return topLevelTargetID;
	  }
	}

	/**
	 * This plugin creates an `onChange` event that normalizes change events
	 * across form elements. This event fires at a time when it's possible to
	 * change the element's value without seeing a flicker.
	 *
	 * Supported elements are:
	 * - input (see `isTextInputElement`)
	 * - textarea
	 * - select
	 */
	var ChangeEventPlugin = {

	  eventTypes: eventTypes,

	  /**
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {DOMEventTarget} topLevelTarget The listening component root node.
	   * @param {string} topLevelTargetID ID of `topLevelTarget`.
	   * @param {object} nativeEvent Native browser event.
	   * @return {*} An accumulation of synthetic events.
	   * @see {EventPluginHub.extractEvents}
	   */
	  extractEvents: function(
	      topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      nativeEvent) {

	    var getTargetIDFunc, handleEventFunc;
	    if (shouldUseChangeEvent(topLevelTarget)) {
	      if (doesChangeEventBubble) {
	        getTargetIDFunc = getTargetIDForChangeEvent;
	      } else {
	        handleEventFunc = handleEventsForChangeEventIE8;
	      }
	    } else if (isTextInputElement(topLevelTarget)) {
	      if (isInputEventSupported) {
	        getTargetIDFunc = getTargetIDForInputEvent;
	      } else {
	        getTargetIDFunc = getTargetIDForInputEventIE;
	        handleEventFunc = handleEventsForInputEventIE;
	      }
	    } else if (shouldUseClickEvent(topLevelTarget)) {
	      getTargetIDFunc = getTargetIDForClickEvent;
	    }

	    if (getTargetIDFunc) {
	      var targetID = getTargetIDFunc(
	        topLevelType,
	        topLevelTarget,
	        topLevelTargetID
	      );
	      if (targetID) {
	        var event = SyntheticEvent.getPooled(
	          eventTypes.change,
	          targetID,
	          nativeEvent
	        );
	        EventPropagators.accumulateTwoPhaseDispatches(event);
	        return event;
	      }
	    }

	    if (handleEventFunc) {
	      handleEventFunc(
	        topLevelType,
	        topLevelTarget,
	        topLevelTargetID
	      );
	    }
	  }

	};

	module.exports = ChangeEventPlugin;

	},{"136":136,"138":138,"141":141,"15":15,"17":17,"20":20,"21":21,"87":87,"95":95}],8:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ClientReactRootIndex
	 * @typechecks
	 */

	'use strict';

	var nextReactRootIndex = 0;

	var ClientReactRootIndex = {
	  createReactRootIndex: function() {
	    return nextReactRootIndex++;
	  }
	};

	module.exports = ClientReactRootIndex;

	},{}],9:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule DOMChildrenOperations
	 * @typechecks static-only
	 */

	'use strict';

	var Danger = _dereq_(12);
	var ReactMultiChildUpdateTypes = _dereq_(72);

	var setTextContent = _dereq_(149);
	var invariant = _dereq_(135);

	/**
	 * Inserts `childNode` as a child of `parentNode` at the `index`.
	 *
	 * @param {DOMElement} parentNode Parent node in which to insert.
	 * @param {DOMElement} childNode Child node to insert.
	 * @param {number} index Index at which to insert the child.
	 * @internal
	 */
	function insertChildAt(parentNode, childNode, index) {
	  // By exploiting arrays returning `undefined` for an undefined index, we can
	  // rely exclusively on `insertBefore(node, null)` instead of also using
	  // `appendChild(node)`. However, using `undefined` is not allowed by all
	  // browsers so we must replace it with `null`.
	  parentNode.insertBefore(
	    childNode,
	    parentNode.childNodes[index] || null
	  );
	}

	/**
	 * Operations for updating with DOM children.
	 */
	var DOMChildrenOperations = {

	  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,

	  updateTextContent: setTextContent,

	  /**
	   * Updates a component's children by processing a series of updates. The
	   * update configurations are each expected to have a `parentNode` property.
	   *
	   * @param {array<object>} updates List of update configurations.
	   * @param {array<string>} markupList List of markup strings.
	   * @internal
	   */
	  processUpdates: function(updates, markupList) {
	    var update;
	    // Mapping from parent IDs to initial child orderings.
	    var initialChildren = null;
	    // List of children that will be moved or removed.
	    var updatedChildren = null;

	    for (var i = 0; i < updates.length; i++) {
	      update = updates[i];
	      if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING ||
	          update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
	        var updatedIndex = update.fromIndex;
	        var updatedChild = update.parentNode.childNodes[updatedIndex];
	        var parentID = update.parentID;

	        (true ? invariant(
	          updatedChild,
	          'processUpdates(): Unable to find child %s of element. This ' +
	          'probably means the DOM was unexpectedly mutated (e.g., by the ' +
	          'browser), usually due to forgetting a <tbody> when using tables, ' +
	          'nesting tags like <form>, <p>, or <a>, or using non-SVG elements ' +
	          'in an <svg> parent. Try inspecting the child nodes of the element ' +
	          'with React ID `%s`.',
	          updatedIndex,
	          parentID
	        ) : invariant(updatedChild));

	        initialChildren = initialChildren || {};
	        initialChildren[parentID] = initialChildren[parentID] || [];
	        initialChildren[parentID][updatedIndex] = updatedChild;

	        updatedChildren = updatedChildren || [];
	        updatedChildren.push(updatedChild);
	      }
	    }

	    var renderedMarkup = Danger.dangerouslyRenderMarkup(markupList);

	    // Remove updated children first so that `toIndex` is consistent.
	    if (updatedChildren) {
	      for (var j = 0; j < updatedChildren.length; j++) {
	        updatedChildren[j].parentNode.removeChild(updatedChildren[j]);
	      }
	    }

	    for (var k = 0; k < updates.length; k++) {
	      update = updates[k];
	      switch (update.type) {
	        case ReactMultiChildUpdateTypes.INSERT_MARKUP:
	          insertChildAt(
	            update.parentNode,
	            renderedMarkup[update.markupIndex],
	            update.toIndex
	          );
	          break;
	        case ReactMultiChildUpdateTypes.MOVE_EXISTING:
	          insertChildAt(
	            update.parentNode,
	            initialChildren[update.parentID][update.fromIndex],
	            update.toIndex
	          );
	          break;
	        case ReactMultiChildUpdateTypes.TEXT_CONTENT:
	          setTextContent(
	            update.parentNode,
	            update.textContent
	          );
	          break;
	        case ReactMultiChildUpdateTypes.REMOVE_NODE:
	          // Already removed by the for-loop above.
	          break;
	      }
	    }
	  }

	};

	module.exports = DOMChildrenOperations;

	},{"12":12,"135":135,"149":149,"72":72}],10:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule DOMProperty
	 * @typechecks static-only
	 */

	/*jslint bitwise: true */

	'use strict';

	var invariant = _dereq_(135);

	function checkMask(value, bitmask) {
	  return (value & bitmask) === bitmask;
	}

	var DOMPropertyInjection = {
	  /**
	   * Mapping from normalized, camelcased property names to a configuration that
	   * specifies how the associated DOM property should be accessed or rendered.
	   */
	  MUST_USE_ATTRIBUTE: 0x1,
	  MUST_USE_PROPERTY: 0x2,
	  HAS_SIDE_EFFECTS: 0x4,
	  HAS_BOOLEAN_VALUE: 0x8,
	  HAS_NUMERIC_VALUE: 0x10,
	  HAS_POSITIVE_NUMERIC_VALUE: 0x20 | 0x10,
	  HAS_OVERLOADED_BOOLEAN_VALUE: 0x40,

	  /**
	   * Inject some specialized knowledge about the DOM. This takes a config object
	   * with the following properties:
	   *
	   * isCustomAttribute: function that given an attribute name will return true
	   * if it can be inserted into the DOM verbatim. Useful for data-* or aria-*
	   * attributes where it's impossible to enumerate all of the possible
	   * attribute names,
	   *
	   * Properties: object mapping DOM property name to one of the
	   * DOMPropertyInjection constants or null. If your attribute isn't in here,
	   * it won't get written to the DOM.
	   *
	   * DOMAttributeNames: object mapping React attribute name to the DOM
	   * attribute name. Attribute names not specified use the **lowercase**
	   * normalized name.
	   *
	   * DOMPropertyNames: similar to DOMAttributeNames but for DOM properties.
	   * Property names not specified use the normalized name.
	   *
	   * DOMMutationMethods: Properties that require special mutation methods. If
	   * `value` is undefined, the mutation method should unset the property.
	   *
	   * @param {object} domPropertyConfig the config as described above.
	   */
	  injectDOMPropertyConfig: function(domPropertyConfig) {
	    var Properties = domPropertyConfig.Properties || {};
	    var DOMAttributeNames = domPropertyConfig.DOMAttributeNames || {};
	    var DOMPropertyNames = domPropertyConfig.DOMPropertyNames || {};
	    var DOMMutationMethods = domPropertyConfig.DOMMutationMethods || {};

	    if (domPropertyConfig.isCustomAttribute) {
	      DOMProperty._isCustomAttributeFunctions.push(
	        domPropertyConfig.isCustomAttribute
	      );
	    }

	    for (var propName in Properties) {
	      (true ? invariant(
	        !DOMProperty.isStandardName.hasOwnProperty(propName),
	        'injectDOMPropertyConfig(...): You\'re trying to inject DOM property ' +
	        '\'%s\' which has already been injected. You may be accidentally ' +
	        'injecting the same DOM property config twice, or you may be ' +
	        'injecting two configs that have conflicting property names.',
	        propName
	      ) : invariant(!DOMProperty.isStandardName.hasOwnProperty(propName)));

	      DOMProperty.isStandardName[propName] = true;

	      var lowerCased = propName.toLowerCase();
	      DOMProperty.getPossibleStandardName[lowerCased] = propName;

	      if (DOMAttributeNames.hasOwnProperty(propName)) {
	        var attributeName = DOMAttributeNames[propName];
	        DOMProperty.getPossibleStandardName[attributeName] = propName;
	        DOMProperty.getAttributeName[propName] = attributeName;
	      } else {
	        DOMProperty.getAttributeName[propName] = lowerCased;
	      }

	      DOMProperty.getPropertyName[propName] =
	        DOMPropertyNames.hasOwnProperty(propName) ?
	          DOMPropertyNames[propName] :
	          propName;

	      if (DOMMutationMethods.hasOwnProperty(propName)) {
	        DOMProperty.getMutationMethod[propName] = DOMMutationMethods[propName];
	      } else {
	        DOMProperty.getMutationMethod[propName] = null;
	      }

	      var propConfig = Properties[propName];
	      DOMProperty.mustUseAttribute[propName] =
	        checkMask(propConfig, DOMPropertyInjection.MUST_USE_ATTRIBUTE);
	      DOMProperty.mustUseProperty[propName] =
	        checkMask(propConfig, DOMPropertyInjection.MUST_USE_PROPERTY);
	      DOMProperty.hasSideEffects[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_SIDE_EFFECTS);
	      DOMProperty.hasBooleanValue[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_BOOLEAN_VALUE);
	      DOMProperty.hasNumericValue[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_NUMERIC_VALUE);
	      DOMProperty.hasPositiveNumericValue[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_POSITIVE_NUMERIC_VALUE);
	      DOMProperty.hasOverloadedBooleanValue[propName] =
	        checkMask(propConfig, DOMPropertyInjection.HAS_OVERLOADED_BOOLEAN_VALUE);

	      (true ? invariant(
	        !DOMProperty.mustUseAttribute[propName] ||
	          !DOMProperty.mustUseProperty[propName],
	        'DOMProperty: Cannot require using both attribute and property: %s',
	        propName
	      ) : invariant(!DOMProperty.mustUseAttribute[propName] ||
	        !DOMProperty.mustUseProperty[propName]));
	      (true ? invariant(
	        DOMProperty.mustUseProperty[propName] ||
	          !DOMProperty.hasSideEffects[propName],
	        'DOMProperty: Properties that have side effects must use property: %s',
	        propName
	      ) : invariant(DOMProperty.mustUseProperty[propName] ||
	        !DOMProperty.hasSideEffects[propName]));
	      (true ? invariant(
	        !!DOMProperty.hasBooleanValue[propName] +
	          !!DOMProperty.hasNumericValue[propName] +
	          !!DOMProperty.hasOverloadedBooleanValue[propName] <= 1,
	        'DOMProperty: Value can be one of boolean, overloaded boolean, or ' +
	        'numeric value, but not a combination: %s',
	        propName
	      ) : invariant(!!DOMProperty.hasBooleanValue[propName] +
	        !!DOMProperty.hasNumericValue[propName] +
	        !!DOMProperty.hasOverloadedBooleanValue[propName] <= 1));
	    }
	  }
	};
	var defaultValueCache = {};

	/**
	 * DOMProperty exports lookup objects that can be used like functions:
	 *
	 *   > DOMProperty.isValid['id']
	 *   true
	 *   > DOMProperty.isValid['foobar']
	 *   undefined
	 *
	 * Although this may be confusing, it performs better in general.
	 *
	 * @see http://jsperf.com/key-exists
	 * @see http://jsperf.com/key-missing
	 */
	var DOMProperty = {

	  ID_ATTRIBUTE_NAME: 'data-reactid',

	  /**
	   * Checks whether a property name is a standard property.
	   * @type {Object}
	   */
	  isStandardName: {},

	  /**
	   * Mapping from lowercase property names to the properly cased version, used
	   * to warn in the case of missing properties.
	   * @type {Object}
	   */
	  getPossibleStandardName: {},

	  /**
	   * Mapping from normalized names to attribute names that differ. Attribute
	   * names are used when rendering markup or with `*Attribute()`.
	   * @type {Object}
	   */
	  getAttributeName: {},

	  /**
	   * Mapping from normalized names to properties on DOM node instances.
	   * (This includes properties that mutate due to external factors.)
	   * @type {Object}
	   */
	  getPropertyName: {},

	  /**
	   * Mapping from normalized names to mutation methods. This will only exist if
	   * mutation cannot be set simply by the property or `setAttribute()`.
	   * @type {Object}
	   */
	  getMutationMethod: {},

	  /**
	   * Whether the property must be accessed and mutated as an object property.
	   * @type {Object}
	   */
	  mustUseAttribute: {},

	  /**
	   * Whether the property must be accessed and mutated using `*Attribute()`.
	   * (This includes anything that fails `<propName> in <element>`.)
	   * @type {Object}
	   */
	  mustUseProperty: {},

	  /**
	   * Whether or not setting a value causes side effects such as triggering
	   * resources to be loaded or text selection changes. We must ensure that
	   * the value is only set if it has changed.
	   * @type {Object}
	   */
	  hasSideEffects: {},

	  /**
	   * Whether the property should be removed when set to a falsey value.
	   * @type {Object}
	   */
	  hasBooleanValue: {},

	  /**
	   * Whether the property must be numeric or parse as a
	   * numeric and should be removed when set to a falsey value.
	   * @type {Object}
	   */
	  hasNumericValue: {},

	  /**
	   * Whether the property must be positive numeric or parse as a positive
	   * numeric and should be removed when set to a falsey value.
	   * @type {Object}
	   */
	  hasPositiveNumericValue: {},

	  /**
	   * Whether the property can be used as a flag as well as with a value. Removed
	   * when strictly equal to false; present without a value when strictly equal
	   * to true; present with a value otherwise.
	   * @type {Object}
	   */
	  hasOverloadedBooleanValue: {},

	  /**
	   * All of the isCustomAttribute() functions that have been injected.
	   */
	  _isCustomAttributeFunctions: [],

	  /**
	   * Checks whether a property name is a custom attribute.
	   * @method
	   */
	  isCustomAttribute: function(attributeName) {
	    for (var i = 0; i < DOMProperty._isCustomAttributeFunctions.length; i++) {
	      var isCustomAttributeFn = DOMProperty._isCustomAttributeFunctions[i];
	      if (isCustomAttributeFn(attributeName)) {
	        return true;
	      }
	    }
	    return false;
	  },

	  /**
	   * Returns the default property value for a DOM property (i.e., not an
	   * attribute). Most default values are '' or false, but not all. Worse yet,
	   * some (in particular, `type`) vary depending on the type of element.
	   *
	   * TODO: Is it better to grab all the possible properties when creating an
	   * element to avoid having to create the same element twice?
	   */
	  getDefaultValueForProperty: function(nodeName, prop) {
	    var nodeDefaults = defaultValueCache[nodeName];
	    var testElement;
	    if (!nodeDefaults) {
	      defaultValueCache[nodeName] = nodeDefaults = {};
	    }
	    if (!(prop in nodeDefaults)) {
	      testElement = document.createElement(nodeName);
	      nodeDefaults[prop] = testElement[prop];
	    }
	    return nodeDefaults[prop];
	  },

	  injection: DOMPropertyInjection
	};

	module.exports = DOMProperty;

	},{"135":135}],11:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule DOMPropertyOperations
	 * @typechecks static-only
	 */

	'use strict';

	var DOMProperty = _dereq_(10);

	var quoteAttributeValueForBrowser = _dereq_(147);
	var warning = _dereq_(154);

	function shouldIgnoreValue(name, value) {
	  return value == null ||
	    (DOMProperty.hasBooleanValue[name] && !value) ||
	    (DOMProperty.hasNumericValue[name] && isNaN(value)) ||
	    (DOMProperty.hasPositiveNumericValue[name] && (value < 1)) ||
	    (DOMProperty.hasOverloadedBooleanValue[name] && value === false);
	}

	if (true) {
	  var reactProps = {
	    children: true,
	    dangerouslySetInnerHTML: true,
	    key: true,
	    ref: true
	  };
	  var warnedProperties = {};

	  var warnUnknownProperty = function(name) {
	    if (reactProps.hasOwnProperty(name) && reactProps[name] ||
	        warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
	      return;
	    }

	    warnedProperties[name] = true;
	    var lowerCasedName = name.toLowerCase();

	    // data-* attributes should be lowercase; suggest the lowercase version
	    var standardName = (
	      DOMProperty.isCustomAttribute(lowerCasedName) ?
	        lowerCasedName :
	      DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName) ?
	        DOMProperty.getPossibleStandardName[lowerCasedName] :
	        null
	    );

	    // For now, only warn when we have a suggested correction. This prevents
	    // logging too much when using transferPropsTo.
	    (true ? warning(
	      standardName == null,
	      'Unknown DOM property %s. Did you mean %s?',
	      name,
	      standardName
	    ) : null);

	  };
	}

	/**
	 * Operations for dealing with DOM properties.
	 */
	var DOMPropertyOperations = {

	  /**
	   * Creates markup for the ID property.
	   *
	   * @param {string} id Unescaped ID.
	   * @return {string} Markup string.
	   */
	  createMarkupForID: function(id) {
	    return DOMProperty.ID_ATTRIBUTE_NAME + '=' +
	      quoteAttributeValueForBrowser(id);
	  },

	  /**
	   * Creates markup for a property.
	   *
	   * @param {string} name
	   * @param {*} value
	   * @return {?string} Markup string, or null if the property was invalid.
	   */
	  createMarkupForProperty: function(name, value) {
	    if (DOMProperty.isStandardName.hasOwnProperty(name) &&
	        DOMProperty.isStandardName[name]) {
	      if (shouldIgnoreValue(name, value)) {
	        return '';
	      }
	      var attributeName = DOMProperty.getAttributeName[name];
	      if (DOMProperty.hasBooleanValue[name] ||
	          (DOMProperty.hasOverloadedBooleanValue[name] && value === true)) {
	        return attributeName;
	      }
	      return attributeName + '=' + quoteAttributeValueForBrowser(value);
	    } else if (DOMProperty.isCustomAttribute(name)) {
	      if (value == null) {
	        return '';
	      }
	      return name + '=' + quoteAttributeValueForBrowser(value);
	    } else if (true) {
	      warnUnknownProperty(name);
	    }
	    return null;
	  },

	  /**
	   * Sets the value for a property on a node.
	   *
	   * @param {DOMElement} node
	   * @param {string} name
	   * @param {*} value
	   */
	  setValueForProperty: function(node, name, value) {
	    if (DOMProperty.isStandardName.hasOwnProperty(name) &&
	        DOMProperty.isStandardName[name]) {
	      var mutationMethod = DOMProperty.getMutationMethod[name];
	      if (mutationMethod) {
	        mutationMethod(node, value);
	      } else if (shouldIgnoreValue(name, value)) {
	        this.deleteValueForProperty(node, name);
	      } else if (DOMProperty.mustUseAttribute[name]) {
	        // `setAttribute` with objects becomes only `[object]` in IE8/9,
	        // ('' + value) makes it output the correct toString()-value.
	        node.setAttribute(DOMProperty.getAttributeName[name], '' + value);
	      } else {
	        var propName = DOMProperty.getPropertyName[name];
	        // Must explicitly cast values for HAS_SIDE_EFFECTS-properties to the
	        // property type before comparing; only `value` does and is string.
	        if (!DOMProperty.hasSideEffects[name] ||
	            ('' + node[propName]) !== ('' + value)) {
	          // Contrary to `setAttribute`, object properties are properly
	          // `toString`ed by IE8/9.
	          node[propName] = value;
	        }
	      }
	    } else if (DOMProperty.isCustomAttribute(name)) {
	      if (value == null) {
	        node.removeAttribute(name);
	      } else {
	        node.setAttribute(name, '' + value);
	      }
	    } else if (true) {
	      warnUnknownProperty(name);
	    }
	  },

	  /**
	   * Deletes the value for a property on a node.
	   *
	   * @param {DOMElement} node
	   * @param {string} name
	   */
	  deleteValueForProperty: function(node, name) {
	    if (DOMProperty.isStandardName.hasOwnProperty(name) &&
	        DOMProperty.isStandardName[name]) {
	      var mutationMethod = DOMProperty.getMutationMethod[name];
	      if (mutationMethod) {
	        mutationMethod(node, undefined);
	      } else if (DOMProperty.mustUseAttribute[name]) {
	        node.removeAttribute(DOMProperty.getAttributeName[name]);
	      } else {
	        var propName = DOMProperty.getPropertyName[name];
	        var defaultValue = DOMProperty.getDefaultValueForProperty(
	          node.nodeName,
	          propName
	        );
	        if (!DOMProperty.hasSideEffects[name] ||
	            ('' + node[propName]) !== defaultValue) {
	          node[propName] = defaultValue;
	        }
	      }
	    } else if (DOMProperty.isCustomAttribute(name)) {
	      node.removeAttribute(name);
	    } else if (true) {
	      warnUnknownProperty(name);
	    }
	  }

	};

	module.exports = DOMPropertyOperations;

	},{"10":10,"147":147,"154":154}],12:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule Danger
	 * @typechecks static-only
	 */

	/*jslint evil: true, sub: true */

	'use strict';

	var ExecutionEnvironment = _dereq_(21);

	var createNodesFromMarkup = _dereq_(112);
	var emptyFunction = _dereq_(114);
	var getMarkupWrap = _dereq_(127);
	var invariant = _dereq_(135);

	var OPEN_TAG_NAME_EXP = /^(<[^ \/>]+)/;
	var RESULT_INDEX_ATTR = 'data-danger-index';

	/**
	 * Extracts the `nodeName` from a string of markup.
	 *
	 * NOTE: Extracting the `nodeName` does not require a regular expression match
	 * because we make assumptions about React-generated markup (i.e. there are no
	 * spaces surrounding the opening tag and there is at least one attribute).
	 *
	 * @param {string} markup String of markup.
	 * @return {string} Node name of the supplied markup.
	 * @see http://jsperf.com/extract-nodename
	 */
	function getNodeName(markup) {
	  return markup.substring(1, markup.indexOf(' '));
	}

	var Danger = {

	  /**
	   * Renders markup into an array of nodes. The markup is expected to render
	   * into a list of root nodes. Also, the length of `resultList` and
	   * `markupList` should be the same.
	   *
	   * @param {array<string>} markupList List of markup strings to render.
	   * @return {array<DOMElement>} List of rendered nodes.
	   * @internal
	   */
	  dangerouslyRenderMarkup: function(markupList) {
	    (true ? invariant(
	      ExecutionEnvironment.canUseDOM,
	      'dangerouslyRenderMarkup(...): Cannot render markup in a worker ' +
	      'thread. Make sure `window` and `document` are available globally ' +
	      'before requiring React when unit testing or use ' +
	      'React.renderToString for server rendering.'
	    ) : invariant(ExecutionEnvironment.canUseDOM));
	    var nodeName;
	    var markupByNodeName = {};
	    // Group markup by `nodeName` if a wrap is necessary, else by '*'.
	    for (var i = 0; i < markupList.length; i++) {
	      (true ? invariant(
	        markupList[i],
	        'dangerouslyRenderMarkup(...): Missing markup.'
	      ) : invariant(markupList[i]));
	      nodeName = getNodeName(markupList[i]);
	      nodeName = getMarkupWrap(nodeName) ? nodeName : '*';
	      markupByNodeName[nodeName] = markupByNodeName[nodeName] || [];
	      markupByNodeName[nodeName][i] = markupList[i];
	    }
	    var resultList = [];
	    var resultListAssignmentCount = 0;
	    for (nodeName in markupByNodeName) {
	      if (!markupByNodeName.hasOwnProperty(nodeName)) {
	        continue;
	      }
	      var markupListByNodeName = markupByNodeName[nodeName];

	      // This for-in loop skips the holes of the sparse array. The order of
	      // iteration should follow the order of assignment, which happens to match
	      // numerical index order, but we don't rely on that.
	      var resultIndex;
	      for (resultIndex in markupListByNodeName) {
	        if (markupListByNodeName.hasOwnProperty(resultIndex)) {
	          var markup = markupListByNodeName[resultIndex];

	          // Push the requested markup with an additional RESULT_INDEX_ATTR
	          // attribute.  If the markup does not start with a < character, it
	          // will be discarded below (with an appropriate console.error).
	          markupListByNodeName[resultIndex] = markup.replace(
	            OPEN_TAG_NAME_EXP,
	            // This index will be parsed back out below.
	            '$1 ' + RESULT_INDEX_ATTR + '="' + resultIndex + '" '
	          );
	        }
	      }

	      // Render each group of markup with similar wrapping `nodeName`.
	      var renderNodes = createNodesFromMarkup(
	        markupListByNodeName.join(''),
	        emptyFunction // Do nothing special with <script> tags.
	      );

	      for (var j = 0; j < renderNodes.length; ++j) {
	        var renderNode = renderNodes[j];
	        if (renderNode.hasAttribute &&
	            renderNode.hasAttribute(RESULT_INDEX_ATTR)) {

	          resultIndex = +renderNode.getAttribute(RESULT_INDEX_ATTR);
	          renderNode.removeAttribute(RESULT_INDEX_ATTR);

	          (true ? invariant(
	            !resultList.hasOwnProperty(resultIndex),
	            'Danger: Assigning to an already-occupied result index.'
	          ) : invariant(!resultList.hasOwnProperty(resultIndex)));

	          resultList[resultIndex] = renderNode;

	          // This should match resultList.length and markupList.length when
	          // we're done.
	          resultListAssignmentCount += 1;

	        } else if (true) {
	          console.error(
	            'Danger: Discarding unexpected node:',
	            renderNode
	          );
	        }
	      }
	    }

	    // Although resultList was populated out of order, it should now be a dense
	    // array.
	    (true ? invariant(
	      resultListAssignmentCount === resultList.length,
	      'Danger: Did not assign to every index of resultList.'
	    ) : invariant(resultListAssignmentCount === resultList.length));

	    (true ? invariant(
	      resultList.length === markupList.length,
	      'Danger: Expected markup to render %s nodes, but rendered %s.',
	      markupList.length,
	      resultList.length
	    ) : invariant(resultList.length === markupList.length));

	    return resultList;
	  },

	  /**
	   * Replaces a node with a string of markup at its current position within its
	   * parent. The markup must render into a single root node.
	   *
	   * @param {DOMElement} oldChild Child node to replace.
	   * @param {string} markup Markup to render in place of the child node.
	   * @internal
	   */
	  dangerouslyReplaceNodeWithMarkup: function(oldChild, markup) {
	    (true ? invariant(
	      ExecutionEnvironment.canUseDOM,
	      'dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a ' +
	      'worker thread. Make sure `window` and `document` are available ' +
	      'globally before requiring React when unit testing or use ' +
	      'React.renderToString for server rendering.'
	    ) : invariant(ExecutionEnvironment.canUseDOM));
	    (true ? invariant(markup, 'dangerouslyReplaceNodeWithMarkup(...): Missing markup.') : invariant(markup));
	    (true ? invariant(
	      oldChild.tagName.toLowerCase() !== 'html',
	      'dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the ' +
	      '<html> node. This is because browser quirks make this unreliable ' +
	      'and/or slow. If you want to render to the root you must use ' +
	      'server rendering. See React.renderToString().'
	    ) : invariant(oldChild.tagName.toLowerCase() !== 'html'));

	    var newChild = createNodesFromMarkup(markup, emptyFunction)[0];
	    oldChild.parentNode.replaceChild(newChild, oldChild);
	  }

	};

	module.exports = Danger;

	},{"112":112,"114":114,"127":127,"135":135,"21":21}],13:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule DefaultEventPluginOrder
	 */

	'use strict';

	var keyOf = _dereq_(141);

	/**
	 * Module that is injectable into `EventPluginHub`, that specifies a
	 * deterministic ordering of `EventPlugin`s. A convenient way to reason about
	 * plugins, without having to package every one of them. This is better than
	 * having plugins be ordered in the same order that they are injected because
	 * that ordering would be influenced by the packaging order.
	 * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
	 * preventing default on events is convenient in `SimpleEventPlugin` handlers.
	 */
	var DefaultEventPluginOrder = [
	  keyOf({ResponderEventPlugin: null}),
	  keyOf({SimpleEventPlugin: null}),
	  keyOf({TapEventPlugin: null}),
	  keyOf({EnterLeaveEventPlugin: null}),
	  keyOf({ChangeEventPlugin: null}),
	  keyOf({SelectEventPlugin: null}),
	  keyOf({BeforeInputEventPlugin: null}),
	  keyOf({AnalyticsEventPlugin: null}),
	  keyOf({MobileSafariClickEventPlugin: null})
	];

	module.exports = DefaultEventPluginOrder;

	},{"141":141}],14:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule EnterLeaveEventPlugin
	 * @typechecks static-only
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var EventPropagators = _dereq_(20);
	var SyntheticMouseEvent = _dereq_(99);

	var ReactMount = _dereq_(70);
	var keyOf = _dereq_(141);

	var topLevelTypes = EventConstants.topLevelTypes;
	var getFirstReactDOM = ReactMount.getFirstReactDOM;

	var eventTypes = {
	  mouseEnter: {
	    registrationName: keyOf({onMouseEnter: null}),
	    dependencies: [
	      topLevelTypes.topMouseOut,
	      topLevelTypes.topMouseOver
	    ]
	  },
	  mouseLeave: {
	    registrationName: keyOf({onMouseLeave: null}),
	    dependencies: [
	      topLevelTypes.topMouseOut,
	      topLevelTypes.topMouseOver
	    ]
	  }
	};

	var extractedEvents = [null, null];

	var EnterLeaveEventPlugin = {

	  eventTypes: eventTypes,

	  /**
	   * For almost every interaction we care about, there will be both a top-level
	   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
	   * we do not extract duplicate events. However, moving the mouse into the
	   * browser from outside will not fire a `mouseout` event. In this case, we use
	   * the `mouseover` top-level event.
	   *
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {DOMEventTarget} topLevelTarget The listening component root node.
	   * @param {string} topLevelTargetID ID of `topLevelTarget`.
	   * @param {object} nativeEvent Native browser event.
	   * @return {*} An accumulation of synthetic events.
	   * @see {EventPluginHub.extractEvents}
	   */
	  extractEvents: function(
	      topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      nativeEvent) {
	    if (topLevelType === topLevelTypes.topMouseOver &&
	        (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
	      return null;
	    }
	    if (topLevelType !== topLevelTypes.topMouseOut &&
	        topLevelType !== topLevelTypes.topMouseOver) {
	      // Must not be a mouse in or mouse out - ignoring.
	      return null;
	    }

	    var win;
	    if (topLevelTarget.window === topLevelTarget) {
	      // `topLevelTarget` is probably a window object.
	      win = topLevelTarget;
	    } else {
	      // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
	      var doc = topLevelTarget.ownerDocument;
	      if (doc) {
	        win = doc.defaultView || doc.parentWindow;
	      } else {
	        win = window;
	      }
	    }

	    var from, to;
	    if (topLevelType === topLevelTypes.topMouseOut) {
	      from = topLevelTarget;
	      to =
	        getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
	        win;
	    } else {
	      from = win;
	      to = topLevelTarget;
	    }

	    if (from === to) {
	      // Nothing pertains to our managed components.
	      return null;
	    }

	    var fromID = from ? ReactMount.getID(from) : '';
	    var toID = to ? ReactMount.getID(to) : '';

	    var leave = SyntheticMouseEvent.getPooled(
	      eventTypes.mouseLeave,
	      fromID,
	      nativeEvent
	    );
	    leave.type = 'mouseleave';
	    leave.target = from;
	    leave.relatedTarget = to;

	    var enter = SyntheticMouseEvent.getPooled(
	      eventTypes.mouseEnter,
	      toID,
	      nativeEvent
	    );
	    enter.type = 'mouseenter';
	    enter.target = to;
	    enter.relatedTarget = from;

	    EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);

	    extractedEvents[0] = leave;
	    extractedEvents[1] = enter;

	    return extractedEvents;
	  }

	};

	module.exports = EnterLeaveEventPlugin;

	},{"141":141,"15":15,"20":20,"70":70,"99":99}],15:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule EventConstants
	 */

	'use strict';

	var keyMirror = _dereq_(140);

	var PropagationPhases = keyMirror({bubbled: null, captured: null});

	/**
	 * Types of raw signals from the browser caught at the top level.
	 */
	var topLevelTypes = keyMirror({
	  topBlur: null,
	  topChange: null,
	  topClick: null,
	  topCompositionEnd: null,
	  topCompositionStart: null,
	  topCompositionUpdate: null,
	  topContextMenu: null,
	  topCopy: null,
	  topCut: null,
	  topDoubleClick: null,
	  topDrag: null,
	  topDragEnd: null,
	  topDragEnter: null,
	  topDragExit: null,
	  topDragLeave: null,
	  topDragOver: null,
	  topDragStart: null,
	  topDrop: null,
	  topError: null,
	  topFocus: null,
	  topInput: null,
	  topKeyDown: null,
	  topKeyPress: null,
	  topKeyUp: null,
	  topLoad: null,
	  topMouseDown: null,
	  topMouseMove: null,
	  topMouseOut: null,
	  topMouseOver: null,
	  topMouseUp: null,
	  topPaste: null,
	  topReset: null,
	  topScroll: null,
	  topSelectionChange: null,
	  topSubmit: null,
	  topTextInput: null,
	  topTouchCancel: null,
	  topTouchEnd: null,
	  topTouchMove: null,
	  topTouchStart: null,
	  topWheel: null
	});

	var EventConstants = {
	  topLevelTypes: topLevelTypes,
	  PropagationPhases: PropagationPhases
	};

	module.exports = EventConstants;

	},{"140":140}],16:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 * http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	 * @providesModule EventListener
	 * @typechecks
	 */

	var emptyFunction = _dereq_(114);

	/**
	 * Upstream version of event listener. Does not take into account specific
	 * nature of platform.
	 */
	var EventListener = {
	  /**
	   * Listen to DOM events during the bubble phase.
	   *
	   * @param {DOMEventTarget} target DOM element to register listener on.
	   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
	   * @param {function} callback Callback function.
	   * @return {object} Object with a `remove` method.
	   */
	  listen: function(target, eventType, callback) {
	    if (target.addEventListener) {
	      target.addEventListener(eventType, callback, false);
	      return {
	        remove: function() {
	          target.removeEventListener(eventType, callback, false);
	        }
	      };
	    } else if (target.attachEvent) {
	      target.attachEvent('on' + eventType, callback);
	      return {
	        remove: function() {
	          target.detachEvent('on' + eventType, callback);
	        }
	      };
	    }
	  },

	  /**
	   * Listen to DOM events during the capture phase.
	   *
	   * @param {DOMEventTarget} target DOM element to register listener on.
	   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
	   * @param {function} callback Callback function.
	   * @return {object} Object with a `remove` method.
	   */
	  capture: function(target, eventType, callback) {
	    if (!target.addEventListener) {
	      if (true) {
	        console.error(
	          'Attempted to listen to events during the capture phase on a ' +
	          'browser that does not support the capture phase. Your application ' +
	          'will not receive some events.'
	        );
	      }
	      return {
	        remove: emptyFunction
	      };
	    } else {
	      target.addEventListener(eventType, callback, true);
	      return {
	        remove: function() {
	          target.removeEventListener(eventType, callback, true);
	        }
	      };
	    }
	  },

	  registerDefault: function() {}
	};

	module.exports = EventListener;

	},{"114":114}],17:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule EventPluginHub
	 */

	'use strict';

	var EventPluginRegistry = _dereq_(18);
	var EventPluginUtils = _dereq_(19);

	var accumulateInto = _dereq_(105);
	var forEachAccumulated = _dereq_(120);
	var invariant = _dereq_(135);

	/**
	 * Internal store for event listeners
	 */
	var listenerBank = {};

	/**
	 * Internal queue of events that have accumulated their dispatches and are
	 * waiting to have their dispatches executed.
	 */
	var eventQueue = null;

	/**
	 * Dispatches an event and releases it back into the pool, unless persistent.
	 *
	 * @param {?object} event Synthetic event to be dispatched.
	 * @private
	 */
	var executeDispatchesAndRelease = function(event) {
	  if (event) {
	    var executeDispatch = EventPluginUtils.executeDispatch;
	    // Plugins can provide custom behavior when dispatching events.
	    var PluginModule = EventPluginRegistry.getPluginModuleForEvent(event);
	    if (PluginModule && PluginModule.executeDispatch) {
	      executeDispatch = PluginModule.executeDispatch;
	    }
	    EventPluginUtils.executeDispatchesInOrder(event, executeDispatch);

	    if (!event.isPersistent()) {
	      event.constructor.release(event);
	    }
	  }
	};

	/**
	 * - `InstanceHandle`: [required] Module that performs logical traversals of DOM
	 *   hierarchy given ids of the logical DOM elements involved.
	 */
	var InstanceHandle = null;

	function validateInstanceHandle() {
	  var valid =
	    InstanceHandle &&
	    InstanceHandle.traverseTwoPhase &&
	    InstanceHandle.traverseEnterLeave;
	  (true ? invariant(
	    valid,
	    'InstanceHandle not injected before use!'
	  ) : invariant(valid));
	}

	/**
	 * This is a unified interface for event plugins to be installed and configured.
	 *
	 * Event plugins can implement the following properties:
	 *
	 *   `extractEvents` {function(string, DOMEventTarget, string, object): *}
	 *     Required. When a top-level event is fired, this method is expected to
	 *     extract synthetic events that will in turn be queued and dispatched.
	 *
	 *   `eventTypes` {object}
	 *     Optional, plugins that fire events must publish a mapping of registration
	 *     names that are used to register listeners. Values of this mapping must
	 *     be objects that contain `registrationName` or `phasedRegistrationNames`.
	 *
	 *   `executeDispatch` {function(object, function, string)}
	 *     Optional, allows plugins to override how an event gets dispatched. By
	 *     default, the listener is simply invoked.
	 *
	 * Each plugin that is injected into `EventsPluginHub` is immediately operable.
	 *
	 * @public
	 */
	var EventPluginHub = {

	  /**
	   * Methods for injecting dependencies.
	   */
	  injection: {

	    /**
	     * @param {object} InjectedMount
	     * @public
	     */
	    injectMount: EventPluginUtils.injection.injectMount,

	    /**
	     * @param {object} InjectedInstanceHandle
	     * @public
	     */
	    injectInstanceHandle: function(InjectedInstanceHandle) {
	      InstanceHandle = InjectedInstanceHandle;
	      if (true) {
	        validateInstanceHandle();
	      }
	    },

	    getInstanceHandle: function() {
	      if (true) {
	        validateInstanceHandle();
	      }
	      return InstanceHandle;
	    },

	    /**
	     * @param {array} InjectedEventPluginOrder
	     * @public
	     */
	    injectEventPluginOrder: EventPluginRegistry.injectEventPluginOrder,

	    /**
	     * @param {object} injectedNamesToPlugins Map from names to plugin modules.
	     */
	    injectEventPluginsByName: EventPluginRegistry.injectEventPluginsByName

	  },

	  eventNameDispatchConfigs: EventPluginRegistry.eventNameDispatchConfigs,

	  registrationNameModules: EventPluginRegistry.registrationNameModules,

	  /**
	   * Stores `listener` at `listenerBank[registrationName][id]`. Is idempotent.
	   *
	   * @param {string} id ID of the DOM element.
	   * @param {string} registrationName Name of listener (e.g. `onClick`).
	   * @param {?function} listener The callback to store.
	   */
	  putListener: function(id, registrationName, listener) {
	    (true ? invariant(
	      !listener || typeof listener === 'function',
	      'Expected %s listener to be a function, instead got type %s',
	      registrationName, typeof listener
	    ) : invariant(!listener || typeof listener === 'function'));

	    var bankForRegistrationName =
	      listenerBank[registrationName] || (listenerBank[registrationName] = {});
	    bankForRegistrationName[id] = listener;
	  },

	  /**
	   * @param {string} id ID of the DOM element.
	   * @param {string} registrationName Name of listener (e.g. `onClick`).
	   * @return {?function} The stored callback.
	   */
	  getListener: function(id, registrationName) {
	    var bankForRegistrationName = listenerBank[registrationName];
	    return bankForRegistrationName && bankForRegistrationName[id];
	  },

	  /**
	   * Deletes a listener from the registration bank.
	   *
	   * @param {string} id ID of the DOM element.
	   * @param {string} registrationName Name of listener (e.g. `onClick`).
	   */
	  deleteListener: function(id, registrationName) {
	    var bankForRegistrationName = listenerBank[registrationName];
	    if (bankForRegistrationName) {
	      delete bankForRegistrationName[id];
	    }
	  },

	  /**
	   * Deletes all listeners for the DOM element with the supplied ID.
	   *
	   * @param {string} id ID of the DOM element.
	   */
	  deleteAllListeners: function(id) {
	    for (var registrationName in listenerBank) {
	      delete listenerBank[registrationName][id];
	    }
	  },

	  /**
	   * Allows registered plugins an opportunity to extract events from top-level
	   * native browser events.
	   *
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {DOMEventTarget} topLevelTarget The listening component root node.
	   * @param {string} topLevelTargetID ID of `topLevelTarget`.
	   * @param {object} nativeEvent Native browser event.
	   * @return {*} An accumulation of synthetic events.
	   * @internal
	   */
	  extractEvents: function(
	      topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      nativeEvent) {
	    var events;
	    var plugins = EventPluginRegistry.plugins;
	    for (var i = 0, l = plugins.length; i < l; i++) {
	      // Not every plugin in the ordering may be loaded at runtime.
	      var possiblePlugin = plugins[i];
	      if (possiblePlugin) {
	        var extractedEvents = possiblePlugin.extractEvents(
	          topLevelType,
	          topLevelTarget,
	          topLevelTargetID,
	          nativeEvent
	        );
	        if (extractedEvents) {
	          events = accumulateInto(events, extractedEvents);
	        }
	      }
	    }
	    return events;
	  },

	  /**
	   * Enqueues a synthetic event that should be dispatched when
	   * `processEventQueue` is invoked.
	   *
	   * @param {*} events An accumulation of synthetic events.
	   * @internal
	   */
	  enqueueEvents: function(events) {
	    if (events) {
	      eventQueue = accumulateInto(eventQueue, events);
	    }
	  },

	  /**
	   * Dispatches all synthetic events on the event queue.
	   *
	   * @internal
	   */
	  processEventQueue: function() {
	    // Set `eventQueue` to null before processing it so that we can tell if more
	    // events get enqueued while processing.
	    var processingEventQueue = eventQueue;
	    eventQueue = null;
	    forEachAccumulated(processingEventQueue, executeDispatchesAndRelease);
	    (true ? invariant(
	      !eventQueue,
	      'processEventQueue(): Additional events were enqueued while processing ' +
	      'an event queue. Support for this has not yet been implemented.'
	    ) : invariant(!eventQueue));
	  },

	  /**
	   * These are needed for tests only. Do not use!
	   */
	  __purge: function() {
	    listenerBank = {};
	  },

	  __getListenerBank: function() {
	    return listenerBank;
	  }

	};

	module.exports = EventPluginHub;

	},{"105":105,"120":120,"135":135,"18":18,"19":19}],18:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule EventPluginRegistry
	 * @typechecks static-only
	 */

	'use strict';

	var invariant = _dereq_(135);

	/**
	 * Injectable ordering of event plugins.
	 */
	var EventPluginOrder = null;

	/**
	 * Injectable mapping from names to event plugin modules.
	 */
	var namesToPlugins = {};

	/**
	 * Recomputes the plugin list using the injected plugins and plugin ordering.
	 *
	 * @private
	 */
	function recomputePluginOrdering() {
	  if (!EventPluginOrder) {
	    // Wait until an `EventPluginOrder` is injected.
	    return;
	  }
	  for (var pluginName in namesToPlugins) {
	    var PluginModule = namesToPlugins[pluginName];
	    var pluginIndex = EventPluginOrder.indexOf(pluginName);
	    (true ? invariant(
	      pluginIndex > -1,
	      'EventPluginRegistry: Cannot inject event plugins that do not exist in ' +
	      'the plugin ordering, `%s`.',
	      pluginName
	    ) : invariant(pluginIndex > -1));
	    if (EventPluginRegistry.plugins[pluginIndex]) {
	      continue;
	    }
	    (true ? invariant(
	      PluginModule.extractEvents,
	      'EventPluginRegistry: Event plugins must implement an `extractEvents` ' +
	      'method, but `%s` does not.',
	      pluginName
	    ) : invariant(PluginModule.extractEvents));
	    EventPluginRegistry.plugins[pluginIndex] = PluginModule;
	    var publishedEvents = PluginModule.eventTypes;
	    for (var eventName in publishedEvents) {
	      (true ? invariant(
	        publishEventForPlugin(
	          publishedEvents[eventName],
	          PluginModule,
	          eventName
	        ),
	        'EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.',
	        eventName,
	        pluginName
	      ) : invariant(publishEventForPlugin(
	        publishedEvents[eventName],
	        PluginModule,
	        eventName
	      )));
	    }
	  }
	}

	/**
	 * Publishes an event so that it can be dispatched by the supplied plugin.
	 *
	 * @param {object} dispatchConfig Dispatch configuration for the event.
	 * @param {object} PluginModule Plugin publishing the event.
	 * @return {boolean} True if the event was successfully published.
	 * @private
	 */
	function publishEventForPlugin(dispatchConfig, PluginModule, eventName) {
	  (true ? invariant(
	    !EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName),
	    'EventPluginHub: More than one plugin attempted to publish the same ' +
	    'event name, `%s`.',
	    eventName
	  ) : invariant(!EventPluginRegistry.eventNameDispatchConfigs.hasOwnProperty(eventName)));
	  EventPluginRegistry.eventNameDispatchConfigs[eventName] = dispatchConfig;

	  var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
	  if (phasedRegistrationNames) {
	    for (var phaseName in phasedRegistrationNames) {
	      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
	        var phasedRegistrationName = phasedRegistrationNames[phaseName];
	        publishRegistrationName(
	          phasedRegistrationName,
	          PluginModule,
	          eventName
	        );
	      }
	    }
	    return true;
	  } else if (dispatchConfig.registrationName) {
	    publishRegistrationName(
	      dispatchConfig.registrationName,
	      PluginModule,
	      eventName
	    );
	    return true;
	  }
	  return false;
	}

	/**
	 * Publishes a registration name that is used to identify dispatched events and
	 * can be used with `EventPluginHub.putListener` to register listeners.
	 *
	 * @param {string} registrationName Registration name to add.
	 * @param {object} PluginModule Plugin publishing the event.
	 * @private
	 */
	function publishRegistrationName(registrationName, PluginModule, eventName) {
	  (true ? invariant(
	    !EventPluginRegistry.registrationNameModules[registrationName],
	    'EventPluginHub: More than one plugin attempted to publish the same ' +
	    'registration name, `%s`.',
	    registrationName
	  ) : invariant(!EventPluginRegistry.registrationNameModules[registrationName]));
	  EventPluginRegistry.registrationNameModules[registrationName] = PluginModule;
	  EventPluginRegistry.registrationNameDependencies[registrationName] =
	    PluginModule.eventTypes[eventName].dependencies;
	}

	/**
	 * Registers plugins so that they can extract and dispatch events.
	 *
	 * @see {EventPluginHub}
	 */
	var EventPluginRegistry = {

	  /**
	   * Ordered list of injected plugins.
	   */
	  plugins: [],

	  /**
	   * Mapping from event name to dispatch config
	   */
	  eventNameDispatchConfigs: {},

	  /**
	   * Mapping from registration name to plugin module
	   */
	  registrationNameModules: {},

	  /**
	   * Mapping from registration name to event name
	   */
	  registrationNameDependencies: {},

	  /**
	   * Injects an ordering of plugins (by plugin name). This allows the ordering
	   * to be decoupled from injection of the actual plugins so that ordering is
	   * always deterministic regardless of packaging, on-the-fly injection, etc.
	   *
	   * @param {array} InjectedEventPluginOrder
	   * @internal
	   * @see {EventPluginHub.injection.injectEventPluginOrder}
	   */
	  injectEventPluginOrder: function(InjectedEventPluginOrder) {
	    (true ? invariant(
	      !EventPluginOrder,
	      'EventPluginRegistry: Cannot inject event plugin ordering more than ' +
	      'once. You are likely trying to load more than one copy of React.'
	    ) : invariant(!EventPluginOrder));
	    // Clone the ordering so it cannot be dynamically mutated.
	    EventPluginOrder = Array.prototype.slice.call(InjectedEventPluginOrder);
	    recomputePluginOrdering();
	  },

	  /**
	   * Injects plugins to be used by `EventPluginHub`. The plugin names must be
	   * in the ordering injected by `injectEventPluginOrder`.
	   *
	   * Plugins can be injected as part of page initialization or on-the-fly.
	   *
	   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
	   * @internal
	   * @see {EventPluginHub.injection.injectEventPluginsByName}
	   */
	  injectEventPluginsByName: function(injectedNamesToPlugins) {
	    var isOrderingDirty = false;
	    for (var pluginName in injectedNamesToPlugins) {
	      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
	        continue;
	      }
	      var PluginModule = injectedNamesToPlugins[pluginName];
	      if (!namesToPlugins.hasOwnProperty(pluginName) ||
	          namesToPlugins[pluginName] !== PluginModule) {
	        (true ? invariant(
	          !namesToPlugins[pluginName],
	          'EventPluginRegistry: Cannot inject two different event plugins ' +
	          'using the same name, `%s`.',
	          pluginName
	        ) : invariant(!namesToPlugins[pluginName]));
	        namesToPlugins[pluginName] = PluginModule;
	        isOrderingDirty = true;
	      }
	    }
	    if (isOrderingDirty) {
	      recomputePluginOrdering();
	    }
	  },

	  /**
	   * Looks up the plugin for the supplied event.
	   *
	   * @param {object} event A synthetic event.
	   * @return {?object} The plugin that created the supplied event.
	   * @internal
	   */
	  getPluginModuleForEvent: function(event) {
	    var dispatchConfig = event.dispatchConfig;
	    if (dispatchConfig.registrationName) {
	      return EventPluginRegistry.registrationNameModules[
	        dispatchConfig.registrationName
	      ] || null;
	    }
	    for (var phase in dispatchConfig.phasedRegistrationNames) {
	      if (!dispatchConfig.phasedRegistrationNames.hasOwnProperty(phase)) {
	        continue;
	      }
	      var PluginModule = EventPluginRegistry.registrationNameModules[
	        dispatchConfig.phasedRegistrationNames[phase]
	      ];
	      if (PluginModule) {
	        return PluginModule;
	      }
	    }
	    return null;
	  },

	  /**
	   * Exposed for unit testing.
	   * @private
	   */
	  _resetEventPlugins: function() {
	    EventPluginOrder = null;
	    for (var pluginName in namesToPlugins) {
	      if (namesToPlugins.hasOwnProperty(pluginName)) {
	        delete namesToPlugins[pluginName];
	      }
	    }
	    EventPluginRegistry.plugins.length = 0;

	    var eventNameDispatchConfigs = EventPluginRegistry.eventNameDispatchConfigs;
	    for (var eventName in eventNameDispatchConfigs) {
	      if (eventNameDispatchConfigs.hasOwnProperty(eventName)) {
	        delete eventNameDispatchConfigs[eventName];
	      }
	    }

	    var registrationNameModules = EventPluginRegistry.registrationNameModules;
	    for (var registrationName in registrationNameModules) {
	      if (registrationNameModules.hasOwnProperty(registrationName)) {
	        delete registrationNameModules[registrationName];
	      }
	    }
	  }

	};

	module.exports = EventPluginRegistry;

	},{"135":135}],19:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule EventPluginUtils
	 */

	'use strict';

	var EventConstants = _dereq_(15);

	var invariant = _dereq_(135);

	/**
	 * Injected dependencies:
	 */

	/**
	 * - `Mount`: [required] Module that can convert between React dom IDs and
	 *   actual node references.
	 */
	var injection = {
	  Mount: null,
	  injectMount: function(InjectedMount) {
	    injection.Mount = InjectedMount;
	    if (true) {
	      (true ? invariant(
	        InjectedMount && InjectedMount.getNode,
	        'EventPluginUtils.injection.injectMount(...): Injected Mount module ' +
	        'is missing getNode.'
	      ) : invariant(InjectedMount && InjectedMount.getNode));
	    }
	  }
	};

	var topLevelTypes = EventConstants.topLevelTypes;

	function isEndish(topLevelType) {
	  return topLevelType === topLevelTypes.topMouseUp ||
	         topLevelType === topLevelTypes.topTouchEnd ||
	         topLevelType === topLevelTypes.topTouchCancel;
	}

	function isMoveish(topLevelType) {
	  return topLevelType === topLevelTypes.topMouseMove ||
	         topLevelType === topLevelTypes.topTouchMove;
	}
	function isStartish(topLevelType) {
	  return topLevelType === topLevelTypes.topMouseDown ||
	         topLevelType === topLevelTypes.topTouchStart;
	}


	var validateEventDispatches;
	if (true) {
	  validateEventDispatches = function(event) {
	    var dispatchListeners = event._dispatchListeners;
	    var dispatchIDs = event._dispatchIDs;

	    var listenersIsArr = Array.isArray(dispatchListeners);
	    var idsIsArr = Array.isArray(dispatchIDs);
	    var IDsLen = idsIsArr ? dispatchIDs.length : dispatchIDs ? 1 : 0;
	    var listenersLen = listenersIsArr ?
	      dispatchListeners.length :
	      dispatchListeners ? 1 : 0;

	    (true ? invariant(
	      idsIsArr === listenersIsArr && IDsLen === listenersLen,
	      'EventPluginUtils: Invalid `event`.'
	    ) : invariant(idsIsArr === listenersIsArr && IDsLen === listenersLen));
	  };
	}

	/**
	 * Invokes `cb(event, listener, id)`. Avoids using call if no scope is
	 * provided. The `(listener,id)` pair effectively forms the "dispatch" but are
	 * kept separate to conserve memory.
	 */
	function forEachEventDispatch(event, cb) {
	  var dispatchListeners = event._dispatchListeners;
	  var dispatchIDs = event._dispatchIDs;
	  if (true) {
	    validateEventDispatches(event);
	  }
	  if (Array.isArray(dispatchListeners)) {
	    for (var i = 0; i < dispatchListeners.length; i++) {
	      if (event.isPropagationStopped()) {
	        break;
	      }
	      // Listeners and IDs are two parallel arrays that are always in sync.
	      cb(event, dispatchListeners[i], dispatchIDs[i]);
	    }
	  } else if (dispatchListeners) {
	    cb(event, dispatchListeners, dispatchIDs);
	  }
	}

	/**
	 * Default implementation of PluginModule.executeDispatch().
	 * @param {SyntheticEvent} SyntheticEvent to handle
	 * @param {function} Application-level callback
	 * @param {string} domID DOM id to pass to the callback.
	 */
	function executeDispatch(event, listener, domID) {
	  event.currentTarget = injection.Mount.getNode(domID);
	  var returnValue = listener(event, domID);
	  event.currentTarget = null;
	  return returnValue;
	}

	/**
	 * Standard/simple iteration through an event's collected dispatches.
	 */
	function executeDispatchesInOrder(event, cb) {
	  forEachEventDispatch(event, cb);
	  event._dispatchListeners = null;
	  event._dispatchIDs = null;
	}

	/**
	 * Standard/simple iteration through an event's collected dispatches, but stops
	 * at the first dispatch execution returning true, and returns that id.
	 *
	 * @return id of the first dispatch execution who's listener returns true, or
	 * null if no listener returned true.
	 */
	function executeDispatchesInOrderStopAtTrueImpl(event) {
	  var dispatchListeners = event._dispatchListeners;
	  var dispatchIDs = event._dispatchIDs;
	  if (true) {
	    validateEventDispatches(event);
	  }
	  if (Array.isArray(dispatchListeners)) {
	    for (var i = 0; i < dispatchListeners.length; i++) {
	      if (event.isPropagationStopped()) {
	        break;
	      }
	      // Listeners and IDs are two parallel arrays that are always in sync.
	      if (dispatchListeners[i](event, dispatchIDs[i])) {
	        return dispatchIDs[i];
	      }
	    }
	  } else if (dispatchListeners) {
	    if (dispatchListeners(event, dispatchIDs)) {
	      return dispatchIDs;
	    }
	  }
	  return null;
	}

	/**
	 * @see executeDispatchesInOrderStopAtTrueImpl
	 */
	function executeDispatchesInOrderStopAtTrue(event) {
	  var ret = executeDispatchesInOrderStopAtTrueImpl(event);
	  event._dispatchIDs = null;
	  event._dispatchListeners = null;
	  return ret;
	}

	/**
	 * Execution of a "direct" dispatch - there must be at most one dispatch
	 * accumulated on the event or it is considered an error. It doesn't really make
	 * sense for an event with multiple dispatches (bubbled) to keep track of the
	 * return values at each dispatch execution, but it does tend to make sense when
	 * dealing with "direct" dispatches.
	 *
	 * @return The return value of executing the single dispatch.
	 */
	function executeDirectDispatch(event) {
	  if (true) {
	    validateEventDispatches(event);
	  }
	  var dispatchListener = event._dispatchListeners;
	  var dispatchID = event._dispatchIDs;
	  (true ? invariant(
	    !Array.isArray(dispatchListener),
	    'executeDirectDispatch(...): Invalid `event`.'
	  ) : invariant(!Array.isArray(dispatchListener)));
	  var res = dispatchListener ?
	    dispatchListener(event, dispatchID) :
	    null;
	  event._dispatchListeners = null;
	  event._dispatchIDs = null;
	  return res;
	}

	/**
	 * @param {SyntheticEvent} event
	 * @return {bool} True iff number of dispatches accumulated is greater than 0.
	 */
	function hasDispatches(event) {
	  return !!event._dispatchListeners;
	}

	/**
	 * General utilities that are useful in creating custom Event Plugins.
	 */
	var EventPluginUtils = {
	  isEndish: isEndish,
	  isMoveish: isMoveish,
	  isStartish: isStartish,

	  executeDirectDispatch: executeDirectDispatch,
	  executeDispatch: executeDispatch,
	  executeDispatchesInOrder: executeDispatchesInOrder,
	  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
	  hasDispatches: hasDispatches,
	  injection: injection,
	  useTouchEvents: false
	};

	module.exports = EventPluginUtils;

	},{"135":135,"15":15}],20:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule EventPropagators
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var EventPluginHub = _dereq_(17);

	var accumulateInto = _dereq_(105);
	var forEachAccumulated = _dereq_(120);

	var PropagationPhases = EventConstants.PropagationPhases;
	var getListener = EventPluginHub.getListener;

	/**
	 * Some event types have a notion of different registration names for different
	 * "phases" of propagation. This finds listeners by a given phase.
	 */
	function listenerAtPhase(id, event, propagationPhase) {
	  var registrationName =
	    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
	  return getListener(id, registrationName);
	}

	/**
	 * Tags a `SyntheticEvent` with dispatched listeners. Creating this function
	 * here, allows us to not have to bind or create functions for each event.
	 * Mutating the event's members allows us to not have to create a wrapping
	 * "dispatch" object that pairs the event with the listener.
	 */
	function accumulateDirectionalDispatches(domID, upwards, event) {
	  if (true) {
	    if (!domID) {
	      throw new Error('Dispatching id must not be null');
	    }
	  }
	  var phase = upwards ? PropagationPhases.bubbled : PropagationPhases.captured;
	  var listener = listenerAtPhase(domID, event, phase);
	  if (listener) {
	    event._dispatchListeners =
	      accumulateInto(event._dispatchListeners, listener);
	    event._dispatchIDs = accumulateInto(event._dispatchIDs, domID);
	  }
	}

	/**
	 * Collect dispatches (must be entirely collected before dispatching - see unit
	 * tests). Lazily allocate the array to conserve memory.  We must loop through
	 * each event and perform the traversal for each one. We can not perform a
	 * single traversal for the entire collection of events because each event may
	 * have a different target.
	 */
	function accumulateTwoPhaseDispatchesSingle(event) {
	  if (event && event.dispatchConfig.phasedRegistrationNames) {
	    EventPluginHub.injection.getInstanceHandle().traverseTwoPhase(
	      event.dispatchMarker,
	      accumulateDirectionalDispatches,
	      event
	    );
	  }
	}


	/**
	 * Accumulates without regard to direction, does not look for phased
	 * registration names. Same as `accumulateDirectDispatchesSingle` but without
	 * requiring that the `dispatchMarker` be the same as the dispatched ID.
	 */
	function accumulateDispatches(id, ignoredDirection, event) {
	  if (event && event.dispatchConfig.registrationName) {
	    var registrationName = event.dispatchConfig.registrationName;
	    var listener = getListener(id, registrationName);
	    if (listener) {
	      event._dispatchListeners =
	        accumulateInto(event._dispatchListeners, listener);
	      event._dispatchIDs = accumulateInto(event._dispatchIDs, id);
	    }
	  }
	}

	/**
	 * Accumulates dispatches on an `SyntheticEvent`, but only for the
	 * `dispatchMarker`.
	 * @param {SyntheticEvent} event
	 */
	function accumulateDirectDispatchesSingle(event) {
	  if (event && event.dispatchConfig.registrationName) {
	    accumulateDispatches(event.dispatchMarker, null, event);
	  }
	}

	function accumulateTwoPhaseDispatches(events) {
	  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
	}

	function accumulateEnterLeaveDispatches(leave, enter, fromID, toID) {
	  EventPluginHub.injection.getInstanceHandle().traverseEnterLeave(
	    fromID,
	    toID,
	    accumulateDispatches,
	    leave,
	    enter
	  );
	}


	function accumulateDirectDispatches(events) {
	  forEachAccumulated(events, accumulateDirectDispatchesSingle);
	}



	/**
	 * A small set of propagation patterns, each of which will accept a small amount
	 * of information, and generate a set of "dispatch ready event objects" - which
	 * are sets of events that have already been annotated with a set of dispatched
	 * listener functions/ids. The API is designed this way to discourage these
	 * propagation strategies from actually executing the dispatches, since we
	 * always want to collect the entire set of dispatches before executing event a
	 * single one.
	 *
	 * @constructor EventPropagators
	 */
	var EventPropagators = {
	  accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
	  accumulateDirectDispatches: accumulateDirectDispatches,
	  accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches
	};

	module.exports = EventPropagators;

	},{"105":105,"120":120,"15":15,"17":17}],21:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ExecutionEnvironment
	 */

	/*jslint evil: true */

	"use strict";

	var canUseDOM = !!(
	  (typeof window !== 'undefined' &&
	  window.document && window.document.createElement)
	);

	/**
	 * Simple, lightweight module assisting with the detection and context of
	 * Worker. Helps avoid circular dependencies and allows code to reason about
	 * whether or not they are in a Worker, even if they never include the main
	 * `ReactWorker` dependency.
	 */
	var ExecutionEnvironment = {

	  canUseDOM: canUseDOM,

	  canUseWorkers: typeof Worker !== 'undefined',

	  canUseEventListeners:
	    canUseDOM && !!(window.addEventListener || window.attachEvent),

	  canUseViewport: canUseDOM && !!window.screen,

	  isInWorker: !canUseDOM // For now, this is true - might change in the future.

	};

	module.exports = ExecutionEnvironment;

	},{}],22:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule FallbackCompositionState
	 * @typechecks static-only
	 */

	'use strict';

	var PooledClass = _dereq_(28);

	var assign = _dereq_(27);
	var getTextContentAccessor = _dereq_(130);

	/**
	 * This helper class stores information about text content of a target node,
	 * allowing comparison of content before and after a given event.
	 *
	 * Identify the node where selection currently begins, then observe
	 * both its text content and its current position in the DOM. Since the
	 * browser may natively replace the target node during composition, we can
	 * use its position to find its replacement.
	 *
	 * @param {DOMEventTarget} root
	 */
	function FallbackCompositionState(root) {
	  this._root = root;
	  this._startText = this.getText();
	  this._fallbackText = null;
	}

	assign(FallbackCompositionState.prototype, {
	  /**
	   * Get current text of input.
	   *
	   * @return {string}
	   */
	  getText: function() {
	    if ('value' in this._root) {
	      return this._root.value;
	    }
	    return this._root[getTextContentAccessor()];
	  },

	  /**
	   * Determine the differing substring between the initially stored
	   * text content and the current content.
	   *
	   * @return {string}
	   */
	  getData: function() {
	    if (this._fallbackText) {
	      return this._fallbackText;
	    }

	    var start;
	    var startValue = this._startText;
	    var startLength = startValue.length;
	    var end;
	    var endValue = this.getText();
	    var endLength = endValue.length;

	    for (start = 0; start < startLength; start++) {
	      if (startValue[start] !== endValue[start]) {
	        break;
	      }
	    }

	    var minEnd = startLength - start;
	    for (end = 1; end <= minEnd; end++) {
	      if (startValue[startLength - end] !== endValue[endLength - end]) {
	        break;
	      }
	    }

	    var sliceTail = end > 1 ? 1 - end : undefined;
	    this._fallbackText = endValue.slice(start, sliceTail);
	    return this._fallbackText;
	  }
	});

	PooledClass.addPoolingTo(FallbackCompositionState);

	module.exports = FallbackCompositionState;

	},{"130":130,"27":27,"28":28}],23:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule HTMLDOMPropertyConfig
	 */

	/*jslint bitwise: true*/

	'use strict';

	var DOMProperty = _dereq_(10);
	var ExecutionEnvironment = _dereq_(21);

	var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;
	var MUST_USE_PROPERTY = DOMProperty.injection.MUST_USE_PROPERTY;
	var HAS_BOOLEAN_VALUE = DOMProperty.injection.HAS_BOOLEAN_VALUE;
	var HAS_SIDE_EFFECTS = DOMProperty.injection.HAS_SIDE_EFFECTS;
	var HAS_NUMERIC_VALUE = DOMProperty.injection.HAS_NUMERIC_VALUE;
	var HAS_POSITIVE_NUMERIC_VALUE =
	  DOMProperty.injection.HAS_POSITIVE_NUMERIC_VALUE;
	var HAS_OVERLOADED_BOOLEAN_VALUE =
	  DOMProperty.injection.HAS_OVERLOADED_BOOLEAN_VALUE;

	var hasSVG;
	if (ExecutionEnvironment.canUseDOM) {
	  var implementation = document.implementation;
	  hasSVG = (
	    implementation &&
	    implementation.hasFeature &&
	    implementation.hasFeature(
	      'http://www.w3.org/TR/SVG11/feature#BasicStructure',
	      '1.1'
	    )
	  );
	}


	var HTMLDOMPropertyConfig = {
	  isCustomAttribute: RegExp.prototype.test.bind(
	    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
	  ),
	  Properties: {
	    /**
	     * Standard Properties
	     */
	    accept: null,
	    acceptCharset: null,
	    accessKey: null,
	    action: null,
	    allowFullScreen: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    allowTransparency: MUST_USE_ATTRIBUTE,
	    alt: null,
	    async: HAS_BOOLEAN_VALUE,
	    autoComplete: null,
	    // autoFocus is polyfilled/normalized by AutoFocusMixin
	    // autoFocus: HAS_BOOLEAN_VALUE,
	    autoPlay: HAS_BOOLEAN_VALUE,
	    cellPadding: null,
	    cellSpacing: null,
	    charSet: MUST_USE_ATTRIBUTE,
	    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    classID: MUST_USE_ATTRIBUTE,
	    // To set className on SVG elements, it's necessary to use .setAttribute;
	    // this works on HTML elements too in all browsers except IE8. Conveniently,
	    // IE8 doesn't support SVG and so we can simply use the attribute in
	    // browsers that support SVG and the property in browsers that don't,
	    // regardless of whether the element is HTML or SVG.
	    className: hasSVG ? MUST_USE_ATTRIBUTE : MUST_USE_PROPERTY,
	    cols: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
	    colSpan: null,
	    content: null,
	    contentEditable: null,
	    contextMenu: MUST_USE_ATTRIBUTE,
	    controls: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    coords: null,
	    crossOrigin: null,
	    data: null, // For `<object />` acts as `src`.
	    dateTime: MUST_USE_ATTRIBUTE,
	    defer: HAS_BOOLEAN_VALUE,
	    dir: null,
	    disabled: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    download: HAS_OVERLOADED_BOOLEAN_VALUE,
	    draggable: null,
	    encType: null,
	    form: MUST_USE_ATTRIBUTE,
	    formAction: MUST_USE_ATTRIBUTE,
	    formEncType: MUST_USE_ATTRIBUTE,
	    formMethod: MUST_USE_ATTRIBUTE,
	    formNoValidate: HAS_BOOLEAN_VALUE,
	    formTarget: MUST_USE_ATTRIBUTE,
	    frameBorder: MUST_USE_ATTRIBUTE,
	    headers: null,
	    height: MUST_USE_ATTRIBUTE,
	    hidden: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    high: null,
	    href: null,
	    hrefLang: null,
	    htmlFor: null,
	    httpEquiv: null,
	    icon: null,
	    id: MUST_USE_PROPERTY,
	    label: null,
	    lang: null,
	    list: MUST_USE_ATTRIBUTE,
	    loop: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    low: null,
	    manifest: MUST_USE_ATTRIBUTE,
	    marginHeight: null,
	    marginWidth: null,
	    max: null,
	    maxLength: MUST_USE_ATTRIBUTE,
	    media: MUST_USE_ATTRIBUTE,
	    mediaGroup: null,
	    method: null,
	    min: null,
	    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    name: null,
	    noValidate: HAS_BOOLEAN_VALUE,
	    open: HAS_BOOLEAN_VALUE,
	    optimum: null,
	    pattern: null,
	    placeholder: null,
	    poster: null,
	    preload: null,
	    radioGroup: null,
	    readOnly: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    rel: null,
	    required: HAS_BOOLEAN_VALUE,
	    role: MUST_USE_ATTRIBUTE,
	    rows: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
	    rowSpan: null,
	    sandbox: null,
	    scope: null,
	    scoped: HAS_BOOLEAN_VALUE,
	    scrolling: null,
	    seamless: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	    shape: null,
	    size: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
	    sizes: MUST_USE_ATTRIBUTE,
	    span: HAS_POSITIVE_NUMERIC_VALUE,
	    spellCheck: null,
	    src: null,
	    srcDoc: MUST_USE_PROPERTY,
	    srcSet: MUST_USE_ATTRIBUTE,
	    start: HAS_NUMERIC_VALUE,
	    step: null,
	    style: null,
	    tabIndex: null,
	    target: null,
	    title: null,
	    type: null,
	    useMap: null,
	    value: MUST_USE_PROPERTY | HAS_SIDE_EFFECTS,
	    width: MUST_USE_ATTRIBUTE,
	    wmode: MUST_USE_ATTRIBUTE,

	    /**
	     * Non-standard Properties
	     */
	    // autoCapitalize and autoCorrect are supported in Mobile Safari for
	    // keyboard hints.
	    autoCapitalize: null,
	    autoCorrect: null,
	    // itemProp, itemScope, itemType are for
	    // Microdata support. See http://schema.org/docs/gs.html
	    itemProp: MUST_USE_ATTRIBUTE,
	    itemScope: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
	    itemType: MUST_USE_ATTRIBUTE,
	    // itemID and itemRef are for Microdata support as well but
	    // only specified in the the WHATWG spec document. See
	    // https://html.spec.whatwg.org/multipage/microdata.html#microdata-dom-api
	    itemID: MUST_USE_ATTRIBUTE,
	    itemRef: MUST_USE_ATTRIBUTE,
	    // property is supported for OpenGraph in meta tags.
	    property: null,
	    // IE-only attribute that controls focus behavior
	    unselectable: MUST_USE_ATTRIBUTE
	  },
	  DOMAttributeNames: {
	    acceptCharset: 'accept-charset',
	    className: 'class',
	    htmlFor: 'for',
	    httpEquiv: 'http-equiv'
	  },
	  DOMPropertyNames: {
	    autoCapitalize: 'autocapitalize',
	    autoComplete: 'autocomplete',
	    autoCorrect: 'autocorrect',
	    autoFocus: 'autofocus',
	    autoPlay: 'autoplay',
	    // `encoding` is equivalent to `enctype`, IE8 lacks an `enctype` setter.
	    // http://www.w3.org/TR/html5/forms.html#dom-fs-encoding
	    encType: 'encoding',
	    hrefLang: 'hreflang',
	    radioGroup: 'radiogroup',
	    spellCheck: 'spellcheck',
	    srcDoc: 'srcdoc',
	    srcSet: 'srcset'
	  }
	};

	module.exports = HTMLDOMPropertyConfig;

	},{"10":10,"21":21}],24:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule LinkedValueUtils
	 * @typechecks static-only
	 */

	'use strict';

	var ReactPropTypes = _dereq_(78);

	var invariant = _dereq_(135);

	var hasReadOnlyValue = {
	  'button': true,
	  'checkbox': true,
	  'image': true,
	  'hidden': true,
	  'radio': true,
	  'reset': true,
	  'submit': true
	};

	function _assertSingleLink(input) {
	  (true ? invariant(
	    input.props.checkedLink == null || input.props.valueLink == null,
	    'Cannot provide a checkedLink and a valueLink. If you want to use ' +
	    'checkedLink, you probably don\'t want to use valueLink and vice versa.'
	  ) : invariant(input.props.checkedLink == null || input.props.valueLink == null));
	}
	function _assertValueLink(input) {
	  _assertSingleLink(input);
	  (true ? invariant(
	    input.props.value == null && input.props.onChange == null,
	    'Cannot provide a valueLink and a value or onChange event. If you want ' +
	    'to use value or onChange, you probably don\'t want to use valueLink.'
	  ) : invariant(input.props.value == null && input.props.onChange == null));
	}

	function _assertCheckedLink(input) {
	  _assertSingleLink(input);
	  (true ? invariant(
	    input.props.checked == null && input.props.onChange == null,
	    'Cannot provide a checkedLink and a checked property or onChange event. ' +
	    'If you want to use checked or onChange, you probably don\'t want to ' +
	    'use checkedLink'
	  ) : invariant(input.props.checked == null && input.props.onChange == null));
	}

	/**
	 * @param {SyntheticEvent} e change event to handle
	 */
	function _handleLinkedValueChange(e) {
	  /*jshint validthis:true */
	  this.props.valueLink.requestChange(e.target.value);
	}

	/**
	  * @param {SyntheticEvent} e change event to handle
	  */
	function _handleLinkedCheckChange(e) {
	  /*jshint validthis:true */
	  this.props.checkedLink.requestChange(e.target.checked);
	}

	/**
	 * Provide a linked `value` attribute for controlled forms. You should not use
	 * this outside of the ReactDOM controlled form components.
	 */
	var LinkedValueUtils = {
	  Mixin: {
	    propTypes: {
	      value: function(props, propName, componentName) {
	        if (!props[propName] ||
	            hasReadOnlyValue[props.type] ||
	            props.onChange ||
	            props.readOnly ||
	            props.disabled) {
	          return null;
	        }
	        return new Error(
	          'You provided a `value` prop to a form field without an ' +
	          '`onChange` handler. This will render a read-only field. If ' +
	          'the field should be mutable use `defaultValue`. Otherwise, ' +
	          'set either `onChange` or `readOnly`.'
	        );
	      },
	      checked: function(props, propName, componentName) {
	        if (!props[propName] ||
	            props.onChange ||
	            props.readOnly ||
	            props.disabled) {
	          return null;
	        }
	        return new Error(
	          'You provided a `checked` prop to a form field without an ' +
	          '`onChange` handler. This will render a read-only field. If ' +
	          'the field should be mutable use `defaultChecked`. Otherwise, ' +
	          'set either `onChange` or `readOnly`.'
	        );
	      },
	      onChange: ReactPropTypes.func
	    }
	  },

	  /**
	   * @param {ReactComponent} input Form component
	   * @return {*} current value of the input either from value prop or link.
	   */
	  getValue: function(input) {
	    if (input.props.valueLink) {
	      _assertValueLink(input);
	      return input.props.valueLink.value;
	    }
	    return input.props.value;
	  },

	  /**
	   * @param {ReactComponent} input Form component
	   * @return {*} current checked status of the input either from checked prop
	   *             or link.
	   */
	  getChecked: function(input) {
	    if (input.props.checkedLink) {
	      _assertCheckedLink(input);
	      return input.props.checkedLink.value;
	    }
	    return input.props.checked;
	  },

	  /**
	   * @param {ReactComponent} input Form component
	   * @return {function} change callback either from onChange prop or link.
	   */
	  getOnChange: function(input) {
	    if (input.props.valueLink) {
	      _assertValueLink(input);
	      return _handleLinkedValueChange;
	    } else if (input.props.checkedLink) {
	      _assertCheckedLink(input);
	      return _handleLinkedCheckChange;
	    }
	    return input.props.onChange;
	  }
	};

	module.exports = LinkedValueUtils;

	},{"135":135,"78":78}],25:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule LocalEventTrapMixin
	 */

	'use strict';

	var ReactBrowserEventEmitter = _dereq_(30);

	var accumulateInto = _dereq_(105);
	var forEachAccumulated = _dereq_(120);
	var invariant = _dereq_(135);

	function remove(event) {
	  event.remove();
	}

	var LocalEventTrapMixin = {
	  trapBubbledEvent:function(topLevelType, handlerBaseName) {
	    (true ? invariant(this.isMounted(), 'Must be mounted to trap events') : invariant(this.isMounted()));
	    // If a component renders to null or if another component fatals and causes
	    // the state of the tree to be corrupted, `node` here can be null.
	    var node = this.getDOMNode();
	    (true ? invariant(
	      node,
	      'LocalEventTrapMixin.trapBubbledEvent(...): Requires node to be rendered.'
	    ) : invariant(node));
	    var listener = ReactBrowserEventEmitter.trapBubbledEvent(
	      topLevelType,
	      handlerBaseName,
	      node
	    );
	    this._localEventListeners =
	      accumulateInto(this._localEventListeners, listener);
	  },

	  // trapCapturedEvent would look nearly identical. We don't implement that
	  // method because it isn't currently needed.

	  componentWillUnmount:function() {
	    if (this._localEventListeners) {
	      forEachAccumulated(this._localEventListeners, remove);
	    }
	  }
	};

	module.exports = LocalEventTrapMixin;

	},{"105":105,"120":120,"135":135,"30":30}],26:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule MobileSafariClickEventPlugin
	 * @typechecks static-only
	 */

	'use strict';

	var EventConstants = _dereq_(15);

	var emptyFunction = _dereq_(114);

	var topLevelTypes = EventConstants.topLevelTypes;

	/**
	 * Mobile Safari does not fire properly bubble click events on non-interactive
	 * elements, which means delegated click listeners do not fire. The workaround
	 * for this bug involves attaching an empty click listener on the target node.
	 *
	 * This particular plugin works around the bug by attaching an empty click
	 * listener on `touchstart` (which does fire on every element).
	 */
	var MobileSafariClickEventPlugin = {

	  eventTypes: null,

	  /**
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {DOMEventTarget} topLevelTarget The listening component root node.
	   * @param {string} topLevelTargetID ID of `topLevelTarget`.
	   * @param {object} nativeEvent Native browser event.
	   * @return {*} An accumulation of synthetic events.
	   * @see {EventPluginHub.extractEvents}
	   */
	  extractEvents: function(
	      topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      nativeEvent) {
	    if (topLevelType === topLevelTypes.topTouchStart) {
	      var target = nativeEvent.target;
	      if (target && !target.onclick) {
	        target.onclick = emptyFunction;
	      }
	    }
	  }

	};

	module.exports = MobileSafariClickEventPlugin;

	},{"114":114,"15":15}],27:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule Object.assign
	 */

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign

	'use strict';

	function assign(target, sources) {
	  if (target == null) {
	    throw new TypeError('Object.assign target cannot be null or undefined');
	  }

	  var to = Object(target);
	  var hasOwnProperty = Object.prototype.hasOwnProperty;

	  for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
	    var nextSource = arguments[nextIndex];
	    if (nextSource == null) {
	      continue;
	    }

	    var from = Object(nextSource);

	    // We don't currently support accessors nor proxies. Therefore this
	    // copy cannot throw. If we ever supported this then we must handle
	    // exceptions and side-effects. We don't support symbols so they won't
	    // be transferred.

	    for (var key in from) {
	      if (hasOwnProperty.call(from, key)) {
	        to[key] = from[key];
	      }
	    }
	  }

	  return to;
	}

	module.exports = assign;

	},{}],28:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule PooledClass
	 */

	'use strict';

	var invariant = _dereq_(135);

	/**
	 * Static poolers. Several custom versions for each potential number of
	 * arguments. A completely generic pooler is easy to implement, but would
	 * require accessing the `arguments` object. In each of these, `this` refers to
	 * the Class itself, not an instance. If any others are needed, simply add them
	 * here, or in their own files.
	 */
	var oneArgumentPooler = function(copyFieldsFrom) {
	  var Klass = this;
	  if (Klass.instancePool.length) {
	    var instance = Klass.instancePool.pop();
	    Klass.call(instance, copyFieldsFrom);
	    return instance;
	  } else {
	    return new Klass(copyFieldsFrom);
	  }
	};

	var twoArgumentPooler = function(a1, a2) {
	  var Klass = this;
	  if (Klass.instancePool.length) {
	    var instance = Klass.instancePool.pop();
	    Klass.call(instance, a1, a2);
	    return instance;
	  } else {
	    return new Klass(a1, a2);
	  }
	};

	var threeArgumentPooler = function(a1, a2, a3) {
	  var Klass = this;
	  if (Klass.instancePool.length) {
	    var instance = Klass.instancePool.pop();
	    Klass.call(instance, a1, a2, a3);
	    return instance;
	  } else {
	    return new Klass(a1, a2, a3);
	  }
	};

	var fiveArgumentPooler = function(a1, a2, a3, a4, a5) {
	  var Klass = this;
	  if (Klass.instancePool.length) {
	    var instance = Klass.instancePool.pop();
	    Klass.call(instance, a1, a2, a3, a4, a5);
	    return instance;
	  } else {
	    return new Klass(a1, a2, a3, a4, a5);
	  }
	};

	var standardReleaser = function(instance) {
	  var Klass = this;
	  (true ? invariant(
	    instance instanceof Klass,
	    'Trying to release an instance into a pool of a different type.'
	  ) : invariant(instance instanceof Klass));
	  if (instance.destructor) {
	    instance.destructor();
	  }
	  if (Klass.instancePool.length < Klass.poolSize) {
	    Klass.instancePool.push(instance);
	  }
	};

	var DEFAULT_POOL_SIZE = 10;
	var DEFAULT_POOLER = oneArgumentPooler;

	/**
	 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
	 * itself (statically) not adding any prototypical fields. Any CopyConstructor
	 * you give this may have a `poolSize` property, and will look for a
	 * prototypical `destructor` on instances (optional).
	 *
	 * @param {Function} CopyConstructor Constructor that can be used to reset.
	 * @param {Function} pooler Customizable pooler.
	 */
	var addPoolingTo = function(CopyConstructor, pooler) {
	  var NewKlass = CopyConstructor;
	  NewKlass.instancePool = [];
	  NewKlass.getPooled = pooler || DEFAULT_POOLER;
	  if (!NewKlass.poolSize) {
	    NewKlass.poolSize = DEFAULT_POOL_SIZE;
	  }
	  NewKlass.release = standardReleaser;
	  return NewKlass;
	};

	var PooledClass = {
	  addPoolingTo: addPoolingTo,
	  oneArgumentPooler: oneArgumentPooler,
	  twoArgumentPooler: twoArgumentPooler,
	  threeArgumentPooler: threeArgumentPooler,
	  fiveArgumentPooler: fiveArgumentPooler
	};

	module.exports = PooledClass;

	},{"135":135}],29:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactBrowserComponentMixin
	 */

	'use strict';

	var findDOMNode = _dereq_(117);

	var ReactBrowserComponentMixin = {
	  /**
	   * Returns the DOM node rendered by this component.
	   *
	   * @return {DOMElement} The root node of this component.
	   * @final
	   * @protected
	   */
	  getDOMNode: function() {
	    return findDOMNode(this);
	  }
	};

	module.exports = ReactBrowserComponentMixin;

	},{"117":117}],30:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactBrowserEventEmitter
	 * @typechecks static-only
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var EventPluginHub = _dereq_(17);
	var EventPluginRegistry = _dereq_(18);
	var ReactEventEmitterMixin = _dereq_(61);
	var ViewportMetrics = _dereq_(104);

	var assign = _dereq_(27);
	var isEventSupported = _dereq_(136);

	/**
	 * Summary of `ReactBrowserEventEmitter` event handling:
	 *
	 *  - Top-level delegation is used to trap most native browser events. This
	 *    may only occur in the main thread and is the responsibility of
	 *    ReactEventListener, which is injected and can therefore support pluggable
	 *    event sources. This is the only work that occurs in the main thread.
	 *
	 *  - We normalize and de-duplicate events to account for browser quirks. This
	 *    may be done in the worker thread.
	 *
	 *  - Forward these native events (with the associated top-level type used to
	 *    trap it) to `EventPluginHub`, which in turn will ask plugins if they want
	 *    to extract any synthetic events.
	 *
	 *  - The `EventPluginHub` will then process each event by annotating them with
	 *    "dispatches", a sequence of listeners and IDs that care about that event.
	 *
	 *  - The `EventPluginHub` then dispatches the events.
	 *
	 * Overview of React and the event system:
	 *
	 * +------------+    .
	 * |    DOM     |    .
	 * +------------+    .
	 *       |           .
	 *       v           .
	 * +------------+    .
	 * | ReactEvent |    .
	 * |  Listener  |    .
	 * +------------+    .                         +-----------+
	 *       |           .               +--------+|SimpleEvent|
	 *       |           .               |         |Plugin     |
	 * +-----|------+    .               v         +-----------+
	 * |     |      |    .    +--------------+                    +------------+
	 * |     +-----------.--->|EventPluginHub|                    |    Event   |
	 * |            |    .    |              |     +-----------+  | Propagators|
	 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
	 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
	 * |            |    .    |              |     +-----------+  |  utilities |
	 * |     +-----------.--->|              |                    +------------+
	 * |     |      |    .    +--------------+
	 * +-----|------+    .                ^        +-----------+
	 *       |           .                |        |Enter/Leave|
	 *       +           .                +-------+|Plugin     |
	 * +-------------+   .                         +-----------+
	 * | application |   .
	 * |-------------|   .
	 * |             |   .
	 * |             |   .
	 * +-------------+   .
	 *                   .
	 *    React Core     .  General Purpose Event Plugin System
	 */

	var alreadyListeningTo = {};
	var isMonitoringScrollValue = false;
	var reactTopListenersCounter = 0;

	// For events like 'submit' which don't consistently bubble (which we trap at a
	// lower node than `document`), binding at `document` would cause duplicate
	// events so we don't include them here
	var topEventMapping = {
	  topBlur: 'blur',
	  topChange: 'change',
	  topClick: 'click',
	  topCompositionEnd: 'compositionend',
	  topCompositionStart: 'compositionstart',
	  topCompositionUpdate: 'compositionupdate',
	  topContextMenu: 'contextmenu',
	  topCopy: 'copy',
	  topCut: 'cut',
	  topDoubleClick: 'dblclick',
	  topDrag: 'drag',
	  topDragEnd: 'dragend',
	  topDragEnter: 'dragenter',
	  topDragExit: 'dragexit',
	  topDragLeave: 'dragleave',
	  topDragOver: 'dragover',
	  topDragStart: 'dragstart',
	  topDrop: 'drop',
	  topFocus: 'focus',
	  topInput: 'input',
	  topKeyDown: 'keydown',
	  topKeyPress: 'keypress',
	  topKeyUp: 'keyup',
	  topMouseDown: 'mousedown',
	  topMouseMove: 'mousemove',
	  topMouseOut: 'mouseout',
	  topMouseOver: 'mouseover',
	  topMouseUp: 'mouseup',
	  topPaste: 'paste',
	  topScroll: 'scroll',
	  topSelectionChange: 'selectionchange',
	  topTextInput: 'textInput',
	  topTouchCancel: 'touchcancel',
	  topTouchEnd: 'touchend',
	  topTouchMove: 'touchmove',
	  topTouchStart: 'touchstart',
	  topWheel: 'wheel'
	};

	/**
	 * To ensure no conflicts with other potential React instances on the page
	 */
	var topListenersIDKey = '_reactListenersID' + String(Math.random()).slice(2);

	function getListeningForDocument(mountAt) {
	  // In IE8, `mountAt` is a host object and doesn't have `hasOwnProperty`
	  // directly.
	  if (!Object.prototype.hasOwnProperty.call(mountAt, topListenersIDKey)) {
	    mountAt[topListenersIDKey] = reactTopListenersCounter++;
	    alreadyListeningTo[mountAt[topListenersIDKey]] = {};
	  }
	  return alreadyListeningTo[mountAt[topListenersIDKey]];
	}

	/**
	 * `ReactBrowserEventEmitter` is used to attach top-level event listeners. For
	 * example:
	 *
	 *   ReactBrowserEventEmitter.putListener('myID', 'onClick', myFunction);
	 *
	 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
	 *
	 * @internal
	 */
	var ReactBrowserEventEmitter = assign({}, ReactEventEmitterMixin, {

	  /**
	   * Injectable event backend
	   */
	  ReactEventListener: null,

	  injection: {
	    /**
	     * @param {object} ReactEventListener
	     */
	    injectReactEventListener: function(ReactEventListener) {
	      ReactEventListener.setHandleTopLevel(
	        ReactBrowserEventEmitter.handleTopLevel
	      );
	      ReactBrowserEventEmitter.ReactEventListener = ReactEventListener;
	    }
	  },

	  /**
	   * Sets whether or not any created callbacks should be enabled.
	   *
	   * @param {boolean} enabled True if callbacks should be enabled.
	   */
	  setEnabled: function(enabled) {
	    if (ReactBrowserEventEmitter.ReactEventListener) {
	      ReactBrowserEventEmitter.ReactEventListener.setEnabled(enabled);
	    }
	  },

	  /**
	   * @return {boolean} True if callbacks are enabled.
	   */
	  isEnabled: function() {
	    return !!(
	      (ReactBrowserEventEmitter.ReactEventListener && ReactBrowserEventEmitter.ReactEventListener.isEnabled())
	    );
	  },

	  /**
	   * We listen for bubbled touch events on the document object.
	   *
	   * Firefox v8.01 (and possibly others) exhibited strange behavior when
	   * mounting `onmousemove` events at some node that was not the document
	   * element. The symptoms were that if your mouse is not moving over something
	   * contained within that mount point (for example on the background) the
	   * top-level listeners for `onmousemove` won't be called. However, if you
	   * register the `mousemove` on the document object, then it will of course
	   * catch all `mousemove`s. This along with iOS quirks, justifies restricting
	   * top-level listeners to the document object only, at least for these
	   * movement types of events and possibly all events.
	   *
	   * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
	   *
	   * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
	   * they bubble to document.
	   *
	   * @param {string} registrationName Name of listener (e.g. `onClick`).
	   * @param {object} contentDocumentHandle Document which owns the container
	   */
	  listenTo: function(registrationName, contentDocumentHandle) {
	    var mountAt = contentDocumentHandle;
	    var isListening = getListeningForDocument(mountAt);
	    var dependencies = EventPluginRegistry.
	      registrationNameDependencies[registrationName];

	    var topLevelTypes = EventConstants.topLevelTypes;
	    for (var i = 0, l = dependencies.length; i < l; i++) {
	      var dependency = dependencies[i];
	      if (!(
	            (isListening.hasOwnProperty(dependency) && isListening[dependency])
	          )) {
	        if (dependency === topLevelTypes.topWheel) {
	          if (isEventSupported('wheel')) {
	            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
	              topLevelTypes.topWheel,
	              'wheel',
	              mountAt
	            );
	          } else if (isEventSupported('mousewheel')) {
	            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
	              topLevelTypes.topWheel,
	              'mousewheel',
	              mountAt
	            );
	          } else {
	            // Firefox needs to capture a different mouse scroll event.
	            // @see http://www.quirksmode.org/dom/events/tests/scroll.html
	            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
	              topLevelTypes.topWheel,
	              'DOMMouseScroll',
	              mountAt
	            );
	          }
	        } else if (dependency === topLevelTypes.topScroll) {

	          if (isEventSupported('scroll', true)) {
	            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(
	              topLevelTypes.topScroll,
	              'scroll',
	              mountAt
	            );
	          } else {
	            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
	              topLevelTypes.topScroll,
	              'scroll',
	              ReactBrowserEventEmitter.ReactEventListener.WINDOW_HANDLE
	            );
	          }
	        } else if (dependency === topLevelTypes.topFocus ||
	            dependency === topLevelTypes.topBlur) {

	          if (isEventSupported('focus', true)) {
	            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(
	              topLevelTypes.topFocus,
	              'focus',
	              mountAt
	            );
	            ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(
	              topLevelTypes.topBlur,
	              'blur',
	              mountAt
	            );
	          } else if (isEventSupported('focusin')) {
	            // IE has `focusin` and `focusout` events which bubble.
	            // @see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
	            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
	              topLevelTypes.topFocus,
	              'focusin',
	              mountAt
	            );
	            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
	              topLevelTypes.topBlur,
	              'focusout',
	              mountAt
	            );
	          }

	          // to make sure blur and focus event listeners are only attached once
	          isListening[topLevelTypes.topBlur] = true;
	          isListening[topLevelTypes.topFocus] = true;
	        } else if (topEventMapping.hasOwnProperty(dependency)) {
	          ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
	            dependency,
	            topEventMapping[dependency],
	            mountAt
	          );
	        }

	        isListening[dependency] = true;
	      }
	    }
	  },

	  trapBubbledEvent: function(topLevelType, handlerBaseName, handle) {
	    return ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
	      topLevelType,
	      handlerBaseName,
	      handle
	    );
	  },

	  trapCapturedEvent: function(topLevelType, handlerBaseName, handle) {
	    return ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(
	      topLevelType,
	      handlerBaseName,
	      handle
	    );
	  },

	  /**
	   * Listens to window scroll and resize events. We cache scroll values so that
	   * application code can access them without triggering reflows.
	   *
	   * NOTE: Scroll events do not bubble.
	   *
	   * @see http://www.quirksmode.org/dom/events/scroll.html
	   */
	  ensureScrollValueMonitoring: function() {
	    if (!isMonitoringScrollValue) {
	      var refresh = ViewportMetrics.refreshScrollValues;
	      ReactBrowserEventEmitter.ReactEventListener.monitorScrollValue(refresh);
	      isMonitoringScrollValue = true;
	    }
	  },

	  eventNameDispatchConfigs: EventPluginHub.eventNameDispatchConfigs,

	  registrationNameModules: EventPluginHub.registrationNameModules,

	  putListener: EventPluginHub.putListener,

	  getListener: EventPluginHub.getListener,

	  deleteListener: EventPluginHub.deleteListener,

	  deleteAllListeners: EventPluginHub.deleteAllListeners

	});

	module.exports = ReactBrowserEventEmitter;

	},{"104":104,"136":136,"15":15,"17":17,"18":18,"27":27,"61":61}],31:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactChildReconciler
	 * @typechecks static-only
	 */

	'use strict';

	var ReactReconciler = _dereq_(81);

	var flattenChildren = _dereq_(118);
	var instantiateReactComponent = _dereq_(134);
	var shouldUpdateReactComponent = _dereq_(151);

	/**
	 * ReactChildReconciler provides helpers for initializing or updating a set of
	 * children. Its output is suitable for passing it onto ReactMultiChild which
	 * does diffed reordering and insertion.
	 */
	var ReactChildReconciler = {

	  /**
	   * Generates a "mount image" for each of the supplied children. In the case
	   * of `ReactDOMComponent`, a mount image is a string of markup.
	   *
	   * @param {?object} nestedChildNodes Nested child maps.
	   * @return {?object} A set of child instances.
	   * @internal
	   */
	  instantiateChildren: function(nestedChildNodes, transaction, context) {
	    var children = flattenChildren(nestedChildNodes);
	    for (var name in children) {
	      if (children.hasOwnProperty(name)) {
	        var child = children[name];
	        // The rendered children must be turned into instances as they're
	        // mounted.
	        var childInstance = instantiateReactComponent(child, null);
	        children[name] = childInstance;
	      }
	    }
	    return children;
	  },

	  /**
	   * Updates the rendered children and returns a new set of children.
	   *
	   * @param {?object} prevChildren Previously initialized set of children.
	   * @param {?object} nextNestedChildNodes Nested child maps.
	   * @param {ReactReconcileTransaction} transaction
	   * @param {object} context
	   * @return {?object} A new set of child instances.
	   * @internal
	   */
	  updateChildren: function(
	    prevChildren,
	    nextNestedChildNodes,
	    transaction,
	    context) {
	    // We currently don't have a way to track moves here but if we use iterators
	    // instead of for..in we can zip the iterators and check if an item has
	    // moved.
	    // TODO: If nothing has changed, return the prevChildren object so that we
	    // can quickly bailout if nothing has changed.
	    var nextChildren = flattenChildren(nextNestedChildNodes);
	    if (!nextChildren && !prevChildren) {
	      return null;
	    }
	    var name;
	    for (name in nextChildren) {
	      if (!nextChildren.hasOwnProperty(name)) {
	        continue;
	      }
	      var prevChild = prevChildren && prevChildren[name];
	      var prevElement = prevChild && prevChild._currentElement;
	      var nextElement = nextChildren[name];
	      if (shouldUpdateReactComponent(prevElement, nextElement)) {
	        ReactReconciler.receiveComponent(
	          prevChild, nextElement, transaction, context
	        );
	        nextChildren[name] = prevChild;
	      } else {
	        if (prevChild) {
	          ReactReconciler.unmountComponent(prevChild, name);
	        }
	        // The child must be instantiated before it's mounted.
	        var nextChildInstance = instantiateReactComponent(
	          nextElement,
	          null
	        );
	        nextChildren[name] = nextChildInstance;
	      }
	    }
	    // Unmount children that are no longer present.
	    for (name in prevChildren) {
	      if (prevChildren.hasOwnProperty(name) &&
	          !(nextChildren && nextChildren.hasOwnProperty(name))) {
	        ReactReconciler.unmountComponent(prevChildren[name]);
	      }
	    }
	    return nextChildren;
	  },

	  /**
	   * Unmounts all rendered children. This should be used to clean up children
	   * when this component is unmounted.
	   *
	   * @param {?object} renderedChildren Previously initialized set of children.
	   * @internal
	   */
	  unmountChildren: function(renderedChildren) {
	    for (var name in renderedChildren) {
	      var renderedChild = renderedChildren[name];
	      ReactReconciler.unmountComponent(renderedChild);
	    }
	  }

	};

	module.exports = ReactChildReconciler;

	},{"118":118,"134":134,"151":151,"81":81}],32:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactChildren
	 */

	'use strict';

	var PooledClass = _dereq_(28);
	var ReactFragment = _dereq_(63);

	var traverseAllChildren = _dereq_(153);
	var warning = _dereq_(154);

	var twoArgumentPooler = PooledClass.twoArgumentPooler;
	var threeArgumentPooler = PooledClass.threeArgumentPooler;

	/**
	 * PooledClass representing the bookkeeping associated with performing a child
	 * traversal. Allows avoiding binding callbacks.
	 *
	 * @constructor ForEachBookKeeping
	 * @param {!function} forEachFunction Function to perform traversal with.
	 * @param {?*} forEachContext Context to perform context with.
	 */
	function ForEachBookKeeping(forEachFunction, forEachContext) {
	  this.forEachFunction = forEachFunction;
	  this.forEachContext = forEachContext;
	}
	PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);

	function forEachSingleChild(traverseContext, child, name, i) {
	  var forEachBookKeeping = traverseContext;
	  forEachBookKeeping.forEachFunction.call(
	    forEachBookKeeping.forEachContext, child, i);
	}

	/**
	 * Iterates through children that are typically specified as `props.children`.
	 *
	 * The provided forEachFunc(child, index) will be called for each
	 * leaf child.
	 *
	 * @param {?*} children Children tree container.
	 * @param {function(*, int)} forEachFunc.
	 * @param {*} forEachContext Context for forEachContext.
	 */
	function forEachChildren(children, forEachFunc, forEachContext) {
	  if (children == null) {
	    return children;
	  }

	  var traverseContext =
	    ForEachBookKeeping.getPooled(forEachFunc, forEachContext);
	  traverseAllChildren(children, forEachSingleChild, traverseContext);
	  ForEachBookKeeping.release(traverseContext);
	}

	/**
	 * PooledClass representing the bookkeeping associated with performing a child
	 * mapping. Allows avoiding binding callbacks.
	 *
	 * @constructor MapBookKeeping
	 * @param {!*} mapResult Object containing the ordered map of results.
	 * @param {!function} mapFunction Function to perform mapping with.
	 * @param {?*} mapContext Context to perform mapping with.
	 */
	function MapBookKeeping(mapResult, mapFunction, mapContext) {
	  this.mapResult = mapResult;
	  this.mapFunction = mapFunction;
	  this.mapContext = mapContext;
	}
	PooledClass.addPoolingTo(MapBookKeeping, threeArgumentPooler);

	function mapSingleChildIntoContext(traverseContext, child, name, i) {
	  var mapBookKeeping = traverseContext;
	  var mapResult = mapBookKeeping.mapResult;

	  var keyUnique = !mapResult.hasOwnProperty(name);
	  if (true) {
	    (true ? warning(
	      keyUnique,
	      'ReactChildren.map(...): Encountered two children with the same key, ' +
	      '`%s`. Child keys must be unique; when two children share a key, only ' +
	      'the first child will be used.',
	      name
	    ) : null);
	  }

	  if (keyUnique) {
	    var mappedChild =
	      mapBookKeeping.mapFunction.call(mapBookKeeping.mapContext, child, i);
	    mapResult[name] = mappedChild;
	  }
	}

	/**
	 * Maps children that are typically specified as `props.children`.
	 *
	 * The provided mapFunction(child, key, index) will be called for each
	 * leaf child.
	 *
	 * TODO: This may likely break any calls to `ReactChildren.map` that were
	 * previously relying on the fact that we guarded against null children.
	 *
	 * @param {?*} children Children tree container.
	 * @param {function(*, int)} mapFunction.
	 * @param {*} mapContext Context for mapFunction.
	 * @return {object} Object containing the ordered map of results.
	 */
	function mapChildren(children, func, context) {
	  if (children == null) {
	    return children;
	  }

	  var mapResult = {};
	  var traverseContext = MapBookKeeping.getPooled(mapResult, func, context);
	  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
	  MapBookKeeping.release(traverseContext);
	  return ReactFragment.create(mapResult);
	}

	function forEachSingleChildDummy(traverseContext, child, name, i) {
	  return null;
	}

	/**
	 * Count the number of children that are typically specified as
	 * `props.children`.
	 *
	 * @param {?*} children Children tree container.
	 * @return {number} The number of children.
	 */
	function countChildren(children, context) {
	  return traverseAllChildren(children, forEachSingleChildDummy, null);
	}

	var ReactChildren = {
	  forEach: forEachChildren,
	  map: mapChildren,
	  count: countChildren
	};

	module.exports = ReactChildren;

	},{"153":153,"154":154,"28":28,"63":63}],33:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactClass
	 */

	'use strict';

	var ReactComponent = _dereq_(34);
	var ReactCurrentOwner = _dereq_(39);
	var ReactElement = _dereq_(57);
	var ReactErrorUtils = _dereq_(60);
	var ReactInstanceMap = _dereq_(67);
	var ReactLifeCycle = _dereq_(68);
	var ReactPropTypeLocations = _dereq_(77);
	var ReactPropTypeLocationNames = _dereq_(76);
	var ReactUpdateQueue = _dereq_(86);

	var assign = _dereq_(27);
	var invariant = _dereq_(135);
	var keyMirror = _dereq_(140);
	var keyOf = _dereq_(141);
	var warning = _dereq_(154);

	var MIXINS_KEY = keyOf({mixins: null});

	/**
	 * Policies that describe methods in `ReactClassInterface`.
	 */
	var SpecPolicy = keyMirror({
	  /**
	   * These methods may be defined only once by the class specification or mixin.
	   */
	  DEFINE_ONCE: null,
	  /**
	   * These methods may be defined by both the class specification and mixins.
	   * Subsequent definitions will be chained. These methods must return void.
	   */
	  DEFINE_MANY: null,
	  /**
	   * These methods are overriding the base class.
	   */
	  OVERRIDE_BASE: null,
	  /**
	   * These methods are similar to DEFINE_MANY, except we assume they return
	   * objects. We try to merge the keys of the return values of all the mixed in
	   * functions. If there is a key conflict we throw.
	   */
	  DEFINE_MANY_MERGED: null
	});


	var injectedMixins = [];

	/**
	 * Composite components are higher-level components that compose other composite
	 * or native components.
	 *
	 * To create a new type of `ReactClass`, pass a specification of
	 * your new class to `React.createClass`. The only requirement of your class
	 * specification is that you implement a `render` method.
	 *
	 *   var MyComponent = React.createClass({
	 *     render: function() {
	 *       return <div>Hello World</div>;
	 *     }
	 *   });
	 *
	 * The class specification supports a specific protocol of methods that have
	 * special meaning (e.g. `render`). See `ReactClassInterface` for
	 * more the comprehensive protocol. Any other properties and methods in the
	 * class specification will available on the prototype.
	 *
	 * @interface ReactClassInterface
	 * @internal
	 */
	var ReactClassInterface = {

	  /**
	   * An array of Mixin objects to include when defining your component.
	   *
	   * @type {array}
	   * @optional
	   */
	  mixins: SpecPolicy.DEFINE_MANY,

	  /**
	   * An object containing properties and methods that should be defined on
	   * the component's constructor instead of its prototype (static methods).
	   *
	   * @type {object}
	   * @optional
	   */
	  statics: SpecPolicy.DEFINE_MANY,

	  /**
	   * Definition of prop types for this component.
	   *
	   * @type {object}
	   * @optional
	   */
	  propTypes: SpecPolicy.DEFINE_MANY,

	  /**
	   * Definition of context types for this component.
	   *
	   * @type {object}
	   * @optional
	   */
	  contextTypes: SpecPolicy.DEFINE_MANY,

	  /**
	   * Definition of context types this component sets for its children.
	   *
	   * @type {object}
	   * @optional
	   */
	  childContextTypes: SpecPolicy.DEFINE_MANY,

	  // ==== Definition methods ====

	  /**
	   * Invoked when the component is mounted. Values in the mapping will be set on
	   * `this.props` if that prop is not specified (i.e. using an `in` check).
	   *
	   * This method is invoked before `getInitialState` and therefore cannot rely
	   * on `this.state` or use `this.setState`.
	   *
	   * @return {object}
	   * @optional
	   */
	  getDefaultProps: SpecPolicy.DEFINE_MANY_MERGED,

	  /**
	   * Invoked once before the component is mounted. The return value will be used
	   * as the initial value of `this.state`.
	   *
	   *   getInitialState: function() {
	   *     return {
	   *       isOn: false,
	   *       fooBaz: new BazFoo()
	   *     }
	   *   }
	   *
	   * @return {object}
	   * @optional
	   */
	  getInitialState: SpecPolicy.DEFINE_MANY_MERGED,

	  /**
	   * @return {object}
	   * @optional
	   */
	  getChildContext: SpecPolicy.DEFINE_MANY_MERGED,

	  /**
	   * Uses props from `this.props` and state from `this.state` to render the
	   * structure of the component.
	   *
	   * No guarantees are made about when or how often this method is invoked, so
	   * it must not have side effects.
	   *
	   *   render: function() {
	   *     var name = this.props.name;
	   *     return <div>Hello, {name}!</div>;
	   *   }
	   *
	   * @return {ReactComponent}
	   * @nosideeffects
	   * @required
	   */
	  render: SpecPolicy.DEFINE_ONCE,



	  // ==== Delegate methods ====

	  /**
	   * Invoked when the component is initially created and about to be mounted.
	   * This may have side effects, but any external subscriptions or data created
	   * by this method must be cleaned up in `componentWillUnmount`.
	   *
	   * @optional
	   */
	  componentWillMount: SpecPolicy.DEFINE_MANY,

	  /**
	   * Invoked when the component has been mounted and has a DOM representation.
	   * However, there is no guarantee that the DOM node is in the document.
	   *
	   * Use this as an opportunity to operate on the DOM when the component has
	   * been mounted (initialized and rendered) for the first time.
	   *
	   * @param {DOMElement} rootNode DOM element representing the component.
	   * @optional
	   */
	  componentDidMount: SpecPolicy.DEFINE_MANY,

	  /**
	   * Invoked before the component receives new props.
	   *
	   * Use this as an opportunity to react to a prop transition by updating the
	   * state using `this.setState`. Current props are accessed via `this.props`.
	   *
	   *   componentWillReceiveProps: function(nextProps, nextContext) {
	   *     this.setState({
	   *       likesIncreasing: nextProps.likeCount > this.props.likeCount
	   *     });
	   *   }
	   *
	   * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
	   * transition may cause a state change, but the opposite is not true. If you
	   * need it, you are probably looking for `componentWillUpdate`.
	   *
	   * @param {object} nextProps
	   * @optional
	   */
	  componentWillReceiveProps: SpecPolicy.DEFINE_MANY,

	  /**
	   * Invoked while deciding if the component should be updated as a result of
	   * receiving new props, state and/or context.
	   *
	   * Use this as an opportunity to `return false` when you're certain that the
	   * transition to the new props/state/context will not require a component
	   * update.
	   *
	   *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
	   *     return !equal(nextProps, this.props) ||
	   *       !equal(nextState, this.state) ||
	   *       !equal(nextContext, this.context);
	   *   }
	   *
	   * @param {object} nextProps
	   * @param {?object} nextState
	   * @param {?object} nextContext
	   * @return {boolean} True if the component should update.
	   * @optional
	   */
	  shouldComponentUpdate: SpecPolicy.DEFINE_ONCE,

	  /**
	   * Invoked when the component is about to update due to a transition from
	   * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
	   * and `nextContext`.
	   *
	   * Use this as an opportunity to perform preparation before an update occurs.
	   *
	   * NOTE: You **cannot** use `this.setState()` in this method.
	   *
	   * @param {object} nextProps
	   * @param {?object} nextState
	   * @param {?object} nextContext
	   * @param {ReactReconcileTransaction} transaction
	   * @optional
	   */
	  componentWillUpdate: SpecPolicy.DEFINE_MANY,

	  /**
	   * Invoked when the component's DOM representation has been updated.
	   *
	   * Use this as an opportunity to operate on the DOM when the component has
	   * been updated.
	   *
	   * @param {object} prevProps
	   * @param {?object} prevState
	   * @param {?object} prevContext
	   * @param {DOMElement} rootNode DOM element representing the component.
	   * @optional
	   */
	  componentDidUpdate: SpecPolicy.DEFINE_MANY,

	  /**
	   * Invoked when the component is about to be removed from its parent and have
	   * its DOM representation destroyed.
	   *
	   * Use this as an opportunity to deallocate any external resources.
	   *
	   * NOTE: There is no `componentDidUnmount` since your component will have been
	   * destroyed by that point.
	   *
	   * @optional
	   */
	  componentWillUnmount: SpecPolicy.DEFINE_MANY,



	  // ==== Advanced methods ====

	  /**
	   * Updates the component's currently mounted DOM representation.
	   *
	   * By default, this implements React's rendering and reconciliation algorithm.
	   * Sophisticated clients may wish to override this.
	   *
	   * @param {ReactReconcileTransaction} transaction
	   * @internal
	   * @overridable
	   */
	  updateComponent: SpecPolicy.OVERRIDE_BASE

	};

	/**
	 * Mapping from class specification keys to special processing functions.
	 *
	 * Although these are declared like instance properties in the specification
	 * when defining classes using `React.createClass`, they are actually static
	 * and are accessible on the constructor instead of the prototype. Despite
	 * being static, they must be defined outside of the "statics" key under
	 * which all other static methods are defined.
	 */
	var RESERVED_SPEC_KEYS = {
	  displayName: function(Constructor, displayName) {
	    Constructor.displayName = displayName;
	  },
	  mixins: function(Constructor, mixins) {
	    if (mixins) {
	      for (var i = 0; i < mixins.length; i++) {
	        mixSpecIntoComponent(Constructor, mixins[i]);
	      }
	    }
	  },
	  childContextTypes: function(Constructor, childContextTypes) {
	    if (true) {
	      validateTypeDef(
	        Constructor,
	        childContextTypes,
	        ReactPropTypeLocations.childContext
	      );
	    }
	    Constructor.childContextTypes = assign(
	      {},
	      Constructor.childContextTypes,
	      childContextTypes
	    );
	  },
	  contextTypes: function(Constructor, contextTypes) {
	    if (true) {
	      validateTypeDef(
	        Constructor,
	        contextTypes,
	        ReactPropTypeLocations.context
	      );
	    }
	    Constructor.contextTypes = assign(
	      {},
	      Constructor.contextTypes,
	      contextTypes
	    );
	  },
	  /**
	   * Special case getDefaultProps which should move into statics but requires
	   * automatic merging.
	   */
	  getDefaultProps: function(Constructor, getDefaultProps) {
	    if (Constructor.getDefaultProps) {
	      Constructor.getDefaultProps = createMergedResultFunction(
	        Constructor.getDefaultProps,
	        getDefaultProps
	      );
	    } else {
	      Constructor.getDefaultProps = getDefaultProps;
	    }
	  },
	  propTypes: function(Constructor, propTypes) {
	    if (true) {
	      validateTypeDef(
	        Constructor,
	        propTypes,
	        ReactPropTypeLocations.prop
	      );
	    }
	    Constructor.propTypes = assign(
	      {},
	      Constructor.propTypes,
	      propTypes
	    );
	  },
	  statics: function(Constructor, statics) {
	    mixStaticSpecIntoComponent(Constructor, statics);
	  }
	};

	function validateTypeDef(Constructor, typeDef, location) {
	  for (var propName in typeDef) {
	    if (typeDef.hasOwnProperty(propName)) {
	      // use a warning instead of an invariant so components
	      // don't show up in prod but not in __DEV__
	      (true ? warning(
	        typeof typeDef[propName] === 'function',
	        '%s: %s type `%s` is invalid; it must be a function, usually from ' +
	        'React.PropTypes.',
	        Constructor.displayName || 'ReactClass',
	        ReactPropTypeLocationNames[location],
	        propName
	      ) : null);
	    }
	  }
	}

	function validateMethodOverride(proto, name) {
	  var specPolicy = ReactClassInterface.hasOwnProperty(name) ?
	    ReactClassInterface[name] :
	    null;

	  // Disallow overriding of base class methods unless explicitly allowed.
	  if (ReactClassMixin.hasOwnProperty(name)) {
	    (true ? invariant(
	      specPolicy === SpecPolicy.OVERRIDE_BASE,
	      'ReactClassInterface: You are attempting to override ' +
	      '`%s` from your class specification. Ensure that your method names ' +
	      'do not overlap with React methods.',
	      name
	    ) : invariant(specPolicy === SpecPolicy.OVERRIDE_BASE));
	  }

	  // Disallow defining methods more than once unless explicitly allowed.
	  if (proto.hasOwnProperty(name)) {
	    (true ? invariant(
	      specPolicy === SpecPolicy.DEFINE_MANY ||
	      specPolicy === SpecPolicy.DEFINE_MANY_MERGED,
	      'ReactClassInterface: You are attempting to define ' +
	      '`%s` on your component more than once. This conflict may be due ' +
	      'to a mixin.',
	      name
	    ) : invariant(specPolicy === SpecPolicy.DEFINE_MANY ||
	    specPolicy === SpecPolicy.DEFINE_MANY_MERGED));
	  }
	}

	/**
	 * Mixin helper which handles policy validation and reserved
	 * specification keys when building React classses.
	 */
	function mixSpecIntoComponent(Constructor, spec) {
	  if (!spec) {
	    return;
	  }

	  (true ? invariant(
	    typeof spec !== 'function',
	    'ReactClass: You\'re attempting to ' +
	    'use a component class as a mixin. Instead, just use a regular object.'
	  ) : invariant(typeof spec !== 'function'));
	  (true ? invariant(
	    !ReactElement.isValidElement(spec),
	    'ReactClass: You\'re attempting to ' +
	    'use a component as a mixin. Instead, just use a regular object.'
	  ) : invariant(!ReactElement.isValidElement(spec)));

	  var proto = Constructor.prototype;

	  // By handling mixins before any other properties, we ensure the same
	  // chaining order is applied to methods with DEFINE_MANY policy, whether
	  // mixins are listed before or after these methods in the spec.
	  if (spec.hasOwnProperty(MIXINS_KEY)) {
	    RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);
	  }

	  for (var name in spec) {
	    if (!spec.hasOwnProperty(name)) {
	      continue;
	    }

	    if (name === MIXINS_KEY) {
	      // We have already handled mixins in a special case above
	      continue;
	    }

	    var property = spec[name];
	    validateMethodOverride(proto, name);

	    if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
	      RESERVED_SPEC_KEYS[name](Constructor, property);
	    } else {
	      // Setup methods on prototype:
	      // The following member methods should not be automatically bound:
	      // 1. Expected ReactClass methods (in the "interface").
	      // 2. Overridden methods (that were mixed in).
	      var isReactClassMethod =
	        ReactClassInterface.hasOwnProperty(name);
	      var isAlreadyDefined = proto.hasOwnProperty(name);
	      var markedDontBind = property && property.__reactDontBind;
	      var isFunction = typeof property === 'function';
	      var shouldAutoBind =
	        isFunction &&
	        !isReactClassMethod &&
	        !isAlreadyDefined &&
	        !markedDontBind;

	      if (shouldAutoBind) {
	        if (!proto.__reactAutoBindMap) {
	          proto.__reactAutoBindMap = {};
	        }
	        proto.__reactAutoBindMap[name] = property;
	        proto[name] = property;
	      } else {
	        if (isAlreadyDefined) {
	          var specPolicy = ReactClassInterface[name];

	          // These cases should already be caught by validateMethodOverride
	          (true ? invariant(
	            isReactClassMethod && (
	              (specPolicy === SpecPolicy.DEFINE_MANY_MERGED || specPolicy === SpecPolicy.DEFINE_MANY)
	            ),
	            'ReactClass: Unexpected spec policy %s for key %s ' +
	            'when mixing in component specs.',
	            specPolicy,
	            name
	          ) : invariant(isReactClassMethod && (
	            (specPolicy === SpecPolicy.DEFINE_MANY_MERGED || specPolicy === SpecPolicy.DEFINE_MANY)
	          )));

	          // For methods which are defined more than once, call the existing
	          // methods before calling the new property, merging if appropriate.
	          if (specPolicy === SpecPolicy.DEFINE_MANY_MERGED) {
	            proto[name] = createMergedResultFunction(proto[name], property);
	          } else if (specPolicy === SpecPolicy.DEFINE_MANY) {
	            proto[name] = createChainedFunction(proto[name], property);
	          }
	        } else {
	          proto[name] = property;
	          if (true) {
	            // Add verbose displayName to the function, which helps when looking
	            // at profiling tools.
	            if (typeof property === 'function' && spec.displayName) {
	              proto[name].displayName = spec.displayName + '_' + name;
	            }
	          }
	        }
	      }
	    }
	  }
	}

	function mixStaticSpecIntoComponent(Constructor, statics) {
	  if (!statics) {
	    return;
	  }
	  for (var name in statics) {
	    var property = statics[name];
	    if (!statics.hasOwnProperty(name)) {
	      continue;
	    }

	    var isReserved = name in RESERVED_SPEC_KEYS;
	    (true ? invariant(
	      !isReserved,
	      'ReactClass: You are attempting to define a reserved ' +
	      'property, `%s`, that shouldn\'t be on the "statics" key. Define it ' +
	      'as an instance property instead; it will still be accessible on the ' +
	      'constructor.',
	      name
	    ) : invariant(!isReserved));

	    var isInherited = name in Constructor;
	    (true ? invariant(
	      !isInherited,
	      'ReactClass: You are attempting to define ' +
	      '`%s` on your component more than once. This conflict may be ' +
	      'due to a mixin.',
	      name
	    ) : invariant(!isInherited));
	    Constructor[name] = property;
	  }
	}

	/**
	 * Merge two objects, but throw if both contain the same key.
	 *
	 * @param {object} one The first object, which is mutated.
	 * @param {object} two The second object
	 * @return {object} one after it has been mutated to contain everything in two.
	 */
	function mergeIntoWithNoDuplicateKeys(one, two) {
	  (true ? invariant(
	    one && two && typeof one === 'object' && typeof two === 'object',
	    'mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.'
	  ) : invariant(one && two && typeof one === 'object' && typeof two === 'object'));

	  for (var key in two) {
	    if (two.hasOwnProperty(key)) {
	      (true ? invariant(
	        one[key] === undefined,
	        'mergeIntoWithNoDuplicateKeys(): ' +
	        'Tried to merge two objects with the same key: `%s`. This conflict ' +
	        'may be due to a mixin; in particular, this may be caused by two ' +
	        'getInitialState() or getDefaultProps() methods returning objects ' +
	        'with clashing keys.',
	        key
	      ) : invariant(one[key] === undefined));
	      one[key] = two[key];
	    }
	  }
	  return one;
	}

	/**
	 * Creates a function that invokes two functions and merges their return values.
	 *
	 * @param {function} one Function to invoke first.
	 * @param {function} two Function to invoke second.
	 * @return {function} Function that invokes the two argument functions.
	 * @private
	 */
	function createMergedResultFunction(one, two) {
	  return function mergedResult() {
	    var a = one.apply(this, arguments);
	    var b = two.apply(this, arguments);
	    if (a == null) {
	      return b;
	    } else if (b == null) {
	      return a;
	    }
	    var c = {};
	    mergeIntoWithNoDuplicateKeys(c, a);
	    mergeIntoWithNoDuplicateKeys(c, b);
	    return c;
	  };
	}

	/**
	 * Creates a function that invokes two functions and ignores their return vales.
	 *
	 * @param {function} one Function to invoke first.
	 * @param {function} two Function to invoke second.
	 * @return {function} Function that invokes the two argument functions.
	 * @private
	 */
	function createChainedFunction(one, two) {
	  return function chainedFunction() {
	    one.apply(this, arguments);
	    two.apply(this, arguments);
	  };
	}

	/**
	 * Binds a method to the component.
	 *
	 * @param {object} component Component whose method is going to be bound.
	 * @param {function} method Method to be bound.
	 * @return {function} The bound method.
	 */
	function bindAutoBindMethod(component, method) {
	  var boundMethod = method.bind(component);
	  if (true) {
	    boundMethod.__reactBoundContext = component;
	    boundMethod.__reactBoundMethod = method;
	    boundMethod.__reactBoundArguments = null;
	    var componentName = component.constructor.displayName;
	    var _bind = boundMethod.bind;
	    /* eslint-disable block-scoped-var, no-undef */
	    boundMethod.bind = function(newThis ) {for (var args=[],$__0=1,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
	      // User is trying to bind() an autobound method; we effectively will
	      // ignore the value of "this" that the user is trying to use, so
	      // let's warn.
	      if (newThis !== component && newThis !== null) {
	        (true ? warning(
	          false,
	          'bind(): React component methods may only be bound to the ' +
	          'component instance. See %s',
	          componentName
	        ) : null);
	      } else if (!args.length) {
	        (true ? warning(
	          false,
	          'bind(): You are binding a component method to the component. ' +
	          'React does this for you automatically in a high-performance ' +
	          'way, so you can safely remove this call. See %s',
	          componentName
	        ) : null);
	        return boundMethod;
	      }
	      var reboundMethod = _bind.apply(boundMethod, arguments);
	      reboundMethod.__reactBoundContext = component;
	      reboundMethod.__reactBoundMethod = method;
	      reboundMethod.__reactBoundArguments = args;
	      return reboundMethod;
	      /* eslint-enable */
	    };
	  }
	  return boundMethod;
	}

	/**
	 * Binds all auto-bound methods in a component.
	 *
	 * @param {object} component Component whose method is going to be bound.
	 */
	function bindAutoBindMethods(component) {
	  for (var autoBindKey in component.__reactAutoBindMap) {
	    if (component.__reactAutoBindMap.hasOwnProperty(autoBindKey)) {
	      var method = component.__reactAutoBindMap[autoBindKey];
	      component[autoBindKey] = bindAutoBindMethod(
	        component,
	        ReactErrorUtils.guard(
	          method,
	          component.constructor.displayName + '.' + autoBindKey
	        )
	      );
	    }
	  }
	}

	var typeDeprecationDescriptor = {
	  enumerable: false,
	  get: function() {
	    var displayName = this.displayName || this.name || 'Component';
	    (true ? warning(
	      false,
	      '%s.type is deprecated. Use %s directly to access the class.',
	      displayName,
	      displayName
	    ) : null);
	    Object.defineProperty(this, 'type', {
	      value: this
	    });
	    return this;
	  }
	};

	/**
	 * Add more to the ReactClass base class. These are all legacy features and
	 * therefore not already part of the modern ReactComponent.
	 */
	var ReactClassMixin = {

	  /**
	   * TODO: This will be deprecated because state should always keep a consistent
	   * type signature and the only use case for this, is to avoid that.
	   */
	  replaceState: function(newState, callback) {
	    ReactUpdateQueue.enqueueReplaceState(this, newState);
	    if (callback) {
	      ReactUpdateQueue.enqueueCallback(this, callback);
	    }
	  },

	  /**
	   * Checks whether or not this composite component is mounted.
	   * @return {boolean} True if mounted, false otherwise.
	   * @protected
	   * @final
	   */
	  isMounted: function() {
	    if (true) {
	      var owner = ReactCurrentOwner.current;
	      if (owner !== null) {
	        (true ? warning(
	          owner._warnedAboutRefsInRender,
	          '%s is accessing isMounted inside its render() function. ' +
	          'render() should be a pure function of props and state. It should ' +
	          'never access something that requires stale data from the previous ' +
	          'render, such as refs. Move this logic to componentDidMount and ' +
	          'componentDidUpdate instead.',
	          owner.getName() || 'A component'
	        ) : null);
	        owner._warnedAboutRefsInRender = true;
	      }
	    }
	    var internalInstance = ReactInstanceMap.get(this);
	    return (
	      internalInstance &&
	      internalInstance !== ReactLifeCycle.currentlyMountingInstance
	    );
	  },

	  /**
	   * Sets a subset of the props.
	   *
	   * @param {object} partialProps Subset of the next props.
	   * @param {?function} callback Called after props are updated.
	   * @final
	   * @public
	   * @deprecated
	   */
	  setProps: function(partialProps, callback) {
	    ReactUpdateQueue.enqueueSetProps(this, partialProps);
	    if (callback) {
	      ReactUpdateQueue.enqueueCallback(this, callback);
	    }
	  },

	  /**
	   * Replace all the props.
	   *
	   * @param {object} newProps Subset of the next props.
	   * @param {?function} callback Called after props are updated.
	   * @final
	   * @public
	   * @deprecated
	   */
	  replaceProps: function(newProps, callback) {
	    ReactUpdateQueue.enqueueReplaceProps(this, newProps);
	    if (callback) {
	      ReactUpdateQueue.enqueueCallback(this, callback);
	    }
	  }
	};

	var ReactClassComponent = function() {};
	assign(
	  ReactClassComponent.prototype,
	  ReactComponent.prototype,
	  ReactClassMixin
	);

	/**
	 * Module for creating composite components.
	 *
	 * @class ReactClass
	 */
	var ReactClass = {

	  /**
	   * Creates a composite component class given a class specification.
	   *
	   * @param {object} spec Class specification (which must define `render`).
	   * @return {function} Component constructor function.
	   * @public
	   */
	  createClass: function(spec) {
	    var Constructor = function(props, context) {
	      // This constructor is overridden by mocks. The argument is used
	      // by mocks to assert on what gets mounted.

	      if (true) {
	        (true ? warning(
	          this instanceof Constructor,
	          'Something is calling a React component directly. Use a factory or ' +
	          'JSX instead. See: https://fb.me/react-legacyfactory'
	        ) : null);
	      }

	      // Wire up auto-binding
	      if (this.__reactAutoBindMap) {
	        bindAutoBindMethods(this);
	      }

	      this.props = props;
	      this.context = context;
	      this.state = null;

	      // ReactClasses doesn't have constructors. Instead, they use the
	      // getInitialState and componentWillMount methods for initialization.

	      var initialState = this.getInitialState ? this.getInitialState() : null;
	      if (true) {
	        // We allow auto-mocks to proceed as if they're returning null.
	        if (typeof initialState === 'undefined' &&
	            this.getInitialState._isMockFunction) {
	          // This is probably bad practice. Consider warning here and
	          // deprecating this convenience.
	          initialState = null;
	        }
	      }
	      (true ? invariant(
	        typeof initialState === 'object' && !Array.isArray(initialState),
	        '%s.getInitialState(): must return an object or null',
	        Constructor.displayName || 'ReactCompositeComponent'
	      ) : invariant(typeof initialState === 'object' && !Array.isArray(initialState)));

	      this.state = initialState;
	    };
	    Constructor.prototype = new ReactClassComponent();
	    Constructor.prototype.constructor = Constructor;

	    injectedMixins.forEach(
	      mixSpecIntoComponent.bind(null, Constructor)
	    );

	    mixSpecIntoComponent(Constructor, spec);

	    // Initialize the defaultProps property after all mixins have been merged
	    if (Constructor.getDefaultProps) {
	      Constructor.defaultProps = Constructor.getDefaultProps();
	    }

	    if (true) {
	      // This is a tag to indicate that the use of these method names is ok,
	      // since it's used with createClass. If it's not, then it's likely a
	      // mistake so we'll warn you to use the static property, property
	      // initializer or constructor respectively.
	      if (Constructor.getDefaultProps) {
	        Constructor.getDefaultProps.isReactClassApproved = {};
	      }
	      if (Constructor.prototype.getInitialState) {
	        Constructor.prototype.getInitialState.isReactClassApproved = {};
	      }
	    }

	    (true ? invariant(
	      Constructor.prototype.render,
	      'createClass(...): Class specification must implement a `render` method.'
	    ) : invariant(Constructor.prototype.render));

	    if (true) {
	      (true ? warning(
	        !Constructor.prototype.componentShouldUpdate,
	        '%s has a method called ' +
	        'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
	        'The name is phrased as a question because the function is ' +
	        'expected to return a value.',
	        spec.displayName || 'A component'
	      ) : null);
	    }

	    // Reduce time spent doing lookups by setting these on the prototype.
	    for (var methodName in ReactClassInterface) {
	      if (!Constructor.prototype[methodName]) {
	        Constructor.prototype[methodName] = null;
	      }
	    }

	    // Legacy hook
	    Constructor.type = Constructor;
	    if (true) {
	      try {
	        Object.defineProperty(Constructor, 'type', typeDeprecationDescriptor);
	      } catch (x) {
	        // IE will fail on defineProperty (es5-shim/sham too)
	      }
	    }

	    return Constructor;
	  },

	  injection: {
	    injectMixin: function(mixin) {
	      injectedMixins.push(mixin);
	    }
	  }

	};

	module.exports = ReactClass;

	},{"135":135,"140":140,"141":141,"154":154,"27":27,"34":34,"39":39,"57":57,"60":60,"67":67,"68":68,"76":76,"77":77,"86":86}],34:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactComponent
	 */

	'use strict';

	var ReactUpdateQueue = _dereq_(86);

	var invariant = _dereq_(135);
	var warning = _dereq_(154);

	/**
	 * Base class helpers for the updating state of a component.
	 */
	function ReactComponent(props, context) {
	  this.props = props;
	  this.context = context;
	}

	/**
	 * Sets a subset of the state. Always use this to mutate
	 * state. You should treat `this.state` as immutable.
	 *
	 * There is no guarantee that `this.state` will be immediately updated, so
	 * accessing `this.state` after calling this method may return the old value.
	 *
	 * There is no guarantee that calls to `setState` will run synchronously,
	 * as they may eventually be batched together.  You can provide an optional
	 * callback that will be executed when the call to setState is actually
	 * completed.
	 *
	 * When a function is provided to setState, it will be called at some point in
	 * the future (not synchronously). It will be called with the up to date
	 * component arguments (state, props, context). These values can be different
	 * from this.* because your function may be called after receiveProps but before
	 * shouldComponentUpdate, and this new state, props, and context will not yet be
	 * assigned to this.
	 *
	 * @param {object|function} partialState Next partial state or function to
	 *        produce next partial state to be merged with current state.
	 * @param {?function} callback Called after state is updated.
	 * @final
	 * @protected
	 */
	ReactComponent.prototype.setState = function(partialState, callback) {
	  (true ? invariant(
	    typeof partialState === 'object' ||
	    typeof partialState === 'function' ||
	    partialState == null,
	    'setState(...): takes an object of state variables to update or a ' +
	    'function which returns an object of state variables.'
	  ) : invariant(typeof partialState === 'object' ||
	  typeof partialState === 'function' ||
	  partialState == null));
	  if (true) {
	    (true ? warning(
	      partialState != null,
	      'setState(...): You passed an undefined or null state object; ' +
	      'instead, use forceUpdate().'
	    ) : null);
	  }
	  ReactUpdateQueue.enqueueSetState(this, partialState);
	  if (callback) {
	    ReactUpdateQueue.enqueueCallback(this, callback);
	  }
	};

	/**
	 * Forces an update. This should only be invoked when it is known with
	 * certainty that we are **not** in a DOM transaction.
	 *
	 * You may want to call this when you know that some deeper aspect of the
	 * component's state has changed but `setState` was not called.
	 *
	 * This will not invoke `shouldComponentUpdate`, but it will invoke
	 * `componentWillUpdate` and `componentDidUpdate`.
	 *
	 * @param {?function} callback Called after update is complete.
	 * @final
	 * @protected
	 */
	ReactComponent.prototype.forceUpdate = function(callback) {
	  ReactUpdateQueue.enqueueForceUpdate(this);
	  if (callback) {
	    ReactUpdateQueue.enqueueCallback(this, callback);
	  }
	};

	/**
	 * Deprecated APIs. These APIs used to exist on classic React classes but since
	 * we would like to deprecate them, we're not going to move them over to this
	 * modern base class. Instead, we define a getter that warns if it's accessed.
	 */
	if (true) {
	  var deprecatedAPIs = {
	    getDOMNode: [
	      'getDOMNode',
	      'Use React.findDOMNode(component) instead.'
	    ],
	    isMounted: [
	      'isMounted',
	      'Instead, make sure to clean up subscriptions and pending requests in ' +
	      'componentWillUnmount to prevent memory leaks.'
	    ],
	    replaceProps: [
	      'replaceProps',
	      'Instead call React.render again at the top level.'
	    ],
	    replaceState: [
	      'replaceState',
	      'Refactor your code to use setState instead (see ' +
	      'https://github.com/facebook/react/issues/3236).'
	    ],
	    setProps: [
	      'setProps',
	      'Instead call React.render again at the top level.'
	    ]
	  };
	  var defineDeprecationWarning = function(methodName, info) {
	    try {
	      Object.defineProperty(ReactComponent.prototype, methodName, {
	        get: function() {
	          (true ? warning(
	            false,
	            '%s(...) is deprecated in plain JavaScript React classes. %s',
	            info[0],
	            info[1]
	          ) : null);
	          return undefined;
	        }
	      });
	    } catch (x) {
	      // IE will fail on defineProperty (es5-shim/sham too)
	    }
	  };
	  for (var fnName in deprecatedAPIs) {
	    if (deprecatedAPIs.hasOwnProperty(fnName)) {
	      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
	    }
	  }
	}

	module.exports = ReactComponent;

	},{"135":135,"154":154,"86":86}],35:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactComponentBrowserEnvironment
	 */

	/*jslint evil: true */

	'use strict';

	var ReactDOMIDOperations = _dereq_(44);
	var ReactMount = _dereq_(70);

	/**
	 * Abstracts away all functionality of the reconciler that requires knowledge of
	 * the browser context. TODO: These callers should be refactored to avoid the
	 * need for this injection.
	 */
	var ReactComponentBrowserEnvironment = {

	  processChildrenUpdates:
	    ReactDOMIDOperations.dangerouslyProcessChildrenUpdates,

	  replaceNodeWithMarkupByID:
	    ReactDOMIDOperations.dangerouslyReplaceNodeWithMarkupByID,

	  /**
	   * If a particular environment requires that some resources be cleaned up,
	   * specify this in the injected Mixin. In the DOM, we would likely want to
	   * purge any cached node ID lookups.
	   *
	   * @private
	   */
	  unmountIDFromEnvironment: function(rootNodeID) {
	    ReactMount.purgeID(rootNodeID);
	  }

	};

	module.exports = ReactComponentBrowserEnvironment;

	},{"44":44,"70":70}],36:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactComponentEnvironment
	 */

	'use strict';

	var invariant = _dereq_(135);

	var injected = false;

	var ReactComponentEnvironment = {

	  /**
	   * Optionally injectable environment dependent cleanup hook. (server vs.
	   * browser etc). Example: A browser system caches DOM nodes based on component
	   * ID and must remove that cache entry when this instance is unmounted.
	   */
	  unmountIDFromEnvironment: null,

	  /**
	   * Optionally injectable hook for swapping out mount images in the middle of
	   * the tree.
	   */
	  replaceNodeWithMarkupByID: null,

	  /**
	   * Optionally injectable hook for processing a queue of child updates. Will
	   * later move into MultiChildComponents.
	   */
	  processChildrenUpdates: null,

	  injection: {
	    injectEnvironment: function(environment) {
	      (true ? invariant(
	        !injected,
	        'ReactCompositeComponent: injectEnvironment() can only be called once.'
	      ) : invariant(!injected));
	      ReactComponentEnvironment.unmountIDFromEnvironment =
	        environment.unmountIDFromEnvironment;
	      ReactComponentEnvironment.replaceNodeWithMarkupByID =
	        environment.replaceNodeWithMarkupByID;
	      ReactComponentEnvironment.processChildrenUpdates =
	        environment.processChildrenUpdates;
	      injected = true;
	    }
	  }

	};

	module.exports = ReactComponentEnvironment;

	},{"135":135}],37:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactCompositeComponent
	 */

	'use strict';

	var ReactComponentEnvironment = _dereq_(36);
	var ReactContext = _dereq_(38);
	var ReactCurrentOwner = _dereq_(39);
	var ReactElement = _dereq_(57);
	var ReactElementValidator = _dereq_(58);
	var ReactInstanceMap = _dereq_(67);
	var ReactLifeCycle = _dereq_(68);
	var ReactNativeComponent = _dereq_(73);
	var ReactPerf = _dereq_(75);
	var ReactPropTypeLocations = _dereq_(77);
	var ReactPropTypeLocationNames = _dereq_(76);
	var ReactReconciler = _dereq_(81);
	var ReactUpdates = _dereq_(87);

	var assign = _dereq_(27);
	var emptyObject = _dereq_(115);
	var invariant = _dereq_(135);
	var shouldUpdateReactComponent = _dereq_(151);
	var warning = _dereq_(154);

	function getDeclarationErrorAddendum(component) {
	  var owner = component._currentElement._owner || null;
	  if (owner) {
	    var name = owner.getName();
	    if (name) {
	      return ' Check the render method of `' + name + '`.';
	    }
	  }
	  return '';
	}

	/**
	 * ------------------ The Life-Cycle of a Composite Component ------------------
	 *
	 * - constructor: Initialization of state. The instance is now retained.
	 *   - componentWillMount
	 *   - render
	 *   - [children's constructors]
	 *     - [children's componentWillMount and render]
	 *     - [children's componentDidMount]
	 *     - componentDidMount
	 *
	 *       Update Phases:
	 *       - componentWillReceiveProps (only called if parent updated)
	 *       - shouldComponentUpdate
	 *         - componentWillUpdate
	 *           - render
	 *           - [children's constructors or receive props phases]
	 *         - componentDidUpdate
	 *
	 *     - componentWillUnmount
	 *     - [children's componentWillUnmount]
	 *   - [children destroyed]
	 * - (destroyed): The instance is now blank, released by React and ready for GC.
	 *
	 * -----------------------------------------------------------------------------
	 */

	/**
	 * An incrementing ID assigned to each component when it is mounted. This is
	 * used to enforce the order in which `ReactUpdates` updates dirty components.
	 *
	 * @private
	 */
	var nextMountID = 1;

	/**
	 * @lends {ReactCompositeComponent.prototype}
	 */
	var ReactCompositeComponentMixin = {

	  /**
	   * Base constructor for all composite component.
	   *
	   * @param {ReactElement} element
	   * @final
	   * @internal
	   */
	  construct: function(element) {
	    this._currentElement = element;
	    this._rootNodeID = null;
	    this._instance = null;

	    // See ReactUpdateQueue
	    this._pendingElement = null;
	    this._pendingStateQueue = null;
	    this._pendingReplaceState = false;
	    this._pendingForceUpdate = false;

	    this._renderedComponent = null;

	    this._context = null;
	    this._mountOrder = 0;
	    this._isTopLevel = false;

	    // See ReactUpdates and ReactUpdateQueue.
	    this._pendingCallbacks = null;
	  },

	  /**
	   * Initializes the component, renders markup, and registers event listeners.
	   *
	   * @param {string} rootID DOM ID of the root node.
	   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
	   * @return {?string} Rendered markup to be inserted into the DOM.
	   * @final
	   * @internal
	   */
	  mountComponent: function(rootID, transaction, context) {
	    this._context = context;
	    this._mountOrder = nextMountID++;
	    this._rootNodeID = rootID;

	    var publicProps = this._processProps(this._currentElement.props);
	    var publicContext = this._processContext(this._currentElement._context);

	    var Component = ReactNativeComponent.getComponentClassForElement(
	      this._currentElement
	    );

	    // Initialize the public class
	    var inst = new Component(publicProps, publicContext);

	    if (true) {
	      // This will throw later in _renderValidatedComponent, but add an early
	      // warning now to help debugging
	      (true ? warning(
	        inst.render != null,
	        '%s(...): No `render` method found on the returned component ' +
	        'instance: you may have forgotten to define `render` in your ' +
	        'component or you may have accidentally tried to render an element ' +
	        'whose type is a function that isn\'t a React component.',
	        Component.displayName || Component.name || 'Component'
	      ) : null);
	    }

	    // These should be set up in the constructor, but as a convenience for
	    // simpler class abstractions, we set them up after the fact.
	    inst.props = publicProps;
	    inst.context = publicContext;
	    inst.refs = emptyObject;

	    this._instance = inst;

	    // Store a reference from the instance back to the internal representation
	    ReactInstanceMap.set(inst, this);

	    if (true) {
	      this._warnIfContextsDiffer(this._currentElement._context, context);
	    }

	    if (true) {
	      // Since plain JS classes are defined without any special initialization
	      // logic, we can not catch common errors early. Therefore, we have to
	      // catch them here, at initialization time, instead.
	      (true ? warning(
	        !inst.getInitialState ||
	        inst.getInitialState.isReactClassApproved,
	        'getInitialState was defined on %s, a plain JavaScript class. ' +
	        'This is only supported for classes created using React.createClass. ' +
	        'Did you mean to define a state property instead?',
	        this.getName() || 'a component'
	      ) : null);
	      (true ? warning(
	        !inst.getDefaultProps ||
	        inst.getDefaultProps.isReactClassApproved,
	        'getDefaultProps was defined on %s, a plain JavaScript class. ' +
	        'This is only supported for classes created using React.createClass. ' +
	        'Use a static property to define defaultProps instead.',
	        this.getName() || 'a component'
	      ) : null);
	      (true ? warning(
	        !inst.propTypes,
	        'propTypes was defined as an instance property on %s. Use a static ' +
	        'property to define propTypes instead.',
	        this.getName() || 'a component'
	      ) : null);
	      (true ? warning(
	        !inst.contextTypes,
	        'contextTypes was defined as an instance property on %s. Use a ' +
	        'static property to define contextTypes instead.',
	        this.getName() || 'a component'
	      ) : null);
	      (true ? warning(
	        typeof inst.componentShouldUpdate !== 'function',
	        '%s has a method called ' +
	        'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
	        'The name is phrased as a question because the function is ' +
	        'expected to return a value.',
	        (this.getName() || 'A component')
	      ) : null);
	    }

	    var initialState = inst.state;
	    if (initialState === undefined) {
	      inst.state = initialState = null;
	    }
	    (true ? invariant(
	      typeof initialState === 'object' && !Array.isArray(initialState),
	      '%s.state: must be set to an object or null',
	      this.getName() || 'ReactCompositeComponent'
	    ) : invariant(typeof initialState === 'object' && !Array.isArray(initialState)));

	    this._pendingStateQueue = null;
	    this._pendingReplaceState = false;
	    this._pendingForceUpdate = false;

	    var childContext;
	    var renderedElement;

	    var previouslyMounting = ReactLifeCycle.currentlyMountingInstance;
	    ReactLifeCycle.currentlyMountingInstance = this;
	    try {
	      if (inst.componentWillMount) {
	        inst.componentWillMount();
	        // When mounting, calls to `setState` by `componentWillMount` will set
	        // `this._pendingStateQueue` without triggering a re-render.
	        if (this._pendingStateQueue) {
	          inst.state = this._processPendingState(inst.props, inst.context);
	        }
	      }

	      childContext = this._getValidatedChildContext(context);
	      renderedElement = this._renderValidatedComponent(childContext);
	    } finally {
	      ReactLifeCycle.currentlyMountingInstance = previouslyMounting;
	    }

	    this._renderedComponent = this._instantiateReactComponent(
	      renderedElement,
	      this._currentElement.type // The wrapping type
	    );

	    var markup = ReactReconciler.mountComponent(
	      this._renderedComponent,
	      rootID,
	      transaction,
	      this._mergeChildContext(context, childContext)
	    );
	    if (inst.componentDidMount) {
	      transaction.getReactMountReady().enqueue(inst.componentDidMount, inst);
	    }

	    return markup;
	  },

	  /**
	   * Releases any resources allocated by `mountComponent`.
	   *
	   * @final
	   * @internal
	   */
	  unmountComponent: function() {
	    var inst = this._instance;

	    if (inst.componentWillUnmount) {
	      var previouslyUnmounting = ReactLifeCycle.currentlyUnmountingInstance;
	      ReactLifeCycle.currentlyUnmountingInstance = this;
	      try {
	        inst.componentWillUnmount();
	      } finally {
	        ReactLifeCycle.currentlyUnmountingInstance = previouslyUnmounting;
	      }
	    }

	    ReactReconciler.unmountComponent(this._renderedComponent);
	    this._renderedComponent = null;

	    // Reset pending fields
	    this._pendingStateQueue = null;
	    this._pendingReplaceState = false;
	    this._pendingForceUpdate = false;
	    this._pendingCallbacks = null;
	    this._pendingElement = null;

	    // These fields do not really need to be reset since this object is no
	    // longer accessible.
	    this._context = null;
	    this._rootNodeID = null;

	    // Delete the reference from the instance to this internal representation
	    // which allow the internals to be properly cleaned up even if the user
	    // leaks a reference to the public instance.
	    ReactInstanceMap.remove(inst);

	    // Some existing components rely on inst.props even after they've been
	    // destroyed (in event handlers).
	    // TODO: inst.props = null;
	    // TODO: inst.state = null;
	    // TODO: inst.context = null;
	  },

	  /**
	   * Schedule a partial update to the props. Only used for internal testing.
	   *
	   * @param {object} partialProps Subset of the next props.
	   * @param {?function} callback Called after props are updated.
	   * @final
	   * @internal
	   */
	  _setPropsInternal: function(partialProps, callback) {
	    // This is a deoptimized path. We optimize for always having an element.
	    // This creates an extra internal element.
	    var element = this._pendingElement || this._currentElement;
	    this._pendingElement = ReactElement.cloneAndReplaceProps(
	      element,
	      assign({}, element.props, partialProps)
	    );
	    ReactUpdates.enqueueUpdate(this, callback);
	  },

	  /**
	   * Filters the context object to only contain keys specified in
	   * `contextTypes`
	   *
	   * @param {object} context
	   * @return {?object}
	   * @private
	   */
	  _maskContext: function(context) {
	    var maskedContext = null;
	    // This really should be getting the component class for the element,
	    // but we know that we're not going to need it for built-ins.
	    if (typeof this._currentElement.type === 'string') {
	      return emptyObject;
	    }
	    var contextTypes = this._currentElement.type.contextTypes;
	    if (!contextTypes) {
	      return emptyObject;
	    }
	    maskedContext = {};
	    for (var contextName in contextTypes) {
	      maskedContext[contextName] = context[contextName];
	    }
	    return maskedContext;
	  },

	  /**
	   * Filters the context object to only contain keys specified in
	   * `contextTypes`, and asserts that they are valid.
	   *
	   * @param {object} context
	   * @return {?object}
	   * @private
	   */
	  _processContext: function(context) {
	    var maskedContext = this._maskContext(context);
	    if (true) {
	      var Component = ReactNativeComponent.getComponentClassForElement(
	        this._currentElement
	      );
	      if (Component.contextTypes) {
	        this._checkPropTypes(
	          Component.contextTypes,
	          maskedContext,
	          ReactPropTypeLocations.context
	        );
	      }
	    }
	    return maskedContext;
	  },

	  /**
	   * @param {object} currentContext
	   * @return {object}
	   * @private
	   */
	  _getValidatedChildContext: function(currentContext) {
	    var inst = this._instance;
	    var childContext = inst.getChildContext && inst.getChildContext();
	    if (childContext) {
	      (true ? invariant(
	        typeof inst.constructor.childContextTypes === 'object',
	        '%s.getChildContext(): childContextTypes must be defined in order to ' +
	        'use getChildContext().',
	        this.getName() || 'ReactCompositeComponent'
	      ) : invariant(typeof inst.constructor.childContextTypes === 'object'));
	      if (true) {
	        this._checkPropTypes(
	          inst.constructor.childContextTypes,
	          childContext,
	          ReactPropTypeLocations.childContext
	        );
	      }
	      for (var name in childContext) {
	        (true ? invariant(
	          name in inst.constructor.childContextTypes,
	          '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
	          this.getName() || 'ReactCompositeComponent',
	          name
	        ) : invariant(name in inst.constructor.childContextTypes));
	      }
	      return childContext;
	    }
	    return null;
	  },

	  _mergeChildContext: function(currentContext, childContext) {
	    if (childContext) {
	      return assign({}, currentContext, childContext);
	    }
	    return currentContext;
	  },

	  /**
	   * Processes props by setting default values for unspecified props and
	   * asserting that the props are valid. Does not mutate its argument; returns
	   * a new props object with defaults merged in.
	   *
	   * @param {object} newProps
	   * @return {object}
	   * @private
	   */
	  _processProps: function(newProps) {
	    if (true) {
	      var Component = ReactNativeComponent.getComponentClassForElement(
	        this._currentElement
	      );
	      if (Component.propTypes) {
	        this._checkPropTypes(
	          Component.propTypes,
	          newProps,
	          ReactPropTypeLocations.prop
	        );
	      }
	    }
	    return newProps;
	  },

	  /**
	   * Assert that the props are valid
	   *
	   * @param {object} propTypes Map of prop name to a ReactPropType
	   * @param {object} props
	   * @param {string} location e.g. "prop", "context", "child context"
	   * @private
	   */
	  _checkPropTypes: function(propTypes, props, location) {
	    // TODO: Stop validating prop types here and only use the element
	    // validation.
	    var componentName = this.getName();
	    for (var propName in propTypes) {
	      if (propTypes.hasOwnProperty(propName)) {
	        var error;
	        try {
	          // This is intentionally an invariant that gets caught. It's the same
	          // behavior as without this statement except with a better message.
	          (true ? invariant(
	            typeof propTypes[propName] === 'function',
	            '%s: %s type `%s` is invalid; it must be a function, usually ' +
	            'from React.PropTypes.',
	            componentName || 'React class',
	            ReactPropTypeLocationNames[location],
	            propName
	          ) : invariant(typeof propTypes[propName] === 'function'));
	          error = propTypes[propName](props, propName, componentName, location);
	        } catch (ex) {
	          error = ex;
	        }
	        if (error instanceof Error) {
	          // We may want to extend this logic for similar errors in
	          // React.render calls, so I'm abstracting it away into
	          // a function to minimize refactoring in the future
	          var addendum = getDeclarationErrorAddendum(this);

	          if (location === ReactPropTypeLocations.prop) {
	            // Preface gives us something to blacklist in warning module
	            (true ? warning(
	              false,
	              'Failed Composite propType: %s%s',
	              error.message,
	              addendum
	            ) : null);
	          } else {
	            (true ? warning(
	              false,
	              'Failed Context Types: %s%s',
	              error.message,
	              addendum
	            ) : null);
	          }
	        }
	      }
	    }
	  },

	  receiveComponent: function(nextElement, transaction, nextContext) {
	    var prevElement = this._currentElement;
	    var prevContext = this._context;

	    this._pendingElement = null;

	    this.updateComponent(
	      transaction,
	      prevElement,
	      nextElement,
	      prevContext,
	      nextContext
	    );
	  },

	  /**
	   * If any of `_pendingElement`, `_pendingStateQueue`, or `_pendingForceUpdate`
	   * is set, update the component.
	   *
	   * @param {ReactReconcileTransaction} transaction
	   * @internal
	   */
	  performUpdateIfNecessary: function(transaction) {
	    if (this._pendingElement != null) {
	      ReactReconciler.receiveComponent(
	        this,
	        this._pendingElement || this._currentElement,
	        transaction,
	        this._context
	      );
	    }

	    if (this._pendingStateQueue !== null || this._pendingForceUpdate) {
	      if (true) {
	        ReactElementValidator.checkAndWarnForMutatedProps(
	          this._currentElement
	        );
	      }

	      this.updateComponent(
	        transaction,
	        this._currentElement,
	        this._currentElement,
	        this._context,
	        this._context
	      );
	    }
	  },

	  /**
	   * Compare two contexts, warning if they are different
	   * TODO: Remove this check when owner-context is removed
	   */
	   _warnIfContextsDiffer: function(ownerBasedContext, parentBasedContext) {
	    ownerBasedContext = this._maskContext(ownerBasedContext);
	    parentBasedContext = this._maskContext(parentBasedContext);
	    var parentKeys = Object.keys(parentBasedContext).sort();
	    var displayName = this.getName() || 'ReactCompositeComponent';
	    for (var i = 0; i < parentKeys.length; i++) {
	      var key = parentKeys[i];
	      (true ? warning(
	        ownerBasedContext[key] === parentBasedContext[key],
	        'owner-based and parent-based contexts differ '  +
	        '(values: `%s` vs `%s`) for key (%s) while mounting %s ' +
	        '(see: http://fb.me/react-context-by-parent)',
	        ownerBasedContext[key],
	        parentBasedContext[key],
	        key,
	        displayName
	      ) : null);
	    }
	  },

	  /**
	   * Perform an update to a mounted component. The componentWillReceiveProps and
	   * shouldComponentUpdate methods are called, then (assuming the update isn't
	   * skipped) the remaining update lifecycle methods are called and the DOM
	   * representation is updated.
	   *
	   * By default, this implements React's rendering and reconciliation algorithm.
	   * Sophisticated clients may wish to override this.
	   *
	   * @param {ReactReconcileTransaction} transaction
	   * @param {ReactElement} prevParentElement
	   * @param {ReactElement} nextParentElement
	   * @internal
	   * @overridable
	   */
	  updateComponent: function(
	    transaction,
	    prevParentElement,
	    nextParentElement,
	    prevUnmaskedContext,
	    nextUnmaskedContext
	  ) {
	    var inst = this._instance;

	    var nextContext = inst.context;
	    var nextProps = inst.props;

	    // Distinguish between a props update versus a simple state update
	    if (prevParentElement !== nextParentElement) {
	      nextContext = this._processContext(nextParentElement._context);
	      nextProps = this._processProps(nextParentElement.props);

	      if (true) {
	        if (nextUnmaskedContext != null) {
	          this._warnIfContextsDiffer(
	            nextParentElement._context,
	            nextUnmaskedContext
	          );
	        }
	      }

	      // An update here will schedule an update but immediately set
	      // _pendingStateQueue which will ensure that any state updates gets
	      // immediately reconciled instead of waiting for the next batch.

	      if (inst.componentWillReceiveProps) {
	        inst.componentWillReceiveProps(nextProps, nextContext);
	      }
	    }

	    var nextState = this._processPendingState(nextProps, nextContext);

	    var shouldUpdate =
	      this._pendingForceUpdate ||
	      !inst.shouldComponentUpdate ||
	      inst.shouldComponentUpdate(nextProps, nextState, nextContext);

	    if (true) {
	      (true ? warning(
	        typeof shouldUpdate !== 'undefined',
	        '%s.shouldComponentUpdate(): Returned undefined instead of a ' +
	        'boolean value. Make sure to return true or false.',
	        this.getName() || 'ReactCompositeComponent'
	      ) : null);
	    }

	    if (shouldUpdate) {
	      this._pendingForceUpdate = false;
	      // Will set `this.props`, `this.state` and `this.context`.
	      this._performComponentUpdate(
	        nextParentElement,
	        nextProps,
	        nextState,
	        nextContext,
	        transaction,
	        nextUnmaskedContext
	      );
	    } else {
	      // If it's determined that a component should not update, we still want
	      // to set props and state but we shortcut the rest of the update.
	      this._currentElement = nextParentElement;
	      this._context = nextUnmaskedContext;
	      inst.props = nextProps;
	      inst.state = nextState;
	      inst.context = nextContext;
	    }
	  },

	  _processPendingState: function(props, context) {
	    var inst = this._instance;
	    var queue = this._pendingStateQueue;
	    var replace = this._pendingReplaceState;
	    this._pendingReplaceState = false;
	    this._pendingStateQueue = null;

	    if (!queue) {
	      return inst.state;
	    }

	    if (replace && queue.length === 1) {
	      return queue[0];
	    }

	    var nextState = assign({}, replace ? queue[0] : inst.state);
	    for (var i = replace ? 1 : 0; i < queue.length; i++) {
	      var partial = queue[i];
	      assign(
	        nextState,
	        typeof partial === 'function' ?
	          partial.call(inst, nextState, props, context) :
	          partial
	      );
	    }

	    return nextState;
	  },

	  /**
	   * Merges new props and state, notifies delegate methods of update and
	   * performs update.
	   *
	   * @param {ReactElement} nextElement Next element
	   * @param {object} nextProps Next public object to set as properties.
	   * @param {?object} nextState Next object to set as state.
	   * @param {?object} nextContext Next public object to set as context.
	   * @param {ReactReconcileTransaction} transaction
	   * @param {?object} unmaskedContext
	   * @private
	   */
	  _performComponentUpdate: function(
	    nextElement,
	    nextProps,
	    nextState,
	    nextContext,
	    transaction,
	    unmaskedContext
	  ) {
	    var inst = this._instance;

	    var prevProps = inst.props;
	    var prevState = inst.state;
	    var prevContext = inst.context;

	    if (inst.componentWillUpdate) {
	      inst.componentWillUpdate(nextProps, nextState, nextContext);
	    }

	    this._currentElement = nextElement;
	    this._context = unmaskedContext;
	    inst.props = nextProps;
	    inst.state = nextState;
	    inst.context = nextContext;

	    this._updateRenderedComponent(transaction, unmaskedContext);

	    if (inst.componentDidUpdate) {
	      transaction.getReactMountReady().enqueue(
	        inst.componentDidUpdate.bind(inst, prevProps, prevState, prevContext),
	        inst
	      );
	    }
	  },

	  /**
	   * Call the component's `render` method and update the DOM accordingly.
	   *
	   * @param {ReactReconcileTransaction} transaction
	   * @internal
	   */
	  _updateRenderedComponent: function(transaction, context) {
	    var prevComponentInstance = this._renderedComponent;
	    var prevRenderedElement = prevComponentInstance._currentElement;
	    var childContext = this._getValidatedChildContext();
	    var nextRenderedElement = this._renderValidatedComponent(childContext);
	    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
	      ReactReconciler.receiveComponent(
	        prevComponentInstance,
	        nextRenderedElement,
	        transaction,
	        this._mergeChildContext(context, childContext)
	      );
	    } else {
	      // These two IDs are actually the same! But nothing should rely on that.
	      var thisID = this._rootNodeID;
	      var prevComponentID = prevComponentInstance._rootNodeID;
	      ReactReconciler.unmountComponent(prevComponentInstance);

	      this._renderedComponent = this._instantiateReactComponent(
	        nextRenderedElement,
	        this._currentElement.type
	      );
	      var nextMarkup = ReactReconciler.mountComponent(
	        this._renderedComponent,
	        thisID,
	        transaction,
	        this._mergeChildContext(context, childContext)
	      );
	      this._replaceNodeWithMarkupByID(prevComponentID, nextMarkup);
	    }
	  },

	  /**
	   * @protected
	   */
	  _replaceNodeWithMarkupByID: function(prevComponentID, nextMarkup) {
	    ReactComponentEnvironment.replaceNodeWithMarkupByID(
	      prevComponentID,
	      nextMarkup
	    );
	  },

	  /**
	   * @protected
	   */
	  _renderValidatedComponentWithoutOwnerOrContext: function() {
	    var inst = this._instance;
	    var renderedComponent = inst.render();
	    if (true) {
	      // We allow auto-mocks to proceed as if they're returning null.
	      if (typeof renderedComponent === 'undefined' &&
	          inst.render._isMockFunction) {
	        // This is probably bad practice. Consider warning here and
	        // deprecating this convenience.
	        renderedComponent = null;
	      }
	    }

	    return renderedComponent;
	  },

	  /**
	   * @private
	   */
	  _renderValidatedComponent: function(childContext) {
	    var renderedComponent;
	    var previousContext = ReactContext.current;
	    ReactContext.current = this._mergeChildContext(
	      this._currentElement._context,
	      childContext
	    );
	    ReactCurrentOwner.current = this;
	    try {
	      renderedComponent =
	        this._renderValidatedComponentWithoutOwnerOrContext();
	    } finally {
	      ReactContext.current = previousContext;
	      ReactCurrentOwner.current = null;
	    }
	    (true ? invariant(
	      // TODO: An `isValidNode` function would probably be more appropriate
	      renderedComponent === null || renderedComponent === false ||
	      ReactElement.isValidElement(renderedComponent),
	      '%s.render(): A valid ReactComponent must be returned. You may have ' +
	        'returned undefined, an array or some other invalid object.',
	      this.getName() || 'ReactCompositeComponent'
	    ) : invariant(// TODO: An `isValidNode` function would probably be more appropriate
	    renderedComponent === null || renderedComponent === false ||
	    ReactElement.isValidElement(renderedComponent)));
	    return renderedComponent;
	  },

	  /**
	   * Lazily allocates the refs object and stores `component` as `ref`.
	   *
	   * @param {string} ref Reference name.
	   * @param {component} component Component to store as `ref`.
	   * @final
	   * @private
	   */
	  attachRef: function(ref, component) {
	    var inst = this.getPublicInstance();
	    var refs = inst.refs === emptyObject ? (inst.refs = {}) : inst.refs;
	    refs[ref] = component.getPublicInstance();
	  },

	  /**
	   * Detaches a reference name.
	   *
	   * @param {string} ref Name to dereference.
	   * @final
	   * @private
	   */
	  detachRef: function(ref) {
	    var refs = this.getPublicInstance().refs;
	    delete refs[ref];
	  },

	  /**
	   * Get a text description of the component that can be used to identify it
	   * in error messages.
	   * @return {string} The name or null.
	   * @internal
	   */
	  getName: function() {
	    var type = this._currentElement.type;
	    var constructor = this._instance && this._instance.constructor;
	    return (
	      type.displayName || (constructor && constructor.displayName) ||
	      type.name || (constructor && constructor.name) ||
	      null
	    );
	  },

	  /**
	   * Get the publicly accessible representation of this component - i.e. what
	   * is exposed by refs and returned by React.render. Can be null for stateless
	   * components.
	   *
	   * @return {ReactComponent} the public component instance.
	   * @internal
	   */
	  getPublicInstance: function() {
	    return this._instance;
	  },

	  // Stub
	  _instantiateReactComponent: null

	};

	ReactPerf.measureMethods(
	  ReactCompositeComponentMixin,
	  'ReactCompositeComponent',
	  {
	    mountComponent: 'mountComponent',
	    updateComponent: 'updateComponent',
	    _renderValidatedComponent: '_renderValidatedComponent'
	  }
	);

	var ReactCompositeComponent = {

	  Mixin: ReactCompositeComponentMixin

	};

	module.exports = ReactCompositeComponent;

	},{"115":115,"135":135,"151":151,"154":154,"27":27,"36":36,"38":38,"39":39,"57":57,"58":58,"67":67,"68":68,"73":73,"75":75,"76":76,"77":77,"81":81,"87":87}],38:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactContext
	 */

	'use strict';

	var assign = _dereq_(27);
	var emptyObject = _dereq_(115);
	var warning = _dereq_(154);

	var didWarn = false;

	/**
	 * Keeps track of the current context.
	 *
	 * The context is automatically passed down the component ownership hierarchy
	 * and is accessible via `this.context` on ReactCompositeComponents.
	 */
	var ReactContext = {

	  /**
	   * @internal
	   * @type {object}
	   */
	  current: emptyObject,

	  /**
	   * Temporarily extends the current context while executing scopedCallback.
	   *
	   * A typical use case might look like
	   *
	   *  render: function() {
	   *    var children = ReactContext.withContext({foo: 'foo'}, () => (
	   *
	   *    ));
	   *    return <div>{children}</div>;
	   *  }
	   *
	   * @param {object} newContext New context to merge into the existing context
	   * @param {function} scopedCallback Callback to run with the new context
	   * @return {ReactComponent|array<ReactComponent>}
	   */
	  withContext: function(newContext, scopedCallback) {
	    if (true) {
	      (true ? warning(
	        didWarn,
	        'withContext is deprecated and will be removed in a future version. ' +
	        'Use a wrapper component with getChildContext instead.'
	      ) : null);

	      didWarn = true;
	    }

	    var result;
	    var previousContext = ReactContext.current;
	    ReactContext.current = assign({}, previousContext, newContext);
	    try {
	      result = scopedCallback();
	    } finally {
	      ReactContext.current = previousContext;
	    }
	    return result;
	  }

	};

	module.exports = ReactContext;

	},{"115":115,"154":154,"27":27}],39:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactCurrentOwner
	 */

	'use strict';

	/**
	 * Keeps track of the current owner.
	 *
	 * The current owner is the component who should own any components that are
	 * currently being constructed.
	 *
	 * The depth indicate how many composite components are above this render level.
	 */
	var ReactCurrentOwner = {

	  /**
	   * @internal
	   * @type {ReactComponent}
	   */
	  current: null

	};

	module.exports = ReactCurrentOwner;

	},{}],40:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOM
	 * @typechecks static-only
	 */

	'use strict';

	var ReactElement = _dereq_(57);
	var ReactElementValidator = _dereq_(58);

	var mapObject = _dereq_(142);

	/**
	 * Create a factory that creates HTML tag elements.
	 *
	 * @param {string} tag Tag name (e.g. `div`).
	 * @private
	 */
	function createDOMFactory(tag) {
	  if (true) {
	    return ReactElementValidator.createFactory(tag);
	  }
	  return ReactElement.createFactory(tag);
	}

	/**
	 * Creates a mapping from supported HTML tags to `ReactDOMComponent` classes.
	 * This is also accessible via `React.DOM`.
	 *
	 * @public
	 */
	var ReactDOM = mapObject({
	  a: 'a',
	  abbr: 'abbr',
	  address: 'address',
	  area: 'area',
	  article: 'article',
	  aside: 'aside',
	  audio: 'audio',
	  b: 'b',
	  base: 'base',
	  bdi: 'bdi',
	  bdo: 'bdo',
	  big: 'big',
	  blockquote: 'blockquote',
	  body: 'body',
	  br: 'br',
	  button: 'button',
	  canvas: 'canvas',
	  caption: 'caption',
	  cite: 'cite',
	  code: 'code',
	  col: 'col',
	  colgroup: 'colgroup',
	  data: 'data',
	  datalist: 'datalist',
	  dd: 'dd',
	  del: 'del',
	  details: 'details',
	  dfn: 'dfn',
	  dialog: 'dialog',
	  div: 'div',
	  dl: 'dl',
	  dt: 'dt',
	  em: 'em',
	  embed: 'embed',
	  fieldset: 'fieldset',
	  figcaption: 'figcaption',
	  figure: 'figure',
	  footer: 'footer',
	  form: 'form',
	  h1: 'h1',
	  h2: 'h2',
	  h3: 'h3',
	  h4: 'h4',
	  h5: 'h5',
	  h6: 'h6',
	  head: 'head',
	  header: 'header',
	  hr: 'hr',
	  html: 'html',
	  i: 'i',
	  iframe: 'iframe',
	  img: 'img',
	  input: 'input',
	  ins: 'ins',
	  kbd: 'kbd',
	  keygen: 'keygen',
	  label: 'label',
	  legend: 'legend',
	  li: 'li',
	  link: 'link',
	  main: 'main',
	  map: 'map',
	  mark: 'mark',
	  menu: 'menu',
	  menuitem: 'menuitem',
	  meta: 'meta',
	  meter: 'meter',
	  nav: 'nav',
	  noscript: 'noscript',
	  object: 'object',
	  ol: 'ol',
	  optgroup: 'optgroup',
	  option: 'option',
	  output: 'output',
	  p: 'p',
	  param: 'param',
	  picture: 'picture',
	  pre: 'pre',
	  progress: 'progress',
	  q: 'q',
	  rp: 'rp',
	  rt: 'rt',
	  ruby: 'ruby',
	  s: 's',
	  samp: 'samp',
	  script: 'script',
	  section: 'section',
	  select: 'select',
	  small: 'small',
	  source: 'source',
	  span: 'span',
	  strong: 'strong',
	  style: 'style',
	  sub: 'sub',
	  summary: 'summary',
	  sup: 'sup',
	  table: 'table',
	  tbody: 'tbody',
	  td: 'td',
	  textarea: 'textarea',
	  tfoot: 'tfoot',
	  th: 'th',
	  thead: 'thead',
	  time: 'time',
	  title: 'title',
	  tr: 'tr',
	  track: 'track',
	  u: 'u',
	  ul: 'ul',
	  'var': 'var',
	  video: 'video',
	  wbr: 'wbr',

	  // SVG
	  circle: 'circle',
	  clipPath: 'clipPath',
	  defs: 'defs',
	  ellipse: 'ellipse',
	  g: 'g',
	  line: 'line',
	  linearGradient: 'linearGradient',
	  mask: 'mask',
	  path: 'path',
	  pattern: 'pattern',
	  polygon: 'polygon',
	  polyline: 'polyline',
	  radialGradient: 'radialGradient',
	  rect: 'rect',
	  stop: 'stop',
	  svg: 'svg',
	  text: 'text',
	  tspan: 'tspan'

	}, createDOMFactory);

	module.exports = ReactDOM;

	},{"142":142,"57":57,"58":58}],41:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMButton
	 */

	'use strict';

	var AutoFocusMixin = _dereq_(2);
	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);

	var keyMirror = _dereq_(140);

	var button = ReactElement.createFactory('button');

	var mouseListenerNames = keyMirror({
	  onClick: true,
	  onDoubleClick: true,
	  onMouseDown: true,
	  onMouseMove: true,
	  onMouseUp: true,
	  onClickCapture: true,
	  onDoubleClickCapture: true,
	  onMouseDownCapture: true,
	  onMouseMoveCapture: true,
	  onMouseUpCapture: true
	});

	/**
	 * Implements a <button> native component that does not receive mouse events
	 * when `disabled` is set.
	 */
	var ReactDOMButton = ReactClass.createClass({
	  displayName: 'ReactDOMButton',
	  tagName: 'BUTTON',

	  mixins: [AutoFocusMixin, ReactBrowserComponentMixin],

	  render: function() {
	    var props = {};

	    // Copy the props; except the mouse listeners if we're disabled
	    for (var key in this.props) {
	      if (this.props.hasOwnProperty(key) &&
	          (!this.props.disabled || !mouseListenerNames[key])) {
	        props[key] = this.props[key];
	      }
	    }

	    return button(props, this.props.children);
	  }

	});

	module.exports = ReactDOMButton;

	},{"140":140,"2":2,"29":29,"33":33,"57":57}],42:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMComponent
	 * @typechecks static-only
	 */

	/* global hasOwnProperty:true */

	'use strict';

	var CSSPropertyOperations = _dereq_(5);
	var DOMProperty = _dereq_(10);
	var DOMPropertyOperations = _dereq_(11);
	var ReactBrowserEventEmitter = _dereq_(30);
	var ReactComponentBrowserEnvironment =
	  _dereq_(35);
	var ReactMount = _dereq_(70);
	var ReactMultiChild = _dereq_(71);
	var ReactPerf = _dereq_(75);

	var assign = _dereq_(27);
	var escapeTextContentForBrowser = _dereq_(116);
	var invariant = _dereq_(135);
	var isEventSupported = _dereq_(136);
	var keyOf = _dereq_(141);
	var warning = _dereq_(154);

	var deleteListener = ReactBrowserEventEmitter.deleteListener;
	var listenTo = ReactBrowserEventEmitter.listenTo;
	var registrationNameModules = ReactBrowserEventEmitter.registrationNameModules;

	// For quickly matching children type, to test if can be treated as content.
	var CONTENT_TYPES = {'string': true, 'number': true};

	var STYLE = keyOf({style: null});

	var ELEMENT_NODE_TYPE = 1;

	/**
	 * Optionally injectable operations for mutating the DOM
	 */
	var BackendIDOperations = null;

	/**
	 * @param {?object} props
	 */
	function assertValidProps(props) {
	  if (!props) {
	    return;
	  }
	  // Note the use of `==` which checks for null or undefined.
	  if (props.dangerouslySetInnerHTML != null) {
	    (true ? invariant(
	      props.children == null,
	      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.'
	    ) : invariant(props.children == null));
	    (true ? invariant(
	      typeof props.dangerouslySetInnerHTML === 'object' &&
	      '__html' in props.dangerouslySetInnerHTML,
	      '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
	      'Please visit https://fb.me/react-invariant-dangerously-set-inner-html ' +
	      'for more information.'
	    ) : invariant(typeof props.dangerouslySetInnerHTML === 'object' &&
	    '__html' in props.dangerouslySetInnerHTML));
	  }
	  if (true) {
	    (true ? warning(
	      props.innerHTML == null,
	      'Directly setting property `innerHTML` is not permitted. ' +
	      'For more information, lookup documentation on `dangerouslySetInnerHTML`.'
	    ) : null);
	    (true ? warning(
	      !props.contentEditable || props.children == null,
	      'A component is `contentEditable` and contains `children` managed by ' +
	      'React. It is now your responsibility to guarantee that none of ' +
	      'those nodes are unexpectedly modified or duplicated. This is ' +
	      'probably not intentional.'
	    ) : null);
	  }
	  (true ? invariant(
	    props.style == null || typeof props.style === 'object',
	    'The `style` prop expects a mapping from style properties to values, ' +
	    'not a string. For example, style={{marginRight: spacing + \'em\'}} when ' +
	    'using JSX.'
	  ) : invariant(props.style == null || typeof props.style === 'object'));
	}

	function putListener(id, registrationName, listener, transaction) {
	  if (true) {
	    // IE8 has no API for event capturing and the `onScroll` event doesn't
	    // bubble.
	    (true ? warning(
	      registrationName !== 'onScroll' || isEventSupported('scroll', true),
	      'This browser doesn\'t support the `onScroll` event'
	    ) : null);
	  }
	  var container = ReactMount.findReactContainerForID(id);
	  if (container) {
	    var doc = container.nodeType === ELEMENT_NODE_TYPE ?
	      container.ownerDocument :
	      container;
	    listenTo(registrationName, doc);
	  }
	  transaction.getPutListenerQueue().enqueuePutListener(
	    id,
	    registrationName,
	    listener
	  );
	}

	// For HTML, certain tags should omit their close tag. We keep a whitelist for
	// those special cased tags.

	var omittedCloseTags = {
	  'area': true,
	  'base': true,
	  'br': true,
	  'col': true,
	  'embed': true,
	  'hr': true,
	  'img': true,
	  'input': true,
	  'keygen': true,
	  'link': true,
	  'meta': true,
	  'param': true,
	  'source': true,
	  'track': true,
	  'wbr': true
	  // NOTE: menuitem's close tag should be omitted, but that causes problems.
	};

	// We accept any tag to be rendered but since this gets injected into abitrary
	// HTML, we want to make sure that it's a safe tag.
	// http://www.w3.org/TR/REC-xml/#NT-Name

	var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
	var validatedTagCache = {};
	var hasOwnProperty = {}.hasOwnProperty;

	function validateDangerousTag(tag) {
	  if (!hasOwnProperty.call(validatedTagCache, tag)) {
	    (true ? invariant(VALID_TAG_REGEX.test(tag), 'Invalid tag: %s', tag) : invariant(VALID_TAG_REGEX.test(tag)));
	    validatedTagCache[tag] = true;
	  }
	}

	/**
	 * Creates a new React class that is idempotent and capable of containing other
	 * React components. It accepts event listeners and DOM properties that are
	 * valid according to `DOMProperty`.
	 *
	 *  - Event listeners: `onClick`, `onMouseDown`, etc.
	 *  - DOM properties: `className`, `name`, `title`, etc.
	 *
	 * The `style` property functions differently from the DOM API. It accepts an
	 * object mapping of style properties to values.
	 *
	 * @constructor ReactDOMComponent
	 * @extends ReactMultiChild
	 */
	function ReactDOMComponent(tag) {
	  validateDangerousTag(tag);
	  this._tag = tag;
	  this._renderedChildren = null;
	  this._previousStyleCopy = null;
	  this._rootNodeID = null;
	}

	ReactDOMComponent.displayName = 'ReactDOMComponent';

	ReactDOMComponent.Mixin = {

	  construct: function(element) {
	    this._currentElement = element;
	  },

	  /**
	   * Generates root tag markup then recurses. This method has side effects and
	   * is not idempotent.
	   *
	   * @internal
	   * @param {string} rootID The root DOM ID for this node.
	   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
	   * @return {string} The computed markup.
	   */
	  mountComponent: function(rootID, transaction, context) {
	    this._rootNodeID = rootID;
	    assertValidProps(this._currentElement.props);
	    var closeTag = omittedCloseTags[this._tag] ? '' : '</' + this._tag + '>';
	    return (
	      this._createOpenTagMarkupAndPutListeners(transaction) +
	      this._createContentMarkup(transaction, context) +
	      closeTag
	    );
	  },

	  /**
	   * Creates markup for the open tag and all attributes.
	   *
	   * This method has side effects because events get registered.
	   *
	   * Iterating over object properties is faster than iterating over arrays.
	   * @see http://jsperf.com/obj-vs-arr-iteration
	   *
	   * @private
	   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
	   * @return {string} Markup of opening tag.
	   */
	  _createOpenTagMarkupAndPutListeners: function(transaction) {
	    var props = this._currentElement.props;
	    var ret = '<' + this._tag;

	    for (var propKey in props) {
	      if (!props.hasOwnProperty(propKey)) {
	        continue;
	      }
	      var propValue = props[propKey];
	      if (propValue == null) {
	        continue;
	      }
	      if (registrationNameModules.hasOwnProperty(propKey)) {
	        putListener(this._rootNodeID, propKey, propValue, transaction);
	      } else {
	        if (propKey === STYLE) {
	          if (propValue) {
	            propValue = this._previousStyleCopy = assign({}, props.style);
	          }
	          propValue = CSSPropertyOperations.createMarkupForStyles(propValue);
	        }
	        var markup =
	          DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
	        if (markup) {
	          ret += ' ' + markup;
	        }
	      }
	    }

	    // For static pages, no need to put React ID and checksum. Saves lots of
	    // bytes.
	    if (transaction.renderToStaticMarkup) {
	      return ret + '>';
	    }

	    var markupForID = DOMPropertyOperations.createMarkupForID(this._rootNodeID);
	    return ret + ' ' + markupForID + '>';
	  },

	  /**
	   * Creates markup for the content between the tags.
	   *
	   * @private
	   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
	   * @param {object} context
	   * @return {string} Content markup.
	   */
	  _createContentMarkup: function(transaction, context) {
	    var prefix = '';
	    if (this._tag === 'listing' ||
	        this._tag === 'pre' ||
	        this._tag === 'textarea') {
	      // Add an initial newline because browsers ignore the first newline in
	      // a <listing>, <pre>, or <textarea> as an "authoring convenience" -- see
	      // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inbody.
	      prefix = '\n';
	    }

	    var props = this._currentElement.props;

	    // Intentional use of != to avoid catching zero/false.
	    var innerHTML = props.dangerouslySetInnerHTML;
	    if (innerHTML != null) {
	      if (innerHTML.__html != null) {
	        return prefix + innerHTML.__html;
	      }
	    } else {
	      var contentToUse =
	        CONTENT_TYPES[typeof props.children] ? props.children : null;
	      var childrenToUse = contentToUse != null ? null : props.children;
	      if (contentToUse != null) {
	        return prefix + escapeTextContentForBrowser(contentToUse);
	      } else if (childrenToUse != null) {
	        var mountImages = this.mountChildren(
	          childrenToUse,
	          transaction,
	          context
	        );
	        return prefix + mountImages.join('');
	      }
	    }
	    return prefix;
	  },

	  receiveComponent: function(nextElement, transaction, context) {
	    var prevElement = this._currentElement;
	    this._currentElement = nextElement;
	    this.updateComponent(transaction, prevElement, nextElement, context);
	  },

	  /**
	   * Updates a native DOM component after it has already been allocated and
	   * attached to the DOM. Reconciles the root DOM node, then recurses.
	   *
	   * @param {ReactReconcileTransaction} transaction
	   * @param {ReactElement} prevElement
	   * @param {ReactElement} nextElement
	   * @internal
	   * @overridable
	   */
	  updateComponent: function(transaction, prevElement, nextElement, context) {
	    assertValidProps(this._currentElement.props);
	    this._updateDOMProperties(prevElement.props, transaction);
	    this._updateDOMChildren(prevElement.props, transaction, context);
	  },

	  /**
	   * Reconciles the properties by detecting differences in property values and
	   * updating the DOM as necessary. This function is probably the single most
	   * critical path for performance optimization.
	   *
	   * TODO: Benchmark whether checking for changed values in memory actually
	   *       improves performance (especially statically positioned elements).
	   * TODO: Benchmark the effects of putting this at the top since 99% of props
	   *       do not change for a given reconciliation.
	   * TODO: Benchmark areas that can be improved with caching.
	   *
	   * @private
	   * @param {object} lastProps
	   * @param {ReactReconcileTransaction} transaction
	   */
	  _updateDOMProperties: function(lastProps, transaction) {
	    var nextProps = this._currentElement.props;
	    var propKey;
	    var styleName;
	    var styleUpdates;
	    for (propKey in lastProps) {
	      if (nextProps.hasOwnProperty(propKey) ||
	         !lastProps.hasOwnProperty(propKey)) {
	        continue;
	      }
	      if (propKey === STYLE) {
	        var lastStyle = this._previousStyleCopy;
	        for (styleName in lastStyle) {
	          if (lastStyle.hasOwnProperty(styleName)) {
	            styleUpdates = styleUpdates || {};
	            styleUpdates[styleName] = '';
	          }
	        }
	        this._previousStyleCopy = null;
	      } else if (registrationNameModules.hasOwnProperty(propKey)) {
	        deleteListener(this._rootNodeID, propKey);
	      } else if (
	          DOMProperty.isStandardName[propKey] ||
	          DOMProperty.isCustomAttribute(propKey)) {
	        BackendIDOperations.deletePropertyByID(
	          this._rootNodeID,
	          propKey
	        );
	      }
	    }
	    for (propKey in nextProps) {
	      var nextProp = nextProps[propKey];
	      var lastProp = propKey === STYLE ?
	        this._previousStyleCopy :
	        lastProps[propKey];
	      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
	        continue;
	      }
	      if (propKey === STYLE) {
	        if (nextProp) {
	          nextProp = this._previousStyleCopy = assign({}, nextProp);
	        } else {
	          this._previousStyleCopy = null;
	        }
	        if (lastProp) {
	          // Unset styles on `lastProp` but not on `nextProp`.
	          for (styleName in lastProp) {
	            if (lastProp.hasOwnProperty(styleName) &&
	                (!nextProp || !nextProp.hasOwnProperty(styleName))) {
	              styleUpdates = styleUpdates || {};
	              styleUpdates[styleName] = '';
	            }
	          }
	          // Update styles that changed since `lastProp`.
	          for (styleName in nextProp) {
	            if (nextProp.hasOwnProperty(styleName) &&
	                lastProp[styleName] !== nextProp[styleName]) {
	              styleUpdates = styleUpdates || {};
	              styleUpdates[styleName] = nextProp[styleName];
	            }
	          }
	        } else {
	          // Relies on `updateStylesByID` not mutating `styleUpdates`.
	          styleUpdates = nextProp;
	        }
	      } else if (registrationNameModules.hasOwnProperty(propKey)) {
	        putListener(this._rootNodeID, propKey, nextProp, transaction);
	      } else if (
	          DOMProperty.isStandardName[propKey] ||
	          DOMProperty.isCustomAttribute(propKey)) {
	        BackendIDOperations.updatePropertyByID(
	          this._rootNodeID,
	          propKey,
	          nextProp
	        );
	      }
	    }
	    if (styleUpdates) {
	      BackendIDOperations.updateStylesByID(
	        this._rootNodeID,
	        styleUpdates
	      );
	    }
	  },

	  /**
	   * Reconciles the children with the various properties that affect the
	   * children content.
	   *
	   * @param {object} lastProps
	   * @param {ReactReconcileTransaction} transaction
	   */
	  _updateDOMChildren: function(lastProps, transaction, context) {
	    var nextProps = this._currentElement.props;

	    var lastContent =
	      CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
	    var nextContent =
	      CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

	    var lastHtml =
	      lastProps.dangerouslySetInnerHTML &&
	      lastProps.dangerouslySetInnerHTML.__html;
	    var nextHtml =
	      nextProps.dangerouslySetInnerHTML &&
	      nextProps.dangerouslySetInnerHTML.__html;

	    // Note the use of `!=` which checks for null or undefined.
	    var lastChildren = lastContent != null ? null : lastProps.children;
	    var nextChildren = nextContent != null ? null : nextProps.children;

	    // If we're switching from children to content/html or vice versa, remove
	    // the old content
	    var lastHasContentOrHtml = lastContent != null || lastHtml != null;
	    var nextHasContentOrHtml = nextContent != null || nextHtml != null;
	    if (lastChildren != null && nextChildren == null) {
	      this.updateChildren(null, transaction, context);
	    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
	      this.updateTextContent('');
	    }

	    if (nextContent != null) {
	      if (lastContent !== nextContent) {
	        this.updateTextContent('' + nextContent);
	      }
	    } else if (nextHtml != null) {
	      if (lastHtml !== nextHtml) {
	        BackendIDOperations.updateInnerHTMLByID(
	          this._rootNodeID,
	          nextHtml
	        );
	      }
	    } else if (nextChildren != null) {
	      this.updateChildren(nextChildren, transaction, context);
	    }
	  },

	  /**
	   * Destroys all event registrations for this instance. Does not remove from
	   * the DOM. That must be done by the parent.
	   *
	   * @internal
	   */
	  unmountComponent: function() {
	    this.unmountChildren();
	    ReactBrowserEventEmitter.deleteAllListeners(this._rootNodeID);
	    ReactComponentBrowserEnvironment.unmountIDFromEnvironment(this._rootNodeID);
	    this._rootNodeID = null;
	  }

	};

	ReactPerf.measureMethods(ReactDOMComponent, 'ReactDOMComponent', {
	  mountComponent: 'mountComponent',
	  updateComponent: 'updateComponent'
	});

	assign(
	  ReactDOMComponent.prototype,
	  ReactDOMComponent.Mixin,
	  ReactMultiChild.Mixin
	);

	ReactDOMComponent.injection = {
	  injectIDOperations: function(IDOperations) {
	    ReactDOMComponent.BackendIDOperations = BackendIDOperations = IDOperations;
	  }
	};

	module.exports = ReactDOMComponent;

	},{"10":10,"11":11,"116":116,"135":135,"136":136,"141":141,"154":154,"27":27,"30":30,"35":35,"5":5,"70":70,"71":71,"75":75}],43:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMForm
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var LocalEventTrapMixin = _dereq_(25);
	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);

	var form = ReactElement.createFactory('form');

	/**
	 * Since onSubmit doesn't bubble OR capture on the top level in IE8, we need
	 * to capture it on the <form> element itself. There are lots of hacks we could
	 * do to accomplish this, but the most reliable is to make <form> a
	 * composite component and use `componentDidMount` to attach the event handlers.
	 */
	var ReactDOMForm = ReactClass.createClass({
	  displayName: 'ReactDOMForm',
	  tagName: 'FORM',

	  mixins: [ReactBrowserComponentMixin, LocalEventTrapMixin],

	  render: function() {
	    // TODO: Instead of using `ReactDOM` directly, we should use JSX. However,
	    // `jshint` fails to parse JSX so in order for linting to work in the open
	    // source repo, we need to just use `ReactDOM.form`.
	    return form(this.props);
	  },

	  componentDidMount: function() {
	    this.trapBubbledEvent(EventConstants.topLevelTypes.topReset, 'reset');
	    this.trapBubbledEvent(EventConstants.topLevelTypes.topSubmit, 'submit');
	  }
	});

	module.exports = ReactDOMForm;

	},{"15":15,"25":25,"29":29,"33":33,"57":57}],44:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMIDOperations
	 * @typechecks static-only
	 */

	/*jslint evil: true */

	'use strict';

	var CSSPropertyOperations = _dereq_(5);
	var DOMChildrenOperations = _dereq_(9);
	var DOMPropertyOperations = _dereq_(11);
	var ReactMount = _dereq_(70);
	var ReactPerf = _dereq_(75);

	var invariant = _dereq_(135);
	var setInnerHTML = _dereq_(148);

	/**
	 * Errors for properties that should not be updated with `updatePropertyById()`.
	 *
	 * @type {object}
	 * @private
	 */
	var INVALID_PROPERTY_ERRORS = {
	  dangerouslySetInnerHTML:
	    '`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',
	  style: '`style` must be set using `updateStylesByID()`.'
	};

	/**
	 * Operations used to process updates to DOM nodes. This is made injectable via
	 * `ReactDOMComponent.BackendIDOperations`.
	 */
	var ReactDOMIDOperations = {

	  /**
	   * Updates a DOM node with new property values. This should only be used to
	   * update DOM properties in `DOMProperty`.
	   *
	   * @param {string} id ID of the node to update.
	   * @param {string} name A valid property name, see `DOMProperty`.
	   * @param {*} value New value of the property.
	   * @internal
	   */
	  updatePropertyByID: function(id, name, value) {
	    var node = ReactMount.getNode(id);
	    (true ? invariant(
	      !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
	      'updatePropertyByID(...): %s',
	      INVALID_PROPERTY_ERRORS[name]
	    ) : invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name)));

	    // If we're updating to null or undefined, we should remove the property
	    // from the DOM node instead of inadvertantly setting to a string. This
	    // brings us in line with the same behavior we have on initial render.
	    if (value != null) {
	      DOMPropertyOperations.setValueForProperty(node, name, value);
	    } else {
	      DOMPropertyOperations.deleteValueForProperty(node, name);
	    }
	  },

	  /**
	   * Updates a DOM node to remove a property. This should only be used to remove
	   * DOM properties in `DOMProperty`.
	   *
	   * @param {string} id ID of the node to update.
	   * @param {string} name A property name to remove, see `DOMProperty`.
	   * @internal
	   */
	  deletePropertyByID: function(id, name, value) {
	    var node = ReactMount.getNode(id);
	    (true ? invariant(
	      !INVALID_PROPERTY_ERRORS.hasOwnProperty(name),
	      'updatePropertyByID(...): %s',
	      INVALID_PROPERTY_ERRORS[name]
	    ) : invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name)));
	    DOMPropertyOperations.deleteValueForProperty(node, name, value);
	  },

	  /**
	   * Updates a DOM node with new style values. If a value is specified as '',
	   * the corresponding style property will be unset.
	   *
	   * @param {string} id ID of the node to update.
	   * @param {object} styles Mapping from styles to values.
	   * @internal
	   */
	  updateStylesByID: function(id, styles) {
	    var node = ReactMount.getNode(id);
	    CSSPropertyOperations.setValueForStyles(node, styles);
	  },

	  /**
	   * Updates a DOM node's innerHTML.
	   *
	   * @param {string} id ID of the node to update.
	   * @param {string} html An HTML string.
	   * @internal
	   */
	  updateInnerHTMLByID: function(id, html) {
	    var node = ReactMount.getNode(id);
	    setInnerHTML(node, html);
	  },

	  /**
	   * Updates a DOM node's text content set by `props.content`.
	   *
	   * @param {string} id ID of the node to update.
	   * @param {string} content Text content.
	   * @internal
	   */
	  updateTextContentByID: function(id, content) {
	    var node = ReactMount.getNode(id);
	    DOMChildrenOperations.updateTextContent(node, content);
	  },

	  /**
	   * Replaces a DOM node that exists in the document with markup.
	   *
	   * @param {string} id ID of child to be replaced.
	   * @param {string} markup Dangerous markup to inject in place of child.
	   * @internal
	   * @see {Danger.dangerouslyReplaceNodeWithMarkup}
	   */
	  dangerouslyReplaceNodeWithMarkupByID: function(id, markup) {
	    var node = ReactMount.getNode(id);
	    DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);
	  },

	  /**
	   * Updates a component's children by processing a series of updates.
	   *
	   * @param {array<object>} updates List of update configurations.
	   * @param {array<string>} markup List of markup strings.
	   * @internal
	   */
	  dangerouslyProcessChildrenUpdates: function(updates, markup) {
	    for (var i = 0; i < updates.length; i++) {
	      updates[i].parentNode = ReactMount.getNode(updates[i].parentID);
	    }
	    DOMChildrenOperations.processUpdates(updates, markup);
	  }
	};

	ReactPerf.measureMethods(ReactDOMIDOperations, 'ReactDOMIDOperations', {
	  updatePropertyByID: 'updatePropertyByID',
	  deletePropertyByID: 'deletePropertyByID',
	  updateStylesByID: 'updateStylesByID',
	  updateInnerHTMLByID: 'updateInnerHTMLByID',
	  updateTextContentByID: 'updateTextContentByID',
	  dangerouslyReplaceNodeWithMarkupByID: 'dangerouslyReplaceNodeWithMarkupByID',
	  dangerouslyProcessChildrenUpdates: 'dangerouslyProcessChildrenUpdates'
	});

	module.exports = ReactDOMIDOperations;

	},{"11":11,"135":135,"148":148,"5":5,"70":70,"75":75,"9":9}],45:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMIframe
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var LocalEventTrapMixin = _dereq_(25);
	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);

	var iframe = ReactElement.createFactory('iframe');

	/**
	 * Since onLoad doesn't bubble OR capture on the top level in IE8, we need to
	 * capture it on the <iframe> element itself. There are lots of hacks we could
	 * do to accomplish this, but the most reliable is to make <iframe> a composite
	 * component and use `componentDidMount` to attach the event handlers.
	 */
	var ReactDOMIframe = ReactClass.createClass({
	  displayName: 'ReactDOMIframe',
	  tagName: 'IFRAME',

	  mixins: [ReactBrowserComponentMixin, LocalEventTrapMixin],

	  render: function() {
	    return iframe(this.props);
	  },

	  componentDidMount: function() {
	    this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad, 'load');
	  }
	});

	module.exports = ReactDOMIframe;

	},{"15":15,"25":25,"29":29,"33":33,"57":57}],46:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMImg
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var LocalEventTrapMixin = _dereq_(25);
	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);

	var img = ReactElement.createFactory('img');

	/**
	 * Since onLoad doesn't bubble OR capture on the top level in IE8, we need to
	 * capture it on the <img> element itself. There are lots of hacks we could do
	 * to accomplish this, but the most reliable is to make <img> a composite
	 * component and use `componentDidMount` to attach the event handlers.
	 */
	var ReactDOMImg = ReactClass.createClass({
	  displayName: 'ReactDOMImg',
	  tagName: 'IMG',

	  mixins: [ReactBrowserComponentMixin, LocalEventTrapMixin],

	  render: function() {
	    return img(this.props);
	  },

	  componentDidMount: function() {
	    this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad, 'load');
	    this.trapBubbledEvent(EventConstants.topLevelTypes.topError, 'error');
	  }
	});

	module.exports = ReactDOMImg;

	},{"15":15,"25":25,"29":29,"33":33,"57":57}],47:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMInput
	 */

	'use strict';

	var AutoFocusMixin = _dereq_(2);
	var DOMPropertyOperations = _dereq_(11);
	var LinkedValueUtils = _dereq_(24);
	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);
	var ReactMount = _dereq_(70);
	var ReactUpdates = _dereq_(87);

	var assign = _dereq_(27);
	var invariant = _dereq_(135);

	var input = ReactElement.createFactory('input');

	var instancesByReactID = {};

	function forceUpdateIfMounted() {
	  /*jshint validthis:true */
	  if (this.isMounted()) {
	    this.forceUpdate();
	  }
	}

	/**
	 * Implements an <input> native component that allows setting these optional
	 * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
	 *
	 * If `checked` or `value` are not supplied (or null/undefined), user actions
	 * that affect the checked state or value will trigger updates to the element.
	 *
	 * If they are supplied (and not null/undefined), the rendered element will not
	 * trigger updates to the element. Instead, the props must change in order for
	 * the rendered element to be updated.
	 *
	 * The rendered element will be initialized as unchecked (or `defaultChecked`)
	 * with an empty value (or `defaultValue`).
	 *
	 * @see http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
	 */
	var ReactDOMInput = ReactClass.createClass({
	  displayName: 'ReactDOMInput',
	  tagName: 'INPUT',

	  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin],

	  getInitialState: function() {
	    var defaultValue = this.props.defaultValue;
	    return {
	      initialChecked: this.props.defaultChecked || false,
	      initialValue: defaultValue != null ? defaultValue : null
	    };
	  },

	  render: function() {
	    // Clone `this.props` so we don't mutate the input.
	    var props = assign({}, this.props);

	    props.defaultChecked = null;
	    props.defaultValue = null;

	    var value = LinkedValueUtils.getValue(this);
	    props.value = value != null ? value : this.state.initialValue;

	    var checked = LinkedValueUtils.getChecked(this);
	    props.checked = checked != null ? checked : this.state.initialChecked;

	    props.onChange = this._handleChange;

	    return input(props, this.props.children);
	  },

	  componentDidMount: function() {
	    var id = ReactMount.getID(this.getDOMNode());
	    instancesByReactID[id] = this;
	  },

	  componentWillUnmount: function() {
	    var rootNode = this.getDOMNode();
	    var id = ReactMount.getID(rootNode);
	    delete instancesByReactID[id];
	  },

	  componentDidUpdate: function(prevProps, prevState, prevContext) {
	    var rootNode = this.getDOMNode();
	    if (this.props.checked != null) {
	      DOMPropertyOperations.setValueForProperty(
	        rootNode,
	        'checked',
	        this.props.checked || false
	      );
	    }

	    var value = LinkedValueUtils.getValue(this);
	    if (value != null) {
	      // Cast `value` to a string to ensure the value is set correctly. While
	      // browsers typically do this as necessary, jsdom doesn't.
	      DOMPropertyOperations.setValueForProperty(rootNode, 'value', '' + value);
	    }
	  },

	  _handleChange: function(event) {
	    var returnValue;
	    var onChange = LinkedValueUtils.getOnChange(this);
	    if (onChange) {
	      returnValue = onChange.call(this, event);
	    }
	    // Here we use asap to wait until all updates have propagated, which
	    // is important when using controlled components within layers:
	    // https://github.com/facebook/react/issues/1698
	    ReactUpdates.asap(forceUpdateIfMounted, this);

	    var name = this.props.name;
	    if (this.props.type === 'radio' && name != null) {
	      var rootNode = this.getDOMNode();
	      var queryRoot = rootNode;

	      while (queryRoot.parentNode) {
	        queryRoot = queryRoot.parentNode;
	      }

	      // If `rootNode.form` was non-null, then we could try `form.elements`,
	      // but that sometimes behaves strangely in IE8. We could also try using
	      // `form.getElementsByName`, but that will only return direct children
	      // and won't include inputs that use the HTML5 `form=` attribute. Since
	      // the input might not even be in a form, let's just use the global
	      // `querySelectorAll` to ensure we don't miss anything.
	      var group = queryRoot.querySelectorAll(
	        'input[name=' + JSON.stringify('' + name) + '][type="radio"]');

	      for (var i = 0, groupLen = group.length; i < groupLen; i++) {
	        var otherNode = group[i];
	        if (otherNode === rootNode ||
	            otherNode.form !== rootNode.form) {
	          continue;
	        }
	        var otherID = ReactMount.getID(otherNode);
	        (true ? invariant(
	          otherID,
	          'ReactDOMInput: Mixing React and non-React radio inputs with the ' +
	          'same `name` is not supported.'
	        ) : invariant(otherID));
	        var otherInstance = instancesByReactID[otherID];
	        (true ? invariant(
	          otherInstance,
	          'ReactDOMInput: Unknown radio button ID %s.',
	          otherID
	        ) : invariant(otherInstance));
	        // If this is a controlled radio button group, forcing the input that
	        // was previously checked to update will cause it to be come re-checked
	        // as appropriate.
	        ReactUpdates.asap(forceUpdateIfMounted, otherInstance);
	      }
	    }

	    return returnValue;
	  }

	});

	module.exports = ReactDOMInput;

	},{"11":11,"135":135,"2":2,"24":24,"27":27,"29":29,"33":33,"57":57,"70":70,"87":87}],48:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMOption
	 */

	'use strict';

	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);

	var warning = _dereq_(154);

	var option = ReactElement.createFactory('option');

	/**
	 * Implements an <option> native component that warns when `selected` is set.
	 */
	var ReactDOMOption = ReactClass.createClass({
	  displayName: 'ReactDOMOption',
	  tagName: 'OPTION',

	  mixins: [ReactBrowserComponentMixin],

	  componentWillMount: function() {
	    // TODO (yungsters): Remove support for `selected` in <option>.
	    if (true) {
	      (true ? warning(
	        this.props.selected == null,
	        'Use the `defaultValue` or `value` props on <select> instead of ' +
	        'setting `selected` on <option>.'
	      ) : null);
	    }
	  },

	  render: function() {
	    return option(this.props, this.props.children);
	  }

	});

	module.exports = ReactDOMOption;

	},{"154":154,"29":29,"33":33,"57":57}],49:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMSelect
	 */

	'use strict';

	var AutoFocusMixin = _dereq_(2);
	var LinkedValueUtils = _dereq_(24);
	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);
	var ReactUpdates = _dereq_(87);

	var assign = _dereq_(27);

	var select = ReactElement.createFactory('select');

	function updateOptionsIfPendingUpdateAndMounted() {
	  /*jshint validthis:true */
	  if (this._pendingUpdate) {
	    this._pendingUpdate = false;
	    var value = LinkedValueUtils.getValue(this);
	    if (value != null && this.isMounted()) {
	      updateOptions(this, value);
	    }
	  }
	}

	/**
	 * Validation function for `value` and `defaultValue`.
	 * @private
	 */
	function selectValueType(props, propName, componentName) {
	  if (props[propName] == null) {
	    return null;
	  }
	  if (props.multiple) {
	    if (!Array.isArray(props[propName])) {
	      return new Error(
	        ("The `" + propName + "` prop supplied to <select> must be an array if ") +
	        ("`multiple` is true.")
	      );
	    }
	  } else {
	    if (Array.isArray(props[propName])) {
	      return new Error(
	        ("The `" + propName + "` prop supplied to <select> must be a scalar ") +
	        ("value if `multiple` is false.")
	      );
	    }
	  }
	}

	/**
	 * @param {ReactComponent} component Instance of ReactDOMSelect
	 * @param {*} propValue A stringable (with `multiple`, a list of stringables).
	 * @private
	 */
	function updateOptions(component, propValue) {
	  var selectedValue, i, l;
	  var options = component.getDOMNode().options;

	  if (component.props.multiple) {
	    selectedValue = {};
	    for (i = 0, l = propValue.length; i < l; i++) {
	      selectedValue['' + propValue[i]] = true;
	    }
	    for (i = 0, l = options.length; i < l; i++) {
	      var selected = selectedValue.hasOwnProperty(options[i].value);
	      if (options[i].selected !== selected) {
	        options[i].selected = selected;
	      }
	    }
	  } else {
	    // Do not set `select.value` as exact behavior isn't consistent across all
	    // browsers for all cases.
	    selectedValue = '' + propValue;
	    for (i = 0, l = options.length; i < l; i++) {
	      if (options[i].value === selectedValue) {
	        options[i].selected = true;
	        return;
	      }
	    }
	    if (options.length) {
	      options[0].selected = true;
	    }
	  }
	}

	/**
	 * Implements a <select> native component that allows optionally setting the
	 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
	 * stringable. If `multiple` is true, the prop must be an array of stringables.
	 *
	 * If `value` is not supplied (or null/undefined), user actions that change the
	 * selected option will trigger updates to the rendered options.
	 *
	 * If it is supplied (and not null/undefined), the rendered options will not
	 * update in response to user actions. Instead, the `value` prop must change in
	 * order for the rendered options to update.
	 *
	 * If `defaultValue` is provided, any options with the supplied values will be
	 * selected.
	 */
	var ReactDOMSelect = ReactClass.createClass({
	  displayName: 'ReactDOMSelect',
	  tagName: 'SELECT',

	  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin],

	  propTypes: {
	    defaultValue: selectValueType,
	    value: selectValueType
	  },

	  render: function() {
	    // Clone `this.props` so we don't mutate the input.
	    var props = assign({}, this.props);

	    props.onChange = this._handleChange;
	    props.value = null;

	    return select(props, this.props.children);
	  },

	  componentWillMount: function() {
	    this._pendingUpdate = false;
	  },

	  componentDidMount: function() {
	    var value = LinkedValueUtils.getValue(this);
	    if (value != null) {
	      updateOptions(this, value);
	    } else if (this.props.defaultValue != null) {
	      updateOptions(this, this.props.defaultValue);
	    }
	  },

	  componentDidUpdate: function(prevProps) {
	    var value = LinkedValueUtils.getValue(this);
	    if (value != null) {
	      this._pendingUpdate = false;
	      updateOptions(this, value);
	    } else if (!prevProps.multiple !== !this.props.multiple) {
	      // For simplicity, reapply `defaultValue` if `multiple` is toggled.
	      if (this.props.defaultValue != null) {
	        updateOptions(this, this.props.defaultValue);
	      } else {
	        // Revert the select back to its default unselected state.
	        updateOptions(this, this.props.multiple ? [] : '');
	      }
	    }
	  },

	  _handleChange: function(event) {
	    var returnValue;
	    var onChange = LinkedValueUtils.getOnChange(this);
	    if (onChange) {
	      returnValue = onChange.call(this, event);
	    }

	    this._pendingUpdate = true;
	    ReactUpdates.asap(updateOptionsIfPendingUpdateAndMounted, this);
	    return returnValue;
	  }

	});

	module.exports = ReactDOMSelect;

	},{"2":2,"24":24,"27":27,"29":29,"33":33,"57":57,"87":87}],50:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMSelection
	 */

	'use strict';

	var ExecutionEnvironment = _dereq_(21);

	var getNodeForCharacterOffset = _dereq_(128);
	var getTextContentAccessor = _dereq_(130);

	/**
	 * While `isCollapsed` is available on the Selection object and `collapsed`
	 * is available on the Range object, IE11 sometimes gets them wrong.
	 * If the anchor/focus nodes and offsets are the same, the range is collapsed.
	 */
	function isCollapsed(anchorNode, anchorOffset, focusNode, focusOffset) {
	  return anchorNode === focusNode && anchorOffset === focusOffset;
	}

	/**
	 * Get the appropriate anchor and focus node/offset pairs for IE.
	 *
	 * The catch here is that IE's selection API doesn't provide information
	 * about whether the selection is forward or backward, so we have to
	 * behave as though it's always forward.
	 *
	 * IE text differs from modern selection in that it behaves as though
	 * block elements end with a new line. This means character offsets will
	 * differ between the two APIs.
	 *
	 * @param {DOMElement} node
	 * @return {object}
	 */
	function getIEOffsets(node) {
	  var selection = document.selection;
	  var selectedRange = selection.createRange();
	  var selectedLength = selectedRange.text.length;

	  // Duplicate selection so we can move range without breaking user selection.
	  var fromStart = selectedRange.duplicate();
	  fromStart.moveToElementText(node);
	  fromStart.setEndPoint('EndToStart', selectedRange);

	  var startOffset = fromStart.text.length;
	  var endOffset = startOffset + selectedLength;

	  return {
	    start: startOffset,
	    end: endOffset
	  };
	}

	/**
	 * @param {DOMElement} node
	 * @return {?object}
	 */
	function getModernOffsets(node) {
	  var selection = window.getSelection && window.getSelection();

	  if (!selection || selection.rangeCount === 0) {
	    return null;
	  }

	  var anchorNode = selection.anchorNode;
	  var anchorOffset = selection.anchorOffset;
	  var focusNode = selection.focusNode;
	  var focusOffset = selection.focusOffset;

	  var currentRange = selection.getRangeAt(0);

	  // If the node and offset values are the same, the selection is collapsed.
	  // `Selection.isCollapsed` is available natively, but IE sometimes gets
	  // this value wrong.
	  var isSelectionCollapsed = isCollapsed(
	    selection.anchorNode,
	    selection.anchorOffset,
	    selection.focusNode,
	    selection.focusOffset
	  );

	  var rangeLength = isSelectionCollapsed ? 0 : currentRange.toString().length;

	  var tempRange = currentRange.cloneRange();
	  tempRange.selectNodeContents(node);
	  tempRange.setEnd(currentRange.startContainer, currentRange.startOffset);

	  var isTempRangeCollapsed = isCollapsed(
	    tempRange.startContainer,
	    tempRange.startOffset,
	    tempRange.endContainer,
	    tempRange.endOffset
	  );

	  var start = isTempRangeCollapsed ? 0 : tempRange.toString().length;
	  var end = start + rangeLength;

	  // Detect whether the selection is backward.
	  var detectionRange = document.createRange();
	  detectionRange.setStart(anchorNode, anchorOffset);
	  detectionRange.setEnd(focusNode, focusOffset);
	  var isBackward = detectionRange.collapsed;

	  return {
	    start: isBackward ? end : start,
	    end: isBackward ? start : end
	  };
	}

	/**
	 * @param {DOMElement|DOMTextNode} node
	 * @param {object} offsets
	 */
	function setIEOffsets(node, offsets) {
	  var range = document.selection.createRange().duplicate();
	  var start, end;

	  if (typeof offsets.end === 'undefined') {
	    start = offsets.start;
	    end = start;
	  } else if (offsets.start > offsets.end) {
	    start = offsets.end;
	    end = offsets.start;
	  } else {
	    start = offsets.start;
	    end = offsets.end;
	  }

	  range.moveToElementText(node);
	  range.moveStart('character', start);
	  range.setEndPoint('EndToStart', range);
	  range.moveEnd('character', end - start);
	  range.select();
	}

	/**
	 * In modern non-IE browsers, we can support both forward and backward
	 * selections.
	 *
	 * Note: IE10+ supports the Selection object, but it does not support
	 * the `extend` method, which means that even in modern IE, it's not possible
	 * to programatically create a backward selection. Thus, for all IE
	 * versions, we use the old IE API to create our selections.
	 *
	 * @param {DOMElement|DOMTextNode} node
	 * @param {object} offsets
	 */
	function setModernOffsets(node, offsets) {
	  if (!window.getSelection) {
	    return;
	  }

	  var selection = window.getSelection();
	  var length = node[getTextContentAccessor()].length;
	  var start = Math.min(offsets.start, length);
	  var end = typeof offsets.end === 'undefined' ?
	            start : Math.min(offsets.end, length);

	  // IE 11 uses modern selection, but doesn't support the extend method.
	  // Flip backward selections, so we can set with a single range.
	  if (!selection.extend && start > end) {
	    var temp = end;
	    end = start;
	    start = temp;
	  }

	  var startMarker = getNodeForCharacterOffset(node, start);
	  var endMarker = getNodeForCharacterOffset(node, end);

	  if (startMarker && endMarker) {
	    var range = document.createRange();
	    range.setStart(startMarker.node, startMarker.offset);
	    selection.removeAllRanges();

	    if (start > end) {
	      selection.addRange(range);
	      selection.extend(endMarker.node, endMarker.offset);
	    } else {
	      range.setEnd(endMarker.node, endMarker.offset);
	      selection.addRange(range);
	    }
	  }
	}

	var useIEOffsets = (
	  ExecutionEnvironment.canUseDOM &&
	  'selection' in document &&
	  !('getSelection' in window)
	);

	var ReactDOMSelection = {
	  /**
	   * @param {DOMElement} node
	   */
	  getOffsets: useIEOffsets ? getIEOffsets : getModernOffsets,

	  /**
	   * @param {DOMElement|DOMTextNode} node
	   * @param {object} offsets
	   */
	  setOffsets: useIEOffsets ? setIEOffsets : setModernOffsets
	};

	module.exports = ReactDOMSelection;

	},{"128":128,"130":130,"21":21}],51:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMTextComponent
	 * @typechecks static-only
	 */

	'use strict';

	var DOMPropertyOperations = _dereq_(11);
	var ReactComponentBrowserEnvironment =
	  _dereq_(35);
	var ReactDOMComponent = _dereq_(42);

	var assign = _dereq_(27);
	var escapeTextContentForBrowser = _dereq_(116);

	/**
	 * Text nodes violate a couple assumptions that React makes about components:
	 *
	 *  - When mounting text into the DOM, adjacent text nodes are merged.
	 *  - Text nodes cannot be assigned a React root ID.
	 *
	 * This component is used to wrap strings in elements so that they can undergo
	 * the same reconciliation that is applied to elements.
	 *
	 * TODO: Investigate representing React components in the DOM with text nodes.
	 *
	 * @class ReactDOMTextComponent
	 * @extends ReactComponent
	 * @internal
	 */
	var ReactDOMTextComponent = function(props) {
	  // This constructor and its argument is currently used by mocks.
	};

	assign(ReactDOMTextComponent.prototype, {

	  /**
	   * @param {ReactText} text
	   * @internal
	   */
	  construct: function(text) {
	    // TODO: This is really a ReactText (ReactNode), not a ReactElement
	    this._currentElement = text;
	    this._stringText = '' + text;

	    // Properties
	    this._rootNodeID = null;
	    this._mountIndex = 0;
	  },

	  /**
	   * Creates the markup for this text node. This node is not intended to have
	   * any features besides containing text content.
	   *
	   * @param {string} rootID DOM ID of the root node.
	   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
	   * @return {string} Markup for this text node.
	   * @internal
	   */
	  mountComponent: function(rootID, transaction, context) {
	    this._rootNodeID = rootID;
	    var escapedText = escapeTextContentForBrowser(this._stringText);

	    if (transaction.renderToStaticMarkup) {
	      // Normally we'd wrap this in a `span` for the reasons stated above, but
	      // since this is a situation where React won't take over (static pages),
	      // we can simply return the text as it is.
	      return escapedText;
	    }

	    return (
	      '<span ' + DOMPropertyOperations.createMarkupForID(rootID) + '>' +
	        escapedText +
	      '</span>'
	    );
	  },

	  /**
	   * Updates this component by updating the text content.
	   *
	   * @param {ReactText} nextText The next text content
	   * @param {ReactReconcileTransaction} transaction
	   * @internal
	   */
	  receiveComponent: function(nextText, transaction) {
	    if (nextText !== this._currentElement) {
	      this._currentElement = nextText;
	      var nextStringText = '' + nextText;
	      if (nextStringText !== this._stringText) {
	        // TODO: Save this as pending props and use performUpdateIfNecessary
	        // and/or updateComponent to do the actual update for consistency with
	        // other component types?
	        this._stringText = nextStringText;
	        ReactDOMComponent.BackendIDOperations.updateTextContentByID(
	          this._rootNodeID,
	          nextStringText
	        );
	      }
	    }
	  },

	  unmountComponent: function() {
	    ReactComponentBrowserEnvironment.unmountIDFromEnvironment(this._rootNodeID);
	  }

	});

	module.exports = ReactDOMTextComponent;

	},{"11":11,"116":116,"27":27,"35":35,"42":42}],52:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDOMTextarea
	 */

	'use strict';

	var AutoFocusMixin = _dereq_(2);
	var DOMPropertyOperations = _dereq_(11);
	var LinkedValueUtils = _dereq_(24);
	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);
	var ReactUpdates = _dereq_(87);

	var assign = _dereq_(27);
	var invariant = _dereq_(135);

	var warning = _dereq_(154);

	var textarea = ReactElement.createFactory('textarea');

	function forceUpdateIfMounted() {
	  /*jshint validthis:true */
	  if (this.isMounted()) {
	    this.forceUpdate();
	  }
	}

	/**
	 * Implements a <textarea> native component that allows setting `value`, and
	 * `defaultValue`. This differs from the traditional DOM API because value is
	 * usually set as PCDATA children.
	 *
	 * If `value` is not supplied (or null/undefined), user actions that affect the
	 * value will trigger updates to the element.
	 *
	 * If `value` is supplied (and not null/undefined), the rendered element will
	 * not trigger updates to the element. Instead, the `value` prop must change in
	 * order for the rendered element to be updated.
	 *
	 * The rendered element will be initialized with an empty value, the prop
	 * `defaultValue` if specified, or the children content (deprecated).
	 */
	var ReactDOMTextarea = ReactClass.createClass({
	  displayName: 'ReactDOMTextarea',
	  tagName: 'TEXTAREA',

	  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin],

	  getInitialState: function() {
	    var defaultValue = this.props.defaultValue;
	    // TODO (yungsters): Remove support for children content in <textarea>.
	    var children = this.props.children;
	    if (children != null) {
	      if (true) {
	        (true ? warning(
	          false,
	          'Use the `defaultValue` or `value` props instead of setting ' +
	          'children on <textarea>.'
	        ) : null);
	      }
	      (true ? invariant(
	        defaultValue == null,
	        'If you supply `defaultValue` on a <textarea>, do not pass children.'
	      ) : invariant(defaultValue == null));
	      if (Array.isArray(children)) {
	        (true ? invariant(
	          children.length <= 1,
	          '<textarea> can only have at most one child.'
	        ) : invariant(children.length <= 1));
	        children = children[0];
	      }

	      defaultValue = '' + children;
	    }
	    if (defaultValue == null) {
	      defaultValue = '';
	    }
	    var value = LinkedValueUtils.getValue(this);
	    return {
	      // We save the initial value so that `ReactDOMComponent` doesn't update
	      // `textContent` (unnecessary since we update value).
	      // The initial value can be a boolean or object so that's why it's
	      // forced to be a string.
	      initialValue: '' + (value != null ? value : defaultValue)
	    };
	  },

	  render: function() {
	    // Clone `this.props` so we don't mutate the input.
	    var props = assign({}, this.props);

	    (true ? invariant(
	      props.dangerouslySetInnerHTML == null,
	      '`dangerouslySetInnerHTML` does not make sense on <textarea>.'
	    ) : invariant(props.dangerouslySetInnerHTML == null));

	    props.defaultValue = null;
	    props.value = null;
	    props.onChange = this._handleChange;

	    // Always set children to the same thing. In IE9, the selection range will
	    // get reset if `textContent` is mutated.
	    return textarea(props, this.state.initialValue);
	  },

	  componentDidUpdate: function(prevProps, prevState, prevContext) {
	    var value = LinkedValueUtils.getValue(this);
	    if (value != null) {
	      var rootNode = this.getDOMNode();
	      // Cast `value` to a string to ensure the value is set correctly. While
	      // browsers typically do this as necessary, jsdom doesn't.
	      DOMPropertyOperations.setValueForProperty(rootNode, 'value', '' + value);
	    }
	  },

	  _handleChange: function(event) {
	    var returnValue;
	    var onChange = LinkedValueUtils.getOnChange(this);
	    if (onChange) {
	      returnValue = onChange.call(this, event);
	    }
	    ReactUpdates.asap(forceUpdateIfMounted, this);
	    return returnValue;
	  }

	});

	module.exports = ReactDOMTextarea;

	},{"11":11,"135":135,"154":154,"2":2,"24":24,"27":27,"29":29,"33":33,"57":57,"87":87}],53:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDefaultBatchingStrategy
	 */

	'use strict';

	var ReactUpdates = _dereq_(87);
	var Transaction = _dereq_(103);

	var assign = _dereq_(27);
	var emptyFunction = _dereq_(114);

	var RESET_BATCHED_UPDATES = {
	  initialize: emptyFunction,
	  close: function() {
	    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
	  }
	};

	var FLUSH_BATCHED_UPDATES = {
	  initialize: emptyFunction,
	  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)
	};

	var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

	function ReactDefaultBatchingStrategyTransaction() {
	  this.reinitializeTransaction();
	}

	assign(
	  ReactDefaultBatchingStrategyTransaction.prototype,
	  Transaction.Mixin,
	  {
	    getTransactionWrappers: function() {
	      return TRANSACTION_WRAPPERS;
	    }
	  }
	);

	var transaction = new ReactDefaultBatchingStrategyTransaction();

	var ReactDefaultBatchingStrategy = {
	  isBatchingUpdates: false,

	  /**
	   * Call the provided function in a context within which calls to `setState`
	   * and friends are batched such that components aren't updated unnecessarily.
	   */
	  batchedUpdates: function(callback, a, b, c, d) {
	    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

	    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

	    // The code is written this way to avoid extra allocations
	    if (alreadyBatchingUpdates) {
	      callback(a, b, c, d);
	    } else {
	      transaction.perform(callback, null, a, b, c, d);
	    }
	  }
	};

	module.exports = ReactDefaultBatchingStrategy;

	},{"103":103,"114":114,"27":27,"87":87}],54:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDefaultInjection
	 */

	'use strict';

	var BeforeInputEventPlugin = _dereq_(3);
	var ChangeEventPlugin = _dereq_(7);
	var ClientReactRootIndex = _dereq_(8);
	var DefaultEventPluginOrder = _dereq_(13);
	var EnterLeaveEventPlugin = _dereq_(14);
	var ExecutionEnvironment = _dereq_(21);
	var HTMLDOMPropertyConfig = _dereq_(23);
	var MobileSafariClickEventPlugin = _dereq_(26);
	var ReactBrowserComponentMixin = _dereq_(29);
	var ReactClass = _dereq_(33);
	var ReactComponentBrowserEnvironment =
	  _dereq_(35);
	var ReactDefaultBatchingStrategy = _dereq_(53);
	var ReactDOMComponent = _dereq_(42);
	var ReactDOMButton = _dereq_(41);
	var ReactDOMForm = _dereq_(43);
	var ReactDOMImg = _dereq_(46);
	var ReactDOMIDOperations = _dereq_(44);
	var ReactDOMIframe = _dereq_(45);
	var ReactDOMInput = _dereq_(47);
	var ReactDOMOption = _dereq_(48);
	var ReactDOMSelect = _dereq_(49);
	var ReactDOMTextarea = _dereq_(52);
	var ReactDOMTextComponent = _dereq_(51);
	var ReactElement = _dereq_(57);
	var ReactEventListener = _dereq_(62);
	var ReactInjection = _dereq_(64);
	var ReactInstanceHandles = _dereq_(66);
	var ReactMount = _dereq_(70);
	var ReactReconcileTransaction = _dereq_(80);
	var SelectEventPlugin = _dereq_(89);
	var ServerReactRootIndex = _dereq_(90);
	var SimpleEventPlugin = _dereq_(91);
	var SVGDOMPropertyConfig = _dereq_(88);

	var createFullPageComponent = _dereq_(111);

	function autoGenerateWrapperClass(type) {
	  return ReactClass.createClass({
	    tagName: type.toUpperCase(),
	    render: function() {
	      return new ReactElement(
	        type,
	        null,
	        null,
	        null,
	        null,
	        this.props
	      );
	    }
	  });
	}

	function inject() {
	  ReactInjection.EventEmitter.injectReactEventListener(
	    ReactEventListener
	  );

	  /**
	   * Inject modules for resolving DOM hierarchy and plugin ordering.
	   */
	  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
	  ReactInjection.EventPluginHub.injectInstanceHandle(ReactInstanceHandles);
	  ReactInjection.EventPluginHub.injectMount(ReactMount);

	  /**
	   * Some important event plugins included by default (without having to require
	   * them).
	   */
	  ReactInjection.EventPluginHub.injectEventPluginsByName({
	    SimpleEventPlugin: SimpleEventPlugin,
	    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
	    ChangeEventPlugin: ChangeEventPlugin,
	    MobileSafariClickEventPlugin: MobileSafariClickEventPlugin,
	    SelectEventPlugin: SelectEventPlugin,
	    BeforeInputEventPlugin: BeforeInputEventPlugin
	  });

	  ReactInjection.NativeComponent.injectGenericComponentClass(
	    ReactDOMComponent
	  );

	  ReactInjection.NativeComponent.injectTextComponentClass(
	    ReactDOMTextComponent
	  );

	  ReactInjection.NativeComponent.injectAutoWrapper(
	    autoGenerateWrapperClass
	  );

	  // This needs to happen before createFullPageComponent() otherwise the mixin
	  // won't be included.
	  ReactInjection.Class.injectMixin(ReactBrowserComponentMixin);

	  ReactInjection.NativeComponent.injectComponentClasses({
	    'button': ReactDOMButton,
	    'form': ReactDOMForm,
	    'iframe': ReactDOMIframe,
	    'img': ReactDOMImg,
	    'input': ReactDOMInput,
	    'option': ReactDOMOption,
	    'select': ReactDOMSelect,
	    'textarea': ReactDOMTextarea,

	    'html': createFullPageComponent('html'),
	    'head': createFullPageComponent('head'),
	    'body': createFullPageComponent('body')
	  });

	  ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
	  ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);

	  ReactInjection.EmptyComponent.injectEmptyComponent('noscript');

	  ReactInjection.Updates.injectReconcileTransaction(
	    ReactReconcileTransaction
	  );
	  ReactInjection.Updates.injectBatchingStrategy(
	    ReactDefaultBatchingStrategy
	  );

	  ReactInjection.RootIndex.injectCreateReactRootIndex(
	    ExecutionEnvironment.canUseDOM ?
	      ClientReactRootIndex.createReactRootIndex :
	      ServerReactRootIndex.createReactRootIndex
	  );

	  ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);
	  ReactInjection.DOMComponent.injectIDOperations(ReactDOMIDOperations);

	  if (true) {
	    var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
	    if ((/[?&]react_perf\b/).test(url)) {
	      var ReactDefaultPerf = _dereq_(55);
	      ReactDefaultPerf.start();
	    }
	  }
	}

	module.exports = {
	  inject: inject
	};

	},{"111":111,"13":13,"14":14,"21":21,"23":23,"26":26,"29":29,"3":3,"33":33,"35":35,"41":41,"42":42,"43":43,"44":44,"45":45,"46":46,"47":47,"48":48,"49":49,"51":51,"52":52,"53":53,"55":55,"57":57,"62":62,"64":64,"66":66,"7":7,"70":70,"8":8,"80":80,"88":88,"89":89,"90":90,"91":91}],55:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDefaultPerf
	 * @typechecks static-only
	 */

	'use strict';

	var DOMProperty = _dereq_(10);
	var ReactDefaultPerfAnalysis = _dereq_(56);
	var ReactMount = _dereq_(70);
	var ReactPerf = _dereq_(75);

	var performanceNow = _dereq_(146);

	function roundFloat(val) {
	  return Math.floor(val * 100) / 100;
	}

	function addValue(obj, key, val) {
	  obj[key] = (obj[key] || 0) + val;
	}

	var ReactDefaultPerf = {
	  _allMeasurements: [], // last item in the list is the current one
	  _mountStack: [0],
	  _injected: false,

	  start: function() {
	    if (!ReactDefaultPerf._injected) {
	      ReactPerf.injection.injectMeasure(ReactDefaultPerf.measure);
	    }

	    ReactDefaultPerf._allMeasurements.length = 0;
	    ReactPerf.enableMeasure = true;
	  },

	  stop: function() {
	    ReactPerf.enableMeasure = false;
	  },

	  getLastMeasurements: function() {
	    return ReactDefaultPerf._allMeasurements;
	  },

	  printExclusive: function(measurements) {
	    measurements = measurements || ReactDefaultPerf._allMeasurements;
	    var summary = ReactDefaultPerfAnalysis.getExclusiveSummary(measurements);
	    console.table(summary.map(function(item) {
	      return {
	        'Component class name': item.componentName,
	        'Total inclusive time (ms)': roundFloat(item.inclusive),
	        'Exclusive mount time (ms)': roundFloat(item.exclusive),
	        'Exclusive render time (ms)': roundFloat(item.render),
	        'Mount time per instance (ms)': roundFloat(item.exclusive / item.count),
	        'Render time per instance (ms)': roundFloat(item.render / item.count),
	        'Instances': item.count
	      };
	    }));
	    // TODO: ReactDefaultPerfAnalysis.getTotalTime() does not return the correct
	    // number.
	  },

	  printInclusive: function(measurements) {
	    measurements = measurements || ReactDefaultPerf._allMeasurements;
	    var summary = ReactDefaultPerfAnalysis.getInclusiveSummary(measurements);
	    console.table(summary.map(function(item) {
	      return {
	        'Owner > component': item.componentName,
	        'Inclusive time (ms)': roundFloat(item.time),
	        'Instances': item.count
	      };
	    }));
	    console.log(
	      'Total time:',
	      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
	    );
	  },

	  getMeasurementsSummaryMap: function(measurements) {
	    var summary = ReactDefaultPerfAnalysis.getInclusiveSummary(
	      measurements,
	      true
	    );
	    return summary.map(function(item) {
	      return {
	        'Owner > component': item.componentName,
	        'Wasted time (ms)': item.time,
	        'Instances': item.count
	      };
	    });
	  },

	  printWasted: function(measurements) {
	    measurements = measurements || ReactDefaultPerf._allMeasurements;
	    console.table(ReactDefaultPerf.getMeasurementsSummaryMap(measurements));
	    console.log(
	      'Total time:',
	      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
	    );
	  },

	  printDOM: function(measurements) {
	    measurements = measurements || ReactDefaultPerf._allMeasurements;
	    var summary = ReactDefaultPerfAnalysis.getDOMSummary(measurements);
	    console.table(summary.map(function(item) {
	      var result = {};
	      result[DOMProperty.ID_ATTRIBUTE_NAME] = item.id;
	      result['type'] = item.type;
	      result['args'] = JSON.stringify(item.args);
	      return result;
	    }));
	    console.log(
	      'Total time:',
	      ReactDefaultPerfAnalysis.getTotalTime(measurements).toFixed(2) + ' ms'
	    );
	  },

	  _recordWrite: function(id, fnName, totalTime, args) {
	    // TODO: totalTime isn't that useful since it doesn't count paints/reflows
	    var writes =
	      ReactDefaultPerf
	        ._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1]
	        .writes;
	    writes[id] = writes[id] || [];
	    writes[id].push({
	      type: fnName,
	      time: totalTime,
	      args: args
	    });
	  },

	  measure: function(moduleName, fnName, func) {
	    return function() {for (var args=[],$__0=0,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
	      var totalTime;
	      var rv;
	      var start;

	      if (fnName === '_renderNewRootComponent' ||
	          fnName === 'flushBatchedUpdates') {
	        // A "measurement" is a set of metrics recorded for each flush. We want
	        // to group the metrics for a given flush together so we can look at the
	        // components that rendered and the DOM operations that actually
	        // happened to determine the amount of "wasted work" performed.
	        ReactDefaultPerf._allMeasurements.push({
	          exclusive: {},
	          inclusive: {},
	          render: {},
	          counts: {},
	          writes: {},
	          displayNames: {},
	          totalTime: 0
	        });
	        start = performanceNow();
	        rv = func.apply(this, args);
	        ReactDefaultPerf._allMeasurements[
	          ReactDefaultPerf._allMeasurements.length - 1
	        ].totalTime = performanceNow() - start;
	        return rv;
	      } else if (fnName === '_mountImageIntoNode' ||
	          moduleName === 'ReactDOMIDOperations') {
	        start = performanceNow();
	        rv = func.apply(this, args);
	        totalTime = performanceNow() - start;

	        if (fnName === '_mountImageIntoNode') {
	          var mountID = ReactMount.getID(args[1]);
	          ReactDefaultPerf._recordWrite(mountID, fnName, totalTime, args[0]);
	        } else if (fnName === 'dangerouslyProcessChildrenUpdates') {
	          // special format
	          args[0].forEach(function(update) {
	            var writeArgs = {};
	            if (update.fromIndex !== null) {
	              writeArgs.fromIndex = update.fromIndex;
	            }
	            if (update.toIndex !== null) {
	              writeArgs.toIndex = update.toIndex;
	            }
	            if (update.textContent !== null) {
	              writeArgs.textContent = update.textContent;
	            }
	            if (update.markupIndex !== null) {
	              writeArgs.markup = args[1][update.markupIndex];
	            }
	            ReactDefaultPerf._recordWrite(
	              update.parentID,
	              update.type,
	              totalTime,
	              writeArgs
	            );
	          });
	        } else {
	          // basic format
	          ReactDefaultPerf._recordWrite(
	            args[0],
	            fnName,
	            totalTime,
	            Array.prototype.slice.call(args, 1)
	          );
	        }
	        return rv;
	      } else if (moduleName === 'ReactCompositeComponent' && (
	        (// TODO: receiveComponent()?
	        (fnName === 'mountComponent' ||
	        fnName === 'updateComponent' || fnName === '_renderValidatedComponent')))) {

	        if (typeof this._currentElement.type === 'string') {
	          return func.apply(this, args);
	        }

	        var rootNodeID = fnName === 'mountComponent' ?
	          args[0] :
	          this._rootNodeID;
	        var isRender = fnName === '_renderValidatedComponent';
	        var isMount = fnName === 'mountComponent';

	        var mountStack = ReactDefaultPerf._mountStack;
	        var entry = ReactDefaultPerf._allMeasurements[
	          ReactDefaultPerf._allMeasurements.length - 1
	        ];

	        if (isRender) {
	          addValue(entry.counts, rootNodeID, 1);
	        } else if (isMount) {
	          mountStack.push(0);
	        }

	        start = performanceNow();
	        rv = func.apply(this, args);
	        totalTime = performanceNow() - start;

	        if (isRender) {
	          addValue(entry.render, rootNodeID, totalTime);
	        } else if (isMount) {
	          var subMountTime = mountStack.pop();
	          mountStack[mountStack.length - 1] += totalTime;
	          addValue(entry.exclusive, rootNodeID, totalTime - subMountTime);
	          addValue(entry.inclusive, rootNodeID, totalTime);
	        } else {
	          addValue(entry.inclusive, rootNodeID, totalTime);
	        }

	        entry.displayNames[rootNodeID] = {
	          current: this.getName(),
	          owner: this._currentElement._owner ?
	            this._currentElement._owner.getName() :
	            '<root>'
	        };

	        return rv;
	      } else {
	        return func.apply(this, args);
	      }
	    };
	  }
	};

	module.exports = ReactDefaultPerf;

	},{"10":10,"146":146,"56":56,"70":70,"75":75}],56:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactDefaultPerfAnalysis
	 */

	var assign = _dereq_(27);

	// Don't try to save users less than 1.2ms (a number I made up)
	var DONT_CARE_THRESHOLD = 1.2;
	var DOM_OPERATION_TYPES = {
	  '_mountImageIntoNode': 'set innerHTML',
	  INSERT_MARKUP: 'set innerHTML',
	  MOVE_EXISTING: 'move',
	  REMOVE_NODE: 'remove',
	  TEXT_CONTENT: 'set textContent',
	  'updatePropertyByID': 'update attribute',
	  'deletePropertyByID': 'delete attribute',
	  'updateStylesByID': 'update styles',
	  'updateInnerHTMLByID': 'set innerHTML',
	  'dangerouslyReplaceNodeWithMarkupByID': 'replace'
	};

	function getTotalTime(measurements) {
	  // TODO: return number of DOM ops? could be misleading.
	  // TODO: measure dropped frames after reconcile?
	  // TODO: log total time of each reconcile and the top-level component
	  // class that triggered it.
	  var totalTime = 0;
	  for (var i = 0; i < measurements.length; i++) {
	    var measurement = measurements[i];
	    totalTime += measurement.totalTime;
	  }
	  return totalTime;
	}

	function getDOMSummary(measurements) {
	  var items = [];
	  for (var i = 0; i < measurements.length; i++) {
	    var measurement = measurements[i];
	    var id;

	    for (id in measurement.writes) {
	      measurement.writes[id].forEach(function(write) {
	        items.push({
	          id: id,
	          type: DOM_OPERATION_TYPES[write.type] || write.type,
	          args: write.args
	        });
	      });
	    }
	  }
	  return items;
	}

	function getExclusiveSummary(measurements) {
	  var candidates = {};
	  var displayName;

	  for (var i = 0; i < measurements.length; i++) {
	    var measurement = measurements[i];
	    var allIDs = assign(
	      {},
	      measurement.exclusive,
	      measurement.inclusive
	    );

	    for (var id in allIDs) {
	      displayName = measurement.displayNames[id].current;

	      candidates[displayName] = candidates[displayName] || {
	        componentName: displayName,
	        inclusive: 0,
	        exclusive: 0,
	        render: 0,
	        count: 0
	      };
	      if (measurement.render[id]) {
	        candidates[displayName].render += measurement.render[id];
	      }
	      if (measurement.exclusive[id]) {
	        candidates[displayName].exclusive += measurement.exclusive[id];
	      }
	      if (measurement.inclusive[id]) {
	        candidates[displayName].inclusive += measurement.inclusive[id];
	      }
	      if (measurement.counts[id]) {
	        candidates[displayName].count += measurement.counts[id];
	      }
	    }
	  }

	  // Now make a sorted array with the results.
	  var arr = [];
	  for (displayName in candidates) {
	    if (candidates[displayName].exclusive >= DONT_CARE_THRESHOLD) {
	      arr.push(candidates[displayName]);
	    }
	  }

	  arr.sort(function(a, b) {
	    return b.exclusive - a.exclusive;
	  });

	  return arr;
	}

	function getInclusiveSummary(measurements, onlyClean) {
	  var candidates = {};
	  var inclusiveKey;

	  for (var i = 0; i < measurements.length; i++) {
	    var measurement = measurements[i];
	    var allIDs = assign(
	      {},
	      measurement.exclusive,
	      measurement.inclusive
	    );
	    var cleanComponents;

	    if (onlyClean) {
	      cleanComponents = getUnchangedComponents(measurement);
	    }

	    for (var id in allIDs) {
	      if (onlyClean && !cleanComponents[id]) {
	        continue;
	      }

	      var displayName = measurement.displayNames[id];

	      // Inclusive time is not useful for many components without knowing where
	      // they are instantiated. So we aggregate inclusive time with both the
	      // owner and current displayName as the key.
	      inclusiveKey = displayName.owner + ' > ' + displayName.current;

	      candidates[inclusiveKey] = candidates[inclusiveKey] || {
	        componentName: inclusiveKey,
	        time: 0,
	        count: 0
	      };

	      if (measurement.inclusive[id]) {
	        candidates[inclusiveKey].time += measurement.inclusive[id];
	      }
	      if (measurement.counts[id]) {
	        candidates[inclusiveKey].count += measurement.counts[id];
	      }
	    }
	  }

	  // Now make a sorted array with the results.
	  var arr = [];
	  for (inclusiveKey in candidates) {
	    if (candidates[inclusiveKey].time >= DONT_CARE_THRESHOLD) {
	      arr.push(candidates[inclusiveKey]);
	    }
	  }

	  arr.sort(function(a, b) {
	    return b.time - a.time;
	  });

	  return arr;
	}

	function getUnchangedComponents(measurement) {
	  // For a given reconcile, look at which components did not actually
	  // render anything to the DOM and return a mapping of their ID to
	  // the amount of time it took to render the entire subtree.
	  var cleanComponents = {};
	  var dirtyLeafIDs = Object.keys(measurement.writes);
	  var allIDs = assign({}, measurement.exclusive, measurement.inclusive);

	  for (var id in allIDs) {
	    var isDirty = false;
	    // For each component that rendered, see if a component that triggered
	    // a DOM op is in its subtree.
	    for (var i = 0; i < dirtyLeafIDs.length; i++) {
	      if (dirtyLeafIDs[i].indexOf(id) === 0) {
	        isDirty = true;
	        break;
	      }
	    }
	    if (!isDirty && measurement.counts[id] > 0) {
	      cleanComponents[id] = true;
	    }
	  }
	  return cleanComponents;
	}

	var ReactDefaultPerfAnalysis = {
	  getExclusiveSummary: getExclusiveSummary,
	  getInclusiveSummary: getInclusiveSummary,
	  getDOMSummary: getDOMSummary,
	  getTotalTime: getTotalTime
	};

	module.exports = ReactDefaultPerfAnalysis;

	},{"27":27}],57:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactElement
	 */

	'use strict';

	var ReactContext = _dereq_(38);
	var ReactCurrentOwner = _dereq_(39);

	var assign = _dereq_(27);
	var warning = _dereq_(154);

	var RESERVED_PROPS = {
	  key: true,
	  ref: true
	};

	/**
	 * Warn for mutations.
	 *
	 * @internal
	 * @param {object} object
	 * @param {string} key
	 */
	function defineWarningProperty(object, key) {
	  Object.defineProperty(object, key, {

	    configurable: false,
	    enumerable: true,

	    get: function() {
	      if (!this._store) {
	        return null;
	      }
	      return this._store[key];
	    },

	    set: function(value) {
	      (true ? warning(
	        false,
	        'Don\'t set the %s property of the React element. Instead, ' +
	        'specify the correct value when initially creating the element.',
	        key
	      ) : null);
	      this._store[key] = value;
	    }

	  });
	}

	/**
	 * This is updated to true if the membrane is successfully created.
	 */
	var useMutationMembrane = false;

	/**
	 * Warn for mutations.
	 *
	 * @internal
	 * @param {object} element
	 */
	function defineMutationMembrane(prototype) {
	  try {
	    var pseudoFrozenProperties = {
	      props: true
	    };
	    for (var key in pseudoFrozenProperties) {
	      defineWarningProperty(prototype, key);
	    }
	    useMutationMembrane = true;
	  } catch (x) {
	    // IE will fail on defineProperty
	  }
	}

	/**
	 * Base constructor for all React elements. This is only used to make this
	 * work with a dynamic instanceof check. Nothing should live on this prototype.
	 *
	 * @param {*} type
	 * @param {string|object} ref
	 * @param {*} key
	 * @param {*} props
	 * @internal
	 */
	var ReactElement = function(type, key, ref, owner, context, props) {
	  // Built-in properties that belong on the element
	  this.type = type;
	  this.key = key;
	  this.ref = ref;

	  // Record the component responsible for creating this element.
	  this._owner = owner;

	  // TODO: Deprecate withContext, and then the context becomes accessible
	  // through the owner.
	  this._context = context;

	  if (true) {
	    // The validation flag and props are currently mutative. We put them on
	    // an external backing store so that we can freeze the whole object.
	    // This can be replaced with a WeakMap once they are implemented in
	    // commonly used development environments.
	    this._store = {props: props, originalProps: assign({}, props)};

	    // To make comparing ReactElements easier for testing purposes, we make
	    // the validation flag non-enumerable (where possible, which should
	    // include every environment we run tests in), so the test framework
	    // ignores it.
	    try {
	      Object.defineProperty(this._store, 'validated', {
	        configurable: false,
	        enumerable: false,
	        writable: true
	      });
	    } catch (x) {
	    }
	    this._store.validated = false;

	    // We're not allowed to set props directly on the object so we early
	    // return and rely on the prototype membrane to forward to the backing
	    // store.
	    if (useMutationMembrane) {
	      Object.freeze(this);
	      return;
	    }
	  }

	  this.props = props;
	};

	// We intentionally don't expose the function on the constructor property.
	// ReactElement should be indistinguishable from a plain object.
	ReactElement.prototype = {
	  _isReactElement: true
	};

	if (true) {
	  defineMutationMembrane(ReactElement.prototype);
	}

	ReactElement.createElement = function(type, config, children) {
	  var propName;

	  // Reserved names are extracted
	  var props = {};

	  var key = null;
	  var ref = null;

	  if (config != null) {
	    ref = config.ref === undefined ? null : config.ref;
	    key = config.key === undefined ? null : '' + config.key;
	    // Remaining properties are added to a new props object
	    for (propName in config) {
	      if (config.hasOwnProperty(propName) &&
	          !RESERVED_PROPS.hasOwnProperty(propName)) {
	        props[propName] = config[propName];
	      }
	    }
	  }

	  // Children can be more than one argument, and those are transferred onto
	  // the newly allocated props object.
	  var childrenLength = arguments.length - 2;
	  if (childrenLength === 1) {
	    props.children = children;
	  } else if (childrenLength > 1) {
	    var childArray = Array(childrenLength);
	    for (var i = 0; i < childrenLength; i++) {
	      childArray[i] = arguments[i + 2];
	    }
	    props.children = childArray;
	  }

	  // Resolve default props
	  if (type && type.defaultProps) {
	    var defaultProps = type.defaultProps;
	    for (propName in defaultProps) {
	      if (typeof props[propName] === 'undefined') {
	        props[propName] = defaultProps[propName];
	      }
	    }
	  }

	  return new ReactElement(
	    type,
	    key,
	    ref,
	    ReactCurrentOwner.current,
	    ReactContext.current,
	    props
	  );
	};

	ReactElement.createFactory = function(type) {
	  var factory = ReactElement.createElement.bind(null, type);
	  // Expose the type on the factory and the prototype so that it can be
	  // easily accessed on elements. E.g. <Foo />.type === Foo.type.
	  // This should not be named `constructor` since this may not be the function
	  // that created the element, and it may not even be a constructor.
	  // Legacy hook TODO: Warn if this is accessed
	  factory.type = type;
	  return factory;
	};

	ReactElement.cloneAndReplaceProps = function(oldElement, newProps) {
	  var newElement = new ReactElement(
	    oldElement.type,
	    oldElement.key,
	    oldElement.ref,
	    oldElement._owner,
	    oldElement._context,
	    newProps
	  );

	  if (true) {
	    // If the key on the original is valid, then the clone is valid
	    newElement._store.validated = oldElement._store.validated;
	  }
	  return newElement;
	};

	ReactElement.cloneElement = function(element, config, children) {
	  var propName;

	  // Original props are copied
	  var props = assign({}, element.props);

	  // Reserved names are extracted
	  var key = element.key;
	  var ref = element.ref;

	  // Owner will be preserved, unless ref is overridden
	  var owner = element._owner;

	  if (config != null) {
	    if (config.ref !== undefined) {
	      // Silently steal the ref from the parent.
	      ref = config.ref;
	      owner = ReactCurrentOwner.current;
	    }
	    if (config.key !== undefined) {
	      key = '' + config.key;
	    }
	    // Remaining properties override existing props
	    for (propName in config) {
	      if (config.hasOwnProperty(propName) &&
	          !RESERVED_PROPS.hasOwnProperty(propName)) {
	        props[propName] = config[propName];
	      }
	    }
	  }

	  // Children can be more than one argument, and those are transferred onto
	  // the newly allocated props object.
	  var childrenLength = arguments.length - 2;
	  if (childrenLength === 1) {
	    props.children = children;
	  } else if (childrenLength > 1) {
	    var childArray = Array(childrenLength);
	    for (var i = 0; i < childrenLength; i++) {
	      childArray[i] = arguments[i + 2];
	    }
	    props.children = childArray;
	  }

	  return new ReactElement(
	    element.type,
	    key,
	    ref,
	    owner,
	    element._context,
	    props
	  );
	};

	/**
	 * @param {?object} object
	 * @return {boolean} True if `object` is a valid component.
	 * @final
	 */
	ReactElement.isValidElement = function(object) {
	  // ReactTestUtils is often used outside of beforeEach where as React is
	  // within it. This leads to two different instances of React on the same
	  // page. To identify a element from a different React instance we use
	  // a flag instead of an instanceof check.
	  var isElement = !!(object && object._isReactElement);
	  // if (isElement && !(object instanceof ReactElement)) {
	  // This is an indicator that you're using multiple versions of React at the
	  // same time. This will screw with ownership and stuff. Fix it, please.
	  // TODO: We could possibly warn here.
	  // }
	  return isElement;
	};

	module.exports = ReactElement;

	},{"154":154,"27":27,"38":38,"39":39}],58:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactElementValidator
	 */

	/**
	 * ReactElementValidator provides a wrapper around a element factory
	 * which validates the props passed to the element. This is intended to be
	 * used only in DEV and could be replaced by a static type checker for languages
	 * that support it.
	 */

	'use strict';

	var ReactElement = _dereq_(57);
	var ReactFragment = _dereq_(63);
	var ReactPropTypeLocations = _dereq_(77);
	var ReactPropTypeLocationNames = _dereq_(76);
	var ReactCurrentOwner = _dereq_(39);
	var ReactNativeComponent = _dereq_(73);

	var getIteratorFn = _dereq_(126);
	var invariant = _dereq_(135);
	var warning = _dereq_(154);

	function getDeclarationErrorAddendum() {
	  if (ReactCurrentOwner.current) {
	    var name = ReactCurrentOwner.current.getName();
	    if (name) {
	      return ' Check the render method of `' + name + '`.';
	    }
	  }
	  return '';
	}

	/**
	 * Warn if there's no key explicitly set on dynamic arrays of children or
	 * object keys are not valid. This allows us to keep track of children between
	 * updates.
	 */
	var ownerHasKeyUseWarning = {};

	var loggedTypeFailures = {};

	var NUMERIC_PROPERTY_REGEX = /^\d+$/;

	/**
	 * Gets the instance's name for use in warnings.
	 *
	 * @internal
	 * @return {?string} Display name or undefined
	 */
	function getName(instance) {
	  var publicInstance = instance && instance.getPublicInstance();
	  if (!publicInstance) {
	    return undefined;
	  }
	  var constructor = publicInstance.constructor;
	  if (!constructor) {
	    return undefined;
	  }
	  return constructor.displayName || constructor.name || undefined;
	}

	/**
	 * Gets the current owner's displayName for use in warnings.
	 *
	 * @internal
	 * @return {?string} Display name or undefined
	 */
	function getCurrentOwnerDisplayName() {
	  var current = ReactCurrentOwner.current;
	  return (
	    current && getName(current) || undefined
	  );
	}

	/**
	 * Warn if the element doesn't have an explicit key assigned to it.
	 * This element is in an array. The array could grow and shrink or be
	 * reordered. All children that haven't already been validated are required to
	 * have a "key" property assigned to it.
	 *
	 * @internal
	 * @param {ReactElement} element Element that requires a key.
	 * @param {*} parentType element's parent's type.
	 */
	function validateExplicitKey(element, parentType) {
	  if (element._store.validated || element.key != null) {
	    return;
	  }
	  element._store.validated = true;

	  warnAndMonitorForKeyUse(
	    'Each child in an array or iterator should have a unique "key" prop.',
	    element,
	    parentType
	  );
	}

	/**
	 * Warn if the key is being defined as an object property but has an incorrect
	 * value.
	 *
	 * @internal
	 * @param {string} name Property name of the key.
	 * @param {ReactElement} element Component that requires a key.
	 * @param {*} parentType element's parent's type.
	 */
	function validatePropertyKey(name, element, parentType) {
	  if (!NUMERIC_PROPERTY_REGEX.test(name)) {
	    return;
	  }
	  warnAndMonitorForKeyUse(
	    'Child objects should have non-numeric keys so ordering is preserved.',
	    element,
	    parentType
	  );
	}

	/**
	 * Shared warning and monitoring code for the key warnings.
	 *
	 * @internal
	 * @param {string} message The base warning that gets output.
	 * @param {ReactElement} element Component that requires a key.
	 * @param {*} parentType element's parent's type.
	 */
	function warnAndMonitorForKeyUse(message, element, parentType) {
	  var ownerName = getCurrentOwnerDisplayName();
	  var parentName = typeof parentType === 'string' ?
	    parentType : parentType.displayName || parentType.name;

	  var useName = ownerName || parentName;
	  var memoizer = ownerHasKeyUseWarning[message] || (
	    (ownerHasKeyUseWarning[message] = {})
	  );
	  if (memoizer.hasOwnProperty(useName)) {
	    return;
	  }
	  memoizer[useName] = true;

	  var parentOrOwnerAddendum =
	    ownerName ? (" Check the render method of " + ownerName + ".") :
	    parentName ? (" Check the React.render call using <" + parentName + ">.") :
	    '';

	  // Usually the current owner is the offender, but if it accepts children as a
	  // property, it may be the creator of the child that's responsible for
	  // assigning it a key.
	  var childOwnerAddendum = '';
	  if (element &&
	      element._owner &&
	      element._owner !== ReactCurrentOwner.current) {
	    // Name of the component that originally created this child.
	    var childOwnerName = getName(element._owner);

	    childOwnerAddendum = (" It was passed a child from " + childOwnerName + ".");
	  }

	  (true ? warning(
	    false,
	    message + '%s%s See https://fb.me/react-warning-keys for more information.',
	    parentOrOwnerAddendum,
	    childOwnerAddendum
	  ) : null);
	}

	/**
	 * Ensure that every element either is passed in a static location, in an
	 * array with an explicit keys property defined, or in an object literal
	 * with valid key property.
	 *
	 * @internal
	 * @param {ReactNode} node Statically passed child of any type.
	 * @param {*} parentType node's parent's type.
	 */
	function validateChildKeys(node, parentType) {
	  if (Array.isArray(node)) {
	    for (var i = 0; i < node.length; i++) {
	      var child = node[i];
	      if (ReactElement.isValidElement(child)) {
	        validateExplicitKey(child, parentType);
	      }
	    }
	  } else if (ReactElement.isValidElement(node)) {
	    // This element was passed in a valid location.
	    node._store.validated = true;
	  } else if (node) {
	    var iteratorFn = getIteratorFn(node);
	    // Entry iterators provide implicit keys.
	    if (iteratorFn) {
	      if (iteratorFn !== node.entries) {
	        var iterator = iteratorFn.call(node);
	        var step;
	        while (!(step = iterator.next()).done) {
	          if (ReactElement.isValidElement(step.value)) {
	            validateExplicitKey(step.value, parentType);
	          }
	        }
	      }
	    } else if (typeof node === 'object') {
	      var fragment = ReactFragment.extractIfFragment(node);
	      for (var key in fragment) {
	        if (fragment.hasOwnProperty(key)) {
	          validatePropertyKey(key, fragment[key], parentType);
	        }
	      }
	    }
	  }
	}

	/**
	 * Assert that the props are valid
	 *
	 * @param {string} componentName Name of the component for error messages.
	 * @param {object} propTypes Map of prop name to a ReactPropType
	 * @param {object} props
	 * @param {string} location e.g. "prop", "context", "child context"
	 * @private
	 */
	function checkPropTypes(componentName, propTypes, props, location) {
	  for (var propName in propTypes) {
	    if (propTypes.hasOwnProperty(propName)) {
	      var error;
	      // Prop type validation may throw. In case they do, we don't want to
	      // fail the render phase where it didn't fail before. So we log it.
	      // After these have been cleaned up, we'll let them throw.
	      try {
	        // This is intentionally an invariant that gets caught. It's the same
	        // behavior as without this statement except with a better message.
	        (true ? invariant(
	          typeof propTypes[propName] === 'function',
	          '%s: %s type `%s` is invalid; it must be a function, usually from ' +
	          'React.PropTypes.',
	          componentName || 'React class',
	          ReactPropTypeLocationNames[location],
	          propName
	        ) : invariant(typeof propTypes[propName] === 'function'));
	        error = propTypes[propName](props, propName, componentName, location);
	      } catch (ex) {
	        error = ex;
	      }
	      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
	        // Only monitor this failure once because there tends to be a lot of the
	        // same error.
	        loggedTypeFailures[error.message] = true;

	        var addendum = getDeclarationErrorAddendum(this);
	        (true ? warning(false, 'Failed propType: %s%s', error.message, addendum) : null);
	      }
	    }
	  }
	}

	var warnedPropsMutations = {};

	/**
	 * Warn about mutating props when setting `propName` on `element`.
	 *
	 * @param {string} propName The string key within props that was set
	 * @param {ReactElement} element
	 */
	function warnForPropsMutation(propName, element) {
	  var type = element.type;
	  var elementName = typeof type === 'string' ? type : type.displayName;
	  var ownerName = element._owner ?
	    element._owner.getPublicInstance().constructor.displayName : null;

	  var warningKey = propName + '|' + elementName + '|' + ownerName;
	  if (warnedPropsMutations.hasOwnProperty(warningKey)) {
	    return;
	  }
	  warnedPropsMutations[warningKey] = true;

	  var elementInfo = '';
	  if (elementName) {
	    elementInfo = ' <' + elementName + ' />';
	  }
	  var ownerInfo = '';
	  if (ownerName) {
	    ownerInfo = ' The element was created by ' + ownerName + '.';
	  }

	  (true ? warning(
	    false,
	    'Don\'t set .props.%s of the React component%s. Instead, specify the ' +
	    'correct value when initially creating the element or use ' +
	    'React.cloneElement to make a new element with updated props.%s',
	    propName,
	    elementInfo,
	    ownerInfo
	  ) : null);
	}

	// Inline Object.is polyfill
	function is(a, b) {
	  if (a !== a) {
	    // NaN
	    return b !== b;
	  }
	  if (a === 0 && b === 0) {
	    // +-0
	    return 1 / a === 1 / b;
	  }
	  return a === b;
	}

	/**
	 * Given an element, check if its props have been mutated since element
	 * creation (or the last call to this function). In particular, check if any
	 * new props have been added, which we can't directly catch by defining warning
	 * properties on the props object.
	 *
	 * @param {ReactElement} element
	 */
	function checkAndWarnForMutatedProps(element) {
	  if (!element._store) {
	    // Element was created using `new ReactElement` directly or with
	    // `ReactElement.createElement`; skip mutation checking
	    return;
	  }

	  var originalProps = element._store.originalProps;
	  var props = element.props;

	  for (var propName in props) {
	    if (props.hasOwnProperty(propName)) {
	      if (!originalProps.hasOwnProperty(propName) ||
	          !is(originalProps[propName], props[propName])) {
	        warnForPropsMutation(propName, element);

	        // Copy over the new value so that the two props objects match again
	        originalProps[propName] = props[propName];
	      }
	    }
	  }
	}

	/**
	 * Given an element, validate that its props follow the propTypes definition,
	 * provided by the type.
	 *
	 * @param {ReactElement} element
	 */
	function validatePropTypes(element) {
	  if (element.type == null) {
	    // This has already warned. Don't throw.
	    return;
	  }
	  // Extract the component class from the element. Converts string types
	  // to a composite class which may have propTypes.
	  // TODO: Validating a string's propTypes is not decoupled from the
	  // rendering target which is problematic.
	  var componentClass = ReactNativeComponent.getComponentClassForElement(
	    element
	  );
	  var name = componentClass.displayName || componentClass.name;
	  if (componentClass.propTypes) {
	    checkPropTypes(
	      name,
	      componentClass.propTypes,
	      element.props,
	      ReactPropTypeLocations.prop
	    );
	  }
	  if (typeof componentClass.getDefaultProps === 'function') {
	    (true ? warning(
	      componentClass.getDefaultProps.isReactClassApproved,
	      'getDefaultProps is only used on classic React.createClass ' +
	      'definitions. Use a static property named `defaultProps` instead.'
	    ) : null);
	  }
	}

	var ReactElementValidator = {

	  checkAndWarnForMutatedProps: checkAndWarnForMutatedProps,

	  createElement: function(type, props, children) {
	    // We warn in this case but don't throw. We expect the element creation to
	    // succeed and there will likely be errors in render.
	    (true ? warning(
	      type != null,
	      'React.createElement: type should not be null or undefined. It should ' +
	        'be a string (for DOM elements) or a ReactClass (for composite ' +
	        'components).'
	    ) : null);

	    var element = ReactElement.createElement.apply(this, arguments);

	    // The result can be nullish if a mock or a custom function is used.
	    // TODO: Drop this when these are no longer allowed as the type argument.
	    if (element == null) {
	      return element;
	    }

	    for (var i = 2; i < arguments.length; i++) {
	      validateChildKeys(arguments[i], type);
	    }

	    validatePropTypes(element);

	    return element;
	  },

	  createFactory: function(type) {
	    var validatedFactory = ReactElementValidator.createElement.bind(
	      null,
	      type
	    );
	    // Legacy hook TODO: Warn if this is accessed
	    validatedFactory.type = type;

	    if (true) {
	      try {
	        Object.defineProperty(
	          validatedFactory,
	          'type',
	          {
	            enumerable: false,
	            get: function() {
	              (true ? warning(
	                false,
	                'Factory.type is deprecated. Access the class directly ' +
	                'before passing it to createFactory.'
	              ) : null);
	              Object.defineProperty(this, 'type', {
	                value: type
	              });
	              return type;
	            }
	          }
	        );
	      } catch (x) {
	        // IE will fail on defineProperty (es5-shim/sham too)
	      }
	    }


	    return validatedFactory;
	  },

	  cloneElement: function(element, props, children) {
	    var newElement = ReactElement.cloneElement.apply(this, arguments);
	    for (var i = 2; i < arguments.length; i++) {
	      validateChildKeys(arguments[i], newElement.type);
	    }
	    validatePropTypes(newElement);
	    return newElement;
	  }

	};

	module.exports = ReactElementValidator;

	},{"126":126,"135":135,"154":154,"39":39,"57":57,"63":63,"73":73,"76":76,"77":77}],59:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactEmptyComponent
	 */

	'use strict';

	var ReactElement = _dereq_(57);
	var ReactInstanceMap = _dereq_(67);

	var invariant = _dereq_(135);

	var component;
	// This registry keeps track of the React IDs of the components that rendered to
	// `null` (in reality a placeholder such as `noscript`)
	var nullComponentIDsRegistry = {};

	var ReactEmptyComponentInjection = {
	  injectEmptyComponent: function(emptyComponent) {
	    component = ReactElement.createFactory(emptyComponent);
	  }
	};

	var ReactEmptyComponentType = function() {};
	ReactEmptyComponentType.prototype.componentDidMount = function() {
	  var internalInstance = ReactInstanceMap.get(this);
	  // TODO: Make sure we run these methods in the correct order, we shouldn't
	  // need this check. We're going to assume if we're here it means we ran
	  // componentWillUnmount already so there is no internal instance (it gets
	  // removed as part of the unmounting process).
	  if (!internalInstance) {
	    return;
	  }
	  registerNullComponentID(internalInstance._rootNodeID);
	};
	ReactEmptyComponentType.prototype.componentWillUnmount = function() {
	  var internalInstance = ReactInstanceMap.get(this);
	  // TODO: Get rid of this check. See TODO in componentDidMount.
	  if (!internalInstance) {
	    return;
	  }
	  deregisterNullComponentID(internalInstance._rootNodeID);
	};
	ReactEmptyComponentType.prototype.render = function() {
	  (true ? invariant(
	    component,
	    'Trying to return null from a render, but no null placeholder component ' +
	    'was injected.'
	  ) : invariant(component));
	  return component();
	};

	var emptyElement = ReactElement.createElement(ReactEmptyComponentType);

	/**
	 * Mark the component as having rendered to null.
	 * @param {string} id Component's `_rootNodeID`.
	 */
	function registerNullComponentID(id) {
	  nullComponentIDsRegistry[id] = true;
	}

	/**
	 * Unmark the component as having rendered to null: it renders to something now.
	 * @param {string} id Component's `_rootNodeID`.
	 */
	function deregisterNullComponentID(id) {
	  delete nullComponentIDsRegistry[id];
	}

	/**
	 * @param {string} id Component's `_rootNodeID`.
	 * @return {boolean} True if the component is rendered to null.
	 */
	function isNullComponentID(id) {
	  return !!nullComponentIDsRegistry[id];
	}

	var ReactEmptyComponent = {
	  emptyElement: emptyElement,
	  injection: ReactEmptyComponentInjection,
	  isNullComponentID: isNullComponentID
	};

	module.exports = ReactEmptyComponent;

	},{"135":135,"57":57,"67":67}],60:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactErrorUtils
	 * @typechecks
	 */

	"use strict";

	var ReactErrorUtils = {
	  /**
	   * Creates a guarded version of a function. This is supposed to make debugging
	   * of event handlers easier. To aid debugging with the browser's debugger,
	   * this currently simply returns the original function.
	   *
	   * @param {function} func Function to be executed
	   * @param {string} name The name of the guard
	   * @return {function}
	   */
	  guard: function(func, name) {
	    return func;
	  }
	};

	module.exports = ReactErrorUtils;

	},{}],61:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactEventEmitterMixin
	 */

	'use strict';

	var EventPluginHub = _dereq_(17);

	function runEventQueueInBatch(events) {
	  EventPluginHub.enqueueEvents(events);
	  EventPluginHub.processEventQueue();
	}

	var ReactEventEmitterMixin = {

	  /**
	   * Streams a fired top-level event to `EventPluginHub` where plugins have the
	   * opportunity to create `ReactEvent`s to be dispatched.
	   *
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {object} topLevelTarget The listening component root node.
	   * @param {string} topLevelTargetID ID of `topLevelTarget`.
	   * @param {object} nativeEvent Native environment event.
	   */
	  handleTopLevel: function(
	      topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      nativeEvent) {
	    var events = EventPluginHub.extractEvents(
	      topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      nativeEvent
	    );

	    runEventQueueInBatch(events);
	  }
	};

	module.exports = ReactEventEmitterMixin;

	},{"17":17}],62:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactEventListener
	 * @typechecks static-only
	 */

	'use strict';

	var EventListener = _dereq_(16);
	var ExecutionEnvironment = _dereq_(21);
	var PooledClass = _dereq_(28);
	var ReactInstanceHandles = _dereq_(66);
	var ReactMount = _dereq_(70);
	var ReactUpdates = _dereq_(87);

	var assign = _dereq_(27);
	var getEventTarget = _dereq_(125);
	var getUnboundedScrollPosition = _dereq_(131);

	/**
	 * Finds the parent React component of `node`.
	 *
	 * @param {*} node
	 * @return {?DOMEventTarget} Parent container, or `null` if the specified node
	 *                           is not nested.
	 */
	function findParent(node) {
	  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
	  // traversal, but caching is difficult to do correctly without using a
	  // mutation observer to listen for all DOM changes.
	  var nodeID = ReactMount.getID(node);
	  var rootID = ReactInstanceHandles.getReactRootIDFromNodeID(nodeID);
	  var container = ReactMount.findReactContainerForID(rootID);
	  var parent = ReactMount.getFirstReactDOM(container);
	  return parent;
	}

	// Used to store ancestor hierarchy in top level callback
	function TopLevelCallbackBookKeeping(topLevelType, nativeEvent) {
	  this.topLevelType = topLevelType;
	  this.nativeEvent = nativeEvent;
	  this.ancestors = [];
	}
	assign(TopLevelCallbackBookKeeping.prototype, {
	  destructor: function() {
	    this.topLevelType = null;
	    this.nativeEvent = null;
	    this.ancestors.length = 0;
	  }
	});
	PooledClass.addPoolingTo(
	  TopLevelCallbackBookKeeping,
	  PooledClass.twoArgumentPooler
	);

	function handleTopLevelImpl(bookKeeping) {
	  var topLevelTarget = ReactMount.getFirstReactDOM(
	    getEventTarget(bookKeeping.nativeEvent)
	  ) || window;

	  // Loop through the hierarchy, in case there's any nested components.
	  // It's important that we build the array of ancestors before calling any
	  // event handlers, because event handlers can modify the DOM, leading to
	  // inconsistencies with ReactMount's node cache. See #1105.
	  var ancestor = topLevelTarget;
	  while (ancestor) {
	    bookKeeping.ancestors.push(ancestor);
	    ancestor = findParent(ancestor);
	  }

	  for (var i = 0, l = bookKeeping.ancestors.length; i < l; i++) {
	    topLevelTarget = bookKeeping.ancestors[i];
	    var topLevelTargetID = ReactMount.getID(topLevelTarget) || '';
	    ReactEventListener._handleTopLevel(
	      bookKeeping.topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      bookKeeping.nativeEvent
	    );
	  }
	}

	function scrollValueMonitor(cb) {
	  var scrollPosition = getUnboundedScrollPosition(window);
	  cb(scrollPosition);
	}

	var ReactEventListener = {
	  _enabled: true,
	  _handleTopLevel: null,

	  WINDOW_HANDLE: ExecutionEnvironment.canUseDOM ? window : null,

	  setHandleTopLevel: function(handleTopLevel) {
	    ReactEventListener._handleTopLevel = handleTopLevel;
	  },

	  setEnabled: function(enabled) {
	    ReactEventListener._enabled = !!enabled;
	  },

	  isEnabled: function() {
	    return ReactEventListener._enabled;
	  },


	  /**
	   * Traps top-level events by using event bubbling.
	   *
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {string} handlerBaseName Event name (e.g. "click").
	   * @param {object} handle Element on which to attach listener.
	   * @return {object} An object with a remove function which will forcefully
	   *                  remove the listener.
	   * @internal
	   */
	  trapBubbledEvent: function(topLevelType, handlerBaseName, handle) {
	    var element = handle;
	    if (!element) {
	      return null;
	    }
	    return EventListener.listen(
	      element,
	      handlerBaseName,
	      ReactEventListener.dispatchEvent.bind(null, topLevelType)
	    );
	  },

	  /**
	   * Traps a top-level event by using event capturing.
	   *
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {string} handlerBaseName Event name (e.g. "click").
	   * @param {object} handle Element on which to attach listener.
	   * @return {object} An object with a remove function which will forcefully
	   *                  remove the listener.
	   * @internal
	   */
	  trapCapturedEvent: function(topLevelType, handlerBaseName, handle) {
	    var element = handle;
	    if (!element) {
	      return null;
	    }
	    return EventListener.capture(
	      element,
	      handlerBaseName,
	      ReactEventListener.dispatchEvent.bind(null, topLevelType)
	    );
	  },

	  monitorScrollValue: function(refresh) {
	    var callback = scrollValueMonitor.bind(null, refresh);
	    EventListener.listen(window, 'scroll', callback);
	  },

	  dispatchEvent: function(topLevelType, nativeEvent) {
	    if (!ReactEventListener._enabled) {
	      return;
	    }

	    var bookKeeping = TopLevelCallbackBookKeeping.getPooled(
	      topLevelType,
	      nativeEvent
	    );
	    try {
	      // Event queue being processed in the same cycle allows
	      // `preventDefault`.
	      ReactUpdates.batchedUpdates(handleTopLevelImpl, bookKeeping);
	    } finally {
	      TopLevelCallbackBookKeeping.release(bookKeeping);
	    }
	  }
	};

	module.exports = ReactEventListener;

	},{"125":125,"131":131,"16":16,"21":21,"27":27,"28":28,"66":66,"70":70,"87":87}],63:[function(_dereq_,module,exports){
	/**
	 * Copyright 2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	* @providesModule ReactFragment
	*/

	'use strict';

	var ReactElement = _dereq_(57);

	var warning = _dereq_(154);

	/**
	 * We used to allow keyed objects to serve as a collection of ReactElements,
	 * or nested sets. This allowed us a way to explicitly key a set a fragment of
	 * components. This is now being replaced with an opaque data structure.
	 * The upgrade path is to call React.addons.createFragment({ key: value }) to
	 * create a keyed fragment. The resulting data structure is opaque, for now.
	 */

	if (true) {
	  var fragmentKey = '_reactFragment';
	  var didWarnKey = '_reactDidWarn';
	  var canWarnForReactFragment = false;

	  try {
	    // Feature test. Don't even try to issue this warning if we can't use
	    // enumerable: false.

	    var dummy = function() {
	      return 1;
	    };

	    Object.defineProperty(
	      {},
	      fragmentKey,
	      {enumerable: false, value: true}
	    );

	    Object.defineProperty(
	      {},
	      'key',
	      {enumerable: true, get: dummy}
	    );

	    canWarnForReactFragment = true;
	  } catch (x) { }

	  var proxyPropertyAccessWithWarning = function(obj, key) {
	    Object.defineProperty(obj, key, {
	      enumerable: true,
	      get: function() {
	        (true ? warning(
	          this[didWarnKey],
	          'A ReactFragment is an opaque type. Accessing any of its ' +
	          'properties is deprecated. Pass it to one of the React.Children ' +
	          'helpers.'
	        ) : null);
	        this[didWarnKey] = true;
	        return this[fragmentKey][key];
	      },
	      set: function(value) {
	        (true ? warning(
	          this[didWarnKey],
	          'A ReactFragment is an immutable opaque type. Mutating its ' +
	          'properties is deprecated.'
	        ) : null);
	        this[didWarnKey] = true;
	        this[fragmentKey][key] = value;
	      }
	    });
	  };

	  var issuedWarnings = {};

	  var didWarnForFragment = function(fragment) {
	    // We use the keys and the type of the value as a heuristic to dedupe the
	    // warning to avoid spamming too much.
	    var fragmentCacheKey = '';
	    for (var key in fragment) {
	      fragmentCacheKey += key + ':' + (typeof fragment[key]) + ',';
	    }
	    var alreadyWarnedOnce = !!issuedWarnings[fragmentCacheKey];
	    issuedWarnings[fragmentCacheKey] = true;
	    return alreadyWarnedOnce;
	  };
	}

	var ReactFragment = {
	  // Wrap a keyed object in an opaque proxy that warns you if you access any
	  // of its properties.
	  create: function(object) {
	    if (true) {
	      if (typeof object !== 'object' || !object || Array.isArray(object)) {
	        (true ? warning(
	          false,
	          'React.addons.createFragment only accepts a single object.',
	          object
	        ) : null);
	        return object;
	      }
	      if (ReactElement.isValidElement(object)) {
	        (true ? warning(
	          false,
	          'React.addons.createFragment does not accept a ReactElement ' +
	          'without a wrapper object.'
	        ) : null);
	        return object;
	      }
	      if (canWarnForReactFragment) {
	        var proxy = {};
	        Object.defineProperty(proxy, fragmentKey, {
	          enumerable: false,
	          value: object
	        });
	        Object.defineProperty(proxy, didWarnKey, {
	          writable: true,
	          enumerable: false,
	          value: false
	        });
	        for (var key in object) {
	          proxyPropertyAccessWithWarning(proxy, key);
	        }
	        Object.preventExtensions(proxy);
	        return proxy;
	      }
	    }
	    return object;
	  },
	  // Extract the original keyed object from the fragment opaque type. Warn if
	  // a plain object is passed here.
	  extract: function(fragment) {
	    if (true) {
	      if (canWarnForReactFragment) {
	        if (!fragment[fragmentKey]) {
	          (true ? warning(
	            didWarnForFragment(fragment),
	            'Any use of a keyed object should be wrapped in ' +
	            'React.addons.createFragment(object) before being passed as a ' +
	            'child.'
	          ) : null);
	          return fragment;
	        }
	        return fragment[fragmentKey];
	      }
	    }
	    return fragment;
	  },
	  // Check if this is a fragment and if so, extract the keyed object. If it
	  // is a fragment-like object, warn that it should be wrapped. Ignore if we
	  // can't determine what kind of object this is.
	  extractIfFragment: function(fragment) {
	    if (true) {
	      if (canWarnForReactFragment) {
	        // If it is the opaque type, return the keyed object.
	        if (fragment[fragmentKey]) {
	          return fragment[fragmentKey];
	        }
	        // Otherwise, check each property if it has an element, if it does
	        // it is probably meant as a fragment, so we can warn early. Defer,
	        // the warning to extract.
	        for (var key in fragment) {
	          if (fragment.hasOwnProperty(key) &&
	              ReactElement.isValidElement(fragment[key])) {
	            // This looks like a fragment object, we should provide an
	            // early warning.
	            return ReactFragment.extract(fragment);
	          }
	        }
	      }
	    }
	    return fragment;
	  }
	};

	module.exports = ReactFragment;

	},{"154":154,"57":57}],64:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactInjection
	 */

	'use strict';

	var DOMProperty = _dereq_(10);
	var EventPluginHub = _dereq_(17);
	var ReactComponentEnvironment = _dereq_(36);
	var ReactClass = _dereq_(33);
	var ReactEmptyComponent = _dereq_(59);
	var ReactBrowserEventEmitter = _dereq_(30);
	var ReactNativeComponent = _dereq_(73);
	var ReactDOMComponent = _dereq_(42);
	var ReactPerf = _dereq_(75);
	var ReactRootIndex = _dereq_(83);
	var ReactUpdates = _dereq_(87);

	var ReactInjection = {
	  Component: ReactComponentEnvironment.injection,
	  Class: ReactClass.injection,
	  DOMComponent: ReactDOMComponent.injection,
	  DOMProperty: DOMProperty.injection,
	  EmptyComponent: ReactEmptyComponent.injection,
	  EventPluginHub: EventPluginHub.injection,
	  EventEmitter: ReactBrowserEventEmitter.injection,
	  NativeComponent: ReactNativeComponent.injection,
	  Perf: ReactPerf.injection,
	  RootIndex: ReactRootIndex.injection,
	  Updates: ReactUpdates.injection
	};

	module.exports = ReactInjection;

	},{"10":10,"17":17,"30":30,"33":33,"36":36,"42":42,"59":59,"73":73,"75":75,"83":83,"87":87}],65:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactInputSelection
	 */

	'use strict';

	var ReactDOMSelection = _dereq_(50);

	var containsNode = _dereq_(109);
	var focusNode = _dereq_(119);
	var getActiveElement = _dereq_(121);

	function isInDocument(node) {
	  return containsNode(document.documentElement, node);
	}

	/**
	 * @ReactInputSelection: React input selection module. Based on Selection.js,
	 * but modified to be suitable for react and has a couple of bug fixes (doesn't
	 * assume buttons have range selections allowed).
	 * Input selection module for React.
	 */
	var ReactInputSelection = {

	  hasSelectionCapabilities: function(elem) {
	    return elem && (
	      ((elem.nodeName === 'INPUT' && elem.type === 'text') ||
	      elem.nodeName === 'TEXTAREA' || elem.contentEditable === 'true')
	    );
	  },

	  getSelectionInformation: function() {
	    var focusedElem = getActiveElement();
	    return {
	      focusedElem: focusedElem,
	      selectionRange:
	          ReactInputSelection.hasSelectionCapabilities(focusedElem) ?
	          ReactInputSelection.getSelection(focusedElem) :
	          null
	    };
	  },

	  /**
	   * @restoreSelection: If any selection information was potentially lost,
	   * restore it. This is useful when performing operations that could remove dom
	   * nodes and place them back in, resulting in focus being lost.
	   */
	  restoreSelection: function(priorSelectionInformation) {
	    var curFocusedElem = getActiveElement();
	    var priorFocusedElem = priorSelectionInformation.focusedElem;
	    var priorSelectionRange = priorSelectionInformation.selectionRange;
	    if (curFocusedElem !== priorFocusedElem &&
	        isInDocument(priorFocusedElem)) {
	      if (ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)) {
	        ReactInputSelection.setSelection(
	          priorFocusedElem,
	          priorSelectionRange
	        );
	      }
	      focusNode(priorFocusedElem);
	    }
	  },

	  /**
	   * @getSelection: Gets the selection bounds of a focused textarea, input or
	   * contentEditable node.
	   * -@input: Look up selection bounds of this input
	   * -@return {start: selectionStart, end: selectionEnd}
	   */
	  getSelection: function(input) {
	    var selection;

	    if ('selectionStart' in input) {
	      // Modern browser with input or textarea.
	      selection = {
	        start: input.selectionStart,
	        end: input.selectionEnd
	      };
	    } else if (document.selection && input.nodeName === 'INPUT') {
	      // IE8 input.
	      var range = document.selection.createRange();
	      // There can only be one selection per document in IE, so it must
	      // be in our element.
	      if (range.parentElement() === input) {
	        selection = {
	          start: -range.moveStart('character', -input.value.length),
	          end: -range.moveEnd('character', -input.value.length)
	        };
	      }
	    } else {
	      // Content editable or old IE textarea.
	      selection = ReactDOMSelection.getOffsets(input);
	    }

	    return selection || {start: 0, end: 0};
	  },

	  /**
	   * @setSelection: Sets the selection bounds of a textarea or input and focuses
	   * the input.
	   * -@input     Set selection bounds of this input or textarea
	   * -@offsets   Object of same form that is returned from get*
	   */
	  setSelection: function(input, offsets) {
	    var start = offsets.start;
	    var end = offsets.end;
	    if (typeof end === 'undefined') {
	      end = start;
	    }

	    if ('selectionStart' in input) {
	      input.selectionStart = start;
	      input.selectionEnd = Math.min(end, input.value.length);
	    } else if (document.selection && input.nodeName === 'INPUT') {
	      var range = input.createTextRange();
	      range.collapse(true);
	      range.moveStart('character', start);
	      range.moveEnd('character', end - start);
	      range.select();
	    } else {
	      ReactDOMSelection.setOffsets(input, offsets);
	    }
	  }
	};

	module.exports = ReactInputSelection;

	},{"109":109,"119":119,"121":121,"50":50}],66:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactInstanceHandles
	 * @typechecks static-only
	 */

	'use strict';

	var ReactRootIndex = _dereq_(83);

	var invariant = _dereq_(135);

	var SEPARATOR = '.';
	var SEPARATOR_LENGTH = SEPARATOR.length;

	/**
	 * Maximum depth of traversals before we consider the possibility of a bad ID.
	 */
	var MAX_TREE_DEPTH = 100;

	/**
	 * Creates a DOM ID prefix to use when mounting React components.
	 *
	 * @param {number} index A unique integer
	 * @return {string} React root ID.
	 * @internal
	 */
	function getReactRootIDString(index) {
	  return SEPARATOR + index.toString(36);
	}

	/**
	 * Checks if a character in the supplied ID is a separator or the end.
	 *
	 * @param {string} id A React DOM ID.
	 * @param {number} index Index of the character to check.
	 * @return {boolean} True if the character is a separator or end of the ID.
	 * @private
	 */
	function isBoundary(id, index) {
	  return id.charAt(index) === SEPARATOR || index === id.length;
	}

	/**
	 * Checks if the supplied string is a valid React DOM ID.
	 *
	 * @param {string} id A React DOM ID, maybe.
	 * @return {boolean} True if the string is a valid React DOM ID.
	 * @private
	 */
	function isValidID(id) {
	  return id === '' || (
	    id.charAt(0) === SEPARATOR && id.charAt(id.length - 1) !== SEPARATOR
	  );
	}

	/**
	 * Checks if the first ID is an ancestor of or equal to the second ID.
	 *
	 * @param {string} ancestorID
	 * @param {string} descendantID
	 * @return {boolean} True if `ancestorID` is an ancestor of `descendantID`.
	 * @internal
	 */
	function isAncestorIDOf(ancestorID, descendantID) {
	  return (
	    descendantID.indexOf(ancestorID) === 0 &&
	    isBoundary(descendantID, ancestorID.length)
	  );
	}

	/**
	 * Gets the parent ID of the supplied React DOM ID, `id`.
	 *
	 * @param {string} id ID of a component.
	 * @return {string} ID of the parent, or an empty string.
	 * @private
	 */
	function getParentID(id) {
	  return id ? id.substr(0, id.lastIndexOf(SEPARATOR)) : '';
	}

	/**
	 * Gets the next DOM ID on the tree path from the supplied `ancestorID` to the
	 * supplied `destinationID`. If they are equal, the ID is returned.
	 *
	 * @param {string} ancestorID ID of an ancestor node of `destinationID`.
	 * @param {string} destinationID ID of the destination node.
	 * @return {string} Next ID on the path from `ancestorID` to `destinationID`.
	 * @private
	 */
	function getNextDescendantID(ancestorID, destinationID) {
	  (true ? invariant(
	    isValidID(ancestorID) && isValidID(destinationID),
	    'getNextDescendantID(%s, %s): Received an invalid React DOM ID.',
	    ancestorID,
	    destinationID
	  ) : invariant(isValidID(ancestorID) && isValidID(destinationID)));
	  (true ? invariant(
	    isAncestorIDOf(ancestorID, destinationID),
	    'getNextDescendantID(...): React has made an invalid assumption about ' +
	    'the DOM hierarchy. Expected `%s` to be an ancestor of `%s`.',
	    ancestorID,
	    destinationID
	  ) : invariant(isAncestorIDOf(ancestorID, destinationID)));
	  if (ancestorID === destinationID) {
	    return ancestorID;
	  }
	  // Skip over the ancestor and the immediate separator. Traverse until we hit
	  // another separator or we reach the end of `destinationID`.
	  var start = ancestorID.length + SEPARATOR_LENGTH;
	  var i;
	  for (i = start; i < destinationID.length; i++) {
	    if (isBoundary(destinationID, i)) {
	      break;
	    }
	  }
	  return destinationID.substr(0, i);
	}

	/**
	 * Gets the nearest common ancestor ID of two IDs.
	 *
	 * Using this ID scheme, the nearest common ancestor ID is the longest common
	 * prefix of the two IDs that immediately preceded a "marker" in both strings.
	 *
	 * @param {string} oneID
	 * @param {string} twoID
	 * @return {string} Nearest common ancestor ID, or the empty string if none.
	 * @private
	 */
	function getFirstCommonAncestorID(oneID, twoID) {
	  var minLength = Math.min(oneID.length, twoID.length);
	  if (minLength === 0) {
	    return '';
	  }
	  var lastCommonMarkerIndex = 0;
	  // Use `<=` to traverse until the "EOL" of the shorter string.
	  for (var i = 0; i <= minLength; i++) {
	    if (isBoundary(oneID, i) && isBoundary(twoID, i)) {
	      lastCommonMarkerIndex = i;
	    } else if (oneID.charAt(i) !== twoID.charAt(i)) {
	      break;
	    }
	  }
	  var longestCommonID = oneID.substr(0, lastCommonMarkerIndex);
	  (true ? invariant(
	    isValidID(longestCommonID),
	    'getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s',
	    oneID,
	    twoID,
	    longestCommonID
	  ) : invariant(isValidID(longestCommonID)));
	  return longestCommonID;
	}

	/**
	 * Traverses the parent path between two IDs (either up or down). The IDs must
	 * not be the same, and there must exist a parent path between them. If the
	 * callback returns `false`, traversal is stopped.
	 *
	 * @param {?string} start ID at which to start traversal.
	 * @param {?string} stop ID at which to end traversal.
	 * @param {function} cb Callback to invoke each ID with.
	 * @param {?boolean} skipFirst Whether or not to skip the first node.
	 * @param {?boolean} skipLast Whether or not to skip the last node.
	 * @private
	 */
	function traverseParentPath(start, stop, cb, arg, skipFirst, skipLast) {
	  start = start || '';
	  stop = stop || '';
	  (true ? invariant(
	    start !== stop,
	    'traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.',
	    start
	  ) : invariant(start !== stop));
	  var traverseUp = isAncestorIDOf(stop, start);
	  (true ? invariant(
	    traverseUp || isAncestorIDOf(start, stop),
	    'traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do ' +
	    'not have a parent path.',
	    start,
	    stop
	  ) : invariant(traverseUp || isAncestorIDOf(start, stop)));
	  // Traverse from `start` to `stop` one depth at a time.
	  var depth = 0;
	  var traverse = traverseUp ? getParentID : getNextDescendantID;
	  for (var id = start; /* until break */; id = traverse(id, stop)) {
	    var ret;
	    if ((!skipFirst || id !== start) && (!skipLast || id !== stop)) {
	      ret = cb(id, traverseUp, arg);
	    }
	    if (ret === false || id === stop) {
	      // Only break //after// visiting `stop`.
	      break;
	    }
	    (true ? invariant(
	      depth++ < MAX_TREE_DEPTH,
	      'traverseParentPath(%s, %s, ...): Detected an infinite loop while ' +
	      'traversing the React DOM ID tree. This may be due to malformed IDs: %s',
	      start, stop
	    ) : invariant(depth++ < MAX_TREE_DEPTH));
	  }
	}

	/**
	 * Manages the IDs assigned to DOM representations of React components. This
	 * uses a specific scheme in order to traverse the DOM efficiently (e.g. in
	 * order to simulate events).
	 *
	 * @internal
	 */
	var ReactInstanceHandles = {

	  /**
	   * Constructs a React root ID
	   * @return {string} A React root ID.
	   */
	  createReactRootID: function() {
	    return getReactRootIDString(ReactRootIndex.createReactRootIndex());
	  },

	  /**
	   * Constructs a React ID by joining a root ID with a name.
	   *
	   * @param {string} rootID Root ID of a parent component.
	   * @param {string} name A component's name (as flattened children).
	   * @return {string} A React ID.
	   * @internal
	   */
	  createReactID: function(rootID, name) {
	    return rootID + name;
	  },

	  /**
	   * Gets the DOM ID of the React component that is the root of the tree that
	   * contains the React component with the supplied DOM ID.
	   *
	   * @param {string} id DOM ID of a React component.
	   * @return {?string} DOM ID of the React component that is the root.
	   * @internal
	   */
	  getReactRootIDFromNodeID: function(id) {
	    if (id && id.charAt(0) === SEPARATOR && id.length > 1) {
	      var index = id.indexOf(SEPARATOR, 1);
	      return index > -1 ? id.substr(0, index) : id;
	    }
	    return null;
	  },

	  /**
	   * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
	   * should would receive a `mouseEnter` or `mouseLeave` event.
	   *
	   * NOTE: Does not invoke the callback on the nearest common ancestor because
	   * nothing "entered" or "left" that element.
	   *
	   * @param {string} leaveID ID being left.
	   * @param {string} enterID ID being entered.
	   * @param {function} cb Callback to invoke on each entered/left ID.
	   * @param {*} upArg Argument to invoke the callback with on left IDs.
	   * @param {*} downArg Argument to invoke the callback with on entered IDs.
	   * @internal
	   */
	  traverseEnterLeave: function(leaveID, enterID, cb, upArg, downArg) {
	    var ancestorID = getFirstCommonAncestorID(leaveID, enterID);
	    if (ancestorID !== leaveID) {
	      traverseParentPath(leaveID, ancestorID, cb, upArg, false, true);
	    }
	    if (ancestorID !== enterID) {
	      traverseParentPath(ancestorID, enterID, cb, downArg, true, false);
	    }
	  },

	  /**
	   * Simulates the traversal of a two-phase, capture/bubble event dispatch.
	   *
	   * NOTE: This traversal happens on IDs without touching the DOM.
	   *
	   * @param {string} targetID ID of the target node.
	   * @param {function} cb Callback to invoke.
	   * @param {*} arg Argument to invoke the callback with.
	   * @internal
	   */
	  traverseTwoPhase: function(targetID, cb, arg) {
	    if (targetID) {
	      traverseParentPath('', targetID, cb, arg, true, false);
	      traverseParentPath(targetID, '', cb, arg, false, true);
	    }
	  },

	  /**
	   * Traverse a node ID, calling the supplied `cb` for each ancestor ID. For
	   * example, passing `.0.$row-0.1` would result in `cb` getting called
	   * with `.0`, `.0.$row-0`, and `.0.$row-0.1`.
	   *
	   * NOTE: This traversal happens on IDs without touching the DOM.
	   *
	   * @param {string} targetID ID of the target node.
	   * @param {function} cb Callback to invoke.
	   * @param {*} arg Argument to invoke the callback with.
	   * @internal
	   */
	  traverseAncestors: function(targetID, cb, arg) {
	    traverseParentPath('', targetID, cb, arg, true, false);
	  },

	  /**
	   * Exposed for unit testing.
	   * @private
	   */
	  _getFirstCommonAncestorID: getFirstCommonAncestorID,

	  /**
	   * Exposed for unit testing.
	   * @private
	   */
	  _getNextDescendantID: getNextDescendantID,

	  isAncestorIDOf: isAncestorIDOf,

	  SEPARATOR: SEPARATOR

	};

	module.exports = ReactInstanceHandles;

	},{"135":135,"83":83}],67:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactInstanceMap
	 */

	'use strict';

	/**
	 * `ReactInstanceMap` maintains a mapping from a public facing stateful
	 * instance (key) and the internal representation (value). This allows public
	 * methods to accept the user facing instance as an argument and map them back
	 * to internal methods.
	 */

	// TODO: Replace this with ES6: var ReactInstanceMap = new Map();
	var ReactInstanceMap = {

	  /**
	   * This API should be called `delete` but we'd have to make sure to always
	   * transform these to strings for IE support. When this transform is fully
	   * supported we can rename it.
	   */
	  remove: function(key) {
	    key._reactInternalInstance = undefined;
	  },

	  get: function(key) {
	    return key._reactInternalInstance;
	  },

	  has: function(key) {
	    return key._reactInternalInstance !== undefined;
	  },

	  set: function(key, value) {
	    key._reactInternalInstance = value;
	  }

	};

	module.exports = ReactInstanceMap;

	},{}],68:[function(_dereq_,module,exports){
	/**
	 * Copyright 2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactLifeCycle
	 */

	'use strict';

	/**
	 * This module manages the bookkeeping when a component is in the process
	 * of being mounted or being unmounted. This is used as a way to enforce
	 * invariants (or warnings) when it is not recommended to call
	 * setState/forceUpdate.
	 *
	 * currentlyMountingInstance: During the construction phase, it is not possible
	 * to trigger an update since the instance is not fully mounted yet. However, we
	 * currently allow this as a convenience for mutating the initial state.
	 *
	 * currentlyUnmountingInstance: During the unmounting phase, the instance is
	 * still mounted and can therefore schedule an update. However, this is not
	 * recommended and probably an error since it's about to be unmounted.
	 * Therefore we still want to trigger in an error for that case.
	 */

	var ReactLifeCycle = {
	  currentlyMountingInstance: null,
	  currentlyUnmountingInstance: null
	};

	module.exports = ReactLifeCycle;

	},{}],69:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactMarkupChecksum
	 */

	'use strict';

	var adler32 = _dereq_(106);

	var ReactMarkupChecksum = {
	  CHECKSUM_ATTR_NAME: 'data-react-checksum',

	  /**
	   * @param {string} markup Markup string
	   * @return {string} Markup string with checksum attribute attached
	   */
	  addChecksumToMarkup: function(markup) {
	    var checksum = adler32(markup);
	    return markup.replace(
	      '>',
	      ' ' + ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="' + checksum + '">'
	    );
	  },

	  /**
	   * @param {string} markup to use
	   * @param {DOMElement} element root React element
	   * @returns {boolean} whether or not the markup is the same
	   */
	  canReuseMarkup: function(markup, element) {
	    var existingChecksum = element.getAttribute(
	      ReactMarkupChecksum.CHECKSUM_ATTR_NAME
	    );
	    existingChecksum = existingChecksum && parseInt(existingChecksum, 10);
	    var markupChecksum = adler32(markup);
	    return markupChecksum === existingChecksum;
	  }
	};

	module.exports = ReactMarkupChecksum;

	},{"106":106}],70:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactMount
	 */

	'use strict';

	var DOMProperty = _dereq_(10);
	var ReactBrowserEventEmitter = _dereq_(30);
	var ReactCurrentOwner = _dereq_(39);
	var ReactElement = _dereq_(57);
	var ReactElementValidator = _dereq_(58);
	var ReactEmptyComponent = _dereq_(59);
	var ReactInstanceHandles = _dereq_(66);
	var ReactInstanceMap = _dereq_(67);
	var ReactMarkupChecksum = _dereq_(69);
	var ReactPerf = _dereq_(75);
	var ReactReconciler = _dereq_(81);
	var ReactUpdateQueue = _dereq_(86);
	var ReactUpdates = _dereq_(87);

	var emptyObject = _dereq_(115);
	var containsNode = _dereq_(109);
	var getReactRootElementInContainer = _dereq_(129);
	var instantiateReactComponent = _dereq_(134);
	var invariant = _dereq_(135);
	var setInnerHTML = _dereq_(148);
	var shouldUpdateReactComponent = _dereq_(151);
	var warning = _dereq_(154);

	var SEPARATOR = ReactInstanceHandles.SEPARATOR;

	var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME;
	var nodeCache = {};

	var ELEMENT_NODE_TYPE = 1;
	var DOC_NODE_TYPE = 9;

	/** Mapping from reactRootID to React component instance. */
	var instancesByReactRootID = {};

	/** Mapping from reactRootID to `container` nodes. */
	var containersByReactRootID = {};

	if (true) {
	  /** __DEV__-only mapping from reactRootID to root elements. */
	  var rootElementsByReactRootID = {};
	}

	// Used to store breadth-first search state in findComponentRoot.
	var findComponentRootReusableArray = [];

	/**
	 * Finds the index of the first character
	 * that's not common between the two given strings.
	 *
	 * @return {number} the index of the character where the strings diverge
	 */
	function firstDifferenceIndex(string1, string2) {
	  var minLen = Math.min(string1.length, string2.length);
	  for (var i = 0; i < minLen; i++) {
	    if (string1.charAt(i) !== string2.charAt(i)) {
	      return i;
	    }
	  }
	  return string1.length === string2.length ? -1 : minLen;
	}

	/**
	 * @param {DOMElement} container DOM element that may contain a React component.
	 * @return {?string} A "reactRoot" ID, if a React component is rendered.
	 */
	function getReactRootID(container) {
	  var rootElement = getReactRootElementInContainer(container);
	  return rootElement && ReactMount.getID(rootElement);
	}

	/**
	 * Accessing node[ATTR_NAME] or calling getAttribute(ATTR_NAME) on a form
	 * element can return its control whose name or ID equals ATTR_NAME. All
	 * DOM nodes support `getAttributeNode` but this can also get called on
	 * other objects so just return '' if we're given something other than a
	 * DOM node (such as window).
	 *
	 * @param {?DOMElement|DOMWindow|DOMDocument|DOMTextNode} node DOM node.
	 * @return {string} ID of the supplied `domNode`.
	 */
	function getID(node) {
	  var id = internalGetID(node);
	  if (id) {
	    if (nodeCache.hasOwnProperty(id)) {
	      var cached = nodeCache[id];
	      if (cached !== node) {
	        (true ? invariant(
	          !isValid(cached, id),
	          'ReactMount: Two valid but unequal nodes with the same `%s`: %s',
	          ATTR_NAME, id
	        ) : invariant(!isValid(cached, id)));

	        nodeCache[id] = node;
	      }
	    } else {
	      nodeCache[id] = node;
	    }
	  }

	  return id;
	}

	function internalGetID(node) {
	  // If node is something like a window, document, or text node, none of
	  // which support attributes or a .getAttribute method, gracefully return
	  // the empty string, as if the attribute were missing.
	  return node && node.getAttribute && node.getAttribute(ATTR_NAME) || '';
	}

	/**
	 * Sets the React-specific ID of the given node.
	 *
	 * @param {DOMElement} node The DOM node whose ID will be set.
	 * @param {string} id The value of the ID attribute.
	 */
	function setID(node, id) {
	  var oldID = internalGetID(node);
	  if (oldID !== id) {
	    delete nodeCache[oldID];
	  }
	  node.setAttribute(ATTR_NAME, id);
	  nodeCache[id] = node;
	}

	/**
	 * Finds the node with the supplied React-generated DOM ID.
	 *
	 * @param {string} id A React-generated DOM ID.
	 * @return {DOMElement} DOM node with the suppled `id`.
	 * @internal
	 */
	function getNode(id) {
	  if (!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)) {
	    nodeCache[id] = ReactMount.findReactNodeByID(id);
	  }
	  return nodeCache[id];
	}

	/**
	 * Finds the node with the supplied public React instance.
	 *
	 * @param {*} instance A public React instance.
	 * @return {?DOMElement} DOM node with the suppled `id`.
	 * @internal
	 */
	function getNodeFromInstance(instance) {
	  var id = ReactInstanceMap.get(instance)._rootNodeID;
	  if (ReactEmptyComponent.isNullComponentID(id)) {
	    return null;
	  }
	  if (!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)) {
	    nodeCache[id] = ReactMount.findReactNodeByID(id);
	  }
	  return nodeCache[id];
	}

	/**
	 * A node is "valid" if it is contained by a currently mounted container.
	 *
	 * This means that the node does not have to be contained by a document in
	 * order to be considered valid.
	 *
	 * @param {?DOMElement} node The candidate DOM node.
	 * @param {string} id The expected ID of the node.
	 * @return {boolean} Whether the node is contained by a mounted container.
	 */
	function isValid(node, id) {
	  if (node) {
	    (true ? invariant(
	      internalGetID(node) === id,
	      'ReactMount: Unexpected modification of `%s`',
	      ATTR_NAME
	    ) : invariant(internalGetID(node) === id));

	    var container = ReactMount.findReactContainerForID(id);
	    if (container && containsNode(container, node)) {
	      return true;
	    }
	  }

	  return false;
	}

	/**
	 * Causes the cache to forget about one React-specific ID.
	 *
	 * @param {string} id The ID to forget.
	 */
	function purgeID(id) {
	  delete nodeCache[id];
	}

	var deepestNodeSoFar = null;
	function findDeepestCachedAncestorImpl(ancestorID) {
	  var ancestor = nodeCache[ancestorID];
	  if (ancestor && isValid(ancestor, ancestorID)) {
	    deepestNodeSoFar = ancestor;
	  } else {
	    // This node isn't populated in the cache, so presumably none of its
	    // descendants are. Break out of the loop.
	    return false;
	  }
	}

	/**
	 * Return the deepest cached node whose ID is a prefix of `targetID`.
	 */
	function findDeepestCachedAncestor(targetID) {
	  deepestNodeSoFar = null;
	  ReactInstanceHandles.traverseAncestors(
	    targetID,
	    findDeepestCachedAncestorImpl
	  );

	  var foundNode = deepestNodeSoFar;
	  deepestNodeSoFar = null;
	  return foundNode;
	}

	/**
	 * Mounts this component and inserts it into the DOM.
	 *
	 * @param {ReactComponent} componentInstance The instance to mount.
	 * @param {string} rootID DOM ID of the root node.
	 * @param {DOMElement} container DOM element to mount into.
	 * @param {ReactReconcileTransaction} transaction
	 * @param {boolean} shouldReuseMarkup If true, do not insert markup
	 */
	function mountComponentIntoNode(
	    componentInstance,
	    rootID,
	    container,
	    transaction,
	    shouldReuseMarkup) {
	  var markup = ReactReconciler.mountComponent(
	    componentInstance, rootID, transaction, emptyObject
	  );
	  componentInstance._isTopLevel = true;
	  ReactMount._mountImageIntoNode(markup, container, shouldReuseMarkup);
	}

	/**
	 * Batched mount.
	 *
	 * @param {ReactComponent} componentInstance The instance to mount.
	 * @param {string} rootID DOM ID of the root node.
	 * @param {DOMElement} container DOM element to mount into.
	 * @param {boolean} shouldReuseMarkup If true, do not insert markup
	 */
	function batchedMountComponentIntoNode(
	    componentInstance,
	    rootID,
	    container,
	    shouldReuseMarkup) {
	  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
	  transaction.perform(
	    mountComponentIntoNode,
	    null,
	    componentInstance,
	    rootID,
	    container,
	    transaction,
	    shouldReuseMarkup
	  );
	  ReactUpdates.ReactReconcileTransaction.release(transaction);
	}

	/**
	 * Mounting is the process of initializing a React component by creating its
	 * representative DOM elements and inserting them into a supplied `container`.
	 * Any prior content inside `container` is destroyed in the process.
	 *
	 *   ReactMount.render(
	 *     component,
	 *     document.getElementById('container')
	 *   );
	 *
	 *   <div id="container">                   <-- Supplied `container`.
	 *     <div data-reactid=".3">              <-- Rendered reactRoot of React
	 *       // ...                                 component.
	 *     </div>
	 *   </div>
	 *
	 * Inside of `container`, the first element rendered is the "reactRoot".
	 */
	var ReactMount = {
	  /** Exposed for debugging purposes **/
	  _instancesByReactRootID: instancesByReactRootID,

	  /**
	   * This is a hook provided to support rendering React components while
	   * ensuring that the apparent scroll position of its `container` does not
	   * change.
	   *
	   * @param {DOMElement} container The `container` being rendered into.
	   * @param {function} renderCallback This must be called once to do the render.
	   */
	  scrollMonitor: function(container, renderCallback) {
	    renderCallback();
	  },

	  /**
	   * Take a component that's already mounted into the DOM and replace its props
	   * @param {ReactComponent} prevComponent component instance already in the DOM
	   * @param {ReactElement} nextElement component instance to render
	   * @param {DOMElement} container container to render into
	   * @param {?function} callback function triggered on completion
	   */
	  _updateRootComponent: function(
	      prevComponent,
	      nextElement,
	      container,
	      callback) {
	    if (true) {
	      ReactElementValidator.checkAndWarnForMutatedProps(nextElement);
	    }

	    ReactMount.scrollMonitor(container, function() {
	      ReactUpdateQueue.enqueueElementInternal(prevComponent, nextElement);
	      if (callback) {
	        ReactUpdateQueue.enqueueCallbackInternal(prevComponent, callback);
	      }
	    });

	    if (true) {
	      // Record the root element in case it later gets transplanted.
	      rootElementsByReactRootID[getReactRootID(container)] =
	        getReactRootElementInContainer(container);
	    }

	    return prevComponent;
	  },

	  /**
	   * Register a component into the instance map and starts scroll value
	   * monitoring
	   * @param {ReactComponent} nextComponent component instance to render
	   * @param {DOMElement} container container to render into
	   * @return {string} reactRoot ID prefix
	   */
	  _registerComponent: function(nextComponent, container) {
	    (true ? invariant(
	      container && (
	        (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
	      ),
	      '_registerComponent(...): Target container is not a DOM element.'
	    ) : invariant(container && (
	      (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
	    )));

	    ReactBrowserEventEmitter.ensureScrollValueMonitoring();

	    var reactRootID = ReactMount.registerContainer(container);
	    instancesByReactRootID[reactRootID] = nextComponent;
	    return reactRootID;
	  },

	  /**
	   * Render a new component into the DOM.
	   * @param {ReactElement} nextElement element to render
	   * @param {DOMElement} container container to render into
	   * @param {boolean} shouldReuseMarkup if we should skip the markup insertion
	   * @return {ReactComponent} nextComponent
	   */
	  _renderNewRootComponent: function(
	    nextElement,
	    container,
	    shouldReuseMarkup
	  ) {
	    // Various parts of our code (such as ReactCompositeComponent's
	    // _renderValidatedComponent) assume that calls to render aren't nested;
	    // verify that that's the case.
	    (true ? warning(
	      ReactCurrentOwner.current == null,
	      '_renderNewRootComponent(): Render methods should be a pure function ' +
	      'of props and state; triggering nested component updates from ' +
	      'render is not allowed. If necessary, trigger nested updates in ' +
	      'componentDidUpdate.'
	    ) : null);

	    var componentInstance = instantiateReactComponent(nextElement, null);
	    var reactRootID = ReactMount._registerComponent(
	      componentInstance,
	      container
	    );

	    // The initial render is synchronous but any updates that happen during
	    // rendering, in componentWillMount or componentDidMount, will be batched
	    // according to the current batching strategy.

	    ReactUpdates.batchedUpdates(
	      batchedMountComponentIntoNode,
	      componentInstance,
	      reactRootID,
	      container,
	      shouldReuseMarkup
	    );

	    if (true) {
	      // Record the root element in case it later gets transplanted.
	      rootElementsByReactRootID[reactRootID] =
	        getReactRootElementInContainer(container);
	    }

	    return componentInstance;
	  },

	  /**
	   * Renders a React component into the DOM in the supplied `container`.
	   *
	   * If the React component was previously rendered into `container`, this will
	   * perform an update on it and only mutate the DOM as necessary to reflect the
	   * latest React component.
	   *
	   * @param {ReactElement} nextElement Component element to render.
	   * @param {DOMElement} container DOM element to render into.
	   * @param {?function} callback function triggered on completion
	   * @return {ReactComponent} Component instance rendered in `container`.
	   */
	  render: function(nextElement, container, callback) {
	    (true ? invariant(
	      ReactElement.isValidElement(nextElement),
	      'React.render(): Invalid component element.%s',
	      (
	        typeof nextElement === 'string' ?
	          ' Instead of passing an element string, make sure to instantiate ' +
	          'it by passing it to React.createElement.' :
	        typeof nextElement === 'function' ?
	          ' Instead of passing a component class, make sure to instantiate ' +
	          'it by passing it to React.createElement.' :
	        // Check if it quacks like an element
	        nextElement != null && nextElement.props !== undefined ?
	          ' This may be caused by unintentionally loading two independent ' +
	          'copies of React.' :
	          ''
	      )
	    ) : invariant(ReactElement.isValidElement(nextElement)));

	    var prevComponent = instancesByReactRootID[getReactRootID(container)];

	    if (prevComponent) {
	      var prevElement = prevComponent._currentElement;
	      if (shouldUpdateReactComponent(prevElement, nextElement)) {
	        return ReactMount._updateRootComponent(
	          prevComponent,
	          nextElement,
	          container,
	          callback
	        ).getPublicInstance();
	      } else {
	        ReactMount.unmountComponentAtNode(container);
	      }
	    }

	    var reactRootElement = getReactRootElementInContainer(container);
	    var containerHasReactMarkup =
	      reactRootElement && ReactMount.isRenderedByReact(reactRootElement);

	    if (true) {
	      if (!containerHasReactMarkup || reactRootElement.nextSibling) {
	        var rootElementSibling = reactRootElement;
	        while (rootElementSibling) {
	          if (ReactMount.isRenderedByReact(rootElementSibling)) {
	            (true ? warning(
	              false,
	              'render(): Target node has markup rendered by React, but there ' +
	              'are unrelated nodes as well. This is most commonly caused by ' +
	              'white-space inserted around server-rendered markup.'
	            ) : null);
	            break;
	          }

	          rootElementSibling = rootElementSibling.nextSibling;
	        }
	      }
	    }

	    var shouldReuseMarkup = containerHasReactMarkup && !prevComponent;

	    var component = ReactMount._renderNewRootComponent(
	      nextElement,
	      container,
	      shouldReuseMarkup
	    ).getPublicInstance();
	    if (callback) {
	      callback.call(component);
	    }
	    return component;
	  },

	  /**
	   * Constructs a component instance of `constructor` with `initialProps` and
	   * renders it into the supplied `container`.
	   *
	   * @param {function} constructor React component constructor.
	   * @param {?object} props Initial props of the component instance.
	   * @param {DOMElement} container DOM element to render into.
	   * @return {ReactComponent} Component instance rendered in `container`.
	   */
	  constructAndRenderComponent: function(constructor, props, container) {
	    var element = ReactElement.createElement(constructor, props);
	    return ReactMount.render(element, container);
	  },

	  /**
	   * Constructs a component instance of `constructor` with `initialProps` and
	   * renders it into a container node identified by supplied `id`.
	   *
	   * @param {function} componentConstructor React component constructor
	   * @param {?object} props Initial props of the component instance.
	   * @param {string} id ID of the DOM element to render into.
	   * @return {ReactComponent} Component instance rendered in the container node.
	   */
	  constructAndRenderComponentByID: function(constructor, props, id) {
	    var domNode = document.getElementById(id);
	    (true ? invariant(
	      domNode,
	      'Tried to get element with id of "%s" but it is not present on the page.',
	      id
	    ) : invariant(domNode));
	    return ReactMount.constructAndRenderComponent(constructor, props, domNode);
	  },

	  /**
	   * Registers a container node into which React components will be rendered.
	   * This also creates the "reactRoot" ID that will be assigned to the element
	   * rendered within.
	   *
	   * @param {DOMElement} container DOM element to register as a container.
	   * @return {string} The "reactRoot" ID of elements rendered within.
	   */
	  registerContainer: function(container) {
	    var reactRootID = getReactRootID(container);
	    if (reactRootID) {
	      // If one exists, make sure it is a valid "reactRoot" ID.
	      reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);
	    }
	    if (!reactRootID) {
	      // No valid "reactRoot" ID found, create one.
	      reactRootID = ReactInstanceHandles.createReactRootID();
	    }
	    containersByReactRootID[reactRootID] = container;
	    return reactRootID;
	  },

	  /**
	   * Unmounts and destroys the React component rendered in the `container`.
	   *
	   * @param {DOMElement} container DOM element containing a React component.
	   * @return {boolean} True if a component was found in and unmounted from
	   *                   `container`
	   */
	  unmountComponentAtNode: function(container) {
	    // Various parts of our code (such as ReactCompositeComponent's
	    // _renderValidatedComponent) assume that calls to render aren't nested;
	    // verify that that's the case. (Strictly speaking, unmounting won't cause a
	    // render but we still don't expect to be in a render call here.)
	    (true ? warning(
	      ReactCurrentOwner.current == null,
	      'unmountComponentAtNode(): Render methods should be a pure function of ' +
	      'props and state; triggering nested component updates from render is ' +
	      'not allowed. If necessary, trigger nested updates in ' +
	      'componentDidUpdate.'
	    ) : null);

	    (true ? invariant(
	      container && (
	        (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
	      ),
	      'unmountComponentAtNode(...): Target container is not a DOM element.'
	    ) : invariant(container && (
	      (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
	    )));

	    var reactRootID = getReactRootID(container);
	    var component = instancesByReactRootID[reactRootID];
	    if (!component) {
	      return false;
	    }
	    ReactMount.unmountComponentFromNode(component, container);
	    delete instancesByReactRootID[reactRootID];
	    delete containersByReactRootID[reactRootID];
	    if (true) {
	      delete rootElementsByReactRootID[reactRootID];
	    }
	    return true;
	  },

	  /**
	   * Unmounts a component and removes it from the DOM.
	   *
	   * @param {ReactComponent} instance React component instance.
	   * @param {DOMElement} container DOM element to unmount from.
	   * @final
	   * @internal
	   * @see {ReactMount.unmountComponentAtNode}
	   */
	  unmountComponentFromNode: function(instance, container) {
	    ReactReconciler.unmountComponent(instance);

	    if (container.nodeType === DOC_NODE_TYPE) {
	      container = container.documentElement;
	    }

	    // http://jsperf.com/emptying-a-node
	    while (container.lastChild) {
	      container.removeChild(container.lastChild);
	    }
	  },

	  /**
	   * Finds the container DOM element that contains React component to which the
	   * supplied DOM `id` belongs.
	   *
	   * @param {string} id The ID of an element rendered by a React component.
	   * @return {?DOMElement} DOM element that contains the `id`.
	   */
	  findReactContainerForID: function(id) {
	    var reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(id);
	    var container = containersByReactRootID[reactRootID];

	    if (true) {
	      var rootElement = rootElementsByReactRootID[reactRootID];
	      if (rootElement && rootElement.parentNode !== container) {
	        (true ? invariant(
	          // Call internalGetID here because getID calls isValid which calls
	          // findReactContainerForID (this function).
	          internalGetID(rootElement) === reactRootID,
	          'ReactMount: Root element ID differed from reactRootID.'
	        ) : invariant(// Call internalGetID here because getID calls isValid which calls
	        // findReactContainerForID (this function).
	        internalGetID(rootElement) === reactRootID));

	        var containerChild = container.firstChild;
	        if (containerChild &&
	            reactRootID === internalGetID(containerChild)) {
	          // If the container has a new child with the same ID as the old
	          // root element, then rootElementsByReactRootID[reactRootID] is
	          // just stale and needs to be updated. The case that deserves a
	          // warning is when the container is empty.
	          rootElementsByReactRootID[reactRootID] = containerChild;
	        } else {
	          (true ? warning(
	            false,
	            'ReactMount: Root element has been removed from its original ' +
	            'container. New container:', rootElement.parentNode
	          ) : null);
	        }
	      }
	    }

	    return container;
	  },

	  /**
	   * Finds an element rendered by React with the supplied ID.
	   *
	   * @param {string} id ID of a DOM node in the React component.
	   * @return {DOMElement} Root DOM node of the React component.
	   */
	  findReactNodeByID: function(id) {
	    var reactRoot = ReactMount.findReactContainerForID(id);
	    return ReactMount.findComponentRoot(reactRoot, id);
	  },

	  /**
	   * True if the supplied `node` is rendered by React.
	   *
	   * @param {*} node DOM Element to check.
	   * @return {boolean} True if the DOM Element appears to be rendered by React.
	   * @internal
	   */
	  isRenderedByReact: function(node) {
	    if (node.nodeType !== 1) {
	      // Not a DOMElement, therefore not a React component
	      return false;
	    }
	    var id = ReactMount.getID(node);
	    return id ? id.charAt(0) === SEPARATOR : false;
	  },

	  /**
	   * Traverses up the ancestors of the supplied node to find a node that is a
	   * DOM representation of a React component.
	   *
	   * @param {*} node
	   * @return {?DOMEventTarget}
	   * @internal
	   */
	  getFirstReactDOM: function(node) {
	    var current = node;
	    while (current && current.parentNode !== current) {
	      if (ReactMount.isRenderedByReact(current)) {
	        return current;
	      }
	      current = current.parentNode;
	    }
	    return null;
	  },

	  /**
	   * Finds a node with the supplied `targetID` inside of the supplied
	   * `ancestorNode`.  Exploits the ID naming scheme to perform the search
	   * quickly.
	   *
	   * @param {DOMEventTarget} ancestorNode Search from this root.
	   * @pararm {string} targetID ID of the DOM representation of the component.
	   * @return {DOMEventTarget} DOM node with the supplied `targetID`.
	   * @internal
	   */
	  findComponentRoot: function(ancestorNode, targetID) {
	    var firstChildren = findComponentRootReusableArray;
	    var childIndex = 0;

	    var deepestAncestor = findDeepestCachedAncestor(targetID) || ancestorNode;

	    firstChildren[0] = deepestAncestor.firstChild;
	    firstChildren.length = 1;

	    while (childIndex < firstChildren.length) {
	      var child = firstChildren[childIndex++];
	      var targetChild;

	      while (child) {
	        var childID = ReactMount.getID(child);
	        if (childID) {
	          // Even if we find the node we're looking for, we finish looping
	          // through its siblings to ensure they're cached so that we don't have
	          // to revisit this node again. Otherwise, we make n^2 calls to getID
	          // when visiting the many children of a single node in order.

	          if (targetID === childID) {
	            targetChild = child;
	          } else if (ReactInstanceHandles.isAncestorIDOf(childID, targetID)) {
	            // If we find a child whose ID is an ancestor of the given ID,
	            // then we can be sure that we only want to search the subtree
	            // rooted at this child, so we can throw out the rest of the
	            // search state.
	            firstChildren.length = childIndex = 0;
	            firstChildren.push(child.firstChild);
	          }

	        } else {
	          // If this child had no ID, then there's a chance that it was
	          // injected automatically by the browser, as when a `<table>`
	          // element sprouts an extra `<tbody>` child as a side effect of
	          // `.innerHTML` parsing. Optimistically continue down this
	          // branch, but not before examining the other siblings.
	          firstChildren.push(child.firstChild);
	        }

	        child = child.nextSibling;
	      }

	      if (targetChild) {
	        // Emptying firstChildren/findComponentRootReusableArray is
	        // not necessary for correctness, but it helps the GC reclaim
	        // any nodes that were left at the end of the search.
	        firstChildren.length = 0;

	        return targetChild;
	      }
	    }

	    firstChildren.length = 0;

	    (true ? invariant(
	      false,
	      'findComponentRoot(..., %s): Unable to find element. This probably ' +
	      'means the DOM was unexpectedly mutated (e.g., by the browser), ' +
	      'usually due to forgetting a <tbody> when using tables, nesting tags ' +
	      'like <form>, <p>, or <a>, or using non-SVG elements in an <svg> ' +
	      'parent. ' +
	      'Try inspecting the child nodes of the element with React ID `%s`.',
	      targetID,
	      ReactMount.getID(ancestorNode)
	    ) : invariant(false));
	  },

	  _mountImageIntoNode: function(markup, container, shouldReuseMarkup) {
	    (true ? invariant(
	      container && (
	        (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
	      ),
	      'mountComponentIntoNode(...): Target container is not valid.'
	    ) : invariant(container && (
	      (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)
	    )));

	    if (shouldReuseMarkup) {
	      var rootElement = getReactRootElementInContainer(container);
	      if (ReactMarkupChecksum.canReuseMarkup(markup, rootElement)) {
	        return;
	      } else {
	        var checksum = rootElement.getAttribute(
	          ReactMarkupChecksum.CHECKSUM_ATTR_NAME
	        );
	        rootElement.removeAttribute(ReactMarkupChecksum.CHECKSUM_ATTR_NAME);

	        var rootMarkup = rootElement.outerHTML;
	        rootElement.setAttribute(
	          ReactMarkupChecksum.CHECKSUM_ATTR_NAME,
	          checksum
	        );

	        var diffIndex = firstDifferenceIndex(markup, rootMarkup);
	        var difference = ' (client) ' +
	          markup.substring(diffIndex - 20, diffIndex + 20) +
	          '\n (server) ' + rootMarkup.substring(diffIndex - 20, diffIndex + 20);

	        (true ? invariant(
	          container.nodeType !== DOC_NODE_TYPE,
	          'You\'re trying to render a component to the document using ' +
	          'server rendering but the checksum was invalid. This usually ' +
	          'means you rendered a different component type or props on ' +
	          'the client from the one on the server, or your render() ' +
	          'methods are impure. React cannot handle this case due to ' +
	          'cross-browser quirks by rendering at the document root. You ' +
	          'should look for environment dependent code in your components ' +
	          'and ensure the props are the same client and server side:\n%s',
	          difference
	        ) : invariant(container.nodeType !== DOC_NODE_TYPE));

	        if (true) {
	          (true ? warning(
	            false,
	            'React attempted to reuse markup in a container but the ' +
	            'checksum was invalid. This generally means that you are ' +
	            'using server rendering and the markup generated on the ' +
	            'server was not what the client was expecting. React injected ' +
	            'new markup to compensate which works but you have lost many ' +
	            'of the benefits of server rendering. Instead, figure out ' +
	            'why the markup being generated is different on the client ' +
	            'or server:\n%s',
	            difference
	          ) : null);
	        }
	      }
	    }

	    (true ? invariant(
	      container.nodeType !== DOC_NODE_TYPE,
	      'You\'re trying to render a component to the document but ' +
	        'you didn\'t use server rendering. We can\'t do this ' +
	        'without using server rendering due to cross-browser quirks. ' +
	        'See React.renderToString() for server rendering.'
	    ) : invariant(container.nodeType !== DOC_NODE_TYPE));

	    setInnerHTML(container, markup);
	  },

	  /**
	   * React ID utilities.
	   */

	  getReactRootID: getReactRootID,

	  getID: getID,

	  setID: setID,

	  getNode: getNode,

	  getNodeFromInstance: getNodeFromInstance,

	  purgeID: purgeID
	};

	ReactPerf.measureMethods(ReactMount, 'ReactMount', {
	  _renderNewRootComponent: '_renderNewRootComponent',
	  _mountImageIntoNode: '_mountImageIntoNode'
	});

	module.exports = ReactMount;

	},{"10":10,"109":109,"115":115,"129":129,"134":134,"135":135,"148":148,"151":151,"154":154,"30":30,"39":39,"57":57,"58":58,"59":59,"66":66,"67":67,"69":69,"75":75,"81":81,"86":86,"87":87}],71:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactMultiChild
	 * @typechecks static-only
	 */

	'use strict';

	var ReactComponentEnvironment = _dereq_(36);
	var ReactMultiChildUpdateTypes = _dereq_(72);

	var ReactReconciler = _dereq_(81);
	var ReactChildReconciler = _dereq_(31);

	/**
	 * Updating children of a component may trigger recursive updates. The depth is
	 * used to batch recursive updates to render markup more efficiently.
	 *
	 * @type {number}
	 * @private
	 */
	var updateDepth = 0;

	/**
	 * Queue of update configuration objects.
	 *
	 * Each object has a `type` property that is in `ReactMultiChildUpdateTypes`.
	 *
	 * @type {array<object>}
	 * @private
	 */
	var updateQueue = [];

	/**
	 * Queue of markup to be rendered.
	 *
	 * @type {array<string>}
	 * @private
	 */
	var markupQueue = [];

	/**
	 * Enqueues markup to be rendered and inserted at a supplied index.
	 *
	 * @param {string} parentID ID of the parent component.
	 * @param {string} markup Markup that renders into an element.
	 * @param {number} toIndex Destination index.
	 * @private
	 */
	function enqueueMarkup(parentID, markup, toIndex) {
	  // NOTE: Null values reduce hidden classes.
	  updateQueue.push({
	    parentID: parentID,
	    parentNode: null,
	    type: ReactMultiChildUpdateTypes.INSERT_MARKUP,
	    markupIndex: markupQueue.push(markup) - 1,
	    textContent: null,
	    fromIndex: null,
	    toIndex: toIndex
	  });
	}

	/**
	 * Enqueues moving an existing element to another index.
	 *
	 * @param {string} parentID ID of the parent component.
	 * @param {number} fromIndex Source index of the existing element.
	 * @param {number} toIndex Destination index of the element.
	 * @private
	 */
	function enqueueMove(parentID, fromIndex, toIndex) {
	  // NOTE: Null values reduce hidden classes.
	  updateQueue.push({
	    parentID: parentID,
	    parentNode: null,
	    type: ReactMultiChildUpdateTypes.MOVE_EXISTING,
	    markupIndex: null,
	    textContent: null,
	    fromIndex: fromIndex,
	    toIndex: toIndex
	  });
	}

	/**
	 * Enqueues removing an element at an index.
	 *
	 * @param {string} parentID ID of the parent component.
	 * @param {number} fromIndex Index of the element to remove.
	 * @private
	 */
	function enqueueRemove(parentID, fromIndex) {
	  // NOTE: Null values reduce hidden classes.
	  updateQueue.push({
	    parentID: parentID,
	    parentNode: null,
	    type: ReactMultiChildUpdateTypes.REMOVE_NODE,
	    markupIndex: null,
	    textContent: null,
	    fromIndex: fromIndex,
	    toIndex: null
	  });
	}

	/**
	 * Enqueues setting the text content.
	 *
	 * @param {string} parentID ID of the parent component.
	 * @param {string} textContent Text content to set.
	 * @private
	 */
	function enqueueTextContent(parentID, textContent) {
	  // NOTE: Null values reduce hidden classes.
	  updateQueue.push({
	    parentID: parentID,
	    parentNode: null,
	    type: ReactMultiChildUpdateTypes.TEXT_CONTENT,
	    markupIndex: null,
	    textContent: textContent,
	    fromIndex: null,
	    toIndex: null
	  });
	}

	/**
	 * Processes any enqueued updates.
	 *
	 * @private
	 */
	function processQueue() {
	  if (updateQueue.length) {
	    ReactComponentEnvironment.processChildrenUpdates(
	      updateQueue,
	      markupQueue
	    );
	    clearQueue();
	  }
	}

	/**
	 * Clears any enqueued updates.
	 *
	 * @private
	 */
	function clearQueue() {
	  updateQueue.length = 0;
	  markupQueue.length = 0;
	}

	/**
	 * ReactMultiChild are capable of reconciling multiple children.
	 *
	 * @class ReactMultiChild
	 * @internal
	 */
	var ReactMultiChild = {

	  /**
	   * Provides common functionality for components that must reconcile multiple
	   * children. This is used by `ReactDOMComponent` to mount, update, and
	   * unmount child components.
	   *
	   * @lends {ReactMultiChild.prototype}
	   */
	  Mixin: {

	    /**
	     * Generates a "mount image" for each of the supplied children. In the case
	     * of `ReactDOMComponent`, a mount image is a string of markup.
	     *
	     * @param {?object} nestedChildren Nested child maps.
	     * @return {array} An array of mounted representations.
	     * @internal
	     */
	    mountChildren: function(nestedChildren, transaction, context) {
	      var children = ReactChildReconciler.instantiateChildren(
	        nestedChildren, transaction, context
	      );
	      this._renderedChildren = children;
	      var mountImages = [];
	      var index = 0;
	      for (var name in children) {
	        if (children.hasOwnProperty(name)) {
	          var child = children[name];
	          // Inlined for performance, see `ReactInstanceHandles.createReactID`.
	          var rootID = this._rootNodeID + name;
	          var mountImage = ReactReconciler.mountComponent(
	            child,
	            rootID,
	            transaction,
	            context
	          );
	          child._mountIndex = index;
	          mountImages.push(mountImage);
	          index++;
	        }
	      }
	      return mountImages;
	    },

	    /**
	     * Replaces any rendered children with a text content string.
	     *
	     * @param {string} nextContent String of content.
	     * @internal
	     */
	    updateTextContent: function(nextContent) {
	      updateDepth++;
	      var errorThrown = true;
	      try {
	        var prevChildren = this._renderedChildren;
	        // Remove any rendered children.
	        ReactChildReconciler.unmountChildren(prevChildren);
	        // TODO: The setTextContent operation should be enough
	        for (var name in prevChildren) {
	          if (prevChildren.hasOwnProperty(name)) {
	            this._unmountChildByName(prevChildren[name], name);
	          }
	        }
	        // Set new text content.
	        this.setTextContent(nextContent);
	        errorThrown = false;
	      } finally {
	        updateDepth--;
	        if (!updateDepth) {
	          if (errorThrown) {
	            clearQueue();
	          } else {
	            processQueue();
	          }
	        }
	      }
	    },

	    /**
	     * Updates the rendered children with new children.
	     *
	     * @param {?object} nextNestedChildren Nested child maps.
	     * @param {ReactReconcileTransaction} transaction
	     * @internal
	     */
	    updateChildren: function(nextNestedChildren, transaction, context) {
	      updateDepth++;
	      var errorThrown = true;
	      try {
	        this._updateChildren(nextNestedChildren, transaction, context);
	        errorThrown = false;
	      } finally {
	        updateDepth--;
	        if (!updateDepth) {
	          if (errorThrown) {
	            clearQueue();
	          } else {
	            processQueue();
	          }
	        }

	      }
	    },

	    /**
	     * Improve performance by isolating this hot code path from the try/catch
	     * block in `updateChildren`.
	     *
	     * @param {?object} nextNestedChildren Nested child maps.
	     * @param {ReactReconcileTransaction} transaction
	     * @final
	     * @protected
	     */
	    _updateChildren: function(nextNestedChildren, transaction, context) {
	      var prevChildren = this._renderedChildren;
	      var nextChildren = ReactChildReconciler.updateChildren(
	        prevChildren, nextNestedChildren, transaction, context
	      );
	      this._renderedChildren = nextChildren;
	      if (!nextChildren && !prevChildren) {
	        return;
	      }
	      var name;
	      // `nextIndex` will increment for each child in `nextChildren`, but
	      // `lastIndex` will be the last index visited in `prevChildren`.
	      var lastIndex = 0;
	      var nextIndex = 0;
	      for (name in nextChildren) {
	        if (!nextChildren.hasOwnProperty(name)) {
	          continue;
	        }
	        var prevChild = prevChildren && prevChildren[name];
	        var nextChild = nextChildren[name];
	        if (prevChild === nextChild) {
	          this.moveChild(prevChild, nextIndex, lastIndex);
	          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
	          prevChild._mountIndex = nextIndex;
	        } else {
	          if (prevChild) {
	            // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
	            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
	            this._unmountChildByName(prevChild, name);
	          }
	          // The child must be instantiated before it's mounted.
	          this._mountChildByNameAtIndex(
	            nextChild, name, nextIndex, transaction, context
	          );
	        }
	        nextIndex++;
	      }
	      // Remove children that are no longer present.
	      for (name in prevChildren) {
	        if (prevChildren.hasOwnProperty(name) &&
	            !(nextChildren && nextChildren.hasOwnProperty(name))) {
	          this._unmountChildByName(prevChildren[name], name);
	        }
	      }
	    },

	    /**
	     * Unmounts all rendered children. This should be used to clean up children
	     * when this component is unmounted.
	     *
	     * @internal
	     */
	    unmountChildren: function() {
	      var renderedChildren = this._renderedChildren;
	      ReactChildReconciler.unmountChildren(renderedChildren);
	      this._renderedChildren = null;
	    },

	    /**
	     * Moves a child component to the supplied index.
	     *
	     * @param {ReactComponent} child Component to move.
	     * @param {number} toIndex Destination index of the element.
	     * @param {number} lastIndex Last index visited of the siblings of `child`.
	     * @protected
	     */
	    moveChild: function(child, toIndex, lastIndex) {
	      // If the index of `child` is less than `lastIndex`, then it needs to
	      // be moved. Otherwise, we do not need to move it because a child will be
	      // inserted or moved before `child`.
	      if (child._mountIndex < lastIndex) {
	        enqueueMove(this._rootNodeID, child._mountIndex, toIndex);
	      }
	    },

	    /**
	     * Creates a child component.
	     *
	     * @param {ReactComponent} child Component to create.
	     * @param {string} mountImage Markup to insert.
	     * @protected
	     */
	    createChild: function(child, mountImage) {
	      enqueueMarkup(this._rootNodeID, mountImage, child._mountIndex);
	    },

	    /**
	     * Removes a child component.
	     *
	     * @param {ReactComponent} child Child to remove.
	     * @protected
	     */
	    removeChild: function(child) {
	      enqueueRemove(this._rootNodeID, child._mountIndex);
	    },

	    /**
	     * Sets this text content string.
	     *
	     * @param {string} textContent Text content to set.
	     * @protected
	     */
	    setTextContent: function(textContent) {
	      enqueueTextContent(this._rootNodeID, textContent);
	    },

	    /**
	     * Mounts a child with the supplied name.
	     *
	     * NOTE: This is part of `updateChildren` and is here for readability.
	     *
	     * @param {ReactComponent} child Component to mount.
	     * @param {string} name Name of the child.
	     * @param {number} index Index at which to insert the child.
	     * @param {ReactReconcileTransaction} transaction
	     * @private
	     */
	    _mountChildByNameAtIndex: function(
	      child,
	      name,
	      index,
	      transaction,
	      context) {
	      // Inlined for performance, see `ReactInstanceHandles.createReactID`.
	      var rootID = this._rootNodeID + name;
	      var mountImage = ReactReconciler.mountComponent(
	        child,
	        rootID,
	        transaction,
	        context
	      );
	      child._mountIndex = index;
	      this.createChild(child, mountImage);
	    },

	    /**
	     * Unmounts a rendered child by name.
	     *
	     * NOTE: This is part of `updateChildren` and is here for readability.
	     *
	     * @param {ReactComponent} child Component to unmount.
	     * @param {string} name Name of the child in `this._renderedChildren`.
	     * @private
	     */
	    _unmountChildByName: function(child, name) {
	      this.removeChild(child);
	      child._mountIndex = null;
	    }

	  }

	};

	module.exports = ReactMultiChild;

	},{"31":31,"36":36,"72":72,"81":81}],72:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactMultiChildUpdateTypes
	 */

	'use strict';

	var keyMirror = _dereq_(140);

	/**
	 * When a component's children are updated, a series of update configuration
	 * objects are created in order to batch and serialize the required changes.
	 *
	 * Enumerates all the possible types of update configurations.
	 *
	 * @internal
	 */
	var ReactMultiChildUpdateTypes = keyMirror({
	  INSERT_MARKUP: null,
	  MOVE_EXISTING: null,
	  REMOVE_NODE: null,
	  TEXT_CONTENT: null
	});

	module.exports = ReactMultiChildUpdateTypes;

	},{"140":140}],73:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactNativeComponent
	 */

	'use strict';

	var assign = _dereq_(27);
	var invariant = _dereq_(135);

	var autoGenerateWrapperClass = null;
	var genericComponentClass = null;
	// This registry keeps track of wrapper classes around native tags
	var tagToComponentClass = {};
	var textComponentClass = null;

	var ReactNativeComponentInjection = {
	  // This accepts a class that receives the tag string. This is a catch all
	  // that can render any kind of tag.
	  injectGenericComponentClass: function(componentClass) {
	    genericComponentClass = componentClass;
	  },
	  // This accepts a text component class that takes the text string to be
	  // rendered as props.
	  injectTextComponentClass: function(componentClass) {
	    textComponentClass = componentClass;
	  },
	  // This accepts a keyed object with classes as values. Each key represents a
	  // tag. That particular tag will use this class instead of the generic one.
	  injectComponentClasses: function(componentClasses) {
	    assign(tagToComponentClass, componentClasses);
	  },
	  // Temporary hack since we expect DOM refs to behave like composites,
	  // for this release.
	  injectAutoWrapper: function(wrapperFactory) {
	    autoGenerateWrapperClass = wrapperFactory;
	  }
	};

	/**
	 * Get a composite component wrapper class for a specific tag.
	 *
	 * @param {ReactElement} element The tag for which to get the class.
	 * @return {function} The React class constructor function.
	 */
	function getComponentClassForElement(element) {
	  if (typeof element.type === 'function') {
	    return element.type;
	  }
	  var tag = element.type;
	  var componentClass = tagToComponentClass[tag];
	  if (componentClass == null) {
	    tagToComponentClass[tag] = componentClass = autoGenerateWrapperClass(tag);
	  }
	  return componentClass;
	}

	/**
	 * Get a native internal component class for a specific tag.
	 *
	 * @param {ReactElement} element The element to create.
	 * @return {function} The internal class constructor function.
	 */
	function createInternalComponent(element) {
	  (true ? invariant(
	    genericComponentClass,
	    'There is no registered component for the tag %s',
	    element.type
	  ) : invariant(genericComponentClass));
	  return new genericComponentClass(element.type, element.props);
	}

	/**
	 * @param {ReactText} text
	 * @return {ReactComponent}
	 */
	function createInstanceForText(text) {
	  return new textComponentClass(text);
	}

	/**
	 * @param {ReactComponent} component
	 * @return {boolean}
	 */
	function isTextComponent(component) {
	  return component instanceof textComponentClass;
	}

	var ReactNativeComponent = {
	  getComponentClassForElement: getComponentClassForElement,
	  createInternalComponent: createInternalComponent,
	  createInstanceForText: createInstanceForText,
	  isTextComponent: isTextComponent,
	  injection: ReactNativeComponentInjection
	};

	module.exports = ReactNativeComponent;

	},{"135":135,"27":27}],74:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactOwner
	 */

	'use strict';

	var invariant = _dereq_(135);

	/**
	 * ReactOwners are capable of storing references to owned components.
	 *
	 * All components are capable of //being// referenced by owner components, but
	 * only ReactOwner components are capable of //referencing// owned components.
	 * The named reference is known as a "ref".
	 *
	 * Refs are available when mounted and updated during reconciliation.
	 *
	 *   var MyComponent = React.createClass({
	 *     render: function() {
	 *       return (
	 *         <div onClick={this.handleClick}>
	 *           <CustomComponent ref="custom" />
	 *         </div>
	 *       );
	 *     },
	 *     handleClick: function() {
	 *       this.refs.custom.handleClick();
	 *     },
	 *     componentDidMount: function() {
	 *       this.refs.custom.initialize();
	 *     }
	 *   });
	 *
	 * Refs should rarely be used. When refs are used, they should only be done to
	 * control data that is not handled by React's data flow.
	 *
	 * @class ReactOwner
	 */
	var ReactOwner = {

	  /**
	   * @param {?object} object
	   * @return {boolean} True if `object` is a valid owner.
	   * @final
	   */
	  isValidOwner: function(object) {
	    return !!(
	      (object &&
	      typeof object.attachRef === 'function' && typeof object.detachRef === 'function')
	    );
	  },

	  /**
	   * Adds a component by ref to an owner component.
	   *
	   * @param {ReactComponent} component Component to reference.
	   * @param {string} ref Name by which to refer to the component.
	   * @param {ReactOwner} owner Component on which to record the ref.
	   * @final
	   * @internal
	   */
	  addComponentAsRefTo: function(component, ref, owner) {
	    (true ? invariant(
	      ReactOwner.isValidOwner(owner),
	      'addComponentAsRefTo(...): Only a ReactOwner can have refs. This ' +
	      'usually means that you\'re trying to add a ref to a component that ' +
	      'doesn\'t have an owner (that is, was not created inside of another ' +
	      'component\'s `render` method). Try rendering this component inside of ' +
	      'a new top-level component which will hold the ref.'
	    ) : invariant(ReactOwner.isValidOwner(owner)));
	    owner.attachRef(ref, component);
	  },

	  /**
	   * Removes a component by ref from an owner component.
	   *
	   * @param {ReactComponent} component Component to dereference.
	   * @param {string} ref Name of the ref to remove.
	   * @param {ReactOwner} owner Component on which the ref is recorded.
	   * @final
	   * @internal
	   */
	  removeComponentAsRefFrom: function(component, ref, owner) {
	    (true ? invariant(
	      ReactOwner.isValidOwner(owner),
	      'removeComponentAsRefFrom(...): Only a ReactOwner can have refs. This ' +
	      'usually means that you\'re trying to remove a ref to a component that ' +
	      'doesn\'t have an owner (that is, was not created inside of another ' +
	      'component\'s `render` method). Try rendering this component inside of ' +
	      'a new top-level component which will hold the ref.'
	    ) : invariant(ReactOwner.isValidOwner(owner)));
	    // Check that `component` is still the current ref because we do not want to
	    // detach the ref if another component stole it.
	    if (owner.getPublicInstance().refs[ref] === component.getPublicInstance()) {
	      owner.detachRef(ref);
	    }
	  }

	};

	module.exports = ReactOwner;

	},{"135":135}],75:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactPerf
	 * @typechecks static-only
	 */

	'use strict';

	/**
	 * ReactPerf is a general AOP system designed to measure performance. This
	 * module only has the hooks: see ReactDefaultPerf for the analysis tool.
	 */
	var ReactPerf = {
	  /**
	   * Boolean to enable/disable measurement. Set to false by default to prevent
	   * accidental logging and perf loss.
	   */
	  enableMeasure: false,

	  /**
	   * Holds onto the measure function in use. By default, don't measure
	   * anything, but we'll override this if we inject a measure function.
	   */
	  storedMeasure: _noMeasure,

	  /**
	   * @param {object} object
	   * @param {string} objectName
	   * @param {object<string>} methodNames
	   */
	  measureMethods: function(object, objectName, methodNames) {
	    if (true) {
	      for (var key in methodNames) {
	        if (!methodNames.hasOwnProperty(key)) {
	          continue;
	        }
	        object[key] = ReactPerf.measure(
	          objectName,
	          methodNames[key],
	          object[key]
	        );
	      }
	    }
	  },

	  /**
	   * Use this to wrap methods you want to measure. Zero overhead in production.
	   *
	   * @param {string} objName
	   * @param {string} fnName
	   * @param {function} func
	   * @return {function}
	   */
	  measure: function(objName, fnName, func) {
	    if (true) {
	      var measuredFunc = null;
	      var wrapper = function() {
	        if (ReactPerf.enableMeasure) {
	          if (!measuredFunc) {
	            measuredFunc = ReactPerf.storedMeasure(objName, fnName, func);
	          }
	          return measuredFunc.apply(this, arguments);
	        }
	        return func.apply(this, arguments);
	      };
	      wrapper.displayName = objName + '_' + fnName;
	      return wrapper;
	    }
	    return func;
	  },

	  injection: {
	    /**
	     * @param {function} measure
	     */
	    injectMeasure: function(measure) {
	      ReactPerf.storedMeasure = measure;
	    }
	  }
	};

	/**
	 * Simply passes through the measured function, without measuring it.
	 *
	 * @param {string} objName
	 * @param {string} fnName
	 * @param {function} func
	 * @return {function}
	 */
	function _noMeasure(objName, fnName, func) {
	  return func;
	}

	module.exports = ReactPerf;

	},{}],76:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactPropTypeLocationNames
	 */

	'use strict';

	var ReactPropTypeLocationNames = {};

	if (true) {
	  ReactPropTypeLocationNames = {
	    prop: 'prop',
	    context: 'context',
	    childContext: 'child context'
	  };
	}

	module.exports = ReactPropTypeLocationNames;

	},{}],77:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactPropTypeLocations
	 */

	'use strict';

	var keyMirror = _dereq_(140);

	var ReactPropTypeLocations = keyMirror({
	  prop: null,
	  context: null,
	  childContext: null
	});

	module.exports = ReactPropTypeLocations;

	},{"140":140}],78:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactPropTypes
	 */

	'use strict';

	var ReactElement = _dereq_(57);
	var ReactFragment = _dereq_(63);
	var ReactPropTypeLocationNames = _dereq_(76);

	var emptyFunction = _dereq_(114);

	/**
	 * Collection of methods that allow declaration and validation of props that are
	 * supplied to React components. Example usage:
	 *
	 *   var Props = require('ReactPropTypes');
	 *   var MyArticle = React.createClass({
	 *     propTypes: {
	 *       // An optional string prop named "description".
	 *       description: Props.string,
	 *
	 *       // A required enum prop named "category".
	 *       category: Props.oneOf(['News','Photos']).isRequired,
	 *
	 *       // A prop named "dialog" that requires an instance of Dialog.
	 *       dialog: Props.instanceOf(Dialog).isRequired
	 *     },
	 *     render: function() { ... }
	 *   });
	 *
	 * A more formal specification of how these methods are used:
	 *
	 *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
	 *   decl := ReactPropTypes.{type}(.isRequired)?
	 *
	 * Each and every declaration produces a function with the same signature. This
	 * allows the creation of custom validation functions. For example:
	 *
	 *  var MyLink = React.createClass({
	 *    propTypes: {
	 *      // An optional string or URI prop named "href".
	 *      href: function(props, propName, componentName) {
	 *        var propValue = props[propName];
	 *        if (propValue != null && typeof propValue !== 'string' &&
	 *            !(propValue instanceof URI)) {
	 *          return new Error(
	 *            'Expected a string or an URI for ' + propName + ' in ' +
	 *            componentName
	 *          );
	 *        }
	 *      }
	 *    },
	 *    render: function() {...}
	 *  });
	 *
	 * @internal
	 */

	var ANONYMOUS = '<<anonymous>>';

	var elementTypeChecker = createElementTypeChecker();
	var nodeTypeChecker = createNodeChecker();

	var ReactPropTypes = {
	  array: createPrimitiveTypeChecker('array'),
	  bool: createPrimitiveTypeChecker('boolean'),
	  func: createPrimitiveTypeChecker('function'),
	  number: createPrimitiveTypeChecker('number'),
	  object: createPrimitiveTypeChecker('object'),
	  string: createPrimitiveTypeChecker('string'),

	  any: createAnyTypeChecker(),
	  arrayOf: createArrayOfTypeChecker,
	  element: elementTypeChecker,
	  instanceOf: createInstanceTypeChecker,
	  node: nodeTypeChecker,
	  objectOf: createObjectOfTypeChecker,
	  oneOf: createEnumTypeChecker,
	  oneOfType: createUnionTypeChecker,
	  shape: createShapeTypeChecker
	};

	function createChainableTypeChecker(validate) {
	  function checkType(isRequired, props, propName, componentName, location) {
	    componentName = componentName || ANONYMOUS;
	    if (props[propName] == null) {
	      var locationName = ReactPropTypeLocationNames[location];
	      if (isRequired) {
	        return new Error(
	          ("Required " + locationName + " `" + propName + "` was not specified in ") +
	          ("`" + componentName + "`.")
	        );
	      }
	      return null;
	    } else {
	      return validate(props, propName, componentName, location);
	    }
	  }

	  var chainedCheckType = checkType.bind(null, false);
	  chainedCheckType.isRequired = checkType.bind(null, true);

	  return chainedCheckType;
	}

	function createPrimitiveTypeChecker(expectedType) {
	  function validate(props, propName, componentName, location) {
	    var propValue = props[propName];
	    var propType = getPropType(propValue);
	    if (propType !== expectedType) {
	      var locationName = ReactPropTypeLocationNames[location];
	      // `propValue` being instance of, say, date/regexp, pass the 'object'
	      // check, but we can offer a more precise error message here rather than
	      // 'of type `object`'.
	      var preciseType = getPreciseType(propValue);

	      return new Error(
	        ("Invalid " + locationName + " `" + propName + "` of type `" + preciseType + "` ") +
	        ("supplied to `" + componentName + "`, expected `" + expectedType + "`.")
	      );
	    }
	    return null;
	  }
	  return createChainableTypeChecker(validate);
	}

	function createAnyTypeChecker() {
	  return createChainableTypeChecker(emptyFunction.thatReturns(null));
	}

	function createArrayOfTypeChecker(typeChecker) {
	  function validate(props, propName, componentName, location) {
	    var propValue = props[propName];
	    if (!Array.isArray(propValue)) {
	      var locationName = ReactPropTypeLocationNames[location];
	      var propType = getPropType(propValue);
	      return new Error(
	        ("Invalid " + locationName + " `" + propName + "` of type ") +
	        ("`" + propType + "` supplied to `" + componentName + "`, expected an array.")
	      );
	    }
	    for (var i = 0; i < propValue.length; i++) {
	      var error = typeChecker(propValue, i, componentName, location);
	      if (error instanceof Error) {
	        return error;
	      }
	    }
	    return null;
	  }
	  return createChainableTypeChecker(validate);
	}

	function createElementTypeChecker() {
	  function validate(props, propName, componentName, location) {
	    if (!ReactElement.isValidElement(props[propName])) {
	      var locationName = ReactPropTypeLocationNames[location];
	      return new Error(
	        ("Invalid " + locationName + " `" + propName + "` supplied to ") +
	        ("`" + componentName + "`, expected a ReactElement.")
	      );
	    }
	    return null;
	  }
	  return createChainableTypeChecker(validate);
	}

	function createInstanceTypeChecker(expectedClass) {
	  function validate(props, propName, componentName, location) {
	    if (!(props[propName] instanceof expectedClass)) {
	      var locationName = ReactPropTypeLocationNames[location];
	      var expectedClassName = expectedClass.name || ANONYMOUS;
	      return new Error(
	        ("Invalid " + locationName + " `" + propName + "` supplied to ") +
	        ("`" + componentName + "`, expected instance of `" + expectedClassName + "`.")
	      );
	    }
	    return null;
	  }
	  return createChainableTypeChecker(validate);
	}

	function createEnumTypeChecker(expectedValues) {
	  function validate(props, propName, componentName, location) {
	    var propValue = props[propName];
	    for (var i = 0; i < expectedValues.length; i++) {
	      if (propValue === expectedValues[i]) {
	        return null;
	      }
	    }

	    var locationName = ReactPropTypeLocationNames[location];
	    var valuesString = JSON.stringify(expectedValues);
	    return new Error(
	      ("Invalid " + locationName + " `" + propName + "` of value `" + propValue + "` ") +
	      ("supplied to `" + componentName + "`, expected one of " + valuesString + ".")
	    );
	  }
	  return createChainableTypeChecker(validate);
	}

	function createObjectOfTypeChecker(typeChecker) {
	  function validate(props, propName, componentName, location) {
	    var propValue = props[propName];
	    var propType = getPropType(propValue);
	    if (propType !== 'object') {
	      var locationName = ReactPropTypeLocationNames[location];
	      return new Error(
	        ("Invalid " + locationName + " `" + propName + "` of type ") +
	        ("`" + propType + "` supplied to `" + componentName + "`, expected an object.")
	      );
	    }
	    for (var key in propValue) {
	      if (propValue.hasOwnProperty(key)) {
	        var error = typeChecker(propValue, key, componentName, location);
	        if (error instanceof Error) {
	          return error;
	        }
	      }
	    }
	    return null;
	  }
	  return createChainableTypeChecker(validate);
	}

	function createUnionTypeChecker(arrayOfTypeCheckers) {
	  function validate(props, propName, componentName, location) {
	    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
	      var checker = arrayOfTypeCheckers[i];
	      if (checker(props, propName, componentName, location) == null) {
	        return null;
	      }
	    }

	    var locationName = ReactPropTypeLocationNames[location];
	    return new Error(
	      ("Invalid " + locationName + " `" + propName + "` supplied to ") +
	      ("`" + componentName + "`.")
	    );
	  }
	  return createChainableTypeChecker(validate);
	}

	function createNodeChecker() {
	  function validate(props, propName, componentName, location) {
	    if (!isNode(props[propName])) {
	      var locationName = ReactPropTypeLocationNames[location];
	      return new Error(
	        ("Invalid " + locationName + " `" + propName + "` supplied to ") +
	        ("`" + componentName + "`, expected a ReactNode.")
	      );
	    }
	    return null;
	  }
	  return createChainableTypeChecker(validate);
	}

	function createShapeTypeChecker(shapeTypes) {
	  function validate(props, propName, componentName, location) {
	    var propValue = props[propName];
	    var propType = getPropType(propValue);
	    if (propType !== 'object') {
	      var locationName = ReactPropTypeLocationNames[location];
	      return new Error(
	        ("Invalid " + locationName + " `" + propName + "` of type `" + propType + "` ") +
	        ("supplied to `" + componentName + "`, expected `object`.")
	      );
	    }
	    for (var key in shapeTypes) {
	      var checker = shapeTypes[key];
	      if (!checker) {
	        continue;
	      }
	      var error = checker(propValue, key, componentName, location);
	      if (error) {
	        return error;
	      }
	    }
	    return null;
	  }
	  return createChainableTypeChecker(validate);
	}

	function isNode(propValue) {
	  switch (typeof propValue) {
	    case 'number':
	    case 'string':
	    case 'undefined':
	      return true;
	    case 'boolean':
	      return !propValue;
	    case 'object':
	      if (Array.isArray(propValue)) {
	        return propValue.every(isNode);
	      }
	      if (propValue === null || ReactElement.isValidElement(propValue)) {
	        return true;
	      }
	      propValue = ReactFragment.extractIfFragment(propValue);
	      for (var k in propValue) {
	        if (!isNode(propValue[k])) {
	          return false;
	        }
	      }
	      return true;
	    default:
	      return false;
	  }
	}

	// Equivalent of `typeof` but with special handling for array and regexp.
	function getPropType(propValue) {
	  var propType = typeof propValue;
	  if (Array.isArray(propValue)) {
	    return 'array';
	  }
	  if (propValue instanceof RegExp) {
	    // Old webkits (at least until Android 4.0) return 'function' rather than
	    // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
	    // passes PropTypes.object.
	    return 'object';
	  }
	  return propType;
	}

	// This handles more types than `getPropType`. Only used for error messages.
	// See `createPrimitiveTypeChecker`.
	function getPreciseType(propValue) {
	  var propType = getPropType(propValue);
	  if (propType === 'object') {
	    if (propValue instanceof Date) {
	      return 'date';
	    } else if (propValue instanceof RegExp) {
	      return 'regexp';
	    }
	  }
	  return propType;
	}

	module.exports = ReactPropTypes;

	},{"114":114,"57":57,"63":63,"76":76}],79:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactPutListenerQueue
	 */

	'use strict';

	var PooledClass = _dereq_(28);
	var ReactBrowserEventEmitter = _dereq_(30);

	var assign = _dereq_(27);

	function ReactPutListenerQueue() {
	  this.listenersToPut = [];
	}

	assign(ReactPutListenerQueue.prototype, {
	  enqueuePutListener: function(rootNodeID, propKey, propValue) {
	    this.listenersToPut.push({
	      rootNodeID: rootNodeID,
	      propKey: propKey,
	      propValue: propValue
	    });
	  },

	  putListeners: function() {
	    for (var i = 0; i < this.listenersToPut.length; i++) {
	      var listenerToPut = this.listenersToPut[i];
	      ReactBrowserEventEmitter.putListener(
	        listenerToPut.rootNodeID,
	        listenerToPut.propKey,
	        listenerToPut.propValue
	      );
	    }
	  },

	  reset: function() {
	    this.listenersToPut.length = 0;
	  },

	  destructor: function() {
	    this.reset();
	  }
	});

	PooledClass.addPoolingTo(ReactPutListenerQueue);

	module.exports = ReactPutListenerQueue;

	},{"27":27,"28":28,"30":30}],80:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactReconcileTransaction
	 * @typechecks static-only
	 */

	'use strict';

	var CallbackQueue = _dereq_(6);
	var PooledClass = _dereq_(28);
	var ReactBrowserEventEmitter = _dereq_(30);
	var ReactInputSelection = _dereq_(65);
	var ReactPutListenerQueue = _dereq_(79);
	var Transaction = _dereq_(103);

	var assign = _dereq_(27);

	/**
	 * Ensures that, when possible, the selection range (currently selected text
	 * input) is not disturbed by performing the transaction.
	 */
	var SELECTION_RESTORATION = {
	  /**
	   * @return {Selection} Selection information.
	   */
	  initialize: ReactInputSelection.getSelectionInformation,
	  /**
	   * @param {Selection} sel Selection information returned from `initialize`.
	   */
	  close: ReactInputSelection.restoreSelection
	};

	/**
	 * Suppresses events (blur/focus) that could be inadvertently dispatched due to
	 * high level DOM manipulations (like temporarily removing a text input from the
	 * DOM).
	 */
	var EVENT_SUPPRESSION = {
	  /**
	   * @return {boolean} The enabled status of `ReactBrowserEventEmitter` before
	   * the reconciliation.
	   */
	  initialize: function() {
	    var currentlyEnabled = ReactBrowserEventEmitter.isEnabled();
	    ReactBrowserEventEmitter.setEnabled(false);
	    return currentlyEnabled;
	  },

	  /**
	   * @param {boolean} previouslyEnabled Enabled status of
	   *   `ReactBrowserEventEmitter` before the reconciliation occured. `close`
	   *   restores the previous value.
	   */
	  close: function(previouslyEnabled) {
	    ReactBrowserEventEmitter.setEnabled(previouslyEnabled);
	  }
	};

	/**
	 * Provides a queue for collecting `componentDidMount` and
	 * `componentDidUpdate` callbacks during the the transaction.
	 */
	var ON_DOM_READY_QUEUEING = {
	  /**
	   * Initializes the internal `onDOMReady` queue.
	   */
	  initialize: function() {
	    this.reactMountReady.reset();
	  },

	  /**
	   * After DOM is flushed, invoke all registered `onDOMReady` callbacks.
	   */
	  close: function() {
	    this.reactMountReady.notifyAll();
	  }
	};

	var PUT_LISTENER_QUEUEING = {
	  initialize: function() {
	    this.putListenerQueue.reset();
	  },

	  close: function() {
	    this.putListenerQueue.putListeners();
	  }
	};

	/**
	 * Executed within the scope of the `Transaction` instance. Consider these as
	 * being member methods, but with an implied ordering while being isolated from
	 * each other.
	 */
	var TRANSACTION_WRAPPERS = [
	  PUT_LISTENER_QUEUEING,
	  SELECTION_RESTORATION,
	  EVENT_SUPPRESSION,
	  ON_DOM_READY_QUEUEING
	];

	/**
	 * Currently:
	 * - The order that these are listed in the transaction is critical:
	 * - Suppresses events.
	 * - Restores selection range.
	 *
	 * Future:
	 * - Restore document/overflow scroll positions that were unintentionally
	 *   modified via DOM insertions above the top viewport boundary.
	 * - Implement/integrate with customized constraint based layout system and keep
	 *   track of which dimensions must be remeasured.
	 *
	 * @class ReactReconcileTransaction
	 */
	function ReactReconcileTransaction() {
	  this.reinitializeTransaction();
	  // Only server-side rendering really needs this option (see
	  // `ReactServerRendering`), but server-side uses
	  // `ReactServerRenderingTransaction` instead. This option is here so that it's
	  // accessible and defaults to false when `ReactDOMComponent` and
	  // `ReactTextComponent` checks it in `mountComponent`.`
	  this.renderToStaticMarkup = false;
	  this.reactMountReady = CallbackQueue.getPooled(null);
	  this.putListenerQueue = ReactPutListenerQueue.getPooled();
	}

	var Mixin = {
	  /**
	   * @see Transaction
	   * @abstract
	   * @final
	   * @return {array<object>} List of operation wrap proceedures.
	   *   TODO: convert to array<TransactionWrapper>
	   */
	  getTransactionWrappers: function() {
	    return TRANSACTION_WRAPPERS;
	  },

	  /**
	   * @return {object} The queue to collect `onDOMReady` callbacks with.
	   */
	  getReactMountReady: function() {
	    return this.reactMountReady;
	  },

	  getPutListenerQueue: function() {
	    return this.putListenerQueue;
	  },

	  /**
	   * `PooledClass` looks for this, and will invoke this before allowing this
	   * instance to be resused.
	   */
	  destructor: function() {
	    CallbackQueue.release(this.reactMountReady);
	    this.reactMountReady = null;

	    ReactPutListenerQueue.release(this.putListenerQueue);
	    this.putListenerQueue = null;
	  }
	};


	assign(ReactReconcileTransaction.prototype, Transaction.Mixin, Mixin);

	PooledClass.addPoolingTo(ReactReconcileTransaction);

	module.exports = ReactReconcileTransaction;

	},{"103":103,"27":27,"28":28,"30":30,"6":6,"65":65,"79":79}],81:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactReconciler
	 */

	'use strict';

	var ReactRef = _dereq_(82);
	var ReactElementValidator = _dereq_(58);

	/**
	 * Helper to call ReactRef.attachRefs with this composite component, split out
	 * to avoid allocations in the transaction mount-ready queue.
	 */
	function attachRefs() {
	  ReactRef.attachRefs(this, this._currentElement);
	}

	var ReactReconciler = {

	  /**
	   * Initializes the component, renders markup, and registers event listeners.
	   *
	   * @param {ReactComponent} internalInstance
	   * @param {string} rootID DOM ID of the root node.
	   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
	   * @return {?string} Rendered markup to be inserted into the DOM.
	   * @final
	   * @internal
	   */
	  mountComponent: function(internalInstance, rootID, transaction, context) {
	    var markup = internalInstance.mountComponent(rootID, transaction, context);
	    if (true) {
	      ReactElementValidator.checkAndWarnForMutatedProps(
	        internalInstance._currentElement
	      );
	    }
	    transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
	    return markup;
	  },

	  /**
	   * Releases any resources allocated by `mountComponent`.
	   *
	   * @final
	   * @internal
	   */
	  unmountComponent: function(internalInstance) {
	    ReactRef.detachRefs(internalInstance, internalInstance._currentElement);
	    internalInstance.unmountComponent();
	  },

	  /**
	   * Update a component using a new element.
	   *
	   * @param {ReactComponent} internalInstance
	   * @param {ReactElement} nextElement
	   * @param {ReactReconcileTransaction} transaction
	   * @param {object} context
	   * @internal
	   */
	  receiveComponent: function(
	    internalInstance, nextElement, transaction, context
	  ) {
	    var prevElement = internalInstance._currentElement;

	    if (nextElement === prevElement && nextElement._owner != null) {
	      // Since elements are immutable after the owner is rendered,
	      // we can do a cheap identity compare here to determine if this is a
	      // superfluous reconcile. It's possible for state to be mutable but such
	      // change should trigger an update of the owner which would recreate
	      // the element. We explicitly check for the existence of an owner since
	      // it's possible for an element created outside a composite to be
	      // deeply mutated and reused.
	      return;
	    }

	    if (true) {
	      ReactElementValidator.checkAndWarnForMutatedProps(nextElement);
	    }

	    var refsChanged = ReactRef.shouldUpdateRefs(
	      prevElement,
	      nextElement
	    );

	    if (refsChanged) {
	      ReactRef.detachRefs(internalInstance, prevElement);
	    }

	    internalInstance.receiveComponent(nextElement, transaction, context);

	    if (refsChanged) {
	      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
	    }
	  },

	  /**
	   * Flush any dirty changes in a component.
	   *
	   * @param {ReactComponent} internalInstance
	   * @param {ReactReconcileTransaction} transaction
	   * @internal
	   */
	  performUpdateIfNecessary: function(
	    internalInstance,
	    transaction
	  ) {
	    internalInstance.performUpdateIfNecessary(transaction);
	  }

	};

	module.exports = ReactReconciler;

	},{"58":58,"82":82}],82:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactRef
	 */

	'use strict';

	var ReactOwner = _dereq_(74);

	var ReactRef = {};

	function attachRef(ref, component, owner) {
	  if (typeof ref === 'function') {
	    ref(component.getPublicInstance());
	  } else {
	    // Legacy ref
	    ReactOwner.addComponentAsRefTo(component, ref, owner);
	  }
	}

	function detachRef(ref, component, owner) {
	  if (typeof ref === 'function') {
	    ref(null);
	  } else {
	    // Legacy ref
	    ReactOwner.removeComponentAsRefFrom(component, ref, owner);
	  }
	}

	ReactRef.attachRefs = function(instance, element) {
	  var ref = element.ref;
	  if (ref != null) {
	    attachRef(ref, instance, element._owner);
	  }
	};

	ReactRef.shouldUpdateRefs = function(prevElement, nextElement) {
	  // If either the owner or a `ref` has changed, make sure the newest owner
	  // has stored a reference to `this`, and the previous owner (if different)
	  // has forgotten the reference to `this`. We use the element instead
	  // of the public this.props because the post processing cannot determine
	  // a ref. The ref conceptually lives on the element.

	  // TODO: Should this even be possible? The owner cannot change because
	  // it's forbidden by shouldUpdateReactComponent. The ref can change
	  // if you swap the keys of but not the refs. Reconsider where this check
	  // is made. It probably belongs where the key checking and
	  // instantiateReactComponent is done.

	  return (
	    nextElement._owner !== prevElement._owner ||
	    nextElement.ref !== prevElement.ref
	  );
	};

	ReactRef.detachRefs = function(instance, element) {
	  var ref = element.ref;
	  if (ref != null) {
	    detachRef(ref, instance, element._owner);
	  }
	};

	module.exports = ReactRef;

	},{"74":74}],83:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactRootIndex
	 * @typechecks
	 */

	'use strict';

	var ReactRootIndexInjection = {
	  /**
	   * @param {function} _createReactRootIndex
	   */
	  injectCreateReactRootIndex: function(_createReactRootIndex) {
	    ReactRootIndex.createReactRootIndex = _createReactRootIndex;
	  }
	};

	var ReactRootIndex = {
	  createReactRootIndex: null,
	  injection: ReactRootIndexInjection
	};

	module.exports = ReactRootIndex;

	},{}],84:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @typechecks static-only
	 * @providesModule ReactServerRendering
	 */
	'use strict';

	var ReactElement = _dereq_(57);
	var ReactInstanceHandles = _dereq_(66);
	var ReactMarkupChecksum = _dereq_(69);
	var ReactServerRenderingTransaction =
	  _dereq_(85);

	var emptyObject = _dereq_(115);
	var instantiateReactComponent = _dereq_(134);
	var invariant = _dereq_(135);

	/**
	 * @param {ReactElement} element
	 * @return {string} the HTML markup
	 */
	function renderToString(element) {
	  (true ? invariant(
	    ReactElement.isValidElement(element),
	    'renderToString(): You must pass a valid ReactElement.'
	  ) : invariant(ReactElement.isValidElement(element)));

	  var transaction;
	  try {
	    var id = ReactInstanceHandles.createReactRootID();
	    transaction = ReactServerRenderingTransaction.getPooled(false);

	    return transaction.perform(function() {
	      var componentInstance = instantiateReactComponent(element, null);
	      var markup =
	        componentInstance.mountComponent(id, transaction, emptyObject);
	      return ReactMarkupChecksum.addChecksumToMarkup(markup);
	    }, null);
	  } finally {
	    ReactServerRenderingTransaction.release(transaction);
	  }
	}

	/**
	 * @param {ReactElement} element
	 * @return {string} the HTML markup, without the extra React ID and checksum
	 * (for generating static pages)
	 */
	function renderToStaticMarkup(element) {
	  (true ? invariant(
	    ReactElement.isValidElement(element),
	    'renderToStaticMarkup(): You must pass a valid ReactElement.'
	  ) : invariant(ReactElement.isValidElement(element)));

	  var transaction;
	  try {
	    var id = ReactInstanceHandles.createReactRootID();
	    transaction = ReactServerRenderingTransaction.getPooled(true);

	    return transaction.perform(function() {
	      var componentInstance = instantiateReactComponent(element, null);
	      return componentInstance.mountComponent(id, transaction, emptyObject);
	    }, null);
	  } finally {
	    ReactServerRenderingTransaction.release(transaction);
	  }
	}

	module.exports = {
	  renderToString: renderToString,
	  renderToStaticMarkup: renderToStaticMarkup
	};

	},{"115":115,"134":134,"135":135,"57":57,"66":66,"69":69,"85":85}],85:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactServerRenderingTransaction
	 * @typechecks
	 */

	'use strict';

	var PooledClass = _dereq_(28);
	var CallbackQueue = _dereq_(6);
	var ReactPutListenerQueue = _dereq_(79);
	var Transaction = _dereq_(103);

	var assign = _dereq_(27);
	var emptyFunction = _dereq_(114);

	/**
	 * Provides a `CallbackQueue` queue for collecting `onDOMReady` callbacks
	 * during the performing of the transaction.
	 */
	var ON_DOM_READY_QUEUEING = {
	  /**
	   * Initializes the internal `onDOMReady` queue.
	   */
	  initialize: function() {
	    this.reactMountReady.reset();
	  },

	  close: emptyFunction
	};

	var PUT_LISTENER_QUEUEING = {
	  initialize: function() {
	    this.putListenerQueue.reset();
	  },

	  close: emptyFunction
	};

	/**
	 * Executed within the scope of the `Transaction` instance. Consider these as
	 * being member methods, but with an implied ordering while being isolated from
	 * each other.
	 */
	var TRANSACTION_WRAPPERS = [
	  PUT_LISTENER_QUEUEING,
	  ON_DOM_READY_QUEUEING
	];

	/**
	 * @class ReactServerRenderingTransaction
	 * @param {boolean} renderToStaticMarkup
	 */
	function ReactServerRenderingTransaction(renderToStaticMarkup) {
	  this.reinitializeTransaction();
	  this.renderToStaticMarkup = renderToStaticMarkup;
	  this.reactMountReady = CallbackQueue.getPooled(null);
	  this.putListenerQueue = ReactPutListenerQueue.getPooled();
	}

	var Mixin = {
	  /**
	   * @see Transaction
	   * @abstract
	   * @final
	   * @return {array} Empty list of operation wrap proceedures.
	   */
	  getTransactionWrappers: function() {
	    return TRANSACTION_WRAPPERS;
	  },

	  /**
	   * @return {object} The queue to collect `onDOMReady` callbacks with.
	   */
	  getReactMountReady: function() {
	    return this.reactMountReady;
	  },

	  getPutListenerQueue: function() {
	    return this.putListenerQueue;
	  },

	  /**
	   * `PooledClass` looks for this, and will invoke this before allowing this
	   * instance to be resused.
	   */
	  destructor: function() {
	    CallbackQueue.release(this.reactMountReady);
	    this.reactMountReady = null;

	    ReactPutListenerQueue.release(this.putListenerQueue);
	    this.putListenerQueue = null;
	  }
	};


	assign(
	  ReactServerRenderingTransaction.prototype,
	  Transaction.Mixin,
	  Mixin
	);

	PooledClass.addPoolingTo(ReactServerRenderingTransaction);

	module.exports = ReactServerRenderingTransaction;

	},{"103":103,"114":114,"27":27,"28":28,"6":6,"79":79}],86:[function(_dereq_,module,exports){
	/**
	 * Copyright 2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactUpdateQueue
	 */

	'use strict';

	var ReactLifeCycle = _dereq_(68);
	var ReactCurrentOwner = _dereq_(39);
	var ReactElement = _dereq_(57);
	var ReactInstanceMap = _dereq_(67);
	var ReactUpdates = _dereq_(87);

	var assign = _dereq_(27);
	var invariant = _dereq_(135);
	var warning = _dereq_(154);

	function enqueueUpdate(internalInstance) {
	  if (internalInstance !== ReactLifeCycle.currentlyMountingInstance) {
	    // If we're in a componentWillMount handler, don't enqueue a rerender
	    // because ReactUpdates assumes we're in a browser context (which is
	    // wrong for server rendering) and we're about to do a render anyway.
	    // See bug in #1740.
	    ReactUpdates.enqueueUpdate(internalInstance);
	  }
	}

	function getInternalInstanceReadyForUpdate(publicInstance, callerName) {
	  (true ? invariant(
	    ReactCurrentOwner.current == null,
	    '%s(...): Cannot update during an existing state transition ' +
	    '(such as within `render`). Render methods should be a pure function ' +
	    'of props and state.',
	    callerName
	  ) : invariant(ReactCurrentOwner.current == null));

	  var internalInstance = ReactInstanceMap.get(publicInstance);
	  if (!internalInstance) {
	    if (true) {
	      // Only warn when we have a callerName. Otherwise we should be silent.
	      // We're probably calling from enqueueCallback. We don't want to warn
	      // there because we already warned for the corresponding lifecycle method.
	      (true ? warning(
	        !callerName,
	        '%s(...): Can only update a mounted or mounting component. ' +
	        'This usually means you called %s() on an unmounted ' +
	        'component. This is a no-op.',
	        callerName,
	        callerName
	      ) : null);
	    }
	    return null;
	  }

	  if (internalInstance === ReactLifeCycle.currentlyUnmountingInstance) {
	    return null;
	  }

	  return internalInstance;
	}

	/**
	 * ReactUpdateQueue allows for state updates to be scheduled into a later
	 * reconciliation step.
	 */
	var ReactUpdateQueue = {

	  /**
	   * Enqueue a callback that will be executed after all the pending updates
	   * have processed.
	   *
	   * @param {ReactClass} publicInstance The instance to use as `this` context.
	   * @param {?function} callback Called after state is updated.
	   * @internal
	   */
	  enqueueCallback: function(publicInstance, callback) {
	    (true ? invariant(
	      typeof callback === 'function',
	      'enqueueCallback(...): You called `setProps`, `replaceProps`, ' +
	      '`setState`, `replaceState`, or `forceUpdate` with a callback that ' +
	      'isn\'t callable.'
	    ) : invariant(typeof callback === 'function'));
	    var internalInstance = getInternalInstanceReadyForUpdate(publicInstance);

	    // Previously we would throw an error if we didn't have an internal
	    // instance. Since we want to make it a no-op instead, we mirror the same
	    // behavior we have in other enqueue* methods.
	    // We also need to ignore callbacks in componentWillMount. See
	    // enqueueUpdates.
	    if (!internalInstance ||
	        internalInstance === ReactLifeCycle.currentlyMountingInstance) {
	      return null;
	    }

	    if (internalInstance._pendingCallbacks) {
	      internalInstance._pendingCallbacks.push(callback);
	    } else {
	      internalInstance._pendingCallbacks = [callback];
	    }
	    // TODO: The callback here is ignored when setState is called from
	    // componentWillMount. Either fix it or disallow doing so completely in
	    // favor of getInitialState. Alternatively, we can disallow
	    // componentWillMount during server-side rendering.
	    enqueueUpdate(internalInstance);
	  },

	  enqueueCallbackInternal: function(internalInstance, callback) {
	    (true ? invariant(
	      typeof callback === 'function',
	      'enqueueCallback(...): You called `setProps`, `replaceProps`, ' +
	      '`setState`, `replaceState`, or `forceUpdate` with a callback that ' +
	      'isn\'t callable.'
	    ) : invariant(typeof callback === 'function'));
	    if (internalInstance._pendingCallbacks) {
	      internalInstance._pendingCallbacks.push(callback);
	    } else {
	      internalInstance._pendingCallbacks = [callback];
	    }
	    enqueueUpdate(internalInstance);
	  },

	  /**
	   * Forces an update. This should only be invoked when it is known with
	   * certainty that we are **not** in a DOM transaction.
	   *
	   * You may want to call this when you know that some deeper aspect of the
	   * component's state has changed but `setState` was not called.
	   *
	   * This will not invoke `shouldUpdateComponent`, but it will invoke
	   * `componentWillUpdate` and `componentDidUpdate`.
	   *
	   * @param {ReactClass} publicInstance The instance that should rerender.
	   * @internal
	   */
	  enqueueForceUpdate: function(publicInstance) {
	    var internalInstance = getInternalInstanceReadyForUpdate(
	      publicInstance,
	      'forceUpdate'
	    );

	    if (!internalInstance) {
	      return;
	    }

	    internalInstance._pendingForceUpdate = true;

	    enqueueUpdate(internalInstance);
	  },

	  /**
	   * Replaces all of the state. Always use this or `setState` to mutate state.
	   * You should treat `this.state` as immutable.
	   *
	   * There is no guarantee that `this.state` will be immediately updated, so
	   * accessing `this.state` after calling this method may return the old value.
	   *
	   * @param {ReactClass} publicInstance The instance that should rerender.
	   * @param {object} completeState Next state.
	   * @internal
	   */
	  enqueueReplaceState: function(publicInstance, completeState) {
	    var internalInstance = getInternalInstanceReadyForUpdate(
	      publicInstance,
	      'replaceState'
	    );

	    if (!internalInstance) {
	      return;
	    }

	    internalInstance._pendingStateQueue = [completeState];
	    internalInstance._pendingReplaceState = true;

	    enqueueUpdate(internalInstance);
	  },

	  /**
	   * Sets a subset of the state. This only exists because _pendingState is
	   * internal. This provides a merging strategy that is not available to deep
	   * properties which is confusing. TODO: Expose pendingState or don't use it
	   * during the merge.
	   *
	   * @param {ReactClass} publicInstance The instance that should rerender.
	   * @param {object} partialState Next partial state to be merged with state.
	   * @internal
	   */
	  enqueueSetState: function(publicInstance, partialState) {
	    var internalInstance = getInternalInstanceReadyForUpdate(
	      publicInstance,
	      'setState'
	    );

	    if (!internalInstance) {
	      return;
	    }

	    var queue =
	      internalInstance._pendingStateQueue ||
	      (internalInstance._pendingStateQueue = []);
	    queue.push(partialState);

	    enqueueUpdate(internalInstance);
	  },

	  /**
	   * Sets a subset of the props.
	   *
	   * @param {ReactClass} publicInstance The instance that should rerender.
	   * @param {object} partialProps Subset of the next props.
	   * @internal
	   */
	  enqueueSetProps: function(publicInstance, partialProps) {
	    var internalInstance = getInternalInstanceReadyForUpdate(
	      publicInstance,
	      'setProps'
	    );

	    if (!internalInstance) {
	      return;
	    }

	    (true ? invariant(
	      internalInstance._isTopLevel,
	      'setProps(...): You called `setProps` on a ' +
	      'component with a parent. This is an anti-pattern since props will ' +
	      'get reactively updated when rendered. Instead, change the owner\'s ' +
	      '`render` method to pass the correct value as props to the component ' +
	      'where it is created.'
	    ) : invariant(internalInstance._isTopLevel));

	    // Merge with the pending element if it exists, otherwise with existing
	    // element props.
	    var element = internalInstance._pendingElement ||
	                  internalInstance._currentElement;
	    var props = assign({}, element.props, partialProps);
	    internalInstance._pendingElement = ReactElement.cloneAndReplaceProps(
	      element,
	      props
	    );

	    enqueueUpdate(internalInstance);
	  },

	  /**
	   * Replaces all of the props.
	   *
	   * @param {ReactClass} publicInstance The instance that should rerender.
	   * @param {object} props New props.
	   * @internal
	   */
	  enqueueReplaceProps: function(publicInstance, props) {
	    var internalInstance = getInternalInstanceReadyForUpdate(
	      publicInstance,
	      'replaceProps'
	    );

	    if (!internalInstance) {
	      return;
	    }

	    (true ? invariant(
	      internalInstance._isTopLevel,
	      'replaceProps(...): You called `replaceProps` on a ' +
	      'component with a parent. This is an anti-pattern since props will ' +
	      'get reactively updated when rendered. Instead, change the owner\'s ' +
	      '`render` method to pass the correct value as props to the component ' +
	      'where it is created.'
	    ) : invariant(internalInstance._isTopLevel));

	    // Merge with the pending element if it exists, otherwise with existing
	    // element props.
	    var element = internalInstance._pendingElement ||
	                  internalInstance._currentElement;
	    internalInstance._pendingElement = ReactElement.cloneAndReplaceProps(
	      element,
	      props
	    );

	    enqueueUpdate(internalInstance);
	  },

	  enqueueElementInternal: function(internalInstance, newElement) {
	    internalInstance._pendingElement = newElement;
	    enqueueUpdate(internalInstance);
	  }

	};

	module.exports = ReactUpdateQueue;

	},{"135":135,"154":154,"27":27,"39":39,"57":57,"67":67,"68":68,"87":87}],87:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactUpdates
	 */

	'use strict';

	var CallbackQueue = _dereq_(6);
	var PooledClass = _dereq_(28);
	var ReactCurrentOwner = _dereq_(39);
	var ReactPerf = _dereq_(75);
	var ReactReconciler = _dereq_(81);
	var Transaction = _dereq_(103);

	var assign = _dereq_(27);
	var invariant = _dereq_(135);
	var warning = _dereq_(154);

	var dirtyComponents = [];
	var asapCallbackQueue = CallbackQueue.getPooled();
	var asapEnqueued = false;

	var batchingStrategy = null;

	function ensureInjected() {
	  (true ? invariant(
	    ReactUpdates.ReactReconcileTransaction && batchingStrategy,
	    'ReactUpdates: must inject a reconcile transaction class and batching ' +
	    'strategy'
	  ) : invariant(ReactUpdates.ReactReconcileTransaction && batchingStrategy));
	}

	var NESTED_UPDATES = {
	  initialize: function() {
	    this.dirtyComponentsLength = dirtyComponents.length;
	  },
	  close: function() {
	    if (this.dirtyComponentsLength !== dirtyComponents.length) {
	      // Additional updates were enqueued by componentDidUpdate handlers or
	      // similar; before our own UPDATE_QUEUEING wrapper closes, we want to run
	      // these new updates so that if A's componentDidUpdate calls setState on
	      // B, B will update before the callback A's updater provided when calling
	      // setState.
	      dirtyComponents.splice(0, this.dirtyComponentsLength);
	      flushBatchedUpdates();
	    } else {
	      dirtyComponents.length = 0;
	    }
	  }
	};

	var UPDATE_QUEUEING = {
	  initialize: function() {
	    this.callbackQueue.reset();
	  },
	  close: function() {
	    this.callbackQueue.notifyAll();
	  }
	};

	var TRANSACTION_WRAPPERS = [NESTED_UPDATES, UPDATE_QUEUEING];

	function ReactUpdatesFlushTransaction() {
	  this.reinitializeTransaction();
	  this.dirtyComponentsLength = null;
	  this.callbackQueue = CallbackQueue.getPooled();
	  this.reconcileTransaction =
	    ReactUpdates.ReactReconcileTransaction.getPooled();
	}

	assign(
	  ReactUpdatesFlushTransaction.prototype,
	  Transaction.Mixin, {
	  getTransactionWrappers: function() {
	    return TRANSACTION_WRAPPERS;
	  },

	  destructor: function() {
	    this.dirtyComponentsLength = null;
	    CallbackQueue.release(this.callbackQueue);
	    this.callbackQueue = null;
	    ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction);
	    this.reconcileTransaction = null;
	  },

	  perform: function(method, scope, a) {
	    // Essentially calls `this.reconcileTransaction.perform(method, scope, a)`
	    // with this transaction's wrappers around it.
	    return Transaction.Mixin.perform.call(
	      this,
	      this.reconcileTransaction.perform,
	      this.reconcileTransaction,
	      method,
	      scope,
	      a
	    );
	  }
	});

	PooledClass.addPoolingTo(ReactUpdatesFlushTransaction);

	function batchedUpdates(callback, a, b, c, d) {
	  ensureInjected();
	  batchingStrategy.batchedUpdates(callback, a, b, c, d);
	}

	/**
	 * Array comparator for ReactComponents by mount ordering.
	 *
	 * @param {ReactComponent} c1 first component you're comparing
	 * @param {ReactComponent} c2 second component you're comparing
	 * @return {number} Return value usable by Array.prototype.sort().
	 */
	function mountOrderComparator(c1, c2) {
	  return c1._mountOrder - c2._mountOrder;
	}

	function runBatchedUpdates(transaction) {
	  var len = transaction.dirtyComponentsLength;
	  (true ? invariant(
	    len === dirtyComponents.length,
	    'Expected flush transaction\'s stored dirty-components length (%s) to ' +
	    'match dirty-components array length (%s).',
	    len,
	    dirtyComponents.length
	  ) : invariant(len === dirtyComponents.length));

	  // Since reconciling a component higher in the owner hierarchy usually (not
	  // always -- see shouldComponentUpdate()) will reconcile children, reconcile
	  // them before their children by sorting the array.
	  dirtyComponents.sort(mountOrderComparator);

	  for (var i = 0; i < len; i++) {
	    // If a component is unmounted before pending changes apply, it will still
	    // be here, but we assume that it has cleared its _pendingCallbacks and
	    // that performUpdateIfNecessary is a noop.
	    var component = dirtyComponents[i];

	    // If performUpdateIfNecessary happens to enqueue any new updates, we
	    // shouldn't execute the callbacks until the next render happens, so
	    // stash the callbacks first
	    var callbacks = component._pendingCallbacks;
	    component._pendingCallbacks = null;

	    ReactReconciler.performUpdateIfNecessary(
	      component,
	      transaction.reconcileTransaction
	    );

	    if (callbacks) {
	      for (var j = 0; j < callbacks.length; j++) {
	        transaction.callbackQueue.enqueue(
	          callbacks[j],
	          component.getPublicInstance()
	        );
	      }
	    }
	  }
	}

	var flushBatchedUpdates = function() {
	  // ReactUpdatesFlushTransaction's wrappers will clear the dirtyComponents
	  // array and perform any updates enqueued by mount-ready handlers (i.e.,
	  // componentDidUpdate) but we need to check here too in order to catch
	  // updates enqueued by setState callbacks and asap calls.
	  while (dirtyComponents.length || asapEnqueued) {
	    if (dirtyComponents.length) {
	      var transaction = ReactUpdatesFlushTransaction.getPooled();
	      transaction.perform(runBatchedUpdates, null, transaction);
	      ReactUpdatesFlushTransaction.release(transaction);
	    }

	    if (asapEnqueued) {
	      asapEnqueued = false;
	      var queue = asapCallbackQueue;
	      asapCallbackQueue = CallbackQueue.getPooled();
	      queue.notifyAll();
	      CallbackQueue.release(queue);
	    }
	  }
	};
	flushBatchedUpdates = ReactPerf.measure(
	  'ReactUpdates',
	  'flushBatchedUpdates',
	  flushBatchedUpdates
	);

	/**
	 * Mark a component as needing a rerender, adding an optional callback to a
	 * list of functions which will be executed once the rerender occurs.
	 */
	function enqueueUpdate(component) {
	  ensureInjected();

	  // Various parts of our code (such as ReactCompositeComponent's
	  // _renderValidatedComponent) assume that calls to render aren't nested;
	  // verify that that's the case. (This is called by each top-level update
	  // function, like setProps, setState, forceUpdate, etc.; creation and
	  // destruction of top-level components is guarded in ReactMount.)
	  (true ? warning(
	    ReactCurrentOwner.current == null,
	    'enqueueUpdate(): Render methods should be a pure function of props ' +
	    'and state; triggering nested component updates from render is not ' +
	    'allowed. If necessary, trigger nested updates in ' +
	    'componentDidUpdate.'
	  ) : null);

	  if (!batchingStrategy.isBatchingUpdates) {
	    batchingStrategy.batchedUpdates(enqueueUpdate, component);
	    return;
	  }

	  dirtyComponents.push(component);
	}

	/**
	 * Enqueue a callback to be run at the end of the current batching cycle. Throws
	 * if no updates are currently being performed.
	 */
	function asap(callback, context) {
	  (true ? invariant(
	    batchingStrategy.isBatchingUpdates,
	    'ReactUpdates.asap: Can\'t enqueue an asap callback in a context where' +
	    'updates are not being batched.'
	  ) : invariant(batchingStrategy.isBatchingUpdates));
	  asapCallbackQueue.enqueue(callback, context);
	  asapEnqueued = true;
	}

	var ReactUpdatesInjection = {
	  injectReconcileTransaction: function(ReconcileTransaction) {
	    (true ? invariant(
	      ReconcileTransaction,
	      'ReactUpdates: must provide a reconcile transaction class'
	    ) : invariant(ReconcileTransaction));
	    ReactUpdates.ReactReconcileTransaction = ReconcileTransaction;
	  },

	  injectBatchingStrategy: function(_batchingStrategy) {
	    (true ? invariant(
	      _batchingStrategy,
	      'ReactUpdates: must provide a batching strategy'
	    ) : invariant(_batchingStrategy));
	    (true ? invariant(
	      typeof _batchingStrategy.batchedUpdates === 'function',
	      'ReactUpdates: must provide a batchedUpdates() function'
	    ) : invariant(typeof _batchingStrategy.batchedUpdates === 'function'));
	    (true ? invariant(
	      typeof _batchingStrategy.isBatchingUpdates === 'boolean',
	      'ReactUpdates: must provide an isBatchingUpdates boolean attribute'
	    ) : invariant(typeof _batchingStrategy.isBatchingUpdates === 'boolean'));
	    batchingStrategy = _batchingStrategy;
	  }
	};

	var ReactUpdates = {
	  /**
	   * React references `ReactReconcileTransaction` using this property in order
	   * to allow dependency injection.
	   *
	   * @internal
	   */
	  ReactReconcileTransaction: null,

	  batchedUpdates: batchedUpdates,
	  enqueueUpdate: enqueueUpdate,
	  flushBatchedUpdates: flushBatchedUpdates,
	  injection: ReactUpdatesInjection,
	  asap: asap
	};

	module.exports = ReactUpdates;

	},{"103":103,"135":135,"154":154,"27":27,"28":28,"39":39,"6":6,"75":75,"81":81}],88:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SVGDOMPropertyConfig
	 */

	/*jslint bitwise: true*/

	'use strict';

	var DOMProperty = _dereq_(10);

	var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;

	var SVGDOMPropertyConfig = {
	  Properties: {
	    clipPath: MUST_USE_ATTRIBUTE,
	    cx: MUST_USE_ATTRIBUTE,
	    cy: MUST_USE_ATTRIBUTE,
	    d: MUST_USE_ATTRIBUTE,
	    dx: MUST_USE_ATTRIBUTE,
	    dy: MUST_USE_ATTRIBUTE,
	    fill: MUST_USE_ATTRIBUTE,
	    fillOpacity: MUST_USE_ATTRIBUTE,
	    fontFamily: MUST_USE_ATTRIBUTE,
	    fontSize: MUST_USE_ATTRIBUTE,
	    fx: MUST_USE_ATTRIBUTE,
	    fy: MUST_USE_ATTRIBUTE,
	    gradientTransform: MUST_USE_ATTRIBUTE,
	    gradientUnits: MUST_USE_ATTRIBUTE,
	    markerEnd: MUST_USE_ATTRIBUTE,
	    markerMid: MUST_USE_ATTRIBUTE,
	    markerStart: MUST_USE_ATTRIBUTE,
	    offset: MUST_USE_ATTRIBUTE,
	    opacity: MUST_USE_ATTRIBUTE,
	    patternContentUnits: MUST_USE_ATTRIBUTE,
	    patternUnits: MUST_USE_ATTRIBUTE,
	    points: MUST_USE_ATTRIBUTE,
	    preserveAspectRatio: MUST_USE_ATTRIBUTE,
	    r: MUST_USE_ATTRIBUTE,
	    rx: MUST_USE_ATTRIBUTE,
	    ry: MUST_USE_ATTRIBUTE,
	    spreadMethod: MUST_USE_ATTRIBUTE,
	    stopColor: MUST_USE_ATTRIBUTE,
	    stopOpacity: MUST_USE_ATTRIBUTE,
	    stroke: MUST_USE_ATTRIBUTE,
	    strokeDasharray: MUST_USE_ATTRIBUTE,
	    strokeLinecap: MUST_USE_ATTRIBUTE,
	    strokeOpacity: MUST_USE_ATTRIBUTE,
	    strokeWidth: MUST_USE_ATTRIBUTE,
	    textAnchor: MUST_USE_ATTRIBUTE,
	    transform: MUST_USE_ATTRIBUTE,
	    version: MUST_USE_ATTRIBUTE,
	    viewBox: MUST_USE_ATTRIBUTE,
	    x1: MUST_USE_ATTRIBUTE,
	    x2: MUST_USE_ATTRIBUTE,
	    x: MUST_USE_ATTRIBUTE,
	    y1: MUST_USE_ATTRIBUTE,
	    y2: MUST_USE_ATTRIBUTE,
	    y: MUST_USE_ATTRIBUTE
	  },
	  DOMAttributeNames: {
	    clipPath: 'clip-path',
	    fillOpacity: 'fill-opacity',
	    fontFamily: 'font-family',
	    fontSize: 'font-size',
	    gradientTransform: 'gradientTransform',
	    gradientUnits: 'gradientUnits',
	    markerEnd: 'marker-end',
	    markerMid: 'marker-mid',
	    markerStart: 'marker-start',
	    patternContentUnits: 'patternContentUnits',
	    patternUnits: 'patternUnits',
	    preserveAspectRatio: 'preserveAspectRatio',
	    spreadMethod: 'spreadMethod',
	    stopColor: 'stop-color',
	    stopOpacity: 'stop-opacity',
	    strokeDasharray: 'stroke-dasharray',
	    strokeLinecap: 'stroke-linecap',
	    strokeOpacity: 'stroke-opacity',
	    strokeWidth: 'stroke-width',
	    textAnchor: 'text-anchor',
	    viewBox: 'viewBox'
	  }
	};

	module.exports = SVGDOMPropertyConfig;

	},{"10":10}],89:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SelectEventPlugin
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var EventPropagators = _dereq_(20);
	var ReactInputSelection = _dereq_(65);
	var SyntheticEvent = _dereq_(95);

	var getActiveElement = _dereq_(121);
	var isTextInputElement = _dereq_(138);
	var keyOf = _dereq_(141);
	var shallowEqual = _dereq_(150);

	var topLevelTypes = EventConstants.topLevelTypes;

	var eventTypes = {
	  select: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onSelect: null}),
	      captured: keyOf({onSelectCapture: null})
	    },
	    dependencies: [
	      topLevelTypes.topBlur,
	      topLevelTypes.topContextMenu,
	      topLevelTypes.topFocus,
	      topLevelTypes.topKeyDown,
	      topLevelTypes.topMouseDown,
	      topLevelTypes.topMouseUp,
	      topLevelTypes.topSelectionChange
	    ]
	  }
	};

	var activeElement = null;
	var activeElementID = null;
	var lastSelection = null;
	var mouseDown = false;

	/**
	 * Get an object which is a unique representation of the current selection.
	 *
	 * The return value will not be consistent across nodes or browsers, but
	 * two identical selections on the same node will return identical objects.
	 *
	 * @param {DOMElement} node
	 * @param {object}
	 */
	function getSelection(node) {
	  if ('selectionStart' in node &&
	      ReactInputSelection.hasSelectionCapabilities(node)) {
	    return {
	      start: node.selectionStart,
	      end: node.selectionEnd
	    };
	  } else if (window.getSelection) {
	    var selection = window.getSelection();
	    return {
	      anchorNode: selection.anchorNode,
	      anchorOffset: selection.anchorOffset,
	      focusNode: selection.focusNode,
	      focusOffset: selection.focusOffset
	    };
	  } else if (document.selection) {
	    var range = document.selection.createRange();
	    return {
	      parentElement: range.parentElement(),
	      text: range.text,
	      top: range.boundingTop,
	      left: range.boundingLeft
	    };
	  }
	}

	/**
	 * Poll selection to see whether it's changed.
	 *
	 * @param {object} nativeEvent
	 * @return {?SyntheticEvent}
	 */
	function constructSelectEvent(nativeEvent) {
	  // Ensure we have the right element, and that the user is not dragging a
	  // selection (this matches native `select` event behavior). In HTML5, select
	  // fires only on input and textarea thus if there's no focused element we
	  // won't dispatch.
	  if (mouseDown ||
	      activeElement == null ||
	      activeElement !== getActiveElement()) {
	    return null;
	  }

	  // Only fire when selection has actually changed.
	  var currentSelection = getSelection(activeElement);
	  if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
	    lastSelection = currentSelection;

	    var syntheticEvent = SyntheticEvent.getPooled(
	      eventTypes.select,
	      activeElementID,
	      nativeEvent
	    );

	    syntheticEvent.type = 'select';
	    syntheticEvent.target = activeElement;

	    EventPropagators.accumulateTwoPhaseDispatches(syntheticEvent);

	    return syntheticEvent;
	  }
	}

	/**
	 * This plugin creates an `onSelect` event that normalizes select events
	 * across form elements.
	 *
	 * Supported elements are:
	 * - input (see `isTextInputElement`)
	 * - textarea
	 * - contentEditable
	 *
	 * This differs from native browser implementations in the following ways:
	 * - Fires on contentEditable fields as well as inputs.
	 * - Fires for collapsed selection.
	 * - Fires after user input.
	 */
	var SelectEventPlugin = {

	  eventTypes: eventTypes,

	  /**
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {DOMEventTarget} topLevelTarget The listening component root node.
	   * @param {string} topLevelTargetID ID of `topLevelTarget`.
	   * @param {object} nativeEvent Native browser event.
	   * @return {*} An accumulation of synthetic events.
	   * @see {EventPluginHub.extractEvents}
	   */
	  extractEvents: function(
	      topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      nativeEvent) {

	    switch (topLevelType) {
	      // Track the input node that has focus.
	      case topLevelTypes.topFocus:
	        if (isTextInputElement(topLevelTarget) ||
	            topLevelTarget.contentEditable === 'true') {
	          activeElement = topLevelTarget;
	          activeElementID = topLevelTargetID;
	          lastSelection = null;
	        }
	        break;
	      case topLevelTypes.topBlur:
	        activeElement = null;
	        activeElementID = null;
	        lastSelection = null;
	        break;

	      // Don't fire the event while the user is dragging. This matches the
	      // semantics of the native select event.
	      case topLevelTypes.topMouseDown:
	        mouseDown = true;
	        break;
	      case topLevelTypes.topContextMenu:
	      case topLevelTypes.topMouseUp:
	        mouseDown = false;
	        return constructSelectEvent(nativeEvent);

	      // Chrome and IE fire non-standard event when selection is changed (and
	      // sometimes when it hasn't).
	      // Firefox doesn't support selectionchange, so check selection status
	      // after each key entry. The selection changes after keydown and before
	      // keyup, but we check on keydown as well in the case of holding down a
	      // key, when multiple keydown events are fired but only one keyup is.
	      case topLevelTypes.topSelectionChange:
	      case topLevelTypes.topKeyDown:
	      case topLevelTypes.topKeyUp:
	        return constructSelectEvent(nativeEvent);
	    }
	  }
	};

	module.exports = SelectEventPlugin;

	},{"121":121,"138":138,"141":141,"15":15,"150":150,"20":20,"65":65,"95":95}],90:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ServerReactRootIndex
	 * @typechecks
	 */

	'use strict';

	/**
	 * Size of the reactRoot ID space. We generate random numbers for React root
	 * IDs and if there's a collision the events and DOM update system will
	 * get confused. In the future we need a way to generate GUIDs but for
	 * now this will work on a smaller scale.
	 */
	var GLOBAL_MOUNT_POINT_MAX = Math.pow(2, 53);

	var ServerReactRootIndex = {
	  createReactRootIndex: function() {
	    return Math.ceil(Math.random() * GLOBAL_MOUNT_POINT_MAX);
	  }
	};

	module.exports = ServerReactRootIndex;

	},{}],91:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SimpleEventPlugin
	 */

	'use strict';

	var EventConstants = _dereq_(15);
	var EventPluginUtils = _dereq_(19);
	var EventPropagators = _dereq_(20);
	var SyntheticClipboardEvent = _dereq_(92);
	var SyntheticEvent = _dereq_(95);
	var SyntheticFocusEvent = _dereq_(96);
	var SyntheticKeyboardEvent = _dereq_(98);
	var SyntheticMouseEvent = _dereq_(99);
	var SyntheticDragEvent = _dereq_(94);
	var SyntheticTouchEvent = _dereq_(100);
	var SyntheticUIEvent = _dereq_(101);
	var SyntheticWheelEvent = _dereq_(102);

	var getEventCharCode = _dereq_(122);

	var invariant = _dereq_(135);
	var keyOf = _dereq_(141);
	var warning = _dereq_(154);

	var topLevelTypes = EventConstants.topLevelTypes;

	var eventTypes = {
	  blur: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onBlur: true}),
	      captured: keyOf({onBlurCapture: true})
	    }
	  },
	  click: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onClick: true}),
	      captured: keyOf({onClickCapture: true})
	    }
	  },
	  contextMenu: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onContextMenu: true}),
	      captured: keyOf({onContextMenuCapture: true})
	    }
	  },
	  copy: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onCopy: true}),
	      captured: keyOf({onCopyCapture: true})
	    }
	  },
	  cut: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onCut: true}),
	      captured: keyOf({onCutCapture: true})
	    }
	  },
	  doubleClick: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDoubleClick: true}),
	      captured: keyOf({onDoubleClickCapture: true})
	    }
	  },
	  drag: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDrag: true}),
	      captured: keyOf({onDragCapture: true})
	    }
	  },
	  dragEnd: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDragEnd: true}),
	      captured: keyOf({onDragEndCapture: true})
	    }
	  },
	  dragEnter: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDragEnter: true}),
	      captured: keyOf({onDragEnterCapture: true})
	    }
	  },
	  dragExit: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDragExit: true}),
	      captured: keyOf({onDragExitCapture: true})
	    }
	  },
	  dragLeave: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDragLeave: true}),
	      captured: keyOf({onDragLeaveCapture: true})
	    }
	  },
	  dragOver: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDragOver: true}),
	      captured: keyOf({onDragOverCapture: true})
	    }
	  },
	  dragStart: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDragStart: true}),
	      captured: keyOf({onDragStartCapture: true})
	    }
	  },
	  drop: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onDrop: true}),
	      captured: keyOf({onDropCapture: true})
	    }
	  },
	  focus: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onFocus: true}),
	      captured: keyOf({onFocusCapture: true})
	    }
	  },
	  input: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onInput: true}),
	      captured: keyOf({onInputCapture: true})
	    }
	  },
	  keyDown: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onKeyDown: true}),
	      captured: keyOf({onKeyDownCapture: true})
	    }
	  },
	  keyPress: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onKeyPress: true}),
	      captured: keyOf({onKeyPressCapture: true})
	    }
	  },
	  keyUp: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onKeyUp: true}),
	      captured: keyOf({onKeyUpCapture: true})
	    }
	  },
	  load: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onLoad: true}),
	      captured: keyOf({onLoadCapture: true})
	    }
	  },
	  error: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onError: true}),
	      captured: keyOf({onErrorCapture: true})
	    }
	  },
	  // Note: We do not allow listening to mouseOver events. Instead, use the
	  // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
	  mouseDown: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onMouseDown: true}),
	      captured: keyOf({onMouseDownCapture: true})
	    }
	  },
	  mouseMove: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onMouseMove: true}),
	      captured: keyOf({onMouseMoveCapture: true})
	    }
	  },
	  mouseOut: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onMouseOut: true}),
	      captured: keyOf({onMouseOutCapture: true})
	    }
	  },
	  mouseOver: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onMouseOver: true}),
	      captured: keyOf({onMouseOverCapture: true})
	    }
	  },
	  mouseUp: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onMouseUp: true}),
	      captured: keyOf({onMouseUpCapture: true})
	    }
	  },
	  paste: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onPaste: true}),
	      captured: keyOf({onPasteCapture: true})
	    }
	  },
	  reset: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onReset: true}),
	      captured: keyOf({onResetCapture: true})
	    }
	  },
	  scroll: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onScroll: true}),
	      captured: keyOf({onScrollCapture: true})
	    }
	  },
	  submit: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onSubmit: true}),
	      captured: keyOf({onSubmitCapture: true})
	    }
	  },
	  touchCancel: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onTouchCancel: true}),
	      captured: keyOf({onTouchCancelCapture: true})
	    }
	  },
	  touchEnd: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onTouchEnd: true}),
	      captured: keyOf({onTouchEndCapture: true})
	    }
	  },
	  touchMove: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onTouchMove: true}),
	      captured: keyOf({onTouchMoveCapture: true})
	    }
	  },
	  touchStart: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onTouchStart: true}),
	      captured: keyOf({onTouchStartCapture: true})
	    }
	  },
	  wheel: {
	    phasedRegistrationNames: {
	      bubbled: keyOf({onWheel: true}),
	      captured: keyOf({onWheelCapture: true})
	    }
	  }
	};

	var topLevelEventsToDispatchConfig = {
	  topBlur:        eventTypes.blur,
	  topClick:       eventTypes.click,
	  topContextMenu: eventTypes.contextMenu,
	  topCopy:        eventTypes.copy,
	  topCut:         eventTypes.cut,
	  topDoubleClick: eventTypes.doubleClick,
	  topDrag:        eventTypes.drag,
	  topDragEnd:     eventTypes.dragEnd,
	  topDragEnter:   eventTypes.dragEnter,
	  topDragExit:    eventTypes.dragExit,
	  topDragLeave:   eventTypes.dragLeave,
	  topDragOver:    eventTypes.dragOver,
	  topDragStart:   eventTypes.dragStart,
	  topDrop:        eventTypes.drop,
	  topError:       eventTypes.error,
	  topFocus:       eventTypes.focus,
	  topInput:       eventTypes.input,
	  topKeyDown:     eventTypes.keyDown,
	  topKeyPress:    eventTypes.keyPress,
	  topKeyUp:       eventTypes.keyUp,
	  topLoad:        eventTypes.load,
	  topMouseDown:   eventTypes.mouseDown,
	  topMouseMove:   eventTypes.mouseMove,
	  topMouseOut:    eventTypes.mouseOut,
	  topMouseOver:   eventTypes.mouseOver,
	  topMouseUp:     eventTypes.mouseUp,
	  topPaste:       eventTypes.paste,
	  topReset:       eventTypes.reset,
	  topScroll:      eventTypes.scroll,
	  topSubmit:      eventTypes.submit,
	  topTouchCancel: eventTypes.touchCancel,
	  topTouchEnd:    eventTypes.touchEnd,
	  topTouchMove:   eventTypes.touchMove,
	  topTouchStart:  eventTypes.touchStart,
	  topWheel:       eventTypes.wheel
	};

	for (var type in topLevelEventsToDispatchConfig) {
	  topLevelEventsToDispatchConfig[type].dependencies = [type];
	}

	var SimpleEventPlugin = {

	  eventTypes: eventTypes,

	  /**
	   * Same as the default implementation, except cancels the event when return
	   * value is false. This behavior will be disabled in a future release.
	   *
	   * @param {object} Event to be dispatched.
	   * @param {function} Application-level callback.
	   * @param {string} domID DOM ID to pass to the callback.
	   */
	  executeDispatch: function(event, listener, domID) {
	    var returnValue = EventPluginUtils.executeDispatch(event, listener, domID);

	    (true ? warning(
	      typeof returnValue !== 'boolean',
	      'Returning `false` from an event handler is deprecated and will be ' +
	      'ignored in a future release. Instead, manually call ' +
	      'e.stopPropagation() or e.preventDefault(), as appropriate.'
	    ) : null);

	    if (returnValue === false) {
	      event.stopPropagation();
	      event.preventDefault();
	    }
	  },

	  /**
	   * @param {string} topLevelType Record from `EventConstants`.
	   * @param {DOMEventTarget} topLevelTarget The listening component root node.
	   * @param {string} topLevelTargetID ID of `topLevelTarget`.
	   * @param {object} nativeEvent Native browser event.
	   * @return {*} An accumulation of synthetic events.
	   * @see {EventPluginHub.extractEvents}
	   */
	  extractEvents: function(
	      topLevelType,
	      topLevelTarget,
	      topLevelTargetID,
	      nativeEvent) {
	    var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
	    if (!dispatchConfig) {
	      return null;
	    }
	    var EventConstructor;
	    switch (topLevelType) {
	      case topLevelTypes.topInput:
	      case topLevelTypes.topLoad:
	      case topLevelTypes.topError:
	      case topLevelTypes.topReset:
	      case topLevelTypes.topSubmit:
	        // HTML Events
	        // @see http://www.w3.org/TR/html5/index.html#events-0
	        EventConstructor = SyntheticEvent;
	        break;
	      case topLevelTypes.topKeyPress:
	        // FireFox creates a keypress event for function keys too. This removes
	        // the unwanted keypress events. Enter is however both printable and
	        // non-printable. One would expect Tab to be as well (but it isn't).
	        if (getEventCharCode(nativeEvent) === 0) {
	          return null;
	        }
	        /* falls through */
	      case topLevelTypes.topKeyDown:
	      case topLevelTypes.topKeyUp:
	        EventConstructor = SyntheticKeyboardEvent;
	        break;
	      case topLevelTypes.topBlur:
	      case topLevelTypes.topFocus:
	        EventConstructor = SyntheticFocusEvent;
	        break;
	      case topLevelTypes.topClick:
	        // Firefox creates a click event on right mouse clicks. This removes the
	        // unwanted click events.
	        if (nativeEvent.button === 2) {
	          return null;
	        }
	        /* falls through */
	      case topLevelTypes.topContextMenu:
	      case topLevelTypes.topDoubleClick:
	      case topLevelTypes.topMouseDown:
	      case topLevelTypes.topMouseMove:
	      case topLevelTypes.topMouseOut:
	      case topLevelTypes.topMouseOver:
	      case topLevelTypes.topMouseUp:
	        EventConstructor = SyntheticMouseEvent;
	        break;
	      case topLevelTypes.topDrag:
	      case topLevelTypes.topDragEnd:
	      case topLevelTypes.topDragEnter:
	      case topLevelTypes.topDragExit:
	      case topLevelTypes.topDragLeave:
	      case topLevelTypes.topDragOver:
	      case topLevelTypes.topDragStart:
	      case topLevelTypes.topDrop:
	        EventConstructor = SyntheticDragEvent;
	        break;
	      case topLevelTypes.topTouchCancel:
	      case topLevelTypes.topTouchEnd:
	      case topLevelTypes.topTouchMove:
	      case topLevelTypes.topTouchStart:
	        EventConstructor = SyntheticTouchEvent;
	        break;
	      case topLevelTypes.topScroll:
	        EventConstructor = SyntheticUIEvent;
	        break;
	      case topLevelTypes.topWheel:
	        EventConstructor = SyntheticWheelEvent;
	        break;
	      case topLevelTypes.topCopy:
	      case topLevelTypes.topCut:
	      case topLevelTypes.topPaste:
	        EventConstructor = SyntheticClipboardEvent;
	        break;
	    }
	    (true ? invariant(
	      EventConstructor,
	      'SimpleEventPlugin: Unhandled event type, `%s`.',
	      topLevelType
	    ) : invariant(EventConstructor));
	    var event = EventConstructor.getPooled(
	      dispatchConfig,
	      topLevelTargetID,
	      nativeEvent
	    );
	    EventPropagators.accumulateTwoPhaseDispatches(event);
	    return event;
	  }

	};

	module.exports = SimpleEventPlugin;

	},{"100":100,"101":101,"102":102,"122":122,"135":135,"141":141,"15":15,"154":154,"19":19,"20":20,"92":92,"94":94,"95":95,"96":96,"98":98,"99":99}],92:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticClipboardEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticEvent = _dereq_(95);

	/**
	 * @interface Event
	 * @see http://www.w3.org/TR/clipboard-apis/
	 */
	var ClipboardEventInterface = {
	  clipboardData: function(event) {
	    return (
	      'clipboardData' in event ?
	        event.clipboardData :
	        window.clipboardData
	    );
	  }
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticUIEvent}
	 */
	function SyntheticClipboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticEvent.augmentClass(SyntheticClipboardEvent, ClipboardEventInterface);

	module.exports = SyntheticClipboardEvent;

	},{"95":95}],93:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticCompositionEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticEvent = _dereq_(95);

	/**
	 * @interface Event
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/#events-compositionevents
	 */
	var CompositionEventInterface = {
	  data: null
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticUIEvent}
	 */
	function SyntheticCompositionEvent(
	  dispatchConfig,
	  dispatchMarker,
	  nativeEvent) {
	  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticEvent.augmentClass(
	  SyntheticCompositionEvent,
	  CompositionEventInterface
	);

	module.exports = SyntheticCompositionEvent;

	},{"95":95}],94:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticDragEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticMouseEvent = _dereq_(99);

	/**
	 * @interface DragEvent
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/
	 */
	var DragEventInterface = {
	  dataTransfer: null
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticUIEvent}
	 */
	function SyntheticDragEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticMouseEvent.augmentClass(SyntheticDragEvent, DragEventInterface);

	module.exports = SyntheticDragEvent;

	},{"99":99}],95:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticEvent
	 * @typechecks static-only
	 */

	'use strict';

	var PooledClass = _dereq_(28);

	var assign = _dereq_(27);
	var emptyFunction = _dereq_(114);
	var getEventTarget = _dereq_(125);

	/**
	 * @interface Event
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/
	 */
	var EventInterface = {
	  type: null,
	  target: getEventTarget,
	  // currentTarget is set when dispatching; no use in copying it here
	  currentTarget: emptyFunction.thatReturnsNull,
	  eventPhase: null,
	  bubbles: null,
	  cancelable: null,
	  timeStamp: function(event) {
	    return event.timeStamp || Date.now();
	  },
	  defaultPrevented: null,
	  isTrusted: null
	};

	/**
	 * Synthetic events are dispatched by event plugins, typically in response to a
	 * top-level event delegation handler.
	 *
	 * These systems should generally use pooling to reduce the frequency of garbage
	 * collection. The system should check `isPersistent` to determine whether the
	 * event should be released into the pool after being dispatched. Users that
	 * need a persisted event should invoke `persist`.
	 *
	 * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
	 * normalizing browser quirks. Subclasses do not necessarily have to implement a
	 * DOM interface; custom application-specific events can also subclass this.
	 *
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 */
	function SyntheticEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  this.dispatchConfig = dispatchConfig;
	  this.dispatchMarker = dispatchMarker;
	  this.nativeEvent = nativeEvent;

	  var Interface = this.constructor.Interface;
	  for (var propName in Interface) {
	    if (!Interface.hasOwnProperty(propName)) {
	      continue;
	    }
	    var normalize = Interface[propName];
	    if (normalize) {
	      this[propName] = normalize(nativeEvent);
	    } else {
	      this[propName] = nativeEvent[propName];
	    }
	  }

	  var defaultPrevented = nativeEvent.defaultPrevented != null ?
	    nativeEvent.defaultPrevented :
	    nativeEvent.returnValue === false;
	  if (defaultPrevented) {
	    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
	  } else {
	    this.isDefaultPrevented = emptyFunction.thatReturnsFalse;
	  }
	  this.isPropagationStopped = emptyFunction.thatReturnsFalse;
	}

	assign(SyntheticEvent.prototype, {

	  preventDefault: function() {
	    this.defaultPrevented = true;
	    var event = this.nativeEvent;
	    if (event.preventDefault) {
	      event.preventDefault();
	    } else {
	      event.returnValue = false;
	    }
	    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
	  },

	  stopPropagation: function() {
	    var event = this.nativeEvent;
	    if (event.stopPropagation) {
	      event.stopPropagation();
	    } else {
	      event.cancelBubble = true;
	    }
	    this.isPropagationStopped = emptyFunction.thatReturnsTrue;
	  },

	  /**
	   * We release all dispatched `SyntheticEvent`s after each event loop, adding
	   * them back into the pool. This allows a way to hold onto a reference that
	   * won't be added back into the pool.
	   */
	  persist: function() {
	    this.isPersistent = emptyFunction.thatReturnsTrue;
	  },

	  /**
	   * Checks if this event should be released back into the pool.
	   *
	   * @return {boolean} True if this should not be released, false otherwise.
	   */
	  isPersistent: emptyFunction.thatReturnsFalse,

	  /**
	   * `PooledClass` looks for `destructor` on each instance it releases.
	   */
	  destructor: function() {
	    var Interface = this.constructor.Interface;
	    for (var propName in Interface) {
	      this[propName] = null;
	    }
	    this.dispatchConfig = null;
	    this.dispatchMarker = null;
	    this.nativeEvent = null;
	  }

	});

	SyntheticEvent.Interface = EventInterface;

	/**
	 * Helper to reduce boilerplate when creating subclasses.
	 *
	 * @param {function} Class
	 * @param {?object} Interface
	 */
	SyntheticEvent.augmentClass = function(Class, Interface) {
	  var Super = this;

	  var prototype = Object.create(Super.prototype);
	  assign(prototype, Class.prototype);
	  Class.prototype = prototype;
	  Class.prototype.constructor = Class;

	  Class.Interface = assign({}, Super.Interface, Interface);
	  Class.augmentClass = Super.augmentClass;

	  PooledClass.addPoolingTo(Class, PooledClass.threeArgumentPooler);
	};

	PooledClass.addPoolingTo(SyntheticEvent, PooledClass.threeArgumentPooler);

	module.exports = SyntheticEvent;

	},{"114":114,"125":125,"27":27,"28":28}],96:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticFocusEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticUIEvent = _dereq_(101);

	/**
	 * @interface FocusEvent
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/
	 */
	var FocusEventInterface = {
	  relatedTarget: null
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticUIEvent}
	 */
	function SyntheticFocusEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticUIEvent.augmentClass(SyntheticFocusEvent, FocusEventInterface);

	module.exports = SyntheticFocusEvent;

	},{"101":101}],97:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticInputEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticEvent = _dereq_(95);

	/**
	 * @interface Event
	 * @see http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105
	 *      /#events-inputevents
	 */
	var InputEventInterface = {
	  data: null
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticUIEvent}
	 */
	function SyntheticInputEvent(
	  dispatchConfig,
	  dispatchMarker,
	  nativeEvent) {
	  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticEvent.augmentClass(
	  SyntheticInputEvent,
	  InputEventInterface
	);

	module.exports = SyntheticInputEvent;

	},{"95":95}],98:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticKeyboardEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticUIEvent = _dereq_(101);

	var getEventCharCode = _dereq_(122);
	var getEventKey = _dereq_(123);
	var getEventModifierState = _dereq_(124);

	/**
	 * @interface KeyboardEvent
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/
	 */
	var KeyboardEventInterface = {
	  key: getEventKey,
	  location: null,
	  ctrlKey: null,
	  shiftKey: null,
	  altKey: null,
	  metaKey: null,
	  repeat: null,
	  locale: null,
	  getModifierState: getEventModifierState,
	  // Legacy Interface
	  charCode: function(event) {
	    // `charCode` is the result of a KeyPress event and represents the value of
	    // the actual printable character.

	    // KeyPress is deprecated, but its replacement is not yet final and not
	    // implemented in any major browser. Only KeyPress has charCode.
	    if (event.type === 'keypress') {
	      return getEventCharCode(event);
	    }
	    return 0;
	  },
	  keyCode: function(event) {
	    // `keyCode` is the result of a KeyDown/Up event and represents the value of
	    // physical keyboard key.

	    // The actual meaning of the value depends on the users' keyboard layout
	    // which cannot be detected. Assuming that it is a US keyboard layout
	    // provides a surprisingly accurate mapping for US and European users.
	    // Due to this, it is left to the user to implement at this time.
	    if (event.type === 'keydown' || event.type === 'keyup') {
	      return event.keyCode;
	    }
	    return 0;
	  },
	  which: function(event) {
	    // `which` is an alias for either `keyCode` or `charCode` depending on the
	    // type of the event.
	    if (event.type === 'keypress') {
	      return getEventCharCode(event);
	    }
	    if (event.type === 'keydown' || event.type === 'keyup') {
	      return event.keyCode;
	    }
	    return 0;
	  }
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticUIEvent}
	 */
	function SyntheticKeyboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticUIEvent.augmentClass(SyntheticKeyboardEvent, KeyboardEventInterface);

	module.exports = SyntheticKeyboardEvent;

	},{"101":101,"122":122,"123":123,"124":124}],99:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticMouseEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticUIEvent = _dereq_(101);
	var ViewportMetrics = _dereq_(104);

	var getEventModifierState = _dereq_(124);

	/**
	 * @interface MouseEvent
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/
	 */
	var MouseEventInterface = {
	  screenX: null,
	  screenY: null,
	  clientX: null,
	  clientY: null,
	  ctrlKey: null,
	  shiftKey: null,
	  altKey: null,
	  metaKey: null,
	  getModifierState: getEventModifierState,
	  button: function(event) {
	    // Webkit, Firefox, IE9+
	    // which:  1 2 3
	    // button: 0 1 2 (standard)
	    var button = event.button;
	    if ('which' in event) {
	      return button;
	    }
	    // IE<9
	    // which:  undefined
	    // button: 0 0 0
	    // button: 1 4 2 (onmouseup)
	    return button === 2 ? 2 : button === 4 ? 1 : 0;
	  },
	  buttons: null,
	  relatedTarget: function(event) {
	    return event.relatedTarget || (
	      ((event.fromElement === event.srcElement ? event.toElement : event.fromElement))
	    );
	  },
	  // "Proprietary" Interface.
	  pageX: function(event) {
	    return 'pageX' in event ?
	      event.pageX :
	      event.clientX + ViewportMetrics.currentScrollLeft;
	  },
	  pageY: function(event) {
	    return 'pageY' in event ?
	      event.pageY :
	      event.clientY + ViewportMetrics.currentScrollTop;
	  }
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticUIEvent}
	 */
	function SyntheticMouseEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticUIEvent.augmentClass(SyntheticMouseEvent, MouseEventInterface);

	module.exports = SyntheticMouseEvent;

	},{"101":101,"104":104,"124":124}],100:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticTouchEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticUIEvent = _dereq_(101);

	var getEventModifierState = _dereq_(124);

	/**
	 * @interface TouchEvent
	 * @see http://www.w3.org/TR/touch-events/
	 */
	var TouchEventInterface = {
	  touches: null,
	  targetTouches: null,
	  changedTouches: null,
	  altKey: null,
	  metaKey: null,
	  ctrlKey: null,
	  shiftKey: null,
	  getModifierState: getEventModifierState
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticUIEvent}
	 */
	function SyntheticTouchEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);

	module.exports = SyntheticTouchEvent;

	},{"101":101,"124":124}],101:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticUIEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticEvent = _dereq_(95);

	var getEventTarget = _dereq_(125);

	/**
	 * @interface UIEvent
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/
	 */
	var UIEventInterface = {
	  view: function(event) {
	    if (event.view) {
	      return event.view;
	    }

	    var target = getEventTarget(event);
	    if (target != null && target.window === target) {
	      // target is a window object
	      return target;
	    }

	    var doc = target.ownerDocument;
	    // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
	    if (doc) {
	      return doc.defaultView || doc.parentWindow;
	    } else {
	      return window;
	    }
	  },
	  detail: function(event) {
	    return event.detail || 0;
	  }
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticEvent}
	 */
	function SyntheticUIEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticEvent.augmentClass(SyntheticUIEvent, UIEventInterface);

	module.exports = SyntheticUIEvent;

	},{"125":125,"95":95}],102:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule SyntheticWheelEvent
	 * @typechecks static-only
	 */

	'use strict';

	var SyntheticMouseEvent = _dereq_(99);

	/**
	 * @interface WheelEvent
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/
	 */
	var WheelEventInterface = {
	  deltaX: function(event) {
	    return (
	      'deltaX' in event ? event.deltaX :
	      // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
	      'wheelDeltaX' in event ? -event.wheelDeltaX : 0
	    );
	  },
	  deltaY: function(event) {
	    return (
	      'deltaY' in event ? event.deltaY :
	      // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
	      'wheelDeltaY' in event ? -event.wheelDeltaY :
	      // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
	      'wheelDelta' in event ? -event.wheelDelta : 0
	    );
	  },
	  deltaZ: null,

	  // Browsers without "deltaMode" is reporting in raw wheel delta where one
	  // notch on the scroll is always +/- 120, roughly equivalent to pixels.
	  // A good approximation of DOM_DELTA_LINE (1) is 5% of viewport size or
	  // ~40 pixels, for DOM_DELTA_SCREEN (2) it is 87.5% of viewport size.
	  deltaMode: null
	};

	/**
	 * @param {object} dispatchConfig Configuration used to dispatch this event.
	 * @param {string} dispatchMarker Marker identifying the event target.
	 * @param {object} nativeEvent Native browser event.
	 * @extends {SyntheticMouseEvent}
	 */
	function SyntheticWheelEvent(dispatchConfig, dispatchMarker, nativeEvent) {
	  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
	}

	SyntheticMouseEvent.augmentClass(SyntheticWheelEvent, WheelEventInterface);

	module.exports = SyntheticWheelEvent;

	},{"99":99}],103:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule Transaction
	 */

	'use strict';

	var invariant = _dereq_(135);

	/**
	 * `Transaction` creates a black box that is able to wrap any method such that
	 * certain invariants are maintained before and after the method is invoked
	 * (Even if an exception is thrown while invoking the wrapped method). Whoever
	 * instantiates a transaction can provide enforcers of the invariants at
	 * creation time. The `Transaction` class itself will supply one additional
	 * automatic invariant for you - the invariant that any transaction instance
	 * should not be run while it is already being run. You would typically create a
	 * single instance of a `Transaction` for reuse multiple times, that potentially
	 * is used to wrap several different methods. Wrappers are extremely simple -
	 * they only require implementing two methods.
	 *
	 * <pre>
	 *                       wrappers (injected at creation time)
	 *                                      +        +
	 *                                      |        |
	 *                    +-----------------|--------|--------------+
	 *                    |                 v        |              |
	 *                    |      +---------------+   |              |
	 *                    |   +--|    wrapper1   |---|----+         |
	 *                    |   |  +---------------+   v    |         |
	 *                    |   |          +-------------+  |         |
	 *                    |   |     +----|   wrapper2  |--------+   |
	 *                    |   |     |    +-------------+  |     |   |
	 *                    |   |     |                     |     |   |
	 *                    |   v     v                     v     v   | wrapper
	 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
	 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
	 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
	 *                    | |   | |   |   |         |   |   | |   | |
	 *                    | |   | |   |   |         |   |   | |   | |
	 *                    | |   | |   |   |         |   |   | |   | |
	 *                    | +---+ +---+   +---------+   +---+ +---+ |
	 *                    |  initialize                    close    |
	 *                    +-----------------------------------------+
	 * </pre>
	 *
	 * Use cases:
	 * - Preserving the input selection ranges before/after reconciliation.
	 *   Restoring selection even in the event of an unexpected error.
	 * - Deactivating events while rearranging the DOM, preventing blurs/focuses,
	 *   while guaranteeing that afterwards, the event system is reactivated.
	 * - Flushing a queue of collected DOM mutations to the main UI thread after a
	 *   reconciliation takes place in a worker thread.
	 * - Invoking any collected `componentDidUpdate` callbacks after rendering new
	 *   content.
	 * - (Future use case): Wrapping particular flushes of the `ReactWorker` queue
	 *   to preserve the `scrollTop` (an automatic scroll aware DOM).
	 * - (Future use case): Layout calculations before and after DOM updates.
	 *
	 * Transactional plugin API:
	 * - A module that has an `initialize` method that returns any precomputation.
	 * - and a `close` method that accepts the precomputation. `close` is invoked
	 *   when the wrapped process is completed, or has failed.
	 *
	 * @param {Array<TransactionalWrapper>} transactionWrapper Wrapper modules
	 * that implement `initialize` and `close`.
	 * @return {Transaction} Single transaction for reuse in thread.
	 *
	 * @class Transaction
	 */
	var Mixin = {
	  /**
	   * Sets up this instance so that it is prepared for collecting metrics. Does
	   * so such that this setup method may be used on an instance that is already
	   * initialized, in a way that does not consume additional memory upon reuse.
	   * That can be useful if you decide to make your subclass of this mixin a
	   * "PooledClass".
	   */
	  reinitializeTransaction: function() {
	    this.transactionWrappers = this.getTransactionWrappers();
	    if (!this.wrapperInitData) {
	      this.wrapperInitData = [];
	    } else {
	      this.wrapperInitData.length = 0;
	    }
	    this._isInTransaction = false;
	  },

	  _isInTransaction: false,

	  /**
	   * @abstract
	   * @return {Array<TransactionWrapper>} Array of transaction wrappers.
	   */
	  getTransactionWrappers: null,

	  isInTransaction: function() {
	    return !!this._isInTransaction;
	  },

	  /**
	   * Executes the function within a safety window. Use this for the top level
	   * methods that result in large amounts of computation/mutations that would
	   * need to be safety checked.
	   *
	   * @param {function} method Member of scope to call.
	   * @param {Object} scope Scope to invoke from.
	   * @param {Object?=} args... Arguments to pass to the method (optional).
	   *                           Helps prevent need to bind in many cases.
	   * @return Return value from `method`.
	   */
	  perform: function(method, scope, a, b, c, d, e, f) {
	    (true ? invariant(
	      !this.isInTransaction(),
	      'Transaction.perform(...): Cannot initialize a transaction when there ' +
	      'is already an outstanding transaction.'
	    ) : invariant(!this.isInTransaction()));
	    var errorThrown;
	    var ret;
	    try {
	      this._isInTransaction = true;
	      // Catching errors makes debugging more difficult, so we start with
	      // errorThrown set to true before setting it to false after calling
	      // close -- if it's still set to true in the finally block, it means
	      // one of these calls threw.
	      errorThrown = true;
	      this.initializeAll(0);
	      ret = method.call(scope, a, b, c, d, e, f);
	      errorThrown = false;
	    } finally {
	      try {
	        if (errorThrown) {
	          // If `method` throws, prefer to show that stack trace over any thrown
	          // by invoking `closeAll`.
	          try {
	            this.closeAll(0);
	          } catch (err) {
	          }
	        } else {
	          // Since `method` didn't throw, we don't want to silence the exception
	          // here.
	          this.closeAll(0);
	        }
	      } finally {
	        this._isInTransaction = false;
	      }
	    }
	    return ret;
	  },

	  initializeAll: function(startIndex) {
	    var transactionWrappers = this.transactionWrappers;
	    for (var i = startIndex; i < transactionWrappers.length; i++) {
	      var wrapper = transactionWrappers[i];
	      try {
	        // Catching errors makes debugging more difficult, so we start with the
	        // OBSERVED_ERROR state before overwriting it with the real return value
	        // of initialize -- if it's still set to OBSERVED_ERROR in the finally
	        // block, it means wrapper.initialize threw.
	        this.wrapperInitData[i] = Transaction.OBSERVED_ERROR;
	        this.wrapperInitData[i] = wrapper.initialize ?
	          wrapper.initialize.call(this) :
	          null;
	      } finally {
	        if (this.wrapperInitData[i] === Transaction.OBSERVED_ERROR) {
	          // The initializer for wrapper i threw an error; initialize the
	          // remaining wrappers but silence any exceptions from them to ensure
	          // that the first error is the one to bubble up.
	          try {
	            this.initializeAll(i + 1);
	          } catch (err) {
	          }
	        }
	      }
	    }
	  },

	  /**
	   * Invokes each of `this.transactionWrappers.close[i]` functions, passing into
	   * them the respective return values of `this.transactionWrappers.init[i]`
	   * (`close`rs that correspond to initializers that failed will not be
	   * invoked).
	   */
	  closeAll: function(startIndex) {
	    (true ? invariant(
	      this.isInTransaction(),
	      'Transaction.closeAll(): Cannot close transaction when none are open.'
	    ) : invariant(this.isInTransaction()));
	    var transactionWrappers = this.transactionWrappers;
	    for (var i = startIndex; i < transactionWrappers.length; i++) {
	      var wrapper = transactionWrappers[i];
	      var initData = this.wrapperInitData[i];
	      var errorThrown;
	      try {
	        // Catching errors makes debugging more difficult, so we start with
	        // errorThrown set to true before setting it to false after calling
	        // close -- if it's still set to true in the finally block, it means
	        // wrapper.close threw.
	        errorThrown = true;
	        if (initData !== Transaction.OBSERVED_ERROR && wrapper.close) {
	          wrapper.close.call(this, initData);
	        }
	        errorThrown = false;
	      } finally {
	        if (errorThrown) {
	          // The closer for wrapper i threw an error; close the remaining
	          // wrappers but silence any exceptions from them to ensure that the
	          // first error is the one to bubble up.
	          try {
	            this.closeAll(i + 1);
	          } catch (e) {
	          }
	        }
	      }
	    }
	    this.wrapperInitData.length = 0;
	  }
	};

	var Transaction = {

	  Mixin: Mixin,

	  /**
	   * Token to look for to determine if an error occured.
	   */
	  OBSERVED_ERROR: {}

	};

	module.exports = Transaction;

	},{"135":135}],104:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ViewportMetrics
	 */

	'use strict';

	var ViewportMetrics = {

	  currentScrollLeft: 0,

	  currentScrollTop: 0,

	  refreshScrollValues: function(scrollPosition) {
	    ViewportMetrics.currentScrollLeft = scrollPosition.x;
	    ViewportMetrics.currentScrollTop = scrollPosition.y;
	  }

	};

	module.exports = ViewportMetrics;

	},{}],105:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule accumulateInto
	 */

	'use strict';

	var invariant = _dereq_(135);

	/**
	 *
	 * Accumulates items that must not be null or undefined into the first one. This
	 * is used to conserve memory by avoiding array allocations, and thus sacrifices
	 * API cleanness. Since `current` can be null before being passed in and not
	 * null after this function, make sure to assign it back to `current`:
	 *
	 * `a = accumulateInto(a, b);`
	 *
	 * This API should be sparingly used. Try `accumulate` for something cleaner.
	 *
	 * @return {*|array<*>} An accumulation of items.
	 */

	function accumulateInto(current, next) {
	  (true ? invariant(
	    next != null,
	    'accumulateInto(...): Accumulated items must not be null or undefined.'
	  ) : invariant(next != null));
	  if (current == null) {
	    return next;
	  }

	  // Both are not empty. Warning: Never call x.concat(y) when you are not
	  // certain that x is an Array (x could be a string with concat method).
	  var currentIsArray = Array.isArray(current);
	  var nextIsArray = Array.isArray(next);

	  if (currentIsArray && nextIsArray) {
	    current.push.apply(current, next);
	    return current;
	  }

	  if (currentIsArray) {
	    current.push(next);
	    return current;
	  }

	  if (nextIsArray) {
	    // A bit too dangerous to mutate `next`.
	    return [current].concat(next);
	  }

	  return [current, next];
	}

	module.exports = accumulateInto;

	},{"135":135}],106:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule adler32
	 */

	/* jslint bitwise:true */

	'use strict';

	var MOD = 65521;

	// This is a clean-room implementation of adler32 designed for detecting
	// if markup is not what we expect it to be. It does not need to be
	// cryptographically strong, only reasonably good at detecting if markup
	// generated on the server is different than that on the client.
	function adler32(data) {
	  var a = 1;
	  var b = 0;
	  for (var i = 0; i < data.length; i++) {
	    a = (a + data.charCodeAt(i)) % MOD;
	    b = (b + a) % MOD;
	  }
	  return a | (b << 16);
	}

	module.exports = adler32;

	},{}],107:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule camelize
	 * @typechecks
	 */

	var _hyphenPattern = /-(.)/g;

	/**
	 * Camelcases a hyphenated string, for example:
	 *
	 *   > camelize('background-color')
	 *   < "backgroundColor"
	 *
	 * @param {string} string
	 * @return {string}
	 */
	function camelize(string) {
	  return string.replace(_hyphenPattern, function(_, character) {
	    return character.toUpperCase();
	  });
	}

	module.exports = camelize;

	},{}],108:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule camelizeStyleName
	 * @typechecks
	 */

	"use strict";

	var camelize = _dereq_(107);

	var msPattern = /^-ms-/;

	/**
	 * Camelcases a hyphenated CSS property name, for example:
	 *
	 *   > camelizeStyleName('background-color')
	 *   < "backgroundColor"
	 *   > camelizeStyleName('-moz-transition')
	 *   < "MozTransition"
	 *   > camelizeStyleName('-ms-transition')
	 *   < "msTransition"
	 *
	 * As Andi Smith suggests
	 * (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
	 * is converted to lowercase `ms`.
	 *
	 * @param {string} string
	 * @return {string}
	 */
	function camelizeStyleName(string) {
	  return camelize(string.replace(msPattern, 'ms-'));
	}

	module.exports = camelizeStyleName;

	},{"107":107}],109:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule containsNode
	 * @typechecks
	 */

	var isTextNode = _dereq_(139);

	/*jslint bitwise:true */

	/**
	 * Checks if a given DOM node contains or is another DOM node.
	 *
	 * @param {?DOMNode} outerNode Outer DOM node.
	 * @param {?DOMNode} innerNode Inner DOM node.
	 * @return {boolean} True if `outerNode` contains or is `innerNode`.
	 */
	function containsNode(outerNode, innerNode) {
	  if (!outerNode || !innerNode) {
	    return false;
	  } else if (outerNode === innerNode) {
	    return true;
	  } else if (isTextNode(outerNode)) {
	    return false;
	  } else if (isTextNode(innerNode)) {
	    return containsNode(outerNode, innerNode.parentNode);
	  } else if (outerNode.contains) {
	    return outerNode.contains(innerNode);
	  } else if (outerNode.compareDocumentPosition) {
	    return !!(outerNode.compareDocumentPosition(innerNode) & 16);
	  } else {
	    return false;
	  }
	}

	module.exports = containsNode;

	},{"139":139}],110:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule createArrayFromMixed
	 * @typechecks
	 */

	var toArray = _dereq_(152);

	/**
	 * Perform a heuristic test to determine if an object is "array-like".
	 *
	 *   A monk asked Joshu, a Zen master, "Has a dog Buddha nature?"
	 *   Joshu replied: "Mu."
	 *
	 * This function determines if its argument has "array nature": it returns
	 * true if the argument is an actual array, an `arguments' object, or an
	 * HTMLCollection (e.g. node.childNodes or node.getElementsByTagName()).
	 *
	 * It will return false for other array-like objects like Filelist.
	 *
	 * @param {*} obj
	 * @return {boolean}
	 */
	function hasArrayNature(obj) {
	  return (
	    // not null/false
	    !!obj &&
	    // arrays are objects, NodeLists are functions in Safari
	    (typeof obj == 'object' || typeof obj == 'function') &&
	    // quacks like an array
	    ('length' in obj) &&
	    // not window
	    !('setInterval' in obj) &&
	    // no DOM node should be considered an array-like
	    // a 'select' element has 'length' and 'item' properties on IE8
	    (typeof obj.nodeType != 'number') &&
	    (
	      // a real array
	      (// HTMLCollection/NodeList
	      (Array.isArray(obj) ||
	      // arguments
	      ('callee' in obj) || 'item' in obj))
	    )
	  );
	}

	/**
	 * Ensure that the argument is an array by wrapping it in an array if it is not.
	 * Creates a copy of the argument if it is already an array.
	 *
	 * This is mostly useful idiomatically:
	 *
	 *   var createArrayFromMixed = require('createArrayFromMixed');
	 *
	 *   function takesOneOrMoreThings(things) {
	 *     things = createArrayFromMixed(things);
	 *     ...
	 *   }
	 *
	 * This allows you to treat `things' as an array, but accept scalars in the API.
	 *
	 * If you need to convert an array-like object, like `arguments`, into an array
	 * use toArray instead.
	 *
	 * @param {*} obj
	 * @return {array}
	 */
	function createArrayFromMixed(obj) {
	  if (!hasArrayNature(obj)) {
	    return [obj];
	  } else if (Array.isArray(obj)) {
	    return obj.slice();
	  } else {
	    return toArray(obj);
	  }
	}

	module.exports = createArrayFromMixed;

	},{"152":152}],111:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule createFullPageComponent
	 * @typechecks
	 */

	'use strict';

	// Defeat circular references by requiring this directly.
	var ReactClass = _dereq_(33);
	var ReactElement = _dereq_(57);

	var invariant = _dereq_(135);

	/**
	 * Create a component that will throw an exception when unmounted.
	 *
	 * Components like <html> <head> and <body> can't be removed or added
	 * easily in a cross-browser way, however it's valuable to be able to
	 * take advantage of React's reconciliation for styling and <title>
	 * management. So we just document it and throw in dangerous cases.
	 *
	 * @param {string} tag The tag to wrap
	 * @return {function} convenience constructor of new component
	 */
	function createFullPageComponent(tag) {
	  var elementFactory = ReactElement.createFactory(tag);

	  var FullPageComponent = ReactClass.createClass({
	    tagName: tag.toUpperCase(),
	    displayName: 'ReactFullPageComponent' + tag,

	    componentWillUnmount: function() {
	      (true ? invariant(
	        false,
	        '%s tried to unmount. Because of cross-browser quirks it is ' +
	        'impossible to unmount some top-level components (eg <html>, <head>, ' +
	        'and <body>) reliably and efficiently. To fix this, have a single ' +
	        'top-level component that never unmounts render these elements.',
	        this.constructor.displayName
	      ) : invariant(false));
	    },

	    render: function() {
	      return elementFactory(this.props);
	    }
	  });

	  return FullPageComponent;
	}

	module.exports = createFullPageComponent;

	},{"135":135,"33":33,"57":57}],112:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule createNodesFromMarkup
	 * @typechecks
	 */

	/*jslint evil: true, sub: true */

	var ExecutionEnvironment = _dereq_(21);

	var createArrayFromMixed = _dereq_(110);
	var getMarkupWrap = _dereq_(127);
	var invariant = _dereq_(135);

	/**
	 * Dummy container used to render all markup.
	 */
	var dummyNode =
	  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

	/**
	 * Pattern used by `getNodeName`.
	 */
	var nodeNamePattern = /^\s*<(\w+)/;

	/**
	 * Extracts the `nodeName` of the first element in a string of markup.
	 *
	 * @param {string} markup String of markup.
	 * @return {?string} Node name of the supplied markup.
	 */
	function getNodeName(markup) {
	  var nodeNameMatch = markup.match(nodeNamePattern);
	  return nodeNameMatch && nodeNameMatch[1].toLowerCase();
	}

	/**
	 * Creates an array containing the nodes rendered from the supplied markup. The
	 * optionally supplied `handleScript` function will be invoked once for each
	 * <script> element that is rendered. If no `handleScript` function is supplied,
	 * an exception is thrown if any <script> elements are rendered.
	 *
	 * @param {string} markup A string of valid HTML markup.
	 * @param {?function} handleScript Invoked once for each rendered <script>.
	 * @return {array<DOMElement|DOMTextNode>} An array of rendered nodes.
	 */
	function createNodesFromMarkup(markup, handleScript) {
	  var node = dummyNode;
	  (true ? invariant(!!dummyNode, 'createNodesFromMarkup dummy not initialized') : invariant(!!dummyNode));
	  var nodeName = getNodeName(markup);

	  var wrap = nodeName && getMarkupWrap(nodeName);
	  if (wrap) {
	    node.innerHTML = wrap[1] + markup + wrap[2];

	    var wrapDepth = wrap[0];
	    while (wrapDepth--) {
	      node = node.lastChild;
	    }
	  } else {
	    node.innerHTML = markup;
	  }

	  var scripts = node.getElementsByTagName('script');
	  if (scripts.length) {
	    (true ? invariant(
	      handleScript,
	      'createNodesFromMarkup(...): Unexpected <script> element rendered.'
	    ) : invariant(handleScript));
	    createArrayFromMixed(scripts).forEach(handleScript);
	  }

	  var nodes = createArrayFromMixed(node.childNodes);
	  while (node.lastChild) {
	    node.removeChild(node.lastChild);
	  }
	  return nodes;
	}

	module.exports = createNodesFromMarkup;

	},{"110":110,"127":127,"135":135,"21":21}],113:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule dangerousStyleValue
	 * @typechecks static-only
	 */

	'use strict';

	var CSSProperty = _dereq_(4);

	var isUnitlessNumber = CSSProperty.isUnitlessNumber;

	/**
	 * Convert a value into the proper css writable value. The style name `name`
	 * should be logical (no hyphens), as specified
	 * in `CSSProperty.isUnitlessNumber`.
	 *
	 * @param {string} name CSS property name such as `topMargin`.
	 * @param {*} value CSS property value such as `10px`.
	 * @return {string} Normalized style value with dimensions applied.
	 */
	function dangerousStyleValue(name, value) {
	  // Note that we've removed escapeTextForBrowser() calls here since the
	  // whole string will be escaped when the attribute is injected into
	  // the markup. If you provide unsafe user data here they can inject
	  // arbitrary CSS which may be problematic (I couldn't repro this):
	  // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
	  // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
	  // This is not an XSS hole but instead a potential CSS injection issue
	  // which has lead to a greater discussion about how we're going to
	  // trust URLs moving forward. See #2115901

	  var isEmpty = value == null || typeof value === 'boolean' || value === '';
	  if (isEmpty) {
	    return '';
	  }

	  var isNonNumeric = isNaN(value);
	  if (isNonNumeric || value === 0 ||
	      isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name]) {
	    return '' + value; // cast to string
	  }

	  if (typeof value === 'string') {
	    value = value.trim();
	  }
	  return value + 'px';
	}

	module.exports = dangerousStyleValue;

	},{"4":4}],114:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule emptyFunction
	 */

	function makeEmptyFunction(arg) {
	  return function() {
	    return arg;
	  };
	}

	/**
	 * This function accepts and discards inputs; it has no side effects. This is
	 * primarily useful idiomatically for overridable function endpoints which
	 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
	 */
	function emptyFunction() {}

	emptyFunction.thatReturns = makeEmptyFunction;
	emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
	emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
	emptyFunction.thatReturnsNull = makeEmptyFunction(null);
	emptyFunction.thatReturnsThis = function() { return this; };
	emptyFunction.thatReturnsArgument = function(arg) { return arg; };

	module.exports = emptyFunction;

	},{}],115:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule emptyObject
	 */

	"use strict";

	var emptyObject = {};

	if (true) {
	  Object.freeze(emptyObject);
	}

	module.exports = emptyObject;

	},{}],116:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule escapeTextContentForBrowser
	 */

	'use strict';

	var ESCAPE_LOOKUP = {
	  '&': '&amp;',
	  '>': '&gt;',
	  '<': '&lt;',
	  '"': '&quot;',
	  '\'': '&#x27;'
	};

	var ESCAPE_REGEX = /[&><"']/g;

	function escaper(match) {
	  return ESCAPE_LOOKUP[match];
	}

	/**
	 * Escapes text to prevent scripting attacks.
	 *
	 * @param {*} text Text value to escape.
	 * @return {string} An escaped string.
	 */
	function escapeTextContentForBrowser(text) {
	  return ('' + text).replace(ESCAPE_REGEX, escaper);
	}

	module.exports = escapeTextContentForBrowser;

	},{}],117:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule findDOMNode
	 * @typechecks static-only
	 */

	'use strict';

	var ReactCurrentOwner = _dereq_(39);
	var ReactInstanceMap = _dereq_(67);
	var ReactMount = _dereq_(70);

	var invariant = _dereq_(135);
	var isNode = _dereq_(137);
	var warning = _dereq_(154);

	/**
	 * Returns the DOM node rendered by this element.
	 *
	 * @param {ReactComponent|DOMElement} componentOrElement
	 * @return {DOMElement} The root node of this element.
	 */
	function findDOMNode(componentOrElement) {
	  if (true) {
	    var owner = ReactCurrentOwner.current;
	    if (owner !== null) {
	      (true ? warning(
	        owner._warnedAboutRefsInRender,
	        '%s is accessing getDOMNode or findDOMNode inside its render(). ' +
	        'render() should be a pure function of props and state. It should ' +
	        'never access something that requires stale data from the previous ' +
	        'render, such as refs. Move this logic to componentDidMount and ' +
	        'componentDidUpdate instead.',
	        owner.getName() || 'A component'
	      ) : null);
	      owner._warnedAboutRefsInRender = true;
	    }
	  }
	  if (componentOrElement == null) {
	    return null;
	  }
	  if (isNode(componentOrElement)) {
	    return componentOrElement;
	  }
	  if (ReactInstanceMap.has(componentOrElement)) {
	    return ReactMount.getNodeFromInstance(componentOrElement);
	  }
	  (true ? invariant(
	    componentOrElement.render == null ||
	    typeof componentOrElement.render !== 'function',
	    'Component (with keys: %s) contains `render` method ' +
	    'but is not mounted in the DOM',
	    Object.keys(componentOrElement)
	  ) : invariant(componentOrElement.render == null ||
	  typeof componentOrElement.render !== 'function'));
	  (true ? invariant(
	    false,
	    'Element appears to be neither ReactComponent nor DOMNode (keys: %s)',
	    Object.keys(componentOrElement)
	  ) : invariant(false));
	}

	module.exports = findDOMNode;

	},{"135":135,"137":137,"154":154,"39":39,"67":67,"70":70}],118:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule flattenChildren
	 */

	'use strict';

	var traverseAllChildren = _dereq_(153);
	var warning = _dereq_(154);

	/**
	 * @param {function} traverseContext Context passed through traversal.
	 * @param {?ReactComponent} child React child component.
	 * @param {!string} name String name of key path to child.
	 */
	function flattenSingleChildIntoContext(traverseContext, child, name) {
	  // We found a component instance.
	  var result = traverseContext;
	  var keyUnique = !result.hasOwnProperty(name);
	  if (true) {
	    (true ? warning(
	      keyUnique,
	      'flattenChildren(...): Encountered two children with the same key, ' +
	      '`%s`. Child keys must be unique; when two children share a key, only ' +
	      'the first child will be used.',
	      name
	    ) : null);
	  }
	  if (keyUnique && child != null) {
	    result[name] = child;
	  }
	}

	/**
	 * Flattens children that are typically specified as `props.children`. Any null
	 * children will not be included in the resulting object.
	 * @return {!object} flattened children keyed by name.
	 */
	function flattenChildren(children) {
	  if (children == null) {
	    return children;
	  }
	  var result = {};
	  traverseAllChildren(children, flattenSingleChildIntoContext, result);
	  return result;
	}

	module.exports = flattenChildren;

	},{"153":153,"154":154}],119:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule focusNode
	 */

	"use strict";

	/**
	 * @param {DOMElement} node input/textarea to focus
	 */
	function focusNode(node) {
	  // IE8 can throw "Can't move focus to the control because it is invisible,
	  // not enabled, or of a type that does not accept the focus." for all kinds of
	  // reasons that are too expensive and fragile to test.
	  try {
	    node.focus();
	  } catch(e) {
	  }
	}

	module.exports = focusNode;

	},{}],120:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule forEachAccumulated
	 */

	'use strict';

	/**
	 * @param {array} an "accumulation" of items which is either an Array or
	 * a single item. Useful when paired with the `accumulate` module. This is a
	 * simple utility that allows us to reason about a collection of items, but
	 * handling the case when there is exactly one item (and we do not need to
	 * allocate an array).
	 */
	var forEachAccumulated = function(arr, cb, scope) {
	  if (Array.isArray(arr)) {
	    arr.forEach(cb, scope);
	  } else if (arr) {
	    cb.call(scope, arr);
	  }
	};

	module.exports = forEachAccumulated;

	},{}],121:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getActiveElement
	 * @typechecks
	 */

	/**
	 * Same as document.activeElement but wraps in a try-catch block. In IE it is
	 * not safe to call document.activeElement if there is nothing focused.
	 *
	 * The activeElement will be null only if the document body is not yet defined.
	 */
	function getActiveElement() /*?DOMElement*/ {
	  try {
	    return document.activeElement || document.body;
	  } catch (e) {
	    return document.body;
	  }
	}

	module.exports = getActiveElement;

	},{}],122:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getEventCharCode
	 * @typechecks static-only
	 */

	'use strict';

	/**
	 * `charCode` represents the actual "character code" and is safe to use with
	 * `String.fromCharCode`. As such, only keys that correspond to printable
	 * characters produce a valid `charCode`, the only exception to this is Enter.
	 * The Tab-key is considered non-printable and does not have a `charCode`,
	 * presumably because it does not produce a tab-character in browsers.
	 *
	 * @param {object} nativeEvent Native browser event.
	 * @return {string} Normalized `charCode` property.
	 */
	function getEventCharCode(nativeEvent) {
	  var charCode;
	  var keyCode = nativeEvent.keyCode;

	  if ('charCode' in nativeEvent) {
	    charCode = nativeEvent.charCode;

	    // FF does not set `charCode` for the Enter-key, check against `keyCode`.
	    if (charCode === 0 && keyCode === 13) {
	      charCode = 13;
	    }
	  } else {
	    // IE8 does not implement `charCode`, but `keyCode` has the correct value.
	    charCode = keyCode;
	  }

	  // Some non-printable keys are reported in `charCode`/`keyCode`, discard them.
	  // Must not discard the (non-)printable Enter-key.
	  if (charCode >= 32 || charCode === 13) {
	    return charCode;
	  }

	  return 0;
	}

	module.exports = getEventCharCode;

	},{}],123:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getEventKey
	 * @typechecks static-only
	 */

	'use strict';

	var getEventCharCode = _dereq_(122);

	/**
	 * Normalization of deprecated HTML5 `key` values
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
	 */
	var normalizeKey = {
	  'Esc': 'Escape',
	  'Spacebar': ' ',
	  'Left': 'ArrowLeft',
	  'Up': 'ArrowUp',
	  'Right': 'ArrowRight',
	  'Down': 'ArrowDown',
	  'Del': 'Delete',
	  'Win': 'OS',
	  'Menu': 'ContextMenu',
	  'Apps': 'ContextMenu',
	  'Scroll': 'ScrollLock',
	  'MozPrintableKey': 'Unidentified'
	};

	/**
	 * Translation from legacy `keyCode` to HTML5 `key`
	 * Only special keys supported, all others depend on keyboard layout or browser
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Key_names
	 */
	var translateToKey = {
	  8: 'Backspace',
	  9: 'Tab',
	  12: 'Clear',
	  13: 'Enter',
	  16: 'Shift',
	  17: 'Control',
	  18: 'Alt',
	  19: 'Pause',
	  20: 'CapsLock',
	  27: 'Escape',
	  32: ' ',
	  33: 'PageUp',
	  34: 'PageDown',
	  35: 'End',
	  36: 'Home',
	  37: 'ArrowLeft',
	  38: 'ArrowUp',
	  39: 'ArrowRight',
	  40: 'ArrowDown',
	  45: 'Insert',
	  46: 'Delete',
	  112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6',
	  118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
	  144: 'NumLock',
	  145: 'ScrollLock',
	  224: 'Meta'
	};

	/**
	 * @param {object} nativeEvent Native browser event.
	 * @return {string} Normalized `key` property.
	 */
	function getEventKey(nativeEvent) {
	  if (nativeEvent.key) {
	    // Normalize inconsistent values reported by browsers due to
	    // implementations of a working draft specification.

	    // FireFox implements `key` but returns `MozPrintableKey` for all
	    // printable characters (normalized to `Unidentified`), ignore it.
	    var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
	    if (key !== 'Unidentified') {
	      return key;
	    }
	  }

	  // Browser does not implement `key`, polyfill as much of it as we can.
	  if (nativeEvent.type === 'keypress') {
	    var charCode = getEventCharCode(nativeEvent);

	    // The enter-key is technically both printable and non-printable and can
	    // thus be captured by `keypress`, no other non-printable key should.
	    return charCode === 13 ? 'Enter' : String.fromCharCode(charCode);
	  }
	  if (nativeEvent.type === 'keydown' || nativeEvent.type === 'keyup') {
	    // While user keyboard layout determines the actual meaning of each
	    // `keyCode` value, almost all function keys have a universal value.
	    return translateToKey[nativeEvent.keyCode] || 'Unidentified';
	  }
	  return '';
	}

	module.exports = getEventKey;

	},{"122":122}],124:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getEventModifierState
	 * @typechecks static-only
	 */

	'use strict';

	/**
	 * Translation from modifier key to the associated property in the event.
	 * @see http://www.w3.org/TR/DOM-Level-3-Events/#keys-Modifiers
	 */

	var modifierKeyToProp = {
	  'Alt': 'altKey',
	  'Control': 'ctrlKey',
	  'Meta': 'metaKey',
	  'Shift': 'shiftKey'
	};

	// IE8 does not implement getModifierState so we simply map it to the only
	// modifier keys exposed by the event itself, does not support Lock-keys.
	// Currently, all major browsers except Chrome seems to support Lock-keys.
	function modifierStateGetter(keyArg) {
	  /*jshint validthis:true */
	  var syntheticEvent = this;
	  var nativeEvent = syntheticEvent.nativeEvent;
	  if (nativeEvent.getModifierState) {
	    return nativeEvent.getModifierState(keyArg);
	  }
	  var keyProp = modifierKeyToProp[keyArg];
	  return keyProp ? !!nativeEvent[keyProp] : false;
	}

	function getEventModifierState(nativeEvent) {
	  return modifierStateGetter;
	}

	module.exports = getEventModifierState;

	},{}],125:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getEventTarget
	 * @typechecks static-only
	 */

	'use strict';

	/**
	 * Gets the target node from a native browser event by accounting for
	 * inconsistencies in browser DOM APIs.
	 *
	 * @param {object} nativeEvent Native browser event.
	 * @return {DOMEventTarget} Target node.
	 */
	function getEventTarget(nativeEvent) {
	  var target = nativeEvent.target || nativeEvent.srcElement || window;
	  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
	  // @see http://www.quirksmode.org/js/events_properties.html
	  return target.nodeType === 3 ? target.parentNode : target;
	}

	module.exports = getEventTarget;

	},{}],126:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getIteratorFn
	 * @typechecks static-only
	 */

	'use strict';

	/* global Symbol */
	var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
	var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

	/**
	 * Returns the iterator method function contained on the iterable object.
	 *
	 * Be sure to invoke the function with the iterable as context:
	 *
	 *     var iteratorFn = getIteratorFn(myIterable);
	 *     if (iteratorFn) {
	 *       var iterator = iteratorFn.call(myIterable);
	 *       ...
	 *     }
	 *
	 * @param {?object} maybeIterable
	 * @return {?function}
	 */
	function getIteratorFn(maybeIterable) {
	  var iteratorFn = maybeIterable && (
	    (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL])
	  );
	  if (typeof iteratorFn === 'function') {
	    return iteratorFn;
	  }
	}

	module.exports = getIteratorFn;

	},{}],127:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getMarkupWrap
	 */

	var ExecutionEnvironment = _dereq_(21);

	var invariant = _dereq_(135);

	/**
	 * Dummy container used to detect which wraps are necessary.
	 */
	var dummyNode =
	  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

	/**
	 * Some browsers cannot use `innerHTML` to render certain elements standalone,
	 * so we wrap them, render the wrapped nodes, then extract the desired node.
	 *
	 * In IE8, certain elements cannot render alone, so wrap all elements ('*').
	 */
	var shouldWrap = {
	  // Force wrapping for SVG elements because if they get created inside a <div>,
	  // they will be initialized in the wrong namespace (and will not display).
	  'circle': true,
	  'clipPath': true,
	  'defs': true,
	  'ellipse': true,
	  'g': true,
	  'line': true,
	  'linearGradient': true,
	  'path': true,
	  'polygon': true,
	  'polyline': true,
	  'radialGradient': true,
	  'rect': true,
	  'stop': true,
	  'text': true
	};

	var selectWrap = [1, '<select multiple="true">', '</select>'];
	var tableWrap = [1, '<table>', '</table>'];
	var trWrap = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

	var svgWrap = [1, '<svg>', '</svg>'];

	var markupWrap = {
	  '*': [1, '?<div>', '</div>'],

	  'area': [1, '<map>', '</map>'],
	  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
	  'legend': [1, '<fieldset>', '</fieldset>'],
	  'param': [1, '<object>', '</object>'],
	  'tr': [2, '<table><tbody>', '</tbody></table>'],

	  'optgroup': selectWrap,
	  'option': selectWrap,

	  'caption': tableWrap,
	  'colgroup': tableWrap,
	  'tbody': tableWrap,
	  'tfoot': tableWrap,
	  'thead': tableWrap,

	  'td': trWrap,
	  'th': trWrap,

	  'circle': svgWrap,
	  'clipPath': svgWrap,
	  'defs': svgWrap,
	  'ellipse': svgWrap,
	  'g': svgWrap,
	  'line': svgWrap,
	  'linearGradient': svgWrap,
	  'path': svgWrap,
	  'polygon': svgWrap,
	  'polyline': svgWrap,
	  'radialGradient': svgWrap,
	  'rect': svgWrap,
	  'stop': svgWrap,
	  'text': svgWrap
	};

	/**
	 * Gets the markup wrap configuration for the supplied `nodeName`.
	 *
	 * NOTE: This lazily detects which wraps are necessary for the current browser.
	 *
	 * @param {string} nodeName Lowercase `nodeName`.
	 * @return {?array} Markup wrap configuration, if applicable.
	 */
	function getMarkupWrap(nodeName) {
	  (true ? invariant(!!dummyNode, 'Markup wrapping node not initialized') : invariant(!!dummyNode));
	  if (!markupWrap.hasOwnProperty(nodeName)) {
	    nodeName = '*';
	  }
	  if (!shouldWrap.hasOwnProperty(nodeName)) {
	    if (nodeName === '*') {
	      dummyNode.innerHTML = '<link />';
	    } else {
	      dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
	    }
	    shouldWrap[nodeName] = !dummyNode.firstChild;
	  }
	  return shouldWrap[nodeName] ? markupWrap[nodeName] : null;
	}


	module.exports = getMarkupWrap;

	},{"135":135,"21":21}],128:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getNodeForCharacterOffset
	 */

	'use strict';

	/**
	 * Given any node return the first leaf node without children.
	 *
	 * @param {DOMElement|DOMTextNode} node
	 * @return {DOMElement|DOMTextNode}
	 */
	function getLeafNode(node) {
	  while (node && node.firstChild) {
	    node = node.firstChild;
	  }
	  return node;
	}

	/**
	 * Get the next sibling within a container. This will walk up the
	 * DOM if a node's siblings have been exhausted.
	 *
	 * @param {DOMElement|DOMTextNode} node
	 * @return {?DOMElement|DOMTextNode}
	 */
	function getSiblingNode(node) {
	  while (node) {
	    if (node.nextSibling) {
	      return node.nextSibling;
	    }
	    node = node.parentNode;
	  }
	}

	/**
	 * Get object describing the nodes which contain characters at offset.
	 *
	 * @param {DOMElement|DOMTextNode} root
	 * @param {number} offset
	 * @return {?object}
	 */
	function getNodeForCharacterOffset(root, offset) {
	  var node = getLeafNode(root);
	  var nodeStart = 0;
	  var nodeEnd = 0;

	  while (node) {
	    if (node.nodeType === 3) {
	      nodeEnd = nodeStart + node.textContent.length;

	      if (nodeStart <= offset && nodeEnd >= offset) {
	        return {
	          node: node,
	          offset: offset - nodeStart
	        };
	      }

	      nodeStart = nodeEnd;
	    }

	    node = getLeafNode(getSiblingNode(node));
	  }
	}

	module.exports = getNodeForCharacterOffset;

	},{}],129:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getReactRootElementInContainer
	 */

	'use strict';

	var DOC_NODE_TYPE = 9;

	/**
	 * @param {DOMElement|DOMDocument} container DOM element that may contain
	 *                                           a React component
	 * @return {?*} DOM element that may have the reactRoot ID, or null.
	 */
	function getReactRootElementInContainer(container) {
	  if (!container) {
	    return null;
	  }

	  if (container.nodeType === DOC_NODE_TYPE) {
	    return container.documentElement;
	  } else {
	    return container.firstChild;
	  }
	}

	module.exports = getReactRootElementInContainer;

	},{}],130:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getTextContentAccessor
	 */

	'use strict';

	var ExecutionEnvironment = _dereq_(21);

	var contentKey = null;

	/**
	 * Gets the key used to access text content on a DOM node.
	 *
	 * @return {?string} Key used to access text content.
	 * @internal
	 */
	function getTextContentAccessor() {
	  if (!contentKey && ExecutionEnvironment.canUseDOM) {
	    // Prefer textContent to innerText because many browsers support both but
	    // SVG <text> elements don't support innerText even when <div> does.
	    contentKey = 'textContent' in document.documentElement ?
	      'textContent' :
	      'innerText';
	  }
	  return contentKey;
	}

	module.exports = getTextContentAccessor;

	},{"21":21}],131:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule getUnboundedScrollPosition
	 * @typechecks
	 */

	"use strict";

	/**
	 * Gets the scroll position of the supplied element or window.
	 *
	 * The return values are unbounded, unlike `getScrollPosition`. This means they
	 * may be negative or exceed the element boundaries (which is possible using
	 * inertial scrolling).
	 *
	 * @param {DOMWindow|DOMElement} scrollable
	 * @return {object} Map with `x` and `y` keys.
	 */
	function getUnboundedScrollPosition(scrollable) {
	  if (scrollable === window) {
	    return {
	      x: window.pageXOffset || document.documentElement.scrollLeft,
	      y: window.pageYOffset || document.documentElement.scrollTop
	    };
	  }
	  return {
	    x: scrollable.scrollLeft,
	    y: scrollable.scrollTop
	  };
	}

	module.exports = getUnboundedScrollPosition;

	},{}],132:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule hyphenate
	 * @typechecks
	 */

	var _uppercasePattern = /([A-Z])/g;

	/**
	 * Hyphenates a camelcased string, for example:
	 *
	 *   > hyphenate('backgroundColor')
	 *   < "background-color"
	 *
	 * For CSS style names, use `hyphenateStyleName` instead which works properly
	 * with all vendor prefixes, including `ms`.
	 *
	 * @param {string} string
	 * @return {string}
	 */
	function hyphenate(string) {
	  return string.replace(_uppercasePattern, '-$1').toLowerCase();
	}

	module.exports = hyphenate;

	},{}],133:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule hyphenateStyleName
	 * @typechecks
	 */

	"use strict";

	var hyphenate = _dereq_(132);

	var msPattern = /^ms-/;

	/**
	 * Hyphenates a camelcased CSS property name, for example:
	 *
	 *   > hyphenateStyleName('backgroundColor')
	 *   < "background-color"
	 *   > hyphenateStyleName('MozTransition')
	 *   < "-moz-transition"
	 *   > hyphenateStyleName('msTransition')
	 *   < "-ms-transition"
	 *
	 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
	 * is converted to `-ms-`.
	 *
	 * @param {string} string
	 * @return {string}
	 */
	function hyphenateStyleName(string) {
	  return hyphenate(string).replace(msPattern, '-ms-');
	}

	module.exports = hyphenateStyleName;

	},{"132":132}],134:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule instantiateReactComponent
	 * @typechecks static-only
	 */

	'use strict';

	var ReactCompositeComponent = _dereq_(37);
	var ReactEmptyComponent = _dereq_(59);
	var ReactNativeComponent = _dereq_(73);

	var assign = _dereq_(27);
	var invariant = _dereq_(135);
	var warning = _dereq_(154);

	// To avoid a cyclic dependency, we create the final class in this module
	var ReactCompositeComponentWrapper = function() { };
	assign(
	  ReactCompositeComponentWrapper.prototype,
	  ReactCompositeComponent.Mixin,
	  {
	    _instantiateReactComponent: instantiateReactComponent
	  }
	);

	/**
	 * Check if the type reference is a known internal type. I.e. not a user
	 * provided composite type.
	 *
	 * @param {function} type
	 * @return {boolean} Returns true if this is a valid internal type.
	 */
	function isInternalComponentType(type) {
	  return (
	    typeof type === 'function' &&
	    typeof type.prototype !== 'undefined' &&
	    typeof type.prototype.mountComponent === 'function' &&
	    typeof type.prototype.receiveComponent === 'function'
	  );
	}

	/**
	 * Given a ReactNode, create an instance that will actually be mounted.
	 *
	 * @param {ReactNode} node
	 * @param {*} parentCompositeType The composite type that resolved this.
	 * @return {object} A new instance of the element's constructor.
	 * @protected
	 */
	function instantiateReactComponent(node, parentCompositeType) {
	  var instance;

	  if (node === null || node === false) {
	    node = ReactEmptyComponent.emptyElement;
	  }

	  if (typeof node === 'object') {
	    var element = node;
	    if (true) {
	      (true ? warning(
	        element && (typeof element.type === 'function' ||
	                    typeof element.type === 'string'),
	        'Only functions or strings can be mounted as React components.'
	      ) : null);
	    }

	    // Special case string values
	    if (parentCompositeType === element.type &&
	        typeof element.type === 'string') {
	      // Avoid recursion if the wrapper renders itself.
	      instance = ReactNativeComponent.createInternalComponent(element);
	      // All native components are currently wrapped in a composite so we're
	      // safe to assume that this is what we should instantiate.
	    } else if (isInternalComponentType(element.type)) {
	      // This is temporarily available for custom components that are not string
	      // represenations. I.e. ART. Once those are updated to use the string
	      // representation, we can drop this code path.
	      instance = new element.type(element);
	    } else {
	      instance = new ReactCompositeComponentWrapper();
	    }
	  } else if (typeof node === 'string' || typeof node === 'number') {
	    instance = ReactNativeComponent.createInstanceForText(node);
	  } else {
	    (true ? invariant(
	      false,
	      'Encountered invalid React node of type %s',
	      typeof node
	    ) : invariant(false));
	  }

	  if (true) {
	    (true ? warning(
	      typeof instance.construct === 'function' &&
	      typeof instance.mountComponent === 'function' &&
	      typeof instance.receiveComponent === 'function' &&
	      typeof instance.unmountComponent === 'function',
	      'Only React Components can be mounted.'
	    ) : null);
	  }

	  // Sets up the instance. This can probably just move into the constructor now.
	  instance.construct(node);

	  // These two fields are used by the DOM and ART diffing algorithms
	  // respectively. Instead of using expandos on components, we should be
	  // storing the state needed by the diffing algorithms elsewhere.
	  instance._mountIndex = 0;
	  instance._mountImage = null;

	  if (true) {
	    instance._isOwnerNecessary = false;
	    instance._warnedAboutRefsInRender = false;
	  }

	  // Internal instances should fully constructed at this point, so they should
	  // not get any new fields added to them at this point.
	  if (true) {
	    if (Object.preventExtensions) {
	      Object.preventExtensions(instance);
	    }
	  }

	  return instance;
	}

	module.exports = instantiateReactComponent;

	},{"135":135,"154":154,"27":27,"37":37,"59":59,"73":73}],135:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule invariant
	 */

	"use strict";

	/**
	 * Use invariant() to assert state which your program assumes to be true.
	 *
	 * Provide sprintf-style format (only %s is supported) and arguments
	 * to provide information about what broke and what you were
	 * expecting.
	 *
	 * The invariant message will be stripped in production, but the invariant
	 * will remain to ensure logic does not differ in production.
	 */

	var invariant = function(condition, format, a, b, c, d, e, f) {
	  if (true) {
	    if (format === undefined) {
	      throw new Error('invariant requires an error message argument');
	    }
	  }

	  if (!condition) {
	    var error;
	    if (format === undefined) {
	      error = new Error(
	        'Minified exception occurred; use the non-minified dev environment ' +
	        'for the full error message and additional helpful warnings.'
	      );
	    } else {
	      var args = [a, b, c, d, e, f];
	      var argIndex = 0;
	      error = new Error(
	        'Invariant Violation: ' +
	        format.replace(/%s/g, function() { return args[argIndex++]; })
	      );
	    }

	    error.framesToPop = 1; // we don't care about invariant's own frame
	    throw error;
	  }
	};

	module.exports = invariant;

	},{}],136:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule isEventSupported
	 */

	'use strict';

	var ExecutionEnvironment = _dereq_(21);

	var useHasFeature;
	if (ExecutionEnvironment.canUseDOM) {
	  useHasFeature =
	    document.implementation &&
	    document.implementation.hasFeature &&
	    // always returns true in newer browsers as per the standard.
	    // @see http://dom.spec.whatwg.org/#dom-domimplementation-hasfeature
	    document.implementation.hasFeature('', '') !== true;
	}

	/**
	 * Checks if an event is supported in the current execution environment.
	 *
	 * NOTE: This will not work correctly for non-generic events such as `change`,
	 * `reset`, `load`, `error`, and `select`.
	 *
	 * Borrows from Modernizr.
	 *
	 * @param {string} eventNameSuffix Event name, e.g. "click".
	 * @param {?boolean} capture Check if the capture phase is supported.
	 * @return {boolean} True if the event is supported.
	 * @internal
	 * @license Modernizr 3.0.0pre (Custom Build) | MIT
	 */
	function isEventSupported(eventNameSuffix, capture) {
	  if (!ExecutionEnvironment.canUseDOM ||
	      capture && !('addEventListener' in document)) {
	    return false;
	  }

	  var eventName = 'on' + eventNameSuffix;
	  var isSupported = eventName in document;

	  if (!isSupported) {
	    var element = document.createElement('div');
	    element.setAttribute(eventName, 'return;');
	    isSupported = typeof element[eventName] === 'function';
	  }

	  if (!isSupported && useHasFeature && eventNameSuffix === 'wheel') {
	    // This is the only way to test support for the `wheel` event in IE9+.
	    isSupported = document.implementation.hasFeature('Events.wheel', '3.0');
	  }

	  return isSupported;
	}

	module.exports = isEventSupported;

	},{"21":21}],137:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule isNode
	 * @typechecks
	 */

	/**
	 * @param {*} object The object to check.
	 * @return {boolean} Whether or not the object is a DOM node.
	 */
	function isNode(object) {
	  return !!(object && (
	    ((typeof Node === 'function' ? object instanceof Node : typeof object === 'object' &&
	    typeof object.nodeType === 'number' &&
	    typeof object.nodeName === 'string'))
	  ));
	}

	module.exports = isNode;

	},{}],138:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule isTextInputElement
	 */

	'use strict';

	/**
	 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
	 */
	var supportedInputTypes = {
	  'color': true,
	  'date': true,
	  'datetime': true,
	  'datetime-local': true,
	  'email': true,
	  'month': true,
	  'number': true,
	  'password': true,
	  'range': true,
	  'search': true,
	  'tel': true,
	  'text': true,
	  'time': true,
	  'url': true,
	  'week': true
	};

	function isTextInputElement(elem) {
	  return elem && (
	    (elem.nodeName === 'INPUT' && supportedInputTypes[elem.type] || elem.nodeName === 'TEXTAREA')
	  );
	}

	module.exports = isTextInputElement;

	},{}],139:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule isTextNode
	 * @typechecks
	 */

	var isNode = _dereq_(137);

	/**
	 * @param {*} object The object to check.
	 * @return {boolean} Whether or not the object is a DOM text node.
	 */
	function isTextNode(object) {
	  return isNode(object) && object.nodeType == 3;
	}

	module.exports = isTextNode;

	},{"137":137}],140:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule keyMirror
	 * @typechecks static-only
	 */

	'use strict';

	var invariant = _dereq_(135);

	/**
	 * Constructs an enumeration with keys equal to their value.
	 *
	 * For example:
	 *
	 *   var COLORS = keyMirror({blue: null, red: null});
	 *   var myColor = COLORS.blue;
	 *   var isColorValid = !!COLORS[myColor];
	 *
	 * The last line could not be performed if the values of the generated enum were
	 * not equal to their keys.
	 *
	 *   Input:  {key1: val1, key2: val2}
	 *   Output: {key1: key1, key2: key2}
	 *
	 * @param {object} obj
	 * @return {object}
	 */
	var keyMirror = function(obj) {
	  var ret = {};
	  var key;
	  (true ? invariant(
	    obj instanceof Object && !Array.isArray(obj),
	    'keyMirror(...): Argument must be an object.'
	  ) : invariant(obj instanceof Object && !Array.isArray(obj)));
	  for (key in obj) {
	    if (!obj.hasOwnProperty(key)) {
	      continue;
	    }
	    ret[key] = key;
	  }
	  return ret;
	};

	module.exports = keyMirror;

	},{"135":135}],141:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule keyOf
	 */

	/**
	 * Allows extraction of a minified key. Let's the build system minify keys
	 * without loosing the ability to dynamically use key strings as values
	 * themselves. Pass in an object with a single key/val pair and it will return
	 * you the string key of that single record. Suppose you want to grab the
	 * value for a key 'className' inside of an object. Key/val minification may
	 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
	 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
	 * reuse those resolutions.
	 */
	var keyOf = function(oneKeyObj) {
	  var key;
	  for (key in oneKeyObj) {
	    if (!oneKeyObj.hasOwnProperty(key)) {
	      continue;
	    }
	    return key;
	  }
	  return null;
	};


	module.exports = keyOf;

	},{}],142:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule mapObject
	 */

	'use strict';

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	/**
	 * Executes the provided `callback` once for each enumerable own property in the
	 * object and constructs a new object from the results. The `callback` is
	 * invoked with three arguments:
	 *
	 *  - the property value
	 *  - the property name
	 *  - the object being traversed
	 *
	 * Properties that are added after the call to `mapObject` will not be visited
	 * by `callback`. If the values of existing properties are changed, the value
	 * passed to `callback` will be the value at the time `mapObject` visits them.
	 * Properties that are deleted before being visited are not visited.
	 *
	 * @grep function objectMap()
	 * @grep function objMap()
	 *
	 * @param {?object} object
	 * @param {function} callback
	 * @param {*} context
	 * @return {?object}
	 */
	function mapObject(object, callback, context) {
	  if (!object) {
	    return null;
	  }
	  var result = {};
	  for (var name in object) {
	    if (hasOwnProperty.call(object, name)) {
	      result[name] = callback.call(context, object[name], name, object);
	    }
	  }
	  return result;
	}

	module.exports = mapObject;

	},{}],143:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule memoizeStringOnly
	 * @typechecks static-only
	 */

	'use strict';

	/**
	 * Memoizes the return value of a function that accepts one string argument.
	 *
	 * @param {function} callback
	 * @return {function}
	 */
	function memoizeStringOnly(callback) {
	  var cache = {};
	  return function(string) {
	    if (!cache.hasOwnProperty(string)) {
	      cache[string] = callback.call(this, string);
	    }
	    return cache[string];
	  };
	}

	module.exports = memoizeStringOnly;

	},{}],144:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule onlyChild
	 */
	'use strict';

	var ReactElement = _dereq_(57);

	var invariant = _dereq_(135);

	/**
	 * Returns the first child in a collection of children and verifies that there
	 * is only one child in the collection. The current implementation of this
	 * function assumes that a single child gets passed without a wrapper, but the
	 * purpose of this helper function is to abstract away the particular structure
	 * of children.
	 *
	 * @param {?object} children Child collection structure.
	 * @return {ReactComponent} The first and only `ReactComponent` contained in the
	 * structure.
	 */
	function onlyChild(children) {
	  (true ? invariant(
	    ReactElement.isValidElement(children),
	    'onlyChild must be passed a children with exactly one child.'
	  ) : invariant(ReactElement.isValidElement(children)));
	  return children;
	}

	module.exports = onlyChild;

	},{"135":135,"57":57}],145:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule performance
	 * @typechecks
	 */

	"use strict";

	var ExecutionEnvironment = _dereq_(21);

	var performance;

	if (ExecutionEnvironment.canUseDOM) {
	  performance =
	    window.performance ||
	    window.msPerformance ||
	    window.webkitPerformance;
	}

	module.exports = performance || {};

	},{"21":21}],146:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule performanceNow
	 * @typechecks
	 */

	var performance = _dereq_(145);

	/**
	 * Detect if we can use `window.performance.now()` and gracefully fallback to
	 * `Date.now()` if it doesn't exist. We need to support Firefox < 15 for now
	 * because of Facebook's testing infrastructure.
	 */
	if (!performance || !performance.now) {
	  performance = Date;
	}

	var performanceNow = performance.now.bind(performance);

	module.exports = performanceNow;

	},{"145":145}],147:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule quoteAttributeValueForBrowser
	 */

	'use strict';

	var escapeTextContentForBrowser = _dereq_(116);

	/**
	 * Escapes attribute value to prevent scripting attacks.
	 *
	 * @param {*} value Value to escape.
	 * @return {string} An escaped string.
	 */
	function quoteAttributeValueForBrowser(value) {
	  return '"' + escapeTextContentForBrowser(value) + '"';
	}

	module.exports = quoteAttributeValueForBrowser;

	},{"116":116}],148:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule setInnerHTML
	 */

	/* globals MSApp */

	'use strict';

	var ExecutionEnvironment = _dereq_(21);

	var WHITESPACE_TEST = /^[ \r\n\t\f]/;
	var NONVISIBLE_TEST = /<(!--|link|noscript|meta|script|style)[ \r\n\t\f\/>]/;

	/**
	 * Set the innerHTML property of a node, ensuring that whitespace is preserved
	 * even in IE8.
	 *
	 * @param {DOMElement} node
	 * @param {string} html
	 * @internal
	 */
	var setInnerHTML = function(node, html) {
	  node.innerHTML = html;
	};

	// Win8 apps: Allow all html to be inserted
	if (typeof MSApp !== 'undefined' && MSApp.execUnsafeLocalFunction) {
	  setInnerHTML = function(node, html) {
	    MSApp.execUnsafeLocalFunction(function() {
	      node.innerHTML = html;
	    });
	  };
	}

	if (ExecutionEnvironment.canUseDOM) {
	  // IE8: When updating a just created node with innerHTML only leading
	  // whitespace is removed. When updating an existing node with innerHTML
	  // whitespace in root TextNodes is also collapsed.
	  // @see quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html

	  // Feature detection; only IE8 is known to behave improperly like this.
	  var testElement = document.createElement('div');
	  testElement.innerHTML = ' ';
	  if (testElement.innerHTML === '') {
	    setInnerHTML = function(node, html) {
	      // Magic theory: IE8 supposedly differentiates between added and updated
	      // nodes when processing innerHTML, innerHTML on updated nodes suffers
	      // from worse whitespace behavior. Re-adding a node like this triggers
	      // the initial and more favorable whitespace behavior.
	      // TODO: What to do on a detached node?
	      if (node.parentNode) {
	        node.parentNode.replaceChild(node, node);
	      }

	      // We also implement a workaround for non-visible tags disappearing into
	      // thin air on IE8, this only happens if there is no visible text
	      // in-front of the non-visible tags. Piggyback on the whitespace fix
	      // and simply check if any non-visible tags appear in the source.
	      if (WHITESPACE_TEST.test(html) ||
	          html[0] === '<' && NONVISIBLE_TEST.test(html)) {
	        // Recover leading whitespace by temporarily prepending any character.
	        // \uFEFF has the potential advantage of being zero-width/invisible.
	        node.innerHTML = '\uFEFF' + html;

	        // deleteData leaves an empty `TextNode` which offsets the index of all
	        // children. Definitely want to avoid this.
	        var textNode = node.firstChild;
	        if (textNode.data.length === 1) {
	          node.removeChild(textNode);
	        } else {
	          textNode.deleteData(0, 1);
	        }
	      } else {
	        node.innerHTML = html;
	      }
	    };
	  }
	}

	module.exports = setInnerHTML;

	},{"21":21}],149:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule setTextContent
	 */

	'use strict';

	var ExecutionEnvironment = _dereq_(21);
	var escapeTextContentForBrowser = _dereq_(116);
	var setInnerHTML = _dereq_(148);

	/**
	 * Set the textContent property of a node, ensuring that whitespace is preserved
	 * even in IE8. innerText is a poor substitute for textContent and, among many
	 * issues, inserts <br> instead of the literal newline chars. innerHTML behaves
	 * as it should.
	 *
	 * @param {DOMElement} node
	 * @param {string} text
	 * @internal
	 */
	var setTextContent = function(node, text) {
	  node.textContent = text;
	};

	if (ExecutionEnvironment.canUseDOM) {
	  if (!('textContent' in document.documentElement)) {
	    setTextContent = function(node, text) {
	      setInnerHTML(node, escapeTextContentForBrowser(text));
	    };
	  }
	}

	module.exports = setTextContent;

	},{"116":116,"148":148,"21":21}],150:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule shallowEqual
	 */

	'use strict';

	/**
	 * Performs equality by iterating through keys on an object and returning
	 * false when any key has values which are not strictly equal between
	 * objA and objB. Returns true when the values of all keys are strictly equal.
	 *
	 * @return {boolean}
	 */
	function shallowEqual(objA, objB) {
	  if (objA === objB) {
	    return true;
	  }
	  var key;
	  // Test for A's keys different from B.
	  for (key in objA) {
	    if (objA.hasOwnProperty(key) &&
	        (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
	      return false;
	    }
	  }
	  // Test for B's keys missing from A.
	  for (key in objB) {
	    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
	      return false;
	    }
	  }
	  return true;
	}

	module.exports = shallowEqual;

	},{}],151:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule shouldUpdateReactComponent
	 * @typechecks static-only
	 */

	'use strict';

	var warning = _dereq_(154);

	/**
	 * Given a `prevElement` and `nextElement`, determines if the existing
	 * instance should be updated as opposed to being destroyed or replaced by a new
	 * instance. Both arguments are elements. This ensures that this logic can
	 * operate on stateless trees without any backing instance.
	 *
	 * @param {?object} prevElement
	 * @param {?object} nextElement
	 * @return {boolean} True if the existing instance should be updated.
	 * @protected
	 */
	function shouldUpdateReactComponent(prevElement, nextElement) {
	  if (prevElement != null && nextElement != null) {
	    var prevType = typeof prevElement;
	    var nextType = typeof nextElement;
	    if (prevType === 'string' || prevType === 'number') {
	      return (nextType === 'string' || nextType === 'number');
	    } else {
	      if (nextType === 'object' &&
	          prevElement.type === nextElement.type &&
	          prevElement.key === nextElement.key) {
	        var ownersMatch = prevElement._owner === nextElement._owner;
	        var prevName = null;
	        var nextName = null;
	        var nextDisplayName = null;
	        if (true) {
	          if (!ownersMatch) {
	            if (prevElement._owner != null &&
	                prevElement._owner.getPublicInstance() != null &&
	                prevElement._owner.getPublicInstance().constructor != null) {
	              prevName =
	                prevElement._owner.getPublicInstance().constructor.displayName;
	            }
	            if (nextElement._owner != null &&
	                nextElement._owner.getPublicInstance() != null &&
	                nextElement._owner.getPublicInstance().constructor != null) {
	              nextName =
	                nextElement._owner.getPublicInstance().constructor.displayName;
	            }
	            if (nextElement.type != null &&
	                nextElement.type.displayName != null) {
	              nextDisplayName = nextElement.type.displayName;
	            }
	            if (nextElement.type != null && typeof nextElement.type === 'string') {
	              nextDisplayName = nextElement.type;
	            }
	            if (typeof nextElement.type !== 'string' ||
	                nextElement.type === 'input' ||
	                nextElement.type === 'textarea') {
	              if ((prevElement._owner != null &&
	                  prevElement._owner._isOwnerNecessary === false) ||
	                  (nextElement._owner != null &&
	                  nextElement._owner._isOwnerNecessary === false)) {
	                if (prevElement._owner != null) {
	                  prevElement._owner._isOwnerNecessary = true;
	                }
	                if (nextElement._owner != null) {
	                  nextElement._owner._isOwnerNecessary = true;
	                }
	                (true ? warning(
	                  false,
	                  '<%s /> is being rendered by both %s and %s using the same ' +
	                  'key (%s) in the same place. Currently, this means that ' +
	                  'they don\'t preserve state. This behavior should be very ' +
	                  'rare so we\'re considering deprecating it. Please contact ' +
	                  'the React team and explain your use case so that we can ' +
	                  'take that into consideration.',
	                  nextDisplayName || 'Unknown Component',
	                  prevName || '[Unknown]',
	                  nextName || '[Unknown]',
	                  prevElement.key
	                ) : null);
	              }
	            }
	          }
	        }
	        return ownersMatch;
	      }
	    }
	  }
	  return false;
	}

	module.exports = shouldUpdateReactComponent;

	},{"154":154}],152:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule toArray
	 * @typechecks
	 */

	var invariant = _dereq_(135);

	/**
	 * Convert array-like objects to arrays.
	 *
	 * This API assumes the caller knows the contents of the data type. For less
	 * well defined inputs use createArrayFromMixed.
	 *
	 * @param {object|function|filelist} obj
	 * @return {array}
	 */
	function toArray(obj) {
	  var length = obj.length;

	  // Some browse builtin objects can report typeof 'function' (e.g. NodeList in
	  // old versions of Safari).
	  (true ? invariant(
	    !Array.isArray(obj) &&
	    (typeof obj === 'object' || typeof obj === 'function'),
	    'toArray: Array-like object expected'
	  ) : invariant(!Array.isArray(obj) &&
	  (typeof obj === 'object' || typeof obj === 'function')));

	  (true ? invariant(
	    typeof length === 'number',
	    'toArray: Object needs a length property'
	  ) : invariant(typeof length === 'number'));

	  (true ? invariant(
	    length === 0 ||
	    (length - 1) in obj,
	    'toArray: Object should have keys for indices'
	  ) : invariant(length === 0 ||
	  (length - 1) in obj));

	  // Old IE doesn't give collections access to hasOwnProperty. Assume inputs
	  // without method will throw during the slice call and skip straight to the
	  // fallback.
	  if (obj.hasOwnProperty) {
	    try {
	      return Array.prototype.slice.call(obj);
	    } catch (e) {
	      // IE < 9 does not support Array#slice on collections objects
	    }
	  }

	  // Fall back to copying key by key. This assumes all keys have a value,
	  // so will not preserve sparsely populated inputs.
	  var ret = Array(length);
	  for (var ii = 0; ii < length; ii++) {
	    ret[ii] = obj[ii];
	  }
	  return ret;
	}

	module.exports = toArray;

	},{"135":135}],153:[function(_dereq_,module,exports){
	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule traverseAllChildren
	 */

	'use strict';

	var ReactElement = _dereq_(57);
	var ReactFragment = _dereq_(63);
	var ReactInstanceHandles = _dereq_(66);

	var getIteratorFn = _dereq_(126);
	var invariant = _dereq_(135);
	var warning = _dereq_(154);

	var SEPARATOR = ReactInstanceHandles.SEPARATOR;
	var SUBSEPARATOR = ':';

	/**
	 * TODO: Test that a single child and an array with one item have the same key
	 * pattern.
	 */

	var userProvidedKeyEscaperLookup = {
	  '=': '=0',
	  '.': '=1',
	  ':': '=2'
	};

	var userProvidedKeyEscapeRegex = /[=.:]/g;

	var didWarnAboutMaps = false;

	function userProvidedKeyEscaper(match) {
	  return userProvidedKeyEscaperLookup[match];
	}

	/**
	 * Generate a key string that identifies a component within a set.
	 *
	 * @param {*} component A component that could contain a manual key.
	 * @param {number} index Index that is used if a manual key is not provided.
	 * @return {string}
	 */
	function getComponentKey(component, index) {
	  if (component && component.key != null) {
	    // Explicit key
	    return wrapUserProvidedKey(component.key);
	  }
	  // Implicit key determined by the index in the set
	  return index.toString(36);
	}

	/**
	 * Escape a component key so that it is safe to use in a reactid.
	 *
	 * @param {*} key Component key to be escaped.
	 * @return {string} An escaped string.
	 */
	function escapeUserProvidedKey(text) {
	  return ('' + text).replace(
	    userProvidedKeyEscapeRegex,
	    userProvidedKeyEscaper
	  );
	}

	/**
	 * Wrap a `key` value explicitly provided by the user to distinguish it from
	 * implicitly-generated keys generated by a component's index in its parent.
	 *
	 * @param {string} key Value of a user-provided `key` attribute
	 * @return {string}
	 */
	function wrapUserProvidedKey(key) {
	  return '$' + escapeUserProvidedKey(key);
	}

	/**
	 * @param {?*} children Children tree container.
	 * @param {!string} nameSoFar Name of the key path so far.
	 * @param {!number} indexSoFar Number of children encountered until this point.
	 * @param {!function} callback Callback to invoke with each child found.
	 * @param {?*} traverseContext Used to pass information throughout the traversal
	 * process.
	 * @return {!number} The number of children in this subtree.
	 */
	function traverseAllChildrenImpl(
	  children,
	  nameSoFar,
	  indexSoFar,
	  callback,
	  traverseContext
	) {
	  var type = typeof children;

	  if (type === 'undefined' || type === 'boolean') {
	    // All of the above are perceived as null.
	    children = null;
	  }

	  if (children === null ||
	      type === 'string' ||
	      type === 'number' ||
	      ReactElement.isValidElement(children)) {
	    callback(
	      traverseContext,
	      children,
	      // If it's the only child, treat the name as if it was wrapped in an array
	      // so that it's consistent if the number of children grows.
	      nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar,
	      indexSoFar
	    );
	    return 1;
	  }

	  var child, nextName, nextIndex;
	  var subtreeCount = 0; // Count of children found in the current subtree.

	  if (Array.isArray(children)) {
	    for (var i = 0; i < children.length; i++) {
	      child = children[i];
	      nextName = (
	        (nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) +
	        getComponentKey(child, i)
	      );
	      nextIndex = indexSoFar + subtreeCount;
	      subtreeCount += traverseAllChildrenImpl(
	        child,
	        nextName,
	        nextIndex,
	        callback,
	        traverseContext
	      );
	    }
	  } else {
	    var iteratorFn = getIteratorFn(children);
	    if (iteratorFn) {
	      var iterator = iteratorFn.call(children);
	      var step;
	      if (iteratorFn !== children.entries) {
	        var ii = 0;
	        while (!(step = iterator.next()).done) {
	          child = step.value;
	          nextName = (
	            (nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) +
	            getComponentKey(child, ii++)
	          );
	          nextIndex = indexSoFar + subtreeCount;
	          subtreeCount += traverseAllChildrenImpl(
	            child,
	            nextName,
	            nextIndex,
	            callback,
	            traverseContext
	          );
	        }
	      } else {
	        if (true) {
	          (true ? warning(
	            didWarnAboutMaps,
	            'Using Maps as children is not yet fully supported. It is an ' +
	            'experimental feature that might be removed. Convert it to a ' +
	            'sequence / iterable of keyed ReactElements instead.'
	          ) : null);
	          didWarnAboutMaps = true;
	        }
	        // Iterator will provide entry [k,v] tuples rather than values.
	        while (!(step = iterator.next()).done) {
	          var entry = step.value;
	          if (entry) {
	            child = entry[1];
	            nextName = (
	              (nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) +
	              wrapUserProvidedKey(entry[0]) + SUBSEPARATOR +
	              getComponentKey(child, 0)
	            );
	            nextIndex = indexSoFar + subtreeCount;
	            subtreeCount += traverseAllChildrenImpl(
	              child,
	              nextName,
	              nextIndex,
	              callback,
	              traverseContext
	            );
	          }
	        }
	      }
	    } else if (type === 'object') {
	      (true ? invariant(
	        children.nodeType !== 1,
	        'traverseAllChildren(...): Encountered an invalid child; DOM ' +
	        'elements are not valid children of React components.'
	      ) : invariant(children.nodeType !== 1));
	      var fragment = ReactFragment.extract(children);
	      for (var key in fragment) {
	        if (fragment.hasOwnProperty(key)) {
	          child = fragment[key];
	          nextName = (
	            (nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) +
	            wrapUserProvidedKey(key) + SUBSEPARATOR +
	            getComponentKey(child, 0)
	          );
	          nextIndex = indexSoFar + subtreeCount;
	          subtreeCount += traverseAllChildrenImpl(
	            child,
	            nextName,
	            nextIndex,
	            callback,
	            traverseContext
	          );
	        }
	      }
	    }
	  }

	  return subtreeCount;
	}

	/**
	 * Traverses children that are typically specified as `props.children`, but
	 * might also be specified through attributes:
	 *
	 * - `traverseAllChildren(this.props.children, ...)`
	 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
	 *
	 * The `traverseContext` is an optional argument that is passed through the
	 * entire traversal. It can be used to store accumulations or anything else that
	 * the callback might find relevant.
	 *
	 * @param {?*} children Children tree object.
	 * @param {!function} callback To invoke upon traversing each child.
	 * @param {?*} traverseContext Context for traversal.
	 * @return {!number} The number of children in this subtree.
	 */
	function traverseAllChildren(children, callback, traverseContext) {
	  if (children == null) {
	    return 0;
	  }

	  return traverseAllChildrenImpl(children, '', 0, callback, traverseContext);
	}

	module.exports = traverseAllChildren;

	},{"126":126,"135":135,"154":154,"57":57,"63":63,"66":66}],154:[function(_dereq_,module,exports){
	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule warning
	 */

	"use strict";

	var emptyFunction = _dereq_(114);

	/**
	 * Similar to invariant but only logs a warning if the condition is not met.
	 * This can be used to log issues in development environments in critical
	 * paths. Removing the logging code for production environments will keep the
	 * same logic and follow the same code paths.
	 */

	var warning = emptyFunction;

	if (true) {
	  warning = function(condition, format ) {for (var args=[],$__0=2,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
	    if (format === undefined) {
	      throw new Error(
	        '`warning(condition, format, ...args)` requires a warning ' +
	        'message argument'
	      );
	    }

	    if (format.length < 10 || /^[s\W]*$/.test(format)) {
	      throw new Error(
	        'The warning format should be able to uniquely identify this ' +
	        'warning. Please, use a more descriptive format than: ' + format
	      );
	    }

	    if (format.indexOf('Failed Composite propType: ') === 0) {
	      return; // Ignore CompositeComponent proptype check.
	    }

	    if (!condition) {
	      var argIndex = 0;
	      var message = 'Warning: ' + format.replace(/%s/g, function()  {return args[argIndex++];});
	      console.warn(message);
	      try {
	        // --- Welcome to debugging React ---
	        // This error was thrown as a convenience so that you can use this stack
	        // to find the callsite that caused this warning to fire.
	        throw new Error(message);
	      } catch(x) {}
	    }
	  };
	}

	module.exports = warning;

	},{"114":114}]},{},[1])(1)
	});

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	function init(React){
		var WsIndicator = React.createClass({displayName: "WsIndicator",
			getInitialState:function(){
				return {
					isValid: false
				}
			},
			render:function(){
				return (
					React.createElement("img", {className: "logo_bottom anim_rotation", src: "https://t.alipayobjects.com/images/rmsweb/T1P_dfXa8oXXXXXXXX.png", width: "50", height: "50", style: {display: this.state.isValid ?"block" : "none"}})
				);
			}
		});

		return WsIndicator;
	}

	module.exports.init = init;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(12);

	function init(React){
		var MapForm = __webpack_require__(13).init(React),
			MapList = __webpack_require__(14).init(React);

		var MapPanel = React.createClass({displayName: "MapPanel",
			appendRecord : function(data){
				var self          = this,
					listComponent = self.refs.list;
				
				listComponent.appendRecord(data);
			},
			
			render:function(){
				var self = this;
				return (
					React.createElement("div", {className: "mapWrapper"}, 
						React.createElement("h4", {className: "subTitle"}, "Current Config"), 
						React.createElement(MapList, {ref: "list"}), 
						
						React.createElement("h4", {className: "subTitle"}, "Add Map Rule"), 
						React.createElement(MapForm, {onSubmit: self.appendRecord})
					)
				);
			}
		});

		return MapPanel;
	}

	module.exports.init = init;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	function init(React){
		var RecordRow   = __webpack_require__(11).init(React);

		var RecordPanel = React.createClass({displayName: "RecordPanel",
			getInitialState : function(){
				return {
					list  : [],
					filter: ""
				};
			},
			render : function(){
				var self          = this,
					rowCollection = [],
					filterStr     = self.state.filter,
					filter        = filterStr;

				//regexp
				if(filterStr[0]=="/" && filterStr[filterStr.length-1]=="/"){
					try{
						filter = new RegExp(filterStr.substr(1,filterStr.length-2));
					}catch(e){}
				}

				for(var i = self.state.list.length-1 ; i >=0 ; i--){
					var item = self.state.list[i];
					if(item){
						if(filter && item){
							try{
								if(typeof filter == "object" && !filter.test(item.url)){
									continue;
								}else if(typeof filter == "string" && item.url.indexOf(filter) < 0){
									continue;
								}
							}catch(e){}
						}

						if(item._justUpdated){
							item._justUpdated = false;
							item._needRender  = true;
						}else{
							item._needRender  = false;
						}

						rowCollection.push(React.createElement(RecordRow, {key: item.id, data: item, onSelect: self.props.onSelect.bind(self,item)}));
					}
				}

				return (
					React.createElement("table", {className: "uk-table uk-table-condensed uk-table-hover"}, 
						React.createElement("thead", null, 
							React.createElement("tr", null, 
								React.createElement("th", {className: "col_id"}, "#"), 
								React.createElement("th", {className: "col_method"}, "method"), 
								React.createElement("th", {className: "col_code"}, "code"), 
								React.createElement("th", {className: "col_host"}, "host"), 
								React.createElement("th", {className: "col_path"}, "path"), 
								React.createElement("th", {className: "col_mime"}, "mime type"), 
								React.createElement("th", {className: "col_time"}, "time")
							)
						), 
						React.createElement("tbody", null, 
							rowCollection
						)
					)
				);
			}
		});

		return RecordPanel;
	}

	module.exports.init = init;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	function init(React){

		function dragableBar(initX,cb){
			var self     = this,
				dragging = true;

			var ghostbar = $('<div class="ghostbar"></div>').css("left",initX).prependTo('body');

			$(document).mousemove(function(e){
				e.preventDefault();
				ghostbar.css("left",e.pageX + "px");
			});

			$(document).mouseup(function(e){
				if(!dragging) return;

				dragging = false;

				var deltaPageX = e.pageX - initX;
				cb && cb.call(null,{
					delta  : deltaPageX,
					finalX : e.pageX
				});
				
				ghostbar.remove();
				$(document).unbind('mousemove');
			});	
		}

		var Popup = React.createClass({displayName: "Popup",
			getInitialState : function(){
				return {
					show    : false,
					left    : "35%",
					content : null
				};
			},
			componentDidMount:function(){
				var self = this;
				$(document).on("keyup",function(e){
					if(e.keyCode == 27){ //ESC
						self.setState({
							show : false
						});
					}
				});
			},
			setHide:function(){
				this.setState({
					show : false
				});
			},
			setShow:function(ifShow){
				this.setState({
					show : true
				});
			},
			dealDrag:function(){
				var self    = this,
					leftVal = $(React.findDOMNode(this.refs.mainOverlay)).css("left");
				dragableBar(leftVal, function(data){
					if(data && data.finalX){
						if(window.innerWidth - data.finalX < 200){
							data.finalX = window.innerWidth - 200;
						}
						self.setState({
							left : data.finalX + "px"
						});
					}
				});
			},
			componentDidUpdate:function(){

			},
			render : function(){
				return (
					React.createElement("div", {style: {display:this.state.show ? "block" :"none"}}, 
						React.createElement("div", {className: "overlay_mask", onClick: this.setHide}), 
						React.createElement("div", {className: "recordDetailOverlay", ref: "mainOverlay", style: {left: this.state.left}}, 
							React.createElement("div", {className: "dragbar", onMouseDown: this.dealDrag}), 
							React.createElement("span", {className: "escBtn", onClick: this.setHide}, React.createElement("i", {className: "uk-icon-times"})), 
							React.createElement("div", null, 
								this.state.content
							)
						)
					)
				);
			}
		});

		return Popup;	
	}

	module.exports.init = init;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	function init(React){

		var Filter = React.createClass({displayName: "Filter",

			dealChange:function(){
				var self = this,
					userInput = React.findDOMNode(self.refs.keywordInput).value;

				self.props.onChangeKeyword && self.props.onChangeKeyword.call(null,userInput);
			},
			setFocus:function(){
				var self = this;
				React.findDOMNode(self.refs.keywordInput).focus();
			},
			componentDidUpdate:function(){
				this.setFocus();
			},
			render:function(){
				var self = this;

				return (
					React.createElement("div", null, 
						React.createElement("h4", {className: "subTitle"}, "Log Filter"), 

						React.createElement("div", {className: "filterSection"}, 
							React.createElement("form", {className: "uk-form"}, 
								React.createElement("input", {className: "uk-form-large", ref: "keywordInput", onChange: self.dealChange, type: "text", placeholder: "keywords or /^regExp$/", width: "300"})
							)
						), 
						React.createElement("dl", {class: "uk-description-list-horizontal"}, 
						    React.createElement("dt", null, "wrap your RegExp between two slashes"), 
						    React.createElement("dd", null, 
							    "e.g. ", React.createElement("br", null), 
							    "type ", React.createElement("strong", null, "/id=\\d", 3, "/"), " will give you all the logs containing ", React.createElement("strong", null, "id=123")
						    )
						)
					)
				);
			},
			componentDidMount:function(){
				this.setFocus();
			}
		});

		return Filter;
	}

	module.exports.init = init;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	function init(React){
		function dateFormat(date,fmt) {
		    var o = {
		        "M+": date.getMonth() + 1, //月份 
		        "d+": date.getDate(), //日 
		        "h+": date.getHours(), //小时 
		        "m+": date.getMinutes(), //分 
		        "s+": date.getSeconds(), //秒 
		        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
		        "S" : date.getMilliseconds() //毫秒 
		    };
		    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
		    for (var k in o) if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		    return fmt;
		}

		var RecordRow = React.createClass({displayName: "RecordRow",
			getInitialState : function(){
				return null;
			},
			render : function(){
				var trClassesArr = [],
					trClasses,
					data = this.props.data || {};
				if(data.statusCode){
					trClassesArr.push("record_status_done");
				}

				trClassesArr.push( ((Math.floor(data._id /2) - data._id /2) == 0)? "row_even" : "row_odd" );
				trClasses = trClassesArr.join(" ");

				var dateStr = dateFormat(new Date(data.startTime),"hh:mm:ss");

				var rowIcon = [];
				if(data.protocol == "https"){
					rowIcon.push(React.createElement("span", {className: "icon_record", title: "https"}, React.createElement("i", {className: "uk-icon-lock"})));
				}

				if(data.ext && data.ext.map){
					rowIcon.push(React.createElement("span", {className: "icon_record", title: "mapped to local file"}, React.createElement("i", {className: "uk-icon-shield"})));
				}

				return(
					React.createElement("tr", {className: trClasses, onClick: this.props.onSelect}, 
						React.createElement("td", {className: "data_id"}, data._id), 
						React.createElement("td", null, data.method, " ", rowIcon, " "), 
						React.createElement("td", {className: "http_status http_status_" + data.statusCode}, data.statusCode), 
						React.createElement("td", {title: data.host}, data.host), 
						React.createElement("td", {title: data.path}, data.path), 
						React.createElement("td", null, data.mime), 
						React.createElement("td", null, dateStr)
					)
				);
			},
			shouldComponentUpdate:function(nextPros){
				return nextPros.data._needRender;
			},
			componentDidUpdate:function(){},
			componentWillUnmount:function(){}
		});

		return RecordRow;
	}

	module.exports.init = init;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/*globals jQuery, define, exports, require, window, document, postMessage */
	(function (factory) {
		factory(window.jQuery);

	}(function ($, undefined) {
		"use strict";
	/*!
	 * jsTree 3.1.1
	 * http://jstree.com/
	 *
	 * Copyright (c) 2014 Ivan Bozhanov (http://vakata.com)
	 *
	 * Licensed same as jquery - under the terms of the MIT License
	 *   http://www.opensource.org/licenses/mit-license.php
	 */
	/*!
	 * if using jslint please allow for the jQuery global and use following options:
	 * jslint: browser: true, ass: true, bitwise: true, continue: true, nomen: true, plusplus: true, regexp: true, unparam: true, todo: true, white: true
	 */

		// prevent another load? maybe there is a better way?
		if($.jstree) {
			return;
		}

		/**
		 * ### jsTree core functionality
		 */

		// internal variables
		var instance_counter = 0,
			ccp_node = false,
			ccp_mode = false,
			ccp_inst = false,
			themes_loaded = [],
			src = $('script:last').attr('src'),
			document = window.document, // local variable is always faster to access then a global
			_node = document.createElement('LI'), _temp1, _temp2;

		_node.setAttribute('role', 'treeitem');
		_temp1 = document.createElement('I');
		_temp1.className = 'jstree-icon jstree-ocl';
		_temp1.setAttribute('role', 'presentation');
		_node.appendChild(_temp1);
		_temp1 = document.createElement('A');
		_temp1.className = 'jstree-anchor';
		_temp1.setAttribute('href','#');
		_temp1.setAttribute('tabindex','-1');
		_temp2 = document.createElement('I');
		_temp2.className = 'jstree-icon jstree-themeicon';
		_temp2.setAttribute('role', 'presentation');
		_temp1.appendChild(_temp2);
		_node.appendChild(_temp1);
		_temp1 = _temp2 = null;


		/**
		 * holds all jstree related functions and variables, including the actual class and methods to create, access and manipulate instances.
		 * @name $.jstree
		 */
		$.jstree = {
			/**
			 * specifies the jstree version in use
			 * @name $.jstree.version
			 */
			version : '3.1.1',
			/**
			 * holds all the default options used when creating new instances
			 * @name $.jstree.defaults
			 */
			defaults : {
				/**
				 * configure which plugins will be active on an instance. Should be an array of strings, where each element is a plugin name. The default is `[]`
				 * @name $.jstree.defaults.plugins
				 */
				plugins : []
			},
			/**
			 * stores all loaded jstree plugins (used internally)
			 * @name $.jstree.plugins
			 */
			plugins : {},
			path : src && src.indexOf('/') !== -1 ? src.replace(/\/[^\/]+$/,'') : '',
			idregex : /[\\:&!^|()\[\]<>@*'+~#";.,=\- \/${}%?`]/g
		};
		/**
		 * creates a jstree instance
		 * @name $.jstree.create(el [, options])
		 * @param {DOMElement|jQuery|String} el the element to create the instance on, can be jQuery extended or a selector
		 * @param {Object} options options for this instance (extends `$.jstree.defaults`)
		 * @return {jsTree} the new instance
		 */
		$.jstree.create = function (el, options) {
			var tmp = new $.jstree.core(++instance_counter),
				opt = options;
			options = $.extend(true, {}, $.jstree.defaults, options);
			if(opt && opt.plugins) {
				options.plugins = opt.plugins;
			}
			$.each(options.plugins, function (i, k) {
				if(i !== 'core') {
					tmp = tmp.plugin(k, options[k]);
				}
			});
			$(el).data('jstree', tmp);
			tmp.init(el, options);
			return tmp;
		};
		/**
		 * remove all traces of jstree from the DOM and destroy all instances
		 * @name $.jstree.destroy()
		 */
		$.jstree.destroy = function () {
			$('.jstree:jstree').jstree('destroy');
			$(document).off('.jstree');
		};
		/**
		 * the jstree class constructor, used only internally
		 * @private
		 * @name $.jstree.core(id)
		 * @param {Number} id this instance's index
		 */
		$.jstree.core = function (id) {
			this._id = id;
			this._cnt = 0;
			this._wrk = null;
			this._data = {
				core : {
					themes : {
						name : false,
						dots : false,
						icons : false
					},
					selected : [],
					last_error : {},
					working : false,
					worker_queue : [],
					focused : null
				}
			};
		};
		/**
		 * get a reference to an existing instance
		 *
		 * __Examples__
		 *
		 *	// provided a container with an ID of "tree", and a nested node with an ID of "branch"
		 *	// all of there will return the same instance
		 *	$.jstree.reference('tree');
		 *	$.jstree.reference('#tree');
		 *	$.jstree.reference($('#tree'));
		 *	$.jstree.reference(document.getElementByID('tree'));
		 *	$.jstree.reference('branch');
		 *	$.jstree.reference('#branch');
		 *	$.jstree.reference($('#branch'));
		 *	$.jstree.reference(document.getElementByID('branch'));
		 *
		 * @name $.jstree.reference(needle)
		 * @param {DOMElement|jQuery|String} needle
		 * @return {jsTree|null} the instance or `null` if not found
		 */
		$.jstree.reference = function (needle) {
			var tmp = null,
				obj = null;
			if(needle && needle.id && (!needle.tagName || !needle.nodeType)) { needle = needle.id; }

			if(!obj || !obj.length) {
				try { obj = $(needle); } catch (ignore) { }
			}
			if(!obj || !obj.length) {
				try { obj = $('#' + needle.replace($.jstree.idregex,'\\$&')); } catch (ignore) { }
			}
			if(obj && obj.length && (obj = obj.closest('.jstree')).length && (obj = obj.data('jstree'))) {
				tmp = obj;
			}
			else {
				$('.jstree').each(function () {
					var inst = $(this).data('jstree');
					if(inst && inst._model.data[needle]) {
						tmp = inst;
						return false;
					}
				});
			}
			return tmp;
		};
		/**
		 * Create an instance, get an instance or invoke a command on a instance.
		 *
		 * If there is no instance associated with the current node a new one is created and `arg` is used to extend `$.jstree.defaults` for this new instance. There would be no return value (chaining is not broken).
		 *
		 * If there is an existing instance and `arg` is a string the command specified by `arg` is executed on the instance, with any additional arguments passed to the function. If the function returns a value it will be returned (chaining could break depending on function).
		 *
		 * If there is an existing instance and `arg` is not a string the instance itself is returned (similar to `$.jstree.reference`).
		 *
		 * In any other case - nothing is returned and chaining is not broken.
		 *
		 * __Examples__
		 *
		 *	$('#tree1').jstree(); // creates an instance
		 *	$('#tree2').jstree({ plugins : [] }); // create an instance with some options
		 *	$('#tree1').jstree('open_node', '#branch_1'); // call a method on an existing instance, passing additional arguments
		 *	$('#tree2').jstree(); // get an existing instance (or create an instance)
		 *	$('#tree2').jstree(true); // get an existing instance (will not create new instance)
		 *	$('#branch_1').jstree().select_node('#branch_1'); // get an instance (using a nested element and call a method)
		 *
		 * @name $().jstree([arg])
		 * @param {String|Object} arg
		 * @return {Mixed}
		 */
		$.fn.jstree = function (arg) {
			// check for string argument
			var is_method	= (typeof arg === 'string'),
				args		= Array.prototype.slice.call(arguments, 1),
				result		= null;
			if(arg === true && !this.length) { return false; }
			this.each(function () {
				// get the instance (if there is one) and method (if it exists)
				var instance = $.jstree.reference(this),
					method = is_method && instance ? instance[arg] : null;
				// if calling a method, and method is available - execute on the instance
				result = is_method && method ?
					method.apply(instance, args) :
					null;
				// if there is no instance and no method is being called - create one
				if(!instance && !is_method && (arg === undefined || $.isPlainObject(arg))) {
					$.jstree.create(this, arg);
				}
				// if there is an instance and no method is called - return the instance
				if( (instance && !is_method) || arg === true ) {
					result = instance || false;
				}
				// if there was a method call which returned a result - break and return the value
				if(result !== null && result !== undefined) {
					return false;
				}
			});
			// if there was a method call with a valid return value - return that, otherwise continue the chain
			return result !== null && result !== undefined ?
				result : this;
		};
		/**
		 * used to find elements containing an instance
		 *
		 * __Examples__
		 *
		 *	$('div:jstree').each(function () {
		 *		$(this).jstree('destroy');
		 *	});
		 *
		 * @name $(':jstree')
		 * @return {jQuery}
		 */
		$.expr[':'].jstree = $.expr.createPseudo(function(search) {
			return function(a) {
				return $(a).hasClass('jstree') &&
					$(a).data('jstree') !== undefined;
			};
		});

		/**
		 * stores all defaults for the core
		 * @name $.jstree.defaults.core
		 */
		$.jstree.defaults.core = {
			/**
			 * data configuration
			 *
			 * If left as `false` the HTML inside the jstree container element is used to populate the tree (that should be an unordered list with list items).
			 *
			 * You can also pass in a HTML string or a JSON array here.
			 *
			 * It is possible to pass in a standard jQuery-like AJAX config and jstree will automatically determine if the response is JSON or HTML and use that to populate the tree.
			 * In addition to the standard jQuery ajax options here you can suppy functions for `data` and `url`, the functions will be run in the current instance's scope and a param will be passed indicating which node is being loaded, the return value of those functions will be used.
			 *
			 * The last option is to specify a function, that function will receive the node being loaded as argument and a second param which is a function which should be called with the result.
			 *
			 * __Examples__
			 *
			 *	// AJAX
			 *	$('#tree').jstree({
			 *		'core' : {
			 *			'data' : {
			 *				'url' : '/get/children/',
			 *				'data' : function (node) {
			 *					return { 'id' : node.id };
			 *				}
			 *			}
			 *		});
			 *
			 *	// direct data
			 *	$('#tree').jstree({
			 *		'core' : {
			 *			'data' : [
			 *				'Simple root node',
			 *				{
			 *					'id' : 'node_2',
			 *					'text' : 'Root node with options',
			 *					'state' : { 'opened' : true, 'selected' : true },
			 *					'children' : [ { 'text' : 'Child 1' }, 'Child 2']
			 *				}
			 *			]
			 *		});
			 *
			 *	// function
			 *	$('#tree').jstree({
			 *		'core' : {
			 *			'data' : function (obj, callback) {
			 *				callback.call(this, ['Root 1', 'Root 2']);
			 *			}
			 *		});
			 *
			 * @name $.jstree.defaults.core.data
			 */
			data			: false,
			/**
			 * configure the various strings used throughout the tree
			 *
			 * You can use an object where the key is the string you need to replace and the value is your replacement.
			 * Another option is to specify a function which will be called with an argument of the needed string and should return the replacement.
			 * If left as `false` no replacement is made.
			 *
			 * __Examples__
			 *
			 *	$('#tree').jstree({
			 *		'core' : {
			 *			'strings' : {
			 *				'Loading ...' : 'Please wait ...'
			 *			}
			 *		}
			 *	});
			 *
			 * @name $.jstree.defaults.core.strings
			 */
			strings			: false,
			/**
			 * determines what happens when a user tries to modify the structure of the tree
			 * If left as `false` all operations like create, rename, delete, move or copy are prevented.
			 * You can set this to `true` to allow all interactions or use a function to have better control.
			 *
			 * __Examples__
			 *
			 *	$('#tree').jstree({
			 *		'core' : {
			 *			'check_callback' : function (operation, node, node_parent, node_position, more) {
			 *				// operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
			 *				// in case of 'rename_node' node_position is filled with the new node name
			 *				return operation === 'rename_node' ? true : false;
			 *			}
			 *		}
			 *	});
			 *
			 * @name $.jstree.defaults.core.check_callback
			 */
			check_callback	: false,
			/**
			 * a callback called with a single object parameter in the instance's scope when something goes wrong (operation prevented, ajax failed, etc)
			 * @name $.jstree.defaults.core.error
			 */
			error			: $.noop,
			/**
			 * the open / close animation duration in milliseconds - set this to `false` to disable the animation (default is `200`)
			 * @name $.jstree.defaults.core.animation
			 */
			animation		: 200,
			/**
			 * a boolean indicating if multiple nodes can be selected
			 * @name $.jstree.defaults.core.multiple
			 */
			multiple		: true,
			/**
			 * theme configuration object
			 * @name $.jstree.defaults.core.themes
			 */
			themes			: {
				/**
				 * the name of the theme to use (if left as `false` the default theme is used)
				 * @name $.jstree.defaults.core.themes.name
				 */
				name			: false,
				/**
				 * the URL of the theme's CSS file, leave this as `false` if you have manually included the theme CSS (recommended). You can set this to `true` too which will try to autoload the theme.
				 * @name $.jstree.defaults.core.themes.url
				 */
				url				: false,
				/**
				 * the location of all jstree themes - only used if `url` is set to `true`
				 * @name $.jstree.defaults.core.themes.dir
				 */
				dir				: false,
				/**
				 * a boolean indicating if connecting dots are shown
				 * @name $.jstree.defaults.core.themes.dots
				 */
				dots			: true,
				/**
				 * a boolean indicating if node icons are shown
				 * @name $.jstree.defaults.core.themes.icons
				 */
				icons			: true,
				/**
				 * a boolean indicating if the tree background is striped
				 * @name $.jstree.defaults.core.themes.stripes
				 */
				stripes			: false,
				/**
				 * a string (or boolean `false`) specifying the theme variant to use (if the theme supports variants)
				 * @name $.jstree.defaults.core.themes.variant
				 */
				variant			: false,
				/**
				 * a boolean specifying if a reponsive version of the theme should kick in on smaller screens (if the theme supports it). Defaults to `false`.
				 * @name $.jstree.defaults.core.themes.responsive
				 */
				responsive		: false
			},
			/**
			 * if left as `true` all parents of all selected nodes will be opened once the tree loads (so that all selected nodes are visible to the user)
			 * @name $.jstree.defaults.core.expand_selected_onload
			 */
			expand_selected_onload : true,
			/**
			 * if left as `true` web workers will be used to parse incoming JSON data where possible, so that the UI will not be blocked by large requests. Workers are however about 30% slower. Defaults to `true`
			 * @name $.jstree.defaults.core.worker
			 */
			worker : true,
			/**
			 * Force node text to plain text (and escape HTML). Defaults to `false`
			 * @name $.jstree.defaults.core.force_text
			 */
			force_text : false,
			/**
			 * Should the node should be toggled if the text is double clicked . Defaults to `true`
			 * @name $.jstree.defaults.core.dblclick_toggle
			 */
			dblclick_toggle : true
		};
		$.jstree.core.prototype = {
			/**
			 * used to decorate an instance with a plugin. Used internally.
			 * @private
			 * @name plugin(deco [, opts])
			 * @param  {String} deco the plugin to decorate with
			 * @param  {Object} opts options for the plugin
			 * @return {jsTree}
			 */
			plugin : function (deco, opts) {
				var Child = $.jstree.plugins[deco];
				if(Child) {
					this._data[deco] = {};
					Child.prototype = this;
					return new Child(opts, this);
				}
				return this;
			},
			/**
			 * initialize the instance. Used internally.
			 * @private
			 * @name init(el, optons)
			 * @param {DOMElement|jQuery|String} el the element we are transforming
			 * @param {Object} options options for this instance
			 * @trigger init.jstree, loading.jstree, loaded.jstree, ready.jstree, changed.jstree
			 */
			init : function (el, options) {
				this._model = {
					data : {
						'#' : {
							id : '#',
							parent : null,
							parents : [],
							children : [],
							children_d : [],
							state : { loaded : false }
						}
					},
					changed : [],
					force_full_redraw : false,
					redraw_timeout : false,
					default_state : {
						loaded : true,
						opened : false,
						selected : false,
						disabled : false
					}
				};

				this.element = $(el).addClass('jstree jstree-' + this._id);
				this.settings = options;

				this._data.core.ready = false;
				this._data.core.loaded = false;
				this._data.core.rtl = (this.element.css("direction") === "rtl");
				this.element[this._data.core.rtl ? 'addClass' : 'removeClass']("jstree-rtl");
				this.element.attr('role','tree');
				if(this.settings.core.multiple) {
					this.element.attr('aria-multiselectable', true);
				}
				if(!this.element.attr('tabindex')) {
					this.element.attr('tabindex','0');
				}

				this.bind();
				/**
				 * triggered after all events are bound
				 * @event
				 * @name init.jstree
				 */
				this.trigger("init");

				this._data.core.original_container_html = this.element.find(" > ul > li").clone(true);
				this._data.core.original_container_html
					.find("li").addBack()
					.contents().filter(function() {
						return this.nodeType === 3 && (!this.nodeValue || /^\s+$/.test(this.nodeValue));
					})
					.remove();
				this.element.html("<"+"ul class='jstree-container-ul jstree-children' role='group'><"+"li id='j"+this._id+"_loading' class='jstree-initial-node jstree-loading jstree-leaf jstree-last' role='tree-item'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
				this.element.attr('aria-activedescendant','j' + this._id + '_loading');
				this._data.core.li_height = this.get_container_ul().children("li").first().height() || 24;
				/**
				 * triggered after the loading text is shown and before loading starts
				 * @event
				 * @name loading.jstree
				 */
				this.trigger("loading");
				this.load_node('#');
			},
			/**
			 * destroy an instance
			 * @name destroy()
			 * @param  {Boolean} keep_html if not set to `true` the container will be emptied, otherwise the current DOM elements will be kept intact
			 */
			destroy : function (keep_html) {
				if(this._wrk) {
					try {
						window.URL.revokeObjectURL(this._wrk);
						this._wrk = null;
					}
					catch (ignore) { }
				}
				if(!keep_html) { this.element.empty(); }
				this.teardown();
			},
			/**
			 * part of the destroying of an instance. Used internally.
			 * @private
			 * @name teardown()
			 */
			teardown : function () {
				this.unbind();
				this.element
					.removeClass('jstree')
					.removeData('jstree')
					.find("[class^='jstree']")
						.addBack()
						.attr("class", function () { return this.className.replace(/jstree[^ ]*|$/ig,''); });
				this.element = null;
			},
			/**
			 * bind all events. Used internally.
			 * @private
			 * @name bind()
			 */
			bind : function () {
				var word = '',
					tout = null,
					was_click = 0;
				this.element
					.on("dblclick.jstree", function () {
							if(document.selection && document.selection.empty) {
								document.selection.empty();
							}
							else {
								if(window.getSelection) {
									var sel = window.getSelection();
									try {
										sel.removeAllRanges();
										sel.collapse();
									} catch (ignore) { }
								}
							}
						})
					.on("mousedown.jstree", $.proxy(function (e) {
							if(e.target === this.element[0]) {
								e.preventDefault(); // prevent losing focus when clicking scroll arrows (FF, Chrome)
								was_click = +(new Date()); // ie does not allow to prevent losing focus
							}
						}, this))
					.on("mousedown.jstree", ".jstree-ocl", function (e) {
							e.preventDefault(); // prevent any node inside from losing focus when clicking the open/close icon
						})
					.on("click.jstree", ".jstree-ocl", $.proxy(function (e) {
							this.toggle_node(e.target);
						}, this))
					.on("dblclick.jstree", ".jstree-anchor", $.proxy(function (e) {
							if(this.settings.core.dblclick_toggle) {
								this.toggle_node(e.target);
							}
						}, this))
					.on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
							e.preventDefault();
							if(e.currentTarget !== document.activeElement) { $(e.currentTarget).focus(); }
							this.activate_node(e.currentTarget, e);
						}, this))
					.on('keydown.jstree', '.jstree-anchor', $.proxy(function (e) {
							if(e.target.tagName === "INPUT") { return true; }
							if(e.which !== 32 && e.which !== 13 && (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)) { return true; }
							var o = null;
							if(this._data.core.rtl) {
								if(e.which === 37) { e.which = 39; }
								else if(e.which === 39) { e.which = 37; }
							}
							switch(e.which) {
								case 32: // aria defines space only with Ctrl
									if(e.ctrlKey) {
										e.type = "click";
										$(e.currentTarget).trigger(e);
									}
									break;
								case 13: // enter
									e.type = "click";
									$(e.currentTarget).trigger(e);
									break;
								case 37: // right
									e.preventDefault();
									if(this.is_open(e.currentTarget)) {
										this.close_node(e.currentTarget);
									}
									else {
										o = this.get_parent(e.currentTarget);
										if(o && o.id !== '#') { this.get_node(o, true).children('.jstree-anchor').focus(); }
									}
									break;
								case 38: // up
									e.preventDefault();
									o = this.get_prev_dom(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
									break;
								case 39: // left
									e.preventDefault();
									if(this.is_closed(e.currentTarget)) {
										this.open_node(e.currentTarget, function (o) { this.get_node(o, true).children('.jstree-anchor').focus(); });
									}
									else if (this.is_open(e.currentTarget)) {
										o = this.get_node(e.currentTarget, true).children('.jstree-children')[0];
										if(o) { $(this._firstChild(o)).children('.jstree-anchor').focus(); }
									}
									break;
								case 40: // down
									e.preventDefault();
									o = this.get_next_dom(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
									break;
								case 106: // aria defines * on numpad as open_all - not very common
									this.open_all();
									break;
								case 36: // home
									e.preventDefault();
									o = this._firstChild(this.get_container_ul()[0]);
									if(o) { $(o).children('.jstree-anchor').filter(':visible').focus(); }
									break;
								case 35: // end
									e.preventDefault();
									this.element.find('.jstree-anchor').filter(':visible').last().focus();
									break;
								/*
								// delete
								case 46:
									e.preventDefault();
									o = this.get_node(e.currentTarget);
									if(o && o.id && o.id !== '#') {
										o = this.is_selected(o) ? this.get_selected() : o;
										this.delete_node(o);
									}
									break;
								// f2
								case 113:
									e.preventDefault();
									o = this.get_node(e.currentTarget);
									if(o && o.id && o.id !== '#') {
										// this.edit(o);
									}
									break;
								default:
									// console.log(e.which);
									break;
								*/
							}
						}, this))
					.on("load_node.jstree", $.proxy(function (e, data) {
							if(data.status) {
								if(data.node.id === '#' && !this._data.core.loaded) {
									this._data.core.loaded = true;
									if(this._firstChild(this.get_container_ul()[0])) {
										this.element.attr('aria-activedescendant',this._firstChild(this.get_container_ul()[0]).id);
									}
									/**
									 * triggered after the root node is loaded for the first time
									 * @event
									 * @name loaded.jstree
									 */
									this.trigger("loaded");
								}
								if(!this._data.core.ready) {
									setTimeout($.proxy(function() {
										if(this.element && !this.get_container_ul().find('.jstree-loading').length) {
											this._data.core.ready = true;
											if(this._data.core.selected.length) {
												if(this.settings.core.expand_selected_onload) {
													var tmp = [], i, j;
													for(i = 0, j = this._data.core.selected.length; i < j; i++) {
														tmp = tmp.concat(this._model.data[this._data.core.selected[i]].parents);
													}
													tmp = $.vakata.array_unique(tmp);
													for(i = 0, j = tmp.length; i < j; i++) {
														this.open_node(tmp[i], false, 0);
													}
												}
												this.trigger('changed', { 'action' : 'ready', 'selected' : this._data.core.selected });
											}
											/**
											 * triggered after all nodes are finished loading
											 * @event
											 * @name ready.jstree
											 */
											this.trigger("ready");
										}
									}, this), 0);
								}
							}
						}, this))
					// quick searching when the tree is focused
					.on('keypress.jstree', $.proxy(function (e) {
							if(e.target.tagName === "INPUT") { return true; }
							if(tout) { clearTimeout(tout); }
							tout = setTimeout(function () {
								word = '';
							}, 500);

							var chr = String.fromCharCode(e.which).toLowerCase(),
								col = this.element.find('.jstree-anchor').filter(':visible'),
								ind = col.index(document.activeElement) || 0,
								end = false;
							word += chr;

							// match for whole word from current node down (including the current node)
							if(word.length > 1) {
								col.slice(ind).each($.proxy(function (i, v) {
									if($(v).text().toLowerCase().indexOf(word) === 0) {
										$(v).focus();
										end = true;
										return false;
									}
								}, this));
								if(end) { return; }

								// match for whole word from the beginning of the tree
								col.slice(0, ind).each($.proxy(function (i, v) {
									if($(v).text().toLowerCase().indexOf(word) === 0) {
										$(v).focus();
										end = true;
										return false;
									}
								}, this));
								if(end) { return; }
							}
							// list nodes that start with that letter (only if word consists of a single char)
							if(new RegExp('^' + chr + '+$').test(word)) {
								// search for the next node starting with that letter
								col.slice(ind + 1).each($.proxy(function (i, v) {
									if($(v).text().toLowerCase().charAt(0) === chr) {
										$(v).focus();
										end = true;
										return false;
									}
								}, this));
								if(end) { return; }

								// search from the beginning
								col.slice(0, ind + 1).each($.proxy(function (i, v) {
									if($(v).text().toLowerCase().charAt(0) === chr) {
										$(v).focus();
										end = true;
										return false;
									}
								}, this));
								if(end) { return; }
							}
						}, this))
					// THEME RELATED
					.on("init.jstree", $.proxy(function () {
							var s = this.settings.core.themes;
							this._data.core.themes.dots			= s.dots;
							this._data.core.themes.stripes		= s.stripes;
							this._data.core.themes.icons		= s.icons;
							this.set_theme(s.name || "default", s.url);
							this.set_theme_variant(s.variant);
						}, this))
					.on("loading.jstree", $.proxy(function () {
							this[ this._data.core.themes.dots ? "show_dots" : "hide_dots" ]();
							this[ this._data.core.themes.icons ? "show_icons" : "hide_icons" ]();
							this[ this._data.core.themes.stripes ? "show_stripes" : "hide_stripes" ]();
						}, this))
					.on('blur.jstree', '.jstree-anchor', $.proxy(function (e) {
							this._data.core.focused = null;
							$(e.currentTarget).filter('.jstree-hovered').mouseleave();
							this.element.attr('tabindex', '0');
						}, this))
					.on('focus.jstree', '.jstree-anchor', $.proxy(function (e) {
							var tmp = this.get_node(e.currentTarget);
							if(tmp && tmp.id) {
								this._data.core.focused = tmp.id;
							}
							this.element.find('.jstree-hovered').not(e.currentTarget).mouseleave();
							$(e.currentTarget).mouseenter();
							this.element.attr('tabindex', '-1');
						}, this))
					.on('focus.jstree', $.proxy(function () {
							if(+(new Date()) - was_click > 500 && !this._data.core.focused) {
								was_click = 0;
								var act = this.get_node(this.element.attr('aria-activedescendant'), true);
								if(act) {
									act.find('> .jstree-anchor').focus();
								}
							}
						}, this))
					.on('mouseenter.jstree', '.jstree-anchor', $.proxy(function (e) {
							this.hover_node(e.currentTarget);
						}, this))
					.on('mouseleave.jstree', '.jstree-anchor', $.proxy(function (e) {
							this.dehover_node(e.currentTarget);
						}, this));
			},
			/**
			 * part of the destroying of an instance. Used internally.
			 * @private
			 * @name unbind()
			 */
			unbind : function () {
				this.element.off('.jstree');
				$(document).off('.jstree-' + this._id);
			},
			/**
			 * trigger an event. Used internally.
			 * @private
			 * @name trigger(ev [, data])
			 * @param  {String} ev the name of the event to trigger
			 * @param  {Object} data additional data to pass with the event
			 */
			trigger : function (ev, data) {
				if(!data) {
					data = {};
				}
				data.instance = this;
				this.element.triggerHandler(ev.replace('.jstree','') + '.jstree', data);
			},
			/**
			 * returns the jQuery extended instance container
			 * @name get_container()
			 * @return {jQuery}
			 */
			get_container : function () {
				return this.element;
			},
			/**
			 * returns the jQuery extended main UL node inside the instance container. Used internally.
			 * @private
			 * @name get_container_ul()
			 * @return {jQuery}
			 */
			get_container_ul : function () {
				return this.element.children(".jstree-children").first();
			},
			/**
			 * gets string replacements (localization). Used internally.
			 * @private
			 * @name get_string(key)
			 * @param  {String} key
			 * @return {String}
			 */
			get_string : function (key) {
				var a = this.settings.core.strings;
				if($.isFunction(a)) { return a.call(this, key); }
				if(a && a[key]) { return a[key]; }
				return key;
			},
			/**
			 * gets the first child of a DOM node. Used internally.
			 * @private
			 * @name _firstChild(dom)
			 * @param  {DOMElement} dom
			 * @return {DOMElement}
			 */
			_firstChild : function (dom) {
				dom = dom ? dom.firstChild : null;
				while(dom !== null && dom.nodeType !== 1) {
					dom = dom.nextSibling;
				}
				return dom;
			},
			/**
			 * gets the next sibling of a DOM node. Used internally.
			 * @private
			 * @name _nextSibling(dom)
			 * @param  {DOMElement} dom
			 * @return {DOMElement}
			 */
			_nextSibling : function (dom) {
				dom = dom ? dom.nextSibling : null;
				while(dom !== null && dom.nodeType !== 1) {
					dom = dom.nextSibling;
				}
				return dom;
			},
			/**
			 * gets the previous sibling of a DOM node. Used internally.
			 * @private
			 * @name _previousSibling(dom)
			 * @param  {DOMElement} dom
			 * @return {DOMElement}
			 */
			_previousSibling : function (dom) {
				dom = dom ? dom.previousSibling : null;
				while(dom !== null && dom.nodeType !== 1) {
					dom = dom.previousSibling;
				}
				return dom;
			},
			/**
			 * get the JSON representation of a node (or the actual jQuery extended DOM node) by using any input (child DOM element, ID string, selector, etc)
			 * @name get_node(obj [, as_dom])
			 * @param  {mixed} obj
			 * @param  {Boolean} as_dom
			 * @return {Object|jQuery}
			 */
			get_node : function (obj, as_dom) {
				if(obj && obj.id) {
					obj = obj.id;
				}
				var dom;
				try {
					if(this._model.data[obj]) {
						obj = this._model.data[obj];
					}
					else if(typeof obj === "string" && this._model.data[obj.replace(/^#/, '')]) {
						obj = this._model.data[obj.replace(/^#/, '')];
					}
					else if(typeof obj === "string" && (dom = $('#' + obj.replace($.jstree.idregex,'\\$&'), this.element)).length && this._model.data[dom.closest('.jstree-node').attr('id')]) {
						obj = this._model.data[dom.closest('.jstree-node').attr('id')];
					}
					else if((dom = $(obj, this.element)).length && this._model.data[dom.closest('.jstree-node').attr('id')]) {
						obj = this._model.data[dom.closest('.jstree-node').attr('id')];
					}
					else if((dom = $(obj, this.element)).length && dom.hasClass('jstree')) {
						obj = this._model.data['#'];
					}
					else {
						return false;
					}

					if(as_dom) {
						obj = obj.id === '#' ? this.element : $('#' + obj.id.replace($.jstree.idregex,'\\$&'), this.element);
					}
					return obj;
				} catch (ex) { return false; }
			},
			/**
			 * get the path to a node, either consisting of node texts, or of node IDs, optionally glued together (otherwise an array)
			 * @name get_path(obj [, glue, ids])
			 * @param  {mixed} obj the node
			 * @param  {String} glue if you want the path as a string - pass the glue here (for example '/'), if a falsy value is supplied here, an array is returned
			 * @param  {Boolean} ids if set to true build the path using ID, otherwise node text is used
			 * @return {mixed}
			 */
			get_path : function (obj, glue, ids) {
				obj = obj.parents ? obj : this.get_node(obj);
				if(!obj || obj.id === '#' || !obj.parents) {
					return false;
				}
				var i, j, p = [];
				p.push(ids ? obj.id : obj.text);
				for(i = 0, j = obj.parents.length; i < j; i++) {
					p.push(ids ? obj.parents[i] : this.get_text(obj.parents[i]));
				}
				p = p.reverse().slice(1);
				return glue ? p.join(glue) : p;
			},
			/**
			 * get the next visible node that is below the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
			 * @name get_next_dom(obj [, strict])
			 * @param  {mixed} obj
			 * @param  {Boolean} strict
			 * @return {jQuery}
			 */
			get_next_dom : function (obj, strict) {
				var tmp;
				obj = this.get_node(obj, true);
				if(obj[0] === this.element[0]) {
					tmp = this._firstChild(this.get_container_ul()[0]);
					while (tmp && tmp.offsetHeight === 0) {
						tmp = this._nextSibling(tmp);
					}
					return tmp ? $(tmp) : false;
				}
				if(!obj || !obj.length) {
					return false;
				}
				if(strict) {
					tmp = obj[0];
					do {
						tmp = this._nextSibling(tmp);
					} while (tmp && tmp.offsetHeight === 0);
					return tmp ? $(tmp) : false;
				}
				if(obj.hasClass("jstree-open")) {
					tmp = this._firstChild(obj.children('.jstree-children')[0]);
					while (tmp && tmp.offsetHeight === 0) {
						tmp = this._nextSibling(tmp);
					}
					if(tmp !== null) {
						return $(tmp);
					}
				}
				tmp = obj[0];
				do {
					tmp = this._nextSibling(tmp);
				} while (tmp && tmp.offsetHeight === 0);
				if(tmp !== null) {
					return $(tmp);
				}
				return obj.parentsUntil(".jstree",".jstree-node").nextAll(".jstree-node:visible").first();
			},
			/**
			 * get the previous visible node that is above the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
			 * @name get_prev_dom(obj [, strict])
			 * @param  {mixed} obj
			 * @param  {Boolean} strict
			 * @return {jQuery}
			 */
			get_prev_dom : function (obj, strict) {
				var tmp;
				obj = this.get_node(obj, true);
				if(obj[0] === this.element[0]) {
					tmp = this.get_container_ul()[0].lastChild;
					while (tmp && tmp.offsetHeight === 0) {
						tmp = this._previousSibling(tmp);
					}
					return tmp ? $(tmp) : false;
				}
				if(!obj || !obj.length) {
					return false;
				}
				if(strict) {
					tmp = obj[0];
					do {
						tmp = this._previousSibling(tmp);
					} while (tmp && tmp.offsetHeight === 0);
					return tmp ? $(tmp) : false;
				}
				tmp = obj[0];
				do {
					tmp = this._previousSibling(tmp);
				} while (tmp && tmp.offsetHeight === 0);
				if(tmp !== null) {
					obj = $(tmp);
					while(obj.hasClass("jstree-open")) {
						obj = obj.children(".jstree-children").first().children(".jstree-node:visible:last");
					}
					return obj;
				}
				tmp = obj[0].parentNode.parentNode;
				return tmp && tmp.className && tmp.className.indexOf('jstree-node') !== -1 ? $(tmp) : false;
			},
			/**
			 * get the parent ID of a node
			 * @name get_parent(obj)
			 * @param  {mixed} obj
			 * @return {String}
			 */
			get_parent : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				return obj.parent;
			},
			/**
			 * get a jQuery collection of all the children of a node (node must be rendered)
			 * @name get_children_dom(obj)
			 * @param  {mixed} obj
			 * @return {jQuery}
			 */
			get_children_dom : function (obj) {
				obj = this.get_node(obj, true);
				if(obj[0] === this.element[0]) {
					return this.get_container_ul().children(".jstree-node");
				}
				if(!obj || !obj.length) {
					return false;
				}
				return obj.children(".jstree-children").children(".jstree-node");
			},
			/**
			 * checks if a node has children
			 * @name is_parent(obj)
			 * @param  {mixed} obj
			 * @return {Boolean}
			 */
			is_parent : function (obj) {
				obj = this.get_node(obj);
				return obj && (obj.state.loaded === false || obj.children.length > 0);
			},
			/**
			 * checks if a node is loaded (its children are available)
			 * @name is_loaded(obj)
			 * @param  {mixed} obj
			 * @return {Boolean}
			 */
			is_loaded : function (obj) {
				obj = this.get_node(obj);
				return obj && obj.state.loaded;
			},
			/**
			 * check if a node is currently loading (fetching children)
			 * @name is_loading(obj)
			 * @param  {mixed} obj
			 * @return {Boolean}
			 */
			is_loading : function (obj) {
				obj = this.get_node(obj);
				return obj && obj.state && obj.state.loading;
			},
			/**
			 * check if a node is opened
			 * @name is_open(obj)
			 * @param  {mixed} obj
			 * @return {Boolean}
			 */
			is_open : function (obj) {
				obj = this.get_node(obj);
				return obj && obj.state.opened;
			},
			/**
			 * check if a node is in a closed state
			 * @name is_closed(obj)
			 * @param  {mixed} obj
			 * @return {Boolean}
			 */
			is_closed : function (obj) {
				obj = this.get_node(obj);
				return obj && this.is_parent(obj) && !obj.state.opened;
			},
			/**
			 * check if a node has no children
			 * @name is_leaf(obj)
			 * @param  {mixed} obj
			 * @return {Boolean}
			 */
			is_leaf : function (obj) {
				return !this.is_parent(obj);
			},
			/**
			 * loads a node (fetches its children using the `core.data` setting). Multiple nodes can be passed to by using an array.
			 * @name load_node(obj [, callback])
			 * @param  {mixed} obj
			 * @param  {function} callback a function to be executed once loading is complete, the function is executed in the instance's scope and receives two arguments - the node and a boolean status
			 * @return {Boolean}
			 * @trigger load_node.jstree
			 */
			load_node : function (obj, callback) {
				var k, l, i, j, c;
				if($.isArray(obj)) {
					this._load_nodes(obj.slice(), callback);
					return true;
				}
				obj = this.get_node(obj);
				if(!obj) {
					if(callback) { callback.call(this, obj, false); }
					return false;
				}
				// if(obj.state.loading) { } // the node is already loading - just wait for it to load and invoke callback? but if called implicitly it should be loaded again?
				if(obj.state.loaded) {
					obj.state.loaded = false;
					for(k = 0, l = obj.children_d.length; k < l; k++) {
						for(i = 0, j = obj.parents.length; i < j; i++) {
							this._model.data[obj.parents[i]].children_d = $.vakata.array_remove_item(this._model.data[obj.parents[i]].children_d, obj.children_d[k]);
						}
						if(this._model.data[obj.children_d[k]].state.selected) {
							c = true;
							this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, obj.children_d[k]);
						}
						delete this._model.data[obj.children_d[k]];
					}
					obj.children = [];
					obj.children_d = [];
					if(c) {
						this.trigger('changed', { 'action' : 'load_node', 'node' : obj, 'selected' : this._data.core.selected });
					}
				}
				obj.state.failed = false;
				obj.state.loading = true;
				this.get_node(obj, true).addClass("jstree-loading").attr('aria-busy',true);
				this._load_node(obj, $.proxy(function (status) {
					obj = this._model.data[obj.id];
					obj.state.loading = false;
					obj.state.loaded = status;
					obj.state.failed = !obj.state.loaded;
					var dom = this.get_node(obj, true);
					if(obj.state.loaded && !obj.children.length && dom && dom.length && !dom.hasClass('jstree-leaf')) {
						dom.removeClass('jstree-closed jstree-open').addClass('jstree-leaf');
					}
					dom.removeClass("jstree-loading").attr('aria-busy',false);
					/**
					 * triggered after a node is loaded
					 * @event
					 * @name load_node.jstree
					 * @param {Object} node the node that was loading
					 * @param {Boolean} status was the node loaded successfully
					 */
					this.trigger('load_node', { "node" : obj, "status" : status });
					if(callback) {
						callback.call(this, obj, status);
					}
				}, this));
				return true;
			},
			/**
			 * load an array of nodes (will also load unavailable nodes as soon as the appear in the structure). Used internally.
			 * @private
			 * @name _load_nodes(nodes [, callback])
			 * @param  {array} nodes
			 * @param  {function} callback a function to be executed once loading is complete, the function is executed in the instance's scope and receives one argument - the array passed to _load_nodes
			 */
			_load_nodes : function (nodes, callback, is_callback) {
				var r = true,
					c = function () { this._load_nodes(nodes, callback, true); },
					m = this._model.data, i, j, tmp = [];
				for(i = 0, j = nodes.length; i < j; i++) {
					if(m[nodes[i]] && ( (!m[nodes[i]].state.loaded && !m[nodes[i]].state.failed) || !is_callback)) {
						if(!this.is_loading(nodes[i])) {
							this.load_node(nodes[i], c);
						}
						r = false;
					}
				}
				if(r) {
					for(i = 0, j = nodes.length; i < j; i++) {
						if(m[nodes[i]] && m[nodes[i]].state.loaded) {
							tmp.push(nodes[i]);
						}
					}
					if(callback && !callback.done) {
						callback.call(this, tmp);
						callback.done = true;
					}
				}
			},
			/**
			 * loads all unloaded nodes
			 * @name load_all([obj, callback])
			 * @param {mixed} obj the node to load recursively, omit to load all nodes in the tree
			 * @param {function} callback a function to be executed once loading all the nodes is complete,
			 * @trigger load_all.jstree
			 */
			load_all : function (obj, callback) {
				if(!obj) { obj = '#'; }
				obj = this.get_node(obj);
				if(!obj) { return false; }
				var to_load = [],
					m = this._model.data,
					c = m[obj.id].children_d,
					i, j;
				if(obj.state && !obj.state.loaded) {
					to_load.push(obj.id);
				}
				for(i = 0, j = c.length; i < j; i++) {
					if(m[c[i]] && m[c[i]].state && !m[c[i]].state.loaded) {
						to_load.push(c[i]);
					}
				}
				if(to_load.length) {
					this._load_nodes(to_load, function () {
						this.load_all(obj, callback);
					});
				}
				else {
					/**
					 * triggered after a load_all call completes
					 * @event
					 * @name load_all.jstree
					 * @param {Object} node the recursively loaded node
					 */
					if(callback) { callback.call(this, obj); }
					this.trigger('load_all', { "node" : obj });
				}
			},
			/**
			 * handles the actual loading of a node. Used only internally.
			 * @private
			 * @name _load_node(obj [, callback])
			 * @param  {mixed} obj
			 * @param  {function} callback a function to be executed once loading is complete, the function is executed in the instance's scope and receives one argument - a boolean status
			 * @return {Boolean}
			 */
			_load_node : function (obj, callback) {
				var s = this.settings.core.data, t;
				// use original HTML
				if(!s) {
					if(obj.id === '#') {
						return this._append_html_data(obj, this._data.core.original_container_html.clone(true), function (status) {
							callback.call(this, status);
						});
					}
					else {
						return callback.call(this, false);
					}
					// return callback.call(this, obj.id === '#' ? this._append_html_data(obj, this._data.core.original_container_html.clone(true)) : false);
				}
				if($.isFunction(s)) {
					return s.call(this, obj, $.proxy(function (d) {
						if(d === false) {
							callback.call(this, false);
						}
						this[typeof d === 'string' ? '_append_html_data' : '_append_json_data'](obj, typeof d === 'string' ? $($.parseHTML(d)).filter(function () { return this.nodeType !== 3; }) : d, function (status) {
							callback.call(this, status);
						});
						// return d === false ? callback.call(this, false) : callback.call(this, this[typeof d === 'string' ? '_append_html_data' : '_append_json_data'](obj, typeof d === 'string' ? $(d) : d));
					}, this));
				}
				if(typeof s === 'object') {
					if(s.url) {
						s = $.extend(true, {}, s);
						if($.isFunction(s.url)) {
							s.url = s.url.call(this, obj);
						}
						if($.isFunction(s.data)) {
							s.data = s.data.call(this, obj);
						}
						return $.ajax(s)
							.done($.proxy(function (d,t,x) {
									var type = x.getResponseHeader('Content-Type');
									if((type && type.indexOf('json') !== -1) || typeof d === "object") {
										return this._append_json_data(obj, d, function (status) { callback.call(this, status); });
										//return callback.call(this, this._append_json_data(obj, d));
									}
									if((type && type.indexOf('html') !== -1) || typeof d === "string") {
										return this._append_html_data(obj, $($.parseHTML(d)).filter(function () { return this.nodeType !== 3; }), function (status) { callback.call(this, status); });
										// return callback.call(this, this._append_html_data(obj, $(d)));
									}
									this._data.core.last_error = { 'error' : 'ajax', 'plugin' : 'core', 'id' : 'core_04', 'reason' : 'Could not load node', 'data' : JSON.stringify({ 'id' : obj.id, 'xhr' : x }) };
									this.settings.core.error.call(this, this._data.core.last_error);
									return callback.call(this, false);
								}, this))
							.fail($.proxy(function (f) {
									callback.call(this, false);
									this._data.core.last_error = { 'error' : 'ajax', 'plugin' : 'core', 'id' : 'core_04', 'reason' : 'Could not load node', 'data' : JSON.stringify({ 'id' : obj.id, 'xhr' : f }) };
									this.settings.core.error.call(this, this._data.core.last_error);
								}, this));
					}
					t = ($.isArray(s) || $.isPlainObject(s)) ? JSON.parse(JSON.stringify(s)) : s;
					if(obj.id === '#') {
						return this._append_json_data(obj, t, function (status) {
							callback.call(this, status);
						});
					}
					else {
						this._data.core.last_error = { 'error' : 'nodata', 'plugin' : 'core', 'id' : 'core_05', 'reason' : 'Could not load node', 'data' : JSON.stringify({ 'id' : obj.id }) };
						this.settings.core.error.call(this, this._data.core.last_error);
						return callback.call(this, false);
					}
					//return callback.call(this, (obj.id === "#" ? this._append_json_data(obj, t) : false) );
				}
				if(typeof s === 'string') {
					if(obj.id === '#') {
						return this._append_html_data(obj, $($.parseHTML(s)).filter(function () { return this.nodeType !== 3; }), function (status) {
							callback.call(this, status);
						});
					}
					else {
						this._data.core.last_error = { 'error' : 'nodata', 'plugin' : 'core', 'id' : 'core_06', 'reason' : 'Could not load node', 'data' : JSON.stringify({ 'id' : obj.id }) };
						this.settings.core.error.call(this, this._data.core.last_error);
						return callback.call(this, false);
					}
					//return callback.call(this, (obj.id === "#" ? this._append_html_data(obj, $(s)) : false) );
				}
				return callback.call(this, false);
			},
			/**
			 * adds a node to the list of nodes to redraw. Used only internally.
			 * @private
			 * @name _node_changed(obj [, callback])
			 * @param  {mixed} obj
			 */
			_node_changed : function (obj) {
				obj = this.get_node(obj);
				if(obj) {
					this._model.changed.push(obj.id);
				}
			},
			/**
			 * appends HTML content to the tree. Used internally.
			 * @private
			 * @name _append_html_data(obj, data)
			 * @param  {mixed} obj the node to append to
			 * @param  {String} data the HTML string to parse and append
			 * @trigger model.jstree, changed.jstree
			 */
			_append_html_data : function (dom, data, cb) {
				dom = this.get_node(dom);
				dom.children = [];
				dom.children_d = [];
				var dat = data.is('ul') ? data.children() : data,
					par = dom.id,
					chd = [],
					dpc = [],
					m = this._model.data,
					p = m[par],
					s = this._data.core.selected.length,
					tmp, i, j;
				dat.each($.proxy(function (i, v) {
					tmp = this._parse_model_from_html($(v), par, p.parents.concat());
					if(tmp) {
						chd.push(tmp);
						dpc.push(tmp);
						if(m[tmp].children_d.length) {
							dpc = dpc.concat(m[tmp].children_d);
						}
					}
				}, this));
				p.children = chd;
				p.children_d = dpc;
				for(i = 0, j = p.parents.length; i < j; i++) {
					m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
				}
				/**
				 * triggered when new data is inserted to the tree model
				 * @event
				 * @name model.jstree
				 * @param {Array} nodes an array of node IDs
				 * @param {String} parent the parent ID of the nodes
				 */
				this.trigger('model', { "nodes" : dpc, 'parent' : par });
				if(par !== '#') {
					this._node_changed(par);
					this.redraw();
				}
				else {
					this.get_container_ul().children('.jstree-initial-node').remove();
					this.redraw(true);
				}
				if(this._data.core.selected.length !== s) {
					this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
				}
				cb.call(this, true);
			},
			/**
			 * appends JSON content to the tree. Used internally.
			 * @private
			 * @name _append_json_data(obj, data)
			 * @param  {mixed} obj the node to append to
			 * @param  {String} data the JSON object to parse and append
			 * @param  {Boolean} force_processing internal param - do not set
			 * @trigger model.jstree, changed.jstree
			 */
			_append_json_data : function (dom, data, cb, force_processing) {
				if(this.element === null) { return; }
				dom = this.get_node(dom);
				dom.children = [];
				dom.children_d = [];
				// *%$@!!!
				if(data.d) {
					data = data.d;
					if(typeof data === "string") {
						data = JSON.parse(data);
					}
				}
				if(!$.isArray(data)) { data = [data]; }
				var w = null,
					args = {
						'df'	: this._model.default_state,
						'dat'	: data,
						'par'	: dom.id,
						'm'		: this._model.data,
						't_id'	: this._id,
						't_cnt'	: this._cnt,
						'sel'	: this._data.core.selected
					},
					func = function (data, undefined) {
						if(data.data) { data = data.data; }
						var dat = data.dat,
							par = data.par,
							chd = [],
							dpc = [],
							add = [],
							df = data.df,
							t_id = data.t_id,
							t_cnt = data.t_cnt,
							m = data.m,
							p = m[par],
							sel = data.sel,
							tmp, i, j, rslt,
							parse_flat = function (d, p, ps) {
								if(!ps) { ps = []; }
								else { ps = ps.concat(); }
								if(p) { ps.unshift(p); }
								var tid = d.id.toString(),
									i, j, c, e,
									tmp = {
										id			: tid,
										text		: d.text || '',
										icon		: d.icon !== undefined ? d.icon : true,
										parent		: p,
										parents		: ps,
										children	: d.children || [],
										children_d	: d.children_d || [],
										data		: d.data,
										state		: { },
										li_attr		: { id : false },
										a_attr		: { href : '#' },
										original	: false
									};
								for(i in df) {
									if(df.hasOwnProperty(i)) {
										tmp.state[i] = df[i];
									}
								}
								if(d && d.data && d.data.jstree && d.data.jstree.icon) {
									tmp.icon = d.data.jstree.icon;
								}
								if(tmp.icon === undefined || tmp.icon === null || tmp.icon === "") {
									tmp.icon = true;
								}
								if(d && d.data) {
									tmp.data = d.data;
									if(d.data.jstree) {
										for(i in d.data.jstree) {
											if(d.data.jstree.hasOwnProperty(i)) {
												tmp.state[i] = d.data.jstree[i];
											}
										}
									}
								}
								if(d && typeof d.state === 'object') {
									for (i in d.state) {
										if(d.state.hasOwnProperty(i)) {
											tmp.state[i] = d.state[i];
										}
									}
								}
								if(d && typeof d.li_attr === 'object') {
									for (i in d.li_attr) {
										if(d.li_attr.hasOwnProperty(i)) {
											tmp.li_attr[i] = d.li_attr[i];
										}
									}
								}
								if(!tmp.li_attr.id) {
									tmp.li_attr.id = tid;
								}
								if(d && typeof d.a_attr === 'object') {
									for (i in d.a_attr) {
										if(d.a_attr.hasOwnProperty(i)) {
											tmp.a_attr[i] = d.a_attr[i];
										}
									}
								}
								if(d && d.children && d.children === true) {
									tmp.state.loaded = false;
									tmp.children = [];
									tmp.children_d = [];
								}
								m[tmp.id] = tmp;
								for(i = 0, j = tmp.children.length; i < j; i++) {
									c = parse_flat(m[tmp.children[i]], tmp.id, ps);
									e = m[c];
									tmp.children_d.push(c);
									if(e.children_d.length) {
										tmp.children_d = tmp.children_d.concat(e.children_d);
									}
								}
								delete d.data;
								delete d.children;
								m[tmp.id].original = d;
								if(tmp.state.selected) {
									add.push(tmp.id);
								}
								return tmp.id;
							},
							parse_nest = function (d, p, ps) {
								if(!ps) { ps = []; }
								else { ps = ps.concat(); }
								if(p) { ps.unshift(p); }
								var tid = false, i, j, c, e, tmp;
								do {
									tid = 'j' + t_id + '_' + (++t_cnt);
								} while(m[tid]);

								tmp = {
									id			: false,
									text		: typeof d === 'string' ? d : '',
									icon		: typeof d === 'object' && d.icon !== undefined ? d.icon : true,
									parent		: p,
									parents		: ps,
									children	: [],
									children_d	: [],
									data		: null,
									state		: { },
									li_attr		: { id : false },
									a_attr		: { href : '#' },
									original	: false
								};
								for(i in df) {
									if(df.hasOwnProperty(i)) {
										tmp.state[i] = df[i];
									}
								}
								if(d && d.id) { tmp.id = d.id.toString(); }
								if(d && d.text) { tmp.text = d.text; }
								if(d && d.data && d.data.jstree && d.data.jstree.icon) {
									tmp.icon = d.data.jstree.icon;
								}
								if(tmp.icon === undefined || tmp.icon === null || tmp.icon === "") {
									tmp.icon = true;
								}
								if(d && d.data) {
									tmp.data = d.data;
									if(d.data.jstree) {
										for(i in d.data.jstree) {
											if(d.data.jstree.hasOwnProperty(i)) {
												tmp.state[i] = d.data.jstree[i];
											}
										}
									}
								}
								if(d && typeof d.state === 'object') {
									for (i in d.state) {
										if(d.state.hasOwnProperty(i)) {
											tmp.state[i] = d.state[i];
										}
									}
								}
								if(d && typeof d.li_attr === 'object') {
									for (i in d.li_attr) {
										if(d.li_attr.hasOwnProperty(i)) {
											tmp.li_attr[i] = d.li_attr[i];
										}
									}
								}
								if(tmp.li_attr.id && !tmp.id) {
									tmp.id = tmp.li_attr.id.toString();
								}
								if(!tmp.id) {
									tmp.id = tid;
								}
								if(!tmp.li_attr.id) {
									tmp.li_attr.id = tmp.id;
								}
								if(d && typeof d.a_attr === 'object') {
									for (i in d.a_attr) {
										if(d.a_attr.hasOwnProperty(i)) {
											tmp.a_attr[i] = d.a_attr[i];
										}
									}
								}
								if(d && d.children && d.children.length) {
									for(i = 0, j = d.children.length; i < j; i++) {
										c = parse_nest(d.children[i], tmp.id, ps);
										e = m[c];
										tmp.children.push(c);
										if(e.children_d.length) {
											tmp.children_d = tmp.children_d.concat(e.children_d);
										}
									}
									tmp.children_d = tmp.children_d.concat(tmp.children);
								}
								if(d && d.children && d.children === true) {
									tmp.state.loaded = false;
									tmp.children = [];
									tmp.children_d = [];
								}
								delete d.data;
								delete d.children;
								tmp.original = d;
								m[tmp.id] = tmp;
								if(tmp.state.selected) {
									add.push(tmp.id);
								}
								return tmp.id;
							};

						if(dat.length && dat[0].id !== undefined && dat[0].parent !== undefined) {
							// Flat JSON support (for easy import from DB):
							// 1) convert to object (foreach)
							for(i = 0, j = dat.length; i < j; i++) {
								if(!dat[i].children) {
									dat[i].children = [];
								}
								m[dat[i].id.toString()] = dat[i];
							}
							// 2) populate children (foreach)
							for(i = 0, j = dat.length; i < j; i++) {
								m[dat[i].parent.toString()].children.push(dat[i].id.toString());
								// populate parent.children_d
								p.children_d.push(dat[i].id.toString());
							}
							// 3) normalize && populate parents and children_d with recursion
							for(i = 0, j = p.children.length; i < j; i++) {
								tmp = parse_flat(m[p.children[i]], par, p.parents.concat());
								dpc.push(tmp);
								if(m[tmp].children_d.length) {
									dpc = dpc.concat(m[tmp].children_d);
								}
							}
							for(i = 0, j = p.parents.length; i < j; i++) {
								m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
							}
							// ?) three_state selection - p.state.selected && t - (if three_state foreach(dat => ch) -> foreach(parents) if(parent.selected) child.selected = true;
							rslt = {
								'cnt' : t_cnt,
								'mod' : m,
								'sel' : sel,
								'par' : par,
								'dpc' : dpc,
								'add' : add
							};
						}
						else {
							for(i = 0, j = dat.length; i < j; i++) {
								tmp = parse_nest(dat[i], par, p.parents.concat());
								if(tmp) {
									chd.push(tmp);
									dpc.push(tmp);
									if(m[tmp].children_d.length) {
										dpc = dpc.concat(m[tmp].children_d);
									}
								}
							}
							p.children = chd;
							p.children_d = dpc;
							for(i = 0, j = p.parents.length; i < j; i++) {
								m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
							}
							rslt = {
								'cnt' : t_cnt,
								'mod' : m,
								'sel' : sel,
								'par' : par,
								'dpc' : dpc,
								'add' : add
							};
						}
						if(typeof window === 'undefined' || typeof window.document === 'undefined') {
							postMessage(rslt);
						}
						else {
							return rslt;
						}
					},
					rslt = function (rslt, worker) {
						if(this.element === null) { return; }
						this._cnt = rslt.cnt;
						this._model.data = rslt.mod; // breaks the reference in load_node - careful

						if(worker) {
							var i, j, a = rslt.add, r = rslt.sel, s = this._data.core.selected.slice(), m = this._model.data;
							// if selection was changed while calculating in worker
							if(r.length !== s.length || $.vakata.array_unique(r.concat(s)).length !== r.length) {
								// deselect nodes that are no longer selected
								for(i = 0, j = r.length; i < j; i++) {
									if($.inArray(r[i], a) === -1 && $.inArray(r[i], s) === -1) {
										m[r[i]].state.selected = false;
									}
								}
								// select nodes that were selected in the mean time
								for(i = 0, j = s.length; i < j; i++) {
									if($.inArray(s[i], r) === -1) {
										m[s[i]].state.selected = true;
									}
								}
							}
						}
						if(rslt.add.length) {
							this._data.core.selected = this._data.core.selected.concat(rslt.add);
						}

						this.trigger('model', { "nodes" : rslt.dpc, 'parent' : rslt.par });

						if(rslt.par !== '#') {
							this._node_changed(rslt.par);
							this.redraw();
						}
						else {
							// this.get_container_ul().children('.jstree-initial-node').remove();
							this.redraw(true);
						}
						if(rslt.add.length) {
							this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
						}
						cb.call(this, true);
					};
				if(this.settings.core.worker && window.Blob && window.URL && window.Worker) {
					try {
						if(this._wrk === null) {
							this._wrk = window.URL.createObjectURL(
								new window.Blob(
									['self.onmessage = ' + func.toString()],
									{type:"text/javascript"}
								)
							);
						}
						if(!this._data.core.working || force_processing) {
							this._data.core.working = true;
							w = new window.Worker(this._wrk);
							w.onmessage = $.proxy(function (e) {
								rslt.call(this, e.data, true);
								try { w.terminate(); w = null; } catch(ignore) { }
								if(this._data.core.worker_queue.length) {
									this._append_json_data.apply(this, this._data.core.worker_queue.shift());
								}
								else {
									this._data.core.working = false;
								}
							}, this);
							if(!args.par) {
								if(this._data.core.worker_queue.length) {
									this._append_json_data.apply(this, this._data.core.worker_queue.shift());
								}
								else {
									this._data.core.working = false;
								}
							}
							else {
								w.postMessage(args);
							}
						}
						else {
							this._data.core.worker_queue.push([dom, data, cb, true]);
						}
					}
					catch(e) {
						rslt.call(this, func(args), false);
						if(this._data.core.worker_queue.length) {
							this._append_json_data.apply(this, this._data.core.worker_queue.shift());
						}
						else {
							this._data.core.working = false;
						}
					}
				}
				else {
					rslt.call(this, func(args), false);
				}
			},
			/**
			 * parses a node from a jQuery object and appends them to the in memory tree model. Used internally.
			 * @private
			 * @name _parse_model_from_html(d [, p, ps])
			 * @param  {jQuery} d the jQuery object to parse
			 * @param  {String} p the parent ID
			 * @param  {Array} ps list of all parents
			 * @return {String} the ID of the object added to the model
			 */
			_parse_model_from_html : function (d, p, ps) {
				if(!ps) { ps = []; }
				else { ps = [].concat(ps); }
				if(p) { ps.unshift(p); }
				var c, e, m = this._model.data,
					data = {
						id			: false,
						text		: false,
						icon		: true,
						parent		: p,
						parents		: ps,
						children	: [],
						children_d	: [],
						data		: null,
						state		: { },
						li_attr		: { id : false },
						a_attr		: { href : '#' },
						original	: false
					}, i, tmp, tid;
				for(i in this._model.default_state) {
					if(this._model.default_state.hasOwnProperty(i)) {
						data.state[i] = this._model.default_state[i];
					}
				}
				tmp = $.vakata.attributes(d, true);
				$.each(tmp, function (i, v) {
					v = $.trim(v);
					if(!v.length) { return true; }
					data.li_attr[i] = v;
					if(i === 'id') {
						data.id = v.toString();
					}
				});
				tmp = d.children('a').first();
				if(tmp.length) {
					tmp = $.vakata.attributes(tmp, true);
					$.each(tmp, function (i, v) {
						v = $.trim(v);
						if(v.length) {
							data.a_attr[i] = v;
						}
					});
				}
				tmp = d.children("a").first().length ? d.children("a").first().clone() : d.clone();
				tmp.children("ins, i, ul").remove();
				tmp = tmp.html();
				tmp = $('<div />').html(tmp);
				data.text = this.settings.core.force_text ? tmp.text() : tmp.html();
				tmp = d.data();
				data.data = tmp ? $.extend(true, {}, tmp) : null;
				data.state.opened = d.hasClass('jstree-open');
				data.state.selected = d.children('a').hasClass('jstree-clicked');
				data.state.disabled = d.children('a').hasClass('jstree-disabled');
				if(data.data && data.data.jstree) {
					for(i in data.data.jstree) {
						if(data.data.jstree.hasOwnProperty(i)) {
							data.state[i] = data.data.jstree[i];
						}
					}
				}
				tmp = d.children("a").children(".jstree-themeicon");
				if(tmp.length) {
					data.icon = tmp.hasClass('jstree-themeicon-hidden') ? false : tmp.attr('rel');
				}
				if(data.state.icon !== undefined) {
					data.icon = data.state.icon;
				}
				if(data.icon === undefined || data.icon === null || data.icon === "") {
					data.icon = true;
				}
				tmp = d.children("ul").children("li");
				do {
					tid = 'j' + this._id + '_' + (++this._cnt);
				} while(m[tid]);
				data.id = data.li_attr.id ? data.li_attr.id.toString() : tid;
				if(tmp.length) {
					tmp.each($.proxy(function (i, v) {
						c = this._parse_model_from_html($(v), data.id, ps);
						e = this._model.data[c];
						data.children.push(c);
						if(e.children_d.length) {
							data.children_d = data.children_d.concat(e.children_d);
						}
					}, this));
					data.children_d = data.children_d.concat(data.children);
				}
				else {
					if(d.hasClass('jstree-closed')) {
						data.state.loaded = false;
					}
				}
				if(data.li_attr['class']) {
					data.li_attr['class'] = data.li_attr['class'].replace('jstree-closed','').replace('jstree-open','');
				}
				if(data.a_attr['class']) {
					data.a_attr['class'] = data.a_attr['class'].replace('jstree-clicked','').replace('jstree-disabled','');
				}
				m[data.id] = data;
				if(data.state.selected) {
					this._data.core.selected.push(data.id);
				}
				return data.id;
			},
			/**
			 * parses a node from a JSON object (used when dealing with flat data, which has no nesting of children, but has id and parent properties) and appends it to the in memory tree model. Used internally.
			 * @private
			 * @name _parse_model_from_flat_json(d [, p, ps])
			 * @param  {Object} d the JSON object to parse
			 * @param  {String} p the parent ID
			 * @param  {Array} ps list of all parents
			 * @return {String} the ID of the object added to the model
			 */
			_parse_model_from_flat_json : function (d, p, ps) {
				if(!ps) { ps = []; }
				else { ps = ps.concat(); }
				if(p) { ps.unshift(p); }
				var tid = d.id.toString(),
					m = this._model.data,
					df = this._model.default_state,
					i, j, c, e,
					tmp = {
						id			: tid,
						text		: d.text || '',
						icon		: d.icon !== undefined ? d.icon : true,
						parent		: p,
						parents		: ps,
						children	: d.children || [],
						children_d	: d.children_d || [],
						data		: d.data,
						state		: { },
						li_attr		: { id : false },
						a_attr		: { href : '#' },
						original	: false
					};
				for(i in df) {
					if(df.hasOwnProperty(i)) {
						tmp.state[i] = df[i];
					}
				}
				if(d && d.data && d.data.jstree && d.data.jstree.icon) {
					tmp.icon = d.data.jstree.icon;
				}
				if(tmp.icon === undefined || tmp.icon === null || tmp.icon === "") {
					tmp.icon = true;
				}
				if(d && d.data) {
					tmp.data = d.data;
					if(d.data.jstree) {
						for(i in d.data.jstree) {
							if(d.data.jstree.hasOwnProperty(i)) {
								tmp.state[i] = d.data.jstree[i];
							}
						}
					}
				}
				if(d && typeof d.state === 'object') {
					for (i in d.state) {
						if(d.state.hasOwnProperty(i)) {
							tmp.state[i] = d.state[i];
						}
					}
				}
				if(d && typeof d.li_attr === 'object') {
					for (i in d.li_attr) {
						if(d.li_attr.hasOwnProperty(i)) {
							tmp.li_attr[i] = d.li_attr[i];
						}
					}
				}
				if(!tmp.li_attr.id) {
					tmp.li_attr.id = tid;
				}
				if(d && typeof d.a_attr === 'object') {
					for (i in d.a_attr) {
						if(d.a_attr.hasOwnProperty(i)) {
							tmp.a_attr[i] = d.a_attr[i];
						}
					}
				}
				if(d && d.children && d.children === true) {
					tmp.state.loaded = false;
					tmp.children = [];
					tmp.children_d = [];
				}
				m[tmp.id] = tmp;
				for(i = 0, j = tmp.children.length; i < j; i++) {
					c = this._parse_model_from_flat_json(m[tmp.children[i]], tmp.id, ps);
					e = m[c];
					tmp.children_d.push(c);
					if(e.children_d.length) {
						tmp.children_d = tmp.children_d.concat(e.children_d);
					}
				}
				delete d.data;
				delete d.children;
				m[tmp.id].original = d;
				if(tmp.state.selected) {
					this._data.core.selected.push(tmp.id);
				}
				return tmp.id;
			},
			/**
			 * parses a node from a JSON object and appends it to the in memory tree model. Used internally.
			 * @private
			 * @name _parse_model_from_json(d [, p, ps])
			 * @param  {Object} d the JSON object to parse
			 * @param  {String} p the parent ID
			 * @param  {Array} ps list of all parents
			 * @return {String} the ID of the object added to the model
			 */
			_parse_model_from_json : function (d, p, ps) {
				if(!ps) { ps = []; }
				else { ps = ps.concat(); }
				if(p) { ps.unshift(p); }
				var tid = false, i, j, c, e, m = this._model.data, df = this._model.default_state, tmp;
				do {
					tid = 'j' + this._id + '_' + (++this._cnt);
				} while(m[tid]);

				tmp = {
					id			: false,
					text		: typeof d === 'string' ? d : '',
					icon		: typeof d === 'object' && d.icon !== undefined ? d.icon : true,
					parent		: p,
					parents		: ps,
					children	: [],
					children_d	: [],
					data		: null,
					state		: { },
					li_attr		: { id : false },
					a_attr		: { href : '#' },
					original	: false
				};
				for(i in df) {
					if(df.hasOwnProperty(i)) {
						tmp.state[i] = df[i];
					}
				}
				if(d && d.id) { tmp.id = d.id.toString(); }
				if(d && d.text) { tmp.text = d.text; }
				if(d && d.data && d.data.jstree && d.data.jstree.icon) {
					tmp.icon = d.data.jstree.icon;
				}
				if(tmp.icon === undefined || tmp.icon === null || tmp.icon === "") {
					tmp.icon = true;
				}
				if(d && d.data) {
					tmp.data = d.data;
					if(d.data.jstree) {
						for(i in d.data.jstree) {
							if(d.data.jstree.hasOwnProperty(i)) {
								tmp.state[i] = d.data.jstree[i];
							}
						}
					}
				}
				if(d && typeof d.state === 'object') {
					for (i in d.state) {
						if(d.state.hasOwnProperty(i)) {
							tmp.state[i] = d.state[i];
						}
					}
				}
				if(d && typeof d.li_attr === 'object') {
					for (i in d.li_attr) {
						if(d.li_attr.hasOwnProperty(i)) {
							tmp.li_attr[i] = d.li_attr[i];
						}
					}
				}
				if(tmp.li_attr.id && !tmp.id) {
					tmp.id = tmp.li_attr.id.toString();
				}
				if(!tmp.id) {
					tmp.id = tid;
				}
				if(!tmp.li_attr.id) {
					tmp.li_attr.id = tmp.id;
				}
				if(d && typeof d.a_attr === 'object') {
					for (i in d.a_attr) {
						if(d.a_attr.hasOwnProperty(i)) {
							tmp.a_attr[i] = d.a_attr[i];
						}
					}
				}
				if(d && d.children && d.children.length) {
					for(i = 0, j = d.children.length; i < j; i++) {
						c = this._parse_model_from_json(d.children[i], tmp.id, ps);
						e = m[c];
						tmp.children.push(c);
						if(e.children_d.length) {
							tmp.children_d = tmp.children_d.concat(e.children_d);
						}
					}
					tmp.children_d = tmp.children_d.concat(tmp.children);
				}
				if(d && d.children && d.children === true) {
					tmp.state.loaded = false;
					tmp.children = [];
					tmp.children_d = [];
				}
				delete d.data;
				delete d.children;
				tmp.original = d;
				m[tmp.id] = tmp;
				if(tmp.state.selected) {
					this._data.core.selected.push(tmp.id);
				}
				return tmp.id;
			},
			/**
			 * redraws all nodes that need to be redrawn. Used internally.
			 * @private
			 * @name _redraw()
			 * @trigger redraw.jstree
			 */
			_redraw : function () {
				var nodes = this._model.force_full_redraw ? this._model.data['#'].children.concat([]) : this._model.changed.concat([]),
					f = document.createElement('UL'), tmp, i, j, fe = this._data.core.focused;
				for(i = 0, j = nodes.length; i < j; i++) {
					tmp = this.redraw_node(nodes[i], true, this._model.force_full_redraw);
					if(tmp && this._model.force_full_redraw) {
						f.appendChild(tmp);
					}
				}
				if(this._model.force_full_redraw) {
					f.className = this.get_container_ul()[0].className;
					f.setAttribute('role','group');
					this.element.empty().append(f);
					//this.get_container_ul()[0].appendChild(f);
				}
				if(fe !== null) {
					tmp = this.get_node(fe, true);
					if(tmp && tmp.length && tmp.children('.jstree-anchor')[0] !== document.activeElement) {
						tmp.children('.jstree-anchor').focus();
					}
					else {
						this._data.core.focused = null;
					}
				}
				this._model.force_full_redraw = false;
				this._model.changed = [];
				/**
				 * triggered after nodes are redrawn
				 * @event
				 * @name redraw.jstree
				 * @param {array} nodes the redrawn nodes
				 */
				this.trigger('redraw', { "nodes" : nodes });
			},
			/**
			 * redraws all nodes that need to be redrawn or optionally - the whole tree
			 * @name redraw([full])
			 * @param {Boolean} full if set to `true` all nodes are redrawn.
			 */
			redraw : function (full) {
				if(full) {
					this._model.force_full_redraw = true;
				}
				//if(this._model.redraw_timeout) {
				//	clearTimeout(this._model.redraw_timeout);
				//}
				//this._model.redraw_timeout = setTimeout($.proxy(this._redraw, this),0);
				this._redraw();
			},
			/**
			 * redraws a single node's children. Used internally.
			 * @private
			 * @name draw_children(node)
			 * @param {mixed} node the node whose children will be redrawn
			 */
			draw_children : function (node) {
				var obj = this.get_node(node),
					i = false,
					j = false,
					k = false,
					d = document;
				if(!obj) { return false; }
				if(obj.id === '#') { return this.redraw(true); }
				node = this.get_node(node, true);
				if(!node || !node.length) { return false; } // TODO: quick toggle

				node.children('.jstree-children').remove();
				node = node[0];
				if(obj.children.length && obj.state.loaded) {
					k = d.createElement('UL');
					k.setAttribute('role', 'group');
					k.className = 'jstree-children';
					for(i = 0, j = obj.children.length; i < j; i++) {
						k.appendChild(this.redraw_node(obj.children[i], true, true));
					}
					node.appendChild(k);
				}
			},
			/**
			 * redraws a single node. Used internally.
			 * @private
			 * @name redraw_node(node, deep, is_callback, force_render)
			 * @param {mixed} node the node to redraw
			 * @param {Boolean} deep should child nodes be redrawn too
			 * @param {Boolean} is_callback is this a recursion call
			 * @param {Boolean} force_render should children of closed parents be drawn anyway
			 */
			redraw_node : function (node, deep, is_callback, force_render) {
				var obj = this.get_node(node),
					par = false,
					ind = false,
					old = false,
					i = false,
					j = false,
					k = false,
					c = '',
					d = document,
					m = this._model.data,
					f = false,
					s = false,
					tmp = null,
					t = 0,
					l = 0;
				if(!obj) { return false; }
				if(obj.id === '#') {  return this.redraw(true); }
				deep = deep || obj.children.length === 0;
				node = !document.querySelector ? document.getElementById(obj.id) : this.element[0].querySelector('#' + ("0123456789".indexOf(obj.id[0]) !== -1 ? '\\3' + obj.id[0] + ' ' + obj.id.substr(1).replace($.jstree.idregex,'\\$&') : obj.id.replace($.jstree.idregex,'\\$&')) ); //, this.element);
				if(!node) {
					deep = true;
					//node = d.createElement('LI');
					if(!is_callback) {
						par = obj.parent !== '#' ? $('#' + obj.parent.replace($.jstree.idregex,'\\$&'), this.element)[0] : null;
						if(par !== null && (!par || !m[obj.parent].state.opened)) {
							return false;
						}
						ind = $.inArray(obj.id, par === null ? m['#'].children : m[obj.parent].children);
					}
				}
				else {
					node = $(node);
					if(!is_callback) {
						par = node.parent().parent()[0];
						if(par === this.element[0]) {
							par = null;
						}
						ind = node.index();
					}
					// m[obj.id].data = node.data(); // use only node's data, no need to touch jquery storage
					if(!deep && obj.children.length && !node.children('.jstree-children').length) {
						deep = true;
					}
					if(!deep) {
						old = node.children('.jstree-children')[0];
					}
					f = node.children('.jstree-anchor')[0] === document.activeElement;
					node.remove();
					//node = d.createElement('LI');
					//node = node[0];
				}
				node = _node.cloneNode(true);
				// node is DOM, deep is boolean

				c = 'jstree-node ';
				for(i in obj.li_attr) {
					if(obj.li_attr.hasOwnProperty(i)) {
						if(i === 'id') { continue; }
						if(i !== 'class') {
							node.setAttribute(i, obj.li_attr[i]);
						}
						else {
							c += obj.li_attr[i];
						}
					}
				}
				if(!obj.a_attr.id) {
					obj.a_attr.id = obj.id + '_anchor';
				}
				node.setAttribute('aria-selected', !!obj.state.selected);
				node.setAttribute('aria-level', obj.parents.length);
				node.setAttribute('aria-labelledby', obj.a_attr.id);
				if(obj.state.disabled) {
					node.setAttribute('aria-disabled', true);
				}

				if(obj.state.loaded && !obj.children.length) {
					c += ' jstree-leaf';
				}
				else {
					c += obj.state.opened && obj.state.loaded ? ' jstree-open' : ' jstree-closed';
					node.setAttribute('aria-expanded', (obj.state.opened && obj.state.loaded) );
				}
				if(obj.parent !== null && m[obj.parent].children[m[obj.parent].children.length - 1] === obj.id) {
					c += ' jstree-last';
				}
				node.id = obj.id;
				node.className = c;
				c = ( obj.state.selected ? ' jstree-clicked' : '') + ( obj.state.disabled ? ' jstree-disabled' : '');
				for(j in obj.a_attr) {
					if(obj.a_attr.hasOwnProperty(j)) {
						if(j === 'href' && obj.a_attr[j] === '#') { continue; }
						if(j !== 'class') {
							node.childNodes[1].setAttribute(j, obj.a_attr[j]);
						}
						else {
							c += ' ' + obj.a_attr[j];
						}
					}
				}
				if(c.length) {
					node.childNodes[1].className = 'jstree-anchor ' + c;
				}
				if((obj.icon && obj.icon !== true) || obj.icon === false) {
					if(obj.icon === false) {
						node.childNodes[1].childNodes[0].className += ' jstree-themeicon-hidden';
					}
					else if(obj.icon.indexOf('/') === -1 && obj.icon.indexOf('.') === -1) {
						node.childNodes[1].childNodes[0].className += ' ' + obj.icon + ' jstree-themeicon-custom';
					}
					else {
						node.childNodes[1].childNodes[0].style.backgroundImage = 'url('+obj.icon+')';
						node.childNodes[1].childNodes[0].style.backgroundPosition = 'center center';
						node.childNodes[1].childNodes[0].style.backgroundSize = 'auto';
						node.childNodes[1].childNodes[0].className += ' jstree-themeicon-custom';
					}
				}

				if(this.settings.core.force_text) {
					node.childNodes[1].appendChild(d.createTextNode(obj.text));
				}
				else {
					node.childNodes[1].innerHTML += obj.text;
				}


				if(deep && obj.children.length && (obj.state.opened || force_render) && obj.state.loaded) {
					k = d.createElement('UL');
					k.setAttribute('role', 'group');
					k.className = 'jstree-children';
					for(i = 0, j = obj.children.length; i < j; i++) {
						k.appendChild(this.redraw_node(obj.children[i], deep, true));
					}
					node.appendChild(k);
				}
				if(old) {
					node.appendChild(old);
				}
				if(!is_callback) {
					// append back using par / ind
					if(!par) {
						par = this.element[0];
					}
					for(i = 0, j = par.childNodes.length; i < j; i++) {
						if(par.childNodes[i] && par.childNodes[i].className && par.childNodes[i].className.indexOf('jstree-children') !== -1) {
							tmp = par.childNodes[i];
							break;
						}
					}
					if(!tmp) {
						tmp = d.createElement('UL');
						tmp.setAttribute('role', 'group');
						tmp.className = 'jstree-children';
						par.appendChild(tmp);
					}
					par = tmp;

					if(ind < par.childNodes.length) {
						par.insertBefore(node, par.childNodes[ind]);
					}
					else {
						par.appendChild(node);
					}
					if(f) {
						t = this.element[0].scrollTop;
						l = this.element[0].scrollLeft;
						node.childNodes[1].focus();
						this.element[0].scrollTop = t;
						this.element[0].scrollLeft = l;
					}
				}
				if(obj.state.opened && !obj.state.loaded) {
					obj.state.opened = false;
					setTimeout($.proxy(function () {
						this.open_node(obj.id, false, 0);
					}, this), 0);
				}
				return node;
			},
			/**
			 * opens a node, revaling its children. If the node is not loaded it will be loaded and opened once ready.
			 * @name open_node(obj [, callback, animation])
			 * @param {mixed} obj the node to open
			 * @param {Function} callback a function to execute once the node is opened
			 * @param {Number} animation the animation duration in milliseconds when opening the node (overrides the `core.animation` setting). Use `false` for no animation.
			 * @trigger open_node.jstree, after_open.jstree, before_open.jstree
			 */
			open_node : function (obj, callback, animation) {
				var t1, t2, d, t;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.open_node(obj[t1], callback, animation);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				animation = animation === undefined ? this.settings.core.animation : animation;
				if(!this.is_closed(obj)) {
					if(callback) {
						callback.call(this, obj, false);
					}
					return false;
				}
				if(!this.is_loaded(obj)) {
					if(this.is_loading(obj)) {
						return setTimeout($.proxy(function () {
							this.open_node(obj, callback, animation);
						}, this), 500);
					}
					this.load_node(obj, function (o, ok) {
						return ok ? this.open_node(o, callback, animation) : (callback ? callback.call(this, o, false) : false);
					});
				}
				else {
					d = this.get_node(obj, true);
					t = this;
					if(d.length) {
						if(animation && d.children(".jstree-children").length) {
							d.children(".jstree-children").stop(true, true);
						}
						if(obj.children.length && !this._firstChild(d.children('.jstree-children')[0])) {
							this.draw_children(obj);
							//d = this.get_node(obj, true);
						}
						if(!animation) {
							this.trigger('before_open', { "node" : obj });
							d[0].className = d[0].className.replace('jstree-closed', 'jstree-open');
							d[0].setAttribute("aria-expanded", true);
						}
						else {
							this.trigger('before_open', { "node" : obj });
							d
								.children(".jstree-children").css("display","none").end()
								.removeClass("jstree-closed").addClass("jstree-open").attr("aria-expanded", true)
								.children(".jstree-children").stop(true, true)
									.slideDown(animation, function () {
										this.style.display = "";
										t.trigger("after_open", { "node" : obj });
									});
						}
					}
					obj.state.opened = true;
					if(callback) {
						callback.call(this, obj, true);
					}
					if(!d.length) {
						/**
						 * triggered when a node is about to be opened (if the node is supposed to be in the DOM, it will be, but it won't be visible yet)
						 * @event
						 * @name before_open.jstree
						 * @param {Object} node the opened node
						 */
						this.trigger('before_open', { "node" : obj });
					}
					/**
					 * triggered when a node is opened (if there is an animation it will not be completed yet)
					 * @event
					 * @name open_node.jstree
					 * @param {Object} node the opened node
					 */
					this.trigger('open_node', { "node" : obj });
					if(!animation || !d.length) {
						/**
						 * triggered when a node is opened and the animation is complete
						 * @event
						 * @name after_open.jstree
						 * @param {Object} node the opened node
						 */
						this.trigger("after_open", { "node" : obj });
					}
				}
			},
			/**
			 * opens every parent of a node (node should be loaded)
			 * @name _open_to(obj)
			 * @param {mixed} obj the node to reveal
			 * @private
			 */
			_open_to : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				var i, j, p = obj.parents;
				for(i = 0, j = p.length; i < j; i+=1) {
					if(i !== '#') {
						this.open_node(p[i], false, 0);
					}
				}
				return $('#' + obj.id.replace($.jstree.idregex,'\\$&'), this.element);
			},
			/**
			 * closes a node, hiding its children
			 * @name close_node(obj [, animation])
			 * @param {mixed} obj the node to close
			 * @param {Number} animation the animation duration in milliseconds when closing the node (overrides the `core.animation` setting). Use `false` for no animation.
			 * @trigger close_node.jstree, after_close.jstree
			 */
			close_node : function (obj, animation) {
				var t1, t2, t, d;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.close_node(obj[t1], animation);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				if(this.is_closed(obj)) {
					return false;
				}
				animation = animation === undefined ? this.settings.core.animation : animation;
				t = this;
				d = this.get_node(obj, true);
				if(d.length) {
					if(!animation) {
						d[0].className = d[0].className.replace('jstree-open', 'jstree-closed');
						d.attr("aria-expanded", false).children('.jstree-children').remove();
					}
					else {
						d
							.children(".jstree-children").attr("style","display:block !important").end()
							.removeClass("jstree-open").addClass("jstree-closed").attr("aria-expanded", false)
							.children(".jstree-children").stop(true, true).slideUp(animation, function () {
								this.style.display = "";
								d.children('.jstree-children').remove();
								t.trigger("after_close", { "node" : obj });
							});
					}
				}
				obj.state.opened = false;
				/**
				 * triggered when a node is closed (if there is an animation it will not be complete yet)
				 * @event
				 * @name close_node.jstree
				 * @param {Object} node the closed node
				 */
				this.trigger('close_node',{ "node" : obj });
				if(!animation || !d.length) {
					/**
					 * triggered when a node is closed and the animation is complete
					 * @event
					 * @name after_close.jstree
					 * @param {Object} node the closed node
					 */
					this.trigger("after_close", { "node" : obj });
				}
			},
			/**
			 * toggles a node - closing it if it is open, opening it if it is closed
			 * @name toggle_node(obj)
			 * @param {mixed} obj the node to toggle
			 */
			toggle_node : function (obj) {
				var t1, t2;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.toggle_node(obj[t1]);
					}
					return true;
				}
				if(this.is_closed(obj)) {
					return this.open_node(obj);
				}
				if(this.is_open(obj)) {
					return this.close_node(obj);
				}
			},
			/**
			 * opens all nodes within a node (or the tree), revaling their children. If the node is not loaded it will be loaded and opened once ready.
			 * @name open_all([obj, animation, original_obj])
			 * @param {mixed} obj the node to open recursively, omit to open all nodes in the tree
			 * @param {Number} animation the animation duration in milliseconds when opening the nodes, the default is no animation
			 * @param {jQuery} reference to the node that started the process (internal use)
			 * @trigger open_all.jstree
			 */
			open_all : function (obj, animation, original_obj) {
				if(!obj) { obj = '#'; }
				obj = this.get_node(obj);
				if(!obj) { return false; }
				var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true), i, j, _this;
				if(!dom.length) {
					for(i = 0, j = obj.children_d.length; i < j; i++) {
						if(this.is_closed(this._model.data[obj.children_d[i]])) {
							this._model.data[obj.children_d[i]].state.opened = true;
						}
					}
					return this.trigger('open_all', { "node" : obj });
				}
				original_obj = original_obj || dom;
				_this = this;
				dom = this.is_closed(obj) ? dom.find('.jstree-closed').addBack() : dom.find('.jstree-closed');
				dom.each(function () {
					_this.open_node(
						this,
						function(node, status) { if(status && this.is_parent(node)) { this.open_all(node, animation, original_obj); } },
						animation || 0
					);
				});
				if(original_obj.find('.jstree-closed').length === 0) {
					/**
					 * triggered when an `open_all` call completes
					 * @event
					 * @name open_all.jstree
					 * @param {Object} node the opened node
					 */
					this.trigger('open_all', { "node" : this.get_node(original_obj) });
				}
			},
			/**
			 * closes all nodes within a node (or the tree), revaling their children
			 * @name close_all([obj, animation])
			 * @param {mixed} obj the node to close recursively, omit to close all nodes in the tree
			 * @param {Number} animation the animation duration in milliseconds when closing the nodes, the default is no animation
			 * @trigger close_all.jstree
			 */
			close_all : function (obj, animation) {
				if(!obj) { obj = '#'; }
				obj = this.get_node(obj);
				if(!obj) { return false; }
				var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true),
					_this = this, i, j;
				if(!dom.length) {
					for(i = 0, j = obj.children_d.length; i < j; i++) {
						this._model.data[obj.children_d[i]].state.opened = false;
					}
					return this.trigger('close_all', { "node" : obj });
				}
				dom = this.is_open(obj) ? dom.find('.jstree-open').addBack() : dom.find('.jstree-open');
				$(dom.get().reverse()).each(function () { _this.close_node(this, animation || 0); });
				/**
				 * triggered when an `close_all` call completes
				 * @event
				 * @name close_all.jstree
				 * @param {Object} node the closed node
				 */
				this.trigger('close_all', { "node" : obj });
			},
			/**
			 * checks if a node is disabled (not selectable)
			 * @name is_disabled(obj)
			 * @param  {mixed} obj
			 * @return {Boolean}
			 */
			is_disabled : function (obj) {
				obj = this.get_node(obj);
				return obj && obj.state && obj.state.disabled;
			},
			/**
			 * enables a node - so that it can be selected
			 * @name enable_node(obj)
			 * @param {mixed} obj the node to enable
			 * @trigger enable_node.jstree
			 */
			enable_node : function (obj) {
				var t1, t2;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.enable_node(obj[t1]);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				obj.state.disabled = false;
				this.get_node(obj,true).children('.jstree-anchor').removeClass('jstree-disabled').attr('aria-disabled', false);
				/**
				 * triggered when an node is enabled
				 * @event
				 * @name enable_node.jstree
				 * @param {Object} node the enabled node
				 */
				this.trigger('enable_node', { 'node' : obj });
			},
			/**
			 * disables a node - so that it can not be selected
			 * @name disable_node(obj)
			 * @param {mixed} obj the node to disable
			 * @trigger disable_node.jstree
			 */
			disable_node : function (obj) {
				var t1, t2;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.disable_node(obj[t1]);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				obj.state.disabled = true;
				this.get_node(obj,true).children('.jstree-anchor').addClass('jstree-disabled').attr('aria-disabled', true);
				/**
				 * triggered when an node is disabled
				 * @event
				 * @name disable_node.jstree
				 * @param {Object} node the disabled node
				 */
				this.trigger('disable_node', { 'node' : obj });
			},
			/**
			 * called when a node is selected by the user. Used internally.
			 * @private
			 * @name activate_node(obj, e)
			 * @param {mixed} obj the node
			 * @param {Object} e the related event
			 * @trigger activate_node.jstree, changed.jstree
			 */
			activate_node : function (obj, e) {
				if(this.is_disabled(obj)) {
					return false;
				}

				// ensure last_clicked is still in the DOM, make it fresh (maybe it was moved?) and make sure it is still selected, if not - make last_clicked the last selected node
				this._data.core.last_clicked = this._data.core.last_clicked && this._data.core.last_clicked.id !== undefined ? this.get_node(this._data.core.last_clicked.id) : null;
				if(this._data.core.last_clicked && !this._data.core.last_clicked.state.selected) { this._data.core.last_clicked = null; }
				if(!this._data.core.last_clicked && this._data.core.selected.length) { this._data.core.last_clicked = this.get_node(this._data.core.selected[this._data.core.selected.length - 1]); }

				if(!this.settings.core.multiple || (!e.metaKey && !e.ctrlKey && !e.shiftKey) || (e.shiftKey && (!this._data.core.last_clicked || !this.get_parent(obj) || this.get_parent(obj) !== this._data.core.last_clicked.parent ) )) {
					if(!this.settings.core.multiple && (e.metaKey || e.ctrlKey || e.shiftKey) && this.is_selected(obj)) {
						this.deselect_node(obj, false, e);
					}
					else {
						this.deselect_all(true);
						this.select_node(obj, false, false, e);
						this._data.core.last_clicked = this.get_node(obj);
					}
				}
				else {
					if(e.shiftKey) {
						var o = this.get_node(obj).id,
							l = this._data.core.last_clicked.id,
							p = this.get_node(this._data.core.last_clicked.parent).children,
							c = false,
							i, j;
						for(i = 0, j = p.length; i < j; i += 1) {
							// separate IFs work whem o and l are the same
							if(p[i] === o) {
								c = !c;
							}
							if(p[i] === l) {
								c = !c;
							}
							if(!this.is_disabled(p[i]) && (c || p[i] === o || p[i] === l)) {
								this.select_node(p[i], true, false, e);
							}
							else {
								this.deselect_node(p[i], true, e);
							}
						}
						this.trigger('changed', { 'action' : 'select_node', 'node' : this.get_node(obj), 'selected' : this._data.core.selected, 'event' : e });
					}
					else {
						if(!this.is_selected(obj)) {
							this.select_node(obj, false, false, e);
						}
						else {
							this.deselect_node(obj, false, e);
						}
					}
				}
				/**
				 * triggered when an node is clicked or intercated with by the user
				 * @event
				 * @name activate_node.jstree
				 * @param {Object} node
				 */
				this.trigger('activate_node', { 'node' : this.get_node(obj) });
			},
			/**
			 * applies the hover state on a node, called when a node is hovered by the user. Used internally.
			 * @private
			 * @name hover_node(obj)
			 * @param {mixed} obj
			 * @trigger hover_node.jstree
			 */
			hover_node : function (obj) {
				obj = this.get_node(obj, true);
				if(!obj || !obj.length || obj.children('.jstree-hovered').length) {
					return false;
				}
				var o = this.element.find('.jstree-hovered'), t = this.element;
				if(o && o.length) { this.dehover_node(o); }

				obj.children('.jstree-anchor').addClass('jstree-hovered');
				/**
				 * triggered when an node is hovered
				 * @event
				 * @name hover_node.jstree
				 * @param {Object} node
				 */
				this.trigger('hover_node', { 'node' : this.get_node(obj) });
				setTimeout(function () { t.attr('aria-activedescendant', obj[0].id); }, 0);
			},
			/**
			 * removes the hover state from a nodecalled when a node is no longer hovered by the user. Used internally.
			 * @private
			 * @name dehover_node(obj)
			 * @param {mixed} obj
			 * @trigger dehover_node.jstree
			 */
			dehover_node : function (obj) {
				obj = this.get_node(obj, true);
				if(!obj || !obj.length || !obj.children('.jstree-hovered').length) {
					return false;
				}
				obj.children('.jstree-anchor').removeClass('jstree-hovered');
				/**
				 * triggered when an node is no longer hovered
				 * @event
				 * @name dehover_node.jstree
				 * @param {Object} node
				 */
				this.trigger('dehover_node', { 'node' : this.get_node(obj) });
			},
			/**
			 * select a node
			 * @name select_node(obj [, supress_event, prevent_open])
			 * @param {mixed} obj an array can be used to select multiple nodes
			 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
			 * @param {Boolean} prevent_open if set to `true` parents of the selected node won't be opened
			 * @trigger select_node.jstree, changed.jstree
			 */
			select_node : function (obj, supress_event, prevent_open, e) {
				var dom, t1, t2, th;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.select_node(obj[t1], supress_event, prevent_open, e);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				dom = this.get_node(obj, true);
				if(!obj.state.selected) {
					obj.state.selected = true;
					this._data.core.selected.push(obj.id);
					if(!prevent_open) {
						dom = this._open_to(obj);
					}
					if(dom && dom.length) {
						dom.attr('aria-selected', true).children('.jstree-anchor').addClass('jstree-clicked');
					}
					/**
					 * triggered when an node is selected
					 * @event
					 * @name select_node.jstree
					 * @param {Object} node
					 * @param {Array} selected the current selection
					 * @param {Object} event the event (if any) that triggered this select_node
					 */
					this.trigger('select_node', { 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
					if(!supress_event) {
						/**
						 * triggered when selection changes
						 * @event
						 * @name changed.jstree
						 * @param {Object} node
						 * @param {Object} action the action that caused the selection to change
						 * @param {Array} selected the current selection
						 * @param {Object} event the event (if any) that triggered this changed event
						 */
						this.trigger('changed', { 'action' : 'select_node', 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
					}
				}
			},
			/**
			 * deselect a node
			 * @name deselect_node(obj [, supress_event])
			 * @param {mixed} obj an array can be used to deselect multiple nodes
			 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
			 * @trigger deselect_node.jstree, changed.jstree
			 */
			deselect_node : function (obj, supress_event, e) {
				var t1, t2, dom;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.deselect_node(obj[t1], supress_event, e);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				dom = this.get_node(obj, true);
				if(obj.state.selected) {
					obj.state.selected = false;
					this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, obj.id);
					if(dom.length) {
						dom.attr('aria-selected', false).children('.jstree-anchor').removeClass('jstree-clicked');
					}
					/**
					 * triggered when an node is deselected
					 * @event
					 * @name deselect_node.jstree
					 * @param {Object} node
					 * @param {Array} selected the current selection
					 * @param {Object} event the event (if any) that triggered this deselect_node
					 */
					this.trigger('deselect_node', { 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
					if(!supress_event) {
						this.trigger('changed', { 'action' : 'deselect_node', 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
					}
				}
			},
			/**
			 * select all nodes in the tree
			 * @name select_all([supress_event])
			 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
			 * @trigger select_all.jstree, changed.jstree
			 */
			select_all : function (supress_event) {
				var tmp = this._data.core.selected.concat([]), i, j;
				this._data.core.selected = this._model.data['#'].children_d.concat();
				for(i = 0, j = this._data.core.selected.length; i < j; i++) {
					if(this._model.data[this._data.core.selected[i]]) {
						this._model.data[this._data.core.selected[i]].state.selected = true;
					}
				}
				this.redraw(true);
				/**
				 * triggered when all nodes are selected
				 * @event
				 * @name select_all.jstree
				 * @param {Array} selected the current selection
				 */
				this.trigger('select_all', { 'selected' : this._data.core.selected });
				if(!supress_event) {
					this.trigger('changed', { 'action' : 'select_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
				}
			},
			/**
			 * deselect all selected nodes
			 * @name deselect_all([supress_event])
			 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
			 * @trigger deselect_all.jstree, changed.jstree
			 */
			deselect_all : function (supress_event) {
				var tmp = this._data.core.selected.concat([]), i, j;
				for(i = 0, j = this._data.core.selected.length; i < j; i++) {
					if(this._model.data[this._data.core.selected[i]]) {
						this._model.data[this._data.core.selected[i]].state.selected = false;
					}
				}
				this._data.core.selected = [];
				this.element.find('.jstree-clicked').removeClass('jstree-clicked').parent().attr('aria-selected', false);
				/**
				 * triggered when all nodes are deselected
				 * @event
				 * @name deselect_all.jstree
				 * @param {Object} node the previous selection
				 * @param {Array} selected the current selection
				 */
				this.trigger('deselect_all', { 'selected' : this._data.core.selected, 'node' : tmp });
				if(!supress_event) {
					this.trigger('changed', { 'action' : 'deselect_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
				}
			},
			/**
			 * checks if a node is selected
			 * @name is_selected(obj)
			 * @param  {mixed}  obj
			 * @return {Boolean}
			 */
			is_selected : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				return obj.state.selected;
			},
			/**
			 * get an array of all selected nodes
			 * @name get_selected([full])
			 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
			 * @return {Array}
			 */
			get_selected : function (full) {
				return full ? $.map(this._data.core.selected, $.proxy(function (i) { return this.get_node(i); }, this)) : this._data.core.selected.slice();
			},
			/**
			 * get an array of all top level selected nodes (ignoring children of selected nodes)
			 * @name get_top_selected([full])
			 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
			 * @return {Array}
			 */
			get_top_selected : function (full) {
				var tmp = this.get_selected(true),
					obj = {}, i, j, k, l;
				for(i = 0, j = tmp.length; i < j; i++) {
					obj[tmp[i].id] = tmp[i];
				}
				for(i = 0, j = tmp.length; i < j; i++) {
					for(k = 0, l = tmp[i].children_d.length; k < l; k++) {
						if(obj[tmp[i].children_d[k]]) {
							delete obj[tmp[i].children_d[k]];
						}
					}
				}
				tmp = [];
				for(i in obj) {
					if(obj.hasOwnProperty(i)) {
						tmp.push(i);
					}
				}
				return full ? $.map(tmp, $.proxy(function (i) { return this.get_node(i); }, this)) : tmp;
			},
			/**
			 * get an array of all bottom level selected nodes (ignoring selected parents)
			 * @name get_bottom_selected([full])
			 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
			 * @return {Array}
			 */
			get_bottom_selected : function (full) {
				var tmp = this.get_selected(true),
					obj = [], i, j;
				for(i = 0, j = tmp.length; i < j; i++) {
					if(!tmp[i].children.length) {
						obj.push(tmp[i].id);
					}
				}
				return full ? $.map(obj, $.proxy(function (i) { return this.get_node(i); }, this)) : obj;
			},
			/**
			 * gets the current state of the tree so that it can be restored later with `set_state(state)`. Used internally.
			 * @name get_state()
			 * @private
			 * @return {Object}
			 */
			get_state : function () {
				var state	= {
					'core' : {
						'open' : [],
						'scroll' : {
							'left' : this.element.scrollLeft(),
							'top' : this.element.scrollTop()
						},
						/*!
						'themes' : {
							'name' : this.get_theme(),
							'icons' : this._data.core.themes.icons,
							'dots' : this._data.core.themes.dots
						},
						*/
						'selected' : []
					}
				}, i;
				for(i in this._model.data) {
					if(this._model.data.hasOwnProperty(i)) {
						if(i !== '#') {
							if(this._model.data[i].state.opened) {
								state.core.open.push(i);
							}
							if(this._model.data[i].state.selected) {
								state.core.selected.push(i);
							}
						}
					}
				}
				return state;
			},
			/**
			 * sets the state of the tree. Used internally.
			 * @name set_state(state [, callback])
			 * @private
			 * @param {Object} state the state to restore
			 * @param {Function} callback an optional function to execute once the state is restored.
			 * @trigger set_state.jstree
			 */
			set_state : function (state, callback) {
				if(state) {
					if(state.core) {
						var res, n, t, _this, i;
						if(state.core.open) {
							if(!$.isArray(state.core.open) || !state.core.open.length) {
								delete state.core.open;
								this.set_state(state, callback);
							}
							else {
								this._load_nodes(state.core.open, function (nodes) {
									this.open_node(nodes, false, 0);
									delete state.core.open;
									this.set_state(state, callback);
								}, true);
							}
							return false;
						}
						if(state.core.scroll) {
							if(state.core.scroll && state.core.scroll.left !== undefined) {
								this.element.scrollLeft(state.core.scroll.left);
							}
							if(state.core.scroll && state.core.scroll.top !== undefined) {
								this.element.scrollTop(state.core.scroll.top);
							}
							delete state.core.scroll;
							this.set_state(state, callback);
							return false;
						}
						if(state.core.selected) {
							_this = this;
							this.deselect_all();
							$.each(state.core.selected, function (i, v) {
								_this.select_node(v, false, true);
							});
							delete state.core.selected;
							this.set_state(state, callback);
							return false;
						}
						for(i in state) {
							if(state.hasOwnProperty(i) && i !== "core" && $.inArray(i, this.settings.plugins) === -1) {
								delete state[i];
							}
						}
						if($.isEmptyObject(state.core)) {
							delete state.core;
							this.set_state(state, callback);
							return false;
						}
					}
					if($.isEmptyObject(state)) {
						state = null;
						if(callback) { callback.call(this); }
						/**
						 * triggered when a `set_state` call completes
						 * @event
						 * @name set_state.jstree
						 */
						this.trigger('set_state');
						return false;
					}
					return true;
				}
				return false;
			},
			/**
			 * refreshes the tree - all nodes are reloaded with calls to `load_node`.
			 * @name refresh()
			 * @param {Boolean} skip_loading an option to skip showing the loading indicator
			 * @param {Mixed} forget_state if set to `true` state will not be reapplied, if set to a function (receiving the current state as argument) the result of that function will be used as state
			 * @trigger refresh.jstree
			 */
			refresh : function (skip_loading, forget_state) {
				this._data.core.state = forget_state === true ? {} : this.get_state();
				if(forget_state && $.isFunction(forget_state)) { this._data.core.state = forget_state.call(this, this._data.core.state); }
				this._cnt = 0;
				this._model.data = {
					'#' : {
						id : '#',
						parent : null,
						parents : [],
						children : [],
						children_d : [],
						state : { loaded : false }
					}
				};
				var c = this.get_container_ul()[0].className;
				if(!skip_loading) {
					this.element.html("<"+"ul class='"+c+"' role='group'><"+"li class='jstree-initial-node jstree-loading jstree-leaf jstree-last' role='treeitem' id='j"+this._id+"_loading'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
					this.element.attr('aria-activedescendant','j'+this._id+'_loading');
				}
				this.load_node('#', function (o, s) {
					if(s) {
						this.get_container_ul()[0].className = c;
						if(this._firstChild(this.get_container_ul()[0])) {
							this.element.attr('aria-activedescendant',this._firstChild(this.get_container_ul()[0]).id);
						}
						this.set_state($.extend(true, {}, this._data.core.state), function () {
							/**
							 * triggered when a `refresh` call completes
							 * @event
							 * @name refresh.jstree
							 */
							this.trigger('refresh');
						});
					}
					this._data.core.state = null;
				});
			},
			/**
			 * refreshes a node in the tree (reload its children) all opened nodes inside that node are reloaded with calls to `load_node`.
			 * @name refresh_node(obj)
			 * @param  {mixed} obj the node
			 * @trigger refresh_node.jstree
			 */
			refresh_node : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }
				var opened = [], to_load = [], s = this._data.core.selected.concat([]);
				to_load.push(obj.id);
				if(obj.state.opened === true) { opened.push(obj.id); }
				this.get_node(obj, true).find('.jstree-open').each(function() { opened.push(this.id); });
				this._load_nodes(to_load, $.proxy(function (nodes) {
					this.open_node(opened, false, 0);
					this.select_node(this._data.core.selected);
					/**
					 * triggered when a node is refreshed
					 * @event
					 * @name refresh_node.jstree
					 * @param {Object} node - the refreshed node
					 * @param {Array} nodes - an array of the IDs of the nodes that were reloaded
					 */
					this.trigger('refresh_node', { 'node' : obj, 'nodes' : nodes });
				}, this));
			},
			/**
			 * set (change) the ID of a node
			 * @name set_id(obj, id)
			 * @param  {mixed} obj the node
			 * @param  {String} id the new ID
			 * @return {Boolean}
			 */
			set_id : function (obj, id) {
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }
				var i, j, m = this._model.data;
				id = id.toString();
				// update parents (replace current ID with new one in children and children_d)
				m[obj.parent].children[$.inArray(obj.id, m[obj.parent].children)] = id;
				for(i = 0, j = obj.parents.length; i < j; i++) {
					m[obj.parents[i]].children_d[$.inArray(obj.id, m[obj.parents[i]].children_d)] = id;
				}
				// update children (replace current ID with new one in parent and parents)
				for(i = 0, j = obj.children.length; i < j; i++) {
					m[obj.children[i]].parent = id;
				}
				for(i = 0, j = obj.children_d.length; i < j; i++) {
					m[obj.children_d[i]].parents[$.inArray(obj.id, m[obj.children_d[i]].parents)] = id;
				}
				i = $.inArray(obj.id, this._data.core.selected);
				if(i !== -1) { this._data.core.selected[i] = id; }
				// update model and obj itself (obj.id, this._model.data[KEY])
				i = this.get_node(obj.id, true);
				if(i) {
					i.attr('id', id).children('.jstree-anchor').attr('id', id + '_anchor').end().attr('aria-labelledby', id + '_anchor');
					if(this.element.attr('aria-activedescendant') === obj.id) {
						this.element.attr('aria-activedescendant', id);
					}
				}
				delete m[obj.id];
				obj.id = id;
				obj.li_attr.id = id;
				m[id] = obj;
				return true;
			},
			/**
			 * get the text value of a node
			 * @name get_text(obj)
			 * @param  {mixed} obj the node
			 * @return {String}
			 */
			get_text : function (obj) {
				obj = this.get_node(obj);
				return (!obj || obj.id === '#') ? false : obj.text;
			},
			/**
			 * set the text value of a node. Used internally, please use `rename_node(obj, val)`.
			 * @private
			 * @name set_text(obj, val)
			 * @param  {mixed} obj the node, you can pass an array to set the text on multiple nodes
			 * @param  {String} val the new text value
			 * @return {Boolean}
			 * @trigger set_text.jstree
			 */
			set_text : function (obj, val) {
				var t1, t2;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.set_text(obj[t1], val);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }
				obj.text = val;
				if(this.get_node(obj, true).length) {
					this.redraw_node(obj.id);
				}
				/**
				 * triggered when a node text value is changed
				 * @event
				 * @name set_text.jstree
				 * @param {Object} obj
				 * @param {String} text the new value
				 */
				this.trigger('set_text',{ "obj" : obj, "text" : val });
				return true;
			},
			/**
			 * gets a JSON representation of a node (or the whole tree)
			 * @name get_json([obj, options])
			 * @param  {mixed} obj
			 * @param  {Object} options
			 * @param  {Boolean} options.no_state do not return state information
			 * @param  {Boolean} options.no_id do not return ID
			 * @param  {Boolean} options.no_children do not include children
			 * @param  {Boolean} options.no_data do not include node data
			 * @param  {Boolean} options.flat return flat JSON instead of nested
			 * @return {Object}
			 */
			get_json : function (obj, options, flat) {
				obj = this.get_node(obj || '#');
				if(!obj) { return false; }
				if(options && options.flat && !flat) { flat = []; }
				var tmp = {
					'id' : obj.id,
					'text' : obj.text,
					'icon' : this.get_icon(obj),
					'li_attr' : $.extend(true, {}, obj.li_attr),
					'a_attr' : $.extend(true, {}, obj.a_attr),
					'state' : {},
					'data' : options && options.no_data ? false : $.extend(true, {}, obj.data)
					//( this.get_node(obj, true).length ? this.get_node(obj, true).data() : obj.data ),
				}, i, j;
				if(options && options.flat) {
					tmp.parent = obj.parent;
				}
				else {
					tmp.children = [];
				}
				if(!options || !options.no_state) {
					for(i in obj.state) {
						if(obj.state.hasOwnProperty(i)) {
							tmp.state[i] = obj.state[i];
						}
					}
				}
				if(options && options.no_id) {
					delete tmp.id;
					if(tmp.li_attr && tmp.li_attr.id) {
						delete tmp.li_attr.id;
					}
					if(tmp.a_attr && tmp.a_attr.id) {
						delete tmp.a_attr.id;
					}
				}
				if(options && options.flat && obj.id !== '#') {
					flat.push(tmp);
				}
				if(!options || !options.no_children) {
					for(i = 0, j = obj.children.length; i < j; i++) {
						if(options && options.flat) {
							this.get_json(obj.children[i], options, flat);
						}
						else {
							tmp.children.push(this.get_json(obj.children[i], options));
						}
					}
				}
				return options && options.flat ? flat : (obj.id === '#' ? tmp.children : tmp);
			},
			/**
			 * create a new node (do not confuse with load_node)
			 * @name create_node([obj, node, pos, callback, is_loaded])
			 * @param  {mixed}   par       the parent node (to create a root node use either "#" (string) or `null`)
			 * @param  {mixed}   node      the data for the new node (a valid JSON object, or a simple string with the name)
			 * @param  {mixed}   pos       the index at which to insert the node, "first" and "last" are also supported, default is "last"
			 * @param  {Function} callback a function to be called once the node is created
			 * @param  {Boolean} is_loaded internal argument indicating if the parent node was succesfully loaded
			 * @return {String}            the ID of the newly create node
			 * @trigger model.jstree, create_node.jstree
			 */
			create_node : function (par, node, pos, callback, is_loaded) {
				if(par === null) { par = "#"; }
				par = this.get_node(par);
				if(!par) { return false; }
				pos = pos === undefined ? "last" : pos;
				if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
					return this.load_node(par, function () { this.create_node(par, node, pos, callback, true); });
				}
				if(!node) { node = { "text" : this.get_string('New node') }; }
				if(typeof node === "string") { node = { "text" : node }; }
				if(node.text === undefined) { node.text = this.get_string('New node'); }
				var tmp, dpc, i, j;

				if(par.id === '#') {
					if(pos === "before") { pos = "first"; }
					if(pos === "after") { pos = "last"; }
				}
				switch(pos) {
					case "before":
						tmp = this.get_node(par.parent);
						pos = $.inArray(par.id, tmp.children);
						par = tmp;
						break;
					case "after" :
						tmp = this.get_node(par.parent);
						pos = $.inArray(par.id, tmp.children) + 1;
						par = tmp;
						break;
					case "inside":
					case "first":
						pos = 0;
						break;
					case "last":
						pos = par.children.length;
						break;
					default:
						if(!pos) { pos = 0; }
						break;
				}
				if(pos > par.children.length) { pos = par.children.length; }
				if(!node.id) { node.id = true; }
				if(!this.check("create_node", node, par, pos)) {
					this.settings.core.error.call(this, this._data.core.last_error);
					return false;
				}
				if(node.id === true) { delete node.id; }
				node = this._parse_model_from_json(node, par.id, par.parents.concat());
				if(!node) { return false; }
				tmp = this.get_node(node);
				dpc = [];
				dpc.push(node);
				dpc = dpc.concat(tmp.children_d);
				this.trigger('model', { "nodes" : dpc, "parent" : par.id });

				par.children_d = par.children_d.concat(dpc);
				for(i = 0, j = par.parents.length; i < j; i++) {
					this._model.data[par.parents[i]].children_d = this._model.data[par.parents[i]].children_d.concat(dpc);
				}
				node = tmp;
				tmp = [];
				for(i = 0, j = par.children.length; i < j; i++) {
					tmp[i >= pos ? i+1 : i] = par.children[i];
				}
				tmp[pos] = node.id;
				par.children = tmp;

				this.redraw_node(par, true);
				if(callback) { callback.call(this, this.get_node(node)); }
				/**
				 * triggered when a node is created
				 * @event
				 * @name create_node.jstree
				 * @param {Object} node
				 * @param {String} parent the parent's ID
				 * @param {Number} position the position of the new node among the parent's children
				 */
				this.trigger('create_node', { "node" : this.get_node(node), "parent" : par.id, "position" : pos });
				return node.id;
			},
			/**
			 * set the text value of a node
			 * @name rename_node(obj, val)
			 * @param  {mixed} obj the node, you can pass an array to rename multiple nodes to the same name
			 * @param  {String} val the new text value
			 * @return {Boolean}
			 * @trigger rename_node.jstree
			 */
			rename_node : function (obj, val) {
				var t1, t2, old;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.rename_node(obj[t1], val);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }
				old = obj.text;
				if(!this.check("rename_node", obj, this.get_parent(obj), val)) {
					this.settings.core.error.call(this, this._data.core.last_error);
					return false;
				}
				this.set_text(obj, val); // .apply(this, Array.prototype.slice.call(arguments))
				/**
				 * triggered when a node is renamed
				 * @event
				 * @name rename_node.jstree
				 * @param {Object} node
				 * @param {String} text the new value
				 * @param {String} old the old value
				 */
				this.trigger('rename_node', { "node" : obj, "text" : val, "old" : old });
				return true;
			},
			/**
			 * remove a node
			 * @name delete_node(obj)
			 * @param  {mixed} obj the node, you can pass an array to delete multiple nodes
			 * @return {Boolean}
			 * @trigger delete_node.jstree, changed.jstree
			 */
			delete_node : function (obj) {
				var t1, t2, par, pos, tmp, i, j, k, l, c;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.delete_node(obj[t1]);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }
				par = this.get_node(obj.parent);
				pos = $.inArray(obj.id, par.children);
				c = false;
				if(!this.check("delete_node", obj, par, pos)) {
					this.settings.core.error.call(this, this._data.core.last_error);
					return false;
				}
				if(pos !== -1) {
					par.children = $.vakata.array_remove(par.children, pos);
				}
				tmp = obj.children_d.concat([]);
				tmp.push(obj.id);
				for(k = 0, l = tmp.length; k < l; k++) {
					for(i = 0, j = obj.parents.length; i < j; i++) {
						pos = $.inArray(tmp[k], this._model.data[obj.parents[i]].children_d);
						if(pos !== -1) {
							this._model.data[obj.parents[i]].children_d = $.vakata.array_remove(this._model.data[obj.parents[i]].children_d, pos);
						}
					}
					if(this._model.data[tmp[k]].state.selected) {
						c = true;
						pos = $.inArray(tmp[k], this._data.core.selected);
						if(pos !== -1) {
							this._data.core.selected = $.vakata.array_remove(this._data.core.selected, pos);
						}
					}
				}
				/**
				 * triggered when a node is deleted
				 * @event
				 * @name delete_node.jstree
				 * @param {Object} node
				 * @param {String} parent the parent's ID
				 */
				this.trigger('delete_node', { "node" : obj, "parent" : par.id });
				if(c) {
					this.trigger('changed', { 'action' : 'delete_node', 'node' : obj, 'selected' : this._data.core.selected, 'parent' : par.id });
				}
				for(k = 0, l = tmp.length; k < l; k++) {
					delete this._model.data[tmp[k]];
				}
				this.redraw_node(par, true);
				return true;
			},
			/**
			 * check if an operation is premitted on the tree. Used internally.
			 * @private
			 * @name check(chk, obj, par, pos)
			 * @param  {String} chk the operation to check, can be "create_node", "rename_node", "delete_node", "copy_node" or "move_node"
			 * @param  {mixed} obj the node
			 * @param  {mixed} par the parent
			 * @param  {mixed} pos the position to insert at, or if "rename_node" - the new name
			 * @param  {mixed} more some various additional information, for example if a "move_node" operations is triggered by DND this will be the hovered node
			 * @return {Boolean}
			 */
			check : function (chk, obj, par, pos, more) {
				obj = obj && obj.id ? obj : this.get_node(obj);
				par = par && par.id ? par : this.get_node(par);
				var tmp = chk.match(/^move_node|copy_node|create_node$/i) ? par : obj,
					chc = this.settings.core.check_callback;
				if(chk === "move_node" || chk === "copy_node") {
					if((!more || !more.is_multi) && (obj.id === par.id || $.inArray(obj.id, par.children) === pos || $.inArray(par.id, obj.children_d) !== -1)) {
						this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_01', 'reason' : 'Moving parent inside child', 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
						return false;
					}
				}
				if(tmp && tmp.data) { tmp = tmp.data; }
				if(tmp && tmp.functions && (tmp.functions[chk] === false || tmp.functions[chk] === true)) {
					if(tmp.functions[chk] === false) {
						this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_02', 'reason' : 'Node data prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
					}
					return tmp.functions[chk];
				}
				if(chc === false || ($.isFunction(chc) && chc.call(this, chk, obj, par, pos, more) === false) || (chc && chc[chk] === false)) {
					this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_03', 'reason' : 'User config for core.check_callback prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
					return false;
				}
				return true;
			},
			/**
			 * get the last error
			 * @name last_error()
			 * @return {Object}
			 */
			last_error : function () {
				return this._data.core.last_error;
			},
			/**
			 * move a node to a new parent
			 * @name move_node(obj, par [, pos, callback, is_loaded])
			 * @param  {mixed} obj the node to move, pass an array to move multiple nodes
			 * @param  {mixed} par the new parent
			 * @param  {mixed} pos the position to insert at (besides integer values, "first" and "last" are supported, as well as "before" and "after"), defaults to integer `0`
			 * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
			 * @param  {Boolean} is_loaded internal parameter indicating if the parent node has been loaded
			 * @param  {Boolean} skip_redraw internal parameter indicating if the tree should be redrawn
			 * @param  {Boolean} instance internal parameter indicating if the node comes from another instance
			 * @trigger move_node.jstree
			 */
			move_node : function (obj, par, pos, callback, is_loaded, skip_redraw, origin) {
				var t1, t2, old_par, old_pos, new_par, old_ins, is_multi, dpc, tmp, i, j, k, l, p;

				par = this.get_node(par);
				pos = pos === undefined ? 0 : pos;
				if(!par) { return false; }
				if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
					return this.load_node(par, function () { this.move_node(obj, par, pos, callback, true, false, origin); });
				}

				if($.isArray(obj)) {
					if(obj.length === 1) {
						obj = obj[0];
					}
					else {
						//obj = obj.slice();
						for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
							if((tmp = this.move_node(obj[t1], par, pos, callback, is_loaded, false, origin))) {
								par = tmp;
								pos = "after";
							}
						}
						this.redraw();
						return true;
					}
				}
				obj = obj && obj.id ? obj : this.get_node(obj);

				if(!obj || obj.id === '#') { return false; }

				old_par = (obj.parent || '#').toString();
				new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
				old_ins = origin ? origin : (this._model.data[obj.id] ? this : $.jstree.reference(obj.id));
				is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
				old_pos = old_ins && old_ins._id && old_par && old_ins._model.data[old_par] && old_ins._model.data[old_par].children ? $.inArray(obj.id, old_ins._model.data[old_par].children) : -1;
				if(old_ins && old_ins._id) {
					obj = old_ins._model.data[obj.id];
				}

				if(is_multi) {
					if((tmp = this.copy_node(obj, par, pos, callback, is_loaded, false, origin))) {
						if(old_ins) { old_ins.delete_node(obj); }
						return tmp;
					}
					return false;
				}
				//var m = this._model.data;
				if(par.id === '#') {
					if(pos === "before") { pos = "first"; }
					if(pos === "after") { pos = "last"; }
				}
				switch(pos) {
					case "before":
						pos = $.inArray(par.id, new_par.children);
						break;
					case "after" :
						pos = $.inArray(par.id, new_par.children) + 1;
						break;
					case "inside":
					case "first":
						pos = 0;
						break;
					case "last":
						pos = new_par.children.length;
						break;
					default:
						if(!pos) { pos = 0; }
						break;
				}
				if(pos > new_par.children.length) { pos = new_par.children.length; }
				if(!this.check("move_node", obj, new_par, pos, { 'core' : true, 'origin' : origin, 'is_multi' : (old_ins && old_ins._id && old_ins._id !== this._id), 'is_foreign' : (!old_ins || !old_ins._id) })) {
					this.settings.core.error.call(this, this._data.core.last_error);
					return false;
				}
				if(obj.parent === new_par.id) {
					dpc = new_par.children.concat();
					tmp = $.inArray(obj.id, dpc);
					if(tmp !== -1) {
						dpc = $.vakata.array_remove(dpc, tmp);
						if(pos > tmp) { pos--; }
					}
					tmp = [];
					for(i = 0, j = dpc.length; i < j; i++) {
						tmp[i >= pos ? i+1 : i] = dpc[i];
					}
					tmp[pos] = obj.id;
					new_par.children = tmp;
					this._node_changed(new_par.id);
					this.redraw(new_par.id === '#');
				}
				else {
					// clean old parent and up
					tmp = obj.children_d.concat();
					tmp.push(obj.id);
					for(i = 0, j = obj.parents.length; i < j; i++) {
						dpc = [];
						p = old_ins._model.data[obj.parents[i]].children_d;
						for(k = 0, l = p.length; k < l; k++) {
							if($.inArray(p[k], tmp) === -1) {
								dpc.push(p[k]);
							}
						}
						old_ins._model.data[obj.parents[i]].children_d = dpc;
					}
					old_ins._model.data[old_par].children = $.vakata.array_remove_item(old_ins._model.data[old_par].children, obj.id);

					// insert into new parent and up
					for(i = 0, j = new_par.parents.length; i < j; i++) {
						this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(tmp);
					}
					dpc = [];
					for(i = 0, j = new_par.children.length; i < j; i++) {
						dpc[i >= pos ? i+1 : i] = new_par.children[i];
					}
					dpc[pos] = obj.id;
					new_par.children = dpc;
					new_par.children_d.push(obj.id);
					new_par.children_d = new_par.children_d.concat(obj.children_d);

					// update object
					obj.parent = new_par.id;
					tmp = new_par.parents.concat();
					tmp.unshift(new_par.id);
					p = obj.parents.length;
					obj.parents = tmp;

					// update object children
					tmp = tmp.concat();
					for(i = 0, j = obj.children_d.length; i < j; i++) {
						this._model.data[obj.children_d[i]].parents = this._model.data[obj.children_d[i]].parents.slice(0,p*-1);
						Array.prototype.push.apply(this._model.data[obj.children_d[i]].parents, tmp);
					}

					if(old_par === '#' || new_par.id === '#') {
						this._model.force_full_redraw = true;
					}
					if(!this._model.force_full_redraw) {
						this._node_changed(old_par);
						this._node_changed(new_par.id);
					}
					if(!skip_redraw) {
						this.redraw();
					}
				}
				if(callback) { callback.call(this, obj, new_par, pos); }
				/**
				 * triggered when a node is moved
				 * @event
				 * @name move_node.jstree
				 * @param {Object} node
				 * @param {String} parent the parent's ID
				 * @param {Number} position the position of the node among the parent's children
				 * @param {String} old_parent the old parent of the node
				 * @param {Number} old_position the old position of the node
				 * @param {Boolean} is_multi do the node and new parent belong to different instances
				 * @param {jsTree} old_instance the instance the node came from
				 * @param {jsTree} new_instance the instance of the new parent
				 */
				this.trigger('move_node', { "node" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, "old_position" : old_pos, 'is_multi' : (old_ins && old_ins._id && old_ins._id !== this._id), 'is_foreign' : (!old_ins || !old_ins._id), 'old_instance' : old_ins, 'new_instance' : this });
				return obj.id;
			},
			/**
			 * copy a node to a new parent
			 * @name copy_node(obj, par [, pos, callback, is_loaded])
			 * @param  {mixed} obj the node to copy, pass an array to copy multiple nodes
			 * @param  {mixed} par the new parent
			 * @param  {mixed} pos the position to insert at (besides integer values, "first" and "last" are supported, as well as "before" and "after"), defaults to integer `0`
			 * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
			 * @param  {Boolean} is_loaded internal parameter indicating if the parent node has been loaded
			 * @param  {Boolean} skip_redraw internal parameter indicating if the tree should be redrawn
			 * @param  {Boolean} instance internal parameter indicating if the node comes from another instance
			 * @trigger model.jstree copy_node.jstree
			 */
			copy_node : function (obj, par, pos, callback, is_loaded, skip_redraw, origin) {
				var t1, t2, dpc, tmp, i, j, node, old_par, new_par, old_ins, is_multi;

				par = this.get_node(par);
				pos = pos === undefined ? 0 : pos;
				if(!par) { return false; }
				if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
					return this.load_node(par, function () { this.copy_node(obj, par, pos, callback, true, false, origin); });
				}

				if($.isArray(obj)) {
					if(obj.length === 1) {
						obj = obj[0];
					}
					else {
						//obj = obj.slice();
						for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
							if((tmp = this.copy_node(obj[t1], par, pos, callback, is_loaded, true, origin))) {
								par = tmp;
								pos = "after";
							}
						}
						this.redraw();
						return true;
					}
				}
				obj = obj && obj.id ? obj : this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }

				old_par = (obj.parent || '#').toString();
				new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
				old_ins = origin ? origin : (this._model.data[obj.id] ? this : $.jstree.reference(obj.id));
				is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);

				if(old_ins && old_ins._id) {
					obj = old_ins._model.data[obj.id];
				}

				if(par.id === '#') {
					if(pos === "before") { pos = "first"; }
					if(pos === "after") { pos = "last"; }
				}
				switch(pos) {
					case "before":
						pos = $.inArray(par.id, new_par.children);
						break;
					case "after" :
						pos = $.inArray(par.id, new_par.children) + 1;
						break;
					case "inside":
					case "first":
						pos = 0;
						break;
					case "last":
						pos = new_par.children.length;
						break;
					default:
						if(!pos) { pos = 0; }
						break;
				}
				if(pos > new_par.children.length) { pos = new_par.children.length; }
				if(!this.check("copy_node", obj, new_par, pos, { 'core' : true, 'origin' : origin, 'is_multi' : (old_ins && old_ins._id && old_ins._id !== this._id), 'is_foreign' : (!old_ins || !old_ins._id) })) {
					this.settings.core.error.call(this, this._data.core.last_error);
					return false;
				}
				node = old_ins ? old_ins.get_json(obj, { no_id : true, no_data : true, no_state : true }) : obj;
				if(!node) { return false; }
				if(node.id === true) { delete node.id; }
				node = this._parse_model_from_json(node, new_par.id, new_par.parents.concat());
				if(!node) { return false; }
				tmp = this.get_node(node);
				if(obj && obj.state && obj.state.loaded === false) { tmp.state.loaded = false; }
				dpc = [];
				dpc.push(node);
				dpc = dpc.concat(tmp.children_d);
				this.trigger('model', { "nodes" : dpc, "parent" : new_par.id });

				// insert into new parent and up
				for(i = 0, j = new_par.parents.length; i < j; i++) {
					this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(dpc);
				}
				dpc = [];
				for(i = 0, j = new_par.children.length; i < j; i++) {
					dpc[i >= pos ? i+1 : i] = new_par.children[i];
				}
				dpc[pos] = tmp.id;
				new_par.children = dpc;
				new_par.children_d.push(tmp.id);
				new_par.children_d = new_par.children_d.concat(tmp.children_d);

				if(new_par.id === '#') {
					this._model.force_full_redraw = true;
				}
				if(!this._model.force_full_redraw) {
					this._node_changed(new_par.id);
				}
				if(!skip_redraw) {
					this.redraw(new_par.id === '#');
				}
				if(callback) { callback.call(this, tmp, new_par, pos); }
				/**
				 * triggered when a node is copied
				 * @event
				 * @name copy_node.jstree
				 * @param {Object} node the copied node
				 * @param {Object} original the original node
				 * @param {String} parent the parent's ID
				 * @param {Number} position the position of the node among the parent's children
				 * @param {String} old_parent the old parent of the node
				 * @param {Number} old_position the position of the original node
				 * @param {Boolean} is_multi do the node and new parent belong to different instances
				 * @param {jsTree} old_instance the instance the node came from
				 * @param {jsTree} new_instance the instance of the new parent
				 */
				this.trigger('copy_node', { "node" : tmp, "original" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, "old_position" : old_ins && old_ins._id && old_par && old_ins._model.data[old_par] && old_ins._model.data[old_par].children ? $.inArray(obj.id, old_ins._model.data[old_par].children) : -1,'is_multi' : (old_ins && old_ins._id && old_ins._id !== this._id), 'is_foreign' : (!old_ins || !old_ins._id), 'old_instance' : old_ins, 'new_instance' : this });
				return tmp.id;
			},
			/**
			 * cut a node (a later call to `paste(obj)` would move the node)
			 * @name cut(obj)
			 * @param  {mixed} obj multiple objects can be passed using an array
			 * @trigger cut.jstree
			 */
			cut : function (obj) {
				if(!obj) { obj = this._data.core.selected.concat(); }
				if(!$.isArray(obj)) { obj = [obj]; }
				if(!obj.length) { return false; }
				var tmp = [], o, t1, t2;
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					o = this.get_node(obj[t1]);
					if(o && o.id && o.id !== '#') { tmp.push(o); }
				}
				if(!tmp.length) { return false; }
				ccp_node = tmp;
				ccp_inst = this;
				ccp_mode = 'move_node';
				/**
				 * triggered when nodes are added to the buffer for moving
				 * @event
				 * @name cut.jstree
				 * @param {Array} node
				 */
				this.trigger('cut', { "node" : obj });
			},
			/**
			 * copy a node (a later call to `paste(obj)` would copy the node)
			 * @name copy(obj)
			 * @param  {mixed} obj multiple objects can be passed using an array
			 * @trigger copy.jstree
			 */
			copy : function (obj) {
				if(!obj) { obj = this._data.core.selected.concat(); }
				if(!$.isArray(obj)) { obj = [obj]; }
				if(!obj.length) { return false; }
				var tmp = [], o, t1, t2;
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					o = this.get_node(obj[t1]);
					if(o && o.id && o.id !== '#') { tmp.push(o); }
				}
				if(!tmp.length) { return false; }
				ccp_node = tmp;
				ccp_inst = this;
				ccp_mode = 'copy_node';
				/**
				 * triggered when nodes are added to the buffer for copying
				 * @event
				 * @name copy.jstree
				 * @param {Array} node
				 */
				this.trigger('copy', { "node" : obj });
			},
			/**
			 * get the current buffer (any nodes that are waiting for a paste operation)
			 * @name get_buffer()
			 * @return {Object} an object consisting of `mode` ("copy_node" or "move_node"), `node` (an array of objects) and `inst` (the instance)
			 */
			get_buffer : function () {
				return { 'mode' : ccp_mode, 'node' : ccp_node, 'inst' : ccp_inst };
			},
			/**
			 * check if there is something in the buffer to paste
			 * @name can_paste()
			 * @return {Boolean}
			 */
			can_paste : function () {
				return ccp_mode !== false && ccp_node !== false; // && ccp_inst._model.data[ccp_node];
			},
			/**
			 * copy or move the previously cut or copied nodes to a new parent
			 * @name paste(obj [, pos])
			 * @param  {mixed} obj the new parent
			 * @param  {mixed} pos the position to insert at (besides integer, "first" and "last" are supported), defaults to integer `0`
			 * @trigger paste.jstree
			 */
			paste : function (obj, pos) {
				obj = this.get_node(obj);
				if(!obj || !ccp_mode || !ccp_mode.match(/^(copy_node|move_node)$/) || !ccp_node) { return false; }
				if(this[ccp_mode](ccp_node, obj, pos, false, false, false, ccp_inst)) {
					/**
					 * triggered when paste is invoked
					 * @event
					 * @name paste.jstree
					 * @param {String} parent the ID of the receiving node
					 * @param {Array} node the nodes in the buffer
					 * @param {String} mode the performed operation - "copy_node" or "move_node"
					 */
					this.trigger('paste', { "parent" : obj.id, "node" : ccp_node, "mode" : ccp_mode });
				}
				ccp_node = false;
				ccp_mode = false;
				ccp_inst = false;
			},
			/**
			 * clear the buffer of previously copied or cut nodes
			 * @name clear_buffer()
			 * @trigger clear_buffer.jstree
			 */
			clear_buffer : function () {
				ccp_node = false;
				ccp_mode = false;
				ccp_inst = false;
				/**
				 * triggered when the copy / cut buffer is cleared
				 * @event
				 * @name clear_buffer.jstree
				 */
				this.trigger('clear_buffer');
			},
			/**
			 * put a node in edit mode (input field to rename the node)
			 * @name edit(obj [, default_text, callback])
			 * @param  {mixed} obj
			 * @param  {String} default_text the text to populate the input with (if omitted or set to a non-string value the node's text value is used)
			 * @param  {Function} callback a function to be called once the text box is blurred, it is called in the instance's scope and receives the node and a status parameter - true if the rename is successful, false otherwise. You can access the node's title using .text
			 */
			edit : function (obj, default_text, callback) {
				var rtl, w, a, s, t, h1, h2, fn, tmp;
				obj = this.get_node(obj);
				if(!obj) { return false; }
				if(this.settings.core.check_callback === false) {
					this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_07', 'reason' : 'Could not edit node because of check_callback' };
					this.settings.core.error.call(this, this._data.core.last_error);
					return false;
				}
				tmp = obj;
				default_text = typeof default_text === 'string' ? default_text : obj.text;
				this.set_text(obj, "");
				obj = this._open_to(obj);
				tmp.text = default_text;

				rtl = this._data.core.rtl;
				w  = this.element.width();
				a  = obj.children('.jstree-anchor');
				s  = $('<span>');
				/*!
				oi = obj.children("i:visible"),
				ai = a.children("i:visible"),
				w1 = oi.width() * oi.length,
				w2 = ai.width() * ai.length,
				*/
				t  = default_text;
				h1 = $("<"+"div />", { css : { "position" : "absolute", "top" : "-200px", "left" : (rtl ? "0px" : "-1000px"), "visibility" : "hidden" } }).appendTo("body");
				h2 = $("<"+"input />", {
							"value" : t,
							"class" : "jstree-rename-input",
							// "size" : t.length,
							"css" : {
								"padding" : "0",
								"border" : "1px solid silver",
								"box-sizing" : "border-box",
								"display" : "inline-block",
								"height" : (this._data.core.li_height) + "px",
								"lineHeight" : (this._data.core.li_height) + "px",
								"width" : "150px" // will be set a bit further down
							},
							"blur" : $.proxy(function () {
								var i = s.children(".jstree-rename-input"),
									v = i.val(),
									f = this.settings.core.force_text,
									nv;
								if(v === "") { v = t; }
								h1.remove();
								s.replaceWith(a);
								s.remove();
								t = f ? t : $('<div></div>').append($.parseHTML(t)).html();
								this.set_text(obj, t);
								nv = !!this.rename_node(obj, f ? $('<div></div>').text(v).text() : $('<div></div>').append($.parseHTML(v)).html());
								if(!nv) {
									this.set_text(obj, t); // move this up? and fix #483
								}
								if(callback) {
									callback.call(this, tmp, nv);
								}
							}, this),
							"keydown" : function (event) {
								var key = event.which;
								if(key === 27) {
									this.value = t;
								}
								if(key === 27 || key === 13 || key === 37 || key === 38 || key === 39 || key === 40 || key === 32) {
									event.stopImmediatePropagation();
								}
								if(key === 27 || key === 13) {
									event.preventDefault();
									this.blur();
								}
							},
							"click" : function (e) { e.stopImmediatePropagation(); },
							"mousedown" : function (e) { e.stopImmediatePropagation(); },
							"keyup" : function (event) {
								h2.width(Math.min(h1.text("pW" + this.value).width(),w));
							},
							"keypress" : function(event) {
								if(event.which === 13) { return false; }
							}
						});
					fn = {
							fontFamily		: a.css('fontFamily')		|| '',
							fontSize		: a.css('fontSize')			|| '',
							fontWeight		: a.css('fontWeight')		|| '',
							fontStyle		: a.css('fontStyle')		|| '',
							fontStretch		: a.css('fontStretch')		|| '',
							fontVariant		: a.css('fontVariant')		|| '',
							letterSpacing	: a.css('letterSpacing')	|| '',
							wordSpacing		: a.css('wordSpacing')		|| ''
					};
				s.attr('class', a.attr('class')).append(a.contents().clone()).append(h2);
				a.replaceWith(s);
				h1.css(fn);
				h2.css(fn).width(Math.min(h1.text("pW" + h2[0].value).width(),w))[0].select();
			},


			/**
			 * changes the theme
			 * @name set_theme(theme_name [, theme_url])
			 * @param {String} theme_name the name of the new theme to apply
			 * @param {mixed} theme_url  the location of the CSS file for this theme. Omit or set to `false` if you manually included the file. Set to `true` to autoload from the `core.themes.dir` directory.
			 * @trigger set_theme.jstree
			 */
			set_theme : function (theme_name, theme_url) {
				if(!theme_name) { return false; }
				if(theme_url === true) {
					var dir = this.settings.core.themes.dir;
					if(!dir) { dir = $.jstree.path + '/themes'; }
					theme_url = dir + '/' + theme_name + '/style.css';
				}
				if(theme_url && $.inArray(theme_url, themes_loaded) === -1) {
					$('head').append('<'+'link rel="stylesheet" href="' + theme_url + '" type="text/css" />');
					themes_loaded.push(theme_url);
				}
				if(this._data.core.themes.name) {
					this.element.removeClass('jstree-' + this._data.core.themes.name);
				}
				this._data.core.themes.name = theme_name;
				this.element.addClass('jstree-' + theme_name);
				this.element[this.settings.core.themes.responsive ? 'addClass' : 'removeClass' ]('jstree-' + theme_name + '-responsive');
				/**
				 * triggered when a theme is set
				 * @event
				 * @name set_theme.jstree
				 * @param {String} theme the new theme
				 */
				this.trigger('set_theme', { 'theme' : theme_name });
			},
			/**
			 * gets the name of the currently applied theme name
			 * @name get_theme()
			 * @return {String}
			 */
			get_theme : function () { return this._data.core.themes.name; },
			/**
			 * changes the theme variant (if the theme has variants)
			 * @name set_theme_variant(variant_name)
			 * @param {String|Boolean} variant_name the variant to apply (if `false` is used the current variant is removed)
			 */
			set_theme_variant : function (variant_name) {
				if(this._data.core.themes.variant) {
					this.element.removeClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
				}
				this._data.core.themes.variant = variant_name;
				if(variant_name) {
					this.element.addClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
				}
			},
			/**
			 * gets the name of the currently applied theme variant
			 * @name get_theme()
			 * @return {String}
			 */
			get_theme_variant : function () { return this._data.core.themes.variant; },
			/**
			 * shows a striped background on the container (if the theme supports it)
			 * @name show_stripes()
			 */
			show_stripes : function () { this._data.core.themes.stripes = true; this.get_container_ul().addClass("jstree-striped"); },
			/**
			 * hides the striped background on the container
			 * @name hide_stripes()
			 */
			hide_stripes : function () { this._data.core.themes.stripes = false; this.get_container_ul().removeClass("jstree-striped"); },
			/**
			 * toggles the striped background on the container
			 * @name toggle_stripes()
			 */
			toggle_stripes : function () { if(this._data.core.themes.stripes) { this.hide_stripes(); } else { this.show_stripes(); } },
			/**
			 * shows the connecting dots (if the theme supports it)
			 * @name show_dots()
			 */
			show_dots : function () { this._data.core.themes.dots = true; this.get_container_ul().removeClass("jstree-no-dots"); },
			/**
			 * hides the connecting dots
			 * @name hide_dots()
			 */
			hide_dots : function () { this._data.core.themes.dots = false; this.get_container_ul().addClass("jstree-no-dots"); },
			/**
			 * toggles the connecting dots
			 * @name toggle_dots()
			 */
			toggle_dots : function () { if(this._data.core.themes.dots) { this.hide_dots(); } else { this.show_dots(); } },
			/**
			 * show the node icons
			 * @name show_icons()
			 */
			show_icons : function () { this._data.core.themes.icons = true; this.get_container_ul().removeClass("jstree-no-icons"); },
			/**
			 * hide the node icons
			 * @name hide_icons()
			 */
			hide_icons : function () { this._data.core.themes.icons = false; this.get_container_ul().addClass("jstree-no-icons"); },
			/**
			 * toggle the node icons
			 * @name toggle_icons()
			 */
			toggle_icons : function () { if(this._data.core.themes.icons) { this.hide_icons(); } else { this.show_icons(); } },
			/**
			 * set the node icon for a node
			 * @name set_icon(obj, icon)
			 * @param {mixed} obj
			 * @param {String} icon the new icon - can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class
			 */
			set_icon : function (obj, icon) {
				var t1, t2, dom, old;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.set_icon(obj[t1], icon);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }
				old = obj.icon;
				obj.icon = icon === true || icon === null || icon === undefined || icon === '' ? true : icon;
				dom = this.get_node(obj, true).children(".jstree-anchor").children(".jstree-themeicon");
				if(icon === false) {
					this.hide_icon(obj);
				}
				else if(icon === true || icon === null || icon === undefined || icon === '') {
					dom.removeClass('jstree-themeicon-custom ' + old).css("background","").removeAttr("rel");
					if(old === false) { this.show_icon(obj); }
				}
				else if(icon.indexOf("/") === -1 && icon.indexOf(".") === -1) {
					dom.removeClass(old).css("background","");
					dom.addClass(icon + ' jstree-themeicon-custom').attr("rel",icon);
					if(old === false) { this.show_icon(obj); }
				}
				else {
					dom.removeClass(old).css("background","");
					dom.addClass('jstree-themeicon-custom').css("background", "url('" + icon + "') center center no-repeat").attr("rel",icon);
					if(old === false) { this.show_icon(obj); }
				}
				return true;
			},
			/**
			 * get the node icon for a node
			 * @name get_icon(obj)
			 * @param {mixed} obj
			 * @return {String}
			 */
			get_icon : function (obj) {
				obj = this.get_node(obj);
				return (!obj || obj.id === '#') ? false : obj.icon;
			},
			/**
			 * hide the icon on an individual node
			 * @name hide_icon(obj)
			 * @param {mixed} obj
			 */
			hide_icon : function (obj) {
				var t1, t2;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.hide_icon(obj[t1]);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj === '#') { return false; }
				obj.icon = false;
				this.get_node(obj, true).children(".jstree-anchor").children(".jstree-themeicon").addClass('jstree-themeicon-hidden');
				return true;
			},
			/**
			 * show the icon on an individual node
			 * @name show_icon(obj)
			 * @param {mixed} obj
			 */
			show_icon : function (obj) {
				var t1, t2, dom;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.show_icon(obj[t1]);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj === '#') { return false; }
				dom = this.get_node(obj, true);
				obj.icon = dom.length ? dom.children(".jstree-anchor").children(".jstree-themeicon").attr('rel') : true;
				if(!obj.icon) { obj.icon = true; }
				dom.children(".jstree-anchor").children(".jstree-themeicon").removeClass('jstree-themeicon-hidden');
				return true;
			}
		};

		// helpers
		$.vakata = {};
		// collect attributes
		$.vakata.attributes = function(node, with_values) {
			node = $(node)[0];
			var attr = with_values ? {} : [];
			if(node && node.attributes) {
				$.each(node.attributes, function (i, v) {
					if($.inArray(v.name.toLowerCase(),['style','contenteditable','hasfocus','tabindex']) !== -1) { return; }
					if(v.value !== null && $.trim(v.value) !== '') {
						if(with_values) { attr[v.name] = v.value; }
						else { attr.push(v.name); }
					}
				});
			}
			return attr;
		};
		$.vakata.array_unique = function(array) {
			var a = [], i, j, l, o = {};
			for(i = 0, l = array.length; i < l; i++) {
				if(o[array[i]] === undefined) {
					a.push(array[i]);
					o[array[i]] = true;
				}
			}
			return a;
		};
		// remove item from array
		$.vakata.array_remove = function(array, from, to) {
			var rest = array.slice((to || from) + 1 || array.length);
			array.length = from < 0 ? array.length + from : from;
			array.push.apply(array, rest);
			return array;
		};
		// remove item from array
		$.vakata.array_remove_item = function(array, item) {
			var tmp = $.inArray(item, array);
			return tmp !== -1 ? $.vakata.array_remove(array, tmp) : array;
		};


	/**
	 * ### Checkbox plugin
	 *
	 * This plugin renders checkbox icons in front of each node, making multiple selection much easier.
	 * It also supports tri-state behavior, meaning that if a node has a few of its children checked it will be rendered as undetermined, and state will be propagated up.
	 */

		var _i = document.createElement('I');
		_i.className = 'jstree-icon jstree-checkbox';
		_i.setAttribute('role', 'presentation');
		/**
		 * stores all defaults for the checkbox plugin
		 * @name $.jstree.defaults.checkbox
		 * @plugin checkbox
		 */
		$.jstree.defaults.checkbox = {
			/**
			 * a boolean indicating if checkboxes should be visible (can be changed at a later time using `show_checkboxes()` and `hide_checkboxes`). Defaults to `true`.
			 * @name $.jstree.defaults.checkbox.visible
			 * @plugin checkbox
			 */
			visible				: true,
			/**
			 * a boolean indicating if checkboxes should cascade down and have an undetermined state. Defaults to `true`.
			 * @name $.jstree.defaults.checkbox.three_state
			 * @plugin checkbox
			 */
			three_state			: true,
			/**
			 * a boolean indicating if clicking anywhere on the node should act as clicking on the checkbox. Defaults to `true`.
			 * @name $.jstree.defaults.checkbox.whole_node
			 * @plugin checkbox
			 */
			whole_node			: true,
			/**
			 * a boolean indicating if the selected style of a node should be kept, or removed. Defaults to `true`.
			 * @name $.jstree.defaults.checkbox.keep_selected_style
			 * @plugin checkbox
			 */
			keep_selected_style	: true,
			/**
			 * This setting controls how cascading and undetermined nodes are applied.
			 * If 'up' is in the string - cascading up is enabled, if 'down' is in the string - cascading down is enabled, if 'undetermined' is in the string - undetermined nodes will be used.
			 * If `three_state` is set to `true` this setting is automatically set to 'up+down+undetermined'. Defaults to ''.
			 * @name $.jstree.defaults.checkbox.cascade
			 * @plugin checkbox
			 */
			cascade				: '',
			/**
			 * This setting controls if checkbox are bound to the general tree selection or to an internal array maintained by the checkbox plugin. Defaults to `true`, only set to `false` if you know exactly what you are doing.
			 * @name $.jstree.defaults.checkbox.tie_selection
			 * @plugin checkbox
			 */
			tie_selection		: true
		};
		$.jstree.plugins.checkbox = function (options, parent) {
			this.bind = function () {
				parent.bind.call(this);
				this._data.checkbox.uto = false;
				this._data.checkbox.selected = [];
				if(this.settings.checkbox.three_state) {
					this.settings.checkbox.cascade = 'up+down+undetermined';
				}
				this.element
					.on("init.jstree", $.proxy(function () {
							this._data.checkbox.visible = this.settings.checkbox.visible;
							if(!this.settings.checkbox.keep_selected_style) {
								this.element.addClass('jstree-checkbox-no-clicked');
							}
							if(this.settings.checkbox.tie_selection) {
								this.element.addClass('jstree-checkbox-selection');
							}
						}, this))
					.on("loading.jstree", $.proxy(function () {
							this[ this._data.checkbox.visible ? 'show_checkboxes' : 'hide_checkboxes' ]();
						}, this));
				if(this.settings.checkbox.cascade.indexOf('undetermined') !== -1) {
					this.element
						.on('changed.jstree uncheck_node.jstree check_node.jstree uncheck_all.jstree check_all.jstree move_node.jstree copy_node.jstree redraw.jstree open_node.jstree', $.proxy(function () {
								// only if undetermined is in setting
								if(this._data.checkbox.uto) { clearTimeout(this._data.checkbox.uto); }
								this._data.checkbox.uto = setTimeout($.proxy(this._undetermined, this), 50);
							}, this));
				}
				if(!this.settings.checkbox.tie_selection) {
					this.element
						.on('model.jstree', $.proxy(function (e, data) {
							var m = this._model.data,
								p = m[data.parent],
								dpc = data.nodes,
								i, j;
							for(i = 0, j = dpc.length; i < j; i++) {
								m[dpc[i]].state.checked = (m[dpc[i]].original && m[dpc[i]].original.state && m[dpc[i]].original.state.checked);
								if(m[dpc[i]].state.checked) {
									this._data.checkbox.selected.push(dpc[i]);
								}
							}
						}, this));
				}
				if(this.settings.checkbox.cascade.indexOf('up') !== -1 || this.settings.checkbox.cascade.indexOf('down') !== -1) {
					this.element
						.on('model.jstree', $.proxy(function (e, data) {
								var m = this._model.data,
									p = m[data.parent],
									dpc = data.nodes,
									chd = [],
									c, i, j, k, l, tmp, s = this.settings.checkbox.cascade, t = this.settings.checkbox.tie_selection;

								if(s.indexOf('down') !== -1) {
									// apply down
									if(p.state[ t ? 'selected' : 'checked' ]) {
										for(i = 0, j = dpc.length; i < j; i++) {
											m[dpc[i]].state[ t ? 'selected' : 'checked' ] = true;
										}
										this._data[ t ? 'core' : 'checkbox' ].selected = this._data[ t ? 'core' : 'checkbox' ].selected.concat(dpc);
									}
									else {
										for(i = 0, j = dpc.length; i < j; i++) {
											if(m[dpc[i]].state[ t ? 'selected' : 'checked' ]) {
												for(k = 0, l = m[dpc[i]].children_d.length; k < l; k++) {
													m[m[dpc[i]].children_d[k]].state[ t ? 'selected' : 'checked' ] = true;
												}
												this._data[ t ? 'core' : 'checkbox' ].selected = this._data[ t ? 'core' : 'checkbox' ].selected.concat(m[dpc[i]].children_d);
											}
										}
									}
								}

								if(s.indexOf('up') !== -1) {
									// apply up
									for(i = 0, j = p.children_d.length; i < j; i++) {
										if(!m[p.children_d[i]].children.length) {
											chd.push(m[p.children_d[i]].parent);
										}
									}
									chd = $.vakata.array_unique(chd);
									for(k = 0, l = chd.length; k < l; k++) {
										p = m[chd[k]];
										while(p && p.id !== '#') {
											c = 0;
											for(i = 0, j = p.children.length; i < j; i++) {
												c += m[p.children[i]].state[ t ? 'selected' : 'checked' ];
											}
											if(c === j) {
												p.state[ t ? 'selected' : 'checked' ] = true;
												this._data[ t ? 'core' : 'checkbox' ].selected.push(p.id);
												tmp = this.get_node(p, true);
												if(tmp && tmp.length) {
													tmp.attr('aria-selected', true).children('.jstree-anchor').addClass( t ? 'jstree-clicked' : 'jstree-checked');
												}
											}
											else {
												break;
											}
											p = this.get_node(p.parent);
										}
									}
								}

								this._data[ t ? 'core' : 'checkbox' ].selected = $.vakata.array_unique(this._data[ t ? 'core' : 'checkbox' ].selected);
							}, this))
						.on(this.settings.checkbox.tie_selection ? 'select_node.jstree' : 'check_node.jstree', $.proxy(function (e, data) {
								var obj = data.node,
									m = this._model.data,
									par = this.get_node(obj.parent),
									dom = this.get_node(obj, true),
									i, j, c, tmp, s = this.settings.checkbox.cascade, t = this.settings.checkbox.tie_selection;

								// apply down
								if(s.indexOf('down') !== -1) {
									this._data[ t ? 'core' : 'checkbox' ].selected = $.vakata.array_unique(this._data[ t ? 'core' : 'checkbox' ].selected.concat(obj.children_d));
									for(i = 0, j = obj.children_d.length; i < j; i++) {
										tmp = m[obj.children_d[i]];
										tmp.state[ t ? 'selected' : 'checked' ] = true;
										if(tmp && tmp.original && tmp.original.state && tmp.original.state.undetermined) {
											tmp.original.state.undetermined = false;
										}
									}
								}

								// apply up
								if(s.indexOf('up') !== -1) {
									while(par && par.id !== '#') {
										c = 0;
										for(i = 0, j = par.children.length; i < j; i++) {
											c += m[par.children[i]].state[ t ? 'selected' : 'checked' ];
										}
										if(c === j) {
											par.state[ t ? 'selected' : 'checked' ] = true;
											this._data[ t ? 'core' : 'checkbox' ].selected.push(par.id);
											tmp = this.get_node(par, true);
											if(tmp && tmp.length) {
												tmp.attr('aria-selected', true).children('.jstree-anchor').addClass(t ? 'jstree-clicked' : 'jstree-checked');
											}
										}
										else {
											break;
										}
										par = this.get_node(par.parent);
									}
								}

								// apply down (process .children separately?)
								if(s.indexOf('down') !== -1 && dom.length) {
									dom.find('.jstree-anchor').addClass(t ? 'jstree-clicked' : 'jstree-checked').parent().attr('aria-selected', true);
								}
							}, this))
						.on(this.settings.checkbox.tie_selection ? 'deselect_all.jstree' : 'uncheck_all.jstree', $.proxy(function (e, data) {
								var obj = this.get_node('#'),
									m = this._model.data,
									i, j, tmp;
								for(i = 0, j = obj.children_d.length; i < j; i++) {
									tmp = m[obj.children_d[i]];
									if(tmp && tmp.original && tmp.original.state && tmp.original.state.undetermined) {
										tmp.original.state.undetermined = false;
									}
								}
							}, this))
						.on(this.settings.checkbox.tie_selection ? 'deselect_node.jstree' : 'uncheck_node.jstree', $.proxy(function (e, data) {
								var obj = data.node,
									dom = this.get_node(obj, true),
									i, j, tmp, s = this.settings.checkbox.cascade, t = this.settings.checkbox.tie_selection;
								if(obj && obj.original && obj.original.state && obj.original.state.undetermined) {
									obj.original.state.undetermined = false;
								}

								// apply down
								if(s.indexOf('down') !== -1) {
									for(i = 0, j = obj.children_d.length; i < j; i++) {
										tmp = this._model.data[obj.children_d[i]];
										tmp.state[ t ? 'selected' : 'checked' ] = false;
										if(tmp && tmp.original && tmp.original.state && tmp.original.state.undetermined) {
											tmp.original.state.undetermined = false;
										}
									}
								}

								// apply up
								if(s.indexOf('up') !== -1) {
									for(i = 0, j = obj.parents.length; i < j; i++) {
										tmp = this._model.data[obj.parents[i]];
										tmp.state[ t ? 'selected' : 'checked' ] = false;
										if(tmp && tmp.original && tmp.original.state && tmp.original.state.undetermined) {
											tmp.original.state.undetermined = false;
										}
										tmp = this.get_node(obj.parents[i], true);
										if(tmp && tmp.length) {
											tmp.attr('aria-selected', false).children('.jstree-anchor').removeClass(t ? 'jstree-clicked' : 'jstree-checked');
										}
									}
								}
								tmp = [];
								for(i = 0, j = this._data[ t ? 'core' : 'checkbox' ].selected.length; i < j; i++) {
									// apply down + apply up
									if(
										(s.indexOf('down') === -1 || $.inArray(this._data[ t ? 'core' : 'checkbox' ].selected[i], obj.children_d) === -1) &&
										(s.indexOf('up') === -1 || $.inArray(this._data[ t ? 'core' : 'checkbox' ].selected[i], obj.parents) === -1)
									) {
										tmp.push(this._data[ t ? 'core' : 'checkbox' ].selected[i]);
									}
								}
								this._data[ t ? 'core' : 'checkbox' ].selected = $.vakata.array_unique(tmp);

								// apply down (process .children separately?)
								if(s.indexOf('down') !== -1 && dom.length) {
									dom.find('.jstree-anchor').removeClass(t ? 'jstree-clicked' : 'jstree-checked').parent().attr('aria-selected', false);
								}
							}, this));
				}
				if(this.settings.checkbox.cascade.indexOf('up') !== -1) {
					this.element
						.on('delete_node.jstree', $.proxy(function (e, data) {
								// apply up (whole handler)
								var p = this.get_node(data.parent),
									m = this._model.data,
									i, j, c, tmp, t = this.settings.checkbox.tie_selection;
								while(p && p.id !== '#') {
									c = 0;
									for(i = 0, j = p.children.length; i < j; i++) {
										c += m[p.children[i]].state[ t ? 'selected' : 'checked' ];
									}
									if(c === j) {
										p.state[ t ? 'selected' : 'checked' ] = true;
										this._data[ t ? 'core' : 'checkbox' ].selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.attr('aria-selected', true).children('.jstree-anchor').addClass(t ? 'jstree-clicked' : 'jstree-checked');
										}
									}
									else {
										break;
									}
									p = this.get_node(p.parent);
								}
							}, this))
						.on('move_node.jstree', $.proxy(function (e, data) {
								// apply up (whole handler)
								var is_multi = data.is_multi,
									old_par = data.old_parent,
									new_par = this.get_node(data.parent),
									m = this._model.data,
									p, c, i, j, tmp, t = this.settings.checkbox.tie_selection;
								if(!is_multi) {
									p = this.get_node(old_par);
									while(p && p.id !== '#') {
										c = 0;
										for(i = 0, j = p.children.length; i < j; i++) {
											c += m[p.children[i]].state[ t ? 'selected' : 'checked' ];
										}
										if(c === j) {
											p.state[ t ? 'selected' : 'checked' ] = true;
											this._data[ t ? 'core' : 'checkbox' ].selected.push(p.id);
											tmp = this.get_node(p, true);
											if(tmp && tmp.length) {
												tmp.attr('aria-selected', true).children('.jstree-anchor').addClass(t ? 'jstree-clicked' : 'jstree-checked');
											}
										}
										else {
											break;
										}
										p = this.get_node(p.parent);
									}
								}
								p = new_par;
								while(p && p.id !== '#') {
									c = 0;
									for(i = 0, j = p.children.length; i < j; i++) {
										c += m[p.children[i]].state[ t ? 'selected' : 'checked' ];
									}
									if(c === j) {
										if(!p.state[ t ? 'selected' : 'checked' ]) {
											p.state[ t ? 'selected' : 'checked' ] = true;
											this._data[ t ? 'core' : 'checkbox' ].selected.push(p.id);
											tmp = this.get_node(p, true);
											if(tmp && tmp.length) {
												tmp.attr('aria-selected', true).children('.jstree-anchor').addClass(t ? 'jstree-clicked' : 'jstree-checked');
											}
										}
									}
									else {
										if(p.state[ t ? 'selected' : 'checked' ]) {
											p.state[ t ? 'selected' : 'checked' ] = false;
											this._data[ t ? 'core' : 'checkbox' ].selected = $.vakata.array_remove_item(this._data[ t ? 'core' : 'checkbox' ].selected, p.id);
											tmp = this.get_node(p, true);
											if(tmp && tmp.length) {
												tmp.attr('aria-selected', false).children('.jstree-anchor').removeClass(t ? 'jstree-clicked' : 'jstree-checked');
											}
										}
										else {
											break;
										}
									}
									p = this.get_node(p.parent);
								}
							}, this));
				}
			};
			/**
			 * set the undetermined state where and if necessary. Used internally.
			 * @private
			 * @name _undetermined()
			 * @plugin checkbox
			 */
			this._undetermined = function () {
				if(this.element === null) { return; }
				var i, j, k, l, o = {}, m = this._model.data, t = this.settings.checkbox.tie_selection, s = this._data[ t ? 'core' : 'checkbox' ].selected, p = [], tt = this;
				for(i = 0, j = s.length; i < j; i++) {
					if(m[s[i]] && m[s[i]].parents) {
						for(k = 0, l = m[s[i]].parents.length; k < l; k++) {
							if(o[m[s[i]].parents[k]] === undefined && m[s[i]].parents[k] !== '#') {
								o[m[s[i]].parents[k]] = true;
								p.push(m[s[i]].parents[k]);
							}
						}
					}
				}
				// attempt for server side undetermined state
				this.element.find('.jstree-closed').not(':has(.jstree-children)')
					.each(function () {
						var tmp = tt.get_node(this), tmp2;
						if(!tmp.state.loaded) {
							if(tmp.original && tmp.original.state && tmp.original.state.undetermined && tmp.original.state.undetermined === true) {
								if(o[tmp.id] === undefined && tmp.id !== '#') {
									o[tmp.id] = true;
									p.push(tmp.id);
								}
								for(k = 0, l = tmp.parents.length; k < l; k++) {
									if(o[tmp.parents[k]] === undefined && tmp.parents[k] !== '#') {
										o[tmp.parents[k]] = true;
										p.push(tmp.parents[k]);
									}
								}
							}
						}
						else {
							for(i = 0, j = tmp.children_d.length; i < j; i++) {
								tmp2 = m[tmp.children_d[i]];
								if(!tmp2.state.loaded && tmp2.original && tmp2.original.state && tmp2.original.state.undetermined && tmp2.original.state.undetermined === true) {
									if(o[tmp2.id] === undefined && tmp2.id !== '#') {
										o[tmp2.id] = true;
										p.push(tmp2.id);
									}
									for(k = 0, l = tmp2.parents.length; k < l; k++) {
										if(o[tmp2.parents[k]] === undefined && tmp2.parents[k] !== '#') {
											o[tmp2.parents[k]] = true;
											p.push(tmp2.parents[k]);
										}
									}
								}
							}
						}
					});

				this.element.find('.jstree-undetermined').removeClass('jstree-undetermined');
				for(i = 0, j = p.length; i < j; i++) {
					if(!m[p[i]].state[ t ? 'selected' : 'checked' ]) {
						s = this.get_node(p[i], true);
						if(s && s.length) {
							s.children('.jstree-anchor').children('.jstree-checkbox').addClass('jstree-undetermined');
						}
					}
				}
			};
			this.redraw_node = function(obj, deep, is_callback, force_render) {
				obj = parent.redraw_node.apply(this, arguments);
				if(obj) {
					var i, j, tmp = null;
					for(i = 0, j = obj.childNodes.length; i < j; i++) {
						if(obj.childNodes[i] && obj.childNodes[i].className && obj.childNodes[i].className.indexOf("jstree-anchor") !== -1) {
							tmp = obj.childNodes[i];
							break;
						}
					}
					if(tmp) {
						if(!this.settings.checkbox.tie_selection && this._model.data[obj.id].state.checked) { tmp.className += ' jstree-checked'; }
						tmp.insertBefore(_i.cloneNode(false), tmp.childNodes[0]);
					}
				}
				if(!is_callback && this.settings.checkbox.cascade.indexOf('undetermined') !== -1) {
					if(this._data.checkbox.uto) { clearTimeout(this._data.checkbox.uto); }
					this._data.checkbox.uto = setTimeout($.proxy(this._undetermined, this), 50);
				}
				return obj;
			};
			/**
			 * show the node checkbox icons
			 * @name show_checkboxes()
			 * @plugin checkbox
			 */
			this.show_checkboxes = function () { this._data.core.themes.checkboxes = true; this.get_container_ul().removeClass("jstree-no-checkboxes"); };
			/**
			 * hide the node checkbox icons
			 * @name hide_checkboxes()
			 * @plugin checkbox
			 */
			this.hide_checkboxes = function () { this._data.core.themes.checkboxes = false; this.get_container_ul().addClass("jstree-no-checkboxes"); };
			/**
			 * toggle the node icons
			 * @name toggle_checkboxes()
			 * @plugin checkbox
			 */
			this.toggle_checkboxes = function () { if(this._data.core.themes.checkboxes) { this.hide_checkboxes(); } else { this.show_checkboxes(); } };
			/**
			 * checks if a node is in an undetermined state
			 * @name is_undetermined(obj)
			 * @param  {mixed} obj
			 * @return {Boolean}
			 */
			this.is_undetermined = function (obj) {
				obj = this.get_node(obj);
				var s = this.settings.checkbox.cascade, i, j, t = this.settings.checkbox.tie_selection, d = this._data[ t ? 'core' : 'checkbox' ].selected, m = this._model.data;
				if(!obj || obj.state[ t ? 'selected' : 'checked' ] === true || s.indexOf('undetermined') === -1 || (s.indexOf('down') === -1 && s.indexOf('up') === -1)) {
					return false;
				}
				if(!obj.state.loaded && obj.original.state.undetermined === true) {
					return true;
				}
				for(i = 0, j = obj.children_d.length; i < j; i++) {
					if($.inArray(obj.children_d[i], d) !== -1 || (!m[obj.children_d[i]].state.loaded && m[obj.children_d[i]].original.state.undetermined)) {
						return true;
					}
				}
				return false;
			};

			this.activate_node = function (obj, e) {
				if(this.settings.checkbox.tie_selection && (this.settings.checkbox.whole_node || $(e.target).hasClass('jstree-checkbox'))) {
					e.ctrlKey = true;
				}
				if(this.settings.checkbox.tie_selection || (!this.settings.checkbox.whole_node && !$(e.target).hasClass('jstree-checkbox'))) {
					return parent.activate_node.call(this, obj, e);
				}
				if(this.is_disabled(obj)) {
					return false;
				}
				if(this.is_checked(obj)) {
					this.uncheck_node(obj, e);
				}
				else {
					this.check_node(obj, e);
				}
				this.trigger('activate_node', { 'node' : this.get_node(obj) });
			};

			/**
			 * check a node (only if tie_selection in checkbox settings is false, otherwise select_node will be called internally)
			 * @name check_node(obj)
			 * @param {mixed} obj an array can be used to check multiple nodes
			 * @trigger check_node.jstree
			 * @plugin checkbox
			 */
			this.check_node = function (obj, e) {
				if(this.settings.checkbox.tie_selection) { return this.select_node(obj, false, true, e); }
				var dom, t1, t2, th;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.check_node(obj[t1], e);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				dom = this.get_node(obj, true);
				if(!obj.state.checked) {
					obj.state.checked = true;
					this._data.checkbox.selected.push(obj.id);
					if(dom && dom.length) {
						dom.children('.jstree-anchor').addClass('jstree-checked');
					}
					/**
					 * triggered when an node is checked (only if tie_selection in checkbox settings is false)
					 * @event
					 * @name check_node.jstree
					 * @param {Object} node
					 * @param {Array} selected the current selection
					 * @param {Object} event the event (if any) that triggered this check_node
					 * @plugin checkbox
					 */
					this.trigger('check_node', { 'node' : obj, 'selected' : this._data.checkbox.selected, 'event' : e });
				}
			};
			/**
			 * uncheck a node (only if tie_selection in checkbox settings is false, otherwise deselect_node will be called internally)
			 * @name uncheck_node(obj)
			 * @param {mixed} obj an array can be used to uncheck multiple nodes
			 * @trigger uncheck_node.jstree
			 * @plugin checkbox
			 */
			this.uncheck_node = function (obj, e) {
				if(this.settings.checkbox.tie_selection) { return this.deselect_node(obj, false, e); }
				var t1, t2, dom;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.uncheck_node(obj[t1], e);
					}
					return true;
				}
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') {
					return false;
				}
				dom = this.get_node(obj, true);
				if(obj.state.checked) {
					obj.state.checked = false;
					this._data.checkbox.selected = $.vakata.array_remove_item(this._data.checkbox.selected, obj.id);
					if(dom.length) {
						dom.children('.jstree-anchor').removeClass('jstree-checked');
					}
					/**
					 * triggered when an node is unchecked (only if tie_selection in checkbox settings is false)
					 * @event
					 * @name uncheck_node.jstree
					 * @param {Object} node
					 * @param {Array} selected the current selection
					 * @param {Object} event the event (if any) that triggered this uncheck_node
					 * @plugin checkbox
					 */
					this.trigger('uncheck_node', { 'node' : obj, 'selected' : this._data.checkbox.selected, 'event' : e });
				}
			};
			/**
			 * checks all nodes in the tree (only if tie_selection in checkbox settings is false, otherwise select_all will be called internally)
			 * @name check_all()
			 * @trigger check_all.jstree, changed.jstree
			 * @plugin checkbox
			 */
			this.check_all = function () {
				if(this.settings.checkbox.tie_selection) { return this.select_all(); }
				var tmp = this._data.checkbox.selected.concat([]), i, j;
				this._data.checkbox.selected = this._model.data['#'].children_d.concat();
				for(i = 0, j = this._data.checkbox.selected.length; i < j; i++) {
					if(this._model.data[this._data.checkbox.selected[i]]) {
						this._model.data[this._data.checkbox.selected[i]].state.checked = true;
					}
				}
				this.redraw(true);
				/**
				 * triggered when all nodes are checked (only if tie_selection in checkbox settings is false)
				 * @event
				 * @name check_all.jstree
				 * @param {Array} selected the current selection
				 * @plugin checkbox
				 */
				this.trigger('check_all', { 'selected' : this._data.checkbox.selected });
			};
			/**
			 * uncheck all checked nodes (only if tie_selection in checkbox settings is false, otherwise deselect_all will be called internally)
			 * @name uncheck_all()
			 * @trigger uncheck_all.jstree
			 * @plugin checkbox
			 */
			this.uncheck_all = function () {
				if(this.settings.checkbox.tie_selection) { return this.deselect_all(); }
				var tmp = this._data.checkbox.selected.concat([]), i, j;
				for(i = 0, j = this._data.checkbox.selected.length; i < j; i++) {
					if(this._model.data[this._data.checkbox.selected[i]]) {
						this._model.data[this._data.checkbox.selected[i]].state.checked = false;
					}
				}
				this._data.checkbox.selected = [];
				this.element.find('.jstree-checked').removeClass('jstree-checked');
				/**
				 * triggered when all nodes are unchecked (only if tie_selection in checkbox settings is false)
				 * @event
				 * @name uncheck_all.jstree
				 * @param {Object} node the previous selection
				 * @param {Array} selected the current selection
				 * @plugin checkbox
				 */
				this.trigger('uncheck_all', { 'selected' : this._data.checkbox.selected, 'node' : tmp });
			};
			/**
			 * checks if a node is checked (if tie_selection is on in the settings this function will return the same as is_selected)
			 * @name is_checked(obj)
			 * @param  {mixed}  obj
			 * @return {Boolean}
			 * @plugin checkbox
			 */
			this.is_checked = function (obj) {
				if(this.settings.checkbox.tie_selection) { return this.is_selected(obj); }
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }
				return obj.state.checked;
			};
			/**
			 * get an array of all checked nodes (if tie_selection is on in the settings this function will return the same as get_selected)
			 * @name get_checked([full])
			 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
			 * @return {Array}
			 * @plugin checkbox
			 */
			this.get_checked = function (full) {
				if(this.settings.checkbox.tie_selection) { return this.get_selected(full); }
				return full ? $.map(this._data.checkbox.selected, $.proxy(function (i) { return this.get_node(i); }, this)) : this._data.checkbox.selected;
			};
			/**
			 * get an array of all top level checked nodes (ignoring children of checked nodes) (if tie_selection is on in the settings this function will return the same as get_top_selected)
			 * @name get_top_checked([full])
			 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
			 * @return {Array}
			 * @plugin checkbox
			 */
			this.get_top_checked = function (full) {
				if(this.settings.checkbox.tie_selection) { return this.get_top_selected(full); }
				var tmp = this.get_checked(true),
					obj = {}, i, j, k, l;
				for(i = 0, j = tmp.length; i < j; i++) {
					obj[tmp[i].id] = tmp[i];
				}
				for(i = 0, j = tmp.length; i < j; i++) {
					for(k = 0, l = tmp[i].children_d.length; k < l; k++) {
						if(obj[tmp[i].children_d[k]]) {
							delete obj[tmp[i].children_d[k]];
						}
					}
				}
				tmp = [];
				for(i in obj) {
					if(obj.hasOwnProperty(i)) {
						tmp.push(i);
					}
				}
				return full ? $.map(tmp, $.proxy(function (i) { return this.get_node(i); }, this)) : tmp;
			};
			/**
			 * get an array of all bottom level checked nodes (ignoring selected parents) (if tie_selection is on in the settings this function will return the same as get_bottom_selected)
			 * @name get_bottom_checked([full])
			 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
			 * @return {Array}
			 * @plugin checkbox
			 */
			this.get_bottom_checked = function (full) {
				if(this.settings.checkbox.tie_selection) { return this.get_bottom_selected(full); }
				var tmp = this.get_checked(true),
					obj = [], i, j;
				for(i = 0, j = tmp.length; i < j; i++) {
					if(!tmp[i].children.length) {
						obj.push(tmp[i].id);
					}
				}
				return full ? $.map(obj, $.proxy(function (i) { return this.get_node(i); }, this)) : obj;
			};
			this.load_node = function (obj, callback) {
				var k, l, i, j, c, tmp;
				if(!$.isArray(obj) && !this.settings.checkbox.tie_selection) {
					tmp = this.get_node(obj);
					if(tmp && tmp.state.loaded) {
						for(k = 0, l = tmp.children_d.length; k < l; k++) {
							if(this._model.data[tmp.children_d[k]].state.checked) {
								c = true;
								this._data.checkbox.selected = $.vakata.array_remove_item(this._data.checkbox.selected, tmp.children_d[k]);
							}
						}
					}
				}
				return parent.load_node.apply(this, arguments);
			};
			this.get_state = function () {
				var state = parent.get_state.apply(this, arguments);
				if(this.settings.checkbox.tie_selection) { return state; }
				state.checkbox = this._data.checkbox.selected.slice();
				return state;
			};
			this.set_state = function (state, callback) {
				var res = parent.set_state.apply(this, arguments);
				if(res && state.checkbox) {
					if(!this.settings.checkbox.tie_selection) {
						this.uncheck_all();
						var _this = this;
						$.each(state.checkbox, function (i, v) {
							_this.check_node(v);
						});
					}
					delete state.checkbox;
					this.set_state(state, callback);
					return false;
				}
				return res;
			};
		};

		// include the checkbox plugin by default
		// $.jstree.defaults.plugins.push("checkbox");

	/**
	 * ### Contextmenu plugin
	 *
	 * Shows a context menu when a node is right-clicked.
	 */

		/**
		 * stores all defaults for the contextmenu plugin
		 * @name $.jstree.defaults.contextmenu
		 * @plugin contextmenu
		 */
		$.jstree.defaults.contextmenu = {
			/**
			 * a boolean indicating if the node should be selected when the context menu is invoked on it. Defaults to `true`.
			 * @name $.jstree.defaults.contextmenu.select_node
			 * @plugin contextmenu
			 */
			select_node : true,
			/**
			 * a boolean indicating if the menu should be shown aligned with the node. Defaults to `true`, otherwise the mouse coordinates are used.
			 * @name $.jstree.defaults.contextmenu.show_at_node
			 * @plugin contextmenu
			 */
			show_at_node : true,
			/**
			 * an object of actions, or a function that accepts a node and a callback function and calls the callback function with an object of actions available for that node (you can also return the items too).
			 *
			 * Each action consists of a key (a unique name) and a value which is an object with the following properties (only label and action are required):
			 *
			 * * `separator_before` - a boolean indicating if there should be a separator before this item
			 * * `separator_after` - a boolean indicating if there should be a separator after this item
			 * * `_disabled` - a boolean indicating if this action should be disabled
			 * * `label` - a string - the name of the action (could be a function returning a string)
			 * * `action` - a function to be executed if this item is chosen
			 * * `icon` - a string, can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class
			 * * `shortcut` - keyCode which will trigger the action if the menu is open (for example `113` for rename, which equals F2)
			 * * `shortcut_label` - shortcut label (like for example `F2` for rename)
			 *
			 * @name $.jstree.defaults.contextmenu.items
			 * @plugin contextmenu
			 */
			items : function (o, cb) { // Could be an object directly
				return {
					"create" : {
						"separator_before"	: false,
						"separator_after"	: true,
						"_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
						"label"				: "Create",
						"action"			: function (data) {
							var inst = $.jstree.reference(data.reference),
								obj = inst.get_node(data.reference);
							inst.create_node(obj, {}, "last", function (new_node) {
								setTimeout(function () { inst.edit(new_node); },0);
							});
						}
					},
					"rename" : {
						"separator_before"	: false,
						"separator_after"	: false,
						"_disabled"			: false, //(this.check("rename_node", data.reference, this.get_parent(data.reference), "")),
						"label"				: "Rename",
						/*
						"shortcut"			: 113,
						"shortcut_label"	: 'F2',
						"icon"				: "glyphicon glyphicon-leaf",
						*/
						"action"			: function (data) {
							var inst = $.jstree.reference(data.reference),
								obj = inst.get_node(data.reference);
							inst.edit(obj);
						}
					},
					"remove" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"_disabled"			: false, //(this.check("delete_node", data.reference, this.get_parent(data.reference), "")),
						"label"				: "Delete",
						"action"			: function (data) {
							var inst = $.jstree.reference(data.reference),
								obj = inst.get_node(data.reference);
							if(inst.is_selected(obj)) {
								inst.delete_node(inst.get_selected());
							}
							else {
								inst.delete_node(obj);
							}
						}
					},
					"ccp" : {
						"separator_before"	: true,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Edit",
						"action"			: false,
						"submenu" : {
							"cut" : {
								"separator_before"	: false,
								"separator_after"	: false,
								"label"				: "Cut",
								"action"			: function (data) {
									var inst = $.jstree.reference(data.reference),
										obj = inst.get_node(data.reference);
									if(inst.is_selected(obj)) {
										inst.cut(inst.get_top_selected());
									}
									else {
										inst.cut(obj);
									}
								}
							},
							"copy" : {
								"separator_before"	: false,
								"icon"				: false,
								"separator_after"	: false,
								"label"				: "Copy",
								"action"			: function (data) {
									var inst = $.jstree.reference(data.reference),
										obj = inst.get_node(data.reference);
									if(inst.is_selected(obj)) {
										inst.copy(inst.get_top_selected());
									}
									else {
										inst.copy(obj);
									}
								}
							},
							"paste" : {
								"separator_before"	: false,
								"icon"				: false,
								"_disabled"			: function (data) {
									return !$.jstree.reference(data.reference).can_paste();
								},
								"separator_after"	: false,
								"label"				: "Paste",
								"action"			: function (data) {
									var inst = $.jstree.reference(data.reference),
										obj = inst.get_node(data.reference);
									inst.paste(obj);
								}
							}
						}
					}
				};
			}
		};

		$.jstree.plugins.contextmenu = function (options, parent) {
			this.bind = function () {
				parent.bind.call(this);

				var last_ts = 0, cto = null, ex, ey;
				this.element
					.on("contextmenu.jstree", ".jstree-anchor", $.proxy(function (e, data) {
							e.preventDefault();
							last_ts = e.ctrlKey ? +new Date() : 0;
							if(data || cto) {
								last_ts = (+new Date()) + 10000;
							}
							if(cto) {
								clearTimeout(cto);
							}
							if(!this.is_loading(e.currentTarget)) {
								this.show_contextmenu(e.currentTarget, e.pageX, e.pageY, e);
							}
						}, this))
					.on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
							if(this._data.contextmenu.visible && (!last_ts || (+new Date()) - last_ts > 250)) { // work around safari & macOS ctrl+click
								$.vakata.context.hide();
							}
							last_ts = 0;
						}, this))
					.on("touchstart.jstree", ".jstree-anchor", function (e) {
							if(!e.originalEvent || !e.originalEvent.changedTouches || !e.originalEvent.changedTouches[0]) {
								return;
							}
							ex = e.pageX;
							ey = e.pageY;
							cto = setTimeout(function () {
								$(e.currentTarget).trigger('contextmenu', true);
							}, 750);
						})
					.on('touchmove.vakata.jstree', function (e) {
							if(cto && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0] && (Math.abs(ex - e.pageX) > 50 || Math.abs(ey - e.pageY) > 50)) {
								clearTimeout(cto);
							}
						})
					.on('touchend.vakata.jstree', function (e) {
							if(cto) {
								clearTimeout(cto);
							}
						});

				/*
				if(!('oncontextmenu' in document.body) && ('ontouchstart' in document.body)) {
					var el = null, tm = null;
					this.element
						.on("touchstart", ".jstree-anchor", function (e) {
							el = e.currentTarget;
							tm = +new Date();
							$(document).one("touchend", function (e) {
								e.target = document.elementFromPoint(e.originalEvent.targetTouches[0].pageX - window.pageXOffset, e.originalEvent.targetTouches[0].pageY - window.pageYOffset);
								e.currentTarget = e.target;
								tm = ((+(new Date())) - tm);
								if(e.target === el && tm > 600 && tm < 1000) {
									e.preventDefault();
									$(el).trigger('contextmenu', e);
								}
								el = null;
								tm = null;
							});
						});
				}
				*/
				$(document).on("context_hide.vakata.jstree", $.proxy(function () { this._data.contextmenu.visible = false; }, this));
			};
			this.teardown = function () {
				if(this._data.contextmenu.visible) {
					$.vakata.context.hide();
				}
				parent.teardown.call(this);
			};

			/**
			 * prepare and show the context menu for a node
			 * @name show_contextmenu(obj [, x, y])
			 * @param {mixed} obj the node
			 * @param {Number} x the x-coordinate relative to the document to show the menu at
			 * @param {Number} y the y-coordinate relative to the document to show the menu at
			 * @param {Object} e the event if available that triggered the contextmenu
			 * @plugin contextmenu
			 * @trigger show_contextmenu.jstree
			 */
			this.show_contextmenu = function (obj, x, y, e) {
				obj = this.get_node(obj);
				if(!obj || obj.id === '#') { return false; }
				var s = this.settings.contextmenu,
					d = this.get_node(obj, true),
					a = d.children(".jstree-anchor"),
					o = false,
					i = false;
				if(s.show_at_node || x === undefined || y === undefined) {
					o = a.offset();
					x = o.left;
					y = o.top + this._data.core.li_height;
				}
				if(this.settings.contextmenu.select_node && !this.is_selected(obj)) {
					this.activate_node(obj, e);
				}

				i = s.items;
				if($.isFunction(i)) {
					i = i.call(this, obj, $.proxy(function (i) {
						this._show_contextmenu(obj, x, y, i);
					}, this));
				}
				if($.isPlainObject(i)) {
					this._show_contextmenu(obj, x, y, i);
				}
			};
			/**
			 * show the prepared context menu for a node
			 * @name _show_contextmenu(obj, x, y, i)
			 * @param {mixed} obj the node
			 * @param {Number} x the x-coordinate relative to the document to show the menu at
			 * @param {Number} y the y-coordinate relative to the document to show the menu at
			 * @param {Number} i the object of items to show
			 * @plugin contextmenu
			 * @trigger show_contextmenu.jstree
			 * @private
			 */
			this._show_contextmenu = function (obj, x, y, i) {
				var d = this.get_node(obj, true),
					a = d.children(".jstree-anchor");
				$(document).one("context_show.vakata.jstree", $.proxy(function (e, data) {
					var cls = 'jstree-contextmenu jstree-' + this.get_theme() + '-contextmenu';
					$(data.element).addClass(cls);
				}, this));
				this._data.contextmenu.visible = true;
				$.vakata.context.show(a, { 'x' : x, 'y' : y }, i);
				/**
				 * triggered when the contextmenu is shown for a node
				 * @event
				 * @name show_contextmenu.jstree
				 * @param {Object} node the node
				 * @param {Number} x the x-coordinate of the menu relative to the document
				 * @param {Number} y the y-coordinate of the menu relative to the document
				 * @plugin contextmenu
				 */
				this.trigger('show_contextmenu', { "node" : obj, "x" : x, "y" : y });
			};
		};

		// contextmenu helper
		(function ($) {
			var right_to_left = false,
				vakata_context = {
					element		: false,
					reference	: false,
					position_x	: 0,
					position_y	: 0,
					items		: [],
					html		: "",
					is_visible	: false
				};

			$.vakata.context = {
				settings : {
					hide_onmouseleave	: 0,
					icons				: true
				},
				_trigger : function (event_name) {
					$(document).triggerHandler("context_" + event_name + ".vakata", {
						"reference"	: vakata_context.reference,
						"element"	: vakata_context.element,
						"position"	: {
							"x" : vakata_context.position_x,
							"y" : vakata_context.position_y
						}
					});
				},
				_execute : function (i) {
					i = vakata_context.items[i];
					return i && (!i._disabled || ($.isFunction(i._disabled) && !i._disabled({ "item" : i, "reference" : vakata_context.reference, "element" : vakata_context.element }))) && i.action ? i.action.call(null, {
								"item"		: i,
								"reference"	: vakata_context.reference,
								"element"	: vakata_context.element,
								"position"	: {
									"x" : vakata_context.position_x,
									"y" : vakata_context.position_y
								}
							}) : false;
				},
				_parse : function (o, is_callback) {
					if(!o) { return false; }
					if(!is_callback) {
						vakata_context.html		= "";
						vakata_context.items	= [];
					}
					var str = "",
						sep = false,
						tmp;

					if(is_callback) { str += "<"+"ul>"; }
					$.each(o, function (i, val) {
						if(!val) { return true; }
						vakata_context.items.push(val);
						if(!sep && val.separator_before) {
							str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
						}
						sep = false;
						str += "<"+"li class='" + (val._class || "") + (val._disabled === true || ($.isFunction(val._disabled) && val._disabled({ "item" : val, "reference" : vakata_context.reference, "element" : vakata_context.element })) ? " vakata-contextmenu-disabled " : "") + "' "+(val.shortcut?" data-shortcut='"+val.shortcut+"' ":'')+">";
						str += "<"+"a href='#' rel='" + (vakata_context.items.length - 1) + "'>";
						if($.vakata.context.settings.icons) {
							str += "<"+"i ";
							if(val.icon) {
								if(val.icon.indexOf("/") !== -1 || val.icon.indexOf(".") !== -1) { str += " style='background:url(\"" + val.icon + "\") center center no-repeat' "; }
								else { str += " class='" + val.icon + "' "; }
							}
							str += "><"+"/i><"+"span class='vakata-contextmenu-sep'>&#160;<"+"/span>";
						}
						str += ($.isFunction(val.label) ? val.label({ "item" : i, "reference" : vakata_context.reference, "element" : vakata_context.element }) : val.label) + (val.shortcut?' <span class="vakata-contextmenu-shortcut vakata-contextmenu-shortcut-'+val.shortcut+'">'+ (val.shortcut_label || '') +'</span>':'') + "<"+"/a>";
						if(val.submenu) {
							tmp = $.vakata.context._parse(val.submenu, true);
							if(tmp) { str += tmp; }
						}
						str += "<"+"/li>";
						if(val.separator_after) {
							str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
							sep = true;
						}
					});
					str  = str.replace(/<li class\='vakata-context-separator'\><\/li\>$/,"");
					if(is_callback) { str += "</ul>"; }
					/**
					 * triggered on the document when the contextmenu is parsed (HTML is built)
					 * @event
					 * @plugin contextmenu
					 * @name context_parse.vakata
					 * @param {jQuery} reference the element that was right clicked
					 * @param {jQuery} element the DOM element of the menu itself
					 * @param {Object} position the x & y coordinates of the menu
					 */
					if(!is_callback) { vakata_context.html = str; $.vakata.context._trigger("parse"); }
					return str.length > 10 ? str : false;
				},
				_show_submenu : function (o) {
					o = $(o);
					if(!o.length || !o.children("ul").length) { return; }
					var e = o.children("ul"),
						x = o.offset().left + o.outerWidth(),
						y = o.offset().top,
						w = e.width(),
						h = e.height(),
						dw = $(window).width() + $(window).scrollLeft(),
						dh = $(window).height() + $(window).scrollTop();
					// може да се спести е една проверка - дали няма някой от класовете вече нагоре
					if(right_to_left) {
						o[x - (w + 10 + o.outerWidth()) < 0 ? "addClass" : "removeClass"]("vakata-context-left");
					}
					else {
						o[x + w + 10 > dw ? "addClass" : "removeClass"]("vakata-context-right");
					}
					if(y + h + 10 > dh) {
						e.css("bottom","-1px");
					}
					e.show();
				},
				show : function (reference, position, data) {
					var o, e, x, y, w, h, dw, dh, cond = true;
					if(vakata_context.element && vakata_context.element.length) {
						vakata_context.element.width('');
					}
					switch(cond) {
						case (!position && !reference):
							return false;
						case (!!position && !!reference):
							vakata_context.reference	= reference;
							vakata_context.position_x	= position.x;
							vakata_context.position_y	= position.y;
							break;
						case (!position && !!reference):
							vakata_context.reference	= reference;
							o = reference.offset();
							vakata_context.position_x	= o.left + reference.outerHeight();
							vakata_context.position_y	= o.top;
							break;
						case (!!position && !reference):
							vakata_context.position_x	= position.x;
							vakata_context.position_y	= position.y;
							break;
					}
					if(!!reference && !data && $(reference).data('vakata_contextmenu')) {
						data = $(reference).data('vakata_contextmenu');
					}
					if($.vakata.context._parse(data)) {
						vakata_context.element.html(vakata_context.html);
					}
					if(vakata_context.items.length) {
						vakata_context.element.appendTo("body");
						e = vakata_context.element;
						x = vakata_context.position_x;
						y = vakata_context.position_y;
						w = e.width();
						h = e.height();
						dw = $(window).width() + $(window).scrollLeft();
						dh = $(window).height() + $(window).scrollTop();
						if(right_to_left) {
							x -= (e.outerWidth() - $(reference).outerWidth());
							if(x < $(window).scrollLeft() + 20) {
								x = $(window).scrollLeft() + 20;
							}
						}
						if(x + w + 20 > dw) {
							x = dw - (w + 20);
						}
						if(y + h + 20 > dh) {
							y = dh - (h + 20);
						}

						vakata_context.element
							.css({ "left" : x, "top" : y })
							.show()
							.find('a').first().focus().parent().addClass("vakata-context-hover");
						vakata_context.is_visible = true;
						/**
						 * triggered on the document when the contextmenu is shown
						 * @event
						 * @plugin contextmenu
						 * @name context_show.vakata
						 * @param {jQuery} reference the element that was right clicked
						 * @param {jQuery} element the DOM element of the menu itself
						 * @param {Object} position the x & y coordinates of the menu
						 */
						$.vakata.context._trigger("show");
					}
				},
				hide : function () {
					if(vakata_context.is_visible) {
						vakata_context.element.hide().find("ul").hide().end().find(':focus').blur().end().detach();
						vakata_context.is_visible = false;
						/**
						 * triggered on the document when the contextmenu is hidden
						 * @event
						 * @plugin contextmenu
						 * @name context_hide.vakata
						 * @param {jQuery} reference the element that was right clicked
						 * @param {jQuery} element the DOM element of the menu itself
						 * @param {Object} position the x & y coordinates of the menu
						 */
						$.vakata.context._trigger("hide");
					}
				}
			};
			$(function () {
				right_to_left = $("body").css("direction") === "rtl";
				var to = false;

				vakata_context.element = $("<ul class='vakata-context'></ul>");
				vakata_context.element
					.on("mouseenter", "li", function (e) {
						e.stopImmediatePropagation();

						if($.contains(this, e.relatedTarget)) {
							// премахнато заради delegate mouseleave по-долу
							// $(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
							return;
						}

						if(to) { clearTimeout(to); }
						vakata_context.element.find(".vakata-context-hover").removeClass("vakata-context-hover").end();

						$(this)
							.siblings().find("ul").hide().end().end()
							.parentsUntil(".vakata-context", "li").addBack().addClass("vakata-context-hover");
						$.vakata.context._show_submenu(this);
					})
					// тестово - дали не натоварва?
					.on("mouseleave", "li", function (e) {
						if($.contains(this, e.relatedTarget)) { return; }
						$(this).find(".vakata-context-hover").addBack().removeClass("vakata-context-hover");
					})
					.on("mouseleave", function (e) {
						$(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
						if($.vakata.context.settings.hide_onmouseleave) {
							to = setTimeout(
								(function (t) {
									return function () { $.vakata.context.hide(); };
								}(this)), $.vakata.context.settings.hide_onmouseleave);
						}
					})
					.on("click", "a", function (e) {
						e.preventDefault();
					//})
					//.on("mouseup", "a", function (e) {
						if(!$(this).blur().parent().hasClass("vakata-context-disabled") && $.vakata.context._execute($(this).attr("rel")) !== false) {
							$.vakata.context.hide();
						}
					})
					.on('keydown', 'a', function (e) {
							var o = null;
							switch(e.which) {
								case 13:
								case 32:
									e.type = "mouseup";
									e.preventDefault();
									$(e.currentTarget).trigger(e);
									break;
								case 37:
									if(vakata_context.is_visible) {
										vakata_context.element.find(".vakata-context-hover").last().closest("li").first().find("ul").hide().find(".vakata-context-hover").removeClass("vakata-context-hover").end().end().children('a').focus();
										e.stopImmediatePropagation();
										e.preventDefault();
									}
									break;
								case 38:
									if(vakata_context.is_visible) {
										o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").prevAll("li:not(.vakata-context-separator)").first();
										if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").last(); }
										o.addClass("vakata-context-hover").children('a').focus();
										e.stopImmediatePropagation();
										e.preventDefault();
									}
									break;
								case 39:
									if(vakata_context.is_visible) {
										vakata_context.element.find(".vakata-context-hover").last().children("ul").show().children("li:not(.vakata-context-separator)").removeClass("vakata-context-hover").first().addClass("vakata-context-hover").children('a').focus();
										e.stopImmediatePropagation();
										e.preventDefault();
									}
									break;
								case 40:
									if(vakata_context.is_visible) {
										o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").nextAll("li:not(.vakata-context-separator)").first();
										if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").first(); }
										o.addClass("vakata-context-hover").children('a').focus();
										e.stopImmediatePropagation();
										e.preventDefault();
									}
									break;
								case 27:
									$.vakata.context.hide();
									e.preventDefault();
									break;
								default:
									//console.log(e.which);
									break;
							}
						})
					.on('keydown', function (e) {
						e.preventDefault();
						var a = vakata_context.element.find('.vakata-contextmenu-shortcut-' + e.which).parent();
						if(a.parent().not('.vakata-context-disabled')) {
							a.click();
						}
					});

				$(document)
					.on("mousedown.vakata.jstree", function (e) {
						if(vakata_context.is_visible && !$.contains(vakata_context.element[0], e.target)) {
							$.vakata.context.hide();
						}
					})
					.on("context_show.vakata.jstree", function (e, data) {
						vakata_context.element.find("li:has(ul)").children("a").addClass("vakata-context-parent");
						if(right_to_left) {
							vakata_context.element.addClass("vakata-context-rtl").css("direction", "rtl");
						}
						// also apply a RTL class?
						vakata_context.element.find("ul").hide().end();
					});
			});
		}($));
		// $.jstree.defaults.plugins.push("contextmenu");

	/**
	 * ### Drag'n'drop plugin
	 *
	 * Enables dragging and dropping of nodes in the tree, resulting in a move or copy operations.
	 */

		/**
		 * stores all defaults for the drag'n'drop plugin
		 * @name $.jstree.defaults.dnd
		 * @plugin dnd
		 */
		$.jstree.defaults.dnd = {
			/**
			 * a boolean indicating if a copy should be possible while dragging (by pressint the meta key or Ctrl). Defaults to `true`.
			 * @name $.jstree.defaults.dnd.copy
			 * @plugin dnd
			 */
			copy : true,
			/**
			 * a number indicating how long a node should remain hovered while dragging to be opened. Defaults to `500`.
			 * @name $.jstree.defaults.dnd.open_timeout
			 * @plugin dnd
			 */
			open_timeout : 500,
			/**
			 * a function invoked each time a node is about to be dragged, invoked in the tree's scope and receives the nodes about to be dragged as an argument (array) - return `false` to prevent dragging
			 * @name $.jstree.defaults.dnd.is_draggable
			 * @plugin dnd
			 */
			is_draggable : true,
			/**
			 * a boolean indicating if checks should constantly be made while the user is dragging the node (as opposed to checking only on drop), default is `true`
			 * @name $.jstree.defaults.dnd.check_while_dragging
			 * @plugin dnd
			 */
			check_while_dragging : true,
			/**
			 * a boolean indicating if nodes from this tree should only be copied with dnd (as opposed to moved), default is `false`
			 * @name $.jstree.defaults.dnd.always_copy
			 * @plugin dnd
			 */
			always_copy : false,
			/**
			 * when dropping a node "inside", this setting indicates the position the node should go to - it can be an integer or a string: "first" (same as 0) or "last", default is `0`
			 * @name $.jstree.defaults.dnd.inside_pos
			 * @plugin dnd
			 */
			inside_pos : 0,
			/**
			 * when starting the drag on a node that is selected this setting controls if all selected nodes are dragged or only the single node, default is `true`, which means all selected nodes are dragged when the drag is started on a selected node
			 * @name $.jstree.defaults.dnd.drag_selection
			 * @plugin dnd
			 */
			drag_selection : true,
			/**
			 * controls whether dnd works on touch devices. If left as boolean true dnd will work the same as in desktop browsers, which in some cases may impair scrolling. If set to boolean false dnd will not work on touch devices. There is a special third option - string "selected" which means only selected nodes can be dragged on touch devices.
			 * @name $.jstree.defaults.dnd.touch
			 * @plugin dnd
			 */
			touch : true,
			/**
			 * controls whether items can be dropped anywhere on the node, not just on the anchor, by default only the node anchor is a valid drop target. Works best with the wholerow plugin. If enabled on mobile depending on the interface it might be hard for the user to cancel the drop, since the whole tree container will be a valid drop target.
			 * @name $.jstree.defaults.dnd.large_drop_target
			 * @plugin dnd
			 */
			large_drop_target : false,
			/**
			 * controls whether a drag can be initiated from any part of the node and not just the text/icon part, works best with the wholerow plugin. Keep in mind it can cause problems with tree scrolling on mobile depending on the interface - in that case set the touch option to "selected".
			 * @name $.jstree.defaults.dnd.large_drag_target
			 * @plugin dnd
			 */
			large_drag_target : false
		};
		// TODO: now check works by checking for each node individually, how about max_children, unique, etc?
		$.jstree.plugins.dnd = function (options, parent) {
			this.bind = function () {
				parent.bind.call(this);

				this.element
					.on('mousedown.jstree touchstart.jstree', this.settings.dnd.large_drag_target ? '.jstree-node' : '.jstree-anchor', $.proxy(function (e) {
						if(this.settings.dnd.large_drag_target && $(e.target).closest('.jstree-node')[0] !== e.currentTarget) {
							return true;
						}
						if(e.type === "touchstart" && (!this.settings.dnd.touch || (this.settings.dnd.touch === 'selected' && !$(e.currentTarget).closest('.jstree-node').children('.jstree-anchor').hasClass('jstree-clicked')))) {
							return true;
						}
						var obj = this.get_node(e.target),
							mlt = this.is_selected(obj) && this.settings.dnd.drag_selection ? this.get_top_selected().length : 1,
							txt = (mlt > 1 ? mlt + ' ' + this.get_string('nodes') : this.get_text(e.currentTarget));
						if(this.settings.core.force_text) {
							txt = $.vakata.html.escape(txt);
						}
						if(obj && obj.id && obj.id !== "#" && (e.which === 1 || e.type === "touchstart") &&
							(this.settings.dnd.is_draggable === true || ($.isFunction(this.settings.dnd.is_draggable) && this.settings.dnd.is_draggable.call(this, (mlt > 1 ? this.get_top_selected(true) : [obj]))))
						) {
							this.element.trigger('mousedown.jstree');
							return $.vakata.dnd.start(e, { 'jstree' : true, 'origin' : this, 'obj' : this.get_node(obj,true), 'nodes' : mlt > 1 ? this.get_top_selected() : [obj.id] }, '<div id="jstree-dnd" class="jstree-' + this.get_theme() + ' jstree-' + this.get_theme() + '-' + this.get_theme_variant() + ' ' + ( this.settings.core.themes.responsive ? ' jstree-dnd-responsive' : '' ) + '"><i class="jstree-icon jstree-er"></i>' + txt + '<ins class="jstree-copy" style="display:none;">+</ins></div>');
						}
					}, this));
			};
		};

		$(function() {
			// bind only once for all instances
			var lastmv = false,
				laster = false,
				opento = false,
				marker = $('<div id="jstree-marker">&#160;</div>').hide(); //.appendTo('body');

			$(document)
				.on('dnd_start.vakata.jstree', function (e, data) {
					lastmv = false;
					if(!data || !data.data || !data.data.jstree) { return; }
					marker.appendTo('body'); //.show();
				})
				.on('dnd_move.vakata.jstree', function (e, data) {
					if(opento) { clearTimeout(opento); }
					if(!data || !data.data || !data.data.jstree) { return; }

					// if we are hovering the marker image do nothing (can happen on "inside" drags)
					if(data.event.target.id && data.event.target.id === 'jstree-marker') {
						return;
					}

					var ins = $.jstree.reference(data.event.target),
						ref = false,
						off = false,
						rel = false,
						tmp, l, t, h, p, i, o, ok, t1, t2, op, ps, pr, ip, tm;
					// if we are over an instance
					if(ins && ins._data && ins._data.dnd) {
						marker.attr('class', 'jstree-' + ins.get_theme() + ( ins.settings.core.themes.responsive ? ' jstree-dnd-responsive' : '' ));
						data.helper
							.children().attr('class', 'jstree-' + ins.get_theme() + ' jstree-' + ins.get_theme() + '-' + ins.get_theme_variant() + ' ' + ( ins.settings.core.themes.responsive ? ' jstree-dnd-responsive' : '' ))
							.find('.jstree-copy').first()[ data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey))) ? 'show' : 'hide' ]();


						// if are hovering the container itself add a new root node
						if( (data.event.target === ins.element[0] || data.event.target === ins.get_container_ul()[0]) && ins.get_container_ul().children().length === 0) {
							ok = true;
							for(t1 = 0, t2 = data.data.nodes.length; t1 < t2; t1++) {
								ok = ok && ins.check( (data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey)) ) ? "copy_node" : "move_node"), (data.data.origin && data.data.origin !== ins ? data.data.origin.get_node(data.data.nodes[t1]) : data.data.nodes[t1]), '#', 'last', { 'dnd' : true, 'ref' : ins.get_node('#'), 'pos' : 'i', 'origin' : data.data.origin, 'is_multi' : (data.data.origin && data.data.origin !== ins), 'is_foreign' : (!data.data.origin) });
								if(!ok) { break; }
							}
							if(ok) {
								lastmv = { 'ins' : ins, 'par' : '#', 'pos' : 'last' };
								marker.hide();
								data.helper.find('.jstree-icon').first().removeClass('jstree-er').addClass('jstree-ok');
								return;
							}
						}
						else {
							// if we are hovering a tree node
							ref = ins.settings.dnd.large_drop_target ? $(data.event.target).closest('.jstree-node').children('.jstree-anchor') : $(data.event.target).closest('.jstree-anchor');
							if(ref && ref.length && ref.parent().is('.jstree-closed, .jstree-open, .jstree-leaf')) {
								off = ref.offset();
								rel = data.event.pageY - off.top;
								h = ref.outerHeight();
								if(rel < h / 3) {
									o = ['b', 'i', 'a'];
								}
								else if(rel > h - h / 3) {
									o = ['a', 'i', 'b'];
								}
								else {
									o = rel > h / 2 ? ['i', 'a', 'b'] : ['i', 'b', 'a'];
								}
								$.each(o, function (j, v) {
									switch(v) {
										case 'b':
											l = off.left - 6;
											t = off.top;
											p = ins.get_parent(ref);
											i = ref.parent().index();
											break;
										case 'i':
											ip = ins.settings.dnd.inside_pos;
											tm = ins.get_node(ref.parent());
											l = off.left - 2;
											t = off.top + h / 2 + 1;
											p = tm.id;
											i = ip === 'first' ? 0 : (ip === 'last' ? tm.children.length : Math.min(ip, tm.children.length));
											break;
										case 'a':
											l = off.left - 6;
											t = off.top + h;
											p = ins.get_parent(ref);
											i = ref.parent().index() + 1;
											break;
									}
									ok = true;
									for(t1 = 0, t2 = data.data.nodes.length; t1 < t2; t1++) {
										op = data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey))) ? "copy_node" : "move_node";
										ps = i;
										if(op === "move_node" && v === 'a' && (data.data.origin && data.data.origin === ins) && p === ins.get_parent(data.data.nodes[t1])) {
											pr = ins.get_node(p);
											if(ps > $.inArray(data.data.nodes[t1], pr.children)) {
												ps -= 1;
											}
										}
										ok = ok && ( (ins && ins.settings && ins.settings.dnd && ins.settings.dnd.check_while_dragging === false) || ins.check(op, (data.data.origin && data.data.origin !== ins ? data.data.origin.get_node(data.data.nodes[t1]) : data.data.nodes[t1]), p, ps, { 'dnd' : true, 'ref' : ins.get_node(ref.parent()), 'pos' : v, 'origin' : data.data.origin, 'is_multi' : (data.data.origin && data.data.origin !== ins), 'is_foreign' : (!data.data.origin) }) );
										if(!ok) {
											if(ins && ins.last_error) { laster = ins.last_error(); }
											break;
										}
									}
									if(v === 'i' && ref.parent().is('.jstree-closed') && ins.settings.dnd.open_timeout) {
										opento = setTimeout((function (x, z) { return function () { x.open_node(z); }; }(ins, ref)), ins.settings.dnd.open_timeout);
									}
									if(ok) {
										lastmv = { 'ins' : ins, 'par' : p, 'pos' : v === 'i' && ip === 'last' && i === 0 && !ins.is_loaded(tm) ? 'last' : i };
										marker.css({ 'left' : l + 'px', 'top' : t + 'px' }).show();
										data.helper.find('.jstree-icon').first().removeClass('jstree-er').addClass('jstree-ok');
										laster = {};
										o = true;
										return false;
									}
								});
								if(o === true) { return; }
							}
						}
					}
					lastmv = false;
					data.helper.find('.jstree-icon').removeClass('jstree-ok').addClass('jstree-er');
					marker.hide();
				})
				.on('dnd_scroll.vakata.jstree', function (e, data) {
					if(!data || !data.data || !data.data.jstree) { return; }
					marker.hide();
					lastmv = false;
					data.helper.find('.jstree-icon').first().removeClass('jstree-ok').addClass('jstree-er');
				})
				.on('dnd_stop.vakata.jstree', function (e, data) {
					if(opento) { clearTimeout(opento); }
					if(!data || !data.data || !data.data.jstree) { return; }
					marker.hide().detach();
					var i, j, nodes = [];
					if(lastmv) {
						for(i = 0, j = data.data.nodes.length; i < j; i++) {
							nodes[i] = data.data.origin ? data.data.origin.get_node(data.data.nodes[i]) : data.data.nodes[i];
						}
						lastmv.ins[ data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey))) ? 'copy_node' : 'move_node' ](nodes, lastmv.par, lastmv.pos, false, false, false, data.data.origin);
					}
					else {
						i = $(data.event.target).closest('.jstree');
						if(i.length && laster && laster.error && laster.error === 'check') {
							i = i.jstree(true);
							if(i) {
								i.settings.core.error.call(this, laster);
							}
						}
					}
				})
				.on('keyup.jstree keydown.jstree', function (e, data) {
					data = $.vakata.dnd._get();
					if(data && data.data && data.data.jstree) {
						data.helper.find('.jstree-copy').first()[ data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (e.metaKey || e.ctrlKey))) ? 'show' : 'hide' ]();
					}
				});
		});

		// helpers
		(function ($) {
			$.vakata.html = {
				div : $('<div />'),
				escape : function (str) {
					return $.vakata.html.div.text(str).html();
				},
				strip : function (str) {
					return $.vakata.html.div.empty().append($.parseHTML(str)).text();
				}
			};
			// private variable
			var vakata_dnd = {
				element	: false,
				target	: false,
				is_down	: false,
				is_drag	: false,
				helper	: false,
				helper_w: 0,
				data	: false,
				init_x	: 0,
				init_y	: 0,
				scroll_l: 0,
				scroll_t: 0,
				scroll_e: false,
				scroll_i: false,
				is_touch: false
			};
			$.vakata.dnd = {
				settings : {
					scroll_speed		: 10,
					scroll_proximity	: 20,
					helper_left			: 5,
					helper_top			: 10,
					threshold			: 5,
					threshold_touch		: 50
				},
				_trigger : function (event_name, e) {
					var data = $.vakata.dnd._get();
					data.event = e;
					$(document).triggerHandler("dnd_" + event_name + ".vakata", data);
				},
				_get : function () {
					return {
						"data"		: vakata_dnd.data,
						"element"	: vakata_dnd.element,
						"helper"	: vakata_dnd.helper
					};
				},
				_clean : function () {
					if(vakata_dnd.helper) { vakata_dnd.helper.remove(); }
					if(vakata_dnd.scroll_i) { clearInterval(vakata_dnd.scroll_i); vakata_dnd.scroll_i = false; }
					vakata_dnd = {
						element	: false,
						target	: false,
						is_down	: false,
						is_drag	: false,
						helper	: false,
						helper_w: 0,
						data	: false,
						init_x	: 0,
						init_y	: 0,
						scroll_l: 0,
						scroll_t: 0,
						scroll_e: false,
						scroll_i: false,
						is_touch: false
					};
					$(document).off("mousemove.vakata.jstree touchmove.vakata.jstree", $.vakata.dnd.drag);
					$(document).off("mouseup.vakata.jstree touchend.vakata.jstree", $.vakata.dnd.stop);
				},
				_scroll : function (init_only) {
					if(!vakata_dnd.scroll_e || (!vakata_dnd.scroll_l && !vakata_dnd.scroll_t)) {
						if(vakata_dnd.scroll_i) { clearInterval(vakata_dnd.scroll_i); vakata_dnd.scroll_i = false; }
						return false;
					}
					if(!vakata_dnd.scroll_i) {
						vakata_dnd.scroll_i = setInterval($.vakata.dnd._scroll, 100);
						return false;
					}
					if(init_only === true) { return false; }

					var i = vakata_dnd.scroll_e.scrollTop(),
						j = vakata_dnd.scroll_e.scrollLeft();
					vakata_dnd.scroll_e.scrollTop(i + vakata_dnd.scroll_t * $.vakata.dnd.settings.scroll_speed);
					vakata_dnd.scroll_e.scrollLeft(j + vakata_dnd.scroll_l * $.vakata.dnd.settings.scroll_speed);
					if(i !== vakata_dnd.scroll_e.scrollTop() || j !== vakata_dnd.scroll_e.scrollLeft()) {
						/**
						 * triggered on the document when a drag causes an element to scroll
						 * @event
						 * @plugin dnd
						 * @name dnd_scroll.vakata
						 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
						 * @param {DOM} element the DOM element being dragged
						 * @param {jQuery} helper the helper shown next to the mouse
						 * @param {jQuery} event the element that is scrolling
						 */
						$.vakata.dnd._trigger("scroll", vakata_dnd.scroll_e);
					}
				},
				start : function (e, data, html) {
					if(e.type === "touchstart" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
						e.pageX = e.originalEvent.changedTouches[0].pageX;
						e.pageY = e.originalEvent.changedTouches[0].pageY;
						e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
					}
					if(vakata_dnd.is_drag) { $.vakata.dnd.stop({}); }
					try {
						e.currentTarget.unselectable = "on";
						e.currentTarget.onselectstart = function() { return false; };
						if(e.currentTarget.style) { e.currentTarget.style.MozUserSelect = "none"; }
					} catch(ignore) { }
					vakata_dnd.init_x	= e.pageX;
					vakata_dnd.init_y	= e.pageY;
					vakata_dnd.data		= data;
					vakata_dnd.is_down	= true;
					vakata_dnd.element	= e.currentTarget;
					vakata_dnd.target	= e.target;
					vakata_dnd.is_touch	= e.type === "touchstart";
					if(html !== false) {
						vakata_dnd.helper = $("<div id='vakata-dnd'></div>").html(html).css({
							"display"		: "block",
							"margin"		: "0",
							"padding"		: "0",
							"position"		: "absolute",
							"top"			: "-2000px",
							"lineHeight"	: "16px",
							"zIndex"		: "10000"
						});
					}
					$(document).on("mousemove.vakata.jstree touchmove.vakata.jstree", $.vakata.dnd.drag);
					$(document).on("mouseup.vakata.jstree touchend.vakata.jstree", $.vakata.dnd.stop);
					return false;
				},
				drag : function (e) {
					if(e.type === "touchmove" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
						e.pageX = e.originalEvent.changedTouches[0].pageX;
						e.pageY = e.originalEvent.changedTouches[0].pageY;
						e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
					}
					if(!vakata_dnd.is_down) { return; }
					if(!vakata_dnd.is_drag) {
						if(
							Math.abs(e.pageX - vakata_dnd.init_x) > (vakata_dnd.is_touch ? $.vakata.dnd.settings.threshold_touch : $.vakata.dnd.settings.threshold) ||
							Math.abs(e.pageY - vakata_dnd.init_y) > (vakata_dnd.is_touch ? $.vakata.dnd.settings.threshold_touch : $.vakata.dnd.settings.threshold)
						) {
							if(vakata_dnd.helper) {
								vakata_dnd.helper.appendTo("body");
								vakata_dnd.helper_w = vakata_dnd.helper.outerWidth();
							}
							vakata_dnd.is_drag = true;
							/**
							 * triggered on the document when a drag starts
							 * @event
							 * @plugin dnd
							 * @name dnd_start.vakata
							 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
							 * @param {DOM} element the DOM element being dragged
							 * @param {jQuery} helper the helper shown next to the mouse
							 * @param {Object} event the event that caused the start (probably mousemove)
							 */
							$.vakata.dnd._trigger("start", e);
						}
						else { return; }
					}

					var d  = false, w  = false,
						dh = false, wh = false,
						dw = false, ww = false,
						dt = false, dl = false,
						ht = false, hl = false;

					vakata_dnd.scroll_t = 0;
					vakata_dnd.scroll_l = 0;
					vakata_dnd.scroll_e = false;
					$($(e.target).parentsUntil("body").addBack().get().reverse())
						.filter(function () {
							return	(/^auto|scroll$/).test($(this).css("overflow")) &&
									(this.scrollHeight > this.offsetHeight || this.scrollWidth > this.offsetWidth);
						})
						.each(function () {
							var t = $(this), o = t.offset();
							if(this.scrollHeight > this.offsetHeight) {
								if(o.top + t.height() - e.pageY < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; }
								if(e.pageY - o.top < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_t = -1; }
							}
							if(this.scrollWidth > this.offsetWidth) {
								if(o.left + t.width() - e.pageX < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; }
								if(e.pageX - o.left < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_l = -1; }
							}
							if(vakata_dnd.scroll_t || vakata_dnd.scroll_l) {
								vakata_dnd.scroll_e = $(this);
								return false;
							}
						});

					if(!vakata_dnd.scroll_e) {
						d  = $(document); w = $(window);
						dh = d.height(); wh = w.height();
						dw = d.width(); ww = w.width();
						dt = d.scrollTop(); dl = d.scrollLeft();
						if(dh > wh && e.pageY - dt < $.vakata.dnd.settings.scroll_proximity)		{ vakata_dnd.scroll_t = -1;  }
						if(dh > wh && wh - (e.pageY - dt) < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; }
						if(dw > ww && e.pageX - dl < $.vakata.dnd.settings.scroll_proximity)		{ vakata_dnd.scroll_l = -1; }
						if(dw > ww && ww - (e.pageX - dl) < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; }
						if(vakata_dnd.scroll_t || vakata_dnd.scroll_l) {
							vakata_dnd.scroll_e = d;
						}
					}
					if(vakata_dnd.scroll_e) { $.vakata.dnd._scroll(true); }

					if(vakata_dnd.helper) {
						ht = parseInt(e.pageY + $.vakata.dnd.settings.helper_top, 10);
						hl = parseInt(e.pageX + $.vakata.dnd.settings.helper_left, 10);
						if(dh && ht + 25 > dh) { ht = dh - 50; }
						if(dw && hl + vakata_dnd.helper_w > dw) { hl = dw - (vakata_dnd.helper_w + 2); }
						vakata_dnd.helper.css({
							left	: hl + "px",
							top		: ht + "px"
						});
					}
					/**
					 * triggered on the document when a drag is in progress
					 * @event
					 * @plugin dnd
					 * @name dnd_move.vakata
					 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
					 * @param {DOM} element the DOM element being dragged
					 * @param {jQuery} helper the helper shown next to the mouse
					 * @param {Object} event the event that caused this to trigger (most likely mousemove)
					 */
					$.vakata.dnd._trigger("move", e);
					return false;
				},
				stop : function (e) {
					if(e.type === "touchend" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
						e.pageX = e.originalEvent.changedTouches[0].pageX;
						e.pageY = e.originalEvent.changedTouches[0].pageY;
						e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
					}
					if(vakata_dnd.is_drag) {
						/**
						 * triggered on the document when a drag stops (the dragged element is dropped)
						 * @event
						 * @plugin dnd
						 * @name dnd_stop.vakata
						 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
						 * @param {DOM} element the DOM element being dragged
						 * @param {jQuery} helper the helper shown next to the mouse
						 * @param {Object} event the event that caused the stop
						 */
						$.vakata.dnd._trigger("stop", e);
					}
					else {
						if(e.type === "touchend" && e.target === vakata_dnd.target) {
							var to = setTimeout(function () { $(e.target).click(); }, 100);
							$(e.target).one('click', function() { if(to) { clearTimeout(to); } });
						}
					}
					$.vakata.dnd._clean();
					return false;
				}
			};
		}($));

		// include the dnd plugin by default
		// $.jstree.defaults.plugins.push("dnd");


	/**
	 * ### Massload plugin
	 *
	 * Adds massload functionality to jsTree, so that multiple nodes can be loaded in a single request (only useful with lazy loading).
	 */

		/**
		 * massload configuration
		 *
		 * It is possible to set this to a standard jQuery-like AJAX config.
		 * In addition to the standard jQuery ajax options here you can supply functions for `data` and `url`, the functions will be run in the current instance's scope and a param will be passed indicating which node IDs need to be loaded, the return value of those functions will be used.
		 *
		 * You can also set this to a function, that function will receive the node IDs being loaded as argument and a second param which is a function (callback) which should be called with the result.
		 *
		 * Both the AJAX and the function approach rely on the same return value - an object where the keys are the node IDs, and the value is the children of that node as an array.
		 *
		 *	{
		 *		"id1" : [{ "text" : "Child of ID1", "id" : "c1" }, { "text" : "Another child of ID1", "id" : "c2" }],
		 *		"id2" : [{ "text" : "Child of ID2", "id" : "c3" }]
		 *	}
		 * 
		 * @name $.jstree.defaults.massload
		 * @plugin massload
		 */
		$.jstree.defaults.massload = null;
		$.jstree.plugins.massload = function (options, parent) {
			this.init = function (el, options) {
				parent.init.call(this, el, options);
				this._data.massload = {};
			};
			this._load_nodes = function (nodes, callback, is_callback) {
				var s = this.settings.massload;
				if(is_callback && !$.isEmptyObject(this._data.massload)) {
					return parent._load_nodes.call(this, nodes, callback, is_callback);
				}
				if($.isFunction(s)) {
					return s.call(this, nodes, $.proxy(function (data) {
						if(data) {
							for(var i in data) {
								if(data.hasOwnProperty(i)) {
									this._data.massload[i] = data[i];
								}
							}
						}
						parent._load_nodes.call(this, nodes, callback, is_callback);
					}, this));
				}
				if(typeof s === 'object' && s && s.url) {
					s = $.extend(true, {}, s);
					if($.isFunction(s.url)) {
						s.url = s.url.call(this, nodes);
					}
					if($.isFunction(s.data)) {
						s.data = s.data.call(this, nodes);
					}
					return $.ajax(s)
						.done($.proxy(function (data,t,x) {
								if(data) {
									for(var i in data) {
										if(data.hasOwnProperty(i)) {
											this._data.massload[i] = data[i];
										}
									}
								}
								parent._load_nodes.call(this, nodes, callback, is_callback);
							}, this))
						.fail($.proxy(function (f) {
								parent._load_nodes.call(this, nodes, callback, is_callback);
							}, this));
				}
				return parent._load_nodes.call(this, nodes, callback, is_callback);
			};
			this._load_node = function (obj, callback) {
				var d = this._data.massload[obj.id];
				if(d) {
					return this[typeof d === 'string' ? '_append_html_data' : '_append_json_data'](obj, typeof d === 'string' ? $($.parseHTML(d)).filter(function () { return this.nodeType !== 3; }) : d, function (status) {
						callback.call(this, status);
						delete this._data.massload[obj.id];
					});
				}
				return parent._load_node.call(this, obj, callback);
			};
		};

	/**
	 * ### Search plugin
	 *
	 * Adds search functionality to jsTree.
	 */

		/**
		 * stores all defaults for the search plugin
		 * @name $.jstree.defaults.search
		 * @plugin search
		 */
		$.jstree.defaults.search = {
			/**
			 * a jQuery-like AJAX config, which jstree uses if a server should be queried for results. 
			 * 
			 * A `str` (which is the search string) parameter will be added with the request, an optional `inside` parameter will be added if the search is limited to a node id. The expected result is a JSON array with nodes that need to be opened so that matching nodes will be revealed.
			 * Leave this setting as `false` to not query the server. You can also set this to a function, which will be invoked in the instance's scope and receive 3 parameters - the search string, the callback to call with the array of nodes to load, and the optional node ID to limit the search to 
			 * @name $.jstree.defaults.search.ajax
			 * @plugin search
			 */
			ajax : false,
			/**
			 * Indicates if the search should be fuzzy or not (should `chnd3` match `child node 3`). Default is `false`.
			 * @name $.jstree.defaults.search.fuzzy
			 * @plugin search
			 */
			fuzzy : false,
			/**
			 * Indicates if the search should be case sensitive. Default is `false`.
			 * @name $.jstree.defaults.search.case_sensitive
			 * @plugin search
			 */
			case_sensitive : false,
			/**
			 * Indicates if the tree should be filtered (by default) to show only matching nodes (keep in mind this can be a heavy on large trees in old browsers). 
			 * This setting can be changed at runtime when calling the search method. Default is `false`.
			 * @name $.jstree.defaults.search.show_only_matches
			 * @plugin search
			 */
			show_only_matches : false,
			/**
			 * Indicates if the children of matched element are shown (when show_only_matches is true)
			 * This setting can be changed at runtime when calling the search method. Default is `false`.
			 * @name $.jstree.defaults.search.show_only_matches_children
			 * @plugin search
			 */
			show_only_matches_children : false,
			/**
			 * Indicates if all nodes opened to reveal the search result, should be closed when the search is cleared or a new search is performed. Default is `true`.
			 * @name $.jstree.defaults.search.close_opened_onclear
			 * @plugin search
			 */
			close_opened_onclear : true,
			/**
			 * Indicates if only leaf nodes should be included in search results. Default is `false`.
			 * @name $.jstree.defaults.search.search_leaves_only
			 * @plugin search
			 */
			search_leaves_only : false,
			/**
			 * If set to a function it wil be called in the instance's scope with two arguments - search string and node (where node will be every node in the structure, so use with caution).
			 * If the function returns a truthy value the node will be considered a match (it might not be displayed if search_only_leaves is set to true and the node is not a leaf). Default is `false`.
			 * @name $.jstree.defaults.search.search_callback
			 * @plugin search
			 */
			search_callback : false
		};

		$.jstree.plugins.search = function (options, parent) {
			this.bind = function () {
				parent.bind.call(this);

				this._data.search.str = "";
				this._data.search.dom = $();
				this._data.search.res = [];
				this._data.search.opn = [];
				this._data.search.som = false;
				this._data.search.smc = false;

				this.element
					.on('before_open.jstree', $.proxy(function (e, data) {
							var i, j, f, r = this._data.search.res, s = [], o = $();
							if(r && r.length) {
								this._data.search.dom = $(this.element[0].querySelectorAll('#' + $.map(r, function (v) { return "0123456789".indexOf(v[0]) !== -1 ? '\\3' + v[0] + ' ' + v.substr(1).replace($.jstree.idregex,'\\$&') : v.replace($.jstree.idregex,'\\$&'); }).join(', #')));
								this._data.search.dom.children(".jstree-anchor").addClass('jstree-search');
								if(this._data.search.som && this._data.search.res.length) {
									for(i = 0, j = r.length; i < j; i++) {
										s = s.concat(this.get_node(r[i]).parents);
									}
									s = $.vakata.array_remove_item($.vakata.array_unique(s),'#');
									o = s.length ? $(this.element[0].querySelectorAll('#' + $.map(s, function (v) { return "0123456789".indexOf(v[0]) !== -1 ? '\\3' + v[0] + ' ' + v.substr(1).replace($.jstree.idregex,'\\$&') : v.replace($.jstree.idregex,'\\$&'); }).join(', #'))) : $();

									this.element.find(".jstree-node").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
									o = o.add(this._data.search.dom);
									if(this._data.search.smc) {
										this._data.search.dom.children(".jstree-children").find(".jstree-node").show();
									}
									o.parentsUntil(".jstree").addBack().show()
										.filter(".jstree-children").each(function () { $(this).children(".jstree-node:visible").eq(-1).addClass("jstree-last"); });
								}
							}
						}, this))
					.on("search.jstree", $.proxy(function (e, data) {
							if(this._data.search.som) {
								if(data.nodes.length) {
									this.element.find(".jstree-node").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
									if(this._data.search.smc) {
										data.nodes.children(".jstree-children").find(".jstree-node").show();
									}
									data.nodes.parentsUntil(".jstree").addBack().show()
										.filter(".jstree-children").each(function () { $(this).children(".jstree-node:visible").eq(-1).addClass("jstree-last"); });
								}
							}
						}, this))
					.on("clear_search.jstree", $.proxy(function (e, data) {
							if(this._data.search.som && data.nodes.length) {
								this.element.find(".jstree-node").css("display","").filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
							}
						}, this));
			};
			/**
			 * used to search the tree nodes for a given string
			 * @name search(str [, skip_async])
			 * @param {String} str the search string
			 * @param {Boolean} skip_async if set to true server will not be queried even if configured
			 * @param {Boolean} show_only_matches if set to true only matching nodes will be shown (keep in mind this can be very slow on large trees or old browsers)
			 * @param {mixed} inside an optional node to whose children to limit the search
			 * @param {Boolean} append if set to true the results of this search are appended to the previous search
			 * @plugin search
			 * @trigger search.jstree
			 */
			this.search = function (str, skip_async, show_only_matches, inside, append, show_only_matches_children) {
				if(str === false || $.trim(str.toString()) === "") {
					return this.clear_search();
				}
				inside = this.get_node(inside);
				inside = inside && inside.id ? inside.id : null;
				str = str.toString();
				var s = this.settings.search,
					a = s.ajax ? s.ajax : false,
					m = this._model.data,
					f = null,
					r = [],
					p = [], i, j;
				if(this._data.search.res.length && !append) {
					this.clear_search();
				}
				if(show_only_matches === undefined) {
					show_only_matches = s.show_only_matches;
				}
				if(show_only_matches_children === undefined) {
					show_only_matches_children = s.show_only_matches_children;
				}
				if(!skip_async && a !== false) {
					if($.isFunction(a)) {
						return a.call(this, str, $.proxy(function (d) {
								if(d && d.d) { d = d.d; }
								this._load_nodes(!$.isArray(d) ? [] : $.vakata.array_unique(d), function () {
									this.search(str, true, show_only_matches, inside, append);
								}, true);
							}, this), inside);
					}
					else {
						a = $.extend({}, a);
						if(!a.data) { a.data = {}; }
						a.data.str = str;
						if(inside) {
							a.data.inside = inside;
						}
						return $.ajax(a)
							.fail($.proxy(function () {
								this._data.core.last_error = { 'error' : 'ajax', 'plugin' : 'search', 'id' : 'search_01', 'reason' : 'Could not load search parents', 'data' : JSON.stringify(a) };
								this.settings.core.error.call(this, this._data.core.last_error);
							}, this))
							.done($.proxy(function (d) {
								if(d && d.d) { d = d.d; }
								this._load_nodes(!$.isArray(d) ? [] : $.vakata.array_unique(d), function () {
									this.search(str, true, show_only_matches, inside, append);
								}, true);
							}, this));
					}
				}
				if(!append) {
					this._data.search.str = str;
					this._data.search.dom = $();
					this._data.search.res = [];
					this._data.search.opn = [];
					this._data.search.som = show_only_matches;
					this._data.search.smc = show_only_matches_children;
				}

				f = new $.vakata.search(str, true, { caseSensitive : s.case_sensitive, fuzzy : s.fuzzy });
				$.each(m[inside ? inside : '#'].children_d, function (ii, i) {
					var v = m[i];
					if(v.text && ( (s.search_callback && s.search_callback.call(this, str, v)) || (!s.search_callback && f.search(v.text).isMatch) ) && (!s.search_leaves_only || (v.state.loaded && v.children.length === 0)) ) {
						r.push(i);
						p = p.concat(v.parents);
					}
				});
				if(r.length) {
					p = $.vakata.array_unique(p);
					this._search_open(p);
					if(!append) {
						this._data.search.dom = $(this.element[0].querySelectorAll('#' + $.map(r, function (v) { return "0123456789".indexOf(v[0]) !== -1 ? '\\3' + v[0] + ' ' + v.substr(1).replace($.jstree.idregex,'\\$&') : v.replace($.jstree.idregex,'\\$&'); }).join(', #')));
						this._data.search.res = r;
					}
					else {
						this._data.search.dom = this._data.search.dom.add($(this.element[0].querySelectorAll('#' + $.map(r, function (v) { return "0123456789".indexOf(v[0]) !== -1 ? '\\3' + v[0] + ' ' + v.substr(1).replace($.jstree.idregex,'\\$&') : v.replace($.jstree.idregex,'\\$&'); }).join(', #'))));
						this._data.search.res = $.vakata.array_unique(this._data.search.res.concat(r));
					}
					this._data.search.dom.children(".jstree-anchor").addClass('jstree-search');
				}
				/**
				 * triggered after search is complete
				 * @event
				 * @name search.jstree
				 * @param {jQuery} nodes a jQuery collection of matching nodes
				 * @param {String} str the search string
				 * @param {Array} res a collection of objects represeing the matching nodes
				 * @plugin search
				 */
				this.trigger('search', { nodes : this._data.search.dom, str : str, res : this._data.search.res, show_only_matches : show_only_matches });
			};
			/**
			 * used to clear the last search (removes classes and shows all nodes if filtering is on)
			 * @name clear_search()
			 * @plugin search
			 * @trigger clear_search.jstree
			 */
			this.clear_search = function () {
				this._data.search.dom.children(".jstree-anchor").removeClass("jstree-search");
				if(this.settings.search.close_opened_onclear) {
					this.close_node(this._data.search.opn, 0);
				}
				/**
				 * triggered after search is complete
				 * @event
				 * @name clear_search.jstree
				 * @param {jQuery} nodes a jQuery collection of matching nodes (the result from the last search)
				 * @param {String} str the search string (the last search string)
				 * @param {Array} res a collection of objects represeing the matching nodes (the result from the last search)
				 * @plugin search
				 */
				this.trigger('clear_search', { 'nodes' : this._data.search.dom, str : this._data.search.str, res : this._data.search.res });
				this._data.search.str = "";
				this._data.search.res = [];
				this._data.search.opn = [];
				this._data.search.dom = $();
			};
			/**
			 * opens nodes that need to be opened to reveal the search results. Used only internally.
			 * @private
			 * @name _search_open(d)
			 * @param {Array} d an array of node IDs
			 * @plugin search
			 */
			this._search_open = function (d) {
				var t = this;
				$.each(d.concat([]), function (i, v) {
					if(v === "#") { return true; }
					try { v = $('#' + v.replace($.jstree.idregex,'\\$&'), t.element); } catch(ignore) { }
					if(v && v.length) {
						if(t.is_closed(v)) {
							t._data.search.opn.push(v[0].id);
							t.open_node(v, function () { t._search_open(d); }, 0);
						}
					}
				});
			};
		};

		// helpers
		(function ($) {
			// from http://kiro.me/projects/fuse.html
			$.vakata.search = function(pattern, txt, options) {
				options = options || {};
				options = $.extend({}, $.vakata.search.defaults, options);
				if(options.fuzzy !== false) {
					options.fuzzy = true;
				}
				pattern = options.caseSensitive ? pattern : pattern.toLowerCase();
				var MATCH_LOCATION	= options.location,
					MATCH_DISTANCE	= options.distance,
					MATCH_THRESHOLD	= options.threshold,
					patternLen = pattern.length,
					matchmask, pattern_alphabet, match_bitapScore, search;
				if(patternLen > 32) {
					options.fuzzy = false;
				}
				if(options.fuzzy) {
					matchmask = 1 << (patternLen - 1);
					pattern_alphabet = (function () {
						var mask = {},
							i = 0;
						for (i = 0; i < patternLen; i++) {
							mask[pattern.charAt(i)] = 0;
						}
						for (i = 0; i < patternLen; i++) {
							mask[pattern.charAt(i)] |= 1 << (patternLen - i - 1);
						}
						return mask;
					}());
					match_bitapScore = function (e, x) {
						var accuracy = e / patternLen,
							proximity = Math.abs(MATCH_LOCATION - x);
						if(!MATCH_DISTANCE) {
							return proximity ? 1.0 : accuracy;
						}
						return accuracy + (proximity / MATCH_DISTANCE);
					};
				}
				search = function (text) {
					text = options.caseSensitive ? text : text.toLowerCase();
					if(pattern === text || text.indexOf(pattern) !== -1) {
						return {
							isMatch: true,
							score: 0
						};
					}
					if(!options.fuzzy) {
						return {
							isMatch: false,
							score: 1
						};
					}
					var i, j,
						textLen = text.length,
						scoreThreshold = MATCH_THRESHOLD,
						bestLoc = text.indexOf(pattern, MATCH_LOCATION),
						binMin, binMid,
						binMax = patternLen + textLen,
						lastRd, start, finish, rd, charMatch,
						score = 1,
						locations = [];
					if (bestLoc !== -1) {
						scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
						bestLoc = text.lastIndexOf(pattern, MATCH_LOCATION + patternLen);
						if (bestLoc !== -1) {
							scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
						}
					}
					bestLoc = -1;
					for (i = 0; i < patternLen; i++) {
						binMin = 0;
						binMid = binMax;
						while (binMin < binMid) {
							if (match_bitapScore(i, MATCH_LOCATION + binMid) <= scoreThreshold) {
								binMin = binMid;
							} else {
								binMax = binMid;
							}
							binMid = Math.floor((binMax - binMin) / 2 + binMin);
						}
						binMax = binMid;
						start = Math.max(1, MATCH_LOCATION - binMid + 1);
						finish = Math.min(MATCH_LOCATION + binMid, textLen) + patternLen;
						rd = new Array(finish + 2);
						rd[finish + 1] = (1 << i) - 1;
						for (j = finish; j >= start; j--) {
							charMatch = pattern_alphabet[text.charAt(j - 1)];
							if (i === 0) {
								rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
							} else {
								rd[j] = ((rd[j + 1] << 1) | 1) & charMatch | (((lastRd[j + 1] | lastRd[j]) << 1) | 1) | lastRd[j + 1];
							}
							if (rd[j] & matchmask) {
								score = match_bitapScore(i, j - 1);
								if (score <= scoreThreshold) {
									scoreThreshold = score;
									bestLoc = j - 1;
									locations.push(bestLoc);
									if (bestLoc > MATCH_LOCATION) {
										start = Math.max(1, 2 * MATCH_LOCATION - bestLoc);
									} else {
										break;
									}
								}
							}
						}
						if (match_bitapScore(i + 1, MATCH_LOCATION) > scoreThreshold) {
							break;
						}
						lastRd = rd;
					}
					return {
						isMatch: bestLoc >= 0,
						score: score
					};
				};
				return txt === true ? { 'search' : search } : search(txt);
			};
			$.vakata.search.defaults = {
				location : 0,
				distance : 100,
				threshold : 0.6,
				fuzzy : false,
				caseSensitive : false
			};
		}($));

		// include the search plugin by default
		// $.jstree.defaults.plugins.push("search");

	/**
	 * ### Sort plugin
	 *
	 * Automatically sorts all siblings in the tree according to a sorting function.
	 */

		/**
		 * the settings function used to sort the nodes.
		 * It is executed in the tree's context, accepts two nodes as arguments and should return `1` or `-1`.
		 * @name $.jstree.defaults.sort
		 * @plugin sort
		 */
		$.jstree.defaults.sort = function (a, b) {
			//return this.get_type(a) === this.get_type(b) ? (this.get_text(a) > this.get_text(b) ? 1 : -1) : this.get_type(a) >= this.get_type(b);
			return this.get_text(a) > this.get_text(b) ? 1 : -1;
		};
		$.jstree.plugins.sort = function (options, parent) {
			this.bind = function () {
				parent.bind.call(this);
				this.element
					.on("model.jstree", $.proxy(function (e, data) {
							this.sort(data.parent, true);
						}, this))
					.on("rename_node.jstree create_node.jstree", $.proxy(function (e, data) {
							this.sort(data.parent || data.node.parent, false);
							this.redraw_node(data.parent || data.node.parent, true);
						}, this))
					.on("move_node.jstree copy_node.jstree", $.proxy(function (e, data) {
							this.sort(data.parent, false);
							this.redraw_node(data.parent, true);
						}, this));
			};
			/**
			 * used to sort a node's children
			 * @private
			 * @name sort(obj [, deep])
			 * @param  {mixed} obj the node
			 * @param {Boolean} deep if set to `true` nodes are sorted recursively.
			 * @plugin sort
			 * @trigger search.jstree
			 */
			this.sort = function (obj, deep) {
				var i, j;
				obj = this.get_node(obj);
				if(obj && obj.children && obj.children.length) {
					obj.children.sort($.proxy(this.settings.sort, this));
					if(deep) {
						for(i = 0, j = obj.children_d.length; i < j; i++) {
							this.sort(obj.children_d[i], false);
						}
					}
				}
			};
		};

		// include the sort plugin by default
		// $.jstree.defaults.plugins.push("sort");

	/**
	 * ### State plugin
	 *
	 * Saves the state of the tree (selected nodes, opened nodes) on the user's computer using available options (localStorage, cookies, etc)
	 */

		var to = false;
		/**
		 * stores all defaults for the state plugin
		 * @name $.jstree.defaults.state
		 * @plugin state
		 */
		$.jstree.defaults.state = {
			/**
			 * A string for the key to use when saving the current tree (change if using multiple trees in your project). Defaults to `jstree`.
			 * @name $.jstree.defaults.state.key
			 * @plugin state
			 */
			key		: 'jstree',
			/**
			 * A space separated list of events that trigger a state save. Defaults to `changed.jstree open_node.jstree close_node.jstree`.
			 * @name $.jstree.defaults.state.events
			 * @plugin state
			 */
			events	: 'changed.jstree open_node.jstree close_node.jstree check_node.jstree uncheck_node.jstree',
			/**
			 * Time in milliseconds after which the state will expire. Defaults to 'false' meaning - no expire.
			 * @name $.jstree.defaults.state.ttl
			 * @plugin state
			 */
			ttl		: false,
			/**
			 * A function that will be executed prior to restoring state with one argument - the state object. Can be used to clear unwanted parts of the state.
			 * @name $.jstree.defaults.state.filter
			 * @plugin state
			 */
			filter	: false
		};
		$.jstree.plugins.state = function (options, parent) {
			this.bind = function () {
				parent.bind.call(this);
				var bind = $.proxy(function () {
					this.element.on(this.settings.state.events, $.proxy(function () {
						if(to) { clearTimeout(to); }
						to = setTimeout($.proxy(function () { this.save_state(); }, this), 100);
					}, this));
					/**
					 * triggered when the state plugin is finished restoring the state (and immediately after ready if there is no state to restore).
					 * @event
					 * @name state_ready.jstree
					 * @plugin state
					 */
					this.trigger('state_ready');
				}, this);
				this.element
					.on("ready.jstree", $.proxy(function (e, data) {
							this.element.one("restore_state.jstree", bind);
							if(!this.restore_state()) { bind(); }
						}, this));
			};
			/**
			 * save the state
			 * @name save_state()
			 * @plugin state
			 */
			this.save_state = function () {
				var st = { 'state' : this.get_state(), 'ttl' : this.settings.state.ttl, 'sec' : +(new Date()) };
				$.vakata.storage.set(this.settings.state.key, JSON.stringify(st));
			};
			/**
			 * restore the state from the user's computer
			 * @name restore_state()
			 * @plugin state
			 */
			this.restore_state = function () {
				var k = $.vakata.storage.get(this.settings.state.key);
				if(!!k) { try { k = JSON.parse(k); } catch(ex) { return false; } }
				if(!!k && k.ttl && k.sec && +(new Date()) - k.sec > k.ttl) { return false; }
				if(!!k && k.state) { k = k.state; }
				if(!!k && $.isFunction(this.settings.state.filter)) { k = this.settings.state.filter.call(this, k); }
				if(!!k) {
					this.element.one("set_state.jstree", function (e, data) { data.instance.trigger('restore_state', { 'state' : $.extend(true, {}, k) }); });
					this.set_state(k);
					return true;
				}
				return false;
			};
			/**
			 * clear the state on the user's computer
			 * @name clear_state()
			 * @plugin state
			 */
			this.clear_state = function () {
				return $.vakata.storage.del(this.settings.state.key);
			};
		};

		(function ($, undefined) {
			$.vakata.storage = {
				// simply specifying the functions in FF throws an error
				set : function (key, val) { return window.localStorage.setItem(key, val); },
				get : function (key) { return window.localStorage.getItem(key); },
				del : function (key) { return window.localStorage.removeItem(key); }
			};
		}($));

		// include the state plugin by default
		// $.jstree.defaults.plugins.push("state");

	/**
	 * ### Types plugin
	 *
	 * Makes it possible to add predefined types for groups of nodes, which make it possible to easily control nesting rules and icon for each group.
	 */

		/**
		 * An object storing all types as key value pairs, where the key is the type name and the value is an object that could contain following keys (all optional).
		 *
		 * * `max_children` the maximum number of immediate children this node type can have. Do not specify or set to `-1` for unlimited.
		 * * `max_depth` the maximum number of nesting this node type can have. A value of `1` would mean that the node can have children, but no grandchildren. Do not specify or set to `-1` for unlimited.
		 * * `valid_children` an array of node type strings, that nodes of this type can have as children. Do not specify or set to `-1` for no limits.
		 * * `icon` a string - can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class. Omit to use the default icon from your theme.
		 *
		 * There are two predefined types:
		 *
		 * * `#` represents the root of the tree, for example `max_children` would control the maximum number of root nodes.
		 * * `default` represents the default node - any settings here will be applied to all nodes that do not have a type specified.
		 *
		 * @name $.jstree.defaults.types
		 * @plugin types
		 */
		$.jstree.defaults.types = {
			'#' : {},
			'default' : {}
		};

		$.jstree.plugins.types = function (options, parent) {
			this.init = function (el, options) {
				var i, j;
				if(options && options.types && options.types['default']) {
					for(i in options.types) {
						if(i !== "default" && i !== "#" && options.types.hasOwnProperty(i)) {
							for(j in options.types['default']) {
								if(options.types['default'].hasOwnProperty(j) && options.types[i][j] === undefined) {
									options.types[i][j] = options.types['default'][j];
								}
							}
						}
					}
				}
				parent.init.call(this, el, options);
				this._model.data['#'].type = '#';
			};
			this.refresh = function (skip_loading, forget_state) {
				parent.refresh.call(this, skip_loading, forget_state);
				this._model.data['#'].type = '#';
			};
			this.bind = function () {
				this.element
					.on('model.jstree', $.proxy(function (e, data) {
							var m = this._model.data,
								dpc = data.nodes,
								t = this.settings.types,
								i, j, c = 'default';
							for(i = 0, j = dpc.length; i < j; i++) {
								c = 'default';
								if(m[dpc[i]].original && m[dpc[i]].original.type && t[m[dpc[i]].original.type]) {
									c = m[dpc[i]].original.type;
								}
								if(m[dpc[i]].data && m[dpc[i]].data.jstree && m[dpc[i]].data.jstree.type && t[m[dpc[i]].data.jstree.type]) {
									c = m[dpc[i]].data.jstree.type;
								}
								m[dpc[i]].type = c;
								if(m[dpc[i]].icon === true && t[c].icon !== undefined) {
									m[dpc[i]].icon = t[c].icon;
								}
							}
							m['#'].type = '#';
						}, this));
				parent.bind.call(this);
			};
			this.get_json = function (obj, options, flat) {
				var i, j,
					m = this._model.data,
					opt = options ? $.extend(true, {}, options, {no_id:false}) : {},
					tmp = parent.get_json.call(this, obj, opt, flat);
				if(tmp === false) { return false; }
				if($.isArray(tmp)) {
					for(i = 0, j = tmp.length; i < j; i++) {
						tmp[i].type = tmp[i].id && m[tmp[i].id] && m[tmp[i].id].type ? m[tmp[i].id].type : "default";
						if(options && options.no_id) {
							delete tmp[i].id;
							if(tmp[i].li_attr && tmp[i].li_attr.id) {
								delete tmp[i].li_attr.id;
							}
							if(tmp[i].a_attr && tmp[i].a_attr.id) {
								delete tmp[i].a_attr.id;
							}
						}
					}
				}
				else {
					tmp.type = tmp.id && m[tmp.id] && m[tmp.id].type ? m[tmp.id].type : "default";
					if(options && options.no_id) {
						tmp = this._delete_ids(tmp);
					}
				}
				return tmp;
			};
			this._delete_ids = function (tmp) {
				if($.isArray(tmp)) {
					for(var i = 0, j = tmp.length; i < j; i++) {
						tmp[i] = this._delete_ids(tmp[i]);
					}
					return tmp;
				}
				delete tmp.id;
				if(tmp.li_attr && tmp.li_attr.id) {
					delete tmp.li_attr.id;
				}
				if(tmp.a_attr && tmp.a_attr.id) {
					delete tmp.a_attr.id;
				}
				if(tmp.children && $.isArray(tmp.children)) {
					tmp.children = this._delete_ids(tmp.children);
				}
				return tmp;
			};
			this.check = function (chk, obj, par, pos, more) {
				if(parent.check.call(this, chk, obj, par, pos, more) === false) { return false; }
				obj = obj && obj.id ? obj : this.get_node(obj);
				par = par && par.id ? par : this.get_node(par);
				var m = obj && obj.id ? (more && more.origin ? more.origin : $.jstree.reference(obj.id)) : null, tmp, d, i, j;
				m = m && m._model && m._model.data ? m._model.data : null;
				switch(chk) {
					case "create_node":
					case "move_node":
					case "copy_node":
						if(chk !== 'move_node' || $.inArray(obj.id, par.children) === -1) {
							tmp = this.get_rules(par);
							if(tmp.max_children !== undefined && tmp.max_children !== -1 && tmp.max_children === par.children.length) {
								this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_01', 'reason' : 'max_children prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
								return false;
							}
							if(tmp.valid_children !== undefined && tmp.valid_children !== -1 && $.inArray((obj.type || 'default'), tmp.valid_children) === -1) {
								this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_02', 'reason' : 'valid_children prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
								return false;
							}
							if(m && obj.children_d && obj.parents) {
								d = 0;
								for(i = 0, j = obj.children_d.length; i < j; i++) {
									d = Math.max(d, m[obj.children_d[i]].parents.length);
								}
								d = d - obj.parents.length + 1;
							}
							if(d <= 0 || d === undefined) { d = 1; }
							do {
								if(tmp.max_depth !== undefined && tmp.max_depth !== -1 && tmp.max_depth < d) {
									this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_03', 'reason' : 'max_depth prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
									return false;
								}
								par = this.get_node(par.parent);
								tmp = this.get_rules(par);
								d++;
							} while(par);
						}
						break;
				}
				return true;
			};
			/**
			 * used to retrieve the type settings object for a node
			 * @name get_rules(obj)
			 * @param {mixed} obj the node to find the rules for
			 * @return {Object}
			 * @plugin types
			 */
			this.get_rules = function (obj) {
				obj = this.get_node(obj);
				if(!obj) { return false; }
				var tmp = this.get_type(obj, true);
				if(tmp.max_depth === undefined) { tmp.max_depth = -1; }
				if(tmp.max_children === undefined) { tmp.max_children = -1; }
				if(tmp.valid_children === undefined) { tmp.valid_children = -1; }
				return tmp;
			};
			/**
			 * used to retrieve the type string or settings object for a node
			 * @name get_type(obj [, rules])
			 * @param {mixed} obj the node to find the rules for
			 * @param {Boolean} rules if set to `true` instead of a string the settings object will be returned
			 * @return {String|Object}
			 * @plugin types
			 */
			this.get_type = function (obj, rules) {
				obj = this.get_node(obj);
				return (!obj) ? false : ( rules ? $.extend({ 'type' : obj.type }, this.settings.types[obj.type]) : obj.type);
			};
			/**
			 * used to change a node's type
			 * @name set_type(obj, type)
			 * @param {mixed} obj the node to change
			 * @param {String} type the new type
			 * @plugin types
			 */
			this.set_type = function (obj, type) {
				var t, t1, t2, old_type, old_icon;
				if($.isArray(obj)) {
					obj = obj.slice();
					for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
						this.set_type(obj[t1], type);
					}
					return true;
				}
				t = this.settings.types;
				obj = this.get_node(obj);
				if(!t[type] || !obj) { return false; }
				old_type = obj.type;
				old_icon = this.get_icon(obj);
				obj.type = type;
				if(old_icon === true || (t[old_type] && t[old_type].icon !== undefined && old_icon === t[old_type].icon)) {
					this.set_icon(obj, t[type].icon !== undefined ? t[type].icon : true);
				}
				return true;
			};
		};
		// include the types plugin by default
		// $.jstree.defaults.plugins.push("types");

	/**
	 * ### Unique plugin
	 *
	 * Enforces that no nodes with the same name can coexist as siblings.
	 */

		/**
		 * stores all defaults for the unique plugin
		 * @name $.jstree.defaults.unique
		 * @plugin unique
		 */
		$.jstree.defaults.unique = {
			/**
			 * Indicates if the comparison should be case sensitive. Default is `false`.
			 * @name $.jstree.defaults.unique.case_sensitive
			 * @plugin unique
			 */
			case_sensitive : false,
			/**
			 * A callback executed in the instance's scope when a new node is created and the name is already taken, the two arguments are the conflicting name and the counter. The default will produce results like `New node (2)`.
			 * @name $.jstree.defaults.unique.duplicate
			 * @plugin unique
			 */
			duplicate : function (name, counter) {
				return name + ' (' + counter + ')';
			}
		};

		$.jstree.plugins.unique = function (options, parent) {
			this.check = function (chk, obj, par, pos, more) {
				if(parent.check.call(this, chk, obj, par, pos, more) === false) { return false; }
				obj = obj && obj.id ? obj : this.get_node(obj);
				par = par && par.id ? par : this.get_node(par);
				if(!par || !par.children) { return true; }
				var n = chk === "rename_node" ? pos : obj.text,
					c = [],
					s = this.settings.unique.case_sensitive,
					m = this._model.data, i, j;
				for(i = 0, j = par.children.length; i < j; i++) {
					c.push(s ? m[par.children[i]].text : m[par.children[i]].text.toLowerCase());
				}
				if(!s) { n = n.toLowerCase(); }
				switch(chk) {
					case "delete_node":
						return true;
					case "rename_node":
						i = ($.inArray(n, c) === -1 || (obj.text && obj.text[ s ? 'toString' : 'toLowerCase']() === n));
						if(!i) {
							this._data.core.last_error = { 'error' : 'check', 'plugin' : 'unique', 'id' : 'unique_01', 'reason' : 'Child with name ' + n + ' already exists. Preventing: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
						}
						return i;
					case "create_node":
						i = ($.inArray(n, c) === -1);
						if(!i) {
							this._data.core.last_error = { 'error' : 'check', 'plugin' : 'unique', 'id' : 'unique_04', 'reason' : 'Child with name ' + n + ' already exists. Preventing: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
						}
						return i;
					case "copy_node":
						i = ($.inArray(n, c) === -1);
						if(!i) {
							this._data.core.last_error = { 'error' : 'check', 'plugin' : 'unique', 'id' : 'unique_02', 'reason' : 'Child with name ' + n + ' already exists. Preventing: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
						}
						return i;
					case "move_node":
						i = ( (obj.parent === par.id && (!more || !more.is_multi)) || $.inArray(n, c) === -1);
						if(!i) {
							this._data.core.last_error = { 'error' : 'check', 'plugin' : 'unique', 'id' : 'unique_03', 'reason' : 'Child with name ' + n + ' already exists. Preventing: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
						}
						return i;
				}
				return true;
			};
			this.create_node = function (par, node, pos, callback, is_loaded) {
				if(!node || node.text === undefined) {
					if(par === null) {
						par = "#";
					}
					par = this.get_node(par);
					if(!par) {
						return parent.create_node.call(this, par, node, pos, callback, is_loaded);
					}
					pos = pos === undefined ? "last" : pos;
					if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
						return parent.create_node.call(this, par, node, pos, callback, is_loaded);
					}
					if(!node) { node = {}; }
					var tmp, n, dpc, i, j, m = this._model.data, s = this.settings.unique.case_sensitive, cb = this.settings.unique.duplicate;
					n = tmp = this.get_string('New node');
					dpc = [];
					for(i = 0, j = par.children.length; i < j; i++) {
						dpc.push(s ? m[par.children[i]].text : m[par.children[i]].text.toLowerCase());
					}
					i = 1;
					while($.inArray(s ? n : n.toLowerCase(), dpc) !== -1) {
						n = cb.call(this, tmp, (++i)).toString();
					}
					node.text = n;
				}
				return parent.create_node.call(this, par, node, pos, callback, is_loaded);
			};
		};

		// include the unique plugin by default
		// $.jstree.defaults.plugins.push("unique");


	/**
	 * ### Wholerow plugin
	 *
	 * Makes each node appear block level. Making selection easier. May cause slow down for large trees in old browsers.
	 */

		var div = document.createElement('DIV');
		div.setAttribute('unselectable','on');
		div.setAttribute('role','presentation');
		div.className = 'jstree-wholerow';
		div.innerHTML = '&#160;';
		$.jstree.plugins.wholerow = function (options, parent) {
			this.bind = function () {
				parent.bind.call(this);

				this.element
					.on('ready.jstree set_state.jstree', $.proxy(function () {
							this.hide_dots();
						}, this))
					.on("init.jstree loading.jstree ready.jstree", $.proxy(function () {
							//div.style.height = this._data.core.li_height + 'px';
							this.get_container_ul().addClass('jstree-wholerow-ul');
						}, this))
					.on("deselect_all.jstree", $.proxy(function (e, data) {
							this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
						}, this))
					.on("changed.jstree", $.proxy(function (e, data) {
							this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
							var tmp = false, i, j;
							for(i = 0, j = data.selected.length; i < j; i++) {
								tmp = this.get_node(data.selected[i], true);
								if(tmp && tmp.length) {
									tmp.children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
								}
							}
						}, this))
					.on("open_node.jstree", $.proxy(function (e, data) {
							this.get_node(data.node, true).find('.jstree-clicked').parent().children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
						}, this))
					.on("hover_node.jstree dehover_node.jstree", $.proxy(function (e, data) {
							if(e.type === "hover_node" && this.is_disabled(data.node)) { return; }
							this.get_node(data.node, true).children('.jstree-wholerow')[e.type === "hover_node"?"addClass":"removeClass"]('jstree-wholerow-hovered');
						}, this))
					.on("contextmenu.jstree", ".jstree-wholerow", $.proxy(function (e) {
							e.preventDefault();
							var tmp = $.Event('contextmenu', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey, pageX : e.pageX, pageY : e.pageY });
							$(e.currentTarget).closest(".jstree-node").children(".jstree-anchor").first().trigger(tmp);
						}, this))
					/*!
					.on("mousedown.jstree touchstart.jstree", ".jstree-wholerow", function (e) {
							if(e.target === e.currentTarget) {
								var a = $(e.currentTarget).closest(".jstree-node").children(".jstree-anchor");
								e.target = a[0];
								a.trigger(e);
							}
						})
					*/
					.on("click.jstree", ".jstree-wholerow", function (e) {
							e.stopImmediatePropagation();
							var tmp = $.Event('click', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey });
							$(e.currentTarget).closest(".jstree-node").children(".jstree-anchor").first().trigger(tmp).focus();
						})
					.on("click.jstree", ".jstree-leaf > .jstree-ocl", $.proxy(function (e) {
							e.stopImmediatePropagation();
							var tmp = $.Event('click', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey });
							$(e.currentTarget).closest(".jstree-node").children(".jstree-anchor").first().trigger(tmp).focus();
						}, this))
					.on("mouseover.jstree", ".jstree-wholerow, .jstree-icon", $.proxy(function (e) {
							e.stopImmediatePropagation();
							if(!this.is_disabled(e.currentTarget)) {
								this.hover_node(e.currentTarget);
							}
							return false;
						}, this))
					.on("mouseleave.jstree", ".jstree-node", $.proxy(function (e) {
							this.dehover_node(e.currentTarget);
						}, this));
			};
			this.teardown = function () {
				if(this.settings.wholerow) {
					this.element.find(".jstree-wholerow").remove();
				}
				parent.teardown.call(this);
			};
			this.redraw_node = function(obj, deep, callback, force_render) {
				obj = parent.redraw_node.apply(this, arguments);
				if(obj) {
					var tmp = div.cloneNode(true);
					//tmp.style.height = this._data.core.li_height + 'px';
					if($.inArray(obj.id, this._data.core.selected) !== -1) { tmp.className += ' jstree-wholerow-clicked'; }
					if(this._data.core.focused && this._data.core.focused === obj.id) { tmp.className += ' jstree-wholerow-hovered'; }
					obj.insertBefore(tmp, obj.childNodes[0]);
				}
				return obj;
			};
		};
		// include the wholerow plugin by default
		// $.jstree.defaults.plugins.push("wholerow");
		if(document.registerElement && Object && Object.create) {
			var proto = Object.create(HTMLElement.prototype);
			proto.createdCallback = function () {
				var c = { core : {}, plugins : [] }, i;
				for(i in $.jstree.plugins) {
					if($.jstree.plugins.hasOwnProperty(i) && this.attributes[i]) {
						c.plugins.push(i);
						if(this.getAttribute(i) && JSON.parse(this.getAttribute(i))) {
							c[i] = JSON.parse(this.getAttribute(i));
						}
					}
				}
				for(i in $.jstree.defaults.core) {
					if($.jstree.defaults.core.hasOwnProperty(i) && this.attributes[i]) {
						c.core[i] = JSON.parse(this.getAttribute(i)) || this.getAttribute(i);
					}
				}
				$(this).jstree(c);
			};
			// proto.attributeChangedCallback = function (name, previous, value) { };
			try {
				document.registerElement("vakata-jstree", { prototype: proto });
			} catch(ignore) { }
		}

	}));

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(12);

	function init(React){
		function fetchTree(root,cb){
			if(!root || root == "#"){
				root = "";
			}

			$.getJSON("/filetree?root=" + root,function(resObj){
				var ret = [];
				try{
					$.each(resObj.directory, function(k,item){
						if(item.name.indexOf(".") == 0) return;
						ret.push({
							text : item.name,
							id   : item.fullPath,
							icon : "uk-icon-folder",
							children : true
						});
					});

					$.each(resObj.file, function(k,item){
						if(item.name.indexOf(".") == 0) return;
						ret.push({
							text     : item.name,
							id       : item.fullPath,
							icon     : 'uk-icon-file-o',
							children : false
						});
					});
				}catch(e){}
				cb && cb.call(null,ret);
			});
		}

		var MapForm = React.createClass({displayName: "MapForm",

			submitData:function(){
				var self   = this,
					result = {};

				var	filePath = React.findDOMNode(self.refs.localFilePath).value,
					keyword  = React.findDOMNode(self.refs.keywordInput).value;

				if(filePath && keyword){
					self.props.onSubmit.call(null,{
						keyword : keyword,
						local   : filePath
					});
				}
			},
			
			render:function(){
				var self = this;
				return (
					React.createElement("div", null, 
						React.createElement("form", {className: "uk-form uk-form-stacked mapAddNewForm"}, 
						    React.createElement("fieldset", null, 
						        React.createElement("div", {className: "uk-form-row"}, 
					                React.createElement("label", {className: "uk-form-label", htmlFor: "map_keywordInput"}, "keyword"), 
					                React.createElement("div", {className: "uk-form-controls"}, 
					                    React.createElement("input", {className: "mapConfigInputs", type: "text", id: "map_keywordInput", ref: "keywordInput", placeholder: "keyword"})
					                )
					            ), 

						        React.createElement("div", {className: "uk-form-row"}, 
					                React.createElement("label", {className: "uk-form-label", htmlFor: "map_localFilePath"}, "local file"), 
					                React.createElement("div", {className: "uk-form-controls"}, 
					                    React.createElement("input", {className: "mapConfigInputs pathInput", type: "text", id: "map_localFilePath", ref: "localFilePath", placeholder: "local file path"})
					                ), 
			            	        React.createElement("div", {ref: "treeWrapper", className: "treeWrapper"})
					            ), 

		            	        React.createElement("div", {className: "uk-form-row"}, 
			            	        React.createElement("button", {type: "button", className: "uk-button", onClick: self.submitData}, "Add")
		                        )

						    )
						)

					)
				);
			},

			componentDidMount :function(){
				var self = this;
				var wrapperEl     = $(React.findDOMNode(self.refs.treeWrapper)),
					filePathInput = React.findDOMNode(self.refs.localFilePath);

				wrapperEl.jstree({
				  	'core' : {
					    'data' : function (node, cb) {
					    	fetchTree(node.id,cb);
						}
					}
				});

				wrapperEl.on("changed.jstree", function (e, data) {
					if(data && data.selected && data.selected.length){
						//is folder
						if(/folder/.test(data.node.icon)) return;

						var item = data.selected[0];
						filePathInput.value = item;
					}
				});

			},
			componentDidUpdate:function(){}
		});

		return MapForm;
	}

	module.exports.init = init;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	function init(React){
		var MapList = React.createClass({displayName: "MapList",
			getInitialState:function(){
				return {
					ruleList : []
				}
			},
			appendRecord:function(data){
				var self = this,
				    newState = self.state.ruleList;

			    if(data && data.keyword && data.local){
					newState.push({
						keyword : data.keyword,
						local   : data.local
					});

					self.setState({
						ruleList: newState
					});
			    }

			},

			removeRecord:function(index){
				var self    = this,
					newList = self.state.ruleList;

				newList.splice(index,1);
				self.setState({
					ruleList : newList
				});
			},
			render:function(){
				var self       = this,
				    collection = [];

			    collection = self.state.ruleList.map(function(item,index){
			    	return (
						React.createElement("li", null, 
							React.createElement("strong", null, item.keyword), React.createElement("a", {className: "removeBtn", href: "#", onClick: self.removeRecord.bind(self,index)}, "remove"), React.createElement("br", null), 
							React.createElement("span", null, item.local)
						)
		    		);
			    });

				return (
					React.createElement("ul", {className: "mapRuleList"}, 
						collection
					)
				);
			},
			componentDidMount :function(){
				var self = this;
				$.getJSON("/getMapConfig",function(data){
					self.setState({
						ruleList : data
					});
				});
			},
			componentDidUpdate:function(){
				var self = this;
				//sync config

				var currentList = self.state.ruleList;
				$.ajax({
					method      : "POST",
					url         : "/setMapConfig",
					contentType :"application/json",
					data        : JSON.stringify(currentList),
					dataType    : "json",
					success     :function(res){}
				});
			}
		});

		return MapList;
	}

	module.exports.init = init;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }
/******/ ]);