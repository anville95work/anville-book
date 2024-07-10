const TEXT_MESSAGE_TEMPLATE = "<div class=\"messageElement <%=origin%>\">\n<div class=\"messageElementChild\">\n<div class=\"messageTextContainer\">\n<%=messageText%>\n</div>\n</div>\n</div>",
	IMAGE_MESSAGE_TEMPLATE = "<div class=\"messageElement <%=origin%>\">\n<div class=\"messageElementChild\">\n<img src=\"<%=messageImageUrl%>\">\n<div class=\"messageTextContainer\">\n<%=messageText%>\n</div>\n</div>\n</div>",
	VIDEO_MESSAGE_TEMPLATE = "<div class=\"messageElement <%=origin%>\">\n<div class=\"messageElementChild\">\n<video src=\"<%=messageVideoUrl%>\" controls></video>\n<div class=\"messageTextContainer\">\n<%=messageText%>\n</div>\n</div>\n</div>";

var currentlyVisibleTab,
	currentlyVisibleTabButton;

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

function showTab(tabButton, tab) {
	if(currentlyVisibleTab) {
		currentlyVisibleTab.style.display = "none";
		currentlyVisibleTabButton.setAttribute("class", "dashboardTabButtons");
	}

	tab.style.display = "table";
	tabButton.setAttribute("class", "dashboardTabButtons dashboardTabButtonsActive");

	currentlyVisibleTab = tab;
	currentlyVisibleTabButton = tabButton;
}

var currentlyVisibleFriendsTabTab,
	currentlyVisibleFriendsTabTabButton,
	currentlyVisibleFriendsTabTabButtonClass;

function showTabInFriendsTab(friendsTabTabButton, friendsTabTab) {
	if(currentlyVisibleFriendsTabTab) {
		currentlyVisibleFriendsTabTab.style.display = "none";
		currentlyVisibleFriendsTabTabButton.setAttribute("class", currentlyVisibleFriendsTabTabButtonClass);
	}

	friendsTabTab.style.display = "table";
	currentlyVisibleFriendsTabTabButtonClass = friendsTabTabButton.getAttribute("class");
	friendsTabTabButton.setAttribute("class", currentlyVisibleFriendsTabTabButtonClass + " friendsTabTabButtonsActive");

	currentlyVisibleFriendsTabTab = friendsTabTab;
	currentlyVisibleFriendsTabTabButton = friendsTabTabButton;
}

var currentlyisiblePopup;
function showPopup(popup) {
	let backgroundTint = document.getElementById("backgroundTint");
	if(!currentlyisiblePopup) {
		backgroundTint.onclick = () => {
			backgroundTint.style.display = "none";
			currentlyisiblePopup.style.display = "none";
		}
	}
	backgroundTint.style.display = "table";
	popup.style.display = "table";
	currentlyisiblePopup = popup;
}

