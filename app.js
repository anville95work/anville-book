const PORT = 4430,
	express = require("express"),
	serveStatic = require("serve-static"),
	bodyParser = require("body-parser"),
	{ MongoClient, ObjectId, db } = require("mongodb"),
	cookieParser = require("cookie-parser"),
	fs = require("fs"),
	{ User } = require("./adt.js"),
	multer = require("multer"),
	upload = multer({ dest: "./images" }),
	path = require("path"),
	ejs = require("ejs"),
	{ Readable } = require("stream"),
	util = require("./util.js"),
	socketIO = require("socket.io");

let mongoClient = new MongoClient("mongodb://127.0.0.1:27017/");
connectToDBServer();

const app = express()
	.use(bodyParser.urlencoded({extended: true}))
	.post("/sign-up/", (req, res, next) => {
		let emailAddress = req.body["emailAddress"];
		let password = req.body["password"];
		let username = req.body.username;

		createUser(emailAddress, password, username)
			.then((_id) => {
				res.writeHead(301, { "Set-Cookie": "uid=" + _id + "; Path=/", "Location": "http://" + req.headers.host + "/html/dashboard.html"});
				res.end();
			})
			.catch(error => {
				if(error.anvilleErrorName === "userExistsError") {
					res.writeHead(301, {"Location": "http://" + req.headers["host"] + "/html/go-to-login.html"});
					res.end();
				}
			});
	})
	.post("/sign-up/with-profile-pic/", upload.fields([ {"name": "profilePicture", maxCount: 1 }, {"name": "coverPicture", maxCount: 1 }]), (req, res, next) => {
		let files = req.files;
		let emailAddress = req.body["emailAddress"];
		let password = req.body["password"];
		let username = req.body["username"];

		createUser(emailAddress, password, username, files )
			.then((_id) => {
				renameProfileAndCoverPhotos(files, emailAddress)
					.then(() => {
						res.writeHead(301, { "Set-Cookie": "uid=" + _id + "; Path=/", "Location": "http://" + req.headers.host + "/html/dashboard.html"});
						res.end();
					});
			})
			.catch(error => {
				if(error.anvilleErrorName === "userExistsError") {
					res.writeHead(301, {"Location": "http://" + req.headers["host"] + "/html/go-to-login.html"});
					res.end();
				}
			});
	})
	.post("/login", (req, res, next) => {
		let emailAddress = req.body.emailAddress;
		let password = req.body.password;
		loginUser(emailAddress, password)
			.then(_id => {
				res.writeHead(301, { "Set-Cookie": "uid=" + _id + "; Path=/", "Location": "http://" + req.headers.host + "/html/dashboard.html" });
				res.end();
			})
			.catch(error => {
				if(error.anvilleErrorName === "passwordIncorrectError" || error.anvilleErrorName === "emailAddressIncorrectError") {
					res.writeHead(301, {"Set-Cookie": "status=authFailed; Path=/", "Location": "http://" + req.headers.host + "/index.html"});
					res.end();
				}
			})
	})
	.use(cookieParser())
	.post("/edit-profile", (req, res, next) => {
		let _id = req.cookies.uid;
		let emailAddress = req.body.emailAddress;
		let username = req.body.username;

		if(_id) {
			updateDataInDB("users", {"_id": new ObjectId(_id)}, {$set: { username: username, emailAddress: emailAddress } })
				.then(() => {
					res.writeHead(301, {"Location": "http://" + req.headers.host + "/html/profile.html"});
					res.end();
				})
		} else {
			res.writeHead(301, {"Location": "http://" + req.headers.host + "/index.html"});
			res.end();
		}
	})
	.post("/edit-profile/with-profile-pic", upload.fields([{ "name": "profilePicture", "maxCount": 1 }, { "name": "coverPicture", "maxCount": 1 }]), (req, res, next) => {
		let _id = req.cookies.uid;
		let files = req.files;
		let emailAddress = req.body.emailAddress;
		let username = req.body.username;

		if(_id) {
			renameProfileAndCoverPhotos(files, emailAddress)
				.then(() => {
					let updateObject = { "emailAddress": emailAddress, "username": username };
					if(files["profilePicture"]) {
						updateObject.profilePicture = "/profilePicture/" + emailAddress + "-profilePicture" + path.extname(files["profilePicture"][0].originalname);
					}

					if(files["coverPicture"]) {
						updateObject.coverPicture = "/coverPicture/" + emailAddress + "-coverPicture" + path.extname(files["coverPicture"][0].originalname);
					}

					updateDataInDB("users", { _id: new ObjectId(_id) }, { $set: updateObject })
						.then(() => {
							res.writeHead(301, {"Location": "http://" + req.headers.host + "/html/profile.html"});
							res.end();
						})
				})
		}
	})
	.get("/html/dashboard.html", (req, res, next) => {
		let _id = req.cookies.uid;
		if(_id) {
			readDataFromDB("users", { "_id": new ObjectId(_id) }).then((user) => {
				if(user) {
					getFriendRequests(user, friendRequestHTML => {
						getSentFriendRequests(user, sentFriendRequestsHTML => {
							getFriends(user, friendsHTML => {
								getPosts(user)
									.then(posts => {
										getConversations(user)
											.then(conversationsHTML => {
												user.sentFriendRequestsHTML = sentFriendRequestsHTML;
												user.friendRequestsHTML = friendRequestHTML;
												user.friendsHTML = friendsHTML[0];
												user.messageTabFriends = friendsHTML[1];
												user.posts = posts.postsHTML;
												user.videoPosts = posts.videoPostsHTML;
												user.conversationsHTML = conversationsHTML;
												let userIDsToExclude = [ _id ];
												if(user.friendRequests) {
													for(let i = 0; i < user.friendRequests.length; i++) {
														userIDsToExclude[userIDsToExclude.length] = user.friendRequests[i]["senderId"];
													}	
												}
												if(user.friends) {
													for(let i = 0; i < user.friends.length; i++) {
														userIDsToExclude[userIDsToExclude.length] = user.friends[i]["friendId"];
													}	
												}
												if(user.sentFriendRequests) {
													for(let i = 0; i < user.sentFriendRequests.length; i++) {
														userIDsToExclude[userIDsToExclude.length] = user.sentFriendRequests[i]["receiverId"];
													}
												}

												getStrangers(user, userIDsToExclude, ["./html-templates/home-tab-stranger.html", "./html-templates/friends-tab-stranger.html"], strangersHTMLArray => {
													user.strangers = strangersHTMLArray[0];
													user.friendsTabStrangers = strangersHTMLArray[1];
													util.renderFile("./public/html/dashboard.html", user, {/*No options yet*/}, (error, dashboardHTML) => {
														if(error) {
															throw error;
														}
														Readable.from(dashboardHTML).pipe(res);
													})
												})
											})
									})
							})
							
						})
						
					})
				
				} else {
					res.writeHead(301, { "Clear-Cookie": "uid", "Location": "http://" + req.headers.host + "/index.html"});
					res.end();
				}
			})
		} else {
			res.writeHead(301, { "Location": "http://" + req.headers.host + "/index.html" });
			res.end();
		}
	})
	.get("/profilePicture/*", (req, res, next) => {
		let _id = req.cookies.uid;
		if(_id) {
			let profilePictureFileName = req.url.substring(req.url.lastIndexOf("/"));
			res.sendFile(__dirname + "/images" + profilePictureFileName);
		} else {
			next();
		}
	})
	.get("/coverPicture/*", (req, res, next) => {
		let _id = req.cookies.uid;
		if(_id) {
			let coverPictureFileName = req.url.substring(req.url.lastIndexOf("/"));
			res.sendFile(__dirname + "/images" + coverPictureFileName);
		} else {
			next();
		}
	})
	.get("/html/profile.html", (req, res, next) => {
		let _id = req.cookies.uid;
		if(_id) {
			readDataFromDB("users", { _id: new ObjectId(_id)} )
				.then(user => {
					if(user) {
						getProfileFriends(user)
							.then(friendsHTML => {
								user.friendsHTML = friendsHTML;
								util.renderFile("./public/html/profile.html", user, {}, (error, profileHTML) => {
									if(error)
										throw error;
									Readable.from(profileHTML).pipe(res);
								})
							})
					} else {
						res.writeHead(301, { "Clear-Cookie": "uid", "Location": "http://" + req.headers.host + "/index.html"});
						res.end();
					}
				})
		} else {
			res.writeHead(301, { "Location": "http://" + req.headers.host + "/index.html" });
			res.end();
		}
	})
	.use(bodyParser.json())
	.post("/send-friend-request", (req, res, next) => {
		let senderEmailAddress = req.body.senderEmailAddress;
		let receiverEmailAddress = req.body.receiverEmailAddress;

		readDataFromDB("users", { emailAddress: senderEmailAddress })
			.then(senderUser => {
				readDataFromDB("users", { emailAddress: receiverEmailAddress })
					.then(receiverUser => {
						updateDataInDB("users", senderUser, { $push: { "sentFriendRequests": { "receiverId": receiverUser._id.toString() } } })
							.then(() => {
								updateDataInDB("users", receiverUser, { $push: { "friendRequests": { "senderId": senderUser._id.toString() } } })
									.then(() => {
										res.writeHead(200, { "Content-Type": "text/plain" });
										res.end("Friend request sent to " + senderEmailAddress + "successfully!");

										if(onlineUsersSockets[receiverEmailAddress]) {
											renderFriendRequest(senderUser, receiverUser)
												.then(friendRequestHTML => {
													onlineUsersSockets[receiverEmailAddress].emit("friend-request", friendRequestHTML);
												})
										}
									})
							})
					})
			})

	})
	.post("/accept-friend-request", (req, res, next) => {
		let receiverEmailAddress = req.body.receiverEmailAddress;
		let senderEmailAddress = req.body.senderEmailAddress;
		
		readDataFromDB("users", { "emailAddress": receiverEmailAddress })
			.then(receiverUser => {
				readDataFromDB("users", { "emailAddress": senderEmailAddress })
					.then(senderUser => {
						updateDataInDB("users", receiverUser, { $push: { "friends": { "friendId": senderUser._id.toString(), "following": true } }, $pull: { "friendRequests": { "senderId": senderUser._id.toString() } } })
							.then(() => {
								updateDataInDB("users", senderUser, { $push: { "friends": { "friendId": receiverUser._id.toString(), "following": true } }, $pull: { "sentFriendRequests": { "receiverId": receiverUser._id.toString() } } })
									.then(() => {
										res.writeHead(200, { "Content-Type": "text/plain" });
										res.end("You are now friends with " + senderEmailAddress);

										if(onlineUsersSockets[senderEmailAddress]) {
											renderFriend(senderUser, receiverUser)
												.then(friendJSON => {
													onlineUsersSockets[senderEmailAddress].emit("friend", JSON.stringify(friendJSON));
												})
										}
									})
							})
					})
			})
	})
	.post("/unfollow", (req, res, next) => {
		let _id = req.cookies.uid;
		let emailAddress = req.body.emailAddress;
		let friendEmailAddress = req.body.friendEmailAddress;

		updateDataInDB("users", { "emailAddress": friendEmailAddress }, { $set: { "friends.$[ele].following": false } }, { arrayFilters: [ { "ele.friendId": _id } ]})
			.then(() => {
				res.writeHead(200, { "Content-Type": "text/plain" });
				res.end("unfollowed successfully");
			})
	})
	.post("/follow", (req, res, next) => {
		let _id = req.cookies.uid;
		let emailAddress = req.body.emailAddress;
		let friendEmailAddress = req.body.friendEmailAddress;

		updateDataInDB("users", { "emailAddress": friendEmailAddress }, { $set: { "friends.$[ele].following": true } }, { arrayFilters: [ { "ele.friendId": _id } ]})
			.then(() => {
				res.writeHead(200, { "Content-Type": "text/plain" });
				res.end("followed successfully");
			})
	})
	.post("/unfriend", (req, res, next) => {
		let receiverEmailAddress = req.body.friendEmailAddress;
		let senderEmailAddress = req.body.emailAddress;
		
		readDataFromDB("users", { "emailAddress": receiverEmailAddress })
			.then(receiverUser => {
				readDataFromDB("users", { "emailAddress": senderEmailAddress })
					.then(senderUser => {
						updateDataInDB("users", receiverUser, { $pull: { "friends": { "friendId": senderUser._id.toString() } } })
							.then(() => {
								updateDataInDB("users", senderUser, { $pull: { "friends": { "friendId": receiverUser._id.toString() } } })
									.then(() => {
										res.writeHead(200, { "Content-Type": "text/plain" });
										res.end("You are not friends with " + senderEmailAddress + "anymore!");

										if(onlineUsersSockets[receiverEmailAddress]) {
											onlineUsersSockets[receiverEmailAddress].emit("unfriend", senderEmailAddress);
										}
									})
							})
					})
			})
		})
	.post("/cancel-sent-friend-request", (req, res, next) => {
		let senderEmailAddress = req.body.senderEmailAddress;
		let receiverEmailAddress = req.body.receiverEmailAddress;

		readDataFromDB("users", { emailAddress: senderEmailAddress })
			.then(senderUser => {
				readDataFromDB("users", { emailAddress: receiverEmailAddress })
					.then(receiverUser => {
						updateDataInDB("users", senderUser, { $pull: { "sentFriendRequests": { "receiverId": receiverUser._id.toString() } } })
							.then(() => {
								updateDataInDB("users", receiverUser, { $pull: { "friendRequests": { "senderId": senderUser._id.toString() } } })
									.then(() => {
										res.writeHead(200, { "Content-Type": "text/plain" });
										res.end("Friend request cancelled successfully!");

										if(onlineUsersSockets[receiverEmailAddress]) {
											onlineUsersSockets[receiverEmailAddress].emit("cancel-sent-friend-request", senderEmailAddress);
										}
									})
							})
					})
			})
	})
	.post("/delete-friend-request", (req, res, next) => {
		let senderEmailAddress = req.body.senderEmailAddress;
		let receiverEmailAddress = req.body.receiverEmailAddress;

		readDataFromDB("users", { emailAddress: senderEmailAddress })
			.then(senderUser => {
				readDataFromDB("users", { emailAddress: receiverEmailAddress })
					.then(receiverUser => {
						updateDataInDB("users", senderUser, { $pull: { "sentFriendRequests": { "receiverId": receiverUser._id.toString() } } })
							.then(() => {
								updateDataInDB("users", receiverUser, { $pull: { "friendRequests": { "senderId": senderUser._id.toString() } } })
									.then(() => {
										res.writeHead(200, { "Content-Type": "text/plain" });
										res.end("Friend request deleted successfully!");

										if(onlineUsersSockets[senderEmailAddress]) {
											onlineUsersSockets[senderEmailAddress].emit("delete-friend-request", receiverEmailAddress);
										}
									})
							})
					})
			})
	})
	.post("/make-text-post", (req, res, next) => {
		let _id = req.cookies.uid;
		let postEpoch = req.body.postEpoch;
		let postText = req.body.postText;
		let postDate = req.body.postDate;
		let postBackgroundColor = req.body.postBackgroundColor;
		if(_id) {
			readDataFromDB("users", { _id: new ObjectId(_id) })
				.then(user => {
					if(user) {
						updateDataInDB("users", user, { $push: { "textPosts": { "postText": postText, "postBackgroundColor": postBackgroundColor, "postDate": postDate, "postEpoch": postEpoch } } })
							.then(() => {
								res.writeHead(200, { "Content-Type": "text/plain" });
								res.end("Text post made successfully!");
							})
						} else {
							res.writeHead(301, { "Clear-Cookie": "uid", "Location": "http://" + req.headers.host + "/index.html"});
							res.end();
						}
				})
		} else {
			res.writeHead(301, { "Location": "http://" + req.headers.host + "/index.html" });
			res.end();
		}
	})
	.post("/make-image-post", upload.single("postImageInput"), (req, res, next) => {
		let postImage = req.file;
		let _id = req.cookies.uid;
		let postEpoch = req.body.postEpoch;
		let postText = req.body.postText;
		let postDate = req.body.postDate;
		let postBackgroundColor = req.body.postBackgroundColor;
		if(_id) {
			readDataFromDB("users", { _id: new ObjectId(_id) })
				.then(user => {
					renameFiles(0, [ postImage ], [ "./imagePosts/" + user.emailAddress + "-" + postEpoch + path.extname(postImage.originalname) ])
						.then(() => {
							updateDataInDB("users", user, { $push: { "imagePosts": { "postText": postText, "postBackgroundColor": postBackgroundColor, "postDate": postDate, "postEpoch": postEpoch, "postImageUrl": "/postImage/" + user.emailAddress + "-" + postEpoch + path.extname(postImage.originalname) } } })
								.then(() => {
									res.writeHead(301, { "Location": "http://" + req.headers.host + "/html/dashboard.html" });
									res.end("Image post made successfully!");
								})
						})
				})
		} else {
			res.writeHead(301, { "Location": "http://" + req.headers.host + "/index.html" });
			res.end();
		}
	})
	.get("/postImage/*", (req, res, next) => {
		let _id = req.cookies.uid;
		if(_id) {
			let postImageFileName = req.url.substring(req.url.lastIndexOf("/"));
			res.sendFile(__dirname + "/imagePosts" + postImageFileName);
		} else {
			next();
		}
	})
	.post("/make-video-post", upload.single("postVideoInput"), (req, res, next) => {
		let postVideo = req.file;
		let _id = req.cookies.uid;
		let postEpoch = req.body.postEpoch;
		let postText = req.body.postText;
		let postDate = req.body.postDate;
		let postBackgroundColor = req.body.postBackgroundColor;
		if(_id) {
			readDataFromDB("users", { _id: new ObjectId(_id) })
				.then(user => {
					renameFiles(0, [ postVideo ], [ "./videoPosts/" + user.emailAddress + "-" + postEpoch + path.extname(postVideo.originalname) ])
						.then(() => {
							updateDataInDB("users", user, { $push: { "videoPosts": { "postText": postText, "postBackgroundColor": postBackgroundColor, "postDate": postDate, "postEpoch": postEpoch, "postVideoUrl": "/postVideo/" + user.emailAddress + "-" + postEpoch + path.extname(postVideo.originalname) } } })
								.then(() => {
									res.writeHead(301, { "Location": "http://" + req.headers.host + "/html/dashboard.html" });
									res.end("Image post made successfully!");
								})
						})
				})
		} else {
			res.writeHead(301, { "Location": "http://" + req.headers.host + "/index.html" });
			res.end();
		}
	})
	.get("/postVideo/*", (req, res, next) => {
		let _id = req.cookies.uid;
		if(_id) {
			let postVideoFileName = req.url.substring(req.url.lastIndexOf("/"));
			res.sendFile(__dirname + "/videoPosts" + postVideoFileName);
		} else {
			next();
		}
	})
	.post("/send-text-message", (req, res, next) => {
		let _id = req.cookies["uid"];
		let receiverEmailAddress = req.body.receiverEmailAddress;
		let messageText = req.body.messageText;
		let messageEpoch = req.body.messageEpoch;
		let messageDate = req.body.messageDate;
		readDataFromDB("users", { "_id": new ObjectId(_id) })
			.then(senderUser => {
				readDataFromDB("users", { "emailAddress": receiverEmailAddress })
					.then(receiverUser => {
						let conversationName = resolveConversationName(senderUser._id.toString(), receiverUser._id.toString());
						readDataFromDB("conversations", { "conversationName": conversationName })
							.then(conversation => {
								let message = {
									"messageId": senderUser._id.toString() + messageEpoch,
									"messageText": messageText,
									"messageDate": messageDate
								}
								if(conversation) {
									updateDataInDB("conversations", { "conversationName": conversationName }, { "$push": { "messages": message } })
										.then(() => {
											res.writeHead(200, { "Content-Type": "text/plain" });
											res.end("Text message sent successfully!");

											if(onlineUsersSockets[receiverEmailAddress]) {
												renderMessage(senderUser, message)
													.then(messageHTML => {
														onlineUsersSockets[receiverEmailAddress].emit("message", JSON.stringify({ "senderEmailAddress": senderUser.emailAddress, "messageHTML": messageHTML }))
													})
											}
										})
								} else {
									//updateDataInDB("conversations", { $set: { "conversationName": conversationName, "messages": [ { "messageText": messageText, "messageEpoch": messageEpoch, "messageDate": messageDate } ] } })
									writeDataToDB("conversations", { "conversationName": conversationName, "messages": [ message ] })
										.then(() => {
											updateDataInDB("users", senderUser, { "$push": { "conversations": { "friendId": receiverUser._id.toString() } } })
												.then(() => {
													updateDataInDB("users", receiverUser, { $push: { "conversations": { "friendId": senderUser._id.toString() } } })
														.then(() => {
															res.writeHead(200, { "Content-Type": "text/plain" });
															res.end("Text message sent successfully!");

															if(onlineUsersSockets[receiverEmailAddress]) {
																renderMessage(senderUser, message)
																	.then(messageHTML => {
																		onlineUsersSockets[receiverEmailAddress].emit("message", JSON.stringify({ "senderEmailAddress": senderUser.emailAddress, "messageHTML": messageHTML }))
																	})
															}
														})
												})
										})
								}
							})
					})
			})
	})
	.post("/send-image-message", upload.single("messageImageInput"), (req, res, next) => {
		let _id = req.cookies["uid"];
		let receiverEmailAddress = req.body["receiverEmailAddress"];
		let messageText = req.body.messageText;
		let messageEpoch = req.body.messageEpoch;
		let messageDate = req.body.messageDate;
		let messageImage = req.file;
		readDataFromDB("users", { _id: new ObjectId(_id) })
			.then(senderUser => {
				readDataFromDB("users", { emailAddress: receiverEmailAddress })
					.then(receiverUser => {
						let messageId = senderUser._id.toString() + messageEpoch;
						renameFiles(0, [ messageImage ], [ "./imageMessages/" +  messageId + path.extname(messageImage.originalname)])
							.then(() => {
								let conversationName = resolveConversationName(senderUser._id.toString(), receiverUser._id.toString());
								readDataFromDB("conversations", { "conversationName": conversationName })
									.then(conversation => {
										let message = {
											"messageId": messageId,
											"messageText": messageText,
											"messageDate": messageDate,
											"messageImageUrl": "/imageMessages/" + messageId + path.extname(messageImage.originalname)
										}
										if(conversation) {
											updateDataInDB("conversations", { "conversationName": conversationName }, { "$push": { "messages": message } })
												.then(() => {
													res.writeHead(304, { "Content-Type": "text/plain" });
													res.end("Image message sent successfully!");

													if(onlineUsersSockets[receiverEmailAddress]) {
														renderMessage(senderUser, message)
															.then(messageHTML => {
																onlineUsersSockets[receiverEmailAddress].emit("message", JSON.stringify({ "senderEmailAddress": senderUser.emailAddress, "messageHTML": messageHTML }))
															})
													}
												})
										} else {
											//updateDataInDB("conversations", { $set: { "conversationName": conversationName, "messages": [ { "messageText": messageText, "messageEpoch": messageEpoch, "messageDate": messageDate } ] } })
											writeDataToDB("conversations", { "conversationName": conversationName, "messages": [ message ] })
												.then(() => {
													updateDataInDB("users", senderUser, { "$push": { "conversations": { "friendId": receiverUser._id.toString() } } })
														.then(() => {
															updateDataInDB("users", receiverUser, { $push: { "conversations": { "friendId": senderUser._id.toString() } } })
																.then(() => {
																	res.writeHead(304, { "Content-Type": "text/plain" });
																	res.end("Image message sent successfully!");

																	if(onlineUsersSockets[receiverEmailAddress]) {
																		renderMessage(senderUser, message)
																			.then(messageHTML => {
																				onlineUsersSockets[receiverEmailAddress].emit("message", JSON.stringify({ "senderEmailAddress": senderUser.emailAddress, "messageHTML": messageHTML }))
																			})
																	}
																})
														})
												})
										}
									})
							})
					})
			})
	})
	.post("/send-video-message", upload.single("messageVideoInput"), (req, res, next) => {
		let _id = req.cookies["uid"];
		let receiverEmailAddress = req.body["receiverEmailAddress"];
		let messageText = req.body.messageText;
		let messageEpoch = req.body.messageEpoch;
		let messageDate = req.body.messageDate;
		let messageVideo = req.file;
		console.log("receiverEmailAddress", receiverEmailAddress);
		readDataFromDB("users", { _id: new ObjectId(_id) })
			.then(senderUser => {
				readDataFromDB("users", { emailAddress: receiverEmailAddress })
					.then(receiverUser => {
						let messageId = senderUser._id.toString() + messageEpoch;
						renameFiles(0, [ messageVideo ], [ "./videoMessages/" +  messageId + path.extname(messageVideo.originalname)])
							.then(() => {
								let conversationName = resolveConversationName(senderUser._id.toString(), receiverUser._id.toString());
								readDataFromDB("conversations", { "conversationName": conversationName })
									.then(conversation => {
										let message = {
											"messageId": messageId,
											"messageText": messageText,
											"messageDate": messageDate,
											"messageVideoUrl": "/videoMessages/" + messageId + path.extname(messageVideo.originalname)
										}
										if(conversation) {
											updateDataInDB("conversations", { "conversationName": conversationName }, { "$push": { "messages": message } })
												.then(() => {
													res.writeHead(304, { "Content-Type": "text/plain" });
													res.end("Image message sent successfully!");

													if(onlineUsersSockets[receiverEmailAddress]) {
														renderMessage(senderUser, message)
															.then(messageHTML => {
																onlineUsersSockets[receiverEmailAddress].emit("message", JSON.stringify({ "senderEmailAddress": senderUser.emailAddress, "messageHTML": messageHTML }))
															})
													}
												})
										} else {
											//updateDataInDB("conversations", { $set: { "conversationName": conversationName, "messages": [ { "messageText": messageText, "messageEpoch": messageEpoch, "messageDate": messageDate } ] } })
											writeDataToDB("conversations", { "conversationName": conversationName, "messages": [ message ] })
												.then(() => {
													updateDataInDB("users", senderUser, { "$push": { "conversations": { "friendId": receiverUser._id.toString() } } })
														.then(() => {
															updateDataInDB("users", receiverUser, { $push: { "conversations": { "friendId": senderUser._id.toString() } } })
																.then(() => {
																	res.writeHead(304, { "Content-Type": "text/plain" });
																	res.end("Image message sent successfully!");

																	if(onlineUsersSockets[receiverEmailAddress]) {
																		renderMessage(senderUser, message)
																			.then(messageHTML => {
																				onlineUsersSockets[receiverEmailAddress].emit("message", JSON.stringify({ "senderEmailAddress": senderUser.emailAddress, "messageHTML": messageHTML }))
																			})
																	}
																})
														})
												})
										}
									})
							})
					})
			})
	})
	.post("/get-messages", (req, res, next) => {
		let _id = req.cookies.uid;
		let startIndex = req.body.startIndex;
		let amount = req.body.amount;
		let receiverEmailAddress = req.body.receiverEmailAddress;
		readDataFromDB("users", { emailAddress: receiverEmailAddress })
			.then(receiverUser => {
				let conversationName = resolveConversationName(_id, receiverUser._id.toString());
				getMessages(_id, conversationName, startIndex, amount, messagesHTML => {
					res.writeHead(200, "Content-Type", "text/html");
					res.end(messagesHTML);
				})
			})
	})
	.get("/imageMessages/*", (req, res, next) => {
		let _id = req.cookies.uid;
		if(_id) {
			readDataFromDB("users", { _id: new ObjectId(_id) })
				.then(user => {
					if(user) {
						let messageImageName = req.url.substring(req.url.lastIndexOf("/"));
						res.sendFile(__dirname + "/imageMessages" + messageImageName);
					} else {
						res.writeHead(301, { "Clear-Cookie": "uid", "Location": "http://" + req.headers.host + "/index.html"});
						res.end();
					}
				})
		} else {
			res.writeHead(301, { "Location": "http://" + req.headers.host + "/index.html"});
			res.end();
		}
	})
	.get("/videoMessages/*", (req, res, next) => {
		let _id = req.cookies.uid;
		if(_id) {
			readDataFromDB("users", { _id: new ObjectId(_id) })
				.then(user => {
					if(user) {
						let messageVideoName = req.url.substring(req.url.lastIndexOf("/"));
						res.sendFile(__dirname + "/videoMessages" + messageVideoName);
					} else {
						res.writeHead(301, { "Clear-Cookie": "uid", "Location": "http://" + req.headers.host + "/index.html"});
						res.end();
					}
				})
		} else {
			res.writeHead(301, { "Location": "http://" + req.headers.host + "/index.html"});
			res.end();
		}
	})
	.use(serveStatic(__dirname + "/public"))
	.use((error, req, res, next) => {
		console.error("There was an uhandled error!");
		console.error("error", error);
		res.writeHead(500, {"Content-Type": "text/plain"});
		res.end("Error 500: Sorry, there was an error during processing of your data.");
	})
	.listen(PORT, () => {
		console.log("\n");
		console.log("----------------------------------------------");
		console.log("anville-book SERVER RUNNING ON PORT " + PORT);
		console.log("----------------------------------------------");
		console.log("\n");
	});

