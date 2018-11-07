/*
 * Copyright (c) 2018 Dainet Network
 * https://www.dain.network
 * 
 * MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

try {
    var dainetwallet = (function ($, lightwallet, config) {

        return {
            initialize: initialize,
            sendTransfer: sendTransfer
        };

        var openkey, privkey, keystore;

        var tokenAmount = 0;
        var ethAmount = 0;
        var minimumEth, erc20;
        
        var isOnline = false;

        function initialize() {
            if (typeof config.token_contract !== 'undefined') {
                //if (window.location.protocol != "https:")
                //window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);	
                bindEvents();
            } else {
                hideWallet();
            }
        }

        function bindEvents() {

            erc20 = getAbi();
            minimumEth = 0.001;

            keystore = localGet('keystore');
            if (keystore) {
                keystore = lightwallet.keystore.deserialize(keystore);
            }

            buildEnviron();

            $("#logoutButton").click(function () {
                onLogoutAction();
                return false;
            });

            $("#aboutButton").click(function (e) {
                onAboutAction(e);
                return false;
            });

            $("#ethAddressDiv").click(function (e) {
                copyAddress("#ethAddress");
                alert("Address copied");
                return false;
            });

            $("#addrQR").click(function (e) {
                $("#qrBox").modal({
                    fadeDuration: 100
                });
                return false;
            });

            $("#headWall").click(function (e) {
                $("#headWallExplain").modal({
                    fadeDuration: 100
                });
                return false;
            });


            $("#openSendButton").click(function (e) {
                if(isOnline){
                    onOpenSendAction(e);
                }else{
                    alert("Wallet is offline!");
                }
                return false;
            });


            $("#createBigButton").click(function () {
                onCreateAction();
                return false;
            });

            $("#restoreButton").click(function () {
                $("#modalImportSeed").modal({
                    fadeDuration: 100
                });
                return false;
            });

            $("#restoreButtonNov").click(function () {
                $("#importError").html("please wait...");
                GenerateEthereumAddress('', $("#seedIn").val(), true);
            });

            $("#saveKeysButton").click(function (e) {
                $("#privKeyExt").val(privkey);
                $("#privKeyExtVal").text(privkey);
                $("#modalExportKeys").modal({
                    fadeDuration: 100
                });
                globalPush(e);
                return false;
            });

            $("#modalExportKeysCopy").click(function (e) {
                copyAddress("#privKeyExtVal");
                alert("Key was copied. Save it in safe place!");
                return false;
            });

            $("#seedCopy").click(function () {
                copyAddress("#d12keys");
                alert("Seed was copied. Save it in safe place!");
                return false;
            });

            $("#saveSeedButton").click(function () {
                onSaveAction();
                return false;
            });

            $("#sendButton").click(function () {
                sendTransfer();
                return false;
            });
        }

        function onAboutAction(e) {
            globalPush(e);
            window.open("https://www.dain.network/wallet#webwallet", "_blank");
            return false;
        }

        function onLogoutAction() {
            if (confirm("Are you sure? You will need saved seed words to restore your wallet.")) {
                localStorage.clear();
                window.location.reload();
            }
        }

        function onOpenSendAction(e) {
            globalPush(e);
            $("#sendBox").modal({
                fadeDuration: 100
            });
        }

        function onCreateAction() {
            $("#registerSection").hide();
            showLoader("Creating new wallet...");
            var secretSeed = lightwallet.keystore.generateRandomSeed();
            GenerateEthereumAddress("", secretSeed);
        }

        function onKeyAction(e) {
            var charCode = (typeof e.which === "number") ? e.which : e.keyCode;
            if (charCode == 13) {
                buildEnviron();
            }
        }

        function onSaveAction() {
            localSet("saved", 1);
            window.location.reload();
        }

        function showModal(text) {
            $("#modalVal").html(text);
            $("#modalVal").modal({fadeDuration: 100});
        }

        function buildEnviron() {

            openkey = localGet("openkey");
            privkey = localGet("privkey");

            if (localGet("saved") == 1) {
                // full logged mode
                $("#registerSection").hide();
                $("#saveKeySection").hide();
                $("#walletSection").show();
                $(".logout-element").show();
                if (!openkey) {
                    openkey = "0x";
                } else {
                    $("#addrQR").prop("src", "https://chart.googleapis.com/chart?chs=160x160&cht=qr&chl=" + openkey + "&choe=UTF-8&chld=L|0");
                    $("#addrQRZoom").prop("src", $("#addrQR").prop("src"));
                    $("#ethAddress").html(openkey);
                }
                readAccounts();
                setInterval(readAccounts, 10000);
                $("#contractAddress").prop('href', config.etherscan_api.replace("api.", "") + "/token/" + config.token_contract);
            } else {
                $("#registerSection").hide();
                if (localGet("created")) {
                    // semi loogged mode, must save keys
                    $("#d12keys").html(localGet("d12keys"));
                    $("#saveKeySection").show();
                    $("#walletSection").hide();
                    $(".logout-element").show();
                } else {
                    // unlogged mode
                    $("#registerSection").show();
                    $("#saveKeySection").hide();
                    $("#walletSection").hide();
                    $(".logout-element").hide();
                }
            }
            hideLoader();
        }

        function readAccounts() {
            $.ajax({
                type: "GET",
                url: config.etherscan_api + "/api?module=account&action=balance&address=" + openkey + "&tag=latest&apikey=" + config.etherscan_api_key,
                dataType: 'json',
                async: true,
                success: function (data) {
                    _balance = data.result / Math.pow(10, 18);
                    ethAmount = _balance;
                    _rounded = _balance.toFixed(8);
                    $(".ethBalance").html(_balance);
                    hideOffline();
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    showOffline();
                }
            });
            $.ajax({
                type: "GET",
                url: config.etherscan_api + "/api?module=proxy&action=eth_call&to=" + config.token_contract + "&data=0x70a08231000000000000000000000000" + openkey.replace('0x', '') + "&tag=latest&apikey=" + config.etherscan_api_key,
                dataType: 'json',
                async: true,
                success: function (data) {
                    _balance = parseInt(data.result, 16);
                    _balance = _balance / Math.pow(10, config.token_decimals);
                    tokenAmount = _balance;
                    _rounded = _balance.toFixed(8);
                    $(".tokenBalance").html(_rounded);
                    hideOffline();
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    showOffline();
                }
            });
        }

        function GenerateEthereumAddress(password, secretSeed = '', recover = false) {
            if (secretSeed == '') {
                if (recover) {
                    $("#importError").html("Provide seed phrase!");
                    return;
                }
                secretSeed = lightwallet.keystore.generateRandomSeed();
            }
            lightwallet.keystore.createVault({
                password: password,
                seedPhrase: secretSeed,
            }, function (err, keystore) {
                if (err) {
                    $("#importError").html(err.message);
                    return;
                }
                keystore.keyFromPassword(password, function (err, pwDerivedKey) {
                    if (err)
                        throw err;
                    keystore.generateNewAddress(pwDerivedKey, 1);
                    var addr = keystore.getAddresses()[0];
                    var prvkey = keystore.exportPrivateKey(addr, pwDerivedKey);
                    var keystorage = keystore.serialize();
                    console.log("addr:" + addr);
                    localSet("keystore", keystorage);
                    localSet("isreg", 1);
                    localSet("openkey", "0x" + addr);
                    localSet("privkey", prvkey);
                    localSet("d12keys", secretSeed);
                    $("#d12keys").text(secretSeed);
                    localSet("created", 1);
                    if (recover) {
                        localSet("registered", 1);
                        localSet("saved", 1);
                    }
                    $.modal.close();
                    buildEnviron();
                });
            });
        }

        function sendTransfer() {
            showTransferResult("Sending transaction...", "info");
            var address = $("#destAddr").val().trim();
            var amountstr = $("#tokenAmount").val();
            amountstr = amountstr.replace(',', '.');
            var amount = parseFloat(amountstr) || 0;
            if (validateTransfer(address, amount) == false) {
                return false;
            }
            amount = amount * Math.pow(10, config.token_decimals);
            sendRawTransaction([address, amount]);
            return true;
        }

        function sendRawTransaction(args) {
            var url = config.etherscan_api + "/api?module=proxy&action=eth_getTransactionCount&address=" + openkey + "&tag=latest&apikey=" + config.etherscan_api_key;
            var gasPrice = config.gas_price * Math.pow(10, 9);
            $.ajax({
                type: "POST",
                url: url,
                dataType: 'json',
                async: true,
                success: function (d) {
                    var options = {};
                    options.nonce = d.result;
                    options.to = config.token_contract;
                    options.gasPrice = gasPrice;
                    options.gasLimit = config.gas_limit;
                    options.value = 0;
                    password = config.password;
                    abifunc = "transfer";
                    keystore.keyFromPassword(password, function (err, pwDerivedKey) {
                        var registerTx = lightwallet.txutils.functionTx(erc20, abifunc, args, options);
                        var signedTx = lightwallet.signing.signTx(keystore, pwDerivedKey, registerTx, openkey);
                        $.ajax({
                            method: "GET",
                            url: config.etherscan_api + "/api?module=proxy&action=eth_sendRawTransaction&hex=" + "0x" + signedTx + "&apikey=YourApiKeyToken",
                            success: function (data) {

                                if (typeof data.error != "undefined") {
                                    console.log(data.error.message);
                                    if (data.error.message.match(/Insufficient fund/)) {
                                        showTransferResult("Error: you must have a small amount of Ether in your account in order to cover the cost of gas (transaction fee). Add " + minimumEth + " ETH to your account and try again.", "danger");
                                        return;
                                    }
                                    if (data.error.message.match(/same hash/)) {
                                        showTransferResult("Error: The network is busy... Please try again after a few minutes. (" + d.result + ")", "danger");
                                        return;
                                    }
                                    if (data.error.message.match(/same nonce/)) {
                                        showTransferResult("Error: The network is busy... Please try again after a few minutes. (" + d.result + ")", "danger");
                                        return;
                                    }
                                    showTransferResult(data.error.message, "danger");
                                } else {
                                    $("#tokenAmount").val("");
                                    showTransferResult("Success. Your transfer is pending. You can check the transaction progress in explorer:<br /> <a target='_blank' href='" + config.etherscan_api.replace("api.", "") + "/tx/" + data.result + "'>" + data.result + "</a>");
                                }
                            },
                            fail: function (d) {
                                showTransferResult("Send transaction error. Try egain");
                            }
                        }, "json");
                    });
                }
            });
        }

        function validateTransfer(address, amount) {

            // minimal transfer inputs validation
            var minimumamount = 0.000001;
            if (amount < minimumamount) {
                showTransferResult("Minimum transfer amount is " + minimumamount + " DAIN", "danger");
                return false;
            }
            if (validateAddress(address) == false) {
                showTransferResult("Please validate the desination address", "danger");
                return false;
            }

            if (tokenAmount < amount) {
                showTransferResult("You do not have enough DAIN tokens to perform the transfer", "danger");
                return false;
            }

            if (ethAmount < minimumEth) {
                showTransferResult("You must have a small amount of Ether to pay for the Ethereum network transfer. Send a small amount of Ether (" + minimumEth + ") to the address of your wallet", "danger");
                return false;
            }

            return true;
        }


        function validateAddress(address) {
            if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
                return false;
            } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
                return true;
            } else {
                return true;
            }
        }

        function showTransferResult(message, style = "info") {
            var ob = $("#resultDiv");
            ob.html(message);
            ob.addClass(style);
            ob.show('fast');
        }

        function getSeedMessage() {
            return "Your mnemonic phrase: '" + localGet("d12keys") + "'\r\n\r\n(HD derivation path is m/0'/0'/0')\r\n\r\nTo access your tokens and ethers: \r\n1. Go to https://www.myetherwallet.com/#send-transaction \r\n2. Select 'Mnemonic Phrase'\r\n3. Insert Phrase and set derivation path is m/0'/0'/0' \r\n3. Click 'Unlock' \r\n4. Add " + config.token_name + " token > " + config.token_contract + " (symbol: " + config.token_symbol + ", decimals: " + config.token_decimals + ")";
        }

        function localGet(name) {
            return localStorage.getItem(name);
        }
        function localSet(name, val) {
            localStorage.setItem(name, val);
        }
        function localDel(name) {
            localStorage.removeItem(name);
        }

        function validateKey(key) {

        }

        function showLoader(message) {
            $(".spinner").show();
            if (message) {
                $(".spinnerlabel").html(message);
                $(".spinnerlabel").show();
            }
        }
        function hideLoader() {
            $(".spinner").hide();
            $(".spinnerlabel").hide();
        }

        function hideWallet() {
            $(".splash-container").html("<div class='splash' style='color: white'>Your Wallet is not installed correctly. Please reinstall it.</div>");
        }

        function showOffline() {
            isOnline = false;
            $("#offlineInfo").show();
            $("#walletSection").css('opacity', 0.3);
            $("#walletSection").attr('disabled', true);
            $("#onlineMel").html('offline');
            $("#onlineMel").css('color', 'red');
        }
        
        function hideOffline() {
            isOnline = true;
            $("#offlineInfo").hide();
            $("#walletSection").css('opacity', 1);
            $("#onlineMel").html('online');
            $("#onlineMel").css('color', 'greenyellow');
        }

        function copyAddress(element) {
            var $temp = $("<input>");
            $("body").append($temp);
            $temp.val($(element).text()).select();
            document.execCommand("copy");
            $temp.remove();
        }

        function getAbi() {
            return [{"constant": true, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function"}, {"constant": true, "inputs": [], "name": "totalSupply", "outputs": [{"name": "", "type": "uint256"}], "type": "function"}, {"constant": false, "inputs": [{"name": "JobDescription", "type": "string"}], "name": "newIncome", "outputs": [{"name": "result", "type": "string"}], "type": "function"}, {"constant": true, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"}, {"constant": false, "inputs": [{"name": "myposition", "type": "bool"}], "name": "ivote", "outputs": [{"name": "result", "type": "uint256"}], "type": "function"}, {"constant": true, "inputs": [], "name": "Entropy", "outputs": [{"name": "", "type": "uint256"}], "type": "function"}, {"constant": true, "inputs": [], "name": "sellPrice", "outputs": [{"name": "", "type": "uint256"}], "type": "function"}, {"constant": false, "inputs": [{"name": "JobDescription", "type": "string"}], "name": "newProposal", "outputs": [{"name": "result", "type": "string"}], "type": "function"}, {"constant": false, "inputs": [], "name": "setPrices", "outputs": [], "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}], "type": "function"}, {"constant": true, "inputs": [], "name": "buyPrice", "outputs": [{"name": "", "type": "uint256"}], "type": "function"}, {"constant": true, "inputs": [], "name": "owner", "outputs": [{"name": "", "type": "address"}], "type": "function"}, {"constant": true, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function"}, {"constant": true, "inputs": [{"name": "", "type": "address"}], "name": "voters", "outputs": [{"name": "", "type": "uint256"}], "type": "function"}, {"constant": false, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [], "type": "function"}, {"constant": true, "inputs": [], "name": "ownbalance", "outputs": [{"name": "", "type": "uint256"}], "type": "function"}, {"constant": false, "inputs": [{"name": "amount", "type": "uint256"}], "name": "sell", "outputs": [], "type": "function"}, {"constant": false, "inputs": [], "name": "token", "outputs": [], "type": "function"}, {"anonymous": false, "inputs": [{"indexed": true, "name": "from", "type": "address"}, {"indexed": true, "name": "to", "type": "address"}, {"indexed": false, "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "amount", "type": "uint256"}, {"indexed": false, "name": "description", "type": "string"}], "name": "newincomelog", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "description", "type": "string"}], "name": "newProposallog", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": false, "name": "position", "type": "bool"}, {"indexed": false, "name": "voter", "type": "address"}, {"indexed": false, "name": "sharesonhand", "type": "uint256"}], "name": "votelog", "type": "event"}];
        }

    })($, lightwallet, walletconfig);
} catch (err) {
    var dainetwallet = {
        initialize: function () {
            $(".splash-container").html("<div class='splash' style='color: white'>Your Wallet is not installed correctly. Please reinstall it.</div>");
        }
    };
}