function initialize() {
	let homeTabButton = document.getElementById("homeTabButton"),
		friendsTabButton = document.getElementById("friendsTabButton"),
		messagesTabButton = document.getElementById("messagesTabButton"),
		notificationsTabButton = document.getElementById("notificationsTabButton"),
		videosTabButton = document.getElementById("videosTabButton");

	let homeTab = document.getElementById("homeTab"),
		friendsTab = document.getElementById("friendsTab"),
		messagesTab = document.getElementById("messagesTab"),
		videosTab = document.getElementById("videosTab");

	homeTabButton.onclick = () => {
		showTab(homeTabButton, homeTab);
	}

	friendsTabButton.onclick = () => {
		showTab(friendsTabButton, friendsTab);
	}

	messagesTabButton.onclick = () => {
		showTab(messagesTabButton, messagesTab);
	}

	notificationsTabButton.onclick = () => {
		alert("Will show notifications popup");
	}

	videosTabButton.onclick = () => {
		showTab(videosTabButton, videosTab);
	}

	homeTabButton.click();

	let makeImagePostButton = document.getElementById("makeImagePostButton");
	makeImagePostButton.onclick = () => {
		window.location.href = "make-image-post.html";
	}

	let makeTextPostButton = document.getElementById("makeTextPostButton");
	makeTextPostButton.onclick = () => {
		window.location.href = "make-text-post.html";
	}

	let viewProfileButton = document.getElementById("viewProfileButton");
	viewProfileButton.onclick = () => {
		window.location.href = "profile.html";
	}

	let showFriendsTabFriendsContaner = document.getElementById("showFriendsTabFriendsContaner");
	let showFriendsTabFriendRequestsContainer = document.getElementById("showFriendsTabFriendRequestsContainer");
	let showFriendsTabStangersContainer = document.getElementById("showFriendsTabStangersContainer");

	let friendsContaner = document.getElementById("friendsContaner");
	let friendRequestsContaner = document.getElementById("friendRequestsContaner");
	let friendsStrangersContaner = document.getElementById("friendsStrangersContaner");

	showFriendsTabFriendsContaner.onclick = () => {
		showTabInFriendsTab(showFriendsTabFriendsContaner, friendsContaner);
	}

	showFriendsTabFriendRequestsContainer.onclick = () => {
		showTabInFriendsTab(showFriendsTabFriendRequestsContainer, friendRequestsContaner);
	}

	showFriendsTabStangersContainer.onclick = () => {
		showTabInFriendsTab(showFriendsTabStangersContainer, friendsStrangersContaner);
	}

	showFriendsTabFriendsContaner.click();

	let showSentFriendRequestsButton = document.getElementById("showSentFriendRequestsButton");
	showSentFriendRequestsButton.onclick = () => {
		let sentFriendRequestsPopup = document.getElementById("sentFriendRequestsPopup");
		showPopup(sentFriendRequestsPopup);
		sentFriendRequestsPopup.style.top = (window.innerHeight - sentFriendRequestsPopup.offsetHeight) / 2 + "px";
		sentFriendRequestsPopup.style.left = (window.innerWidth - sentFriendRequestsPopup.offsetWidth) / 2 + "px";
	}
	let startNewConversationButton = document.getElementById("startNewConversationButton");
	startNewConversationButton.onclick = () => {
		showPopup(document.getElementById("messagesTabFriendsContainer"));
	}

	let messageTextArea = document.getElementById("messageTextArea");
	let chatScreen = document.getElementById("chatScreen");
	messageTextArea.onclick = () => {
		setTimeout(() => {
			document.body.scrollTo({
				top: document.body.scrollHeight,
				behavior: "smooth"
			})
		}, 20)
	}
}

initialize();

function sendFriendRequest(event) {
	let senderEmailAddress = event.target.getAttribute("senderEmailAddress");
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	sendAjaxRequest("POST", "/send-friend-request", { "senderEmailAddress": senderEmailAddress, "receiverEmailAddress": receiverEmailAddress }, (responseText) => {
		console.log("resonseText...\n", responseText);
		let homeTabStranger = document.getElementById(receiverEmailAddress + "strangerElement");
		let homeTabStrangersContainer = document.getElementById("homeTabStrangersContainer");
		let friendsTabStrangerContainer = document.getElementById("friendsStrangersContaner");
		homeTabStrangersContainer.removeChild(homeTabStranger);
		friendsTabStrangerContainer.removeChild(document.getElementById(receiverEmailAddress + "strangerElement"));
		let friendRequest = document.createElement("div");
		friendRequest.setAttribute("id", receiverEmailAddress + "SentFriendRequest");
		friendRequest.setAttribute("class", "friendsTabStrangerElement");
		let profilePicture = document.createElement("img");
		profilePicture.setAttribute("src", homeTabStranger.children[0].getAttribute("src"));
		friendRequest.appendChild(profilePicture);
		let buttonsContainer = document.createElement("div");
		buttonsContainer.setAttribute("class", "iconButtonGroup");
		let username = document.createElement("input");
		username.type = "text";
		username.readOnly = true;
		username.value = homeTabStranger.children[1].value;
		buttonsContainer.appendChild(username);
		let friendsButtonContainer = document.createElement("div");
		friendsButtonContainer.setAttribute("class", "friendsButtonContainer");
		let cancelButton = document.createElement("input");
		cancelButton.type = "button";
		cancelButton.setAttribute("class", "buttons");
		cancelButton.setAttribute("senderEmailAddress", senderEmailAddress);
		cancelButton.setAttribute("receiverEmailAddress", receiverEmailAddress);
		cancelButton.value = "Cancel";
		cancelButton.onclick = (event) => { cancelFriendRequest(event); }
		friendsButtonContainer.appendChild(cancelButton);
		buttonsContainer.appendChild(friendsButtonContainer);
		friendRequest.appendChild(buttonsContainer);
		let sentFriendRequestsPopup = document.getElementById("sentFriendRequestsPopup");
		if(sentFriendRequestsPopup.children[1].innerHTML.indexOf("You have not sent any new friend request yet!") >= 0 || sentFriendRequestsPopup.children[1].innerHTML.indexOf("You have not sent any friend request yet!") >= 0)  {
			sentFriendRequestsPopup.children[1].innerHTML = "";
		}
		sentFriendRequestsPopup.children[1].appendChild(friendRequest);
		
	})
}