var onlineUsersSockets = {};
var socketIDs = {};
const io = socketIO(app);
io.on("connection", socket => {
	socket.emit("connection");

	socket.on("online", emailAddress => {
		onlineUsersSockets[emailAddress] = socket;
		socketIDs[socket.id] = emailAddress;
	})

	socket.on("disconnect", () => {
		delete onlineUsersSockets[socketIDs[socket.id]];
		delete socketIDs[socket.id];
	})
})

async function connectToDBServer() {
	await mongoClient.connect();
	console.log("..........................................");
	console.log("DATABASE SERVER CONNECTED SUCCESSFULLY!");
	console.log("..........................................");
	console.log("\n");
}

async function createUser(emailAddress, password, username, picFiles) {
	let result = await readDataFromDB("users", { "emailAddress": emailAddress });
	if(result) {
		let error = new Error("User with the provided emailAddress already exists!");
		error.anvilleErrorName = "userExistsError";
		throw error;
	}
	let user = new User(emailAddress, password, username, picFiles);
	result = await writeDataToDB("users", user);
	return result.insertedId.toString();
}

async function loginUser(emailAddress, password) {
	let user = await readDataFromDB("users", { "emailAddress": emailAddress});
	if(user) {
		if(user["password"] === password) {
			return user._id;
		} else {
			let error = new Error("Authentication failed, password incorrect");
			error.anvilleErrorName = "passwordIncorrectError";
			throw error;
		}
	} else {
		let error = new Error("Authentication failed, password incorrect");
		error.anvilleErrorName = "emailAddressIncorrectError";
		throw error;
	}
}

