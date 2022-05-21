const DigiByte = require('digibyte-js');
const PrivateKey = require('digibyte-js/lib/privatekey');
const Unit = require('digibyte-js/lib/unit');
const Transaction = require('digibyte-js/lib/transaction/transaction');
const Base58 = require('digibyte-js/lib/encoding/base58');
const Script = require('digibyte-js/lib/script/script')

const crypto = require('crypto');

const syncTime = 15000;

let cacheReady = false;

const canvas = imgCanvas.getContext("2d");
canvas.webkitImageSmoothingEnabled = false;
canvas.mozImageSmoothingEnabled = false;
canvas.imageSmoothingEnabled = false;

const chg = imgChanges.getContext("2d");
chg.webkitImageSmoothingEnabled = false;
chg.mozImageSmoothingEnabled = false;
chg.imageSmoothingEnabled = false;

const scene = imgScene.getContext('2d');
scene.webkitImageSmoothingEnabled = false;
scene.mozImageSmoothingEnabled = false;
scene.imageSmoothingEnabled = false;

const stats = {
    sync: false,
    from: 0,
    to: 0,
    txTotal: 0,
    txProcessed: 0,
    page: 0
}

// Utility functions
function SHA256(data) {
    return crypto.createHash('sha256').update(data).digest();
}
function EncryptAES256(data, password) {
    var data = Buffer.from(data);
    var password = SHA256(Buffer.from(password));
    var cipher = crypto.createCipheriv("aes-256-cbc", password, Buffer.alloc(16));
    var encryptedData = cipher.update(data, "utf-8", "hex") + cipher.final("hex");
    return encryptedData;
}
function DecryptAES256(data, password) {
    var data = Buffer.from(data);
    var password = SHA256(Buffer.from(password));
    var decipher = crypto.createDecipheriv("aes-256-cbc", password, Buffer.alloc(16));
    const decryptedData = decipher.update(data, "hex", "utf-8") + decipher.final("utf8");

    return decryptedData;
}
async function GET(url) {
    var r = Math.floor(Math.random() * 100000).toString(16).padStart(6, 0);
    console.log(r + " Making GET Request " + url);
    return new Promise((resolve, reject) => {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.addEventListener("load", (e) => { console.log(r + " Fetched GET Request " + url); resolve(JSON.parse(e.srcElement.responseText)) });
        xmlhttp.addEventListener("error", (e) => { console.log(e); resolve(null); });
        xmlhttp.open("GET", url);
        xmlhttp.send();
    })
}
async function POST(url, data) {
    var r = Math.floor(Math.random() * 100000).toString(16).padStart(6, 0);
    console.log(r + " Making POST Request " + url);
    return new Promise((resolve, reject) => {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.addEventListener("load", (e) => { console.log(r + " Fetched POST Request " + url); resolve(JSON.parse(e.srcElement.responseText)) });
        xmlhttp.addEventListener("error", (e) => { console.log(e); resolve(null); });
        xmlhttp.open("POST", url);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(data);
    })
}
async function Sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}


// Paint functions
const colors = {
    0: "#FFFFFF",
    1: "#E4E4E4",
    2: "#888888",
    3: "#222222",
    4: "#FFA7D1",
    5: "#E50000",
    6: "#E59500",
    7: "#A06A42",
    8: "#E5D900",
    9: "#94E044",
    10: "#02BE01",
    11: "#00D3DD",
    12: "#0083C7",
    13: "#0000EA",
    14: "#CF6EE4",
    15: "#820080",
};
function DrawPixel({ color, x, y }) {
    if (typeof color == "number")
        color = colors[color];

    canvas.fillStyle = color;
    canvas.fillRect(x, y, 1, 1);
}
function ChangePixel({ color, x, y }) {
    if (typeof color == "number")
        color = colors[color];

    chg.fillStyle = color;
    chg.fillRect(x, y, 1, 1);
}

// Cache functions
let image = new Image();


if (fs.existsSync(global.path + "/cache.png"))
    image.src = "file://" + global.path + "/cache.png";
else {
    (async function () {
        var page = 1;
        var pages = 99999;
        var hex = null;
        do {
            var data = await GET(global.api.blockchain + "/address/" + global.address.cache + `?page=${page}&details=txs`);
            pages = data.totalPages;
            var txs = data.transactions;

            while (txs.length != 0) {
                var tx = txs.shift();

                if (tx.vin[0].addresses[0] == global.address.cache) {
                    if (tx.vout[0].isAddress == false) {
                        hex = tx.vout[0].hex;

                        if (parseInt(hex.substring(2, 4), 16) > 75)
                            hex = hex.substring(6, hex.length)
                        else
                            hex = hex.substring(4, hex.length)

                        break;
                    }
                }
            }
            page++;
        } while (hex == null && pages >= page);

        if (hex != null) {
            var hash = hex.substring(0, 64);
            fs.writeFileSync(global.path + "/block", parseInt(hex.substring(64, hex.length), 16).toString());

            image.src = "https://cloudflare-ipfs.com/ipfs/" + Base58.encode(Buffer.from("1220" + hash, 'hex'));
        } else {
            cacheReady = true;
        }
    })()
}