function acceptFriendRequest(event) {
	let senderEmailAddress = event.target.getAttribute("senderEmailAddress");
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	sendAjaxRequest("POST", "/accept-friend-request", { "senderEmailAddress": senderEmailAddress, "receiverEmailAddress": receiverEmailAddress }, (responseText) => {
		console.log("resonseText...\n", responseText);
		let friendRequest = document.getElementById(senderEmailAddress + "FriendRequest");
		let friendRequestsContaner = document.getElementById("friendRequestsContaner");
		friendRequestsContaner.removeChild(friendRequest);
		let friendsContaner = document.getElementById("friendsContaner");
		let friend = document.createElement("div");
		friend.setAttribute("id", senderEmailAddress + "Friend");
		friend.setAttribute("class", "friendsTabStrangerElement");
		let profilePicture = document.createElement("img");
		profilePicture.setAttribute("src", friendRequest.children[0].getAttribute("src"));
		friend.appendChild(profilePicture);
		let buttonsContainer = document.createElement("div");
		buttonsContainer.setAttribute("class", "iconButtonGroup");
		let username = document.createElement("input");
		username.type = "text";
		username.readOnly = true;
		username.value = friendRequest.children[1].children[0].value;
		buttonsContainer.appendChild(username);
		let friendsButtonContainer = document.createElement("div");
		friendsButtonContainer.setAttribute("class", "friendsButtonContainer");
		let unfollowButton = document.createElement("input");
		unfollowButton.type = "button";
		unfollowButton.setAttribute("class", "buttons");
		unfollowButton.setAttribute("friendEmailAddress", senderEmailAddress);
		unfollowButton.setAttribute("emailAddress", receiverEmailAddress);
		unfollowButton.value = "Unfollow";
		unfollowButton.onclick = (event) => { unfollow(event); }
		friendsButtonContainer.appendChild(unfollowButton);
		let unfriendButton = document.createElement("input");
		unfriendButton.type = "button";
		unfriendButton.setAttribute("class", "buttons");
		unfriendButton.setAttribute("friendEmailAddress", senderEmailAddress);
		unfriendButton.setAttribute("emailAddress", receiverEmailAddress);
		unfriendButton.value = "Unfriend";
		unfriendButton.onclick = (event) => { unfriend(event); }
		friendsButtonContainer.appendChild(unfriendButton);
		buttonsContainer.appendChild(friendsButtonContainer);
		friend.appendChild(buttonsContainer);
		if(friendsContaner.innerHTML.indexOf("You have no friends yet!") >= 0 || friendsContaner.innerHTML.indexOf("It appears you have lost all of your friends!") >= 0) {
			friendsContaner.innerHTML = "";
		}
		friendsContaner.appendChild(friend);
	})
}

function unfollow(event) {
	let emailAddress = event.target.getAttribute("emailAddress");
	let friendEmailAddress = event.target.getAttribute("friendEmailAddress");
	sendAjaxRequest("POST", "/unfollow", { "emailAddress": emailAddress, "friendEmailAddress": friendEmailAddress }, responseText => {
		console.log(responseText);
		event.target.value = "Follow";
		event.target.onclick = (event) => {follow(event);}
	})
}