async function renameFiles(index, files, newFullFileNames) {
	if(files[index]) {
		fs.rename(files[index].path, newFullFileNames[index], error => {
			if(error) {
				throw error;
			}

			if(index < files.length - 1) {
				renameFiles(index + 1, files, newFullFileNames);
			}
		})
	} else {
		if(index < files.length - 1) {
			renameFiles(index + 1, files, newFullFileNames);
		}
	}
}

async function renameProfileAndCoverPhotos(files, emailAddress) {
	if(files) {
		if(files["profilePicture"]) {
			fs.rename(files["profilePicture"][0].path, "./images/" + emailAddress + "-profilePicture" + path.extname(files["profilePicture"][0].originalname.toLowerCase()), error => {
				if(error) {
					console.log("error renaming the profilePicture", error);
				}
				if(files["coverPicture"]) {
					fs.rename(files["coverPicture"][0].path, "./images/" + emailAddress + "-coverPicture" + path.extname(files["coverPicture"][0].originalname.toLowerCase()), error1 => {
						if(error1) {
							console.log("error renaming the coverPicture", error1);
						}
					})
				}
			})
		} else if(files["coverPicture"]) {
			fs.rename(files["coverPicture"][0].path, "./images/" + emailAddress + "-coverPicture" + path.extname(files["coverPicture"][0].originalname.toLowerCase()), error1 => {
				if(error1) {
					console.log("error renaming the coverPicture", error1);
				}
			})
		}
	}
}

