const https = require('https')

async function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, function (result) {
            var dataQueue = "";
            result.on("data", function (dataBuffer) {
                dataQueue += dataBuffer;
            });
            result.on("end", function () {
                resolve(JSON.parse(dataQueue));
            });

            result.on('error', (err) => {
                reject(err)
            })
        });
    });
}

const digibyte = require('digibyte-js');
const Transaction = require('digibyte-js/lib/transaction/transaction');
const Address = require('digibyte-js/lib/address');


var data = {
    block: 0,
    hash: "",
    addr: "DE2ppKnkCcaPH1SeVYHLfGwVYJzpwjxdbW",
    priv: ""
};

(async function () {
    var block = data.block.toString(16)
    var hex = Buffer.from(data.hash + (block.length % 2 == 0 ? "" : "0") + block, "hex");

    var utxos = await get("https://digibyteblockexplorer.com/api/utxo/" + data.addr);

    console.log(utxos);

    var tx = new Transaction()
        .from(utxos)
        .addData(hex)
        .change(data.addr)
        .feePerByte(1)
        .sign(data.priv)
        .serialize(true);

    console.log(await get("https://digibyteblockexplorer.com/api/sendtx/" + tx));
})()