function follow(event) {
	let emailAddress = event.target.getAttribute("emailAddress");
	let friendEmailAddress = event.target.getAttribute("friendEmailAddress");
	sendAjaxRequest("POST", "/follow", { "emailAddress": emailAddress, "friendEmailAddress": friendEmailAddress }, responseText => {
		console.log(responseText);
		event.target.value = "Unfollow";
		event.target.onclick = (event) => {unfollow(event);}
	})
}

function unfriend(event) {
	let emailAddress = event.target.getAttribute("emailAddress");
	let friendEmailAddress = event.target.getAttribute("friendEmailAddress");
	sendAjaxRequest("POST", "/unfriend", { "emailAddress": emailAddress, "friendEmailAddress": friendEmailAddress }, responseText => {
		console.log(responseText);
		let friend = document.getElementById(friendEmailAddress + "Friend");
		let friendsContaner = document.getElementById("friendsContaner");
		friendsContaner.removeChild(friend);
		if(friendsContaner.children.length === 0) {
			friendsContaner.innerHTML = "It appears you have lost all of your friends!";
		}
	})
}

function cancelFriendRequest(event) {
	let senderEmailAddress = event.target.getAttribute("senderEmailAddress");
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	sendAjaxRequest("POST", "/cancel-sent-friend-request", { "senderEmailAddress": senderEmailAddress, "receiverEmailAddress": receiverEmailAddress }, (responseText) => {
		console.log(responseText);
		let sentFriendRequest = document.getElementById(receiverEmailAddress + "SentFriendRequest");
		let sentFriendRequestsPopup = document.getElementById("sentFriendRequestsPopup");
		sentFriendRequestsPopup.children[1].removeChild(sentFriendRequest);
		if(sentFriendRequestsPopup.children[1].children.length === 0) {
			sentFriendRequestsPopup.children[1].innerHTML = "You have not sent any new friend request yet!";
		}
	})
}

function deleteFriendRequest(event) {
	let senderEmailAddress = event.target.getAttribute("senderEmailAddress");
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	sendAjaxRequest("POST", "/delete-friend-request", { "senderEmailAddress": senderEmailAddress, "receiverEmailAddress": receiverEmailAddress }, (responseText) => {
		console.log(responseText);
		let friendRequest = document.getElementById(senderEmailAddress + "FriendRequest");
		let friendRequestsContaner = document.getElementById("friendRequestsContaner");
		friendRequestsContaner.removeChild(friendRequest);
		if(friendRequestsContaner.children.length === 0) {
			friendRequestsContaner.innerHTML = "You have no new friend requests yet!";
		}
	})
}

var downloadedMessages = {};

function openChatScreen(event) {
	let backgroundTint = document.getElementById("backgroundTint");
	if(backgroundTint.style.display === "table") {
		backgroundTint.click();
	}
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	document.getElementById("conversationsContainer").style.display = "none";
	document.getElementById("chatScreen").style.display = "table";
	document.getElementById("sendTextMessageButton").setAttribute("receiverEmailAddress", receiverEmailAddress);
	document.getElementById("sendImageMessage").setAttribute("receiverEmailAddress", receiverEmailAddress);
	document.getElementById("sendVideoMessage").setAttribute("receiverEmailAddress", receiverEmailAddress);
	document.getElementById("getOlderMessagesButton").setAttribute("receiverEmailAddress", receiverEmailAddress);
	document.getElementById("friendProfilePicture").setAttribute("src", event.target.getAttribute("src"));
	document.getElementById("chatScreenUsername").value = event.target.getAttribute("username");
	let messagesContainer = document.getElementById("messagesContainer");
	if(!downloadedMessages[receiverEmailAddress]) {
		downloadedMessages[receiverEmailAddress] = "";
		sendAjaxRequest("POST", "/get-messages", {
				"startIndex": 0,
				"amount": 20,
				"receiverEmailAddress": receiverEmailAddress
			}, messagesHTML => {
				downloadedMessages[receiverEmailAddress] = messagesHTML;
				downloadedMessages[receiverEmailAddress + "startIndex"] = 20;
				messagesContainer.innerHTML = messagesHTML;
				messagesContainer.scrollTo({
					top: messagesContainer.scrollHeight,
					behavior: "smooth"
				})
			})
	} else {
		messagesContainer.innerHTML = downloadedMessages[receiverEmailAddress];
		messagesContainer.scrollTo({
			top: messagesContainer.scrollHeight,
			behavior: "smooth"
		})
	}
}