async function getStrangers(currentUser, userIDsToExclude, templateFilePathArray, cb, index, strangers, strangersHTMLArray) {
	if(!index) {
		index = 0;
		strangers = [];
		strangersHTMLArray = [];
		let cursor = mongoClient.db("anville-book").collection("users").aggregate([ { $sample: { size: 20 } } ]);
		for await (const stranger of cursor) {
			if(userIDsToExclude.indexOf(stranger._id.toString()) < 0) {
				stranger.senderEmailAddress = currentUser.emailAddress;
				strangers[strangers.length] = stranger;
			}
		}
	}

	if(strangers.length === 0) {
		strangersHTMLArray = []
		for(let i = 0; i < templateFilePathArray.length; i++) {
			strangersHTMLArray[strangersHTMLArray.length] = "It appears you've booked everyone. Let's wait for new people.";
		}
		cb(strangersHTMLArray);
		return;
	}

	ejsPromiseRenderFileFromObjectArray(templateFilePathArray[index], strangers, 0, "", strangersHTML => {
		strangersHTMLArray[index] = strangersHTML;
		if(index < templateFilePathArray.length - 1) {
			getStrangers(currentUser, userIDsToExclude, templateFilePathArray, cb, index + 1, strangers, strangersHTMLArray);
		} else {
			cb(strangersHTMLArray);
		}
	});
}

