function initialise() {
	let signUpButton = document.getElementById("signUpButton");
	signUpButton.onclick = () => {
		let username = document.getElementById("usernameInput").value;
		let emailAddress = document.getElementById("emailAddressInput").value;
		let password = document.getElementById("passwordInput").value;
		let repeatedPassword = document.getElementById("repeatedPassword").value;

		if(!(emailAddress && password && repeatedPassword && username)) {
			alert("Sorry, all these fields are required!")
			return;
		}

		let emailRegExp = /.\.+./;
		if(!emailRegExp.test(emailAddress)) {
			alert("Sorry, a valid email address is required!");
			return;
		}

		if(password !== repeatedPassword) {
			alert("Sorry, the password does not match the repeated password!");
			return;
		}

		if(document.getElementById("profilePicture").files[0] || document.getElementById("coverPicture").files[0]) {
			let form = document.getElementsByTagName("form")[0];
			form.setAttribute("action", "/sign-up/with-profile-pic/");
			form.setAttribute("enctype", "multipart/form-data");
		}

		document.getElementById("postSignUpDetailsButton").click();
	}

	document.addEventListener("keydown", event => {
		if(event.key === "Enter") {
			event.preventDefault();
			signUpButton.click();
		}
	});

	let coverPictureDiv = document.getElementById("coverPictureDiv");
	coverPictureDiv.onclick = () => {
		if(event.target.getAttribute("id") === "coverPictureDiv") {
			coverPicture.click();
		}
	}

	let profilePictureAndCoverPicture = document.getElementById("profilePictureAndCoverPicture");
	let coverPicture = document.getElementById("coverPicture");
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
}
/*
//IF I EVER GET IN A SITUATION REQUIRING THIS
function tranfserFiles(sourceInputField, destinationInputField, position) {
	const dataTransfer = new DataTransfer();
	if(position === 1) {
		if(destinationInputField.files[0]) {
			dataTransfer.items.items.add(destinationInputField.files[0]);
			dataTransfer.items.add(sourceInputField.files[0]);
		} else {
			dataTransfer.items.add(sourceInputField.files[0]);
			dataTransfer.items.add(sourceInputField.files[0]);
		}
	} else {
		dataTransfer.items.add(sourceInputField.files[0]);
		if(destinationInputField.files[1]) {
			dataTransfer.items.add(destinationInputField.files[1]);
		} else {
			dataTransfer.items.add(sourceInputField.files[0]);
		}
	}
	const fileList = dataTransfer.files;
	destinationInputField.files = fileList;
}
*/
initialise();