import mongoose from 'mongoose';
export declare function model(name: String, conn?: any): any;
export declare function declareModel(names: any): void;
export declare function modelData(models: any, custom?: any): void;
export declare function withSoftDelete(schema: mongoose.Schema): void;