async function getFriendRequests(currentUser, cb) {
	if(!currentUser.friendRequests) {
		cb("You have no friend requests yet!");
		return;
	}

	if(currentUser.friendRequests.length === 0) {
		cb("You have no new friend requests yet!");
		return;
	}

	let friendRequestSenders = [];
	for(let i = 0; i < currentUser.friendRequests.length; i++) {
		let friendRequestSender = await readDataFromDB("users", { _id: new ObjectId(currentUser.friendRequests[i]["senderId"]) });
		friendRequestSender.receiverEmailAddress = currentUser.emailAddress;
		friendRequestSenders[friendRequestSenders.length] = friendRequestSender;
	}
	ejsPromiseRenderFileFromObjectArray("./html-templates/friend-request.html", friendRequestSenders, 0, "", (friendRequestsHTML) => {
		cb(friendRequestsHTML);
	})
}

async function renderFriendRequest(senderUser, receiverUser) {
	senderUser.receiverEmailAddress = receiverUser.emailAddress;
	return util.promiseRenderFile("./html-templates/friend-request.html", senderUser);
}

async function getSentFriendRequests(currentUser, cb) {
	if(!currentUser.sentFriendRequests) {
		cb("You have not sent any friend request yet!");
		return;
	}

	if(currentUser.sentFriendRequests.length === 0) {
		cb("You have not sent any new friend request yet!");
		return;
	}

	let sentFriendRequestReceivers = [];
	for(let i = 0; i < currentUser.sentFriendRequests.length; i++) {
		let sentFriendRequestReceiver = await readDataFromDB("users", { _id: new ObjectId(currentUser.sentFriendRequests[i].receiverId) });
		sentFriendRequestReceiver.senderEmailAddress = currentUser.emailAddress;
		sentFriendRequestReceivers[sentFriendRequestReceivers.length] = sentFriendRequestReceiver;
	}
	ejsPromiseRenderFileFromObjectArray("./html-templates/sent-friend-request.html", sentFriendRequestReceivers, 0, "", sentFriendRequestsHTML => {
		cb(sentFriendRequestsHTML);
	})	
}