image.onload = function () {
    canvas.drawImage(image, 0, 0, 256, 256);
    DrawCanvas();
    cacheReady = true;
};

// UTXO retreive
let balance = {
    utxo: null,
    satoshis: 0
};
async function RetreiveUTXO() {
    balance.utxo = await GET(global.api.blockchain + "/utxo/" + global.wallet.address);
    balance.satoshis = 0;

    if (balance.utxo == null)
        return console.log("Can't UTXOs retreived");

    for (var utxo of balance.utxo) {
        utxo.satoshis = parseInt(utxo.value);
        balance.satoshis += utxo.satoshis;
    }

    console.log("UTXOs retreived");
}
RetreiveUTXO();
setInterval(RetreiveUTXO, syncTime)

// frmStart
btnCreateWallet.addEventListener('click', async e => {
    FormOpen(frmCreateWallet);
})
btnShowCanvas.addEventListener('click', async e => {
    FormOpen(frmCanvas);
})

// frmCreateWallet
btnSaveWallet.addEventListener('click', async e => {
    if (txtNewPassword.value == txtConfirmPassword.value) {
        var privateKey = new PrivateKey();
        var address = privateKey.toAddress().toString();
        var wif = EncryptAES256(privateKey.toWIF(), txtNewPassword.value).toString('hex')
        delete privateKey;

        global.wallet = { address, wif };
        fs.writeFileSync(global.path + "/wallet.dgb", JSON.stringify(global.wallet));

        document.getElementById("qr").src = DigiQR.text(global.wallet.address, 150, 2);
        lblAddress.value = global.wallet.address;

        FormOpen(frmWallet);
    }
});

// frmWallet
btnCopyAddress.addEventListener('click', async e => {
    lblAddress.select();
    lblAddress.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(lblAddress.value);
});
btnOpenWidthraw.addEventListener('click', async e => {
    FormOpen(frmWidthraw);
});

// frmWidthraw
btnReturnWallet.addEventListener('click', async e => {
    FormOpen(frmWallet);
});
btnWidthraw.addEventListener('click', async e => {
    if (balance.utxo == null) {
        ShowMessage("Can't retreive wallet balance");
        return FormOpen(frmCanvas);
    }

    var key = DecryptAES256(Buffer.from(global.wallet.wif, 'hex'), txtWidthrawPassword.value);

    var transaction = new Transaction()
        .from(balance.utxo)
        .change(txtWidthrawAddress.value)
        .feePerByte(1)
        .sign(key)
        .serialize(true);

    var txid = await POST(global.api.blockchain + "/sendtx/", transaction);

    if (txid == null)
        return ShowMessage("Server unavailave, please try again!");
    if (txid.error)
        return ShowMessage(txid.error);

    ShowMessage("Aprox. " + Unit.fromSatoshis(balance.satoshis).toDGB() + " DGB withdrawn");
    FormOpen(frmCanvas);
});

// frmApp
function ShowMessage(text = null) {
    lblMessage.innerHTML = text || "Block N° " + stats.to + " with " + Unit.fromSatoshis(balance.satoshis).toDGB() + " DGB";
    setTimeout(() => {
        lblMessage.innerHTML = "Block N° " + stats.to + " with " + Unit.fromSatoshis(balance.satoshis).toDGB() + " DGB";
    }, syncTime);
}

btnOpenCanvas.addEventListener('click', async e => {
    FormOpen(frmCanvas);
});

