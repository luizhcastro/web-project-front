
const BASE_URL = 'http://localhost:3000';

export async function fetchData(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Algo deu errado');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        const { showCustomMessage } = await import('./ui.js');
        showCustomMessage('Erro', 'Erro: ' + error.message);
        return null;
    }
}