async function getFriends(currentUser, cb) {
	if(!currentUser.friends) {
		cb(["You have no friends yet!", "You have no friends yet!"]);
		return;
	}

	if(currentUser.friends.length === 0) {
		cb(["It appears you have lost all of your friends!", "It appears you have lost all of your friends!"]);
		return;
	}

	let friends = [];
	for(let i = 0; i < currentUser.friends.length; i++) {
		let friend = await readDataFromDB("users", { "_id": new ObjectId(currentUser.friends[i]["friendId"]) });
		friend.hostEmailAddress = currentUser.emailAddress;
		let currentUserFriend;
		for(let j = 0; j < friend.friends.length; j++) {
			if(friend.friends[j].friendId === currentUser._id.toString()) {
				currentUserFriend = friend.friends[j];
			}
		}
		if(currentUserFriend["following"]) {
			friend.followAction = "Unfollow";
			friend.followMethod = "unfollow";
		} else {
			friend.followAction = "Follow";
			friend.followMethod = "follow";
		}
		friends[friends.length] = friend;
	}
	ejsPromiseRenderFileFromObjectArray("./html-templates/friends-tab-friend.html", friends, 0, "", friendsHTML => {
		ejsPromiseRenderFileFromObjectArray("./html-templates/message-tab-friend.html", friends, 0, "", messageTabFriendsHTML => {
			cb([friendsHTML, messageTabFriendsHTML]);
		})
	})	
}


