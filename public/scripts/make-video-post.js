function changeTextPostBackground(event) {
	document.getElementById("videoPostTextArea").style.background = event.target.style.background;
}

function makeVideoPost() {
	let videoPostTextArea = document.getElementById("videoPostTextArea");
	let postText = videoPostTextArea.value;
	let currentDate = new Date();
	let postEpoch = currentDate.getTime();
	let postDate = months[currentDate.getMonth()] + ", " + currentDate.getDate() + " " + currentDate.getHours() + ":" + currentDate.getMinutes();
	let postVideoInput = document.getElementById("postVideoInput");
	if(postVideoInput.files.length === 0) {
		alert("Please select a video to post!");
		return;
	}

	document.getElementById("postEpochInput").value = postEpoch;
	document.getElementById("postDateInput").value = postDate;
	document.getElementById("postBackgroundColorInput").value = videoPostTextArea.style.background;
	document.getElementById("submitPostButton").click();
}

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

function initiate() {
	let postVideoInput = document.getElementById("postVideoInput");
	let postVideoView = document.getElementById("postVideoView");
	document.getElementById("changeVideo").onclick = () => { postVideoInput.click(); }
	postVideoInput.onchange = () => {
		if(postVideoInput.files.length > 0) {
			postVideoView.setAttribute("src", URL.createObjectURL(postVideoInput.files[0]));
		}
	}
}

initiate();