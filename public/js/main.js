const socket = io();
var mediaRecorder = '';

function startRecording(){
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
            socket.emit('clientAudio', event.data);
        };
        mediaRecorder.start(5000); // 5000msごとにデータを送信
        console.log(`mediarecorder started`);
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });
};

function stopRecording(){
    //ブラウザ画面でStopボタンが押されたときのアクション。
    //マイクへの接続を切り、サーバ側にStopの連絡をする。
    mediaRecorder.stop();
    console.log(`mediarecorder stopped`);
}


//サーバとのWebsocket接続にて、サーバからtranscriptionとしてデータが来たら
//データに入っている文字起こしとそのサマリをログに出力する
socket.on('transcription', (data) => {
        // HTML要素を取得
        const transcriptionElement = document.getElementById('transcription');
        const summaryElement = document.getElementById('summary');
    
        // 受信したデータをHTML要素に挿入
        transcriptionElement.textContent = data.transcription;
        summaryElement.textContent = data.summary;
});