async function getProfileFriends(currentUser, cb) {
	if(!currentUser.friends) {
		return "You have no friends yet!";
		return;
	}

	if(currentUser.friends.length === 0) {
		return "It appears you have lost all of your friends!";
		return;
	}

	let friends = [];
	for(let i = 0; i < currentUser.friends.length; i++) {
		let friend = await readDataFromDB("users", { "_id": new ObjectId(currentUser.friends[i]["friendId"]) });
		friends[friends.length] = friend;
	}

	let friendsHTML = "";
	for(let i = 0; i < friends.length; i++) {
		friendsHTML += await util.promiseRenderFile("./html-templates/profile-friend.html", friends[i]);
	}

	return friendsHTML;
}


async function renderFriend(senderUser, receiverUser) {
	receiverUser.hostEmailAddress = senderUser.emailAddress;
	receiverUser.followAction = "Unfollow";
	receiverUser.followMethod = "unfollow";

	let friendsTabFriend = await util.promiseRenderFile("./html-templates/friends-tab-friend.html", receiverUser);
	let messageTabFriend = await util.promiseRenderFile("./html-templates/message-tab-friend.html", receiverUser);

	return{
		"friendsTabFriend": friendsTabFriend,
		"messageTabFriend": messageTabFriend
	}
}

async function getPosts(currentUser) {
	if(!currentUser.friends) {
		return { postsHTML:"Make more friends to get posts", videoPostsHTML: "Make friends to get video posts" };
	}

	let postsArray = [];
	let videoPostsArray = [];
	for(let i = 0; i < currentUser.friends.length; i++) {
		let friend = await readDataFromDB("users", { _id: new ObjectId(currentUser.friends[i].friendId) });
		if(friend.textPosts) {
			for(let i = 0; i < 5; i++) {
				if(!friend.textPosts[i]) {
					break;
				}
				postsArray[postsArray.length] = { ...friend, ...friend.textPosts[i] };
			}
		}

		if(friend.imagePosts) {
			for(let i = 0; i < 5; i++) {
				if(!friend.imagePosts[i]) {
					break;
				}
				postsArray[postsArray.length] = { ...friend, ...friend.imagePosts[i] };
			}
		}

		if(friend.videoPosts) {
			for(let i = 0; i < 5; i++) {
				if(!friend.videoPosts[i]) {
					break;
				}
				videoPostsArray[postsArray.length] = { ...friend, ...friend.videoPosts[i] };
			}
		}
	}

	let postsHTML = "";
	for(let i = 0; i < postsArray.length; i++) {
		let postHTML;
		if(postsArray[i]["postImageUrl"]) {			
			postHTML = await util.promiseRenderFile("./html-templates/image-post.html", postsArray[i]);
		}else {			
			postHTML = await util.promiseRenderFile("./html-templates/text-post.html", postsArray[i]);
		}
		postsHTML += postHTML;
	}

	let videoPostsHTML = ""
	for(let i = 0; i < videoPostsArray.length; i++) {
		videoPostsHTML += await util.promiseRenderFile("./html-templates/video-post.html", videoPostsArray[i]);
	}

	return { postsHTML, videoPostsHTML };
}

