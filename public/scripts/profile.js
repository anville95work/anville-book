var currentlyVisiblePopup;

function showPopup(popup) {
	if(!currentlyVisiblePopup) {
		let backgroundTint = document.getElementById("backgroundTint");
		backgroundTint.onclick = () => {
			currentlyVisiblePopup.style.display = "none";
			backgroundTint.style.display = "none";
		}
	}

	popup.style.display = "table";
	backgroundTint.style.display = "table";

	currentlyVisiblePopup = popup;
}

function initialise() {
	let editProfileButton = document.getElementById("editProfileButton");
	editProfileButton.onclick = () => {
		let editProfilePopup = document.getElementById("editProfilePopup");
		showPopup(editProfilePopup);

		editProfilePopup.style.left = (window.innerWidth - editProfilePopup.offsetWidth) / 2 +"px";
		editProfilePopup.top = (window.innerHeight - editProfilePopup.offsetHeight) / 2 + "px";
	}

	let coverPicture = document.getElementById("coverPicture");
	let coverPictureDiv = document.getElementById("editCoverPicture");
	coverPictureDiv.onclick = () => {
		if(event.target.getAttribute("id") === "editCoverPicture") {
			coverPicture.click();
		}
	}

	coverPicture.onchange = (event) => {
		coverPictureDiv.style.backgroundImage = "url(\"" + URL.createObjectURL(coverPicture.files[0]) + "\")";
	}

	let chooseProfilePicture = coverPictureDiv.children[0];
	chooseProfilePicture.onclick = () => {
		profilePicture.click();
	}

	let profilePicture = document.getElementById("profilePicture");
	profilePicture.onchange = () => {
		chooseProfilePicture.setAttribute("src", URL.createObjectURL(profilePicture.files[0]));
	}

	let saveDetailsButton = document.getElementById("saveDetailsButton");
	saveDetailsButton.onclick = () => {
		if(profilePicture.files[0] || coverPicture.files[0]) {
			let form = document.getElementsByTagName("form")[0];
			form.setAttribute("action", "/edit-profile/with-profile-pic/");
			form.setAttribute("enctype", "multipart/form-data");
		}
		document.getElementById("postUpdateDataButton").click();
	}

	document.addEventListener("keydown", event => {
		if(event.key === "Enter") {
			event.preventDefault();
			saveDetailsButton.click();
		}
	});
}

initialise();