async function CacheCanvas() {
    var url = imgCanvas.toDataURL("image/png");
    const base64Data = url.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(global.path + "/cache.png", base64Data, 'base64');
}
async function SyncCanvas() {

    var data = await GET(global.api.blockchain + "/address/" + global.address.canvas + `?from=${stats.from}&to=${stats.to}&page=${stats.page}&details=txs`);

    if (data == null)
        return setTimeout(SyncCanvas, 100);

    var txs = data.transactions;

    stats.sync = false;
    imgScene.style.cursor = 'wait';
    while (txs.length != 0) {
        var tx = txs.pop();

        if (tx.vout[0].isAddress == false) {
            var hex = tx.vout[0].hex;

            if (parseInt(hex.substring(2, 4), 16) > 75)
                hex = hex.substring(6, hex.length)
            else
                hex = hex.substring(4, hex.length)

            var outs = DecodeChanges(hex);

            if (outs != null)
                if (parseInt(tx.vout[1].value) >= outs.length * 100000000) {
                    for (var o of outs)
                        DrawPixel(o);
                }

            DrawCanvas();
            CacheCanvas();
        }
        fs.writeFileSync(global.path + "/block", (tx.blockHeight - 6).toString())

        stats.txProcessed++;
    }

    if (stats.txProcessed < stats.txTotal) {
        setTimeout(SyncCanvas, 100);
    }
    else {
        stats.sync = true;
        imgScene.style.cursor = 'crosshair';
        setTimeout(GetStats, syncTime);
        ShowMessage();
    }
}
async function GetStats() {
    if (cacheReady == false)
        return setTimeout(GetStats, 500);

    var chain = await GET(global.api.blockchain);

    while (chain == null) {
        global.api._blockchain.push(global.api.blockchain)
        global.api.blockchain = global.api._blockchain.shift();
        var chain = await GET(global.api.blockchain);
    }

    stats.from = parseInt(fs.readFileSync(global.path + "/block"));
    stats.to = chain.backend.blocks;

    var address = await GET(global.api.blockchain + '/address/' + global.address.canvas + `?from=${stats.from}&to=${stats.to}`);
    stats.txTotal = address.txids.length;
    stats.page = Math.ceil(stats.txTotal / 1000);
    SyncCanvas();
}
GetStats();


// frmCanvas

let currentColor = 0;
function ChangeColor(color) {
    currentColor = color;
    paintColor.style = "color: " + colors[color];
}

let changes = [];
function EncodeChanges(chng) {
    var data = "";
    for (var i = 0; i < 16; i++) {
        var points = chng.filter(x => x.color == i);
        while (points.length > 0) {
            var toEncode = points.splice(0, 16);
            data += (toEncode.length - 1).toString(16)
            data += i.toString(16)
            for (var point of toEncode) {
                data += ('0' + point.x.toString(16)).slice(-2);
                data += ('0' + point.y.toString(16)).slice(-2);
            }
        }
    }
    if (data.length > 160)
        return null;

    return Buffer.from(data, 'hex');
}
function DecodeChanges(hex) {
    var result = [];
    var data = new Uint8Array(Buffer.from(hex, 'hex'));
    var i = 0;
    while (true) {
        if (i >= data.length)
            return result;

        var amount = (data[i] >> 4) + 1;
        var color = data[i] & 0x0F;

        for (var j = 0; j < amount; j++) {
            if (++i >= data.length)
                return null;
            var x = data[i];
            if (++i >= data.length)
                return null;
            var y = data[i];
            result.push({ color, x, y });
        }
        ++i;
    }
}


let zoom = 3;
let wx = 0, wy = 0;
function DrawCanvas() {

    chg.clearRect(0, 0, 256, 256);
    for (var pixel of changes)
        ChangePixel(pixel);

    scene.clearRect(0, 0, 256, 256);
    var size = 2 ** (9 - zoom);
    scene.drawImage(imgCanvas, wx * (size / 2), wy * (size / 2), size, size, 0, 0, 256, 256);
    scene.drawImage(imgChanges, wx * (size / 2), wy * (size / 2), size, size, 0, 0, 256, 256);

    scene.strokeStyle = "#26436C";
    if (zoom >= 5) {
        for (var i = 0; i < size; i++) {
            scene.beginPath();
            scene.moveTo(0, i * 256 / size);
            scene.lineTo(256, i * 256 / size);
            scene.stroke();
        }
        for (var i = 0; i < size; i++) {
            scene.beginPath();
            scene.moveTo(i * 256 / size, 0);
            scene.lineTo(i * 256 / size, 256);
            scene.stroke();
        }
    }
}

function EnableArrows() {
    btnUp.disabled = (wy == 0);
    btnLeft.disabled = (wx == 0);
    btnDown.disabled = wy == 2 ** (zoom - 1) * 2 - 2;
    btnRight.disabled = wx == 2 ** (zoom - 1) * 2 - 2;
}

