function User(emailAddress, password, username, picFiles) {
	this.emailAddress = emailAddress;
	if(password) {
		this.password = password;
		this.username = username;
	}

	if(picFiles) {
		if(picFiles["profilePicture"]) {
			this.profilePicture = "/profilePicture/" + emailAddress + "-profilePicture" + extname(picFiles["profilePicture"][0].originalname);
		} else {
			this.profilePicture = "../images/default-profile-picture.png";
		}

		if(picFiles["coverPicture"]) {
			this.coverPicture = "/coverPicture/" + emailAddress + "-coverPicture" + extname(picFiles["coverPicture"][0].originalname);
		} else {
			this.coverPicture = "../images/default-profile-picture.png";
		}
	} else {
		this.profilePicture = "../images/default-profile-picture.png";
		this.coverPicture = "../images/default-profile-picture.png";
	}
}

let extname = (fileName) => {
	return fileName.substring(fileName.lastIndexOf("."));
}

module.exports = {
	"User": User
}