function closeChatScreen() {
	document.getElementById("conversationsContainer").style.display = "table";
	document.getElementById("chatScreen").style.display = "none";
}

function sendTextMessage(event) {
	let senderEmailAddress = event.target.getAttribute("senderEmailAddress");
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	let messageTextArea = document.getElementById("messageTextArea");
	let messageText = messageTextArea.value;
	if(!messageText.trim()) {
		alert("You must not send empty message!");
		return;
	}
	let currentDate = new Date();
	let messageEpoch = currentDate.getTime();
	let messageDate = months[currentDate.getMonth()] + ", " + currentDate.getDate() + " " + currentDate.getHours() + ":" + currentDate.getMinutes();
	let message = {
		"senderEmailAddress": senderEmailAddress,
		"receiverEmailAddress": receiverEmailAddress,
		"messageText": messageText,
		"messageEpoch": messageEpoch,
		"messageDate": messageDate
	};
	messageTextArea.value = "";
	sendAjaxRequest("POST", "/send-text-message", message, responseText => {
			let messageHTML = renderSentMessage(message);
			let messagesContainer = document.getElementById("messagesContainer");
			messagesContainer.innerHTML += messageHTML;
			messagesContainer.scrollTo({
				top: messagesContainer.scrollHeight,
				behavior: "smooth"
			})
		});
}

function sendImageMessage(event) {
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	document.getElementById("receiverEmailAddressInput").value = receiverEmailAddress;
	
	let messageImageInput = document.getElementById("messageImageInput");
	let sendImageMessageImage = document.getElementById("sendImageMessageImage");
	sendImageMessageImage.onclick = () => { messageImageInput.click(); }
	messageImageInput.onchange = () => {
		sendImageMessageImage.setAttribute("src", URL.createObjectURL(messageImageInput.files[0]));
		message.messageImageUrl = URL.createObjectURL(messageImageInput.files[0]);
	}
	let message = {};
	document.getElementById("sendImageMessageButton").onclick = () => {
		if(messageImageInput.files.length === 0) {
			alert("Please select the image to send");
			return;
		}
		document.getElementById("submitImageInputButton").click();
		document.getElementById("backgroundTint").click();
		let messageHTML = renderSentMessage(message);
		let messagesContainer = document.getElementById("messagesContainer");
		messagesContainer.innerHTML += messageHTML;
		messagesContainer.scrollTo({
			top: messagesContainer.scrollHeight,
			behavior: "smooth"
		})
	}

	let currentDate = new Date();
	let messageEpoch = currentDate.getTime();
	let messageDate = months[currentDate.getMonth()] + ", " + currentDate.getDate() + " " + currentDate.getHours() + ":" + currentDate.getMinutes();
	
	message = {
		"messageText": document.getElementById("imageMessageTextArea").value,
		"messageEpoch": messageEpoch,
		"messageDate": messageDate
	};

	document.getElementById("messageEpochInput").value = messageEpoch;
	document.getElementById("messageDateInput").value = messageDate;
	let sendImageMessagePopup = document.getElementById("sendImageMessagePopup");
	showPopup(sendImageMessagePopup);
	sendImageMessagePopup.style.top = (window.innerHeight - sendImageMessagePopup.offsetHeight) / 2 + "px";
	sendImageMessagePopup.style.left = (window.innerWidth - sendImageMessagePopup.offsetWidth) / 2 + "px";
}

