import { ApiProxy } from './api-proxy.js';

// 创建API代理实例
const api = new ApiProxy({
    proxyPage: '/inner.html',
    initializeImmediately: true, // 预加载iframe
    iframeStyle: {
        display: 'none',
        width: '0',
        height: '0',
        border: 'none'
    },
    onError: (error) => {
        console.error('API Proxy Error:', error);
    }
});

// 在页面卸载时清理资源
window.addEventListener('unload', () => {
    api.destroy();
});

export async function directFetch() {
    const resultDiv = document.getElementById('result');
    try {
        const response = await fetch('/api/fetchData');
        const data = await response.json();
        resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

export async function proxyFetch() {
    const resultDiv = document.getElementById('result');
    try {
        const response = await api.fetch('/api/fetchData');
        const data = await response.json();
        resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error}</div>`;
    }
}

export async function complexProxyFetch() {
    const resultDiv = document.getElementById('result');
    try {
        const response = await api.fetch('/api/complexData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Custom-Header': 'Hello from proxy!'
            },
            body: JSON.stringify({
                name: 'John Doe',
                age: 25
            })
        });

        const data = await response.json();
        resultDiv.innerHTML = `
Status: ${response.status}
Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}
Data: ${JSON.stringify(data, null, 2)}`;
    } catch (error) {
        resultDiv.innerHTML = `<div class="error">Error: ${error}</div>`;
    }
} 