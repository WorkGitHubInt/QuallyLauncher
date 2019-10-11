const { machineIdSync } = require('node-machine-id');
const $ = window.jQuery = require('jquery');
const id = machineIdSync().substring(0, 20);
const md5 = require('md5');
const sha1 = require('sha1');
const usb = require('usb');

runOnLoad();

async function runOnLoad() {
    await getRequestUser();
}

async function getRequestUser() {
    let user = await $.ajax({
        url: 'https://botqually.ru/api/users/?id=' + id,
    });
    if (user.hash === md5(`${user.pcid}|${user.subscriptionExpDate}|${user.unlimitedSub.toString().charAt(0).toUpperCase() + user.unlimitedSub.toString().slice(1)}|${user.trial.toString().charAt(0).toUpperCase() + user.trial.toString().slice(1)}|${user.lvl}|${user.active.toString().charAt(0).toUpperCase() + user.active.toString().slice(1)}|helicopter`)) {
        if (user.active) {
            await getRequestMessages(user.pcid);
            return;
        } else {
            var usbList = usb.getDeviceList();
            for (var i = 0; i < usbList.length; i++) {
                try {
                    user = await $.ajax({
                        url: 'https://botqually.ru/api/users/usb?id=' + sha1(`${usbList[i].deviceDescriptor.idProduct}|${usbList[i].deviceDescriptor.idVendor}`),
                    });
                } catch { }
                if (user.hash === md5(`${user.pcid}|${user.subscriptionExpDate}|${user.unlimitedSub.toString().charAt(0).toUpperCase() + user.unlimitedSub.toString().slice(1)}|${user.trial.toString().charAt(0).toUpperCase() + user.trial.toString().slice(1)}|${user.lvl}|${user.active.toString().charAt(0).toUpperCase() + user.active.toString().slice(1)}|helicopter`)) {
                    if (user.active) {
                        await getRequestMessages(user.pcid);
                        return;
                    }
                }
            }
        }
    }
    window.location.assign('index.html');
}

async function getRequestMessages(id) {
    let messages = await $.ajax({
        type: 'GET',
        url: 'https://botqually.ru/api/users/messages?id=' + id,
    });
    messages.forEach(element => {
        var div = document.createElement('div');
        div.className = 'script text-center';
        $(div).css('background-color', 'white');
        var title = document.createElement('p');
        var program;
        if (element.programId == 1) {
            program = 'Bot Qually';
        } else if (element.programId == 1) {
            program = 'Qually Flash';
        } else if (element.programId == 10) {
            program = 'Qually Launcher';
        }
        var programTitle = document.createTextNode(program + " " + element.version);
        title.appendChild(programTitle);

        var type = document.createElement('p');
        var type1;
        if (element.type == 'Error') {
            type1 = 'Ошибка';
        } else {
            type1 = 'Предложение';
        }
        var nodeType = document.createTextNode(type1);
        type.appendChild(nodeType);

        var content = document.createElement('p');
        var nodeContent = document.createTextNode('Сообщение: ' + element.body);
        content.appendChild(nodeContent);

        var status = document.createElement('p');
        var nodeStatus = document.createTextNode('Статус: ' + element.status);
        status.appendChild(nodeStatus);

        div.appendChild(title);
        div.appendChild(type);
        div.appendChild(content);
        div.appendChild(status);
        document.getElementById('messages').appendChild(div);
    });
    $('.coverAll').fadeOut();
}