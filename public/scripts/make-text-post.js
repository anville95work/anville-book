function changeTextPostBackground(event) {
	document.getElementById("textPostTextArea").style.background = event.target.style.background;
}

function makeTextPost() {
	let textPostTextArea = document.getElementById("textPostTextArea");
	let postText = textPostTextArea.value;
	let currentDate = new Date();
	let postEpoch = currentDate.getTime();
	let postDate = months[currentDate.getMonth()] + ", " + currentDate.getDate() + " " + currentDate.getHours() + ":" + currentDate.getMinutes();
	sendAjaxRequest("POST", "/make-text-post", { "postText": postText, "postDate": postDate, "postEpoch": postEpoch, "postBackgroundColor": textPostTextArea.style.background }, responseText => {
		console.log(responseText);
		window.location.href = "dashboard.html";
	})
}

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

function sendAjaxRequest(method, url, dataObject, cb) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		console.log("xhr request replied!");
		if(xhr.readyState === 4) {
			if(xhr.status >= 200 && xhr.status < 300) {
				cb(xhr.responseText);
			} else {
				alert("XMLHttpRequest Error");
			}
		}
	};

	xhr.open(method, url);
	xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
	xhr.send(JSON.stringify(dataObject));
}