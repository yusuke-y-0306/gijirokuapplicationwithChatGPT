const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const path = require('path');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({apiKey: 'overwrite your apikey here',});
const openai = new OpenAIApi(configuration);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    // 要約を記録するための変数
    var temp_summary_str = '';

    socket.on('clientAudio', async (audioChunk) => {

        console.log(`got audiostream event!!!!!!!!!!!!`);

        // 音声ファイルを一時的に保存
        const audioPath = path.join(__dirname, 'temp_audio' + Date.now().toString() + '.wav');
        const header = createWavHeader(audioChunk.length);
        fs.writeFileSync(audioPath, Buffer.concat([header, audioChunk]));

        console.log('File content:', fs.readFileSync(audioPath));

        // Whisper APIを使って音声を文字起こし
        try{
        console.log(`audioifile`);
            const audiofile = fs.createReadStream(audioPath);
        console.log(`performing whisperAPI`);
        var transcription = await openai.createTranscription(
            audiofile,
            'whisper-1'
        );
        console.log(`whisper performed`);
    }catch(error){
        console.log(transcription);
    }
        console.log(`whisper done!!!!!!!!!!!!!!!!!!!!!`);
        console.log(`text : ${transcription.data.text}`);

        // 今までの要約に新たな文字お越しを追加して要約対象とする
        temp_summary_str += transcription.data.text

        const summary = await openai.createCompletion({
            model: 'gpt-3.5-turbo-instruct',
            prompt: `以下のテキストを要約してください:\n\n${temp_summary_str}`,
            max_tokens: 150
        });

        temp_summary_str = summary.data.choices[0].text;

        socket.emit('transcription', { transcription: transcription.data.text, summary: temp_summary_str});
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

function createWavHeader(dataLength) {
    const header = Buffer.alloc(44);
    header.write('RIFF', 0); // ChunkID
    header.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    header.write('WAVE', 8); // Format
    header.write('fmt ', 12); // Subchunk1ID
    header.writeUInt32LE(16, 16); // Subchunk1Size
    header.writeUInt16LE(1, 20); // AudioFormat
    header.writeUInt16LE(1, 22); // NumChannels
    header.writeUInt32LE(44100, 24); // SampleRate
    header.writeUInt32LE(44100 * 2, 28); // ByteRate
    header.writeUInt16LE(2, 32); // BlockAlign
    header.writeUInt16LE(16, 34); // BitsPerSample
    header.write('data', 36); // Subchunk2ID
    header.writeUInt32LE(dataLength, 40); // Subchunk2Size
    return header;
}
