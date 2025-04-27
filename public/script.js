document.getElementById('translateBtn').addEventListener('click', async () => {
  const text = document.getElementById('input').value.trim();
  if (!text) return;
  document.getElementById('output').value = '翻译中...';
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    document.getElementById('output').value = data.translation;
  } catch (e) {
    document.getElementById('output').value = '请求出错，请重试';
  }
});
