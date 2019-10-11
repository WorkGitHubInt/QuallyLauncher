const { machineIdSync } = require('node-machine-id');
const fs = require('fs');
const extract = require('extract-zip');
const sm = require('windows-shortcut-maker');
const remote = require('electron').remote;
const path = require ('path');
const dialog = remote.dialog;
var copy = require('recursive-copy');
var app = remote.app;
var usb = require('usb');
var listenUsb = false;
var isUserUsb = false;
var sha1 = require('sha1');
var md5 = require('md5');

var localVersions = {
    botQuallyVersion: '',
    quallyFlashVersion: '',
    accountHolderVersion: '',
};
var serverVersions = {
    botQuallyVersion: '',
    quallyFlashVersion: '',
    accountHolderVersion: '',
};
var botQuallyId;
var quallyFlashId;
var accountHolderId;
var id = machineIdSync().substring(0, 20);
var userPath = app.getPath('userData');
var userProgramsPath = path.join(userPath, 'Programs');
var versionsPath = path.join(userProgramsPath, 'versions.json');
var botQuallyPath = path.join(userProgramsPath, 'BotQually');
var quallyFlashPath = path.join(userProgramsPath, 'QuallyFlash');
var accountHolderPath = path.join(userProgramsPath, 'AccountHolder');
runOnLoad();

async function runOnLoad() {
    $('.coverAll').fadeIn();
    count();
    getMachineId();
    try {
        await addUser();
    } catch { }
    getNews();
    await getUser();
    setInterval(getUser, 15000);
}

function count() {
    $.ajax({
        type: 'POST',
        url: 'https://botqually.ru/api/managment/count',
        data: 'userId=' + id + '&programId=10',
        success: function(data) {
            
        }
    });
}

usb.on('attach', function(device) {
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'прослушка успешна listenUsb:' + listenUsb + '\n');
    try {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'iProduct:' + device.deviceDescriptor.iProduct + '\n');
    } catch (err) {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'что-то пошло не так err:' + err.message + '\n');
    }
    try {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'iManufacturer:' + device.deviceDescriptor.iManufacturer + '\n');
    } catch (err) {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'что-то пошло не так err:' + err.message + '\n');
    }
    try {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'idProduct:' + device.deviceDescriptor.idProduct + '\n');
    } catch (err) {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'что-то пошло не так err:' + err.message + '\n');
    }
    try {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'idVendor:' + device.deviceDescriptor.idVendor + '\n');
    } catch (err) {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'что-то пошло не так err:' + err.message + '\n');
    }
    try {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'iSerialNumber:' + device.deviceDescriptor.iSerialNumber + '\n');
    } catch (err) {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'что-то пошло не так err:' + err.message + '\n');
    }
    if (listenUsb) {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'вошел в добавление\n');
        try {
            if (device.deviceDescriptor.idProduct != 0 && device.deviceDescriptor.idVendor != 0) {
                $.ajax({
                    type: 'POST',
                    url: 'https://botqually.ru/api/users/usbactive',
                    data: 'pcid=' + id + '&usbId=' + sha1(`${device.deviceDescriptor.idProduct}|${device.deviceDescriptor.idVendor}`),
                    success: function() {
                        listenUsb = false;
                        fs.appendFileSync(path.join(userPath, 'log.txt'), 'зарегано\n');
                        dialog.showMessageBox({ message: 'USB устройство зарегистрировано!', type: 'info', buttons: ['Ок'], title: '' }); 
                        $('#activateUSB').fadeOut();
                        $('#deactivateUSB').fadeIn();
                    }
                });
            } else {
                fs.appendFileSync(path.join(userPath, 'log.txt'), 'что-то пошло не так не определено устройство:\n');
                dialog.showMessageBox({ message: 'Что-то пошло не так! Устройство не определено!', type: 'error', buttons: ['Ок'], title: '' });  
            }
        } catch (err) {
            fs.appendFileSync(path.join(userPath, 'log.txt'), 'что-то пошло не так err:' + err.message + '\n');
            dialog.showMessageBox({ message: 'Что-то пошло не так!', type: 'error', buttons: ['Ок'], title: '' });  
        }
    }
});

function getMachineId() {
    $('#PCID').text('Ваш id: ' + id);
}

