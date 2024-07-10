if(getCookie("status") === "authFailed") {
	alert("Sorry, authentication, please check the email address and/or password");
	setCookie("status", "", 0); 
}