function sendVideoMessage(event) {
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	document.getElementById("receiverEmailAddressInput2").value = receiverEmailAddress;
	
	let messageVideoInput = document.getElementById("messageVideoInput");
	let sendVideoMessageVideo = document.getElementById("sendVideoMessageVideo");
	let message = {};
	document.getElementById("changeOrSelectVideo").onclick = () => { messageVideoInput.click(); }
	messageVideoInput.onchange = () => {
		sendVideoMessageVideo.setAttribute("src", URL.createObjectURL(messageVideoInput.files[0]));
		message.messageVideoUrl = URL.createObjectURL(messageVideoInput.files[0]);
	}
	document.getElementById("sendVideoMessageButton").onclick = () => {
		if(messageVideoInput.files.length === 0) {
			alert("Please select the image to send");
			return;
		}
		document.getElementById("submitVideoInputButton").click();
		document.getElementById("backgroundTint").click();
		let messageHTML = renderSentMessage(message);
		let messagesContainer = document.getElementById("messagesContainer");
		messagesContainer.innerHTML += messageHTML;
		messagesContainer.scrollTo({
			top: messagesContainer.scrollHeight,
			behavior: "smooth"
		})
	}

	let currentDate = new Date();
	let messageEpoch = currentDate.getTime();
	let messageDate = months[currentDate.getMonth()] + ", " + currentDate.getDate() + " " + currentDate.getHours() + ":" + currentDate.getMinutes();
		
	message = {
		"messageText": document.getElementById("videoMessageTextArea").value,
		"messageEpoch": messageEpoch,
		"messageDate": messageDate
	};

	document.getElementById("messageEpochInput2").value = messageEpoch;
	document.getElementById("messageDateInput2").value = messageDate;
	let sendVideoMessagePopup = document.getElementById("sendVideoMessagePopup");
	showPopup(sendVideoMessagePopup);
	sendVideoMessagePopup.style.top = (window.innerHeight - sendVideoMessagePopup.offsetHeight) / 2 + "px";
	sendVideoMessagePopup.style.left = (window.innerWidth - sendVideoMessagePopup.offsetWidth) / 2 + "px";
}

function renderSentMessage(message) {
	message.origin = "sentMessage";
	let messageTemplate;
	if(message["messageImageUrl"]) {
		messageTemplate = IMAGE_MESSAGE_TEMPLATE;
	} else if(message["messageVideoUrl"]) {
		messageTemplate = VIDEO_MESSAGE_TEMPLATE;
	} else {
		messageTemplate = TEXT_MESSAGE_TEMPLATE;
	}

	for(let property in message) {
		while(messageTemplate.indexOf("<%=" + property + "%>") >= 0) {
			messageTemplate = messageTemplate.replace("<%=" + property + "%>", message[property]);
		}
	}

	return messageTemplate;
}

function getOlderMessages(event) {
	let senderEmailAddress = event.target.getAttribute("senderEmailAddress");
	let receiverEmailAddress = event.target.getAttribute("receiverEmailAddress");
	let amount = 20;
	let startIndex = -1 * downloadedMessages[receiverEmailAddress + "startIndex"];
	sendAjaxRequest("POST", "/get-messages", {
			"startIndex": startIndex,
			"amount": amount,
			"receiverEmailAddress": receiverEmailAddress
		}, messagesHTML => {
			if(messagesHTML) {
				downloadedMessages[receiverEmailAddress] = messagesHTML + downloadedMessages[receiverEmailAddress];
				downloadedMessages[receiverEmailAddress + "startIndex"] += 20;
				messagesContainer.innerHTML = messagesHTML + messagesContainer.innerHTML;
				messagesContainer.scrollTo({
					top: 0,
					behavior: "smooth"
				})
			} else {
				alert("There are no more messages!");
			}
		})
}

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
		} else {
			console.log("responseText", xhr.responseText);
		}
	};

	xhr.open(method, url);
	xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
	xhr.send(JSON.stringify(dataObject));
}

//REAL-TIME-NESS
const socket = io("127.0.0.1:4430");

let dataContainer = document.getElementById("dataContainer");
let emailAddress = dataContainer.children[0].innerHTML;

