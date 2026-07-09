import { retrieveRelevantChunks } from './document.service.js';

export const getRagContext = async (prompt: string, userId: string, topK: number = 5) => {
    let contextBlock = '';
    let sourceDocuments: string[] = [];
    try {
        const chunks = await retrieveRelevantChunks(prompt, userId, topK);
        if (chunks.length > 0) {
            const byFile: Record<string, string[]> = {};
            chunks.forEach(c => {
                if (!byFile[c.filename]) byFile[c.filename] = [];
                byFile[c.filename].push(c.text);
            });
            sourceDocuments = Object.keys(byFile);
            contextBlock = Object.entries(byFile).map(([f, texts]) =>
                `📄 Source: "${f}"\n${texts.join('\n')}`
            ).join('\n\n');
        }
    } catch (e) {
        console.error('RAG contextual reading failed:', e);
    }
    return { contextBlock, sourceDocuments };
};
