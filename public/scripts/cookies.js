/**
* @param {string} name
* @param {string} value
* @param {number} lifeSpan
*/
var setCookie = function (name, value, lifeSpan){
	var cookie = name + "=" + encodeURIComponent(value);
	if(typeof lifeSpan === "number"){
		cookie += "; max-age=" + (lifeSpan * 24 * 60 * 60);
	}

	cookie += "; path=/"

	document.cookie = cookie;
}

/**
* @param {string} name
*/
var getCookie = function (name) {
	var cookieArray = document.cookie.split(";");
	//Now for each cookie name value pairs
	for (var i = 0; i < cookieArray.length; i++){
		cookieArray[i] = cookieArray[i].trim();
		var cookiePairArray = cookieArray[i].split("=");
		//return it if their name match
		if(name == cookiePairArray[0]){
			//return it's value
			return decodeURIComponent(cookiePairArray[1]);
		}
	}
}