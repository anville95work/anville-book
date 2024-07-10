function changeTextPostBackground(event) {
	document.getElementById("imagePostTextArea").style.background = event.target.style.background;
}

function makeImagePost() {
	let imagePostTextArea = document.getElementById("imagePostTextArea");
	let postText = imagePostTextArea.value;
	let currentDate = new Date();
	let postEpoch = currentDate.getTime();
	let postDate = months[currentDate.getMonth()] + ", " + currentDate.getDate() + " " + currentDate.getHours() + ":" + currentDate.getMinutes();
	let postImageInput = document.getElementById("postImageInput");
	if(!postImageInput.files.length === 0) {
		alert("Please select an image to post!");
		return;
	}

	document.getElementById("postEpochInput").value = postEpoch;
	document.getElementById("postDateInput").value = postDate;
	document.getElementById("postBackgroundColorInput").value = imagePostTextArea.style.background;
	document.getElementById("submitPostButton").click();
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

function initiate() {
	let postImageInput = document.getElementById("postImageInput");
	let postImageView = document.getElementById("postImageView");
	postImageView.onclick = () => { postImageInput.click(); }
	postImageInput.onchange = () => {
		if(postImageInput.files.length > 0) {
			postImageView.setAttribute("src", URL.createObjectURL(postImageInput.files[0]));
		}
	}
}

initiate();