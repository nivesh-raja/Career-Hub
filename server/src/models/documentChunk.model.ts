import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentChunk extends Document {
    documentId: mongoose.Types.ObjectId;
    filename: string;
    chunkIndex: number;
    text: string;
    embedding: number[];
    uploader: mongoose.Types.ObjectId;
    role: string;
    createdAt: Date;
}

const DocumentChunkSchema: Schema = new Schema(
    {
        documentId: { type: Schema.Types.ObjectId, ref: 'AIDocument', required: true, index: true },
        filename: { type: String, required: true },
        chunkIndex: { type: Number, required: true },
        text: { type: String, required: true },
        embedding: { type: [Number], default: [] },
        uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        role: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
