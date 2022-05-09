const DigiByte = require('digibyte-js');
const PrivateKey = require('digibyte-js/lib/privatekey');

const crypto = require('crypto');

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

    chg.fillStyle = color;
    chg.fillRect(x, y, 1, 1);
}

// Cache functions
let image = new Image();
image.src = "file://" + global.path + "/locale.png";
image.onload = function () {
    canvas.drawImage(image, 0, 0, 256, 256);
    DrawPixel();
};

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
    return new Promise((resolve, reject) => {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.addEventListener("load", (e) => { resolve(JSON.parse(e.srcElement.responseText)) });
        xmlhttp.addEventListener("error", (e) => { reject() });
        xmlhttp.open("GET", url);
        xmlhttp.send();
    })
}
async function POST(url, data) {
    return new Promise((resolve, reject) => {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.addEventListener("load", (e) => { resolve(JSON.parse(e.srcElement.responseText)) });
        xmlhttp.open("POST", url);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(data));
    })
}

// frmStart
btnCreateWallet.addEventListener('click', async e => {
    FormOpen(frmCreateWallet);
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
        FormOpen(frmApp);
    }
});

// frmApp
btnOpenCanvas.addEventListener('click', async e => {
    FormOpen(frmCanvas);
});


const stats = {
    sync: false,
    from: 0,
    to: 0,
    txTotal: 0,
    txProcessed: 0,
    page: 0
}

async function SyncCanvas() {
    var tx = await GET(global.api.blockchain + "/address/" + global.address.canvas + `?from=${stats.from}&to=${stats.to}&page=${stats.page}&details=txs`);
    var txs = tx.transactions;
    console.log(tx)
    while (txs.length != 0) {
        var tx = txs.pop();
        if (tx.vout[0].isAddress == false) {
            var hex = tx.vout[0].hex;

            if (parseInt(hex.substring(2, 4), 16) > 75)
                hex = hex.substring(6, hex.length)
            else
                hex = hex.substring(4, hex.length)

            var outs = DecodeChanges(hex);
            if (outs != null) {
                for (var o of outs) {
                    DrawPixel(o);
                }
            }
        }
        fs.writeFileSync(global.path + "/block", (tx.blockHeight - 1).toString())
        stats.txProcessed++;
    }
    if (stats.txProcessed < stats.txTotal)
        setTimeout(SyncCanvas, 100);
}
async function GetStats() {
    var chain = null;
    while (chain == null) {
        try {
            chain = await GET(global.api.blockchain);
        } catch {
            global.api.blockchain = global.api._blockchain.shift();
        }
    }

    stats.from = parseInt(fs.readFileSync(global.path + "/block"));

    stats.to = chain.backend.blocks;

    var address = await GET(global.api.blockchain + '/address/' + global.address.canvas + '?details=basic');
    stats.txTotal = address.txs;
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
function EncodeChanges() {
    var data = [];
    for (var i = 0; i < 16; i++) {
        var points = changes.filter(x => x.color == i);
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

    return data;
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

        console.log(data[i], amount, color)

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


let zoom = 4;
let wx = 0, wy = 0;
function DrawCanvas() {

    chg.clearRect(0, 0, 256, 256);
    for (var pixel of changes)
        DrawPixel(pixel);

    scene.clearRect(0, 0, 256, 256);
    var size = 2 ** (9 - zoom);
    scene.drawImage(imgCanvas, wx * (size / 2), wy * (size / 2), size, size, 0, 0, 256, 256);
    scene.drawImage(imgChanges, wx * (size / 2), wy * (size / 2), size, size, 0, 0, 256, 256);


}

btnUp.addEventListener('click', async e => {
    if (wy - 1 >= 0) wy--;
    DrawCanvas();
});
btnLeft.addEventListener('click', async e => {
    if (wx - 1 >= 0) wx--;
    DrawCanvas();
});
btnDown.addEventListener('click', async e => {
    if (wy + 1 < 2 ** (zoom - 1) * 2 - 1) wy++;
    DrawCanvas();
});
btnRight.addEventListener('click', async e => {
    if (wx + 1 < 2 ** (zoom - 1) * 2 - 1) wx++;
    DrawCanvas();
});
btnZoomIn.addEventListener('click', async e => {
    if (zoom < 8) {
        var prev = 2 ** (zoom - 1) * 2 - 1;
        var post = 2 ** (zoom) * 2 - 1;
        wx = Math.floor((wx / prev) * post);
        wy = Math.floor((wy / prev) * post);
        zoom++;
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
        DrawCanvas();
    }
})

imgScene.addEventListener('mousedown', async e => {
    if (stats.sync === false) {
        return;
    }

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