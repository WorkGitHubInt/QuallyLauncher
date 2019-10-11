const { machineIdSync } = require('node-machine-id');
const $ = window.jQuery = require('jquery');
const fs = require('fs');
var id = machineIdSync().substring(0, 20);
const remote = require('electron').remote;
const path = require ('path');
var app = remote.app;
const dialog = remote.dialog;

function sendMessage() {
    var userPath = app.getPath('userData');
    var text = fs.readFileSync(path.join(userPath, 'log.txt'));
    $.ajax({
        type: 'POST',
        url: 'https://botqually.ru/api/managment/message',
        data: 'id=' + id + '&programId=10&type=Error&body=' + $('#body').val() + '&version=' + app.getVersion() + '&contacts=' + $("#contacts").val() + '&logmain=' + text + '&logacc=&logerror=&status=Ожидает%20просмотра',
        success: function () {
            dialog.showMessageBox({ message: 'Сообщение отправлено!', type: 'info', buttons: ['Ок'], title: '' }); 
            window.location.assign('index.html');
        }
    });
}

$('#send').click(()=>{
    sendMessage();
});