function getLocalVersions() {
    localVersions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
    checkLocalVersion(path.join(botQuallyPath, 'Main'), 'bq', localVersions.botQuallyVersion);
    checkLocalVersion(path.join(quallyFlashPath, 'Main'), 'qf', localVersions.quallyFlashVersion);
    checkLocalVersion(path.join(accountHolderPath, 'Main'), 'ac', localVersions.accountHolderVersion);
}

function checkLocalVersion(path, selector, version) {
    if (fs.existsSync(path)) {
        $(`#${selector}LocalVersion`).text('Установленная версия: ' + version);
    } else {
        $(`#${selector}LocalVersion`).text('Установленная версия: не установлено');
    }
}

function getServerVersions() {
    $.ajax({
        url: 'https://botqually.ru/api/managment/programs',
        success: function (data) {
            data.forEach(element => {
                switch (element.name) {
                    case 'BotQually':
                        $(`#bqServerVersion`).text('Актуальная версия: ' + element.version).css('font-weight', 'bold');
                        serverVersions.botQuallyVersion = element.version;
                        botQuallyId = element.id;
                        break;
                    case 'QuallyFlash':
                        $(`#qfServerVersion`).text('Актуальная версия: ' + element.version).css('font-weight', 'bold');
                        serverVersions.quallyFlashVersion = element.version;
                        quallyFlashId = element.id;
                        break;
                    case 'AccountHolder':
                        $(`#acServerVersion`).text('Актуальная версия: ' + element.version).css('font-weight', 'bold');
                        serverVersions.accountHolderVersion = element.version;
                        accountHolderId = element.id;
                        break;
                }
            });
        },
        async: false
    });
}

async function checkUpdates(user) {
    getLocalVersions();
    getServerVersions();
    if (fs.existsSync(path.join(botQuallyPath, 'Main'))) {
        if (compareVersion(serverVersions.botQuallyVersion, localVersions.botQuallyVersion) == 1) {
            dialog.showMessageBox({ message: 'Доступно обновление! Программа: BotQually. Обновить?', type: 'question', buttons: ['Отмена', 'Установить'] }, async function (response) {
                if (response == 1) {
                    $('.coverAll').fadeIn();
                    await update(botQuallyId, serverVersions.botQuallyVersion, path.join(botQuallyPath, 'Main'));
                    let versions = {
                        botQuallyVersion: serverVersions.botQuallyVersion,
                        quallyFlashVersion: localVersions.quallyFlashVersion,
                        accountHolderVersion: localVersions.accountHolderVersion,
                    }
                    await writeVersionFileAsync(versions);
                    getLocalVersions();
                    $('.coverAll').fadeOut();
                }
            });
        }
    }
    if (user.lvl == 2) {
        if (fs.existsSync(path.join(quallyFlashPath, 'Main'))) {
            if (compareVersion(serverVersions.quallyFlashVersion, localVersions.quallyFlashVersion) == 1) {
                dialog.showMessageBox({ message: 'Доступно обновление! Программа: QuallyFlash. Обновить?', type: 'question', buttons: ['Отмена', 'Установить'] }, async function (response) {
                    if (response == 1) {
                        $('.coverAll').fadeIn();
                        await update(quallyFlashId, serverVersions.quallyFlashVersion, path.join(quallyFlashPath, 'Main'));
                        let versions = {
                            botQuallyVersion: localVersions.botQuallyVersion,
                            quallyFlashVersion: serverVersions.quallyFlashVersion,
                            accountHolderVersion: localVersions.accountHolderVersion,
                        }
                        await writeVersionFileAsync(versions);
                        getLocalVersions();
                        $('.coverAll').fadeOut();
                    }
                });
            }
        }
    }
    if (fs.existsSync(path.join(accountHolderPath, 'Main'))) {
        if (compareVersion(serverVersions.accountHolderVersion, localVersions.accountHolderVersion) == 1) {
            dialog.showMessageBox({ message: 'Доступно обновление! Программа: AccountHolder. Обновить?', type: 'question', buttons: ['Отмена', 'Установить'] }, async function (response) {
                if (response == 1) {
                    $('.coverAll').fadeIn();
                    await update(accountHolderId, serverVersions.accountHolderVersion, path.join(accountHolderPath, 'Main'));
                    let versions = {
                        botQuallyVersion: localVersions.botQuallyVersion,
                        quallyFlashVersion: localVersions.quallyFlashVersion,
                        accountHolderVersion: serverVersions.accountHolderVersion,
                    }
                    await writeVersionFileAsync(versions);
                    getLocalVersions();
                    $('.coverAll').fadeOut();
                }
            });
        }
    }
}