async function getConversations(currentUser) {
	if(!currentUser.conversations) {
		return "";
	}

	if(currentUser.conversations.length === 0) {
		return "";
	}

	let conversationsArray = [];

	for(let i = 0; i < currentUser.conversations.length; i++) {
		let friend = await readDataFromDB("users", { _id: new ObjectId(currentUser.conversations[i]["friendId"]) });
		let conversationName = resolveConversationName(currentUser._id.toString(), friend._id.toString());
		let messages = (await readDataFromDB("conversations", { "conversationName": conversationName })).messages;
		friend.lastMessage = messages[messages.length - 1]["messageText"];
		conversationsArray[conversationsArray.length] = { ...currentUser.conversations[i], ...friend };
	}

	let conversationsHTML = "";
	for(let i = 0; i < conversationsArray.length; i++) {
		let conversationHTML = await util.promiseRenderFile("./html-templates/conversation.html", conversationsArray[i]);
		conversationsHTML += conversationHTML;
	}
	return conversationsHTML;
}

async function getMessages(_id, conversationName, startIndex, amount, cb, messages, messagesHTML) {
	if(!messages) {
		readDataFromDB("conversations", { "conversationName": conversationName })
			.then(conversation => {
				if(!conversation) { return ""; }
				if(!conversation.messages) { return ""; }
				if(conversation.messages.length === 0) { return ""; }
				if(!startIndex) {
					startIndex = conversation.messages.length - 1;
					amount = 20;
				}
				if(startIndex < 0) {
					startIndex += conversation.messages.length;
				}
				for(let i = 0; i < conversation.messages.length; i++) {
					if(conversation.messages[i].messageId.indexOf(_id) >= 0) {
						conversation.messages[i].origin = "sentMessage";
					} else {
						conversation.messages[i].origin = "receivedMessage";
					}
				}
				getMessages(_id, conversationName, startIndex, amount, cb, conversation.messages, "");
			})
	} else {
		if(!messages[startIndex]) {
			cb(messagesHTML);
			return;
		}
		if(messages[startIndex]["messageImageUrl"]) {
			util.promiseRenderFile("./html-templates/image-message.html", messages[startIndex])
				.then(messageHTML => {
					messagesHTML = messageHTML + messagesHTML;
					if(amount > 0 && startIndex < messages.length) {
						amount -= 1;
						getMessages(_id, conversationName, startIndex - 1, amount, cb, messages, messagesHTML);
					} else {
						cb(messagesHTML);
					}
				})
		} else if(messages[startIndex]["messageVideoUrl"]) {
			util.promiseRenderFile("./html-templates/video-message.html", messages[startIndex])
				.then(messageHTML => {
					messagesHTML = messageHTML + messagesHTML;
					if(amount > 0 && startIndex < messages.length) {
						amount -= 1;
						getMessages(_id, conversationName, startIndex - 1, amount, cb, messages, messagesHTML);
					} else {
						cb(messagesHTML);
					}
				})
		} else {
			util.promiseRenderFile("./html-templates/text-message.html", messages[startIndex])
				.then(messageHTML => {
					messagesHTML = messageHTML + messagesHTML;
					if(amount > 0 && startIndex < messages.length) {
						amount -= 1;
						getMessages(_id, conversationName, startIndex - 1, amount, cb, messages, messagesHTML);
					} else {
						cb(messagesHTML);
					}
				})
		}
	}
}

async function renderMessage(currentUser, message) {
	if(message.messageId.indexOf(currentUser._id.toString()) >= 0) {
		message.origin = "receivedMessage";
	} else {
		message.origin = "sentMessage";
	}

	if(message["messageImageUrl"]) {
		return await util.promiseRenderFile("./html-templates/image-message.html", message);
	} else if(message["messageVideoUrl"]) {
		return await util.promiseRenderFile("./html-templates/video-message.html", message);
	} else {
		return await util.promiseRenderFile("./html-templates/text-message.html", message);
	}
}

function ejsPromiseRenderFileFromObjectArray(templateFilePath, dataObjectArray, index, resultsHTML, cb) {
	ejs.renderFile(templateFilePath, dataObjectArray[index], {}, (error, resultHTML) => {
		if(error) throw error;
		resultsHTML += resultHTML;
		if(index < dataObjectArray.length - 1) {
			ejsPromiseRenderFileFromObjectArray(templateFilePath, dataObjectArray, index + 1, resultsHTML, cb);
		} else {
			cb(resultsHTML);
		}
	})
}

function resolveConversationName(senderId, receiverId) {
	if (senderId.localeCompare(receiverId) < 0) {
		return senderId + "-" + receiverId;
	}
	return receiverId + "-" + senderId;
}

async function writeDataToDB(collection, dataObject) {
	return await mongoClient.db("anville-book").collection(collection).insertOne(dataObject);
}

async function readDataFromDB(collection, queryObject) {
	return await mongoClient.db("anville-book").collection(collection).findOne(queryObject);
}

async function updateDataInDB(collection, filterObject, updateObject, options) {
	return await mongoClient.db("anville-book").collection(collection).updateOne(filterObject, updateObject, options);
}