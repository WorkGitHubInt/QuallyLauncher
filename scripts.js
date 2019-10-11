const { machineIdSync } = require('node-machine-id');
const $ = window.jQuery = require('jquery');
var id = machineIdSync().substring(0, 20);
const electron = require('electron');
const remote = electron.remote;
const Menu = remote.Menu;
var md5 = require('md5');
var sha1 = require('sha1');
var usb = require('usb');

const InputMenu = Menu.buildFromTemplate([{
        label: 'Отменить',
        role: 'undo',
    }, {
        label: 'Повторить',
        role: 'redo',
    }, {
        type: 'separator',
    }, {
        label: 'Вырезать',
        role: 'cut',
    }, {
        label: 'Скопировать',
        role: 'copy',
    }, {
        label: 'Вставить',
        role: 'paste',
    }, {
        type: 'separator',
    }, {
        label: 'Выбрать всё',
        role: 'selectall',
    },
]);

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
            await getRequestScripts(user.pcid);
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
                        await getRequestScripts(user.pcid);
                        return;
                    }
                }
            }
        }
    }
    window.location.assign('index.html');
}

async function getRequestScripts(id) {
    var scripts = await $.ajax({
        type: 'POST',
        url: 'https://botqually.ru/api/managment/scripts',
        data: 'id=' + id,
    });
    scripts.forEach(element => {
        var div = document.createElement('div');
        div.className = 'script text-center';
        var title = document.createElement('p');
        title.style.fontSize = '18px';
        title.style.fontWeight = 'bold';
        var nodeTitle = document.createTextNode(element.title);
        title.appendChild(nodeTitle);
        var version = document.createElement('p');
        version.style.fontSize = '16px';
        var nodeVersion = document.createTextNode(element.version);
        version.appendChild(nodeVersion);
        var content = document.createElement('textarea');
        content.readOnly = true;
        content.style.width = '500px';
        content.style.height = '150px';
        content.style.fontSize = '12px';
        var nodeContent = document.createTextNode(element.content);
        content.appendChild(nodeContent);
        div.appendChild(title);
        div.appendChild(version);
        div.appendChild(content);
        document.getElementById('scripts').appendChild(div);
        $('#scripts').fadeIn();
    });
    $('.coverAll').fadeOut();
}

document.body.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let node = e.target;

    while (node) {
        if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
            InputMenu.popup(remote.getCurrentWindow());
            break;
        }
        node = node.parentNode;
    }
});