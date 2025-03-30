const express = require('express');
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const openai = require('openai');

openai.apiKey = 'your_openai_api_key';


const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('audioStream', async (audioChunk) => {
        const transcription = await openai.transcribe({
            model: 'whisper-1',
            file: audioChunk
        });

        const summary = await openai.Completion.create({
            engine: 'text-davinci-003',
            prompt: `以下のテキストを要約してください:\n\n${transcription.text}`,
            max_tokens: 150
        });

        socket.emit('transcription', { transcription: transcription.text, summary: summary.choices.text });
    });
});

io.on('stop', (socket) => {
    console.log('a user disconnected');
    socket.on('audioStream', async (audioChunk) => {
        const transcription = await openai.transcribe({
            model: 'whisper-1',
            file: audioChunk
        });

        const summary = await openai.Completion.create({
            engine: 'text-davinci-003',
            prompt: `以下のテキストを要約してください:\n\n${transcription.text}`,
            max_tokens: 150
        });

        socket.emit('transcription', { transcription: transcription.text, summary: summary.choices.text });
    });
});

module.exports = app;