btnUp.addEventListener('click', async e => {
    if (wy - 1 >= 0) wy--;
    EnableArrows();
    DrawCanvas();
});
btnLeft.addEventListener('click', async e => {
    if (wx - 1 >= 0) wx--;
    EnableArrows();
    DrawCanvas();
});
btnDown.addEventListener('click', async e => {
    if (wy + 1 < 2 ** (zoom - 1) * 2 - 1) wy++;
    EnableArrows();
    DrawCanvas();
});
btnRight.addEventListener('click', async e => {
    if (wx + 1 < 2 ** (zoom - 1) * 2 - 1) wx++;
    EnableArrows();
    DrawCanvas();
});
btnZoomIn.addEventListener('click', async e => {
    if (zoom < 8) {
        var prev = 2 ** (zoom - 1) * 2 - 1;
        var post = 2 ** (zoom) * 2 - 1;
        wx = Math.floor((wx / prev) * post);
        wy = Math.floor((wy / prev) * post);
        zoom++;
        EnableArrows();
        DrawCanvas();
    }
})
btnZoomOut.addEventListener('click', async e => {
    if (zoom > 1) {
        var prev = 2 ** (zoom - 1) * 2 - 1;
        var post = 2 ** (zoom - 2) * 2 - 1;
        wx = Math.floor((wx / prev) * post);
        wy = Math.floor((wy / prev) * post);
        zoom--;
        EnableArrows();
        DrawCanvas();
    }
})

btnClear.addEventListener('click', async e => {
    changes = [];

    DrawCanvas();
});

imgScene.addEventListener('mousedown', async e => {
    if (stats.sync === false) return;

    var bx = wx * (2 ** (9 - zoom) / 2);
    var by = wy * (2 ** (9 - zoom) / 2);

    var px = Math.floor(e.layerX / 2 ** (zoom - 1));
    var py = Math.floor(e.layerY / 2 ** (zoom - 1));

    var point = { color: currentColor, x: bx + px, y: by + py };
    changes = changes.filter(p => !(p.x == point.x && p.y == point.y));

    if (e.which == 1)
        changes.push(point);

    DrawCanvas();
});

btnWallet.addEventListener('click', async e => {
    FormOpen(frmWallet);
});

btnBroadcast.addEventListener('click', async e => {
    if (changes.length == 0)
        return ShowMessage("Make some changes before submiting");

    if (balance.utxo == null)
        return ShowMessage("Can't retreive wallet balance");

    var funds = Unit.fromSatoshis(balance.satoshis).toDGB();
    var pixels = changes.length;
    var total = Unit.fromSatoshis(1000 + pixels * 100000000).toDGB();
    var change = Unit.fromSatoshis(balance.satoshis - 1000 - pixels * 100000000).toDGB();

    brBlance.innerHTML = 'Ɗ ' + funds.toFixed(8);
    brChanged.innerHTML = 'Ɗ ' + pixels.toFixed(8);
    brTotal.innerHTML = 'Ɗ ' + total.toFixed(8);
    brChange.innerHTML = 'Ɗ ' + change.toFixed(8);

    btnSend.disabled = change < 0;

    FormOpen(frmBroadcast);
});

// frmBroadcast
btnSend.addEventListener('click', async e => {
    if (balance.utxo == null) {
        ShowMessage("Can't retreive wallet balance");
        return FormOpen(frmCanvas);
    }
    var key = DecryptAES256(Buffer.from(global.wallet.wif, 'hex'), txtPassword.value);

    var txs = [];
    var oldChanges = [];
    while (changes.length != 0) {
        var chgs = [];
        while (true) {
            chgs.push(changes.shift());

            if (EncodeChanges(chgs) == null) {
                changes.unshift(chgs.pop());
                break;
            }
            if (changes.length == 0)
                break;
        }

        oldChanges.push(chgs.filter(x => true))

        var transaction = new Transaction()
            .from(balance.utxo)
            .addData(EncodeChanges(chgs))
            .to(global.address.canvas, chgs.length * 100000000)
            .change(global.wallet.address)
            .fee(1000)
            .sign(key);

        balance.utxo = [{
            txid: transaction.id,
            vout: 2,
            satoshis: balance.satoshis - (chgs.length * 100000000 + 1000),
            scriptPubKey: Script.fromAddress(global.wallet.address)
        }];
        balance.satoshis = balance.satoshis - (chgs.length * 100000000 + 1000);

        txs.push(transaction.serialize(true));
    }

    DrawCanvas();
    FormOpen(frmCanvas);

    var cant = 0;
    var total = txs.length;
    while (txs.length != 0) {
        var tx = txs.shift()
        var data = await POST(global.api.blockchain + "/sendtx/", tx);
        console.log(data);
        if (data == null)
            txs.unshift(tx);
        else if (data.error) {
            txs.unshift(tx);
        } else if (data.result) {
            oldChanges.shift();
            cant++;
        }
        ShowMessage(cant + "/" + total + " tx broadcasted");
        await Sleep(300);
    }

    if (txs.length == 0) {
        ShowMessage(total + " transactions breoadcasted, wait for network confirmations");
    } else {
        for (var i = 0; i < oldChanges.length; i++)
            for (var j = 0; j < oldChanges[i].length; j++)
                changes.push(oldChanges[i][j]);
    }
});
btnReturnCanvas.addEventListener('click', async e => {
    FormOpen(frmCanvas)
});