socket.on("connection", () => {
	socket.emit("online", emailAddress);

	socket.on("friend-request", friendRequestHTML => {
		document.getElementById("friendRequestsContaner").innerHTML += friendRequestHTML;
	})

	socket.on("friend", friendJSONString => {
		let friendJSON = JSON.parse(friendJSONString);
		document.getElementById("friendsContaner").innerHTML += friendJSON.friendsTabFriend;
		document.getElementById("messagesTabFriendsContainer").innerHTML += friendJSON.messageTabFriend;
	})

	socket.on("delete-friend-request", receiverEmailAddress => {
		let sentFriendRequest = document.getElementById(receiverEmailAddress + "SentFriendRequest");
		document.getElementById("sentFriendRequestsPopup").children[0].removeChild(sentFriendRequest);
	})

	socket.on("cancel-sent-friend-request", senderEmailAddress => {
		let sentFriendRequestsPopup = document.getElementById("sentFriendRequestsPopup");
		let friendRequest = document.getElementById(senderEmailAddress + "FriendRequest");
		sentFriendRequestsPopup.children[0].removeChild(friendRequest);
	})

	socket.on("unfriend", friendEmailAddress => {
		let friend = document.getElementById(friendEmailAddress + "Friend");
		document.getElementById("friendsContaner").removeChild(friend);
		let friend2 = document.getElementById(friendEmailAddress + "MessageTabFriend");
		document.getElementById("messagesTabFriendsContainer").removeChild(friend2);
	})

	socket.on("message", messageJSONString => {
		let messageJSON = JSON.parse(messageJSONString);
		let conversation = document.getElementById(messageJSON.senderEmailAddress + "ConversationElement");
		if(conversation) {
			conversation.children[1].children[1].value = messageJSON.messageHTML.substring(messageJSON.messageHTML.indexOf("\"messageTextContainer\">") + 23, messageJSON.messageHTML.lastIndexOf("_"));
			if(downloadedMessages[messageJSON.senderEmailAddress]) {
				downloadedMessages[messageJSON.senderEmailAddress] += messageJSON.messageHTML;
			}
			if(document.getElementById("chatScreen").style.display !== "none") {
				if(sendTextMessageButton.getAttribute("receiverEmailAddress") === messageJSON.senderEmailAddress) {
					document.getElementById("messagesContainer").innerHTML += messageJSON.messageHTML;
				}
			}
		} else {
			let conversation = makeNewConversation(messageJSON);
			document.getElementById("actualConversationsContainer").innerHTML += conversation;
		}
	})
});


const CONVERSATION_TEMPLATE = "<div id=\"<%=emailAddress%>ConversationElement\" class=\"conversationElement\" src=\"<%=profilePicture%>\" receiverEmailAddress=\"<%=emailAddress%>\" username=\"<%=username%>\" onclick=\"openChatScreen(event)\">\n<img src=\"<%=profilePicture%>\" src=\"<%=profilePicture%>\" username=\"<%=username%>\" receiverEmailAddress=\"<%=emailAddress%>\">\n<div class=\"buttonsContainer\" src=\"<%=profilePicture%>\" username=\"<%=username%>\" receiverEmailAddress=\"<%=emailAddress%>\">\n<input type=\"text\" value=\"<%=username%>\" username=\"<%=username%>\" src=\"<%=profilePicture%>\" receiverEmailAddress=\"<%=emailAddress%>\" readonly>\n<input type=\"text\" value=\"<%=lastMessage%>\" username=\"<%=username%>\" src=\"<%=profilePicture%>\" receiverEmailAddress=\"<%=emailAddress%>\" readonly>\n</div>\n</div>";
function makeNewConversation(message) {
	let conversation = CONVERSATION_TEMPLATE;
	message.emailAddress = message.senderEmailAddress;
	message.profilePicture = "../images/default-profile-picture.png";
	message.username = message.senderEmailAddress;
	message.lastMessage = message.messageHTML.substring(message.messageHTML.indexOf("\"messageTextContainer\">") + 23, message.messageHTML.lastIndexOf("_"));
	for(let property in message) {
		while(conversation.indexOf("<%=" + property + "%>") >= 0) {
			conversation = conversation.replace("<%=" + property + "%>", message[property]);
		}
	}

	return conversation;
}

function addVideoPost() {
	window.location.href = "make-video-post.html";
}