function compareVersion(v1, v2) {
    if (typeof v1 !== 'string') return false;
    if (typeof v2 !== 'string') return false;
    v1 = v1.split('.');
    v2 = v2.split('.');
    const k = Math.min(v1.length, v2.length);
    for (let i = 0; i < k; ++i) {
        v1[i] = parseInt(v1[i], 10);
        v2[i] = parseInt(v2[i], 10);
        if (v1[i] > v2[i]) return 1;
        if (v1[i] < v2[i]) return -1;
    }
    return v1.length == v2.length ? 0 : (v1.length < v2.length ? -1 : 1);
}

async function update(programId, version, path) {
    let result = await $.ajax({
        url: `https://botqually.ru/api/managment/update?id=${id}&progId=${programId}&version=${version}`,
        type: 'GET'
    });
    await createFileAsync(result);
    await extractZipAsync(path);
}

function extractZipAsync(path2) {
    return new Promise(resolve => {
        extract(path.join(userPath, 'temp.zip'), { dir: path2 }, (err) => {
            console.log(err);
            fs.unlinkSync(path.join(userPath, 'temp.zip'));
            resolve();
        });
    })
}

function createFileAsync(data) {
    return new Promise(resolve => {
        fs.writeFileSync(path.join(userPath, 'temp.zip'), data, { encoding: 'base64' });
        resolve();
    });
}

function getSubVersions() {
    $.ajax({
        url: 'https://botqually.ru/api/managment/versions?id=' + id,
        success: function (data) {
            data.forEach(element => {
                switch (element.programId) {
                    case botQuallyId:
                        if (element.version !== serverVersions.botQuallyVersion) {
                            setOptions(botQuallyPath, 'bq', element.version);
                        }
                        break;
                    case quallyFlashId:
                        if (element.version !== serverVersions.quallyFlashVersion) {
                            setOptions(quallyFlashPath, 'qf', element.version);
                        }
                        break;
                    case accountHolderId:
                        if (element.version !== serverVersions.accountHolderVersion) {
                            setOptions(accountHolderPath, 'ac', element.version);
                        }
                        break;
                }
            });
        }
    });
}

function setOptions(path2, selector, version) {
    let option = document.createElement('option');
    let node;
    if (fs.existsSync(path.join(path2, version))) {
        node = document.createTextNode(version + ' ✔');
    } else {
        node = document.createTextNode(version);
    }
    option.appendChild(node);
    $(`#${selector}Select`).append(option);
}

async function addUser() {
    await $.ajax({
        type: 'POST',
        url: 'https://botqually.ru/api/users/add/',
        data: 'id=' + id,
    });
}

function getNews() {
    $.ajax({
        url: 'https://botqually.ru/api/managment/articles',
        success: function (data) {
            data.forEach(element => {
                addArticle(element);
            });
        }
    });
}

function addArticle(element) {
    let title = document.createElement('p');
    title.className = 'text-center';
    title.style.marginBottom = '5px';
    title.style.fontWeight = 'bold';
    let nodeTitle = document.createTextNode(element.title);
    title.appendChild(nodeTitle);
    let body = document.createElement('p');
    body.style.whiteSpace = 'pre-line';
    body.style.fontSize = '12px';
    let nodeBody = document.createTextNode(element.body);
    body.appendChild(nodeBody);
    let divArticle = document.createElement('div');
    divArticle.className = 'article';
    divArticle.appendChild(title);
    divArticle.appendChild(body);
    $('#news').append(divArticle);
}

Date.daysBetween = function( date1, date2 ) {
    //Get 1 day in milliseconds
    var one_day=1000*60*60*24;
  
    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();
  
    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;
      
    // Convert back to days and return
    return Math.round(difference_ms/one_day); 
}

