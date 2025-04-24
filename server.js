// server.js
const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());

// 代理西夏字释义查询
app.post('/api/translate', async (req, res) => {
    try {
        const chars = [...req.body.text];
        let definitions = [];
        
        // 查询每个字符释义
        for (const char of chars) {
            const encoded = encodeURIComponent(char);
            const { data } = await axios.get(
                `http://www.ccamc.co/tangut.php?n4694=${encoded}`,
                { headers: { 'User-Agent': 'Mozilla/5.0' } }
            );
            
            const $ = cheerio.load(data);
            const definition = $('div.tangut p').eq(1).text()
                .replace(/\u00a0/g, ' ')
                .split('<')[0];
            
            definitions.push(definition || '未知');
            await new Promise(r => setTimeout(r, 500)); // 请求间隔
        }

        // 调用DeepSeek翻译
        const translation = await translateWithAI(definitions.join('|'));
        res.json({ translation });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function translateWithAI(text) {
    const prompt = `根据以下逐字释义（用|隔开），选择最合适含义将其连成通顺句子：${text}`;
    
    const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions', // 假设DeepSeek接口格式
        {
            model: "deepseek-chat",
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.1
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    return response.data.choices[0].message.content.trim();
}

app.listen(3000, () => console.log('Server running'));
