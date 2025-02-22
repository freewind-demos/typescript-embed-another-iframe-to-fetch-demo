/**
 * @typedef {Object} ProxyOptions
 * @property {string} proxyPage - 代理页面的URL
 * @property {boolean} [initializeImmediately=false] - 是否在创建时立即初始化iframe
 * @property {Partial<CSSStyleDeclaration>} [iframeStyle] - iframe的样式（用于调试，通常不需要修改）
 * @property {(error: Error) => void} [onError] - 自定义错误处理函数
 */

// 创建一个代理对象，用于处理所有API调用
export class ApiProxy {
    #iframe = null;
    #originalFetch = null;
    #options;

    // 默认的iframe样式，优化性能和隐藏性
    static #defaultIframeStyle = {
        display: 'none',
        width: '0',
        height: '0',
        border: 'none',
        position: 'absolute',
        pointerEvents: 'none',
        opacity: '0'
    };

    /**
     * @param {ProxyOptions} options
     */
    constructor(options) {
        // 设置默认选项
        this.#options = {
            proxyPage: options.proxyPage,
            initializeImmediately: options.initializeImmediately ?? false,
            iframeStyle: {
                ...ApiProxy.#defaultIframeStyle,
                ...(options.iframeStyle || {})
            },
            onError: options.onError ?? console.error
        };

        if (this.#options.initializeImmediately) {
            this.#ensureIframe().catch(this.#options.onError);
        }
    }

    async #ensureIframe() {
        if (!this.#iframe) {
            // 创建iframe
            this.#iframe = document.createElement('iframe');

            // 应用样式
            Object.assign(this.#iframe.style, this.#options.iframeStyle);

            this.#iframe.src = this.#options.proxyPage;
            document.body.appendChild(this.#iframe);

            // 等待iframe加载完成
            await new Promise((resolve, reject) => {
                if (!this.#iframe) return reject(new Error('iframe was removed'));

                this.#iframe.onload = resolve;
                this.#iframe.onerror = () => reject(new Error('Failed to load proxy page'));

                // 设置超时
                const timeout = setTimeout(() => {
                    reject(new Error('Proxy page load timeout'));
                }, 10000); // 10秒超时

                // 清理超时
                this.#iframe.onload = () => {
                    clearTimeout(timeout);
                    resolve(undefined);
                };
            });

            // 获取iframe的window对象
            const iframeWindow = this.#iframe.contentWindow;
            if (!iframeWindow) {
                throw new Error('Failed to get iframe window');
            }

            // 保存原始fetch
            this.#originalFetch = iframeWindow.fetch.bind(iframeWindow);

            // 替换iframe中的fetch函数
            const self = this;
            iframeWindow.fetch = async function (url, options = {}) {
                if (!self.#originalFetch) {
                    throw new Error('Original fetch is not available');
                }

                const response = await self.#originalFetch(url, options);

                // 创建一个新的Response对象，因为原始的response只能使用一次
                const clonedResponse = response.clone();

                // 读取并保存响应数据
                const data = await response.json();

                return {
                    ok: clonedResponse.ok,
                    status: clonedResponse.status,
                    headers: clonedResponse.headers,
                    json: () => Promise.resolve(data)
                };
            };
        }
    }

    /**
     * 发送fetch请求
     * @param {string} path - 请求路径
     * @param {RequestInit} [options={}] - fetch选项
     * @returns {Promise<Response>}
     */
    async fetch(path, options = {}) {
        await this.#ensureIframe();

        if (!this.#iframe?.contentWindow) {
            throw new Error('Proxy iframe is not available');
        }

        // 直接在iframe的上下文中执行fetch
        try {
            const response = await this.#iframe.contentWindow.fetch(path, options);
            return response;
        } catch (error) {
            const enhancedError = new Error(
                `Proxy fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            this.#options.onError(enhancedError);
            throw enhancedError;
        }
    }

    /**
     * 销毁代理实例，清理资源
     */
    destroy() {
        if (this.#iframe) {
            document.body.removeChild(this.#iframe);
            this.#iframe = null;
            this.#originalFetch = null;
        }
    }
} 