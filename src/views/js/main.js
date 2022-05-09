const DigiByte = require('digibyte-js');
const PrivateKey = require('digibyte-js/lib/privatekey');

const crypto = require('crypto');

const canvas = imgCanvas.getContext("2d");
canvas.webkitImageSmoothingEnabled = false;
canvas.mozImageSmoothingEnabled = false;
canvas.imageSmoothingEnabled = false;
const scene = imgScene.getContext('2d');
scene.webkitImageSmoothingEnabled = false;
scene.mozImageSmoothingEnabled = false;
scene.imageSmoothingEnabled = false;

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
function DrawPixel(color, x, y) {
    if (typeof color == "number")
        color = colors[color];
    
    canvas.fillStyle = color;
    canvas.fillRect(x, y, 1, 1);
}

let image = new Image();
image.src = "file://" + global.path + "/locale.png";
image.onload = function () {
    canvas.drawImage(image, 0, 0, 256, 256);
    DrawCanvas();
};



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
    }
});

let zoom = 1;
let wx = 0, wy = 0;
function DrawCanvas() {
    scene.clearRect(0, 0, 256, 256);
    var size = 2**(9 - zoom);
    scene.drawImage(imgCanvas, wx * (size / 2), wy * (size / 2), size, size,     0, 0, 256, 256);
}

btnUp.addEventListener('click', async e => {
    if (wy - 1 > 0) wy--;
    DrawCanvas();
});
btnLeft.addEventListener('click', async e => {
    if (wx - 1 > 0) wx--;
    DrawCanvas();
});
btnDown.addEventListener('click', async e => {
    if (wy + 1 < 2**(zoom - 1) * 2 - 1) wy++;
    DrawCanvas();
    console.log(2**(zoom - 1) * 2 - 1)
});
btnRight.addEventListener('click', async e => {
    if (wx + 1 < 2**(zoom - 1) * 2 - 1) wx++;
    DrawCanvas();
    console.log(2**(zoom - 1) * 2 - 1)
});
btnZoomIn.addEventListener('click', async e => {
    if (zoom < 8) {
        var prev = 2**(zoom-1) * 2 - 1;
        var post = 2**(zoom) * 2 - 1;
        wx = Math.floor((wx/prev) * post);
        wy = Math.floor((wy/prev) * post);
        zoom++;
        DrawCanvas();
    }
})
btnZoomOut.addEventListener('click', async e => {
    if (zoom > 1) {
        var prev = 2**(zoom-1) * 2 - 1;
        var post = 2**(zoom-2) * 2 - 1;
        wx = Math.floor((wx/prev) * post);
        wy = Math.floor((wy/prev) * post);
        zoom--;
        DrawCanvas();
    }
})