var chk = false;
async function getUser() {
    chk = false;
    let user = await $.ajax({
        url: 'https://botqually.ru/api/users/?id=' + id,
    });
    if (fs.existsSync(path.join(userPath, 'log.txt'))) {
        fs.appendFileSync(path.join(userPath, 'log.txt'), 'проверка пользователя ' + user.pcid + '\n');
    } else {
        fs.writeFileSync(path.join(userPath, 'log.txt'), 'проверка пользователя ' + user.pcid + '\n');
    }
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'lvl: ' + user.lvl + '\n');
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'subexpdate: ' + user.subscriptionExpDate + '\n');
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'active: ' + user.active + '\n');
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'trial: ' + user.trial + '\n');
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'trialuse: ' + user.trialUse + '\n');
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'usbid: ' + user.usbId + '\n');
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'hash: ' + user.hash + '\n');
    if (user.hash === md5(`${user.pcid}|${user.subscriptionExpDate}|${user.unlimitedSub.toString().charAt(0).toUpperCase() + user.unlimitedSub.toString().slice(1)}|${user.trial.toString().charAt(0).toUpperCase() + user.trial.toString().slice(1)}|${user.lvl}|${user.active.toString().charAt(0).toUpperCase() + user.active.toString().slice(1)}|helicopter`)) {
        if (!user.trialUse) {
            $('#activateTrial').fadeIn();
        } else {
            $('#activateTrial').fadeOut();
        }
        if (user.active) {
            setSub(user);
            fs.appendFileSync(path.join(userPath, 'log.txt'), 'пользователь активен\n');
        } else {
            fs.appendFileSync(path.join(userPath, 'log.txt'), 'пользователь неактивен\n');
            fs.appendFileSync(path.join(userPath, 'log.txt'), 'беру список устройств\n');
            var usbList = usb.getDeviceList();
            for (var i = 0; i < usbList.length; i++) {
                fs.appendFileSync(path.join(userPath, 'log.txt'), '--------------------------------------------------------\n');
                fs.appendFileSync(path.join(userPath, 'log.txt'), 'usb ' + i + ' idProduct: ' + usbList[i].deviceDescriptor.idProduct + '\n');
                fs.appendFileSync(path.join(userPath, 'log.txt'), 'usb ' + i + ' idVendor: ' + usbList[i].deviceDescriptor.idVendor + '\n');
                try {
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'usb hash ' + sha1(`${usbList[i].deviceDescriptor.idProduct}|${usbList[i].deviceDescriptor.idVendor}`) + '\n');
                    user = await $.ajax({
                        url: 'https://botqually.ru/api/users/usb?id=' + sha1(`${usbList[i].deviceDescriptor.idProduct}|${usbList[i].deviceDescriptor.idVendor}`),
                    });
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'проверка пользователя usb ' + user.pcid + '\n');
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'lvl: ' + user.lvl + '\n');
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'subexpdate: ' + user.subscriptionExpDate + '\n');
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'active: ' + user.active + '\n');
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'trial: ' + user.trial + '\n');
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'trialuse: ' + user.trialUse + '\n');
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'usbid: ' + user.usbId + '\n');
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'hash: ' + user.hash + '\n');
                    if (user.hash === md5(`${user.pcid}|${user.subscriptionExpDate}|${user.unlimitedSub.toString().charAt(0).toUpperCase() + user.unlimitedSub.toString().slice(1)}|${user.trial.toString().charAt(0).toUpperCase() + user.trial.toString().slice(1)}|${user.lvl}|${user.active.toString().charAt(0).toUpperCase() + user.active.toString().slice(1)}|helicopter`)) {
                        if (!user.trialUse) {
                            $('#activateTrial').fadeIn();
                        } else {
                            $('#activateTrial').fadeOut();
                        }
                        if (user.active) {
                            $('#PCID').text('Ваш id: ' + user.pcid + ' (USB)');
                            id = user.pcid;
                            isUserUsb = true;
                            setSub(user);
                            chk = true;
                        }
                    }
                } catch (err) {
                    fs.appendFileSync(path.join(userPath, 'log.txt'), 'error happend: ' + err + '\n');
                }
            }
            if (!chk) {
                setDisabledSub();
            }
        }
    }
    $('.coverAll').fadeOut();
    $('.container').fadeIn();
}

