const fs = require('fs');

const forms = document.getElementsByClassName('frm');

function FormOpen(frm) {
	for (var form of forms)
		form.classList.add('d-none');

	frm.classList.remove('d-none');
}

global.path = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")) + "/digipixel";
if (!fs.existsSync(global.path))
	fs.mkdirSync(global.path);

global.game = {
	canvas: "DTN5bnJPCdnastuMtKZi4n7eRnmtYNa27K",
	cache: "D6Ma3yvmZLe8SeymppwjmrchYCAEU1thjp"
}

if (fs.existsSync(global.path + "/wallet.dgb")) {
	global.wallet = JSON.parse(fs.readFileSync(global.path + '/wallet.dgb'));
	FormOpen(frmApp);
} else {
	FormOpen(frmStart);
}

