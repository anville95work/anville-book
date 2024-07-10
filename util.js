const fs = require("fs");
function renderFile(filePath, dataObject, options, cb) {
	fs.readFile(filePath, "utf8", (error, fileString) => {
		if(error) {
			cb(error);
			return;
		}
		for(data in dataObject) {
			while(fileString.indexOf("<%=" + data + "%>") >= 0) {
				fileString = fileString.replace("<%=" + data + "%>", dataObject[data]);
			}
		}
		cb(undefined, fileString);
	})
}

async function promiseRenderFile(filePath, dataObject, options) {
	let fileString = await fs.promises.readFile(filePath, "utf8");
	for(data in dataObject) {
		while(fileString.indexOf("<%=" + data + "%>") >= 0) {
			fileString = fileString.replace("<%=" + data + "%>", dataObject[data]);
		}
	}
	return fileString;
}

module.exports = {
	"renderFile": renderFile,
	"promiseRenderFile": promiseRenderFile
}