var chkUpdates = false;
function setSub(user) {
    $('#subLvl').text('Ваш уровень подписки: ' + user.lvl);
    if (user.unlimitedSub) {
        $('#subExpDate').text('Вы бесконечный подписчик!');
    } else {
        var dateParts = user.subscriptionExpDate.split(".");
        var date1 = new Date(dateParts[2], (dateParts[1] - 1), dateParts[0]);
        var date2 = new Date(Date.now());
        let diffTime = Math.abs(date1.getTime() - date2.getTime());
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays <= 5) {
            $('#subExpDate').css('color', 'red');
        } else {
            $('#subExpDate').css('color', 'black');
        }
        $('#subExpDate').text('Подписка активна до: ' + user.subscriptionExpDate);
    }
    if (user.usbId) {
        $('#activateUSB').fadeOut();
        $('#deactivateUSB').fadeIn();
    } else {
        $('#activateUSB').fadeIn();
        $('#deactivateUSB').fadeOut();
    }
    setActiveSub(user.trial, user.lvl);
    if (!chkUpdates) {
        checkUpdates(user);
        chkUpdates = true;
    }
    getSubVersions();
}

function setActiveSub(trial, lvl) {
    if (lvl == 1) {
        $('#bqGroup').fadeIn();
        $('#acGroup').fadeIn();
        $('#upgradeLvl').fadeIn();
        $('#qfGroup').fadeOut();
    } else if (lvl == 2) {
        $('#bqGroup').fadeIn();
        $('#acGroup').fadeIn();
        $('#qfGroup').fadeIn();
        $('#upgradeLvl').fadeOut();
    } else {
        $('#bqGroup').fadeOut();
        $('#acGroup').fadeOut();
        $('#qfGroup').fadeOut();
    }
    if (!trial) {
        $('#scriptsBtn').fadeIn();
    }
    $('#subExpDate').fadeIn();
    $('#messages').fadeIn();
    setStylePrograms();
}

function setStylePrograms() {
    setLink('bqMain', path.join(botQuallyPath, 'Main'));
    setLink('qfMain', path.join(quallyFlashPath, 'Main'));
    setLink('acMain', path.join(accountHolderPath, 'Main')); 
}

function setDisabledSub() {
    $('#subLvl').text('Ваша подписка не активна!');
    $('#subExpDate').text('');
    $('#bqGroup').fadeOut();
    $('#qfGroup').fadeOut();
    $('#acGroup').fadeOut();
    $('#scriptsBtn').fadeOut();
    $('#upgradeLvl').fadeOut();
    $('#SubExpDate').fadeOut();
    $('#messages').fadeOut();
    $('#activateUSB').fadeOut();
    $('#deactivateUSB').fadeOut();
}

function setLink(selector, path) {
    if (fs.existsSync(path)) {
        $(`#${selector}Install`).addClass('disabled');
        $(`#${selector}ReInstall`).removeClass('disabled');
        $(`#${selector}Launch`).removeClass('disabled');
        $(`#${selector}Delete`).removeClass('disabled');
        $(`#${selector}Link`).removeClass('disabled');
    } else {
        $(`#${selector}Install`).removeClass('disabled');
        $(`#${selector}ReInstall`).addClass('disabled');
        $(`#${selector}Launch`).addClass('disabled');
        $(`#${selector}Delete`).addClass('disabled');
        $(`#${selector}Link`).addClass('disabled');
    }
}

