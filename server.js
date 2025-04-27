const express = require('express');
const fetch = require('node-fetch');
const { OpenAI } = require('openai');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1'
});

// 抓取单个西夏文字符释义
async function getCharDefinition(char) {
  const url = 'http://www.ccamc.co/tangut.php?n4694=' + encodeURIComponent(char);
  const resp = await fetch(url);
  const text = await resp.text();
  const regex = /2012版《简明夏汉字典》释义<\/font><\/font><\/b><\/p><p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">([\s\S]*?)<\/font><\/font><code>/;
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

// 翻译接口
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    const defs = [];
    for (const char of text) {
      if (char.trim()) {
        const def = await getCharDefinition(char);
        defs.push(def);
      }
    }
    const joined = defs.join('|');
    const prompt = `根据以下逐字释义（用|隔开），选择最合适含义将其连成通顺句子(尽量少token)：${joined}`;
    const response = await openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V2.5',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096
    });
    const translation = response.choices[0].message.content;
    res.json({ translation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
