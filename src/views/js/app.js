const fs = require('fs');

const forms = document.getElementsByClassName('frm');
function FormOpen(frm) {
	for (var form of forms)
		form.classList.add('d-none');
	frm.classList.remove('d-none');
}

global.address = {
	canvas: "dgb1qty025tcykkarzfx870q402vkvntxhpt63lt2wd",
	cache: "dgb1qdz9slj6vtyn7nt4k89cdxla3jrf2dwlrzu5zlc"
}

global.api = {
	blockchain: "https://digibyteblockexplorer.com/api/v2",
	ipfs: "https://cloudflare-ipfs.com/ipfs/",
	_blockchain: [
		"https://digiexplorer.info/api/v2",
		"https://digiexplorer.net/api/v2",
		"http://13.114.142.49/api/v2",
		"https://dgbbook.guarda.co/api/v2",
		"https://digibyte.atomicwallet.io/api/v2"
	],
	_ipfs: [
		"https://ipfs.io/ipfs/"
	]
}

global.path = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")) + "/digibytecanvas";
if (!fs.existsSync(global.path))
	fs.mkdirSync(global.path);

if (!fs.existsSync(global.path + "/logs"))
	fs.mkdirSync(global.path + "/logs");

const logFile = (new Date()).toISOString().split('T')[0] + ".log";

if (!fs.existsSync(global.path + "/logs/" + logFile))
	fs.writeFileSync(global.path + "/logs/" + logFile, "");
	
//console.log = (data) => { fs.appendFileSync(global.path + "/logs/" + logFile, (new Date()).toISOString() + ": " + data.toString() + "\n"); }

if (!fs.existsSync(global.path + "/block"))
	fs.writeFileSync(global.path + "/block", "0");

if (fs.existsSync(global.path + "/wallet.dgb")) {
	global.wallet = JSON.parse(fs.readFileSync(global.path + '/wallet.dgb'));

	document.getElementById("qr").src = DigiQR.text(global.wallet.address, 150, 2);
	lblAddress.value = global.wallet.address;
	btnShowCanvas.hidden = false;
} else {
	btnCreateWallet.hidden = false;
}
FormOpen(frmStart);