function deleteFolderRecursive(path) {
    return new Promise( resolve => {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function (file, index) {
                var curPath = path + "\\" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
        console.log('The folder has been deleted! ' + path);
        resolve();
    });
}

const spawn = require('child_process').spawn;
function launchProgram(path) {
    if (isUserUsb) {
        var subprocess = spawn(path, ['-usb', id], {
            detached: true,
            stdio: 'ignore'
          });
        subprocess.unref();
    } else {
        var subprocess = spawn(path, {
            detached: true,
            stdio: 'ignore'
          });
        subprocess.unref();
    }
}

function createShortcutProgram(path, pathFolder) {
        const options = {
            'filepath': path,
            'lnkCwd': pathFolder,
        }
        sm.makeSync(options);
        console.log('Shortcut has been created!');
}

function mkdirAsync(path) {
    return new Promise(resolve => {
        fs.mkdirSync(path);
        resolve();
    });
}

function writeVersionFileAsync(versions) {
    return new Promise(resolve => {
        fs.writeFileSync(versionsPath, JSON.stringify(versions), 'utf8');
        resolve();
    });
}

async function installProgram(program, versions) {
    await mkdirAsync(path.join(program.path));
    await update(program.id, program.version, path.join(program.path));
    await writeVersionFileAsync(versions);
    getLocalVersions();
    setStylePrograms();
}

async function reInstallProgram(program, versions) {
    await copy(path.join(program.path, 'settings'), path.join(userProgramsPath, 'temp'), {overwrite: true});
    await deleteFolderRecursive(path.join(program.path));
    await installProgram(program, versions);
    await copy(path.join(userProgramsPath, 'temp'), path.join(program.path, 'settings'), {overwrite: true});
    await deleteFolderRecursive(path.join(userProgramsPath, 'temp'));
}

function deleteProgram(path) {
    deleteFolderRecursive(path);
    getLocalVersions();
    setStylePrograms();
}

$('#activateTrial').click(async () => {
    $('.coverAll').fadeIn();
    await $.ajax({
        type: 'POST',
        url: 'https://botqually.ru/api/users/trial/',
        data: 'id=' + id
    });
    getUser();
    $('.coverAll').fadeOut();
});

$('#activateKey').click(async () => {
    $('.coverAll').fadeIn();
    var code = $('#codeText').val();
    await $.ajax({
        type: 'POST',
        url: 'https://botqually.ru/api/managment/key',
        data: 'id=' + id + '&code=' + code,
    });
    getUser();
    $('.coverAll').fadeOut();
});

$('#activateUSB').click(async () => {
    dialog.showMessageBox({ message: 'Нажмите OK и подсоедините USB устройство.', type: 'info', buttons: ['Ок'], title: '' });  
    fs.appendFileSync(path.join(userPath, 'log.txt'), 'прослушка включена\n');
    listenUsb = true;
});

$('#deactivateUSB').click(async () => {
    $('.coverAll').fadeIn();
    await $.ajax({
        type: 'POST',
        url: 'https://botqually.ru/api/users/usbdeactive',
        data: 'pcid=' + id,
    });
    getUser();
    dialog.showMessageBox({ message: 'Флеш накопитель успешно удален!', type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#buySubscribe').click(() => {
    let link = 'https://botqually.ru/subscribe/confirm?id=1&userId=' + id;
    console.log('Buy page has been opened!');
    require("electron").shell.openExternal(link);
});

$('#upgradeLvl').click(() => {
    let link = 'https://botqually.ru/subscribe/payment?userId=' + id + '&subModelId=4' + '&type=1';
    console.log('Upgrade page has been opened!');
    require("electron").shell.openExternal(link);
});

$('#bqMainInstall').click(async () => {
    $('.coverAll').fadeIn();
    let versions = {
        botQuallyVersion: serverVersions.botQuallyVersion,
        quallyFlashVersion: localVersions.quallyFlashVersion,
        accountHolderVersion: localVersions.accountHolderVersion,
    };
    let program = {
        path : path.join(botQuallyPath, 'Main'),
        id : botQuallyId,
        version : versions.botQuallyVersion,
    };
    await installProgram(program, versions);
    dialog.showMessageBox({ message: 'Программа Bot Qually установлена!', type: 'info', buttons: ['Ок'], title: '' });  
    $('.coverAll').fadeOut();
});

$('#bqMainReInstall').click(async () => {
    $('.coverAll').fadeIn();
    let program = {
        path : path.join(botQuallyPath, 'Main'),
        id : botQuallyId,
        version : localVersions.botQuallyVersion
    }
    await reInstallProgram(program, localVersions);
    dialog.showMessageBox({ message: 'Программа Bot Qually переустановлена!', type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#bqMainDelete').click(() => {
    deleteProgram(path.join(botQuallyPath, 'Main'));
    dialog.showMessageBox({ message: 'Программа Bot Qually удалена!', type: 'info', buttons: ['Ок'], title: '' });
});

$('#bqMainLaunch').click(() => {
    launchProgram(path.join(botQuallyPath, 'Main', 'BotQually.exe'));
});

$('#bqMainLink').click(() => {
    createShortcutProgram(path.join(botQuallyPath, 'Main', 'BotQually.exe'), path.join(botQuallyPath, 'Main'));
});

$('#qfMainInstall').click(async () => {
    $('.coverAll').fadeIn();
    let versions = {
        botQuallyVersion: localVersions.botQuallyVersion,
        quallyFlashVersion: serverVersions.quallyFlashVersion,
        accountHolderVersion: localVersions.accountHolderVersion,
    };
    let program = {
        path : path.join(quallyFlashPath, 'Main'),
        id : quallyFlashId,
        version : versions.quallyFlashVersion
    }
    await installProgram(program, versions);
    dialog.showMessageBox({ message: 'Программа Qually Flash установлена!', type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#qfMainReInstall').click(async () => {
    $('.coverAll').fadeIn();
    let program = {
        path : path.join(quallyFlashPath, 'Main'),
        id : quallyFlashId,
        version : localVersions.quallyFlashVersion
    }
    await reInstallProgram(program, localVersions);
    dialog.showMessageBox({ message: 'Программа Bot Qually переустановлена!', type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#qfMainDelete').click(() => {
    deleteProgram(path.join(quallyFlashPath, 'Main'));
    dialog.showMessageBox({ message: 'Программа Qually Flash удалена!', type: 'info', buttons: ['Ок'], title: '' });
});

$('#qfMainLaunch').click(() => {
    launchProgram(path.join(quallyFlashPath, 'Main', 'QuallyFlash.exe'));
});

$('#qfMainLink').click(() => {
    createShortcutProgram(path.join(quallyFlashPath, 'Main', 'QuallyFlash.exe'), path.join(quallyFlashPath, 'Main'));
});

$('#acMainInstall').click(async () => {
    $('.coverAll').fadeIn();
    let versions = {
        botQuallyVersion: localVersions.botQuallyVersion,
        quallyFlashVersion: localVersions.quallyFlashVersion,
        accountHolderVersion: serverVersions.accountHolderVersion,
    };
    let program = {
        path : path.join(accountHolderPath, 'Main'),
        id : accountHolderId,
        version : versions.accountHolderVersion
    }
    await installProgram(program, versions);
    dialog.showMessageBox({ message: 'Программа Account Holder установлена!', type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#acMainReInstall').click(async () => {
    $('.coverAll').fadeIn();
    let program = {
        path : path.join(accountHolderPath, 'Main'),
        id : accountHolderId,
        version : localVersions.accountHolderVersion
    }
    await reInstallProgram(program, localVersions);
    dialog.showMessageBox({ message: 'Программа Bot Qually переустановлена!', type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#acMainDelete').click(() => {
    deleteProgram(path.join(accountHolderPath, 'Main'));
    dialog.showMessageBox({ message: 'Программа Account Holder удалена!', type: 'info', buttons: ['Ок'], title: '' });
});

$('#acMainLaunch').click(() => {
    launchProgram(path.join(accountHolderPath, 'Main', 'AccountHolder.exe'));
});

$('#acMainLink').click(() => {
    createShortcutProgram(path.join(accountHolderPath, 'Main', 'AccountHolder.exe'), path.join(accountHolderPath, 'Main'));
});

$('#bqSubInstall').click(async () => {
    $('.coverAll').fadeIn();
    let version = $('#bqSelect option:selected').text();
    let program = {
        path : path.join(botQuallyPath, version),
        id : botQuallyId,
        version : version
    }
    await installProgram(program, localVersions);
    for (let i = 1; i < $('#bqSelect').children().length; i++) {
        if ($('#bqSelect').children()[i].textContent == version) {
            $('#bqSelect').children()[i].textContent = version + ' ✔';
        }
    }
    setLink('bqSub', path.join(botQuallyPath, version));
    dialog.showMessageBox({ message: `Программа Bot Qually версия ${version} установлена!`, type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#bqSubDelete').click(() => {
    let version = $('#bqSelect option:selected').text().split(' ')[0];
    deleteProgram(path.join(botQuallyPath, version));
    for (let i = 1; i < $('#bqSelect').children().length; i++) {
        if ($('#bqSelect').children()[i].textContent.split(' ')[0] == version) {
            $('#bqSelect').children()[i].textContent = version;
        }
    }
    setLink('bqSub', path.join(botQuallyPath, version));
    dialog.showMessageBox({ message: `Программа Bot Qually версия ${version} удалена!`, type: 'info', buttons: ['Ок'], title: '' });
});

$('#bqSubLaunch').click(() => {
    let version = $('#bqSelect option:selected').text().split(' ')[0];
    launchProgram(path.join(botQuallyPath, version, 'BotQually.exe'));
});

$('#qfSubInstall').click(async () => {
    $('.coverAll').fadeIn();
    let version = $('#qfSelect option:selected').text();
    let program = {
        path : path.join(quallyFlashPath, version),
        id : quallyFlashId,
        version : version
    }
    await installProgram(program, localVersions);
    for (let i = 1; i < $('#qfSelect').children().length; i++) {
        if ($('#qfSelect').children()[i].textContent == version) {
            $('#qfSelect').children()[i].textContent = version + ' ✔';
        }
    }
    setLink('qfSub', path.join(quallyFlashPath, version));
    dialog.showMessageBox({ message: `Программа Qually Flash версия ${version} установлена!`, type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#qfSubDelete').click(() => {
    let version = $('#qfSelect option:selected').text().split(' ')[0];
    deleteProgram(path.join(quallyFlashPath, version));
    for (let i = 1; i < $('#qfSelect').children().length; i++) {
        if ($('#qfSelect').children()[i].textContent.split(' ')[0] == version) {
            $('#qfSelect').children()[i].textContent = version;
        }
    }
    setLink('qfSub', path.join(quallyFlashPath, version));
    dialog.showMessageBox({ message: `Программа Qually Flash версия ${version} удалена!`, type: 'info', buttons: ['Ок'], title: '' });
});

$('#qfSubLaunch').click(() => {
    let version = $('#qfSelect option:selected').text().split(' ')[0];
    launchProgram(path.join(quallyFlashPath, version, 'QuallyFlash.exe'));
});

$('#acSubInstall').click(async () => {
    $('.coverAll').fadeIn();
    let version = $('#acSelect option:selected').text();
    let program = {
        path : path.join(accountHolderPath, version),
        id : accountHolderId,
        version : version
    }
    await installProgram(program, localVersions);
    for (let i = 1; i < $('#acSelect').children().length; i++) {
        if ($('#acSelect').children()[i].textContent == version) {
            $('#acSelect').children()[i].textContent = version + ' ✔';
        }
    }
    setLink('qfSub', path.join(accountHolderPath, version));
    dialog.showMessageBox({ message: `Программа Account Holder версия ${version} установлена!`, type: 'info', buttons: ['Ок'], title: '' });
    $('.coverAll').fadeOut();
});

$('#acSubDelete').click(() => {
    let version = $('#acSelect option:selected').text().split(' ')[0];
    deleteProgram(path.join(accountHolderPath, version));
    for (let i = 1; i < $('#acSelect').children().length; i++) {
        if ($('#acSelect').children()[i].textContent.split(' ')[0] == version) {
            $('#acSelect').children()[i].textContent = version;
        }
    }
    setLink('acSub', path.join(accountHolderPath, version));
    dialog.showMessageBox({ message: `Программа Account Holder версия ${version} удалена!`, type: 'info', buttons: ['Ок'], title: '' });
});

$('#acSubLaunch').click(() => {
    let version = $('#acSelect option:selected').text().split(' ')[0];
    launchProgram(path.join(accountHolderPath, version, 'AccountHolder.exe'));
});

$('#bqSelect').change(() => {
    let version = $('#bqSelect option:selected').text().split(' ')[0];
    if (version == '...') {
        setSubDisabled('bq');
    } else {
        setLink('bqSub', path.join(botQuallyPath, version));
    }
});

$('#qfSelect').change(() => {
    let version = $('#qfSelect option:selected').text().split(' ')[0];
    if (version == '...') {
        setSubDisabled('qf');
    } else {
        setLink('qfSub', path.join(quallyFlashPath, version));
    }
});

$('#acSelect').change(() => {
    let version = $('#acSelect option:selected').text().split(' ')[0];
    if (version == '...') {
        setSubDisabled('ac');
    } else {
        setLink('acSub', path.join(accountHolderPath, version));
    }
});

function setSubDisabled(selector) {
    $(`#${selector}SubInstall`).addClass('disabled');
    $(`#${selector}SubDelete`).addClass('disabled');
    $(`#${selector}SubLink`).addClass('disabled');
    $(`#${selector}SubLaunch`).addClass('disabled');
}